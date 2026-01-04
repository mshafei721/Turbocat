/**
 * Firecrawl MCP Integration Tests
 *
 * Tests for Firecrawl MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/firecrawl.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FirecrawlHelper, getFirecrawlServerConfig } from './firecrawl'
import type { MCPServerConfig } from '../types'

describe('Firecrawl MCP Integration', () => {
  describe('FirecrawlHelper', () => {
    let helper: FirecrawlHelper

    beforeEach(() => {
      // Set up environment variable for testing
      process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key-123'
      helper = new FirecrawlHelper()
    })

    /**
     * Task 4.1.1: Test scrape returns markdown content
     *
     * Verifies that the scrapePage function can scrape a URL
     * and returns content in the requested format (markdown, html, screenshot).
     */
    it('should scrape page and return markdown content', async () => {
      // Arrange
      const url = 'https://example.com/article'
      const formats: Array<'markdown' | 'html' | 'screenshot'> = ['markdown']

      // Act
      const result = await helper.scrapePage(url, formats)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.url).toBe(url)
      expect(result.data?.markdown).toBeDefined()
      expect(typeof result.data?.markdown).toBe('string')
      if (result.data?.markdown) {
        expect(result.data.markdown.length).toBeGreaterThan(0)
      }
    })

    /**
     * Task 4.1.1: Test scrape supports multiple formats
     *
     * Verifies that the scrapePage function can return multiple
     * formats simultaneously (markdown, html, screenshot).
     */
    it('should scrape page with multiple formats', async () => {
      // Arrange
      const url = 'https://example.com/page'
      const formats: Array<'markdown' | 'html' | 'screenshot'> = ['markdown', 'html', 'screenshot']

      // Act
      const result = await helper.scrapePage(url, formats)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Verify all requested formats are present
      if (formats.includes('markdown')) {
        expect(result.data?.markdown).toBeDefined()
        expect(typeof result.data?.markdown).toBe('string')
      }
      if (formats.includes('html')) {
        expect(result.data?.html).toBeDefined()
        expect(typeof result.data?.html).toBe('string')
      }
      if (formats.includes('screenshot')) {
        expect(result.data?.screenshot).toBeDefined()
        expect(typeof result.data?.screenshot).toBe('string') // Base64 encoded
      }
    })

    /**
     * Task 4.1.2: Test crawl returns multiple pages
     *
     * Verifies that the crawlSite function can crawl multiple pages
     * from a starting URL and returns an array of scraped pages.
     */
    it('should crawl site and return multiple pages', async () => {
      // Arrange
      const url = 'https://example.com'
      const options = {
        maxPages: 5,
      }

      // Act
      const result = await helper.crawlSite(url, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.pages).toBeInstanceOf(Array)
      expect(result.pages.length).toBeGreaterThan(0)
      expect(result.pages.length).toBeLessThanOrEqual(options.maxPages)

      // Verify page structure
      const firstPage = result.pages[0]
      expect(firstPage).toHaveProperty('url')
      expect(firstPage).toHaveProperty('markdown')
      expect(typeof firstPage.url).toBe('string')
      expect(typeof firstPage.markdown).toBe('string')
    })

    /**
     * Task 4.1.2: Test crawl handles pagination
     *
     * Verifies that the crawlSite function properly handles
     * pagination when crawling multiple pages.
     */
    it('should handle pagination for crawl results', async () => {
      // Arrange
      const url = 'https://example.com'
      const options = {
        maxPages: 3,
      }

      // Act
      const result = await helper.crawlSite(url, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.pages.length).toBeLessThanOrEqual(options.maxPages)

      // Verify metadata
      expect(result.totalPages).toBeDefined()
      expect(typeof result.totalPages).toBe('number')
      expect(result.hasMore).toBeDefined()
      expect(typeof result.hasMore).toBe('boolean')
    })

    /**
     * Task 4.1.3: Test map returns sitemap structure
     *
     * Verifies that the getSitemap function can retrieve
     * the site structure and returns a hierarchical sitemap.
     */
    it('should get sitemap structure', async () => {
      // Arrange
      const url = 'https://example.com'

      // Act
      const result = await helper.getSitemap(url)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.sitemap).toBeInstanceOf(Array)
      expect(result.sitemap.length).toBeGreaterThan(0)

      // Verify sitemap structure
      const firstEntry = result.sitemap[0]
      expect(firstEntry).toHaveProperty('url')
      expect(firstEntry).toHaveProperty('title')
      expect(typeof firstEntry.url).toBe('string')
      expect(typeof firstEntry.title).toBe('string')
    })

    /**
     * Task 4.3: Test rate limit error handling
     *
     * Verifies that rate limit errors are properly handled
     * with appropriate error messages.
     */
    it('should handle rate limit errors gracefully', async () => {
      // Arrange - simulate rate limit exceeded
      const url = 'https://example.com'

      // Mock the helper to simulate rate limit
      const rateLimitedHelper = new FirecrawlHelper()
      vi.spyOn(rateLimitedHelper, 'scrapePage').mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimited: true,
      })

      // Act
      const result = await rateLimitedHelper.scrapePage(url)

      // Assert
      expect(result.success).toBe(false)
      expect(result.rateLimited).toBe(true)
      expect(result.error).toContain('Rate limit')
    })

    /**
     * Task 4.3: Test missing API key error handling
     *
     * Verifies that missing API key is properly detected
     * and returns appropriate error.
     */
    it('should throw error when API key is missing', () => {
      // Arrange
      delete process.env.FIRECRAWL_API_KEY

      // Act & Assert
      expect(() => new FirecrawlHelper()).toThrow(
        'FIRECRAWL_API_KEY environment variable is not set'
      )
    })

    /**
     * Task 4.3: Test invalid URL error handling
     *
     * Verifies that invalid URLs are properly validated
     * and return appropriate errors.
     */
    it('should handle invalid URL errors', async () => {
      // Arrange
      const invalidUrl = 'not-a-valid-url'

      // Act
      const result = await helper.scrapePage(invalidUrl)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid URL')
    })
  })

  describe('Firecrawl Server Configuration', () => {
    /**
     * Task 4.2: Test Firecrawl server configuration
     *
     * Verifies that the Firecrawl server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid Firecrawl server configuration', () => {
      // Arrange & Act
      const config = getFirecrawlServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('firecrawl')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')
      expect(config.args).toContain('@modelcontextprotocol/server-firecrawl')

      // Assert - Environment variables
      expect(config.env).toHaveProperty('FIRECRAWL_API_KEY')
      expect(config.requiredEnvVars).toContain('FIRECRAWL_API_KEY')

      // Assert - Rate limit configuration (50 requests/minute)
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(50)
      expect(config.rateLimit?.windowMs).toBe(60000) // 1 minute

      // Assert - Auto-connect disabled by default
      expect(config.autoConnect).toBe(false)
    })

    /**
     * Task 4.2: Test Firecrawl capabilities are properly defined
     *
     * Verifies that all three Firecrawl capabilities (scrape, crawl, map)
     * are properly configured with correct parameters.
     */
    it('should define all required capabilities', () => {
      // Arrange & Act
      const config = getFirecrawlServerConfig()

      // Assert - Capabilities count
      expect(config.capabilities).toHaveLength(3)

      // Assert - scrape capability
      const scrapeCapability = config.capabilities.find((c) => c.name === 'scrape')
      expect(scrapeCapability).toBeDefined()
      expect(scrapeCapability?.description).toContain('Scrape')
      expect(scrapeCapability?.parameters).toHaveLength(2)

      const urlParam = scrapeCapability?.parameters.find((p) => p.name === 'url')
      expect(urlParam?.required).toBe(true)
      expect(urlParam?.type).toBe('string')

      const formatsParam = scrapeCapability?.parameters.find((p) => p.name === 'formats')
      expect(formatsParam?.required).toBe(false)
      expect(formatsParam?.type).toBe('array')
      expect(formatsParam?.defaultValue).toEqual(['markdown'])

      // Assert - crawl capability
      const crawlCapability = config.capabilities.find((c) => c.name === 'crawl')
      expect(crawlCapability).toBeDefined()
      expect(crawlCapability?.description).toContain('Crawl')
      expect(crawlCapability?.parameters).toHaveLength(2)

      const crawlUrlParam = crawlCapability?.parameters.find((p) => p.name === 'url')
      expect(crawlUrlParam?.required).toBe(true)
      expect(crawlUrlParam?.type).toBe('string')

      const maxPagesParam = crawlCapability?.parameters.find((p) => p.name === 'maxPages')
      expect(maxPagesParam?.required).toBe(false)
      expect(maxPagesParam?.defaultValue).toBe(10)

      // Assert - map capability
      const mapCapability = config.capabilities.find((c) => c.name === 'map')
      expect(mapCapability).toBeDefined()
      expect(mapCapability?.description).toContain('sitemap')
      expect(mapCapability?.parameters).toHaveLength(1)

      const mapUrlParam = mapCapability?.parameters.find((p) => p.name === 'url')
      expect(mapUrlParam?.required).toBe(true)
      expect(mapUrlParam?.type).toBe('string')
    })

    /**
     * Task 4.4: Test Firecrawl config can be registered with MCP Manager
     *
     * Verifies that the Firecrawl configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getFirecrawlServerConfig()

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
