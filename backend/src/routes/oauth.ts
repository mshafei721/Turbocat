/**
 * OAuth Authentication Routes
 *
 * This module defines OAuth 2.0 authentication endpoints for Google, GitHub,
 * and Microsoft providers. It handles the OAuth flow from initiation through
 * callback and JWT token generation.
 *
 * Security Features (T1.4):
 * - CSRF protection via Redis-backed state parameter validation
 * - Rate limiting: 5 requests per IP per minute
 * - OAuth token encryption (AES-256-GCM) before database storage
 * - Feature flag: ENABLE_OAUTH_LOGIN for gradual rollout
 *
 * Endpoints:
 * - GET /oauth/:provider - Initiate OAuth flow
 * - GET /oauth/:provider/callback - Handle OAuth callback
 *
 * Supported Providers:
 * - google: Google OAuth 2.0
 * - github: GitHub OAuth 2.0
 * - microsoft: Microsoft OAuth 2.0 (Azure AD)
 *
 * @module routes/oauth
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  OAuthService,
  OAuthProvider,
  OAuthTokens,
  OAuthUserProfile,
} from '../services/oauth.service';
import { generateTokenPair } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import {
  createOAuthInitMiddleware,
  createOAuthCallbackMiddleware,
} from '../middleware/oauth-security.middleware';
import { encryptOAuthToken } from '../utils/oauth-encryption';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Validate OAuth provider parameter
 */
const providerSchema = z.enum(['google', 'github', 'microsoft'], {
  message: 'Provider must be one of: google, github, microsoft',
});

/**
 * Validate OAuth callback query parameters
 */
const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Get user agent from request
 */
const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Convert Prisma UserRole to JWT AuthRole
 */
const toAuthRole = (prismaRole: string): 'ADMIN' | 'USER' | 'AGENT' => {
  const roleMap: Record<string, 'ADMIN' | 'USER' | 'AGENT'> = {
    admin: 'ADMIN',
    user: 'USER',
    agent: 'AGENT',
  };
  return roleMap[prismaRole] || 'USER';
};

/**
 * Build OAuth redirect URI
 */
const buildRedirectUri = (provider: OAuthProvider): string => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const apiVersion = process.env.API_VERSION || 'v1';
  return `${backendUrl}/api/${apiVersion}/auth/oauth/${provider}/callback`;
};

/**
 * Build frontend redirect URI with tokens
 */
const buildFrontendRedirectUri = (
  accessToken: string,
  refreshToken: string,
  success: boolean = true,
): string => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const params = new URLSearchParams();

  if (success) {
    params.set('accessToken', accessToken);
    params.set('refreshToken', refreshToken);
    return `${frontendUrl}/auth/oauth/success?${params.toString()}`;
  } else {
    params.set('error', 'oauth_failed');
    return `${frontendUrl}/auth/oauth/error?${params.toString()}`;
  }
};

// =============================================================================
// MIDDLEWARE INSTANCES
// =============================================================================

/**
 * Security middleware for OAuth initiation (feature flag + rate limit + state generation)
 */
const oauthInitMiddleware = createOAuthInitMiddleware();

/**
 * Security middleware for OAuth callback (feature flag + rate limit + state validation)
 */
const oauthCallbackMiddleware = createOAuthCallbackMiddleware();

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @openapi
 * /auth/oauth/{provider}:
 *   get:
 *     summary: Initiate OAuth flow
 *     description: |
 *       Redirects user to OAuth provider's authorization page.
 *
 *       Security:
 *       - Rate limited: 5 requests per IP per minute
 *       - CSRF protection via state parameter (stored in Redis)
 *       - Feature flag: ENABLE_OAUTH_LOGIN must be true
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, microsoft]
 *         description: OAuth provider
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 *       400:
 *         description: Invalid provider
 *       429:
 *         description: Rate limit exceeded (5 requests per minute)
 *       500:
 *         description: OAuth configuration error
 *       503:
 *         description: OAuth login is disabled
 */
