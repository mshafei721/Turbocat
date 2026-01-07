/**
 * Supabase Client Configuration
 *
 * This module provides a singleton instance of the Supabase client
 * for authentication and database operations.
 *
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous key (public)
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (server-side only)
 *
 * Usage:
 * ```typescript
 * import { supabase, supabaseAdmin } from '@/lib/supabase';
 *
 * // For public operations (respects RLS)
 * const { data, error } = await supabase.auth.signInWithPassword({...});
 *
 * // For admin operations (bypasses RLS)
 * const { data, error } = await supabaseAdmin.from('users').select('*');
 * ```
 *
 * @module lib/supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Type declaration for global supabase instances
declare global {
  var supabaseClient: SupabaseClient | undefined;

  var supabaseAdminClient: SupabaseClient | undefined;

  var supabaseInitError: Error | undefined;
}

/**
 * Supabase configuration interface
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Supabase health status interface
 */
export interface SupabaseHealthStatus {
  configured: boolean;
  connected: boolean;
  error?: string;
  responseTimeMs?: number;
}

/**
 * Get Supabase configuration from environment variables
 */
const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
};

/**
 * Validate Supabase URL format
 */
const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Supabase URLs typically follow the pattern: https://[project-ref].supabase.co
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase');
  } catch {
    return false;
  }
};

/**
 * Create the public Supabase client
 * This client respects Row Level Security (RLS) policies
 */
const createSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();

  if (!config) {
    const error = new Error(
      'Supabase configuration missing. Required: SUPABASE_URL and SUPABASE_ANON_KEY',
    );
    globalThis.supabaseInitError = error;
    logger.warn('[Supabase] Client not initialized - missing configuration');
    return null;
  }

  if (!isValidSupabaseUrl(config.url)) {
    const error = new Error(`Invalid Supabase URL format: ${config.url}`);
    globalThis.supabaseInitError = error;
    logger.warn('[Supabase] Client not initialized - invalid URL format');
    return null;
  }

  try {
    const client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side: don't persist sessions
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-application-name': 'turbocat-backend',
        },
      },
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info('[Supabase] Public client initialized');
    }

    return client;
  } catch (error) {
    globalThis.supabaseInitError = error instanceof Error ? error : new Error(String(error));
    logger.error('[Supabase] Failed to initialize client:', {
      error: globalThis.supabaseInitError.message,
    });
    return null;
  }
};

/**
 * Create the admin Supabase client
 * This client bypasses Row Level Security (RLS) - use with caution!
 */
const createSupabaseAdminClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();

  if (!config) {
    logger.warn('[Supabase] Admin client not initialized - missing configuration');
    return null;
  }

  if (!config.serviceRoleKey) {
    logger.warn('[Supabase] Admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  if (!isValidSupabaseUrl(config.url)) {
    logger.warn('[Supabase] Admin client not initialized - invalid URL format');
    return null;
  }

  try {
    const client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-application-name': 'turbocat-backend-admin',
        },
      },
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info('[Supabase] Admin client initialized');
    }

    return client;
  } catch (error) {
    logger.error('[Supabase] Failed to initialize admin client:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * Public Supabase client instance (singleton)
 * Respects Row Level Security policies
 *
 * Use for:
 * - User authentication
 * - Client-facing operations
 * - Operations that should respect RLS
 */
export const supabase: SupabaseClient | null = globalThis.supabaseClient ?? createSupabaseClient();

// Store in global for development hot-reload
if (process.env.NODE_ENV !== 'production' && supabase) {
  globalThis.supabaseClient = supabase;
}

/**
 * Admin Supabase client instance (singleton)
 * Bypasses Row Level Security - use with caution!
 *
 * Use for:
 * - Server-side admin operations
 * - Background jobs
 * - Operations that need full database access
 */
export const supabaseAdmin: SupabaseClient | null =
  globalThis.supabaseAdminClient ?? createSupabaseAdminClient();

// Store in global for development hot-reload
if (process.env.NODE_ENV !== 'production' && supabaseAdmin) {
  globalThis.supabaseAdminClient = supabaseAdmin;
}

/**
 * Check if Supabase client is available
 */
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

/**
 * Check if Supabase admin client is available
 */
export const isSupabaseAdminAvailable = (): boolean => {
  return supabaseAdmin !== null;
};

/**
 * Get Supabase initialization error if any
 */
export const getSupabaseInitError = (): Error | undefined => {
  return globalThis.supabaseInitError;
};

/**
 * Check Supabase connection health
 *
 * @returns Health status including connection state and response time
 */
export const checkSupabaseHealth = async (): Promise<SupabaseHealthStatus> => {
  const startTime = Date.now();

  if (!supabase) {
    const initError = getSupabaseInitError();
    return {
      configured: false,
      connected: false,
      error: initError?.message || 'Supabase client not initialized',
    };
  }

  try {
    // Perform a simple auth check to verify connectivity
    // This doesn't require authentication, just checks the connection
    const { error } = await supabase.auth.getSession();

    const responseTimeMs = Date.now() - startTime;

    if (error) {
      // Session error is expected when not authenticated
      // But connection errors would also show here
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          configured: true,
          connected: false,
          error: error.message,
          responseTimeMs,
        };
      }
    }

    return {
      configured: true,
      connected: true,
      responseTimeMs,
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    };
  }
};

/**
 * Get Supabase configuration info (sanitized, no secrets)
 */
export const getSupabaseInfo = (): {
  configured: boolean;
  hasAdminClient: boolean;
  projectUrl?: string;
} => {
  const config = getSupabaseConfig();

  return {
    configured: config !== null,
    hasAdminClient: isSupabaseAdminAvailable(),
    projectUrl: config?.url,
  };
};

/**
 * Verify a Supabase JWT token
 * This validates tokens issued by Supabase Auth
 *
 * @param token - The JWT token to verify
 * @returns The user data if valid, null otherwise
 */
export const verifySupabaseToken = async (
  token: string,
): Promise<{ userId: string; email?: string; role?: string } | null> => {
  if (!supabase) {
    logger.warn('[Supabase] Cannot verify token - client not initialized');
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.debug('[Supabase] Token verification failed:', {
        error: error?.message,
      });
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    logger.error('[Supabase] Token verification error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export default supabase;
