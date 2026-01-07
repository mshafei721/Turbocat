/**
 * Workflow Service
 *
 * This service handles all workflow-related operations including
 * creation, retrieval, update, deletion, execution, and version management.
 *
 * Features:
 * - CRUD operations for workflows
 * - Workflow step management in transactions
 * - DAG validation (cycle detection)
 * - Pagination, filtering, and sorting
 * - Soft delete support
 * - Version tracking through parent-child relationships
 * - Execution triggering and history
 *
 * @module services/workflow.service
 */

import {
  Prisma,
  WorkflowStatus,
  Workflow,
  WorkflowStep,
  Execution,
  ExecutionStatus,
  TriggerType,
  WorkflowStepType,
  ErrorHandling,
} from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import {
  buildPagination,
  buildPaginationMeta,
  buildSoftDeleteFilter,
  buildSearch,
  buildTagsFilter,
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
 * Workflow with steps and optional agent info
 */
export interface WorkflowWithSteps extends Workflow {
  steps: (WorkflowStep & {
    agent?: {
      id: string;
      name: string;
      type: string;
      status: string;
    } | null;
  })[];
}

/**
 * Workflow list filter options
 */
export interface WorkflowListFilters {
  /** Filter by workflow status */
  status?: WorkflowStatus;
  /** Search query (searches name and description) */
  search?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by public visibility */
  isPublic?: boolean;
  /** Filter by schedule enabled */
  scheduleEnabled?: boolean;
}

/**
 * Combined query parameters for listing workflows
 */
export interface WorkflowListParams extends PaginationInput, SortingInput, WorkflowListFilters {}

/**
 * Paginated workflow list response
 */
export interface PaginatedWorkflowList {
  data: Workflow[];
  meta: PaginationMeta;
}

/**
 * Input for creating a workflow step
 */
export interface CreateWorkflowStepInput {
  stepKey: string;
  stepName: string;
  stepType: WorkflowStepType;
  position: number;
  agentId?: string;
  config?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  dependsOn?: string[];
  retryCount?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  onError?: ErrorHandling;
}

/**
 * Input for creating a new workflow
 */
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  definition?: Record<string, unknown>;
  triggerConfig?: Record<string, unknown>;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleTimezone?: string;
  tags?: string[];
  isPublic?: boolean;
  steps?: CreateWorkflowStepInput[];
}

/**
 * Input for updating a workflow step
 */
export interface UpdateWorkflowStepInput {
  id?: string; // If provided, update existing step; otherwise create new
  stepKey: string;
  stepName?: string;
  stepType?: WorkflowStepType;
  position?: number;
  agentId?: string | null;
  config?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  dependsOn?: string[];
  retryCount?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  onError?: ErrorHandling;
  _delete?: boolean; // If true, delete this step
}

/**
 * Input for updating an existing workflow
 */
export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  definition?: Record<string, unknown>;
  triggerConfig?: Record<string, unknown>;
  scheduleEnabled?: boolean;
  scheduleCron?: string | null;
  scheduleTimezone?: string;
  tags?: string[];
  isPublic?: boolean;
  steps?: UpdateWorkflowStepInput[];
}

/**
 * Input for executing a workflow
 */
export interface ExecuteWorkflowInput {
  triggerType?: TriggerType;
  triggerData?: Record<string, unknown>;
  inputData?: Record<string, unknown>;
}

/**
 * Execution history list filters
 */
export interface ExecutionListFilters {
  /** Filter by execution status */
  status?: ExecutionStatus;
}

/**
 * Combined query parameters for listing executions
 */
export interface ExecutionListParams extends PaginationInput, SortingInput, ExecutionListFilters {}

/**
 * Paginated execution list response
 */
export interface PaginatedExecutionList {
  data: Execution[];
  meta: PaginationMeta;
}

/**
 * Workflow version history entry
 */
