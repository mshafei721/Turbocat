/**
 * Agent Routes
 *
 * This module defines all agent-related API endpoints including
 * listing, creating, updating, deleting, duplicating, and version management.
 *
 * Endpoints:
 * - GET    /agents           - List agents (paginated, filtered, sorted)
 * - GET    /agents/:id       - Get agent by ID
 * - POST   /agents           - Create a new agent
 * - PATCH  /agents/:id       - Update an agent
 * - DELETE /agents/:id       - Soft delete an agent
 * - POST   /agents/:id/duplicate - Duplicate an agent
 * - GET    /agents/:id/versions  - Get version history
 *
 * @module routes/agents
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AgentType, AgentStatus } from '@prisma/client';
import {
  listAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  duplicateAgent,
  getAgentVersions,
} from '../services/agent.service';
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
 * Agent type enum values
 */
const AgentTypeValues = ['CODE', 'API', 'LLM', 'DATA', 'WORKFLOW'] as const;

/**
 * Agent status enum values
 */
const AgentStatusValues = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

/**
 * Query parameters for listing agents
 */
const listAgentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  type: z.enum(AgentTypeValues).optional(),
  status: z.enum(AgentStatusValues).optional(),
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
});

/**
 * Create agent request body
 */
const createAgentSchema = z.object({
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
  type: z.enum(AgentTypeValues),
  config: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.array(z.unknown()).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  maxExecutionTime: z.number().int().positive().max(3600).optional(),
  maxMemoryMb: z.number().int().positive().max(8192).optional(),
  maxConcurrentExecutions: z.number().int().positive().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Update agent request body (partial)
 */
const updateAgentSchema = z.object({
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
  status: z.enum(AgentStatusValues).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  capabilities: z.array(z.unknown()).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  maxExecutionTime: z.number().int().positive().max(3600).optional(),
  maxMemoryMb: z.number().int().positive().max(8192).optional(),
  maxConcurrentExecutions: z.number().int().positive().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Duplicate agent request body
 */
const duplicateAgentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .transform((val) => val.trim())
    .optional(),
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
const mapAgentType = (type: string): AgentType => {
  const typeMap: Record<string, AgentType> = {
    CODE: AgentType.CODE,
    API: AgentType.API,
    LLM: AgentType.LLM,
    DATA: AgentType.DATA,
    WORKFLOW: AgentType.WORKFLOW,
  };
  return typeMap[type] || AgentType.CODE;
};

const mapAgentStatus = (status: string): AgentStatus => {
  const statusMap: Record<string, AgentStatus> = {
    DRAFT: AgentStatus.DRAFT,
    ACTIVE: AgentStatus.ACTIVE,
    INACTIVE: AgentStatus.INACTIVE,
    ARCHIVED: AgentStatus.ARCHIVED,
  };
  return statusMap[status] || AgentStatus.DRAFT;
};

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @openapi
 * /agents:
 *   get:
 *     summary: List agents
 *     description: Get a paginated list of agents for the authenticated user with filtering and sorting options
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: type
 *         in: query
 *         description: Filter by agent type
 *         schema:
 *           $ref: '#/components/schemas/AgentType'
 *       - name: status
 *         in: query
 *         description: Filter by agent status
 *         schema:
 *           $ref: '#/components/schemas/AgentStatus'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: tags
 *         in: query
 *         description: Comma-separated list of tags to filter by
 *         schema:
 *           type: string
 *           example: "ml,automation"
 *       - name: isPublic
 *         in: query
 *         description: Filter by public/private status
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     agents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Agent'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate query parameters
    const validationResult = listAgentsQuerySchema.safeParse(req.query);

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
      type: params.type ? mapAgentType(params.type) : undefined,
      status: params.status ? mapAgentStatus(params.status) : undefined,
      search: params.search,
      tags: params.tags,
      isPublic: params.isPublic,
    };

    // List agents
    const result = await listAgents(user.userId, filterParams);

    logger.debug('[Agents Route] Listed agents:', {
      userId: user.userId,
      count: result.data.length,
      total: result.meta.totalItems,
    });

    res.status(200).json(
      createSuccessResponse(
        {
          agents: result.data,
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
 * @openapi
 * /agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     description: Get a single agent by its ID
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Agent UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Agent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     agent:
 *                       $ref: '#/components/schemas/Agent'
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const agentId = req.params.id!;

    // Validate UUID
    validateUuid(agentId);

    // Get agent
    const agent = await getAgentById(agentId, user.userId, isAdmin(req));

    if (!agent) {
      throw ApiError.notFound('Agent not found');
    }

    // Check ownership (admin can bypass)
    if (agent.userId !== user.userId && !isAdmin(req)) {
      throw ApiError.forbidden('You do not have permission to access this agent');
    }

    logger.debug('[Agents Route] Retrieved agent:', { agentId, userId: user.userId });

    res.status(200).json(
      createSuccessResponse(
        {
          agent,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     description: Create a new agent with the specified configuration
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 *           example:
 *             name: "My Code Agent"
 *             type: "CODE"
 *             description: "An agent that executes code"
 *             tags: ["automation", "code"]
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     agent:
 *                       $ref: '#/components/schemas/Agent'
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Validate request body
    const validationResult = createAgentSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Create agent
    const agent = await createAgent(user.userId, {
      name: input.name,
      description: input.description || undefined,
      type: mapAgentType(input.type),
      config: input.config,
      capabilities: input.capabilities,
      parameters: input.parameters,
      maxExecutionTime: input.maxExecutionTime,
      maxMemoryMb: input.maxMemoryMb,
      maxConcurrentExecutions: input.maxConcurrentExecutions,
      tags: input.tags,
      isPublic: input.isPublic,
    });

    logger.info('[Agents Route] Created agent:', {
      agentId: agent.id,
      userId: user.userId,
      name: agent.name,
      type: agent.type,
    });

    res.status(201).json(
      createSuccessResponse(
        {
          agent,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /agents/{id}:
 *   patch:
 *     summary: Update an agent
 *     description: Update an existing agent's properties
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Agent UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAgentRequest'
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     agent:
 *                       $ref: '#/components/schemas/Agent'
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const agentId = req.params.id!;

    // Validate UUID
    validateUuid(agentId);

    // Validate request body
    const validationResult = updateAgentSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;

    // Check for empty update
    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    // Update agent
    const agent = await updateAgent(
      agentId,
      user.userId,
      {
        name: input.name,
        description: input.description === null ? undefined : input.description,
        status: input.status ? mapAgentStatus(input.status) : undefined,
        config: input.config,
        capabilities: input.capabilities,
        parameters: input.parameters,
        maxExecutionTime: input.maxExecutionTime,
        maxMemoryMb: input.maxMemoryMb,
        maxConcurrentExecutions: input.maxConcurrentExecutions,
        tags: input.tags,
        isPublic: input.isPublic,
      },
      isAdmin(req),
    );

    logger.info('[Agents Route] Updated agent:', {
      agentId: agent.id,
      userId: user.userId,
      updates: Object.keys(input),
    });

    res.status(200).json(
      createSuccessResponse(
        {
          agent,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /agents/{id}:
 *   delete:
 *     summary: Delete an agent
 *     description: Soft delete an agent (sets deletedAt timestamp)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Agent UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Agent deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const agentId = req.params.id!;

    // Validate UUID
    validateUuid(agentId);

    // Delete agent
    await deleteAgent(agentId, user.userId, isAdmin(req));

    logger.info('[Agents Route] Deleted agent:', { agentId, userId: user.userId });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /agents/{id}/duplicate:
 *   post:
 *     summary: Duplicate an agent
 *     description: Create a copy of an existing agent with a new ID
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Source agent UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the duplicated agent (defaults to "Copy of {original name}")
 *     responses:
 *       201:
 *         description: Agent duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     agent:
 *                       $ref: '#/components/schemas/Agent'
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/duplicate',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const agentId = req.params.id!;

      // Validate UUID
      validateUuid(agentId);

      // Validate request body
      const validationResult = duplicateAgentSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw handleValidationError(validationResult.error);
      }

      const input = validationResult.data;

      // Duplicate agent
      const agent = await duplicateAgent(
        agentId,
        user.userId,
        {
          name: input.name,
        },
        isAdmin(req),
      );

      logger.info('[Agents Route] Duplicated agent:', {
        sourceAgentId: agentId,
        newAgentId: agent.id,
        userId: user.userId,
        version: agent.version,
      });

      res.status(201).json(
        createSuccessResponse(
          {
            agent,
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
 * @openapi
 * /agents/{id}/versions:
 *   get:
 *     summary: Get agent version history
 *     description: Get the version history for an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Agent UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Version history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     versions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Agent'
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id/versions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const agentId = req.params.id!;

      // Validate UUID
      validateUuid(agentId);

      // Get version history
      const versions = await getAgentVersions(agentId, user.userId, isAdmin(req));

      logger.debug('[Agents Route] Retrieved agent versions:', {
        agentId,
        userId: user.userId,
        versionCount: versions.length,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            versions,
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
