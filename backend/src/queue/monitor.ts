/**
 * Queue Monitoring Utilities
 *
 * This module provides utilities for monitoring BullMQ queues,
 * including job counts, queue health, and worker status.
 *
 * Features:
 * - Queue metrics (active, waiting, completed, failed counts)
 * - Job status lookup
 * - Worker status monitoring
 * - Queue health checks
 *
 * @module queue/monitor
 */

import { Job, JobState, JobProgress } from 'bullmq';
import { logger } from '../lib/logger';
import { QUEUE_NAMES, QueueName, getQueue, AgentExecutionJobData } from './index';
import { getAgentExecutionWorkerStatus, getAllWorkersStatus, WorkerStatus } from './worker';

/**
 * Queue job counts
 */
export interface QueueJobCounts {
  active: number;
  waiting: number;
  waitingChildren: number;
  prioritized: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
}

/**
 * Queue metrics with additional information
 */
export interface QueueMetrics {
  name: QueueName;
  counts: QueueJobCounts;
  isPaused: boolean;
  latestJobTimestamp?: number;
  oldestJobTimestamp?: number;
}

/**
 * Job status information
 */
export interface JobStatus {
  id: string;
  name: string;
  state: JobState | 'unknown';
  progress: JobProgress;
  attemptsMade: number;
  maxAttempts: number;
  data: unknown;
  returnvalue?: unknown;
  failedReason?: string;
  stacktrace?: string[];
  createdAt: number;
  processedOn?: number;
  finishedOn?: number;
  delay?: number;
}

/**
 * Queue health status
 */
export interface QueueHealthStatus {
  name: QueueName;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  isPaused: boolean;
  hasWorker: boolean;
  workerRunning: boolean;
  metrics: QueueJobCounts;
  issues: string[];
}

/**
 * Overall system health
 */
export interface SystemQueueHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  queues: QueueHealthStatus[];
  workers: WorkerStatus[];
  timestamp: string;
}

/**
 * Get job counts for a queue
 *
 * @param queueName - Name of the queue
 * @returns Job counts by state
 */
