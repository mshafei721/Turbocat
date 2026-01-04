/**
 * Firecrawl MCP Server Configuration
 *
 * Configuration and helper functions for the Firecrawl MCP server.
 * Provides web scraping, crawling, and sitemap generation capabilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/firecrawl.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * Scrape result from Firecrawl
 */
export interface FirecrawlScrapeData {
  url: string
  markdown?: string
  html?: string
  screenshot?: string
  title?: string
  metadata?: Record<string, unknown>
}

/**
 * Crawled page from Firecrawl
 */
export interface FirecrawlCrawledPage {
  url: string
  markdown: string
  title?: string
  metadata?: Record<string, unknown>
}

/**
 * Sitemap entry from Firecrawl
 */
export interface FirecrawlSitemapEntry {
  url: string
  title: string
  lastModified?: string
  changeFrequency?: string
  priority?: number
}

/**
 * Scrape options for Firecrawl
 */
export interface FirecrawlScrapeOptions {
  formats?: Array<'markdown' | 'html' | 'screenshot'>
}

/**
 * Crawl options for Firecrawl
 */
export interface FirecrawlCrawlOptions {
  maxPages?: number
  excludePaths?: string[]
  includePaths?: string[]
}

/**
 * Response from scrapePage
 */
export interface FirecrawlScrapeResponse {
  success: boolean
  data?: FirecrawlScrapeData
  error?: string
  rateLimited?: boolean
}

/**
 * Response from crawlSite
 */
export interface FirecrawlCrawlResponse {
  success: boolean
  pages: FirecrawlCrawledPage[]
  totalPages: number
  hasMore: boolean
  error?: string
  rateLimited?: boolean
}

/**
 * Response from getSitemap
 */
export interface FirecrawlSitemapResponse {
  success: boolean
  sitemap: FirecrawlSitemapEntry[]
  error?: string
  rateLimited?: boolean
}

/**
 * FirecrawlHelper
 *
 * Helper class for interacting with Firecrawl API.
 * Provides type-safe methods for scrape, crawl, and map operations.
 */
export class FirecrawlHelper {
  private apiKey: string
  private rateLimitReset: number = 0
  private requestCount: number = 0
  private readonly MAX_REQUESTS = 50
  private readonly WINDOW_MS = 60000 // 1 minute

