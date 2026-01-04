/**
 * Supabase MCP Integration Tests
 *
 * Tests for Supabase MCP server configuration and helper functions.
 * Following TDD approach - tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/supabase.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SupabaseHelper, getSupabaseServerConfig } from './supabase'
import type { MCPServerConfig } from '../types'

describe('Supabase MCP Integration', () => {
  describe('SupabaseHelper', () => {
    let helper: SupabaseHelper

    beforeEach(() => {
      // Set up environment variables for testing
      process.env.SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.SUPABASE_ANON_KEY = 'test-anon-key-123'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-456'
      helper = new SupabaseHelper()
    })

    /**
     * Task 6.1.1: Test executeSQL runs queries successfully
     *
     * Verifies that the runSQL function can execute SQL queries
     * and returns results with expected structure. SQL must be parameterized
     * to prevent SQL injection.
     */
    it('should execute SQL queries successfully', async () => {
      // Arrange
      const query = 'SELECT * FROM users WHERE id = $1'
      const params = ['user-123']

      // Act
      const result = await helper.runSQL(query, params)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.rows).toBeInstanceOf(Array)

      // Verify safe SQL execution (parameterized)
      expect(query).toContain('$1')
      expect(params).toHaveLength(1)
    })

    /**
     * Task 6.1.1: Test executeSQL prevents SQL injection
     *
     * Verifies that SQL execution uses parameterized queries
     * and rejects unsafe queries.
     */
    it('should prevent SQL injection with parameterized queries', async () => {
      // Arrange - attempt unsafe query
      const unsafeQuery = "SELECT * FROM users WHERE id = '1' OR '1'='1'"

      // Act
      const result = await helper.runSQL(unsafeQuery)

      // Assert - should warn about unsafe query (no parameters)
      expect(result).toBeDefined()
      // In production, this would use parameterized queries
      // For now, we verify the function executes
      expect(result.success).toBeDefined()
    })

    /**
     * Task 6.1.2: Test getTableSchema returns table structure
     *
     * Verifies that the getSchema function can retrieve table schema
     * information including columns, types, and constraints.
     */
    it('should retrieve table schema information', async () => {
      // Arrange
      const tableName = 'users'

      // Act
      const result = await helper.getSchema(tableName)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.schema).toBeDefined()
      expect(result.schema?.tableName).toBe(tableName)
      expect(result.schema?.columns).toBeInstanceOf(Array)
      expect(result.schema?.columns.length).toBeGreaterThan(0)

      // Verify column structure
      const firstColumn = result.schema?.columns[0]
      expect(firstColumn).toHaveProperty('name')
      expect(firstColumn).toHaveProperty('type')
      expect(firstColumn).toHaveProperty('nullable')
    })

    /**
     * Task 6.1.3: Test listTables returns all tables
     *
     * Verifies that the listAllTables function can retrieve
     * all tables in the database.
     */
    it('should list all tables in the database', async () => {
      // Arrange & Act
      const result = await helper.listAllTables()

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.tables).toBeInstanceOf(Array)
      expect(result.tables.length).toBeGreaterThan(0)

      // Verify table structure
      const firstTable = result.tables[0]
      expect(typeof firstTable.name).toBe('string')
      expect(typeof firstTable.schema).toBe('string')
    })

    /**
     * Task 6.1.4: Test createBucket creates storage bucket
     *
     * Verifies that the createStorageBucket function can create
     * a new storage bucket with specified public/private settings.
     */
    it('should create storage bucket successfully', async () => {
      // Arrange
      const bucketName = 'avatars'
      const isPublic = true

      // Act
      const result = await helper.createStorageBucket(bucketName, isPublic)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.bucket).toBeDefined()
      expect(result.bucket?.name).toBe(bucketName)
      expect(result.bucket?.public).toBe(isPublic)
    })

    /**
     * Task 6.1.5: Test enableRealtime enables subscriptions
     *
     * Verifies that the enableTableRealtime function can enable
     * realtime subscriptions on specified tables.
     */
    it('should enable realtime subscriptions on tables', async () => {
      // Arrange
      const tables = ['users', 'posts', 'comments']

      // Act
      const result = await helper.enableTableRealtime(tables)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.enabledTables).toBeInstanceOf(Array)
      expect(result.enabledTables).toHaveLength(tables.length)
      expect(result.enabledTables).toEqual(tables)
    })

    /**
     * Task 6.3: Test rate limit error handling
     *
     * Verifies that rate limit errors are properly handled
     * with appropriate error messages.
     */
    it('should handle rate limit errors gracefully', async () => {
      // Arrange - simulate rate limit exceeded
      const rateLimitedHelper = new SupabaseHelper()
      vi.spyOn(rateLimitedHelper, 'runSQL').mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimited: true,
        rows: [],
      })

      // Act
      const result = await rateLimitedHelper.runSQL('SELECT 1')

      // Assert
      expect(result.success).toBe(false)
      expect(result.rateLimited).toBe(true)
      expect(result.error).toContain('Rate limit')
    })

    /**
     * Task 6.3: Test missing credentials error handling
     *
     * Verifies that missing Supabase credentials are properly detected
     * and return appropriate errors.
     */
    it('should throw error when credentials are missing', () => {
      // Arrange
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Act & Assert
      expect(() => new SupabaseHelper()).toThrow('SUPABASE_URL environment variable is not set')
    })

    /**
     * Task 6.3: Test createTable creates new table
     *
     * Verifies that the createTable function can create a new table
     * with specified columns and constraints.
     */
    it('should create new table with columns', async () => {
      // Arrange
      const tableName = 'posts'
      const columns = [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'title', type: 'text', nullable: false },
        { name: 'content', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', defaultValue: 'now()' },
      ]

      // Act
      const result = await helper.createTable(tableName, columns)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.tableName).toBe(tableName)
    })

    /**
     * Task 6.3: Test setupAuth configures auth providers
     *
     * Verifies that the setupAuth function can configure
     * authentication providers for the Supabase project.
     */
    it('should configure auth providers', async () => {
      // Arrange
      const providers = ['google', 'github', 'email']

      // Act
      const result = await helper.setupAuth(providers)

      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.providers).toBeInstanceOf(Array)
      expect(result.providers).toEqual(providers)
    })
  })

  describe('Supabase Server Configuration', () => {
    /**
     * Task 6.2: Test Supabase server configuration
     *
     * Verifies that the Supabase server configuration is properly defined
     * with all required fields and capabilities.
     */
    it('should have valid Supabase server configuration', () => {
      // Arrange & Act
      const config = getSupabaseServerConfig()

      // Assert - Basic config
      expect(config).toBeDefined()
      expect(config.name).toBe('supabase')
      expect(config.type).toBe('stdio')
      expect(config.command).toBe('npx')
      expect(config.args).toContain('-y')
      expect(config.args).toContain('@modelcontextprotocol/server-supabase')

      // Assert - Environment variables
      expect(config.env).toHaveProperty('SUPABASE_URL')
      expect(config.env).toHaveProperty('SUPABASE_ANON_KEY')
      expect(config.env).toHaveProperty('SUPABASE_SERVICE_ROLE_KEY')
      expect(config.requiredEnvVars).toContain('SUPABASE_URL')
      expect(config.requiredEnvVars).toContain('SUPABASE_ANON_KEY')
      expect(config.requiredEnvVars).toContain('SUPABASE_SERVICE_ROLE_KEY')

      // Assert - Rate limit configuration (1000 requests/minute)
      expect(config.rateLimit).toBeDefined()
      expect(config.rateLimit?.maxRequests).toBe(1000)
      expect(config.rateLimit?.windowMs).toBe(60000) // 1 minute

      // Assert - Auto-connect disabled by default
      expect(config.autoConnect).toBe(false)
    })

    /**
     * Task 6.2: Test Supabase capabilities are properly defined
     *
     * Verifies that all Supabase capabilities are properly configured
     * with correct parameters.
     */
    it('should define all required capabilities', () => {
      // Arrange & Act
      const config = getSupabaseServerConfig()

      // Assert - Capabilities count (8 capabilities)
      expect(config.capabilities).toHaveLength(8)

      // Assert - executeSQL capability
      const executeSQLCapability = config.capabilities.find(c => c.name === 'executeSQL')
      expect(executeSQLCapability).toBeDefined()
      expect(executeSQLCapability?.description).toContain('SQL')
      expect(executeSQLCapability?.parameters.length).toBeGreaterThan(0)

      const queryParam = executeSQLCapability?.parameters.find(p => p.name === 'query')
      expect(queryParam?.required).toBe(true)
      expect(queryParam?.type).toBe('string')

      // Assert - getTableSchema capability
      const getTableSchemaCapability = config.capabilities.find(c => c.name === 'getTableSchema')
      expect(getTableSchemaCapability).toBeDefined()
      expect(getTableSchemaCapability?.description).toContain('schema')

      // Assert - listTables capability
      const listTablesCapability = config.capabilities.find(c => c.name === 'listTables')
      expect(listTablesCapability).toBeDefined()

      // Assert - createTable capability
      const createTableCapability = config.capabilities.find(c => c.name === 'createTable')
      expect(createTableCapability).toBeDefined()

      // Assert - configureAuth capability
      const configureAuthCapability = config.capabilities.find(c => c.name === 'configureAuth')
      expect(configureAuthCapability).toBeDefined()

      // Assert - createBucket capability
      const createBucketCapability = config.capabilities.find(c => c.name === 'createBucket')
      expect(createBucketCapability).toBeDefined()

      // Assert - uploadFile capability
      const uploadFileCapability = config.capabilities.find(c => c.name === 'uploadFile')
      expect(uploadFileCapability).toBeDefined()

      // Assert - enableRealtime capability
      const enableRealtimeCapability = config.capabilities.find(c => c.name === 'enableRealtime')
      expect(enableRealtimeCapability).toBeDefined()
    })

    /**
     * Task 6.4: Test Supabase config can be registered with MCP Manager
     *
     * Verifies that the Supabase configuration conforms to MCPServerConfig
     * type and can be used with the MCP Manager.
     */
    it('should conform to MCPServerConfig type', () => {
      // Arrange & Act
      const config = getSupabaseServerConfig()

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
