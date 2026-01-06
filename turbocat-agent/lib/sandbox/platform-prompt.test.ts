/**
 * Tests for platform-aware prompt builder
 * Phase 4: Mobile Development - Task 4.1
 */

import { describe, it, expect } from 'vitest'
import {
  getPlatformContext,
  buildPlatformPrompt,
  injectPlatformContext,
  extractPlatform,
  type Platform,
} from './platform-prompt'

describe('getPlatformContext', () => {
  it('should return web context for web platform', () => {
    const context = getPlatformContext('web')

    expect(context.platform).toBe('web')
    expect(context.framework).toContain('Next.js')
    expect(context.styling).toContain('Tailwind')
    expect(context.router).toContain('Next.js App Router')
    expect(context.additionalGuidance).toBeDefined()
  })

  it('should return mobile context for mobile platform', () => {
    const context = getPlatformContext('mobile')

    expect(context.platform).toBe('mobile')
    expect(context.framework).toContain('React Native')
    expect(context.framework).toContain('Expo')
    expect(context.styling).toContain('NativeWind')
    expect(context.router).toContain('Expo Router')
    expect(context.nativeModules).toContain('Expo SDK')
    expect(context.additionalGuidance).toBeDefined()
  })

  it('should include Expo-specific guidance for mobile', () => {
    const context = getPlatformContext('mobile')

    expect(context.additionalGuidance).toContain('Expo SDK')
    expect(context.additionalGuidance).toContain('app.json')
    expect(context.additionalGuidance).toContain('Expo Go')
    expect(context.additionalGuidance).toContain('SafeAreaView')
  })

  it('should include Next.js-specific guidance for web', () => {
    const context = getPlatformContext('web')

    expect(context.additionalGuidance).toContain('Next.js')
    expect(context.additionalGuidance).toContain('Server Components')
    expect(context.additionalGuidance).toContain('shadcn/ui')
  })
})

describe('buildPlatformPrompt', () => {
  it('should build a complete prompt for web platform', () => {
    const prompt = buildPlatformPrompt('web')

    expect(prompt).toContain('Current platform is WEB')
    expect(prompt).toContain('Platform: web')
    expect(prompt).toContain('Next.js')
    expect(prompt).toContain('Tailwind CSS')
    expect(prompt).toContain('Guidelines for web development')
  })

  it('should build a complete prompt for mobile platform', () => {
    const prompt = buildPlatformPrompt('mobile')

    expect(prompt).toContain('Current platform is MOBILE')
    expect(prompt).toContain('Platform: mobile')
    expect(prompt).toContain('React Native')
    expect(prompt).toContain('Expo')
    expect(prompt).toContain('NativeWind')
    expect(prompt).toContain('Guidelines for mobile development')
    expect(prompt).toContain('Expo SDK modules')
    expect(prompt).toContain('app.json')
  })

  it('should include framework hints in the prompt', () => {
    const webPrompt = buildPlatformPrompt('web')
    const mobilePrompt = buildPlatformPrompt('mobile')

    expect(webPrompt).toContain('Framework: Next.js')
    expect(mobilePrompt).toContain('Framework: React Native')
  })

  it('should include styling information', () => {
    const webPrompt = buildPlatformPrompt('web')
    const mobilePrompt = buildPlatformPrompt('mobile')

    expect(webPrompt).toContain('Styling: Tailwind CSS')
    expect(mobilePrompt).toContain('Styling: NativeWind')
  })

  it('should include router information', () => {
    const webPrompt = buildPlatformPrompt('web')
    const mobilePrompt = buildPlatformPrompt('mobile')

    expect(webPrompt).toContain('Next.js App Router')
    expect(mobilePrompt).toContain('Expo Router')
  })

  it('should include native modules info only for mobile', () => {
    const webPrompt = buildPlatformPrompt('web')
    const mobilePrompt = buildPlatformPrompt('mobile')

    expect(webPrompt).not.toContain('Native Features')
    expect(mobilePrompt).toContain('Native Features: Expo SDK')
  })
})

describe('injectPlatformContext', () => {
  const userInstruction = 'Create a login screen with email and password fields'

  it('should inject web platform context before user instruction', () => {
    const result = injectPlatformContext(userInstruction, 'web')

    expect(result).toContain('Current platform is WEB')
    expect(result).toContain('Next.js')
    expect(result).toContain(userInstruction)
    expect(result.indexOf('Current platform')).toBeLessThan(result.indexOf(userInstruction))
  })

  it('should inject mobile platform context before user instruction', () => {
    const result = injectPlatformContext(userInstruction, 'mobile')

    expect(result).toContain('Current platform is MOBILE')
    expect(result).toContain('React Native')
    expect(result).toContain('Expo')
    expect(result).toContain(userInstruction)
    expect(result.indexOf('Current platform')).toBeLessThan(result.indexOf(userInstruction))
  })

  it('should preserve user instruction completely', () => {
    const result = injectPlatformContext(userInstruction, 'web')

    expect(result).toContain(userInstruction)
  })

  it('should create a clear separator between context and instruction', () => {
    const result = injectPlatformContext(userInstruction, 'mobile')

    expect(result).toContain('---')
    expect(result).toMatch(/---\s+Create a login screen/)
  })
})

describe('extractPlatform', () => {
  it('should extract web platform from task object', () => {
    const task = { platform: 'web' }
    const platform = extractPlatform(task)

    expect(platform).toBe('web')
  })

  it('should extract mobile platform from task object', () => {
    const task = { platform: 'mobile' }
    const platform = extractPlatform(task)

    expect(platform).toBe('mobile')
  })

  it('should default to web if task is undefined', () => {
    const platform = extractPlatform(undefined)

    expect(platform).toBe('web')
  })

  it('should default to web if task has no platform', () => {
    const task = {}
    const platform = extractPlatform(task)

    expect(platform).toBe('web')
  })

  it('should default to web if platform is null', () => {
    const task = { platform: null }
    const platform = extractPlatform(task)

    expect(platform).toBe('web')
  })

  it('should handle uppercase platform values', () => {
    const task = { platform: 'MOBILE' }
    const platform = extractPlatform(task)

    expect(platform).toBe('mobile')
  })

  it('should handle mixed case platform values', () => {
    const task = { platform: 'Web' }
    const platform = extractPlatform(task)

    expect(platform).toBe('web')
  })

  it('should default to web for invalid platform values', () => {
    const task = { platform: 'desktop' }
    const platform = extractPlatform(task)

    expect(platform).toBe('web')
  })
})

describe('Platform context integration', () => {
  it('should provide consistent context between functions', () => {
    const webContext = getPlatformContext('web')
    const webPrompt = buildPlatformPrompt('web')

    expect(webPrompt).toContain(webContext.framework)
    expect(webPrompt).toContain(webContext.styling)
    expect(webPrompt).toContain(webContext.router)
  })

  it('should inject complete platform-aware prompt', () => {
    const instruction = 'Build a todo list app'
    const injected = injectPlatformContext(instruction, 'mobile')

    // Should contain platform identifier
    expect(injected).toContain('MOBILE')

    // Should contain framework info
    expect(injected).toContain('React Native')
    expect(injected).toContain('Expo')

    // Should contain styling info
    expect(injected).toContain('NativeWind')

    // Should contain user instruction
    expect(injected).toContain(instruction)
  })
})
