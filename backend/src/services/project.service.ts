/**
 * Project Service - Epic 2: Dashboard & Projects
 *
 * This service wraps the Workflow service with project-specific operations.
 * Projects are conceptually the same as Workflows, but exposed through a
 * project-centric API with project-specific fields.
 *
 * @module services/project.service
 */

import { Prisma, WorkflowStatus } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { ProjectMapper, ProjectDTO } from '../mappers/project.mapper';
import {
  buildPagination,
  buildPaginationMeta,
  buildSoftDeleteFilter,
  buildSorting,
  PaginationInput,
  PaginationMeta,
  SortingInput,
} from '../lib/queryHelpers';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Project list filter options
 */
export interface ProjectListFilters {
  /** Filter by platform */
  platform?: 'web' | 'mobile' | 'both';
  /** Search query (searches name and description) */
  search?: string;
  /** Filter by status */
  status?: 'draft' | 'active' | 'building' | 'deployed' | 'error';
}

/**
 * Combined query parameters for listing projects
 */
export interface ProjectListParams extends PaginationInput, SortingInput, ProjectListFilters {}

/**
 * Paginated project list response
 */
export interface PaginatedProjectList {
  projects: ProjectDTO[];
  pagination: PaginationMeta;
}

/**
 * Input for creating a project
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  platform?: 'web' | 'mobile' | 'both';
  selectedModel?: string;
}

/**
 * Input for updating a project
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  platform?: 'web' | 'mobile' | 'both' | null;
  selectedModel?: string | null;
  thumbnailUrl?: string | null;
  previewCode?: string | null;
  previewError?: string | null;
}

// =============================================================================
// PROJECT SERVICE
// =============================================================================

/**
 * List projects for a user with pagination and filters
 */
export async function listProjects(
  userId: string,
  params: ProjectListParams = {},
): Promise<PaginatedProjectList> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      platform,
      search,
      status,
    } = params;

    // Build filters
    const where: Prisma.WorkflowWhereInput = {
      userId,
      ...buildSoftDeleteFilter(),
    };

    // Platform filter
    if (platform) {
      where.platform = platform;
    }

    // Status filter (map project status to workflow status)
    if (status) {
      where.status = mapProjectStatusToWorkflowStatus(status);
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [workflows, total] = await Promise.all([
      prisma!.workflow.findMany({
        where,
        ...buildPagination({ page, pageSize }),
        ...buildSorting(
          { sortBy, sortOrder },
          {
            name: 'name',
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
            totalExecutions: 'totalExecutions',
          },
          'updatedAt',
        ),
      }),
      prisma!.workflow.count({ where }),
    ]);

    logger.info(`[ProjectService] Listed ${workflows.length} projects for user ${userId}`);

    return {
      projects: ProjectMapper.toDTOs(workflows),
      pagination: buildPaginationMeta(total, { page, pageSize }),
    };
  } catch (error) {
    logger.error('[ProjectService] Error listing projects', { error, userId });
    throw ApiError.internal('Failed to list projects');
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string, userId: string): Promise<ProjectDTO> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    const workflow = await prisma!.workflow.findUnique({
      where: {
        id: projectId,
        ...buildSoftDeleteFilter(),
      },
    });

    if (!workflow) {
      throw ApiError.notFound('Project not found');
    }

    // Check ownership
    if (workflow.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    logger.info(`[ProjectService] Retrieved project ${projectId}`);
    return ProjectMapper.toDTO(workflow);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ProjectService] Error retrieving project', { error, projectId, userId });
    throw ApiError.internal('Failed to retrieve project');
  }
}

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectDTO> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    const workflow = await prisma!.workflow.create({
      data: {
        userId,
        name: input.name,
        projectName: input.name, // Epic 2: Store as projectName
        description: input.description || null,
        platform: input.platform || null,
        selectedModel: input.selectedModel || null,
        status: WorkflowStatus.DRAFT,
        definition: {},
        triggerConfig: {},
      },
    });

    logger.info(`[ProjectService] Created project ${workflow.id}`);
    return ProjectMapper.toDTO(workflow);
  } catch (error) {
    logger.error('[ProjectService] Error creating project', { error, userId, input });
    throw ApiError.internal('Failed to create project');
  }
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<ProjectDTO> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Check ownership
    const existing = await prisma!.workflow.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw ApiError.notFound('Project not found');
    }

    if (existing.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Update
    const updated = await prisma!.workflow.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined && { name: input.name, projectName: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.platform !== undefined && { platform: input.platform }),
        ...(input.selectedModel !== undefined && { selectedModel: input.selectedModel }),
        ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl }),
        ...(input.previewCode !== undefined && { previewCode: input.previewCode }),
        ...(input.previewError !== undefined && { previewError: input.previewError }),
      },
    });

    logger.info(`[ProjectService] Updated project ${projectId}`);
    return ProjectMapper.toDTO(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ProjectService] Error updating project', { error, projectId, userId, input });
    throw ApiError.internal('Failed to update project');
  }
}

/**
 * Delete a project (soft delete)
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Check ownership
    const existing = await prisma!.workflow.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw ApiError.notFound('Project not found');
    }

    if (existing.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Soft delete
    await prisma!.workflow.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info(`[ProjectService] Deleted project ${projectId}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ProjectService] Error deleting project', { error, projectId, userId });
    throw ApiError.internal('Failed to delete project');
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map project status to workflow status
 */
function mapProjectStatusToWorkflowStatus(
  projectStatus: 'draft' | 'active' | 'building' | 'deployed' | 'error',
): WorkflowStatus {
  switch (projectStatus) {
    case 'draft':
      return WorkflowStatus.DRAFT;
    case 'active':
    case 'building':
      return WorkflowStatus.ACTIVE;
    case 'deployed':
      return WorkflowStatus.INACTIVE;
    case 'error':
      return WorkflowStatus.ARCHIVED;
    default:
      return WorkflowStatus.DRAFT;
  }
}
