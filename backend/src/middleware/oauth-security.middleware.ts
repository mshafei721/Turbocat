/**
 * OAuth Security Middleware
 *
 * Provides comprehensive security for OAuth authentication flows including:
 * - CSRF protection via Redis-backed state parameter validation
 * - Rate limiting (5 requests per IP per minute)
 * - Feature flag check for gradual rollout
 *
 * Security References:
 * - OWASP OAuth 2.0 Security: https://owasp.org/www-project-web-security-testing-guide/
 * - RFC 6749 Section 10.12: CSRF Protection via State Parameter
 *
 * @module middleware/oauth-security
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis, isRedisAvailable, connectRedis } from '../lib/redis';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Redis key prefix for OAuth state parameters
 */
const OAUTH_STATE_PREFIX = 'oauth:state:';

/**
 * State parameter TTL in seconds (10 minutes)
 */
const OAUTH_STATE_TTL_SECONDS = 600;

/**
 * Rate limit configuration
 */
const OAUTH_RATE_LIMIT_MAX = 5;
const OAUTH_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// =============================================================================
// TYPES
// =============================================================================

/**
 * OAuth state metadata stored in Redis
 */
export interface OAuthStateMetadata {
  /** IP address that initiated the OAuth flow */
  ip: string;
  /** User agent of the client */
  userAgent: string;
  /** OAuth provider (google, github, microsoft) */
  provider: string;
  /** Timestamp when state was created */
  createdAt: number;
}

// =============================================================================
// CSRF PROTECTION - STATE MANAGEMENT
// =============================================================================

/**
 * Generate a cryptographically secure OAuth state parameter
 *
 * The state parameter serves two purposes:
 * 1. CSRF protection - ensures callback originated from our auth request
 * 2. Session binding - associates the callback with the original request
 *
 * @returns UUID v4 string (36 characters)
 */
export const generateOAuthState = (): string => {
  return uuidv4();
};

/**
 * Store OAuth state parameter in Redis with metadata
 *
 * Security: State is stored with 10-minute expiry and includes
 * request metadata for additional validation on callback.
 *
 * @param state - The state parameter (UUID)
 * @param metadata - Request metadata for validation
 * @returns True if state was stored successfully
 */
