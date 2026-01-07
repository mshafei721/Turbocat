/**
 * Redis Client Configuration
 *
 * This module provides a singleton Redis client instance for session management,
 * caching, and job queues. It supports both local Redis and cloud providers
 * like Upstash Redis.
 *
 * Environment Variables:
 * - REDIS_URL: Redis connection URL (default: redis://localhost:6379)
 *   - Local: redis://localhost:6379
 *   - Upstash: rediss://default:password@endpoint:6379
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection health monitoring
 * - TLS support for secure connections (rediss://)
 * - Graceful shutdown handling
 *
 * @module lib/redis
 */

import Redis, { RedisOptions } from 'ioredis';
import { ConnectionOptions } from 'bullmq';
import { logger } from './logger';

// Type declaration for global redis instance
declare global {
  var redisClient: Redis | undefined;

  var redisInitError: Error | undefined;
}

/**
 * Redis connection status
 */
export type RedisStatus =
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'reconnecting'
  | 'error'
  | 'end'
  | 'close';

/**
 * Redis health status interface
 */
export interface RedisHealthStatus {
  configured: boolean;
  connected: boolean;
  status: RedisStatus | 'not_initialized';
  error?: string;
  responseTimeMs?: number;
  info?: {
    version?: string;
    mode?: string;
    connectedClients?: number;
    usedMemory?: string;
  };
}

/**
 * Default Redis configuration
 */
const DEFAULT_REDIS_URL = 'redis://localhost:6379';

/**
 * Maximum retry attempts
 */
const MAX_RETRY_ATTEMPTS = 10;

/**
 * Get Redis URL from environment
 */
const getRedisUrl = (): string => {
  return process.env.REDIS_URL || DEFAULT_REDIS_URL;
};

/**
 * Check if URL is for Upstash or other TLS-required services
 */
const isTlsConnection = (url: string): boolean => {
  return url.startsWith('rediss://');
};

/**
 * Parse Redis URL and create connection options
 */
const parseRedisOptions = (url: string): RedisOptions => {
  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number): number | null => {
      if (times > MAX_RETRY_ATTEMPTS) {
        logger.error('[Redis] Max retry attempts reached, giving up');
        return null;
      }
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      const delay = Math.min(times * 100, 3000);
      logger.info(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    reconnectOnError: (err: Error): boolean => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    enableReadyCheck: true,
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
    lazyConnect: true, // Don't connect immediately
  };

  // For TLS connections (Upstash, etc.)
  if (isTlsConnection(url)) {
    options.tls = {
      rejectUnauthorized: false, // Required for some cloud providers
    };
  }

  return options;
};

/**
 * Create Redis client with connection handling
 */
const createRedisClient = (): Redis | null => {
  const url = getRedisUrl();

  if (!url) {
    const error = new Error('Redis URL not configured');
    globalThis.redisInitError = error;
    logger.warn('[Redis] Client not initialized - REDIS_URL not set');
    return null;
  }

  try {
    const options = parseRedisOptions(url);
    const client = new Redis(url, options);

    // Connection event handlers
    client.on('connect', () => {
      logger.info('[Redis] Connecting...');
    });

    client.on('ready', () => {
      logger.info('[Redis] Connection ready');
    });

    client.on('error', (error: Error) => {
      logger.error('[Redis] Connection error:', { error: error.message });
    });

    client.on('close', () => {
      logger.info('[Redis] Connection closed');
    });

    client.on('reconnecting', () => {
      logger.info('[Redis] Reconnecting...');
    });

    client.on('end', () => {
      logger.info('[Redis] Connection ended');
    });

    // Clear any previous error
    globalThis.redisInitError = undefined;

    if (process.env.NODE_ENV === 'development') {
      logger.info('[Redis] Client created (lazy connect enabled)');
    }

    return client;
  } catch (error) {
    globalThis.redisInitError = error instanceof Error ? error : new Error(String(error));
    logger.error('[Redis] Failed to create client:', {
      error: globalThis.redisInitError.message,
    });
    return null;
  }
};

