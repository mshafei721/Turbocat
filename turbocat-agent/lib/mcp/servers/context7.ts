/**
 * Context7 MCP Server Configuration
 *
 * Configuration and helper functions for the Context7 MCP server.
 * Provides library documentation lookup, code snippet retrieval,
 * and contextual help for development libraries.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/context7.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * Context7 library information
 */
export interface Context7Library {
  id: string
  name: string
  description?: string
}

/**
 * Context7 documentation item
 */
export interface Context7Documentation {
  title: string
  content: string
  url: string
  relevance?: number
}

/**
 * Context7 code snippet
 */
export interface Context7CodeSnippet {
  title: string
  code: string
  language: string
  description?: string
}

/**
 * Response from findLibrary
 */
export interface Context7FindLibraryResponse {
  success: boolean
  libraryId?: string
  library?: Context7Library
  error?: string
}

/**
 * Response from searchDocs
 */
export interface Context7SearchDocsResponse {
  success: boolean
  docs: Context7Documentation[]
  error?: string
}

/**
 * Response from getSnippets
 */
export interface Context7GetSnippetsResponse {
  success: boolean
  snippets: Context7CodeSnippet[]
  error?: string
}

/**
 * Context7Helper
 *
 * Helper class for interacting with Context7 API.
 * Provides type-safe methods for library resolution, documentation search,
 * and code snippet retrieval.
 */
export class Context7Helper {
  /**
   * Find a library by name and resolve to Context7 ID
   *
   * @param name - Library name (e.g., 'react', 'typescript')
   * @returns Library ID and information
   */
  async findLibrary(name: string): Promise<Context7FindLibraryResponse> {
    try {
      // Validate inputs
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          error: 'Library name cannot be empty',
        }
      }

      // In production, this would make an actual API call to Context7
      // For now, we return mock data for testing
      const mockLibrary: Context7Library = {
        id: `${name.toLowerCase()}-12345`,
        name: name,
        description: `Context7 documentation for ${name}`,
      }

      return {
        success: true,
        libraryId: mockLibrary.id,
        library: mockLibrary,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Search documentation for a library
   *
   * @param libraryId - Context7 library ID
   * @param query - Search query string
   * @returns Documentation results
   */
  async searchDocs(libraryId: string, query: string): Promise<Context7SearchDocsResponse> {
    try {
      // Validate inputs
      if (!libraryId || libraryId.trim().length === 0) {
        return {
          success: false,
          docs: [],
          error: 'Library ID cannot be empty',
        }
      }

      if (!query || query.trim().length === 0) {
        return {
          success: false,
          docs: [],
          error: 'Query cannot be empty',
        }
      }

      // In production, this would make an actual API call to Context7
      // For now, we return mock data for testing
      const mockDocs: Context7Documentation[] = this.generateMockDocs(query, 3)

      return {
        success: true,
        docs: mockDocs,
      }
    } catch (error) {
      return {
        success: false,
        docs: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get code snippets for a library topic
   *
   * @param libraryId - Context7 library ID
   * @param topic - Topic to get snippets for (e.g., 'hooks', 'routing')
   * @returns Code snippets
   */
  async getSnippets(libraryId: string, topic: string): Promise<Context7GetSnippetsResponse> {
    try {
      // Validate inputs
      if (!libraryId || libraryId.trim().length === 0) {
        return {
          success: false,
          snippets: [],
          error: 'Library ID cannot be empty',
        }
      }

      if (!topic || topic.trim().length === 0) {
        return {
          success: false,
          snippets: [],
          error: 'Topic cannot be empty',
        }
      }

      // In production, this would make an actual API call to Context7
      // For now, we return mock data for testing
      const mockSnippets: Context7CodeSnippet[] = this.generateMockSnippets(topic, 3)

      return {
        success: true,
        snippets: mockSnippets,
      }
    } catch (error) {
      return {
        success: false,
        snippets: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Generate mock documentation for testing
   */
  private generateMockDocs(query: string, count: number): Context7Documentation[] {
    return Array.from({ length: count }, (_, i) => ({
      title: `Documentation ${i + 1}: ${query}`,
      content: `This is documentation content about ${query}. It includes detailed information and examples...`,
      url: `https://context7.dev/docs/example-${i + 1}`,
      relevance: 0.9 - i * 0.1,
    }))
  }

  /**
   * Generate mock code snippets for testing
   */
  private generateMockSnippets(topic: string, count: number): Context7CodeSnippet[] {
    return Array.from({ length: count }, (_, i) => ({
      title: `${topic} Example ${i + 1}`,
      code: `// Example code for ${topic}\nfunction example${i + 1}() {\n  // Implementation here\n  return true;\n}`,
      language: 'javascript',
      description: `Code example demonstrating ${topic}`,
    }))
  }
}

/**
 * Get Context7 MCP server configuration
 *
 * Returns the complete configuration for the Context7 MCP server
 * including command, capabilities, and rate limits.
 *
 * @returns MCP server configuration for Context7
 */
export function getContext7ServerConfig(): MCPServerConfig {
  return {
    name: 'context7',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-context7'],
    env: {},
    capabilities: [
      {
        name: 'resolveLibrary',
        description: 'Resolve a library name to its Context7 ID',
        parameters: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Library name',
          },
        ],
      },
      {
        name: 'queryDocs',
        description: 'Query documentation for a library',
        parameters: [
          {
            name: 'libraryId',
            type: 'string',
            required: true,
            description: 'Context7 library ID',
          },
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Search query',
          },
        ],
      },
      {
        name: 'getCodeSnippets',
        description: 'Get code snippets for a library topic',
        parameters: [
          {
            name: 'libraryId',
            type: 'string',
            required: true,
            description: 'Context7 library ID',
          },
          {
            name: 'topic',
            type: 'string',
            required: true,
            description: 'Topic to get snippets for',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    autoConnect: true, // No API key required
    requiredEnvVars: [],
  }
}
