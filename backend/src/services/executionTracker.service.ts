/**
 * Execution Status Tracker Service
 *
 * This service provides real-time execution status tracking for workflow
 * executions. It maintains an in-memory cache of execution status and
 * periodically updates the database to reflect current state.
 *
 * Features:
 * - Real-time step completion tracking
 * - Progress percentage calculation
 * - Intermediate results storage
 * - Status update batching for performance
 * - Event emission for status changes
 *
 * @module services/executionTracker.service
 */

import { ExecutionStatus, StepStatus, Prisma } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';
import { EventEmitter } from 'events';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Step execution state
 */
export interface StepExecutionState {
  stepKey: string;
  stepName: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  output?: unknown;
  error?: string;
  retryCount: number;
}

/**
 * Execution state snapshot
 */
export interface ExecutionStateSnapshot {
  executionId: string;
  workflowId: string;
  status: ExecutionStatus;
  progress: number;
  stepsTotal: number;
  stepsCompleted: number;
  stepsFailed: number;
  stepsSkipped: number;
  stepsRunning: number;
  stepsPending: number;
  currentStep?: string;
  steps: Map<string, StepExecutionState>;
  startedAt?: Date;
  lastUpdatedAt: Date;
  intermediateResults: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Status update event
 */
export interface StatusUpdateEvent {
  executionId: string;
  previousStatus: ExecutionStatus;
  currentStatus: ExecutionStatus;
  progress: number;
  currentStep?: string;
  timestamp: Date;
}

/**
 * Step status change event
 */
export interface StepStatusChangeEvent {
  executionId: string;
  stepKey: string;
  previousStatus: StepStatus;
  currentStatus: StepStatus;
  durationMs?: number;
  timestamp: Date;
}

/**
 * Tracker configuration options
 */
export interface ExecutionTrackerOptions {
  /** Interval for database updates in milliseconds (default: 5000) */
  dbUpdateIntervalMs?: number;
  /** Whether to store intermediate results (default: true) */
  storeIntermediateResults?: boolean;
  /** Maximum intermediate results size in bytes (default: 100KB) */
  maxIntermediateResultsSize?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default database update interval */
const DEFAULT_DB_UPDATE_INTERVAL_MS = 5000;

/** Default max intermediate results size (100KB) */
const DEFAULT_MAX_INTERMEDIATE_RESULTS_SIZE = 100 * 1024;

// =============================================================================
// EXECUTION TRACKER CLASS
// =============================================================================

/**
 * ExecutionTracker Class
 *
 * Provides real-time tracking of workflow execution status with
 * efficient batched database updates.
 *
 * Usage:
 * ```typescript
 * const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
 *   dbUpdateIntervalMs: 3000,
 * });
 *
 * await tracker.initialize(steps);
 * tracker.startStep('step1');
 * tracker.completeStep('step1', { result: 'success' });
 * await tracker.finalize(ExecutionStatus.COMPLETED);
 * ```
 */
export class ExecutionTracker extends EventEmitter {
  private readonly executionId: string;
  public readonly workflowId: string;
  private readonly options: Required<ExecutionTrackerOptions>;

  private state: ExecutionStateSnapshot;
  private dbUpdateTimer?: ReturnType<typeof setInterval>;
  private isDirty: boolean = false;
  private isFinalized: boolean = false;

  /**
   * Create a new ExecutionTracker
   *
   * @param executionId - Execution ID to track
   * @param workflowId - Workflow ID
   * @param options - Tracker options
   */
  constructor(executionId: string, workflowId: string, options: ExecutionTrackerOptions = {}) {
    super();
    this.executionId = executionId;
    // Store workflowId for state tracking (used in getState)
    this.workflowId = workflowId;
    this.options = {
      dbUpdateIntervalMs: options.dbUpdateIntervalMs ?? DEFAULT_DB_UPDATE_INTERVAL_MS,
      storeIntermediateResults: options.storeIntermediateResults ?? true,
      maxIntermediateResultsSize:
        options.maxIntermediateResultsSize ?? DEFAULT_MAX_INTERMEDIATE_RESULTS_SIZE,
    };

    // Initialize state
    this.state = {
      executionId,
      workflowId,
      status: ExecutionStatus.PENDING,
      progress: 0,
      stepsTotal: 0,
      stepsCompleted: 0,
      stepsFailed: 0,
      stepsSkipped: 0,
      stepsRunning: 0,
      stepsPending: 0,
      steps: new Map(),
      lastUpdatedAt: new Date(),
      intermediateResults: {},
    };
  }