/**
 * Redis client singleton instance
 *
 * Usage:
 * ```typescript
 * import { redis } from '@/lib/redis';
 *
 * // Set a value
 * await redis.set('key', 'value', 'EX', 3600);
 *
 * // Get a value
 * const value = await redis.get('key');
 * ```
 */
export const redis: Redis | null = globalThis.redisClient ?? createRedisClient();

// Store in global for development hot-reload
if (process.env.NODE_ENV !== 'production' && redis) {
  globalThis.redisClient = redis;
}

/**
 * Check if Redis client is available
 */
export const isRedisAvailable = (): boolean => {
  return redis !== null;
};

/**
 * Get Redis initialization error if any
 */
export const getRedisInitError = (): Error | undefined => {
  return globalThis.redisInitError;
};

/**
 * Get current Redis connection status
 */
export const getRedisStatus = (): RedisStatus | 'not_initialized' => {
  if (!redis) {
    return 'not_initialized';
  }
  return redis.status as RedisStatus;
};

/**
 * Connect to Redis (if using lazy connect)
 */
export const connectRedis = async (): Promise<boolean> => {
  if (!redis) {
    logger.warn('[Redis] Cannot connect - client not initialized');
    return false;
  }

  try {
    await redis.connect();
    return true;
  } catch (error) {
    // Already connected is not an error
    if (error instanceof Error && error.message.includes('Already')) {
      return true;
    }
    logger.error('[Redis] Failed to connect:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Disconnect from Redis gracefully
 */
export const disconnectRedis = async (): Promise<void> => {
  if (!redis) {
    return;
  }

  try {
    await redis.quit();
    logger.info('[Redis] Disconnected gracefully');
  } catch (error) {
    logger.error('[Redis] Error during disconnect:', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Force disconnect if quit fails
    redis.disconnect();
  }
};

/**
 * Check Redis connection health
 *
 * @returns Health status including connection state and optional info
 */
export const checkRedisHealth = async (): Promise<RedisHealthStatus> => {
  const startTime = Date.now();

  if (!redis) {
    const initError = getRedisInitError();
    return {
      configured: false,
      connected: false,
      status: 'not_initialized',
      error: initError?.message || 'Redis client not initialized',
    };
  }

  const status = getRedisStatus();

  // If not ready, try to connect
  if (status !== 'ready') {
    try {
      await connectRedis();
    } catch {
      // Connection will be retried
    }
  }

  try {
    // Ping to verify connection
    const result = await redis.ping();
    const responseTimeMs = Date.now() - startTime;

    if (result !== 'PONG') {
      return {
        configured: true,
        connected: false,
        status: getRedisStatus(),
        error: 'Unexpected ping response',
        responseTimeMs,
      };
    }

    // Try to get some server info
    let info: RedisHealthStatus['info'];
    try {
      const infoResult = await redis.info('server');
      const lines = infoResult.split('\n');
      const version = lines
        .find((l) => l.startsWith('redis_version:'))
        ?.split(':')[1]
        ?.trim();
      const mode = lines
        .find((l) => l.startsWith('redis_mode:'))
        ?.split(':')[1]
        ?.trim();

      const clientsInfo = await redis.info('clients');
      const clientsLines = clientsInfo.split('\n');
      const connectedClients = parseInt(
        clientsLines
          .find((l) => l.startsWith('connected_clients:'))
          ?.split(':')[1]
          ?.trim() || '0',
        10,
      );

      const memoryInfo = await redis.info('memory');
      const memoryLines = memoryInfo.split('\n');
      const usedMemory = memoryLines
        .find((l) => l.startsWith('used_memory_human:'))
        ?.split(':')[1]
        ?.trim();

      info = {
        version,
        mode,
        connectedClients,
        usedMemory,
      };
    } catch {
      // Info retrieval is optional
    }

    return {
      configured: true,
      connected: true,
      status: getRedisStatus(),
      responseTimeMs: Date.now() - startTime,
      info,
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      status: getRedisStatus(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    };
  }
};

/**
 * Get Redis connection info (sanitized, no credentials)
 */
export const getRedisInfo = (): {
  configured: boolean;
  available: boolean;
  status: string;
  isTls: boolean;
} => {
  const url = getRedisUrl();

  return {
    configured: Boolean(url),
    available: isRedisAvailable(),
    status: getRedisStatus(),
    isTls: isTlsConnection(url),
  };
};

/**
 * Utility: Set a key with optional expiration
 *
 * @param key - Redis key
 * @param value - Value to store (will be JSON stringified if object)
 * @param expirySeconds - Optional expiry in seconds
 */
export const setWithExpiry = async (
  key: string,
  value: unknown,
  expirySeconds?: number,
): Promise<boolean> => {
  if (!redis) {
    logger.warn('[Redis] Cannot set key - client not initialized');
    return false;
  }

  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (expirySeconds) {
      await redis.setex(key, expirySeconds, stringValue);
    } else {
      await redis.set(key, stringValue);
    }

    return true;
  } catch (error) {
    logger.error('[Redis] Failed to set key:', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Utility: Get a value and parse as JSON if applicable
 *
 * @param key - Redis key
 * @returns Parsed value or null if not found
 */
export const getAndParse = async <T = unknown>(key: string): Promise<T | null> => {
  if (!redis) {
    logger.warn('[Redis] Cannot get key - client not initialized');
    return null;
  }

  try {
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      // Return as-is if not valid JSON
      return value as unknown as T;
    }
  } catch (error) {
    logger.error('[Redis] Failed to get key:', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * Utility: Delete a key
 *
 * @param key - Redis key to delete
 * @returns True if key was deleted
 */
export const deleteKey = async (key: string): Promise<boolean> => {
  if (!redis) {
    logger.warn('[Redis] Cannot delete key - client not initialized');
    return false;
  }

  try {
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    logger.error('[Redis] Failed to delete key:', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Utility: Delete multiple keys by pattern
 *
 * @param pattern - Pattern to match (e.g., "session:*")
 * @returns Number of keys deleted
 */
export const deleteByPattern = async (pattern: string): Promise<number> => {
  if (!redis) {
    logger.warn('[Redis] Cannot delete by pattern - client not initialized');
    return 0;
  }

  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        deletedCount += await redis.del(...keys);
      }
    } while (cursor !== '0');

    return deletedCount;
  } catch (error) {
    logger.error('[Redis] Failed to delete by pattern:', {
      pattern,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
};

/**
 * Get BullMQ-compatible connection options
 *
 * BullMQ requires specific connection configuration that differs slightly
 * from the standard ioredis options. This function provides the properly
 * formatted connection options for BullMQ queues and workers.
 *
 * @returns Connection options for BullMQ or null if Redis is not configured
 */
export const getBullMQConnection = (): ConnectionOptions | null => {
  const url = getRedisUrl();

  if (!url) {
    logger.warn('[Redis] Cannot get BullMQ connection - REDIS_URL not set');
    return null;
  }

  // Parse the URL to extract components
  const parsedUrl = new URL(url);

  const connection: ConnectionOptions = {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port || '6379', 10),
    maxRetriesPerRequest: null, // Required for BullMQ workers
  };

  // Add password if present
  if (parsedUrl.password) {
    connection.password = parsedUrl.password;
  }

  // Add username if present (for Redis 6+ ACL)
  if (parsedUrl.username && parsedUrl.username !== 'default') {
    connection.username = parsedUrl.username;
  }

  // Configure TLS for secure connections (rediss://)
  if (isTlsConnection(url)) {
    connection.tls = {
      rejectUnauthorized: false, // Required for some cloud providers like Upstash
    };
  }

  return connection;
};

/**
 * Get the raw Redis URL for BullMQ
 * Some BullMQ configurations accept a URL string directly
 *
 * @returns Redis URL or null if not configured
 */
export const getRedisUrlForQueue = (): string | null => {
  const url = getRedisUrl();
  return url || null;
};

export default redis;
