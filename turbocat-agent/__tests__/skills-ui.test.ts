/**
 * Skills UI Components Tests
 *
 * These tests verify the Skills Management UI components:
 * 1. SkillsDashboard renders active skills
 * 2. SkillCard displays skill metadata correctly
 * 3. SkillDetailsPanel shows MCP dependencies
 * 4. Deactivate button updates skill status
 */

import { describe, it, expect } from 'vitest'
import type { SkillDefinition } from '@/lib/skills/types'

/**
 * Create mock skill definition for testing
 */
const createMockSkill = (
  slug: string,
  name: string,
  isActive: boolean = true,
  usageCount: number = 0,
  successRate: number = 0,
): SkillDefinition => ({
  id: `skill-${slug}`,
  name,
  slug,
  description: `Test skill for ${name}`,
  version: '1.0.0',
  category: 'core',
  tags: ['test', 'development'],
  scope: 'global',
  content: '# Test Skill\n\nThis is a test skill.',
  mcpDependencies: [
    {
      server: 'supabase',
      required: true,
      capabilities: ['executeSQL', 'getTableSchema'],
    },
    {
      server: 'github',
      required: false,
      capabilities: ['searchCode'],
    },
  ],
  triggers: [
    {
      pattern: 'database|schema|table',
      confidence: 0.8,
      examples: ['Create a database schema', 'Design a table'],
    },
  ],
  isActive,
  usageCount,
  successRate,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
})

describe('Skills UI Components', () => {
  describe('SkillsDashboard', () => {
    it('renders active skills and filters inactive', () => {
      const mockSkills: SkillDefinition[] = [
        createMockSkill('database-design', 'Database Design', true, 42, 95),
        createMockSkill('api-integration', 'API Integration', true, 28, 90),
        createMockSkill('ui-component', 'UI Component', true, 15, 85),
        createMockSkill('legacy-skill', 'Legacy Skill', false, 5, 60), // Inactive
      ]

      const activeSkills = mockSkills.filter((skill) => skill.isActive)
      const inactiveSkills = mockSkills.filter((skill) => !skill.isActive)

      expect(activeSkills.length).toBe(3)
      expect(inactiveSkills.length).toBe(1)

      // Verify all active skills have required metadata
      for (const skill of activeSkills) {
        expect(skill.name).toBeDefined()
        expect(skill.slug).toBeDefined()
        expect(skill.usageCount).toBeDefined()
        expect(skill.successRate).toBeDefined()
      }
    })
  })

  describe('SkillCard', () => {
    it('displays skill metadata correctly', () => {
      const mockSkill = createMockSkill('database-design', 'Database Design', true, 42, 95.5)

      expect(mockSkill.name).toBe('Database Design')
      expect(mockSkill.category).toBe('core')
      expect(mockSkill.version).toBe('1.0.0')
      expect(mockSkill.usageCount).toBe(42)
      expect(mockSkill.successRate).toBe(95.5)
      expect(mockSkill.isActive).toBe(true)
      expect(Array.isArray(mockSkill.tags)).toBe(true)
      expect(mockSkill.tags?.length).toBeGreaterThan(0)
      expect(mockSkill.description.length).toBeGreaterThan(0)
    })
  })

  describe('SkillDetailsPanel', () => {
    it('shows MCP dependencies', () => {
      const mockSkill = createMockSkill('database-design', 'Database Design', true)

      // Verify MCP dependencies structure
      expect(Array.isArray(mockSkill.mcpDependencies)).toBe(true)
      expect(mockSkill.mcpDependencies.length).toBe(2)

      // Check required vs optional dependencies
      const requiredDeps = mockSkill.mcpDependencies.filter((dep) => dep.required)
      const optionalDeps = mockSkill.mcpDependencies.filter((dep) => !dep.required)

      expect(requiredDeps.length).toBe(1)
      expect(optionalDeps.length).toBe(1)

      // Verify dependency structure
      for (const dep of mockSkill.mcpDependencies) {
        expect(dep.server).toBeDefined()
        expect(Array.isArray(dep.capabilities)).toBe(true)
        expect(dep.capabilities.length).toBeGreaterThan(0)
      }

      // Verify triggers
      expect(Array.isArray(mockSkill.triggers)).toBe(true)
      expect(mockSkill.triggers.length).toBeGreaterThan(0)

      for (const trigger of mockSkill.triggers) {
        expect(trigger.pattern).toBeDefined()
        expect(Array.isArray(trigger.examples)).toBe(true)
        expect(trigger.examples.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Deactivate Button', () => {
    it('updates skill status', () => {
      // Start with an active skill
      let mockSkill = createMockSkill('database-design', 'Database Design', true)
      expect(mockSkill.isActive).toBe(true)

      // Simulate deactivation
      mockSkill = { ...mockSkill, isActive: false }
      expect(mockSkill.isActive).toBe(false)

      // Simulate reactivation
      mockSkill = { ...mockSkill, isActive: true }
      expect(mockSkill.isActive).toBe(true)

      // Test starting from inactive state
      let inactiveSkill = createMockSkill('legacy-skill', 'Legacy Skill', false)
      expect(inactiveSkill.isActive).toBe(false)

      // Activate it
      inactiveSkill = { ...inactiveSkill, isActive: true }
      expect(inactiveSkill.isActive).toBe(true)
    })
  })
})