router.get('/:provider', ...oauthInitMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate provider parameter
    const providerResult = providerSchema.safeParse(req.params.provider);

    if (!providerResult.success) {
      throw ApiError.validation('Invalid OAuth provider', [
        {
          field: 'provider',
          message: providerResult.error.issues[0]?.message || 'Invalid provider',
        },
      ]);
    }

    const provider = providerResult.data;
    const redirectUri = buildRedirectUri(provider);

    // Get state from middleware (generated and stored in Redis by generateOAuthStateMiddleware)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = (req as any).oauthState as string;

    if (!state) {
      throw ApiError.internal('OAuth state generation failed');
    }

    logger.info('[OAuth Route] Initiating OAuth flow', {
      provider,
      redirectUri,
      ip: getClientIp(req),
      statePrefix: state.substring(0, 8) + '...',
    });

    // Generate authorization URL with the pre-generated state parameter
    const config = await OAuthService.generateAuthUrl(provider, redirectUri);

    // Override the auto-generated state with our Redis-backed state
    const authUrl = new URL(config.url);
    authUrl.searchParams.set('state', state);
    const url = authUrl.toString();

    logger.debug('[OAuth Route] Generated auth URL', {
      provider,
      statePrefix: state.substring(0, 8) + '...',
      hasUrl: !!url,
    });

    // Redirect user to OAuth provider
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/oauth/{provider}/callback:
 *   get:
 *     summary: Handle OAuth callback
 *     description: |
 *       Processes OAuth provider callback, exchanges authorization code for tokens,
 *       creates or updates user account, and redirects to frontend with JWT tokens.
 *
 *       Security:
 *       - Rate limited: 5 requests per IP per minute
 *       - CSRF protection via state parameter validation (one-time use)
 *       - OAuth tokens encrypted with AES-256-GCM before database storage
 *       - Feature flag: ENABLE_OAUTH_LOGIN must be true
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, microsoft]
 *         description: OAuth provider
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from provider
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF protection state parameter
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code if authorization failed
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Human-readable error description
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 *       400:
 *         description: Invalid callback parameters
 *       401:
 *         description: OAuth authorization failed
 *       429:
 *         description: Rate limit exceeded (5 requests per minute)
 *       500:
 *         description: Internal server error
 *       503:
 *         description: OAuth login is disabled
 */
