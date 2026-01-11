/**
 * Type declarations for @anthropic-ai/claude-agent-sdk
 *
 * Based on actual SDK exports and function signatures.
 */

declare module '@anthropic-ai/claude-agent-sdk' {
  export interface QueryOptions {
    model?: string;
    cwd?: string;
    maxTurns?: number;
    systemPrompt?: string | { type: 'preset'; append?: string };
    allowedTools?: string[];
    settingSources?: ('project' | 'user' | 'global')[];
    permissionMode?: 'default' | 'bypassPermissions' | 'plan';
    pathToClaudeCodeExecutable?: string;
    sandbox?: boolean;
    signal?: AbortSignal;
    [key: string]: unknown; // Allow additional properties
  }

  export interface QueryParams {
    prompt: string;
    options?: QueryOptions;
  }

  export interface TextMessage {
    type: 'text';
    text: string;
  }

  export interface ToolUseMessage {
    type: 'tool_use';
    name: string;
    input: unknown;
  }

  export interface ToolResultMessage {
    type: 'tool_result';
    content: string;
  }

  export interface ResultMessage {
    type: 'result';
    result: string;
    total_cost_usd?: number;
  }

  export type Message = TextMessage | ToolUseMessage | ToolResultMessage | ResultMessage;

  /**
   * Query the Claude Agent SDK
   * Returns an async iterable of messages
   */
  export function query(params: QueryParams): AsyncIterable<Message>;

  /**
   * Create MCP server from SDK
   */
  export function createSdkMcpServer(): unknown;

  /**
   * Tool definition helper
   */
  export function tool(definition: unknown): unknown;

  /**
   * Abort error class
   */
  export class AbortError extends Error {}

  /**
   * Exit reasons enumeration
   */
  export const EXIT_REASONS: Record<string, string>;

  /**
   * Hook events enumeration
   */
  export const HOOK_EVENTS: Record<string, string>;

  // Unstable v2 APIs
  export function unstable_v2_createSession(options?: unknown): unknown;
  export function unstable_v2_prompt(session: unknown, prompt: string): unknown;
  export function unstable_v2_resumeSession(sessionId: string): unknown;
}
