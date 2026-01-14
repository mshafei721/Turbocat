/**
 * Publishing Worker
 *
 * BullMQ worker that processes background publishing jobs for building
 * and submitting mobile apps to the App Store.
 *
 * Job processing flow:
 * 1. Receive job with publishingId, projectId, userId
 * 2. Call PublishingService.executeBuildAndSubmit
 * 3. Service updates status throughout build process
 * 4. Return success or throw error for retry
 *
 * Features:
 * - Automatic retry on failure (3 attempts, exponential backoff)
 * - Rate limiting (5 jobs per minute)
 * - Event logging (completed, failed, error)
 * - Graceful shutdown support
 *
 * @module workers/publishing.worker
 */

import { Worker, Job } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';
import { getPublishingService } from '../services/publishing.service';
import { logger } from '../lib/logger';
import { PUBLISHING_QUEUE_NAME, PublishingJobData } from '../lib/publishingQueue';

/**
 * Get Redis connection for BullMQ worker
 */
const connection = getBullMQConnection();

/**
 * Publishing Worker instance
 *
 * Processes publishing jobs in the background. Each job triggers the
 * executeBuildAndSubmit workflow which:
 * - Starts an Expo build
 * - Polls build status
 * - Updates publishing record
 *
 * The worker will be null if Redis is not available.
 *
 * Configuration:
 * - Rate limit: 5 jobs per minute (to avoid overwhelming Expo/Apple APIs)
 * - Retry: 3 attempts with exponential backoff (configured in queue)
 * - Concurrency: 1 job at a time (default)
 *
 * @example
 * ```typescript
 * // Worker is automatically started when imported
 * import './workers/publishing.worker';
 *
 * // Graceful shutdown
 * await publishingWorker?.close();
 * ```
 */
export const publishingWorker = connection
  ? new Worker<PublishingJobData>(
      PUBLISHING_QUEUE_NAME,
      async (job: Job<PublishingJobData>) => {
        const { publishingId, projectId, userId } = job.data;

        logger.info('[PublishingWorker] Processing publishing job', {
          jobId: job.id,
          publishingId,
          projectId,
          userId,
          attemptsMade: job.attemptsMade,
        });

        // Get publishing service instance
        const publishingService = getPublishingService();

        if (!publishingService) {
          logger.error('[PublishingWorker] PublishingService not available');
          throw new Error('PublishingService not available');
        }

        try {
          // Execute the build and submit workflow
          await publishingService.executeBuildAndSubmit(publishingId);

          logger.info('[PublishingWorker] Job completed successfully', {
            jobId: job.id,
            publishingId,
          });

          return { success: true, publishingId };
        } catch (error) {
          logger.error('[PublishingWorker] Job failed', {
            jobId: job.id,
            publishingId,
            error: error instanceof Error ? error.message : String(error),
            attemptsMade: job.attemptsMade,
          });

          // Re-throw error to trigger BullMQ retry mechanism
          throw error;
        }
      },
      {
        connection,
        limiter: {
          max: 5, // Maximum 5 jobs
          duration: 60000, // Per minute (60 seconds)
        },
      },
    )
  : null;

/**
 * Event Handlers
 *
 * Log job lifecycle events for monitoring and debugging
 */
if (publishingWorker) {
  /**
   * Job completed successfully
   */
  publishingWorker.on('completed', (job) => {
    logger.info('[PublishingWorker] Job completed event', {
      jobId: job.id,
      returnValue: job.returnvalue,
    });
  });

  /**
   * Job failed after all retry attempts
   */
  publishingWorker.on('failed', (job, error) => {
    logger.error('[PublishingWorker] Job failed event', {
      jobId: job?.id,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  /**
   * Worker-level error (not job-specific)
   */
  publishingWorker.on('error', (error) => {
    logger.error('[PublishingWorker] Worker error', {
      error: error.message,
    });
  });

  logger.info('[PublishingWorker] Worker initialized successfully', {
    queueName: PUBLISHING_QUEUE_NAME,
  });
} else {
  logger.warn(
    '[PublishingWorker] Worker not initialized - Redis not available. ' +
      'Background job processing disabled.',
  );
}

export default publishingWorker;
