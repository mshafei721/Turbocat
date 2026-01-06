/**
 * Test Suite for AI Cross-Platform Detection & Monorepo Recommendation
 * Phase 6: Project Structure & Monorepo Support - Task 6.3
 *
 * Tests keyword detection, template recommendations, and AI guidance
 */

import { describe, it, expect } from 'vitest'
import {
  detectCrossPlatform,
  getCrossPlatformAIGuidance,
  isMonorepoPreferred,
  isStandalonePreferred,
  type CrossPlatformDetectionResult,
} from './cross-platform-detector'

describe('Cross-Platform Detector - Task 6.3', () => {
  describe('detectCrossPlatform', () => {
    it('should detect explicit cross-platform request', () => {
      const result = detectCrossPlatform('Build a cross-platform app with web and mobile')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
      expect(result.detectedKeywords).toContain('cross-platform')
    })

    it('should detect "add mobile to web app" pattern', () => {
      const result = detectCrossPlatform('I want to add a mobile app to my existing web project')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
      expect(result.detectedKeywords.length).toBeGreaterThan(0)
    })

    it('should detect "web and mobile" pattern', () => {
      const result = detectCrossPlatform('Create an app that works on web and mobile')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.detectedKeywords).toContain('web and mobile')
    })

    it('should detect "build for both platforms" pattern', () => {
      const result = detectCrossPlatform('Build for both web and mobile platforms')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should detect code sharing requests', () => {
      const result = detectCrossPlatform('I need to share code between web and mobile apps')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.confidence).toBeGreaterThanOrEqual(0.25)
    })

    it('should detect shared types/utilities requests', () => {
      const result = detectCrossPlatform('Share types and utilities across web and mobile')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should not detect mobile-only requests as cross-platform', () => {
      const result = detectCrossPlatform('Build a mobile app using Expo')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })

    it('should not detect web-only requests as cross-platform', () => {
      const result = detectCrossPlatform('Create a website with Next.js')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })

    it('should lower confidence when "mobile only" is present', () => {
      const crossPlatformInput = 'Build a cross-platform app but mobile only'
      const result = detectCrossPlatform(crossPlatformInput)

      // Should still detect some keywords but with reduced confidence
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('should be case-insensitive', () => {
      const result1 = detectCrossPlatform('CROSS-PLATFORM APP')
      const result2 = detectCrossPlatform('cross-platform app')
      const result3 = detectCrossPlatform('Cross-Platform App')

      expect(result1.isCrossPlatform).toBe(result2.isCrossPlatform)
      expect(result2.isCrossPlatform).toBe(result3.isCrossPlatform)
      expect(result1.recommendedTemplate).toBe(result2.recommendedTemplate)
    })

    it('should detect multiple keyword patterns', () => {
      const result = detectCrossPlatform(
        'Build a web and mobile app with shared code, using a monorepo structure'
      )

      expect(result.isCrossPlatform).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.detectedKeywords.length).toBeGreaterThan(2)
    })

    it('should provide reasoning text', () => {
      const result = detectCrossPlatform('Create a cross-platform application')

      expect(result.reasoning).toBeTruthy()
      expect(result.reasoning).toContain('cross-platform')
    })

    it('should provide suggestion text', () => {
      const result = detectCrossPlatform('Build web and mobile together')

      expect(result.suggestion).toBeTruthy()
      expect(result.suggestion).toContain('monorepo')
    })

    it('should detect "mobile version of" pattern', () => {
      const result = detectCrossPlatform('Create a mobile version of my web app')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should detect "add mobile version" pattern', () => {
      const result = detectCrossPlatform('Add a mobile version to my existing web app')

      expect(result.isCrossPlatform).toBe(true)
    })

    it('should detect workspace/monorepo patterns', () => {
      const result1 = detectCrossPlatform('Set up a workspace with multiple apps')
      const result2 = detectCrossPlatform('Create a monorepo structure')

      expect(result1.isCrossPlatform).toBe(true)
      expect(result2.isCrossPlatform).toBe(true)
    })

    it('should detect pnpm workspace pattern', () => {
      const result = detectCrossPlatform('Use pnpm workspace for web and mobile')

      expect(result.isCrossPlatform).toBe(true)
      expect(result.detectedKeywords).toContain('pnpm workspace')
    })

    it('should detect turborepo pattern', () => {
      const result = detectCrossPlatform('Build with turborepo for both apps')

      expect(result.isCrossPlatform).toBe(true)
    })

    it('should handle empty input gracefully', () => {
      const result = detectCrossPlatform('')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })

    it('should return high confidence for explicit monorepo requests', () => {
      const result = detectCrossPlatform(
        'I need a monorepo with web and mobile apps sharing code'
      )

      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('getCrossPlatformAIGuidance', () => {
    it('should return monorepo guidance for cross-platform requests', () => {
      const guidance = getCrossPlatformAIGuidance('Build a cross-platform app with monorepo')

      expect(guidance.template).toBe('monorepo-web-mobile')
      expect(guidance.aiPrompt).toContain('monorepo')
      expect(guidance.aiPrompt).toContain('apps/web')
      expect(guidance.aiPrompt).toContain('apps/mobile')
      expect(guidance.instructions.length).toBeGreaterThan(0)
    })

    it('should return standalone guidance for mobile-only requests', () => {
      const guidance = getCrossPlatformAIGuidance('Build a mobile app with Expo')

      expect(guidance.template).toBe('standalone-expo')
      expect(guidance.aiPrompt).toContain('Expo')
      expect(guidance.instructions.length).toBeGreaterThan(0)
    })

    it('should include specific instructions for monorepo', () => {
      const guidance = getCrossPlatformAIGuidance('Set up a web and mobile monorepo')

      const instructionText = guidance.instructions.join(' ')
      expect(instructionText).toContain('monorepo')
      expect(instructionText).toContain('Next.js')
      expect(instructionText).toContain('Expo')
      expect(instructionText).toContain('shared')
    })

    it('should include specific instructions for standalone', () => {
      const guidance = getCrossPlatformAIGuidance('Create a mobile app')

      const instructionText = guidance.instructions.join(' ')
      expect(instructionText).toContain('Expo')
      expect(instructionText).toContain('NativeWind')
      expect(instructionText).toContain('app.json')
    })

    it('should have AI prompt for monorepo', () => {
      const guidance = getCrossPlatformAIGuidance('I want web and mobile together')

      expect(guidance.aiPrompt).toContain('pnpm')
      expect(guidance.aiPrompt).toContain('Next.js')
      expect(guidance.aiPrompt).toContain('Expo')
    })

    it('should have AI prompt for standalone', () => {
      const guidance = getCrossPlatformAIGuidance('Build just a mobile app')

      expect(guidance.aiPrompt).toContain('Expo Router')
      expect(guidance.aiPrompt).toContain('NativeWind')
    })
  })

  describe('isMonorepoPreferred', () => {
    it('should return true for explicit monorepo keyword', () => {
      const result = isMonorepoPreferred('Set up a monorepo')

      expect(result).toBe(true)
    })

    it('should return true for workspace keyword', () => {
      const result = isMonorepoPreferred('Create a workspace with multiple packages')

      expect(result).toBe(true)
    })

    it('should return true for turborepo keyword', () => {
      const result = isMonorepoPreferred('Use turborepo for the project')

      expect(result).toBe(true)
    })

    it('should return true for pnpm workspace', () => {
      const result = isMonorepoPreferred('Set up pnpm workspaces')

      expect(result).toBe(true)
    })

    it('should return true for shared code patterns', () => {
      const result = isMonorepoPreferred('Share code between web and mobile')

      expect(result).toBe(true)
    })

    it('should return false for standalone mobile request', () => {
      const result = isMonorepoPreferred('Build a simple mobile app')

      expect(result).toBe(false)
    })

    it('should be case-insensitive', () => {
      const result1 = isMonorepoPreferred('MONOREPO')
      const result2 = isMonorepoPreferred('monorepo')
      const result3 = isMonorepoPreferred('Monorepo')

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })
  })

  describe('isStandalonePreferred', () => {
    it('should return true for standalone keyword', () => {
      const result = isStandalonePreferred('Build a standalone mobile app')

      expect(result).toBe(true)
    })

    it('should return true for "mobile only" keyword', () => {
      const result = isStandalonePreferred('Create a mobile only app')

      expect(result).toBe(true)
    })

    it('should return true for "just a mobile app"', () => {
      const result = isStandalonePreferred('Just a mobile app')

      expect(result).toBe(true)
    })

    it('should return true for simple app keyword', () => {
      const result = isStandalonePreferred('Build a simple app')

      expect(result).toBe(true)
    })

    it('should return true for quick prototype', () => {
      const result = isStandalonePreferred('Quick prototype for mobile')

      expect(result).toBe(true)
    })

    it('should return false for cross-platform request', () => {
      const result = isStandalonePreferred('Build for web and mobile')

      expect(result).toBe(false)
    })

    it('should be case-insensitive', () => {
      const result1 = isStandalonePreferred('MOBILE ONLY')
      const result2 = isStandalonePreferred('mobile only')

      expect(result1).toBe(result2)
    })
  })

  describe('confidence levels', () => {
    it('should have high confidence for strong cross-platform signals', () => {
      const result = detectCrossPlatform(
        'Build a monorepo with web and mobile apps sharing code'
      )

      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should have medium confidence for single cross-platform keyword', () => {
      const result = detectCrossPlatform('This is cross-platform')

      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should have low confidence when contradicted', () => {
      const result = detectCrossPlatform('Cross-platform but mobile only')

      expect(result.confidence).toBeLessThan(0.5)
    })

    it('should clamp confidence between 0 and 1', () => {
      const result1 = detectCrossPlatform('')
      const result2 = detectCrossPlatform(
        'cross-platform web and mobile monorepo workspace turborepo'
      )

      expect(result1.confidence).toBeGreaterThanOrEqual(0)
      expect(result1.confidence).toBeLessThanOrEqual(1)
      expect(result2.confidence).toBeGreaterThanOrEqual(0)
      expect(result2.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('real-world scenarios', () => {
    it('should detect "Add mobile to my existing React web app" scenario', () => {
      const result = detectCrossPlatform(
        'I have an existing React web app and want to add a mobile app using Expo'
      )

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should detect "Build a startup MVP scenario', () => {
      const result = detectCrossPlatform(
        'Building a startup with web dashboard and mobile app for customers'
      )

      expect(result.isCrossPlatform).toBe(true)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should detect "Quick mobile prototype" scenario', () => {
      const result = detectCrossPlatform('Need a quick mobile prototype to test idea')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })

    it('should detect "Enterprise monorepo" scenario', () => {
      const result = detectCrossPlatform(
        'Building an enterprise system with web and mobile apps using pnpm workspaces and turborepo'
      )

      expect(result.isCrossPlatform).toBe(true)
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
      expect(result.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('should detect "Mobile-first startup" scenario', () => {
      const result = detectCrossPlatform('Building a mobile-first app for iOS and Android')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })

    it('should handle ambiguous requests with zero keywords', () => {
      const result = detectCrossPlatform('Help me build an app')

      expect(result.isCrossPlatform).toBe(false)
      expect(result.detectedKeywords).toHaveLength(0)
    })
  })

  describe('detected keywords tracking', () => {
    it('should track all matching keywords', () => {
      const result = detectCrossPlatform('Build cross-platform web and mobile app using monorepo')

      expect(result.detectedKeywords.length).toBeGreaterThanOrEqual(3)
      expect(result.detectedKeywords).toContain('cross-platform')
      expect(result.detectedKeywords).toContain('web and mobile')
      expect(result.detectedKeywords).toContain('monorepo')
    })

    it('should not include duplicate keywords', () => {
      const result = detectCrossPlatform('cross-platform cross-platform cross-platform')

      const uniqueKeywords = new Set(result.detectedKeywords)
      expect(uniqueKeywords.size).toEqual(result.detectedKeywords.length)
    })
  })

  describe('template recommendations', () => {
    it('monorepo template should be recommended for cross-platform', () => {
      const crossPlatform = detectCrossPlatform('web and mobile together')
      expect(crossPlatform.recommendedTemplate).toBe('monorepo-web-mobile')
    })

    it('standalone template should be recommended for mobile-only', () => {
      const standalone = detectCrossPlatform('mobile app')
      expect(standalone.recommendedTemplate).toBe('standalone-expo')
    })

    it('standalone template should be recommended by default', () => {
      const result = detectCrossPlatform('random text with no relevant keywords')
      expect(result.recommendedTemplate).toBe('standalone-expo')
    })
  })

  describe('description and explanation quality', () => {
    it('should include template name in reasoning for cross-platform', () => {
      const result = detectCrossPlatform('web and mobile monorepo')

      expect(result.reasoning).toContain('monorepo')
    })

    it('should include template name in reasoning for mobile-only', () => {
      const result = detectCrossPlatform('create a mobile app')

      expect(result.reasoning).toContain('Expo')
    })

    it('should explain benefits in suggestion text', () => {
      const result = detectCrossPlatform('web and mobile')

      expect(result.suggestion).toContain('share')
      expect(result.suggestion).toContain('code')
    })
  })
})
