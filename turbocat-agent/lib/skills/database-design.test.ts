/**
 * Database Design Skill Tests
 *
 * Tests for the database-design skill that generates Drizzle ORM schemas
 * from natural language descriptions.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/database-design.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillDetector } from './detector'
import { SkillRegistry } from './registry'
import { SkillParser } from './parser'
import { DatabaseDesignHandler } from './handlers/database-design'
import type { SkillDefinition } from './types'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Task 11.1: Write 4 focused tests for database-design skill
 *
 * Test 1: Test skill detects database-related prompts
 * Test 2: Test entity extraction from natural language
 * Test 3: Test relationship detection (one-to-many, etc.)
 * Test 4: Test Drizzle schema file generation
 */
describe('Database Design Skill', () => {
  let registry: SkillRegistry
  let detector: SkillDetector
  let parser: SkillParser
  let handler: DatabaseDesignHandler

  beforeEach(async () => {
    registry = new SkillRegistry()
    detector = new SkillDetector(registry)
    parser = new SkillParser()
    handler = new DatabaseDesignHandler()

    // Load and register the database-design skill
    const skillPath = join(__dirname, '../../skills/database-design.skill.md')
    try {
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
      // Skill file may not exist yet during initial test run
      console.warn('Database design skill file not found, skipping registration')
    }
  })

  /**
   * Test 1: Test skill detects database-related prompts
   *
   * Verifies that the database-design skill is correctly detected
   * from various database-related user prompts with appropriate confidence.
   */
  describe('Detection', () => {
    it('should detect skill from "create a database schema" prompt', async () => {
      // Arrange
      const prompt = 'create a database schema for my application'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
      expect(dbSkill!.confidence).toBeGreaterThanOrEqual(0.7)
      expect(dbSkill!.reasoning).toBeDefined()
    })

    it('should detect skill from "design tables" prompt', async () => {
      // Arrange
      const prompt = 'help me design the tables for a blog'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
      expect(dbSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from "entity model" prompt', async () => {
      // Arrange
      const prompt = 'I need to create entity models for users and posts'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
    })

    it('should detect skill from "migration" prompt', async () => {
      // Arrange
      const prompt = 'create a migration for adding new tables'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
    })

    it('should NOT detect skill from unrelated prompts', async () => {
      // Arrange
      const prompt = 'create a React component'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeUndefined()
    })
  })

  /**
   * Test 2: Test entity extraction from natural language
   *
   * Verifies that the handler can extract entity names and their
   * properties from natural language descriptions.
   */
  describe('Entity Extraction', () => {
    it('should extract entities from simple description', () => {
      // Arrange
      const prompt = 'Create a schema with users and posts'

      // Act
      const entities = handler.extractEntities(prompt)

      // Assert
      expect(entities).toHaveLength(2)
      expect(entities).toContain('users')
      expect(entities).toContain('posts')
    })

    it('should extract entities from detailed description', () => {
      // Arrange
      const prompt = `
        I need a database schema with:
        - users table with id, name, email
        - posts table with id, title, content
        - comments table with id, text
      `

      // Act
      const entities = handler.extractEntities(prompt)

      // Assert
      expect(entities).toHaveLength(3)
      expect(entities).toContain('users')
      expect(entities).toContain('posts')
      expect(entities).toContain('comments')
    })

    it('should extract fields for each entity', () => {
      // Arrange
      const prompt = 'Create a users table with id, name, email, and createdAt'

      // Act
      const fields = handler.extractFields('users', prompt)

      // Assert
      expect(fields).toContain('id')
      expect(fields).toContain('name')
      expect(fields).toContain('email')
      expect(fields).toContain('createdAt')
    })

    it('should infer field types from context', () => {
      // Arrange
      const prompt = 'users have an email (string), age (number), and isActive (boolean)'

      // Act
      const fieldTypes = handler.inferFieldTypes('users', prompt)

      // Assert
      expect(fieldTypes).toEqual({
        email: 'text',
        age: 'integer',
        isActive: 'boolean',
      })
    })
  })

  /**
   * Test 3: Test relationship detection (one-to-many, etc.)
   *
   * Verifies that the handler can detect relationships between entities
   * from natural language using verbs and relationship indicators.
   */
  describe('Relationship Detection', () => {
    it('should detect one-to-many relationship from "users write posts"', () => {
      // Arrange
      const prompt = 'users write posts'

      // Act
      const relationships = handler.detectRelationships(prompt, ['users', 'posts'])

      // Assert
      expect(relationships).toHaveLength(1)
      expect(relationships[0]).toMatchObject({
        from: 'posts',
        to: 'users',
        type: 'many-to-one',
        foreignKey: 'userId',
      })
    })

    it('should detect one-to-many from "posts have comments"', () => {
      // Arrange
      const prompt = 'posts have many comments'

      // Act
      const relationships = handler.detectRelationships(prompt, ['posts', 'comments'])

      // Assert
      expect(relationships).toHaveLength(1)
      expect(relationships[0]).toMatchObject({
        from: 'comments',
        to: 'posts',
        type: 'many-to-one',
        foreignKey: 'postId',
      })
    })

    it('should detect many-to-many relationship', () => {
      // Arrange
      const prompt = 'users can have many roles, and roles can have many users'

      // Act
      const relationships = handler.detectRelationships(prompt, ['users', 'roles'])

      // Assert
      expect(relationships).toHaveLength(1)
      expect(relationships[0]).toMatchObject({
        from: 'users',
        to: 'roles',
        type: 'many-to-many',
        joinTable: 'userRoles',
      })
    })

    it('should detect belongs-to relationship from "comments belong to posts"', () => {
      // Arrange
      const prompt = 'comments belong to posts'

      // Act
      const relationships = handler.detectRelationships(prompt, ['comments', 'posts'])

      // Assert
      expect(relationships).toHaveLength(1)
      expect(relationships[0]).toMatchObject({
        from: 'comments',
        to: 'posts',
        type: 'many-to-one',
      })
    })

    it('should detect multiple relationships', () => {
      // Arrange
      const prompt = 'users write posts, and posts have comments'

      // Act
      const relationships = handler.detectRelationships(prompt, ['users', 'posts', 'comments'])

      // Assert
      expect(relationships.length).toBeGreaterThanOrEqual(2)
      const userPostRel = relationships.find((r) => r.from === 'posts' && r.to === 'users')
      const postCommentRel = relationships.find((r) => r.from === 'comments' && r.to === 'posts')
      expect(userPostRel).toBeDefined()
      expect(postCommentRel).toBeDefined()
    })
  })

  /**
   * Test 4: Test Drizzle schema file generation
   *
   * Verifies that the handler generates valid Drizzle ORM schema files
   * with correct TypeScript syntax, proper types, and relationships.
   */
  describe('Drizzle Schema Generation', () => {
    it('should generate valid Drizzle schema for single entity', () => {
      // Arrange
      const entity = 'users'
      const fields = {
        id: 'text',
        name: 'text',
        email: 'text',
        createdAt: 'timestamp',
      }

      // Act
      const schema = handler.generateDrizzleSchema(entity, fields)

      // Assert
      expect(schema).toContain('import { pgTable')
      expect(schema).toContain('export const users = pgTable')
      expect(schema).toContain("id: text('id').primaryKey()")
      expect(schema).toContain("name: text('name')")
      expect(schema).toContain("email: text('email')")
      expect(schema).toContain("createdAt: timestamp('created_at')")
    })

    it('should generate schema with foreign key relationships', () => {
      // Arrange
      const entity = 'posts'
      const fields = {
        id: 'text',
        title: 'text',
        content: 'text',
        userId: 'text',
      }
      const relationships: Array<{ from: string; to: string; type: 'many-to-one' | 'one-to-many' | 'many-to-many'; foreignKey?: string; joinTable?: string }> = [
        {
          from: 'posts',
          to: 'users',
          type: 'many-to-one',
          foreignKey: 'userId',
        },
      ]

      // Act
      const schema = handler.generateDrizzleSchema(entity, fields, relationships)

      // Assert
      expect(schema).toContain('.references(() => users.id')
      expect(schema).toContain('userId')
    })

    it('should generate complete schema file with imports and exports', () => {
      // Arrange
      const entities: Array<{ name: string; fields: { [field: string]: string } }> = [
        {
          name: 'users',
          fields: { id: 'text', name: 'text', email: 'text' },
        },
        {
          name: 'posts',
          fields: { id: 'text', title: 'text', userId: 'text' },
        },
      ]

      // Act
      const schemaFile = handler.generateSchemaFile(entities)

      // Assert
      expect(schemaFile).toContain("import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'")
      expect(schemaFile).toContain('export const users = pgTable')
      expect(schemaFile).toContain('export const posts = pgTable')
    })

    it('should generate TypeScript types for schema', () => {
      // Arrange
      const entity = 'users'
      const fields = {
        id: 'text',
        name: 'text',
        email: 'text',
      }

      // Act
      const types = handler.generateTypes(entity, fields)

      // Assert
      expect(types).toContain('export type User =')
      expect(types).toContain('export type InsertUser =')
    })

    it('should generate migration SQL', () => {
      // Arrange
      const entity = 'users'
      const fields = {
        id: 'text',
        name: 'text',
        email: 'text',
      }

      // Act
      const sql = handler.generateMigrationSQL(entity, fields)

      // Assert
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
      expect(sql).toContain('id TEXT PRIMARY KEY')
      expect(sql).toContain('name TEXT')
      expect(sql).toContain('email TEXT')
    })
  })

  /**
   * End-to-End Test
   *
   * Tests the complete flow from prompt to generated schema files.
   */
  describe('End-to-End Schema Generation', () => {
    it('should generate complete blog schema from natural language', () => {
      // Arrange
      const prompt = `
        Create a blog schema with:
        - users table (id, name, email)
        - posts table (id, title, content, userId)
        - comments table (id, text, postId, userId)

        Users write posts, and posts have comments.
        Comments also belong to users.
      `

      // Act
      const result = handler.processPrompt(prompt)

      // Assert
      expect(result.entities).toHaveLength(3)
      expect(result.schemas).toHaveLength(3)
      expect(result.relationships.length).toBeGreaterThanOrEqual(2)

      // Verify schema content
      const usersSchema = result.schemas.find((s) => s.includes('export const users'))
      const postsSchema = result.schemas.find((s) => s.includes('export const posts'))
      const commentsSchema = result.schemas.find((s) => s.includes('export const comments'))

      expect(usersSchema).toBeDefined()
      expect(postsSchema).toBeDefined()
      expect(commentsSchema).toBeDefined()

      // Verify relationships are reflected in schemas
      expect(postsSchema).toContain('userId')
      expect(commentsSchema).toContain('postId')
      expect(commentsSchema).toContain('userId')
    })
  })
})
