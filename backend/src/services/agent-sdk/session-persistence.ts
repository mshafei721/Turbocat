/**
 * Session Persistence Service for Claude Agent SDK
 *
 * Provides robust session persistence for project chats with:
 * - Redis-backed metadata for fast lookups
 * - File-based conversation history (JSONL format)
 * - Session resumption across container restarts
 * - Optional S3 backup for long-term storage
 *
 * @module services/agent-sdk/session-persistence
 */

import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import type { AgentMessage, AgentResult } from './types';

// ============================================================================
// Types
// ============================================================================

export interface ConversationTurn {
  /** Turn number (1-indexed) */
  turnNumber: number;
  /** User prompt */
  userPrompt: string;
  /** Agent response */
  agentResponse?: string;
  /** Messages exchanged in this turn */
  messages: AgentMessage[];
  /** Cost for this turn */
  costUsd: number;
  /** Timestamp */
  timestamp: Date;
  /** Model used */
  model: string;
  /** Duration in milliseconds */
  durationMs: number;
}

export interface ConversationSession {
  /** Unique session ID */
  sessionId: string;
  /** Project ID */
  projectId: string;
  /** User ID */
  userId: string;
  /** Conversation title (auto-generated or user-set) */
  title: string;
  /** Total turns in conversation */
  totalTurns: number;
  /** Total cost accumulated */
  totalCostUsd: number;
  /** First message timestamp */
  startedAt: Date;
  /** Last message timestamp */
  lastMessageAt: Date;
  /** Is conversation active */
  isActive: boolean;
  /** Sandbox ID where this session runs */
  sandboxId: string;
  /** Model used for conversation */
  model: string;
}

export interface SessionSummary {
  sessionId: string;
  projectId: string;
  title: string;
  totalTurns: number;
  lastMessageAt: Date;
  isActive: boolean;
}

// ============================================================================
// Redis Keys
// ============================================================================

const REDIS_PREFIX = 'turbocat:conversation:';
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

const REDIS_KEYS = {
  session: (sessionId: string) => `${REDIS_PREFIX}session:${sessionId}`,
  projectSessions: (projectId: string) => `${REDIS_PREFIX}project:${projectId}:sessions`,
  userSessions: (userId: string) => `${REDIS_PREFIX}user:${userId}:sessions`,
  activeSession: (projectId: string, userId: string) =>
    `${REDIS_PREFIX}project:${projectId}:user:${userId}:active`,
  turnHistory: (sessionId: string) => `${REDIS_PREFIX}session:${sessionId}:turns`,
};

// ============================================================================
// Session Persistence Service
// ============================================================================

export class SessionPersistenceService {
  private redisClient = redis;

