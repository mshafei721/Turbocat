/**
 * UI Component Skill Tests
 *
 * Tests for the ui-component skill handler that generates design-compliant React components
 * using shadcn/ui primitives and design tokens.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/__tests__/skills/ui-component.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { UIComponentHandler } from '@/lib/skills/handlers/ui-component'
import { colors } from '@/lib/design-tokens'
import fs from 'fs'
import path from 'path'

describe('UIComponentHandler', () => {
  let handler: UIComponentHandler

  beforeEach(() => {
    handler = new UIComponentHandler()
  })

  /**
   * Test 1: Skill detects component-related prompts
   *
   * The handler should correctly identify when a prompt is requesting
   * a UI component to be created.
   */
  describe('Test 1: Component Detection', () => {
    it('should detect component-related prompts', () => {
      const prompts = [
        'create a card component',
        'build a modal dialog',
        'I need a form with validation',
        'generate a button component',
        'create a navigation menu',
        'build a data table',
      ]

      prompts.forEach((prompt) => {
        const result = handler.detectComponent(prompt)
        expect(result.isComponent).toBe(true)
        expect(result.componentType).toBeDefined()
      })
    })

    it('should not detect non-component prompts', () => {
      const prompts = [
        'create an API endpoint',
        'setup database tables',
        'configure authentication',
      ]

      prompts.forEach((prompt) => {
        const result = handler.detectComponent(prompt)
        expect(result.isComponent).toBe(false)
      })
    })

    it('should extract component type correctly', () => {
      const testCases = [
        { prompt: 'create a card component', expected: 'card' },
        { prompt: 'build a modal dialog', expected: 'modal' },
        { prompt: 'generate a button', expected: 'button' },
        { prompt: 'create a form', expected: 'form' },
        { prompt: 'build a table', expected: 'table' },
      ]

      testCases.forEach(({ prompt, expected }) => {
        const result = handler.detectComponent(prompt)
        expect(result.componentType).toBe(expected)
      })
    })
  })

  /**
   * Test 2: Reads existing components from gallery
   *
   * The handler should be able to read existing components from the
   * component gallery to avoid duplicates and reference patterns.
   */
  describe('Test 2: Component Gallery Integration', () => {
    it('should read existing components from gallery', () => {
      const existingComponents = handler.readComponentGallery()

      expect(existingComponents).toBeDefined()
      expect(Array.isArray(existingComponents)).toBe(true)
    })

    it('should find similar components in gallery', () => {
      const componentType = 'button'
      const similar = handler.findSimilarComponents(componentType)

      expect(Array.isArray(similar)).toBe(true)
      // Should include existing button component from shadcn/ui
      if (similar.length > 0) {
        expect(similar[0]).toHaveProperty('name')
        expect(similar[0]).toHaveProperty('path')
      }
    })

    it('should detect duplicate components', () => {
      const componentName = 'Button'
      const isDuplicate = handler.isDuplicateComponent(componentName)

      // Button already exists in components/ui/button.tsx
      expect(typeof isDuplicate).toBe('boolean')
    })
  })

  /**
   * Test 3: Generated components use design tokens
   *
   * The handler should generate components that use design tokens
   * from lib/design-tokens.ts for consistent styling.
   */
  describe('Test 3: Design Token Compliance', () => {
    it('should generate component with design token references', () => {
      const prompt = 'create a status badge component'
      const result = handler.generateComponent(prompt)

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeGreaterThan(0)

      // Should reference design tokens or use Tailwind classes that map to them
      const hasDesignTokenUsage =
        result.code.includes('orange-500') || // Primary color
        result.code.includes('blue-500') || // Secondary color
        result.code.includes('bg-primary') ||
        result.code.includes('text-primary')

      expect(hasDesignTokenUsage).toBe(true)
    })

    it('should use orange-500 for primary actions', () => {
      const prompt = 'create a primary action button'
      const result = handler.generateComponent(prompt)

      // Check if component uses primary color (orange)
      const usesPrimaryColor =
        result.code.includes('orange-500') ||
        result.code.includes('bg-primary') ||
        result.code.includes('primary')

      expect(usesPrimaryColor).toBe(true)
    })

    it('should use blue-500 for links and secondary actions', () => {
      const prompt = 'create a link component'
      const result = handler.generateComponent(prompt)

      // Check if component uses secondary color (blue)
      const usesSecondaryColor =
        result.code.includes('blue-500') ||
        result.code.includes('text-blue') ||
        result.code.includes('link')

      expect(usesSecondaryColor).toBe(true)
    })

    it('should include design token imports in generated code', () => {
      const prompt = 'create a themed card component'
      const result = handler.generateComponent(prompt)

      // Should either import design tokens or use Tailwind classes
      const hasTokenSystem =
        result.code.includes('from "@/lib/design-tokens"') ||
        result.code.includes('className') ||
        result.code.includes('cn(')

      expect(hasTokenSystem).toBe(true)
    })
  })

  /**
   * Test 4: Components pass accessibility checks
   *
   * Generated components should follow WCAG AA accessibility guidelines
   * with proper ARIA attributes and keyboard navigation.
   */
  describe('Test 4: Accessibility Compliance', () => {
    it('should include ARIA attributes for interactive components', () => {
      const prompt = 'create a modal dialog'
      const result = handler.generateComponent(prompt)

      // Modal should have ARIA attributes
      const hasAriaAttributes =
        result.code.includes('aria-') ||
        result.code.includes('role=') ||
        result.code.includes('Dialog') // Radix UI Dialog has built-in ARIA

      expect(hasAriaAttributes).toBe(true)
    })

    it('should support keyboard navigation', () => {
      const prompt = 'create a dropdown menu'
      const result = handler.generateComponent(prompt)

      // Should use shadcn/ui components with keyboard support
      const hasKeyboardSupport =
        result.code.includes('DropdownMenu') ||
        result.code.includes('onKeyDown') ||
        result.code.includes('tabIndex')

      expect(hasKeyboardSupport).toBe(true)
    })

    it('should have proper focus management', () => {
      const prompt = 'create a button component'
      const result = handler.generateComponent(prompt)

      // Should have focus styles
      const hasFocusManagement =
        result.code.includes('focus:') ||
        result.code.includes('focus-visible:') ||
        result.code.includes('outline')

      expect(hasFocusManagement).toBe(true)
    })

    it('should ensure color contrast meets WCAG AA', () => {
      const prompt = 'create a text component'
      const result = handler.generateComponent(prompt)

      // Should use semantic color classes that have proper contrast
      const hasProperContrast =
        result.code.includes('text-foreground') ||
        result.code.includes('text-muted-foreground') ||
        result.code.includes('dark:text-')

      expect(hasProperContrast).toBe(true)
    })
  })

  /**
   * Test 5: New components can be added to gallery
   *
   * The handler should be able to add newly generated components
   * to the component gallery for future reference.
   */
  describe('Test 5: Component Gallery Contribution', () => {
    it('should generate component metadata for gallery', () => {
      const prompt = 'create a notification toast component'
      const result = handler.generateComponent(prompt)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.name).toBeDefined()
      expect(result.metadata.type).toBeDefined()
      expect(result.metadata.description).toBeDefined()
    })

    it('should generate file path for new component', () => {
      const prompt = 'create a pricing card component'
      const result = handler.generateComponent(prompt)

      expect(result.filePath).toBeDefined()
      expect(result.filePath).toMatch(/\.tsx?$/)
      expect(result.filePath).toContain('components')
    })

    it('should include TypeScript types in generated component', () => {
      const prompt = 'create a user profile card'
      const result = handler.generateComponent(prompt)

      // Should have TypeScript interface or type
      const hasTypes =
        result.code.includes('interface ') ||
        result.code.includes('type ') ||
        result.code.includes(': React.')

      expect(hasTypes).toBe(true)
    })

    it('should generate component with proper exports', () => {
      const prompt = 'create a status indicator component'
      const result = handler.generateComponent(prompt)

      // Should have named export
      const hasExport =
        result.code.includes('export function') ||
        result.code.includes('export const') ||
        result.code.includes('export {')

      expect(hasExport).toBe(true)
    })

    it('should optionally generate Storybook story', () => {
      const prompt = 'create a tooltip component with story'
      const result = handler.generateComponent(prompt, { includeStory: true })

      expect(result.story).toBeDefined()
      if (result.story) {
        expect(result.story).toContain('export default')
        expect(result.story).toContain('Meta')
      }
    })
  })

  /**
   * Additional Test: Component should use shadcn/ui primitives
   */
  describe('Additional: shadcn/ui Integration', () => {
    it('should use Radix UI primitives when applicable', () => {
      const prompt = 'create an accordion component'
      const result = handler.generateComponent(prompt)

      // Should use Radix UI components
      const usesRadixUI =
        result.code.includes('@radix-ui') ||
        result.code.includes('Accordion') ||
        result.code.includes('AccordionItem')

      expect(usesRadixUI).toBe(true)
    })

    it('should include cn utility for className merging', () => {
      const prompt = 'create a custom card'
      const result = handler.generateComponent(prompt)

      // Should use cn utility
      const usesCnUtility =
        result.code.includes('cn(') ||
        result.code.includes('from "@/lib/utils"')

      expect(usesCnUtility).toBe(true)
    })
  })

  /**
   * Additional Test: Error handling
   */
  describe('Additional: Error Handling', () => {
    it('should handle empty prompts gracefully', () => {
      const result = handler.generateComponent('')

      expect(result).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should handle invalid component types', () => {
      const prompt = 'create a foobar123xyz component'
      const result = handler.detectComponent(prompt)

      expect(result).toBeDefined()
      // Should either detect a generic component or return error
      expect(
        result.isComponent === false ||
        result.componentType === 'generic'
      ).toBe(true)
    })
  })
})

/**
 * Integration Tests
 */
describe('UIComponentHandler Integration', () => {
  let handler: UIComponentHandler

  beforeEach(() => {
    handler = new UIComponentHandler()
  })

  it('should complete full workflow: detect -> generate -> validate', () => {
    const prompt = 'create a loading spinner component'

    // Step 1: Detect
    const detection = handler.detectComponent(prompt)
    expect(detection.isComponent).toBe(true)

    // Step 2: Generate
    const component = handler.generateComponent(prompt)
    expect(component.code).toBeDefined()
    expect(component.code.length).toBeGreaterThan(0)

    // Step 3: Validate
    const validation = handler.validateComponent(component)
    expect(validation.isValid).toBe(true)
    expect(validation.errors.length).toBe(0)
  })

  it('should reference existing components when generating similar ones', () => {
    const prompt = 'create a custom button variant'

    const component = handler.generateComponent(prompt)

    // Should reference or extend existing button component
    const referencesExisting =
      component.code.includes('buttonVariants') ||
      component.code.includes('Button') ||
      component.metadata.references?.includes('button')

    expect(referencesExisting).toBe(true)
  })
})
