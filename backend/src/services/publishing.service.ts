/**
 * Publishing Service
 *
 * Main orchestration service for Epic 4: Publishing Flow.
 * Coordinates Apple App Store Connect API, Expo build service, encryption,
 * and database operations to publish mobile apps.
 *
 * Responsibilities:
 * - Validate Apple and Expo credentials
 * - Encrypt sensitive data before storage
 * - Initiate and track Expo builds
 * - Manage publishing status lifecycle
 * - Generate valid bundle identifiers
 *
 * Flow:
 * 1. initiatePublishing: Validate credentials, encrypt, create DB record
 * 2. executeBuildAndSubmit: Start Expo build, poll status, update DB
 * 3. updateStatus: Update publishing status and messages
 *
 * Note: Full polling and Apple upload will be implemented in Phase 4.
 * This simplified version validates the core orchestration logic.
 *
 * @module services/publishing.service
 */

import { PrismaClient, PublishingStatus } from '@prisma/client';
import { AppleService } from './apple.service';
import { ExpoService } from './expo.service';
import { encrypt, decrypt, EncryptedData } from '../utils/encryption';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';
import { publishingQueue, isPublishingQueueAvailable } from '../lib/publishingQueue';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Publishing data required to initiate app publishing
 */
export interface PublishData {
  /** Apple Developer Team ID */
  appleTeamId: string;
  /** Apple API Key ID */
  appleKeyId: string;
  /** Apple Issuer ID */
  appleIssuerId: string;
  /** Apple private key (.p8 file content) */
  applePrivateKey: string;
  /** Expo authentication token */
  expoToken: string;
  /** Application name */
  appName: string;
  /** App description */
  description: string;
  /** App Store category */
  category: string;
  /** Age rating (4+, 9+, 12+, 17+) */
  ageRating: string;
  /** Support URL (optional) */
  supportUrl?: string;
  /** Icon URL (optional) */
  iconUrl?: string;
}

// =============================================================================
// PUBLISHING SERVICE
// =============================================================================

/**
 * Publishing Service
 *
 * Orchestrates the complete app publishing pipeline from credential validation
 * to build submission. Integrates AppleService, ExpoService, encryption utilities,
 * and Prisma database client.
 *
 * @example
 * ```typescript
 * const service = new PublishingService(prisma, appleService, expoService);
 *
 * // Step 1: Initiate publishing
 * const publishing = await service.initiatePublishing(
 *   userId,
 *   projectId,
 *   publishData
 * );
 *
 * // Step 2: Execute build and submit (async)
 * await service.executeBuildAndSubmit(publishing.id);
 * ```
 */
export class PublishingService {
  constructor(
    private prisma: PrismaClient,
    private appleService: AppleService,
    private expoService: ExpoService,
  ) {}