router.get('/:provider/callback', ...oauthCallbackMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate provider parameter
    const providerResult = providerSchema.safeParse(req.params.provider);

    if (!providerResult.success) {
      throw ApiError.validation('Invalid OAuth provider', [
        {
          field: 'provider',
          message: providerResult.error.issues[0]?.message || 'Invalid provider',
        },
      ]);
    }

    const provider = providerResult.data;
    const redirectUri = buildRedirectUri(provider);

    // Check for OAuth provider errors
    if (req.query.error) {
      const errorCode = req.query.error as string;
      const errorDescription = (req.query.error_description as string) || 'OAuth authorization failed';

      logger.warn('[OAuth Route] OAuth provider returned error', {
        provider,
        errorCode,
        errorDescription,
      });

      // Redirect to frontend error page
      return res.redirect(buildFrontendRedirectUri('', '', false));
    }

    // Validate callback query parameters
    const queryResult = callbackSchema.safeParse(req.query);

    if (!queryResult.success) {
      throw ApiError.validation('Invalid callback parameters', [
        {
          field: 'query',
          message: queryResult.error.issues[0]?.message || 'Invalid parameters',
        },
      ]);
    }

    const { code, state } = queryResult.data;

    // State has already been validated by validateOAuthStateMiddleware
    // Get metadata attached by middleware for logging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stateMetadata = (req as any).oauthStateMetadata;

    logger.info('[OAuth Route] Processing OAuth callback (state validated)', {
      provider,
      statePrefix: state.substring(0, 8) + '...',
      ip: getClientIp(req),
      stateAge: stateMetadata ? Math.round((Date.now() - stateMetadata.createdAt) / 1000) + 's' : 'unknown',
    });

    // Step 1: Exchange authorization code for tokens
    const oauthTokens: OAuthTokens = await OAuthService.handleCallback(
      provider,
      code,
      redirectUri,
    );

    logger.debug('[OAuth Route] Received OAuth tokens', {
      provider,
      hasAccessToken: !!oauthTokens.accessToken,
      hasRefreshToken: !!oauthTokens.refreshToken,
    });

    // Step 2: Fetch user profile from provider
    const profile: OAuthUserProfile = await OAuthService.getUserProfile(
      provider,
      oauthTokens.accessToken,
    );

    logger.info('[OAuth Route] Fetched user profile', {
      provider,
      userId: profile.id,
      email: profile.email,
      hasName: !!profile.name,
    });

    // Validate email exists
    if (!profile.email) {
      throw ApiError.badRequest('OAuth provider did not return an email address');
    }

    // Step 3: Encrypt OAuth tokens for database storage (T1.4 - Security)
    const encryptedAccessToken = encryptOAuthToken(oauthTokens.accessToken);
    const encryptedRefreshToken = encryptOAuthToken(oauthTokens.refreshToken);

    logger.debug('[OAuth Route] OAuth tokens encrypted for storage', {
      provider,
      accessTokenEncrypted: !!encryptedAccessToken,
      refreshTokenEncrypted: !!encryptedRefreshToken,
    });

    // Step 4: Find or create user in database
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Check if Prisma is available
    if (!prisma) {
      throw ApiError.serviceUnavailable('Database service is not available');
    }

    // Check if user exists by oauthProvider + oauthId
    let user = await prisma.user.findFirst({
      where: {
        oauthProvider: provider,
        oauthId: profile.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        deletedAt: true,
      },
    });

    if (user) {
      // Existing OAuth user - update tokens and last login
      logger.info('[OAuth Route] Existing OAuth user found', {
        userId: user.id,
        email: user.email,
        provider,
      });

      // Check if user is soft-deleted
      if (user.deletedAt) {
        throw ApiError.forbidden('Account has been deactivated');
      }

      // Check if user is active
      if (!user.isActive) {
        throw ApiError.forbidden('Account has been deactivated');
      }

      // Update OAuth tokens (encrypted) and last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oauthAccessToken: encryptedAccessToken,
          oauthRefreshToken: encryptedRefreshToken,
          lastLoginAt: new Date(),
          avatarUrl: profile.avatarUrl || user.avatarUrl, // Update avatar if available
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          emailVerified: true,
          deletedAt: true,
        },
      });

      logger.info('[OAuth Route] Updated OAuth user (tokens encrypted)', {
        userId: user.id,
        email: user.email,
      });
    } else {
      // New OAuth user - create account
      logger.info('[OAuth Route] Creating new OAuth user', {
        provider,
        email: profile.email,
      });

      // Check if email already exists with different auth method
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: profile.email },
        select: {
          id: true,
          oauthProvider: true,
          passwordHash: true,
        },
      });

      if (existingEmailUser) {
        // Email exists but with different auth method
        if (existingEmailUser.passwordHash) {
          throw ApiError.conflict(
            'An account with this email already exists. Please log in with email and password.',
          );
        } else if (existingEmailUser.oauthProvider !== provider) {
          throw ApiError.conflict(
            `An account with this email already exists using ${existingEmailUser.oauthProvider}. Please use that provider to log in.`,
          );
        }
      }

      // Create new user with encrypted OAuth tokens
      user = await prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.name || null,
          avatarUrl: profile.avatarUrl || null,
          oauthProvider: provider,
          oauthId: profile.id,
          oauthAccessToken: encryptedAccessToken,
          oauthRefreshToken: encryptedRefreshToken,
          role: 'user' as any, // Prisma expects lowercase enum value
          emailVerified: true, // OAuth providers verify emails
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          emailVerified: true,
          deletedAt: true,
        },
      });

      logger.info('[OAuth Route] Created new OAuth user (tokens encrypted)', {
        userId: user.id,
        email: user.email,
        provider,
      });
    }

    // Step 5: Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: toAuthRole(user.role),
    });

    logger.info('[OAuth Route] OAuth login successful', {
      userId: user.id,
      email: user.email,
      provider,
      ip: ipAddress,
      userAgent,
    });

    // Step 6: Redirect to frontend with JWT tokens
    const frontendRedirectUrl = buildFrontendRedirectUri(
      tokens.accessToken,
      tokens.refreshToken,
      true,
    );

    res.redirect(frontendRedirectUrl);
  } catch (error) {
    // Log error and redirect to frontend error page
    logger.error('[OAuth Route] OAuth callback failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      provider: req.params.provider,
    });

    // Redirect to frontend error page instead of showing error in backend
    const frontendErrorUrl = buildFrontendRedirectUri('', '', false);
    res.redirect(frontendErrorUrl);
  }
});

export default router as Router;
