/**
 * Deployment Service
 *
 * This service handles all deployment-related operations including
 * creation, retrieval, update, deletion, and lifecycle management.
 *
 * Features:
 * - CRUD operations for deployments
 * - Environment variable encryption/decryption
 * - Deployment lifecycle (start/stop)
 * - Health status tracking
 * - Execution log retrieval
 * - Pagination, filtering, and sorting
 *
 * @module services/deployment.service
 */

import {
  Prisma,
  Environment,
  DeploymentStatus,
  HealthStatus,
  Deployment,
  LogLevel,
} from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import {
  buildPagination,
  buildPaginationMeta,
  buildSoftDeleteFilter,
  buildSearch,
  buildSorting,
  PaginationInput,
  PaginationMeta,
  SortingInput,
  AllowedSortFields,
} from '../lib/queryHelpers';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';
import {
  encryptObject,
  decryptObject,
  maskEnvironmentVariables,
  isEncryptionConfigured,
  EncryptedData,
} from '../utils/encryption';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deployment list filter options
 */
export interface DeploymentListFilters {
  /** Filter by environment */
  environment?: Environment;
  /** Filter by deployment status */
  status?: DeploymentStatus;
  /** Filter by health status */
  healthStatus?: HealthStatus;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by agent ID */
  agentId?: string;
  /** Search query (searches name and description) */
  search?: string;
}

/**
 * Combined query parameters for listing deployments
 */
export interface DeploymentListParams
  extends PaginationInput, SortingInput, DeploymentListFilters {}

/**
 * Paginated deployment list response
 */
export interface PaginatedDeploymentList {
  data: DeploymentWithRelations[];
  meta: PaginationMeta;
}

/**
 * Deployment with related workflow/agent info
 */
export interface DeploymentWithRelations extends Omit<Deployment, 'environmentVars'> {
  environmentVars: Record<string, string>; // Masked values
  workflow?: {
    id: string;
    name: string;
    status: string;
  } | null;
  agent?: {
    id: string;
    name: string;
    type: string;
    status: string;
  } | null;
}

/**
 * Full deployment details with masked env vars
 */
export interface DeploymentDetails extends Omit<Deployment, 'environmentVars'> {
  environmentVars: Record<string, string>; // Masked values
  workflow?: {
    id: string;
    name: string;
    status: string;
    description: string | null;
  } | null;
  agent?: {
    id: string;
    name: string;
    type: string;
    status: string;
    description: string | null;
  } | null;
}

/**
 * Input for creating a new deployment
 */
export interface CreateDeploymentInput {
  name: string;
  description?: string;
  workflowId?: string;
  agentId?: string;
  environment?: Environment;
  config?: Record<string, unknown>;
  environmentVars?: Record<string, string>;
  allocatedMemoryMb?: number;
  allocatedCpuShares?: number;
}

/**
 * Input for updating an existing deployment
 */
export interface UpdateDeploymentInput {
  name?: string;
  description?: string;
  environment?: Environment;
  config?: Record<string, unknown>;
  environmentVars?: Record<string, string>;
  allocatedMemoryMb?: number;
  allocatedCpuShares?: number;
}

/**
 * Deployment log entry
 */
export interface DeploymentLog {
  id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown>;
  stepKey: string | null;
  createdAt: Date;
}

/**
 * Deployment logs filter
 */
