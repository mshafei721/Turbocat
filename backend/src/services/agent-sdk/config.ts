/**
 * Configuration for Claude Agent SDK
 */

import path from 'path';
import { AgentConfig } from './types';

/**
 * Get the backend directory
 * Backend is at: /backend/
 * .claude/ is at: /backend/.claude/
 */
function getBackendDir(): string {
  // Navigate from backend/src/services/agent-sdk/ to backend/
  return path.resolve(__dirname, '../../../');
}

/**
 * Get the Agent SDK configuration from environment variables
 */
export function getAgentConfig(): AgentConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const rootDir = getBackendDir();
  const skillsDir = process.env.SKILLS_DIRECTORY || path.join(rootDir, '.claude/skills');

  return {
    apiKey,
    defaultModel: process.env.AGENT_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929',
    skillsDirectory: skillsDir,
    settingSources: ['project'],
    allowedTools: [
      'Skill',
      'Read',
      'Write',
      'Edit',
      'Bash',
      'Glob',
      'Grep',
      'WebFetch',
      'WebSearch',
      'Task',
    ],
  };
}

/**
 * Validate that all required environment variables are set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get skills directory paths (absolute paths from repo root)
 */
export function getSkillsPaths(): { anthropic: string; custom: string } {
  const rootDir = getBackendDir();
  const baseDir = process.env.SKILLS_DIRECTORY || path.join(rootDir, '.claude/skills');

  return {
    anthropic: path.join(baseDir, 'anthropic'),
    custom: baseDir,
  };
}
