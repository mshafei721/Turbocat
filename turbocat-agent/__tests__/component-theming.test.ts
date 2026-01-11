/**
 * Component Theming Tests
 *
 * These tests verify that components correctly use CSS variables for theming.
 * They validate that the design system colors are properly applied.
 */

import { describe, it, expect } from 'vitest'
import { buttonVariants } from '@/components/ui/button'
import { badgeVariants } from '@/components/ui/badge'

describe('Component Theming', () => {
  describe('Primary Button', () => {
    it('has orange background via CSS variable', () => {
      const primaryClasses = buttonVariants({ variant: 'default' })
      expect(primaryClasses).toContain('bg-primary')
      expect(primaryClasses).toContain('text-primary-foreground')
    })

    it('has hover state that changes color', () => {
      const primaryClasses = buttonVariants({ variant: 'default' })
      expect(primaryClasses).toContain('hover:bg-primary/90')
    })
  })

  describe('Destructive Variant', () => {
    it('uses red styling', () => {
      const destructiveClasses = buttonVariants({ variant: 'destructive' })
      expect(destructiveClasses).toContain('bg-destructive')
      expect(destructiveClasses).toContain('hover:bg-destructive/90')
    })
  })

  describe('Secondary Button', () => {
    it('uses neutral/gray styling', () => {
      const secondaryClasses = buttonVariants({ variant: 'secondary' })
      // Secondary uses slate colors for neutral styling
      expect(secondaryClasses).toContain('bg-slate-800')
      expect(secondaryClasses).toContain('text-slate-100')
    })
  })

  describe('Badge Component', () => {
    it('uses CSS variables for theming', () => {
      const defaultBadgeClasses = badgeVariants({ variant: 'default' })
      expect(defaultBadgeClasses).toContain('bg-primary')
      expect(defaultBadgeClasses).toContain('text-primary-foreground')
    })
  })

  describe('All Button Variants', () => {
    it('use semantic color names without hardcoded hex values', () => {
      const variants = [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ] as const

      for (const variant of variants) {
        const classes = buttonVariants({ variant })
        // Check that no hardcoded hex colors are present
        expect(classes).not.toMatch(/#[0-9a-fA-F]{3,6}/)
        // Check that it uses semantic color names
        const usesSemanticColors =
          classes.includes('primary') ||
          classes.includes('secondary') ||
          classes.includes('destructive') ||
          classes.includes('accent') ||
          classes.includes('background') ||
          classes.includes('muted') ||
          classes.includes('input')
        expect(usesSemanticColors).toBe(true)
      }
    })
  })
})
