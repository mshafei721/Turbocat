/**
 * Supabase MCP Server Configuration
 *
 * Configuration and helper functions for the Supabase MCP server.
 * Provides database operations, authentication setup, storage management,
 * and realtime subscription capabilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/supabase.ts
 */

import type { MCPServerConfig } from '../types'

/**
 * Table column definition
 */
export interface SupabaseColumn {
  name: string
  type: string
  nullable?: boolean
  primaryKey?: boolean
  defaultValue?: string
  unique?: boolean
  references?: {
    table: string
    column: string
  }
}

/**
 * Table schema information
 */
export interface SupabaseTableSchema {
  tableName: string
  schema: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    defaultValue: string | null
    isPrimaryKey: boolean
    isUnique: boolean
  }>
  indexes: Array<{
    name: string
    columns: string[]
    unique: boolean
  }>
  foreignKeys: Array<{
    column: string
    referencedTable: string
    referencedColumn: string
  }>
}

/**
 * Table information
 */
export interface SupabaseTable {
  name: string
  schema: string
  rowCount?: number
}

/**
 * Storage bucket information
 */
export interface SupabaseBucket {
  name: string
  public: boolean
  createdAt: string
}

/**
 * File upload information
 */
export interface SupabaseFileUpload {
  path: string
  url: string
  size: number
}

/**
 * Response from runSQL
 */
export interface SupabaseRunSQLResponse {
  success: boolean
  rows: Array<Record<string, unknown>>
  rowCount?: number
  error?: string
  rateLimited?: boolean
}

/**
 * Response from getSchema
 */
export interface SupabaseGetSchemaResponse {
  success: boolean
  schema?: SupabaseTableSchema
  error?: string
  rateLimited?: boolean
}

/**
 * Response from listAllTables
 */
export interface SupabaseListTablesResponse {
  success: boolean
  tables: SupabaseTable[]
  error?: string
  rateLimited?: boolean
}

/**
 * Response from createTable
 */
export interface SupabaseCreateTableResponse {
  success: boolean
  tableName?: string
  error?: string
  rateLimited?: boolean
}

/**
 * Response from setupAuth
 */
export interface SupabaseSetupAuthResponse {
  success: boolean
  providers: string[]
  error?: string
  rateLimited?: boolean
}

/**
 * Response from createStorageBucket
 */
export interface SupabaseCreateBucketResponse {
  success: boolean
  bucket?: SupabaseBucket
  error?: string
  rateLimited?: boolean
}

/**
 * Response from uploadFile
 */
export interface SupabaseUploadFileResponse {
  success: boolean
  file?: SupabaseFileUpload
  error?: string
  rateLimited?: boolean
}

/**
 * Response from enableTableRealtime
 */
export interface SupabaseEnableRealtimeResponse {
  success: boolean
  enabledTables: string[]
  error?: string
  rateLimited?: boolean
}

/**
 * SupabaseHelper
 *
 * Helper class for interacting with Supabase via MCP.
 * Provides type-safe methods for database operations, auth setup,
 * storage management, and realtime subscriptions.
 */
export class SupabaseHelper {
  private url: string
  private anonKey: string
  private serviceRoleKey: string
  private rateLimitReset: number = 0
  private requestCount: number = 0
  private readonly MAX_REQUESTS = 1000
  private readonly WINDOW_MS = 60000 // 1 minute