export interface DeploymentLogsFilter {
  /** Filter by log level */
  level?: LogLevel;
  /** Get logs since this timestamp */
  since?: Date;
  /** Maximum number of log entries to return */
  tail?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed sort fields for deployment listing
 */
const ALLOWED_SORT_FIELDS: AllowedSortFields<string> = {
  name: 'name',
  environment: 'environment',
  status: 'status',
  healthStatus: 'healthStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deployedAt: 'deployedAt',
  created: 'createdAt',
  updated: 'updatedAt',
};

/**
 * Search fields for deployment listing
 */
const SEARCH_FIELDS = ['name', 'description'];

/**
 * Statuses that indicate a running deployment
 */
const RUNNING_STATUSES: DeploymentStatus[] = [DeploymentStatus.RUNNING, DeploymentStatus.STARTING];

/**
 * Statuses that allow starting a deployment
 */
const STARTABLE_STATUSES: DeploymentStatus[] = [DeploymentStatus.STOPPED, DeploymentStatus.FAILED];

/**
 * Statuses that allow stopping a deployment
 */
const STOPPABLE_STATUSES: DeploymentStatus[] = [
  DeploymentStatus.RUNNING,
  DeploymentStatus.STARTING,
  DeploymentStatus.MAINTENANCE,
];

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
 * Build where clause for deployment queries
 */
const buildDeploymentWhereClause = (
  userId: string,
  filters: DeploymentListFilters,
): Prisma.DeploymentWhereInput => {
  const where: Prisma.DeploymentWhereInput = {
    userId,
    ...buildSoftDeleteFilter('exclude'),
  };

  // Filter by environment
  if (filters.environment) {
    where.environment = filters.environment;
  }

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by health status
  if (filters.healthStatus) {
    where.healthStatus = filters.healthStatus;
  }

  // Filter by workflow
  if (filters.workflowId) {
    where.workflowId = filters.workflowId;
  }

  // Filter by agent
  if (filters.agentId) {
    where.agentId = filters.agentId;
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

  return where;
};

/**
 * Encrypt environment variables for storage
 */
const encryptEnvVars = (envVars: Record<string, string>): Prisma.InputJsonValue => {
  if (!isEncryptionConfigured()) {
    logger.warn('[Deployment Service] Encryption not configured, storing env vars in plain text');
    return envVars as Prisma.InputJsonValue;
  }

  const encrypted = encryptObject(envVars);
  return encrypted as unknown as Prisma.InputJsonValue;
};

/**
 * Decrypt environment variables from storage
 */
const decryptEnvVars = (storedEnvVars: unknown): Record<string, string> => {
  if (!storedEnvVars || typeof storedEnvVars !== 'object') {
    return {};
  }

  const envObj = storedEnvVars as Record<string, unknown>;

  // Check if it's encrypted (has iv, content, tag structure)
  const firstKey = Object.keys(envObj)[0];
  if (firstKey) {
    const firstValue = envObj[firstKey];
    if (
      typeof firstValue === 'object' &&
      firstValue !== null &&
      'iv' in firstValue &&
      'content' in firstValue &&
      'tag' in firstValue
    ) {
      // It's encrypted
      if (!isEncryptionConfigured()) {
        logger.warn('[Deployment Service] Cannot decrypt env vars - encryption not configured');
        return {};
      }
      return decryptObject(envObj as Record<string, EncryptedData>);
    }
  }

  // Plain text (legacy or encryption disabled)
  return envObj as Record<string, string>;
};

/**
 * Transform deployment to include masked env vars and relations
 */
const transformDeployment = (
  deployment: Deployment & {
    workflow?: { id: string; name: string; status: string; description?: string | null } | null;
    agent?: {
      id: string;
      name: string;
      type: string;
      status: string;
      description?: string | null;
    } | null;
  },
  includeRelations: boolean = true,
): DeploymentWithRelations | DeploymentDetails => {
  // Decrypt and mask environment variables
  const decryptedEnvVars = decryptEnvVars(deployment.environmentVars);
  const maskedEnvVars = maskEnvironmentVariables(decryptedEnvVars);

  const result: DeploymentWithRelations | DeploymentDetails = {
    ...deployment,
    environmentVars: maskedEnvVars,
  };

  if (!includeRelations) {
    delete result.workflow;
    delete result.agent;
  }

  return result;
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * List deployments with pagination, filtering, and sorting
 *
 * @param userId - ID of the authenticated user
 * @param params - Query parameters for pagination, filtering, and sorting
 * @returns Paginated list of deployments
 */
export const listDeployments = async (
  userId: string,
  params: DeploymentListParams = {},
): Promise<PaginatedDeploymentList> => {
  ensureDatabase();

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting
  const orderBy = buildSorting(params, ALLOWED_SORT_FIELDS, 'createdAt');

  // Build where clause
  const where = buildDeploymentWhereClause(userId, params);

  // Execute queries in parallel
  const [deployments, totalCount] = await Promise.all([
    prisma!.deployment.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    }),
    prisma!.deployment.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  // Transform deployments
  const transformedDeployments = deployments.map((d) =>
    transformDeployment(d, true),
  ) as DeploymentWithRelations[];

  logger.debug('[Deployment Service] Listed deployments:', {
    userId,
    filters: params,
    count: deployments.length,
    total: totalCount,
  });

  return { data: transformedDeployments, meta };
};

/**
 * Get a single deployment by ID
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Deployment details or null if not found
 */
export const getDeploymentById = async (
  deploymentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<DeploymentDetails | null> => {
  ensureDatabase();

  const deployment = await prisma!.deployment.findFirst({
    where: {
      id: deploymentId,
      ...buildSoftDeleteFilter('exclude'),
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  if (!deployment) {
    return null;
  }

  // Check ownership unless admin
  if (!isAdmin && deployment.userId !== userId) {
    return null;
  }

  logger.debug('[Deployment Service] Retrieved deployment:', {
    deploymentId,
    userId,
  });

  return transformDeployment(deployment, true) as DeploymentDetails;
};

/**
 * Create a new deployment
 *
 * @param userId - ID of the authenticated user
 * @param input - Deployment creation input
 * @returns Created deployment
 */
export const createDeployment = async (
  userId: string,
  input: CreateDeploymentInput,
): Promise<DeploymentDetails> => {
  ensureDatabase();

  // Validate that either workflowId or agentId is provided (not both, not neither)
  if (!input.workflowId && !input.agentId) {
    throw ApiError.badRequest('Either workflowId or agentId must be provided');
  }

  if (input.workflowId && input.agentId) {
    throw ApiError.badRequest('Cannot deploy both a workflow and an agent. Provide only one.');
  }

  // Verify workflow/agent exists and belongs to user
  if (input.workflowId) {
    const workflow = await prisma!.workflow.findFirst({
      where: {
        id: input.workflowId,
        userId,
        deletedAt: null,
      },
    });
    if (!workflow) {
      throw ApiError.notFound('Workflow not found');
    }
  }

  if (input.agentId) {
    const agent = await prisma!.agent.findFirst({
      where: {
        id: input.agentId,
        userId,
        deletedAt: null,
      },
    });
    if (!agent) {
      throw ApiError.notFound('Agent not found');
    }
  }

  // Encrypt environment variables if provided
  const encryptedEnvVars = input.environmentVars ? encryptEnvVars(input.environmentVars) : {};

  const deployment = await prisma!.deployment.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      userId,
      workflowId: input.workflowId || null,
      agentId: input.agentId || null,
      environment: input.environment || Environment.PRODUCTION,
      status: DeploymentStatus.STOPPED,
      healthStatus: HealthStatus.UNKNOWN,
      config: (input.config || {}) as Prisma.InputJsonValue,
      environmentVars: encryptedEnvVars,
      allocatedMemoryMb: input.allocatedMemoryMb ?? 512,
      allocatedCpuShares: input.allocatedCpuShares ?? 1024,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  logger.info('[Deployment Service] Created deployment:', {
    deploymentId: deployment.id,
    userId,
    name: deployment.name,
    environment: deployment.environment,
    workflowId: deployment.workflowId,
    agentId: deployment.agentId,
  });

  return transformDeployment(deployment, true) as DeploymentDetails;
};

/**
 * Update an existing deployment
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user
 * @param input - Deployment update input
 * @param isAdmin - Whether the user is an admin
 * @returns Updated deployment
 * @throws ApiError if deployment not found or not authorized
 */
export const updateDeployment = async (
  deploymentId: string,
  userId: string,
  input: UpdateDeploymentInput,
  isAdmin: boolean = false,
): Promise<DeploymentDetails> => {
  ensureDatabase();

  // First check if deployment exists and user has access
  const existingDeployment = await getDeploymentById(deploymentId, userId, isAdmin);

  if (!existingDeployment) {
    throw ApiError.notFound('Deployment not found');
  }

  // Build update data
  const updateData: Prisma.DeploymentUpdateInput = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }
  if (input.environment !== undefined) {
    updateData.environment = input.environment;
  }
  if (input.config !== undefined) {
    updateData.config = input.config as Prisma.InputJsonValue;
  }
  if (input.environmentVars !== undefined) {
    updateData.environmentVars = encryptEnvVars(input.environmentVars);
  }
  if (input.allocatedMemoryMb !== undefined) {
    updateData.allocatedMemoryMb = input.allocatedMemoryMb;
  }
  if (input.allocatedCpuShares !== undefined) {
    updateData.allocatedCpuShares = input.allocatedCpuShares;
  }

  const deployment = await prisma!.deployment.update({
    where: { id: deploymentId },
    data: updateData,
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  logger.info('[Deployment Service] Updated deployment:', {
    deploymentId,
    userId,
    updates: Object.keys(updateData),
  });

  return transformDeployment(deployment, true) as DeploymentDetails;
};

/**
 * Soft delete a deployment
 *
 * Stops the deployment if running before deleting.
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @throws ApiError if deployment not found or not authorized
 */
export const deleteDeployment = async (
  deploymentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<void> => {
  ensureDatabase();

  // First check if deployment exists and user has access
  const existingDeployment = await getDeploymentById(deploymentId, userId, isAdmin);

  if (!existingDeployment) {
    throw ApiError.notFound('Deployment not found');
  }

  // Stop deployment if running
  if (RUNNING_STATUSES.includes(existingDeployment.status)) {
    await stopDeployment(deploymentId, userId, isAdmin);
  }

  // Soft delete by setting deletedAt
  await prisma!.deployment.update({
    where: { id: deploymentId },
    data: { deletedAt: new Date() },
  });

  logger.info('[Deployment Service] Soft deleted deployment:', {
    deploymentId,
    userId,
  });
};

/**
 * Start a deployment
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @returns Updated deployment
 * @throws ApiError if deployment not found, not authorized, or cannot be started
 */
export const startDeployment = async (
  deploymentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<DeploymentDetails> => {
  ensureDatabase();

  // First check if deployment exists and user has access
  const existingDeployment = await getDeploymentById(deploymentId, userId, isAdmin);

  if (!existingDeployment) {
    throw ApiError.notFound('Deployment not found');
  }

  // Validate deployment can be started
  if (!STARTABLE_STATUSES.includes(existingDeployment.status)) {
    throw ApiError.badRequest(
      `Cannot start deployment. Current status: ${existingDeployment.status}. Deployment must be STOPPED or FAILED to start.`,
    );
  }

  // Update status to STARTING
  const deployment = await prisma!.deployment.update({
    where: { id: deploymentId },
    data: {
      status: DeploymentStatus.STARTING,
      healthStatus: HealthStatus.UNKNOWN,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  // TODO: In the future, this would trigger actual deployment start via BullMQ
  // For now, we just update the status and simulate a successful start
  // The actual start logic would be in the queue processor

  // Simulate successful start after a brief delay (in production, this would be async via BullMQ)
  setTimeout(() => {
    void (async () => {
      try {
        await prisma!.deployment.update({
          where: { id: deploymentId },
          data: {
            status: DeploymentStatus.RUNNING,
            healthStatus: HealthStatus.HEALTHY,
            deployedAt: new Date(),
            lastHealthCheckAt: new Date(),
          },
        });
        logger.info('[Deployment Service] Deployment started successfully:', {
          deploymentId,
        });
      } catch (error) {
        logger.error('[Deployment Service] Failed to update deployment status:', {
          deploymentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  }, 1000);

  logger.info('[Deployment Service] Starting deployment:', {
    deploymentId,
    userId,
  });

  return transformDeployment(deployment, true) as DeploymentDetails;
};

/**
 * Stop a deployment
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @returns Updated deployment
 * @throws ApiError if deployment not found, not authorized, or cannot be stopped
 */
export const stopDeployment = async (
  deploymentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<DeploymentDetails> => {
  ensureDatabase();

  // First check if deployment exists and user has access
  const existingDeployment = await getDeploymentById(deploymentId, userId, isAdmin);

  if (!existingDeployment) {
    throw ApiError.notFound('Deployment not found');
  }

  // Validate deployment can be stopped
  if (!STOPPABLE_STATUSES.includes(existingDeployment.status)) {
    throw ApiError.badRequest(
      `Cannot stop deployment. Current status: ${existingDeployment.status}. Deployment must be RUNNING, STARTING, or MAINTENANCE to stop.`,
    );
  }

  // Update status to STOPPING
  const deployment = await prisma!.deployment.update({
    where: { id: deploymentId },
    data: {
      status: DeploymentStatus.STOPPING,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
        },
      },
    },
  });

  // TODO: In the future, this would trigger actual deployment stop via BullMQ
  // For now, we just update the status and simulate a successful stop

  // Simulate successful stop after a brief delay (in production, this would be async via BullMQ)
  setTimeout(() => {
    void (async () => {
      try {
        await prisma!.deployment.update({
          where: { id: deploymentId },
          data: {
            status: DeploymentStatus.STOPPED,
            healthStatus: HealthStatus.UNKNOWN,
          },
        });
        logger.info('[Deployment Service] Deployment stopped successfully:', {
          deploymentId,
        });
      } catch (error) {
        logger.error('[Deployment Service] Failed to update deployment status:', {
          deploymentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  }, 1000);

  logger.info('[Deployment Service] Stopping deployment:', {
    deploymentId,
    userId,
  });

  return transformDeployment(deployment, true) as DeploymentDetails;
};

/**
 * Get deployment logs
 *
 * Queries execution logs related to the deployment's workflow.
 *
 * @param deploymentId - Deployment ID
 * @param userId - ID of the authenticated user
 * @param filter - Log filter options
 * @param isAdmin - Whether the user is an admin
 * @returns Array of log entries
 * @throws ApiError if deployment not found or not authorized
 */
export const getDeploymentLogs = async (
  deploymentId: string,
  userId: string,
  filter: DeploymentLogsFilter = {},
  isAdmin: boolean = false,
): Promise<DeploymentLog[]> => {
  ensureDatabase();

  // First check if deployment exists and user has access
  const existingDeployment = await getDeploymentById(deploymentId, userId, isAdmin);

  if (!existingDeployment) {
    throw ApiError.notFound('Deployment not found');
  }

  // If deployment has no workflow, return stub logs
  if (!existingDeployment.workflowId) {
    logger.debug('[Deployment Service] No workflow for deployment, returning stub logs:', {
      deploymentId,
    });
    return generateStubLogs(deploymentId, filter);
  }

  // Build where clause for logs
  const where: Prisma.ExecutionLogWhereInput = {
    execution: {
      workflowId: existingDeployment.workflowId,
    },
  };

  // Filter by level
  if (filter.level) {
    where.level = filter.level;
  }

  // Filter by timestamp
  if (filter.since) {
    where.createdAt = { gte: filter.since };
  }

  // Query logs
  const logs = await prisma!.executionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filter.tail || 100,
    select: {
      id: true,
      level: true,
      message: true,
      metadata: true,
      stepKey: true,
      createdAt: true,
    },
  });

  logger.debug('[Deployment Service] Retrieved deployment logs:', {
    deploymentId,
    count: logs.length,
    filter,
  });

  return logs.map((log) => ({
    ...log,
    metadata: (log.metadata as Record<string, unknown>) || {},
  }));
};

/**
 * Generate stub logs for deployments without workflows or with no execution history
 */
const generateStubLogs = (deploymentId: string, filter: DeploymentLogsFilter): DeploymentLog[] => {
  const now = new Date();
  const stubLogs: DeploymentLog[] = [
    {
      id: `stub-${deploymentId}-1`,
      level: LogLevel.INFO,
      message: 'Deployment initialized',
      metadata: { deploymentId },
      stepKey: null,
      createdAt: new Date(now.getTime() - 60000),
    },
    {
      id: `stub-${deploymentId}-2`,
      level: LogLevel.INFO,
      message: 'Waiting for deployment to start',
      metadata: { deploymentId },
      stepKey: null,
      createdAt: now,
    },
  ];

  // Apply filters
  let filteredLogs = stubLogs;

  if (filter.level) {
    filteredLogs = filteredLogs.filter((log) => log.level === filter.level);
  }

  if (filter.since) {
    filteredLogs = filteredLogs.filter((log) => log.createdAt >= filter.since!);
  }

  if (filter.tail) {
    filteredLogs = filteredLogs.slice(-filter.tail);
  }

  return filteredLogs;
};

/**
 * Check if user owns a deployment
 *
 * @param deploymentId - Deployment ID
 * @param userId - User ID
 * @returns True if user owns the deployment
 */
export const userOwnsDeployment = async (
  deploymentId: string,
  userId: string,
): Promise<boolean> => {
  ensureDatabase();

  const deployment = await prisma!.deployment.findFirst({
    where: {
      id: deploymentId,
      userId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return deployment !== null;
};

export default {
  listDeployments,
  getDeploymentById,
  createDeployment,
  updateDeployment,
  deleteDeployment,
  startDeployment,
  stopDeployment,
  getDeploymentLogs,
  userOwnsDeployment,
};
