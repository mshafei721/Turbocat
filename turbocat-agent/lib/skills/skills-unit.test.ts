/**
 * Skills System Unit Tests
 *
 * Unit tests for Skills System components that don't require database.
 * Focuses on parser, detector logic, and executor trace management.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/skills-unit.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SkillParser } from './parser'
import { SkillDetector } from './detector'
import { SkillExecutor } from './executor'
import { SkillRegistry } from './registry'
import type { SkillDefinition, ExecutionContext, SkillRegistryListOptions } from './types'
import { nanoid } from 'nanoid'

/**
 * Interface for mock registry (same shape as SkillRegistry class)
 */
interface MockSkillRegistry {
  register: (skill: SkillDefinition) => Promise<string>
  update: (slug: string, data: Partial<SkillDefinition>) => Promise<void>
  get: (slug: string) => Promise<SkillDefinition | null>
  list: (options?: SkillRegistryListOptions) => Promise<SkillDefinition[]>
  deactivate: (slug: string) => Promise<void>
}

describe('Skills System - Unit Tests', () => {
  /**
   * Task 8.1.5: Test YAML frontmatter parsing
   */
  describe('SkillParser - YAML Frontmatter Parsing', () => {
    let parser: SkillParser

    beforeEach(() => {
      parser = new SkillParser()
    })

    it('should parse valid SKILL.md with frontmatter and body', async () => {
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

      const result = await parser.parse(skillContent)

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
     */
    it('should extract markdown body content', async () => {
      const skillContent = `---
name: test-skill
description: Test skill
---

## Overview
This is the body content.

## Examples
Some examples here.
`

      const result = await parser.parse(skillContent)

      expect(result.body).toContain('## Overview')
      expect(result.body).toContain('This is the body content')
      expect(result.body).toContain('## Examples')
      expect(result.body.trim()).not.toContain('---')
    })

    it('should validate required fields in frontmatter', async () => {
      const invalidContent = `---
description: Missing name field
---
Body content
`

      await expect(parser.parse(invalidContent)).rejects.toThrow()
    })

    it('should handle skills without optional fields', async () => {
      const minimalContent = `---
name: minimal-skill
description: Minimal skill definition
---
Body content
`

      const result = await parser.parse(minimalContent)

      expect(result.frontmatter.name).toBe('minimal-skill')
      expect(result.frontmatter.version).toBeUndefined()
      expect(result.frontmatter.category).toBeUndefined()
    })
  })

  /**
   * Task 8.1.2: Test skill detection matches trigger patterns
   */
  describe('SkillDetector - Pattern Matching', () => {
    let detector: SkillDetector
    let mockRegistry: MockSkillRegistry

    beforeEach(async () => {
      // Create mock registry with test skills
      const skills: SkillDefinition[] = [
        {
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
              confidence: 0.5,
              examples: ['create a database schema', 'design the tables', 'set up database'],
            },
          ],
          isActive: true,
        },
        {
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
              confidence: 0.5,
              examples: ['create an API endpoint', 'integrate with REST API'],
            },
          ],
          isActive: true,
        },
      ]

      mockRegistry = {
        register: async () => '',
        update: async () => {},
        get: async () => null,
        list: async (options?: SkillRegistryListOptions) => {
          if (options?.active === true) {
            return skills.filter((s) => s.isActive)
          }
          return skills
        },
        deactivate: async () => {},
      }

      detector = new SkillDetector(mockRegistry as unknown as SkillRegistry)
    })

    it('should detect skill from keyword pattern match', async () => {
      const prompt = 'I need to create a database schema for users'

      const results = await detector.detect(prompt)

      expect(results.length).toBeGreaterThan(0)
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
      expect(dbSkill!.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect skill from example similarity', async () => {
      const prompt = 'design the tables for my application'

      const results = await detector.detect(prompt)

      expect(results.length).toBeGreaterThan(0)
      const dbSkill = results.find((r) => r.skill.slug === 'database-design')
      expect(dbSkill).toBeDefined()
    })

    it('should return multiple skills when relevant', async () => {
      const prompt = 'create a database schema and API endpoints'

      const results = await detector.detect(prompt)

      expect(results.length).toBeGreaterThanOrEqual(2)
      expect(results.find((r) => r.skill.slug === 'database-design')).toBeDefined()
      expect(results.find((r) => r.skill.slug === 'api-integration')).toBeDefined()
    })

    it('should not detect skills below confidence threshold', async () => {
      const prompt = 'hello world'

      const results = await detector.detect(prompt)

      expect(results.length).toBe(0)
    })

    it('should provide reasoning for detection', async () => {
      const prompt = 'create a database schema'

      const results = await detector.detect(prompt)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].reasoning).toBeDefined()
      expect(typeof results[0].reasoning).toBe('string')
      expect(results[0].reasoning.length).toBeGreaterThan(0)
    })
  })

  /**
   * Task 8.1.3: Test skill execution creates trace
   */
  describe('SkillExecutor - Execution Trace', () => {
    let executor: SkillExecutor

    beforeEach(() => {
      executor = new SkillExecutor()
    })

    it('should create execution trace with all steps', async () => {
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

      const trace = await executor.execute(context)

      expect(trace).toBeDefined()
      expect(trace.traceId).toBeDefined()
      expect(trace.skillId).toBe(skill.id)
      expect(trace.skillName).toBe('Test Skill')
      expect(trace.steps.length).toBeGreaterThan(0)
      expect(trace.status).toBe('completed')
      expect(trace.durationMs).toBeGreaterThan(0)
    })

    it('should track step-by-step execution', async () => {
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

      const trace = await executor.execute(context)

      expect(trace.steps.length).toBeGreaterThanOrEqual(4) // 4 standard steps
      trace.steps.forEach((step) => {
        expect(step.status).toBe('completed')
        expect(step.startedAt).toBeDefined()
        expect(step.completedAt).toBeDefined()
      })
    })

    it('should handle execution errors gracefully', async () => {
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

      const trace = await executor.execute(context)

      expect(trace.status).toBe('failed')
      expect(trace.errorMessage).toBeDefined()
    })
  })

  /**
   * Task 8.1.4: Test MCP dependency resolution
   */
  describe('SkillExecutor - MCP Dependency Resolution', () => {
    let executor: SkillExecutor

    beforeEach(() => {
      executor = new SkillExecutor()
    })

    it('should verify required MCP dependencies before execution', async () => {
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

      const trace = await executor.execute(contextWithoutMCP)

      expect(trace.status).toBe('failed')
      expect(trace.errorMessage).toContain('supabase')
    })

    it('should succeed when required MCP dependencies are available', async () => {
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

      const trace = await executor.execute(contextWithMCP)

      expect(trace.status).toBe('completed')
    })

    it('should continue when optional MCP dependencies are missing', async () => {
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

      const trace = await executor.execute(context)

      expect(trace.status).toBe('completed')
    })
  })
})
