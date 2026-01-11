/**
 * Analytics Routes
 *
 * This module defines all analytics-related API endpoints including
 * overview metrics, agent performance, workflow performance, and system health.
 *
 * Endpoints:
 * - GET /analytics/overview          - Get aggregate metrics for user
 * - GET /analytics/agents/:id/metrics - Get agent performance metrics
 * - GET /analytics/workflows/:id/metrics - Get workflow performance metrics
 * - GET /analytics/system-health     - Get system health (admin only)
 *
 * @module routes/analytics
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getOverviewMetrics,
  getAgentMetrics,
  getWorkflowMetrics,
  getSystemHealth,
  type TimePeriod,
} from '../services/analytics.service';
import { requireAuth, requireRole, isAdmin } from '../middleware/auth';
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
 * Time period values
 */
const TimePeriodValues = ['hour', 'day', 'week', 'month'] as const;

/**
 * Query parameters for metrics endpoints
 */
const metricsQuerySchema = z.object({
  from: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => val === undefined || !isNaN(val.getTime()), {
      message: 'Invalid from date format',
    }),
  to: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => val === undefined || !isNaN(val.getTime()), {
      message: 'Invalid to date format',
    }),
  groupBy: z.enum(TimePeriodValues).optional(),
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

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /analytics/overview
 *
 * Get aggregate analytics metrics for the authenticated user.
 *
 * Query parameters:
 * - from: ISO date string (default: 30 days ago)
 * - to: ISO date string (default: now)
 *
 * Response:
 * - 200 OK: Overview metrics
 * - 401 Unauthorized: Not authenticated
 */
router.get('/overview', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate query parameters
    const validationResult = metricsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const params = validationResult.data;

    // Get overview metrics
    const metrics = await getOverviewMetrics(user.userId, {
      from: params.from,
      to: params.to,
    });

    logger.debug('[Analytics Route] Retrieved overview metrics:', {
      userId: user.userId,
      totalAgents: metrics.totals.agents,
      totalWorkflows: metrics.totals.workflows,
      totalExecutions: metrics.totals.executions,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          metrics,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/agents/:id/metrics
 *
 * Get performance metrics for a specific agent.
 *
 * Path parameters:
 * - id: Agent UUID
 *
 * Query parameters:
 * - from: ISO date string (default: 30 days ago)
 * - to: ISO date string (default: now)
 * - groupBy: 'hour' | 'day' | 'week' | 'month' (default: 'day')
 *
 * Response:
 * - 200 OK: Agent metrics with performance percentiles and time series
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Agent not found
 */
router.get(
  '/agents/:id/metrics',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const agentId = requireStringParam(req.params.id, 'id');

      // Validate UUID
      validateUuid(agentId, 'agentId');

      // Validate query parameters
      const validationResult = metricsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        throw handleValidationError(validationResult.error);
      }

      const params = validationResult.data;

      // Get agent metrics
      const metrics = await getAgentMetrics(
        agentId,
        user.userId,
        {
          from: params.from,
          to: params.to,
          groupBy: params.groupBy as TimePeriod | undefined,
        },
        isAdmin(req),
      );

      logger.debug('[Analytics Route] Retrieved agent metrics:', {
        agentId,
        userId: user.userId,
        totalExecutions: metrics.reliability.totalExecutions,
        successRate: metrics.reliability.successRate,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            metrics,
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /analytics/workflows/:id/metrics
 *
 * Get performance metrics for a specific workflow.
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Query parameters:
 * - from: ISO date string (default: 30 days ago)
 * - to: ISO date string (default: now)
 * - groupBy: 'hour' | 'day' | 'week' | 'month' (default: 'day')
 *
 * Response:
 * - 200 OK: Workflow metrics with performance percentiles, step metrics, and time series
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found
 */
router.get(
  '/workflows/:id/metrics',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const workflowId = requireStringParam(req.params.id, 'id');

      // Validate UUID
      validateUuid(workflowId, 'workflowId');

      // Validate query parameters
      const validationResult = metricsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        throw handleValidationError(validationResult.error);
      }

      const params = validationResult.data;

      // Get workflow metrics
      const metrics = await getWorkflowMetrics(
        workflowId,
        user.userId,
        {
          from: params.from,
          to: params.to,
          groupBy: params.groupBy as TimePeriod | undefined,
        },
        isAdmin(req),
      );

      logger.debug('[Analytics Route] Retrieved workflow metrics:', {
        workflowId,
        userId: user.userId,
        totalExecutions: metrics.reliability.totalExecutions,
        successRate: metrics.reliability.successRate,
        stepsCount: metrics.steps.length,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            metrics,
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /analytics/system-health
 *
 * Get system health status. Requires admin role.
 *
 * Response:
 * - 200 OK: System health status including database, Redis, and queue health
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not admin
 */
router.get(
  '/system-health',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      // Get system health
      const health = await getSystemHealth();

      logger.debug('[Analytics Route] Retrieved system health:', {
        userId: user.userId,
        status: health.status,
        dbStatus: health.services.database.status,
        redisStatus: health.services.redis.status,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            health,
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

export default router;
