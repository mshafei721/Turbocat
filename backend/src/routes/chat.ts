/**
 * Chat Routes - Epic 2: Dashboard & Projects
 *
 * This module defines chat-related API endpoints for projects.
 * Chat messages are stored per-project and persist across sessions.
 *
 * Endpoints:
 * - GET    /projects/:projectId/chat    - Get chat history
 * - POST   /projects/:projectId/chat    - Add message and trigger execution
 * - DELETE /projects/:projectId/chat    - Clear chat history
 *
 * @module routes/chat
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getChatHistory,
  addChatMessage,
  deleteChatHistory,
  CreateChatMessageInput,
} from '../services/chat.service';
import { requireAuth } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { requireStringParam } from '../utils/params';
import { logger } from '../lib/logger';

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent

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
 * Chat role enum values
 */
const ChatRoleValues = ['user', 'assistant', 'system'] as const;

/**
 * Create chat message body schema
 */
const createChatMessageBodySchema = z.object({
  role: z.enum(ChatRoleValues),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  toolCalls: z.array(z.unknown()).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /projects/:projectId/chat
 * Get chat history for a project
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.projectId, 'projectId');

    const messages = await getChatHistory(projectId, user.userId);

    logger.info(`[ChatRoutes] Retrieved ${messages.length} messages for project ${projectId}`);

    res.json(
      createSuccessResponse(
        {
          messages,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /projects/:projectId/chat
 * Add a chat message and trigger execution
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.projectId, 'projectId');

    // Validate body
    const bodyResult = createChatMessageBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw handleValidationError(bodyResult.error);
    }

    const input: CreateChatMessageInput = bodyResult.data;

    const message = await addChatMessage(projectId, user.userId, input);

    logger.info(`[ChatRoutes] Created message ${message.id} for project ${projectId}`);

    res.status(201).json(
      createSuccessResponse(
        {
          message,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /projects/:projectId/chat
 * Clear chat history for a project
 */
router.delete('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const projectId = requireStringParam(req.params.projectId, 'projectId');

    await deleteChatHistory(projectId, user.userId);

    logger.info(`[ChatRoutes] Cleared chat history for project ${projectId}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// EXPORT
// =============================================================================

export default router as Router;
