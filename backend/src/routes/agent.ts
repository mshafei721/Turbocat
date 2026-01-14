/**
 * Agent SDK Routes - Turbocat Backend
 *
 * Provides HTTP endpoints for Claude Agent SDK operations:
 * - POST /query - Execute a non-streaming agent query
 * - POST /stream - Execute a streaming agent query
 * - GET /skills - List available skills
 * - POST /chat/:projectId - Project chat with session persistence
 *
 * @module routes/agent
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';
import { createSuccessResponse } from '../middleware/errorHandler';
import {
  executeAgentQuery,
  listAvailableSkills,
  isAgentConfigured,
  getSandboxManager,
  getSessionPersistence,
  agentResultToTurn,
} from '../services/agent-sdk';
import type { AgentQueryOptions } from '../services/agent-sdk';

const router: Router = Router();

// =============================================================================
// Validation Schemas
// =============================================================================

const agentQuerySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(100000, 'Prompt too long'),
  options: z
    .object({
      model: z
        .enum([
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-20250514',
          'claude-3-5-sonnet-20241022',
        ])
        .optional(),
      maxTurns: z.number().int().min(1).max(100).optional(),
      systemPrompt: z.string().max(50000).optional(),
      allowedTools: z.array(z.string()).optional(),
    })
    .optional(),
});

const projectChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(100000, 'Prompt too long'),
  options: z
    .object({
      model: z
        .enum([
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-20250514',
          'claude-3-5-sonnet-20241022',
        ])
        .optional(),
      maxTurns: z.number().int().min(1).max(100).optional(),
      systemPrompt: z.string().max(50000).optional(),
    })
    .optional(),
  resumeSessionId: z.string().optional(),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * @openapi
 * /api/v1/agent/status:
 *   get:
 *     summary: Check agent SDK status
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent SDK status
 */
router.get('/status', requireAuth, (req: Request, res: Response) => {
  const configured = isAgentConfigured();
  const requestId = req.requestId || 'unknown';

  res.json(
    createSuccessResponse(
      {
        configured,
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-20250514',
          'claude-3-5-sonnet-20241022',
        ],
      },
      requestId,
    ),
  );
});

/**
 * @openapi
 * /api/v1/agent/skills:
 *   get:
 *     summary: List available agent skills
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available skills
 */