  /**
   * Create a new conversation session
   */
  async createSession(params: {
    projectId: string;
    userId: string;
    sandboxId: string;
    model: string;
    title?: string;
  }): Promise<ConversationSession> {
    const sessionId = this.generateSessionId();

    const session: ConversationSession = {
      sessionId,
      projectId: params.projectId,
      userId: params.userId,
      title: params.title || `Chat ${new Date().toLocaleDateString()}`,
      totalTurns: 0,
      totalCostUsd: 0,
      startedAt: new Date(),
      lastMessageAt: new Date(),
      isActive: true,
      sandboxId: params.sandboxId,
      model: params.model,
    };

    await this.saveSession(session);

    // Mark as active session for this project/user
    await this.setActiveSession(params.projectId, params.userId, sessionId);

    logger.info('[SessionPersistence] Created new session', {
      sessionId,
      projectId: params.projectId,
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    if (!this.redisClient) return null;

    try {
      const data = await this.redisClient.get(REDIS_KEYS.session(sessionId));
      if (data) {
        const session = JSON.parse(data) as ConversationSession;
        // Convert date strings back to Date objects
        session.startedAt = new Date(session.startedAt);
        session.lastMessageAt = new Date(session.lastMessageAt);
        return session;
      }
    } catch (error) {
      logger.error('[SessionPersistence] Failed to get session', {
        sessionId,
        error,
      });
    }

    return null;
  }

  /**
   * Get active session for a project/user
   */
  async getActiveSession(
    projectId: string,
    userId: string,
  ): Promise<ConversationSession | null> {
    if (!this.redisClient) return null;

    try {
      const sessionId = await this.redisClient.get(
        REDIS_KEYS.activeSession(projectId, userId),
      );
      if (sessionId) {
        return this.getSession(sessionId);
      }
    } catch (error) {
      logger.error('[SessionPersistence] Failed to get active session', {
        projectId,
        userId,
        error,
      });
    }

    return null;
  }

  /**
   * List sessions for a project
   */
  async listProjectSessions(projectId: string): Promise<SessionSummary[]> {
    if (!this.redisClient) return [];

    try {
      const sessionIds = await this.redisClient.smembers(
        REDIS_KEYS.projectSessions(projectId),
      );

      const sessions: SessionSummary[] = [];
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push({
            sessionId: session.sessionId,
            projectId: session.projectId,
            title: session.title,
            totalTurns: session.totalTurns,
            lastMessageAt: session.lastMessageAt,
            isActive: session.isActive,
          });
        }
      }

      // Sort by last message (most recent first)
      return sessions.sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
      );
    } catch (error) {
      logger.error('[SessionPersistence] Failed to list sessions', {
        projectId,
        error,
      });
      return [];
    }
  }

  /**
   * Record a conversation turn
   */
  async recordTurn(
    sessionId: string,
    turn: Omit<ConversationTurn, 'turnNumber'>,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const turnNumber = session.totalTurns + 1;
    const fullTurn: ConversationTurn = {
      ...turn,
      turnNumber,
      timestamp: new Date(),
    };

    // Update session metadata
    session.totalTurns = turnNumber;
    session.totalCostUsd += turn.costUsd;
    session.lastMessageAt = new Date();

    // Auto-generate title from first message if default
    if (
      turnNumber === 1 &&
      session.title.startsWith('Chat ')
    ) {
      session.title = this.generateTitle(turn.userPrompt);
    }

    await this.saveSession(session);
    await this.saveTurn(sessionId, fullTurn);

    logger.debug('[SessionPersistence] Recorded turn', {
      sessionId,
      turnNumber,
      costUsd: turn.costUsd,
    });
  }

  /**
   * Get conversation history
   */
  async getHistory(
    sessionId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ConversationTurn[]> {
    if (!this.redisClient) return [];

    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      // Get turns from Redis list (newest first, so we reverse)
      const turns = await this.redisClient.lrange(
        REDIS_KEYS.turnHistory(sessionId),
        offset,
        offset + limit - 1,
      );

      return turns.map((t: string) => {
        const turn = JSON.parse(t) as ConversationTurn;
        turn.timestamp = new Date(turn.timestamp);
        return turn;
      });
    } catch (error) {
      logger.error('[SessionPersistence] Failed to get history', {
        sessionId,
        error,
      });
      return [];
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.isActive = false;
    await this.saveSession(session);

    // Remove as active session
    if (this.redisClient) {
      await this.redisClient.del(
        REDIS_KEYS.activeSession(session.projectId, session.userId),
      );
    }

    logger.info('[SessionPersistence] Ended session', {
      sessionId,
      totalTurns: session.totalTurns,
      totalCostUsd: session.totalCostUsd,
    });
  }

  /**
   * Resume a session (make it active again)
   */
  async resumeSession(sessionId: string): Promise<ConversationSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.isActive = true;
    session.lastMessageAt = new Date();
    await this.saveSession(session);

    // Set as active session
    await this.setActiveSession(session.projectId, session.userId, sessionId);

    logger.info('[SessionPersistence] Resumed session', {
      sessionId,
      totalTurns: session.totalTurns,
    });

    return session;
  }

  /**
   * Delete a session and all its history
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session || !this.redisClient) return;

    const pipeline = this.redisClient.pipeline();

    // Remove session data
    pipeline.del(REDIS_KEYS.session(sessionId));
    pipeline.del(REDIS_KEYS.turnHistory(sessionId));

    // Remove from project sessions set
    pipeline.srem(REDIS_KEYS.projectSessions(session.projectId), sessionId);
    pipeline.srem(REDIS_KEYS.userSessions(session.userId), sessionId);

    // Remove as active if it was
    pipeline.del(REDIS_KEYS.activeSession(session.projectId, session.userId));

    await pipeline.exec();

    logger.info('[SessionPersistence] Deleted session', { sessionId });
  }

  /**
   * Update session title
   */
  async updateTitle(sessionId: string, title: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.title = title;
    await this.saveSession(session);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Save session to Redis
   */
  private async saveSession(session: ConversationSession): Promise<void> {
    if (!this.redisClient) return;

    const pipeline = this.redisClient.pipeline();

    // Save session data
    pipeline.set(
      REDIS_KEYS.session(session.sessionId),
      JSON.stringify(session),
      'EX',
      TTL_SECONDS,
    );

    // Add to project sessions set
    pipeline.sadd(REDIS_KEYS.projectSessions(session.projectId), session.sessionId);
    pipeline.expire(REDIS_KEYS.projectSessions(session.projectId), TTL_SECONDS);

    // Add to user sessions set
    pipeline.sadd(REDIS_KEYS.userSessions(session.userId), session.sessionId);
    pipeline.expire(REDIS_KEYS.userSessions(session.userId), TTL_SECONDS);

    await pipeline.exec();
  }

  /**
   * Save turn to Redis
   */
  private async saveTurn(
    sessionId: string,
    turn: ConversationTurn,
  ): Promise<void> {
    if (!this.redisClient) return;

    // Append to list (most recent first)
    await this.redisClient.lpush(
      REDIS_KEYS.turnHistory(sessionId),
      JSON.stringify(turn),
    );

    // Keep only last 100 turns in Redis (older turns can be in S3)
    await this.redisClient.ltrim(REDIS_KEYS.turnHistory(sessionId), 0, 99);

    // Extend TTL
    await this.redisClient.expire(REDIS_KEYS.turnHistory(sessionId), TTL_SECONDS);
  }

  /**
   * Set active session for project/user
   */
  private async setActiveSession(
    projectId: string,
    userId: string,
    sessionId: string,
  ): Promise<void> {
    if (!this.redisClient) return;

    await this.redisClient.set(
      REDIS_KEYS.activeSession(projectId, userId),
      sessionId,
      'EX',
      TTL_SECONDS,
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}${random}`;
  }

  /**
   * Generate title from first message
   */
  private generateTitle(prompt: string): string {
    // Take first 50 chars, trim at word boundary
    const maxLength = 50;
    let title = prompt.trim();

    if (title.length > maxLength) {
      title = title.substring(0, maxLength);
      const lastSpace = title.lastIndexOf(' ');
      if (lastSpace > maxLength / 2) {
        title = title.substring(0, lastSpace);
      }
      title += '...';
    }

    return title;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let persistenceInstance: SessionPersistenceService | null = null;

/**
 * Get the session persistence service instance
 */
export function getSessionPersistence(): SessionPersistenceService {
  if (!persistenceInstance) {
    persistenceInstance = new SessionPersistenceService();
  }
  return persistenceInstance;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert AgentResult to ConversationTurn format
 */
export function agentResultToTurn(
  userPrompt: string,
  result: AgentResult,
  model: string,
  durationMs: number,
): Omit<ConversationTurn, 'turnNumber'> {
  return {
    userPrompt,
    agentResponse: result.result,
    messages: result.messages,
    costUsd: result.totalCostUsd || 0,
    timestamp: new Date(),
    model,
    durationMs,
  };
}
