/**
 * BullMQ Queue Configuration
 *
 * This module provides the main queue configuration for the Turbocat
 * job processing system. It sets up the agent-execution queue with
 * proper retry policies and job retention settings.
 *
 * Features:
 * - Agent execution queue with 3 retry attempts
 * - Exponential backoff for failed jobs
 * - Job retention: completed (24h), failed (7 days)
 * - Rate limiting support
 *
 * @module queue
 */

import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';
import { logger } from '../lib/logger';

/**
 * Queue names used in the application
 */
export const QUEUE_NAMES = {
  AGENT_EXECUTION: 'agent-execution',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job types for the agent-execution queue
 */
export interface AgentExecutionJobData {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerType: 'MANUAL' | 'SCHEDULED' | 'API' | 'WEBHOOK' | 'EVENT';
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Job result from agent execution
 */
export interface AgentExecutionJobResult {
  executionId: string;
  status: 'COMPLETED' | 'FAILED';
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  stepsCompleted: number;
  stepsFailed: number;
}

/**
 * Default job options for the agent-execution queue
 * - 3 retry attempts with exponential backoff
 * - Remove completed jobs after 24 hours
 * - Keep failed jobs for 7 days
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // Initial delay of 1 second
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // 24 hours in seconds
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // 7 days in seconds
    count: 5000, // Keep max 5000 failed jobs
  },
};

/**
 * Queue options with default settings
 */
const getQueueOptions = (): QueueOptions => {
  const connection = getBullMQConnection();

  if (!connection) {
    throw new Error('Redis connection not available for BullMQ');
  }

  return {
    connection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  };
};

/**
 * Queue instances cache
 */
const queues: Map<QueueName, Queue> = new Map();

/**
 * Get or create a queue instance
 *
 * @param queueName - Name of the queue
 * @returns Queue instance
 */
export const getQueue = <T = AgentExecutionJobData>(queueName: QueueName): Queue<T> => {
  if (!queues.has(queueName)) {
    try {
      const options = getQueueOptions();
      const queue = new Queue<T>(queueName, options);

      // Add event listeners for monitoring
      queue.on('error', (error) => {
        logger.error(`[Queue:${queueName}] Error:`, { error: error.message });
      });

      queues.set(queueName, queue as Queue);
      logger.info(`[Queue:${queueName}] Queue instance created`);
    } catch (error) {
      logger.error(`[Queue:${queueName}] Failed to create queue:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  return queues.get(queueName) as Queue<T>;
};

/**
 * Get the agent-execution queue
 *
 * @returns Agent execution queue instance
 */
export const getAgentExecutionQueue = (): Queue<AgentExecutionJobData> => {
  return getQueue<AgentExecutionJobData>(QUEUE_NAMES.AGENT_EXECUTION);
};

/**
 * Add a job to the agent-execution queue
 *
 * @param data - Job data for agent execution
 * @param options - Optional job-specific options
 * @returns Job instance
 */
export const addAgentExecutionJob = async (
  data: AgentExecutionJobData,
  options?: Partial<JobsOptions>,
) => {
  const queue = getAgentExecutionQueue();

  const jobOptions: JobsOptions = {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    // Use executionId as job ID for deduplication
    jobId: data.executionId,
  };

  const job = await queue.add('execute', data, jobOptions);

  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Job added`, {
    jobId: job.id,
    executionId: data.executionId,
    workflowId: data.workflowId,
    triggerType: data.triggerType,
  });

  return job;
};

/**
 * Add a delayed job to the agent-execution queue
 *
 * @param data - Job data for agent execution
 * @param delayMs - Delay in milliseconds before job becomes active
 * @param options - Optional job-specific options
 * @returns Job instance
 */
export const addDelayedAgentExecutionJob = async (
  data: AgentExecutionJobData,
  delayMs: number,
  options?: Partial<JobsOptions>,
) => {
  return addAgentExecutionJob(data, {
    ...options,
    delay: delayMs,
  });
};

/**
 * Add a scheduled job to the agent-execution queue
 *
 * @param data - Job data for agent execution
 * @param scheduledTime - Date/time when job should run
 * @param options - Optional job-specific options
 * @returns Job instance
 */
export const addScheduledAgentExecutionJob = async (
  data: AgentExecutionJobData,
  scheduledTime: Date,
  options?: Partial<JobsOptions>,
) => {
  const now = Date.now();
  const scheduled = scheduledTime.getTime();
  const delayMs = Math.max(0, scheduled - now);

  return addAgentExecutionJob(data, {
    ...options,
    delay: delayMs,
  });
};

/**
 * Get a job by ID from the agent-execution queue
 *
 * @param jobId - Job ID (usually the executionId)
 * @returns Job instance or null if not found
 */
export const getAgentExecutionJob = async (jobId: string) => {
  const queue = getAgentExecutionQueue();
  return queue.getJob(jobId);
};

/**
 * Remove a job from the agent-execution queue
 *
 * @param jobId - Job ID to remove
 * @returns True if job was removed
 */
export const removeAgentExecutionJob = async (jobId: string): Promise<boolean> => {
  const job = await getAgentExecutionJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();
  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Job removed`, { jobId });
  return true;
};

/**
 * Retry a failed job
 *
 * @param jobId - Job ID to retry
 * @returns True if job was retried
 */
export const retryAgentExecutionJob = async (jobId: string): Promise<boolean> => {
  const job = await getAgentExecutionJob(jobId);

  if (!job) {
    return false;
  }

  await job.retry();
  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Job retried`, { jobId });
  return true;
};

/**
 * Close all queue connections
 * Should be called during graceful shutdown
 */
export const closeAllQueues = async (): Promise<void> => {
  const closePromises = Array.from(queues.entries()).map(async ([name, queue]) => {
    try {
      await queue.close();
      logger.info(`[Queue:${name}] Queue closed`);
    } catch (error) {
      logger.error(`[Queue:${name}] Error closing queue:`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await Promise.all(closePromises);
  queues.clear();
};

/**
 * Pause the agent-execution queue
 */
export const pauseAgentExecutionQueue = async (): Promise<void> => {
  const queue = getAgentExecutionQueue();
  await queue.pause();
  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Queue paused`);
};

/**
 * Resume the agent-execution queue
 */
export const resumeAgentExecutionQueue = async (): Promise<void> => {
  const queue = getAgentExecutionQueue();
  await queue.resume();
  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Queue resumed`);
};

/**
 * Drain the agent-execution queue (remove all jobs)
 *
 * @param delayed - Also remove delayed jobs
 */
export const drainAgentExecutionQueue = async (delayed = true): Promise<void> => {
  const queue = getAgentExecutionQueue();
  await queue.drain(delayed);
  logger.info(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Queue drained`, { delayed });
};

/**
 * Obliterate the queue (remove all jobs and data)
 * Use with caution - this is destructive!
 */
export const obliterateAgentExecutionQueue = async (): Promise<void> => {
  const queue = getAgentExecutionQueue();
  await queue.obliterate({ force: true });
  logger.warn(`[Queue:${QUEUE_NAMES.AGENT_EXECUTION}] Queue obliterated`);
};

export { Queue };
