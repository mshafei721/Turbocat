/**
 * Type definitions for Claude Agent SDK integration
 */

export interface AgentQueryOptions {
  /** Model to use for the query */
  model?: 'claude-sonnet-4-5-20250929' | 'claude-opus-4-20250514' | 'claude-3-5-sonnet-20241022';
  /** Working directory for file operations */
  cwd?: string;
  /** Maximum number of turns for the conversation */
  maxTurns?: number;
  /** System prompt to prepend */
  systemPrompt?: string;
  /** Allowed tools for the agent */
  allowedTools?: string[];
  /** Skill sources to load */
  settingSources?: ('project' | 'user' | 'global')[];
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface AgentMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'result' | 'error';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  result?: string;
  totalCostUsd?: number;
  error?: string;
}

export interface AgentResult {
  success: boolean;
  result?: string;
  totalCostUsd?: number;
  messages: AgentMessage[];
  error?: string;
}

export interface SkillDefinition {
  name: string;
  description: string;
  path: string;
  source: 'anthropic' | 'custom';
}

export interface AgentConfig {
  apiKey: string;
  defaultModel: string;
  skillsDirectory: string;
  settingSources: ('project' | 'user' | 'global')[];
  allowedTools: string[];
}