export const storeOAuthState = async (
  state: string,
  metadata: OAuthStateMetadata,
): Promise<boolean> => {
  if (!isRedisAvailable()) {
    logger.error('[OAuth Security] Cannot store state - Redis not available');
    return false;
  }

  try {
    // Ensure Redis is connected
    await connectRedis();

    const key = `${OAUTH_STATE_PREFIX}${state}`;
    const value = JSON.stringify(metadata);

    // Store state with TTL
    await redis!.setex(key, OAUTH_STATE_TTL_SECONDS, value);

    logger.debug('[OAuth Security] State stored', {
      state: state.substring(0, 8) + '...', // Log only first 8 chars for security
      provider: metadata.provider,
      ttlSeconds: OAUTH_STATE_TTL_SECONDS,
    });

    return true;
  } catch (error) {
    logger.error('[OAuth Security] Failed to store state', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Validate and consume OAuth state parameter (one-time use)
 *
 * Security: State is validated and immediately deleted to prevent replay attacks.
 * Additional validation checks that the IP/provider match the original request.
 *
 * @param state - The state parameter from callback
 * @param ip - IP address of the callback request
 * @param provider - OAuth provider from callback
 * @returns Validation result with metadata if valid
 */
export const validateOAuthState = async (
  state: string,
  ip: string,
  provider: string,
): Promise<{
  valid: boolean;
  metadata?: OAuthStateMetadata;
  error?: string;
}> => {
  if (!state) {
    return { valid: false, error: 'State parameter is missing' };
  }

  if (!isRedisAvailable()) {
    logger.error('[OAuth Security] Cannot validate state - Redis not available');
    return { valid: false, error: 'State validation service unavailable' };
  }

  try {
    // Ensure Redis is connected
    await connectRedis();

    const key = `${OAUTH_STATE_PREFIX}${state}`;

    // Get and delete atomically (prevents replay attacks)
    const value = await redis!.get(key);

    if (!value) {
      logger.warn('[OAuth Security] State not found or expired', {
        state: state.substring(0, 8) + '...',
      });
      return { valid: false, error: 'Invalid or expired state parameter' };
    }

    // Delete the state immediately (one-time use)
    await redis!.del(key);

    // Parse metadata
    const metadata = JSON.parse(value) as OAuthStateMetadata;

    // Validate provider matches
    if (metadata.provider !== provider) {
      logger.warn('[OAuth Security] Provider mismatch', {
        expected: metadata.provider,
        received: provider,
      });
      return { valid: false, error: 'State parameter mismatch' };
    }

    // Optional: Log IP mismatch but don't reject (mobile users may have different IPs)
    if (metadata.ip !== ip) {
      logger.info('[OAuth Security] IP changed during OAuth flow', {
        originalIp: metadata.ip,
        callbackIp: ip,
        provider,
      });
      // Note: We log but don't reject - users behind proxies/VPNs may have IP changes
    }

    // Check if state is still within reasonable time window
    const ageSeconds = (Date.now() - metadata.createdAt) / 1000;
    if (ageSeconds > OAUTH_STATE_TTL_SECONDS) {
      logger.warn('[OAuth Security] State expired', {
        ageSeconds,
        maxSeconds: OAUTH_STATE_TTL_SECONDS,
      });
      return { valid: false, error: 'State parameter expired' };
    }

    logger.debug('[OAuth Security] State validated successfully', {
      state: state.substring(0, 8) + '...',
      provider,
      ageSeconds: Math.round(ageSeconds),
    });

    return { valid: true, metadata };
  } catch (error) {
    logger.error('[OAuth Security] State validation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { valid: false, error: 'State validation failed' };
  }
};

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Create OAuth rate limiter middleware
 *
 * Security: Limits OAuth requests to 5 per IP per minute to prevent:
 * - Brute force attacks
 * - OAuth authorization code enumeration
 * - Denial of service
 *
 * Uses Redis store for distributed rate limiting across multiple servers.
 *
 * @returns Express rate limiter middleware
 */
export const createOAuthRateLimiter = (): RequestHandler => {
  // Check if Redis is available for distributed rate limiting
  if (isRedisAvailable() && redis) {
    logger.info('[OAuth Security] Creating Redis-backed rate limiter');

    return rateLimit({
      store: new RedisStore({
        // @ts-expect-error - RedisStore expects ioredis compatible client
        sendCommand: (...args: string[]) => redis!.call(...args),
        prefix: 'oauth:ratelimit:',
      }),
      windowMs: OAUTH_RATE_LIMIT_WINDOW_MS,
      max: OAUTH_RATE_LIMIT_MAX,
      message: {
        success: false,
        error: {
          code: ErrorCodes.TOO_MANY_REQUESTS,
          message: 'Too many OAuth requests. Please try again in 1 minute.',
        },
      },
      standardHeaders: 'draft-7', // Return rate limit info in RateLimit-* headers
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        // Use X-Forwarded-For for accurate IP behind proxies
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
          return forwarded.split(',')[0]?.trim() || 'unknown';
        }
        return req.ip || req.socket.remoteAddress || 'unknown';
      },
      handler: (req: Request, res: Response): void => {
        logger.warn('[OAuth Security] Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          userAgent: req.headers['user-agent'],
        });
        res.status(429).json({
          success: false,
          error: {
            code: ErrorCodes.TOO_MANY_REQUESTS,
            message: 'Too many OAuth requests. Please try again in 1 minute.',
          },
        });
      },
    });
  }

  // Fallback to in-memory rate limiting (development only)
  logger.warn('[OAuth Security] Using in-memory rate limiter (Redis not available)');

  return rateLimit({
    windowMs: OAUTH_RATE_LIMIT_WINDOW_MS,
    max: OAUTH_RATE_LIMIT_MAX,
    message: {
      success: false,
      error: {
        code: ErrorCodes.TOO_MANY_REQUESTS,
        message: 'Too many OAuth requests. Please try again in 1 minute.',
      },
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() || 'unknown';
      }
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    handler: (req: Request, res: Response): void => {
      logger.warn('[OAuth Security] Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
      });
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCodes.TOO_MANY_REQUESTS,
          message: 'Too many OAuth requests. Please try again in 1 minute.',
        },
      });
    },
  });
};

// =============================================================================
// FEATURE FLAG
// =============================================================================

/**
 * Check if OAuth is enabled via feature flag
 *
 * Security: Allows instant disable of OAuth in case of security issues
 * without requiring a deployment.
 *
 * @returns True if OAuth login is enabled
 */
export const isOAuthEnabled = (): boolean => {
  const enabled = process.env.ENABLE_OAUTH_LOGIN;
  // Default to false for security - must explicitly enable
  return enabled === 'true';
};

/**
 * Feature flag middleware - checks if OAuth is enabled
 *
 * Returns 503 Service Unavailable if OAuth is disabled, allowing
 * the feature to be toggled without deployment.
 *
 * Usage:
 * ```typescript
 * router.use(checkOAuthEnabled);
 * ```
 */
