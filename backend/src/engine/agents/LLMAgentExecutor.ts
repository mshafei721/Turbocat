/**
 * LLM Agent Executor
 *
 * Executes LLM agents using Claude Agent SDK.
 * Claude is the ONLY supported AI provider.
 *
 * @module engine/agents/LLMAgentExecutor
 */

import { Agent, AgentType } from '@prisma/client';
import {
  AgentExecutor,
  AgentExecutorConfig,
  AgentExecutionInput,
  ExecutionMetrics,
} from './AgentExecutor';
import { getAgentConfig } from '../../services/agent-sdk/config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Message role for chat completions
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message format
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * LLM agent configuration in agent.config
 */
export interface LLMAgentConfig {
  /** Model to use (claude-sonnet-4-5-20250929, claude-opus-4-20250514, etc.) */
  model: string;
  /** System prompt */
  systemPrompt?: string;
  /** User prompt template (supports {{variable}} substitution) */
  promptTemplate?: string;
  /** Static messages to include */
  messages?: ChatMessage[];
  /** Temperature for response randomness (0-1, default: 0.7) */
  temperature?: number;
  /** Maximum tokens in response (default: 4096) */
  maxTokens?: number;
  /** Response format: text or json_object */
  responseFormat?: 'text' | 'json_object';
}

/**
 * LLM execution result
 */
export interface LLMExecutionResult {
  /** Generated response content */
  content: string;
  /** Parsed JSON if response format is json_object */
  parsedJson?: unknown;
  /** Model used */
  model: string;
  /** Finish reason */
  finishReason: string;
  /** Cost in USD (if available) */
  costUsd?: number;
}

// =============================================================================
// CLAUDE AGENT SDK LOADER
// =============================================================================

/**
 * Dynamically loaded SDK query function
 */
let sdkQuery: typeof import('@anthropic-ai/claude-agent-sdk').query | null = null;

/**
 * Get the SDK query function, loading it dynamically if needed
 */
async function getSDKQuery(): Promise<typeof import('@anthropic-ai/claude-agent-sdk').query> {
  if (!sdkQuery) {
    try {
      const sdk = await import('@anthropic-ai/claude-agent-sdk');
      sdkQuery = sdk.query;
    } catch {
      throw new Error(
        'Claude Agent SDK is not installed. Run: npm install @anthropic-ai/claude-agent-sdk',
      );
    }
  }
  return sdkQuery;
}

// =============================================================================
// LLM AGENT EXECUTOR
// =============================================================================

/**
 * Executor for LLM agents using Claude Agent SDK
 *
 * Features:
 * - Claude Agent SDK integration with full skill support
 * - Template variable substitution in prompts
 * - Automatic skill loading from .claude/skills/
 * - JSON response parsing
 */
export class LLMAgentExecutor extends AgentExecutor {
  private executionMetrics: ExecutionMetrics = {};

  constructor(config: AgentExecutorConfig = {}) {
    super(config);
  }

  /**
   * Get the agent type this executor handles
   */
  getAgentType(): AgentType {
    return AgentType.LLM;
  }

  /**
   * Execute the LLM agent using Claude Agent SDK
   */
  protected async executeInternal(input: AgentExecutionInput): Promise<LLMExecutionResult> {
    this.validateInput(input);

    const agentConfig = this.parseAgentConfig(input.agent, input.inputs);

    this.log('info', `Executing LLM agent with Claude`, {
      model: agentConfig.model,
      hasSystemPrompt: !!agentConfig.systemPrompt,
    });

    const result = await this.executeClaude(agentConfig, input.inputs);

    // Update metrics
    this.executionMetrics = {
      apiCalls: 1,
    };

    return result;
  }

  /**
   * Parse and validate agent configuration
   */
  private parseAgentConfig(agent: Agent, inputs: Record<string, unknown>): LLMAgentConfig {
    const config = agent.config as Record<string, unknown> | null;

    if (!config) {
      throw new Error('LLM agent requires configuration with model');
    }

    const model = (config.model as string) || 'claude-sonnet-4-5-20250929';

    // Process prompt template with variable substitution
    let promptTemplate = config.promptTemplate as string | undefined;
    if (promptTemplate) {
      promptTemplate = this.substituteVariables(promptTemplate, inputs);
    }

    // Process system prompt
    let systemPrompt = config.systemPrompt as string | undefined;
    if (systemPrompt) {
      systemPrompt = this.substituteVariables(systemPrompt, inputs);
    }

    return {
      model,
      systemPrompt,
      promptTemplate,
      messages: config.messages as ChatMessage[] | undefined,
      temperature: (config.temperature as number) ?? 0.7,
      maxTokens: (config.maxTokens as number) ?? 4096,
      responseFormat: config.responseFormat as 'text' | 'json_object' | undefined,
    };
  }

