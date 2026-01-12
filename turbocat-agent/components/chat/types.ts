/**
 * Chat Component Types
 * Shared type definitions for chat components
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/types.ts
 */

import type { UIMessage } from 'ai'

// Re-export UIMessage type from AI SDK
export type { UIMessage }

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'data' | 'tool'

/**
 * Tool invocation state
 */
export type ToolState = 'pending' | 'running' | 'success' | 'error'

/**
 * Tool invocation/call
 */
export interface ToolInvocation {
  toolCallId?: string
  toolName: string
  state?: ToolState
  args?: Record<string, unknown>
  result?: unknown
}

/**
 * Reasoning step type
 */
export type ReasoningStepType = 'thought' | 'observation' | 'action'

/**
 * Reasoning step
 */
export interface ReasoningStep {
  type: ReasoningStepType
  content: string
  timestamp?: Date
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  apiEndpoint?: string
  model?: string
  temperature?: number
  maxTokens?: number
  tools?: Record<string, unknown>
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  timestamp?: Date
  tokenCount?: number
  model?: string
  finishReason?: 'stop' | 'length' | 'tool-calls' | 'content-filter' | 'error'
}

/**
 * Extended message with metadata
 */
export interface ExtendedMessage extends UIMessage {
  metadata?: MessageMetadata
  reasoning?: ReasoningStep[]
}

/**
 * Chat event handlers
 */
export interface ChatEventHandlers {
  onMessageSent?: (message: string) => void
  onMessageReceived?: (message: UIMessage) => void
  onToolCall?: (toolCall: ToolInvocation) => void
  onError?: (error: Error) => void
  onStop?: () => void
}

/**
 * Chat state
 */
export interface ChatState {
  messages: UIMessage[]
  isLoading: boolean
  error?: Error
  hasMore?: boolean
}

/**
 * Size variants
 */
export type SizeVariant = 'sm' | 'md' | 'lg'

/**
 * Color variants
 */
export type ColorVariant = 'primary' | 'accent' | 'muted' | 'destructive'

/**
 * Component props base
 */
export interface ComponentPropsBase {
  className?: string
  'data-testid'?: string
}

/**
 * Attachment type
 */
export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt?: Date
}

/**
 * Message attachment support
 */
export interface MessageWithAttachments extends UIMessage {
  attachments?: Attachment[]
}
