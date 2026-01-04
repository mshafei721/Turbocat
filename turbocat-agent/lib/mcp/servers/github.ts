/**
 * GitHub MCP Server Configuration
 *
 * Configuration and helper functions for the GitHub MCP server.
 * Provides repository search, file operations, issue/PR management,
 * and code search capabilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/github.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * GitHub repository information
 */
export interface GitHubRepository {
  name: string
  fullName: string
  owner: string
  description: string | null
  url: string
  stars: number
  forks: number
  language: string | null
  defaultBranch: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

/**
 * GitHub file content
 */
export interface GitHubFileContent {
  path: string
  content: string
  encoding: string
  sha: string
  size: number
  url: string
}

/**
 * GitHub issue
 */
export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  url: string
  state: 'open' | 'closed'
  labels: string[]
  createdAt: string
  updatedAt: string
}

/**
 * GitHub pull request
 */
export interface GitHubPullRequest {
  number: number
  title: string
  body: string | null
  url: string
  state: 'open' | 'closed' | 'merged'
  head: string
  base: string
  createdAt: string
  updatedAt: string
}

/**
 * GitHub code search result item
 */
export interface GitHubCodeSearchItem {
  name: string
  path: string
  url: string
  repository: {
    fullName: string
    url: string
  }
}

/**
 * Response from searchRepos
 */
export interface GitHubSearchReposResponse {
  success: boolean
  repositories: GitHubRepository[]
  totalCount?: number
  error?: string
  rateLimited?: boolean
}

/**
 * Response from getRepo
 */
export interface GitHubGetRepoResponse {
  success: boolean
  repository?: GitHubRepository
  error?: string
  rateLimited?: boolean
}

/**
 * Response from readFile
 */
export interface GitHubReadFileResponse {
  success: boolean
  content?: GitHubFileContent
  error?: string
  rateLimited?: boolean
}

/**
 * Response from createIssue
 */
export interface GitHubCreateIssueResponse {
  success: boolean
  issue?: GitHubIssue
  error?: string
  rateLimited?: boolean
}

/**
 * Response from createPR
 */
export interface GitHubCreatePRResponse {
  success: boolean
  pullRequest?: GitHubPullRequest
  error?: string
  rateLimited?: boolean
}

/**
 * Response from searchCode
 */
export interface GitHubSearchCodeResponse {
  success: boolean
  items: GitHubCodeSearchItem[]
  totalCount?: number
  error?: string
  rateLimited?: boolean
}

/**
 * GitHubHelper
 *
 * Helper class for interacting with GitHub API via MCP.
 * Provides type-safe methods for repository operations, file access,
 * issue/PR management, and code search.
 */
export class GitHubHelper {
  private token: string
  private rateLimitReset: number = 0
  private requestCount: number = 0
  private readonly MAX_REQUESTS = 5000
  private readonly WINDOW_MS = 3600000 // 1 hour

