/**
 * Context7 MCP Integration Tests
 *
 * Tests for Context7 MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/context7.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Context7Helper, getContext7ServerConfig } from './context7'
import type { MCPServerConfig } from '../types'

describe('Context7 MCP Integration', () => {
  describe('Context7Helper', () => {
    let helper: Context7Helper

    beforeEach(() => {
      helper = new Context7Helper()
    })

    /**
     * Task 7.1.1: Test Context7 resolveLibrary finds library ID
     *
     * Verifies that the resolveLibrary function can find a library ID
     * from a library name.
     */
    it('should resolve library name to Context7 ID', async () => {
      // Arrange
      const libraryName = 'react'

      // Act
      const result = await helper.findLibrary(libraryName)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.libraryId).toBeDefined()
      expect(typeof result.libraryId).toBe('string')
      expect(result.libraryId).toBeTruthy()
    })

    /**
     * Task 7.1.2: Test Context7 queryDocs returns documentation
     *
     * Verifies that the queryDocs function can search documentation
     * for a library and return relevant results.
     */
    it('should query documentation and return results', async () => {
      // Arrange
      const libraryId = 'react-12345'
      const query = 'useState hook'

      // Act
      const result = await helper.searchDocs(libraryId, query)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.docs).toBeInstanceOf(Array)
      expect(result.docs.length).toBeGreaterThan(0)

      // Verify doc structure
      const firstDoc = result.docs[0]
      expect(firstDoc).toHaveProperty('title')
      expect(firstDoc).toHaveProperty('content')
      expect(firstDoc).toHaveProperty('url')
      expect(typeof firstDoc.title).toBe('string')
      expect(typeof firstDoc.content).toBe('string')
    })

    /**
     * Task 7.4: Test getCodeSnippets retrieves code examples
     *
     * Verifies that the getSnippets function can fetch code
     * snippets for a specific library topic.
     */
    it('should retrieve code snippets for a library topic', async () => {
      // Arrange
      const libraryId = 'react-12345'
      const topic = 'hooks'

      // Act
      const result = await helper.getSnippets(libraryId, topic)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.snippets).toBeInstanceOf(Array)
      expect(result.snippets.length).toBeGreaterThan(0)

      // Verify snippet structure
      const firstSnippet = result.snippets[0]
      expect(firstSnippet).toHaveProperty('title')
      expect(firstSnippet).toHaveProperty('code')
      expect(firstSnippet).toHaveProperty('language')
      expect(typeof firstSnippet.code).toBe('string')
      expect(firstSnippet.code.length).toBeGreaterThan(0)
    })

    /**
     * Task 7.4: Test error handling for invalid library name
     *
     * Verifies that invalid library names are properly handled
     * with appropriate error messages.
     */
    it('should handle invalid library name gracefully', async () => {
      // Arrange
      const invalidLibraryName = ''

      // Act
      const result = await helper.findLibrary(invalidLibraryName)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Library name cannot be empty')
    })
  })

  describe('Context7 Server Configuration', () => {
    /**
     * Task 7.2: Test Context7 server configuration
     *
     * Verifies that the Context7 server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid Context7 server configuration', () => {
      // Arrange & Act
      const config = getContext7ServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('context7')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')

      // Assert - Environment variables (Context7 may not require API key)
      expect(config.env).toBeDefined()

      // Assert - Rate limit configuration
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(100)
      expect(config.rateLimit?.windowMs).toBe(60000) // 1 minute

      // Assert - Auto-connect enabled (no API key needed)
      expect(config.autoConnect).toBe(true)
    })

    /**
     * Task 7.2: Test Context7 capabilities are properly defined
     *
     * Verifies that all Context7 capabilities (resolveLibrary, queryDocs, getCodeSnippets)
     * are properly configured with correct parameters.
     */
    it('should define all required capabilities', () => {
      // Arrange & Act
      const config = getContext7ServerConfig()

      // Assert - Capabilities count
      expect(config.capabilities).toHaveLength(3)

      // Assert - resolveLibrary capability
      const resolveLibraryCapability = config.capabilities.find(c => c.name === 'resolveLibrary')
      expect(resolveLibraryCapability).toBeDefined()
      expect(resolveLibraryCapability?.description).toContain('library')
      expect(resolveLibraryCapability?.parameters).toHaveLength(1)

      const nameParam = resolveLibraryCapability?.parameters.find(p => p.name === 'name')
      expect(nameParam?.required).toBe(true)
      expect(nameParam?.type).toBe('string')

      // Assert - queryDocs capability
      const queryDocsCapability = config.capabilities.find(c => c.name === 'queryDocs')
      expect(queryDocsCapability).toBeDefined()
      expect(queryDocsCapability?.description).toContain('documentation')
      expect(queryDocsCapability?.parameters).toHaveLength(2)

      const libraryIdParam = queryDocsCapability?.parameters.find(p => p.name === 'libraryId')
      expect(libraryIdParam?.required).toBe(true)
      expect(libraryIdParam?.type).toBe('string')

      const queryParam = queryDocsCapability?.parameters.find(p => p.name === 'query')
      expect(queryParam?.required).toBe(true)
      expect(queryParam?.type).toBe('string')

      // Assert - getCodeSnippets capability
      const getSnippetsCapability = config.capabilities.find(c => c.name === 'getCodeSnippets')
      expect(getSnippetsCapability).toBeDefined()
      expect(getSnippetsCapability?.description).toContain('snippets')
      expect(getSnippetsCapability?.parameters).toHaveLength(2)

      const topicParam = getSnippetsCapability?.parameters.find(p => p.name === 'topic')
      expect(topicParam?.required).toBe(true)
      expect(topicParam?.type).toBe('string')
    })

    /**
     * Task 7.2: Test Context7 config conforms to MCPServerConfig type
     *
     * Verifies that the Context7 configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getContext7ServerConfig()

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
  })
})