export interface WorkflowVersion {
  id: string;
  name: string;
  version: number;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed sort fields for workflow listing
 * Maps API field names to database field names
 */
const ALLOWED_SORT_FIELDS: AllowedSortFields<string> = {
  name: 'name',
  status: 'status',
  version: 'version',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  created: 'createdAt',
  updated: 'updatedAt',
  lastExecutionAt: 'lastExecutionAt',
  totalExecutions: 'totalExecutions',
};

/**
 * Allowed sort fields for execution listing
 */
const EXECUTION_SORT_FIELDS: AllowedSortFields<string> = {
  createdAt: 'createdAt',
  created: 'createdAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  durationMs: 'durationMs',
  status: 'status',
};

/**
 * Search fields for workflow listing
 */
const SEARCH_FIELDS = ['name', 'description'];

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
 * Build where clause for workflow queries
 */
const buildWorkflowWhereClause = (
  userId: string,
  filters: WorkflowListFilters,
): Prisma.WorkflowWhereInput => {
  const where: Prisma.WorkflowWhereInput = {
    userId,
    ...buildSoftDeleteFilter('exclude'),
  };

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by public visibility
  if (typeof filters.isPublic === 'boolean') {
    where.isPublic = filters.isPublic;
  }

  // Filter by schedule enabled
  if (typeof filters.scheduleEnabled === 'boolean') {
    where.scheduleEnabled = filters.scheduleEnabled;
  }

  // Search filter
  if (filters.search) {
    const searchFilter = buildSearch({
      query: filters.search,
      fields: SEARCH_FIELDS,
      caseInsensitive: true,
    });
    if (searchFilter) {
      Object.assign(where, searchFilter);
    }
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const tagsFilter = buildTagsFilter('tags', { anyOf: filters.tags });
    Object.assign(where, tagsFilter);
  }

  return where;
};

/**
 * Validate DAG structure (detect cycles using DFS)
 *
 * @param steps - Array of workflow steps
 * @throws ApiError if cycles are detected or dependencies are invalid
 */
export const validateDAG = (steps: CreateWorkflowStepInput[]): void => {
  // Build adjacency list from dependsOn relationships
  const stepKeySet = new Set(steps.map((s) => s.stepKey));
  const adjacencyList = new Map<string, string[]>();

  // Initialize adjacency list
  for (const step of steps) {
    adjacencyList.set(step.stepKey, []);
  }

  // Build edges (step depends on its dependsOn, so edge goes from dependency to step)
  for (const step of steps) {
    if (step.dependsOn && step.dependsOn.length > 0) {
      for (const dep of step.dependsOn) {
        // Validate dependency exists
        if (!stepKeySet.has(dep)) {
          throw ApiError.badRequest(`Step "${step.stepKey}" depends on non-existent step "${dep}"`);
        }
        // Add edge from dependency to this step
        const edges = adjacencyList.get(dep) || [];
        edges.push(step.stepKey);
        adjacencyList.set(dep, edges);
      }
    }
  }

  // Detect cycles using DFS with colors (white=unvisited, gray=visiting, black=visited)
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const colors = new Map<string, number>();

  // Initialize all nodes as white
  for (const stepKey of stepKeySet) {
    colors.set(stepKey, WHITE);
  }

  // DFS function that returns true if cycle is detected
  const hasCycle = (node: string, path: string[]): boolean => {
    colors.set(node, GRAY);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      const color = colors.get(neighbor);

      if (color === GRAY) {
        // Found a back edge - cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStart).concat(neighbor);
        throw ApiError.badRequest(`Cycle detected in workflow: ${cyclePath.join(' -> ')}`);
      }

      if (color === WHITE && hasCycle(neighbor, path)) {
        return true;
      }
    }

    colors.set(node, BLACK);
    path.pop();
    return false;
  };

  // Run DFS from each unvisited node
  for (const stepKey of stepKeySet) {
    if (colors.get(stepKey) === WHITE) {
      hasCycle(stepKey, []);
    }
  }
};

/**
 * Validate step dependencies exist and are valid
 *
 * @param steps - Array of workflow steps
 * @throws ApiError if dependencies are invalid
 */
const validateStepDependencies = (steps: CreateWorkflowStepInput[]): void => {
  const stepKeySet = new Set(steps.map((s) => s.stepKey));

  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepKeySet.has(dep)) {
          throw ApiError.badRequest(`Step "${step.stepKey}" depends on non-existent step "${dep}"`);
        }
        if (dep === step.stepKey) {
          throw ApiError.badRequest(`Step "${step.stepKey}" cannot depend on itself`);
        }
      }
    }
  }
};

