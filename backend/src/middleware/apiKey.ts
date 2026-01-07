/**
 * API Key Authentication Middleware
 *
 * This module provides middleware for API key-based authentication.
 * It validates API keys from the X-API-Key header, checks for expiration,
 * implements rate limiting, and attaches user information to the request.
 *
 * Usage:
 * ```typescript
 * import { requireApiKey, optionalApiKey } from '@/middleware/apiKey';
 *
 * // Require API key authentication
 * router.get('/api/data', requireApiKey, handler);
 *
 * // Optional API key (falls through if not provided)
 * router.get('/api/public', optionalApiKey, handler);
 *
 * // With scope validation
 * router.post('/api/agents', requireApiKey, requireApiKeyScope('agents:write'), handler);
 * ```
 *
 * @module middleware/apiKey
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';
import { AuthenticatedUser } from './auth';

/**
 * API Key information attached to request
 */
export interface ApiKeyInfo {
  /** API Key ID */
  id: string;
  /** API Key name */
  name: string;
  /** Allowed scopes */
  scopes: string[];
}

/**
 * Extend Express Request to include apiKey
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: ApiKeyInfo;
    }
  }
}

/**
 * API Key header name
 */
const API_KEY_HEADER = 'x-api-key';

/**
 * Redis key prefix for rate limiting
 */
const RATE_LIMIT_PREFIX = 'ratelimit:apikey:';

/**
 * Rate limit window in seconds (1 minute)
 */
const RATE_LIMIT_WINDOW = 60;

/**
 * Hash an API key for secure storage/lookup
 * Uses SHA-256 which is consistent with how keys are stored in the database
 */
export const hashApiKey = (key: string): string => {
  return createHash('sha256').update(key).digest('hex');
};

/**
 * Extract API key from request header
 */
const extractApiKey = (req: Request): string | null => {
  const apiKey = req.headers[API_KEY_HEADER];

  if (!apiKey) {
    return null;
  }

  // Handle array (multiple headers with same name)
  if (Array.isArray(apiKey)) {
    return apiKey[0] || null;
  }

  return apiKey;
};

/**
 * Check rate limit for API key
 *
 * @param keyId - API key ID for rate limiting
 * @param limit - Rate limit per minute
 * @returns Object with allowed status and remaining requests
 */
const checkRateLimit = async (
  keyId: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  if (!redis) {
    // If Redis is not available, allow the request but log warning
    logger.warn('[ApiKey] Rate limiting skipped - Redis not available');
    return { allowed: true, remaining: limit, resetAt: Date.now() + RATE_LIMIT_WINDOW * 1000 };
  }

  const key = `${RATE_LIMIT_PREFIX}${keyId}`;
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW * 1000;
  const windowEnd = windowStart + RATE_LIMIT_WINDOW * 1000;

  try {
    // Use Redis MULTI for atomic operations
    const multi = redis.multi();

    // Increment counter
    multi.incr(key);
    // Set expiry if key is new
    multi.expire(key, RATE_LIMIT_WINDOW);
    // Get current value
    multi.get(key);

    const results = await multi.exec();

    if (!results) {
      logger.error('[ApiKey] Rate limit check failed - no results from Redis');
      return { allowed: true, remaining: limit, resetAt: windowEnd };
    }

    // Get the counter value from the INCR result
    // Results format: [error, result] for each command
    const incrResult = results[0];
    const incrValue = incrResult?.[1];
    const count = typeof incrValue === 'number' ? incrValue : 1;

    const remaining = Math.max(0, limit - count);
    const allowed = count <= limit;

    if (!allowed) {
      logger.debug('[ApiKey] Rate limit exceeded:', {
        keyId,
        count,
        limit,
        resetAt: new Date(windowEnd).toISOString(),
      });
    }

    return { allowed, remaining, resetAt: windowEnd };
  } catch (error) {
    logger.error('[ApiKey] Rate limit check error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Allow request on error to avoid blocking legitimate traffic
    return { allowed: true, remaining: limit, resetAt: windowEnd };
  }
};

/**
 * Update API key usage statistics
 */
const updateApiKeyUsage = async (keyId: string): Promise<void> => {
  if (!prisma) {
    logger.warn('[ApiKey] Cannot update usage - Prisma not available');
    return;
  }

  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastUsedAt: new Date(),
        usageCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    // Log but don't fail the request
    logger.error('[ApiKey] Failed to update usage:', {
      keyId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * API Key authentication middleware - requires valid API key
 *
 * Validates the API key from the X-API-Key header and attaches
 * user information to the request object.
 *
 * Returns 401 if:
 * - No X-API-Key header present
 * - API key is invalid or not found
 * - API key is inactive or expired
 *
 * Returns 429 if:
 * - Rate limit exceeded for this API key
 */
export const requireApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if Prisma is available
    if (!prisma) {
      logger.error('[ApiKey] Prisma client not available');
      throw new ApiError(500, 'Database service unavailable', ErrorCodes.SERVICE_UNAVAILABLE);
    }

    // Extract API key from header
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      throw new ApiError(
        401,
        'API key required. Please provide a valid API key in the X-API-Key header.',
        ErrorCodes.UNAUTHORIZED,
      );
    }

    // Hash the key for lookup
    const keyHash = hashApiKey(apiKey);

    // Look up the API key in the database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });

    // Key not found
    if (!apiKeyRecord) {
      logger.debug('[ApiKey] API key not found:', { keyPrefix: apiKey.substring(0, 8) });
      throw new ApiError(401, 'Invalid API key', ErrorCodes.UNAUTHORIZED);
    }

    // Key is inactive
    if (!apiKeyRecord.isActive) {
      logger.debug('[ApiKey] API key is inactive:', { keyId: apiKeyRecord.id });
      throw new ApiError(401, 'API key is inactive', ErrorCodes.UNAUTHORIZED);
    }

    // Key is deleted (soft delete)
    if (apiKeyRecord.deletedAt) {
      logger.debug('[ApiKey] API key is deleted:', { keyId: apiKeyRecord.id });
      throw new ApiError(401, 'API key is invalid', ErrorCodes.UNAUTHORIZED);
    }

    // Key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      logger.debug('[ApiKey] API key has expired:', {
        keyId: apiKeyRecord.id,
        expiresAt: apiKeyRecord.expiresAt,
      });
      throw new ApiError(401, 'API key has expired', ErrorCodes.UNAUTHORIZED);
    }

    // User is inactive or deleted
    if (!apiKeyRecord.user.isActive || apiKeyRecord.user.deletedAt) {
      logger.debug('[ApiKey] User is inactive or deleted:', {
        userId: apiKeyRecord.user.id,
      });
      throw new ApiError(401, 'User account is inactive', ErrorCodes.UNAUTHORIZED);
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimitPerMinute);

    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', apiKeyRecord.rateLimitPerMinute);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimit.resetAt / 1000));

    if (!rateLimit.allowed) {
      throw new ApiError(
        429,
        'Rate limit exceeded. Please try again later.',
        ErrorCodes.TOO_MANY_REQUESTS,
      );
    }

    // Create authenticated user from API key
    const authenticatedUser: AuthenticatedUser = {
      userId: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
      role: apiKeyRecord.user.role as 'ADMIN' | 'USER' | 'AGENT',
    };

    // Attach user to request
    req.user = authenticatedUser;

    // Store API key info on request for scope validation
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      scopes: apiKeyRecord.scopes,
    };

    logger.debug('[ApiKey] API key authenticated:', {
      keyId: apiKeyRecord.id,
      userId: apiKeyRecord.user.id,
      keyName: apiKeyRecord.name,
    });

    // Update usage statistics asynchronously (don't wait)
    updateApiKeyUsage(apiKeyRecord.id).catch(() => {
      // Error already logged in updateApiKeyUsage
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('[ApiKey] Unexpected authentication error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(new ApiError(500, 'API key authentication failed', ErrorCodes.INTERNAL_ERROR));
    }
  }
};