  constructor() {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set')
    }
    this.apiKey = apiKey
  }

  /**
   * Scrape a single page and extract content
   *
   * @param url - URL to scrape
   * @param formats - Output formats (markdown, html, screenshot)
   * @returns Scraped content in requested formats
   */
  async scrapePage(
    url: string,
    formats: Array<'markdown' | 'html' | 'screenshot'> = ['markdown']
  ): Promise<FirecrawlScrapeResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate URL
      if (!url || !this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL provided',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to Firecrawl
      // For now, we return mock data for testing
      const mockData: FirecrawlScrapeData = this.generateMockScrapeData(url, formats)

      return {
        success: true,
        data: mockData,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Crawl multiple pages from a starting URL
   *
   * @param url - Starting URL to crawl
   * @param options - Crawl options (maxPages, excludePaths, etc.)
   * @returns Array of crawled pages
   */
  async crawlSite(url: string, options: FirecrawlCrawlOptions = {}): Promise<FirecrawlCrawlResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          pages: [],
          totalPages: 0,
          hasMore: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate URL
      if (!url || !this.isValidUrl(url)) {
        return {
          success: false,
          pages: [],
          totalPages: 0,
          hasMore: false,
          error: 'Invalid URL provided',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      const maxPages = options.maxPages || 10

      // In production, this would make an actual API call to Firecrawl
      // For now, we return mock data for testing
      const mockPages = this.generateMockCrawledPages(url, maxPages)
      const totalPages = mockPages.length
      const hasMore = totalPages >= maxPages

      return {
        success: true,
        pages: mockPages,
        totalPages,
        hasMore,
      }
    } catch (error) {
      return {
        success: false,
        pages: [],
        totalPages: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get the sitemap structure of a website
   *
   * @param url - Website URL
   * @returns Sitemap structure with all discovered URLs
   */
  async getSitemap(url: string): Promise<FirecrawlSitemapResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          sitemap: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate URL
      if (!url || !this.isValidUrl(url)) {
        return {
          success: false,
          sitemap: [],
          error: 'Invalid URL provided',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to Firecrawl
      // For now, we return mock data for testing
      const mockSitemap = this.generateMockSitemap(url)

      return {
        success: true,
        sitemap: mockSitemap,
      }
    } catch (error) {
      return {
        success: false,
        sitemap: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Check if currently rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now()

    // Reset window if expired
    if (now >= this.rateLimitReset) {
      this.requestCount = 0
      this.rateLimitReset = now + this.WINDOW_MS
    }

    return this.requestCount >= this.MAX_REQUESTS
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(): void {
    const now = Date.now()

    // Reset window if expired
    if (now >= this.rateLimitReset) {
      this.requestCount = 0
      this.rateLimitReset = now + this.WINDOW_MS
    }

    this.requestCount++
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Generate mock scrape data for testing
   */
  private generateMockScrapeData(
    url: string,
    formats: Array<'markdown' | 'html' | 'screenshot'>
  ): FirecrawlScrapeData {
    const data: FirecrawlScrapeData = {
      url,
      title: `Page Title for ${url}`,
      metadata: {
        description: 'A mock scraped page',
        author: 'Test Author',
      },
    }

    if (formats.includes('markdown')) {
      data.markdown = `# Page Title\n\nThis is the markdown content scraped from ${url}.\n\n## Section 1\n\nContent here...`
    }

    if (formats.includes('html')) {
      data.html = `<html><head><title>Page Title</title></head><body><h1>Page Title</h1><p>This is the HTML content from ${url}</p></body></html>`
    }

    if (formats.includes('screenshot')) {
      data.screenshot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }

    return data
  }

  /**
   * Generate mock crawled pages for testing
   */
  private generateMockCrawledPages(baseUrl: string, maxPages: number): FirecrawlCrawledPage[] {
    return Array.from({ length: Math.min(maxPages, 5) }, (_, i) => ({
      url: `${baseUrl}/page-${i + 1}`,
      title: `Page ${i + 1}`,
      markdown: `# Page ${i + 1}\n\nThis is the content of page ${i + 1} crawled from ${baseUrl}.`,
      metadata: {
        crawledAt: new Date().toISOString(),
      },
    }))
  }

  /**
   * Generate mock sitemap for testing
   */
  private generateMockSitemap(url: string): FirecrawlSitemapEntry[] {
    const baseUrl = new URL(url)
    return [
      {
        url: baseUrl.href,
        title: 'Home',
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl.href}/about`,
        title: 'About',
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl.href}/blog`,
        title: 'Blog',
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl.href}/contact`,
        title: 'Contact',
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ]
  }
}

/**
 * Get Firecrawl MCP server configuration
 *
 * Returns the complete configuration for the Firecrawl MCP server
 * including command, environment variables, capabilities, and rate limits.
 *
 * @returns MCP server configuration for Firecrawl
 */
export function getFirecrawlServerConfig(): MCPServerConfig {
  return {
    name: 'firecrawl',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-firecrawl'],
    env: {
      FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}',
    },
    capabilities: [
      {
        name: 'scrape',
        description: 'Scrape a single page and extract content',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'URL to scrape',
          },
          {
            name: 'formats',
            type: 'array',
            required: false,
            description: 'Output formats: markdown, html, screenshot',
            defaultValue: ['markdown'],
          },
        ],
      },
      {
        name: 'crawl',
        description: 'Crawl multiple pages from a starting URL',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'Starting URL to crawl',
          },
          {
            name: 'maxPages',
            type: 'number',
            required: false,
            description: 'Maximum pages to crawl',
            defaultValue: 10,
          },
        ],
      },
      {
        name: 'map',
        description: 'Get the sitemap structure of a website',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'Website URL',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
    },
    autoConnect: false,
    requiredEnvVars: ['FIRECRAWL_API_KEY'],
  }
}
