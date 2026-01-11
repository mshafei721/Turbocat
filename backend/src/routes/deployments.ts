/**
 * Deployment Routes
 *
 * This module defines all deployment-related API endpoints including
 * listing, creating, updating, deleting, and lifecycle management.
 *
 * Endpoints:
 * - GET    /deployments           - List deployments (paginated, filtered, sorted)
 * - GET    /deployments/:id       - Get deployment by ID
 * - POST   /deployments           - Create a new deployment
 * - PATCH  /deployments/:id       - Update a deployment
 * - DELETE /deployments/:id       - Soft delete a deployment
 * - POST   /deployments/:id/start - Start a deployment
 * - POST   /deployments/:id/stop  - Stop a deployment
 * - GET    /deployments/:id/logs  - Get deployment logs
 *
 * @module routes/deployments
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Environment, DeploymentStatus, HealthStatus, LogLevel } from '@prisma/client';
import {
  listDeployments,
  getDeploymentById,
  createDeployment,
  updateDeployment,
  deleteDeployment,
  startDeployment,
  stopDeployment,
  getDeploymentLogs,
} from '../services/deployment.service';
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
 * Environment enum values
 */
const EnvironmentValues = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'] as const;

/**
 * Deployment status enum values
 */
const DeploymentStatusValues = [
  'STOPPED',
  'STARTING',
  'RUNNING',
  'STOPPING',
  'FAILED',
  'MAINTENANCE',
] as const;

/**
 * Health status enum values
 */
const HealthStatusValues = ['UNKNOWN', 'HEALTHY', 'UNHEALTHY', 'DEGRADED'] as const;

/**
 * Log level enum values
 */
const LogLevelValues = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;

/**
 * Query parameters for listing deployments
 */
const listDeploymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  environment: z.enum(EnvironmentValues).optional(),
  status: z.enum(DeploymentStatusValues).optional(),
  healthStatus: z.enum(HealthStatusValues).optional(),
  workflowId: z.string().regex(UUID_REGEX, 'Invalid workflow ID format').optional(),
  agentId: z.string().regex(UUID_REGEX, 'Invalid agent ID format').optional(),
  search: z.string().max(255).optional(),
});

/**
 * Create deployment request body
 */
const createDeploymentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  workflowId: z.string().regex(UUID_REGEX, 'Invalid workflow ID format').optional(),
  agentId: z.string().regex(UUID_REGEX, 'Invalid agent ID format').optional(),
  environment: z.enum(EnvironmentValues).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  environmentVars: z.record(z.string(), z.string()).optional(),
  allocatedMemoryMb: z.number().int().positive().max(8192).optional(),
  allocatedCpuShares: z.number().int().positive().max(4096).optional(),
});

/**
 * Update deployment request body (partial)
 */
const updateDeploymentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  environment: z.enum(EnvironmentValues).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  environmentVars: z.record(z.string(), z.string()).optional(),
  allocatedMemoryMb: z.number().int().positive().max(8192).optional(),
  allocatedCpuShares: z.number().int().positive().max(4096).optional(),
});

/**
 * Query parameters for deployment logs
 */
