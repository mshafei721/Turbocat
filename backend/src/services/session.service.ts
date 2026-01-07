/**
 * Session Management Service
 *
 * This service handles user sessions using Redis for storage.
 * Sessions are used to track authenticated users and allow for
 * session invalidation (logout, security events).
 *
 * Session Features:
 * - 7-day expiry by default
 * - Stores user context (role, IP, user agent)
 * - Allows invalidation of individual or all sessions
 * - Session refresh capability
 *
 * Storage Format:
 * Key: session:{sessionId}
 * Value: JSON { userId, role, ipAddress, userAgent, createdAt, lastAccessedAt }
 * TTL: 7 days (604800 seconds)
 *
 * @module services/session.service
 */

import { v4 as uuidv4 } from 'uuid';
import { redis, isRedisAvailable, setWithExpiry, getAndParse, deleteKey } from '../lib/redis';
import { logger } from '../lib/logger';

/**
 * Session data stored in Redis
 */
export interface SessionData {
  /** Unique session identifier */
  sessionId: string;
  /** User ID associated with this session */
  userId: string;
  /** User role at time of session creation */
  role: 'ADMIN' | 'USER' | 'AGENT';
  /** IP address of the client */
  ipAddress: string;
  /** User agent string of the client */
  userAgent: string;
  /** Session creation timestamp (ISO string) */
  createdAt: string;
  /** Last access timestamp (ISO string) */
  lastAccessedAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session creation input
 */
export interface CreateSessionInput {
  userId: string;
  role: 'ADMIN' | 'USER' | 'AGENT';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
}

/**
 * Session statistics
 */
export interface SessionStats {
  activeSessions: number;
  oldestSession?: Date;
  newestSession?: Date;
}

/**
 * Session key prefix
 */
const SESSION_PREFIX = 'session:';

/**
 * User sessions index key prefix
 * Used to track all sessions for a user
 */
const USER_SESSIONS_PREFIX = 'user_sessions:';

/**
 * Default session TTL in seconds (7 days)
 */
const DEFAULT_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 604800 seconds

/**
 * Get session TTL from environment or use default
 */
const getSessionTTL = (): number => {
  const customTTL = process.env.SESSION_TTL_SECONDS;
  if (customTTL) {
    const parsed = parseInt(customTTL, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_SESSION_TTL_SECONDS;
};

/**
 * Generate session key from session ID
 */
const getSessionKey = (sessionId: string): string => {
  return `${SESSION_PREFIX}${sessionId}`;
};

/**
 * Generate user sessions set key from user ID
 */
const getUserSessionsKey = (userId: string): string => {
  return `${USER_SESSIONS_PREFIX}${userId}`;
};

/**
 * Create a new session
 *
 * @param input - Session creation input
 * @returns Created session data with session ID
 * @throws Error if Redis is not available
 *
 * Usage:
 * ```typescript
 * const session = await createSession({
 *   userId: 'user-123',
 *   role: 'USER',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent']
 * });
 * ```
 */
export const createSession = async (input: CreateSessionInput): Promise<SessionData> => {
  if (!isRedisAvailable() || !redis) {
    throw new Error('Redis is not available for session management');
  }

  const sessionId = uuidv4();
  const now = new Date().toISOString();

  const sessionData: SessionData = {
    sessionId,
    userId: input.userId,
    role: input.role,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    createdAt: now,
    lastAccessedAt: now,
    metadata: input.metadata,
  };

  const sessionKey = getSessionKey(sessionId);
  const ttl = getSessionTTL();

  // Store session data
  const success = await setWithExpiry(sessionKey, sessionData, ttl);

  if (!success) {
    throw new Error('Failed to create session in Redis');
  }

  // Add session ID to user's session set (for tracking all user sessions)
  const userSessionsKey = getUserSessionsKey(input.userId);
  try {
    await redis.sadd(userSessionsKey, sessionId);
    // Set expiry on the set itself (slightly longer than session TTL)
    await redis.expire(userSessionsKey, ttl + 3600);
  } catch (error) {
    logger.warn('[Session] Failed to add session to user index:', {
      userId: input.userId,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Non-fatal: session still works, just not indexed
  }

  logger.info('[Session] Created session:', {
    sessionId,
    userId: input.userId,
    role: input.role,
  });

  return sessionData;
};

/**
 * Get session by ID
 *
 * @param sessionId - The session ID to retrieve
 * @returns Session data or null if not found/expired
 *
 * Usage:
 * ```typescript
 * const session = await getSession('session-id-here');
 * if (session) {
 *   console.log('User:', session.userId);
 * }
 * ```
 */
export const getSession = async (sessionId: string): Promise<SessionData | null> => {
  if (!isRedisAvailable()) {
    logger.warn('[Session] Cannot get session - Redis not available');
    return null;
  }

  const sessionKey = getSessionKey(sessionId);
  const session = await getAndParse<SessionData>(sessionKey);

  return session;
};

/**
 * Validate a session
 *
 * @param sessionId - The session ID to validate
 * @returns Validation result with session data if valid
 *
 * Usage:
 * ```typescript
 * const result = await validateSession('session-id');
 * if (result.valid) {
 *   console.log('Session is valid for user:', result.session.userId);
 * } else {
 *   console.log('Invalid session:', result.error);
 * }
 * ```
 */
export const validateSession = async (sessionId: string): Promise<SessionValidationResult> => {
  if (!sessionId) {
    return { valid: false, error: 'Session ID is required' };
  }

  const session = await getSession(sessionId);

  if (!session) {
    return { valid: false, error: 'Session not found or expired' };
  }

  return { valid: true, session };
};

/**
 * Refresh session (update last accessed time and extend TTL)
 *
 * @param sessionId - The session ID to refresh
 * @returns Updated session data or null if not found
 *
 * Usage:
 * ```typescript
 * const refreshedSession = await refreshSession('session-id');
 * ```
 */
export const refreshSession = async (sessionId: string): Promise<SessionData | null> => {
  if (!isRedisAvailable() || !redis) {
    logger.warn('[Session] Cannot refresh session - Redis not available');
    return null;
  }

  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  // Update last accessed time
  session.lastAccessedAt = new Date().toISOString();

  const sessionKey = getSessionKey(sessionId);
  const ttl = getSessionTTL();

  // Update session with new TTL
  const success = await setWithExpiry(sessionKey, session, ttl);

  if (!success) {
    logger.warn('[Session] Failed to refresh session:', { sessionId });
    return null;
  }

  return session;
};

/**
 * Invalidate a session (logout)
 *
 * @param sessionId - The session ID to invalidate
 * @returns True if session was deleted
 *
 * Usage:
 * ```typescript
 * const success = await invalidateSession('session-id');
 * if (success) {
 *   console.log('User logged out');
 * }
 * ```
 */
export const invalidateSession = async (sessionId: string): Promise<boolean> => {
  if (!isRedisAvailable() || !redis) {
    logger.warn('[Session] Cannot invalidate session - Redis not available');
    return false;
  }

  // Get session first to remove from user index
  const session = await getSession(sessionId);

  const sessionKey = getSessionKey(sessionId);
  const deleted = await deleteKey(sessionKey);

  // Remove from user's session set
  if (session) {
    const userSessionsKey = getUserSessionsKey(session.userId);
    try {
      await redis.srem(userSessionsKey, sessionId);
    } catch (error) {
      logger.warn('[Session] Failed to remove session from user index:', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (deleted) {
    logger.info('[Session] Invalidated session:', { sessionId });
  }

  return deleted;
};

/**
 * Invalidate all sessions for a user
 *
 * @param userId - The user ID whose sessions to invalidate
 * @returns Number of sessions invalidated
 *
 * Usage:
 * ```typescript
 * const count = await invalidateAllUserSessions('user-123');
 * console.log(`Invalidated ${count} sessions`);
 * ```
 */
export const invalidateAllUserSessions = async (userId: string): Promise<number> => {
  if (!isRedisAvailable() || !redis) {
    logger.warn('[Session] Cannot invalidate user sessions - Redis not available');
    return 0;
  }

  const userSessionsKey = getUserSessionsKey(userId);

  try {
    // Get all session IDs for this user
    const sessionIds = await redis.smembers(userSessionsKey);

    if (sessionIds.length === 0) {
      // Fallback: scan for sessions by pattern (slower but comprehensive)
      const pattern = `${SESSION_PREFIX}*`;
      let cursor = '0';
      let deletedCount = 0;

      do {
        const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];

        for (const key of keys) {
          const session = await getAndParse<SessionData>(key);
          if (session && session.userId === userId) {
            await redis.del(key);
            deletedCount++;
          }
        }
      } while (cursor !== '0');

      logger.info('[Session] Invalidated all user sessions (by scan):', {
        userId,
        count: deletedCount,
      });

      return deletedCount;
    }

    // Delete all sessions
    const sessionKeys = sessionIds.map((id) => getSessionKey(id));
    const deletedCount = await redis.del(...sessionKeys);

    // Delete the user sessions set
    await redis.del(userSessionsKey);

    logger.info('[Session] Invalidated all user sessions:', {
      userId,
      count: deletedCount,
    });

    return deletedCount;
  } catch (error) {
    logger.error('[Session] Failed to invalidate user sessions:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
};

/**
 * Get all active sessions for a user
 *
 * @param userId - The user ID to get sessions for
 * @returns Array of session data
 *
 * Usage:
 * ```typescript
 * const sessions = await getUserSessions('user-123');
 * console.log(`User has ${sessions.length} active sessions`);
 * ```
 */
export const getUserSessions = async (userId: string): Promise<SessionData[]> => {
  if (!isRedisAvailable() || !redis) {
    logger.warn('[Session] Cannot get user sessions - Redis not available');
    return [];
  }

  const userSessionsKey = getUserSessionsKey(userId);

  try {
    const sessionIds = await redis.smembers(userSessionsKey);
    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push(session);
      } else {
        // Clean up expired session from index
        await redis.srem(userSessionsKey, sessionId);
      }
    }

    return sessions;
  } catch (error) {
    logger.error('[Session] Failed to get user sessions:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Count active sessions for a user
 *
 * @param userId - The user ID to count sessions for
 * @returns Number of active sessions
 */
export const countUserSessions = async (userId: string): Promise<number> => {
  if (!isRedisAvailable() || !redis) {
    return 0;
  }

  try {
    // Verify by checking actual sessions (more accurate if sessions expired)
    const sessions = await getUserSessions(userId);
    return sessions.length;
  } catch (error) {
    logger.error('[Session] Failed to count user sessions:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
};

/**
 * Update session metadata
 *
 * @param sessionId - The session ID to update
 * @param metadata - New metadata to merge
 * @returns Updated session or null if not found
 */
export const updateSessionMetadata = async (
  sessionId: string,
  metadata: Record<string, unknown>,
): Promise<SessionData | null> => {
  if (!isRedisAvailable()) {
    return null;
  }

  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  session.metadata = {
    ...session.metadata,
    ...metadata,
  };
  session.lastAccessedAt = new Date().toISOString();

  const sessionKey = getSessionKey(sessionId);
  const ttl = getSessionTTL();

  const success = await setWithExpiry(sessionKey, session, ttl);

  return success ? session : null;
};

/**
 * Check if session service is available
 */
export const isSessionServiceAvailable = (): boolean => {
  return isRedisAvailable();
};

/**
 * Session service configuration info
 */
export const getSessionServiceInfo = (): {
  available: boolean;
  ttlSeconds: number;
  ttlHuman: string;
} => {
  const ttl = getSessionTTL();
  const days = Math.floor(ttl / 86400);
  const hours = Math.floor((ttl % 86400) / 3600);

  let ttlHuman = '';
  if (days > 0) {
    ttlHuman += `${days}d `;
  }
  if (hours > 0) {
    ttlHuman += `${hours}h`;
  }
  if (!ttlHuman) {
    ttlHuman = `${ttl}s`;
  }

  return {
    available: isRedisAvailable(),
    ttlSeconds: ttl,
    ttlHuman: ttlHuman.trim(),
  };
};

export default {
  createSession,
  getSession,
  validateSession,
  refreshSession,
  invalidateSession,
  invalidateAllUserSessions,
  getUserSessions,
  countUserSessions,
  updateSessionMetadata,
  isSessionServiceAvailable,
  getSessionServiceInfo,
};
