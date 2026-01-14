/**
 * Template Routes
 *
 * This module defines all template-related API endpoints including
 * listing, retrieval, and instantiation of templates.
 *
 * Endpoints:
 * - GET    /templates           - List templates (public access for public templates)
 * - GET    /templates/categories - Get available categories (public access)
 * - GET    /templates/:id       - Get template by ID (public access for public templates)
 * - POST   /templates/:id/instantiate - Create agent/workflow from template (requires auth)
 *
 * @module routes/templates
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TemplateType } from '@prisma/client';
import {
  listTemplates,
  getTemplateById,
  instantiateTemplate,
  getTemplateCategories,
} from '../services/template.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
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
 * Template type enum values
 */
const TemplateTypeValues = ['AGENT', 'WORKFLOW', 'STEP'] as const;

/**
 * Query parameters for listing templates
 */
const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  category: z.string().max(100).optional(),
  type: z.enum(TemplateTypeValues).optional(),
  isOfficial: z
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
  search: z.string().max(255).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
});

/**
 * Instantiate template request body
 */
const instantiateTemplateSchema = z.object({
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
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
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
const mapTemplateType = (type: string): TemplateType => {
  const typeMap: Record<string, TemplateType> = {
    AGENT: TemplateType.AGENT,
    WORKFLOW: TemplateType.WORKFLOW,
    STEP: TemplateType.STEP,
  };
  return typeMap[type] || TemplateType.AGENT;
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /templates
 *
 * List templates with pagination, filtering, and sorting.
 * Allows unauthenticated access for public templates.
 * Authenticated users can also see their own private templates.
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - sortBy: string (name, category, type, usageCount, ratingAverage, createdAt, updatedAt, popular, rating)
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - category: string filter
 * - type: TemplateType filter (AGENT, WORKFLOW, STEP)
 * - isOfficial: boolean filter
 * - isPublic: boolean filter (only affects authenticated users)
 * - search: string (searches name and description)
 * - tags: comma-separated list of tags
 *
 * Response:
 * - 200 OK: Paginated list of templates
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID if authenticated (null for unauthenticated)
    const userId = req.user?.userId || null;

    // Validate query parameters
    const validationResult = listTemplatesQuerySchema.safeParse(req.query);

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
      category: params.category,
      type: params.type ? mapTemplateType(params.type) : undefined,
      isOfficial: params.isOfficial,
      isPublic: params.isPublic,
      search: params.search,
      tags: params.tags,
    };

    // List templates
    const result = await listTemplates(userId, filterParams);

    logger.debug('[Templates Route] Listed templates:', {
      userId,
      authenticated: !!req.user,
      count: result.data.length,
      total: result.meta.totalItems,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          templates: result.data,
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
 * GET /templates/categories
 *
 * Get list of available template categories.
 * Public access - no authentication required.
 *
 * Response:
 * - 200 OK: List of category strings
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getTemplateCategories();

    logger.debug('[Templates Route] Retrieved categories:', {
      count: categories.length,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          categories,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /templates/:id
 *
 * Get a single template by ID.
 * Allows unauthenticated access for public templates.
 * Authenticated users can access their own private templates.
 *
 * Path parameters:
 * - id: Template UUID
 *
 * Response:
 * - 200 OK: Template details
 * - 404 Not Found: Template not found or not accessible
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || null;
    const templateId = requireStringParam(req.params.id, 'id');

    // Validate UUID
    validateUuid(templateId);

    // Get template
    const template = await getTemplateById(templateId, userId);

    if (!template) {
      throw ApiError.notFound('Template not found');
    }

    logger.debug('[Templates Route] Retrieved template:', {
      templateId,
      userId,
      authenticated: !!req.user,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          template,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /templates/:id/instantiate
 *
 * Create an agent or workflow from a template.
 * Requires authentication.
 *
 * Path parameters:
 * - id: Template UUID
 *
 * Request body:
 * - name: string (optional - defaults to template name + type)
 * - description: string (optional)
 * - tags: string[] (optional)
 * - config: object (optional - merged with template config)
 * - isPublic: boolean (optional - default: false)
 *
 * Response:
 * - 201 Created: Created resource (agent or workflow)
 * - 400 Bad Request: Cannot instantiate this template type
 * - 401 Unauthorized: Not authenticated
 * - 404 Not Found: Template not found or not accessible
 */
router.post(
  '/:id/instantiate',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const templateId = requireStringParam(req.params.id, 'id');

      // Validate UUID
      validateUuid(templateId);

      // Validate request body
      const validationResult = instantiateTemplateSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw handleValidationError(validationResult.error);
      }

      const input = validationResult.data;

      // Instantiate template
      const result = await instantiateTemplate(templateId, user.userId, {
        name: input.name,
        description: input.description || undefined,
        tags: input.tags,
        config: input.config,
        isPublic: input.isPublic,
      });

      logger.info('[Templates Route] Instantiated template:', {
        templateId,
        userId: user.userId,
        resourceType: result.resourceType,
        resourceId: result.resource.id,
      });

      res.status(201).json(
        createSuccessResponse(
          {
            resourceType: result.resourceType,
            [result.resourceType]: result.resource,
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

export default router as Router;
