/**
 * Publishing Queue Configuration
 *
 * BullMQ queue for managing background publishing jobs. Handles queueing
 * and job lifecycle management for Expo builds and App Store submissions.
 *
 * Features:
 * - Automatic retry with exponential backoff (3 attempts)
 * - Job history retention (100 completed, 500 failed)
 * - Graceful degradation when Redis is unavailable
 *
 * @module lib/publishingQueue
 */

import { Queue } from 'bullmq';
import { getBullMQConnection } from './redis';
import { logger } from './logger';

/**
 * Publishing job data structure
 */
export interface PublishingJobData {
  /** Publishing record ID */
  publishingId: string;
  /** Project/Workflow ID */
  projectId: string;
  /** User ID who initiated the publishing */
  userId: string;
}

/**
 * Queue name constant
 */
export const PUBLISHING_QUEUE_NAME = 'publishing-builds';

/**
 * Get Redis connection for BullMQ
 */
const connection = getBullMQConnection();

/**
 * Publishing Queue instance
 *
 * Manages background jobs for publishing mobile apps.
 * Returns null if Redis is not available.
 *
 * Job options:
 * - attempts: 3 retries on failure
 * - backoff: Exponential backoff starting at 2 seconds
 * - removeOnComplete: Keep last 100 completed jobs
 * - removeOnFail: Keep last 500 failed jobs for debugging
 *
 * @example
 * ```typescript
 * import { publishingQueue } from '@/lib/publishingQueue';
 *
 * if (publishingQueue) {
 *   await publishingQueue.add('build-and-submit', {
 *     publishingId: 'pub-123',
 *     projectId: 'proj-456',
 *     userId: 'user-789'
 *   });
 * }
 * ```
 */
export const publishingQueue = connection
  ? new Queue<PublishingJobData>(PUBLISHING_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay, doubles each retry
        },
        removeOnComplete: 100, // Keep last 100 completed jobs for monitoring
        removeOnFail: 500, // Keep last 500 failed jobs for debugging
      },
    })
  : null;

// Log initialization status
if (!publishingQueue) {
  logger.warn(
    '[PublishingQueue] Queue not initialized - Redis not available. ' +
      'Background job processing disabled.',
  );
} else {
  logger.info('[PublishingQueue] Queue initialized successfully', {
    queueName: PUBLISHING_QUEUE_NAME,
  });
}

/**
 * Check if publishing queue is available
 *
 * @returns True if queue is initialized and ready
 */
export const isPublishingQueueAvailable = (): boolean => {
  return publishingQueue !== null;
};

export default publishingQueue;
