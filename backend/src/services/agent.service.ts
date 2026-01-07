/**
 * Agent Service
 *
 * This service handles all agent-related operations including
 * creation, retrieval, update, deletion, duplication, and version management.
 *
 * Features:
 * - CRUD operations for agents
 * - Pagination, filtering, and sorting
 * - Soft delete support
 * - Version tracking through parent-child relationships
 * - Agent duplication with version increment
 *
 * @module services/agent.service
 */

import { Prisma, AgentType, AgentStatus, Agent } from '@prisma/client';
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
 * Agent list filter options
 */
export interface AgentListFilters {
  /** Filter by agent type */
  type?: AgentType;
  /** Filter by agent status */
  status?: AgentStatus;
  /** Search query (searches name and description) */
  search?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by public visibility */
  isPublic?: boolean;
}

/**
 * Combined query parameters for listing agents
 */
export interface AgentListParams extends PaginationInput, SortingInput, AgentListFilters {}

/**
 * Paginated agent list response
 */
export interface PaginatedAgentList {
  data: Agent[];
  meta: PaginationMeta;
}

/**
 * Input for creating a new agent
 */
export interface CreateAgentInput {
  name: string;
  description?: string;
  type: AgentType;
  config?: Record<string, unknown>;
  capabilities?: unknown[];
  parameters?: Record<string, unknown>;
  maxExecutionTime?: number;
  maxMemoryMb?: number;
  maxConcurrentExecutions?: number;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Input for updating an existing agent
 */
export interface UpdateAgentInput {
  name?: string;
  description?: string;
  status?: AgentStatus;
  config?: Record<string, unknown>;
  capabilities?: unknown[];
  parameters?: Record<string, unknown>;
  maxExecutionTime?: number;
  maxMemoryMb?: number;
  maxConcurrentExecutions?: number;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Input for duplicating an agent
 */
export interface DuplicateAgentInput {
  /** Custom name for duplicated agent (defaults to "Copy of {original}") */
  name?: string;
}

/**
 * Agent version history entry
 */
export interface AgentVersion {
  id: string;
  name: string;
  version: number;
  status: AgentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Allowed sort fields for agent listing
 * Maps API field names to database field names
 */
const ALLOWED_SORT_FIELDS: AllowedSortFields<string> = {
  name: 'name',
  type: 'type',
  status: 'status',
  version: 'version',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  created: 'createdAt',
  updated: 'updatedAt',
};

/**
 * Search fields for agent listing
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
 * Build where clause for agent queries
 */
const buildAgentWhereClause = (
  userId: string,
  filters: AgentListFilters,
): Prisma.AgentWhereInput => {
  const where: Prisma.AgentWhereInput = {
    userId,
    ...buildSoftDeleteFilter('exclude'),
  };

  // Filter by type
  if (filters.type) {
    where.type = filters.type;
  }

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by public visibility
  if (typeof filters.isPublic === 'boolean') {
    where.isPublic = filters.isPublic;
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

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * List agents with pagination, filtering, and sorting
 *
 * @param userId - ID of the authenticated user
 * @param params - Query parameters for pagination, filtering, and sorting
 * @returns Paginated list of agents
 */
export const listAgents = async (
  userId: string,
  params: AgentListParams = {},
): Promise<PaginatedAgentList> => {
  ensureDatabase();

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting
  const orderBy = buildSorting(params, ALLOWED_SORT_FIELDS, 'createdAt');

  // Build where clause
  const where = buildAgentWhereClause(userId, params);

  // Execute queries in parallel
  const [agents, totalCount] = await Promise.all([
    prisma!.agent.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma!.agent.count({ where }),
  ]);

  // Build pagination metadata
  const meta = buildPaginationMeta(totalCount, params);

  logger.debug('[Agent Service] Listed agents:', {
    userId,
    filters: params,
    count: agents.length,
    total: totalCount,
  });

  return { data: agents, meta };
};

/**
 * Get a single agent by ID
 *
 * @param agentId - Agent ID
 * @param userId - ID of the authenticated user (for ownership check)
 * @param isAdmin - Whether the user is an admin (bypasses ownership)
 * @returns Agent or null if not found
 */
export const getAgentById = async (
  agentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<Agent | null> => {
  ensureDatabase();

  const agent = await prisma!.agent.findFirst({
    where: {
      id: agentId,
      ...buildSoftDeleteFilter('exclude'),
    },
  });

  if (!agent) {
    return null;
  }

  // Check ownership unless admin
  if (!isAdmin && agent.userId !== userId) {
    return null;
  }

  logger.debug('[Agent Service] Retrieved agent:', { agentId, userId });

  return agent;
};

/**
 * Create a new agent
 *
 * @param userId - ID of the authenticated user
 * @param input - Agent creation input
 * @returns Created agent
 */
export const createAgent = async (userId: string, input: CreateAgentInput): Promise<Agent> => {
  ensureDatabase();

  const agent = await prisma!.agent.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      status: AgentStatus.DRAFT, // Default status
      version: 1, // Default version
      userId,
      config: (input.config || {}) as Prisma.InputJsonValue,
      capabilities: (input.capabilities || []) as Prisma.InputJsonValue,
      parameters: (input.parameters || {}) as Prisma.InputJsonValue,
      maxExecutionTime: input.maxExecutionTime ?? 300,
      maxMemoryMb: input.maxMemoryMb ?? 512,
      maxConcurrentExecutions: input.maxConcurrentExecutions ?? 1,
      tags: input.tags || [],
      isPublic: input.isPublic ?? false,
    },
  });

  logger.info('[Agent Service] Created agent:', {
    agentId: agent.id,
    userId,
    name: agent.name,
    type: agent.type,
  });

  return agent;
};

/**
 * Update an existing agent
 *
 * @param agentId - Agent ID
 * @param userId - ID of the authenticated user
 * @param input - Agent update input
 * @param isAdmin - Whether the user is an admin
 * @returns Updated agent
 * @throws ApiError if agent not found or not authorized
 */
export const updateAgent = async (
  agentId: string,
  userId: string,
  input: UpdateAgentInput,
  isAdmin: boolean = false,
): Promise<Agent> => {
  ensureDatabase();

  // First check if agent exists and user has access
  const existingAgent = await getAgentById(agentId, userId, isAdmin);

  if (!existingAgent) {
    throw ApiError.notFound('Agent not found');
  }

  // Build update data
  const updateData: Prisma.AgentUpdateInput = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.config !== undefined) {
    updateData.config = input.config as Prisma.InputJsonValue;
  }
  if (input.capabilities !== undefined) {
    updateData.capabilities = input.capabilities as Prisma.InputJsonValue;
  }
  if (input.parameters !== undefined) {
    updateData.parameters = input.parameters as Prisma.InputJsonValue;
  }
  if (input.maxExecutionTime !== undefined) {
    updateData.maxExecutionTime = input.maxExecutionTime;
  }
  if (input.maxMemoryMb !== undefined) {
    updateData.maxMemoryMb = input.maxMemoryMb;
  }
  if (input.maxConcurrentExecutions !== undefined) {
    updateData.maxConcurrentExecutions = input.maxConcurrentExecutions;
  }
  if (input.tags !== undefined) {
    updateData.tags = input.tags;
  }
  if (input.isPublic !== undefined) {
    updateData.isPublic = input.isPublic;
  }