export const getQueueJobCounts = async (queueName: QueueName): Promise<QueueJobCounts> => {
  try {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts(
      'active',
      'waiting',
      'waiting-children',
      'prioritized',
      'delayed',
      'completed',
      'failed',
      'paused',
    );

    return {
      active: counts.active || 0,
      waiting: counts.waiting || 0,
      waitingChildren: counts['waiting-children'] || 0,
      prioritized: counts.prioritized || 0,
      delayed: counts.delayed || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      paused: counts.paused || 0,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to get job counts`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get metrics for a queue
 *
 * @param queueName - Name of the queue
 * @returns Queue metrics
 */
export const getQueueMetrics = async (queueName: QueueName): Promise<QueueMetrics> => {
  try {
    const queue = getQueue(queueName);
    const counts = await getQueueJobCounts(queueName);
    const isPaused = await queue.isPaused();

    // Get timestamp of latest and oldest waiting jobs
    let latestJobTimestamp: number | undefined;
    let oldestJobTimestamp: number | undefined;

    const waitingJobs = await queue.getWaiting(0, 0);
    const firstJob = waitingJobs[0];
    if (firstJob) {
      latestJobTimestamp = firstJob.timestamp;
    }

    const oldestWaiting = await queue.getWaiting(-1, -1);
    const oldestJob = oldestWaiting[0];
    if (oldestJob) {
      oldestJobTimestamp = oldestJob.timestamp;
    }

    return {
      name: queueName,
      counts,
      isPaused,
      latestJobTimestamp,
      oldestJobTimestamp,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to get queue metrics`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get agent execution queue metrics
 *
 * @returns Queue metrics for agent execution queue
 */
export const getAgentExecutionQueueMetrics = async (): Promise<QueueMetrics> => {
  return getQueueMetrics(QUEUE_NAMES.AGENT_EXECUTION);
};

/**
 * Get job status by ID
 *
 * @param queueName - Name of the queue
 * @param jobId - Job ID to look up
 * @returns Job status or null if not found
 */
export const getJobStatus = async (
  queueName: QueueName,
  jobId: string,
): Promise<JobStatus | null> => {
  try {
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id || jobId,
      name: job.name,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts?.attempts || 1,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      delay: job.delay,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to get job status`, {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get agent execution job status
 *
 * @param executionId - Execution ID (used as job ID)
 * @returns Job status or null if not found
 */
export const getAgentExecutionJobStatus = async (
  executionId: string,
): Promise<JobStatus | null> => {
  return getJobStatus(QUEUE_NAMES.AGENT_EXECUTION, executionId);
};

/**
 * Get jobs by state
 *
 * @param queueName - Name of the queue
 * @param state - Job state to filter by
 * @param start - Start index (default: 0)
 * @param end - End index (default: 99)
 * @returns Array of jobs
 */
export const getJobsByState = async (
  queueName: QueueName,
  state: 'active' | 'waiting' | 'delayed' | 'completed' | 'failed',
  start = 0,
  end = 99,
): Promise<Job[]> => {
  try {
    const queue = getQueue(queueName);

    switch (state) {
      case 'active':
        return queue.getActive(start, end);
      case 'waiting':
        return queue.getWaiting(start, end);
      case 'delayed':
        return queue.getDelayed(start, end);
      case 'completed':
        return queue.getCompleted(start, end);
      case 'failed':
        return queue.getFailed(start, end);
      default:
        return [];
    }
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to get jobs by state`, {
      state,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get failed jobs for the agent execution queue
 *
 * @param start - Start index
 * @param end - End index
 * @returns Array of failed jobs
 */
export const getFailedAgentExecutionJobs = async (
  start = 0,
  end = 99,
): Promise<Job<AgentExecutionJobData>[]> => {
  return getJobsByState(QUEUE_NAMES.AGENT_EXECUTION, 'failed', start, end) as Promise<
    Job<AgentExecutionJobData>[]
  >;
};

/**
 * Get active jobs for the agent execution queue
 *
 * @param start - Start index
 * @param end - End index
 * @returns Array of active jobs
 */
export const getActiveAgentExecutionJobs = async (
  start = 0,
  end = 99,
): Promise<Job<AgentExecutionJobData>[]> => {
  return getJobsByState(QUEUE_NAMES.AGENT_EXECUTION, 'active', start, end) as Promise<
    Job<AgentExecutionJobData>[]
  >;
};

/**
 * Check queue health
 *
 * @param queueName - Name of the queue
 * @returns Queue health status
 */
export const checkQueueHealth = async (queueName: QueueName): Promise<QueueHealthStatus> => {
  const issues: string[] = [];
  let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';

  try {
    const metrics = await getQueueJobCounts(queueName);
    const queue = getQueue(queueName);
    const isPaused = await queue.isPaused();

    // Get worker status
    let workerStatus: WorkerStatus | null = null;
    if (queueName === QUEUE_NAMES.AGENT_EXECUTION) {
      workerStatus = getAgentExecutionWorkerStatus();
    }

    const hasWorker = workerStatus !== null;
    const workerRunning = workerStatus?.isRunning || false;

    // Determine health status based on metrics
    status = 'healthy';

    // Check for issues
    if (isPaused) {
      issues.push('Queue is paused');
      status = 'degraded';
    }

    if (!hasWorker) {
      issues.push('No worker attached to queue');
      status = 'degraded';
    } else if (!workerRunning) {
      issues.push('Worker is not running');
      status = 'degraded';
    }

    // Check for high failure rate
    const totalProcessed = metrics.completed + metrics.failed;
    if (totalProcessed > 0) {
      const failureRate = metrics.failed / totalProcessed;
      if (failureRate > 0.5) {
        issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
        status = 'unhealthy';
      } else if (failureRate > 0.1) {
        issues.push(`Elevated failure rate: ${(failureRate * 100).toFixed(1)}%`);
        if (status === 'healthy') {
          status = 'degraded';
        }
      }
    }

    // Check for job backlog
    const pendingJobs = metrics.waiting + metrics.delayed;
    if (pendingJobs > 1000) {
      issues.push(`Large job backlog: ${pendingJobs} pending jobs`);
      if (status === 'healthy') {
        status = 'degraded';
      }
    } else if (pendingJobs > 5000) {
      issues.push(`Critical job backlog: ${pendingJobs} pending jobs`);
      status = 'unhealthy';
    }

    // Check for stalled jobs (jobs that are active but not being processed)
    if (metrics.active > 0 && !workerRunning) {
      issues.push(`${metrics.active} jobs may be stalled (no running worker)`);
      status = 'unhealthy';
    }

    return {
      name: queueName,
      status,
      isPaused,
      hasWorker,
      workerRunning,
      metrics,
      issues,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to check queue health`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      name: queueName,
      status: 'unknown',
      isPaused: false,
      hasWorker: false,
      workerRunning: false,
      metrics: {
        active: 0,
        waiting: 0,
        waitingChildren: 0,
        prioritized: 0,
        delayed: 0,
        completed: 0,
        failed: 0,
        paused: 0,
      },
      issues: [`Failed to check health: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
};

/**
 * Check agent execution queue health
 *
 * @returns Queue health status
 */
export const checkAgentExecutionQueueHealth = async (): Promise<QueueHealthStatus> => {
  return checkQueueHealth(QUEUE_NAMES.AGENT_EXECUTION);
};

/**
 * Get overall system queue health
 *
 * @returns System-wide queue health status
 */
export const getSystemQueueHealth = async (): Promise<SystemQueueHealth> => {
  const queueNames = Object.values(QUEUE_NAMES);
  const queueHealthPromises = queueNames.map((name) => checkQueueHealth(name));

  const queuesHealth = await Promise.all(queueHealthPromises);
  const workersStatus = getAllWorkersStatus();

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';

  for (const queueHealth of queuesHealth) {
    if (queueHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
      break;
    }
    if (queueHealth.status === 'degraded' && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
    if (queueHealth.status === 'unknown' && overallStatus === 'healthy') {
      overallStatus = 'unknown';
    }
  }

  return {
    status: overallStatus,
    queues: queuesHealth,
    workers: workersStatus,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get queue throughput metrics
 *
 * @param queueName - Name of the queue
 * @param period - Time period in milliseconds (default: 1 hour)
 * @returns Throughput metrics
 */
export interface ThroughputMetrics {
  name: QueueName;
  period: number;
  completed: number;
  failed: number;
  throughputPerMinute: number;
  successRate: number;
}

export const getQueueThroughput = async (
  queueName: QueueName,
  period = 3600000, // 1 hour
): Promise<ThroughputMetrics> => {
  try {
    const queue = getQueue(queueName);
    const now = Date.now();
    const startTime = now - period;

    // Get completed jobs in the period
    const completedJobs = await queue.getCompleted(0, -1);
    const recentCompleted = completedJobs.filter(
      (job) => job.finishedOn && job.finishedOn >= startTime,
    );

    // Get failed jobs in the period
    const failedJobs = await queue.getFailed(0, -1);
    const recentFailed = failedJobs.filter((job) => job.finishedOn && job.finishedOn >= startTime);

    const completed = recentCompleted.length;
    const failed = recentFailed.length;
    const total = completed + failed;

    // Calculate throughput per minute
    const periodMinutes = period / 60000;
    const throughputPerMinute = total / periodMinutes;

    // Calculate success rate
    const successRate = total > 0 ? completed / total : 1;

    return {
      name: queueName,
      period,
      completed,
      failed,
      throughputPerMinute,
      successRate,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to get throughput metrics`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Get agent execution queue throughput
 *
 * @param period - Time period in milliseconds
 * @returns Throughput metrics
 */
export const getAgentExecutionThroughput = async (period = 3600000): Promise<ThroughputMetrics> => {
  return getQueueThroughput(QUEUE_NAMES.AGENT_EXECUTION, period);
};

/**
 * Clean old jobs from the queue
 *
 * @param queueName - Name of the queue
 * @param gracePeriod - Time in milliseconds to keep completed/failed jobs
 * @param limit - Maximum number of jobs to remove per state
 * @returns Number of jobs cleaned
 */
export const cleanOldJobs = async (
  queueName: QueueName,
  gracePeriod = 24 * 60 * 60 * 1000, // 24 hours
  limit = 1000,
): Promise<{ completed: number; failed: number }> => {
  try {
    const queue = getQueue(queueName);

    const completedCleaned = await queue.clean(gracePeriod, limit, 'completed');
    const failedCleaned = await queue.clean(gracePeriod * 7, limit, 'failed'); // Keep failed longer

    logger.info(`[Monitor:${queueName}] Cleaned old jobs`, {
      completed: completedCleaned.length,
      failed: failedCleaned.length,
    });

    return {
      completed: completedCleaned.length,
      failed: failedCleaned.length,
    };
  } catch (error) {
    logger.error(`[Monitor:${queueName}] Failed to clean old jobs`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Clean old jobs from the agent execution queue
 *
 * @param gracePeriod - Time in milliseconds to keep completed/failed jobs
 * @param limit - Maximum number of jobs to remove per state
 * @returns Number of jobs cleaned
 */
export const cleanAgentExecutionJobs = async (
  gracePeriod = 24 * 60 * 60 * 1000,
  limit = 1000,
): Promise<{ completed: number; failed: number }> => {
  return cleanOldJobs(QUEUE_NAMES.AGENT_EXECUTION, gracePeriod, limit);
};

export default {
  getQueueJobCounts,
  getQueueMetrics,
  getAgentExecutionQueueMetrics,
  getJobStatus,
  getAgentExecutionJobStatus,
  getJobsByState,
  getFailedAgentExecutionJobs,
  getActiveAgentExecutionJobs,
  checkQueueHealth,
  checkAgentExecutionQueueHealth,
  getSystemQueueHealth,
  getQueueThroughput,
  getAgentExecutionThroughput,
  cleanOldJobs,
  cleanAgentExecutionJobs,
};
