/**
 * Execution Logging Service
 *
 * This service handles execution event logging for workflow executions.
 * Provides utilities to log execution events to the execution_logs table
 * with support for step-level logging, metadata, and structured log levels.
 *
 * Features:
 * - Log execution events with level, message, and metadata
 * - Log step-specific events with step context
 * - Batch logging for performance optimization
 * - Query execution logs with filtering
 *
 * @module services/logging.service
 */

import { Prisma, ExecutionLog, LogLevel, StepStatus } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for logging an execution event
 */
export interface LogExecutionEventInput {
  /** Execution ID */
  executionId: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional workflow step ID */
  workflowStepId?: string;
  /** Optional step key for reference */
  stepKey?: string;
  /** Optional step status */
  stepStatus?: StepStatus;
  /** Optional step started timestamp */
  stepStartedAt?: Date;
  /** Optional step completed timestamp */
  stepCompletedAt?: Date;
  /** Optional step duration in milliseconds */
  stepDurationMs?: number;
}

/**
 * Batch log entry for bulk logging
 */
export interface BatchLogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional step key */
  stepKey?: string;
  /** Optional step status */
  stepStatus?: StepStatus;
  /** Optional step duration */
  stepDurationMs?: number;
}

/**
 * Filter options for querying logs
 */
