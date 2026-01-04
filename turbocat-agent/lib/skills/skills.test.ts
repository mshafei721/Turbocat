/**
 * Skills System Tests
 *
 * Tests for Skills System components following TDD approach.
 * Tests written before implementation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/skills.test.ts
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import { SkillParser } from './parser'
import { SkillRegistry } from './registry'
import { SkillDetector } from './detector'
import { SkillExecutor } from './executor'
import type { SkillDefinition, ExecutionContext, ExecutionTrace } from './types'
import { nanoid } from 'nanoid'

// Mock database module
vi.mock('../db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}))

// In-memory storage for tests
const mockSkillsDb = new Map<string, any>()

// Setup before all tests
beforeAll(() => {
  // Mock the database operations
  const { db } = vi.mocked(await import('../db/client'))

  // Mock insert
  db.insert = vi.fn(() => ({
    values: vi.fn((data: any) => {
      mockSkillsDb.set(data.slug, data)
      return Promise.resolve()
    }),
  })) as any

  // Mock select
  db.select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn((condition: any) => ({
        limit: vi.fn(() => {
          const skills = Array.from(mockSkillsDb.values())
          return Promise.resolve(skills.slice(0, 1))
        }),
      })),
    })),
  })) as any

  // Mock update
  db.update = vi.fn(() => ({
    set: vi.fn((data: any) => ({
      where: vi.fn((condition: any) => {
        // Find and update the skill
        for (const [key, value] of mockSkillsDb.entries()) {
          mockSkillsDb.set(key, { ...value, ...data })
        }
        return Promise.resolve()
      }),
    })),
  })) as any
})

afterAll(() => {
  mockSkillsDb.clear()
})

describe('Skills System', () => {
  /**
   * Task 8.1.5: Test YAML frontmatter parsing
   *
   * Verifies that the parser can correctly parse SKILL.md files
   * with YAML frontmatter and markdown body.
   */
  describe('SkillParser - YAML Frontmatter Parsing', () => {
    let parser: SkillParser

    beforeEach(() => {
      parser = new SkillParser()
    })

    it('should parse valid SKILL.md with frontmatter and body', async () => {
      // Arrange
      const skillContent = `---
name: database-design
description: Design database schemas
version: 1.0.0
category: backend
tags:
  - database
  - schema
scope: global
mcp_dependencies:
  - server: supabase
    required: false
    capabilities: ["query", "schema"]
triggers:
  - pattern: database|schema|table
    confidence: 0.8
    examples:
      - "create a database schema"
      - "design the tables"
---

## Overview
This skill helps design database schemas.

## When to Use This Skill
- When user asks about database design
- When creating tables
`

      // Act
      const result = await parser.parse(skillContent)

      // Assert
      expect(result.frontmatter.name).toBe('database-design')
      expect(result.frontmatter.description).toBe('Design database schemas')
      expect(result.frontmatter.version).toBe('1.0.0')
      expect(result.frontmatter.category).toBe('backend')
      expect(result.frontmatter.tags).toEqual(['database', 'schema'])
      expect(result.frontmatter.scope).toBe('global')
      expect(result.frontmatter.mcp_dependencies).toHaveLength(1)
      expect(result.frontmatter.mcp_dependencies![0].server).toBe('supabase')
      expect(result.frontmatter.triggers).toHaveLength(1)
      expect(result.frontmatter.triggers![0].pattern).toBe('database|schema|table')
    })

    /**
     * Task 8.1.6: Test skill content body extraction
     *
     * Verifies that the parser correctly extracts the markdown body
     * content separately from the frontmatter.
     */
    it('should extract markdown body content', async () => {
      // Arrange
      const skillContent = `---
name: test-skill
description: Test skill
---

## Overview
This is the body content.

## Examples
Some examples here.
`

      // Act
      const result = await parser.parse(skillContent)

      // Assert
      expect(result.body).toContain('## Overview')
      expect(result.body).toContain('This is the body content')
      expect(result.body).toContain('## Examples')
      expect(result.body.trim()).not.toContain('---')
    })

    it('should validate required fields in frontmatter', async () => {
      // Arrange
      const invalidContent = `---
description: Missing name field
---
Body content
`

      // Act & Assert
      await expect(parser.parse(invalidContent)).rejects.toThrow()
    })

    it('should handle skills without optional fields', async () => {
      // Arrange
      const minimalContent = `---
name: minimal-skill
description: Minimal skill definition
---
Body content
`

      // Act
      const result = await parser.parse(minimalContent)

      // Assert
      expect(result.frontmatter.name).toBe('minimal-skill')
      expect(result.frontmatter.version).toBeUndefined()
      expect(result.frontmatter.category).toBeUndefined()
    })
  })

  /**
   * Task 8.1.1: Test skill registration stores in database
   *
   * Verifies that skills can be registered and persisted to the database.
   */
  describe('SkillRegistry - Skill Registration', () => {
    let registry: SkillRegistry

    beforeEach(() => {
      registry = new SkillRegistry()
    })

    it('should register a new skill and store in database', async () => {
      // Arrange
      const skill: SkillDefinition = {
        name: 'Test Skill',
        slug: 'test-skill',
        description: 'A test skill',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: test\n---\nBody',
        mcpDependencies: [],
        triggers: [
          {
            pattern: 'test',
            confidence: 0.8,
            examples: ['run a test'],
          },
        ],
      }

      // Act
      const skillId = await registry.register(skill)

      // Assert
      expect(skillId).toBeDefined()
      expect(typeof skillId).toBe('string')
      expect(skillId.length).toBeGreaterThan(0)

      // Verify we can retrieve it
      const retrieved = await registry.get('test-skill')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Test Skill')
      expect(retrieved?.slug).toBe('test-skill')
    })

    it('should update existing skill', async () => {
      // Arrange
      const skill: SkillDefinition = {
        name: 'Original Name',
        slug: 'update-test',
        description: 'Original description',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: test\n---\nBody',
        mcpDependencies: [],
        triggers: [],
      }

      await registry.register(skill)

      // Act
      await registry.update('update-test', {
        description: 'Updated description',
        version: '2.0.0',
      })

      // Assert
      const updated = await registry.get('update-test')
      expect(updated?.description).toBe('Updated description')
      expect(updated?.version).toBe('2.0.0')
      expect(updated?.name).toBe('Original Name') // Unchanged
    })

    it('should list skills with filtering', async () => {
      // Arrange
      await registry.register({
        name: 'Backend Skill',
        slug: 'backend-skill',
        description: 'Backend skill',
        version: '1.0.0',
        category: 'backend',
        scope: 'global',
        content: '---\nname: backend\n---\nBody',
        mcpDependencies: [],
        triggers: [],
      })

      await registry.register({
        name: 'Frontend Skill',
        slug: 'frontend-skill',
        description: 'Frontend skill',
        version: '1.0.0',
        category: 'frontend',
        scope: 'global',
        content: '---\nname: frontend\n---\nBody',
        mcpDependencies: [],
        triggers: [],
      })

      // Act
      const backendSkills = await registry.list({ category: 'backend' })
      const allSkills = await registry.list()

      // Assert
      expect(backendSkills.length).toBe(1)
      expect(backendSkills[0].slug).toBe('backend-skill')
      expect(allSkills.length).toBeGreaterThanOrEqual(2)
    })

    it('should deactivate skill', async () => {
      // Arrange
      await registry.register({
        name: 'Deactivate Test',
        slug: 'deactivate-test',
        description: 'Test deactivation',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: test\n---\nBody',
        mcpDependencies: [],
        triggers: [],
      })

      // Act
      await registry.deactivate('deactivate-test')

      // Assert
      const activeSkills = await registry.list({ active: true })
      const inactiveSkills = await registry.list({ active: false })

      expect(activeSkills.find((s) => s.slug === 'deactivate-test')).toBeUndefined()
      expect(inactiveSkills.find((s) => s.slug === 'deactivate-test')).toBeDefined()
    })
  })

  /**
   * Task 8.1.2: Test skill detection matches trigger patterns
   *
   * Verifies that the detector can identify relevant skills
   * from user prompts with >90% accuracy.
   */
  describe('SkillDetector - Pattern Matching', () => {
    let detector: SkillDetector
    let registry: SkillRegistry

    beforeEach(async () => {
      registry = new SkillRegistry()
      detector = new SkillDetector(registry)

      // Register test skills
      await registry.register({
        name: 'Database Design',
        slug: 'database-design',
        description: 'Design database schemas',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: database-design\n---\nBody',
        mcpDependencies: [],
        triggers: [
          {
            pattern: 'database|schema|table',
            confidence: 0.7,
            examples: ['create a database schema', 'design the tables', 'set up database'],
          },
        ],
      })

      await registry.register({
        name: 'API Integration',
        slug: 'api-integration',
        description: 'Integrate external APIs',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: api-integration\n---\nBody',
        mcpDependencies: [],
        triggers: [
          {
            pattern: 'api|endpoint|rest|graphql',
            confidence: 0.7,
            examples: ['create an API endpoint', 'integrate with REST API'],
          },
        ],
      })
    })

    it('should detect skill from keyword pattern match', async () => {
      // Arrange
      const prompt = 'I need to create a database schema for users'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      expect(results.length).toBeGreaterThan(0)
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
      expect(dbSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from example similarity', async () => {
      // Arrange
      const prompt = 'design the tables for my application'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      expect(results.length).toBeGreaterThan(0)
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
    })

    it('should return multiple skills when relevant', async () => {
      // Arrange
      const prompt = 'create a database schema and API endpoints'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      expect(results.length).toBeGreaterThanOrEqual(2)
      expect(results.find((r) => r.skill.slug === 'database-design')).toBeDefined()
      expect(results.find((r) => r.skill.slug === 'api-integration')).toBeDefined()
    })

    it('should not detect skills below confidence threshold', async () => {
      // Arrange
      const prompt = 'hello world'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      expect(results.length).toBe(0)
    })

    it('should provide reasoning for detection', async () => {
      // Arrange
      const prompt = 'create a database schema'

      // Act
      const results = await detector.detect(prompt)

      // Assert
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].reasoning).toBeDefined()
      expect(typeof results[0].reasoning).toBe('string')
      expect(results[0].reasoning.length).toBeGreaterThan(0)
    })
  })

  /**
   * Task 8.1.3: Test skill execution creates trace
   *
   * Verifies that skill execution creates a complete execution trace
   * with all steps and metadata.
   */
  describe('SkillExecutor - Execution Trace', () => {
    let executor: SkillExecutor

    beforeEach(() => {
      executor = new SkillExecutor()
    })

    it('should create execution trace with all steps', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Test Skill',
        slug: 'test-skill',
        description: 'Test skill',
        version: '1.0.0',
        scope: 'global',
        content: `---
name: test-skill
---
## Instructions
Step 1: Do something
Step 2: Do something else
`,
        mcpDependencies: [],
        triggers: [],
      }

      const context: ExecutionContext = {
        skill,
        prompt: 'test prompt',
        userId: 'user-123',
        taskId: 'task-456',
        confidence: 0.9,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map(),
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'test prompt',
          detectedConfidence: 0.9,
          detectionReasoning: 'Test reasoning',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(context)

      // Assert
      expect(trace).toBeDefined()
      expect(trace.traceId).toBeDefined()
      expect(trace.skillId).toBe(skill.id)
      expect(trace.skillName).toBe('Test Skill')
      expect(trace.steps.length).toBeGreaterThan(0)
      expect(trace.status).toBe('completed')
      expect(trace.durationMs).toBeGreaterThan(0)
    })

    it('should track step-by-step execution', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Multi-Step Skill',
        slug: 'multi-step',
        description: 'Multi-step skill',
        version: '1.0.0',
        scope: 'global',
        content: `---
name: multi-step
---
## Instructions
1. Parse input
2. Process data
3. Generate output
`,
        mcpDependencies: [],
        triggers: [],
      }

      const context: ExecutionContext = {
        skill,
        prompt: 'execute multi-step',
        userId: 'user-123',
        confidence: 0.8,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map(),
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'execute multi-step',
          detectedConfidence: 0.8,
          detectionReasoning: 'Test',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(context)

      // Assert
      expect(trace.steps.length).toBeGreaterThanOrEqual(3)
      trace.steps.forEach((step) => {
        expect(step.status).toBe('completed')
        expect(step.startedAt).toBeDefined()
        expect(step.completedAt).toBeDefined()
      })
    })

    it('should handle execution errors gracefully', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Error Skill',
        slug: 'error-skill',
        description: 'Skill that fails',
        version: '1.0.0',
        scope: 'global',
        content: `---
name: error-skill
---
This will cause an error
`,
        mcpDependencies: [
          {
            server: 'nonexistent-server',
            required: true,
            capabilities: ['test'],
          },
        ],
        triggers: [],
      }

      const context: ExecutionContext = {
        skill,
        prompt: 'test error',
        userId: 'user-123',
        confidence: 0.8,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map(),
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'test error',
          detectedConfidence: 0.8,
          detectionReasoning: 'Test',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(context)

      // Assert
      expect(trace.status).toBe('failed')
      expect(trace.errorMessage).toBeDefined()
    })
  })

  /**
   * Task 8.1.4: Test MCP dependency resolution
   *
   * Verifies that the executor checks for required MCP servers
   * and fails gracefully when they are not available.
   */
  describe('SkillExecutor - MCP Dependency Resolution', () => {
    let executor: SkillExecutor

    beforeEach(() => {
      executor = new SkillExecutor()
    })

    it('should verify required MCP dependencies before execution', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Supabase Skill',
        slug: 'supabase-skill',
        description: 'Requires Supabase',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: supabase-skill\n---\nBody',
        mcpDependencies: [
          {
            server: 'supabase',
            required: true,
            capabilities: ['query', 'schema'],
          },
        ],
        triggers: [],
      }

      const contextWithoutMCP: ExecutionContext = {
        skill,
        prompt: 'test',
        userId: 'user-123',
        confidence: 0.8,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map(), // Empty - no MCP servers connected
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'test',
          detectedConfidence: 0.8,
          detectionReasoning: 'Test',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(contextWithoutMCP)

      // Assert
      expect(trace.status).toBe('failed')
      expect(trace.errorMessage).toContain('supabase')
    })

    it('should succeed when required MCP dependencies are available', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Supabase Skill',
        slug: 'supabase-skill',
        description: 'Requires Supabase',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: supabase-skill\n---\nBody',
        mcpDependencies: [
          {
            server: 'supabase',
            required: true,
            capabilities: ['query'],
          },
        ],
        triggers: [],
      }

      const contextWithMCP: ExecutionContext = {
        skill,
        prompt: 'test',
        userId: 'user-123',
        confidence: 0.8,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map([['supabase', true]]),
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'test',
          detectedConfidence: 0.8,
          detectionReasoning: 'Test',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(contextWithMCP)

      // Assert
      expect(trace.status).toBe('completed')
    })

    it('should continue when optional MCP dependencies are missing', async () => {
      // Arrange
      const skill: SkillDefinition = {
        id: nanoid(),
        name: 'Optional MCP Skill',
        slug: 'optional-mcp',
        description: 'Has optional MCP',
        version: '1.0.0',
        scope: 'global',
        content: '---\nname: optional-mcp\n---\nBody',
        mcpDependencies: [
          {
            server: 'context7',
            required: false,
            capabilities: ['search'],
          },
        ],
        triggers: [],
      }

      const context: ExecutionContext = {
        skill,
        prompt: 'test',
        userId: 'user-123',
        confidence: 0.8,
        workingDirectory: '/tmp/test',
        mcpConnections: new Map(), // Empty - optional server not connected
        trace: {
          traceId: nanoid(),
          skillId: skill.id!,
          skillName: skill.name,
          inputPrompt: 'test',
          detectedConfidence: 0.8,
          detectionReasoning: 'Test',
          steps: [],
          status: 'pending',
          startedAt: new Date(),
        },
      }

      // Act
      const trace = await executor.execute(context)

      // Assert
      expect(trace.status).toBe('completed')
    })
  })
})
