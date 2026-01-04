/**
 * Skill Registry
 *
 * Manages skill registration, storage, and retrieval from the database.
 * Provides CRUD operations for skills.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/registry.ts
 */

import { db } from '../db/client'
import { skills, type Skill, type InsertSkill } from '../db/schema/skills'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { SkillDefinition, SkillRegistryListOptions } from './types'

/**
 * SkillRegistry class
 *
 * Manages skill registration and retrieval from the database.
 */
export class SkillRegistry {
  /**
   * Register a new skill in the database
   *
   * @param skill - Skill definition to register
   * @returns Unique skill ID
   */
  async register(skill: SkillDefinition): Promise<string> {
    const skillId = skill.id || nanoid()

    const insertData = {
      id: skillId,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      version: skill.version || '1.0.0',
      category: skill.category,
      tags: skill.tags || [],
      scope: skill.scope || 'global',
      content: skill.content,
      mcpDependencies: skill.mcpDependencies || [],
      triggers: skill.triggers || [],
      isActive: skill.isActive ?? true,
      usageCount: skill.usageCount || 0,
      successRate: skill.successRate?.toString() || '0',
      createdBy: skill.createdBy,
    }

    await db.insert(skills).values(insertData)

    return skillId
  }

  /**
   * Update an existing skill
   *
   * @param slug - Unique slug identifier
   * @param updates - Partial skill definition with fields to update
   */
  async update(slug: string, updates: Partial<SkillDefinition>): Promise<void> {
    const updateData: Partial<InsertSkill> = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.version !== undefined) updateData.version = updates.version
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.scope !== undefined) updateData.scope = updates.scope
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.mcpDependencies !== undefined) updateData.mcpDependencies = updates.mcpDependencies
    if (updates.triggers !== undefined) updateData.triggers = updates.triggers
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive
    if (updates.successRate !== undefined) updateData.successRate = updates.successRate.toString()

    updateData.updatedAt = new Date()

    await db.update(skills).set(updateData).where(eq(skills.slug, slug))
  }

  /**
   * Get a skill by slug
   *
   * @param slug - Unique slug identifier
   * @returns Skill definition or null if not found
   */
  async get(slug: string): Promise<SkillDefinition | null> {
    const result = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToSkillDefinition(result[0])
  }

  /**
   * List skills with optional filtering
   *
   * @param options - Filter options
   * @returns Array of skill definitions
   */
  async list(options?: SkillRegistryListOptions): Promise<SkillDefinition[]> {
    let query = db.select().from(skills)

    // Build WHERE conditions
    const conditions = []

    if (options?.category) {
      conditions.push(eq(skills.category, options.category))
    }

    if (options?.scope) {
      conditions.push(eq(skills.scope, options.scope))
    }

    if (options?.active !== undefined) {
      conditions.push(eq(skills.isActive, options.active))
    }

    if (options?.userId && options.scope === 'user') {
      conditions.push(eq(skills.createdBy, options.userId))
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const results = await query

    return results.map((skill) => this.mapToSkillDefinition(skill))
  }

  /**
   * Deactivate a skill (soft delete)
   *
   * @param slug - Unique slug identifier
   */
  async deactivate(slug: string): Promise<void> {
    await db
      .update(skills)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(skills.slug, slug))
  }

  /**
   * Activate a previously deactivated skill
   *
   * @param slug - Unique slug identifier
   */
  async activate(slug: string): Promise<void> {
    await db
      .update(skills)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(skills.slug, slug))
  }

  /**
   * Increment usage count for a skill
   *
   * @param skillId - Skill ID
   */
  async incrementUsage(skillId: string): Promise<void> {
    const skill = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1)

    if (skill.length > 0) {
      await db
        .update(skills)
        .set({
          usageCount: skill[0].usageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(skills.id, skillId))
    }
  }

  /**
   * Update success rate for a skill
   *
   * @param skillId - Skill ID
   * @param successRate - New success rate (0-100)
   */
  async updateSuccessRate(skillId: string, successRate: number): Promise<void> {
    await db
      .update(skills)
      .set({
        successRate: successRate.toString(),
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skillId))
  }

  /**
   * Map database Skill to SkillDefinition type
   *
   * @param skill - Database skill record
   * @returns Skill definition
   */
  private mapToSkillDefinition(skill: Skill): SkillDefinition {
    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      version: skill.version,
      category: skill.category || undefined,
      tags: skill.tags || undefined,
      scope: skill.scope,
      content: skill.content,
      mcpDependencies: skill.mcpDependencies || [],
      triggers: skill.triggers || [],
      isActive: skill.isActive,
      usageCount: skill.usageCount,
      successRate: skill.successRate ? parseFloat(skill.successRate) : undefined,
      createdBy: skill.createdBy || undefined,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    }
  }
}
