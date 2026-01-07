/**
 * Workflow Routes
 *
 * This module defines all workflow-related API endpoints including
 * listing, creating, updating, deleting, executing, and execution history.
 *
 * Endpoints:
 * - GET    /workflows                   - List workflows (paginated, filtered, sorted)
 * - GET    /workflows/:id               - Get workflow by ID with steps
 * - POST   /workflows                   - Create a new workflow with steps
 * - PATCH  /workflows/:id               - Update a workflow
 * - DELETE /workflows/:id               - Soft delete a workflow
 * - POST   /workflows/:id/execute       - Execute a workflow
 * - GET    /workflows/:id/executions    - Get execution history
 *
 * @module routes/workflows
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  WorkflowStepType,
  ErrorHandling,
} from '@prisma/client';
import {
  listWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowExecutions,
} from '../services/workflow.service';
import { requireAuth, isAdmin } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
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
 * Workflow status enum values
 */
const WorkflowStatusValues = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

/**
 * Execution status enum values
 */
const ExecutionStatusValues = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'TIMEOUT',
] as const;

/**
 * Trigger type enum values
 */
const TriggerTypeValues = ['MANUAL', 'SCHEDULED', 'API', 'WEBHOOK', 'EVENT'] as const;

/**
 * Workflow step type enum values
 */
const WorkflowStepTypeValues = ['AGENT', 'CONDITION', 'LOOP', 'PARALLEL', 'WAIT'] as const;

/**
 * Error handling enum values
 */
const ErrorHandlingValues = ['FAIL', 'CONTINUE', 'RETRY'] as const;

/**
 * Query parameters for listing workflows
 */
const listWorkflowsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(WorkflowStatusValues).optional(),
  search: z.string().max(255).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
  isPublic: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      return undefined;
    }),
  scheduleEnabled: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      return undefined;
    }),
});

/**
 * Workflow step schema for create/update
 */
const workflowStepSchema = z.object({
  id: z.string().uuid().optional(),
  stepKey: z
    .string()
    .min(1, 'Step key is required')
    .max(100, 'Step key must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Step key can only contain letters, numbers, underscores, and hyphens',
    ),
  stepName: z
    .string()
    .min(1, 'Step name is required')
    .max(255, 'Step name must be less than 255 characters'),
  stepType: z.enum(WorkflowStepTypeValues),
  position: z.number().int().min(0),
  agentId: z.string().uuid().optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
  dependsOn: z.array(z.string().max(100)).max(50).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  retryDelayMs: z.number().int().min(0).max(300000).optional(),
  timeoutMs: z.number().int().min(1000).max(3600000).optional(),
  onError: z.enum(ErrorHandlingValues).optional(),
  _delete: z.boolean().optional(),
});

/**
 * Create workflow request body
 */
const createWorkflowSchema = z.object({
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
  definition: z.record(z.string(), z.unknown()).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleCron: z
    .string()
    .max(100, 'Schedule cron must be less than 100 characters')
    .optional()
    .nullable(),
  scheduleTimezone: z
    .string()
    .max(50, 'Schedule timezone must be less than 50 characters')
    .optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  isPublic: z.boolean().optional(),
  steps: z.array(workflowStepSchema).max(100, 'Maximum 100 steps allowed').optional(),
});

/**
 * Update workflow request body
 */
const updateWorkflowSchema = z.object({
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
  status: z.enum(WorkflowStatusValues).optional(),
  definition: z.record(z.string(), z.unknown()).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleCron: z
    .string()
    .max(100, 'Schedule cron must be less than 100 characters')
    .optional()
    .nullable(),
  scheduleTimezone: z
    .string()
    .max(50, 'Schedule timezone must be less than 50 characters')
    .optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  isPublic: z.boolean().optional(),
  steps: z.array(workflowStepSchema).max(100, 'Maximum 100 steps allowed').optional(),
});

/**
 * Execute workflow request body
 */
