/**
 * Platform-aware prompt builder for AI agents
 * Phase 4: Mobile Development - Task 4.1
 *
 * This module provides platform context injection into AI prompts to guide
 * code generation for web (Next.js) vs mobile (React Native Expo) platforms.
 */

export type Platform = 'web' | 'mobile'

export interface PlatformContext {
  platform: Platform
  framework: string
  styling: string
  router: string
  nativeModules?: string
  additionalGuidance?: string
}

/**
 * Get platform-specific context for AI prompt injection
 */
export function getPlatformContext(platform: Platform): PlatformContext {
  switch (platform) {
    case 'web':
      return {
        platform: 'web',
        framework: 'Next.js with TypeScript',
        styling: 'Tailwind CSS',
        router: 'Next.js App Router (file-based routing)',
        additionalGuidance: [
          'Use React Server Components by default (async components)',
          'Client components require "use client" directive',
          'Use shadcn/ui components for UI elements',
          'Follow Next.js 14+ patterns and conventions',
          'Optimize images with next/image',
          'Use Server Actions for form submissions',
        ].join('\n- '),
      }

    case 'mobile':
      return {
        platform: 'mobile',
        framework: 'React Native with Expo and TypeScript',
        styling: 'NativeWind (Tailwind CSS for React Native)',
        router: 'Expo Router (file-based routing similar to Next.js)',
        nativeModules: 'Expo SDK modules only (Expo Go managed workflow)',
        additionalGuidance: [
          'Use functional components with React hooks',
          'Import from react-native: View, Text, ScrollView, etc.',
          'Use NativeWind className prop for styling (Tailwind syntax)',
          'Use Expo SDK modules for native features (camera, location, etc.)',
          'Add required permissions to app.json when using native features',
          'Expo Go limitations: No custom native code, only Expo SDK modules',
          'Use SafeAreaView for iOS notch/status bar compatibility',
          'Use AsyncStorage for local data, backend APIs for shared data',
          'Platform-specific code: use Platform.select() or conditional rendering',
          '',
          'Code Templates Available:',
          '- Basic Screen: SafeAreaView with NativeWind styling',
          '- Functional Component: Component with hooks and TypeScript props',
          '- Expo Router Layout: File-based navigation with Stack',
          '- Stack Navigator: React Navigation stack with type safety',
          '- Tab Navigator: Bottom tabs with icons (Ionicons)',
          '- Zustand Store: Type-safe state management',
          '- AsyncStorage: Helper functions for local storage',
          '- API Client: Type-safe fetch client with auth',
        ].join('\n- '),
      }

    default:
      // Fallback to web if platform is unknown
      return getPlatformContext('web')
  }
}

/**
 * Build platform-aware system prompt prefix
 * This is prepended to the user's instruction to provide platform context
 */
export function buildPlatformPrompt(platform: Platform): string {
  const context = getPlatformContext(platform)

  const prompt = `
IMPORTANT: Current platform is ${context.platform.toUpperCase()}.

You are generating code for:
- Platform: ${context.platform}
- Framework: ${context.framework}
- Styling: ${context.styling}
- Routing: ${context.router}
${context.nativeModules ? `- Native Features: ${context.nativeModules}` : ''}

Guidelines for ${context.platform} development:
- ${context.additionalGuidance}

When generating code:
1. Follow ${context.platform === 'mobile' ? 'React Native/Expo' : 'Next.js'} best practices
2. Use ${context.styling} for all styling
3. Use ${context.router} for navigation
${context.platform === 'mobile' ? '4. Suggest appropriate Expo SDK modules for native features\n5. Add required permissions to app.json when needed' : ''}

Please proceed with the user's request below:

---

`.trim()

  return prompt
}

/**
 * Inject platform context into user instruction
 * This wraps the user's instruction with platform-specific guidance
 */
export function injectPlatformContext(instruction: string, platform: Platform): string {
  const platformPrompt = buildPlatformPrompt(platform)

  // Combine platform context with user instruction
  return `${platformPrompt}\n\n${instruction}`
}

/**
 * Extract platform from task object (used in agent execution)
 * Defaults to 'web' if platform is not specified
 */
export function extractPlatform(task?: { platform?: string | null }): Platform {
  if (!task || !task.platform) {
    return 'web' // Default to web
  }

  const platform = task.platform.toLowerCase()
  return platform === 'mobile' ? 'mobile' : 'web'
}
