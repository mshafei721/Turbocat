/**
 * Workflow Execution Engine
 *
 * This module provides the core workflow execution engine for Turbocat.
 * It handles:
 * - DAG validation and cycle detection
 * - Topological sorting for step ordering
 * - Input/template variable resolution
 * - Step execution with error handling and retries
 * - Execution state management
 *
 * The WorkflowExecutor is designed to work with the BullMQ job processor
 * and can execute workflows independently or as part of the queue system.
 *
 * @module engine/WorkflowExecutor
 */

import {
  PrismaClient,
  Workflow,
  WorkflowStep,
  Execution,
  Agent,
  ExecutionStatus,
  LogLevel,
  StepStatus,
  TriggerType,
  WorkflowStepType,
  ErrorHandling,
  Prisma,
} from '@prisma/client';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Step with agent relation type
 */
export type StepWithAgent = WorkflowStep & {
  agent: Agent | null;
};

/**
 * Workflow with steps and agents
 */
export type WorkflowWithSteps = Workflow & {
  steps: StepWithAgent[];
};

/**
 * Execution context passed between steps
 */
export interface ExecutionContext {
  /** Original workflow inputs */
  inputs: Record<string, unknown>;
  /** Results from completed steps, keyed by stepKey */
  stepResults: Record<string, StepResult>;
  /** Execution metadata */
  metadata: Record<string, unknown>;
  /** Execution ID for logging */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** User ID who triggered the execution */
  userId: string;
  /** Trigger type (MANUAL, SCHEDULED, etc.) */
  triggerType: TriggerType;
}

/**
 * Result from a single step execution
 */
export interface StepResult {
  /** Step key for reference */
  stepKey: string;
  /** Whether the step completed successfully */
  success: boolean;
  /** Step output data */
  output: unknown;
  /** Error message if step failed */
  error?: string;
  /** Error stack trace if available */
  errorStack?: string;
  /** Step execution duration in milliseconds */
  durationMs: number;
  /** Step status */
  status: StepStatus;
  /** Retry attempt number (0-based) */
  retryAttempt: number;
  /** Timestamp when step started */
  startedAt: Date;
  /** Timestamp when step completed */
  completedAt: Date;
}

/**
 * Workflow execution result
 */
export interface ExecutionResult {
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Final execution status */
  status: ExecutionStatus;
  /** Combined output from all steps */
  output: Record<string, unknown>;
  /** Error message if execution failed */
  error?: string;
  /** Error stack if available */
  errorStack?: string;
  /** Total execution duration in milliseconds */
  durationMs: number;
  /** Number of steps completed */
  stepsCompleted: number;
  /** Number of steps that failed */
  stepsFailed: number;
  /** Number of steps that were skipped */
  stepsSkipped: number;
  /** Total number of steps */
  stepsTotal: number;
  /** Timestamp when execution started */
  startedAt: Date;
  /** Timestamp when execution completed */
  completedAt: Date;
}

/**
 * Step executor function signature
 * This is called to actually execute a step's logic
 */
