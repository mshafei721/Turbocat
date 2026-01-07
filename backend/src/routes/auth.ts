/**
 * Authentication Routes
 *
 * This module defines all authentication-related API endpoints including
 * registration, login, logout, token refresh, and password reset.
 *
 * Endpoints:
 * - POST /auth/register - Register a new user
 * - POST /auth/login - Authenticate user
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout user (requires auth)
 * - POST /auth/forgot-password - Request password reset
 * - POST /auth/reset-password - Reset password with token
 *
 * @module routes/auth
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
} from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Registration input schema
 */
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters')
    .optional(),
});

/**
 * Login input schema
 */
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token schema
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Forgot password schema
 */
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

/**
 * Reset password schema
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').uuid('Invalid reset token format'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
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

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account and receive authentication tokens
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "SecurePass123!"
 *             fullName: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/TokenPair'
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Register user
    const result = await register(input, ipAddress, userAgent);

    logger.info('[Auth Route] User registered successfully:', {
      userId: result.user.id,
      email: result.user.email,
    });

    // Return success response
    res.status(201).json(
      createSuccessResponse(
        {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt,
          },
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
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user with email and password to receive access and refresh tokens
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/TokenPair'
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input = validationResult.data;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Authenticate user
    const result = await login(input, ipAddress, userAgent);

    logger.info('[Auth Route] User logged in successfully:', {
      userId: result.user.id,
      email: result.user.email,
    });

    // Return success response
    res.status(200).json(
      createSuccessResponse(
        {
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            accessTokenExpiresAt: result.tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt,
          },
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
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                     accessTokenExpiresAt:
 *                       type: string
 *                       format: date-time
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = refreshSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const { refreshToken } = validationResult.data;

    // Refresh access token
    const result = refreshAccessToken(refreshToken);

    logger.debug('[Auth Route] Access token refreshed');

    // Return success response
    res.status(200).json(
      createSuccessResponse(
        {
          accessToken: result.accessToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
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
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate the current user's session and tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Logout user
    if (user.sessionId) {
      await logout(user.sessionId, user.userId, ipAddress, userAgent);
    }

    logger.info('[Auth Route] User logged out:', { userId: user.userId });

    // Return 204 No Content
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Request a password reset email. Always returns success to prevent user enumeration attacks.
 *       In development mode, the reset token is included in the response for testing.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset requested
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
 *                     message:
 *                       type: string
 *                       example: "If an account with that email exists, a password reset link has been sent."
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const { email } = validationResult.data;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Request password reset
    const result = await forgotPassword(email, ipAddress, userAgent);

    logger.info('[Auth Route] Password reset requested:', { email });

    // Build response data
    const responseData: Record<string, unknown> = {
      message: result.message,
    };

    // Include token in development mode for testing
    if (result.token && process.env.NODE_ENV === 'development') {
      responseData.token = result.token;
      responseData.note = 'Token is only included in development mode for testing';
    }

    // Return success response
    res.status(200).json(createSuccessResponse(responseData, req.requestId || 'unknown'));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user's password using a valid reset token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             token: "123e4567-e89b-12d3-a456-426614174000"
 *             newPassword: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                     message:
 *                       type: string
 *                       example: "Password has been reset successfully. Please log in with your new password."
 *                 requestId:
 *                   type: string
 *       400:
 *         description: Validation error or invalid/expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const { token, newPassword } = validationResult.data;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Reset password
    await resetPassword(token, newPassword, ipAddress, userAgent);

    logger.info('[Auth Route] Password reset completed');

    // Return success response
    res.status(200).json(
      createSuccessResponse(
        {
          message: 'Password has been reset successfully. Please log in with your new password.',
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
