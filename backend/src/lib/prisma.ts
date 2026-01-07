/**
 * Prisma Client Singleton with Connection Pooling
 *
 * This module provides a singleton instance of the Prisma Client to prevent
 * multiple instances from being created during development (which can exhaust
 * database connections) and ensures optimal connection pooling in production.
 *
 * Connection Pooling Configuration:
 * - Pool size is configured via DATABASE_URL query parameters
 * - Default pool size: 2 + (number of physical CPUs * 2)
 * - Recommended for Supabase: connection_limit=10 for free tier
 *
 * Environment Variables for Pool Configuration (via DATABASE_URL):
 * - connection_limit: Maximum connections in pool (default: based on CPU cores)
 * - pool_timeout: Time to wait for connection in seconds (default: 10)
 * - connect_timeout: Time to establish initial connection in seconds (default: 5)
 * - statement_cache_size: Prepared statement cache size (default: 100)
 *
 * For Supabase with pgBouncer (transaction mode on port 6543):
 * - Add ?pgbouncer=true&connection_limit=10 to DATABASE_URL
 * - Use DIRECT_URL (port 5432) for migrations
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/prisma';
 *
 * const users = await prisma.user.findMany();
 * ```
 *
 * Note: Prisma 7+ uses prisma.config.ts for datasource configuration.
 * The DATABASE_URL is configured there, not in the schema file.
 *
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Type declaration for global prisma instance (prevents TypeScript errors)
// Using var is required for globalThis declarations in TypeScript
declare global {
  var prisma: PrismaClient | undefined;

  var prismaInitError: Error | undefined;

  var prismaPoolMetrics: PoolMetrics | undefined;
}

/**
 * Connection pool metrics interface
 */
export interface PoolMetrics {
  /** Total queries executed since startup */
  totalQueries: number;
  /** Successful queries */
  successfulQueries: number;
  /** Failed queries */
  failedQueries: number;
  /** Slow queries (>1000ms) */
  slowQueries: number;
  /** Average query time in milliseconds */
  avgQueryTimeMs: number;
  /** Last updated timestamp */
  lastUpdated: Date;
  /** Connection pool configuration (parsed from URL) */
  poolConfig: PoolConfig;
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  /** Maximum number of connections in the pool */
  connectionLimit: number;
  /** Timeout waiting for a connection from pool (seconds) */
  poolTimeout: number;
  /** Timeout for establishing a connection (seconds) */
  connectTimeout: number;
  /** Whether pgBouncer mode is enabled */
  pgBouncerEnabled: boolean;
}

/**
 * Prisma Client log levels
 */
type LogLevel = 'query' | 'info' | 'warn' | 'error';

/**
 * Threshold for slow query detection (milliseconds)
 */
const SLOW_QUERY_THRESHOLD_MS = 1000;

/**
 * Default connection pool configuration
 * These values are used when not specified in DATABASE_URL
 */
const DEFAULT_POOL_CONFIG: PoolConfig = {
  connectionLimit: 10, // Reasonable default for most applications
  poolTimeout: 10, // 10 seconds to wait for connection
  connectTimeout: 5, // 5 seconds to establish connection
  pgBouncerEnabled: false,
};

/**
 * Parse connection pool configuration from DATABASE_URL
 * Extracts query parameters for connection pooling
 */
const parsePoolConfig = (): PoolConfig => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return DEFAULT_POOL_CONFIG;
  }

  try {
    const url = new URL(databaseUrl);
    const params = url.searchParams;

    return {
      connectionLimit: parseInt(
        params.get('connection_limit') || String(DEFAULT_POOL_CONFIG.connectionLimit),
        10,
      ),
      poolTimeout: parseInt(
        params.get('pool_timeout') || String(DEFAULT_POOL_CONFIG.poolTimeout),
        10,
      ),
      connectTimeout: parseInt(
        params.get('connect_timeout') || String(DEFAULT_POOL_CONFIG.connectTimeout),
        10,
      ),
      pgBouncerEnabled: params.get('pgbouncer') === 'true',
    };
  } catch {
    // If URL parsing fails, return defaults
    return DEFAULT_POOL_CONFIG;
  }
};

/**
 * Initialize pool metrics
 */
const initializePoolMetrics = (): PoolMetrics => {
  return {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    slowQueries: 0,
    avgQueryTimeMs: 0,
    lastUpdated: new Date(),
    poolConfig: parsePoolConfig(),
  };
};

