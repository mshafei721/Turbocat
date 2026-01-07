/**
 * LLM Agent Executor
 *
 * Executes LLM agents that interact with large language models.
 * Supports OpenAI and Anthropic integrations.
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

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic';

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
  /** LLM provider to use */
  provider: LLMProvider;
  /** Model to use (e.g., gpt-4, claude-3-opus) */
  model: string;
  /** System prompt */
  systemPrompt?: string;
  /** User prompt template (supports {{variable}} substitution) */
  promptTemplate?: string;
  /** Static messages to include */
  messages?: ChatMessage[];
  /** Temperature for response randomness (0-2, default: 0.7) */
  temperature?: number;
  /** Maximum tokens in response (default: 1000) */
  maxTokens?: number;
  /** Top P sampling (0-1) */
  topP?: number;
  /** Frequency penalty (0-2) */
  frequencyPenalty?: number;
  /** Presence penalty (0-2) */
  presencePenalty?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Response format: text or json_object (OpenAI only) */
  responseFormat?: 'text' | 'json_object';
  /** API key override (defaults to env var) */
  apiKey?: string;
}

/**
 * LLM execution result
 */
export interface LLMExecutionResult {
  /** Generated response content */
  content: string;
  /** Parsed JSON if response format is json_object */
  parsedJson?: unknown;
  /** Provider used */
  provider: LLMProvider;
  /** Model used */
  model: string;
  /** Finish reason */
  finishReason: string;
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * OpenAI chat completion response format
 */
interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Anthropic message response format
 */
interface AnthropicResponse {
  id: string;
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// =============================================================================
// LLM AGENT EXECUTOR
// =============================================================================

/**
 * Executor for LLM agents
 *
 * Features:
 * - OpenAI integration (GPT-3.5, GPT-4, etc.)
 * - Anthropic integration (Claude models)
 * - Template variable substitution in prompts
 * - Token usage tracking
 * - Temperature and sampling controls
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
   * Execute the LLM agent
   */
  protected async executeInternal(input: AgentExecutionInput): Promise<LLMExecutionResult> {
    this.validateInput(input);

    const agentConfig = this.parseAgentConfig(input.agent, input.inputs);

    this.log('info', `Executing LLM agent`, {
      provider: agentConfig.provider,
      model: agentConfig.model,
      hasSystemPrompt: !!agentConfig.systemPrompt,
    });

    // Execute based on provider
    let result: LLMExecutionResult;

    switch (agentConfig.provider) {
      case 'openai':
        result = await this.executeOpenAI(agentConfig, input.inputs);
        break;
      case 'anthropic':
        result = await this.executeAnthropic(agentConfig, input.inputs);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${agentConfig.provider}`);
    }

    // Update metrics
    this.executionMetrics = {
      tokensUsed: {
        input: result.usage.promptTokens,
        output: result.usage.completionTokens,
        total: result.usage.totalTokens,
      },
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
      throw new Error('LLM agent requires configuration with provider and model');
    }

    const provider = (config.provider as string) || 'openai';
    if (!this.isValidProvider(provider)) {
      throw new Error(`Unsupported LLM provider: ${provider}. Supported: openai, anthropic`);
    }

    const model = config.model as string;
    if (!model) {
      throw new Error('LLM agent requires a model');
    }

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
      provider: provider,
      model,
      systemPrompt,
      promptTemplate,
      messages: config.messages as ChatMessage[] | undefined,
      temperature: (config.temperature as number) ?? 0.7,
      maxTokens: (config.maxTokens as number) ?? 1000,
      topP: config.topP as number | undefined,
      frequencyPenalty: config.frequencyPenalty as number | undefined,
      presencePenalty: config.presencePenalty as number | undefined,
      stopSequences: config.stopSequences as string[] | undefined,
      responseFormat: config.responseFormat as 'text' | 'json_object' | undefined,
      apiKey: config.apiKey as string | undefined,
    };
  }

  /**
   * Check if provider is valid
   */
  private isValidProvider(provider: string): provider is LLMProvider {
    return ['openai', 'anthropic'].includes(provider);
  }

  /**
   * Substitute template variables in a string
   */
  private substituteVariables(template: string, inputs: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(inputs, trimmedKey);
      return value !== undefined ? String(value) : match;
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
   * Execute using OpenAI API
   */
  private async executeOpenAI(
    config: LLMAgentConfig,
    inputs: Record<string, unknown>,
  ): Promise<LLMExecutionResult> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }

    // Build messages
    const messages: Array<{ role: string; content: string }> = [];

    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    }

    if (config.messages) {
      messages.push(...config.messages);
    }

    if (config.promptTemplate) {
      messages.push({ role: 'user', content: config.promptTemplate });
    } else if (inputs.prompt) {
      messages.push({ role: 'user', content: String(inputs.prompt) });
    } else if (inputs.message) {
      messages.push({ role: 'user', content: String(inputs.message) });
    }

    if (messages.length === 0) {
      throw new Error('LLM agent requires at least one message or prompt');
    }

    // Build request body
    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };

    if (config.topP !== undefined) {
      body.top_p = config.topP;
    }
    if (config.frequencyPenalty !== undefined) {
      body.frequency_penalty = config.frequencyPenalty;
    }
    if (config.presencePenalty !== undefined) {
      body.presence_penalty = config.presencePenalty;
    }
    if (config.stopSequences) {
      body.stop = config.stopSequences;
    }
    if (config.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    this.log('debug', 'Calling OpenAI API', {
      model: config.model,
      messageCount: messages.length,
    });

    // Make API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices[0]?.message?.content || '';
    const finishReason = data.choices[0]?.finish_reason || 'unknown';

    // Parse JSON if requested
    let parsedJson: unknown;
    if (config.responseFormat === 'json_object') {
      try {
        parsedJson = JSON.parse(content);
      } catch {
        this.log('warn', 'Failed to parse JSON response');
      }
    }

    this.log('info', 'OpenAI API call completed', {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      finishReason,
    });

    return {
      content,
      parsedJson,
      provider: 'openai',
      model: config.model,
      finishReason,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * Execute using Anthropic API
   */
  private async executeAnthropic(
    config: LLMAgentConfig,
    inputs: Record<string, unknown>,
  ): Promise<LLMExecutionResult> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.',
      );
    }

    // Build messages (Anthropic has different format than OpenAI)
    const messages: Array<{ role: string; content: string }> = [];

    // Anthropic uses system as a top-level parameter, not a message
    const systemPrompt = config.systemPrompt;

    if (config.messages) {
      // Filter out system messages (handled separately in Anthropic)
      messages.push(...config.messages.filter((m) => m.role !== 'system'));
    }

    if (config.promptTemplate) {
      messages.push({ role: 'user', content: config.promptTemplate });
    } else if (inputs.prompt) {
      messages.push({ role: 'user', content: String(inputs.prompt) });
    } else if (inputs.message) {
      messages.push({ role: 'user', content: String(inputs.message) });
    }

    if (messages.length === 0) {
      throw new Error('LLM agent requires at least one message or prompt');
    }

    // Build request body
    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }
    if (config.temperature !== undefined) {
      body.temperature = config.temperature;
    }
    if (config.topP !== undefined) {
      body.top_p = config.topP;
    }
    if (config.stopSequences) {
      body.stop_sequences = config.stopSequences;
    }

    this.log('debug', 'Calling Anthropic API', {
      model: config.model,
      messageCount: messages.length,
      hasSystem: !!systemPrompt,
    });

    // Make API request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    // Extract text content
    const textContent = data.content.find((c) => c.type === 'text');
    const content = textContent?.text || '';
    const finishReason = data.stop_reason || 'unknown';

    // Parse JSON if requested
    let parsedJson: unknown;
    if (config.responseFormat === 'json_object') {
      try {
        parsedJson = JSON.parse(content);
      } catch {
        this.log('warn', 'Failed to parse JSON response');
      }
    }

    const promptTokens = data.usage.input_tokens;
    const completionTokens = data.usage.output_tokens;

    this.log('info', 'Anthropic API call completed', {
      promptTokens,
      completionTokens,
      finishReason,
    });

    return {
      content,
      parsedJson,
      provider: 'anthropic',
      model: config.model,
      finishReason,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
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