  constructor() {
    const url = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
      throw new Error('SUPABASE_URL environment variable is not set')
    }
    if (!anonKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable is not set')
    }
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
    }

    this.url = url
    this.anonKey = anonKey
    this.serviceRoleKey = serviceRoleKey
  }

  /**
   * Execute SQL query safely using parameterized queries
   *
   * CRITICAL: Always use parameterized queries to prevent SQL injection.
   * Parameters should be passed separately, never concatenated into the query string.
   *
   * @param query - SQL query with parameter placeholders ($1, $2, etc.)
   * @param params - Array of parameter values
   * @returns Query results
   */
  async runSQL(query: string, params: unknown[] = []): Promise<SupabaseRunSQLResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          rows: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          rows: [],
          error: 'Query cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would execute via Supabase REST API or RPC
      // For now, we return mock data for testing
      // NOTE: Real implementation would use prepared statements/parameterized queries
      const mockRows = this.generateMockQueryResults(query, params)

      return {
        success: true,
        rows: mockRows,
        rowCount: mockRows.length,
      }
    } catch (error) {
      return {
        success: false,
        rows: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get table schema information
   *
   * @param tableName - Name of the table
   * @returns Table schema with columns, indexes, and foreign keys
   */
  async getSchema(tableName: string): Promise<SupabaseGetSchemaResponse> {
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
      if (!tableName || tableName.trim().length === 0) {
        return {
          success: false,
          error: 'Table name cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would query information_schema
      // For now, we return mock data for testing
      const mockSchema: SupabaseTableSchema = {
        tableName,
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            nullable: false,
            defaultValue: 'gen_random_uuid()',
            isPrimaryKey: true,
            isUnique: true,
          },
          {
            name: 'email',
            type: 'text',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: false,
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            nullable: false,
            defaultValue: 'now()',
            isPrimaryKey: false,
            isUnique: false,
          },
        ],
        indexes: [
          {
            name: `${tableName}_pkey`,
            columns: ['id'],
            unique: true,
          },
          {
            name: `${tableName}_email_key`,
            columns: ['email'],
            unique: true,
          },
        ],
        foreignKeys: [],
      }

      return {
        success: true,
        schema: mockSchema,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * List all tables in the database
   *
   * @returns List of tables with metadata
   */
  async listAllTables(): Promise<SupabaseListTablesResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          tables: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would query information_schema.tables
      // For now, we return mock data for testing
      const mockTables: SupabaseTable[] = [
        { name: 'users', schema: 'public', rowCount: 1250 },
        { name: 'posts', schema: 'public', rowCount: 4567 },
        { name: 'comments', schema: 'public', rowCount: 12890 },
        { name: 'profiles', schema: 'public', rowCount: 1250 },
      ]

      return {
        success: true,
        tables: mockTables,
      }
    } catch (error) {
      return {
        success: false,
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create a new table with specified columns
   *
   * @param tableName - Name of the table to create
   * @param columns - Array of column definitions
   * @returns Success status
   */
  async createTable(
    tableName: string,
    columns: SupabaseColumn[]
  ): Promise<SupabaseCreateTableResponse> {
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
      if (!tableName || tableName.trim().length === 0) {
        return {
          success: false,
          error: 'Table name cannot be empty',
        }
      }

      if (!Array.isArray(columns) || columns.length === 0) {
        return {
          success: false,
          error: 'Columns array cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would execute CREATE TABLE via SQL
      // For now, we return mock success for testing
      return {
        success: true,
        tableName,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Configure authentication providers
   *
   * @param providers - Array of provider names (google, github, email, etc.)
   * @returns Configured providers
   */
  async setupAuth(providers: string[]): Promise<SupabaseSetupAuthResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          providers: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!Array.isArray(providers) || providers.length === 0) {
        return {
          success: false,
          providers: [],
          error: 'Providers array cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would configure auth via Supabase Management API
      // For now, we return mock success for testing
      return {
        success: true,
        providers,
      }
    } catch (error) {
      return {
        success: false,
        providers: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create a storage bucket
   *
   * @param bucketName - Name of the bucket
   * @param isPublic - Whether the bucket should be publicly accessible
   * @returns Created bucket information
   */
  async createStorageBucket(
    bucketName: string,
    isPublic: boolean = false
  ): Promise<SupabaseCreateBucketResponse> {
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
      if (!bucketName || bucketName.trim().length === 0) {
        return {
          success: false,
          error: 'Bucket name cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would create bucket via Supabase Storage API
      // For now, we return mock data for testing
      const mockBucket: SupabaseBucket = {
        name: bucketName,
        public: isPublic,
        createdAt: new Date().toISOString(),
      }

      return {
        success: true,
        bucket: mockBucket,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Upload a file to a storage bucket
   *
   * @param bucketName - Name of the bucket
   * @param filePath - Path where the file should be stored
   * @param fileData - File data (base64 or buffer)
   * @returns Upload result with URL
   */
  async uploadFile(
    bucketName: string,
    filePath: string,
    fileData: string
  ): Promise<SupabaseUploadFileResponse> {
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
      if (!bucketName || !filePath || !fileData) {
        return {
          success: false,
          error: 'Bucket name, file path, and file data are required',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would upload via Supabase Storage API
      // For now, we return mock data for testing
      const mockFile: SupabaseFileUpload = {
        path: filePath,
        url: `${this.url}/storage/v1/object/public/${bucketName}/${filePath}`,
        size: fileData.length,
      }

      return {
        success: true,
        file: mockFile,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Enable realtime subscriptions on tables
   *
   * @param tables - Array of table names to enable realtime for
   * @returns List of tables with realtime enabled
   */
  async enableTableRealtime(tables: string[]): Promise<SupabaseEnableRealtimeResponse> {
    try {
      // Check rate limit
      if (this.isRateLimited()) {
        return {
          success: false,
          enabledTables: [],
          error: 'Rate limit exceeded. Please try again later.',
          rateLimited: true,
        }
      }

      // Validate inputs
      if (!Array.isArray(tables) || tables.length === 0) {
        return {
          success: false,
          enabledTables: [],
          error: 'Tables array cannot be empty',
        }
      }

      // Increment rate limit counter
      this.incrementRateLimit()

      // In production, this would execute:
      // ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
      // For now, we return mock success for testing
      return {
        success: true,
        enabledTables: tables,
      }
    } catch (error) {
      return {
        success: false,
        enabledTables: [],
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
   * Generate mock query results for testing
   */
  private generateMockQueryResults(query: string, params: unknown[]): Array<Record<string, unknown>> {
    // Simple mock based on query type
    if (query.toLowerCase().includes('select')) {
      return [
        {
          id: 'user-123',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
        },
      ]
    }

    // For INSERT, UPDATE, DELETE return empty array
    return []
  }
}

/**
 * Get Supabase MCP server configuration
 *
 * Returns the complete configuration for the Supabase MCP server
 * including command, environment variables, capabilities, and rate limits.
 *
 * @returns MCP server configuration for Supabase
 */
export function getSupabaseServerConfig(): MCPServerConfig {
  return {
    name: 'supabase',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-supabase'],
    env: {
      SUPABASE_URL: '${SUPABASE_URL}',
      SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
      SUPABASE_SERVICE_ROLE_KEY: '${SUPABASE_SERVICE_ROLE_KEY}',
    },
    capabilities: [
      {
        name: 'executeSQL',
        description: 'Execute SQL queries safely using parameterized queries',
        parameters: [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'SQL query with parameter placeholders ($1, $2, etc.)',
          },
          {
            name: 'params',
            type: 'array',
            required: false,
            description: 'Array of parameter values for the query',
            defaultValue: [],
          },
        ],
      },
      {
        name: 'getTableSchema',
        description: 'Get detailed schema information for a table',
        parameters: [
          {
            name: 'tableName',
            type: 'string',
            required: true,
            description: 'Name of the table',
          },
        ],
      },
      {
        name: 'listTables',
        description: 'List all tables in the database',
        parameters: [],
      },
      {
        name: 'createTable',
        description: 'Create a new table with specified columns',
        parameters: [
          {
            name: 'tableName',
            type: 'string',
            required: true,
            description: 'Name of the table to create',
          },
          {
            name: 'columns',
            type: 'array',
            required: true,
            description: 'Array of column definitions',
          },
        ],
      },
      {
        name: 'configureAuth',
        description: 'Configure authentication providers for the project',
        parameters: [
          {
            name: 'providers',
            type: 'array',
            required: true,
            description: 'Array of provider names (google, github, email, etc.)',
          },
        ],
      },
      {
        name: 'createBucket',
        description: 'Create a storage bucket for file storage',
        parameters: [
          {
            name: 'bucketName',
            type: 'string',
            required: true,
            description: 'Name of the bucket',
          },
          {
            name: 'isPublic',
            type: 'boolean',
            required: false,
            description: 'Whether the bucket should be publicly accessible',
            defaultValue: false,
          },
        ],
      },
      {
        name: 'uploadFile',
        description: 'Upload a file to a storage bucket',
        parameters: [
          {
            name: 'bucketName',
            type: 'string',
            required: true,
            description: 'Name of the bucket',
          },
          {
            name: 'filePath',
            type: 'string',
            required: true,
            description: 'Path where the file should be stored',
          },
          {
            name: 'fileData',
            type: 'string',
            required: true,
            description: 'File data (base64 encoded)',
          },
        ],
      },
      {
        name: 'enableRealtime',
        description: 'Enable realtime subscriptions on specified tables',
        parameters: [
          {
            name: 'tables',
            type: 'array',
            required: true,
            description: 'Array of table names to enable realtime for',
          },
        ],
      },
    ],
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000, // 1 minute
    },
    autoConnect: false,
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  }
}
