/**
 * Execution Service
 *
 * This service handles all execution-related operations including
 * retrieving execution details, logs, and cancellation.
 *
 * Features:
 * - Get execution by ID with workflow info
 * - Get execution logs with filtering and pagination
 * - Cancel running executions
 *
 * @module services/execution.service
 */

import { Prisma, Execution, ExecutionStatus, ExecutionLog, LogLevel } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import {
  buildPagination,
  buildPaginationMeta,
  buildSorting,
  PaginationInput,
  PaginationMeta,
  SortingInput,
  AllowedSortFields,
} from '../lib/queryHelpers';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Execution with workflow info
 */
export interface ExecutionWithWorkflow extends Execution {
  workflow: {
    id: string;
    name: string;
    status: string;
    version: number;
  };
}

/**
 * Execution details response
 */
export interface ExecutionDetails extends ExecutionWithWorkflow {
  stepCounts: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

/**
 * Execution log list filters
 */
export interface ExecutionLogFilters {
  /** Filter by log level */
  level?: LogLevel;
  /** Filter by step key */
  stepKey?: string;
}

/**
 * Combined query parameters for listing execution logs
 */
export interface ExecutionLogListParams
  extends PaginationInput, SortingInput, ExecutionLogFilters {}

/**
 * Paginated execution log list response
 */
export interface PaginatedExecutionLogList {
  data: ExecutionLog[];
  meta: PaginationMeta;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed sort fields for execution log listing
 */
const LOG_SORT_FIELDS: AllowedSortFields<string> = {
  createdAt: 'createdAt',
  created: 'createdAt',
  level: 'level',
  stepKey: 'stepKey',
};

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

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get an execution by ID with workflow info and step counts
 *
 * @param executionId - Execution ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Execution details or null if not found
 */
export const getExecutionById = async (
  executionId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<ExecutionDetails | null> => {
  ensureDatabase();

  const execution = await prisma!.execution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          version: true,
          userId: true,
        },
      },
    },
  });

  if (!execution) {
    return null;
  }

  // Check ownership unless admin
  // Execution ownership is based on the workflow owner
  if (!isAdmin && execution.workflow.userId !== userId && execution.userId !== userId) {
    return null;
  }

  // Calculate step counts
  const stepCounts = {
    total: execution.stepsTotal,
    completed: execution.stepsCompleted,
    failed: execution.stepsFailed,
    pending: execution.stepsTotal - execution.stepsCompleted - execution.stepsFailed,
  };

  logger.debug('[Execution Service] Retrieved execution:', { executionId, userId });

  // Create response without the userId from workflow
  const { userId: _workflowUserId, ...workflowInfo } = execution.workflow;

  return {
    ...execution,
    workflow: workflowInfo,
    stepCounts,
  };
};

/**
 * Get execution logs with filtering and pagination
 *
 * @param executionId - Execution ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param params - Query parameters for pagination, filtering, and sorting
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Paginated list of execution logs
 */
export const getExecutionLogs = async (
  executionId: string,
  userId: string,
  params: ExecutionLogListParams = {},
  isAdmin: boolean = false,
): Promise<PaginatedExecutionLogList> => {
  ensureDatabase();

  // First verify user has access to the execution
  const execution = await prisma!.execution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!execution) {
    throw ApiError.notFound('Execution not found');
  }

  // Check ownership unless admin
  if (!isAdmin && execution.workflow.userId !== userId && execution.userId !== userId) {
    throw ApiError.forbidden('You do not have permission to access this execution');
  }

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting (default to createdAt asc for logs - oldest first)
  const orderBy = buildSorting(
    { sortBy: params.sortBy, sortOrder: params.sortOrder || 'asc' },
    LOG_SORT_FIELDS,
    'createdAt',
  );

  // Build where clause
  const where: Prisma.ExecutionLogWhereInput = {
    executionId,
  };

  // Filter by log level
  if (params.level) {
    where.level = params.level;
  }

  // Filter by step key
  if (params.stepKey) {
    where.stepKey = params.stepKey;
  }

  // Execute queries in parallel
  const [logs, totalCount] = await Promise.all([
    prisma!.executionLog.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma!.executionLog.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  logger.debug('[Execution Service] Listed execution logs:', {
    executionId,
    userId,
    filters: params,
    count: logs.length,
    total: totalCount,
  });

  return { data: logs, meta };
};

/**
 * Cancel a running execution
 *
 * @param executionId - Execution ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Updated execution
 * @throws ApiError if execution not found, not authorized, or not running
 */
export const cancelExecution = async (
  executionId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<Execution> => {
  ensureDatabase();

  // Get execution with workflow info
  const execution = await prisma!.execution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!execution) {
    throw ApiError.notFound('Execution not found');
  }

  // Check ownership unless admin
  if (!isAdmin && execution.workflow.userId !== userId && execution.userId !== userId) {
    throw ApiError.forbidden('You do not have permission to cancel this execution');
  }

  // Validate execution is in a cancellable state
  const cancellableStatuses: ExecutionStatus[] = [ExecutionStatus.PENDING, ExecutionStatus.RUNNING];

  if (!cancellableStatuses.includes(execution.status)) {
    throw ApiError.badRequest(
      `Cannot cancel execution in "${execution.status}" status. Execution must be PENDING or RUNNING.`,
    );
  }

  // Update execution status to CANCELLED
  const updatedExecution = await prisma!.execution.update({
    where: { id: executionId },
    data: {
      status: ExecutionStatus.CANCELLED,
      completedAt: new Date(),
      durationMs: execution.startedAt
        ? Math.floor(new Date().getTime() - execution.startedAt.getTime())
        : null,
    },
  });

  // Create a log entry for the cancellation
  await prisma!.executionLog.create({
    data: {
      executionId,
      level: LogLevel.WARN,
      message: 'Execution cancelled by user',
      metadata: {
        cancelledBy: userId,
        previousStatus: execution.status,
      } as Prisma.InputJsonValue,
    },
  });

  // TODO: In the future, actually cancel running jobs in BullMQ (Task Group 18)
  logger.info('[Execution Service] Cancelled execution:', {
    executionId,
    userId,
    previousStatus: execution.status,
  });

  return updatedExecution;
};

/**
 * Check if user has access to an execution
 *
 * @param executionId - Execution ID
 * @param userId - User ID
 * @param isAdmin - Whether the user is an admin
 * @returns True if user has access
 */
export const userHasExecutionAccess = async (
  executionId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<boolean> => {
  ensureDatabase();

  if (isAdmin) {
    const execution = await prisma!.execution.findUnique({
      where: { id: executionId },
      select: { id: true },
    });
    return execution !== null;
  }

  const execution = await prisma!.execution.findFirst({
    where: {
      id: executionId,
      OR: [
        { userId },
        {
          workflow: {
            userId,
          },
        },
      ],
    },
    select: { id: true },
  });

  return execution !== null;
};

export default {
  getExecutionById,
  getExecutionLogs,
  cancelExecution,
  userHasExecutionAccess,
};
