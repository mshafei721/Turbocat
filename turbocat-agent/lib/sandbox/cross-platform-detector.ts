/**
 * AI Cross-Platform Detection & Monorepo Recommendation
 * Phase 6: Project Structure & Monorepo Support - Task 6.3
 *
 * Detects keywords indicating cross-platform needs and recommends
 * monorepo vs standalone project structure.
 */

export interface CrossPlatformDetectionResult {
  isCrossPlatform: boolean
  confidence: number
  recommendedTemplate: 'standalone-expo' | 'monorepo-web-mobile'
  reasoning: string
  detectedKeywords: string[]
  suggestion: string
}

/**
 * Keywords that indicate cross-platform needs
 */
const CROSS_PLATFORM_KEYWORDS = [
  // Explicit cross-platform requests
  'cross-platform',
  'cross platform',
  'web and mobile',
  'web & mobile',
  'mobile and web',
  'both web and mobile',
  'both platforms',

  // Adding mobile to existing web
  'add mobile',
  'add a mobile',
  'add mobile app',
  'add mobile version',
  'mobile version of',
  'mobile app for',
  'build for web and mobile',
  'build for mobile and web',

  // Adding web to mobile
  'add web',
  'add a web',
  'add web app',
  'add web version',
  'web version of mobile',
  'web app for mobile',

  // Sharing code between platforms
  'share code',
  'shared code',
  'code sharing',
  'reusable code',
  'share components',
  'shared components',
  'shared types',
  'shared utils',
  'shared utilities',
  'shared logic',
  'shared api',

  // Monorepo concepts
  'monorepo',
  'mono repo',
  'workspace',
  'workspaces',
  'multi-app',
  'multiple apps',
  'multiple platforms',

  // Portfolio/production apps
  'production app',
  'production ready',
  'enterprise app',
  'scale app',
  'scalable app',
  'large app',

  // Explicit monorepo requests
  'use monorepo',
  'setup monorepo',
  'monorepo structure',
  'monorepo template',
  'pnpm workspace',
  'turborepo',
  'yarn workspace',
]

/**
 * Keywords that indicate mobile-only or web-only needs
 * Lower confidence if these are present
 */
const PLATFORM_SPECIFIC_KEYWORDS = {
  web: ['web only', 'website only', 'browser app', 'spa', 'single page app'],
  mobile: ['mobile only', 'mobile app only', 'ios only', 'android only'],
}

/**
 * Detect if user is requesting a cross-platform setup
 */
export function detectCrossPlatform(userInput: string): CrossPlatformDetectionResult {
  const lowerInput = userInput.toLowerCase()

  // Find matching keywords
  const detectedKeywords = CROSS_PLATFORM_KEYWORDS.filter((keyword) =>
    lowerInput.includes(keyword.toLowerCase())
  )

  const isCrossPlatform = detectedKeywords.length > 0

  // Check for platform-specific keywords that might lower confidence
  let confidenceAdjustment = 0

  if (PLATFORM_SPECIFIC_KEYWORDS.web.some((kw) => lowerInput.includes(kw))) {
    confidenceAdjustment -= 0.3
  }

  if (PLATFORM_SPECIFIC_KEYWORDS.mobile.some((kw) => lowerInput.includes(kw))) {
    confidenceAdjustment -= 0.3
  }

  // Calculate confidence based on number of keywords
  // More keywords = higher confidence it's truly cross-platform
  let confidence = Math.min(detectedKeywords.length * 0.25, 1.0) + confidenceAdjustment
  confidence = Math.max(confidence, 0)

  const recommendedTemplate: 'standalone-expo' | 'monorepo-web-mobile' = isCrossPlatform
    ? 'monorepo-web-mobile'
    : 'standalone-expo'

  const reasoning = generateReasoning(detectedKeywords, isCrossPlatform, confidence)
  const suggestion = generateSuggestion(recommendedTemplate)

  return {
    isCrossPlatform,
    confidence,
    recommendedTemplate,
    reasoning,
    detectedKeywords,
    suggestion,
  }
}

/**
 * Generate human-readable reasoning for the detection
 */
function generateReasoning(
  detectedKeywords: string[],
  isCrossPlatform: boolean,
  confidence: number
): string {
  if (!isCrossPlatform) {
    return "I detected a mobile-first project. A standalone Expo app will be the best fit for your needs."
  }

  const keywordPhrase = detectedKeywords.slice(0, 3).join(', ')
  const confidenceText =
    confidence > 0.7 ? 'strongly' : confidence > 0.4 ? 'somewhat' : 'potentially'

  return `I detected cross-platform requirements (${keywordPhrase}). This ${confidenceText} suggests a monorepo structure would be beneficial for sharing code between web and mobile.`
}

