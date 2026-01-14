/**
 * Publishing Routes - Epic 4: Publishing Flow
 *
 * This module defines all publishing-related API endpoints for submitting apps
 * to the Apple App Store via Expo Build Services.
 *
 * Endpoints:
 * - POST   /publishing/initiate     - Start publishing process
 * - GET    /publishing/:id/status   - Get publishing status
 * - POST   /publishing/:id/retry    - Retry failed publishing
 *
 * @module routes/publishing
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getPublishingService } from '../services/publishing.service';
import { requireAuth } from '../middleware/auth';
import { createSuccessResponse } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { requireStringParam } from '../utils/params';
import { logger } from '../lib/logger';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Age rating enum values (Apple App Store)
 */
const AgeRatingValues = ['4+', '9+', '12+', '17+'] as const;

/**
 * Initiate publishing request body schema
 */
const initiatePublishingSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  appleTeamId: z.string().min(1, 'Apple Team ID is required'),
  appleKeyId: z.string().min(1, 'Apple Key ID is required'),
  appleIssuerId: z.string().min(1, 'Apple Issuer ID is required'),
  applePrivateKey: z.string().min(1, 'Apple Private Key is required'),
  expoToken: z.string().min(1, 'Expo token is required'),
  appName: z.string().min(1, 'App name is required').max(30, 'App name too long (max 30 chars)'),
  description: z
    .string()
    .min(10, 'Description too short (min 10 chars)')
    .max(4000, 'Description too long (max 4000 chars)'),
  category: z.string().min(1, 'Category is required'),
  ageRating: z.enum(AgeRatingValues, { message: 'Invalid age rating' }),
  supportUrl: z.string().url('Invalid support URL').optional(),
  iconUrl: z.string().url('Invalid icon URL').optional(),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Handle validation errors from Zod
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
 * POST /publishing/initiate
 * Initiate app publishing process
 *
 * Validates credentials, encrypts sensitive data, creates publishing record,
 * and starts the build + submission workflow.
 *
 * @security JWT Authentication required
 */
router.post('/initiate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const publishingService = getPublishingService();

    if (!publishingService) {
      logger.error('[PublishingRoutes] Publishing service not available');
      throw ApiError.serviceUnavailable('Publishing service is not available');
    }

    // Validate request body
    const bodyResult = initiatePublishingSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw handleValidationError(bodyResult.error);
    }

    const { projectId, ...publishData } = bodyResult.data;

    logger.info('[PublishingRoutes] Initiating publishing', {
      userId: user.userId,
      projectId,
      appName: publishData.appName,
    });

    // Initiate publishing
    const publishing = await publishingService.initiatePublishing(
      user.userId,
      projectId,
      publishData,
    );

    logger.info('[PublishingRoutes] Publishing initiated successfully', {
      publishingId: publishing.id,
      projectId,
    });

    res.status(201).json(
      createSuccessResponse(
        {
          publishing,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /publishing/:id/status
 * Get publishing status for a specific publishing record
 *
 * Returns current status, build ID, and related metadata.
 *
 * @security JWT Authentication required
 */
router.get('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publishingId = requireStringParam(req.params.id, 'id');
    const publishingService = getPublishingService();

    if (!publishingService) {
      logger.error('[PublishingRoutes] Publishing service not available');
      throw ApiError.serviceUnavailable('Publishing service is not available');
    }

    logger.debug('[PublishingRoutes] Getting publishing status', { publishingId });

    const publishing = await publishingService.getStatus(publishingId);

    if (!publishing) {
      logger.warn('[PublishingRoutes] Publishing record not found', { publishingId });
      throw ApiError.notFound('Publishing record not found');
    }

    logger.debug('[PublishingRoutes] Publishing status retrieved', {
      publishingId,
      status: publishing.status,
    });

    res.json(
      createSuccessResponse(
        {
          publishing,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /publishing/:id/retry
 * Retry failed publishing attempt
 *
 * Resets publishing status to INITIATED and re-executes build + submit workflow.
 * Only works for publishing records with FAILED status.
 *
 * @security JWT Authentication required
 */
router.post('/:id/retry', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publishingId = requireStringParam(req.params.id, 'id');
    const publishingService = getPublishingService();

    if (!publishingService) {
      logger.error('[PublishingRoutes] Publishing service not available');
      throw ApiError.serviceUnavailable('Publishing service is not available');
    }

    logger.info('[PublishingRoutes] Retrying publishing', { publishingId });

    const result = await publishingService.retry(publishingId);

    logger.info('[PublishingRoutes] Publishing retry started', { publishingId });

    res.json(
      createSuccessResponse(
        {
          result,
        },
        req.requestId || 'unknown',
      ),
    );
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// EXPORT
// =============================================================================

export default router as Router;