/**
 * Optional API key authentication middleware
 *
 * Attempts to authenticate with API key but allows request to proceed
 * even if no API key is provided. Sets req.user if authentication succeeds.
 *
 * Returns 401 only if API key is provided but invalid.
 * Returns 429 if rate limit exceeded.
 */
export const optionalApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Check if API key is provided
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    // No API key provided - continue without authentication
    next();
    return;
  }

  // API key provided - validate it
  await requireApiKey(req, res, next);
};

/**
 * API key scope validation middleware factory
 *
 * Creates middleware that checks if the API key has the required scope.
 * Must be used after requireApiKey middleware.
 *
 * @param requiredScope - The scope required for this endpoint
 * @returns Express middleware
 *
 * Usage:
 * ```typescript
 * router.post('/agents', requireApiKey, requireApiKeyScope('agents:write'), handler);
 * ```
 */
export const requireApiKeyScope = (requiredScope: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const apiKeyInfo = req.apiKey;

    if (!apiKeyInfo) {
      logger.warn('[ApiKey] requireApiKeyScope called without API key info');
      next(new ApiError(401, 'API key required', ErrorCodes.UNAUTHORIZED));
      return;
    }

    const scopes: string[] = apiKeyInfo.scopes;

    // Check for wildcard scope (full access)
    if (scopes.includes('*')) {
      logger.debug('[ApiKey] Wildcard scope - access granted');
      next();
      return;
    }

    // Check for exact scope match
    if (scopes.includes(requiredScope)) {
      logger.debug('[ApiKey] Scope check passed:', { requiredScope, scopes });
      next();
      return;
    }

    // Check for parent scope (e.g., 'agents' grants 'agents:read' and 'agents:write')
    const scopePrefix = requiredScope.split(':')[0] || requiredScope;
    if (scopePrefix && scopes.includes(scopePrefix)) {
      logger.debug('[ApiKey] Parent scope check passed:', {
        requiredScope,
        parentScope: scopePrefix,
      });
      next();
      return;
    }

    logger.debug('[ApiKey] Scope check failed:', {
      keyId: apiKeyInfo.id,
      requiredScope,
      availableScopes: scopes,
    });

    next(
      new ApiError(
        403,
        `API key does not have the required scope: ${requiredScope}`,
        ErrorCodes.FORBIDDEN,
      ),
    );
  };
};

/**
 * Get API key info from request (if authenticated via API key)
 */
export const getApiKeyInfo = (req: Request): ApiKeyInfo | undefined => {
  return req.apiKey;
};

/**
 * Check if request is authenticated via API key
 */
export const isApiKeyAuthenticated = (req: Request): boolean => {
  return !!req.apiKey;
};

export default {
  requireApiKey,
  optionalApiKey,
  requireApiKeyScope,
  hashApiKey,
  getApiKeyInfo,
  isApiKeyAuthenticated,
};
