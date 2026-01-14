/**
 * User Management Routes
 *
 * This module defines endpoints for user profile management.
 * Includes endpoints for viewing and updating the current user's profile,
 * email verification, as well as admin-only endpoints for viewing other users.
 *
 * Endpoints:
 * - GET /users/me - Get current user profile
 * - PATCH /users/me - Update current user profile
 * - GET /users/:id - Get user by ID (admin only)
 * - PATCH /users/:id - Update user by ID (ownership check)
 * - DELETE /users/:id - Delete user account (soft delete, ownership check)
 * - POST /users/:id/send-verification - Send email verification (ownership check)
 * - POST /users/verify-email - Verify email with token (no auth required)
 *
 * @module routes/users
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { getStringParam } from '../utils/params';
import { logger } from '../lib/logger';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { hashPassword, verifyPassword, validatePassword } from '../services/auth.service';
import {
  generateVerificationToken,
  verifyEmail,
  sendVerificationEmail,
} from '../services/email-verification.service';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Update user profile schema (for /me endpoint)
 */
const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name cannot be empty')
    .max(255, 'Full name must be less than 255 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .max(2048, 'Avatar URL must be less than 2048 characters')
    .optional()
    .nullable(),
  preferences: z.record(z.string(), z.any()).optional(),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Update user by ID schema (includes password change)
 */
const updateUserByIdSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name cannot be empty')
    .max(255, 'Full name must be less than 255 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .max(2048, 'Avatar URL must be less than 2048 characters')
    .optional()
    .nullable(),
  preferences: z.record(z.string(), z.any()).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .optional(),
  currentPassword: z.string().optional(),
});

type UpdateUserByIdInput = z.infer<typeof updateUserByIdSchema>;

/**
 * Verify email schema
 */
const verifyEmailSchema = z.object({
  token: z.string().length(64, 'Invalid token format'),
});

type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Delete account schema (soft delete)
 */
