/**
 * Authentication Middleware
 *
 * This module provides middleware for JWT-based authentication.
 * It validates access tokens from the Authorization header and
 * attaches user information to the request object.
 *
 * Usage:
 * ```typescript
 * import { requireAuth, optionalAuth } from '@/middleware/auth';
 *
 * // Require authentication
 * router.get('/protected', requireAuth, (req, res) => {
 *   console.log('User:', req.user);
 * });
 *
 * // Optional authentication
 * router.get('/public', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     console.log('Authenticated user:', req.user);
 *   }
 * });
 * ```
 *
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isJwtConfigured } from '../utils/jwt';
import { validateSession } from '../services/session.service';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';

/**
 * Authenticated user attached to request
 */
export interface AuthenticatedUser {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User role */
  role: 'ADMIN' | 'USER' | 'AGENT';
  /** Session ID (if session validation enabled) */
  sessionId?: string;
}

/**
 * Extend Express Request to include user
 * Note: Using namespace is required for Express type augmentation
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Raw token for logging/debugging */
      token?: string;
    }
  }
}

/**
 * Authentication options
 */
export interface AuthOptions {
  /** Whether to validate session in Redis (default: true) */
  validateSession?: boolean;
  /** Whether to refresh session on valid request (default: false) */
  refreshSession?: boolean;
}

/**
 * Extract Bearer token from Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The token or null if not found/invalid format
 */
const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // If it's a JWT-like string (contains two dots), treat as raw token
  if (authHeader.includes('.') && authHeader.split('.').length === 3) {
    return authHeader;
  }

  return null;
};

/**
 * Verify access token and attach user to request
 *
 * @param token - The JWT access token
 * @param options - Authentication options
 * @returns Authenticated user or throws ApiError
 */
export const verifyAndGetUser = async (
  token: string,
  options: AuthOptions = {},
): Promise<AuthenticatedUser> => {
  const { validateSession: shouldValidateSession = true } = options;

  // Verify JWT
  const result = verifyAccessToken(token);

  if (!result.valid || !result.payload) {
    const errorMessage =
      result.errorCode === 'EXPIRED'
        ? 'Access token has expired'
        : result.errorCode === 'MALFORMED'
          ? 'Invalid access token format'
          : 'Invalid access token';

    throw new ApiError(401, errorMessage, ErrorCodes.UNAUTHORIZED);
  }

  const payload = result.payload;

  // Validate session if enabled and session ID exists
  if (shouldValidateSession && payload.sessionId) {
    const sessionResult = await validateSession(payload.sessionId);

    if (!sessionResult.valid) {
      logger.debug('[Auth] Session validation failed:', {
        sessionId: payload.sessionId,
        error: sessionResult.error,
      });

      throw new ApiError(401, 'Session has expired or been invalidated', ErrorCodes.UNAUTHORIZED);
    }
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  };
};