/**
 * Validate unique step keys
 *
 * @param steps - Array of workflow steps
 * @throws ApiError if duplicate step keys found
 */
const validateUniqueStepKeys = (steps: CreateWorkflowStepInput[]): void => {
  const stepKeys = new Set<string>();

  for (const step of steps) {
    if (stepKeys.has(step.stepKey)) {
      throw ApiError.badRequest(`Duplicate step key: "${step.stepKey}"`);
    }
    stepKeys.add(step.stepKey);
  }
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * List workflows with pagination, filtering, and sorting
 *
 * @param userId - ID of the authenticated user
 * @param params - Query parameters for pagination, filtering, and sorting
 * @returns Paginated list of workflows (without steps)
 */
export const listWorkflows = async (
  userId: string,
  params: WorkflowListParams = {},
): Promise<PaginatedWorkflowList> => {
  ensureDatabase();

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting
  const orderBy = buildSorting(params, ALLOWED_SORT_FIELDS, 'createdAt');

  // Build where clause
  const where = buildWorkflowWhereClause(userId, params);

  // Execute queries in parallel
  const [workflows, totalCount] = await Promise.all([
    prisma!.workflow.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma!.workflow.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  logger.debug('[Workflow Service] Listed workflows:', {
    userId,
    filters: params,
    count: workflows.length,
    total: totalCount,
  });

  return { data: workflows, meta };
};

/**
 * Get a single workflow by ID with steps
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Workflow with steps or null if not found
 */
export const getWorkflowById = async (
  workflowId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<WorkflowWithSteps | null> => {
  ensureDatabase();

  const workflow = await prisma!.workflow.findFirst({
    where: {
      id: workflowId,
      ...buildSoftDeleteFilter('exclude'),
    },
    include: {
      steps: {
        orderBy: { position: 'asc' },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!workflow) {
    return null;
  }

  // Check ownership unless admin
  if (!isAdmin && workflow.userId !== userId) {
    return null;
  }

  logger.debug('[Workflow Service] Retrieved workflow:', { workflowId, userId });

  return workflow;
};

/**
 * Create a new workflow with optional steps
 *
 * @param userId - ID of the authenticated user
 * @param input - Workflow creation input
 * @returns Created workflow with steps
 */
export const createWorkflow = async (
  userId: string,
  input: CreateWorkflowInput,
): Promise<WorkflowWithSteps> => {
  ensureDatabase();

  // Validate steps if provided
  if (input.steps && input.steps.length > 0) {
    validateUniqueStepKeys(input.steps);
    validateStepDependencies(input.steps);
    validateDAG(input.steps);
  }

  // Create workflow and steps in a transaction
  const workflow = await prisma!.$transaction(async (tx) => {
    // Create workflow
    const newWorkflow = await tx.workflow.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        userId,
        status: WorkflowStatus.DRAFT,
        version: 1,
        definition: (input.definition || {}) as Prisma.InputJsonValue,
        triggerConfig: (input.triggerConfig || {}) as Prisma.InputJsonValue,
        scheduleEnabled: input.scheduleEnabled ?? false,
        scheduleCron: input.scheduleCron || null,
        scheduleTimezone: input.scheduleTimezone || 'UTC',
        tags: input.tags || [],
        isPublic: input.isPublic ?? false,
      },
    });

    // Create steps if provided
    if (input.steps && input.steps.length > 0) {
      await tx.workflowStep.createMany({
        data: input.steps.map((step) => ({
          workflowId: newWorkflow.id,
          stepKey: step.stepKey,
          stepName: step.stepName,
          stepType: step.stepType,
          position: step.position,
          agentId: step.agentId || null,
          config: (step.config || {}) as Prisma.InputJsonValue,
          inputs: (step.inputs || {}) as Prisma.InputJsonValue,
          outputs: (step.outputs || {}) as Prisma.InputJsonValue,
          dependsOn: step.dependsOn || [],
          retryCount: step.retryCount ?? 0,
          retryDelayMs: step.retryDelayMs ?? 1000,
          timeoutMs: step.timeoutMs ?? 30000,
          onError: step.onError ?? ErrorHandling.FAIL,
        })),
      });
    }

    // Return workflow with steps
    return tx.workflow.findUnique({
      where: { id: newWorkflow.id },
      include: {
        steps: {
          orderBy: { position: 'asc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
              },
            },
          },
        },
      },
    });
  });

  if (!workflow) {
    throw ApiError.internal('Failed to create workflow');
  }

  logger.info('[Workflow Service] Created workflow:', {
    workflowId: workflow.id,
    userId,
    name: workflow.name,
    stepCount: workflow.steps.length,
  });

  return workflow;
};

/**
 * Update an existing workflow with optional step updates
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param input - Workflow update input
 * @param isAdmin - Whether the user is an admin
 * @returns Updated workflow with steps
 * @throws ApiError if workflow not found or not authorized
 */
export const updateWorkflow = async (
  workflowId: string,
  userId: string,
  input: UpdateWorkflowInput,
  isAdmin: boolean = false,
): Promise<WorkflowWithSteps> => {
  ensureDatabase();

  // First check if workflow exists and user has access
  const existingWorkflow = await getWorkflowById(workflowId, userId, isAdmin);

  if (!existingWorkflow) {
    throw ApiError.notFound('Workflow not found');
  }

  // If steps are being updated, validate them
  if (input.steps) {
    // Get all steps that will exist after update (non-deleted steps)
    const remainingSteps = input.steps.filter((s) => !s._delete);
    const stepInputs: CreateWorkflowStepInput[] = remainingSteps.map((s) => ({
      stepKey: s.stepKey,
      stepName: s.stepName || '',
      stepType: s.stepType || WorkflowStepType.AGENT,
      position: s.position ?? 0,
      agentId: s.agentId || undefined,
      config: s.config,
      inputs: s.inputs,
      outputs: s.outputs,
      dependsOn: s.dependsOn,
      retryCount: s.retryCount,
      retryDelayMs: s.retryDelayMs,
      timeoutMs: s.timeoutMs,
      onError: s.onError,
    }));

    validateUniqueStepKeys(stepInputs);
    validateStepDependencies(stepInputs);
    validateDAG(stepInputs);
  }

  // Update workflow and steps in a transaction
  const workflow = await prisma!.$transaction(async (tx) => {
    // Build update data for workflow
    const updateData: Prisma.WorkflowUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.definition !== undefined) {
      updateData.definition = input.definition as Prisma.InputJsonValue;
    }
    if (input.triggerConfig !== undefined) {
      updateData.triggerConfig = input.triggerConfig as Prisma.InputJsonValue;
    }
    if (input.scheduleEnabled !== undefined) {
      updateData.scheduleEnabled = input.scheduleEnabled;
    }
    if (input.scheduleCron !== undefined) {
      updateData.scheduleCron = input.scheduleCron;
    }
    if (input.scheduleTimezone !== undefined) {
      updateData.scheduleTimezone = input.scheduleTimezone;
    }
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }
    if (input.isPublic !== undefined) {
      updateData.isPublic = input.isPublic;
    }

    // Update workflow metadata
    await tx.workflow.update({
      where: { id: workflowId },
      data: updateData,
    });

    // Handle step updates if provided
    if (input.steps) {
      const stepsToDelete: string[] = [];
      const stepsToUpdate: UpdateWorkflowStepInput[] = [];
      const stepsToCreate: UpdateWorkflowStepInput[] = [];

      for (const step of input.steps) {
        if (step._delete && step.id) {
          stepsToDelete.push(step.id);
        } else if (step.id) {
          stepsToUpdate.push(step);
        } else {
          stepsToCreate.push(step);
        }
      }

      // Delete steps
      if (stepsToDelete.length > 0) {
        await tx.workflowStep.deleteMany({
          where: {
            id: { in: stepsToDelete },
            workflowId,
          },
        });
      }

      // Update existing steps
      for (const step of stepsToUpdate) {
        const stepUpdateData: Prisma.WorkflowStepUpdateInput = {};

        if (step.stepName !== undefined) {
          stepUpdateData.stepName = step.stepName;
        }
        if (step.stepType !== undefined) {
          stepUpdateData.stepType = step.stepType;
        }
        if (step.position !== undefined) {
          stepUpdateData.position = step.position;
        }
        if (step.agentId !== undefined) {
          if (step.agentId === null) {
            stepUpdateData.agent = { disconnect: true };
          } else {
            stepUpdateData.agent = { connect: { id: step.agentId } };
          }
        }
        if (step.config !== undefined) {
          stepUpdateData.config = step.config as Prisma.InputJsonValue;
        }
        if (step.inputs !== undefined) {
          stepUpdateData.inputs = step.inputs as Prisma.InputJsonValue;
        }
        if (step.outputs !== undefined) {
          stepUpdateData.outputs = step.outputs as Prisma.InputJsonValue;
        }
        if (step.dependsOn !== undefined) {
          stepUpdateData.dependsOn = step.dependsOn;
        }
        if (step.retryCount !== undefined) {
          stepUpdateData.retryCount = step.retryCount;
        }
        if (step.retryDelayMs !== undefined) {
          stepUpdateData.retryDelayMs = step.retryDelayMs;
        }
        if (step.timeoutMs !== undefined) {
          stepUpdateData.timeoutMs = step.timeoutMs;
        }
        if (step.onError !== undefined) {
          stepUpdateData.onError = step.onError;
        }

        await tx.workflowStep.update({
          where: { id: step.id },
          data: stepUpdateData,
        });
      }

      // Create new steps
      if (stepsToCreate.length > 0) {
        await tx.workflowStep.createMany({
          data: stepsToCreate.map((step) => ({
            workflowId,
            stepKey: step.stepKey,
            stepName: step.stepName || step.stepKey,
            stepType: step.stepType || WorkflowStepType.AGENT,
            position: step.position ?? 0,
            agentId: step.agentId || null,
            config: (step.config || {}) as Prisma.InputJsonValue,
            inputs: (step.inputs || {}) as Prisma.InputJsonValue,
            outputs: (step.outputs || {}) as Prisma.InputJsonValue,
            dependsOn: step.dependsOn || [],
            retryCount: step.retryCount ?? 0,
            retryDelayMs: step.retryDelayMs ?? 1000,
            timeoutMs: step.timeoutMs ?? 30000,
            onError: step.onError ?? ErrorHandling.FAIL,
          })),
        });
      }
    }

    // Return updated workflow with steps
    return tx.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { position: 'asc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
              },
            },
          },
        },
      },
    });
  });

  if (!workflow) {
    throw ApiError.internal('Failed to update workflow');
  }

  logger.info('[Workflow Service] Updated workflow:', {
    workflowId,
    userId,
    updates: Object.keys(input),
    stepCount: workflow.steps.length,
  });

  return workflow;
};

