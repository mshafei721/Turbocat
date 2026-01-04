/**
 * Skill Detector
 *
 * Detects which skills are relevant for a given user prompt.
 * Uses keyword matching and example similarity to determine confidence.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/detector.ts
 */

import type { SkillRegistry } from './registry'
import type { DetectionResult, SkillDefinition, SkillTrigger } from './types'

/**
 * SkillDetector class
 *
 * Detects relevant skills from user prompts using pattern matching
 * and similarity scoring.
 */
export class SkillDetector {
  private registry: SkillRegistry
  private minConfidence: number = 0.6

  constructor(registry: SkillRegistry) {
    this.registry = registry
  }

  /**
   * Detect skills relevant to a user prompt
   *
   * @param prompt - User's input prompt
   * @returns Array of detection results sorted by confidence (highest first)
   */
  async detect(prompt: string): Promise<DetectionResult[]> {
    const normalizedPrompt = prompt.toLowerCase().trim()
    const activeSkills = await this.registry.list({ active: true })
    const results: DetectionResult[] = []

    for (const skill of activeSkills) {
      for (const trigger of skill.triggers || []) {
        // Calculate confidence using keyword and example matching
        const keywordScore = this.matchKeywords(normalizedPrompt, trigger.pattern)
        const exampleScore = this.matchExamples(normalizedPrompt, trigger.examples)

        // Weighted average: keywords 60%, examples 40%
        const confidence = keywordScore * 0.6 + exampleScore * 0.4

        // Only include if meets both trigger threshold and minimum confidence
        if (confidence >= trigger.confidence && confidence >= this.minConfidence) {
          const reasoning = this.generateReasoning(normalizedPrompt, trigger, keywordScore, exampleScore)

          results.push({
            skill,
            confidence,
            matchedTrigger: trigger,
            reasoning,
          })

          // Only match one trigger per skill (highest confidence)
          break
        }
      }
    }

    // Sort by confidence (highest first) and return
    return results.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Match keywords in prompt against trigger pattern
   *
   * @param prompt - Normalized user prompt
   * @param pattern - Regex or keyword pattern
   * @returns Confidence score (0-1)
   */
  matchKeywords(prompt: string, pattern: string): number {
    try {
      // Try as regex pattern first
      const regex = new RegExp(pattern, 'i')
      const matches = prompt.match(regex)

      if (matches) {
        // Give high score for regex matches to ensure detection
        return 1.0
      }

      // If regex fails, try keyword matching
      const keywords = pattern.split('|').map((k) => k.trim().toLowerCase())
      const matchedKeywords = keywords.filter((keyword) => prompt.includes(keyword))

      if (matchedKeywords.length > 0) {
        // Score based on percentage of keywords matched
        return matchedKeywords.length / keywords.length
      }

      return 0
    } catch (error) {
      // If regex is invalid, fall back to keyword matching
      const keywords = pattern.split('|').map((k) => k.trim().toLowerCase())
      const matchedKeywords = keywords.filter((keyword) => prompt.includes(keyword))

      return matchedKeywords.length > 0 ? matchedKeywords.length / keywords.length : 0
    }
  }

  /**
   * Match prompt against trigger examples using similarity
   *
   * @param prompt - Normalized user prompt
   * @param examples - Example phrases from trigger
   * @returns Confidence score (0-1)
   */
  matchExamples(prompt: string, examples: string[]): number {
    if (!examples || examples.length === 0) {
      return 0
    }

    let maxSimilarity = 0

    for (const example of examples) {
      const normalizedExample = example.toLowerCase().trim()
      const similarity = this.calculateSimilarity(prompt, normalizedExample)
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }

    return maxSimilarity
  }

  /**
   * Calculate simple similarity between two strings
   * Uses Jaccard similarity (intersection over union of words)
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word-based Jaccard similarity
    const words1 = new Set(str1.split(/\s+/))
    const words2 = new Set(str2.split(/\s+/))

    const intersection = new Set([...words1].filter((word) => words2.has(word)))
    const union = new Set([...words1, ...words2])

    if (union.size === 0) return 0

    return intersection.size / union.size
  }

  /**
   * Generate reasoning explanation for detection
   *
   * @param prompt - User prompt
   * @param trigger - Matched trigger
   * @param keywordScore - Keyword match score
   * @param exampleScore - Example match score
   * @returns Human-readable reasoning
   */
  private generateReasoning(
    prompt: string,
    trigger: SkillTrigger,
    keywordScore: number,
    exampleScore: number,
  ): string {
    const reasons: string[] = []

    if (keywordScore > 0) {
      const keywords = trigger.pattern.split('|').map((k) => k.trim())
      const matchedKeywords = keywords.filter((keyword) => prompt.toLowerCase().includes(keyword.toLowerCase()))

      if (matchedKeywords.length > 0) {
        reasons.push(`Matched keywords: ${matchedKeywords.join(', ')}`)
      }
    }

    if (exampleScore > 0) {
      reasons.push(`Similar to example phrases in skill definition`)
    }

    const confidencePercent = Math.round((keywordScore * 0.6 + exampleScore * 0.4) * 100)
    reasons.push(`Overall confidence: ${confidencePercent}%`)

    return reasons.join('. ')
  }

  /**
   * Set minimum confidence threshold
   *
   * @param threshold - Minimum confidence (0-1)
   */
  setMinConfidence(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1')
    }
    this.minConfidence = threshold
  }

  /**
   * Get current minimum confidence threshold
   *
   * @returns Current threshold
   */
  getMinConfidence(): number {
    return this.minConfidence
  }
}
