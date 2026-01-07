/**
 * Execution Factory
 *
 * Factory for creating test execution data and database records.
 * Supports both raw data generation and database persistence.
 *
 * Usage:
 * ```typescript
 * // Generate raw data (no database)
 * const executionData = executionFactory.build({
 *   workflowId: workflow.id,
 *   userId: user.id
 * });
 *
 * // Create in database (requires existing workflow and user)
 * const execution = await executionFactory.create({
 *   workflowId: workflow.id,
 *   userId: user.id
 * });
 * ```
 *
 * @module __tests__/factories/execution.factory
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Execution,
  ExecutionStatus,
  TriggerType,
  ExecutionLog,
  LogLevel,
  StepStatus,
  User,
  Workflow,
  Prisma,
} from '@prisma/client';
import { getTestPrisma } from '../integration/setup';
import { workflowFactory } from './workflow.factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for building execution data
 */
export interface ExecutionFactoryInput {
  id?: string;
  workflowId?: string;
  userId?: string;
  status?: ExecutionStatus;
  triggerType?: TriggerType;
  triggerData?: Prisma.InputJsonValue;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  inputData?: Prisma.InputJsonValue;
  outputData?: Prisma.InputJsonValue;
  stepsCompleted?: number;
  stepsFailed?: number;
  stepsTotal?: number;
  errorMessage?: string | null;
  errorStack?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Input for building execution log data
 */
export interface ExecutionLogFactoryInput {
  id?: string;
  executionId?: string;
  workflowStepId?: string | null;
  level?: LogLevel;
  message?: string;
  metadata?: Prisma.InputJsonValue;
  stepKey?: string | null;
  stepStatus?: StepStatus | null;
  stepStartedAt?: Date | null;
  stepCompletedAt?: Date | null;
  stepDurationMs?: number | null;
  createdAt?: Date;
}

/**
 * Raw execution data without database-generated fields
 */
export interface ExecutionBuildData {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  triggerData: Prisma.InputJsonValue;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  inputData: Prisma.InputJsonValue;
  outputData: Prisma.InputJsonValue;
  stepsCompleted: number;
  stepsFailed: number;
  stepsTotal: number;
  errorMessage: string | null;
  errorStack: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution with its workflow and user
 */
export interface ExecutionWithDependencies {
  execution: Execution;
  workflow: Workflow;
  user: User;
}

// ============================================================================
// Helpers
// ============================================================================

let executionCounter = 0;

/**
 * Generate unique execution data
 */
const incrementCounter = (): number => {
  executionCounter += 1;
  return executionCounter;
};

// ============================================================================
// Execution Factory
// ============================================================================

/**
 * Execution Factory
 *
 * Provides methods to build and create execution test data
 */
export const executionFactory = {
  /**
   * Build execution data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Execution data object
   *
   * Usage:
   * ```typescript
   * const executionData = executionFactory.build({
   *   workflowId: workflow.id,
   *   userId: user.id
   * });
   * ```
   */
  build: (overrides: ExecutionFactoryInput = {}): ExecutionBuildData => {
    const now = new Date();
    incrementCounter();

    return {
      id: overrides.id ?? uuidv4(),
      workflowId: overrides.workflowId ?? uuidv4(),
      userId: overrides.userId ?? uuidv4(),
      status: overrides.status ?? ExecutionStatus.PENDING,
      triggerType: overrides.triggerType ?? TriggerType.MANUAL,
      triggerData: overrides.triggerData ?? {},
      startedAt: overrides.startedAt ?? null,
      completedAt: overrides.completedAt ?? null,
      durationMs: overrides.durationMs ?? null,
      inputData: overrides.inputData ?? {},
      outputData: overrides.outputData ?? {},
      stepsCompleted: overrides.stepsCompleted ?? 0,
      stepsFailed: overrides.stepsFailed ?? 0,
      stepsTotal: overrides.stepsTotal ?? 0,
      errorMessage: overrides.errorMessage ?? null,
      errorStack: overrides.errorStack ?? null,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    };
  },

  /**
   * Create execution in database
   *
   * @param overrides - Optional field overrides (must include workflowId and userId)
   * @returns Promise resolving to created execution
   * @throws Error if database is not available or required fields are missing
   *
   * Usage:
   * ```typescript
   * const execution = await executionFactory.create({
   *   workflowId: workflow.id,
   *   userId: user.id
   * });
   * ```
   */
  create: async (overrides: ExecutionFactoryInput): Promise<Execution> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create execution.');
    }

    if (!overrides.workflowId || !overrides.userId) {
      throw new Error('workflowId and userId are required to create an execution.');
    }

    const data = executionFactory.build(overrides);

    return prisma.execution.create({
      data: {
        id: data.id,
        workflowId: data.workflowId,
        userId: data.userId,
        status: data.status,
        triggerType: data.triggerType,
        triggerData: data.triggerData,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        durationMs: data.durationMs,
        inputData: data.inputData,
        outputData: data.outputData,
        stepsCompleted: data.stepsCompleted,
        stepsFailed: data.stepsFailed,
        stepsTotal: data.stepsTotal,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
      },
    });
  },

