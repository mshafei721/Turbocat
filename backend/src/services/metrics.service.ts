/**
 * Execution Metrics Service
 *
 * This service handles collection and calculation of execution metrics
 * for workflows and agents. Provides utilities for tracking performance,
 * calculating percentiles, and updating workflow/agent statistics.
 *
 * Features:
 * - Calculate step durations
 * - Calculate execution percentiles (p50, p95, p99)
 * - Track success/failure counts
 * - Update workflow and agent metrics
 * - Real-time metrics aggregation
 *
 * @module services/metrics.service
 */

import { ExecutionStatus, StepStatus } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Performance percentiles
 */
export interface PerformancePercentiles {
  /** 50th percentile (median) */
  p50: number;
  /** 95th percentile */
  p95: number;
  /** 99th percentile */
  p99: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Average value */
  avg: number;
  /** Sample count */
  count: number;
}

/**
 * Execution metrics summary
 */
export interface ExecutionMetricsSummary {
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Total execution duration in milliseconds */
  totalDurationMs: number;
  /** Step durations keyed by step key */
  stepDurations: Record<string, number>;
  /** Step statuses keyed by step key */
  stepStatuses: Record<string, StepStatus>;
  /** Number of completed steps */
  stepsCompleted: number;
  /** Number of failed steps */
  stepsFailed: number;
  /** Number of skipped steps */
  stepsSkipped: number;
  /** Total number of steps */
  stepsTotal: number;
  /** Overall success rate (0-100) */
  successRate: number;
  /** Timestamp when metrics were collected */
  collectedAt: Date;
}

/**
 * Workflow metrics update
 */
export interface WorkflowMetricsUpdate {
  /** Total executions to add */
  totalExecutions?: number;
  /** Successful executions to add */
  successfulExecutions?: number;
  /** Failed executions to add */
  failedExecutions?: number;
  /** New average execution time in ms (will be recalculated) */
  executionDurationMs?: number;
  /** Timestamp of last execution */
  lastExecutionAt?: Date;
}

/**
 * Agent metrics update
 */
export interface AgentMetricsUpdate {
  /** Total executions to add */
  totalExecutions?: number;
  /** Successful executions to add */
  successfulExecutions?: number;
  /** Failed executions to add */
  failedExecutions?: number;
  /** New execution time in ms (will be used to recalculate average) */
  executionDurationMs?: number;
}

/**
 * Step duration entry
 */
export interface StepDurationEntry {
  stepKey: string;
  durationMs: number;
  status: StepStatus;
}

/**
 * Time range for metrics queries
 */
export interface MetricsTimeRange {
  from: Date;
  to: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default time range for metrics (30 days) */
const DEFAULT_METRICS_DAYS = 30;

/** Minimum sample size for percentile calculation */
const MIN_PERCENTILE_SAMPLE_SIZE = 5;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure database is available
 */
const ensureDatabase = (): void => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }
};

/**
 * Calculate percentiles from an array of numbers
 *
 * Uses simple linear interpolation for percentile estimation.
 * Returns zeros if not enough samples.
 *
 * @param values - Array of numeric values
 * @returns Calculated percentiles
 */
export const calculatePercentiles = (values: number[]): PerformancePercentiles => {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0, count: 0 };
  }

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate percentile indices using linear interpolation
  const getPercentile = (p: number): number => {
    if (n < MIN_PERCENTILE_SAMPLE_SIZE) {
      // Not enough samples for accurate percentile, use max for high percentiles
      if (p >= 95) {
        return sorted[n - 1] ?? 0;
      }
      if (p >= 50) {
        return sorted[Math.floor(n / 2)] ?? 0;
      }
      return sorted[0] ?? 0;
    }

    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower] ?? 0;
    }

    // Linear interpolation
    const fraction = index - lower;
    return Math.round((sorted[lower] ?? 0) * (1 - fraction) + (sorted[upper] ?? 0) * fraction);
  };

  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
    avg: Math.round(sum / n),
    count: n,
  };
};

