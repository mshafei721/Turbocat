/**
 * Sequential Thinking MCP Integration Tests
 *
 * Tests for Sequential Thinking MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/sequential-thinking.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SequentialThinkingHelper, getSequentialThinkingServerConfig } from './sequential-thinking'
import type { MCPServerConfig } from '../types'

describe('Sequential Thinking MCP Integration', () => {
  describe('SequentialThinkingHelper', () => {
    let helper: SequentialThinkingHelper

    beforeEach(() => {
      helper = new SequentialThinkingHelper()
    })

    /**
     * Task 7.1.3: Test Sequential Thinking processes thought steps
     *
     * Verifies that the processThought function can process a single
     * thought step in a multi-step reasoning chain.
     */
    it('should process a thought step in reasoning chain', async () => {
      // Arrange
      const thought = 'First, I need to analyze the problem requirements'
      const thoughtNumber = 1
      const totalThoughts = 5
      const nextThoughtNeeded = true

      // Act
      const result = await helper.processThought(
        thought,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.thoughtNumber).toBe(thoughtNumber)
      expect(result.totalThoughts).toBe(totalThoughts)
      expect(result.nextThoughtNeeded).toBe(nextThoughtNeeded)
      expect(result.processedThought).toBeDefined()
      expect(typeof result.processedThought).toBe('string')
    })

    /**
     * Task 7.1.4: Test Sequential Thinking supports branching
     *
     * Verifies that the Sequential Thinking server can handle
     * branching thought patterns with revisions.
     */
    it('should support branching and revisions in thought chain', async () => {
      // Arrange
      const thought = 'On second thought, let me revise the previous approach'
      const thoughtNumber = 3
      const totalThoughts = 5
      const nextThoughtNeeded = true
      const isRevision = true
      const revisesThought = 2
      const branchFromThought = 2
      const branchId = 'branch-a'

      // Act
      const result = await helper.processThought(
        thought,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded,
        {
          isRevision,
          revisesThought,
          branchFromThought,
          branchId,
        }
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.isRevision).toBe(true)
      expect(result.revisesThought).toBe(revisesThought)
      expect(result.branchFromThought).toBe(branchFromThought)
      expect(result.branchId).toBe(branchId)
      expect(result.processedThought).toBeDefined()
    })

    /**
     * Task 7.4: Test final thought in chain
     *
     * Verifies that the last thought in a chain is properly
     * processed with nextThoughtNeeded set to false.
     */
    it('should process final thought with no next thought needed', async () => {
      // Arrange
      const thought = 'Finally, I can conclude with the solution'
      const thoughtNumber = 5
      const totalThoughts = 5
      const nextThoughtNeeded = false

      // Act
      const result = await helper.processThought(
        thought,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.nextThoughtNeeded).toBe(false)
      expect(result.thoughtNumber).toBe(totalThoughts)
    })

    /**
     * Task 7.4: Test error handling for invalid thought parameters
     *
     * Verifies that invalid thought parameters are properly handled
     * with appropriate error messages.
     */
    it('should handle invalid thought parameters gracefully', async () => {
      // Arrange
      const emptyThought = ''
      const thoughtNumber = 1
      const totalThoughts = 5
      const nextThoughtNeeded = true

      // Act
      const result = await helper.processThought(
        emptyThought,
        thoughtNumber,
        totalThoughts,
        nextThoughtNeeded
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Thought content cannot be empty')
    })

    /**
     * Task 7.4: Test validation of thought sequence numbers
     *
     * Verifies that thought numbers are validated to be within
     * the total thought range.
     */
    it('should validate thought number is within valid range', async () => {
      // Arrange
      const thought = 'Test thought'
      const invalidThoughtNumber = 10
      const totalThoughts = 5
      const nextThoughtNeeded = true

      // Act
      const result = await helper.processThought(
        thought,
        invalidThoughtNumber,
        totalThoughts,
        nextThoughtNeeded
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Thought number must be between 1 and')
    })
  })

  describe('Sequential Thinking Server Configuration', () => {
    /**
     * Task 7.3: Test Sequential Thinking server configuration
     *
     * Verifies that the Sequential Thinking server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid Sequential Thinking server configuration', () => {
      // Arrange & Act
      const config = getSequentialThinkingServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('sequential-thinking')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')

      // Assert - Environment variables (no API key needed)
      expect(config.env).toBeDefined()

      // Assert - Rate limit configuration (higher limit as no external API)
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(1000)
      expect(config.rateLimit?.windowMs).toBe(60000) // 1 minute

      // Assert - Auto-connect enabled (no API key needed)
      expect(config.autoConnect).toBe(true)
    })

    /**
     * Task 7.3: Test Sequential Thinking capabilities are properly defined
     *
     * Verifies that the sequentialThinking capability is properly configured
     * with all required parameters.
     */
    it('should define sequentialThinking capability', () => {
      // Arrange & Act
      const config = getSequentialThinkingServerConfig()

      // Assert - Capabilities count
      expect(config.capabilities).toHaveLength(1)

      // Assert - sequentialThinking capability
      const seqThinkingCapability = config.capabilities.find(c => c.name === 'sequentialThinking')
      expect(seqThinkingCapability).toBeDefined()
      expect(seqThinkingCapability?.description).toContain('reasoning')

      // Assert - Required parameters
      const thoughtParam = seqThinkingCapability?.parameters.find(p => p.name === 'thought')
      expect(thoughtParam?.required).toBe(true)
      expect(thoughtParam?.type).toBe('string')

      const thoughtNumberParam = seqThinkingCapability?.parameters.find(p => p.name === 'thoughtNumber')
      expect(thoughtNumberParam?.required).toBe(true)
      expect(thoughtNumberParam?.type).toBe('number')

      const totalThoughtsParam = seqThinkingCapability?.parameters.find(p => p.name === 'totalThoughts')
      expect(totalThoughtsParam?.required).toBe(true)
      expect(totalThoughtsParam?.type).toBe('number')

      const nextThoughtNeededParam = seqThinkingCapability?.parameters.find(p => p.name === 'nextThoughtNeeded')
      expect(nextThoughtNeededParam?.required).toBe(true)
      expect(nextThoughtNeededParam?.type).toBe('boolean')

      // Assert - Optional parameters
      const isRevisionParam = seqThinkingCapability?.parameters.find(p => p.name === 'isRevision')
      expect(isRevisionParam?.required).toBe(false)
      expect(isRevisionParam?.type).toBe('boolean')

      const revisesThoughtParam = seqThinkingCapability?.parameters.find(p => p.name === 'revisesThought')
      expect(revisesThoughtParam?.required).toBe(false)
      expect(revisesThoughtParam?.type).toBe('number')

      const branchFromThoughtParam = seqThinkingCapability?.parameters.find(p => p.name === 'branchFromThought')
      expect(branchFromThoughtParam?.required).toBe(false)
      expect(branchFromThoughtParam?.type).toBe('number')

      const branchIdParam = seqThinkingCapability?.parameters.find(p => p.name === 'branchId')
      expect(branchIdParam?.required).toBe(false)
      expect(branchIdParam?.type).toBe('string')
    })

    /**
     * Task 7.3: Test Sequential Thinking config conforms to MCPServerConfig type
     *
     * Verifies that the Sequential Thinking configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getSequentialThinkingServerConfig()

      // Assert - Type validation
      const validateConfig = (cfg: MCPServerConfig): boolean => {
        return (
          typeof cfg.name === 'string' &&
          ['stdio', 'http', 'websocket'].includes(cfg.type) &&
          Array.isArray(cfg.capabilities) &&
          cfg.capabilities.length > 0
        )
      }

      expect(validateConfig(config)).toBe(true)
    })

    /**
     * Task 7.3: Test no required environment variables
     *
     * Verifies that Sequential Thinking has no required environment variables
     * since it doesn't use an external API.
     */
    it('should have no required environment variables', () => {
      // Arrange & Act
      const config = getSequentialThinkingServerConfig()

      // Assert
      expect(config.requiredEnvVars).toBeDefined()
      expect(config.requiredEnvVars).toHaveLength(0)
    })
  })
})
