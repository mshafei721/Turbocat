/**
 * BullMQ Worker Configuration
 *
 * This module creates and manages the BullMQ worker for processing
 * agent execution jobs. It handles job processing, concurrency,
 * rate limiting, and lifecycle events.
 *
 * Features:
 * - Configurable concurrency (default: 10 concurrent jobs)
 * - Rate limiting (default: 100 jobs/min)
 * - Event handlers for completed, failed, and progress events
 * - Graceful shutdown support
 *
 * @module queue/worker
 */

import { Worker, WorkerOptions, Job, JobProgress } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';
import { logger } from '../lib/logger';
import { QUEUE_NAMES, AgentExecutionJobData, AgentExecutionJobResult } from './index';
import { agentExecutorProcessor } from './processors/agentExecutor';

/**
 * Worker configuration options
 */
export interface WorkerConfig {
  /**
   * Number of concurrent jobs to process
   * @default 10
   */
  concurrency?: number;

  /**
   * Rate limit: max jobs per interval
   * @default 100
   */
  rateLimitMax?: number;

  /**
   * Rate limit: interval in milliseconds
   * @default 60000 (1 minute)
   */
  rateLimitDuration?: number;

  /**
   * Lock duration in milliseconds
   * @default 30000 (30 seconds)
   */
  lockDuration?: number;

  /**
   * Lock renew time in milliseconds
   * @default 15000 (15 seconds)
   */
  lockRenewTime?: number;

  /**
   * Stalled job check interval in milliseconds
   * @default 30000 (30 seconds)
   */
  stalledInterval?: number;

  /**
   * Max stalled count before job is considered failed
   * @default 1
   */
  maxStalledCount?: number;
}

/**
 * Default worker configuration
 */
const DEFAULT_WORKER_CONFIG: Required<WorkerConfig> = {
  concurrency: 10,
  rateLimitMax: 100,
  rateLimitDuration: 60000, // 1 minute
  lockDuration: 30000, // 30 seconds
  lockRenewTime: 15000, // 15 seconds
  stalledInterval: 30000, // 30 seconds
  maxStalledCount: 1,
};

/**
 * Worker instances cache
 */
const workers: Map<string, Worker> = new Map();

/**
 * Get worker options from configuration
 */
const getWorkerOptions = (config: WorkerConfig = {}): WorkerOptions => {
  const connection = getBullMQConnection();

  if (!connection) {
    throw new Error('Redis connection not available for BullMQ worker');
  }

  const mergedConfig = { ...DEFAULT_WORKER_CONFIG, ...config };

  return {
    connection,
    concurrency: mergedConfig.concurrency,
    limiter: {
      max: mergedConfig.rateLimitMax,
      duration: mergedConfig.rateLimitDuration,
    },
    lockDuration: mergedConfig.lockDuration,
    lockRenewTime: mergedConfig.lockRenewTime,
    stalledInterval: mergedConfig.stalledInterval,
    maxStalledCount: mergedConfig.maxStalledCount,
    autorun: false, // Start manually for better control
  };
};

/**
 * Create and start the agent execution worker
 *
 * @param config - Optional worker configuration
 * @returns Worker instance
 */
export const createAgentExecutionWorker = (
  config?: WorkerConfig,
): Worker<AgentExecutionJobData, AgentExecutionJobResult> => {
  const queueName = QUEUE_NAMES.AGENT_EXECUTION;

  // Close existing worker if any
  const existingWorker = workers.get(queueName);
  if (existingWorker) {
    logger.warn(`[Worker:${queueName}] Closing existing worker`);
    void existingWorker.close();
    workers.delete(queueName);
  }

  const options = getWorkerOptions(config);
  const worker = new Worker<AgentExecutionJobData, AgentExecutionJobResult>(
    queueName,
    agentExecutorProcessor,
    options,
  );

  // Set up event handlers
  setupWorkerEventHandlers(worker, queueName);

  // Store worker instance
  workers.set(queueName, worker);

  logger.info(`[Worker:${queueName}] Worker created`, {
    concurrency: options.concurrency,
    rateLimitMax: options.limiter?.max,
    rateLimitDuration: options.limiter?.duration,
  });

  return worker;
};

/**
 * Set up event handlers for a worker
 */
const setupWorkerEventHandlers = (
  worker: Worker<AgentExecutionJobData, AgentExecutionJobResult>,
  queueName: string,
): void => {
  // Job completed successfully
  worker.on('completed', (job: Job<AgentExecutionJobData>, result: AgentExecutionJobResult) => {
    logger.info(`[Worker:${queueName}] Job completed`, {
      jobId: job.id,
      executionId: job.data.executionId,
      status: result.status,
      durationMs: result.durationMs,
      stepsCompleted: result.stepsCompleted,
      stepsFailed: result.stepsFailed,
    });
  });

  // Job failed
  worker.on('failed', (job: Job<AgentExecutionJobData> | undefined, error: Error) => {
    logger.error(`[Worker:${queueName}] Job failed`, {
      jobId: job?.id,
      executionId: job?.data?.executionId,
      error: error.message,
      attempt: job?.attemptsMade,
      maxAttempts: job?.opts?.attempts,
    });
  });

  // Job progress updated
  worker.on('progress', (job: Job<AgentExecutionJobData>, progress: JobProgress) => {
    logger.debug(`[Worker:${queueName}] Job progress`, {
      jobId: job.id,
      executionId: job.data.executionId,
      progress,
    });
  });

  // Job became active (started processing)
  worker.on('active', (job: Job<AgentExecutionJobData>) => {
    logger.info(`[Worker:${queueName}] Job active`, {
      jobId: job.id,
      executionId: job.data.executionId,
      workflowId: job.data.workflowId,
    });
  });

  // Job stalled (worker crashed or disconnected)
  worker.on('stalled', (jobId: string) => {
    logger.warn(`[Worker:${queueName}] Job stalled`, { jobId });
  });

  // Worker error
  worker.on('error', (error: Error) => {
    logger.error(`[Worker:${queueName}] Worker error`, { error: error.message });
  });

  // Worker ready
  worker.on('ready', () => {
    logger.info(`[Worker:${queueName}] Worker ready and listening`);
  });

  // Worker closing
  worker.on('closing', () => {
    logger.info(`[Worker:${queueName}] Worker closing`);
  });

  // Worker closed
  worker.on('closed', () => {
    logger.info(`[Worker:${queueName}] Worker closed`);
    workers.delete(queueName);
  });
};