  /**
   * Initialize tracker with workflow steps
   *
   * @param steps - Array of step definitions
   */
  async initialize(steps: Array<{ stepKey: string; stepName: string }>): Promise<void> {
    // Initialize step states
    for (const step of steps) {
      this.state.steps.set(step.stepKey, {
        stepKey: step.stepKey,
        stepName: step.stepName,
        status: StepStatus.PENDING,
        retryCount: 0,
      });
    }

    this.state.stepsTotal = steps.length;
    this.state.stepsPending = steps.length;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    // Start periodic database updates
    this.startDbUpdateTimer();

    logger.debug('[ExecutionTracker] Initialized:', {
      executionId: this.executionId,
      stepsTotal: this.state.stepsTotal,
    });
  }

  /**
   * Start execution tracking
   */
  start(): void {
    const previousStatus = this.state.status;
    this.state.status = ExecutionStatus.RUNNING;
    this.state.startedAt = new Date();
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    this.emitStatusUpdate(previousStatus, ExecutionStatus.RUNNING);
  }

  /**
   * Mark a step as starting
   *
   * @param stepKey - Step key
   */
  startStep(stepKey: string): void {
    const stepState = this.state.steps.get(stepKey);
    if (!stepState) {
      logger.warn('[ExecutionTracker] Unknown step key:', { stepKey });
      return;
    }

    const previousStatus = stepState.status;
    stepState.status = StepStatus.RUNNING;
    stepState.startedAt = new Date();

    // Update counts
    if (previousStatus === StepStatus.PENDING) {
      this.state.stepsPending--;
    }
    this.state.stepsRunning++;
    this.state.currentStep = stepKey;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    this.emitStepStatusChange(stepKey, previousStatus, StepStatus.RUNNING);
    this.updateProgress();
  }

  /**
   * Mark a step as completed
   *
   * @param stepKey - Step key
   * @param output - Step output
   */
  completeStep(stepKey: string, output?: unknown): void {
    const stepState = this.state.steps.get(stepKey);
    if (!stepState) {
      logger.warn('[ExecutionTracker] Unknown step key:', { stepKey });
      return;
    }

    const previousStatus = stepState.status;
    stepState.status = StepStatus.COMPLETED;
    stepState.completedAt = new Date();
    stepState.output = output;

    if (stepState.startedAt) {
      stepState.durationMs = stepState.completedAt.getTime() - stepState.startedAt.getTime();
    }

    // Update counts
    if (previousStatus === StepStatus.RUNNING) {
      this.state.stepsRunning--;
    }
    this.state.stepsCompleted++;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    // Store intermediate result
    if (this.options.storeIntermediateResults && output !== undefined) {
      this.storeIntermediateResult(stepKey, output);
    }

    this.emitStepStatusChange(stepKey, previousStatus, StepStatus.COMPLETED, stepState.durationMs);
    this.updateProgress();
    this.clearCurrentStepIfMatch(stepKey);
  }

  /**
   * Mark a step as failed
   *
   * @param stepKey - Step key
   * @param error - Error message
   */
  failStep(stepKey: string, error: string): void {
    const stepState = this.state.steps.get(stepKey);
    if (!stepState) {
      logger.warn('[ExecutionTracker] Unknown step key:', { stepKey });
      return;
    }

    const previousStatus = stepState.status;
    stepState.status = StepStatus.FAILED;
    stepState.completedAt = new Date();
    stepState.error = error;

    if (stepState.startedAt) {
      stepState.durationMs = stepState.completedAt.getTime() - stepState.startedAt.getTime();
    }

    // Update counts
    if (previousStatus === StepStatus.RUNNING) {
      this.state.stepsRunning--;
    }
    this.state.stepsFailed++;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    this.emitStepStatusChange(stepKey, previousStatus, StepStatus.FAILED, stepState.durationMs);
    this.updateProgress();
    this.clearCurrentStepIfMatch(stepKey);
  }

