/**
 * Configuration for Claude Agent SDK (Client-side)
 *
 * Note: The .claude/ folder is in the backend directory.
 * Frontend is at: /turbocat-agent/
 * Backend is at: /backend/
 * Skills are at: /backend/.claude/skills/
 */

import type { AgentConfig } from './types'

/**
 * Get the skills directory path relative to frontend
 * Frontend (turbocat-agent) references backend's .claude folder
 */
export function getSkillsDirectoryPath(): string {
  // From turbocat-agent, navigate to backend/.claude/skills
  return process.env.SKILLS_DIRECTORY || '../backend/.claude/skills'
}

/**
 * Default agent configuration
 * Note: API key should be provided server-side, never exposed to client
 */
export const DEFAULT_AGENT_CONFIG: Omit<AgentConfig, 'apiKey'> = {
  defaultModel: 'claude-sonnet-4-5-20250929',
  skillsDirectory: '../backend/.claude/skills',
  settingSources: ['project'],
  allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Task'],
}

/**
 * Available models for selection in UI
 */
export const AVAILABLE_MODELS = [
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Balanced performance and cost',
    isPro: false,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Most capable model',
    isPro: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Previous generation, reliable',
    isPro: false,
  },
] as const

/**
 * Get skills directory paths (relative to frontend)
 * Points to /backend/.claude/skills/ from /turbocat-agent/
 */
export function getSkillsPaths(): { anthropic: string; custom: string } {
  const baseDir = getSkillsDirectoryPath()

  return {
    anthropic: `${baseDir}/anthropic`,
    custom: baseDir,
  }
}

/**
 * Check if we're in a client-side environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if we're in a server-side environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}