/**
 * Start the agent execution worker
 *
 * @param config - Optional worker configuration
 * @returns Worker instance (already running)
 */
export const startAgentExecutionWorker = async (
  config?: WorkerConfig,
): Promise<Worker<AgentExecutionJobData, AgentExecutionJobResult>> => {
  const worker = createAgentExecutionWorker(config);

  // Start the worker
  await worker.run();

  logger.info(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] Worker started`);

  return worker;
};

/**
 * Get the agent execution worker instance
 *
 * @returns Worker instance or undefined if not created
 */
export const getAgentExecutionWorker = ():
  | Worker<AgentExecutionJobData, AgentExecutionJobResult>
  | undefined => {
  return workers.get(QUEUE_NAMES.AGENT_EXECUTION) as
    | Worker<AgentExecutionJobData, AgentExecutionJobResult>
    | undefined;
};

/**
 * Check if the agent execution worker is running
 *
 * @returns True if worker is running
 */
export const isAgentExecutionWorkerRunning = (): boolean => {
  const worker = workers.get(QUEUE_NAMES.AGENT_EXECUTION);
  return worker !== undefined && worker.isRunning();
};

/**
 * Pause the agent execution worker
 *
 * @param doNotWaitActive - If true, don't wait for active jobs to complete
 */
export const pauseAgentExecutionWorker = async (doNotWaitActive = false): Promise<void> => {
  const worker = workers.get(QUEUE_NAMES.AGENT_EXECUTION);

  if (!worker) {
    logger.warn(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] No worker to pause`);
    return;
  }

  await worker.pause(doNotWaitActive);
  logger.info(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] Worker paused`, {
    doNotWaitActive,
  });
};

/**
 * Resume the agent execution worker
 */
export const resumeAgentExecutionWorker = (): void => {
  const worker = workers.get(QUEUE_NAMES.AGENT_EXECUTION);

  if (!worker) {
    logger.warn(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] No worker to resume`);
    return;
  }

  worker.resume();
  logger.info(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] Worker resumed`);
};

/**
 * Close the agent execution worker gracefully
 *
 * @param force - If true, close immediately without waiting for jobs
 */
export const closeAgentExecutionWorker = async (force = false): Promise<void> => {
  const worker = workers.get(QUEUE_NAMES.AGENT_EXECUTION);

  if (!worker) {
    logger.warn(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] No worker to close`);
    return;
  }

  try {
    await worker.close(force);
    workers.delete(QUEUE_NAMES.AGENT_EXECUTION);
    logger.info(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] Worker closed`, { force });
  } catch (error) {
    logger.error(`[Worker:${QUEUE_NAMES.AGENT_EXECUTION}] Error closing worker`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Close all workers gracefully
 *
 * @param force - If true, close immediately without waiting for jobs
 */
export const closeAllWorkers = async (force = false): Promise<void> => {
  const closePromises = Array.from(workers.entries()).map(async ([name, worker]) => {
    try {
      await worker.close(force);
      logger.info(`[Worker:${name}] Worker closed`);
    } catch (error) {
      logger.error(`[Worker:${name}] Error closing worker`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await Promise.all(closePromises);
  workers.clear();
};

/**
 * Get worker status information
 */
export interface WorkerStatus {
  name: string;
  isRunning: boolean;
  isPaused: boolean;
  concurrency: number;
}

/**
 * Get status of all workers
 *
 * @returns Array of worker status objects
 */
export const getAllWorkersStatus = (): WorkerStatus[] => {
  return Array.from(workers.entries()).map(([name, worker]) => ({
    name,
    isRunning: worker.isRunning(),
    isPaused: worker.isPaused(),
    concurrency: worker.opts.concurrency || DEFAULT_WORKER_CONFIG.concurrency,
  }));
};

/**
 * Get the agent execution worker status
 *
 * @returns Worker status or null if not created
 */
export const getAgentExecutionWorkerStatus = (): WorkerStatus | null => {
  const worker = workers.get(QUEUE_NAMES.AGENT_EXECUTION);

  if (!worker) {
    return null;
  }

  return {
    name: QUEUE_NAMES.AGENT_EXECUTION,
    isRunning: worker.isRunning(),
    isPaused: worker.isPaused(),
    concurrency: worker.opts.concurrency || DEFAULT_WORKER_CONFIG.concurrency,
  };
};

export { Worker };
export default createAgentExecutionWorker;
