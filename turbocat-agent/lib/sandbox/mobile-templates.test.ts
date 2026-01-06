/**
 * Tests for React Native / Expo Code Generation Templates
 * Phase 4: Mobile Development - Task 4.2
 */

import { describe, it, expect } from 'vitest'
import {
  basicScreenTemplate,
  functionalComponentTemplate,
  expoRouterLayoutTemplate,
  stackNavigatorTemplate,
  tabNavigatorTemplate,
  zustandStoreTemplate,
  asyncStorageTemplate,
  apiClientTemplate,
  getTemplate,
  getAvailableTemplates,
  templateMetadata,
} from './mobile-templates'

describe('Mobile Templates - Basic Screen', () => {
  it('should generate a basic screen with the provided name', () => {
    const code = basicScreenTemplate({ screenName: 'HomeScreen' })

    expect(code).toContain('export default function HomeScreen()')
    expect(code).toContain('SafeAreaView')
    expect(code).toContain('className=')
    expect(code).toContain('HomeScreen')
  })

  it('should use NativeWind className syntax', () => {
    const code = basicScreenTemplate({ screenName: 'ProfileScreen' })

    expect(code).toContain('className="flex-1')
    expect(code).toContain('className="text-')
  })

  it('should include SafeAreaView for iOS compatibility', () => {
    const code = basicScreenTemplate({ screenName: 'TestScreen' })

    expect(code).toContain('SafeAreaView')
    expect(code).toContain("from 'react-native-safe-area-context'")
  })

  it('should be valid TypeScript syntax', () => {
    const code = basicScreenTemplate({ screenName: 'ValidScreen' })

    // Should not have obvious syntax errors
    expect(code).toMatch(/^import/)
    expect(code).toContain('export default function')
    expect(code).toMatch(/}\s*$/)
  })
})

describe('Mobile Templates - Functional Component', () => {
  it('should generate a functional component with props interface', () => {
    const code = functionalComponentTemplate({ componentName: 'Button' })

    expect(code).toContain('interface ButtonProps')
    expect(code).toContain('export function Button')
  })

  it('should include useState hook example', () => {
    const code = functionalComponentTemplate({ componentName: 'Counter' })

    expect(code).toContain('useState')
    expect(code).toContain('const [count, setCount]')
  })

  it('should use NativeWind for styling', () => {
    const code = functionalComponentTemplate({ componentName: 'Card' })

    expect(code).toContain('className=')
  })

  it('should include TypeScript types for props', () => {
    const code = functionalComponentTemplate({ componentName: 'MyComponent' })

    expect(code).toContain('MyComponentProps')
    expect(code).toContain('title?: string')
    expect(code).toContain('onPress?: () => void')
  })
})

describe('Mobile Templates - Expo Router', () => {
  it('should generate Expo Router layout with Stack', () => {
    const code = expoRouterLayoutTemplate()

    expect(code).toContain('expo-router')
    expect(code).toContain('Stack')
    expect(code).toContain('Stack.Screen')
  })

  it('should include screen options configuration', () => {
    const code = expoRouterLayoutTemplate()

    expect(code).toContain('screenOptions')
    expect(code).toContain('headerStyle')
    expect(code).toContain('headerTintColor')
  })

  it('should define multiple screens', () => {
    const code = expoRouterLayoutTemplate()

    expect(code).toContain('name="index"')
    expect(code).toContain('name="details"')
  })
})

describe('Mobile Templates - Stack Navigator', () => {
  it('should generate React Navigation stack navigator', () => {
    const code = stackNavigatorTemplate()

    expect(code).toContain('@react-navigation/native-stack')
    expect(code).toContain('createNativeStackNavigator')
  })

  it('should include TypeScript param list', () => {
    const code = stackNavigatorTemplate()

    expect(code).toContain('RootStackParamList')
    expect(code).toContain('Home: undefined')
    expect(code).toContain('Details: { itemId: string }')
  })

  it('should wrap navigator in NavigationContainer', () => {
    const code = stackNavigatorTemplate()

    expect(code).toContain('NavigationContainer')
    expect(code).toContain('<NavigationContainer>')
  })
})