/**
 * Soft delete a workflow
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @throws ApiError if workflow not found or not authorized
 */
export const deleteWorkflow = async (
  workflowId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<void> => {
  ensureDatabase();

  // First check if workflow exists and user has access
  const existingWorkflow = await getWorkflowById(workflowId, userId, isAdmin);

  if (!existingWorkflow) {
    throw ApiError.notFound('Workflow not found');
  }

  // Soft delete by setting deletedAt
  await prisma!.workflow.update({
    where: { id: workflowId },
    data: { deletedAt: new Date() },
  });

  logger.info('[Workflow Service] Soft deleted workflow:', { workflowId, userId });
};

/**
 * Execute a workflow
 *
 * Creates an execution record and (stub) queues the workflow for execution.
 * Actual BullMQ integration comes in Task Group 18.
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param input - Execution input
 * @param isAdmin - Whether the user is an admin
 * @returns Created execution record
 * @throws ApiError if workflow not found, not authorized, or not active
 */
export const executeWorkflow = async (
  workflowId: string,
  userId: string,
  input: ExecuteWorkflowInput = {},
  isAdmin: boolean = false,
): Promise<Execution> => {
  ensureDatabase();

  // Get workflow
  const workflow = await getWorkflowById(workflowId, userId, isAdmin);

  if (!workflow) {
    throw ApiError.notFound('Workflow not found');
  }

  // Validate workflow is active
  if (workflow.status !== WorkflowStatus.ACTIVE) {
    throw ApiError.badRequest(
      `Cannot execute workflow in "${workflow.status}" status. Workflow must be ACTIVE.`,
    );
  }

  // Validate workflow has steps
  if (workflow.steps.length === 0) {
    throw ApiError.badRequest('Cannot execute workflow with no steps');
  }

  // Create execution record
  const execution = await prisma!.execution.create({
    data: {
      workflowId,
      userId,
      status: ExecutionStatus.PENDING,
      triggerType: input.triggerType || TriggerType.MANUAL,
      triggerData: (input.triggerData || {}) as Prisma.InputJsonValue,
      inputData: (input.inputData || {}) as Prisma.InputJsonValue,
      stepsTotal: workflow.steps.length,
    },
  });

  // TODO: Queue workflow for execution with BullMQ (Task Group 18)
  // For now, just log that execution was created
  logger.info('[Workflow Service] Created workflow execution:', {
    executionId: execution.id,
    workflowId,
    userId,
    triggerType: execution.triggerType,
    stepsTotal: execution.stepsTotal,
  });

  return execution;
};

/**
 * Get execution history for a workflow
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param params - Query parameters for pagination, filtering, and sorting
 * @param isAdmin - Whether the user is an admin
 * @returns Paginated list of executions
 */
export const getWorkflowExecutions = async (
  workflowId: string,
  userId: string,
  params: ExecutionListParams = {},
  isAdmin: boolean = false,
): Promise<PaginatedExecutionList> => {
  ensureDatabase();

  // First verify user has access to the workflow
  const workflow = await getWorkflowById(workflowId, userId, isAdmin);

  if (!workflow) {
    throw ApiError.notFound('Workflow not found');
  }

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting (default to createdAt desc)
  const orderBy = buildSorting(params, EXECUTION_SORT_FIELDS, 'createdAt');

  // Build where clause
  const where: Prisma.ExecutionWhereInput = {
    workflowId,
  };

  if (params.status) {
    where.status = params.status;
  }

  // Execute queries in parallel
  const [executions, totalCount] = await Promise.all([
    prisma!.execution.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma!.execution.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  logger.debug('[Workflow Service] Listed workflow executions:', {
    workflowId,
    userId,
    filters: params,
    count: executions.length,
    total: totalCount,
  });

  return { data: executions, meta };
};

/**
 * Check if user owns a workflow
 *
 * @param workflowId - Workflow ID
 * @param userId - User ID
 * @returns True if user owns the workflow
 */
export const userOwnsWorkflow = async (workflowId: string, userId: string): Promise<boolean> => {
  ensureDatabase();

  const workflow = await prisma!.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return workflow !== null;
};

/**
 * Get version history for a workflow
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @returns List of workflow versions ordered by version descending
 */
export const getWorkflowVersions = async (
  workflowId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<WorkflowVersion[]> => {
  ensureDatabase();

  // Get the workflow first
  const workflow = await getWorkflowById(workflowId, userId, isAdmin);

  if (!workflow) {
    throw ApiError.notFound('Workflow not found');
  }

  // Find the root parent ID
  const rootParentId = workflow.parentId || workflow.id;

  // Get all versions in the tree
  const versions = await prisma!.workflow.findMany({
    where: {
      OR: [{ id: rootParentId }, { parentId: rootParentId }],
    },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      name: true,
      version: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  // Map to version history format
  const versionHistory: WorkflowVersion[] = versions.map((v) => ({
    id: v.id,
    name: v.name,
    version: v.version,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));

  logger.debug('[Workflow Service] Retrieved workflow versions:', {
    workflowId,
    rootParentId,
    versionCount: versionHistory.length,
  });

  return versionHistory;
};

export default {
  listWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowExecutions,
  userOwnsWorkflow,
  getWorkflowVersions,
  validateDAG,
};
