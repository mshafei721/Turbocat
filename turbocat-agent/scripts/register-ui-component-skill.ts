/**
 * Register UI Component Skill
 *
 * Script to register the ui-component skill in the database.
 *
 * Usage:
 *   npx tsx scripts/register-ui-component-skill.ts
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/scripts/register-ui-component-skill.ts
 */

import { SkillRegistry } from '../lib/skills/registry'
import { SkillParser } from '../lib/skills/parser'
import type { SkillDefinition } from '../lib/skills/types'
import fs from 'fs'
import path from 'path'

async function registerUIComponentSkill() {
  console.log('Registering ui-component skill...')

  try {
    // Read the skill definition file
    const skillPath = path.join(process.cwd(), 'skills', 'ui-component.skill.md')
    const skillContent = fs.readFileSync(skillPath, 'utf-8')

    // Parse the skill definition
    const parser = new SkillParser()
    const parsed = await parser.parse(skillContent)
    
    // Convert to SkillDefinition
    const slug = parsed.frontmatter.name.toLowerCase().replace(/\s+/g, '-')
    const skillDefinition: SkillDefinition = {
      name: parsed.frontmatter.name,
      slug,
      description: parsed.frontmatter.description,
      version: parsed.frontmatter.version || '1.0.0',
      category: parsed.frontmatter.category,
      tags: parsed.frontmatter.tags || [],
      scope: parsed.frontmatter.scope || 'global',
      content: parsed.rawContent,
      mcpDependencies: parsed.frontmatter.mcp_dependencies || [],
      triggers: parsed.frontmatter.triggers || [],
      isActive: true,
      usageCount: 0,
      successRate: 0,
    }

    // Create registry instance
    const registry = new SkillRegistry()

    // Check if skill already exists
    const existingSkill = await registry.get(skillDefinition.slug)

    if (existingSkill) {
      console.log(`Skill "${skillDefinition.slug}" already exists. Updating...`)
      await registry.update(skillDefinition.slug, skillDefinition)
      console.log('✓ Skill updated successfully')
    } else {
      console.log(`Registering new skill "${skillDefinition.slug}"...`)
      const skillId = await registry.register(skillDefinition)
      console.log(`✓ Skill registered successfully with ID: ${skillId}`)
    }

    // Display skill info
    console.log('\nSkill Information:')
    console.log('  Name:', skillDefinition.name)
    console.log('  Slug:', skillDefinition.slug)
    console.log('  Version:', skillDefinition.version)
    console.log('  Category:', skillDefinition.category)
    console.log('  Triggers:', skillDefinition.triggers?.length || 0)
    console.log('  MCP Dependencies:', skillDefinition.mcpDependencies?.length || 0)
    console.log('  Scope:', skillDefinition.scope)
    console.log('  Active:', skillDefinition.isActive ?? true)

    // Verify registration
    const verifiedSkill = await registry.get(skillDefinition.slug)
    if (verifiedSkill) {
      console.log('\n✓ Verification successful - skill is registered in database')
    } else {
      console.error('\n✗ Verification failed - skill not found in database')
      process.exit(1)
    }

    console.log('\n✓ All done!')
  } catch (error) {
    console.error('Error registering skill:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the registration
registerUIComponentSkill()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
