/**
 * Agent Skills API Route
 *
 * Lists available Claude Agent SDK skills from the skills directory.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { promises as fs } from 'fs'
import path from 'path'
import type { SkillDefinition } from '@/lib/agent-sdk/types'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const skills: SkillDefinition[] = []

    // Get skills directory path
    const skillsDir = process.env.SKILLS_DIRECTORY || path.join(process.cwd(), '..', 'backend', '.claude', 'skills')

    // Helper to scan a directory for skills
    async function scanSkillsDir(dir: string, source: 'anthropic' | 'custom'): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillPath = path.join(dir, entry.name)
            const skillMdPath = path.join(skillPath, 'SKILL.md')

            try {
              const content = await fs.readFile(skillMdPath, 'utf-8')
              const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

              if (frontmatterMatch && frontmatterMatch[1]) {
                const frontmatter = frontmatterMatch[1]
                const nameMatch = frontmatter.match(/name:\s*(.+)/)
                const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m)

                skills.push({
                  name: nameMatch?.[1]?.trim() ?? entry.name,
                  description: descMatch?.[1]?.trim() ?? '',
                  path: skillPath,
                  source,
                })
              }
            } catch {
              // Skip if SKILL.md doesn't exist or can't be read
            }
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Scan both Anthropic and custom skills directories
    const anthropicDir = path.join(skillsDir, 'anthropic')
    await Promise.all([scanSkillsDir(anthropicDir, 'anthropic'), scanSkillsDir(skillsDir, 'custom')])

    return NextResponse.json(skills)
  } catch (error) {
    console.error('Error fetching agent skills:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch skills' },
      { status: 500 },
    )
  }
}