describe('Mobile Templates - Tab Navigator', () => {
  it('should generate bottom tab navigator', () => {
    const code = tabNavigatorTemplate()

    expect(code).toContain('@react-navigation/bottom-tabs')
    expect(code).toContain('createBottomTabNavigator')
  })

  it('should include tab icons with Ionicons', () => {
    const code = tabNavigatorTemplate()

    expect(code).toContain('Ionicons')
    expect(code).toContain('tabBarIcon')
    expect(code).toContain('home')
    expect(code).toContain('settings')
  })

  it('should include TypeScript param list', () => {
    const code = tabNavigatorTemplate()

    expect(code).toContain('TabParamList')
  })

  it('should configure active/inactive tint colors', () => {
    const code = tabNavigatorTemplate()

    expect(code).toContain('tabBarActiveTintColor')
    expect(code).toContain('tabBarInactiveTintColor')
  })
})

describe('Mobile Templates - Zustand Store', () => {
  it('should generate Zustand store with the provided name', () => {
    const code = zustandStoreTemplate({ storeName: 'TodoStore' })

    expect(code).toContain('TodoStoreState')
    expect(code).toContain('useTodoStore')
  })

  it('should include state interface', () => {
    const code = zustandStoreTemplate({ storeName: 'UserStore' })

    expect(code).toContain('interface UserStoreState')
  })

  it('should include example state and actions', () => {
    const code = zustandStoreTemplate({ storeName: 'CounterStore' })

    expect(code).toContain('count: number')
    expect(code).toContain('increment:')
    expect(code).toContain('decrement:')
  })

  it('should use Zustand create function', () => {
    const code = zustandStoreTemplate({ storeName: 'AppStore' })

    expect(code).toContain('create')
    expect(code).toContain('from \'zustand\'')
  })

  it('should include usage comment', () => {
    const code = zustandStoreTemplate({ storeName: 'Store' })

    expect(code).toContain('// Usage in a component:')
  })
})

describe('Mobile Templates - AsyncStorage', () => {
  it('should generate AsyncStorage utility functions', () => {
    const code = asyncStorageTemplate()

    expect(code).toContain('saveData')
    expect(code).toContain('loadData')
    expect(code).toContain('removeData')
    expect(code).toContain('clearAllData')
  })

  it('should include TypeScript generics', () => {
    const code = asyncStorageTemplate()

    expect(code).toContain('<T>')
    expect(code).toContain('Promise<T')
  })

  it('should include error handling', () => {
    const code = asyncStorageTemplate()

    expect(code).toContain('try {')
    expect(code).toContain('catch (error)')
  })

  it('should use JSON serialization', () => {
    const code = asyncStorageTemplate()

    expect(code).toContain('JSON.stringify')
    expect(code).toContain('JSON.parse')
  })

  it('should include usage examples', () => {
    const code = asyncStorageTemplate()

    expect(code).toContain('// Usage:')
  })
})

describe('Mobile Templates - API Client', () => {
  it('should generate API client with base URL', () => {
    const code = apiClientTemplate({ baseUrl: 'https://api.example.com' })

    expect(code).toContain('https://api.example.com')
    expect(code).toContain('API_BASE_URL')
  })

  it('should include authentication token support', () => {
    const code = apiClientTemplate({ baseUrl: 'https://api.example.com' })

    expect(code).toContain('setToken')
    expect(code).toContain('clearToken')
    expect(code).toContain('Authorization')
  })

  it('should include all HTTP methods', () => {
    const code = apiClientTemplate({ baseUrl: 'https://api.example.com' })

    expect(code).toContain('async get<T>')
    expect(code).toContain('async post<T>')
    expect(code).toContain('async put<T>')
    expect(code).toContain('async delete<T>')
  })

  it('should include error handling', () => {
    const code = apiClientTemplate({ baseUrl: 'https://api.example.com' })

    expect(code).toContain('ApiError')
    expect(code).toContain('if (!response.ok)')
    expect(code).toContain('throw')
  })

  it('should use TypeScript generics for type safety', () => {
    const code = apiClientTemplate({ baseUrl: 'https://api.example.com' })

    expect(code).toContain('<T>')
    expect(code).toContain('Promise<T>')
  })
})

