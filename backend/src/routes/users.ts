/**
 * User Management Routes
 *
 * This module defines endpoints for user profile management.
 * Includes endpoints for viewing and updating the current user's profile,
 * as well as admin-only endpoints for viewing other users.
 *
 * Endpoints:
 * - GET /users/me - Get current user profile
 * - PATCH /users/me - Update current user profile
 * - GET /users/:id - Get user by ID (admin only)
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

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Update user profile schema
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

export default router;
