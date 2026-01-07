/**
 * Analytics Service
 *
 * This service handles all analytics-related operations including
 * overview metrics, agent performance, workflow performance, and system health.
 *
 * Features:
 * - Aggregate metrics calculation (counts, rates)
 * - Performance percentile calculations (p50, p95, p99)
 * - Time period grouping (hour/day/week/month)
 * - Success/failure rate calculations
 * - System health monitoring
 *
 * @module services/analytics.service
 */

import { ExecutionStatus, StepStatus } from '@prisma/client';
import { prisma, isPrismaAvailable, getPoolHealthSummary } from '../lib/prisma';
import { checkRedisHealth } from '../lib/redis';
import { getDatabaseHealth } from '../utils/dbHealthCheck';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Time period for grouping metrics
 */
export type TimePeriod = 'hour' | 'day' | 'week' | 'month';

/**
 * Overview metrics response
 */
export interface OverviewMetrics {
  /** Total counts */
  totals: {
    agents: number;
    workflows: number;
    executions: number;
    deployments: number;
    templates: number;
  };
  /** Execution statistics */
  executions: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    running: number;
    cancelled: number;
    successRate: number;
    failureRate: number;
    avgExecutionTimeMs: number;
  };
  /** Time range for metrics */
  period: {
    from: string;
    to: string;
  };
}

/**
 * Performance percentiles
 */
export interface PerformancePercentiles {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
}

/**
 * Agent metrics response
 */
export interface AgentMetrics {
  agentId: string;
  agentName: string;
  /** Performance metrics */
  performance: PerformancePercentiles;
  /** Reliability metrics */
  reliability: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    failureRate: number;
  };
  /** Time series data grouped by period */
  timeSeries: TimeSeriesDataPoint[];
  /** Time range for metrics */
  period: {
    from: string;
    to: string;
    groupBy: TimePeriod;
  };
}

/**
 * Workflow metrics response
 */
export interface WorkflowMetrics {
  workflowId: string;
  workflowName: string;
  /** Performance metrics */
  performance: PerformancePercentiles;
  /** Reliability metrics */
  reliability: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    failureRate: number;
  };
  /** Step-level metrics */
  steps: StepMetrics[];
  /** Time series data grouped by period */
  timeSeries: TimeSeriesDataPoint[];
  /** Time range for metrics */
  period: {
    from: string;
    to: string;
    groupBy: TimePeriod;
  };
}

/**
 * Step-level metrics
 */
export interface StepMetrics {
  stepKey: string;
  stepName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  avgExecutionTimeMs: number;
  successRate: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  count: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
}

/**
 * System health response
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Individual service health */
  services: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      responseTimeMs: number;
      details?: {
        successRate: number;
        avgQueryTimeMs: number;
        slowQueryRate: number;
        totalQueries: number;
      };
      error?: string;
    };
    redis: {
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      responseTimeMs?: number;
      details?: {
        version?: string;
        connectedClients?: number;
        usedMemory?: string;
      };
      error?: string;
    };
    queue: {
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      details?: {
        activeJobs?: number;
        waitingJobs?: number;
        completedJobs?: number;
        failedJobs?: number;
      };
      error?: string;
    };
  };
  /** API metrics */
  api: {
    requestsPerMinute?: number;
    avgResponseTimeMs?: number;
    errorRate?: number;
  };
  /** Check timestamp */
  checkedAt: string;
}

/**
 * Query parameters for metrics endpoints
 */
export interface MetricsQueryParams {
  /** Start date for metrics range */
  from?: Date;
  /** End date for metrics range */
  to?: Date;
  /** Time period for grouping */
  groupBy?: TimePeriod;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default time range: last 30 days
 */
const DEFAULT_DAYS_RANGE = 30;

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
 * Get default date range (last N days)
 */
const getDefaultDateRange = (days: number = DEFAULT_DAYS_RANGE): { from: Date; to: Date } => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
};

