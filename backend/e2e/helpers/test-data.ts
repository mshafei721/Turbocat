/**
 * Test Data Factories for E2E Tests
 *
 * This module provides factory functions for generating test data
 * for various entities in E2E tests. These factories create realistic
 * test data that passes validation.
 *
 * Features:
 * - Agent data generation
 * - Workflow data generation
 * - Step data generation
 * - Execution data generation
 * - Random data utilities
 *
 * Usage:
 * ```typescript
 * import { generateAgentData, generateWorkflowData } from './test-data';
 *
 * const agentData = generateAgentData({ name: 'My Agent' });
 * const workflowData = generateWorkflowData({ steps: [step1, step2] });
 * ```
 *
 * @module e2e/helpers/test-data
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Agent types supported by the system
 */
export type AgentType = 'CODE' | 'API' | 'LLM' | 'DATA' | 'WORKFLOW';

/**
 * Agent status values
 */
export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

/**
 * Workflow status values
 */
export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

/**
 * Workflow step types
 */
export type WorkflowStepType = 'AGENT' | 'CONDITION' | 'LOOP' | 'PARALLEL' | 'WAIT';

/**
 * Error handling strategies
 */
export type ErrorHandling = 'FAIL' | 'CONTINUE' | 'RETRY';

/**
 * Trigger types for workflow execution
 */
export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'API' | 'WEBHOOK' | 'EVENT';

/**
 * Agent creation input
 */