/**
 * Generate suggestion text for the recommended template
 */
function generateSuggestion(template: 'standalone-expo' | 'monorepo-web-mobile'): string {
  if (template === 'monorepo-web-mobile') {
    return `
I recommend setting up a **monorepo with shared packages**. This will allow you to:
- Share TypeScript types between web and mobile
- Share API client code and utilities
- Maintain a single source of truth for business logic
- Use pnpm workspaces for efficient dependency management
- Scale to larger teams easily

Your structure will be:
- \`apps/web\` - Next.js application
- \`apps/mobile\` - Expo application
- \`packages/shared\` - Types, API clients, utilities
- \`packages/config\` - Shared ESLint and TypeScript configs

Would you like me to set this up for you?
    `
  } else {
    return `
I recommend starting with a **standalone Expo app**. You can:
- Build and iterate quickly on your mobile app
- Add web support later if needed
- Keep the codebase simple initially
- Grow to a monorepo when cross-platform needs emerge

Your starting structure will be:
- \`app/\` - Expo Router screens
- \`components/\` - Reusable UI components
- \`lib/\` - Utilities and helpers

You can always migrate to a monorepo later without losing your mobile app code.
    `
  }
}

/**
 * Get cross-platform detection with AI explanation
 * This is used to guide AI responses
 */
export function getCrossPlatformAIGuidance(userInput: string): {
  template: 'standalone-expo' | 'monorepo-web-mobile'
  aiPrompt: string
  instructions: string[]
} {
  const detection = detectCrossPlatform(userInput)

  let aiPrompt = ''
  let instructions: string[] = []

  if (detection.recommendedTemplate === 'monorepo-web-mobile') {
    aiPrompt = `
The user is requesting a cross-platform project (${detection.detectedKeywords.join(', ')}).
Set up a pnpm monorepo with:
- apps/web (Next.js) and apps/mobile (Expo)
- packages/shared with shared types, API clients, and utilities
- Shared configurations in packages/config

Generate all necessary files for both apps and shared packages.
    `

    instructions = [
      'Generate monorepo root configuration (package.json, pnpm-workspace.yaml, turbo.json)',
      'Create Next.js app structure with Tailwind CSS',
      'Create Expo app structure with NativeWind',
      'Create shared package with types, API client, and utilities',
      'Configure path aliases so both apps can import from @${slug}/shared',
      'Add installation and development instructions',
    ]
  } else {
    aiPrompt = `
The user is requesting a mobile-focused project. Set up a standalone Expo app with:
- Expo Router for navigation
- NativeWind for styling
- TypeScript support
- Basic component library
- Ready for development and testing

This can be migrated to a monorepo later if cross-platform needs emerge.
    `

    instructions = [
      'Generate standalone Expo project structure',
      'Configure app.json with appropriate settings',
      'Set up NativeWind and Tailwind configuration',
      'Create basic screens and navigation',
      'Add utility functions and constants',
      'Create example components',
    ]
  }

  return {
    template: detection.recommendedTemplate,
    aiPrompt: aiPrompt.trim(),
    instructions,
  }
}

/**
 * Check if input suggests monorepo preference
 * This is a stricter check for actual monorepo setups
 */
export function isMonorepoPreferred(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase()

  const monorepoPreferenceKeywords = [
    'monorepo',
    'mono repo',
    'workspace',
    'workspaces',
    'turborepo',
    'pnpm workspace',
    'yarn workspace',
    'share code between',
    'share types',
    'shared packages',
  ]

  return monorepoPreferenceKeywords.some((kw) => lowerInput.includes(kw))
}

/**
 * Check if input suggests standalone preference
 * This is a stricter check for single-app setups
 */
export function isStandalonePreferred(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase()

  const standalonePreferenceKeywords = [
    'standalone',
    'single app',
    'simple app',
    'quick prototype',
    'solo project',
    'just mobile',
    'mobile only',
    'just a mobile app',
  ]

  return standalonePreferenceKeywords.some((kw) => lowerInput.includes(kw))
}

/**
 * Template metadata
 */
export const crossPlatformDetectorMetadata = {
  name: 'Cross-Platform Detector',
  description:
    'AI logic to detect cross-platform requirements and recommend monorepo vs standalone setup',
  version: '1.0.0',
  keywords: [
    'cross-platform',
    'monorepo',
    'web and mobile',
    'shared code',
    'detection',
  ],
  capabilities: [
    'Detect keywords indicating cross-platform needs',
    'Recommend monorepo vs standalone structure',
    'Generate AI guidance for template selection',
    'Check monorepo/standalone preference strength',
  ],
}