  /**
   * Mark a step as skipped
   *
   * @param stepKey - Step key
   * @param reason - Skip reason
   */
  skipStep(stepKey: string, reason?: string): void {
    const stepState = this.state.steps.get(stepKey);
    if (!stepState) {
      logger.warn('[ExecutionTracker] Unknown step key:', { stepKey });
      return;
    }

    const previousStatus = stepState.status;
    stepState.status = StepStatus.SKIPPED;
    stepState.completedAt = new Date();
    if (reason) {
      stepState.error = reason;
    }

    // Update counts
    if (previousStatus === StepStatus.PENDING) {
      this.state.stepsPending--;
    } else if (previousStatus === StepStatus.RUNNING) {
      this.state.stepsRunning--;
    }
    this.state.stepsSkipped++;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    this.emitStepStatusChange(stepKey, previousStatus, StepStatus.SKIPPED);
    this.updateProgress();
    this.clearCurrentStepIfMatch(stepKey);
  }

  /**
   * Record a step retry
   *
   * @param stepKey - Step key
   * @param attemptNumber - Current attempt number
   */
  recordRetry(stepKey: string, attemptNumber: number): void {
    const stepState = this.state.steps.get(stepKey);
    if (!stepState) {
      return;
    }

    stepState.retryCount = attemptNumber;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;
  }

  /**
   * Set execution error
   *
   * @param error - Error message
   */
  setError(error: string): void {
    this.state.errorMessage = error;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;
  }

  /**
   * Finalize execution with final status
   *
   * @param status - Final execution status
   * @param outputData - Final output data
   */
  async finalize(status: ExecutionStatus, outputData?: Record<string, unknown>): Promise<void> {
    if (this.isFinalized) {
      return;
    }

    this.isFinalized = true;
    this.stopDbUpdateTimer();

    const previousStatus = this.state.status;
    this.state.status = status;
    this.state.lastUpdatedAt = new Date();
    this.isDirty = true;

    // Final database update
    await this.flushToDatabase(outputData);

    this.emitStatusUpdate(previousStatus, status);

    logger.debug('[ExecutionTracker] Finalized:', {
      executionId: this.executionId,
      status,
      stepsCompleted: this.state.stepsCompleted,
      stepsFailed: this.state.stepsFailed,
    });
  }

  /**
   * Get current state snapshot
   */
  getState(): ExecutionStateSnapshot {
    return { ...this.state };
  }

  /**
   * Get progress percentage (0-100)
   */
  getProgress(): number {
    return this.state.progress;
  }

  /**
   * Get current step being executed
   */
  getCurrentStep(): string | undefined {
    return this.state.currentStep;
  }

  /**
   * Get step state by key
   */
  getStepState(stepKey: string): StepExecutionState | undefined {
    return this.state.steps.get(stepKey);
  }

