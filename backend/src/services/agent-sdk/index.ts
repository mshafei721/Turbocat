/**
 * Claude Agent SDK Integration for Turbocat Backend
 *
 * This module provides a wrapper around the @anthropic-ai/claude-agent-sdk
 * for use in the Turbocat backend services.
 */

import { getAgentConfig, validateConfig, getSkillsPaths } from './config';
import type { AgentQueryOptions, AgentResult, AgentMessage, SkillDefinition } from './types';

export * from './types';
export { getAgentConfig, validateConfig, getSkillsPaths } from './config';

// Dynamic import for the Agent SDK to handle cases where it's not installed
let sdkQuery: typeof import('@anthropic-ai/claude-agent-sdk').query | null = null;

async function getQuery(): Promise<typeof import('@anthropic-ai/claude-agent-sdk').query> {
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

/**
 * Execute a query using the Claude Agent SDK
 */
export async function executeAgentQuery(
  prompt: string,
  options: AgentQueryOptions = {},
): Promise<AgentResult> {
  const config = getAgentConfig();
  const messages: AgentMessage[] = [];

  try {
    const query = await getQuery();
    const result = query({
      prompt,
      options: {
        model: options.model || config.defaultModel,
        cwd: options.cwd || process.cwd(),
        maxTurns: options.maxTurns,
        systemPrompt: options.systemPrompt,
        allowedTools: options.allowedTools || config.allowedTools,
        settingSources: options.settingSources || config.settingSources,
      },
    });

    let finalResult: string | undefined;
    let totalCostUsd: number | undefined;

    for await (const message of result) {
      if (message.type === 'text') {
        messages.push({
          type: 'text',
          content: message.text,
        });
      } else if (message.type === 'tool_use') {
        messages.push({
          type: 'tool_use',
          toolName: message.name,
          toolInput: message.input as Record<string, unknown>,
        });
      } else if (message.type === 'tool_result') {
        messages.push({
          type: 'tool_result',
          result: message.content,
        });
      } else if (message.type === 'result') {
        finalResult = message.result;
        totalCostUsd = message.total_cost_usd;
        messages.push({
          type: 'result',
          result: message.result,
          totalCostUsd: message.total_cost_usd,
        });
      }
    }

    return {
      success: true,
      result: finalResult,
      totalCostUsd,
      messages,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    messages.push({
      type: 'error',
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      messages,
    };
  }
}

/**
 * List available skills from both Anthropic and custom directories
 */
export async function listAvailableSkills(): Promise<SkillDefinition[]> {
  const { anthropic, custom } = getSkillsPaths();
  const skills: SkillDefinition[] = [];
  const fs = await import('fs').then((m) => m.promises);
  const path = await import('path');

  // Helper to scan a directory for skills
  async function scanSkillsDir(dir: string, source: 'anthropic' | 'custom'): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(dir, entry.name);
          const skillMdPath = path.join(skillPath, 'SKILL.md');

          try {
            const content = await fs.readFile(skillMdPath, 'utf-8');
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (frontmatterMatch && frontmatterMatch[1]) {
              const frontmatter = frontmatterMatch[1];
              const nameMatch = frontmatter.match(/name:\s*(.+)/);
              const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);

              skills.push({
                name: nameMatch?.[1]?.trim() ?? entry.name,
                description: descMatch?.[1]?.trim() ?? '',
                path: skillPath,
                source,
              });
            }
          } catch {
            // Skip if SKILL.md doesn't exist or can't be read
          }
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  await Promise.all([scanSkillsDir(anthropic, 'anthropic'), scanSkillsDir(custom, 'custom')]);

  return skills;
}

/**
 * Check if the Agent SDK is properly configured
 */
export function isAgentConfigured(): boolean {
  const { valid } = validateConfig();
  return valid;
}

/**
 * Create an AbortController for agent queries
 */
export function createAgentAbortController(): AbortController {
  return new AbortController();
}