const deleteAccountSchema = z.object({
  password: z.string().optional(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Exclude sensitive fields from user object
 */
const excludePassword = <T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, 'passwordHash'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       503:
 *         description: Database not available
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Check if Prisma is available
    if (!isPrismaAvailable() || !prisma) {
      throw ApiError.serviceUnavailable('Database service is not available');
    }

    // Fetch user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      throw ApiError.notFound('User not found');
    }

    // Check if user is deleted (soft delete)
    if (dbUser.deletedAt) {
      throw ApiError.notFound('User not found');
    }

    logger.debug('[Users Route] User profile fetched:', {
      userId: user.userId,
    });

    // Return user profile without password
    res.status(200).json(
      createSuccessResponse(
        {
          user: excludePassword(dbUser),
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
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Jane Doe"
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: "https://example.com/avatar.jpg"
 *               preferences:
 *                 type: object
 *                 example: { "theme": "dark", "notifications": true }
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Validate input
    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input: UpdateUserInput = validationResult.data;

    // Check if there's anything to update
    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    // Check if Prisma is available
    if (!isPrismaAvailable() || !prisma) {
      throw ApiError.serviceUnavailable('Database service is not available');
    }

    // Build update data using Prisma types
    const updateData: Prisma.UserUpdateInput = {};

    if (input.fullName !== undefined) {
      updateData.fullName = input.fullName;
    }

    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl;
    }

    if (input.preferences !== undefined) {
      // Cast to Prisma.InputJsonValue for type safety
      updateData.preferences = input.preferences as Prisma.InputJsonValue;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    logger.info('[Users Route] User profile updated:', {
      userId: user.userId,
      updatedFields: Object.keys(input),
    });

    // Return updated user profile without password
    res.status(200).json(
      createSuccessResponse(
        {
          user: excludePassword(updatedUser),
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
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     description: Get a user's profile by their ID. Requires admin role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getStringParam(req.params.id);

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        throw ApiError.badRequest('Invalid user ID format');
      }

      // Check if Prisma is available
      if (!isPrismaAvailable() || !prisma) {
        throw ApiError.serviceUnavailable('Database service is not available');
      }

      // Fetch user from database
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        throw ApiError.notFound('User not found');
      }

      // Check if user is deleted (soft delete)
      if (dbUser.deletedAt) {
        throw ApiError.notFound('User not found');
      }

      logger.debug('[Users Route] Admin fetched user profile:', {
        adminId: req.user?.userId,
        targetUserId: userId,
      });

      // Return user profile without password
      res.status(200).json(
        createSuccessResponse(
          {
            user: excludePassword(dbUser),
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update user profile by ID
 *     description: |
 *       Update a user's profile. Users can only update their own profile.
 *       Password changes require currentPassword verification.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: "jane.doe@example.com"
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: "https://example.com/avatar.jpg"
 *               preferences:
 *                 type: object
 *                 example: { "theme": "dark", "notifications": true }
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: New password (requires currentPassword)
 *                 example: "NewSecurePass123!"
 *               currentPassword:
 *                 type: string
 *                 description: Current password (required when changing password)
 *                 example: "OldSecurePass123!"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                 requestId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Authentication required or wrong password
 *       403:
 *         description: Cannot update another user's profile
 *       404:
 *         description: User not found
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Extract and validate user ID from params
    const userId = getStringParam(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      throw ApiError.badRequest('Invalid user ID format');
    }

    // OWNERSHIP VALIDATION: User can only update their own profile
    if (authenticatedUser.userId !== userId) {
      logger.warn('[Users Route] Attempted unauthorized update:', {
        authenticatedUserId: authenticatedUser.userId,
        targetUserId: userId,
      });
      throw ApiError.forbidden('You can only update your own profile');
    }

    // Validate input
    const validationResult = updateUserByIdSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input: UpdateUserByIdInput = validationResult.data;

    // Check if there's anything to update
    if (Object.keys(input).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    // Check if Prisma is available
    if (!isPrismaAvailable() || !prisma) {
      throw ApiError.serviceUnavailable('Database service is not available');
    }

    // Fetch current user from database
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || currentUser.deletedAt) {
      throw ApiError.notFound('User not found');
    }

    // PASSWORD CHANGE LOGIC
    if (input.password) {
      // Require currentPassword when changing password
      if (!input.currentPassword) {
        throw ApiError.badRequest('Current password is required to change password');
      }

      // Verify user has a password (not OAuth-only user)
      if (!currentUser.passwordHash) {
        throw ApiError.badRequest(
          'Cannot change password for OAuth-only accounts. Please use your OAuth provider.',
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        input.currentPassword,
        currentUser.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        logger.warn('[Users Route] Failed password change attempt:', {
          userId: userId,
          reason: 'invalid_current_password',
        });
        throw ApiError.unauthorized('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.valid) {
        throw ApiError.validation(
          'Password does not meet requirements',
          passwordValidation.errors.map((error) => ({ field: 'password', message: error })),
        );
      }
    }

    // Build update data using Prisma types
    const updateData: Prisma.UserUpdateInput = {};

    if (input.fullName !== undefined) {
      updateData.fullName = input.fullName;
    }

    if (input.email !== undefined) {
      // Normalize email
      updateData.email = input.email.toLowerCase().trim();

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw ApiError.conflict('Email is already in use by another account');
      }
    }

    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl;
    }

    if (input.preferences !== undefined) {
      updateData.preferences = input.preferences as Prisma.InputJsonValue;
    }

    if (input.password) {
      // Hash new password
      const passwordHash = await hashPassword(input.password);
      updateData.passwordHash = passwordHash;

      logger.info('[Users Route] User password changed:', {
        userId: userId,
      });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Remove currentPassword from logged fields
    const loggedFields = Object.keys(input).filter((key) => key !== 'currentPassword');

    logger.info('[Users Route] User profile updated:', {
      userId: userId,
      updatedFields: loggedFields,
    });

    // Return updated user profile without password
    res.status(200).json(
      createSuccessResponse(
        {
          user: excludePassword(updatedUser),
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
 * /users/{id}/send-verification:
 *   post:
 *     summary: Send email verification
 *     description: |
 *       Send verification email to the user.
 *       Users can only request verification for their own email.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Verification email sent successfully
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
 *                       example: "Verification email sent successfully"
 *                 requestId:
 *                   type: string
 *       400:
 *         description: User already verified or invalid request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Cannot verify another user's email
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/send-verification',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authenticatedUser = req.user;

      if (!authenticatedUser) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Extract and validate user ID from params
      const userId = getStringParam(req.params.id);

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        throw ApiError.badRequest('Invalid user ID format');
      }

      // OWNERSHIP VALIDATION: User can only verify their own email
      if (authenticatedUser.userId !== userId) {
        logger.warn('[Users Route] Attempted unauthorized verification request:', {
          authenticatedUserId: authenticatedUser.userId,
          targetUserId: userId,
        });
        throw ApiError.forbidden('You can only verify your own email');
      }

      // Check if Prisma is available
      if (!isPrismaAvailable() || !prisma) {
        throw ApiError.serviceUnavailable('Database service is not available');
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.deletedAt) {
        throw ApiError.notFound('User not found');
      }

      // Check if already verified (optional - allow re-sending)
      if (user.emailVerified) {
        throw ApiError.badRequest('Email is already verified');
      }

      // Generate verification token
      const token = await generateVerificationToken(userId);

      // Send verification email
      await sendVerificationEmail(userId, user.email, token);

      logger.info('[Users Route] Verification email sent:', {
        userId,
        email: user.email,
      });

      res.status(200).json(
        createSuccessResponse(
          {
            message: 'Verification email sent successfully',
          },
          req.requestId || 'unknown',
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /users/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: |
 *       Verify email address using the token sent via email.
 *       No authentication required (token-based verification).
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 description: Verification token from email
 *                 example: "a1b2c3d4e5f6..."
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                       example: "Email verified successfully"
 *                 requestId:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Invalid or expired verification token"
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = verifyEmailSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input: VerifyEmailInput = validationResult.data;

    // Verify email with token
    await verifyEmail(input.token);

    logger.info('[Users Route] Email verified successfully');

    res.status(200).json(
      createSuccessResponse(
        {
          message: 'Email verified successfully',
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
 * /users/{id}:
 *   delete:
 *     summary: Delete user account (soft delete)
 *     description: |
 *       Soft delete a user account by setting deletedAt timestamp.
 *       Requires user to re-authenticate with password.
 *       Prevents lockout - user must have alternative auth method.
 *       Creates audit log entry.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for re-authentication
 *                 example: "MySecurePassword123!"
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional reason for account deletion (feedback)
 *                 example: "No longer need the service"
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       400:
 *         description: Validation error or lockout prevention
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Cannot delete account. You must have at least one authentication method."
 *       401:
 *         description: Incorrect password
 *       403:
 *         description: Cannot delete another user's account
 *       404:
 *         description: User not found or already deleted
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Extract and validate user ID from params
    const userId = getStringParam(req.params.id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      throw ApiError.badRequest('Invalid user ID format');
    }

    // OWNERSHIP VALIDATION: User can only delete their own account
    if (authenticatedUser.userId !== userId) {
      logger.warn('[Users Route] Attempted unauthorized account deletion:', {
        authenticatedUserId: authenticatedUser.userId,
        targetUserId: userId,
      });
      throw ApiError.forbidden('You can only delete your own account');
    }

    // Validate input
    const validationResult = deleteAccountSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw handleValidationError(validationResult.error);
    }

    const input: DeleteAccountInput = validationResult.data;

    // Check if Prisma is available
    if (!isPrismaAvailable() || !prisma) {
      throw ApiError.serviceUnavailable('Database service is not available');
    }

    // Fetch current user from database
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw ApiError.notFound('User not found');
    }

    // Check if user is already deleted (soft delete)
    if (currentUser.deletedAt) {
      throw ApiError.notFound('User not found');
    }

    // LOCKOUT PREVENTION: User must have password OR OAuth to prevent account lockout
    // If user is deleting account, they must have another way to access the system
    const hasPassword = !!currentUser.passwordHash;
    const hasOAuth = !!currentUser.oauthProvider;

    // Cannot delete if this is the only auth method
    if (!hasPassword && !hasOAuth) {
      logger.warn('[Users Route] Account deletion blocked - no auth methods:', {
        userId: userId,
      });
      throw ApiError.badRequest(
        'Cannot delete account. You must have at least one authentication method.',
      );
    }

    // RE-AUTHENTICATION: Verify password if user has password auth
    if (hasPassword) {
      // Require password for re-authentication
      if (!input.password) {
        throw ApiError.badRequest('Password is required to delete your account');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(input.password, currentUser.passwordHash!);

      if (!isPasswordValid) {
        logger.warn('[Users Route] Failed account deletion attempt - incorrect password:', {
          userId: userId,
        });
        throw ApiError.unauthorized('Incorrect password');
      }
    }

    // AUDIT LOGGING: Log deletion before executing
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'user.delete',
        resourceType: 'user',
        resourceId: userId,
        changes: {
          deletedAt: new Date().toISOString(),
          reason: input.reason || 'No reason provided',
        },
        metadata: {
          hasPassword,
          hasOAuth,
          oauthProvider: currentUser.oauthProvider,
        },
        ipAddress,
        userAgent,
      },
    });

    // SOFT DELETE: Update user with deletedAt timestamp (not hard delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info('[Users Route] User account soft-deleted:', {
      userId: userId,
      reason: input.reason || 'No reason provided',
    });

    // Return 204 No Content (account deleted successfully)
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router as Router;