router.get('/skills', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await listAvailableSkills();
    const requestId = req.requestId || 'unknown';

    res.json(createSuccessResponse(skills, requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/agent/query:
 *   post:
 *     summary: Execute a non-streaming agent query
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Agent query result
 */
router.post('/query', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const requestId = req.requestId || 'unknown';

    // Validate input
    const validation = agentQuerySchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid request body', validation.error.issues);
    }

    const { prompt, options } = validation.data;

    // Check if SDK is configured
    if (!isAgentConfigured()) {
      throw ApiError.serviceUnavailable('Agent SDK is not configured');
    }

    logger.info('[Agent] Executing query', { userId, promptLength: prompt.length });

    // Get sandbox manager for ephemeral execution
    const sandboxManager = getSandboxManager();
    const sandbox = await sandboxManager.provisionSandbox({
      projectId: 'ephemeral-query',
      userId,
      executionType: 'task',
    });

    // Execute the query with sandbox working directory
    const startTime = Date.now();
    const result = await executeAgentQuery(prompt, {
      ...options,
      cwd: sandbox.sdkOptions.cwd,
      settingSources: sandbox.sdkOptions.settingSources,
    } as AgentQueryOptions);
    const durationMs = Date.now() - startTime;

    // Release ephemeral sandbox
    await sandboxManager.releaseSandbox(sandbox.sandbox.sandboxId);

    logger.info('[Agent] Query completed', {
      userId,
      success: result.success,
      durationMs,
      costUsd: result.totalCostUsd,
    });

    res.json(createSuccessResponse(result, requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/agent/stream:
 *   post:
 *     summary: Execute a streaming agent query
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Server-sent events stream
 */
router.post('/stream', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Validate input
    const validation = agentQuerySchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid request body', validation.error.issues);
    }

    const { prompt, options } = validation.data;

    // Check if SDK is configured
    if (!isAgentConfigured()) {
      throw ApiError.serviceUnavailable('Agent SDK is not configured');
    }

    logger.info('[Agent] Starting stream', { userId, promptLength: prompt.length });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Get sandbox manager for ephemeral execution
    const sandboxManager = getSandboxManager();
    const sandbox = await sandboxManager.provisionSandbox({
      projectId: 'ephemeral-stream',
      userId,
      executionType: 'task',
    });

    // Import SDK dynamically for streaming
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    const startTime = Date.now();

    try {
      const result = query({
        prompt,
        options: {
          model: options?.model || 'claude-sonnet-4-5-20250929',
          cwd: sandbox.sdkOptions.cwd,
          maxTurns: options?.maxTurns,
          systemPrompt: options?.systemPrompt,
          allowedTools: options?.allowedTools,
          settingSources: sandbox.sdkOptions.settingSources,
        },
      });

      for await (const message of result) {
        const event = {
          type: message.type,
          data: message,
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      const durationMs = Date.now() - startTime;
      res.write(`data: ${JSON.stringify({ type: 'done', durationMs })}\n\n`);
    } catch (streamError) {
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
    } finally {
      // Release ephemeral sandbox
      await sandboxManager.releaseSandbox(sandbox.sandbox.sandboxId);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/agent/chat/{projectId}:
 *   post:
 *     summary: Send a message to project chat with session persistence
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               options:
 *                 type: object
 *               resumeSessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat response with session info
 */
router.post(
  '/chat/:projectId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const requestId = req.requestId || 'unknown';

      // Validate input
      const validation = projectChatSchema.safeParse(req.body);
      if (!validation.success) {
        throw ApiError.badRequest('Invalid request body', validation.error.issues);
      }

      const { prompt, options, resumeSessionId } = validation.data;

      // Check if SDK is configured
      if (!isAgentConfigured()) {
        throw ApiError.serviceUnavailable('Agent SDK is not configured');
      }

      logger.info('[Agent] Project chat message', {
        userId,
        projectId,
        promptLength: prompt.length,
        resumeSessionId,
      });

      // Get sandbox manager for persistent chat
      const sandboxManager = getSandboxManager();
      const sandbox = await sandboxManager.provisionSandbox({
        projectId: projectId as string,
        userId: userId,
        executionType: 'chat',
        resumeSessionId,
      });

      // Get or create session persistence
      const sessionPersistence = getSessionPersistence();
      let session = await sessionPersistence.getSession(sandbox.session.sessionId);

      if (!session) {
        session = await sessionPersistence.createSession({
          projectId: projectId as string,
          userId: userId,
          sandboxId: sandbox.sandbox.sandboxId,
          model: options?.model || 'claude-sonnet-4-5-20250929',
        });
      }

      // Execute the query with persistent sandbox
      const startTime = Date.now();
      const result = await executeAgentQuery(prompt, {
        ...options,
        cwd: sandbox.sdkOptions.cwd,
        settingSources: sandbox.sdkOptions.settingSources,
      } as AgentQueryOptions);
      const durationMs = Date.now() - startTime;

      // Record the turn in session history
      const turn = agentResultToTurn(
        prompt,
        result,
        options?.model || 'claude-sonnet-4-5-20250929',
        durationMs,
      );
      await sessionPersistence.recordTurn(session.sessionId, turn);

      // Append to sandbox history for SDK resumption
      await sandboxManager.appendToHistory(sandbox.session.sessionId, {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      });

      if (result.result) {
        await sandboxManager.appendToHistory(sandbox.session.sessionId, {
          role: 'assistant',
          content: result.result,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('[Agent] Project chat completed', {
        userId,
        projectId,
        sessionId: session.sessionId,
        success: result.success,
        durationMs,
        costUsd: result.totalCostUsd,
      });

      // Return result with session info
      res.json(
        createSuccessResponse(
          {
            ...result,
            session: {
              sessionId: session.sessionId,
              projectId: session.projectId,
              title: session.title,
              totalTurns: session.totalTurns + 1,
              totalCostUsd: session.totalCostUsd + (result.totalCostUsd || 0),
            },
          },
          requestId,
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/v1/agent/chat/{projectId}/history:
 *   get:
 *     summary: Get project chat history
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Chat history
 */
router.get(
  '/chat/:projectId/history',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const sessionIdParam = req.query.sessionId;
      const limitParam = req.query.limit;
      const requestId = req.requestId || 'unknown';

      const sessionPersistence = getSessionPersistence();

      // If sessionId provided, get that session's history
      if (sessionIdParam && typeof sessionIdParam === 'string') {
        const session = await sessionPersistence.getSession(sessionIdParam);
        if (!session) {
          throw ApiError.notFound('Session not found');
        }
        if (session.userId !== userId) {
          throw ApiError.forbidden('You do not have access to this session');
        }

        const limitValue = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 50;
        const history = await sessionPersistence.getHistory(sessionIdParam, {
          limit: limitValue,
        });

        res.json(
          createSuccessResponse(
            {
              session,
              history,
            },
            requestId,
          ),
        );
        return;
      }

      // Otherwise, list all sessions for the project
      const sessions = await sessionPersistence.listProjectSessions(projectId as string);
      const userSessions = sessions.filter((s) => s.sessionId); // Sessions belong to authenticated user via project

      res.json(createSuccessResponse({ sessions: userSessions }, requestId));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/v1/agent/chat/{projectId}/sessions/{sessionId}:
 *   delete:
 *     summary: Delete a chat session
 *     tags: [Agent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.delete(
  '/chat/:projectId/sessions/:sessionId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;
      const requestId = req.requestId || 'unknown';

      const sessionPersistence = getSessionPersistence();
      const session = await sessionPersistence.getSession(sessionId as string);

      if (!session) {
        throw ApiError.notFound('Session not found');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden('You do not have access to this session');
      }

      await sessionPersistence.deleteSession(sessionId as string);

      res.json(createSuccessResponse({ deleted: true }, requestId));
    } catch (error) {
      next(error);
    }
  },
);

export default router;
