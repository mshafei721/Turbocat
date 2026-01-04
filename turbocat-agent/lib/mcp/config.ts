/**
 * MCP Configuration
 *
 * Default server configurations for MCP integrations.
 * Supports environment variable substitution and rate limit defaults.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/config.ts
 */

import type { MCPServerConfig } from './types'

/**
 * Environment variable pattern matcher
 * Matches ${VAR_NAME} or $VAR_NAME patterns
 */
const ENV_VAR_PATTERN = /\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g

/**
 * Substitute environment variables in a string
 *
 * Replaces ${VAR_NAME} or $VAR_NAME patterns with actual values.
 *
 * @param value - String containing environment variable references
 * @param fallback - Optional fallback value if env var is not set
 * @returns String with substituted values
 */
export function substituteEnvVars(value: string, fallback?: string): string {
  return value.replace(ENV_VAR_PATTERN, (match, bracedVar, unbracedVar) => {
    const varName = bracedVar || unbracedVar
    const envValue = process.env[varName]
    if (envValue !== undefined) {
      return envValue
    }
    return fallback !== undefined ? fallback : match
  })
}

/**
 * Substitute environment variables in a config object
 *
 * Recursively processes strings in the object.
 *
 * @param obj - Object with potential env var references
 * @returns Object with substituted values
 */
export function substituteEnvVarsInObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return substituteEnvVars(obj) as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteEnvVarsInObject(item)) as T
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVarsInObject(value)
    }
    return result as T
  }

  return obj
}

/**
 * Check if required environment variables are set
 *
 * @param varNames - Array of environment variable names
 * @returns Object with isValid flag and list of missing variables
 */
export function checkRequiredEnvVars(varNames: string[]): {
  isValid: boolean
  missing: string[]
} {
  const missing = varNames.filter((name) => !process.env[name])
  return {
    isValid: missing.length === 0,
    missing,
  }
}

/**
 * Default MCP server configurations
 *
 * These configurations can be loaded and registered with MCPServerManager.
 * Environment variables are substituted at load time.
 */