/**
 * Calculate percentiles from an array of numbers
 * Uses simple linear interpolation for percentile estimation
 */
const calculatePercentiles = (values: number[]): PerformancePercentiles => {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate percentile indices
  const getPercentile = (p: number): number => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) {
      return sorted[lower] ?? 0;
    }
    // Linear interpolation
    const fraction = index - lower;
    return (sorted[lower] ?? 0) * (1 - fraction) + (sorted[upper] ?? 0) * fraction;
  };

  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    p50: Math.round(getPercentile(50)),
    p95: Math.round(getPercentile(95)),
    p99: Math.round(getPercentile(99)),
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
    avg: Math.round(sum / n),
  };
};

/**
 * Calculate success and failure rates
 */
const calculateRates = (
  total: number,
  successful: number,
  failed: number,
): { successRate: number; failureRate: number } => {
  if (total === 0) {
    return { successRate: 0, failureRate: 0 };
  }
  return {
    successRate: Math.round((successful / total) * 10000) / 100,
    failureRate: Math.round((failed / total) * 10000) / 100,
  };
};

/**
 * Group executions by time period for time series
 */
const groupByTimePeriod = (
  executions: Array<{ createdAt: Date; status: string; durationMs: number | null }>,
  period: TimePeriod,
): TimeSeriesDataPoint[] => {
  const groups = new Map<string, TimeSeriesDataPoint>();

  for (const exec of executions) {
    const date = new Date(exec.createdAt);
    let key: string;

    switch (period) {
      case 'hour':
        date.setMinutes(0, 0, 0);
        key = date.toISOString();
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        key = date.toISOString();
        break;
      case 'week': {
        // Start of week (Sunday)
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        key = date.toISOString();
        break;
      }
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        key = date.toISOString();
        break;
    }

    let point = groups.get(key);
    if (!point) {
      point = {
        timestamp: key,
        count: 0,
        successCount: 0,
        failureCount: 0,
        avgDurationMs: 0,
      };
      groups.set(key, point);
    }

    point.count++;
    if (exec.status === 'COMPLETED') {
      point.successCount++;
    } else if (exec.status === 'FAILED' || exec.status === 'TIMEOUT') {
      point.failureCount++;
    }

    // Update average duration
    if (exec.durationMs !== null) {
      const prevTotal = point.avgDurationMs * (point.count - 1);
      point.avgDurationMs = Math.round((prevTotal + exec.durationMs) / point.count);
    }
  }

  // Sort by timestamp
  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get overview analytics metrics
 *
 * @param userId - ID of the authenticated user
 * @param params - Query parameters
 * @returns Overview metrics
 */
export const getOverviewMetrics = async (
  userId: string,
  params: MetricsQueryParams = {},
): Promise<OverviewMetrics> => {
  ensureDatabase();

  const dateRange =
    params.from && params.to ? { from: params.from, to: params.to } : getDefaultDateRange();
  const from = dateRange.from;
  const to = dateRange.to;

  // Execute all count queries in parallel
  const [agentsCount, workflowsCount, deploymentsCount, templatesCount, executionsData] =
    await Promise.all([
      // Total agents (excluding soft-deleted)
      prisma!.agent.count({
        where: { userId, deletedAt: null },
      }),
      // Total workflows (excluding soft-deleted)
      prisma!.workflow.count({
        where: { userId, deletedAt: null },
      }),
      // Total deployments (excluding soft-deleted)
      prisma!.deployment.count({
        where: { userId, deletedAt: null },
      }),
      // Total templates owned by user
      prisma!.template.count({
        where: { userId },
      }),
      // Execution statistics within date range
      prisma!.execution.groupBy({
        by: ['status'],
        where: {
          userId,
          createdAt: { gte: from, lte: to },
        },
        _count: { id: true },
      }),
    ]);

  // Get average execution time for completed executions
  const avgDurationResult = await prisma!.execution.aggregate({
    where: {
      userId,
      status: ExecutionStatus.COMPLETED,
      createdAt: { gte: from, lte: to },
      durationMs: { not: null },
    },
    _avg: { durationMs: true },
  });

  // Process execution stats
  const executionCounts: Record<string, number> = {};
  let totalExecutions = 0;

  for (const group of executionsData) {
    executionCounts[group.status] = group._count.id;
    totalExecutions += group._count.id;
  }

  const completed = executionCounts[ExecutionStatus.COMPLETED] || 0;
  const failed =
    (executionCounts[ExecutionStatus.FAILED] || 0) +
    (executionCounts[ExecutionStatus.TIMEOUT] || 0);
  const pending = executionCounts[ExecutionStatus.PENDING] || 0;
  const running = executionCounts[ExecutionStatus.RUNNING] || 0;
  const cancelled = executionCounts[ExecutionStatus.CANCELLED] || 0;

  const rates = calculateRates(totalExecutions, completed, failed);

  const overview: OverviewMetrics = {
    totals: {
      agents: agentsCount,
      workflows: workflowsCount,
      executions: totalExecutions,
      deployments: deploymentsCount,
      templates: templatesCount,
    },
    executions: {
      total: totalExecutions,
      completed,
      failed,
      pending,
      running,
      cancelled,
      successRate: rates.successRate,
      failureRate: rates.failureRate,
      avgExecutionTimeMs: Math.round(avgDurationResult._avg.durationMs || 0),
    },
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
  };

  logger.debug('[Analytics Service] Generated overview metrics:', {
    userId,
    totalAgents: agentsCount,
    totalWorkflows: workflowsCount,
    totalExecutions,
  });

  return overview;
};

/**
 * Get agent performance metrics
 *
 * @param agentId - Agent ID
 * @param userId - ID of the authenticated user
 * @param params - Query parameters
 * @param isAdmin - Whether the user is an admin
 * @returns Agent metrics
 */
export const getAgentMetrics = async (
  agentId: string,
  userId: string,
  params: MetricsQueryParams = {},
  isAdmin: boolean = false,
): Promise<AgentMetrics> => {
  ensureDatabase();

  // Verify agent exists and user has access
  const agent = await prisma!.agent.findFirst({
    where: {
      id: agentId,
      deletedAt: null,
      ...(isAdmin ? {} : { userId }),
    },
    select: { id: true, name: true, userId: true },
  });

  if (!agent) {
    throw ApiError.notFound('Agent not found');
  }

  const dateRange =
    params.from && params.to ? { from: params.from, to: params.to } : getDefaultDateRange();
  const from = dateRange.from;
  const to = dateRange.to;
  const groupBy = params.groupBy || 'day';

  // Get execution logs for this agent via workflow steps
  // First, find all workflow steps that use this agent
  const stepsWithAgent = await prisma!.workflowStep.findMany({
    where: { agentId },
    select: { id: true },
  });

  const stepIds = stepsWithAgent.map((s) => s.id);

  // Get execution logs for these steps
  // ExecutionLog uses stepStatus and stepDurationMs fields
  const executionLogs = await prisma!.executionLog.findMany({
    where: {
      workflowStepId: { in: stepIds },
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      stepStatus: true,
      stepDurationMs: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Calculate performance percentiles from durations
  const durations = executionLogs
    .filter((log) => log.stepDurationMs !== null)
    .map((log) => log.stepDurationMs!);

  const performance = calculatePercentiles(durations);

  // Calculate reliability metrics
  const totalExecutions = executionLogs.length;
  const successfulExecutions = executionLogs.filter(
    (log) => log.stepStatus === StepStatus.COMPLETED,
  ).length;
  const failedExecutions = executionLogs.filter(
    (log) => log.stepStatus === StepStatus.FAILED,
  ).length;

  const rates = calculateRates(totalExecutions, successfulExecutions, failedExecutions);

  // Generate time series
  const timeSeries = groupByTimePeriod(
    executionLogs.map((log) => ({
      createdAt: log.createdAt,
      status: log.stepStatus || 'UNKNOWN',
      durationMs: log.stepDurationMs,
    })),
    groupBy,
  );

  const metrics: AgentMetrics = {
    agentId,
    agentName: agent.name,
    performance,
    reliability: {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: rates.successRate,
      failureRate: rates.failureRate,
    },
    timeSeries,
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      groupBy,
    },
  };

  logger.debug('[Analytics Service] Generated agent metrics:', {
    agentId,
    userId,
    totalExecutions,
    successRate: rates.successRate,
  });

  return metrics;
};

/**
 * Get workflow performance metrics
 *
 * @param workflowId - Workflow ID
 * @param userId - ID of the authenticated user
 * @param params - Query parameters
 * @param isAdmin - Whether the user is an admin
 * @returns Workflow metrics
 */
export const getWorkflowMetrics = async (
  workflowId: string,
  userId: string,
  params: MetricsQueryParams = {},
  isAdmin: boolean = false,
): Promise<WorkflowMetrics> => {
  ensureDatabase();

  // Verify workflow exists and user has access
  const workflow = await prisma!.workflow.findFirst({
    where: {
      id: workflowId,
      deletedAt: null,
      ...(isAdmin ? {} : { userId }),
    },
    select: { id: true, name: true, userId: true },
    // Include steps for step-level metrics
  });

  if (!workflow) {
    throw ApiError.notFound('Workflow not found');
  }

  const dateRange =
    params.from && params.to ? { from: params.from, to: params.to } : getDefaultDateRange();
  const from = dateRange.from;
  const to = dateRange.to;
  const groupBy = params.groupBy || 'day';

  // Get all executions for this workflow within date range
  const executions = await prisma!.execution.findMany({
    where: {
      workflowId,
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      status: true,
      durationMs: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Calculate performance percentiles from durations
  const durations = executions
    .filter((exec) => exec.durationMs !== null)
    .map((exec) => exec.durationMs!);

  const performance = calculatePercentiles(durations);

  // Calculate reliability metrics
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(
    (exec) => exec.status === ExecutionStatus.COMPLETED,
  ).length;
  const failedExecutions = executions.filter(
    (exec) => exec.status === ExecutionStatus.FAILED || exec.status === ExecutionStatus.TIMEOUT,
  ).length;

  const rates = calculateRates(totalExecutions, successfulExecutions, failedExecutions);

  // Get step-level metrics
  const workflowSteps = await prisma!.workflowStep.findMany({
    where: { workflowId },
    select: { id: true, stepKey: true, stepName: true },
  });

  const executionIds = executions.map((e) => e.id);

  const stepMetrics: StepMetrics[] = [];

  for (const step of workflowSteps) {
    const stepLogs = await prisma!.executionLog.findMany({
      where: {
        executionId: { in: executionIds },
        workflowStepId: step.id,
      },
      select: {
        stepStatus: true,
        stepDurationMs: true,
      },
    });

    const stepTotal = stepLogs.length;
    const stepSuccess = stepLogs.filter((log) => log.stepStatus === StepStatus.COMPLETED).length;
    const stepFailed = stepLogs.filter((log) => log.stepStatus === StepStatus.FAILED).length;
    const stepSkipped = stepLogs.filter((log) => log.stepStatus === StepStatus.SKIPPED).length;

    const stepDurations = stepLogs
      .filter((log) => log.stepDurationMs !== null)
      .map((log) => log.stepDurationMs!);

    const avgStepDuration =
      stepDurations.length > 0
        ? Math.round(stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length)
        : 0;

    stepMetrics.push({
      stepKey: step.stepKey,
      stepName: step.stepName,
      totalExecutions: stepTotal,
      successfulExecutions: stepSuccess,
      failedExecutions: stepFailed,
      skippedExecutions: stepSkipped,
      avgExecutionTimeMs: avgStepDuration,
      successRate: stepTotal > 0 ? Math.round((stepSuccess / stepTotal) * 10000) / 100 : 0,
    });
  }

  // Generate time series
  const timeSeries = groupByTimePeriod(
    executions.map((exec) => ({
      createdAt: exec.createdAt,
      status: exec.status,
      durationMs: exec.durationMs,
    })),
    groupBy,
  );

  const metrics: WorkflowMetrics = {
    workflowId,
    workflowName: workflow.name,
    performance,
    reliability: {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: rates.successRate,
      failureRate: rates.failureRate,
    },
    steps: stepMetrics,
    timeSeries,
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      groupBy,
    },
  };

  logger.debug('[Analytics Service] Generated workflow metrics:', {
    workflowId,
    userId,
    totalExecutions,
    successRate: rates.successRate,
    stepsCount: stepMetrics.length,
  });

  return metrics;
};

/**
 * Get system health status
 *
 * Requires admin role to access.
 *
 * @returns System health status
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const checkedAt = new Date().toISOString();

  // Check database health
  const dbHealth = await getDatabaseHealth();
  const poolHealth = getPoolHealthSummary();

  // Check Redis health
  const redisHealth = await checkRedisHealth();

  // Determine database status
  let dbStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';
  if (!dbHealth.configured) {
    dbStatus = 'unknown';
  } else if (!dbHealth.connection.healthy) {
    dbStatus = 'unhealthy';
  } else if (!poolHealth.isHealthy) {
    dbStatus = 'degraded';
  } else {
    dbStatus = 'healthy';
  }

  // Determine Redis status
  let redisStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';
  if (!redisHealth.configured) {
    redisStatus = 'unknown';
  } else if (!redisHealth.connected) {
    redisStatus = 'unhealthy';
  } else {
    redisStatus = 'healthy';
  }

  // Queue health - stub for now (BullMQ integration in Task 18)
  const queueStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'unknown';

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  const statuses = [dbStatus, redisStatus];

  if (statuses.some((s) => s === 'unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.some((s) => s === 'degraded' || s === 'unknown')) {
    overallStatus = 'degraded';
  }

  const health: SystemHealth = {
    status: overallStatus,
    services: {
      database: {
        status: dbStatus,
        responseTimeMs: dbHealth.connection.responseTimeMs,
        details: {
          successRate: poolHealth.successRate,
          avgQueryTimeMs: poolHealth.avgQueryTimeMs,
          slowQueryRate: poolHealth.slowQueryRate,
          totalQueries: poolHealth.totalQueries,
        },
        ...(dbHealth.connection.error && { error: dbHealth.connection.error }),
      },
      redis: {
        status: redisStatus,
        responseTimeMs: redisHealth.responseTimeMs,
        details: redisHealth.info
          ? {
              version: redisHealth.info.version,
              connectedClients: redisHealth.info.connectedClients,
              usedMemory: redisHealth.info.usedMemory,
            }
          : undefined,
        ...(redisHealth.error && { error: redisHealth.error }),
      },
      queue: {
        status: queueStatus,
        details: {
          activeJobs: 0,
          waitingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
        },
        error: 'Queue monitoring not yet implemented (BullMQ integration pending)',
      },
    },
    api: {
      // API metrics would typically come from a metrics collection system
      // For now, we use stub values
      requestsPerMinute: undefined,
      avgResponseTimeMs: undefined,
      errorRate: undefined,
    },
    checkedAt,
  };

  logger.debug('[Analytics Service] Generated system health:', {
    status: overallStatus,
    dbStatus,
    redisStatus,
    queueStatus,
  });

  return health;
};

export default {
  getOverviewMetrics,
  getAgentMetrics,
  getWorkflowMetrics,
  getSystemHealth,
};