export interface LogQueryFilters {
  /** Filter by log level */
  level?: LogLevel;
  /** Filter by step key */
  stepKey?: string;
  /** Filter by step status */
  stepStatus?: StepStatus;
  /** Filter from date */
  fromDate?: Date;
  /** Filter to date */
  toDate?: Date;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Result of a log query
 */
export interface LogQueryResult {
  logs: ExecutionLog[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default limit for log queries */
const DEFAULT_LOG_LIMIT = 100;

/** Maximum batch size for bulk logging */
const MAX_BATCH_SIZE = 100;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure database is available
 */
const ensureDatabase = (): void => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }
};

/**
 * Sanitize metadata to ensure it's JSON-serializable
 */
const sanitizeMetadata = (metadata: Record<string, unknown>): Prisma.InputJsonValue => {
  try {
    // Deep clone and filter out non-serializable values
    const sanitized = JSON.parse(
      JSON.stringify(metadata, (_key, value) => {
        // Handle undefined
        if (value === undefined) {
          return null;
        }
        // Handle functions
        if (typeof value === 'function') {
          return '[Function]';
        }
        // Handle circular references (will throw in JSON.stringify)
        if (typeof value === 'object' && value !== null) {
          // Truncate large objects
          const str = JSON.stringify(value);
          if (str.length > 10000) {
            return '[Object too large]';
          }
        }
        // Handle BigInt
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }),
    );
    return sanitized as Prisma.InputJsonValue;
  } catch (error) {
    // If serialization fails, return a safe object
    logger.warn('[Logging Service] Failed to sanitize metadata:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: 'Failed to serialize metadata' } as Prisma.InputJsonValue;
  }
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Log an execution event to the database
 *
 * This is the primary function for logging execution events. It creates
 * a record in the execution_logs table with the provided information.
 *
 * @param input - Log event input
 * @returns Created execution log entry
 *
 * @example
 * ```typescript
 * await logExecutionEvent({
 *   executionId: 'exec-123',
 *   level: LogLevel.INFO,
 *   message: 'Workflow execution started',
 *   metadata: { stepsTotal: 5 },
 * });
 * ```
 */
export const logExecutionEvent = async (input: LogExecutionEventInput): Promise<ExecutionLog> => {
  ensureDatabase();

  const {
    executionId,
    level,
    message,
    metadata = {},
    workflowStepId,
    stepKey,
    stepStatus,
    stepStartedAt,
    stepCompletedAt,
    stepDurationMs,
  } = input;

  try {
    const log = await prisma!.executionLog.create({
      data: {
        executionId,
        level,
        message,
        metadata: sanitizeMetadata(metadata),
        workflowStepId: workflowStepId || null,
        stepKey: stepKey || null,
        stepStatus: stepStatus || null,
        stepStartedAt: stepStartedAt || null,
        stepCompletedAt: stepCompletedAt || null,
        stepDurationMs: stepDurationMs || null,
      },
    });

    // Also log to application logger for debugging
    const logMethod =
      level === LogLevel.ERROR || level === LogLevel.FATAL
        ? 'error'
        : level === LogLevel.WARN
          ? 'warn'
          : level === LogLevel.DEBUG
            ? 'debug'
            : 'info';

    logger[logMethod](`[Execution ${executionId}] ${message}`, {
      level,
      stepKey,
      stepStatus,
      ...metadata,
    });

    return log;
  } catch (error) {
    logger.error('[Logging Service] Failed to log execution event:', {
      executionId,
      level,
      message,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Log a step event with step context
 *
 * Convenience function for logging step-specific events with full step context.
 *
 * @param executionId - Execution ID
 * @param stepKey - Step key
 * @param stepName - Step name (for message)
 * @param level - Log level
 * @param message - Log message
 * @param options - Additional options
 * @returns Created execution log entry
 */
export const logStepEvent = async (
  executionId: string,
  stepKey: string,
  stepName: string,
  level: LogLevel,
  message: string,
  options: {
    workflowStepId?: string;
    stepStatus?: StepStatus;
    stepStartedAt?: Date;
    stepCompletedAt?: Date;
    stepDurationMs?: number;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<ExecutionLog> => {
  return logExecutionEvent({
    executionId,
    level,
    message: `[${stepName}] ${message}`,
    stepKey,
    ...options,
    metadata: {
      stepName,
      ...options.metadata,
    },
  });
};

/**
 * Log multiple events in a batch
 *
 * More efficient than logging events one at a time when you have
 * multiple events to log.
 *
 * @param executionId - Execution ID
 * @param entries - Array of log entries
 * @param workflowStepId - Optional workflow step ID for all entries
 * @returns Number of logs created
 */
export const logBatchEvents = async (
  executionId: string,
  entries: BatchLogEntry[],
  workflowStepId?: string,
): Promise<number> => {
  ensureDatabase();

  if (entries.length === 0) {
    return 0;
  }

  // Limit batch size
  const limitedEntries = entries.slice(0, MAX_BATCH_SIZE);

  try {
    const result = await prisma!.executionLog.createMany({
      data: limitedEntries.map((entry) => ({
        executionId,
        level: entry.level,
        message: entry.message,
        metadata: sanitizeMetadata(entry.metadata || {}),
        workflowStepId: workflowStepId || null,
        stepKey: entry.stepKey || null,
        stepStatus: entry.stepStatus || null,
        stepDurationMs: entry.stepDurationMs || null,
      })),
    });

    logger.debug('[Logging Service] Batch logged events:', {
      executionId,
      count: result.count,
    });

    return result.count;
  } catch (error) {
    logger.error('[Logging Service] Failed to batch log events:', {
      executionId,
      entriesCount: limitedEntries.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Query execution logs with filtering
 *
 * @param executionId - Execution ID
 * @param filters - Query filters
 * @returns Paginated log results
 */
export const getExecutionLogs = async (
  executionId: string,
  filters: LogQueryFilters = {},
): Promise<LogQueryResult> => {
  ensureDatabase();

  const {
    level,
    stepKey,
    stepStatus,
    fromDate,
    toDate,
    limit = DEFAULT_LOG_LIMIT,
    offset = 0,
  } = filters;

  // Build where clause
  const where: Prisma.ExecutionLogWhereInput = {
    executionId,
  };

  if (level) {
    where.level = level;
  }

  if (stepKey) {
    where.stepKey = stepKey;
  }

  if (stepStatus) {
    where.stepStatus = stepStatus;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = fromDate;
    }
    if (toDate) {
      where.createdAt.lte = toDate;
    }
  }

  try {
    const [logs, total] = await Promise.all([
      prisma!.executionLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma!.executionLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: offset + logs.length < total,
    };
  } catch (error) {
    logger.error('[Logging Service] Failed to query execution logs:', {
      executionId,
      filters,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get latest log entry for an execution
 *
 * @param executionId - Execution ID
 * @returns Latest log entry or null
 */
export const getLatestLog = async (executionId: string): Promise<ExecutionLog | null> => {
  ensureDatabase();

  try {
    return await prisma!.executionLog.findFirst({
      where: { executionId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    logger.error('[Logging Service] Failed to get latest log:', {
      executionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get log count by level for an execution
 *
 * @param executionId - Execution ID
 * @returns Count of logs by level
 */
export const getLogCountsByLevel = async (
  executionId: string,
): Promise<Record<LogLevel, number>> => {
  ensureDatabase();

  try {
    const counts = await prisma!.executionLog.groupBy({
      by: ['level'],
      where: { executionId },
      _count: { id: true },
    });

    const result: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
    };

    for (const count of counts) {
      result[count.level] = count._count.id;
    }

    return result;
  } catch (error) {
    logger.error('[Logging Service] Failed to get log counts:', {
      executionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get step execution summary from logs
 *
 * @param executionId - Execution ID
 * @returns Summary of step executions
 */
export const getStepExecutionSummary = async (
  executionId: string,
): Promise<
  Array<{
    stepKey: string;
    status: StepStatus | null;
    durationMs: number | null;
    logsCount: number;
    errorsCount: number;
  }>
> => {
  ensureDatabase();

  try {
    // Get unique step keys with their latest status
    const stepLogs = await prisma!.executionLog.findMany({
      where: {
        executionId,
        stepKey: { not: null },
      },
      select: {
        stepKey: true,
        stepStatus: true,
        stepDurationMs: true,
        level: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by stepKey
    const stepMap = new Map<
      string,
      {
        stepKey: string;
        status: StepStatus | null;
        durationMs: number | null;
        logsCount: number;
        errorsCount: number;
      }
    >();

    for (const log of stepLogs) {
      if (!log.stepKey) {
        continue;
      }

      const existing = stepMap.get(log.stepKey);
      if (!existing) {
        stepMap.set(log.stepKey, {
          stepKey: log.stepKey,
          status: log.stepStatus,
          durationMs: log.stepDurationMs,
          logsCount: 1,
          errorsCount: log.level === LogLevel.ERROR || log.level === LogLevel.FATAL ? 1 : 0,
        });
      } else {
        existing.logsCount++;
        if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
          existing.errorsCount++;
        }
        // Update status and duration if not already set
        if (!existing.status && log.stepStatus) {
          existing.status = log.stepStatus;
        }
        if (!existing.durationMs && log.stepDurationMs) {
          existing.durationMs = log.stepDurationMs;
        }
      }
    }

    return Array.from(stepMap.values());
  } catch (error) {
    logger.error('[Logging Service] Failed to get step execution summary:', {
      executionId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Delete old execution logs
 *
 * Used for cleanup of old logs based on retention policy.
 *
 * @param olderThan - Delete logs older than this date
 * @returns Number of logs deleted
 */
export const deleteOldLogs = async (olderThan: Date): Promise<number> => {
  ensureDatabase();

  try {
    const result = await prisma!.executionLog.deleteMany({
      where: {
        createdAt: { lt: olderThan },
      },
    });

    logger.info('[Logging Service] Deleted old logs:', {
      count: result.count,
      olderThan: olderThan.toISOString(),
    });

    return result.count;
  } catch (error) {
    logger.error('[Logging Service] Failed to delete old logs:', {
      olderThan: olderThan.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export default {
  logExecutionEvent,
  logStepEvent,
  logBatchEvents,
  getExecutionLogs,
  getLatestLog,
  getLogCountsByLevel,
  getStepExecutionSummary,
  deleteOldLogs,
};
