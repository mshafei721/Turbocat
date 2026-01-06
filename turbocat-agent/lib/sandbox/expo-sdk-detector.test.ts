/**
 * Test Suite for Expo SDK Module Detection & Suggestions
 * Phase 4: Mobile Development - Task 4.3
 *
 * Tests keyword detection, module suggestions, and permission configuration
 */

import { describe, it, expect } from 'vitest'
import {
  detectRequiredModules,
  getModuleSuggestion,
  type ExpoModuleSuggestion,
  type DetectionResult,
} from './expo-sdk-detector'

describe('Expo SDK Module Detection - Task 4.3', () => {
  describe('detectRequiredModules', () => {
    it('should detect camera feature requests', () => {
      const result = detectRequiredModules('Add a feature to take photos')

      expect(result.detected).toBe(true)
      expect(result.modules).toHaveLength(1)
      expect(result.modules[0].moduleName).toBe('expo-camera')
      expect(result.modules[0].keywords).toContain('camera')
    })

    it('should detect location feature requests', () => {
      const result = detectRequiredModules('Get user location and show on map')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-location')).toBe(true)
    })

    it('should detect notification feature requests', () => {
      const result = detectRequiredModules('Send push notifications to users')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-notifications')).toBe(true)
    })

    it('should detect file upload feature requests', () => {
      const result = detectRequiredModules('Let users upload files from their device')

      expect(result.detected).toBe(true)
      const moduleNames = result.modules.map(m => m.moduleName)
      expect(moduleNames).toContain('expo-file-system')
      expect(moduleNames).toContain('expo-document-picker')
    })

    it('should detect image picker feature requests', () => {
      const result = detectRequiredModules('Choose image from gallery')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-image-picker')).toBe(true)
    })

    it('should detect contacts feature requests', () => {
      const result = detectRequiredModules('Access user contacts')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-contacts')).toBe(true)
    })

    it('should detect multiple modules in one request', () => {
      const result = detectRequiredModules('Build an app with camera, location, and notifications')

      expect(result.detected).toBe(true)
      expect(result.modules.length).toBeGreaterThanOrEqual(3)
      const moduleNames = result.modules.map(m => m.moduleName)
      expect(moduleNames).toContain('expo-camera')
      expect(moduleNames).toContain('expo-location')
      expect(moduleNames).toContain('expo-notifications')
    })

    it('should not detect modules in non-native requests', () => {
      const result = detectRequiredModules('Create a login form with email and password')

      expect(result.detected).toBe(false)
      expect(result.modules).toHaveLength(0)
    })

    it('should be case-insensitive', () => {
      const result1 = detectRequiredModules('Use CAMERA feature')
      const result2 = detectRequiredModules('use camera feature')

      expect(result1.detected).toBe(true)
      expect(result2.detected).toBe(true)
      expect(result1.modules[0].moduleName).toBe(result2.modules[0].moduleName)
    })

    it('should detect media library access', () => {
      const result = detectRequiredModules('Access photos from media library')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-media-library')).toBe(true)
    })

    it('should detect barcode scanner', () => {
      const result = detectRequiredModules('Scan QR codes and barcodes')

      expect(result.detected).toBe(true)
      expect(result.modules.some(m => m.moduleName === 'expo-barcode-scanner')).toBe(true)
    })
  })

  describe('getModuleSuggestion', () => {
    it('should provide complete suggestion for expo-camera', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      expect(suggestion).toBeDefined()
      expect(suggestion.moduleName).toBe('expo-camera')
      expect(suggestion.npmPackage).toBe('expo-camera')
      expect(suggestion.description).toBeTruthy()
      expect(suggestion.permissions).toBeDefined()
      expect(suggestion.permissions.length).toBeGreaterThan(0)
      expect(suggestion.usage).toBeTruthy()
      expect(suggestion.expoGoCompatible).toBeDefined()
    })

    it('should provide installation command', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      expect(suggestion.installCommand).toBe('npx expo install expo-camera')
    })

    it('should include permission configuration', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      expect(suggestion.permissions).toContain('android.permission.CAMERA')
      expect(suggestion.appJsonConfig).toBeTruthy()
      expect(suggestion.appJsonConfig).toContain('ios')
      expect(suggestion.appJsonConfig).toContain('android')
    })

    it('should include usage example', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      expect(suggestion.usage).toContain('import')
      expect(suggestion.usage).toContain('Camera')
    })

    it('should indicate Expo Go compatibility', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      expect(suggestion.expoGoCompatible).toBe(true)
    })

    it('should warn about Expo Go limitations for custom native modules', () => {
      const suggestion = getModuleSuggestion('expo-camera')

      if (!suggestion.expoGoCompatible) {
        expect(suggestion.expoGoWarning).toBeTruthy()
        expect(suggestion.expoGoWarning).toContain('development build')
      }
    })

    it('should handle unknown modules gracefully', () => {
      const suggestion = getModuleSuggestion('unknown-module')

      expect(suggestion).toBeDefined()
      expect(suggestion.moduleName).toBe('unknown-module')
      expect(suggestion.expoGoCompatible).toBe(false)
    })
  })

  describe('Module Catalog Coverage', () => {
    it('should have suggestions for all common Expo SDK modules', () => {
      const commonModules = [
        'expo-camera',
        'expo-location',
        'expo-notifications',
        'expo-image-picker',
        'expo-file-system',
        'expo-contacts',
        'expo-media-library',
        'expo-barcode-scanner',
        'expo-auth-session',
        'expo-secure-store',
      ]

      commonModules.forEach(moduleName => {
        const suggestion = getModuleSuggestion(moduleName)
        expect(suggestion).toBeDefined()
        expect(suggestion.moduleName).toBe(moduleName)
      })
    })
  })

  describe('Permission Configuration', () => {
    it('should include both iOS and Android permissions', () => {
      const suggestion = getModuleSuggestion('expo-location')

      expect(suggestion.permissions.some(p => p.includes('android'))).toBe(true)
      expect(suggestion.appJsonConfig).toContain('ios')
      expect(suggestion.appJsonConfig).toContain('android')
    })

    it('should include permission rationale', () => {
      const suggestion = getModuleSuggestion('expo-location')

      expect(suggestion.permissionRationale).toBeTruthy()
      expect(suggestion.permissionRationale.length).toBeGreaterThan(10)
    })
  })

  describe('AI Integration', () => {
    it('should format suggestion for AI prompt', () => {
      const result = detectRequiredModules('Add camera feature')

      expect(result.aiSuggestion).toBeTruthy()
      expect(result.aiSuggestion).toContain('expo-camera')
      expect(result.aiSuggestion).toContain('install')
      expect(result.aiSuggestion).toContain('permission')
    })

    it('should provide complete integration instructions', () => {
      const result = detectRequiredModules('Use location services')

      expect(result.aiSuggestion).toContain('npx expo install')
      expect(result.aiSuggestion).toContain('app.json')
      expect(result.aiSuggestion).toContain('permissions')
    })

    it('should handle multiple modules in AI suggestion', () => {
      const result = detectRequiredModules('Camera and location features')

      expect(result.modules.length).toBeGreaterThanOrEqual(2)
      expect(result.aiSuggestion).toContain('expo-camera')
      expect(result.aiSuggestion).toContain('expo-location')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string input', () => {
      const result = detectRequiredModules('')

      expect(result.detected).toBe(false)
      expect(result.modules).toHaveLength(0)
    })

    it('should handle very long prompts', () => {
      const longPrompt = 'Build an app that ' + 'uses camera '.repeat(100)
      const result = detectRequiredModules(longPrompt)

      expect(result.detected).toBe(true)
      // Should not have duplicates
      const uniqueModules = new Set(result.modules.map(m => m.moduleName))
      expect(uniqueModules.size).toBe(result.modules.length)
    })

    it('should deduplicate detected modules', () => {
      const result = detectRequiredModules('camera camera photo photo take picture')

      expect(result.modules.length).toBe(1)
      expect(result.modules[0].moduleName).toBe('expo-camera')
    })
  })
})
