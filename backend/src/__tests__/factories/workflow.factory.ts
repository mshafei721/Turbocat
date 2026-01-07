/**
 * Workflow Factory
 *
 * Factory for creating test workflow data and database records.
 * Supports both raw data generation and database persistence.
 *
 * Usage:
 * ```typescript
 * // Generate raw data (no database)
 * const workflowData = workflowFactory.build({ userId: 'user-123' });
 *
 * // Create in database (requires existing user)
 * const workflow = await workflowFactory.create({ userId: user.id });
 *
 * // Create with steps
 * const workflow = await workflowFactory.createWithSteps({ userId: user.id });
 * ```
 *
 * @module __tests__/factories/workflow.factory
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepType,
  ErrorHandling,
  User,
  Agent,
  AgentType,
  AgentStatus,
  Prisma,
} from '@prisma/client';
import { getTestPrisma } from '../integration/setup';
import { userFactory } from './user.factory';
import { agentFactory } from './agent.factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for building workflow data
 */
export interface WorkflowFactoryInput {
  id?: string;
  name?: string;
  description?: string | null;
  userId?: string;
  status?: WorkflowStatus;
  version?: number;
  parentId?: string | null;
  definition?: Prisma.InputJsonValue;
  triggerConfig?: Prisma.InputJsonValue;
  scheduleEnabled?: boolean;
  scheduleCron?: string | null;
  scheduleTimezone?: string;
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  avgExecutionTimeMs?: number;
  lastExecutionAt?: Date | null;
  tags?: string[];
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Input for building workflow step data
 */
export interface WorkflowStepFactoryInput {
  id?: string;
  workflowId?: string;
  agentId?: string | null;
  stepKey?: string;
  stepName?: string;
  stepType?: WorkflowStepType;
  position?: number;
  config?: Prisma.InputJsonValue;
  inputs?: Prisma.InputJsonValue;
  outputs?: Prisma.InputJsonValue;
  dependsOn?: string[];
  retryCount?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  onError?: ErrorHandling;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Raw workflow data without database-generated fields
 */
export interface WorkflowBuildData {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  status: WorkflowStatus;
  version: number;
  parentId: string | null;
  definition: Prisma.InputJsonValue;
  triggerConfig: Prisma.InputJsonValue;
  scheduleEnabled: boolean;
  scheduleCron: string | null;
  scheduleTimezone: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTimeMs: number;
  lastExecutionAt: Date | null;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Workflow with its owner user
 */
export interface WorkflowWithUser {
  workflow: Workflow;
  user: User;
}

/**
 * Workflow with steps and related data
 */
export interface WorkflowWithSteps {
  workflow: Workflow;
  steps: WorkflowStep[];
  user: User;
  agents: Agent[];
}

// ============================================================================
// Helpers
// ============================================================================

let workflowCounter = 0;
let stepCounter = 0;

/**
 * Generate a unique workflow name
 */
const generateWorkflowName = (): string => {
  workflowCounter += 1;
  return `Test Workflow ${workflowCounter}`;
};

/**
 * Generate a unique step key
 */
const generateStepKey = (): string => {
  stepCounter += 1;
  return `step_${stepCounter}`;
};

// ============================================================================
// Workflow Factory
// ============================================================================

/**
 * Workflow Factory
 *
 * Provides methods to build and create workflow test data
 */
export const workflowFactory = {
  /**
   * Build workflow data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Workflow data object
   *
   * Usage:
   * ```typescript
   * const workflowData = workflowFactory.build({ userId: 'user-123' });
   * ```
   */
  build: (overrides: WorkflowFactoryInput = {}): WorkflowBuildData => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      name: overrides.name ?? generateWorkflowName(),
      description: overrides.description ?? 'A test workflow for integration testing',
      userId: overrides.userId ?? uuidv4(), // Must be provided for database operations
      status: overrides.status ?? WorkflowStatus.DRAFT,
      version: overrides.version ?? 1,
      parentId: overrides.parentId ?? null,
      definition: overrides.definition ?? {
        version: '1.0',
        trigger: 'manual',
        steps: [],
      },
      triggerConfig: overrides.triggerConfig ?? {
        type: 'manual',
      },
      scheduleEnabled: overrides.scheduleEnabled ?? false,
      scheduleCron: overrides.scheduleCron ?? null,
      scheduleTimezone: overrides.scheduleTimezone ?? 'UTC',
      totalExecutions: overrides.totalExecutions ?? 0,
      successfulExecutions: overrides.successfulExecutions ?? 0,
      failedExecutions: overrides.failedExecutions ?? 0,
      avgExecutionTimeMs: overrides.avgExecutionTimeMs ?? 0,
      lastExecutionAt: overrides.lastExecutionAt ?? null,
      tags: overrides.tags ?? ['test', 'integration'],
      isPublic: overrides.isPublic ?? false,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      deletedAt: overrides.deletedAt ?? null,
    };
  },