/**
 * Update pool metrics after a query
 */
const updatePoolMetrics = (durationMs: number, success: boolean): void => {
  if (!globalThis.prismaPoolMetrics) {
    globalThis.prismaPoolMetrics = initializePoolMetrics();
  }

  const metrics = globalThis.prismaPoolMetrics;
  metrics.totalQueries += 1;

  if (success) {
    metrics.successfulQueries += 1;
  } else {
    metrics.failedQueries += 1;
  }

  if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
    metrics.slowQueries += 1;
  }

  // Calculate rolling average
  const prevTotal = metrics.totalQueries - 1;
  metrics.avgQueryTimeMs =
    prevTotal > 0
      ? (metrics.avgQueryTimeMs * prevTotal + durationMs) / metrics.totalQueries
      : durationMs;

  metrics.lastUpdated = new Date();
};

/**
 * Get log configuration based on environment
 * In development: log queries, info, warnings, and errors
 * In production: only log warnings and errors
 */
const getLogLevels = (): LogLevel[] => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return ['query', 'info', 'warn', 'error'];
  }

  return ['warn', 'error'];
};

/**
 * Create a new Prisma Client instance with optimized settings
 *
 * Configuration notes:
 * - log: Array of log levels to enable
 * - Connection pooling is configured via DATABASE_URL query parameters
 *
 * Recommended DATABASE_URL format for Supabase:
 * postgresql://user:password@host:6543/db?pgbouncer=true&connection_limit=10&pool_timeout=10
 *
 * In Prisma 7+, the datasource URL is configured via prisma.config.ts
 * and loaded automatically by the Prisma Client.
 *
 * Note: If the database is not configured, this will return null
 * and the error will be stored in globalThis.prismaInitError
 */
const createPrismaClient = (): PrismaClient | null => {
  try {
    // Get database URL from environment
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create PostgreSQL connection pool
    const pool = new pg.Pool({ connectionString });

    // Create Prisma adapter for pg
    const adapter = new PrismaPg(pool);

    // Create Prisma client with adapter (required for Prisma 7+ client engine)
    const client = new PrismaClient({
      log: getLogLevels(),
      adapter,
    });

    // Initialize pool metrics
    globalThis.prismaPoolMetrics = initializePoolMetrics();

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      const poolConfig = globalThis.prismaPoolMetrics.poolConfig;
      console.log('[Prisma] Client initialized with pg adapter');
      console.log('[Prisma] Log levels:', getLogLevels().join(', '));
      console.log('[Prisma] Pool config:', JSON.stringify(poolConfig, null, 2));
    }

    return client;
  } catch (error) {
    // Store the error for later inspection
    globalThis.prismaInitError = error instanceof Error ? error : new Error(String(error));
    console.warn('[Prisma] Failed to initialize client:', globalThis.prismaInitError.message);
    console.warn('[Prisma] Database operations will not be available until properly configured.');
    return null;
  }
};

/**
 * Singleton Prisma Client instance
 *
 * In development: Uses globalThis to prevent multiple instances during hot-reload
 * In production: Creates a single instance per application lifecycle
 *
 * Note: If database is not configured, this will be null
 *
 * Connection pooling notes:
 * - Default pool size: 2 + (number of physical CPUs * 2)
 * - Can be configured via DATABASE_URL query parameters:
 *   - connection_limit: Maximum connections in pool
 *   - pool_timeout: Time to wait for connection (seconds)
 *   - connect_timeout: Time to wait for initial connection (seconds)
 *
 * For Supabase with pgBouncer (port 6543):
 * - Add ?pgbouncer=true to DATABASE_URL
 * - Use DIRECT_URL (port 5432) for migrations (configured in prisma.config.ts)
 */
export const prisma: PrismaClient | null = globalThis.prisma ?? createPrismaClient();

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production' && prisma) {
  globalThis.prisma = prisma;
}

/**
 * Check if Prisma client is available
 */
export const isPrismaAvailable = (): boolean => {
  return prisma !== null;
};

/**
 * Get the Prisma initialization error if any
 */
export const getPrismaInitError = (): Error | undefined => {
  return globalThis.prismaInitError;
};

/**
 * Graceful shutdown handler
 * Properly closes database connections when the application shuts down
 *
 * Usage:
 * ```typescript
 * process.on('beforeExit', async () => {
 *   await disconnectPrisma();
 * });
 * ```
 */
export const disconnectPrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed');
  }
};