  constructor() {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set')
    }
    this.token = token
  }

  /**
   * Search for repositories on GitHub
   *
   * @param query - Search query (supports GitHub search syntax)
   * @param sort - Sort order (stars, forks, updated, etc.)
   * @returns List of matching repositories
   */
  async searchRepos(query: string, sort?: string): Promise<GitHubSearchReposResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          repositories: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          repositories: [],
          error: 'Query cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockRepositories = this.generateMockRepositories(5)

      return {
        success: true,
        repositories: mockRepositories,
        totalCount: mockRepositories.length,
      }
    } catch (error) {
      return {
        success: false,
        repositories: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get details of a specific repository
   *
   * @param owner - Repository owner username
   * @param repo - Repository name
   * @returns Repository details
   */
  async getRepo(owner: string, repo: string): Promise<GitHubGetRepoResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!owner || !repo) {
        return {
          success: false,
          error: 'Owner and repo are required',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockRepository: GitHubRepository = {
        name: repo,
        fullName: `${owner}/${repo}`,
        owner,
        description: 'A JavaScript library for building user interfaces',
        url: `https://github.com/${owner}/${repo}`,
        stars: 234567,
        forks: 45678,
        language: 'JavaScript',
        defaultBranch: 'main',
        isPrivate: false,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        repository: mockRepository,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Read file contents from a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path within the repository
   * @param branch - Branch name (default: repository default branch)
   * @returns File content
   */
  async readFile(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<GitHubReadFileResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!owner || !repo || !path) {
        return {
          success: false,
          error: 'Owner, repo, and path are required',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockContent: GitHubFileContent = {
        path,
        content: `# ${repo}\n\nThis is a mock README file for ${owner}/${repo}.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3`,
        encoding: 'utf-8',
        sha: 'abc123def456',
        size: 250,
        url: `https://github.com/${owner}/${repo}/blob/${branch || 'main'}/${path}`,
      }

      return {
        success: true,
        content: mockContent,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create an issue in a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param title - Issue title
   * @param body - Issue body content
   * @param labels - Array of label names
   * @returns Created issue
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<GitHubCreateIssueResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!owner || !repo || !title) {
        return {
          success: false,
          error: 'Owner, repo, and title are required',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockIssue: GitHubIssue = {
        number: Math.floor(Math.random() * 1000) + 1,
        title,
        body,
        url: `https://github.com/${owner}/${repo}/issues/1`,
        state: 'open',
        labels: labels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        issue: mockIssue,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create a pull request in a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param title - PR title
   * @param body - PR body content
   * @param head - Head branch (feature branch)
   * @param base - Base branch (target branch, usually 'main')
   * @returns Created pull request
   */
  async createPR(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<GitHubCreatePRResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!owner || !repo || !title || !head || !base) {
        return {
          success: false,
          error: 'Owner, repo, title, head, and base are required',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockPullRequest: GitHubPullRequest = {
        number: Math.floor(Math.random() * 100) + 1,
        title,
        body,
        url: `https://github.com/${owner}/${repo}/pull/1`,
        state: 'open',
        head,
        base,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        pullRequest: mockPullRequest,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Search for code patterns across GitHub
   *
   * @param query - Search query (supports GitHub code search syntax)
   * @param language - Programming language filter
   * @returns Code search results
   */
  async searchCode(query: string, language?: string): Promise<GitHubSearchCodeResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          items: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          items: [],
          error: 'Query cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would make an actual API call to GitHub
      // For now, we return mock data for testing
      const mockItems: GitHubCodeSearchItem[] = Array.from({ length: 5 }, (_, i) => ({
        name: `file${i + 1}.${language || 'ts'}`,
        path: `src/components/file${i + 1}.${language || 'ts'}`,
        url: `https://github.com/example/repo${i + 1}/blob/main/src/components/file${i + 1}.${language || 'ts'}`,
        repository: {
          fullName: `example/repo${i + 1}`,
          url: `https://github.com/example/repo${i + 1}`,
        },
      }))

      return {
        success: true,
        items: mockItems,
        totalCount: mockItems.length,
      }
    } catch (error) {
      return {
        success: false,
        items: [],
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
   * Generate mock repositories for testing
   */
  private generateMockRepositories(count: number): GitHubRepository[] {
    return Array.from({ length: count }, (_, i) => ({
      name: `repo-${i + 1}`,
      fullName: `owner${i + 1}/repo-${i + 1}`,
      owner: `owner${i + 1}`,
      description: `A test repository number ${i + 1}`,
      url: `https://github.com/owner${i + 1}/repo-${i + 1}`,
      stars: Math.floor(Math.random() * 10000),
      forks: Math.floor(Math.random() * 1000),
      language: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'][i % 5],
      defaultBranch: 'main',
      isPrivate: false,
      createdAt: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }))
  }
}

/**
 * Get GitHub MCP server configuration
 *
 * Returns the complete configuration for the GitHub MCP server
 * including command, environment variables, capabilities, and rate limits.
 *
 * @returns MCP server configuration for GitHub
 */
export function getGitHubServerConfig(): MCPServerConfig {
  return {
    name: 'github',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
    capabilities: [
      {
        name: 'searchRepositories',
        description: 'Search for repositories on GitHub using query syntax',
        parameters: [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Search query (supports GitHub search syntax)',
          },
          {
            name: 'sort',
            type: 'string',
            required: false,
            description: 'Sort order (stars, forks, updated, etc.)',
            defaultValue: 'stars',
          },
          {
            name: 'order',
            type: 'string',
            required: false,
            description: 'Sort direction (asc or desc)',
            defaultValue: 'desc',
          },
        ],
      },
      {
        name: 'getRepository',
        description: 'Get detailed information about a specific repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner username',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
          },
        ],
      },
      {
        name: 'getFileContents',
        description: 'Read file contents from a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
          },
          {
            name: 'path',
            type: 'string',
            required: true,
            description: 'File path within the repository',
          },
          {
            name: 'branch',
            type: 'string',
            required: false,
            description: 'Branch name (default: repository default branch)',
          },
        ],
      },
      {
        name: 'createIssue',
        description: 'Create a new issue in a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Issue title',
          },
          {
            name: 'body',
            type: 'string',
            required: false,
            description: 'Issue body content',
          },
          {
            name: 'labels',
            type: 'array',
            required: false,
            description: 'Array of label names',
          },
        ],
      },
      {
        name: 'createPullRequest',
        description: 'Create a new pull request in a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Pull request title',
          },
          {
            name: 'body',
            type: 'string',
            required: false,
            description: 'Pull request body content',
          },
          {
            name: 'head',
            type: 'string',
            required: true,
            description: 'Head branch (feature branch)',
          },
          {
            name: 'base',
            type: 'string',
            required: true,
            description: 'Base branch (target branch)',
          },
        ],
      },
      {
        name: 'listPullRequests',
        description: 'List pull requests in a repository',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'Repository name',
          },
          {
            name: 'state',
            type: 'string',
            required: false,
            description: 'PR state (open, closed, all)',
            defaultValue: 'open',
          },
        ],
      },
      {
        name: 'searchCode',
        description: 'Search for code patterns across GitHub repositories',
        parameters: [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Search query (supports GitHub code search syntax)',
          },
          {
            name: 'language',
            type: 'string',
            required: false,
            description: 'Programming language filter',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 5000,
      windowMs: 3600000, // 1 hour
    },
    autoConnect: false,
    requiredEnvVars: ['GITHUB_TOKEN'],
  }
}
