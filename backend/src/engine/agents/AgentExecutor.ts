/**
 * Agent Executor Base Class
 *
 * Provides the foundation for all agent executors with common functionality
 * including timeout handling, resource limits, and execution lifecycle management.
 *
 * @module engine/agents/AgentExecutor
 */

import { Agent, AgentType } from '@prisma/client';
import { logger } from '../../lib/logger';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for agent execution
 */
export interface AgentExecutorConfig {
  /** Maximum execution time in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Maximum memory in MB (default: 512) */
  maxMemoryMb?: number;
  /** Maximum CPU shares (default: 1024) */
  maxCpuShares?: number;
  /** Enable detailed logging (default: false) */
  verbose?: boolean;
}

/**
 * Input for agent execution
 */
export interface AgentExecutionInput {
  /** Agent configuration from database */
  agent: Agent;
  /** Resolved input parameters */
  inputs: Record<string, unknown>;
  /** Execution context metadata */
  context?: AgentExecutionContext;
}

/**
 * Execution context passed to agents
 */
export interface AgentExecutionContext {
  /** Execution ID for logging */
  executionId?: string;
  /** Workflow ID if part of a workflow */
  workflowId?: string;
  /** Step key if part of a workflow */
  stepKey?: string;
  /** User ID who triggered the execution */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result from agent execution
 */
export interface AgentExecutionResult {
  /** Whether execution completed successfully */
  success: boolean;
  /** Output data from the agent */
  output: unknown;
  /** Error message if execution failed */
  error?: string;
  /** Error stack trace if available */
  errorStack?: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Resource usage metrics */
  metrics?: ExecutionMetrics;
  /** Logs captured during execution */
  logs?: ExecutionLog[];
}

/**
 * Resource usage metrics from execution
 */
export interface ExecutionMetrics {
  /** Peak memory usage in MB */
  peakMemoryMb?: number;
  /** CPU time used in milliseconds */
  cpuTimeMs?: number;
  /** Network bytes transferred */
  networkBytes?: number;
  /** Number of API calls made */
  apiCalls?: number;
  /** Tokens used (for LLM agents) */
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Log entry from execution
 */
export interface ExecutionLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<AgentExecutorConfig> = {
  timeoutMs: 30000, // 30 seconds
  maxMemoryMb: 512,
  maxCpuShares: 1024,
  verbose: false,
};

// =============================================================================
// ABSTRACT BASE CLASS
// =============================================================================

/**
 * Abstract base class for all agent executors
 *
 * Provides common functionality for:
 * - Timeout handling
 * - Resource limit configuration
 * - Execution lifecycle logging
 * - Error handling
 *
 * Subclasses must implement the `executeInternal` method.
 */
export abstract class AgentExecutor {
  protected config: Required<AgentExecutorConfig>;
  protected logs: ExecutionLog[] = [];

  /**
   * Create a new agent executor
   * @param config - Executor configuration
   */
  constructor(config: AgentExecutorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the agent type this executor handles
   */
  abstract getAgentType(): AgentType;

  /**
   * Execute the agent logic - must be implemented by subclasses
   *
   * @param input - Agent execution input
   * @returns Promise resolving to execution output
   */
  protected abstract executeInternal(input: AgentExecutionInput): Promise<unknown>;

  /**
   * Execute the agent with timeout and error handling
   *
   * @param input - Agent execution input
   * @returns Promise resolving to execution result
   */
  async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    this.logs = [];

    try {
      // Validate input first (before accessing agent properties)
      this.validateInput(input);

      // Get timeout from agent config or use default
      const timeoutMs = input.agent.maxExecutionTime
        ? input.agent.maxExecutionTime * 1000
        : this.config.timeoutMs;

      this.log('info', `Starting ${this.getAgentType()} agent execution`, {
        agentId: input.agent.id,
        agentName: input.agent.name,
        timeoutMs,
      });
      // Execute with timeout
      const output = await this.executeWithTimeout(input, timeoutMs);
      const durationMs = Date.now() - startTime;

      this.log('info', `Agent execution completed successfully`, {
        agentId: input.agent.id,
        durationMs,
      });

      return {
        success: true,
        output,
        durationMs,
        logs: this.logs,
        metrics: this.collectMetrics(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.log('error', `Agent execution failed: ${errorMessage}`, {
        agentId: input?.agent?.id,
        durationMs,
        error: errorMessage,
      });

      return {
        success: false,
        output: null,
        error: errorMessage,
        errorStack,
        durationMs,
        logs: this.logs,
        metrics: this.collectMetrics(),
      };
    }
  }

  /**
   * Execute with timeout enforcement
   */
  private async executeWithTimeout(
    input: AgentExecutionInput,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.executeInternal(input)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Add a log entry
   */
  protected log(
    level: ExecutionLog['level'],
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const logEntry: ExecutionLog = {
      level,
      message,
      timestamp: new Date(),
      metadata,
    };

    this.logs.push(logEntry);

    // Also log to winston if verbose
    if (this.config.verbose) {
      logger[level](`[AgentExecutor] ${message}`, metadata);
    }
  }

  /**
   * Collect execution metrics - can be overridden by subclasses
   */
  protected collectMetrics(): ExecutionMetrics | undefined {
    return undefined;
  }

  /**
   * Validate input parameters - can be overridden by subclasses
   */
  protected validateInput(input: AgentExecutionInput): void {
    if (!input.agent) {
      throw new Error('Agent is required for execution');
    }
    if (!input.inputs) {
      throw new Error('Inputs are required for execution');
    }
  }

  /**
   * Get configuration value with agent override
   */
  protected getConfigValue<K extends keyof AgentExecutorConfig>(
    key: K,
    agent: Agent,
  ): Required<AgentExecutorConfig>[K] {
    // Check agent config for overrides
    const agentConfig = agent.config as Record<string, unknown> | null;
    if (agentConfig && key in agentConfig) {
      return agentConfig[key] as Required<AgentExecutorConfig>[K];
    }
    return this.config[key];
  }
}

export default AgentExecutor;
