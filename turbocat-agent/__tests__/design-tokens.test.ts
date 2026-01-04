/**
 * Design Tokens Tests
 *
 * These tests verify that the design tokens module exports the correct values.
 * The design tokens serve as the single source of truth for the Turbocat design system.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/__tests__/design-tokens.test.ts
 */

import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  zIndex,
  breakpoints,
  theme,
} from '@/lib/design-tokens'

/**
 * Test 1: colors.orange[500] equals '#f97316'
 *
 * The primary orange color (orange-500) should match the brand primary color.
 */
export const testOrange500Color = (): boolean => {
  const expected = '#f97316'
  const actual = colors.orange[500]
  const passed = actual === expected

  console.log(`Test 1 - Orange 500 color: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Expected: ${expected}`)
  console.log(`  Actual: ${actual}`)

  return passed
}

/**
 * Test 2: colors.blue[500] equals '#3b82f6'
 *
 * The secondary blue color (blue-500) should match the brand secondary color.
 */
export const testBlue500Color = (): boolean => {
  const expected = '#3b82f6'
  const actual = colors.blue[500]
  const passed = actual === expected

  console.log(`Test 2 - Blue 500 color: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Expected: ${expected}`)
  console.log(`  Actual: ${actual}`)

  return passed
}

/**
 * Test 3: typography.fontFamily.sans is defined
 *
 * The sans-serif font family should be defined and include the expected fonts.
 */
export const testTypographyFontFamilySans = (): boolean => {
  const fontFamily = typography.fontFamily.sans
  const isDefined = typeof fontFamily === 'string' && fontFamily.length > 0
  const hasGeist = fontFamily.includes('geist')
  const hasInter = fontFamily.includes('inter')
  const hasSystemUI = fontFamily.includes('system-ui')
  const passed = isDefined && hasGeist && hasInter && hasSystemUI

  console.log(`Test 3 - Typography font-family sans: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Is defined: ${isDefined}`)
  console.log(`  Has Geist: ${hasGeist}`)
  console.log(`  Has Inter: ${hasInter}`)
  console.log(`  Has system-ui: ${hasSystemUI}`)
  console.log(`  Value: ${fontFamily}`)

  return passed
}

/**
 * Test 4: spacing scale has expected keys
 *
 * The spacing scale should include all the expected spacing values from 0 to 64.
 */
export const testSpacingScaleKeys = (): boolean => {
  const expectedKeys = [
    '0',
    'px',
    '0.5',
    '1',
    '1.5',
    '2',
    '2.5',
    '3',
    '3.5',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '14',
    '16',
    '20',
    '24',
    '28',
    '32',
    '36',
    '40',
    '44',
    '48',
    '52',
    '56',
    '60',
    '64',
  ]
  const actualKeys = Object.keys(spacing)

  const hasAllExpectedKeys = expectedKeys.every((key) => actualKeys.includes(key))
  const passed = hasAllExpectedKeys && actualKeys.length === expectedKeys.length

  console.log(`Test 4 - Spacing scale keys: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Expected key count: ${expectedKeys.length}`)
  console.log(`  Actual key count: ${actualKeys.length}`)
  console.log(`  Has all expected keys: ${hasAllExpectedKeys}`)

  if (!passed) {
    const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key))
    const extraKeys = actualKeys.filter((key) => !expectedKeys.includes(key))
    if (missingKeys.length > 0) console.log(`  Missing keys: ${missingKeys.join(', ')}`)
    if (extraKeys.length > 0) console.log(`  Extra keys: ${extraKeys.join(', ')}`)
  }

  return passed
}

/**
 * Additional Test: Verify all exports are available
 */
export const testAllExportsAvailable = (): boolean => {
  const exports = { colors, typography, spacing, borderRadius, shadows, animations, zIndex, breakpoints, theme }

  const allDefined = Object.entries(exports).every(([name, value]) => {
    const isDefined = value !== undefined && value !== null
    console.log(`  ${name}: ${isDefined ? 'defined' : 'undefined'}`)
    return isDefined
  })

  console.log(`Test 5 - All exports available: ${allDefined ? 'PASS' : 'FAIL'}`)
  return allDefined
}

/**
 * Additional Test: Verify theme object combines all tokens
 */
export const testThemeObjectComplete = (): boolean => {
  const expectedKeys = [
    'colors',
    'typography',
    'spacing',
    'borderRadius',
    'shadows',
    'animations',
    'zIndex',
    'breakpoints',
  ]
  const actualKeys = Object.keys(theme)

  const hasAllKeys = expectedKeys.every((key) => actualKeys.includes(key))
  const passed = hasAllKeys

  console.log(`Test 6 - Theme object complete: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Expected keys: ${expectedKeys.join(', ')}`)
  console.log(`  Actual keys: ${actualKeys.join(', ')}`)

  return passed
}

/**
 * Run all design token tests
 */
export const runAllDesignTokenTests = (): void => {
  console.group('Design Tokens Tests')

  const tests = [
    testOrange500Color,
    testBlue500Color,
    testTypographyFontFamilySans,
    testSpacingScaleKeys,
    testAllExportsAvailable,
    testThemeObjectComplete,
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
  runAllDesignTokenTests()
}
