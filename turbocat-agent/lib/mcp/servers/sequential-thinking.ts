/**
 * Sequential Thinking MCP Server Configuration
 *
 * Configuration and helper functions for the Sequential Thinking MCP server.
 * Provides multi-step reasoning capabilities with support for branching
 * and thought revision.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/sequential-thinking.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * Options for thought processing
 */
export interface ThoughtProcessingOptions {
  isRevision?: boolean
  revisesThought?: number
  branchFromThought?: number
  branchId?: string
}

/**
 * Response from processThought
 */
export interface SequentialThinkingResponse {
  success: boolean
  thoughtNumber: number
  totalThoughts: number
  nextThoughtNeeded: boolean
  processedThought?: string
  isRevision?: boolean
  revisesThought?: number
  branchFromThought?: number
  branchId?: string
  error?: string
}

/**
 * SequentialThinkingHelper
 *
 * Helper class for processing sequential thoughts in a reasoning chain.
 * Supports multi-step reasoning, thought revision, and branching patterns.
 */
export class SequentialThinkingHelper {
  /**
   * Process a thought as part of a multi-step reasoning chain
   *
   * @param thought - Current thought content
   * @param thoughtNumber - Sequence number of this thought (1-based)
   * @param totalThoughts - Total expected thoughts in chain
   * @param nextThoughtNeeded - Whether another thought is needed
   * @param options - Optional parameters for branching and revision
   * @returns Processed thought information
   */
  async processThought(
    thought: string,
    thoughtNumber: number,
    totalThoughts: number,
    nextThoughtNeeded: boolean,
    options: ThoughtProcessingOptions = {}
  ): Promise<SequentialThinkingResponse> {
    try {
      // Validate thought content
      if (!thought || thought.trim().length === 0) {
        return {
          success: false,
          thoughtNumber,
          totalThoughts,
          nextThoughtNeeded,
          error: 'Thought content cannot be empty',
        }
      }

      // Validate thought number
      if (thoughtNumber < 1 || thoughtNumber > totalThoughts) {
        return {
          success: false,
          thoughtNumber,
          totalThoughts,
          nextThoughtNeeded,
          error: `Thought number must be between 1 and ${totalThoughts}`,
        }
      }

      // Validate total thoughts
      if (totalThoughts < 1) {
        return {
          success: false,
          thoughtNumber,
          totalThoughts,
          nextThoughtNeeded,
          error: 'Total thoughts must be at least 1',
        }
      }

      // Validate revision parameters
      if (options.isRevision && !options.revisesThought) {
        return {
          success: false,
          thoughtNumber,
          totalThoughts,
          nextThoughtNeeded,
          error: 'Revision must specify which thought it revises',
        }
      }

      // Validate revises thought number
      if (options.revisesThought !== undefined) {
        if (options.revisesThought < 1 || options.revisesThought >= thoughtNumber) {
          return {
            success: false,
            thoughtNumber,
            totalThoughts,
            nextThoughtNeeded,
            error: 'Revises thought must be a previous thought number',
          }
        }
      }

      // Validate branch parameters
      if (options.branchFromThought !== undefined) {
        if (options.branchFromThought < 1 || options.branchFromThought >= thoughtNumber) {
          return {
            success: false,
            thoughtNumber,
            totalThoughts,
            nextThoughtNeeded,
            error: 'Branch must be from a previous thought number',
          }
        }
      }

      // In production, this would process the thought through the MCP server
      // For now, we return a processed version for testing
      const processedThought = this.formatThought(thought, thoughtNumber, totalThoughts, options)

      return {
        success: true,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded,
        processedThought,
        isRevision: options.isRevision,
        revisesThought: options.revisesThought,
        branchFromThought: options.branchFromThought,
        branchId: options.branchId,
      }
    } catch (error) {
      return {
        success: false,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Format a thought with metadata
   *
   * @param thought - Thought content
   * @param thoughtNumber - Thought sequence number
   * @param totalThoughts - Total thoughts in chain
   * @param options - Processing options
   * @returns Formatted thought string
   */
  private formatThought(
    thought: string,
    thoughtNumber: number,
    totalThoughts: number,
    options: ThoughtProcessingOptions
  ): string {
    let formatted = `[Thought ${thoughtNumber}/${totalThoughts}]`

    if (options.isRevision && options.revisesThought) {
      formatted += ` [Revision of Thought ${options.revisesThought}]`
    }

    if (options.branchId) {
      formatted += ` [Branch: ${options.branchId}]`
    }

    if (options.branchFromThought) {
      formatted += ` [Branched from Thought ${options.branchFromThought}]`
    }

    formatted += `\n${thought}`

    return formatted
  }

  /**
   * Validate a complete thought chain
   *
   * @param thoughts - Array of thoughts in the chain
   * @returns Validation result
   */
  async validateThoughtChain(
    thoughts: Array<{
      thought: string
      thoughtNumber: number
      totalThoughts: number
    }>
  ): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    if (thoughts.length === 0) {
      errors.push('Thought chain cannot be empty')
      return { isValid: false, errors }
    }

    // Check for consistent total thoughts
    const totalThoughts = thoughts[0].totalThoughts
    for (const t of thoughts) {
      if (t.totalThoughts !== totalThoughts) {
        errors.push(
          `Inconsistent total thoughts: expected ${totalThoughts}, got ${t.totalThoughts} at thought ${t.thoughtNumber}`
        )
      }
    }

    // Check for sequential thought numbers
    const numbers = thoughts.map(t => t.thoughtNumber).sort((a, b) => a - b)
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] !== i + 1) {
        errors.push(`Missing thought number ${i + 1} in sequence`)
      }
    }

    // Check for duplicate thought numbers
    const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate thought numbers found: ${duplicates.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Get Sequential Thinking MCP server configuration
 *
 * Returns the complete configuration for the Sequential Thinking MCP server
 * including command, capabilities, and rate limits.
 *
 * @returns MCP server configuration for Sequential Thinking
 */
export function getSequentialThinkingServerConfig(): MCPServerConfig {
  return {
    name: 'sequential-thinking',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    env: {},
    capabilities: [
      {
        name: 'sequentialThinking',
        description: 'Process a thought as part of a multi-step reasoning chain',
        parameters: [
          {
            name: 'thought',
            type: 'string',
            required: true,
            description: 'Current thought content',
          },
          {
            name: 'thoughtNumber',
            type: 'number',
            required: true,
            description: 'Thought sequence number',
          },
          {
            name: 'totalThoughts',
            type: 'number',
            required: true,
            description: 'Total expected thoughts',
          },
          {
            name: 'nextThoughtNeeded',
            type: 'boolean',
            required: true,
            description: 'Whether another thought is needed',
          },
          {
            name: 'isRevision',
            type: 'boolean',
            required: false,
            description: 'Whether this is a revision of a previous thought',
          },
          {
            name: 'revisesThought',
            type: 'number',
            required: false,
            description: 'Which thought number this revises',
          },
          {
            name: 'branchFromThought',
            type: 'number',
            required: false,
            description: 'Which thought to branch from',
          },
          {
            name: 'branchId',
            type: 'string',
            required: false,
            description: 'ID for this branch of thinking',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000, // 1 minute (no external API)
    },
    autoConnect: true, // No API key required
    requiredEnvVars: [],
  }
}