export type StepExecutorFn = (
  step: StepWithAgent,
  context: ExecutionContext,
  resolvedInputs: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Workflow executor options
 */
export interface WorkflowExecutorOptions {
  /** Prisma client instance */
  prisma: PrismaClient;
  /** Custom step executor function (for testing or custom implementations) */
  stepExecutor?: StepExecutorFn;
  /** Maximum concurrent parallel steps (default: 5) */
  maxParallelSteps?: number;
  /** Global timeout for entire workflow execution in ms (default: 30 minutes) */
  globalTimeoutMs?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default global timeout for workflow execution (30 minutes) */
const DEFAULT_GLOBAL_TIMEOUT_MS = 30 * 60 * 1000;

/** Default maximum parallel steps */
const DEFAULT_MAX_PARALLEL_STEPS = 5;

/** Template variable pattern: {{path.to.value}} */
const TEMPLATE_PATTERN = /\{\{([^}]+)\}\}/g;

// =============================================================================
// WORKFLOW EXECUTOR CLASS
// =============================================================================

/**
 * WorkflowExecutor Class
 *
 * Handles the complete lifecycle of workflow execution including:
 * - DAG validation and cycle detection
 * - Topological sorting for execution order
 * - Input/template variable resolution
 * - Step-by-step execution with error handling
 * - State persistence to database
 *
 * Usage:
 * ```typescript
 * const executor = new WorkflowExecutor({ prisma });
 * const result = await executor.execute(workflowId, userId, {
 *   triggerType: TriggerType.MANUAL,
 *   inputs: { data: 'input value' },
 * });
 * ```
 */
export class WorkflowExecutor {
  private readonly prisma: PrismaClient;
  private readonly stepExecutor: StepExecutorFn;
  /** Maximum parallel steps - reserved for future parallel execution */
  public readonly maxParallelSteps: number;
  private readonly globalTimeoutMs: number;

  /** Workflow being executed */
  private workflow: WorkflowWithSteps | null = null;
  /** Current execution record */
  private execution: Execution | null = null;
  /** Execution context with inputs and step results */
  private context: ExecutionContext | null = null;
  /** Map of step states during execution */
  private stepStates: Map<string, StepResult> = new Map();
  /** Topologically sorted step order */
  private executionOrder: string[] = [];
  /** Set of completed step keys */
  private completedSteps: Set<string> = new Set();
  /** Set of failed step keys */
  private failedSteps: Set<string> = new Set();
  /** Set of skipped step keys */
  private skippedSteps: Set<string> = new Set();
  /** Execution start time */
  private startTime: number = 0;
  /** Whether execution has been cancelled */
  private isCancelled: boolean = false;

  /**
   * Create a new WorkflowExecutor
   *
   * @param options - Executor options
   */
  constructor(options: WorkflowExecutorOptions) {
    this.prisma = options.prisma;
    this.stepExecutor = options.stepExecutor || this.defaultStepExecutor.bind(this);
    this.maxParallelSteps = options.maxParallelSteps ?? DEFAULT_MAX_PARALLEL_STEPS;
    this.globalTimeoutMs = options.globalTimeoutMs ?? DEFAULT_GLOBAL_TIMEOUT_MS;
  }

  // ===========================================================================
  // MAIN EXECUTION FLOW (Task 19.6)
  // ===========================================================================

  /**
   * Execute a workflow
   *
   * This is the main entry point for workflow execution. It:
   * 1. Loads the workflow from the database
   * 2. Validates the DAG structure
   * 3. Creates an execution record
   * 4. Executes steps in topological order
   * 5. Handles errors and updates final status
   *
   * @param workflowId - ID of the workflow to execute
   * @param userId - ID of the user triggering the execution
   * @param options - Execution options
   * @returns Execution result
   */
  async execute(
    workflowId: string,
    userId: string,
    options: {
      triggerType?: TriggerType;
      inputs?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      executionId?: string; // If provided, use existing execution record
    } = {},
  ): Promise<ExecutionResult> {
    this.startTime = Date.now();
    this.isCancelled = false;

    try {
      // Step 1: Load workflow from database
      await this.loadWorkflow(workflowId);

      if (!this.workflow) {
        throw ApiError.notFound(`Workflow not found: ${workflowId}`);
      }

      // Step 2: Validate DAG structure
      this.validateDAG();

      // Step 3: Compute topological sort
      this.executionOrder = this.topologicalSort();

      // Step 4: Create or load execution record
      if (options.executionId) {
        await this.loadExecution(options.executionId);
      } else {
        await this.createExecution(
          userId,
          options.triggerType || TriggerType.MANUAL,
          options.inputs,
        );
      }

      if (!this.execution) {
        throw ApiError.internal('Failed to create execution record');
      }

      // Step 5: Initialize execution context
      this.context = {
        inputs: options.inputs || {},
        stepResults: {},
        metadata: options.metadata || {},
        executionId: this.execution.id,
        workflowId: this.workflow.id,
        userId,
        triggerType: options.triggerType || TriggerType.MANUAL,
      };

      // Step 6: Update execution status to RUNNING
      await this.updateExecutionStatus(ExecutionStatus.RUNNING, {
        startedAt: new Date(),
      });

      // Log execution start
      await this.logExecutionEvent(LogLevel.INFO, 'Workflow execution started', {
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        stepsTotal: this.workflow.steps.length,
        executionOrder: this.executionOrder,
      });

      // Step 7: Execute steps in topological order
      await this.executeStepsInOrder();

      // Step 8: Calculate final results
      const durationMs = Date.now() - this.startTime;
      const finalStatus =
        this.failedSteps.size > 0 ? ExecutionStatus.FAILED : ExecutionStatus.COMPLETED;

      // Collect all step outputs
      const output: Record<string, unknown> = {};
      for (const [stepKey, result] of this.stepStates) {
        output[stepKey] = result.output;
      }

      // Step 9: Update execution status to final state
      await this.updateExecutionStatus(finalStatus, {
        completedAt: new Date(),
        durationMs,
        outputData: output as Prisma.InputJsonValue,
        stepsCompleted: this.completedSteps.size,
        stepsFailed: this.failedSteps.size,
      });

      // Log execution completion
      await this.logExecutionEvent(
        finalStatus === ExecutionStatus.COMPLETED ? LogLevel.INFO : LogLevel.ERROR,
        `Workflow execution ${finalStatus.toLowerCase()}`,
        {
          durationMs,
          stepsCompleted: this.completedSteps.size,
          stepsFailed: this.failedSteps.size,
          stepsSkipped: this.skippedSteps.size,
        },
      );

      logger.info('[WorkflowExecutor] Execution completed', {
        executionId: this.execution.id,
        workflowId: this.workflow.id,
        status: finalStatus,
        durationMs,
        stepsCompleted: this.completedSteps.size,
        stepsFailed: this.failedSteps.size,
      });

      return {
        executionId: this.execution.id,
        workflowId: this.workflow.id,
        status: finalStatus,
        output,
        durationMs,
        stepsCompleted: this.completedSteps.size,
        stepsFailed: this.failedSteps.size,
        stepsSkipped: this.skippedSteps.size,
        stepsTotal: this.workflow.steps.length,
        startedAt: this.execution.startedAt || new Date(this.startTime),
        completedAt: new Date(),
      };
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  /**
   * Execute an existing execution record
   *
   * This is used when the execution record was already created (e.g., by the API)
   * and we just need to run it.
   *
   * @param executionId - ID of the execution record
   * @returns Execution result
   */
  async executeExisting(executionId: string): Promise<ExecutionResult> {
    // Load execution record
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { position: 'asc' },
              include: { agent: true },
            },
          },
        },
      },
    });

    if (!execution) {
      throw ApiError.notFound(`Execution not found: ${executionId}`);
    }

    if (!execution.workflow) {
      throw ApiError.notFound(`Workflow not found for execution: ${executionId}`);
    }

    // Extract inputs from execution record
    const inputs = (execution.inputData as Record<string, unknown>) || {};

    return this.execute(execution.workflowId, execution.userId, {
      triggerType: execution.triggerType,
      inputs,
      executionId: execution.id,
    });
  }

  // ===========================================================================
  // DAG VALIDATION (Task 19.2)
  // ===========================================================================

  /**
   * Validate the workflow DAG structure
   *
   * Checks for:
   * - Cycles in the dependency graph
   * - Missing step dependencies
   * - Invalid agent references
   *
   * @throws ApiError if validation fails
   */
  validateDAG(): void {
    if (!this.workflow) {
      throw ApiError.internal('Workflow not loaded');
    }

    const steps = this.workflow.steps;
    const stepKeySet = new Set(steps.map((s) => s.stepKey));
    const adjacencyList = new Map<string, string[]>();

    // Initialize adjacency list
    for (const step of steps) {
      adjacencyList.set(step.stepKey, []);
    }

    // Build edges from dependencies
    for (const step of steps) {
      if (step.dependsOn && step.dependsOn.length > 0) {
        for (const dep of step.dependsOn) {
          // Validate dependency exists
          if (!stepKeySet.has(dep)) {
            throw ApiError.badRequest(
              `Step "${step.stepKey}" depends on non-existent step "${dep}"`,
            );
          }

          // Validate not self-referential
          if (dep === step.stepKey) {
            throw ApiError.badRequest(`Step "${step.stepKey}" cannot depend on itself`);
          }

          // Add edge from dependency to this step
          const edges = adjacencyList.get(dep) || [];
          edges.push(step.stepKey);
          adjacencyList.set(dep, edges);
        }
      }

      // Validate agent reference if step type is AGENT
      if (step.stepType === WorkflowStepType.AGENT && step.agentId && !step.agent) {
        logger.warn('[WorkflowExecutor] Step references missing agent', {
          stepKey: step.stepKey,
          agentId: step.agentId,
        });
      }
    }

    // Detect cycles using DFS with three colors
    const WHITE = 0; // Unvisited
    const GRAY = 1; // Visiting (in current DFS path)
    const BLACK = 2; // Visited (completely processed)
    const colors = new Map<string, number>();

    for (const stepKey of stepKeySet) {
      colors.set(stepKey, WHITE);
    }

    const detectCycle = (node: string, path: string[]): boolean => {
      colors.set(node, GRAY);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        const color = colors.get(neighbor);

        if (color === GRAY) {
          // Back edge found - cycle detected
          const cycleStart = path.indexOf(neighbor);
          const cyclePath = path.slice(cycleStart).concat(neighbor);
          throw ApiError.badRequest(`Cycle detected in workflow: ${cyclePath.join(' -> ')}`);
        }

        if (color === WHITE && detectCycle(neighbor, path)) {
          return true;
        }
      }

      colors.set(node, BLACK);
      path.pop();
      return false;
    };

    // Run cycle detection from each unvisited node
    for (const stepKey of stepKeySet) {
      if (colors.get(stepKey) === WHITE) {
        detectCycle(stepKey, []);
      }
    }

    logger.debug('[WorkflowExecutor] DAG validation passed', {
      workflowId: this.workflow?.id,
      stepCount: steps.length,
    });
  }

  // ===========================================================================
  // TOPOLOGICAL SORT (Task 19.3)
  // ===========================================================================

  /**
   * Perform topological sort using Kahn's algorithm
   *
   * Returns steps in execution order where all dependencies
   * of a step appear before that step.
   *
   * @returns Array of step keys in execution order
   */
  topologicalSort(): string[] {
    if (!this.workflow) {
      throw ApiError.internal('Workflow not loaded');
    }

    const steps = this.workflow.steps;
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    for (const step of steps) {
      inDegree.set(step.stepKey, 0);
      adjacencyList.set(step.stepKey, []);
    }

    // Build graph
    for (const step of steps) {
      if (step.dependsOn && step.dependsOn.length > 0) {
        for (const dep of step.dependsOn) {
          // Increment in-degree of this step (it has a dependency)
          inDegree.set(step.stepKey, (inDegree.get(step.stepKey) || 0) + 1);
          // Add edge from dependency to this step
          const edges = adjacencyList.get(dep) || [];
          edges.push(step.stepKey);
          adjacencyList.set(dep, edges);
        }
      }
    }

    // Find all nodes with no incoming edges
    const queue: string[] = [];
    for (const [stepKey, degree] of inDegree) {
      if (degree === 0) {
        queue.push(stepKey);
      }
    }

    // Process nodes in order
    const result: string[] = [];
    while (queue.length > 0) {
      // Sort queue to ensure deterministic order for steps at same level
      queue.sort();
      const current = queue.shift()!;
      result.push(current);

      // Reduce in-degree of neighbors
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If we didn't process all nodes, there's a cycle (should be caught by validateDAG)
    if (result.length !== steps.length) {
      throw ApiError.internal('Topological sort failed - possible cycle in workflow');
    }

    logger.debug('[WorkflowExecutor] Topological sort completed', {
      workflowId: this.workflow?.id,
      executionOrder: result,
    });

    return result;
  }

  // ===========================================================================
  // INPUT RESOLUTION (Task 19.4)
  // ===========================================================================

  /**
   * Resolve template variables in step inputs
   *
   * Replaces template variables like:
   * - {{inputs.data}} - References workflow input
   * - {{step1.output}} - References output from previous step
   * - {{step1.output.nested.path}} - References nested property
   *
   * @param step - Step to resolve inputs for
   * @returns Resolved inputs object
   */
  resolveInputs(step: StepWithAgent): Record<string, unknown> {
    if (!this.context) {
      return (step.inputs as Record<string, unknown>) || {};
    }

    const stepInputs = (step.inputs as Record<string, unknown>) || {};
    return this.resolveTemplateVariables(stepInputs) as Record<string, unknown>;
  }

  /**
   * Recursively resolve template variables in an object
   *
   * @param obj - Object to resolve
   * @returns Resolved object
   */
  private resolveTemplateVariables(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.resolveTemplateString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolveTemplateVariables(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveTemplateVariables(value);
      }
      return resolved;
    }

    return obj;
  }

  /**
   * Resolve template variables in a string
   *
   * @param str - String potentially containing template variables
   * @returns Resolved string or the resolved value if entire string is a template
   */
  private resolveTemplateString(str: string): unknown {
    // Check if the entire string is a single template variable
    const fullMatch = str.match(/^\{\{([^}]+)\}\}$/);
    if (fullMatch && fullMatch[1]) {
      return this.getValueFromPath(fullMatch[1].trim());
    }

    // Replace all template variables in the string
    return str.replace(TEMPLATE_PATTERN, (match, path) => {
      const value = this.getValueFromPath(path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get a value from the context using a dot-notation path
   *
   * @param path - Path like "inputs.data" or "step1.output.nested"
   * @returns Value at the path or undefined
   */
  private getValueFromPath(path: string): unknown {
    if (!this.context) {
      return undefined;
    }

    const parts = path.split('.');
    if (parts.length === 0) {
      return undefined;
    }

    const root = parts[0];
    const rest = parts.slice(1);

    let value: unknown;

    // Check for special roots
    if (root === 'inputs') {
      value = this.context.inputs;
    } else if (root === 'metadata') {
      value = this.context.metadata;
    } else if (root && this.context.stepResults[root]) {
      // Reference to a step's output
      value = this.context.stepResults[root].output;
    } else if (root) {
      // Try direct lookup in step results
      value = this.context.stepResults[root]?.output;
    } else {
      value = undefined;
    }

    // Navigate the rest of the path
    for (const part of rest) {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // ===========================================================================
  // STEP EXECUTION (Task 19.5)
  // ===========================================================================

  /**
   * Execute all steps in topological order
   */
  private async executeStepsInOrder(): Promise<void> {
    for (const stepKey of this.executionOrder) {
      // Check for cancellation
      if (this.isCancelled) {
        this.skippedSteps.add(stepKey);
        continue;
      }

      // Check global timeout
      if (Date.now() - this.startTime > this.globalTimeoutMs) {
        await this.logExecutionEvent(LogLevel.ERROR, 'Workflow execution timed out', {
          timeoutMs: this.globalTimeoutMs,
          elapsedMs: Date.now() - this.startTime,
        });
        throw ApiError.badRequest('Workflow execution timed out');
      }

      // Check if dependencies failed
      const step = this.workflow!.steps.find((s) => s.stepKey === stepKey);
      if (!step) {
        continue;
      }

      const dependenciesFailed = this.checkDependenciesFailed(step);
      if (dependenciesFailed) {
        // Skip this step if any dependency failed and error handling is FAIL
        if (step.onError === ErrorHandling.FAIL) {
          this.skippedSteps.add(stepKey);
          await this.logStepEvent(step, LogLevel.WARN, 'Step skipped due to failed dependency', {
            status: StepStatus.SKIPPED,
          });
          continue;
        }
      }

      // Execute the step
      await this.executeStep(step);
    }
  }

  /**
   * Check if any dependencies of a step have failed
   */
  private checkDependenciesFailed(step: StepWithAgent): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return false;
    }

    for (const dep of step.dependsOn) {
      if (this.failedSteps.has(dep)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute a single workflow step
   *
   * @param step - Step to execute
   */
  async executeStep(step: StepWithAgent): Promise<void> {
    const stepStartTime = Date.now();
    let retryAttempt = 0;
    let lastError: Error | null = null;

    // Log step start
    await this.logStepEvent(step, LogLevel.INFO, `Starting step: ${step.stepName}`, {
      status: StepStatus.RUNNING,
      stepType: step.stepType,
      position: step.position,
      agentId: step.agentId,
    });

    // Retry loop
    while (retryAttempt <= step.retryCount) {
      try {
        // Resolve inputs
        const resolvedInputs = this.resolveInputs(step);

        // Execute the step
        const output = await this.executeStepWithTimeout(step, resolvedInputs);

        // Calculate duration
        const durationMs = Date.now() - stepStartTime;

        // Store successful result
        const result: StepResult = {
          stepKey: step.stepKey,
          success: true,
          output,
          durationMs,
          status: StepStatus.COMPLETED,
          retryAttempt,
          startedAt: new Date(stepStartTime),
          completedAt: new Date(),
        };

        this.stepStates.set(step.stepKey, result);
        if (this.context) {
          this.context.stepResults[step.stepKey] = result;
        }
        this.completedSteps.add(step.stepKey);

        // Log step completion
        await this.logStepEvent(step, LogLevel.INFO, `Step completed: ${step.stepName}`, {
          status: StepStatus.COMPLETED,
          durationMs,
          output,
        });

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (retryAttempt < step.retryCount && step.onError === ErrorHandling.RETRY) {
          retryAttempt++;

          // Log retry
          await this.logStepEvent(
            step,
            LogLevel.WARN,
            `Step failed, retrying (attempt ${retryAttempt + 1})`,
            {
              status: StepStatus.RUNNING,
              error: lastError.message,
              retryAttempt,
            },
          );

          // Wait before retry
          await this.delay(step.retryDelayMs * retryAttempt);
          continue;
        }

        // Handle the error
        await this.handleStepError(step, lastError, stepStartTime, retryAttempt);
        return;
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      await this.handleStepError(step, lastError, stepStartTime, retryAttempt);
    }
  }

  /**
   * Execute a step with timeout
   */
  private async executeStepWithTimeout(
    step: StepWithAgent,
    resolvedInputs: Record<string, unknown>,
  ): Promise<unknown> {
    const timeoutMs = step.timeoutMs || 30000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step "${step.stepKey}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.stepExecutor(step, this.context!, resolvedInputs)
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
   * Default step executor implementation
   *
   * This is a placeholder that will be replaced by actual agent executors
   * in Task Group 20.
   */
  private async defaultStepExecutor(
    step: StepWithAgent,
    _context: ExecutionContext,
    resolvedInputs: Record<string, unknown>,
  ): Promise<unknown> {
    logger.debug('[WorkflowExecutor] Executing step', {
      stepKey: step.stepKey,
      stepType: step.stepType,
      hasAgent: !!step.agent,
    });

    // Different behavior based on step type
    switch (step.stepType) {
      case WorkflowStepType.AGENT:
        // Placeholder for agent execution (Task Group 20)
        return {
          stepKey: step.stepKey,
          executed: true,
          agentId: step.agentId,
          inputs: resolvedInputs,
          timestamp: new Date().toISOString(),
        };

      case WorkflowStepType.CONDITION:
        // Evaluate condition from config
        const condition = (step.config as Record<string, unknown>)?.condition;
        const conditionResult = this.evaluateCondition(condition, resolvedInputs);
        return { conditionResult, evaluated: true };

      case WorkflowStepType.LOOP:
        // Loop execution placeholder
        const items = resolvedInputs.items;
        return {
          loopCompleted: true,
          itemCount: Array.isArray(items) ? items.length : 0,
        };

      case WorkflowStepType.PARALLEL:
        // Parallel execution placeholder
        return { parallelCompleted: true };

      case WorkflowStepType.WAIT:
        // Wait for specified duration
        const waitMs = ((step.config as Record<string, unknown>)?.waitMs as number) || 1000;
        await this.delay(waitMs);
        return { waited: true, waitMs };

      default:
        return {
          stepKey: step.stepKey,
          executed: true,
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: unknown, _inputs: Record<string, unknown>): boolean {
    if (typeof condition === 'boolean') {
      return condition;
    }

    if (typeof condition === 'string') {
      // Simple condition evaluation - check if input exists and is truthy
      const value = this.getValueFromPath(condition);
      return Boolean(value);
    }

    if (typeof condition === 'object' && condition !== null) {
      const condObj = condition as Record<string, unknown>;

      // Support simple comparison operators
      if ('eq' in condObj) {
        const [left, right] = condObj.eq as [string, unknown];
        return this.getValueFromPath(left) === right;
      }
      if ('neq' in condObj) {
        const [left, right] = condObj.neq as [string, unknown];
        return this.getValueFromPath(left) !== right;
      }
      if ('gt' in condObj) {
        const [left, right] = condObj.gt as [string, number];
        const leftVal = this.getValueFromPath(left);
        return typeof leftVal === 'number' && leftVal > right;
      }
      if ('lt' in condObj) {
        const [left, right] = condObj.lt as [string, number];
        const leftVal = this.getValueFromPath(left);
        return typeof leftVal === 'number' && leftVal < right;
      }
    }

    // Default to true if condition is not recognized
    return true;
  }

  // ===========================================================================
  // ERROR HANDLING (Task 19.7)
  // ===========================================================================

  /**
   * Handle a step execution error
   */
  private async handleStepError(
    step: StepWithAgent,
    error: Error,
    stepStartTime: number,
    retryAttempt: number,
  ): Promise<void> {
    const durationMs = Date.now() - stepStartTime;

    // Store failed result
    const result: StepResult = {
      stepKey: step.stepKey,
      success: false,
      output: null,
      error: error.message,
      errorStack: error.stack,
      durationMs,
      status: StepStatus.FAILED,
      retryAttempt,
      startedAt: new Date(stepStartTime),
      completedAt: new Date(),
    };

    this.stepStates.set(step.stepKey, result);
    if (this.context) {
      this.context.stepResults[step.stepKey] = result;
    }

    // Log step failure
    await this.logStepEvent(
      step,
      LogLevel.ERROR,
      `Step failed: ${step.stepName} - ${error.message}`,
      {
        status: StepStatus.FAILED,
        error: error.message,
        errorStack: error.stack,
        durationMs,
        retryAttempt,
      },
    );

    // Handle based on error strategy
    switch (step.onError) {
      case ErrorHandling.FAIL:
        // Mark as failed and stop execution
        this.failedSteps.add(step.stepKey);
        throw error;

      case ErrorHandling.CONTINUE:
        // Mark as failed but continue execution
        this.failedSteps.add(step.stepKey);
        logger.warn('[WorkflowExecutor] Step failed but continuing', {
          stepKey: step.stepKey,
          error: error.message,
        });
        break;

      case ErrorHandling.RETRY:
        // Already handled in executeStep retry loop
        this.failedSteps.add(step.stepKey);
        break;

      default:
        this.failedSteps.add(step.stepKey);
        throw error;
    }
  }

  /**
   * Handle execution-level error
   */
  private async handleExecutionError(error: unknown): Promise<ExecutionResult> {
    const durationMs = Date.now() - this.startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update execution status to FAILED
    if (this.execution) {
      try {
        await this.updateExecutionStatus(ExecutionStatus.FAILED, {
          completedAt: new Date(),
          durationMs,
          errorMessage,
          errorStack,
          stepsCompleted: this.completedSteps.size,
          stepsFailed: this.failedSteps.size,
        });

        // Log execution failure
        await this.logExecutionEvent(LogLevel.ERROR, `Workflow execution failed: ${errorMessage}`, {
          durationMs,
          stepsCompleted: this.completedSteps.size,
          stepsFailed: this.failedSteps.size,
          error: errorMessage,
          stack: errorStack,
        });
      } catch (logError) {
        logger.error('[WorkflowExecutor] Failed to update execution status', {
          error: logError instanceof Error ? logError.message : String(logError),
        });
      }
    }

    logger.error('[WorkflowExecutor] Execution failed', {
      executionId: this.execution?.id,
      workflowId: this.workflow?.id,
      error: errorMessage,
      durationMs,
    });

    // Collect outputs from completed steps
    const output: Record<string, unknown> = {};
    for (const [stepKey, result] of this.stepStates) {
      output[stepKey] = result.output;
    }

    return {
      executionId: this.execution?.id || '',
      workflowId: this.workflow?.id || '',
      status: ExecutionStatus.FAILED,
      output,
      error: errorMessage,
      errorStack,
      durationMs,
      stepsCompleted: this.completedSteps.size,
      stepsFailed: this.failedSteps.size,
      stepsSkipped: this.skippedSteps.size,
      stepsTotal: this.workflow?.steps.length || 0,
      startedAt: new Date(this.startTime),
      completedAt: new Date(),
    };
  }

  // ===========================================================================
  // DATABASE OPERATIONS
  // ===========================================================================

  /**
   * Load workflow from database
   */
  private async loadWorkflow(workflowId: string): Promise<void> {
    this.workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { position: 'asc' },
          include: { agent: true },
        },
      },
    });
  }

  /**
   * Load existing execution record
   */
  private async loadExecution(executionId: string): Promise<void> {
    this.execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
    });
  }

  /**
   * Create a new execution record
   */
  private async createExecution(
    userId: string,
    triggerType: TriggerType,
    inputs?: Record<string, unknown>,
  ): Promise<void> {
    this.execution = await this.prisma.execution.create({
      data: {
        workflowId: this.workflow!.id,
        userId,
        status: ExecutionStatus.PENDING,
        triggerType,
        inputData: (inputs || {}) as Prisma.InputJsonValue,
        stepsTotal: this.workflow!.steps.length,
      },
    });
  }

  /**
   * Update execution status and fields
   */
  private async updateExecutionStatus(
    status: ExecutionStatus,
    data: Partial<{
      startedAt: Date;
      completedAt: Date;
      durationMs: number;
      outputData: Prisma.InputJsonValue;
      errorMessage: string;
      errorStack: string;
      stepsCompleted: number;
      stepsFailed: number;
    }>,
  ): Promise<void> {
    if (!this.execution) {
      return;
    }

    await this.prisma.execution.update({
      where: { id: this.execution.id },
      data: {
        status,
        ...data,
      },
    });
  }

  /**
   * Log an execution event
   */
  private async logExecutionEvent(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.execution) {
      return;
    }

    try {
      await this.prisma.executionLog.create({
        data: {
          executionId: this.execution.id,
          level,
          message,
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logger.error('[WorkflowExecutor] Failed to create execution log', {
        executionId: this.execution.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Log a step event
   */
  private async logStepEvent(
    step: StepWithAgent,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.execution) {
      return;
    }

    try {
      await this.prisma.executionLog.create({
        data: {
          executionId: this.execution.id,
          workflowStepId: step.id,
          level,
          message,
          stepKey: step.stepKey,
          stepStatus: (metadata?.status as StepStatus) || null,
          stepDurationMs: (metadata?.durationMs as number) || null,
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logger.error('[WorkflowExecutor] Failed to create step log', {
        executionId: this.execution.id,
        stepKey: step.stepKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel the current execution
   */
  cancel(): void {
    this.isCancelled = true;
    logger.info('[WorkflowExecutor] Execution cancelled', {
      executionId: this.execution?.id,
    });
  }

  /**
   * Get current execution state
   */
  getState(): {
    executionId: string | null;
    workflowId: string | null;
    status: ExecutionStatus | null;
    completedSteps: string[];
    failedSteps: string[];
    skippedSteps: string[];
    isCancelled: boolean;
  } {
    return {
      executionId: this.execution?.id || null,
      workflowId: this.workflow?.id || null,
      status: this.execution?.status || null,
      completedSteps: Array.from(this.completedSteps),
      failedSteps: Array.from(this.failedSteps),
      skippedSteps: Array.from(this.skippedSteps),
      isCancelled: this.isCancelled,
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new WorkflowExecutor instance
 *
 * @param prisma - Prisma client instance
 * @param options - Optional executor options
 * @returns WorkflowExecutor instance
 */
export const createWorkflowExecutor = (
  prisma: PrismaClient,
  options?: Partial<WorkflowExecutorOptions>,
): WorkflowExecutor => {
  return new WorkflowExecutor({
    prisma,
    ...options,
  });
};

export default WorkflowExecutor;
