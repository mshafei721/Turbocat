/**
 * Project Routes - Epic 2: Dashboard & Projects
 *
 * This module defines all project-related API endpoints.
 * Projects are exposed as a project-centric API wrapper around Workflows.
 *
 * Endpoints:
 * - GET    /projects        - List projects (paginated, filtered, sorted)
 * - GET    /projects/:id    - Get project by ID
 * - POST   /projects        - Create a new project
 * - PATCH  /projects/:id    - Update a project
 * - DELETE /projects/:id    - Soft delete a project
 *
 * @module routes/projects
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  ProjectListParams,
  CreateProjectInput,
  UpdateProjectInput,
} from '../services/project.service';
import { requireAuth } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { requireStringParam } from '../utils/params';
import { logger } from '../lib/logger';
import chatRoutes from './chat'; // Epic 2: Chat history routes

const router = Router();

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Handle validation errors from Zod
 */
const handleValidationError = (error: z.ZodError): ApiError => {
  const details = error.issues.map((issue: z.ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return ApiError.validation('Validation failed', details);
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Platform enum values
 */
const PlatformValues = ['web', 'mobile', 'both'] as const;

/**
 * Project status enum values
 */
const ProjectStatusValues = ['draft', 'active', 'building', 'deployed', 'error'] as const;

/**
 * List projects query schema
 */
const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'totalExecutions'])
    .optional()
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  platform: z.enum(PlatformValues).optional(),
  status: z.enum(ProjectStatusValues).optional(),
  search: z.string().optional(),
});

/**
 * Create project body schema
 */
const createProjectBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.enum(PlatformValues).optional(),
  selectedModel: z.string().optional(),
});

/**
 * Update project body schema
 */
const updateProjectBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  platform: z.enum(PlatformValues).nullable().optional(),
  selectedModel: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  previewCode: z.string().nullable().optional(),
  previewError: z.string().nullable().optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /projects
 * List projects for authenticated user with pagination and filters
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate query parameters
    const queryResult = listProjectsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw handleValidationError(queryResult.error);
    }

    const params: ProjectListParams = queryResult.data;

    // List projects
    const result = await listProjects(user.userId, params);

    logger.info(
      `[ProjectRoutes] Listed ${result.projects.length} projects for user ${user.userId}`,
    );

    res.json(
      createSuccessResponse(
        {
          projects: result.projects,
          pagination: result.pagination,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /projects/:id
 * Get a single project by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.id, 'id');

    const project = await getProject(projectId, user.userId);

    logger.info(`[ProjectRoutes] Retrieved project ${projectId}`);

    res.json(
      createSuccessResponse(
        {
          project,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects
 * Create a new project
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate body
    const bodyResult = createProjectBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw handleValidationError(bodyResult.error);
    }

    const input: CreateProjectInput = bodyResult.data;

    const project = await createProject(user.userId, input);

    logger.info(`[ProjectRoutes] Created project ${project.id}`);

    res.status(201).json(
      createSuccessResponse(
        {
          project,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /projects/:id
 * Update a project
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.id, 'id');

    // Validate body
    const bodyResult = updateProjectBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw handleValidationError(bodyResult.error);
    }

    const input: UpdateProjectInput = bodyResult.data;

    const project = await updateProject(projectId, user.userId, input);

    logger.info(`[ProjectRoutes] Updated project ${projectId}`);

    res.json(
      createSuccessResponse(
        {
          project,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /projects/:id
 * Soft delete a project
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.id, 'id');

    await deleteProject(projectId, user.userId);

    logger.info(`[ProjectRoutes] Deleted project ${projectId}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// NESTED ROUTES
// =============================================================================

/**
 * Mount chat routes at /projects/:projectId/chat
 * Epic 2: Chat history for projects
 */
router.use('/:projectId/chat', chatRoutes);

// =============================================================================
// EXPORT
// =============================================================================

export default router as Router;
