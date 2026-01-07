/**
 * Database Health Check Utility
 *
 * Provides comprehensive database health checking functionality including:
 * - Connection testing with response time measurement
 * - Connection pool status monitoring
 * - Database version and configuration checks
 * - Health status aggregation
 *
 * @module utils/dbHealthCheck
 */

import {
  prisma,
  isPrismaAvailable,
  getPrismaInitError,
  checkDatabaseHealth,
  getPoolMetrics,
  getPoolConfig,
  getPoolHealthSummary,
  getDatabaseInfo,
  type PoolMetrics,
  type PoolConfig,
} from '../lib/prisma';

/**
 * Database health status levels
 */
export type HealthLevel = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Comprehensive database health status
 */
export interface DatabaseHealth {
  /** Overall health status */
  status: HealthLevel;
  /** Whether the database is available for queries */
  available: boolean;
  /** Whether the database is properly configured */
  configured: boolean;
  /** Connection test result */
  connection: {
    healthy: boolean;
    responseTimeMs: number;
    error?: string;
  };
  /** Connection pool status */
  pool: {
    successRate: number;
    avgQueryTimeMs: number;
    slowQueryRate: number;
    totalQueries: number;
    isHealthy: boolean;
    config: PoolConfig;
  };
  /** Database information */
  database: {
    provider: string;
    version?: string;
    serverTime?: string;
  };
  /** Timestamp of this health check */
  checkedAt: string;
}

/**
 * Detailed database metrics for monitoring
 */
export interface DatabaseMetrics {
  /** Total queries since startup */
  totalQueries: number;
  /** Successful queries */
  successfulQueries: number;
  /** Failed queries */
  failedQueries: number;
  /** Queries that took longer than 1 second */
  slowQueries: number;
  /** Average query time in milliseconds */
  avgQueryTimeMs: number;
  /** Success rate as percentage (0-100) */
  successRatePercent: number;
  /** Error rate as percentage (0-100) */
  errorRatePercent: number;
  /** Slow query rate as percentage (0-100) */
  slowQueryRatePercent: number;
  /** Metrics last updated */
  lastUpdated: string;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Whether the connection test passed */
  success: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Error message if failed */
  error?: string;
  /** Server time from database */
  serverTime?: string;
  /** Database version */
  version?: string;
}

/**
 * Test database connection with detailed information
 *
 * Executes a simple query to verify connectivity and retrieves
 * server information including current timestamp and version.
 *
 * @returns Connection test result with timing and server info
 *
 * @example
 * ```typescript
 * const result = await testConnection();
 * if (result.success) {
 *   console.log(`Connected in ${result.responseTimeMs}ms`);
 *   console.log(`Server time: ${result.serverTime}`);
 * } else {
 *   console.error(`Connection failed: ${result.error}`);
 * }
 * ```
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  // Check if Prisma client is available
  if (!isPrismaAvailable() || !prisma) {
    const initError = getPrismaInitError();
    return {
      success: false,
      responseTimeMs: Date.now() - startTime,
      error: initError?.message || 'Database client not initialized',
    };
  }

  try {
    // Query to get server time and version
    const result = await prisma.$queryRaw<
      Array<{ now: Date; version: string }>
    >`SELECT NOW() as now, version() as version`;

    const responseTimeMs = Date.now() - startTime;
    const row = result[0];

    return {
      success: true,
      responseTimeMs,
      serverTime: row?.now?.toISOString(),
      version: row?.version,
    };
  } catch (error) {
    return {
      success: false,
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Perform a simple connectivity check
 *
 * Faster than testConnection() - only verifies connectivity
 * without retrieving server information.
 *
 * @returns Whether the database is reachable
 *
 * @example
 * ```typescript
 * const isConnected = await pingDatabase();
 * if (!isConnected) {
 *   // Handle connection failure
 * }
 * ```
 */