  /**
   * Create execution with dependencies (user and workflow)
   *
   * @param overrides - Optional execution field overrides
   * @returns Promise resolving to execution, workflow, and user
   *
   * Usage:
   * ```typescript
   * const { execution, workflow, user } = await executionFactory.createWithDependencies();
   * ```
   */
  createWithDependencies: async (
    overrides: Omit<ExecutionFactoryInput, 'workflowId' | 'userId'> = {},
  ): Promise<ExecutionWithDependencies> => {
    const { workflow, user } = await workflowFactory.createWithUser();
    const execution = await executionFactory.create({
      ...overrides,
      workflowId: workflow.id,
      userId: user.id,
    });

    return { execution, workflow, user };
  },

  /**
   * Create a running execution
   *
   * @param overrides - Optional field overrides (must include workflowId and userId)
   * @returns Promise resolving to created running execution
   *
   * Usage:
   * ```typescript
   * const runningExecution = await executionFactory.createRunning({
   *   workflowId: workflow.id,
   *   userId: user.id
   * });
   * ```
   */
  createRunning: async (overrides: ExecutionFactoryInput): Promise<Execution> => {
    return executionFactory.create({
      ...overrides,
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    });
  },

  /**
   * Create a completed execution
   *
   * @param overrides - Optional field overrides (must include workflowId and userId)
   * @returns Promise resolving to created completed execution
   *
   * Usage:
   * ```typescript
   * const completedExecution = await executionFactory.createCompleted({
   *   workflowId: workflow.id,
   *   userId: user.id
   * });
   * ```
   */
  createCompleted: async (overrides: ExecutionFactoryInput): Promise<Execution> => {
    const startedAt = new Date(Date.now() - 5000); // 5 seconds ago
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return executionFactory.create({
      ...overrides,
      status: ExecutionStatus.COMPLETED,
      startedAt,
      completedAt,
      durationMs,
      stepsCompleted: overrides.stepsTotal ?? 3,
      stepsFailed: 0,
      stepsTotal: overrides.stepsTotal ?? 3,
      outputData: { result: 'success' },
    });
  },

  /**
   * Create a failed execution
   *
   * @param overrides - Optional field overrides (must include workflowId and userId)
   * @returns Promise resolving to created failed execution
   *
   * Usage:
   * ```typescript
   * const failedExecution = await executionFactory.createFailed({
   *   workflowId: workflow.id,
   *   userId: user.id
   * });
   * ```
   */
  createFailed: async (overrides: ExecutionFactoryInput): Promise<Execution> => {
    const startedAt = new Date(Date.now() - 2000); // 2 seconds ago
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return executionFactory.create({
      ...overrides,
      status: ExecutionStatus.FAILED,
      startedAt,
      completedAt,
      durationMs,
      stepsCompleted: 1,
      stepsFailed: 1,
      stepsTotal: 3,
      errorMessage: overrides.errorMessage ?? 'Test error: Execution failed',
      errorStack: overrides.errorStack ?? 'Error: Test error\n    at test.ts:1:1',
    });
  },

  /**
   * Create multiple executions for a workflow
   *
   * @param workflowId - Parent workflow ID
   * @param userId - User ID
   * @param count - Number of executions to create
   * @param overrides - Optional field overrides (applied to all executions)
   * @returns Promise resolving to array of created executions
   *
   * Usage:
   * ```typescript
   * const executions = await executionFactory.createMany(
   *   workflow.id,
   *   user.id,
   *   5
   * );
   * ```
   */
  createMany: async (
    workflowId: string,
    userId: string,
    count: number,
    overrides: Omit<ExecutionFactoryInput, 'workflowId' | 'userId'> = {},
  ): Promise<Execution[]> => {
    const executions: Execution[] = [];

    for (let i = 0; i < count; i++) {
      const execution = await executionFactory.create({
        ...overrides,
        workflowId,
        userId,
      });
      executions.push(execution);
    }

    return executions;
  },

  /**
   * Create execution history for a workflow (mix of statuses)
   *
   * @param workflowId - Parent workflow ID
   * @param userId - User ID
   * @returns Promise resolving to array of executions with different statuses
   *
   * Usage:
   * ```typescript
   * const history = await executionFactory.createHistory(workflow.id, user.id);
   * ```
   */
  createHistory: async (workflowId: string, userId: string): Promise<Execution[]> => {
    const executions: Execution[] = [];

    // Create completed executions
    for (let i = 0; i < 3; i++) {
      executions.push(await executionFactory.createCompleted({ workflowId, userId }));
    }

    // Create failed execution
    executions.push(await executionFactory.createFailed({ workflowId, userId }));

    // Create running execution
    executions.push(await executionFactory.createRunning({ workflowId, userId }));

    // Create pending execution
    executions.push(await executionFactory.create({ workflowId, userId }));

    return executions;
  },
};

// ============================================================================
// Execution Log Factory
// ============================================================================