  const agent = await prisma!.agent.update({
    where: { id: agentId },
    data: updateData,
  });

  logger.info('[Agent Service] Updated agent:', {
    agentId,
    userId,
    updates: Object.keys(updateData),
  });

  return agent;
};

/**
 * Soft delete an agent
 *
 * @param agentId - Agent ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @throws ApiError if agent not found or not authorized
 */
export const deleteAgent = async (
  agentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<void> => {
  ensureDatabase();

  // First check if agent exists and user has access
  const existingAgent = await getAgentById(agentId, userId, isAdmin);

  if (!existingAgent) {
    throw ApiError.notFound('Agent not found');
  }

  // Soft delete by setting deletedAt
  await prisma!.agent.update({
    where: { id: agentId },
    data: { deletedAt: new Date() },
  });

  logger.info('[Agent Service] Soft deleted agent:', { agentId, userId });
};

/**
 * Duplicate an agent
 *
 * Creates a new agent based on an existing one, incrementing the version
 * and setting the parentId to the source agent.
 *
 * @param agentId - Source agent ID
 * @param userId - ID of the authenticated user
 * @param input - Duplication options
 * @param isAdmin - Whether the user is an admin
 * @returns Duplicated agent
 * @throws ApiError if source agent not found or not authorized
 */
export const duplicateAgent = async (
  agentId: string,
  userId: string,
  input: DuplicateAgentInput = {},
  isAdmin: boolean = false,
): Promise<Agent> => {
  ensureDatabase();

  // Get source agent
  const sourceAgent = await getAgentById(agentId, userId, isAdmin);

  if (!sourceAgent) {
    throw ApiError.notFound('Agent not found');
  }

  // Find the highest version in the version tree
  const highestVersion = await prisma!.agent.findFirst({
    where: {
      OR: [
        { id: sourceAgent.parentId || sourceAgent.id },
        { parentId: sourceAgent.parentId || sourceAgent.id },
      ],
      deletedAt: null,
    },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const newVersion = (highestVersion?.version || sourceAgent.version) + 1;

  // Determine parent ID (root of version tree)
  const rootParentId = sourceAgent.parentId || sourceAgent.id;

  // Create duplicate
  const duplicatedAgent = await prisma!.agent.create({
    data: {
      name: input.name?.trim() || `Copy of ${sourceAgent.name}`,
      description: sourceAgent.description,
      type: sourceAgent.type,
      status: AgentStatus.DRAFT, // Reset to draft
      version: newVersion,
      parentId: rootParentId,
      userId,
      config: sourceAgent.config as Prisma.InputJsonValue,
      capabilities: sourceAgent.capabilities as Prisma.InputJsonValue,
      parameters: sourceAgent.parameters as Prisma.InputJsonValue,
      maxExecutionTime: sourceAgent.maxExecutionTime,
      maxMemoryMb: sourceAgent.maxMemoryMb,
      maxConcurrentExecutions: sourceAgent.maxConcurrentExecutions,
      tags: sourceAgent.tags,
      isPublic: false, // Reset to private
      // Reset metrics
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgExecutionTimeMs: 0,
    },
  });

  logger.info('[Agent Service] Duplicated agent:', {
    sourceAgentId: agentId,
    newAgentId: duplicatedAgent.id,
    userId,
    version: newVersion,
  });

  return duplicatedAgent;
};

/**
 * Get version history for an agent
 *
 * Returns all versions of an agent by traversing the parent-child tree.
 *
 * @param agentId - Agent ID
 * @param userId - ID of the authenticated user
 * @param isAdmin - Whether the user is an admin
 * @returns List of agent versions ordered by version descending
 * @throws ApiError if agent not found or not authorized
 */
export const getAgentVersions = async (
  agentId: string,
  userId: string,
  isAdmin: boolean = false,
): Promise<AgentVersion[]> => {
  ensureDatabase();

  // Get the agent first
  const agent = await getAgentById(agentId, userId, isAdmin);

  if (!agent) {
    throw ApiError.notFound('Agent not found');
  }

  // Find the root parent ID
  const rootParentId = agent.parentId || agent.id;

  // Get all versions in the tree
  const versions = await prisma!.agent.findMany({
    where: {
      OR: [{ id: rootParentId }, { parentId: rootParentId }],
      // Include soft-deleted versions in history
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
  const versionHistory: AgentVersion[] = versions.map((v) => ({
    id: v.id,
    name: v.name,
    version: v.version,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));

  logger.debug('[Agent Service] Retrieved agent versions:', {
    agentId,
    rootParentId,
    versionCount: versionHistory.length,
  });

  return versionHistory;
};

/**
 * Check if user owns an agent
 *
 * @param agentId - Agent ID
 * @param userId - User ID
 * @returns True if user owns the agent
 */
export const userOwnsAgent = async (agentId: string, userId: string): Promise<boolean> => {
  ensureDatabase();

  const agent = await prisma!.agent.findFirst({
    where: {
      id: agentId,
      userId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return agent !== null;
};

export default {
  listAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  duplicateAgent,
  getAgentVersions,
  userOwnsAgent,
};