export async function pingDatabase(): Promise<boolean> {
  const health = await checkDatabaseHealth();
  return health.healthy;
}

/**
 * Get comprehensive database health status
 *
 * Aggregates connection status, pool metrics, and database information
 * into a single health report suitable for monitoring endpoints.
 *
 * @returns Comprehensive database health status
 *
 * @example
 * ```typescript
 * const health = await getDatabaseHealth();
 * if (health.status === 'unhealthy') {
 *   console.error('Database health check failed:', health.connection.error);
 * }
 * ```
 */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const checkedAt = new Date().toISOString();

  // Check basic configuration
  const dbInfo = getDatabaseInfo();
  const available = isPrismaAvailable();

  // If not configured, return early
  if (!dbInfo.configured) {
    return {
      status: 'unknown',
      available: false,
      configured: false,
      connection: {
        healthy: false,
        responseTimeMs: 0,
        error: 'Database not configured',
      },
      pool: {
        successRate: 0,
        avgQueryTimeMs: 0,
        slowQueryRate: 0,
        totalQueries: 0,
        isHealthy: false,
        config: getPoolConfig(),
      },
      database: {
        provider: dbInfo.provider,
      },
      checkedAt,
    };
  }

  // Test connection
  const connectionTest = await testConnection();

  // Get pool metrics
  const poolHealth = getPoolHealthSummary();
  const poolConfig = getPoolConfig();

  // Determine overall status
  let status: HealthLevel = 'healthy';

  if (!connectionTest.success) {
    status = 'unhealthy';
  } else if (!poolHealth.isHealthy) {
    status = 'degraded';
  }

  return {
    status,
    available,
    configured: dbInfo.configured,
    connection: {
      healthy: connectionTest.success,
      responseTimeMs: connectionTest.responseTimeMs,
      ...(connectionTest.error && { error: connectionTest.error }),
    },
    pool: {
      ...poolHealth,
      config: poolConfig,
    },
    database: {
      provider: dbInfo.provider,
      ...(connectionTest.version && { version: connectionTest.version }),
      ...(connectionTest.serverTime && { serverTime: connectionTest.serverTime }),
    },
    checkedAt,
  };
}

/**
 * Get detailed database metrics for monitoring
 *
 * Returns query execution statistics suitable for dashboards
 * and alerting systems.
 *
 * @returns Detailed database metrics
 *
 * @example
 * ```typescript
 * const metrics = getDatabaseMetrics();
 * if (metrics.errorRatePercent > 5) {
 *   alert('High database error rate!');
 * }
 * ```
 */
export function getDatabaseMetrics(): DatabaseMetrics {
  const poolMetrics: PoolMetrics = getPoolMetrics();

  const successRatePercent =
    poolMetrics.totalQueries > 0
      ? (poolMetrics.successfulQueries / poolMetrics.totalQueries) * 100
      : 100;

  const errorRatePercent =
    poolMetrics.totalQueries > 0 ? (poolMetrics.failedQueries / poolMetrics.totalQueries) * 100 : 0;

  const slowQueryRatePercent =
    poolMetrics.totalQueries > 0 ? (poolMetrics.slowQueries / poolMetrics.totalQueries) * 100 : 0;

  return {
    totalQueries: poolMetrics.totalQueries,
    successfulQueries: poolMetrics.successfulQueries,
    failedQueries: poolMetrics.failedQueries,
    slowQueries: poolMetrics.slowQueries,
    avgQueryTimeMs: Math.round(poolMetrics.avgQueryTimeMs),
    successRatePercent: Math.round(successRatePercent * 100) / 100,
    errorRatePercent: Math.round(errorRatePercent * 100) / 100,
    slowQueryRatePercent: Math.round(slowQueryRatePercent * 100) / 100,
    lastUpdated: poolMetrics.lastUpdated.toISOString(),
  };
}