describe('Template Registry', () => {
  it('should retrieve template by name', () => {
    const code = getTemplate('basic-screen', { name: 'TestScreen', screenName: 'TestScreen' })

    expect(code).toContain('TestScreen')
  })

  it('should throw error for unknown template', () => {
    expect(() => getTemplate('unknown-template', { name: '' })).toThrow('Template "unknown-template" not found')
  })

  it('should list all available templates', () => {
    const templates = getAvailableTemplates()

    expect(templates).toContain('basic-screen')
    expect(templates).toContain('functional-component')
    expect(templates).toContain('expo-router-layout')
    expect(templates).toContain('stack-navigator')
    expect(templates).toContain('tab-navigator')
    expect(templates).toContain('zustand-store')
    expect(templates).toContain('async-storage')
    expect(templates).toContain('api-client')
    expect(templates.length).toBe(8)
  })
})

describe('Template Metadata', () => {
  it('should provide metadata for all templates', () => {
    const templates = getAvailableTemplates()

    for (const template of templates) {
      expect(templateMetadata[template]).toBeDefined()
      expect(templateMetadata[template].name).toBeDefined()
      expect(templateMetadata[template].description).toBeDefined()
      expect(templateMetadata[template].category).toBeDefined()
      expect(templateMetadata[template].requiredPackages).toBeInstanceOf(Array)
      expect(templateMetadata[template].requiredContext).toBeInstanceOf(Array)
    }
  })

  it('should categorize templates correctly', () => {
    expect(templateMetadata['basic-screen'].category).toBe('screen')
    expect(templateMetadata['functional-component'].category).toBe('component')
    expect(templateMetadata['expo-router-layout'].category).toBe('navigation')
    expect(templateMetadata['stack-navigator'].category).toBe('navigation')
    expect(templateMetadata['tab-navigator'].category).toBe('navigation')
    expect(templateMetadata['zustand-store'].category).toBe('state')
    expect(templateMetadata['async-storage'].category).toBe('storage')
    expect(templateMetadata['api-client'].category).toBe('api')
  })

  it('should list required packages', () => {
    expect(templateMetadata['basic-screen'].requiredPackages).toContain('react-native-safe-area-context')
    expect(templateMetadata['zustand-store'].requiredPackages).toContain('zustand')
    expect(templateMetadata['async-storage'].requiredPackages).toContain('@react-native-async-storage/async-storage')
  })

  it('should list required context variables', () => {
    expect(templateMetadata['basic-screen'].requiredContext).toContain('screenName')
    expect(templateMetadata['functional-component'].requiredContext).toContain('componentName')
    expect(templateMetadata['zustand-store'].requiredContext).toContain('storeName')
    expect(templateMetadata['api-client'].requiredContext).toContain('baseUrl')
  })
})

describe('Template Code Quality', () => {
  it('should generate valid TypeScript for all templates', () => {
    const templates = getAvailableTemplates()

    for (const templateName of templates) {
      const context = {
        name: 'Test',
        screenName: 'TestScreen',
        componentName: 'TestComponent',
        storeName: 'TestStore',
        baseUrl: 'https://api.test.com',
      }

      const code = getTemplate(templateName, context)

      // Basic syntax checks
      expect(code).toBeTruthy()
      expect(code.length).toBeGreaterThan(0)
      // Should have proper imports
      expect(code).toMatch(/^import|const/)
    }
  })

  it('should include proper exports in all templates', () => {
    const templates = getAvailableTemplates()

    for (const templateName of templates) {
      const context = {
        name: 'Test',
        screenName: 'TestScreen',
        componentName: 'TestComponent',
        storeName: 'TestStore',
        baseUrl: 'https://api.test.com',
      }

      const code = getTemplate(templateName, context)

      // Should have export statement
      expect(code).toMatch(/export/)
    }
  })
})

describe('Template Best Practices', () => {
  it('should follow Expo best practices for screens', () => {
    const code = basicScreenTemplate({ screenName: 'MyScreen' })

    // Should use SafeAreaView
    expect(code).toContain('SafeAreaView')
    // Should use flex layout
    expect(code).toContain('flex-')
  })

  it('should follow TypeScript best practices', () => {
    const code = functionalComponentTemplate({ componentName: 'MyComponent' })

    // Should define props interface
    expect(code).toContain('interface')
    // Should type function parameters
    expect(code).toContain('Props')
  })

  it('should include NativeWind for all UI templates', () => {
    const uiTemplates = ['basic-screen', 'functional-component']

    for (const templateName of uiTemplates) {
      const code = getTemplate(templateName, {
        name: 'Test',
        screenName: 'TestScreen',
        componentName: 'TestComponent',
      })

      expect(code).toContain('className=')
    }
  })
})