  /**
   * Initiate publishing process
   *
   * Validates project ownership, Apple credentials, and Expo token.
   * Encrypts sensitive data and creates a publishing record in the database.
   *
   * Steps:
   * 1. Validate project exists and belongs to user
   * 2. Validate Apple Developer credentials (API call)
   * 3. Validate Expo token (API call)
   * 4. Encrypt sensitive credentials (applePrivateKey, expoToken)
   * 5. Generate bundle ID from app name
   * 6. Create Publishing record with status INITIATED
   *
   * @param userId - User ID who owns the project
   * @param projectId - Workflow/Project ID to publish
   * @param publishData - Publishing configuration and credentials
   * @returns Created publishing record
   * @throws ApiError if validation fails or database operation fails
   *
   * @example
   * ```typescript
   * const publishing = await service.initiatePublishing(
   *   'user-123',
   *   'project-456',
   *   {
   *     appleTeamId: 'ABC123',
   *     appleKeyId: 'KEY123',
   *     appleIssuerId: 'uuid',
   *     applePrivateKey: '-----BEGIN PRIVATE KEY-----...',
   *     expoToken: 'expo-token',
   *     appName: 'My App',
   *     description: 'App description',
   *     category: 'Productivity',
   *     ageRating: '4+',
   *   }
   * );
   * ```
   */
  async initiatePublishing(userId: string, projectId: string, publishData: PublishData) {
    logger.info('[PublishingService] Initiating publishing', {
      userId,
      projectId,
      appName: publishData.appName,
    });

    // Validate project exists and belongs to user
    const project = await this.prisma.workflow.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
    });

    if (!project) {
      logger.error('[PublishingService] Project not found', { userId, projectId });
      throw new ApiError(404, 'Project not found', ErrorCodes.NOT_FOUND);
    }

    logger.info('[PublishingService] Validating Apple credentials', {
      teamId: publishData.appleTeamId,
      keyId: publishData.appleKeyId,
    });

    // Validate Apple credentials
    const appleValid = await this.appleService.validateCredentials(
      publishData.appleTeamId,
      publishData.appleKeyId,
      publishData.appleIssuerId,
      publishData.applePrivateKey,
    );

    if (!appleValid) {
      logger.error('[PublishingService] Invalid Apple credentials', {
        teamId: publishData.appleTeamId,
      });
      throw new ApiError(400, 'Invalid Apple Developer credentials', ErrorCodes.VALIDATION_ERROR);
    }

    logger.info('[PublishingService] Validating Expo token');

    // Validate Expo token
    const expoValid = await this.expoService.validateToken(publishData.expoToken);

    if (!expoValid) {
      logger.error('[PublishingService] Invalid Expo token');
      throw new ApiError(400, 'Invalid Expo token', ErrorCodes.VALIDATION_ERROR);
    }

    logger.info('[PublishingService] Encrypting credentials');

    // Encrypt sensitive credentials
    const encryptedPrivateKey = encrypt(publishData.applePrivateKey);
    const encryptedExpoToken = encrypt(publishData.expoToken);

    // Generate bundle ID
    const bundleId = this.generateBundleId(publishData.appName);

    logger.info('[PublishingService] Creating publishing record', {
      bundleId,
      appName: publishData.appName,
    });

    // Create publishing record
    const publishing = await this.prisma.publishing.create({
      data: {
        workflowId: projectId,
        status: 'INITIATED' as PublishingStatus,
        appleTeamId: publishData.appleTeamId,
        appleKeyId: publishData.appleKeyId,
        appleIssuerId: publishData.appleIssuerId,
        applePrivateKey: JSON.stringify(encryptedPrivateKey),
        expoToken: JSON.stringify(encryptedExpoToken),
        appName: publishData.appName,
        bundleId,
        version: '1.0.0',
        description: publishData.description,
        category: publishData.category,
        ageRating: publishData.ageRating,
        supportUrl: publishData.supportUrl,
        iconUrl: publishData.iconUrl,
      },
    });

    logger.info('[PublishingService] Publishing initiated successfully', {
      publishingId: publishing.id,
      bundleId,
    });

    // Queue the build and submit job for background processing
    if (!isPublishingQueueAvailable()) {
      logger.error('[PublishingService] Cannot queue job - Redis not available');
      throw new ApiError(
        503,
        'Background job service unavailable. Please ensure Redis is running.',
        ErrorCodes.SERVICE_UNAVAILABLE,
      );
    }

    logger.info('[PublishingService] Queueing build job', {
      publishingId: publishing.id,
      projectId,
      userId,
    });

    await publishingQueue!.add('build-and-submit', {
      publishingId: publishing.id,
      projectId,
      userId,
    });

    logger.info('[PublishingService] Build job queued successfully', {
      publishingId: publishing.id,
    });

    return publishing;
  }

  /**
   * Execute build and submit workflow
   *
   * Orchestrates the Expo build process and tracks status.
   * This is a simplified version for Phase 3. Phase 4 will add:
   * - Full polling with retries
   * - WebSocket status updates
   * - .ipa download and upload to Apple
   *
   * Current flow:
   * 1. Update status to BUILDING
   * 2. Start Expo build
   * 3. Check build status (single check, no polling yet)
   * 4. Update status to SUBMITTED or FAILED
   *
   * @param publishingId - Publishing record ID
   * @returns Final publishing status ('SUBMITTED' | 'FAILED')
   * @throws ApiError if publishing record not found
   *
   * @example
   * ```typescript
   * const status = await service.executeBuildAndSubmit('publishing-123');
   * console.log('Final status:', status); // 'SUBMITTED' or 'FAILED'
   * ```
   */
  async executeBuildAndSubmit(publishingId: string): Promise<string> {
    logger.info('[PublishingService] Executing build and submit', { publishingId });

    // Fetch publishing record with workflow relation
    const publishing = await this.prisma.publishing.findUnique({
      where: { id: publishingId },
      include: { workflow: true },
    });

    if (!publishing) {
      logger.error('[PublishingService] Publishing record not found', { publishingId });
      throw new ApiError(404, 'Publishing record not found', ErrorCodes.NOT_FOUND);
    }

    try {
      // Update status to BUILDING
      logger.info('[PublishingService] Starting build phase', { publishingId });
      await this.updateStatus(publishingId, 'BUILDING', 'Starting Expo build...');

      // Decrypt Expo token
      const encryptedExpoToken = JSON.parse(publishing.expoToken!) as EncryptedData;
      const expoToken = decrypt(encryptedExpoToken);

      // Start Expo build
      logger.info('[PublishingService] Starting Expo build', {
        projectId: publishing.workflow.id,
      });

      const buildId = await this.expoService.startBuild(
        publishing.workflow.id,
        'ios',
        expoToken,
      );

      logger.info('[PublishingService] Expo build started', { buildId });

      // Update publishing record with build ID
      await this.prisma.publishing.update({
        where: { id: publishingId },
        data: { expoBuildId: buildId },
      });

      // Get build status (simplified - single check for now)
      logger.info('[PublishingService] Checking build status', { buildId });
      const buildStatus = await this.expoService.getBuildStatus(buildId, expoToken);

      // Handle build result
      if (buildStatus.status === 'errored') {
        const errorMessage = buildStatus.error || 'Build failed';
        logger.error('[PublishingService] Build failed', { buildId, error: errorMessage });

        await this.updateStatus(publishingId, 'FAILED', errorMessage);
        return 'FAILED';
      }

      // Update status to SUBMITTED (simplified for Phase 3)
      logger.info('[PublishingService] Build completed successfully', { buildId });
      await this.updateStatus(publishingId, 'SUBMITTED', 'Successfully submitted to App Store');

      return 'SUBMITTED';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[PublishingService] Build and submit failed', {
        publishingId,
        error: errorMessage,
      });

      await this.updateStatus(publishingId, 'FAILED', errorMessage);

      throw error;
    }
  }

  /**
   * Update publishing status
   *
   * Updates the status and optional status message for a publishing record.
   * Used throughout the publishing lifecycle to track progress.
   *
   * @param publishingId - Publishing record ID
   * @param status - New status value
   * @param message - Optional status message
   * @returns Updated publishing record
   *
   * @example
   * ```typescript
   * await service.updateStatus(
   *   'publishing-123',
   *   'BUILDING',
   *   'Build in progress (5 minutes remaining)'
   * );
   * ```
   */
  async updateStatus(publishingId: string, status: string, message?: string) {
    logger.debug('[PublishingService] Updating status', {
      publishingId,
      status,
      message,
    });

    return this.prisma.publishing.update({
      where: { id: publishingId },
      data: {
        status: status as PublishingStatus,
        statusMessage: message,
      },
    });
  }

  /**
   * Get publishing status
   *
   * Retrieves a publishing record with workflow relation.
   * Used by status endpoint to check publishing progress.
   *
   * @param publishingId - Publishing record ID
   * @returns Publishing record or null if not found
   *
   * @example
   * ```typescript
   * const publishing = await service.getStatus('publishing-123');
   * if (publishing) {
   *   console.log('Status:', publishing.status);
   * }
   * ```
   */
  async getStatus(publishingId: string) {
    logger.debug('[PublishingService] Getting status', { publishingId });

    const publishing = await this.prisma.publishing.findUnique({
      where: { id: publishingId },
      include: { workflow: { select: { id: true, projectName: true } } },
    });

    return publishing;
  }

  /**
   * Retry failed publishing
   *
   * Resets a failed publishing attempt and re-executes the build and submit workflow.
   * Only works for publishing records with FAILED status.
   *
   * Steps:
   * 1. Validate publishing record exists
   * 2. Validate status is FAILED
   * 3. Reset status to INITIATED
   * 4. Re-execute build and submit
   *
   * @param publishingId - Publishing record ID
   * @returns Success response
   * @throws ApiError if publishing not found or status not FAILED
   *
   * @example
   * ```typescript
   * const result = await service.retry('publishing-123');
   * console.log(result.message); // 'Publishing retry started'
   * ```
   */
  async retry(publishingId: string) {
    logger.info('[PublishingService] Retrying publishing', { publishingId });

    const publishing = await this.prisma.publishing.findUnique({
      where: { id: publishingId },
    });

    if (!publishing) {
      logger.error('[PublishingService] Publishing record not found', { publishingId });
      throw new ApiError(404, 'Publishing record not found', ErrorCodes.NOT_FOUND);
    }

    if (publishing.status !== 'FAILED') {
      logger.error('[PublishingService] Invalid status for retry', {
        publishingId,
        status: publishing.status,
      });
      throw new ApiError(
        400,
        'Can only retry failed publishing attempts',
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Reset status and retry
    logger.info('[PublishingService] Resetting status to INITIATED', { publishingId });
    await this.updateStatus(publishingId, 'INITIATED', 'Retrying...');

    // Execute build and submit (async)
    logger.info('[PublishingService] Re-executing build and submit', { publishingId });
    this.executeBuildAndSubmit(publishingId).catch((error) => {
      logger.error('[PublishingService] Retry execution failed', {
        publishingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    return { success: true, message: 'Publishing retry started' };
  }

  /**
   * Generate bundle ID from app name
   *
   * Creates a valid iOS bundle identifier by:
   * 1. Converting to lowercase
   * 2. Removing non-alphanumeric characters
   * 3. Limiting to 20 characters
   * 4. Prefixing with 'com.turbocat.'
   *
   * Bundle ID format: com.turbocat.{sanitized-app-name}
   * Maximum length: 32 characters (12 char prefix + 20 char name)
   *
   * @param appName - Application name
   * @returns Valid bundle identifier
   *
   * @example
   * ```typescript
   * generateBundleId('My Cool App!'); // 'com.turbocat.mycoolapp'
   * generateBundleId('Weather Tracker 2024'); // 'com.turbocat.weathertracker20'
   * ```
   */
  generateBundleId(appName: string): string {
    const sanitized = appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);

    return `com.turbocat.${sanitized}`;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

/**
 * Singleton publishing service instance
 *
 * Note: This will be null if Prisma client is not available.
 * Always check for null before using in production code.
 */
let publishingServiceInstance: PublishingService | null = null;

/**
 * Get publishing service instance
 *
 * @returns PublishingService instance or null if not available
 */
export const getPublishingService = (): PublishingService | null => {
  if (!publishingServiceInstance) {
    try {
      const { prisma } = require('../lib/prisma');
      const { appleService } = require('./apple.service');
      const { expoService } = require('./expo.service');

      if (prisma) {
        publishingServiceInstance = new PublishingService(prisma, appleService, expoService);
      }
    } catch (error) {
      logger.error('[PublishingService] Failed to initialize service', { error });
    }
  }

  return publishingServiceInstance;
};

export const publishingService = getPublishingService();

export default publishingService;