/**
 * Execution Log Factory
 *
 * Provides methods to build and create execution log test data
 */
export const executionLogFactory = {
  /**
   * Build execution log data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Execution log data object
   *
   * Usage:
   * ```typescript
   * const logData = executionLogFactory.build({
   *   executionId: execution.id
   * });
   * ```
   */
  build: (overrides: ExecutionLogFactoryInput = {}): ExecutionLogFactoryInput => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      executionId: overrides.executionId ?? uuidv4(),
      workflowStepId: overrides.workflowStepId ?? null,
      level: overrides.level ?? LogLevel.INFO,
      message: overrides.message ?? 'Test log message',
      metadata: overrides.metadata ?? {},
      stepKey: overrides.stepKey ?? null,
      stepStatus: overrides.stepStatus ?? null,
      stepStartedAt: overrides.stepStartedAt ?? null,
      stepCompletedAt: overrides.stepCompletedAt ?? null,
      stepDurationMs: overrides.stepDurationMs ?? null,
      createdAt: overrides.createdAt ?? now,
    };
  },

  /**
   * Create execution log in database
   *
   * @param overrides - Optional field overrides (must include executionId)
   * @returns Promise resolving to created execution log
   * @throws Error if database is not available or executionId is missing
   *
   * Usage:
   * ```typescript
   * const log = await executionLogFactory.create({
   *   executionId: execution.id,
   *   message: 'Step completed'
   * });
   * ```
   */
  create: async (overrides: ExecutionLogFactoryInput): Promise<ExecutionLog> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create execution log.');
    }

    if (!overrides.executionId) {
      throw new Error('executionId is required to create an execution log.');
    }

    const data = executionLogFactory.build(overrides);

    return prisma.executionLog.create({
      data: {
        id: data.id,
        executionId: data.executionId!,
        workflowStepId: data.workflowStepId,
        level: data.level!,
        message: data.message!,
        metadata: data.metadata,
        stepKey: data.stepKey,
        stepStatus: data.stepStatus,
        stepStartedAt: data.stepStartedAt,
        stepCompletedAt: data.stepCompletedAt,
        stepDurationMs: data.stepDurationMs,
      },
    });
  },

  /**
   * Create multiple logs for an execution
   *
   * @param executionId - Parent execution ID
   * @param count - Number of logs to create
   * @param overrides - Optional field overrides (applied to all logs)
   * @returns Promise resolving to array of created logs
   *
   * Usage:
   * ```typescript
   * const logs = await executionLogFactory.createMany(execution.id, 5);
   * ```
   */
  createMany: async (
    executionId: string,
    count: number,
    overrides: Omit<ExecutionLogFactoryInput, 'executionId'> = {},
  ): Promise<ExecutionLog[]> => {
    const logs: ExecutionLog[] = [];

    for (let i = 0; i < count; i++) {
      const log = await executionLogFactory.create({
        ...overrides,
        executionId,
        message: `Log message ${i + 1}`,
      });
      logs.push(log);
    }

    return logs;
  },

  /**
   * Create a set of logs simulating a step execution
   *
   * @param executionId - Parent execution ID
   * @param stepKey - Step key
   * @param workflowStepId - Optional workflow step ID
   * @returns Promise resolving to array of step logs
   *
   * Usage:
   * ```typescript
   * const stepLogs = await executionLogFactory.createStepLogs(
   *   execution.id,
   *   'step_1'
   * );
   * ```
   */
  createStepLogs: async (
    executionId: string,
    stepKey: string,
    workflowStepId?: string,
  ): Promise<ExecutionLog[]> => {
    const logs: ExecutionLog[] = [];
    const startTime = new Date(Date.now() - 1000);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    // Start log
    logs.push(
      await executionLogFactory.create({
        executionId,
        workflowStepId,
        level: LogLevel.INFO,
        message: `Starting step: ${stepKey}`,
        stepKey,
        stepStatus: StepStatus.RUNNING,
        stepStartedAt: startTime,
      }),
    );

    // Progress log
    logs.push(
      await executionLogFactory.create({
        executionId,
        workflowStepId,
        level: LogLevel.DEBUG,
        message: `Processing step: ${stepKey}`,
        stepKey,
        stepStatus: StepStatus.RUNNING,
      }),
    );

    // Completion log
    logs.push(
      await executionLogFactory.create({
        executionId,
        workflowStepId,
        level: LogLevel.INFO,
        message: `Completed step: ${stepKey}`,
        stepKey,
        stepStatus: StepStatus.COMPLETED,
        stepCompletedAt: endTime,
        stepDurationMs: durationMs,
      }),
    );

    return logs;
  },
};

// ============================================================================
// Reset Counters
// ============================================================================

/**
 * Reset the execution counter
 * Call this in beforeEach to ensure consistent test data
 */
export const resetExecutionCounter = (): void => {
  executionCounter = 0;
};

// Re-export enums for convenience
export { ExecutionStatus, TriggerType, LogLevel, StepStatus };