  /**
   * Check if execution is complete
   */
  isComplete(): boolean {
    return (
      this.isFinalized ||
      this.state.status === ExecutionStatus.COMPLETED ||
      this.state.status === ExecutionStatus.FAILED ||
      this.state.status === ExecutionStatus.CANCELLED ||
      this.state.status === ExecutionStatus.TIMEOUT
    );
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Update progress percentage
   */
  private updateProgress(): void {
    if (this.state.stepsTotal === 0) {
      this.state.progress = 0;
      return;
    }

    const completedCount =
      this.state.stepsCompleted + this.state.stepsFailed + this.state.stepsSkipped;
    this.state.progress = Math.round((completedCount / this.state.stepsTotal) * 100);
  }

  /**
   * Clear current step if it matches
   */
  private clearCurrentStepIfMatch(stepKey: string): void {
    if (this.state.currentStep === stepKey) {
      this.state.currentStep = undefined;
    }
  }

  /**
   * Store intermediate result
   */
  private storeIntermediateResult(stepKey: string, output: unknown): void {
    try {
      // Check size limit
      const currentSize = JSON.stringify(this.state.intermediateResults).length;
      const outputSize = JSON.stringify(output).length;

      if (currentSize + outputSize > this.options.maxIntermediateResultsSize) {
        logger.debug('[ExecutionTracker] Skipping intermediate result (size limit):', {
          stepKey,
          currentSize,
          outputSize,
          limit: this.options.maxIntermediateResultsSize,
        });
        return;
      }

      this.state.intermediateResults[stepKey] = output;
    } catch (error) {
      logger.warn('[ExecutionTracker] Failed to store intermediate result:', {
        stepKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Start periodic database updates
   */
  private startDbUpdateTimer(): void {
    if (this.dbUpdateTimer) {
      return;
    }

    this.dbUpdateTimer = setInterval(async () => {
      if (this.isDirty && !this.isFinalized) {
        await this.flushToDatabase();
      }
    }, this.options.dbUpdateIntervalMs);
  }

  /**
   * Stop periodic database updates
   */
  private stopDbUpdateTimer(): void {
    if (this.dbUpdateTimer) {
      clearInterval(this.dbUpdateTimer);
      this.dbUpdateTimer = undefined;
    }
  }

  /**
   * Flush current state to database
   */
  private async flushToDatabase(outputData?: Record<string, unknown>): Promise<void> {
    if (!isPrismaAvailable() || !prisma) {
      logger.warn('[ExecutionTracker] Database not available for flush');
      return;
    }

    try {
      const updateData: Prisma.ExecutionUpdateInput = {
        status: this.state.status,
        stepsCompleted: this.state.stepsCompleted,
        stepsFailed: this.state.stepsFailed,
      };

      if (this.state.startedAt && !this.isFinalized) {
        updateData.startedAt = this.state.startedAt;
      }

      if (this.state.errorMessage) {
        updateData.errorMessage = this.state.errorMessage;
      }

      if (outputData) {
        updateData.outputData = outputData as Prisma.InputJsonValue;
      }

      // If execution is complete, calculate duration
      if (this.isFinalized && this.state.startedAt) {
        updateData.completedAt = new Date();
        updateData.durationMs = updateData.completedAt.getTime() - this.state.startedAt.getTime();
      }

      await prisma.execution.update({
        where: { id: this.executionId },
        data: updateData,
      });

      this.isDirty = false;

      logger.debug('[ExecutionTracker] Flushed to database:', {
        executionId: this.executionId,
        status: this.state.status,
        progress: this.state.progress,
      });
    } catch (error) {
      logger.error('[ExecutionTracker] Failed to flush to database:', {
        executionId: this.executionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Emit status update event
   */
  private emitStatusUpdate(previousStatus: ExecutionStatus, currentStatus: ExecutionStatus): void {
    const event: StatusUpdateEvent = {
      executionId: this.executionId,
      previousStatus,
      currentStatus,
      progress: this.state.progress,
      currentStep: this.state.currentStep,
      timestamp: new Date(),
    };

    this.emit('statusUpdate', event);
  }

  /**
   * Emit step status change event
   */
  private emitStepStatusChange(
    stepKey: string,
    previousStatus: StepStatus,
    currentStatus: StepStatus,
    durationMs?: number,
  ): void {
    const event: StepStatusChangeEvent = {
      executionId: this.executionId,
      stepKey,
      previousStatus,
      currentStatus,
      durationMs,
      timestamp: new Date(),
    };

    this.emit('stepStatusChange', event);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopDbUpdateTimer();
    this.removeAllListeners();
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new ExecutionTracker instance
 *
 * @param executionId - Execution ID
 * @param workflowId - Workflow ID
 * @param options - Tracker options
 * @returns ExecutionTracker instance
 */
export const createExecutionTracker = (
  executionId: string,
  workflowId: string,
  options?: ExecutionTrackerOptions,
): ExecutionTracker => {
  return new ExecutionTracker(executionId, workflowId, options);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get execution status from database
 *
 * @param executionId - Execution ID
 * @returns Execution status or null if not found
 */
export const getExecutionStatus = async (
  executionId: string,
): Promise<{
  status: ExecutionStatus;
  progress: number;
  stepsCompleted: number;
  stepsFailed: number;
  stepsTotal: number;
  currentStep?: string;
} | null> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    select: {
      status: true,
      stepsCompleted: true,
      stepsFailed: true,
      stepsTotal: true,
    },
  });

  if (!execution) {
    return null;
  }

  const completedCount = execution.stepsCompleted + execution.stepsFailed;
  const progress =
    execution.stepsTotal > 0 ? Math.round((completedCount / execution.stepsTotal) * 100) : 0;

  return {
    status: execution.status,
    progress,
    stepsCompleted: execution.stepsCompleted,
    stepsFailed: execution.stepsFailed,
    stepsTotal: execution.stepsTotal,
  };
};

/**
 * Check if an execution is still running
 *
 * @param executionId - Execution ID
 * @returns True if execution is in a running state
 */
export const isExecutionRunning = async (executionId: string): Promise<boolean> => {
  if (!isPrismaAvailable() || !prisma) {
    return false;
  }

  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    select: { status: true },
  });

  if (!execution) {
    return false;
  }

  return (
    execution.status === ExecutionStatus.PENDING || execution.status === ExecutionStatus.RUNNING
  );
};

export default {
  ExecutionTracker,
  createExecutionTracker,
  getExecutionStatus,
  isExecutionRunning,
};
