/**
 * Exa Search MCP Server Configuration
 *
 * Configuration and helper functions for the Exa Search MCP server.
 * Provides neural and keyword web search, similar page finding,
 * and full page content retrieval capabilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/exa.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * Search result from Exa
 */
export interface ExaSearchResult {
  url: string
  title: string
  snippet: string
  publishedDate?: string
  author?: string
  score?: number
}

/**
 * Similar page result from Exa
 */
export interface ExaSimilarPage {
  url: string
  title: string
  snippet?: string
  similarity: number
}

/**
 * Page content from Exa
 */
export interface ExaPageContent {
  url: string
  title: string
  content: string
  author?: string
  publishedDate?: string
}

/**
 * Search options for Exa
 */
export interface ExaSearchOptions {
  numResults?: number
  type?: 'neural' | 'keyword'
  category?: string
  startCrawlDate?: string
  endCrawlDate?: string
}

/**
 * Response from searchWeb
 */
export interface ExaSearchResponse {
  success: boolean
  results: ExaSearchResult[]
  error?: string
  rateLimited?: boolean
}

/**
 * Response from findSimilarPages
 */
export interface ExaFindSimilarResponse {
  success: boolean
  similarPages: ExaSimilarPage[]
  error?: string
  rateLimited?: boolean
}

/**
 * Response from getPageContents
 */
export interface ExaGetContentsResponse {
  success: boolean
  contents: ExaPageContent[]
  error?: string
  rateLimited?: boolean
}

/**
 * ExaSearchHelper
 *
 * Helper class for interacting with Exa Search API.
 * Provides type-safe methods for search, findSimilar, and getContents operations.
 */
export class ExaSearchHelper {
  private apiKey: string
  private rateLimitReset: number = 0
  private requestCount: number = 0
  private readonly MAX_REQUESTS = 100
  private readonly WINDOW_MS = 60000 // 1 minute

  constructor() {
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable is not set')
    }
    this.apiKey = apiKey
  }

  /**
   * Search the web using Exa's neural or keyword search
   *
   * @param query - Search query string
   * @param options - Search options (numResults, type, etc.)
   * @returns Search results with metadata
   */
  async searchWeb(query: string, options: ExaSearchOptions = {}): Promise<ExaSearchResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          results: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          results: [],
          error: 'Query cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to Exa
      // For now, we return mock data for testing
      const mockResults: ExaSearchResult[] = this.generateMockSearchResults(
        query,
        options.numResults || 10
      )

      return {
        success: true,
        results: mockResults,
      }
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Find pages similar to a given URL
   *
   * @param url - URL to find similar pages for
   * @param numResults - Number of similar pages to return (default: 10)
   * @returns Similar pages with similarity scores
   */
  async findSimilarPages(url: string, numResults: number = 10): Promise<ExaFindSimilarResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          similarPages: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!url || !this.isValidUrl(url)) {
        return {
          success: false,
          similarPages: [],
          error: 'Invalid URL provided',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to Exa
      // For now, we return mock data for testing
      const mockSimilarPages: ExaSimilarPage[] = this.generateMockSimilarPages(numResults)

      return {
        success: true,
        similarPages: mockSimilarPages,
      }
    } catch (error) {
      return {
        success: false,
        similarPages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get full content of web pages
   *
   * @param urls - Array of URLs to fetch content from
   * @returns Page contents with metadata
   */
  async getPageContents(urls: string[]): Promise<ExaGetContentsResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          contents: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!Array.isArray(urls) || urls.length === 0) {
        return {
          success: false,
          contents: [],
          error: 'URLs must be a non-empty array',
        }
      }

      // Validate each URL
      const invalidUrls = urls.filter(url => !this.isValidUrl(url))
      if (invalidUrls.length > 0) {
        return {
          success: false,
          contents: [],
          error: `Invalid URLs provided: ${invalidUrls.join(', ')}`,
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to Exa
      // For now, we return mock data for testing
      const mockContents: ExaPageContent[] = urls.map(url => this.generateMockPageContent(url))

      return {
        success: true,
        contents: mockContents,
      }
    } catch (error) {
      return {
        success: false,
        contents: [],
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
   * Generate mock search results for testing
   */
  private generateMockSearchResults(query: string, numResults: number): ExaSearchResult[] {
    return Array.from({ length: numResults }, (_, i) => ({
      url: `https://example.com/result-${i + 1}`,
      title: `Result ${i + 1}: ${query}`,
      snippet: `This is a snippet for result ${i + 1} about ${query}. It contains relevant information...`,
      publishedDate: new Date(Date.now() - i * 86400000).toISOString(),
      author: `Author ${i + 1}`,
      score: 0.9 - i * 0.05,
    }))
  }

  /**
   * Generate mock similar pages for testing
   */
  private generateMockSimilarPages(numResults: number): ExaSimilarPage[] {
    return Array.from({ length: numResults }, (_, i) => ({
      url: `https://example.com/similar-${i + 1}`,
      title: `Similar Page ${i + 1}`,
      snippet: `This is a similar page with related content...`,
      similarity: 0.95 - i * 0.05,
    }))
  }

  /**
   * Generate mock page content for testing
   */
  private generateMockPageContent(url: string): ExaPageContent {
    return {
      url,
      title: `Page Title for ${url}`,
      content: `# Full Page Content\n\nThis is the full content of the page at ${url}.\n\nIt includes multiple paragraphs and sections with detailed information about the topic.`,
      author: 'John Doe',
      publishedDate: new Date().toISOString(),
    }
  }
}

/**
 * Get Exa Search MCP server configuration
 *
 * Returns the complete configuration for the Exa Search MCP server
 * including command, environment variables, capabilities, and rate limits.
 *
 * @returns MCP server configuration for Exa
 */
export function getExaServerConfig(): MCPServerConfig {
  return {
    name: 'exa',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-exa'],
    env: {
      EXA_API_KEY: '${EXA_API_KEY}',
    },
    capabilities: [
      {
        name: 'search',
        description: 'Search the web using neural or keyword search',
        parameters: [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Search query',
          },
          {
            name: 'numResults',
            type: 'number',
            required: false,
            description: 'Number of results (default: 10)',
            defaultValue: 10,
          },
          {
            name: 'type',
            type: 'string',
            required: false,
            description: 'Search type: neural or keyword',
            defaultValue: 'neural',
          },
        ],
      },
      {
        name: 'findSimilar',
        description: 'Find pages similar to a given URL',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'URL to find similar pages for',
          },
          {
            name: 'numResults',
            type: 'number',
            required: false,
            description: 'Number of results',
            defaultValue: 10,
          },
        ],
      },
      {
        name: 'getContents',
        description: 'Get the full content of web pages',
        parameters: [
          {
            name: 'urls',
            type: 'array',
            required: true,
            description: 'Array of URLs to fetch content from',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    autoConnect: false,
    requiredEnvVars: ['EXA_API_KEY'],
  }
}
