/**
 * Register Integration Templates
 *
 * Script to register all integration template skills (Stripe, SendGrid, Cloudinary)
 * in the database.
 *
 * Usage:
 *   npx tsx scripts/register-integration-templates.ts
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/scripts/register-integration-templates.ts
 */

import { SkillRegistry } from '../lib/skills/registry'
import { SkillParser } from '../lib/skills/parser'
import type { SkillDefinition } from '../lib/skills/types'
import fs from 'fs'
import path from 'path'

const TEMPLATES = ['stripe', 'sendgrid', 'cloudinary']

async function registerTemplate(templateName: string, registry: SkillRegistry, parser: SkillParser) {
  console.log(`\nRegistering ${templateName} template...`)

  try {
    // Read the skill definition file
    const skillPath = path.join(
      process.cwd(),
      'templates',
      templateName,
      `${templateName}.skill.md`
    )

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill file not found: ${skillPath}`)
    }

    const skillContent = fs.readFileSync(skillPath, 'utf-8')

    // Parse the skill definition
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

    // Check if skill already exists
    const existingSkill = await registry.get(skillDefinition.slug)

    if (existingSkill) {
      console.log(`  Skill "${skillDefinition.slug}" already exists. Updating...`)
      await registry.update(skillDefinition.slug, skillDefinition)
      console.log('  ✓ Skill updated successfully')
    } else {
      console.log(`  Registering new skill "${skillDefinition.slug}"...`)
      const skillId = await registry.register(skillDefinition)
      console.log(`  ✓ Skill registered successfully with ID: ${skillId}`)
    }

    // Display skill info
    console.log('\n  Skill Information:')
    console.log('    Name:', skillDefinition.name)
    console.log('    Slug:', skillDefinition.slug)
    console.log('    Version:', skillDefinition.version)
    console.log('    Category:', skillDefinition.category)
    console.log('    Triggers:', skillDefinition.triggers?.length || 0)
    console.log('    MCP Dependencies:', skillDefinition.mcpDependencies?.length || 0)

    // Verify registration
    const verifiedSkill = await registry.get(skillDefinition.slug)
    if (verifiedSkill) {
      console.log('  ✓ Verification successful - skill is registered in database')
      return true
    } else {
      console.error('  ✗ Verification failed - skill not found in database')
      return false
    }
  } catch (error) {
    console.error(`  Error registering ${templateName}:`, error)
    if (error instanceof Error) {
      console.error('  Error message:', error.message)
    }
    return false
  }
}

async function registerAllTemplates() {
  console.log('Registering integration template skills...')
  console.log('=========================================')

  try {
    // Create registry and parser instances
    const registry = new SkillRegistry()
    const parser = new SkillParser()

    const results: { template: string; success: boolean }[] = []

    // Register each template
    for (const template of TEMPLATES) {
      const success = await registerTemplate(template, registry, parser)
      results.push({ template, success })
    }

    // Summary
    console.log('\n=========================================')
    console.log('Registration Summary')
    console.log('=========================================')

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    results.forEach((result) => {
      const status = result.success ? '✓' : '✗'
      console.log(`${status} ${result.template}`)
    })

    console.log(`\nTotal: ${successful} successful, ${failed} failed`)

    if (failed > 0) {
      console.log('\n✗ Some templates failed to register')
      process.exit(1)
    } else {
      console.log('\n✓ All templates registered successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error('Fatal error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the registration
registerAllTemplates()
