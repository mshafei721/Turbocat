/**
 * Mock Skill Registry for Testing
 *
 * In-memory implementation of SkillRegistry that doesn't require database access.
 * Used for unit tests that need to test skill detection without database.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/__mocks__/registry.ts
 */

import { nanoid } from 'nanoid'
import type { ISkillRegistry, SkillDefinition, SkillRegistryListOptions } from '../types'

/**
 * MockSkillRegistry class
 *
 * In-memory skill registry for testing without database.
 * Implements ISkillRegistry interface for type compatibility.
 */
export class MockSkillRegistry implements ISkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map()

  /**
   * Register a new skill in memory
   */
  async register(skill: SkillDefinition): Promise<string> {
    const skillId = skill.id || nanoid()
    const registeredSkill: SkillDefinition = {
      ...skill,
      id: skillId,
      isActive: skill.isActive ?? true,
      usageCount: skill.usageCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.skills.set(skill.slug, registeredSkill)
    return skillId
  }

  /**
   * Update an existing skill
   */
  async update(slug: string, updates: Partial<SkillDefinition>): Promise<void> {
    const skill = this.skills.get(slug)
    if (skill) {
      this.skills.set(slug, {
        ...skill,
        ...updates,
        updatedAt: new Date(),
      })
    }
  }

  /**
   * Get a skill by slug
   */
  async get(slug: string): Promise<SkillDefinition | null> {
    return this.skills.get(slug) || null
  }

  /**
   * List skills with optional filtering
   */
  async list(options?: SkillRegistryListOptions): Promise<SkillDefinition[]> {
    let results = Array.from(this.skills.values())

    if (options?.category) {
      results = results.filter((s) => s.category === options.category)
    }

    if (options?.scope) {
      results = results.filter((s) => s.scope === options.scope)
    }

    if (options?.active !== undefined) {
      results = results.filter((s) => s.isActive === options.active)
    }

    if (options?.userId && options.scope === 'user') {
      results = results.filter((s) => s.createdBy === options.userId)
    }

    return results
  }

  /**
   * Deactivate a skill
   */
  async deactivate(slug: string): Promise<void> {
    const skill = this.skills.get(slug)
    if (skill) {
      skill.isActive = false
      skill.updatedAt = new Date()
    }
  }

  /**
   * Activate a skill
   */
  async activate(slug: string): Promise<void> {
    const skill = this.skills.get(slug)
    if (skill) {
      skill.isActive = true
      skill.updatedAt = new Date()
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(skillId: string): Promise<void> {
    for (const skill of this.skills.values()) {
      if (skill.id === skillId) {
        skill.usageCount = (skill.usageCount || 0) + 1
        skill.updatedAt = new Date()
        break
      }
    }
  }

  /**
   * Update success rate
   */
  async updateSuccessRate(skillId: string, successRate: number): Promise<void> {
    for (const skill of this.skills.values()) {
      if (skill.id === skillId) {
        skill.successRate = successRate
        skill.updatedAt = new Date()
        break
      }
    }
  }

  /**
   * Clear all skills (useful for test cleanup)
   */
  clear(): void {
    this.skills.clear()
  }

  /**
   * Get the count of registered skills
   */
  count(): number {
    return this.skills.size
  }
}

// Export as SkillRegistry for drop-in replacement
export { MockSkillRegistry as SkillRegistry }
