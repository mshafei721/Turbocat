/**
 * Load Template Script
 *
 * CLI tool to load integration templates into projects.
 *
 * Usage:
 *   npx tsx scripts/load-template.ts [template-name]
 *   npx tsx scripts/load-template.ts --list
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/scripts/load-template.ts
 */

import { loadTemplate, getAvailableTemplates, getTemplateMetadata } from '../lib/templates/loader'

async function main() {
  const args = process.argv.slice(2)

  // List available templates
  if (args.includes('--list') || args.includes('-l')) {
    const templates = getAvailableTemplates()

    if (templates.length === 0) {
      console.log('No templates found')
      return
    }

    console.log('\nAvailable templates:')
    console.log('-------------------')

    for (const template of templates) {
      const metadata = getTemplateMetadata(template)
      if (metadata) {
        console.log(`\n${metadata.name}`)
        console.log(`  ${metadata.description}`)
        console.log(`  Version: ${metadata.version}`)
      }
    }

    console.log('\nUsage: npx tsx scripts/load-template.ts [template-name]')
    return
  }

  // Load specific template
  const templateName = args[0]

  if (!templateName) {
    console.error('Error: Template name is required')
    console.log('\nUsage: npx tsx scripts/load-template.ts [template-name]')
    console.log('       npx tsx scripts/load-template.ts --list')
    process.exit(1)
  }

  try {
    const result = await loadTemplate(templateName, {
      checkEnv: true,
      promptForKeys: true,
      overwrite: args.includes('--overwrite') || args.includes('-f'),
    })

    if (result.success) {
      console.log(`\n✓ ${result.message}`)
      process.exit(0)
    } else {
      console.error(`\n✗ ${result.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Error loading template:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    process.exit(1)
  }
}

main()
