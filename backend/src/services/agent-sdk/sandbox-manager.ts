/**
 * Hybrid Sandbox Manager for Claude Agent SDK
 *
 * Manages the lifecycle of agent sandboxes with a hybrid approach:
 * - Persistent sandboxes: For project chats that need resumption
 * - Ephemeral sandboxes: For one-off agent executions
 *
 * Features:
 * - Automatic sandbox provisioning based on execution type
 * - Session resumption for project conversations
 * - Resource cleanup and garbage collection
 * - Redis-backed session metadata for fast lookups
 *
 * @module services/agent-sdk/sandbox-manager
 */

import { logger } from '../../lib/logger';
import {
  FilesystemService,
  getFilesystemService,
  SandboxConfig,
  SessionState,
} from './filesystem';
import { redis as redisClient, isRedisAvailable } from '../../lib/redis';

// ============================================================================
// Types
// ============================================================================

export interface SandboxRequest {
  /** Project ID */
  projectId: string;
  /** User ID */
  userId: string;
  /** Execution type determines sandbox persistence */
  executionType: 'chat' | 'task' | 'workflow';
  /** Optional: Resume from existing session */
  resumeSessionId?: string;
}

export interface SandboxSession {
  /** Sandbox configuration */
  sandbox: SandboxConfig;
  /** Active session */
  session: SessionState;
  /** SDK options to pass to query() */
  sdkOptions: {
    cwd: string;
    settingSources: ('project' | 'user')[];
  };
}

export interface SandboxStats {
  /** Total active sandboxes */
  totalSandboxes: number;
  /** Persistent sandboxes */
  persistentCount: number;
  /** Ephemeral sandboxes */
  ephemeralCount: number;
  /** Active sessions */
  activeSessions: number;
  /** Total storage used (bytes) */
  storageUsed: number;
}

// ============================================================================
// Redis Keys
// ============================================================================

const REDIS_PREFIX = 'turbocat:sandbox:';
const REDIS_KEYS = {
  session: (sessionId: string) => `${REDIS_PREFIX}session:${sessionId}`,
  projectSession: (projectId: string, userId: string) =>
    `${REDIS_PREFIX}project:${projectId}:user:${userId}:session`,
  sandboxMeta: (sandboxId: string) => `${REDIS_PREFIX}meta:${sandboxId}`,
  activeSandboxes: `${REDIS_PREFIX}active`,
};

// ============================================================================
// Sandbox Manager Class
// ============================================================================

export class SandboxManager {
  private filesystemService: FilesystemService;
  private initialized: boolean = false;

  constructor() {
    this.filesystemService = getFilesystemService();
  }

  /**
   * Initialize the sandbox manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Validate skills directory
    const validation = await this.filesystemService.validateSkillsDirectory();
    if (!validation.valid) {
      logger.warn('[SandboxManager] Skills directory validation failed', {
        error: validation.error,
      });
    } else {
      logger.info('[SandboxManager] Skills directory validated', {
        skillCount: validation.skillCount,
      });
    }

    // Restore active sandboxes from Redis if available
    if (isRedisAvailable()) {
      await this.restoreFromRedis();
    }

    this.initialized = true;
    logger.info('[SandboxManager] Initialized');
  }

  // ==========================================================================
  // Sandbox Provisioning
  // ==========================================================================

  /**
   * Get or create a sandbox for the given request
   *
   * Uses hybrid approach:
   * - Chat executions get persistent sandboxes (resumable)
   * - Task/Workflow executions get ephemeral sandboxes (cleaned up after)
   */
  async provisionSandbox(request: SandboxRequest): Promise<SandboxSession> {
    await this.initialize();

    const sandboxType = this.getSandboxType(request.executionType);

    // Check for existing session to resume
    if (request.resumeSessionId) {
      const existing = await this.resumeSession(request.resumeSessionId);
      if (existing) {
        logger.info('[SandboxManager] Resumed existing session', {
          sessionId: request.resumeSessionId,
          sandboxId: existing.sandbox.sandboxId,
        });
        return existing;
      }
    }

    // For chat executions, try to find existing project session
    if (request.executionType === 'chat') {
      const existingSession = await this.findProjectSession(
        request.projectId,
        request.userId,
      );
      if (existingSession) {
        logger.info('[SandboxManager] Found existing project session', {
          sessionId: existingSession.session.sessionId,
          turnCount: existingSession.session.turnCount,
        });
        return existingSession;
      }
    }

    // Create new sandbox and session
    const sandbox = await this.filesystemService.getOrCreateSandbox(
      request.projectId,
      request.userId,
      sandboxType,
    );

    const session = await this.filesystemService.createSession(
      sandbox.sandboxId,
      request.projectId,
      request.userId,
    );

    // Store in Redis for fast lookup
    await this.storeInRedis(sandbox, session);

    const result: SandboxSession = {
      sandbox,
      session,
      sdkOptions: this.filesystemService.getSdkOptions(sandbox),
    };

    logger.info('[SandboxManager] Provisioned new sandbox', {
      sandboxId: sandbox.sandboxId,
      sessionId: session.sessionId,
      type: sandboxType,
      executionType: request.executionType,
    });

    return result;
  }

