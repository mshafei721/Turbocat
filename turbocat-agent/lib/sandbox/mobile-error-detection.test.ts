/**
 * Test Suite for Mobile-Specific Error Detection & Guidance
 * Phase 4: Mobile Development - Task 4.4
 *
 * Tests error detection patterns, troubleshooting suggestions, and auto-fix capabilities
 */

import { describe, it, expect } from 'vitest'
import {
  detectMobileError,
  getMobileErrorGuidance,
  suggestAutoFix,
  type MobileErrorType,
  type MobileErrorDetectionResult,
  type ErrorGuidance,
} from './mobile-error-detection'

describe('Mobile Error Detection - Task 4.4', () => {
  describe('detectMobileError', () => {
    describe('Missing Expo SDK Module', () => {
      it('should detect missing expo-camera module', () => {
        const error = "Cannot find module 'expo-camera'"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('missing-module')
        expect(result.moduleName).toBe('expo-camera')
      })

      it('should detect missing expo-location module', () => {
        const error = "Unable to resolve module expo-location from"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('missing-module')
        expect(result.moduleName).toBe('expo-location')
      })

      it('should detect missing module with require statement', () => {
        const error = "Error: Cannot find module 'expo-notifications'"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('missing-module')
        expect(result.moduleName).toBe('expo-notifications')
      })
    })

    describe('Permission Errors', () => {
      it('should detect iOS permission error', () => {
        const error = "This app has crashed because it attempted to access privacy-sensitive data without a usage description"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('permission-error')
      })

      it('should detect Android permission denied', () => {
        const error = "Error: Permission denied: camera"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('permission-error')
      })

      it('should detect permission not granted', () => {
        const error = "Permission CAMERA not granted"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('permission-error')
      })
    })

    describe('Metro Bundler Errors', () => {
      it('should detect Metro bundler start failure', () => {
        const error = "Metro bundler failed to start"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('metro-bundler-error')
      })

      it('should detect Metro transform error', () => {
        const error = "TransformError: Unable to resolve module"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('metro-bundler-error')
      })

      it('should detect Metro cache error', () => {
        const error = "Metro has encountered an error: ENOENT"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('metro-bundler-error')
      })

      it('should detect Metro port in use error', () => {
        const error = "Port 8081 is already in use"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('metro-bundler-error')
      })
    })

    describe('Platform-Specific API Errors', () => {
      it('should detect iOS-only API usage', () => {
        const error = "undefined is not an object (evaluating 'NativeModules.IOSSpecificModule')"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('platform-specific-api')
      })

      it('should detect Android-only API usage', () => {
        const error = "BackHandler is not supported on this platform"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('platform-specific-api')
      })

      it('should detect platform not supported error', () => {
        const error = "This feature is not available on this platform"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('platform-specific-api')
      })
    })

    describe('Custom Native Module Errors', () => {
      it('should detect Expo Go limitation for native modules', () => {
        const error = "Native module cannot be null"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('custom-native-module')
      })

      it('should detect requireNativeComponent error', () => {
        const error = "requireNativeComponent: 'CustomView' was not found"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('custom-native-module')
      })

      it('should detect linked library error', () => {
        const error = "Invariant Violation: TurboModule was not found"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('custom-native-module')
      })
    })

    describe('Syntax Errors', () => {
      it('should detect JavaScript syntax error', () => {
        const error = "SyntaxError: Unexpected token"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('syntax-error')
      })

      it('should detect TypeScript type error', () => {
        const error = "Type 'string' is not assignable to type 'number'"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('syntax-error')
      })
    })

    describe('Network Errors', () => {
      it('should detect network request error', () => {
        const error = "Network request failed"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('network-error')
      })

      it('should detect fetch error', () => {
        const error = "TypeError: Failed to fetch"
        const result = detectMobileError(error)

        expect(result.detected).toBe(true)
        expect(result.errorType).toBe('network-error')
      })
    })

    describe('No Error Detected', () => {
      it('should not detect error for normal logs', () => {
        const log = "Server started on port 3000"
        const result = detectMobileError(log)

        expect(result.detected).toBe(false)
        expect(result.errorType).toBeUndefined()
      })

      it('should not detect error for warnings', () => {
        const log = "Warning: componentWillMount is deprecated"
        const result = detectMobileError(log)

        // Warnings are not errors, but we may want to detect them
        expect(result.detected).toBe(false)
      })
    })
  })

  describe('getMobileErrorGuidance', () => {
    it('should provide guidance for missing module error', () => {
      const guidance = getMobileErrorGuidance('missing-module', 'expo-camera')

      expect(guidance).toBeDefined()
      expect(guidance.title).toBeTruthy()
      expect(guidance.description).toBeTruthy()
      expect(guidance.steps).toBeInstanceOf(Array)
      expect(guidance.steps.length).toBeGreaterThan(0)
      expect(guidance.steps.some(s => s.includes('expo install'))).toBe(true)
    })

    it('should provide guidance for permission error', () => {
      const guidance = getMobileErrorGuidance('permission-error')

      expect(guidance).toBeDefined()
      expect(guidance.title).toContain('Permission')
      expect(guidance.steps.some(s => s.includes('app.json'))).toBe(true)
    })

    it('should provide guidance for Metro bundler error', () => {
      const guidance = getMobileErrorGuidance('metro-bundler-error')

      expect(guidance).toBeDefined()
      expect(guidance.title).toContain('Metro')
      expect(guidance.steps.some(s => s.includes('restart') || s.includes('cache'))).toBe(true)
    })

    it('should provide guidance for platform-specific API error', () => {
      const guidance = getMobileErrorGuidance('platform-specific-api')

      expect(guidance).toBeDefined()
      expect(guidance.steps.some(s => s.includes('Platform.select') || s.includes('Platform.OS'))).toBe(true)
    })

    it('should provide guidance for custom native module error', () => {
      const guidance = getMobileErrorGuidance('custom-native-module')

      expect(guidance).toBeDefined()
      expect(guidance.steps.some(s => s.includes('Expo Go') || s.includes('development build'))).toBe(true)
    })

    it('should provide guidance for syntax error', () => {
      const guidance = getMobileErrorGuidance('syntax-error')

      expect(guidance).toBeDefined()
      expect(guidance.title).toContain('Syntax')
    })

    it('should provide guidance for network error', () => {
      const guidance = getMobileErrorGuidance('network-error')

      expect(guidance).toBeDefined()
      expect(guidance.title).toContain('Network')
    })
  })

  describe('suggestAutoFix', () => {
    it('should suggest install command for missing module', () => {
      const fix = suggestAutoFix('missing-module', 'expo-camera')

      expect(fix).toBeDefined()
      expect(fix.canAutoFix).toBe(true)
      expect(fix.command).toBe('npx expo install expo-camera')
      expect(fix.description).toContain('Install')
    })

    it('should not auto-fix permission errors', () => {
      const fix = suggestAutoFix('permission-error')

      expect(fix).toBeDefined()
      expect(fix.canAutoFix).toBe(false)
      expect(fix.manualSteps).toBeInstanceOf(Array)
    })

    it('should suggest cache clear for Metro bundler errors', () => {
      const fix = suggestAutoFix('metro-bundler-error')

      expect(fix).toBeDefined()
      expect(fix.canAutoFix).toBe(true)
      expect(fix.command).toContain('start')
      expect(fix.command).toContain('--clear')
    })

    it('should not auto-fix platform-specific API errors', () => {
      const fix = suggestAutoFix('platform-specific-api')

      expect(fix).toBeDefined()
      expect(fix.canAutoFix).toBe(false)
      expect(fix.codeExample).toBeTruthy()
    })

    it('should warn about Expo Go limitation for custom native modules', () => {
      const fix = suggestAutoFix('custom-native-module')

      expect(fix).toBeDefined()
      expect(fix.canAutoFix).toBe(false)
      expect(fix.warning).toBeTruthy()
      expect(fix.warning).toContain('Expo Go')
    })
  })

  describe('Error Detection Integration', () => {
    it('should provide complete error response for missing module', () => {
      const error = "Cannot find module 'expo-image-picker'"
      const result = detectMobileError(error)

      expect(result.detected).toBe(true)
      expect(result.errorType).toBe('missing-module')
      expect(result.moduleName).toBe('expo-image-picker')

      const guidance = getMobileErrorGuidance(result.errorType!, result.moduleName)
      expect(guidance.steps.length).toBeGreaterThan(0)

      const fix = suggestAutoFix(result.errorType!, result.moduleName)
      expect(fix.canAutoFix).toBe(true)
    })

    it('should handle error chain for complex errors', () => {
      const error = `
        Error: Unable to resolve module expo-av from /app/src/VideoPlayer.tsx
        Module expo-av was not found in the Haste module map
      `
      const result = detectMobileError(error)

      expect(result.detected).toBe(true)
      expect(result.errorType).toBe('missing-module')
      expect(result.moduleName).toBe('expo-av')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty error string', () => {
      const result = detectMobileError('')

      expect(result.detected).toBe(false)
    })

    it('should handle null/undefined gracefully', () => {
      const result1 = detectMobileError(null as unknown as string)
      const result2 = detectMobileError(undefined as unknown as string)

      expect(result1.detected).toBe(false)
      expect(result2.detected).toBe(false)
    })

    it('should extract module name from various error formats', () => {
      const errors = [
        "Cannot find module 'expo-haptics'",
        "Unable to resolve module expo-haptics",
        "Module expo-haptics was not found",
        "Error: require('expo-haptics') failed",
      ]

      errors.forEach(error => {
        const result = detectMobileError(error)
        expect(result.moduleName).toBe('expo-haptics')
      })
    })

    it('should prioritize most specific error type', () => {
      // A Metro error that also contains "module not found"
      const error = "Metro bundler error: Cannot find module 'react'"
      const result = detectMobileError(error)

      // Should be missing-module since that's more actionable
      expect(result.detected).toBe(true)
      expect(result.errorType).toBe('missing-module')
    })
  })
})
