/**
 * Mobile-Specific Error Detection & Guidance
 * Phase 4: Mobile Development - Task 4.4
 *
 * Detects common React Native/Expo errors and provides helpful guidance
 * with troubleshooting steps and auto-fix suggestions.
 */

export type MobileErrorType =
  | 'missing-module'
  | 'permission-error'
  | 'metro-bundler-error'
  | 'platform-specific-api'
  | 'custom-native-module'
  | 'syntax-error'
  | 'network-error'

export interface MobileErrorDetectionResult {
  detected: boolean
  errorType?: MobileErrorType
  moduleName?: string
  rawError?: string
  confidence: number // 0-1
}

export interface ErrorGuidance {
  title: string
  description: string
  steps: string[]
  docsUrl?: string
  relatedErrors?: string[]
}

export interface AutoFixSuggestion {
  canAutoFix: boolean
  command?: string
  description?: string
  manualSteps?: string[]
  codeExample?: string
  warning?: string
}

/**
 * Error detection patterns with priority
 * Higher priority patterns are checked first
 */
interface ErrorPattern {
  type: MobileErrorType
  patterns: RegExp[]
  extractModule?: (error: string) => string | undefined
  priority: number
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Missing Module (highest priority - most actionable)
  {
    type: 'missing-module',
    patterns: [
      /Cannot find module ['"]([^'"]+)['"]/i,
      /Unable to resolve module ([^\s]+)/i,
      /Module ([^\s]+) was not found/i,
      /require\(['"]([^'"]+)['"]\) failed/i,
      /Error: Cannot find module '([^']+)'/i,
    ],
    extractModule: (error: string): string | undefined => {
      const patterns = [
        /Cannot find module ['"]([^'"]+)['"]/i,
        /Unable to resolve module ([^\s]+)/i,
        /Module ([^\s]+) was not found/i,
        /require\(['"]([^'"]+)['"]\) failed/i,
      ]
      for (const pattern of patterns) {
        const match = error.match(pattern)
        if (match && match[1]) {
          // Clean up module name (remove paths, trailing characters)
          return match[1].split('/')[0].replace(/['":\s]/g, '')
        }
      }
      return undefined
    },
    priority: 100,
  },

  // Permission Errors
  {
    type: 'permission-error',
    patterns: [
      /permission.*denied/i,
      /Permission.*not.*granted/i,
      /privacy-sensitive data without a usage description/i,
      /NSLocationWhenInUseUsageDescription/i,
      /NSCameraUsageDescription/i,
      /requires.*permission/i,
    ],
    priority: 90,
  },

  // Metro Bundler Errors
  {
    type: 'metro-bundler-error',
    patterns: [
      /Metro.*bundler.*failed/i,
      /TransformError/i,
      /Metro has encountered an error/i,
      /Port.*8081.*already.*in.*use/i,
      /Metro.*error/i,
      /bundler.*error/i,
      /unable to load script/i,
    ],
    priority: 80,
  },

  // Platform-Specific API Errors
  {
    type: 'platform-specific-api',
    patterns: [
      /not supported on this platform/i,
      /not available on this platform/i,
      /IOSSpecificModule/i,
      /AndroidSpecificModule/i,
      /BackHandler.*not.*supported/i,
      /Platform\.(OS|select)/i,
      /only.*available.*on.*(iOS|Android)/i,
    ],
    priority: 70,
  },

  // Custom Native Module Errors (Expo Go limitation)
  {
    type: 'custom-native-module',
    patterns: [
      /Native module cannot be null/i,
      /requireNativeComponent.*was not found/i,
      /TurboModule.*not.*found/i,
      /Invariant Violation.*Native/i,
      /NativeModule.*null/i,
      /linked.*library.*not.*found/i,
    ],
    priority: 60,
  },

  // Syntax Errors
  {
    type: 'syntax-error',
    patterns: [
      /SyntaxError/i,
      /Unexpected token/i,
      /Type '.*' is not assignable to type/i,
      /Parse error/i,
      /TypeError:.*undefined.*property/i,
    ],
    priority: 50,
  },

  // Network Errors
  {
    type: 'network-error',
    patterns: [
      /Network request failed/i,
      /Failed to fetch/i,
      /ETIMEDOUT/i,
      /ECONNREFUSED/i,
      /Network error/i,
      /no internet/i,
    ],
    priority: 40,
  },
]

/**
 * Detect mobile-specific error from error string
 */
export function detectMobileError(error: string): MobileErrorDetectionResult {
  // Handle null/undefined
  if (!error || typeof error !== 'string') {
    return {
      detected: false,
      confidence: 0,
    }
  }

  // Sort patterns by priority (highest first)
  const sortedPatterns = [...ERROR_PATTERNS].sort((a, b) => b.priority - a.priority)

  for (const errorPattern of sortedPatterns) {
    for (const pattern of errorPattern.patterns) {
      if (pattern.test(error)) {
        const result: MobileErrorDetectionResult = {
          detected: true,
          errorType: errorPattern.type,
          rawError: error,
          confidence: errorPattern.priority / 100,
        }

        // Extract module name if applicable
        if (errorPattern.extractModule) {
          result.moduleName = errorPattern.extractModule(error)
        }

        return result
      }
    }
  }

  return {
    detected: false,
    confidence: 0,
  }
}

