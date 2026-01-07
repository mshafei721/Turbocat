/**
 * Agent Executor Job Processor
 *
 * This module contains the job processor function for agent executions.
 * It uses the WorkflowExecutor to handle the actual workflow execution.
 *
 * Features:
 * - Workflow execution via WorkflowExecutor
 * - BullMQ job progress tracking
 * - Error handling and retries
 * - Integration with execution logging
 *
 * @module queue/processors/agentExecutor
 */

import { Job } from 'bullmq';
import { PrismaClient, ExecutionStatus } from '@prisma/client';
import { logger } from '../../lib/logger';
import { AgentExecutionJobData, AgentExecutionJobResult, QUEUE_NAMES } from '../index';
import { WorkflowExecutor, createWorkflowExecutor } from '../../engine/WorkflowExecutor';

// Prisma client singleton
const prisma = new PrismaClient();

// Workflow executor instance (lazy initialized)
let workflowExecutor: WorkflowExecutor | null = null;

/**
 * Get or create the WorkflowExecutor instance
 */
const getWorkflowExecutor = (): WorkflowExecutor => {
  if (!workflowExecutor) {
    workflowExecutor = createWorkflowExecutor(prisma);
  }
  return workflowExecutor;
};

/**
 * Processor function for agent execution jobs
 *
 * This is the main entry point for processing agent execution jobs.
 * It delegates the actual workflow execution to the WorkflowExecutor class.
 *
 * The processor:
 * 1. Receives job data from BullMQ
 * 2. Creates a WorkflowExecutor instance
 * 3. Executes the workflow (handles DAG validation, step ordering, etc.)
 * 4. Reports progress to BullMQ
 * 5. Returns the execution result
 *
 * @param job - BullMQ job containing execution data
 * @returns Job result with execution status
 */
export const agentExecutorProcessor = async (
  job: Job<AgentExecutionJobData>,
): Promise<AgentExecutionJobResult> => {
  const { executionId, workflowId, userId, triggerType, input, metadata } = job.data;
  const startTime = Date.now();

  logger.info(`[Processor:${QUEUE_NAMES.AGENT_EXECUTION}] Starting job`, {
    jobId: job.id,
    executionId,
    workflowId,
    userId,
    attempt: job.attemptsMade + 1,
  });

  try {
    // Report initial progress
    await job.updateProgress({
      phase: 'starting',
      executionId,
      workflowId,
    });

    // Get the workflow executor
    const executor = getWorkflowExecutor();

    // Execute the workflow using the existing execution record
    // The execution record was already created by the API endpoint
    const result = await executor.execute(workflowId, userId, {
      triggerType: triggerType as any, // Convert string to TriggerType enum
      inputs: input,
      metadata,
      executionId, // Use existing execution record
    });

    // Report final progress
    await job.updateProgress({
      phase: 'completed',
      executionId,
      workflowId,
      stepsCompleted: result.stepsCompleted,
      stepsFailed: result.stepsFailed,
      stepsSkipped: result.stepsSkipped,
      stepsTotal: result.stepsTotal,
    });

    logger.info(`[Processor:${QUEUE_NAMES.AGENT_EXECUTION}] Job completed`, {
      jobId: job.id,
      executionId,
      status: result.status,
      durationMs: result.durationMs,
      stepsCompleted: result.stepsCompleted,
      stepsFailed: result.stepsFailed,
    });

    return {
      executionId: result.executionId,
      status: result.status === ExecutionStatus.COMPLETED ? 'COMPLETED' : 'FAILED',
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
      stepsCompleted: result.stepsCompleted,
      stepsFailed: result.stepsFailed,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`[Processor:${QUEUE_NAMES.AGENT_EXECUTION}] Job failed`, {
      jobId: job.id,
      executionId,
      error: errorMessage,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      durationMs,
    });

    // Re-throw to let BullMQ handle retries
    throw error;
  }
};

/**
 * Legacy processor function for backward compatibility
 *
 * This function provides the same interface as the previous implementation
 * but delegates to the new WorkflowExecutor-based processor.
 *
 * @deprecated Use agentExecutorProcessor instead
 */
export const legacyAgentExecutorProcessor = agentExecutorProcessor;

export default agentExecutorProcessor;