export interface AgentInput {
  name: string;
  description?: string;
  type: AgentType;
  config?: Record<string, unknown>;
  capabilities?: unknown[];
  parameters?: Record<string, unknown>;
  maxExecutionTime?: number;
  maxMemoryMb?: number;
  maxConcurrentExecutions?: number;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Workflow step input
 */
export interface WorkflowStepInput {
  stepKey: string;
  stepName: string;
  stepType: WorkflowStepType;
  position: number;
  agentId?: string;
  config?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  dependsOn?: string[];
  retryCount?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  onError?: ErrorHandling;
}

/**
 * Workflow creation input
 */
export interface WorkflowInput {
  name: string;
  description?: string;
  definition?: Record<string, unknown>;
  triggerConfig?: Record<string, unknown>;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleTimezone?: string;
  tags?: string[];
  isPublic?: boolean;
  steps?: WorkflowStepInput[];
}

/**
 * Workflow execution input
 */
export interface ExecutionInput {
  triggerType?: TriggerType;
  triggerData?: Record<string, unknown>;
  inputData?: Record<string, unknown>;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Counter for generating unique names
 */
let counter = 0;

/**
 * Generate a unique identifier
 */
function uniqueId(): number {
  counter++;
  return counter;
}

/**
 * Generate a random string
 *
 * @param length - Length of the string
 * @returns Random alphanumeric string
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Pick a random item from an array
 *
 * @param items - Array of items
 * @returns Random item from the array
 */
export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/**
 * Generate a random number within a range
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number within range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================================
// Agent Data Factories
// ============================================================================

/**
 * Generate agent data for creation
 *
 * @param overrides - Optional field overrides
 * @returns Valid agent creation input
 */
export function generateAgentData(overrides: Partial<AgentInput> = {}): AgentInput {
  const id = uniqueId();
  const agentTypes: AgentType[] = ['CODE', 'API', 'LLM', 'DATA', 'WORKFLOW'];

  return {
    name: `E2E Test Agent ${id}`,
    description: `Test agent created by E2E tests - ${randomString(6)}`,
    type: randomItem(agentTypes),
    config: {
      testMode: true,
      createdAt: new Date().toISOString(),
    },
    capabilities: ['test', 'e2e'],
    parameters: {
      maxRetries: 3,
      timeout: 30000,
    },
    maxExecutionTime: 300,
    maxMemoryMb: 512,
    maxConcurrentExecutions: 1,
    tags: ['e2e-test', `test-${id}`],
    isPublic: false,
    ...overrides,
  };
}

/**
 * Generate a CODE type agent
 *
 * @param overrides - Optional field overrides
 * @returns CODE agent input
 */
export function generateCodeAgent(overrides: Partial<AgentInput> = {}): AgentInput {
  return generateAgentData({
    type: 'CODE',
    config: {
      language: 'javascript',
      runtime: 'node18',
      entryPoint: 'index.js',
    },
    capabilities: ['code-execution', 'file-system'],
    ...overrides,
  });
}

/**
 * Generate an API type agent
 *
 * @param overrides - Optional field overrides
 * @returns API agent input
 */
export function generateApiAgent(overrides: Partial<AgentInput> = {}): AgentInput {
  return generateAgentData({
    type: 'API',
    config: {
      baseUrl: 'https://api.example.com',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
    capabilities: ['http-requests', 'json-parsing'],
    ...overrides,
  });
}

/**
 * Generate an LLM type agent
 *
 * @param overrides - Optional field overrides
 * @returns LLM agent input
 */
export function generateLlmAgent(overrides: Partial<AgentInput> = {}): AgentInput {
  return generateAgentData({
    type: 'LLM',
    config: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
    },
    capabilities: ['text-generation', 'chat'],
    ...overrides,
  });
}

/**
 * Generate a DATA type agent
 *
 * @param overrides - Optional field overrides
 * @returns DATA agent input
 */
export function generateDataAgent(overrides: Partial<AgentInput> = {}): AgentInput {
  return generateAgentData({
    type: 'DATA',
    config: {
      dataSource: 'csv',
      transformations: ['filter', 'map'],
    },
    capabilities: ['data-processing', 'transformation'],
    ...overrides,
  });
}

// ============================================================================
// Workflow Step Data Factories
// ============================================================================

/**
 * Generate workflow step data
 *
 * @param position - Step position in workflow
 * @param overrides - Optional field overrides
 * @returns Valid workflow step input
 */
export function generateStepData(
  position: number = 0,
  overrides: Partial<WorkflowStepInput> = {},
): WorkflowStepInput {
  const id = uniqueId();
  const stepTypes: WorkflowStepType[] = ['AGENT', 'CONDITION', 'LOOP', 'PARALLEL', 'WAIT'];

  return {
    stepKey: `step-${id}-${randomString(4)}`,
    stepName: `E2E Test Step ${id}`,
    stepType: randomItem(stepTypes),
    position,
    config: {
      testMode: true,
    },
    inputs: {},
    outputs: {},
    dependsOn: [],
    retryCount: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    onError: 'FAIL',
    ...overrides,
  };
}

/**
 * Generate an agent step
 *
 * @param position - Step position
 * @param agentId - Agent ID to execute (optional)
 * @param overrides - Optional field overrides
 * @returns Agent step input
 */
export function generateAgentStep(
  position: number,
  agentId?: string,
  overrides: Partial<WorkflowStepInput> = {},
): WorkflowStepInput {
  return generateStepData(position, {
    stepType: 'AGENT',
    agentId,
    ...overrides,
  });
}

/**
 * Generate a condition step
 *
 * @param position - Step position
 * @param overrides - Optional field overrides
 * @returns Condition step input
 */
export function generateConditionStep(
  position: number,
  overrides: Partial<WorkflowStepInput> = {},
): WorkflowStepInput {
  return generateStepData(position, {
    stepType: 'CONDITION',
    config: {
      condition: 'input.value > 0',
      trueBranch: 'step-true',
      falseBranch: 'step-false',
    },
    ...overrides,
  });
}

/**
 * Generate a wait step
 *
 * @param position - Step position
 * @param durationMs - Wait duration in milliseconds
 * @param overrides - Optional field overrides
 * @returns Wait step input
 */
export function generateWaitStep(
  position: number,
  durationMs: number = 1000,
  overrides: Partial<WorkflowStepInput> = {},
): WorkflowStepInput {
  return generateStepData(position, {
    stepType: 'WAIT',
    config: {
      durationMs,
    },
    ...overrides,
  });
}

// ============================================================================
// Workflow Data Factories
// ============================================================================

/**
 * Generate workflow data for creation
 *
 * @param overrides - Optional field overrides
 * @returns Valid workflow creation input
 */
export function generateWorkflowData(overrides: Partial<WorkflowInput> = {}): WorkflowInput {
  const id = uniqueId();

  return {
    name: `E2E Test Workflow ${id}`,
    description: `Test workflow created by E2E tests - ${randomString(6)}`,
    definition: {
      version: '1.0',
      testMode: true,
    },
    triggerConfig: {
      type: 'manual',
    },
    scheduleEnabled: false,
    scheduleCron: null,
    scheduleTimezone: 'UTC',
    tags: ['e2e-test', `workflow-${id}`],
    isPublic: false,
    steps: [],
    ...overrides,
  };
}

/**
 * Generate a workflow with steps
 *
 * @param stepCount - Number of steps to generate
 * @param overrides - Optional workflow field overrides
 * @returns Workflow with generated steps
 */
export function generateWorkflowWithSteps(
  stepCount: number = 3,
  overrides: Partial<WorkflowInput> = {},
): WorkflowInput {
  const steps: WorkflowStepInput[] = [];

  for (let i = 0; i < stepCount; i++) {
    const step = generateStepData(i, {
      stepKey: `step-${i}`,
      stepName: `Step ${i + 1}`,
      stepType: 'AGENT',
      dependsOn: i > 0 ? [`step-${i - 1}`] : [],
    });
    steps.push(step);
  }

  return generateWorkflowData({
    steps,
    ...overrides,
  });
}

/**
 * Generate a scheduled workflow
 *
 * @param cronExpression - Cron expression for scheduling
 * @param overrides - Optional field overrides
 * @returns Scheduled workflow input
 */
export function generateScheduledWorkflow(
  cronExpression: string = '0 9 * * *',
  overrides: Partial<WorkflowInput> = {},
): WorkflowInput {
  return generateWorkflowData({
    scheduleEnabled: true,
    scheduleCron: cronExpression,
    scheduleTimezone: 'UTC',
    triggerConfig: {
      type: 'scheduled',
      cron: cronExpression,
    },
    ...overrides,
  });
}

// ============================================================================
// Execution Data Factories
// ============================================================================

/**
 * Generate execution input data
 *
 * @param overrides - Optional field overrides
 * @returns Valid execution input
 */
export function generateExecutionInput(
  overrides: Partial<ExecutionInput> = {},
): ExecutionInput {
  return {
    triggerType: 'MANUAL',
    triggerData: {
      source: 'e2e-test',
      timestamp: new Date().toISOString(),
    },
    inputData: {
      testValue: randomString(8),
      testNumber: randomNumber(1, 100),
    },
    ...overrides,
  };
}

// ============================================================================
// Bulk Data Generation
// ============================================================================

/**
 * Generate multiple agents
 *
 * @param count - Number of agents to generate
 * @param overrides - Optional field overrides for all agents
 * @returns Array of agent inputs
 */
export function generateMultipleAgents(
  count: number,
  overrides: Partial<AgentInput> = {},
): AgentInput[] {
  return Array.from({ length: count }, () => generateAgentData(overrides));
}

/**
 * Generate multiple workflows
 *
 * @param count - Number of workflows to generate
 * @param overrides - Optional field overrides for all workflows
 * @returns Array of workflow inputs
 */
export function generateMultipleWorkflows(
  count: number,
  overrides: Partial<WorkflowInput> = {},
): WorkflowInput[] {
  return Array.from({ length: count }, () => generateWorkflowData(overrides));
}

// ============================================================================
// Reset Function
// ============================================================================

/**
 * Reset the counter for unique IDs
 * Useful for test isolation
 */
export function resetCounter(): void {
  counter = 0;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generateAgentData,
  generateCodeAgent,
  generateApiAgent,
  generateLlmAgent,
  generateDataAgent,
  generateStepData,
  generateAgentStep,
  generateConditionStep,
  generateWaitStep,
  generateWorkflowData,
  generateWorkflowWithSteps,
  generateScheduledWorkflow,
  generateExecutionInput,
  generateMultipleAgents,
  generateMultipleWorkflows,
  randomString,
  randomItem,
  randomNumber,
  resetCounter,
};
