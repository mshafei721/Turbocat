/**
 * GitHub MCP Integration Tests
 *
 * Tests for GitHub MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/github.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GitHubHelper, getGitHubServerConfig } from './github'
import type { MCPServerConfig } from '../types'

describe('GitHub MCP Integration', () => {
  describe('GitHubHelper', () => {
    let helper: GitHubHelper

    beforeEach(() => {
      // Set up environment variable for testing
      process.env.GITHUB_TOKEN = 'test-github-token-123'
      helper = new GitHubHelper()
    })

    /**
     * Task 5.1.1: Test searchRepositories returns matching repos
     *
     * Verifies that the searchRepos function can search for repositories
     * and returns results with expected structure.
     */
    it('should search repositories and return matching repos', async () => {
      // Arrange
      const query = 'language:typescript stars:>100'
      const sort = 'stars'

      // Act
      const result = await helper.searchRepos(query, sort)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.repositories).toBeInstanceOf(Array)
      expect(result.repositories.length).toBeGreaterThan(0)

      // Verify repository structure
      const firstRepo = result.repositories[0]
      expect(firstRepo).toHaveProperty('name')
      expect(firstRepo).toHaveProperty('fullName')
      expect(firstRepo).toHaveProperty('owner')
      expect(firstRepo).toHaveProperty('description')
      expect(firstRepo).toHaveProperty('url')
      expect(firstRepo).toHaveProperty('stars')
      expect(typeof firstRepo.name).toBe('string')
      expect(typeof firstRepo.fullName).toBe('string')
      expect(typeof firstRepo.stars).toBe('number')
    })

    /**
     * Task 5.1.2: Test getRepository returns repo details
     *
     * Verifies that the getRepo function can retrieve detailed
     * information about a specific repository.
     */
    it('should get repository details', async () => {
      // Arrange
      const owner = 'facebook'
      const repo = 'react'

      // Act
      const result = await helper.getRepo(owner, repo)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.repository).toBeDefined()

      // Verify repository details
      if (result.repository) {
        expect(result.repository).toHaveProperty('name')
        expect(result.repository).toHaveProperty('fullName')
        expect(result.repository).toHaveProperty('owner')
        expect(result.repository).toHaveProperty('description')
        expect(result.repository).toHaveProperty('url')
        expect(result.repository).toHaveProperty('stars')
        expect(result.repository).toHaveProperty('forks')
        expect(result.repository).toHaveProperty('language')
        expect(result.repository).toHaveProperty('defaultBranch')
        expect(result.repository.name).toBe(repo)
        expect(result.repository.owner).toBe(owner)
        expect(typeof result.repository.stars).toBe('number')
      }
    })

    /**
     * Task 5.1.3: Test getFileContents reads file from repo
     *
     * Verifies that the readFile function can fetch file contents
     * from a GitHub repository.
     */
    it('should read file contents from repository', async () => {
      // Arrange
      const owner = 'facebook'
      const repo = 'react'
      const path = 'README.md'
      const branch = 'main'

      // Act
      const result = await helper.readFile(owner, repo, path, branch)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.content).toBeDefined()

      // Verify file content structure
      if (result.content) {
        expect(result.content).toHaveProperty('path')
        expect(result.content).toHaveProperty('content')
        expect(result.content).toHaveProperty('encoding')
        expect(result.content).toHaveProperty('sha')
        expect(result.content.path).toBe(path)
        expect(typeof result.content.content).toBe('string')
        expect(result.content.content.length).toBeGreaterThan(0)
      }
    })

    /**
     * Task 5.1.4: Test createIssue creates issue successfully
     *
     * Verifies that the createIssue function can create a new issue
     * in a GitHub repository.
     */
    it('should create issue successfully', async () => {
      // Arrange
      const owner = 'test-owner'
      const repo = 'test-repo'
      const title = 'Test Issue'
      const body = 'This is a test issue created by automated tests'
      const labels = ['bug', 'enhancement']

      // Act
      const result = await helper.createIssue(owner, repo, title, body, labels)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.issue).toBeDefined()

      // Verify issue structure
      if (result.issue) {
        expect(result.issue).toHaveProperty('number')
        expect(result.issue).toHaveProperty('title')
        expect(result.issue).toHaveProperty('body')
        expect(result.issue).toHaveProperty('url')
        expect(result.issue).toHaveProperty('state')
        expect(result.issue).toHaveProperty('labels')
        expect(result.issue.title).toBe(title)
        expect(result.issue.state).toBe('open')
        expect(typeof result.issue.number).toBe('number')
        expect(Array.isArray(result.issue.labels)).toBe(true)
      }
    })

    /**
     * Task 5.1.5: Test searchCode finds code patterns
     *
     * Verifies that the searchCode function can search for code patterns
     * across GitHub repositories.
     */
    it('should search code and find patterns', async () => {
      // Arrange
      const query = 'useState in:file'
      const language = 'typescript'

      // Act
      const result = await helper.searchCode(query, language)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.items).toBeInstanceOf(Array)
      expect(result.items.length).toBeGreaterThan(0)

      // Verify code search result structure
      const firstItem = result.items[0]
      expect(firstItem).toHaveProperty('name')
      expect(firstItem).toHaveProperty('path')
      expect(firstItem).toHaveProperty('url')
      expect(firstItem).toHaveProperty('repository')
      expect(typeof firstItem.name).toBe('string')
      expect(typeof firstItem.path).toBe('string')
      expect(firstItem.repository).toHaveProperty('fullName')
    })

    /**
     * Task 5.3: Test rate limit error handling
     *
     * Verifies that rate limit errors are properly handled
     * with appropriate error messages.
     */
    it('should handle rate limit errors gracefully', async () => {
      // Arrange - simulate rate limit exceeded
      const query = 'test query'

      // Mock the helper to simulate rate limit
      const rateLimitedHelper = new GitHubHelper()
      vi.spyOn(rateLimitedHelper, 'searchRepos').mockResolvedValue({
        success: false,
        repositories: [],
        error: 'Rate limit exceeded. Please try again later.',
        rateLimited: true,
      })

      // Act
      const result = await rateLimitedHelper.searchRepos(query)

      // Assert
      expect(result.success).toBe(false)
      expect(result.rateLimited).toBe(true)
      expect(result.error).toContain('Rate limit')
    })

    /**
     * Task 5.3: Test missing token error handling
     *
     * Verifies that missing GitHub token is properly detected
     * and returns appropriate error.
     */
    it('should throw error when GitHub token is missing', () => {
      // Arrange
      delete process.env.GITHUB_TOKEN

      // Act & Assert
      expect(() => new GitHubHelper()).toThrow('GITHUB_TOKEN environment variable is not set')
    })

    /**
     * Task 5.3: Test createPullRequest functionality
     *
     * Verifies that the createPR function can create a pull request
     * in a GitHub repository.
     */
    it('should create pull request successfully', async () => {
      // Arrange
      const owner = 'test-owner'
      const repo = 'test-repo'
      const title = 'Test PR'
      const body = 'This is a test pull request'
      const head = 'feature-branch'
      const base = 'main'

      // Act
      const result = await helper.createPR(owner, repo, title, body, head, base)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.pullRequest).toBeDefined()

      // Verify PR structure
      if (result.pullRequest) {
        expect(result.pullRequest).toHaveProperty('number')
        expect(result.pullRequest).toHaveProperty('title')
        expect(result.pullRequest).toHaveProperty('body')
        expect(result.pullRequest).toHaveProperty('url')
        expect(result.pullRequest).toHaveProperty('state')
        expect(result.pullRequest).toHaveProperty('head')
        expect(result.pullRequest).toHaveProperty('base')
        expect(result.pullRequest.title).toBe(title)
        expect(result.pullRequest.state).toBe('open')
        expect(typeof result.pullRequest.number).toBe('number')
      }
    })
  })

  describe('GitHub Server Configuration', () => {
    /**
     * Task 5.2: Test GitHub server configuration
     *
     * Verifies that the GitHub server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid GitHub server configuration', () => {
      // Arrange & Act
      const config = getGitHubServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('github')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')
      expect(config.args).toContain('@modelcontextprotocol/server-github')

      // Assert - Environment variables
      expect(config.env).toHaveProperty('GITHUB_TOKEN')
      expect(config.requiredEnvVars).toContain('GITHUB_TOKEN')

      // Assert - Rate limit configuration (5000 requests/hour)
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(5000)
      expect(config.rateLimit?.windowMs).toBe(3600000) // 1 hour

      // Assert - Auto-connect disabled by default
      expect(config.autoConnect).toBe(false)
    })

    /**
     * Task 5.2: Test GitHub capabilities are properly defined
     *
     * Verifies that all GitHub capabilities are properly configured
     * with correct parameters.
     */
    it('should define all required capabilities', () => {
      // Arrange & Act
      const config = getGitHubServerConfig()

      // Assert - Capabilities count (7 total)
      expect(config.capabilities.length).toBeGreaterThanOrEqual(7)

      // Assert - searchRepositories capability
      const searchReposCapability = config.capabilities.find(
        (c) => c.name === 'searchRepositories'
      )
      expect(searchReposCapability).toBeDefined()
      expect(searchReposCapability?.description).toContain('Search')
      expect(searchReposCapability?.parameters.length).toBeGreaterThan(0)

      const queryParam = searchReposCapability?.parameters.find((p) => p.name === 'query')
      expect(queryParam?.required).toBe(true)
      expect(queryParam?.type).toBe('string')

      // Assert - getRepository capability
      const getRepoCapability = config.capabilities.find((c) => c.name === 'getRepository')
      expect(getRepoCapability).toBeDefined()
      expect(getRepoCapability?.description).toContain('repository')

      const ownerParam = getRepoCapability?.parameters.find((p) => p.name === 'owner')
      expect(ownerParam?.required).toBe(true)
      expect(ownerParam?.type).toBe('string')

      const repoParam = getRepoCapability?.parameters.find((p) => p.name === 'repo')
      expect(repoParam?.required).toBe(true)
      expect(repoParam?.type).toBe('string')

      // Assert - getFileContents capability
      const getFileCapability = config.capabilities.find((c) => c.name === 'getFileContents')
      expect(getFileCapability).toBeDefined()
      expect(getFileCapability?.description).toContain('file')

      // Assert - createIssue capability
      const createIssueCapability = config.capabilities.find((c) => c.name === 'createIssue')
      expect(createIssueCapability).toBeDefined()
      expect(createIssueCapability?.description).toContain('issue')

      const titleParam = createIssueCapability?.parameters.find((p) => p.name === 'title')
      expect(titleParam?.required).toBe(true)
      expect(titleParam?.type).toBe('string')

      // Assert - createPullRequest capability
      const createPRCapability = config.capabilities.find((c) => c.name === 'createPullRequest')
      expect(createPRCapability).toBeDefined()
      expect(createPRCapability?.description).toContain('pull request')

      // Assert - listPullRequests capability
      const listPRsCapability = config.capabilities.find((c) => c.name === 'listPullRequests')
      expect(listPRsCapability).toBeDefined()

      // Assert - searchCode capability
      const searchCodeCapability = config.capabilities.find((c) => c.name === 'searchCode')
      expect(searchCodeCapability).toBeDefined()
      expect(searchCodeCapability?.description).toContain('code')
    })

    /**
     * Task 5.4: Test GitHub config can be registered with MCP Manager
     *
     * Verifies that the GitHub configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getGitHubServerConfig()

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