  /**
   * Release a sandbox after execution
   */
  async releaseSandbox(
    sandboxId: string,
    options: { keepSession?: boolean; endSession?: boolean } = {},
  ): Promise<void> {
    const sandbox = await this.filesystemService.getSandbox(sandboxId);
    if (!sandbox) return;

    if (sandbox.type === 'ephemeral') {
      // Clean up ephemeral sandboxes immediately
      await this.filesystemService.deleteSandbox(sandboxId);
      await this.removeFromRedis(sandboxId);
      logger.info('[SandboxManager] Released ephemeral sandbox', { sandboxId });
    } else if (options.endSession) {
      // End session but keep sandbox for resumption
      const session = await this.filesystemService.getActiveSession(
        sandbox.projectId,
        sandbox.userId,
      );
      if (session) {
        await this.filesystemService.endSession(session.sessionId);
      }
      logger.info('[SandboxManager] Ended session, keeping sandbox', {
        sandboxId,
      });
    }
    // Persistent sandboxes are kept for resumption unless explicitly deleted
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Resume an existing session
   */
  private async resumeSession(
    sessionId: string,
  ): Promise<SandboxSession | null> {
    // Try Redis first
    const sessionData = await this.getSessionFromRedis(sessionId);
    if (sessionData) {
      const sandbox = await this.filesystemService.getSandbox(
        sessionData.sandboxId,
      );
      const session = await this.filesystemService.getSession(sessionId);

      if (sandbox && session) {
        return {
          sandbox,
          session,
          sdkOptions: this.filesystemService.getSdkOptions(sandbox),
        };
      }
    }

    // Try filesystem
    const session = await this.filesystemService.getSession(sessionId);
    if (session) {
      const sandbox = await this.filesystemService.getSandbox(session.sandboxId);
      if (sandbox) {
        return {
          sandbox,
          session,
          sdkOptions: this.filesystemService.getSdkOptions(sandbox),
        };
      }
    }

    return null;
  }

  /**
   * Find existing session for a project
   */
  private async findProjectSession(
    projectId: string,
    userId: string,
  ): Promise<SandboxSession | null> {
    // Try Redis first
    if (isRedisAvailable()) {
      const redis = redisClient;
      if (redis) {
        const sessionId = await redis.get(
          REDIS_KEYS.projectSession(projectId, userId),
        );
        if (sessionId) {
          return this.resumeSession(sessionId);
        }
      }
    }

    // Try filesystem
    const session = await this.filesystemService.getActiveSession(
      projectId,
      userId,
    );
    if (session) {
      const sandbox = await this.filesystemService.getSandbox(session.sandboxId);
      if (sandbox) {
        return {
          sandbox,
          session,
          sdkOptions: this.filesystemService.getSdkOptions(sandbox),
        };
      }
    }

    return null;
  }

  /**
   * Append message to session history
   */
  async appendToHistory(
    sessionId: string,
    message: Record<string, unknown>,
  ): Promise<void> {
    await this.filesystemService.appendToHistory(sessionId, message);
  }

  /**
   * Read session history
   */
  async readHistory(sessionId: string): Promise<Record<string, unknown>[]> {
    return this.filesystemService.readHistory(sessionId);
  }

  // ==========================================================================
  // Redis Operations
  // ==========================================================================

  /**
   * Store sandbox and session in Redis
   */
  private async storeInRedis(
    sandbox: SandboxConfig,
    session: SessionState,
  ): Promise<void> {
    if (!isRedisAvailable()) return;

    const redis = redisClient;
    if (!redis) return;

    try {
      const pipeline = redis.pipeline();

      // Store session metadata
      pipeline.set(
        REDIS_KEYS.session(session.sessionId),
        JSON.stringify({
          sessionId: session.sessionId,
          sandboxId: sandbox.sandboxId,
          projectId: session.projectId,
          userId: session.userId,
          type: sandbox.type,
          createdAt: session.lastMessageAt.toISOString(),
        }),
        'EX',
        60 * 60 * 24 * 7, // 7 days TTL
      );

      // Store project -> session mapping for persistent sandboxes
      if (sandbox.type === 'persistent') {
        pipeline.set(
          REDIS_KEYS.projectSession(session.projectId, session.userId),
          session.sessionId,
          'EX',
          60 * 60 * 24 * 7, // 7 days TTL
        );
      }

      // Add to active sandboxes set
      pipeline.sadd(REDIS_KEYS.activeSandboxes, sandbox.sandboxId);

      await pipeline.exec();
    } catch (error) {
      logger.warn('[SandboxManager] Failed to store in Redis', { error });
    }
  }

  /**
   * Get session data from Redis
   */
  private async getSessionFromRedis(
    sessionId: string,
  ): Promise<{ sandboxId: string; projectId: string; userId: string } | null> {
    if (!isRedisAvailable()) return null;

    const redis = redisClient;
    if (!redis) return null;

    try {
      const data = await redis.get(REDIS_KEYS.session(sessionId));
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      logger.warn('[SandboxManager] Failed to get from Redis', { error });
    }

    return null;
  }

  /**
   * Remove sandbox from Redis
   */
  private async removeFromRedis(sandboxId: string): Promise<void> {
    if (!isRedisAvailable()) return;

    const redis = redisClient;
    if (!redis) return;

    try {
      await redis.srem(REDIS_KEYS.activeSandboxes, sandboxId);
    } catch (error) {
      logger.warn('[SandboxManager] Failed to remove from Redis', { error });
    }
  }

  /**
   * Restore active sandboxes from Redis on startup
   */
  private async restoreFromRedis(): Promise<void> {
    const redis = redisClient;
    if (!redis) return;

    try {
      const activeSandboxes = await redis.smembers(REDIS_KEYS.activeSandboxes);
      logger.info('[SandboxManager] Found active sandboxes in Redis', {
        count: activeSandboxes.length,
      });

      // Validate each sandbox still exists on filesystem
      for (const sandboxId of activeSandboxes) {
        const sandbox = await this.filesystemService.getSandbox(sandboxId);
        if (!sandbox) {
          // Clean up stale Redis entry
          await redis.srem(REDIS_KEYS.activeSandboxes, sandboxId);
        }
      }
    } catch (error) {
      logger.warn('[SandboxManager] Failed to restore from Redis', { error });
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Determine sandbox type based on execution type
   */
  private getSandboxType(
    executionType: SandboxRequest['executionType'],
  ): 'persistent' | 'ephemeral' {
    switch (executionType) {
      case 'chat':
        // Chat sessions should be resumable
        return 'persistent';
      case 'task':
      case 'workflow':
        // One-off executions are ephemeral
        return 'ephemeral';
      default:
        return 'ephemeral';
    }
  }

  /**
   * Get statistics about sandbox usage
   */
  async getStats(): Promise<SandboxStats> {
    // This would need to be implemented based on actual tracking
    // For now, return placeholder stats
    return {
      totalSandboxes: 0,
      persistentCount: 0,
      ephemeralCount: 0,
      activeSessions: 0,
      storageUsed: 0,
    };
  }

  /**
   * Shutdown the sandbox manager
   */
  async shutdown(): Promise<void> {
    await this.filesystemService.shutdown();
    logger.info('[SandboxManager] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sandboxManagerInstance: SandboxManager | null = null;

/**
 * Get or create the sandbox manager instance
 */
export function getSandboxManager(): SandboxManager {
  if (!sandboxManagerInstance) {
    sandboxManagerInstance = new SandboxManager();
  }
  return sandboxManagerInstance;
}

/**
 * Initialize and get the sandbox manager
 */
export async function initSandboxManager(): Promise<SandboxManager> {
  const manager = getSandboxManager();
  await manager.initialize();
  return manager;
}
