/**
 * Integration tests for platform-aware prompt injection
 * Phase 4: Mobile Development - Task 4.1
 */

import { describe, it, expect } from 'vitest'
import { injectPlatformContext, extractPlatform, type Platform } from './platform-prompt'

describe('Platform Context Integration Tests', () => {
  describe('Web Platform Code Generation', () => {
    it('should guide AI to generate Next.js code for web platform', () => {
      const userPrompt = 'Create a dashboard with user analytics'
      const result = injectPlatformContext(userPrompt, 'web')

      // Should contain Next.js-specific keywords
      expect(result).toContain('Next.js')
      expect(result).toContain('Tailwind CSS')
      expect(result).toContain('App Router')
      expect(result).toContain('Server Components')

      // Should contain the user's original prompt
      expect(result).toContain(userPrompt)
    })

    it('should include shadcn/ui guidance for web platform', () => {
      const userPrompt = 'Build a login form'
      const result = injectPlatformContext(userPrompt, 'web')

      expect(result).toContain('shadcn/ui')
      expect(result).toContain('web')
    })
  })

  describe('Mobile Platform Code Generation', () => {
    it('should guide AI to generate React Native code for mobile platform', () => {
      const userPrompt = 'Create a camera capture screen'
      const result = injectPlatformContext(userPrompt, 'mobile')

      // Should contain React Native/Expo keywords
      expect(result).toContain('React Native')
      expect(result).toContain('Expo')
      expect(result).toContain('NativeWind')
      expect(result).toContain('Expo Router')

      // Should contain the user's original prompt
      expect(result).toContain(userPrompt)
    })

    it('should include Expo SDK guidance for mobile platform', () => {
      const userPrompt = 'Add location tracking'
      const result = injectPlatformContext(userPrompt, 'mobile')

      expect(result).toContain('Expo SDK')
      expect(result).toContain('app.json')
      expect(result).toContain('permissions')
      expect(result).toContain('Expo Go')
    })

    it('should include native module limitations for mobile', () => {
      const userPrompt = 'Integrate barcode scanner'
      const result = injectPlatformContext(userPrompt, 'mobile')

      expect(result).toContain('Expo Go limitations')
      expect(result).toContain('No custom native code')
      expect(result).toContain('Expo SDK modules')
    })
  })

  describe('Platform Extraction from Task', () => {
    it('should extract web platform from task with web value', () => {
      const task = { platform: 'web' }
      const platform = extractPlatform(task)

      expect(platform).toBe('web')
    })

    it('should extract mobile platform from task with mobile value', () => {
      const task = { platform: 'mobile' }
      const platform = extractPlatform(task)

      expect(platform).toBe('mobile')
    })

    it('should default to web for task without platform', () => {
      const task = {}
      const platform = extractPlatform(task)

      expect(platform).toBe('web')
    })

    it('should default to web for null platform', () => {
      const task = { platform: null }
      const platform = extractPlatform(task)

      expect(platform).toBe('web')
    })

    it('should default to web for undefined task', () => {
      const platform = extractPlatform(undefined)

      expect(platform).toBe('web')
    })
  })

  describe('End-to-End Platform Context Flow', () => {
    it('should generate correct prompt for mobile task from database', () => {
      // Simulate task from database
      const dbTask = { platform: 'mobile', prompt: 'Build a todo list app' }

      // Extract platform
      const platform = extractPlatform(dbTask)
      expect(platform).toBe('mobile')

      // Inject context
      const promptWithContext = injectPlatformContext(dbTask.prompt, platform)

      // Verify full context is included
      expect(promptWithContext).toContain('MOBILE')
      expect(promptWithContext).toContain('React Native')
      expect(promptWithContext).toContain('Expo')
      expect(promptWithContext).toContain(dbTask.prompt)
    })

    it('should generate correct prompt for web task from database', () => {
      // Simulate task from database
      const dbTask = { platform: 'web', prompt: 'Create an admin panel' }

      // Extract platform
      const platform = extractPlatform(dbTask)
      expect(platform).toBe('web')

      // Inject context
      const promptWithContext = injectPlatformContext(dbTask.prompt, platform)

      // Verify full context is included
      expect(promptWithContext).toContain('WEB')
      expect(promptWithContext).toContain('Next.js')
      expect(promptWithContext).toContain(dbTask.prompt)
    })

    it('should handle legacy tasks without platform field', () => {
      // Simulate legacy task from database (no platform field)
      const legacyTask = { prompt: 'Fix the homepage' }

      // Extract platform (should default to web)
      const platform = extractPlatform(legacyTask)
      expect(platform).toBe('web')

      // Inject context
      const promptWithContext = injectPlatformContext(legacyTask.prompt, platform)

      // Should default to web context
      expect(promptWithContext).toContain('WEB')
      expect(promptWithContext).toContain('Next.js')
    })
  })

  describe('Platform Context Consistency', () => {
    it('should maintain consistent platform context across multiple operations', () => {
      const platforms: Platform[] = ['web', 'mobile']

      for (const platform of platforms) {
        const prompt1 = injectPlatformContext('Task 1', platform)
        const prompt2 = injectPlatformContext('Task 2', platform)

        // Both prompts should have same platform declaration
        const platformDeclaration = platform.toUpperCase()
        expect(prompt1).toContain(platformDeclaration)
        expect(prompt2).toContain(platformDeclaration)

        // Both prompts should have same framework info
        const framework = platform === 'mobile' ? 'React Native' : 'Next.js'
        expect(prompt1).toContain(framework)
        expect(prompt2).toContain(framework)
      }
    })
  })

  describe('Prompt Length and Structure', () => {
    it('should not create excessively long prompts', () => {
      const userPrompt = 'Create a simple button component'
      const webPrompt = injectPlatformContext(userPrompt, 'web')
      const mobilePrompt = injectPlatformContext(userPrompt, 'mobile')

      // Prompts should be reasonable length (under 2000 chars for context)
      expect(webPrompt.length).toBeLessThan(2000)
      expect(mobilePrompt.length).toBeLessThan(2000)
    })

    it('should preserve multi-line user prompts', () => {
      const multiLinePrompt = `Create a form with:
- Email field
- Password field
- Submit button`

      const result = injectPlatformContext(multiLinePrompt, 'web')

      expect(result).toContain('Email field')
      expect(result).toContain('Password field')
      expect(result).toContain('Submit button')
    })

    it('should handle special characters in user prompts', () => {
      const promptWithSpecialChars = 'Create a component with "quotes" and \'apostrophes\''
      const result = injectPlatformContext(promptWithSpecialChars, 'mobile')

      expect(result).toContain('quotes')
      expect(result).toContain('apostrophes')
    })
  })
})
