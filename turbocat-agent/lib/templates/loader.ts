/**
 * Template Loader Utility
 *
 * Loads integration templates into user projects with validation
 * and environment variable setup.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/templates/loader.ts
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

export interface TemplateMetadata {
  name: string
  description: string
  version: string
  requiredEnvVars: string[]
  files: string[]
}

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')

/**
 * Get available templates
 */
export function getAvailableTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return []
  }

  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((name) => {
      const templatePath = path.join(TEMPLATES_DIR, name)
      return fs.statSync(templatePath).isDirectory()
    })
}

/**
 * Load template metadata
 */
export function getTemplateMetadata(templateName: string): TemplateMetadata | null {
  const templatePath = path.join(TEMPLATES_DIR, templateName)

  if (!fs.existsSync(templatePath)) {
    return null
  }

  // Read skill file for metadata
  const skillFile = path.join(templatePath, `${templateName}.skill.md`)
  if (!fs.existsSync(skillFile)) {
    return null
  }

  const skillContent = fs.readFileSync(skillFile, 'utf-8')

  // Parse frontmatter
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    return null
  }

  const frontmatter = frontmatterMatch[1]
  const lines = frontmatter.split('\n')

  let name = templateName
  let description = ''
  let version = '1.0.0'

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    const value = valueParts.join(':').trim()

    if (key.trim() === 'name') {
      name = value
    } else if (key.trim() === 'description') {
      description = value
    } else if (key.trim() === 'version') {
      version = value
    }
  }

  // Read env template for required vars
  const envTemplate = path.join(templatePath, 'env', '.env.template')
  const requiredEnvVars: string[] = []

  if (fs.existsSync(envTemplate)) {
    const envContent = fs.readFileSync(envTemplate, 'utf-8')
    const envLines = envContent.split('\n')

    for (const line of envLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=')
        if (key) {
          requiredEnvVars.push(key.trim())
        }
      }
    }
  }

  // List all files
  const files = getAllFilesInDirectory(templatePath)

  return {
    name,
    description,
    version,
    requiredEnvVars,
    files,
  }
}

/**
 * Get all files in a directory recursively
 */
function getAllFilesInDirectory(dir: string, basePath: string = ''): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.join(basePath, entry.name)

    if (entry.isDirectory()) {
      files.push(...getAllFilesInDirectory(fullPath, relativePath))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

/**
 * Validate environment variables
 */
export function validateEnv(requiredVars: string[]): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Prompt user for input
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Prompt for missing API keys
 */
export async function promptForMissingKeys(
  missing: string[]
): Promise<Record<string, string>> {
  const values: Record<string, string> = {}

  console.log('\nSome required environment variables are missing:')

  for (const varName of missing) {
    const value = await promptUser(`Enter value for ${varName}: `)
    values[varName] = value
  }

  return values
}

/**
 * Copy template files to destination
 */
export function copyTemplate(
  templateName: string,
  destination: string,
  options: {
    overwrite?: boolean
    excludePatterns?: string[]
  } = {}
): { success: boolean; copiedFiles: string[]; skippedFiles: string[] } {
  const { overwrite = false, excludePatterns = [] } = options

  const templatePath = path.join(TEMPLATES_DIR, templateName)
  const copiedFiles: string[] = []
  const skippedFiles: string[] = []

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}" not found`)
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true })
  }

  // Copy files
  const copyRecursive = (srcDir: string, destDir: string) => {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name)
      const destPath = path.join(destDir, entry.name)

      // Check if file should be excluded
      const shouldExclude = excludePatterns.some((pattern) => {
        const regex = new RegExp(pattern)
        return regex.test(entry.name)
      })

      if (shouldExclude) {
        skippedFiles.push(destPath)
        continue
      }

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true })
        }
        copyRecursive(srcPath, destPath)
      } else {
        if (fs.existsSync(destPath) && !overwrite) {
          skippedFiles.push(destPath)
          continue
        }

        fs.copyFileSync(srcPath, destPath)
        copiedFiles.push(destPath)
      }
    }
  }

  copyRecursive(templatePath, destination)

  return {
    success: true,
    copiedFiles,
    skippedFiles,
  }
}

/**
 * Load template into project
 *
 * Main function to load a template with validation and setup.
 */
export async function loadTemplate(
  templateName: string,
  options: {
    destination?: string
    checkEnv?: boolean
    promptForKeys?: boolean
    overwrite?: boolean
  } = {}
): Promise<{
  success: boolean
  message: string
  copiedFiles?: string[]
  missingEnvVars?: string[]
}> {
  const {
    destination = path.join(process.cwd(), 'lib', templateName),
    checkEnv = true,
    promptForKeys = true,
    overwrite = false,
  } = options

  // Get template metadata
  const metadata = getTemplateMetadata(templateName)

  if (!metadata) {
    return {
      success: false,
      message: `Template "${templateName}" not found`,
    }
  }

  console.log(`\nLoading template: ${metadata.name}`)
  console.log(`Description: ${metadata.description}`)
  console.log(`Version: ${metadata.version}`)

  // Validate environment variables
  if (checkEnv && metadata.requiredEnvVars.length > 0) {
    const validation = validateEnv(metadata.requiredEnvVars)

    if (!validation.valid) {
      console.log(
        `\nWarning: ${validation.missing.length} required environment variable(s) are missing`
      )

      if (promptForKeys) {
        const shouldContinue = await promptUser(
          '\nWould you like to continue anyway? (y/n): '
        )

        if (shouldContinue.toLowerCase() !== 'y') {
          return {
            success: false,
            message: 'Template loading cancelled',
            missingEnvVars: validation.missing,
          }
        }

        console.log('\nPlease add these environment variables to your .env.local file:')
        validation.missing.forEach((varName) => {
          console.log(`  ${varName}=your-value-here`)
        })
      }
    }
  }

  // Copy template files
  console.log(`\nCopying files to ${destination}...`)

  const result = copyTemplate(templateName, destination, {
    overwrite,
    excludePatterns: ['\\.skill\\.md$', 'docs', 'env'],
  })

  console.log(`\nCopied ${result.copiedFiles.length} file(s)`)

  if (result.skippedFiles.length > 0) {
    console.log(`Skipped ${result.skippedFiles.length} file(s) (already exist)`)
  }

  // Copy env template
  const envTemplateSrc = path.join(TEMPLATES_DIR, templateName, 'env', '.env.template')
  const envTemplateDest = path.join(process.cwd(), `.env.${templateName}.example`)

  if (fs.existsSync(envTemplateSrc)) {
    fs.copyFileSync(envTemplateSrc, envTemplateDest)
    console.log(`\nEnvironment template copied to ${envTemplateDest}`)
  }

  console.log('\nNext steps:')
  console.log('1. Install required dependencies (see template docs)')
  console.log('2. Add environment variables to .env.local')
  console.log('3. Follow the setup guide in the template documentation')

  return {
    success: true,
    message: 'Template loaded successfully',
    copiedFiles: result.copiedFiles,
  }
}
