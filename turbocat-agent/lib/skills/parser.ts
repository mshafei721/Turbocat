/**
 * SKILL.md Parser
 *
 * Parses SKILL.md files with YAML frontmatter and markdown body.
 * Uses gray-matter for frontmatter parsing and validates structure.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/parser.ts
 */

import matter from 'gray-matter'
import type { ParsedSkillContent, MCPDependency, SkillTrigger } from './types'
import { z } from 'zod'

/**
 * Zod schema for validating frontmatter structure
 */
const frontmatterSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().min(1, 'Skill description is required'),
  version: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scope: z.enum(['user', 'global']).optional(),
  mcp_dependencies: z
    .array(
      z.object({
        server: z.string(),
        required: z.boolean(),
        capabilities: z.array(z.string()),
      }),
    )
    .optional(),
  triggers: z
    .array(
      z.object({
        pattern: z.string(),
        confidence: z.number().min(0).max(1),
        examples: z.array(z.string()),
      }),
    )
    .optional(),
})

/**
 * SkillParser class
 *
 * Parses SKILL.md files with YAML frontmatter and validates structure.
 */
export class SkillParser {
  /**
   * Parse a SKILL.md file content
   *
   * @param content - Full SKILL.md file content
   * @returns Parsed skill content with frontmatter and body
   * @throws Error if frontmatter is invalid or missing required fields
   */
  async parse(content: string): Promise<ParsedSkillContent> {
    try {
      // Parse YAML frontmatter and markdown body using gray-matter
      const parsed = matter(content)

      // Validate frontmatter structure
      const validatedFrontmatter = frontmatterSchema.parse(parsed.data)

      // Extract markdown body (strip frontmatter)
      const body = parsed.content.trim()

      return {
        frontmatter: {
          name: validatedFrontmatter.name,
          description: validatedFrontmatter.description,
          version: validatedFrontmatter.version,
          author: validatedFrontmatter.author,
          category: validatedFrontmatter.category,
          tags: validatedFrontmatter.tags,
          scope: validatedFrontmatter.scope,
          mcp_dependencies: validatedFrontmatter.mcp_dependencies as MCPDependency[] | undefined,
          triggers: validatedFrontmatter.triggers as SkillTrigger[] | undefined,
        },
        body,
        rawContent: content,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        throw new Error(`Invalid SKILL.md frontmatter: ${issues}`)
      }
      throw new Error(`Failed to parse SKILL.md: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate that a SKILL.md file has all required fields
   *
   * @param content - Full SKILL.md file content
   * @returns True if valid, throws error otherwise
   */
  async validate(content: string): Promise<boolean> {
    await this.parse(content)
    return true
  }

  /**
   * Extract just the body content without frontmatter
   *
   * @param content - Full SKILL.md file content
   * @returns Markdown body content
   */
  extractBody(content: string): string {
    const parsed = matter(content)
    return parsed.content.trim()
  }

  /**
   * Extract just the frontmatter metadata
   *
   * @param content - Full SKILL.md file content
   * @returns Parsed frontmatter object
   */
  async extractFrontmatter(content: string): Promise<ParsedSkillContent['frontmatter']> {
    const parsed = await this.parse(content)
    return parsed.frontmatter
  }
}