  /**
   * Create workflow in database
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created workflow
   * @throws Error if database is not available or userId is missing
   *
   * Usage:
   * ```typescript
   * const user = await userFactory.create();
   * const workflow = await workflowFactory.create({ userId: user.id });
   * ```
   */
  create: async (overrides: WorkflowFactoryInput): Promise<Workflow> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create workflow.');
    }

    if (!overrides.userId) {
      throw new Error('userId is required to create a workflow.');
    }

    const data = workflowFactory.build(overrides);

    return prisma.workflow.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        userId: data.userId,
        status: data.status,
        version: data.version,
        parentId: data.parentId,
        definition: data.definition,
        triggerConfig: data.triggerConfig,
        scheduleEnabled: data.scheduleEnabled,
        scheduleCron: data.scheduleCron,
        scheduleTimezone: data.scheduleTimezone,
        totalExecutions: data.totalExecutions,
        successfulExecutions: data.successfulExecutions,
        failedExecutions: data.failedExecutions,
        avgExecutionTimeMs: data.avgExecutionTimeMs,
        lastExecutionAt: data.lastExecutionAt,
        tags: data.tags,
        isPublic: data.isPublic,
      },
    });
  },

  /**
   * Create workflow with a new user (creates both)
   *
   * @param workflowOverrides - Optional workflow field overrides
   * @param userOverrides - Optional user field overrides
   * @returns Promise resolving to workflow and user
   *
   * Usage:
   * ```typescript
   * const { workflow, user } = await workflowFactory.createWithUser();
   * ```
   */
  createWithUser: async (
    workflowOverrides: Omit<WorkflowFactoryInput, 'userId'> = {},
    userOverrides = {},
  ): Promise<WorkflowWithUser> => {
    const user = await userFactory.create(userOverrides);
    const workflow = await workflowFactory.create({
      ...workflowOverrides,
      userId: user.id,
    });

    return { workflow, user };
  },

  /**
   * Create workflow with steps
   *
   * @param stepCount - Number of steps to create (default: 3)
   * @param workflowOverrides - Optional workflow field overrides
   * @returns Promise resolving to workflow, steps, user, and agents
   *
   * Usage:
   * ```typescript
   * const { workflow, steps, user, agents } = await workflowFactory.createWithSteps(3);
   * ```
   */
  createWithSteps: async (
    stepCount = 3,
    workflowOverrides: Omit<WorkflowFactoryInput, 'userId'> = {},
  ): Promise<WorkflowWithSteps> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create workflow with steps.');
    }

    // Create user
    const user = await userFactory.create();

    // Create agents for steps
    const agents: Agent[] = [];
    for (let i = 0; i < stepCount; i++) {
      const agent = await agentFactory.create({
        userId: user.id,
        name: `Step ${i + 1} Agent`,
        type: AgentType.CODE,
        status: AgentStatus.ACTIVE,
      });
      agents.push(agent);
    }

    // Create workflow
    const workflow = await workflowFactory.create({
      ...workflowOverrides,
      userId: user.id,
      status: WorkflowStatus.ACTIVE,
    });

    // Create steps
    const steps: WorkflowStep[] = [];
    for (let i = 0; i < stepCount; i++) {
      const step = await workflowStepFactory.create({
        workflowId: workflow.id,
        agentId: agents[i]?.id,
        stepKey: `step_${i + 1}`,
        stepName: `Step ${i + 1}`,
        position: i,
        dependsOn: i > 0 ? [`step_${i}`] : [],
      });
      steps.push(step);
    }

    return { workflow, steps, user, agents };
  },

  /**
   * Create multiple workflows for a user
   *
   * @param userId - Owner user ID
   * @param count - Number of workflows to create
   * @param overrides - Optional field overrides (applied to all workflows)
   * @returns Promise resolving to array of created workflows
   *
   * Usage:
   * ```typescript
   * const workflows = await workflowFactory.createMany(user.id, 5);
   * ```
   */
  createMany: async (
    userId: string,
    count: number,
    overrides: Omit<WorkflowFactoryInput, 'userId'> = {},
  ): Promise<Workflow[]> => {
    const workflows: Workflow[] = [];

    for (let i = 0; i < count; i++) {
      const workflow = await workflowFactory.create({
        ...overrides,
        userId,
      });
      workflows.push(workflow);
    }

    return workflows;
  },

  /**
   * Create an active workflow
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created active workflow
   *
   * Usage:
   * ```typescript
   * const activeWorkflow = await workflowFactory.createActive({ userId: user.id });
   * ```
   */
  createActive: async (overrides: WorkflowFactoryInput): Promise<Workflow> => {
    return workflowFactory.create({
      ...overrides,
      status: WorkflowStatus.ACTIVE,
    });
  },

  /**
   * Create a scheduled workflow
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created scheduled workflow
   *
   * Usage:
   * ```typescript
   * const scheduledWorkflow = await workflowFactory.createScheduled({ userId: user.id });
   * ```
   */
  createScheduled: async (overrides: WorkflowFactoryInput): Promise<Workflow> => {
    return workflowFactory.create({
      ...overrides,
      status: WorkflowStatus.ACTIVE,
      scheduleEnabled: true,
      scheduleCron: '0 * * * *', // Every hour
      scheduleTimezone: 'UTC',
    });
  },
};