/**
 * Authentication middleware - requires valid JWT
 *
 * Validates the JWT access token from the Authorization header
 * and attaches the user to the request object.
 *
 * Returns 401 if:
 * - No Authorization header present
 * - Token is invalid or expired
 * - Session is invalid (if session validation enabled)
 *
 * Usage:
 * ```typescript
 * router.get('/profile', requireAuth, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if JWT is configured
    if (!isJwtConfigured()) {
      logger.error('[Auth] JWT secrets not configured');
      throw new ApiError(500, 'Authentication system not configured', ErrorCodes.INTERNAL_ERROR);
    }

    // Extract token from header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new ApiError(
        401,
        'Authentication required. Please provide a valid access token in the Authorization header.',
        ErrorCodes.UNAUTHORIZED,
      );
    }

    // Store raw token for debugging
    req.token = token;

    // Verify token and get user
    const user = await verifyAndGetUser(token);

    // Attach user to request
    req.user = user;

    logger.debug('[Auth] User authenticated:', {
      userId: user.userId,
      role: user.role,
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('[Auth] Unexpected authentication error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(new ApiError(500, 'Authentication failed', ErrorCodes.INTERNAL_ERROR));
    }
  }
};

/**
 * Optional authentication middleware
 *
 * Attempts to authenticate but allows request to proceed even if
 * no token is provided. Sets req.user if authentication succeeds.
 *
 * Returns 401 only if token is provided but invalid.
 *
 * Usage:
 * ```typescript
 * router.get('/content', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Show personalized content
 *   } else {
 *     // Show public content
 *   }
 * });
 * ```
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if JWT is configured
    if (!isJwtConfigured()) {
      // Silently skip authentication if not configured
      next();
      return;
    }

    // Extract token from header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      // No token provided - continue without authentication
      next();
      return;
    }

    // Store raw token for debugging
    req.token = token;

    // Try to verify token and get user
    try {
      const user = await verifyAndGetUser(token);
      req.user = user;

      logger.debug('[Auth] Optional auth - user authenticated:', {
        userId: user.userId,
      });
    } catch (authError) {
      // If token was provided but invalid, reject
      if (authError instanceof ApiError && authError.statusCode === 401) {
        next(authError);
        return;
      }
      // For other errors, just log and continue without auth
      logger.warn('[Auth] Optional auth - verification failed:', {
        error: authError instanceof Error ? authError.message : String(authError),
      });
    }

    next();
  } catch (error) {
    logger.error('[Auth] Unexpected optional auth error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue without authentication on unexpected errors
    next();
  }
};

/**
 * Create authentication middleware with custom options
 *
 * @param options - Custom authentication options
 * @returns Configured authentication middleware
 *
 * Usage:
 * ```typescript
 * // Skip session validation for stateless endpoints
 * router.get('/stateless', createAuthMiddleware({ validateSession: false }), handler);
 * ```
 */
export const createAuthMiddleware = (options: AuthOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!isJwtConfigured()) {
        throw new ApiError(500, 'Authentication system not configured', ErrorCodes.INTERNAL_ERROR);
      }

      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        throw new ApiError(401, 'Authentication required', ErrorCodes.UNAUTHORIZED);
      }

      req.token = token;
      const user = await verifyAndGetUser(token, options);
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'Authentication failed', ErrorCodes.INTERNAL_ERROR));
      }
    }
  };
};

/**
 * Check if request is authenticated
 *
 * @param req - Express request object
 * @returns True if request has authenticated user
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.user;
};

/**
 * Get authenticated user from request
 *
 * @param req - Express request object
 * @returns Authenticated user or undefined
 */
export const getAuthenticatedUser = (req: Request): AuthenticatedUser | undefined => {
  return req.user;
};

/**
 * Require specific user ID match
 * Useful for ensuring user can only access their own resources
 *
 * @param req - Express request object
 * @param userId - User ID to match against
 * @returns True if authenticated user matches the provided user ID
 */
export const isRequestUser = (req: Request, userId: string): boolean => {
  return req.user?.userId === userId;
};

/**
 * Get request context for logging
 */
export const getAuthContext = (req: Request): Record<string, unknown> => {
  return {
    authenticated: isAuthenticated(req),
    userId: req.user?.userId,
    role: req.user?.role,
    sessionId: req.user?.sessionId,
  };
};

/**
 * Role-based access control middleware factory
 *
 * Creates middleware that checks if the authenticated user has one of the required roles.
 * Must be used after requireAuth middleware.
 *
 * @param roles - Allowed roles (ADMIN, USER, AGENT)
 * @returns Express middleware
 *
 * Usage:
 * ```typescript
 * // Single role
 * router.get('/admin', requireAuth, requireRole('ADMIN'), handler);
 *
 * // Multiple roles
 * router.get('/staff', requireAuth, requireRole('ADMIN', 'USER'), handler);
 * ```
 */
export const requireRole = (...roles: Array<'ADMIN' | 'USER' | 'AGENT'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('[Auth] requireRole called without authenticated user');
      next(new ApiError(401, 'Authentication required', ErrorCodes.UNAUTHORIZED));
      return;
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      logger.debug('[Auth] Access denied - insufficient role:', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      next(
        new ApiError(
          403,
          `Access denied. Required role: ${roles.join(' or ')}`,
          ErrorCodes.FORBIDDEN,
        ),
      );
      return;
    }

    logger.debug('[Auth] Role check passed:', {
      userId: req.user.userId,
      role: req.user.role,
    });

    next();
  };
};

