/**
 * Execution Routes
 *
 * This module defines all execution-related API endpoints including
 * retrieving execution details, logs, and cancellation.
 *
 * Endpoints:
 * - GET    /executions/:id       - Get execution by ID with workflow info
 * - GET    /executions/:id/logs  - Get execution logs (filtered, paginated)
 * - POST   /executions/:id/cancel - Cancel a running execution
 *
 * @module routes/executions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LogLevel } from '@prisma/client';
import { getExecutionById, getExecutionLogs, cancelExecution } from '../services/execution.service';
import { requireAuth, isAdmin } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { requireStringParam } from '../utils/params';
import { logger } from '../lib/logger';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Log level enum values
 */
const LogLevelValues = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;

/**
 * Query parameters for listing execution logs
 */
const listLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  level: z.enum(LogLevelValues).optional(),
  stepKey: z.string().max(100).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Handle Zod validation errors
 */
const handleValidationError = (error: z.ZodError): ApiError => {
  const details = error.issues.map((issue: z.ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return ApiError.validation('Validation failed', details);
};

/**
 * Validate UUID format
 */
const validateUuid = (id: string, fieldName: string = 'id'): void => {
  if (!UUID_REGEX.test(id)) {
    throw ApiError.badRequest(`Invalid ${fieldName} format`);
  }
};

/**
 * Map string enum to Prisma LogLevel enum
 */
const mapLogLevel = (level: string): LogLevel => {
  const levelMap: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
    FATAL: LogLevel.FATAL,
  };
  return levelMap[level] || LogLevel.INFO;
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /executions/:id
 *
 * Get a single execution by ID with workflow info and step counts.
 *
 * Path parameters:
 * - id: Execution UUID
 *
 * Response:
 * - 200 OK: Execution details with workflow info
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Execution not found
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const executionId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(executionId);

    // Get execution with workflow info
    const execution = await getExecutionById(executionId, user.userId, isAdmin(req));

    if (!execution) {
      throw ApiError.notFound('Execution not found');
    }

    logger.debug('[Executions Route] Retrieved execution:', { executionId, userId: user.userId });

    res.status(200).json(
      createSuccessResponse(
        {
          execution,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /executions/:id/logs
 *
 * Get execution logs with filtering and pagination.
 *
 * Path parameters:
 * - id: Execution UUID
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - sortBy: string (createdAt, level, stepKey)
 * - sortOrder: 'asc' | 'desc' (default: 'asc' for logs)
 * - level: LogLevel filter (DEBUG, INFO, WARN, ERROR, FATAL)
 * - stepKey: string filter for specific step
 *
 * Response:
 * - 200 OK: Paginated list of execution logs
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Execution not found
 */
router.get('/:id/logs', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const executionId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(executionId);

    // Validate query parameters
    const validationResult = listLogsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const params = validationResult.data;

    // Build filter params
    const filterParams = {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      level: params.level ? mapLogLevel(params.level) : undefined,
      stepKey: params.stepKey,
    };

    // Get execution logs
    const result = await getExecutionLogs(executionId, user.userId, filterParams, isAdmin(req));

    logger.debug('[Executions Route] Listed execution logs:', {
      executionId,
      userId: user.userId,
      count: result.data.length,
      total: result.meta.totalItems,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          logs: result.data,
          pagination: result.meta,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /executions/:id/cancel
 *
 * Cancel a running or pending execution.
 *
 * Path parameters:
 * - id: Execution UUID
 *
 * Response:
 * - 200 OK: Cancelled execution
 * - 400 Bad Request: Execution is not in a cancellable state
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Execution not found
 */
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const executionId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(executionId);

    // Cancel execution
    const execution = await cancelExecution(executionId, user.userId, isAdmin(req));

    logger.info('[Executions Route] Cancelled execution:', {
      executionId,
      userId: user.userId,
      status: execution.status,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          execution: {
            id: execution.id,
            workflowId: execution.workflowId,
            status: execution.status,
            stepsTotal: execution.stepsTotal,
            stepsCompleted: execution.stepsCompleted,
            stepsFailed: execution.stepsFailed,
            completedAt: execution.completedAt,
            durationMs: execution.durationMs,
          },
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

export default router as Router;
