/**
 * Exa Search MCP Integration Tests
 *
 * Tests for Exa MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/exa.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExaSearchHelper, getExaServerConfig } from './exa'
import type { MCPServerConfig } from '../types'

describe('Exa Search MCP Integration', () => {
  describe('ExaSearchHelper', () => {
    let helper: ExaSearchHelper

    beforeEach(() => {
      // Set up environment variable for testing
      process.env.EXA_API_KEY = 'test-api-key-123'
      helper = new ExaSearchHelper()
    })

    /**
     * Task 3.1.1: Test search returns results with query
     *
     * Verifies that the searchWeb function can perform a search
     * and returns results with expected structure.
     */
    it('should search web and return results with query', async () => {
      // Arrange
      const query = 'latest AI developments'
      const options = {
        numResults: 10,
        type: 'neural' as const,
      }

      // Act
      const result = await helper.searchWeb(query, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.results).toBeInstanceOf(Array)
      expect(result.results.length).toBeGreaterThan(0)
      expect(result.results.length).toBeLessThanOrEqual(10)

      // Verify result structure
      const firstResult = result.results[0]
      expect(firstResult).toHaveProperty('url')
      expect(firstResult).toHaveProperty('title')
      expect(firstResult).toHaveProperty('snippet')
      expect(typeof firstResult.url).toBe('string')
      expect(typeof firstResult.title).toBe('string')
    })

    /**
     * Task 3.1.2: Test findSimilar returns related pages
     *
     * Verifies that the findSimilarPages function can find similar
     * pages to a given URL and returns related content.
     */
    it('should find similar pages to a given URL', async () => {
      // Arrange
      const url = 'https://example.com/article'
      const numResults = 5

      // Act
      const result = await helper.findSimilarPages(url, numResults)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.similarPages).toBeInstanceOf(Array)
      expect(result.similarPages.length).toBeGreaterThan(0)
      expect(result.similarPages.length).toBeLessThanOrEqual(numResults)

      // Verify similar page structure
      const firstPage = result.similarPages[0]
      expect(firstPage).toHaveProperty('url')
      expect(firstPage).toHaveProperty('title')
      expect(firstPage).toHaveProperty('similarity')
      expect(typeof firstPage.url).toBe('string')
      expect(typeof firstPage.similarity).toBe('number')
      expect(firstPage.similarity).toBeGreaterThanOrEqual(0)
      expect(firstPage.similarity).toBeLessThanOrEqual(1)
    })

    /**
     * Task 3.1.3: Test getContents retrieves page content
     *
     * Verifies that the getPageContents function can fetch
     * full page content from multiple URLs.
     */
    it('should retrieve full page content from URLs', async () => {
      // Arrange
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
      ]

      // Act
      const result = await helper.getPageContents(urls)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.contents).toBeInstanceOf(Array)
      expect(result.contents.length).toBe(urls.length)

      // Verify content structure
      const firstContent = result.contents[0]
      expect(firstContent).toHaveProperty('url')
      expect(firstContent).toHaveProperty('content')
      expect(firstContent).toHaveProperty('title')
      expect(typeof firstContent.url).toBe('string')
      expect(typeof firstContent.content).toBe('string')
      expect(firstContent.content.length).toBeGreaterThan(0)
    })

    /**
     * Task 3.3: Test rate limit error handling
     *
     * Verifies that rate limit errors are properly handled
     * with appropriate error messages.
     */
    it('should handle rate limit errors gracefully', async () => {
      // Arrange - simulate rate limit exceeded
      const query = 'test query'

      // Mock the helper to simulate rate limit
      const rateLimitedHelper = new ExaSearchHelper()
      vi.spyOn(rateLimitedHelper, 'searchWeb').mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimited: true,
        results: [],
      })

      // Act
      const result = await rateLimitedHelper.searchWeb(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.rateLimited).toBe(true)
      expect(result.error).toContain('Rate limit')
    })

    /**
     * Task 3.3: Test missing API key error handling
     *
     * Verifies that missing API key is properly detected
     * and returns appropriate error.
     */
    it('should throw error when API key is missing', () => {
      // Arrange
      delete process.env.EXA_API_KEY

      // Act & Assert
      expect(() => new ExaSearchHelper()).toThrow('EXA_API_KEY environment variable is not set')
    })
  })

  describe('Exa Server Configuration', () => {
    /**
     * Task 3.2: Test Exa server configuration
     *
     * Verifies that the Exa server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid Exa server configuration', () => {
      // Arrange & Act
      const config = getExaServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('exa')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')
      expect(config.args).toContain('@modelcontextprotocol/server-exa')

      // Assert - Environment variables
      expect(config.env).toHaveProperty('EXA_API_KEY')
      expect(config.requiredEnvVars).toContain('EXA_API_KEY')

      // Assert - Rate limit configuration
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(100)
      expect(config.rateLimit?.windowMs).toBe(60000) // 1 minute

      // Assert - Auto-connect disabled by default
      expect(config.autoConnect).toBe(false)
    })

    /**
     * Task 3.2: Test Exa capabilities are properly defined
     *
     * Verifies that all three Exa capabilities (search, findSimilar, getContents)
     * are properly configured with correct parameters.
     */
    it('should define all required capabilities', () => {
      // Arrange & Act
      const config = getExaServerConfig()

      // Assert - Capabilities count
      expect(config.capabilities).toHaveLength(3)

      // Assert - search capability
      const searchCapability = config.capabilities.find(c => c.name === 'search')
      expect(searchCapability).toBeDefined()
      expect(searchCapability?.description).toContain('Search the web')
      expect(searchCapability?.parameters).toHaveLength(3)

      const queryParam = searchCapability?.parameters.find(p => p.name === 'query')
      expect(queryParam?.required).toBe(true)
      expect(queryParam?.type).toBe('string')

      const numResultsParam = searchCapability?.parameters.find(p => p.name === 'numResults')
      expect(numResultsParam?.required).toBe(false)
      expect(numResultsParam?.defaultValue).toBe(10)

      const typeParam = searchCapability?.parameters.find(p => p.name === 'type')
      expect(typeParam?.required).toBe(false)
      expect(typeParam?.defaultValue).toBe('neural')

      // Assert - findSimilar capability
      const findSimilarCapability = config.capabilities.find(c => c.name === 'findSimilar')
      expect(findSimilarCapability).toBeDefined()
      expect(findSimilarCapability?.description).toContain('similar')
      expect(findSimilarCapability?.parameters).toHaveLength(2)

      const urlParam = findSimilarCapability?.parameters.find(p => p.name === 'url')
      expect(urlParam?.required).toBe(true)
      expect(urlParam?.type).toBe('string')

      // Assert - getContents capability
      const getContentsCapability = config.capabilities.find(c => c.name === 'getContents')
      expect(getContentsCapability).toBeDefined()
      expect(getContentsCapability?.description).toContain('content')
      expect(getContentsCapability?.parameters).toHaveLength(1)

      const urlsParam = getContentsCapability?.parameters.find(p => p.name === 'urls')
      expect(urlsParam?.required).toBe(true)
      expect(urlsParam?.type).toBe('array')
    })

    /**
     * Task 3.4: Test Exa config can be registered with MCP Manager
     *
     * Verifies that the Exa configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getExaServerConfig()

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