export const DEFAULT_MCP_CONFIGS: Record<string, MCPServerConfig> = {
  /**
   * Exa Search MCP Server
   * Neural and keyword web search capabilities
   */
  exa: {
    name: 'exa',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-exa'],
    env: {
      EXA_API_KEY: '${EXA_API_KEY}',
    },
    capabilities: [
      {
        name: 'search',
        description: 'Search the web using neural or keyword search',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query' },
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
          { name: 'url', type: 'string', required: true, description: 'URL to find similar pages for' },
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
  },

  /**
   * Firecrawl MCP Server
   * Web scraping and crawling capabilities
   */
  firecrawl: {
    name: 'firecrawl',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-firecrawl'],
    env: {
      FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}',
    },
    capabilities: [
      {
        name: 'scrape',
        description: 'Scrape a single page and extract content',
        parameters: [
          { name: 'url', type: 'string', required: true, description: 'URL to scrape' },
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
          { name: 'url', type: 'string', required: true, description: 'Starting URL to crawl' },
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
          { name: 'url', type: 'string', required: true, description: 'Website URL' },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
    },
    autoConnect: false,
    requiredEnvVars: ['FIRECRAWL_API_KEY'],
  },

  /**
   * GitHub MCP Server
   * Repository and code search capabilities
   */
  github: {
    name: 'github',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-github'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
    capabilities: [
      {
        name: 'searchRepositories',
        description: 'Search for repositories on GitHub using query syntax',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query (supports GitHub search syntax)' },
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
          { name: 'owner', type: 'string', required: true, description: 'Repository owner username' },
          { name: 'repo', type: 'string', required: true, description: 'Repository name' },
        ],
      },
      {
        name: 'getFileContents',
        description: 'Read file contents from a repository',
        parameters: [
          { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
          { name: 'repo', type: 'string', required: true, description: 'Repository name' },
          { name: 'path', type: 'string', required: true, description: 'File path within the repository' },
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
          { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
          { name: 'repo', type: 'string', required: true, description: 'Repository name' },
          { name: 'title', type: 'string', required: true, description: 'Issue title' },
          { name: 'body', type: 'string', required: false, description: 'Issue body content' },
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
          { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
          { name: 'repo', type: 'string', required: true, description: 'Repository name' },
          { name: 'title', type: 'string', required: true, description: 'Pull request title' },
          { name: 'body', type: 'string', required: false, description: 'Pull request body content' },
          { name: 'head', type: 'string', required: true, description: 'Head branch (feature branch)' },
          { name: 'base', type: 'string', required: true, description: 'Base branch (target branch)' },
        ],
      },
      {
        name: 'listPullRequests',
        description: 'List pull requests in a repository',
        parameters: [
          { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
          { name: 'repo', type: 'string', required: true, description: 'Repository name' },
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
          { name: 'query', type: 'string', required: true, description: 'Search query (supports GitHub code search syntax)' },
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
  },

  /**
   * Supabase MCP Server
   * Database, auth, and storage capabilities
   */
  supabase: {
    name: 'supabase',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-supabase'],
    env: {
      SUPABASE_URL: '${SUPABASE_URL}',
      SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
      SUPABASE_SERVICE_ROLE_KEY: '${SUPABASE_SERVICE_ROLE_KEY}',
    },
    capabilities: [
      {
        name: 'executeSQL',
        description: 'Execute SQL queries on the database',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'SQL query to execute' },
        ],
      },
      {
        name: 'getTableSchema',
        description: 'Get the schema of a database table',
        parameters: [
          { name: 'table', type: 'string', required: true, description: 'Table name' },
        ],
      },
      {
        name: 'listTables',
        description: 'List all tables in the database',
        parameters: [],
      },
      {
        name: 'createBucket',
        description: 'Create a storage bucket',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Bucket name' },
          {
            name: 'isPublic',
            type: 'boolean',
            required: false,
            description: 'Whether the bucket is public',
            defaultValue: false,
          },
        ],
      },
      {
        name: 'enableRealtime',
        description: 'Enable realtime subscriptions for tables',
        parameters: [
          {
            name: 'tables',
            type: 'array',
            required: true,
            description: 'Table names to enable realtime for',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000, // 1 minute
    },
    autoConnect: false,
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  },

  /**
   * Context7 MCP Server
   * Documentation and code snippet lookup
   */
  context7: {
    name: 'context7',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-context7'],
    env: {},
    capabilities: [
      {
        name: 'resolveLibrary',
        description: 'Resolve a library name to its Context7 ID',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Library name' },
        ],
      },
      {
        name: 'queryDocs',
        description: 'Query documentation for a library',
        parameters: [
          { name: 'libraryId', type: 'string', required: true, description: 'Context7 library ID' },
          { name: 'query', type: 'string', required: true, description: 'Search query' },
        ],
      },
      {
        name: 'getCodeSnippets',
        description: 'Get code snippets for a library topic',
        parameters: [
          { name: 'libraryId', type: 'string', required: true, description: 'Context7 library ID' },
          { name: 'topic', type: 'string', required: true, description: 'Topic to get snippets for' },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    autoConnect: true, // No API key required
    requiredEnvVars: [],
  },

  /**
   * Sequential Thinking MCP Server
   * Multi-step reasoning capabilities
   */
  'sequential-thinking': {
    name: 'sequential-thinking',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-sequential-thinking'],
    env: {},
    capabilities: [
      {
        name: 'sequentialThinking',
        description: 'Process a thought as part of a multi-step reasoning chain',
        parameters: [
          { name: 'thought', type: 'string', required: true, description: 'Current thought content' },
          { name: 'thoughtNumber', type: 'number', required: true, description: 'Thought sequence number' },
          { name: 'totalThoughts', type: 'number', required: true, description: 'Total expected thoughts' },
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
  },
}

/**
 * Load MCP configuration with environment variable substitution
 *
 * @param configName - Name of the configuration to load
 * @returns Configuration with substituted environment variables
 */
export function loadMCPConfig(configName: string): MCPServerConfig | undefined {
  const config = DEFAULT_MCP_CONFIGS[configName]
  if (!config) {
    return undefined
  }

  // Substitute environment variables in the config
  return substituteEnvVarsInObject(config)
}

/**
 * Load all MCP configurations with environment variable substitution
 *
 * @returns Object containing all configurations with substituted values
 */
export function loadAllMCPConfigs(): Record<string, MCPServerConfig> {
  const configs: Record<string, MCPServerConfig> = {}

  for (const [name, config] of Object.entries(DEFAULT_MCP_CONFIGS)) {
    configs[name] = substituteEnvVarsInObject(config)
  }

  return configs
}

/**
 * Get list of configurations that can auto-connect
 *
 * Filters configurations that have autoConnect enabled and
 * have all required environment variables set.
 *
 * @returns Array of configuration names that can auto-connect
 */
export function getAutoConnectConfigs(): string[] {
  const autoConnectConfigs: string[] = []

  for (const [name, config] of Object.entries(DEFAULT_MCP_CONFIGS)) {
    if (config.autoConnect) {
      const { isValid } = checkRequiredEnvVars(config.requiredEnvVars || [])
      if (isValid) {
        autoConnectConfigs.push(name)
      }
    }
  }

  return autoConnectConfigs
}

/**
 * Validate that a configuration has all required environment variables
 *
 * @param configName - Name of the configuration to validate
 * @returns Validation result with isValid flag and missing variables
 */
export function validateConfigEnvVars(configName: string): {
  isValid: boolean
  missing: string[]
  configName: string
} {
  const config = DEFAULT_MCP_CONFIGS[configName]
  if (!config) {
    return { isValid: false, missing: [], configName }
  }

  const { isValid, missing } = checkRequiredEnvVars(config.requiredEnvVars || [])
  return { isValid, missing, configName }
}