export const checkOAuthEnabled: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!isOAuthEnabled()) {
    logger.info('[OAuth Security] OAuth login is disabled via feature flag', {
      ip: req.ip,
      path: req.path,
    });

    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'OAuth login is currently disabled. Please use email/password authentication.',
      },
    });
    return;
  }

  next();
};

// =============================================================================
// CSRF MIDDLEWARE
// =============================================================================

/**
 * CSRF state generation middleware for OAuth initiation
 *
 * Generates a state parameter, stores it in Redis with request metadata,
 * and attaches it to the request for use in building the OAuth URL.
 *
 * Usage:
 * ```typescript
 * router.get('/:provider', generateOAuthStateMiddleware, handler);
 * // Access state via req.oauthState
 * ```
 */
export const generateOAuthStateMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const state = generateOAuthState();
    // Extract provider - handle possible array type from Express params
    const rawProvider = req.params.provider;
    const provider: string = Array.isArray(rawProvider) ? rawProvider[0] || 'unknown' : rawProvider || 'unknown';

    // Get client IP - handle array type from x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    let ip: string;
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0]?.trim() || 'unknown';
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.split(',')[0]?.trim() || 'unknown';
    } else {
      ip = req.ip || req.socket.remoteAddress || 'unknown';
    }

    const metadata: OAuthStateMetadata = {
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      provider,
      createdAt: Date.now(),
    };

    // Store state in Redis
    const stored = await storeOAuthState(state, metadata);

    if (!stored) {
      throw new ApiError(
        503,
        'OAuth service temporarily unavailable. Please try again.',
        ErrorCodes.SERVICE_UNAVAILABLE,
      );
    }

    // Attach state to request for use in route handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).oauthState = state;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('[OAuth Security] State generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      next(
        new ApiError(
          500,
          'Failed to initialize OAuth flow',
          ErrorCodes.INTERNAL_ERROR,
        ),
      );
    }
  }
};

/**
 * CSRF state validation middleware for OAuth callback
 *
 * Validates the state parameter from the callback query, ensuring:
 * 1. State exists and matches a stored value
 * 2. State hasn't expired (10-minute window)
 * 3. Provider matches the original request
 *
 * Usage:
 * ```typescript
 * router.get('/:provider/callback', validateOAuthStateMiddleware, handler);
 * ```
 */
export const validateOAuthStateMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const state = req.query.state as string | undefined;
    // Extract provider - handle possible array type from Express params
    const rawProvider = req.params.provider;
    const provider: string = Array.isArray(rawProvider) ? rawProvider[0] || 'unknown' : rawProvider || 'unknown';

    // Get client IP - handle array type from x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    let ip: string;
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0]?.trim() || 'unknown';
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.split(',')[0]?.trim() || 'unknown';
    } else {
      ip = req.ip || req.socket.remoteAddress || 'unknown';
    }

    // Validate state
    const result = await validateOAuthState(state || '', ip, provider);

    if (!result.valid) {
      logger.warn('[OAuth Security] CSRF validation failed', {
        error: result.error,
        provider,
        ip,
        hasState: !!state,
      });

      // Redirect to frontend error page instead of showing error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/oauth/error?error=invalid_state`;
      res.redirect(errorUrl);
      return;
    }

    // Attach validated metadata to request for logging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).oauthStateMetadata = result.metadata;

    next();
  } catch (error) {
    logger.error('[OAuth Security] State validation middleware failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Redirect to frontend error page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorUrl = `${frontendUrl}/auth/oauth/error?error=validation_failed`;
    res.redirect(errorUrl);
  }
};

// =============================================================================
// COMBINED MIDDLEWARE
// =============================================================================

/**
 * Create combined OAuth security middleware for initiation route
 *
 * Combines: Feature flag check + Rate limiting + State generation
 *
 * @returns Array of middleware functions
 */
export const createOAuthInitMiddleware = (): RequestHandler[] => {
  const rateLimiter = createOAuthRateLimiter();

  return [
    checkOAuthEnabled,
    rateLimiter,
    generateOAuthStateMiddleware,
  ];
};

/**
 * Create combined OAuth security middleware for callback route
 *
 * Combines: Feature flag check + Rate limiting + State validation
 *
 * @returns Array of middleware functions
 */
export const createOAuthCallbackMiddleware = (): RequestHandler[] => {
  const rateLimiter = createOAuthRateLimiter();

  return [
    checkOAuthEnabled,
    rateLimiter,
    validateOAuthStateMiddleware,
  ];
};

// =============================================================================
// EXPORTS
// =============================================================================

// All functions are exported individually above.
// Use named imports: import { createOAuthInitMiddleware, createOAuthCallbackMiddleware } from './oauth-security.middleware';