/**
 * Resource getter function type for ownership validation
 * Returns the resource with a userId field, or null if not found
 */
export type ResourceGetter<T extends { userId: string }> = (req: Request) => Promise<T | null>;

/**
 * Ownership validation middleware factory
 *
 * Creates middleware that loads a resource and validates ownership.
 * Admins bypass the ownership check and can access any resource.
 * Must be used after requireAuth middleware.
 *
 * @param resourceGetter - Async function to load the resource
 * @param options - Configuration options
 * @returns Express middleware
 *
 * Usage:
 * ```typescript
 * const getAgent = async (req: Request) => {
 *   return prisma.agent.findUnique({ where: { id: req.params.id } });
 * };
 *
 * router.get('/agents/:id', requireAuth, requireOwnership(getAgent), handler);
 * ```
 */
export const requireOwnership = <T extends { userId: string }>(
  resourceGetter: ResourceGetter<T>,
  options: {
    /** Property name to attach the loaded resource to req (default: 'resource') */
    attachAs?: string;
    /** Custom error message when resource not found */
    notFoundMessage?: string;
    /** Custom error message when access denied */
    forbiddenMessage?: string;
    /** Whether admins can bypass ownership check (default: true) */
    adminBypass?: boolean;
  } = {},
) => {
  const {
    attachAs = 'resource',
    notFoundMessage = 'Resource not found',
    forbiddenMessage = 'Access denied. You do not own this resource.',
    adminBypass = true,
  } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('[Auth] requireOwnership called without authenticated user');
        next(new ApiError(401, 'Authentication required', ErrorCodes.UNAUTHORIZED));
        return;
      }

      // Load the resource
      const resource = await resourceGetter(req);

      if (!resource) {
        logger.debug('[Auth] Resource not found for ownership check');
        next(new ApiError(404, notFoundMessage, ErrorCodes.NOT_FOUND));
        return;
      }

      // Admin bypass check
      if (adminBypass && req.user.role === 'ADMIN') {
        logger.debug('[Auth] Admin bypass - ownership check skipped:', {
          userId: req.user.userId,
          resourceOwnerId: resource.userId,
        });
        // Attach resource to request for downstream handlers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (req as any)[attachAs] = resource;
        next();
        return;
      }

      // Check ownership
      if (resource.userId !== req.user.userId) {
        logger.debug('[Auth] Ownership check failed:', {
          userId: req.user.userId,
          resourceOwnerId: resource.userId,
        });
        next(new ApiError(403, forbiddenMessage, ErrorCodes.FORBIDDEN));
        return;
      }

      logger.debug('[Auth] Ownership check passed:', {
        userId: req.user.userId,
        resourceOwnerId: resource.userId,
      });

      // Attach resource to request for downstream handlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (req as any)[attachAs] = resource;
      next();
    } catch (error) {
      logger.error('[Auth] Error during ownership check:', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(new ApiError(500, 'Failed to verify resource ownership', ErrorCodes.INTERNAL_ERROR));
    }
  };
};

/**
 * Helper type guard to check if user is admin
 */
export const isAdmin = (req: Request): boolean => {
  return req.user?.role === 'ADMIN';
};

/**
 * Helper to check if user can access resource (owner or admin)
 */
export const canAccessResource = (req: Request, resourceUserId: string): boolean => {
  if (!req.user) {
    return false;
  }
  return req.user.userId === resourceUserId || req.user.role === 'ADMIN';
};

export default {
  requireAuth,
  optionalAuth,
  createAuthMiddleware,
  verifyAndGetUser,
  isAuthenticated,
  getAuthenticatedUser,
  isRequestUser,
  getAuthContext,
  requireRole,
  requireOwnership,
  isAdmin,
  canAccessResource,
};