/**
 * Database connection status
 */
export interface DatabaseHealthStatus {
  healthy: boolean;
  responseTimeMs: number;
  error?: string;
  configured: boolean;
}

/**
 * Database health check
 * Use this to verify database connectivity in health check endpoints
 *
 * @returns Promise<DatabaseHealthStatus> - Health status with response time
 *
 * Usage:
 * ```typescript
 * const health = await checkDatabaseHealth();
 * if (!health.healthy) {
 *   console.error('Database error:', health.error);
 * }
 * ```
 */
export const checkDatabaseHealth = async (): Promise<DatabaseHealthStatus> => {
  const startTime = Date.now();

  // Check if Prisma is available
  if (!prisma) {
    const initError = getPrismaInitError();
    return {
      healthy: false,
      responseTimeMs: Date.now() - startTime,
      error: initError?.message || 'Database client not initialized',
      configured: false,
    };
  }

  try {
    // Execute a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    // Update pool metrics
    updatePoolMetrics(duration, true);

    return {
      healthy: true,
      responseTimeMs: duration,
      configured: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Update pool metrics for failed query
    updatePoolMetrics(duration, false);

    return {
      healthy: false,
      responseTimeMs: duration,
      error: error instanceof Error ? error.message : 'Unknown database error',
      configured: true,
    };
  }
};

/**
 * Get database connection information (sanitized for logging)
 * Does NOT include sensitive credentials
 */
export const getDatabaseInfo = (): {
  provider: string;
  configured: boolean;
  available: boolean;
} => {
  const hasUrl = Boolean(process.env.DATABASE_URL);

  return {
    provider: 'postgresql',
    configured: hasUrl,
    available: isPrismaAvailable(),
  };
};

/**
 * Get current connection pool metrics
 *
 * @returns Pool metrics including query counts, performance, and configuration
 *
 * Usage:
 * ```typescript
 * const metrics = getPoolMetrics();
 * console.log(`Total queries: ${metrics.totalQueries}`);
 * console.log(`Success rate: ${(metrics.successfulQueries / metrics.totalQueries * 100).toFixed(2)}%`);
 * ```
 */
export const getPoolMetrics = (): PoolMetrics => {
  if (!globalThis.prismaPoolMetrics) {
    globalThis.prismaPoolMetrics = initializePoolMetrics();
  }
  return { ...globalThis.prismaPoolMetrics };
};

/**
 * Get connection pool configuration
 *
 * @returns Current pool configuration (parsed from DATABASE_URL)
 */
export const getPoolConfig = (): PoolConfig => {
  return getPoolMetrics().poolConfig;
};

/**
 * Reset pool metrics (useful for testing or metric rotation)
 */
export const resetPoolMetrics = (): void => {
  globalThis.prismaPoolMetrics = initializePoolMetrics();
};

/**
 * Record a query execution for metrics tracking
 * Use this when executing custom queries outside the standard ORM methods
 *
 * @param durationMs - Query duration in milliseconds
 * @param success - Whether the query was successful
 *
 * Usage:
 * ```typescript
 * const start = Date.now();
 * try {
 *   await prisma.$executeRaw`...`;
 *   recordQueryMetrics(Date.now() - start, true);
 * } catch (error) {
 *   recordQueryMetrics(Date.now() - start, false);
 *   throw error;
 * }
 * ```
 */
export const recordQueryMetrics = (durationMs: number, success: boolean): void => {
  updatePoolMetrics(durationMs, success);
};

/**
 * Get a summary of pool health
 *
 * @returns Health summary including success rate and performance indicators
 */
export const getPoolHealthSummary = (): {
  successRate: number;
  avgQueryTimeMs: number;
  slowQueryRate: number;
  totalQueries: number;
  isHealthy: boolean;
} => {
  const metrics = getPoolMetrics();
  const successRate =
    metrics.totalQueries > 0 ? (metrics.successfulQueries / metrics.totalQueries) * 100 : 100;
  const slowQueryRate =
    metrics.totalQueries > 0 ? (metrics.slowQueries / metrics.totalQueries) * 100 : 0;

  return {
    successRate,
    avgQueryTimeMs: Math.round(metrics.avgQueryTimeMs),
    slowQueryRate,
    totalQueries: metrics.totalQueries,
    // Consider healthy if success rate > 95% and slow query rate < 10%
    isHealthy: successRate > 95 && slowQueryRate < 10,
  };
};

export default prisma;