/**
 * Get guidance for a specific error type
 */
export function getMobileErrorGuidance(
  errorType: MobileErrorType,
  moduleName?: string
): ErrorGuidance {
  const guidanceMap: Record<MobileErrorType, ErrorGuidance> = {
    'missing-module': {
      title: `Missing Expo SDK Module${moduleName ? `: ${moduleName}` : ''}`,
      description: `The module "${moduleName || 'unknown'}" is not installed in your project. This is required to use the requested functionality.`,
      steps: [
        `Run: npx expo install ${moduleName || '<module-name>'}`,
        'Restart the Metro bundler after installation',
        'If the issue persists, clear the Metro cache with: npx expo start --clear',
        'Check that the module is compatible with your Expo SDK version',
      ],
      docsUrl: moduleName
        ? `https://docs.expo.dev/versions/latest/sdk/${moduleName?.replace('expo-', '')}/`
        : 'https://docs.expo.dev/versions/latest/',
      relatedErrors: ['TransformError', 'Unable to resolve module'],
    },

    'permission-error': {
      title: 'Permission Configuration Required',
      description: 'The app requires permissions that are not properly configured in app.json or have not been granted by the user.',
      steps: [
        'Check app.json for required permission configurations',
        'Add the necessary permission descriptions for iOS (NSxxxUsageDescription)',
        'Add required permissions to android.permissions array',
        'Use the expo-* module hooks to request permissions at runtime',
        'Ensure the user has granted the permission on their device',
      ],
      docsUrl: 'https://docs.expo.dev/guides/permissions/',
      relatedErrors: ['permission denied', 'privacy-sensitive data'],
    },

    'metro-bundler-error': {
      title: 'Metro Bundler Error',
      description: 'The Metro bundler encountered an error while building your app. This could be due to cache issues, port conflicts, or transformation errors.',
      steps: [
        'Stop the current Metro process (Ctrl+C)',
        'Clear Metro cache: npx expo start --clear',
        'If port 8081 is in use, kill the process or use a different port: npx expo start --port 8082',
        'Delete node_modules and reinstall: rm -rf node_modules && npm install',
        'Check for syntax errors in recently modified files',
      ],
      docsUrl: 'https://docs.expo.dev/guides/troubleshooting/',
      relatedErrors: ['TransformError', 'Port in use', 'ENOENT'],
    },

    'platform-specific-api': {
      title: 'Platform-Specific API Error',
      description: 'You are using an API that is only available on one platform (iOS or Android). Use Platform.select() or conditional rendering to handle both platforms.',
      steps: [
        'Import Platform from react-native: import { Platform } from "react-native"',
        'Use Platform.OS to check the current platform: if (Platform.OS === "ios") { ... }',
        'Use Platform.select() for platform-specific values: Platform.select({ ios: value1, android: value2 })',
        'Consider using a cross-platform alternative from Expo SDK',
        'Wrap platform-specific code in conditional blocks',
      ],
      docsUrl: 'https://reactnative.dev/docs/platform-specific-code',
      relatedErrors: ['not supported on this platform', 'not available'],
    },

    'custom-native-module': {
      title: 'Custom Native Module - Expo Go Limitation',
      description: 'This error typically occurs when using a library that requires custom native code, which is not supported in Expo Go. You need to create a development build to use this feature.',
      steps: [
        'WARNING: This module is NOT compatible with Expo Go',
        'You have two options:',
        '  1. Use an Expo SDK alternative (if available)',
        '  2. Create a development build: npx expo run:ios or npx expo run:android',
        'For development builds, run: npx expo prebuild',
        'Then build with: npx expo run:ios (or run:android)',
        'Learn more about development builds in the Expo documentation',
      ],
      docsUrl: 'https://docs.expo.dev/develop/development-builds/introduction/',
      relatedErrors: ['Native module cannot be null', 'requireNativeComponent'],
    },

    'syntax-error': {
      title: 'Syntax or Type Error',
      description: 'There is a syntax error or type mismatch in your code. Check the error message for the specific file and line number.',
      steps: [
        'Check the error message for the file name and line number',
        'Look for missing brackets, parentheses, or semicolons',
        'Verify TypeScript types match the expected values',
        'Check for typos in variable or function names',
        'Use your IDE/editor for inline error highlighting',
      ],
      docsUrl: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
      relatedErrors: ['Unexpected token', 'Type is not assignable'],
    },

    'network-error': {
      title: 'Network Request Error',
      description: 'A network request failed. This could be due to connectivity issues, incorrect URLs, or CORS problems.',
      steps: [
        'Check your internet connection',
        'Verify the API endpoint URL is correct',
        'Ensure the server is running and accessible',
        'For local development, use your machine IP instead of localhost',
        'Check for CORS issues if connecting to external APIs',
        'Add proper error handling to your fetch calls',
      ],
      docsUrl: 'https://reactnative.dev/docs/network',
      relatedErrors: ['Failed to fetch', 'ETIMEDOUT', 'ECONNREFUSED'],
    },
  }

  return guidanceMap[errorType]
}