const logsQuerySchema = z.object({
  level: z.enum(LogLevelValues).optional(),
  since: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => !val || !isNaN(val.getTime()), {
      message: 'Invalid date format for since parameter',
    }),
  tail: z.coerce.number().int().positive().max(1000).optional(),
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
 * Map string enum to Prisma enum
 */
const mapEnvironment = (env: string): Environment => {
  const envMap: Record<string, Environment> = {
    DEVELOPMENT: Environment.DEVELOPMENT,
    STAGING: Environment.STAGING,
    PRODUCTION: Environment.PRODUCTION,
  };
  return envMap[env] || Environment.PRODUCTION;
};

const mapDeploymentStatus = (status: string): DeploymentStatus => {
  const statusMap: Record<string, DeploymentStatus> = {
    STOPPED: DeploymentStatus.STOPPED,
    STARTING: DeploymentStatus.STARTING,
    RUNNING: DeploymentStatus.RUNNING,
    STOPPING: DeploymentStatus.STOPPING,
    FAILED: DeploymentStatus.FAILED,
    MAINTENANCE: DeploymentStatus.MAINTENANCE,
  };
  return statusMap[status] || DeploymentStatus.STOPPED;
};

const mapHealthStatus = (status: string): HealthStatus => {
  const statusMap: Record<string, HealthStatus> = {
    UNKNOWN: HealthStatus.UNKNOWN,
    HEALTHY: HealthStatus.HEALTHY,
    UNHEALTHY: HealthStatus.UNHEALTHY,
    DEGRADED: HealthStatus.DEGRADED,
  };
  return statusMap[status] || HealthStatus.UNKNOWN;
};

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
 * GET /deployments
 *
 * List deployments for the authenticated user with pagination, filtering, and sorting.
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - sortBy: string (name, environment, status, healthStatus, createdAt, updatedAt, deployedAt)
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - environment: Environment filter (DEVELOPMENT, STAGING, PRODUCTION)
 * - status: DeploymentStatus filter
 * - healthStatus: HealthStatus filter
 * - workflowId: UUID filter
 * - agentId: UUID filter
 * - search: string (searches name and description)
 *
 * Response:
 * - 200 OK: Paginated list of deployments with related workflow/agent info
 * - 401 Unauthorized: Not authenticated
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate query parameters
    const validationResult = listDeploymentsQuerySchema.safeParse(req.query);

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
      environment: params.environment ? mapEnvironment(params.environment) : undefined,
      status: params.status ? mapDeploymentStatus(params.status) : undefined,
      healthStatus: params.healthStatus ? mapHealthStatus(params.healthStatus) : undefined,
      workflowId: params.workflowId,
      agentId: params.agentId,
      search: params.search,
    };

    // List deployments
    const result = await listDeployments(user.userId, filterParams);

    logger.debug('[Deployments Route] Listed deployments:', {
      userId: user.userId,
      count: result.data.length,
      total: result.meta.totalItems,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          deployments: result.data,
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
 * GET /deployments/:id
 *
 * Get a single deployment by ID with full details.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Response:
 * - 200 OK: Deployment details with masked environment variables
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found or soft-deleted
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Get deployment
    const deployment = await getDeploymentById(deploymentId, user.userId, isAdmin(req));

    if (!deployment) {
      throw ApiError.notFound('Deployment not found');
    }

    // Check ownership (admin can bypass)
    if (deployment.userId !== user.userId && !isAdmin(req)) {
      throw ApiError.forbidden('You do not have permission to access this deployment');
    }

    logger.debug('[Deployments Route] Retrieved deployment:', {
      deploymentId,
      userId: user.userId,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          deployment,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /deployments
 *
 * Create a new deployment.
 *
 * Request body:
 * - name: string (required)
 * - description: string (optional)
 * - workflowId: UUID (optional, mutually exclusive with agentId)
 * - agentId: UUID (optional, mutually exclusive with workflowId)
 * - environment: Environment (optional, default: PRODUCTION)
 * - config: object (optional)
 * - environmentVars: Record<string, string> (optional, will be encrypted)
 * - allocatedMemoryMb: number (optional, default: 512)
 * - allocatedCpuShares: number (optional, default: 1024)
 *
 * Response:
 * - 201 Created: Created deployment
 * - 400 Bad Request: Validation error or missing workflow/agent
 * - 401 Unauthorized: Not authenticated
 * - 404 Not Found: Workflow or agent not found
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate request body
    const validationResult = createDeploymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Create deployment
    const deployment = await createDeployment(user.userId, {
      name: input.name,
      description: input.description || undefined,
      workflowId: input.workflowId,
      agentId: input.agentId,
      environment: input.environment ? mapEnvironment(input.environment) : undefined,
      config: input.config,
      environmentVars: input.environmentVars,
      allocatedMemoryMb: input.allocatedMemoryMb,
      allocatedCpuShares: input.allocatedCpuShares,
    });

    logger.info('[Deployments Route] Created deployment:', {
      deploymentId: deployment.id,
      userId: user.userId,
      name: deployment.name,
      environment: deployment.environment,
    });

    res.status(201).json(
      createSuccessResponse(
        {
          deployment,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /deployments/:id
 *
 * Update an existing deployment.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Request body: (all optional)
 * - name: string
 * - description: string
 * - environment: Environment
 * - config: object
 * - environmentVars: Record<string, string> (will be re-encrypted)
 * - allocatedMemoryMb: number
 * - allocatedCpuShares: number
 *
 * Response:
 * - 200 OK: Updated deployment
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found or soft-deleted
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Validate request body
    const validationResult = updateDeploymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Check for empty update
    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    // Update deployment
    const deployment = await updateDeployment(
      deploymentId,
      user.userId,
      {
        name: input.name,
        description: input.description === null ? undefined : input.description,
        environment: input.environment ? mapEnvironment(input.environment) : undefined,
        config: input.config,
        environmentVars: input.environmentVars,
        allocatedMemoryMb: input.allocatedMemoryMb,
        allocatedCpuShares: input.allocatedCpuShares,
      },
      isAdmin(req),
    );

    logger.info('[Deployments Route] Updated deployment:', {
      deploymentId: deployment.id,
      userId: user.userId,
      updates: Object.keys(input),
    });

    res.status(200).json(
      createSuccessResponse(
        {
          deployment,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /deployments/:id
 *
 * Soft delete a deployment (sets deletedAt timestamp).
 * Stops the deployment if running before deleting.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Response:
 * - 204 No Content: Deployment deleted
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found or already deleted
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Delete deployment
    await deleteDeployment(deploymentId, user.userId, isAdmin(req));

    logger.info('[Deployments Route] Deleted deployment:', {
      deploymentId,
      userId: user.userId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /deployments/:id/start
 *
 * Start a deployment.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Response:
 * - 200 OK: Deployment starting (status will be STARTING)
 * - 400 Bad Request: Deployment cannot be started (wrong status)
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found
 */
router.post('/:id/start', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Start deployment
    const deployment = await startDeployment(deploymentId, user.userId, isAdmin(req));

    logger.info('[Deployments Route] Starting deployment:', {
      deploymentId,
      userId: user.userId,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          deployment,
          message: 'Deployment is starting',
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /deployments/:id/stop
 *
 * Stop a deployment.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Response:
 * - 200 OK: Deployment stopping (status will be STOPPING)
 * - 400 Bad Request: Deployment cannot be stopped (wrong status)
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found
 */
router.post('/:id/stop', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Stop deployment
    const deployment = await stopDeployment(deploymentId, user.userId, isAdmin(req));

    logger.info('[Deployments Route] Stopping deployment:', {
      deploymentId,
      userId: user.userId,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          deployment,
          message: 'Deployment is stopping',
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /deployments/:id/logs
 *
 * Get deployment logs.
 *
 * Path parameters:
 * - id: Deployment UUID
 *
 * Query parameters:
 * - level: LogLevel filter (DEBUG, INFO, WARN, ERROR, FATAL)
 * - since: ISO timestamp to get logs after
 * - tail: number of most recent logs to return (default: 100, max: 1000)
 *
 * Response:
 * - 200 OK: Array of log entries
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Deployment not found
 */
router.get('/:id/logs', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const deploymentId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(deploymentId);

    // Validate query parameters
    const validationResult = logsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const params = validationResult.data;

    // Get logs
    const logs = await getDeploymentLogs(
      deploymentId,
      user.userId,
      {
        level: params.level ? mapLogLevel(params.level) : undefined,
        since: params.since,
        tail: params.tail,
      },
      isAdmin(req),
    );

    logger.debug('[Deployments Route] Retrieved deployment logs:', {
      deploymentId,
      userId: user.userId,
      count: logs.length,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          logs,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