/**
 * Check if database meets performance thresholds
 *
 * @param thresholds - Optional custom thresholds
 * @returns Whether all thresholds are met and details
 *
 * @example
 * ```typescript
 * const check = checkPerformanceThresholds({
 *   maxAvgQueryTimeMs: 100,
 *   minSuccessRate: 99,
 *   maxSlowQueryRate: 5
 * });
 *
 * if (!check.passed) {
 *   console.warn('Performance thresholds exceeded:', check.violations);
 * }
 * ```
 */
export function checkPerformanceThresholds(
  thresholds: {
    /** Maximum acceptable average query time (ms). Default: 200 */
    maxAvgQueryTimeMs?: number;
    /** Minimum acceptable success rate (%). Default: 95 */
    minSuccessRate?: number;
    /** Maximum acceptable slow query rate (%). Default: 10 */
    maxSlowQueryRate?: number;
  } = {},
): {
  passed: boolean;
  violations: string[];
  metrics: {
    avgQueryTimeMs: number;
    successRate: number;
    slowQueryRate: number;
  };
} {
  const { maxAvgQueryTimeMs = 200, minSuccessRate = 95, maxSlowQueryRate = 10 } = thresholds;

  const poolHealth = getPoolHealthSummary();
  const violations: string[] = [];

  if (poolHealth.avgQueryTimeMs > maxAvgQueryTimeMs) {
    violations.push(
      `Average query time (${poolHealth.avgQueryTimeMs}ms) exceeds threshold (${maxAvgQueryTimeMs}ms)`,
    );
  }

  if (poolHealth.successRate < minSuccessRate) {
    violations.push(
      `Success rate (${poolHealth.successRate.toFixed(2)}%) below threshold (${minSuccessRate}%)`,
    );
  }

  if (poolHealth.slowQueryRate > maxSlowQueryRate) {
    violations.push(
      `Slow query rate (${poolHealth.slowQueryRate.toFixed(2)}%) exceeds threshold (${maxSlowQueryRate}%)`,
    );
  }

  return {
    passed: violations.length === 0,
    violations,
    metrics: {
      avgQueryTimeMs: poolHealth.avgQueryTimeMs,
      successRate: poolHealth.successRate,
      slowQueryRate: poolHealth.slowQueryRate,
    },
  };
}

/**
 * Wait for database to become available
 *
 * Useful during application startup to ensure database
 * is ready before accepting requests.
 *
 * @param options - Retry options
 * @returns Whether connection was established
 *
 * @example
 * ```typescript
 * // Wait up to 30 seconds for database
 * const connected = await waitForDatabase({
 *   maxAttempts: 10,
 *   intervalMs: 3000
 * });
 *
 * if (!connected) {
 *   console.error('Could not connect to database');
 *   process.exit(1);
 * }
 * ```
 */
export async function waitForDatabase(
  options: {
    /** Maximum connection attempts. Default: 5 */
    maxAttempts?: number;
    /** Delay between attempts in milliseconds. Default: 2000 */
    intervalMs?: number;
    /** Log progress. Default: true */
    verbose?: boolean;
  } = {},
): Promise<boolean> {
  const { maxAttempts = 5, intervalMs = 2000, verbose = true } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (verbose) {
      console.log(`[Database] Connection attempt ${attempt}/${maxAttempts}...`);
    }

    const isConnected = await pingDatabase();

    if (isConnected) {
      if (verbose) {
        console.log('[Database] Connection established successfully');
      }
      return true;
    }

    if (attempt < maxAttempts) {
      if (verbose) {
        console.log(`[Database] Connection failed, retrying in ${intervalMs}ms...`);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  if (verbose) {
    console.error(`[Database] Failed to connect after ${maxAttempts} attempts`);
  }

  return false;
}

export default {
  testConnection,
  pingDatabase,
  getDatabaseHealth,
  getDatabaseMetrics,
  checkPerformanceThresholds,
  waitForDatabase,
};
