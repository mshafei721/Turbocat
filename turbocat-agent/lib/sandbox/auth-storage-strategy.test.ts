/**
 * Test Suite for Authentication & Storage Strategy Logic
 * Phase 4: Mobile Development - Task 4.5
 *
 * Tests decision logic for mobile auth and storage recommendations
 * based on project type (mobile-only vs cross-platform)
 */

import { describe, it, expect } from 'vitest'
import {
  detectProjectType,
  getAuthStrategy,
  getStorageStrategy,
  getStorageRecommendation,
  buildStrategyPrompt,
  type ProjectType,
  type AuthStrategy,
  type StorageStrategy,
  type StorageDataType,
  type StorageRecommendation,
} from './auth-storage-strategy'

describe('Authentication & Storage Strategy - Task 4.5', () => {
  describe('detectProjectType', () => {
    it('should detect mobile-only project', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: false,
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('mobile-only')
    })

    it('should detect cross-platform project with linked web', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: true,
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('cross-platform')
    })

    it('should detect cross-platform from monorepo context', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: false,
        isMonorepo: true,
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('cross-platform')
    })

    it('should detect cross-platform from user request', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: false,
        userRequest: 'create a cross-platform app for web and mobile',
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('cross-platform')
    })

    it('should default to mobile-only when platform is mobile', () => {
      const projectContext = {
        platform: 'mobile' as const,
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('mobile-only')
    })

    it('should detect web-only for web platform', () => {
      const projectContext = {
        platform: 'web' as const,
      }
      const result = detectProjectType(projectContext)

      expect(result).toBe('web-only')
    })
  })

  describe('getAuthStrategy', () => {
    describe('Mobile-Only Projects', () => {
      it('should recommend expo-auth-session for OAuth', () => {
        const strategy = getAuthStrategy('mobile-only')

        expect(strategy.oauth.package).toBe('expo-auth-session')
        expect(strategy.oauth.description).toContain('OAuth')
      })

      it('should recommend expo-secure-store for tokens', () => {
        const strategy = getAuthStrategy('mobile-only')

        expect(strategy.tokenStorage.package).toBe('expo-secure-store')
        expect(strategy.tokenStorage.secure).toBe(true)
      })

      it('should provide complete auth flow example', () => {
        const strategy = getAuthStrategy('mobile-only')

        expect(strategy.codeExample).toBeTruthy()
        expect(strategy.codeExample).toContain('expo-auth-session')
        expect(strategy.codeExample).toContain('expo-secure-store')
      })

      it('should include permissions configuration', () => {
        const strategy = getAuthStrategy('mobile-only')

        expect(strategy.appJsonConfig).toBeDefined()
        expect(strategy.appJsonConfig).toContain('scheme')
      })
    })

    describe('Cross-Platform Projects', () => {
      it('should recommend reusing web auth infrastructure', () => {
        const strategy = getAuthStrategy('cross-platform')

        expect(strategy.recommendation).toContain('web')
        expect(strategy.oauth.description).toContain('shared')
      })

      it('should recommend shared API clients', () => {
        const strategy = getAuthStrategy('cross-platform')

        expect(strategy.sharedApiClient).toBe(true)
      })

      it('should provide session token sharing strategy', () => {
        const strategy = getAuthStrategy('cross-platform')

        expect(strategy.sessionSharing).toBeDefined()
        expect(strategy.sessionSharing?.strategy).toBeTruthy()
      })

      it('should include mobile-specific token storage', () => {
        const strategy = getAuthStrategy('cross-platform')

        // Still use secure store on mobile
        expect(strategy.tokenStorage.package).toBe('expo-secure-store')
      })
    })

    describe('Web-Only Projects', () => {
      it('should recommend standard web auth', () => {
        const strategy = getAuthStrategy('web-only')

        expect(strategy.oauth.description).toContain('NextAuth')
      })

      it('should not include mobile-specific packages', () => {
        const strategy = getAuthStrategy('web-only')

        expect(strategy.tokenStorage.package).not.toContain('expo')
      })
    })
  })

  describe('getStorageStrategy', () => {
    describe('Mobile-Only Projects', () => {
      it('should recommend AsyncStorage for local data', () => {
        const strategy = getStorageStrategy('mobile-only')

        expect(strategy.localData.package).toBe('@react-native-async-storage/async-storage')
      })

      it('should recommend backend for shared data', () => {
        const strategy = getStorageStrategy('mobile-only')

        expect(strategy.sharedData.useBackend).toBe(true)
      })

      it('should provide offline sync strategy', () => {
        const strategy = getStorageStrategy('mobile-only')

        expect(strategy.offlineSync).toBeDefined()
        expect(strategy.offlineSync?.strategy).toBeTruthy()
      })
    })

    describe('Cross-Platform Projects', () => {
      it('should recommend backend API for all shared data', () => {
        const strategy = getStorageStrategy('cross-platform')

        expect(strategy.sharedData.useBackend).toBe(true)
        expect(strategy.recommendation).toContain('backend')
      })

      it('should still use AsyncStorage for local-only data', () => {
        const strategy = getStorageStrategy('cross-platform')

        expect(strategy.localData.package).toBe('@react-native-async-storage/async-storage')
      })

      it('should provide API client pattern', () => {
        const strategy = getStorageStrategy('cross-platform')

        expect(strategy.apiPattern).toBeDefined()
      })
    })
  })

  describe('getStorageRecommendation', () => {
    describe('Storage Decision Tree', () => {
      it('should recommend AsyncStorage for user preferences', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'user-preferences',
          isShared: false,
          needsOfflineAccess: true,
          dataSize: 'small',
        })

        expect(recommendation.storage).toBe('AsyncStorage')
        expect(recommendation.reason.toLowerCase()).toContain('local')
      })

      it('should recommend AsyncStorage for small local data', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'local-cache',
          isShared: false,
          needsOfflineAccess: true,
          dataSize: 'small',
        })

        expect(recommendation.storage).toBe('AsyncStorage')
      })

      it('should recommend Backend for shared data', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'user-data',
          isShared: true,
          needsOfflineAccess: false,
          dataSize: 'medium',
        })

        expect(recommendation.storage).toBe('Backend')
        expect(recommendation.reason.toLowerCase()).toContain('shared')
      })

      it('should recommend Backend for server-processed data', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'analytics',
          isShared: false,
          needsOfflineAccess: false,
          dataSize: 'large',
          requiresServerProcessing: true,
        })

        expect(recommendation.storage).toBe('Backend')
        expect(recommendation.reason).toContain('server')
      })

      it('should recommend AsyncStorage + Sync for offline-first shared data', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'user-data',
          isShared: true,
          needsOfflineAccess: true,
          dataSize: 'medium',
        })

        expect(recommendation.storage).toBe('AsyncStorage+Sync')
        expect(recommendation.syncStrategy).toBeDefined()
      })

      it('should recommend SecureStore for sensitive data', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'credentials',
          isShared: false,
          needsOfflineAccess: true,
          dataSize: 'small',
          isSensitive: true,
        })

        expect(recommendation.storage).toBe('SecureStore')
      })

      it('should recommend FileSystem for large files', () => {
        const recommendation = getStorageRecommendation({
          dataType: 'media',
          isShared: false,
          needsOfflineAccess: true,
          dataSize: 'large',
        })

        expect(recommendation.storage).toBe('FileSystem')
      })
    })
  })

  describe('buildStrategyPrompt', () => {
    it('should build AI prompt for mobile-only auth strategy', () => {
      const prompt = buildStrategyPrompt('mobile-only', 'auth')

      expect(prompt).toContain('expo-auth-session')
      expect(prompt).toContain('expo-secure-store')
      expect(prompt).toContain('mobile-only')
    })

    it('should build AI prompt for cross-platform auth strategy', () => {
      const prompt = buildStrategyPrompt('cross-platform', 'auth')

      expect(prompt).toContain('web')
      expect(prompt).toContain('shared')
    })

    it('should build AI prompt for storage strategy', () => {
      const prompt = buildStrategyPrompt('mobile-only', 'storage')

      expect(prompt).toContain('AsyncStorage')
      expect(prompt).toContain('backend')
    })

    it('should include code examples in prompt', () => {
      const prompt = buildStrategyPrompt('mobile-only', 'auth')

      expect(prompt).toContain('```')
      expect(prompt).toContain('import')
    })

    it('should explain recommendations clearly', () => {
      const prompt = buildStrategyPrompt('cross-platform', 'storage')

      expect(prompt).toContain('recommend')
      expect(prompt).toContain('because')
    })
  })

  describe('Integration Tests', () => {
    it('should provide complete mobile-only strategy', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: false,
      }

      const projectType = detectProjectType(projectContext)
      expect(projectType).toBe('mobile-only')

      const authStrategy = getAuthStrategy(projectType)
      expect(authStrategy.oauth.package).toBe('expo-auth-session')

      const storageStrategy = getStorageStrategy(projectType)
      expect(storageStrategy.localData.package).toContain('async-storage')

      const prompt = buildStrategyPrompt(projectType, 'auth')
      expect(prompt).toBeTruthy()
    })

    it('should provide complete cross-platform strategy', () => {
      const projectContext = {
        platform: 'mobile' as const,
        hasLinkedWebProject: true,
      }

      const projectType = detectProjectType(projectContext)
      expect(projectType).toBe('cross-platform')

      const authStrategy = getAuthStrategy(projectType)
      expect(authStrategy.sharedApiClient).toBe(true)

      const storageStrategy = getStorageStrategy(projectType)
      expect(storageStrategy.sharedData.useBackend).toBe(true)
    })

    it('should handle user request keyword detection', () => {
      const requests = [
        'build mobile and web app together',
        'create cross-platform application',
        'add mobile to my web project',
        'build for both iOS and web',
      ]

      requests.forEach(request => {
        const projectContext = {
          platform: 'mobile' as const,
          userRequest: request,
        }
        const projectType = detectProjectType(projectContext)
        expect(projectType).toBe('cross-platform')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined project context', () => {
      const result = detectProjectType(undefined as any)
      expect(result).toBe('mobile-only')
    })

    it('should handle empty project context', () => {
      const result = detectProjectType({} as any)
      expect(result).toBe('mobile-only')
    })

    it('should provide fallback storage recommendation', () => {
      const recommendation = getStorageRecommendation({
        dataType: 'unknown' as any,
        isShared: false,
        needsOfflineAccess: false,
        dataSize: 'medium',
      })

      expect(recommendation).toBeDefined()
      expect(recommendation.storage).toBeTruthy()
    })
  })
})