/**
 * Calculate success rate from counts
 */
const calculateSuccessRate = (total: number, successful: number): number => {
  if (total === 0) {
    return 0;
  }
  return Math.round((successful / total) * 10000) / 100;
};

/**
 * Get default time range for metrics
 */
const getDefaultTimeRange = (): MetricsTimeRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - DEFAULT_METRICS_DAYS);
  return { from, to };
};

// =============================================================================
// CORE METRICS FUNCTIONS
// =============================================================================

/**
 * Collect execution metrics from an execution and its logs
 *
 * This is the main function for collecting metrics after a workflow
 * execution completes. It analyzes execution logs to calculate step
 * durations and overall execution statistics.
 *
 * @param executionId - Execution ID to collect metrics for
 * @returns Collected metrics summary
 *
 * @example
 * ```typescript
 * const metrics = await collectExecutionMetrics('exec-123');
 * console.log(`Execution took ${metrics.totalDurationMs}ms`);
 * console.log(`Success rate: ${metrics.successRate}%`);
 * ```
 */
export const collectExecutionMetrics = async (
  executionId: string,
): Promise<ExecutionMetricsSummary> => {
  ensureDatabase();

  // Load execution
  const execution = await prisma!.execution.findUnique({
    where: { id: executionId },
    include: {
      logs: {
        where: {
          stepKey: { not: null },
          stepStatus: { not: null },
        },
        select: {
          stepKey: true,
          stepStatus: true,
          stepDurationMs: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!execution) {
    throw ApiError.notFound(`Execution not found: ${executionId}`);
  }

  // Extract step durations and statuses
  const stepDurations: Record<string, number> = {};
  const stepStatuses: Record<string, StepStatus> = {};
  const processedSteps = new Set<string>();

  for (const log of execution.logs) {
    if (!log.stepKey) {
      continue;
    }

    // Only use the first (most recent) entry for each step
    if (processedSteps.has(log.stepKey)) {
      continue;
    }
    processedSteps.add(log.stepKey);

    if (log.stepDurationMs !== null) {
      stepDurations[log.stepKey] = log.stepDurationMs;
    }
    if (log.stepStatus) {
      stepStatuses[log.stepKey] = log.stepStatus;
    }
  }

  // Calculate step counts
  const allStatuses = Object.values(stepStatuses);
  const stepsCompleted = allStatuses.filter((s) => s === StepStatus.COMPLETED).length;
  const stepsFailed = allStatuses.filter((s) => s === StepStatus.FAILED).length;
  const stepsSkipped = allStatuses.filter((s) => s === StepStatus.SKIPPED).length;
  const stepsTotal = execution.stepsTotal;

  // Calculate success rate
  const successRate = calculateSuccessRate(stepsTotal, stepsCompleted);

  const summary: ExecutionMetricsSummary = {
    executionId,
    workflowId: execution.workflowId,
    totalDurationMs: execution.durationMs ?? 0,
    stepDurations,
    stepStatuses,
    stepsCompleted,
    stepsFailed,
    stepsSkipped,
    stepsTotal,
    successRate,
    collectedAt: new Date(),
  };

  logger.debug('[Metrics Service] Collected execution metrics:', {
    executionId,
    totalDurationMs: summary.totalDurationMs,
    stepsCompleted,
    stepsFailed,
    successRate,
  });

  return summary;
};

/**
 * Calculate step duration percentiles for a workflow
 *
 * Analyzes historical step durations to provide performance insights.
 *
 * @param workflowId - Workflow ID
 * @param timeRange - Optional time range for metrics
 * @returns Map of step key to percentiles
 */
export const calculateStepDurationPercentiles = async (
  workflowId: string,
  timeRange?: MetricsTimeRange,
): Promise<Map<string, PerformancePercentiles>> => {
  ensureDatabase();

  const range = timeRange ?? getDefaultTimeRange();

  // Get execution logs with step durations
  const logs = await prisma!.executionLog.findMany({
    where: {
      execution: {
        workflowId,
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      stepKey: { not: null },
      stepDurationMs: { not: null },
    },
    select: {
      stepKey: true,
      stepDurationMs: true,
    },
  });

  // Group durations by step
  const stepDurations = new Map<string, number[]>();
  for (const log of logs) {
    if (!log.stepKey || log.stepDurationMs === null) {
      continue;
    }

    const durations = stepDurations.get(log.stepKey) || [];
    durations.push(log.stepDurationMs);
    stepDurations.set(log.stepKey, durations);
  }

  // Calculate percentiles for each step
  const result = new Map<string, PerformancePercentiles>();
  for (const [stepKey, durations] of stepDurations) {
    result.set(stepKey, calculatePercentiles(durations));
  }

  return result;
};

/**
 * Calculate workflow execution percentiles
 *
 * @param workflowId - Workflow ID
 * @param timeRange - Optional time range for metrics
 * @returns Performance percentiles for workflow executions
 */
export const calculateWorkflowPercentiles = async (
  workflowId: string,
  timeRange?: MetricsTimeRange,
): Promise<PerformancePercentiles> => {
  ensureDatabase();

  const range = timeRange ?? getDefaultTimeRange();

  // Get completed executions with durations
  const executions = await prisma!.execution.findMany({
    where: {
      workflowId,
      status: ExecutionStatus.COMPLETED,
      durationMs: { not: null },
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      durationMs: true,
    },
  });

  const durations = executions.filter((e) => e.durationMs !== null).map((e) => e.durationMs!);

  return calculatePercentiles(durations);
};

// =============================================================================
// METRICS UPDATE FUNCTIONS
// =============================================================================

/**
 * Update workflow metrics after an execution
 *
 * This function should be called after each workflow execution to
 * update the workflow's aggregate metrics.
 *
 * @param workflowId - Workflow ID
 * @param update - Metrics update data
 */
export const updateWorkflowMetrics = async (
  workflowId: string,
  update: WorkflowMetricsUpdate,
): Promise<void> => {
  ensureDatabase();

  try {
    // Load current workflow metrics
    const workflow = await prisma!.workflow.findUnique({
      where: { id: workflowId },
      select: {
        totalExecutions: true,
        successfulExecutions: true,
        failedExecutions: true,
        avgExecutionTimeMs: true,
      },
    });

    if (!workflow) {
      logger.warn('[Metrics Service] Workflow not found for metrics update:', {
        workflowId,
      });
      return;
    }

    // Calculate new values
    const newTotal = workflow.totalExecutions + (update.totalExecutions ?? 0);
    const newSuccessful = workflow.successfulExecutions + (update.successfulExecutions ?? 0);
    const newFailed = workflow.failedExecutions + (update.failedExecutions ?? 0);

    // Recalculate average execution time
    let newAvgTime = workflow.avgExecutionTimeMs;
    if (update.executionDurationMs !== undefined && update.totalExecutions) {
      // Weighted average calculation
      const oldWeight = workflow.totalExecutions;
      const newWeight = update.totalExecutions;
      newAvgTime = Math.round(
        (workflow.avgExecutionTimeMs * oldWeight + update.executionDurationMs * newWeight) /
          (oldWeight + newWeight),
      );
    }

    // Update workflow
    await prisma!.workflow.update({
      where: { id: workflowId },
      data: {
        totalExecutions: newTotal,
        successfulExecutions: newSuccessful,
        failedExecutions: newFailed,
        avgExecutionTimeMs: newAvgTime,
        lastExecutionAt: update.lastExecutionAt ?? new Date(),
      },
    });

    logger.debug('[Metrics Service] Updated workflow metrics:', {
      workflowId,
      totalExecutions: newTotal,
      successfulExecutions: newSuccessful,
      failedExecutions: newFailed,
      avgExecutionTimeMs: newAvgTime,
    });
  } catch (error) {
    logger.error('[Metrics Service] Failed to update workflow metrics:', {
      workflowId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - metrics update failures shouldn't fail the execution
  }
};

/**
 * Update agent metrics after an execution
 *
 * This function should be called after each agent step execution to
 * update the agent's aggregate metrics.
 *
 * @param agentId - Agent ID
 * @param update - Metrics update data
 */
export const updateAgentMetrics = async (
  agentId: string,
  update: AgentMetricsUpdate,
): Promise<void> => {
  ensureDatabase();

  try {
    // Load current agent metrics
    const agent = await prisma!.agent.findUnique({
      where: { id: agentId },
      select: {
        totalExecutions: true,
        successfulExecutions: true,
        failedExecutions: true,
        avgExecutionTimeMs: true,
      },
    });

    if (!agent) {
      logger.warn('[Metrics Service] Agent not found for metrics update:', {
        agentId,
      });
      return;
    }

    // Calculate new values
    const newTotal = agent.totalExecutions + (update.totalExecutions ?? 0);
    const newSuccessful = agent.successfulExecutions + (update.successfulExecutions ?? 0);
    const newFailed = agent.failedExecutions + (update.failedExecutions ?? 0);

    // Recalculate average execution time
    let newAvgTime = agent.avgExecutionTimeMs;
    if (update.executionDurationMs !== undefined && update.totalExecutions) {
      const oldWeight = agent.totalExecutions;
      const newWeight = update.totalExecutions;
      newAvgTime = Math.round(
        (agent.avgExecutionTimeMs * oldWeight + update.executionDurationMs * newWeight) /
          (oldWeight + newWeight),
      );
    }

    // Update agent
    await prisma!.agent.update({
      where: { id: agentId },
      data: {
        totalExecutions: newTotal,
        successfulExecutions: newSuccessful,
        failedExecutions: newFailed,
        avgExecutionTimeMs: newAvgTime,
      },
    });

    logger.debug('[Metrics Service] Updated agent metrics:', {
      agentId,
      totalExecutions: newTotal,
      successfulExecutions: newSuccessful,
      failedExecutions: newFailed,
      avgExecutionTimeMs: newAvgTime,
    });
  } catch (error) {
    logger.error('[Metrics Service] Failed to update agent metrics:', {
      agentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - metrics update failures shouldn't fail the execution
  }
};

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Get execution statistics for a workflow
 *
 * @param workflowId - Workflow ID
 * @param timeRange - Optional time range
 * @returns Execution statistics
 */
export const getWorkflowExecutionStats = async (
  workflowId: string,
  timeRange?: MetricsTimeRange,
): Promise<{
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
  pending: number;
  running: number;
  successRate: number;
  failureRate: number;
  avgDurationMs: number;
}> => {
  ensureDatabase();

  const range = timeRange ?? getDefaultTimeRange();

  // Get execution counts by status
  const statusCounts = await prisma!.execution.groupBy({
    by: ['status'],
    where: {
      workflowId,
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    _count: { id: true },
  });

  // Get average duration
  const avgResult = await prisma!.execution.aggregate({
    where: {
      workflowId,
      status: ExecutionStatus.COMPLETED,
      durationMs: { not: null },
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    _avg: { durationMs: true },
  });

  // Process counts
  const counts: Record<string, number> = {};
  let total = 0;
  for (const item of statusCounts) {
    counts[item.status] = item._count.id;
    total += item._count.id;
  }

  const completed = counts[ExecutionStatus.COMPLETED] ?? 0;
  const failed = (counts[ExecutionStatus.FAILED] ?? 0) + (counts[ExecutionStatus.TIMEOUT] ?? 0);
  const cancelled = counts[ExecutionStatus.CANCELLED] ?? 0;
  const pending = counts[ExecutionStatus.PENDING] ?? 0;
  const running = counts[ExecutionStatus.RUNNING] ?? 0;

  return {
    total,
    completed,
    failed,
    cancelled,
    pending,
    running,
    successRate: calculateSuccessRate(total, completed),
    failureRate: calculateSuccessRate(total, failed),
    avgDurationMs: Math.round(avgResult._avg.durationMs ?? 0),
  };
};

/**
 * Get step execution statistics for a workflow
 *
 * @param workflowId - Workflow ID
 * @param timeRange - Optional time range
 * @returns Step statistics by step key
 */
export const getStepExecutionStats = async (
  workflowId: string,
  timeRange?: MetricsTimeRange,
): Promise<
  Map<
    string,
    {
      totalExecutions: number;
      completed: number;
      failed: number;
      skipped: number;
      avgDurationMs: number;
      successRate: number;
    }
  >
> => {
  ensureDatabase();

  const range = timeRange ?? getDefaultTimeRange();

  // Get step logs grouped by step key and status
  const logs = await prisma!.executionLog.findMany({
    where: {
      execution: {
        workflowId,
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      stepKey: { not: null },
      stepStatus: { not: null },
    },
    select: {
      stepKey: true,
      stepStatus: true,
      stepDurationMs: true,
    },
  });

  // Aggregate by step key
  const stepStats = new Map<
    string,
    {
      totalExecutions: number;
      completed: number;
      failed: number;
      skipped: number;
      totalDurationMs: number;
      durationCount: number;
    }
  >();

  for (const log of logs) {
    if (!log.stepKey) {
      continue;
    }

    let stats = stepStats.get(log.stepKey);
    if (!stats) {
      stats = {
        totalExecutions: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        totalDurationMs: 0,
        durationCount: 0,
      };
      stepStats.set(log.stepKey, stats);
    }

    stats.totalExecutions++;
    if (log.stepStatus === StepStatus.COMPLETED) {
      stats.completed++;
    } else if (log.stepStatus === StepStatus.FAILED) {
      stats.failed++;
    } else if (log.stepStatus === StepStatus.SKIPPED) {
      stats.skipped++;
    }

    if (log.stepDurationMs !== null) {
      stats.totalDurationMs += log.stepDurationMs;
      stats.durationCount++;
    }
  }

  // Transform to final format
  const result = new Map<
    string,
    {
      totalExecutions: number;
      completed: number;
      failed: number;
      skipped: number;
      avgDurationMs: number;
      successRate: number;
    }
  >();

  for (const [stepKey, stats] of stepStats) {
    result.set(stepKey, {
      totalExecutions: stats.totalExecutions,
      completed: stats.completed,
      failed: stats.failed,
      skipped: stats.skipped,
      avgDurationMs:
        stats.durationCount > 0 ? Math.round(stats.totalDurationMs / stats.durationCount) : 0,
      successRate: calculateSuccessRate(stats.totalExecutions, stats.completed),
    });
  }

  return result;
};

/**
 * Record step duration for real-time tracking
 *
 * Lightweight function for recording step durations during execution.
 *
 * @param entries - Array of step duration entries
 * @returns Calculated stats for the recorded entries
 */
export const recordStepDurations = (
  entries: StepDurationEntry[],
): {
  totalDurationMs: number;
  avgDurationMs: number;
  completed: number;
  failed: number;
} => {
  if (entries.length === 0) {
    return { totalDurationMs: 0, avgDurationMs: 0, completed: 0, failed: 0 };
  }

  let totalDurationMs = 0;
  let completed = 0;
  let failed = 0;

  for (const entry of entries) {
    totalDurationMs += entry.durationMs;
    if (entry.status === StepStatus.COMPLETED) {
      completed++;
    } else if (entry.status === StepStatus.FAILED) {
      failed++;
    }
  }

  return {
    totalDurationMs,
    avgDurationMs: Math.round(totalDurationMs / entries.length),
    completed,
    failed,
  };
};

export default {
  calculatePercentiles,
  collectExecutionMetrics,
  calculateStepDurationPercentiles,
  calculateWorkflowPercentiles,
  updateWorkflowMetrics,
  updateAgentMetrics,
  getWorkflowExecutionStats,
  getStepExecutionStats,
  recordStepDurations,
};
