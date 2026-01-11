/**
 * Agent Executors Module
 *
 * This module exports all agent executor classes and provides a factory
 * function to create the appropriate executor based on agent type.
 *
 * @module engine/agents
 */

import { AgentType } from '@prisma/client';

// Base class and types
export {
  AgentExecutor,
  type AgentExecutorConfig,
  type AgentExecutionInput,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutionMetrics,
  type ExecutionLog,
  DEFAULT_CONFIG,
} from './AgentExecutor';

// Executor implementations
export {
  CodeAgentExecutor,
  type CodeAgentConfig,
  type CodeRuntime,
  type CodeExecutionResult,
} from './CodeAgentExecutor';
export {
  ApiAgentExecutor,
  type ApiAgentConfig,
  type ApiExecutionResult,
  type HttpMethod,
  type AuthType,
  type ApiAuthConfig,
} from './ApiAgentExecutor';
export {
  LLMAgentExecutor,
  type LLMAgentConfig,
  type LLMExecutionResult,
  type ChatMessage,
  type MessageRole,
} from './LLMAgentExecutor';
export {
  DataAgentExecutor,
  type DataAgentConfig,
  type DataExecutionResult,
  type DataOperation,
  type FilterCondition,
  type FilterOperator,
  type SortSpec,
  type AggregationSpec,
  type PipelineStep,
} from './DataAgentExecutor';

// Import executor classes for factory
import { AgentExecutor, AgentExecutorConfig } from './AgentExecutor';
import { CodeAgentExecutor } from './CodeAgentExecutor';
import { ApiAgentExecutor } from './ApiAgentExecutor';
import { LLMAgentExecutor } from './LLMAgentExecutor';
import { DataAgentExecutor } from './DataAgentExecutor';

// =============================================================================
// EXECUTOR REGISTRY
// =============================================================================

/**
 * Registry mapping agent types to their executor classes
 */
const executorRegistry: Record<AgentType, new (config?: AgentExecutorConfig) => AgentExecutor> = {
  [AgentType.CODE]: CodeAgentExecutor,
  [AgentType.API]: ApiAgentExecutor,
  [AgentType.LLM]: LLMAgentExecutor,
  [AgentType.DATA]: DataAgentExecutor,
  [AgentType.WORKFLOW]: CodeAgentExecutor, // WORKFLOW uses CODE executor as placeholder
};

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create an agent executor for the given agent type
 *
 * @param agentType - The type of agent to create an executor for
 * @param config - Optional executor configuration
 * @returns The appropriate AgentExecutor instance
 * @throws Error if agent type is not supported
 *
 * @example
 * ```typescript
 * const executor = createAgentExecutor(AgentType.LLM, { verbose: true });
 * const result = await executor.execute({ agent, inputs, context });
 * ```
 */
export function createAgentExecutor(
  agentType: AgentType,
  config?: AgentExecutorConfig,
): AgentExecutor {
  const ExecutorClass = executorRegistry[agentType];

  if (!ExecutorClass) {
    throw new Error(`No executor registered for agent type: ${agentType}`);
  }

  return new ExecutorClass(config);
}

/**
 * Get the executor class for a given agent type
 *
 * @param agentType - The type of agent
 * @returns The executor class constructor
 */
export function getExecutorClass(
  agentType: AgentType,
): new (config?: AgentExecutorConfig) => AgentExecutor {
  const ExecutorClass = executorRegistry[agentType];

  if (!ExecutorClass) {
    throw new Error(`No executor registered for agent type: ${agentType}`);
  }

  return ExecutorClass;
}

/**
 * Check if an executor is registered for the given agent type
 *
 * @param agentType - The type of agent to check
 * @returns True if an executor is registered
 */
export function hasExecutor(agentType: AgentType): boolean {
  return agentType in executorRegistry;
}

/**
 * Get list of supported agent types
 *
 * @returns Array of supported AgentType values
 */
export function getSupportedAgentTypes(): AgentType[] {
  return Object.keys(executorRegistry) as AgentType[];
}

// =============================================================================
// CONVENIENCE CREATORS
// =============================================================================

/**
 * Create a Code agent executor
 */
export function createCodeExecutor(config?: AgentExecutorConfig): CodeAgentExecutor {
  return new CodeAgentExecutor(config);
}

/**
 * Create an API agent executor
 */
export function createApiExecutor(config?: AgentExecutorConfig): ApiAgentExecutor {
  return new ApiAgentExecutor(config);
}

/**
 * Create an LLM agent executor
 */
export function createLLMExecutor(config?: AgentExecutorConfig): LLMAgentExecutor {
  return new LLMAgentExecutor(config);
}

/**
 * Create a Data agent executor
 */
export function createDataExecutor(config?: AgentExecutorConfig): DataAgentExecutor {
  return new DataAgentExecutor(config);
}