const executeWorkflowSchema = z.object({
  triggerType: z.enum(TriggerTypeValues).optional(),
  triggerData: z.record(z.string(), z.unknown()).optional(),
  inputData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Query parameters for listing executions
 */
const listExecutionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(ExecutionStatusValues).optional(),
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
 * Map string enum to Prisma WorkflowStatus enum
 */
const mapWorkflowStatus = (status: string): WorkflowStatus => {
  const statusMap: Record<string, WorkflowStatus> = {
    DRAFT: WorkflowStatus.DRAFT,
    ACTIVE: WorkflowStatus.ACTIVE,
    INACTIVE: WorkflowStatus.INACTIVE,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  };
  return statusMap[status] || WorkflowStatus.DRAFT;
};

/**
 * Map string enum to Prisma ExecutionStatus enum
 */
const mapExecutionStatus = (status: string): ExecutionStatus => {
  const statusMap: Record<string, ExecutionStatus> = {
    PENDING: ExecutionStatus.PENDING,
    RUNNING: ExecutionStatus.RUNNING,
    COMPLETED: ExecutionStatus.COMPLETED,
    FAILED: ExecutionStatus.FAILED,
    CANCELLED: ExecutionStatus.CANCELLED,
    TIMEOUT: ExecutionStatus.TIMEOUT,
  };
  return statusMap[status] || ExecutionStatus.PENDING;
};

/**
 * Map string enum to Prisma TriggerType enum
 */
const mapTriggerType = (type: string): TriggerType => {
  const typeMap: Record<string, TriggerType> = {
    MANUAL: TriggerType.MANUAL,
    SCHEDULED: TriggerType.SCHEDULED,
    API: TriggerType.API,
    WEBHOOK: TriggerType.WEBHOOK,
    EVENT: TriggerType.EVENT,
  };
  return typeMap[type] || TriggerType.MANUAL;
};

/**
 * Map string enum to Prisma WorkflowStepType enum
 */
const mapWorkflowStepType = (type: string): WorkflowStepType => {
  const typeMap: Record<string, WorkflowStepType> = {
    AGENT: WorkflowStepType.AGENT,
    CONDITION: WorkflowStepType.CONDITION,
    LOOP: WorkflowStepType.LOOP,
    PARALLEL: WorkflowStepType.PARALLEL,
    WAIT: WorkflowStepType.WAIT,
  };
  return typeMap[type] || WorkflowStepType.AGENT;
};

/**
 * Map string enum to Prisma ErrorHandling enum
 */
const mapErrorHandling = (handling: string): ErrorHandling => {
  const handlingMap: Record<string, ErrorHandling> = {
    FAIL: ErrorHandling.FAIL,
    CONTINUE: ErrorHandling.CONTINUE,
    RETRY: ErrorHandling.RETRY,
  };
  return handlingMap[handling] || ErrorHandling.FAIL;
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /workflows
 *
 * List workflows for the authenticated user with pagination, filtering, and sorting.
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - sortBy: string (name, status, version, createdAt, updatedAt, lastExecutionAt, totalExecutions)
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - status: WorkflowStatus filter
 * - search: string (searches name and description)
 * - tags: comma-separated list of tags
 * - isPublic: boolean filter
 * - scheduleEnabled: boolean filter
 *
 * Response:
 * - 200 OK: Paginated list of workflows (without steps)
 * - 401 Unauthorized: Not authenticated
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate query parameters
    const validationResult = listWorkflowsQuerySchema.safeParse(req.query);

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
      status: params.status ? mapWorkflowStatus(params.status) : undefined,
      search: params.search,
      tags: params.tags,
      isPublic: params.isPublic,
      scheduleEnabled: params.scheduleEnabled,
    };

    // List workflows
    const result = await listWorkflows(user.userId, filterParams);

    logger.debug('[Workflows Route] Listed workflows:', {
      userId: user.userId,
      count: result.data.length,
      total: result.meta.totalItems,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          workflows: result.data,
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
 * GET /workflows/:id
 *
 * Get a single workflow by ID with all steps.
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Response:
 * - 200 OK: Workflow with steps
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found or soft-deleted
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const workflowId = req.params.id!;

    // Validate UUID
    validateUuid(workflowId);

    // Get workflow with steps
    const workflow = await getWorkflowById(workflowId, user.userId, isAdmin(req));

    if (!workflow) {
      throw ApiError.notFound('Workflow not found');
    }

    // Check ownership (admin can bypass)
    if (workflow.userId !== user.userId && !isAdmin(req)) {
      throw ApiError.forbidden('You do not have permission to access this workflow');
    }

    logger.debug('[Workflows Route] Retrieved workflow:', { workflowId, userId: user.userId });

    res.status(200).json(
      createSuccessResponse(
        {
          workflow,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /workflows
 *
 * Create a new workflow with optional steps.
 *
 * Request body:
 * - name: string (required)
 * - description: string (optional)
 * - definition: object (optional)
 * - triggerConfig: object (optional)
 * - scheduleEnabled: boolean (optional, default: false)
 * - scheduleCron: string (optional)
 * - scheduleTimezone: string (optional, default: 'UTC')
 * - tags: string[] (optional)
 * - isPublic: boolean (optional, default: false)
 * - steps: WorkflowStep[] (optional)
 *
 * Response:
 * - 201 Created: Created workflow with steps
 * - 400 Bad Request: Validation error or DAG validation failed
 * - 401 Unauthorized: Not authenticated
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate request body
    const validationResult = createWorkflowSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Map steps with proper types
    const mappedSteps = input.steps?.map((step) => ({
      stepKey: step.stepKey,
      stepName: step.stepName,
      stepType: mapWorkflowStepType(step.stepType),
      position: step.position,
      agentId: step.agentId || undefined,
      config: step.config,
      inputs: step.inputs,
      outputs: step.outputs,
      dependsOn: step.dependsOn,
      retryCount: step.retryCount,
      retryDelayMs: step.retryDelayMs,
      timeoutMs: step.timeoutMs,
      onError: step.onError ? mapErrorHandling(step.onError) : undefined,
    }));

    // Create workflow
    const workflow = await createWorkflow(user.userId, {
      name: input.name,
      description: input.description || undefined,
      definition: input.definition,
      triggerConfig: input.triggerConfig,
      scheduleEnabled: input.scheduleEnabled,
      scheduleCron: input.scheduleCron ?? undefined,
      scheduleTimezone: input.scheduleTimezone,
      tags: input.tags,
      isPublic: input.isPublic,
      steps: mappedSteps,
    });

    logger.info('[Workflows Route] Created workflow:', {
      workflowId: workflow.id,
      userId: user.userId,
      name: workflow.name,
      stepCount: workflow.steps.length,
    });

    res.status(201).json(
      createSuccessResponse(
        {
          workflow,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /workflows/:id
 *
 * Update an existing workflow with optional step updates.
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Request body: (all optional)
 * - name: string
 * - description: string
 * - status: WorkflowStatus
 * - definition: object
 * - triggerConfig: object
 * - scheduleEnabled: boolean
 * - scheduleCron: string
 * - scheduleTimezone: string
 * - tags: string[]
 * - isPublic: boolean
 * - steps: WorkflowStep[] (with id for update, _delete for removal, without id for creation)
 *
 * Response:
 * - 200 OK: Updated workflow with steps
 * - 400 Bad Request: Validation error or DAG validation failed
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found or soft-deleted
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const workflowId = req.params.id!;

    // Validate UUID
    validateUuid(workflowId);

    // Validate request body
    const validationResult = updateWorkflowSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Check for empty update
    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    // Map steps with proper types
    const mappedSteps = input.steps?.map((step) => ({
      id: step.id,
      stepKey: step.stepKey,
      stepName: step.stepName,
      stepType: step.stepType ? mapWorkflowStepType(step.stepType) : undefined,
      position: step.position,
      agentId: step.agentId,
      config: step.config,
      inputs: step.inputs,
      outputs: step.outputs,
      dependsOn: step.dependsOn,
      retryCount: step.retryCount,
      retryDelayMs: step.retryDelayMs,
      timeoutMs: step.timeoutMs,
      onError: step.onError ? mapErrorHandling(step.onError) : undefined,
      _delete: step._delete,
    }));

    // Update workflow
    const workflow = await updateWorkflow(
      workflowId,
      user.userId,
      {
        name: input.name,
        description: input.description === null ? undefined : input.description,
        status: input.status ? mapWorkflowStatus(input.status) : undefined,
        definition: input.definition,
        triggerConfig: input.triggerConfig,
        scheduleEnabled: input.scheduleEnabled,
        scheduleCron: input.scheduleCron,
        scheduleTimezone: input.scheduleTimezone,
        tags: input.tags,
        isPublic: input.isPublic,
        steps: mappedSteps,
      },
      isAdmin(req),
    );

    logger.info('[Workflows Route] Updated workflow:', {
      workflowId: workflow.id,
      userId: user.userId,
      updates: Object.keys(input),
      stepCount: workflow.steps.length,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          workflow,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /workflows/:id
 *
 * Soft delete a workflow (sets deletedAt timestamp).
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Response:
 * - 204 No Content: Workflow deleted
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found or already deleted
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const workflowId = req.params.id!;

    // Validate UUID
    validateUuid(workflowId);

    // Delete workflow
    await deleteWorkflow(workflowId, user.userId, isAdmin(req));

    logger.info('[Workflows Route] Deleted workflow:', { workflowId, userId: user.userId });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /workflows/:id/execute
 *
 * Execute a workflow (creates execution record and queues for execution).
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Request body:
 * - triggerType: TriggerType (optional, default: 'MANUAL')
 * - triggerData: object (optional)
 * - inputData: object (optional)
 *
 * Response:
 * - 201 Created: Execution record with ID and status
 * - 400 Bad Request: Workflow not active or has no steps
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found
 */
router.post(
  '/:id/execute',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const workflowId = req.params.id!;

      // Validate UUID
      validateUuid(workflowId);

      // Validate request body
      const validationResult = executeWorkflowSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw handleValidationError(validationResult.error);
      }

      const input = validationResult.data;

      // Execute workflow
      const execution = await executeWorkflow(
        workflowId,
        user.userId,
        {
          triggerType: input.triggerType ? mapTriggerType(input.triggerType) : undefined,
          triggerData: input.triggerData,
          inputData: input.inputData,
        },
        isAdmin(req),
      );

      logger.info('[Workflows Route] Initiated workflow execution:', {
        executionId: execution.id,
        workflowId,
        userId: user.userId,
        triggerType: execution.triggerType,
      });

      res.status(201).json(
        createSuccessResponse(
          {
            execution: {
              id: execution.id,
              workflowId: execution.workflowId,
              status: execution.status,
              triggerType: execution.triggerType,
              stepsTotal: execution.stepsTotal,
              createdAt: execution.createdAt,
            },
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
 * GET /workflows/:id/executions
 *
 * Get execution history for a workflow.
 *
 * Path parameters:
 * - id: Workflow UUID
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - sortBy: string (createdAt, startedAt, completedAt, durationMs, status)
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - status: ExecutionStatus filter
 *
 * Response:
 * - 200 OK: Paginated list of executions
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not owner and not admin
 * - 404 Not Found: Workflow not found
 */
router.get(
  '/:id/executions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const workflowId = req.params.id!;

      // Validate UUID
      validateUuid(workflowId);

      // Validate query parameters
      const validationResult = listExecutionsQuerySchema.safeParse(req.query);

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
        status: params.status ? mapExecutionStatus(params.status) : undefined,
      };

      // Get executions
      const result = await getWorkflowExecutions(
        workflowId,
        user.userId,
        filterParams,
        isAdmin(req),
      );

      logger.debug('[Workflows Route] Listed workflow executions:', {
        workflowId,
        userId: user.userId,
        count: result.data.length,
        total: result.meta.totalItems,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            executions: result.data,
            pagination: result.meta,
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