// ============================================================================
// Workflow Step Factory
// ============================================================================

/**
 * Workflow Step Factory
 *
 * Provides methods to build and create workflow step test data
 */
export const workflowStepFactory = {
  /**
   * Build workflow step data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Workflow step data object
   *
   * Usage:
   * ```typescript
   * const stepData = workflowStepFactory.build({
   *   workflowId: workflow.id,
   *   agentId: agent.id
   * });
   * ```
   */
  build: (overrides: WorkflowStepFactoryInput = {}): WorkflowStepFactoryInput => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      workflowId: overrides.workflowId ?? uuidv4(),
      agentId: overrides.agentId ?? null,
      stepKey: overrides.stepKey ?? generateStepKey(),
      stepName: overrides.stepName ?? 'Test Step',
      stepType: overrides.stepType ?? WorkflowStepType.AGENT,
      position: overrides.position ?? 0,
      config: overrides.config ?? {},
      inputs: overrides.inputs ?? {},
      outputs: overrides.outputs ?? {},
      dependsOn: overrides.dependsOn ?? [],
      retryCount: overrides.retryCount ?? 0,
      retryDelayMs: overrides.retryDelayMs ?? 1000,
      timeoutMs: overrides.timeoutMs ?? 30000,
      onError: overrides.onError ?? ErrorHandling.FAIL,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    };
  },

  /**
   * Create workflow step in database
   *
   * @param overrides - Optional field overrides (must include workflowId)
   * @returns Promise resolving to created workflow step
   * @throws Error if database is not available or workflowId is missing
   *
   * Usage:
   * ```typescript
   * const step = await workflowStepFactory.create({
   *   workflowId: workflow.id,
   *   agentId: agent.id
   * });
   * ```
   */
  create: async (overrides: WorkflowStepFactoryInput): Promise<WorkflowStep> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create workflow step.');
    }

    if (!overrides.workflowId) {
      throw new Error('workflowId is required to create a workflow step.');
    }

    const data = workflowStepFactory.build(overrides);

    return prisma.workflowStep.create({
      data: {
        id: data.id,
        workflowId: data.workflowId!,
        agentId: data.agentId,
        stepKey: data.stepKey!,
        stepName: data.stepName!,
        stepType: data.stepType!,
        position: data.position!,
        config: data.config,
        inputs: data.inputs,
        outputs: data.outputs,
        dependsOn: data.dependsOn,
        retryCount: data.retryCount,
        retryDelayMs: data.retryDelayMs,
        timeoutMs: data.timeoutMs,
        onError: data.onError,
      },
    });
  },

  /**
   * Create multiple steps for a workflow
   *
   * @param workflowId - Parent workflow ID
   * @param count - Number of steps to create
   * @param overrides - Optional field overrides (applied to all steps)
   * @returns Promise resolving to array of created steps
   *
   * Usage:
   * ```typescript
   * const steps = await workflowStepFactory.createMany(workflow.id, 5);
   * ```
   */
  createMany: async (
    workflowId: string,
    count: number,
    overrides: Omit<WorkflowStepFactoryInput, 'workflowId'> = {},
  ): Promise<WorkflowStep[]> => {
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < count; i++) {
      const step = await workflowStepFactory.create({
        ...overrides,
        workflowId,
        position: i,
        stepKey: `step_${i + 1}`,
        stepName: `Step ${i + 1}`,
      });
      steps.push(step);
    }

    return steps;
  },
};

// ============================================================================
// Reset Counters
// ============================================================================

/**
 * Reset the workflow counter
 * Call this in beforeEach to ensure unique names across tests
 */
export const resetWorkflowCounter = (): void => {
  workflowCounter = 0;
};

/**
 * Reset the step counter
 * Call this in beforeEach to ensure unique keys across tests
 */
export const resetStepCounter = (): void => {
  stepCounter = 0;
};

/**
 * Reset all workflow-related counters
 */
export const resetWorkflowCounters = (): void => {
  resetWorkflowCounter();
  resetStepCounter();
};

// Re-export enums for convenience
export { WorkflowStatus, WorkflowStepType, ErrorHandling };