/**
 * Suggest auto-fix for the detected error
 */
export function suggestAutoFix(
  errorType: MobileErrorType,
  moduleName?: string
): AutoFixSuggestion {
  const fixMap: Record<MobileErrorType, AutoFixSuggestion> = {
    'missing-module': {
      canAutoFix: true,
      command: `npx expo install ${moduleName || '<module-name>'}`,
      description: `Install the missing ${moduleName || 'module'} package`,
    },

    'permission-error': {
      canAutoFix: false,
      manualSteps: [
        'Open app.json in your project root',
        'Add the required permission configuration',
        'For iOS, add to expo.ios.infoPlist',
        'For Android, add to expo.android.permissions',
        'Rebuild the app for permission changes to take effect',
      ],
    },

    'metro-bundler-error': {
      canAutoFix: true,
      command: 'npx expo start --clear',
      description: 'Restart Metro bundler with cleared cache',
    },

    'platform-specific-api': {
      canAutoFix: false,
      codeExample: `import { Platform } from 'react-native';

// Using Platform.OS
if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}

// Using Platform.select
const styles = Platform.select({
  ios: { marginTop: 20 },
  android: { marginTop: 0 },
});`,
      manualSteps: [
        'Import Platform from react-native',
        'Wrap platform-specific code in conditionals',
        'Use Platform.select() for platform-specific values',
      ],
    },

    'custom-native-module': {
      canAutoFix: false,
      warning: 'This module requires custom native code and is NOT compatible with Expo Go. You must create a development build to use this feature.',
      manualSteps: [
        'Run: npx expo prebuild',
        'Run: npx expo run:ios (or run:android)',
        'Or find an Expo SDK alternative module',
      ],
    },

    'syntax-error': {
      canAutoFix: false,
      manualSteps: [
        'Review the error message for file and line number',
        'Fix the syntax issue in your code',
        'Save the file to trigger hot reload',
      ],
    },

    'network-error': {
      canAutoFix: false,
      manualSteps: [
        'Check your internet connection',
        'Verify the API endpoint is correct',
        'For local development, use your IP address instead of localhost',
      ],
      codeExample: `// Use try-catch for network requests
try {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
} catch (error) {
  console.error('Network error:', error);
  // Handle error appropriately
}`,
    },
  }

  return fixMap[errorType]
}

/**
 * Get comprehensive error analysis with guidance and fix suggestions
 */
export function analyzeError(error: string): {
  detection: MobileErrorDetectionResult
  guidance?: ErrorGuidance
  fix?: AutoFixSuggestion
} {
  const detection = detectMobileError(error)

  if (!detection.detected || !detection.errorType) {
    return { detection }
  }

  const guidance = getMobileErrorGuidance(detection.errorType, detection.moduleName)
  const fix = suggestAutoFix(detection.errorType, detection.moduleName)

  return {
    detection,
    guidance,
    fix,
  }
}

/**
 * Format error analysis for AI prompt injection
 */
export function formatErrorForAI(error: string): string {
  const analysis = analyzeError(error)

  if (!analysis.detection.detected) {
    return ''
  }

  let message = `I detected an error in the mobile app:\n\n`
  message += `**Error Type:** ${analysis.detection.errorType}\n`

  if (analysis.detection.moduleName) {
    message += `**Module:** ${analysis.detection.moduleName}\n`
  }

  if (analysis.guidance) {
    message += `\n**${analysis.guidance.title}**\n`
    message += `${analysis.guidance.description}\n\n`
    message += `**Troubleshooting Steps:**\n`
    analysis.guidance.steps.forEach((step, i) => {
      message += `${i + 1}. ${step}\n`
    })
  }

  if (analysis.fix) {
    if (analysis.fix.canAutoFix && analysis.fix.command) {
      message += `\n**Auto-Fix Command:** \`${analysis.fix.command}\`\n`
    }

    if (analysis.fix.warning) {
      message += `\n**Warning:** ${analysis.fix.warning}\n`
    }

    if (analysis.fix.codeExample) {
      message += `\n**Code Example:**\n\`\`\`typescript\n${analysis.fix.codeExample}\n\`\`\`\n`
    }
  }

  if (analysis.guidance?.docsUrl) {
    message += `\n**Documentation:** ${analysis.guidance.docsUrl}\n`
  }

  return message
}
