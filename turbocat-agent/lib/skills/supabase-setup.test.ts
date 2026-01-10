/**
 * Supabase Setup Skill Tests
 *
 * Tests for the supabase-setup skill that configures Supabase database,
 * auth, storage, and realtime features via MCP.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/supabase-setup.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillDetector } from './detector'
import { MockSkillRegistry as SkillRegistry } from './__mocks__/registry'
import { SkillParser } from './parser'
import { SupabaseSetupHandler } from './handlers/supabase-setup'
import type { SkillDefinition } from './types'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Use process.cwd() as we run tests from turbocat-agent directory
const skillsDir = join(process.cwd(), 'skills')

/**
 * Task 12.4: Write 3 focused tests for supabase-setup skill
 *
 * Test 1: Test skill detects Supabase-related prompts
 * Test 2: Test database provisioning commands
 * Test 3: Test auth configuration generation
 */
describe('Supabase Setup Skill', () => {
  let registry: SkillRegistry
  let detector: SkillDetector
  let parser: SkillParser
  let handler: SupabaseSetupHandler

  beforeEach(async () => {
    registry = new SkillRegistry()
    detector = new SkillDetector(registry)
    parser = new SkillParser()
    handler = new SupabaseSetupHandler()

    // Load and register the supabase-setup skill
    const skillPath = join(skillsDir, 'supabase-setup.skill.md')
    try {
      if (!existsSync(skillPath)) {
        console.warn(`Skill file not found at: ${skillPath}`)
        return
      }
      const skillContent = readFileSync(skillPath, 'utf-8')
      const parsed = await parser.parse(skillContent)

      const skill: SkillDefinition = {
        name: parsed.frontmatter.name,
        slug: parsed.frontmatter.name.toLowerCase().replace(/\s+/g, '-'),
        description: parsed.frontmatter.description,
        version: parsed.frontmatter.version || '1.0.0',
        category: parsed.frontmatter.category,
        tags: parsed.frontmatter.tags,
        scope: parsed.frontmatter.scope || 'global',
        content: skillContent,
        mcpDependencies: parsed.frontmatter.mcp_dependencies || [],
        triggers: parsed.frontmatter.triggers || [],
      }

      await registry.register(skill)
    } catch (error) {
      // Log the actual error for debugging
      console.warn('Supabase setup skill registration failed:', error instanceof Error ? error.message : error)
    }
  })

  /**
   * Test 1: Test skill detects Supabase-related prompts
   *
   * Verifies that the supabase-setup skill is correctly detected
   * from various Supabase-related user prompts.
   */
  describe('Detection', () => {
    it('should detect skill from "setup supabase" prompt', async () => {
      // Arrange
      const prompt = 'setup supabase for my application'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const supabaseSkill = results.find((r) => r.skill.slug === 'supabase-setup')
      expect(supabaseSkill).toBeDefined()
      expect(supabaseSkill!.confidence).toBeGreaterThanOrEqual(0.7)
      expect(supabaseSkill!.reasoning).toBeDefined()
    })

    it('should detect skill from "auth configuration" prompt', async () => {
      // Arrange
      const prompt = 'configure supabase auth with Google and GitHub providers'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const supabaseSkill = results.find((r) => r.skill.slug === 'supabase-setup')
      expect(supabaseSkill).toBeDefined()
      expect(supabaseSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from "storage bucket" prompt', async () => {
      // Arrange
      const prompt = 'create a storage bucket for user uploads in supabase'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const supabaseSkill = results.find((r) => r.skill.slug === 'supabase-setup')
      expect(supabaseSkill).toBeDefined()
      expect(supabaseSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from "realtime" prompt', async () => {
      // Arrange
      const prompt = 'enable realtime subscriptions for posts table'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const supabaseSkill = results.find((r) => r.skill.slug === 'supabase-setup')
      expect(supabaseSkill).toBeDefined()
    })
  })

  /**
   * Test 2: Test database provisioning commands
   *
   * Verifies that the handler generates proper MCP commands for
   * database table creation and configuration.
   */
  describe('Database Provisioning', () => {
    it('should generate table creation command', () => {
      // Arrange
      const table = {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'text', unique: true, notNull: true },
          { name: 'name', type: 'text', notNull: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }

      // Act
      const command = handler.generateTableCommand(table)

      // Assert
      expect(command.action).toBe('create_table')
      expect(command.tableName).toBe('users')
      expect(command.columns).toHaveLength(4)
      expect(command.sql).toContain('CREATE TABLE users')
      // Handler uses uppercase types and includes DEFAULT clause
      expect(command.sql).toContain('id UUID PRIMARY KEY')
      expect(command.sql).toContain('email TEXT UNIQUE NOT NULL')
    })

    it('should generate RLS policy creation command', () => {
      // Arrange
      const policy: { table: string; name: string; operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'; using?: string; withCheck?: string } = {
        table: 'posts',
        name: 'Users can view published posts',
        operation: 'SELECT',
        using: 'published = true',
      }

      // Act
      const command = handler.generateRLSPolicy(policy)

      // Assert
      expect(command.action).toBe('create_policy')
      expect(command.table).toBe('posts')
      expect(command.name).toBe('Users can view published posts')
      expect(command.sql).toContain('CREATE POLICY')
      expect(command.sql).toContain('ON posts')
      expect(command.sql).toContain('FOR SELECT')
      expect(command.sql).toContain('USING (published = true)')
    })

    it('should enable RLS on table', () => {
      // Arrange
      const tableName = 'profiles'

      // Act
      const command = handler.enableRLS(tableName)

      // Assert
      expect(command.action).toBe('enable_rls')
      expect(command.table).toBe('profiles')
      expect(command.sql).toContain('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY')
    })

    it('should generate migration from schema definition', () => {
      // Arrange
      const schema = {
        tables: [
          {
            name: 'categories',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'name', type: 'text', notNull: true },
            ],
          },
          {
            name: 'products',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'category_id', type: 'uuid', references: 'categories(id)' },
              { name: 'title', type: 'text', notNull: true },
            ],
          },
        ],
      }

      // Act
      const migration = handler.generateMigration(schema)

      // Assert
      expect(migration.commands).toHaveLength(2)
      expect(migration.sql).toContain('CREATE TABLE categories')
      expect(migration.sql).toContain('CREATE TABLE products')
      expect(migration.sql).toContain('REFERENCES categories(id)')
    })
  })

  /**
   * Test 3: Test auth configuration generation
   *
   * Verifies that the handler generates proper authentication
   * configuration for various auth providers.
   */
  describe('Auth Configuration', () => {
    it('should generate OAuth provider configuration', () => {
      // Arrange
      const providers = ['google', 'github', 'discord']

      // Act
      const config = handler.generateAuthConfig(providers)

      // Assert
      expect(config.providers).toHaveLength(3)
      expect(config.providers).toContain('google')
      expect(config.providers).toContain('github')
      expect(config.providers).toContain('discord')
      expect(config.envVars).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(config.envVars).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })

    it('should generate client-side auth integration code', () => {
      // Arrange
      const config = { providers: ['google'] }

      // Act
      const code = handler.generateClientAuthCode(config)

      // Assert
      // Handler imports createBrowserClient and exports createClient function
      expect(code).toContain('import { createBrowserClient }')
      expect(code).toContain('@supabase/ssr')
      expect(code).toContain('signInWithOAuth')
      expect(code).toContain('provider: \'google\'')
    })

    it('should generate server-side auth integration code', () => {
      // Arrange
      const config = { providers: ['github'] }

      // Act
      const code = handler.generateServerAuthCode(config)

      // Assert
      expect(code).toContain('import { createServerClient }')
      expect(code).toContain('cookies()')
      expect(code).toContain('getSession')
      // Note: auth/callback is in the callback route, not server auth code
      expect(code).toContain('getUser')
    })

    it('should generate auth callback route handler', () => {
      // Act
      const route = handler.generateAuthCallbackRoute()

      // Assert
      expect(route.path).toBe('app/auth/callback/route.ts')
      expect(route.code).toContain('export async function GET')
      expect(route.code).toContain('exchangeCodeForSession')
      expect(route.code).toContain('redirect')
    })
  })

  /**
   * Storage bucket configuration tests
   */
  describe('Storage Configuration', () => {
    it('should generate storage bucket creation command', () => {
      // Arrange
      const bucket = {
        name: 'avatars',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }

      // Act
      const command = handler.generateStorageBucket(bucket)

      // Assert
      expect(command.action).toBe('create_bucket')
      expect(command.name).toBe('avatars')
      expect(command.public).toBe(true)
      expect(command.config).toContain('fileSizeLimit')
      expect(command.config).toContain('allowedMimeTypes')
    })

    it('should generate storage upload client code', () => {
      // Arrange
      const bucketName = 'documents'

      // Act
      const code = handler.generateStorageUploadCode(bucketName)

      // Assert
      expect(code).toContain('supabase.storage')
      expect(code).toContain('.from(\'documents\')')
      expect(code).toContain('.upload(')
      expect(code).toContain('file: File')
    })
  })

  /**
   * Realtime configuration tests
   */
  describe('Realtime Configuration', () => {
    it('should enable realtime for table', () => {
      // Arrange
      const tableName = 'messages'

      // Act
      const command = handler.enableRealtime(tableName)

      // Assert
      expect(command.action).toBe('enable_realtime')
      expect(command.table).toBe('messages')
      expect(command.sql).toContain('ALTER PUBLICATION')
      expect(command.sql).toContain('ADD TABLE messages')
    })

    it('should generate realtime subscription client code', () => {
      // Arrange
      const table = 'notifications'
      const events = ['INSERT', 'UPDATE']

      // Act
      const code = handler.generateRealtimeSubscription(table, events)

      // Assert
      // Note: code uses chained method calls with newlines, so check for .channel( not supabase.channel(
      expect(code).toContain('.channel(')
      expect(code).toContain('.on(')
      expect(code).toContain('postgres_changes')
      expect(code).toContain(`table: '${table}'`)
      expect(code).toContain('event: \'INSERT\'')
      expect(code).toContain('event: \'UPDATE\'')
      expect(code).toContain('.subscribe(')
    })
  })

  /**
   * Integration test: Full Supabase setup from prompt
   */
  describe('Integration', () => {
    it('should process prompt and generate complete Supabase configuration', () => {
      // Arrange
      const prompt =
        'Setup Supabase with users and posts tables, Google auth, storage for images, and realtime for posts'

      // Act
      const result = handler.processPrompt(prompt)

      // Assert
      expect(result.tables.length).toBeGreaterThan(0)
      expect(result.authProviders).toContain('google')
      expect(result.storageBuckets.length).toBeGreaterThan(0)
      expect(result.realtimeTables).toContain('posts')
      expect(result.files.length).toBeGreaterThan(0)
    })
  })
})
