/**
 * Workflow Execution Engine
 *
 * This module exports the core workflow execution engine components
 * and all agent executor implementations.
 *
 * @module engine
 */

// Workflow execution
export {
  WorkflowExecutor,
  createWorkflowExecutor,
  type WorkflowExecutorOptions,
  type ExecutionContext,
  type ExecutionResult,
  type StepResult,
  type StepExecutorFn,
  type StepWithAgent,
  type WorkflowWithSteps,
} from './WorkflowExecutor';

// Agent executors
export {
  // Base class and factory
  AgentExecutor,
  createAgentExecutor,
  getExecutorClass,
  hasExecutor,
  getSupportedAgentTypes,
  DEFAULT_CONFIG,

  // Convenience creators
  createCodeExecutor,
  createApiExecutor,
  createLLMExecutor,
  createDataExecutor,

  // Executor implementations
  CodeAgentExecutor,
  ApiAgentExecutor,
  LLMAgentExecutor,
  DataAgentExecutor,

  // Types
  type AgentExecutorConfig,
  type AgentExecutionInput,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutionMetrics,
  type ExecutionLog,
  type CodeAgentConfig,
  type CodeRuntime,
  type CodeExecutionResult,
  type ApiAgentConfig,
  type ApiExecutionResult,
  type HttpMethod,
  type AuthType,
  type ApiAuthConfig,
  type LLMAgentConfig,
  type LLMExecutionResult,
  type ChatMessage,
  type MessageRole,
  type DataAgentConfig,
  type DataExecutionResult,
  type DataOperation,
  type FilterCondition,
  type FilterOperator,
  type SortSpec,
  type AggregationSpec,
  type PipelineStep,
} from './agents';
