/**
 * Claude Agent SDK Integration for Turbocat Frontend
 *
 * This module provides client-side utilities and hooks for interacting
 * with the Claude Agent SDK through the backend API.
 */

// Re-export types
export type {
  AgentQueryOptions,
  AgentResult,
  AgentMessage,
  SkillDefinition,
  AgentConfig,
  AgentStreamEvent,
} from './types'

// Re-export config
export {
  DEFAULT_AGENT_CONFIG,
  AVAILABLE_MODELS,
  getSkillsPaths,
  getSkillsDirectoryPath,
  isClient,
  isServer,
} from './config'

// Re-export client hooks (these are client-only)
export { useAgentQuery, useAgentStream, useSkills } from './client'