  /**
   * Substitute template variables in a string
   */
  private substituteVariables(template: string, inputs: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match: string, key: string) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(inputs, trimmedKey);
      if (value === undefined) {
        return match;
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return JSON.stringify(value);
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Execute using Claude Agent SDK
   *
   * This is the PRIMARY and ONLY way to process LLM requests.
   * Uses the Agent SDK with full skill support enabled by default.
   */
  private async executeClaude(
    config: LLMAgentConfig,
    inputs: Record<string, unknown>,
  ): Promise<LLMExecutionResult> {
    // Get SDK configuration (includes API key validation)
    const sdkConfig = getAgentConfig();

    // Get the SDK query function
    const query = await getSDKQuery();

    // Build the prompt from inputs
    let userPrompt = '';

    if (config.promptTemplate) {
      userPrompt = config.promptTemplate;
    } else if (inputs.prompt) {
      userPrompt =
        typeof inputs.prompt === 'string' ? inputs.prompt : JSON.stringify(inputs.prompt);
    } else if (inputs.message) {
      userPrompt =
        typeof inputs.message === 'string' ? inputs.message : JSON.stringify(inputs.message);
    }

    if (!userPrompt) {
      throw new Error('LLM agent requires a prompt or message input');
    }

    // Add system prompt context if provided
    if (config.systemPrompt) {
      userPrompt = `${config.systemPrompt}\n\n${userPrompt}`;
    }

    // Map config model to SDK model format
    const model = this.mapToSDKModel(config.model);

    this.log('debug', 'Calling Claude Agent SDK', {
      model,
      promptLength: userPrompt.length,
      hasSystemPrompt: !!config.systemPrompt,
      skillsEnabled: true,
      skillsDirectory: sdkConfig.skillsDirectory,
    });

    try {
      // Execute using the Claude Agent SDK with full capabilities
      const messageStream = query({
        prompt: userPrompt,
        options: {
          model,
          cwd: sdkConfig.skillsDirectory,
          systemPrompt: config.systemPrompt,
          allowedTools: sdkConfig.allowedTools,
          permissionMode: 'bypassPermissions',
        },
      });

      // Collect all messages and extract the final result
      let finalContent = '';
      let totalCost = 0;

      for await (const message of messageStream) {
        if (message.type === 'text') {
          finalContent += message.text;
        } else if (message.type === 'result') {
          finalContent = message.result;
          totalCost = message.total_cost_usd ?? 0;
        }
      }

      // Parse JSON if requested
      let parsedJson: unknown;
      if (config.responseFormat === 'json_object') {
        try {
          parsedJson = JSON.parse(finalContent);
        } catch {
          this.log('warn', 'Failed to parse JSON response from SDK');
        }
      }

      this.log('info', 'Claude Agent SDK call completed', {
        model,
        contentLength: finalContent.length,
        skillsUsed: true,
        totalCostUsd: totalCost,
      });

      return {
        content: finalContent,
        parsedJson,
        model: config.model,
        finishReason: 'stop',
        costUsd: totalCost,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Claude Agent SDK call failed', { error: errorMessage });
      throw new Error(`Claude Agent SDK error: ${errorMessage}`);
    }
  }

  /**
   * Map model names to SDK-compatible format
   */
  private mapToSDKModel(model: string): string {
    const modelMap: Record<string, string> = {
      // Legacy Claude 3 names -> Current SDK models
      'claude-3-opus': 'claude-opus-4-20250514',
      'claude-3-opus-20240229': 'claude-opus-4-20250514',
      'claude-3-sonnet': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929',
      'claude-3-haiku': 'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307': 'claude-3-5-sonnet-20241022',
      // Shorthand names
      sonnet: 'claude-sonnet-4-5-20250929',
      opus: 'claude-opus-4-20250514',
    };

    return modelMap[model] || model;
  }

  /**
   * Collect execution metrics
   */
  protected collectMetrics(): ExecutionMetrics | undefined {
    return this.executionMetrics;
  }

  /**
   * Validate input specific to LLM agents
   */
  protected validateInput(input: AgentExecutionInput): void {
    super.validateInput(input);

    if (input.agent.type !== AgentType.LLM) {
      throw new Error(`LLMAgentExecutor can only execute LLM agents, got: ${input.agent.type}`);
    }
  }
}

export default LLMAgentExecutor;
