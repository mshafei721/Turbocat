/**
 * Template Service
 *
 * This service handles all template-related operations including
 * listing, retrieval, and instantiation of templates.
 *
 * Features:
 * - List public templates (unauthenticated access)
 * - Filter by category, type, isOfficial, isPublic
 * - Search and tag filtering
 * - Pagination and sorting
 * - Template instantiation (create agent/workflow from template)
 * - Usage count tracking
 *
 * @module services/template.service
 */

import {
  Prisma,
  TemplateType,
  Template,
  Agent,
  Workflow,
  AgentType,
  AgentStatus,
  WorkflowStatus,
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
 * Template list filter options
 */
export interface TemplateListFilters {
  /** Filter by template category */
  category?: string;
  /** Filter by template type (AGENT, WORKFLOW, STEP) */
  type?: TemplateType;
  /** Filter by official templates */
  isOfficial?: boolean;
  /** Filter by public templates */
  isPublic?: boolean;
  /** Search query (searches name and description) */
  search?: string;
  /** Filter by tags (any match) */
  tags?: string[];
}

/**
 * Combined query parameters for listing templates
 */
export interface TemplateListParams extends PaginationInput, SortingInput, TemplateListFilters {}

/**
 * Paginated template list response
 */
export interface PaginatedTemplateList {
  data: Template[];
  meta: PaginationMeta;
}

/**
 * Template data structure for agent templates
 */
export interface AgentTemplateData {
  name?: string;
  description?: string;
  type: string;
  config?: Record<string, unknown>;
  capabilities?: unknown[];
  parameters?: Record<string, unknown>;
  maxExecutionTime?: number;
  maxMemoryMb?: number;
  maxConcurrentExecutions?: number;
  tags?: string[];
}

/**
 * Workflow step template data
 */
export interface WorkflowStepTemplateData {
  stepKey: string;
  stepName: string;
  stepType: string;
  position: number;
  config?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  dependsOn?: string[];
  retryCount?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  onError?: string;
}

/**
 * Template data structure for workflow templates
 */
export interface WorkflowTemplateData {
  name?: string;
  description?: string;
  definition?: Record<string, unknown>;
  triggerConfig?: Record<string, unknown>;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleTimezone?: string;
  tags?: string[];
  steps?: WorkflowStepTemplateData[];
}

/**
 * Input for instantiating a template
 */
export interface InstantiateTemplateInput {
  /** Custom name for the created resource */
  name?: string;
  /** Custom description */
  description?: string;
  /** Custom tags */
  tags?: string[];
  /** Custom configuration overrides */
  config?: Record<string, unknown>;
  /** Whether to make the resource public */
  isPublic?: boolean;
}

/**
 * Result of template instantiation
 */
export interface InstantiateTemplateResult {
  /** Type of resource created */
  resourceType: 'agent' | 'workflow';
  /** The created resource (Agent or Workflow) */
  resource: Agent | Workflow;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed sort fields for template listing
 * Maps API field names to database field names
 */
const ALLOWED_SORT_FIELDS: AllowedSortFields<string> = {
  name: 'name',
  category: 'category',
  type: 'type',
  usageCount: 'usageCount',
  ratingAverage: 'ratingAverage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  created: 'createdAt',
  updated: 'updatedAt',
  popular: 'usageCount',
  rating: 'ratingAverage',
};

/**
 * Search fields for template listing
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
 * Build where clause for public template queries (unauthenticated)
 */
const buildPublicTemplateWhereClause = (
  filters: TemplateListFilters,
): Prisma.TemplateWhereInput => {
  const where: Prisma.TemplateWhereInput = {
    isPublic: true,
    ...buildSoftDeleteFilter('exclude'),
  };

  // Filter by category
  if (filters.category) {
    where.category = filters.category;
  }

  // Filter by type
  if (filters.type) {
    where.type = filters.type;
  }

  // Filter by official status
  if (typeof filters.isOfficial === 'boolean') {
    where.isOfficial = filters.isOfficial;
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
 * Build where clause for authenticated template queries
 * Includes both public templates and user's private templates
 */
const buildAuthenticatedTemplateWhereClause = (
  userId: string,
  filters: TemplateListFilters,
): Prisma.TemplateWhereInput => {
  const baseConditions: Prisma.TemplateWhereInput = {
    ...buildSoftDeleteFilter('exclude'),
  };

  // Filter by category
  if (filters.category) {
    baseConditions.category = filters.category;
  }

  // Filter by type
  if (filters.type) {
    baseConditions.type = filters.type;
  }

  // Filter by official status
  if (typeof filters.isOfficial === 'boolean') {
    baseConditions.isOfficial = filters.isOfficial;
  }

  // Search filter
  if (filters.search) {
    const searchFilter = buildSearch({
      query: filters.search,
      fields: SEARCH_FIELDS,
      caseInsensitive: true,
    });
    if (searchFilter) {
      Object.assign(baseConditions, searchFilter);
    }
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const tagsFilter = buildTagsFilter('tags', { anyOf: filters.tags });
    Object.assign(baseConditions, tagsFilter);
  }

  // Handle public/private filtering
  if (typeof filters.isPublic === 'boolean') {
    if (filters.isPublic) {
      // Only public templates
      return { ...baseConditions, isPublic: true };
    } else {
      // Only user's private templates
      return { ...baseConditions, isPublic: false, userId };
    }
  }

  // Default: public OR user's own templates
  return {
    ...baseConditions,
    OR: [{ isPublic: true }, { userId }],
  };
};

/**
 * Map string to AgentType enum
 */
const mapAgentType = (type: string): AgentType => {
  const typeMap: Record<string, AgentType> = {
    CODE: AgentType.CODE,
    API: AgentType.API,
    LLM: AgentType.LLM,
    DATA: AgentType.DATA,
    WORKFLOW: AgentType.WORKFLOW,
    code: AgentType.CODE,
    api: AgentType.API,
    llm: AgentType.LLM,
    data: AgentType.DATA,
    workflow: AgentType.WORKFLOW,
  };
  return typeMap[type] || AgentType.CODE;
};

/**
 * Map string to WorkflowStepType enum
 */
const mapWorkflowStepType = (type: string): WorkflowStepType => {
  const typeMap: Record<string, WorkflowStepType> = {
    AGENT: WorkflowStepType.AGENT,
    CONDITION: WorkflowStepType.CONDITION,
    LOOP: WorkflowStepType.LOOP,
    PARALLEL: WorkflowStepType.PARALLEL,
    WAIT: WorkflowStepType.WAIT,
    agent: WorkflowStepType.AGENT,
    condition: WorkflowStepType.CONDITION,
    loop: WorkflowStepType.LOOP,
    parallel: WorkflowStepType.PARALLEL,
    wait: WorkflowStepType.WAIT,
  };
  return typeMap[type] || WorkflowStepType.AGENT;
};

/**
 * Map string to ErrorHandling enum
 */
const mapErrorHandling = (handling: string): ErrorHandling => {
  const handlingMap: Record<string, ErrorHandling> = {
    FAIL: ErrorHandling.FAIL,
    CONTINUE: ErrorHandling.CONTINUE,
    RETRY: ErrorHandling.RETRY,
    fail: ErrorHandling.FAIL,
    continue: ErrorHandling.CONTINUE,
    retry: ErrorHandling.RETRY,
  };
  return handlingMap[handling] || ErrorHandling.FAIL;
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * List templates with pagination, filtering, and sorting
 *
 * @param userId - ID of the authenticated user (optional - null for public access)
 * @param params - Query parameters for pagination, filtering, and sorting
 * @returns Paginated list of templates
 */
export const listTemplates = async (
  userId: string | null,
  params: TemplateListParams = {},
): Promise<PaginatedTemplateList> => {
  ensureDatabase();

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting (default to usageCount desc for popularity)
  const orderBy = buildSorting(params, ALLOWED_SORT_FIELDS, 'usageCount');

  // Build where clause based on authentication
  const where = userId
    ? buildAuthenticatedTemplateWhereClause(userId, params)
    : buildPublicTemplateWhereClause(params);

  // Execute queries in parallel
  const [templates, totalCount] = await Promise.all([
    prisma!.template.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma!.template.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  logger.debug('[Template Service] Listed templates:', {
    userId,
    filters: params,
    count: templates.length,
    total: totalCount,
  });

  return { data: templates, meta };
};

/**
 * Get a single template by ID
 *
 * @param templateId - Template ID
 * @param userId - ID of the authenticated user (optional - null for public access)
 * @returns Template or null if not found/not accessible
 */
export const getTemplateById = async (
  templateId: string,
  userId: string | null,
): Promise<Template | null> => {
  ensureDatabase();

  const template = await prisma!.template.findFirst({
    where: {
      id: templateId,
      ...buildSoftDeleteFilter('exclude'),
    },
  });

  if (!template) {
    return null;
  }

  // Check access: public OR owned by user
  if (!template.isPublic && template.userId !== userId) {
    logger.debug('[Template Service] Access denied to private template:', {
      templateId,
      userId,
      ownerId: template.userId,
    });
    return null;
  }

  logger.debug('[Template Service] Retrieved template:', { templateId, userId });

  return template;
};

/**
 * Instantiate a template - create an agent or workflow from it
 *
 * @param templateId - Template ID
 * @param userId - ID of the authenticated user (required)
 * @param input - Customization options
 * @returns Created resource (agent or workflow)
 * @throws ApiError if template not found or instantiation fails
 */
export const instantiateTemplate = async (
  templateId: string,
  userId: string,
  input: InstantiateTemplateInput = {},
): Promise<InstantiateTemplateResult> => {
  ensureDatabase();

  // Get template
  const template = await getTemplateById(templateId, userId);

  if (!template) {
    throw ApiError.notFound('Template not found');
  }

  // Parse template data
  const templateData = template.templateData as Record<string, unknown>;

  // Instantiate based on template type
  let result: InstantiateTemplateResult;

  if (template.type === TemplateType.AGENT) {
    result = await instantiateAgentTemplate(template, templateData, userId, input);
  } else if (template.type === TemplateType.WORKFLOW) {
    result = await instantiateWorkflowTemplate(template, templateData, userId, input);
  } else {
    throw ApiError.badRequest(`Cannot instantiate template of type "${template.type}" directly`);
  }

  // Increment usage count asynchronously
  prisma!.template
    .update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    })
    .catch((error) => {
      logger.error('[Template Service] Failed to increment usage count:', {
        templateId,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  logger.info('[Template Service] Instantiated template:', {
    templateId,
    userId,
    resourceType: result.resourceType,
    resourceId: result.resource.id,
  });

  return result;
};

/**
 * Instantiate an agent template
 */
const instantiateAgentTemplate = async (
  template: Template,
  templateData: Record<string, unknown>,
  userId: string,
  input: InstantiateTemplateInput,
): Promise<InstantiateTemplateResult> => {
  const agentData = templateData as unknown as AgentTemplateData;

  // Merge customizations with template data
  const config = input.config
    ? { ...(agentData.config || {}), ...input.config }
    : agentData.config || {};

  const agent = await prisma!.agent.create({
    data: {
      name: input.name || agentData.name || `${template.name} Agent`,
      description: input.description || agentData.description || template.description || null,
      type: mapAgentType(String(agentData.type || 'CODE')),
      status: AgentStatus.DRAFT,
      version: 1,
      userId,
      config: config as Prisma.InputJsonValue,
      capabilities: (agentData.capabilities || []) as Prisma.InputJsonValue,
      parameters: (agentData.parameters || {}) as Prisma.InputJsonValue,
      maxExecutionTime: agentData.maxExecutionTime ?? 300,
      maxMemoryMb: agentData.maxMemoryMb ?? 512,
      maxConcurrentExecutions: agentData.maxConcurrentExecutions ?? 1,
      tags: input.tags || agentData.tags || [],
      isPublic: input.isPublic ?? false,
    },
  });

  return { resourceType: 'agent', resource: agent };
};

/**
 * Instantiate a workflow template
 */
const instantiateWorkflowTemplate = async (
  template: Template,
  templateData: Record<string, unknown>,
  userId: string,
  input: InstantiateTemplateInput,
): Promise<InstantiateTemplateResult> => {
  const workflowData = templateData as WorkflowTemplateData;

  // Merge customizations with template data
  const definition = input.config
    ? { ...(workflowData.definition || {}), ...input.config }
    : workflowData.definition || {};

  // Create workflow and steps in a transaction
  const workflow = await prisma!.$transaction(async (tx) => {
    // Create workflow
    const newWorkflow = await tx.workflow.create({
      data: {
        name: input.name || workflowData.name || `${template.name} Workflow`,
        description: input.description || workflowData.description || template.description || null,
        userId,
        status: WorkflowStatus.DRAFT,
        version: 1,
        definition: definition as Prisma.InputJsonValue,
        triggerConfig: (workflowData.triggerConfig || {}) as Prisma.InputJsonValue,
        scheduleEnabled: workflowData.scheduleEnabled ?? false,
        scheduleCron: workflowData.scheduleCron || null,
        scheduleTimezone: workflowData.scheduleTimezone || 'UTC',
        tags: input.tags || workflowData.tags || [],
        isPublic: input.isPublic ?? false,
      },
    });

    // Create steps if template has them
    if (workflowData.steps && workflowData.steps.length > 0) {
      await tx.workflowStep.createMany({
        data: workflowData.steps.map((step) => ({
          workflowId: newWorkflow.id,
          stepKey: step.stepKey,
          stepName: step.stepName,
          stepType: mapWorkflowStepType(String(step.stepType || 'AGENT')),
          position: step.position,
          agentId: null, // Templates don't link to specific agents
          config: (step.config || {}) as Prisma.InputJsonValue,
          inputs: (step.inputs || {}) as Prisma.InputJsonValue,
          outputs: (step.outputs || {}) as Prisma.InputJsonValue,
          dependsOn: step.dependsOn || [],
          retryCount: step.retryCount ?? 0,
          retryDelayMs: step.retryDelayMs ?? 1000,
          timeoutMs: step.timeoutMs ?? 30000,
          onError: mapErrorHandling(String(step.onError || 'FAIL')),
        })),
      });
    }

    // Return workflow with steps
    return tx.workflow.findUnique({
      where: { id: newWorkflow.id },
      include: {
        steps: {
          orderBy: { position: 'asc' },
        },
      },
    });
  });

  if (!workflow) {
    throw ApiError.internal('Failed to create workflow from template');
  }

  return { resourceType: 'workflow', resource: workflow };
};

/**
 * Get available template categories
 *
 * @returns List of unique categories
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  ensureDatabase();

  const result = await prisma!.template.findMany({
    where: {
      isPublic: true,
      ...buildSoftDeleteFilter('exclude'),
    },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return result.map((r) => r.category);
};

export default {
  listTemplates,
  getTemplateById,
  instantiateTemplate,
  getTemplateCategories,
};
