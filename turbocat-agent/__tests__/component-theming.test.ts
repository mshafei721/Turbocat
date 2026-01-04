/**
 * Component Theming Tests
 *
 * These tests verify that components correctly use CSS variables for theming.
 * They validate that the design system colors are properly applied.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/__tests__/component-theming.test.ts
 */

import { buttonVariants } from '@/components/ui/button'
import { badgeVariants } from '@/components/ui/badge'

/**
 * Test 1: Primary button has orange background via CSS variable
 *
 * The primary (default) button variant should use `bg-primary` which maps to orange.
 * This test verifies the class includes the primary background utility.
 */
export const testPrimaryButtonHasOrangeBackground = (): boolean => {
  const primaryClasses = buttonVariants({ variant: 'default' })
  const hasBgPrimary = primaryClasses.includes('bg-primary')
  const hasTextPrimaryForeground = primaryClasses.includes('text-primary-foreground')
  const passed = hasBgPrimary && hasTextPrimaryForeground

  console.log(`Test 1 - Primary button has orange background: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Has bg-primary: ${hasBgPrimary}`)
  console.log(`  Has text-primary-foreground: ${hasTextPrimaryForeground}`)
  console.log(`  Classes: ${primaryClasses}`)

  return passed
}

/**
 * Test 2: Button hover state changes color
 *
 * The primary button should have a hover state that uses `hover:bg-primary/90`.
 */
export const testButtonHoverStateChangesColor = (): boolean => {
  const primaryClasses = buttonVariants({ variant: 'default' })
  const hasHoverState = primaryClasses.includes('hover:bg-primary/90')
  const passed = hasHoverState

  console.log(`Test 2 - Button hover state changes color: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Has hover:bg-primary/90: ${hasHoverState}`)
  console.log(`  Classes: ${primaryClasses}`)

  return passed
}

/**
 * Test 3: Destructive variant uses red
 *
 * The destructive button variant should use `bg-destructive` which maps to red.
 */
export const testDestructiveVariantUsesRed = (): boolean => {
  const destructiveClasses = buttonVariants({ variant: 'destructive' })
  const hasBgDestructive = destructiveClasses.includes('bg-destructive')
  const hasHoverState = destructiveClasses.includes('hover:bg-destructive/90')
  const passed = hasBgDestructive && hasHoverState

  console.log(`Test 3 - Destructive variant uses red: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Has bg-destructive: ${hasBgDestructive}`)
  console.log(`  Has hover:bg-destructive/90: ${hasHoverState}`)
  console.log(`  Classes: ${destructiveClasses}`)

  return passed
}

/**
 * Test 4: Secondary button uses neutral/gray styling
 *
 * The secondary button variant should use `bg-secondary` for gray styling.
 */
export const testSecondaryButtonUsesNeutralStyling = (): boolean => {
  const secondaryClasses = buttonVariants({ variant: 'secondary' })
  const hasBgSecondary = secondaryClasses.includes('bg-secondary')
  const hasTextSecondaryForeground = secondaryClasses.includes('text-secondary-foreground')
  const passed = hasBgSecondary && hasTextSecondaryForeground

  console.log(`Test 4 - Secondary button uses neutral styling: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Has bg-secondary: ${hasBgSecondary}`)
  console.log(`  Has text-secondary-foreground: ${hasTextSecondaryForeground}`)
  console.log(`  Classes: ${secondaryClasses}`)

  return passed
}

/**
 * Test 5: Badge uses CSS variables for theming
 *
 * The badge component should also use CSS variables for consistent theming.
 */
export const testBadgeUsesCSSVariables = (): boolean => {
  const defaultBadgeClasses = badgeVariants({ variant: 'default' })
  const hasBgPrimary = defaultBadgeClasses.includes('bg-primary')
  const hasTextPrimaryForeground = defaultBadgeClasses.includes('text-primary-foreground')
  const passed = hasBgPrimary && hasTextPrimaryForeground

  console.log(`Test 5 - Badge uses CSS variables: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Has bg-primary: ${hasBgPrimary}`)
  console.log(`  Has text-primary-foreground: ${hasTextPrimaryForeground}`)
  console.log(`  Classes: ${defaultBadgeClasses}`)

  return passed
}

/**
 * Test 6: All button variants use semantic color names
 *
 * All button variants should use semantic color names (not hardcoded values).
 */
export const testAllButtonVariantsUseSemanticColors = (): boolean => {
  const variants: Array<'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'> = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
  ]

  const results: Record<string, boolean> = {}

  for (const variant of variants) {
    const classes = buttonVariants({ variant })
    // Check that no hardcoded hex colors are present
    const hasHardcodedHex = /#[0-9a-fA-F]{3,6}/.test(classes)
    // Check that it uses semantic color names
    const usesSemanticColors =
      classes.includes('primary') ||
      classes.includes('secondary') ||
      classes.includes('destructive') ||
      classes.includes('accent') ||
      classes.includes('background') ||
      classes.includes('muted') ||
      classes.includes('input')

    results[variant] = !hasHardcodedHex && usesSemanticColors
    console.log(`  Variant "${variant}": ${results[variant] ? 'PASS' : 'FAIL'}`)
    if (hasHardcodedHex) {
      console.log(`    WARNING: Contains hardcoded hex colors`)
    }
  }

  const passed = Object.values(results).every(Boolean)
  console.log(`Test 6 - All button variants use semantic colors: ${passed ? 'PASS' : 'FAIL'}`)

  return passed
}

/**
 * Run all component theming tests
 */
export const runAllComponentThemingTests = (): void => {
  console.group('Component Theming Tests')

  const tests = [
    testPrimaryButtonHasOrangeBackground,
    testButtonHoverStateChangesColor,
    testDestructiveVariantUsesRed,
    testSecondaryButtonUsesNeutralStyling,
    testBadgeUsesCSSVariables,
    testAllButtonVariantsUseSemanticColors,
  ]

  const results = tests.map((test) => test())
  const passed = results.filter(Boolean).length
  const total = results.length

  console.log('---')
  console.log(`Results: ${passed}/${total} tests passed`)

  console.groupEnd()
}

// For Node.js execution
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllComponentThemingTests()
}
