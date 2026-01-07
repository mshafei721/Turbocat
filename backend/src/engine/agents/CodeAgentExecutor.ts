/**
 * Code Agent Executor
 *
 * Executes code agents supporting Python and Node.js runtimes.
 * Currently implemented as a stub that simulates execution.
 * Actual Docker container execution will be implemented in a future phase.
 *
 * @module engine/agents/CodeAgentExecutor
 */

import { Agent, AgentType } from '@prisma/client';
import {
  AgentExecutor,
  AgentExecutorConfig,
  AgentExecutionInput,
  ExecutionMetrics,
} from './AgentExecutor';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported code runtimes
 */
export type CodeRuntime = 'python' | 'nodejs' | 'javascript';

/**
 * Code agent configuration in agent.config
 */
export interface CodeAgentConfig {
  /** Runtime to use for execution */
  runtime: CodeRuntime;
  /** Code to execute */
  code: string;
  /** Entry function name (optional) */
  entryFunction?: string;
  /** Environment variables to inject */
  envVars?: Record<string, string>;
  /** Python packages to install (for Python runtime) */
  pipPackages?: string[];
  /** NPM packages to install (for Node.js runtime) */
  npmPackages?: string[];
}

/**
 * Code execution result
 */
export interface CodeExecutionResult {
  /** Return value from the code */
  returnValue: unknown;
  /** Stdout output */
  stdout: string;
  /** Stderr output */
  stderr: string;
  /** Exit code (0 = success) */
  exitCode: number;
}

// =============================================================================
// CODE AGENT EXECUTOR
// =============================================================================

/**
 * Executor for code agents
 *
 * Supports:
 * - Python runtime (stubbed)
 * - Node.js runtime (stubbed)
 * - Memory and CPU limits (config only)
 * - Execution timeout
 * - Stdout/stderr capture
 *
 * Note: Actual Docker container execution is planned for a future phase.
 * Currently returns simulated results for testing workflow execution.
 */
export class CodeAgentExecutor extends AgentExecutor {
  private executionMetrics: ExecutionMetrics = {};

  constructor(config: AgentExecutorConfig = {}) {
    super(config);
  }

  /**
   * Get the agent type this executor handles
   */
  getAgentType(): AgentType {
    return AgentType.CODE;
  }

  /**
   * Execute the code agent
   */
  protected async executeInternal(input: AgentExecutionInput): Promise<CodeExecutionResult> {
    this.validateInput(input);

    const agentConfig = this.parseAgentConfig(input.agent);

    this.log('info', `Executing code agent`, {
      runtime: agentConfig.runtime,
      hasCode: !!agentConfig.code,
      entryFunction: agentConfig.entryFunction,
    });

    // Validate runtime
    if (!this.isValidRuntime(agentConfig.runtime)) {
      throw new Error(
        `Unsupported runtime: ${agentConfig.runtime}. Supported: python, nodejs, javascript`,
      );
    }

    // Simulate execution based on runtime
    // NOTE: This is a stub implementation. Actual Docker execution will be added later.
    const result = await this.simulateExecution(agentConfig, input.inputs);

    return result;
  }

  /**
   * Parse and validate agent configuration
   */
  private parseAgentConfig(agent: Agent): CodeAgentConfig {
    const config = agent.config as Record<string, unknown> | null;

    if (!config) {
      throw new Error('Code agent requires configuration with runtime and code');
    }

    const runtime = (config.runtime as string) || 'nodejs';
    const code = config.code as string;

    if (!code) {
      throw new Error('Code agent requires code to execute');
    }

    return {
      runtime: runtime as CodeRuntime,
      code,
      entryFunction: config.entryFunction as string | undefined,
      envVars: config.envVars as Record<string, string> | undefined,
      pipPackages: config.pipPackages as string[] | undefined,
      npmPackages: config.npmPackages as string[] | undefined,
    };
  }

  /**
   * Check if runtime is valid
   */
  private isValidRuntime(runtime: string): runtime is CodeRuntime {
    return ['python', 'nodejs', 'javascript'].includes(runtime);
  }

  /**
   * Simulate code execution (stub implementation)
   *
   * In the future, this will:
   * 1. Create a Docker container with the appropriate runtime
   * 2. Mount the code and inputs
   * 3. Execute with resource limits
   * 4. Capture stdout, stderr, and return value
   * 5. Clean up the container
   */
  private async simulateExecution(
    config: CodeAgentConfig,
    inputs: Record<string, unknown>,
  ): Promise<CodeExecutionResult> {
    this.log('info', `Simulating ${config.runtime} execution (stub mode)`);

    // Simulate some execution time
    await this.delay(100);

    // Track simulated metrics
    this.executionMetrics = {
      peakMemoryMb: Math.floor(Math.random() * 100) + 50,
      cpuTimeMs: Math.floor(Math.random() * 500) + 100,
    };

    // Check for intentional error in code (for testing)
    if (config.code.includes('throw') || config.code.includes('raise')) {
      this.log('warn', 'Simulated code contains error-throwing statements');
      return {
        returnValue: null,
        stdout: '',
        stderr: 'Simulated error: Code execution failed',
        exitCode: 1,
      };
    }

    // Generate simulated output based on runtime
    const stdout = this.generateSimulatedStdout(config.runtime, inputs);
    const returnValue = this.generateSimulatedReturnValue(config.runtime, inputs);

    this.log('info', `Code execution completed (simulated)`, {
      runtime: config.runtime,
      exitCode: 0,
      stdoutLength: stdout.length,
    });

    return {
      returnValue,
      stdout,
      stderr: '',
      exitCode: 0,
    };
  }

  /**
   * Generate simulated stdout based on runtime
   */
  private generateSimulatedStdout(runtime: CodeRuntime, inputs: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();

    switch (runtime) {
      case 'python':
        return `[${timestamp}] Python execution started\nProcessing inputs: ${JSON.stringify(inputs)}\nExecution completed successfully.\n`;

      case 'nodejs':
      case 'javascript':
        return `[${timestamp}] Node.js execution started\nInputs received: ${JSON.stringify(inputs)}\nExecution completed successfully.\n`;

      default:
        return `[${timestamp}] Execution completed.\n`;
    }
  }

  /**
   * Generate simulated return value
   */
  private generateSimulatedReturnValue(
    runtime: CodeRuntime,
    inputs: Record<string, unknown>,
  ): unknown {
    return {
      status: 'success',
      runtime,
      processedInputs: inputs,
      timestamp: new Date().toISOString(),
      message: `Code executed successfully using ${runtime} runtime (simulated)`,
      // Echo back some input data for testing
      result: inputs.data ?? inputs.input ?? null,
    };
  }

  /**
   * Delay helper for simulating execution time
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Collect execution metrics
   */
  protected collectMetrics(): ExecutionMetrics | undefined {
    return this.executionMetrics;
  }

  /**
   * Validate input specific to code agents
   */
  protected validateInput(input: AgentExecutionInput): void {
    super.validateInput(input);

    if (input.agent.type !== AgentType.CODE) {
      throw new Error(`CodeAgentExecutor can only execute CODE agents, got: ${input.agent.type}`);
    }
  }
}

export default CodeAgentExecutor;
