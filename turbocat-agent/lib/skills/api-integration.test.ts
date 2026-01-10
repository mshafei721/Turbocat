/**
 * API Integration Skill Tests
 *
 * Tests for the api-integration skill that generates Next.js App Router API routes
 * with Zod validation and proper error handling.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/api-integration.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillDetector } from './detector'
import { MockSkillRegistry as SkillRegistry } from './__mocks__/registry'
import { SkillParser } from './parser'
import { APIIntegrationHandler } from './handlers/api-integration'
import type { SkillDefinition } from './types'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Use process.cwd() as we run tests from turbocat-agent directory
const skillsDir = join(process.cwd(), 'skills')

/**
 * Task 12.1: Write 4 focused tests for api-integration skill
 *
 * Test 1: Test skill detects API-related prompts
 * Test 2: Test route generation for CRUD operations
 * Test 3: Test Zod validation schema generation
 * Test 4: Test error handling utilities generation
 */
describe('API Integration Skill', () => {
  let registry: SkillRegistry
  let detector: SkillDetector
  let parser: SkillParser
  let handler: APIIntegrationHandler

  beforeEach(async () => {
    registry = new SkillRegistry()
    detector = new SkillDetector(registry)
    parser = new SkillParser()
    handler = new APIIntegrationHandler()

    // Load and register the api-integration skill
    const skillPath = join(skillsDir, 'api-integration.skill.md')
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
      console.warn('API integration skill registration failed:', error instanceof Error ? error.message : error)
    }
  })

  /**
   * Test 1: Test skill detects API-related prompts
   *
   * Verifies that the api-integration skill is correctly detected
   * from various API-related user prompts with appropriate confidence.
   */
  describe('Detection', () => {
    it('should detect skill from "create api endpoint" prompt', async () => {
      // Arrange
      const prompt = 'create an API endpoint for user management'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const apiSkill = results.find((r) => r.skill.slug === 'api-integration')
      expect(apiSkill).toBeDefined()
      expect(apiSkill!.confidence).toBeGreaterThanOrEqual(0.7)
      expect(apiSkill!.reasoning).toBeDefined()
    })

    it('should detect skill from "rest api" prompt', async () => {
      // Arrange
      const prompt = 'build a REST API for my blog posts'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const apiSkill = results.find((r) => r.skill.slug === 'api-integration')
      expect(apiSkill).toBeDefined()
      expect(apiSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from "route" prompt', async () => {
      // Arrange
      const prompt = 'I need API routes for CRUD operations on products'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const apiSkill = results.find((r) => r.skill.slug === 'api-integration')
      expect(apiSkill).toBeDefined()
      expect(apiSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from "fetch request" prompt', async () => {
      // Arrange
      const prompt = 'create endpoints to fetch and update user data'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      const apiSkill = results.find((r) => r.skill.slug === 'api-integration')
      expect(apiSkill).toBeDefined()
    })
  })

  /**
   * Test 2: Test route generation for CRUD operations
   *
   * Verifies that the handler generates valid Next.js App Router API routes
   * for standard CRUD operations with proper HTTP methods.
   */
  describe('Route Generation', () => {
    it('should generate GET route for listing resources', () => {
      // Arrange
      const resource = 'posts'
      const operations = ['list']

      // Act
      const routes = handler.generateRoutes(resource, operations)

      // Assert
      expect(routes).toHaveLength(1)
      expect(routes[0].method).toBe('GET')
      expect(routes[0].path).toBe('/api/posts')
      expect(routes[0].code).toContain('export async function GET')
      expect(routes[0].code).toContain('NextRequest')
      expect(routes[0].code).toContain('NextResponse')
    })

    it('should generate POST route for creating resources', () => {
      // Arrange
      const resource = 'users'
      const operations = ['create']

      // Act
      const routes = handler.generateRoutes(resource, operations)

      // Assert
      expect(routes).toHaveLength(1)
      expect(routes[0].method).toBe('POST')
      expect(routes[0].path).toBe('/api/users')
      expect(routes[0].code).toContain('export async function POST')
      expect(routes[0].code).toContain('await request.json()')
    })

    it('should generate PUT and DELETE routes for single resource', () => {
      // Arrange
      const resource = 'products'
      const operations = ['update', 'delete']

      // Act
      const routes = handler.generateRoutes(resource, operations)

      // Assert
      expect(routes).toHaveLength(2)

      const putRoute = routes.find((r) => r.method === 'PUT')
      expect(putRoute).toBeDefined()
      expect(putRoute!.path).toBe('/api/products/[id]')
      expect(putRoute!.code).toContain('export async function PUT')
      expect(putRoute!.code).toContain('const { id } = await params')

      const deleteRoute = routes.find((r) => r.method === 'DELETE')
      expect(deleteRoute).toBeDefined()
      expect(deleteRoute!.path).toBe('/api/products/[id]')
      expect(deleteRoute!.code).toContain('export async function DELETE')
    })

    it('should generate all CRUD routes when requested', () => {
      // Arrange
      const resource = 'articles'
      const operations = ['list', 'get', 'create', 'update', 'delete']

      // Act
      const routes = handler.generateRoutes(resource, operations)

      // Assert
      expect(routes.length).toBeGreaterThanOrEqual(5)
      expect(routes.some((r) => r.method === 'GET' && !r.path.includes('[id]'))).toBe(true)
      expect(routes.some((r) => r.method === 'GET' && r.path.includes('[id]'))).toBe(true)
      expect(routes.some((r) => r.method === 'POST')).toBe(true)
      expect(routes.some((r) => r.method === 'PUT')).toBe(true)
      expect(routes.some((r) => r.method === 'DELETE')).toBe(true)
    })
  })

  /**
   * Test 3: Test Zod validation schema generation
   *
   * Verifies that the handler generates valid Zod schemas for request
   * validation with proper TypeScript types.
   */
  describe('Zod Schema Generation', () => {
    it('should generate Zod schema with basic field types', () => {
      // Arrange
      const resource = 'user'
      const fields = {
        name: 'string',
        email: 'string',
        age: 'number',
        isActive: 'boolean',
      }

      // Act
      const schema = handler.generateZodSchema(resource, fields)

      // Assert
      expect(schema).toContain('import { z } from \'zod\'')
      expect(schema).toContain('z.object')
      expect(schema).toContain('name: z.string()')
      expect(schema).toContain('email: z.string().email()')
      expect(schema).toContain('age: z.number()')
      expect(schema).toContain('isActive: z.boolean()')
    })

    it('should generate TypeScript type from Zod schema', () => {
      // Arrange
      const resource = 'product'
      const fields = {
        title: 'string',
        price: 'number',
        description: 'string',
      }

      // Act
      const schema = handler.generateZodSchema(resource, fields)

      // Assert
      expect(schema).toContain('export type Product = z.infer<typeof productSchema>')
      expect(schema).toContain('export type CreateProduct = z.infer<typeof createProductSchema>')
    })

    it('should handle optional and required fields', () => {
      // Arrange
      const resource = 'post'
      const fields = {
        title: 'string',
        content: 'string',
        publishedAt: 'date?',
        tags: 'array?',
      }

      // Act
      const schema = handler.generateZodSchema(resource, fields)

      // Assert
      expect(schema).toContain('title: z.string()')
      expect(schema).toContain('content: z.string()')
      expect(schema).toContain('.optional()')
    })

    it('should add validation constraints for specific field types', () => {
      // Arrange
      const resource = 'account'
      const fields = {
        email: 'email',
        url: 'url',
        username: 'string',
        password: 'string',
      }

      // Act
      const schema = handler.generateZodSchema(resource, fields)

      // Assert
      expect(schema).toContain('.email()')
      expect(schema).toContain('.url()')
      expect(schema).toContain('.min(')
    })
  })

  /**
   * Test 4: Test error handling utilities generation
   *
   * Verifies that the handler generates proper error handling utilities
   * for API routes with consistent error responses.
   */
  describe('Error Handling', () => {
    it('should generate error handler utility', () => {
      // Act
      const errorHandler = handler.generateErrorHandler()

      // Assert
      expect(errorHandler).toContain('export function handleAPIError')
      expect(errorHandler).toContain('NextResponse.json')
      expect(errorHandler).toContain('error.message')
      expect(errorHandler).toContain('status:')
    })

    it('should handle Zod validation errors specifically', () => {
      // Act
      const errorHandler = handler.generateErrorHandler()

      // Assert
      expect(errorHandler).toContain('ZodError')
      expect(errorHandler).toContain('400')
      expect(errorHandler).toContain('validation')
    })

    it('should include error types for common HTTP errors', () => {
      // Act
      const errorTypes = handler.generateErrorTypes()

      // Assert
      expect(errorTypes).toContain('NotFoundError')
      expect(errorTypes).toContain('UnauthorizedError')
      expect(errorTypes).toContain('ValidationError')
      expect(errorTypes).toContain('extends Error')
    })

    it('should generate try-catch wrapper in routes', () => {
      // Arrange
      const resource = 'items'
      const operations = ['create']

      // Act
      const routes = handler.generateRoutes(resource, operations)

      // Assert
      expect(routes[0].code).toContain('try {')
      expect(routes[0].code).toContain('catch')
      expect(routes[0].code).toContain('handleAPIError')
    })
  })

  /**
   * Integration test: Full API route generation from prompt
   */
  describe('Integration', () => {
    it('should process prompt and generate complete API structure', () => {
      // Arrange
      const prompt = 'Create a REST API for managing blog posts with CRUD operations'

      // Act
      const result = handler.processPrompt(prompt)

      // Assert
      expect(result.resource).toBe('posts')
      expect(result.routes.length).toBeGreaterThan(0)
      expect(result.schemas).toBeDefined()
      expect(result.errorHandlers).toBeDefined()
      expect(result.files.length).toBeGreaterThan(0)
    })
  })
})
