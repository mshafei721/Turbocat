/**
 * Design Tokens Tests
 *
 * These tests verify that the design tokens module exports the correct values.
 * The design tokens serve as the single source of truth for the Turbocat design system.
 */

import { describe, it, expect } from 'vitest'
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

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('has orange 500 equal to #f97316', () => {
      expect(colors.orange[500]).toBe('#f97316')
    })

    it('has blue 500 equal to #3b82f6', () => {
      expect(colors.blue[500]).toBe('#3b82f6')
    })
  })

  describe('Typography', () => {
    it('has font-family sans defined with expected fonts', () => {
      const fontFamily = typography.fontFamily.sans
      expect(typeof fontFamily).toBe('string')
      expect(fontFamily.length).toBeGreaterThan(0)
      expect(fontFamily).toContain('geist')
      expect(fontFamily).toContain('inter')
      expect(fontFamily).toContain('system-ui')
    })
  })

  describe('Spacing', () => {
    it('has all expected scale keys', () => {
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

      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key)
      }
      expect(actualKeys.length).toBe(expectedKeys.length)
    })
  })

  describe('Exports', () => {
    it('has all exports available', () => {
      expect(colors).toBeDefined()
      expect(typography).toBeDefined()
      expect(spacing).toBeDefined()
      expect(borderRadius).toBeDefined()
      expect(shadows).toBeDefined()
      expect(animations).toBeDefined()
      expect(zIndex).toBeDefined()
      expect(breakpoints).toBeDefined()
      expect(theme).toBeDefined()
    })
  })

  describe('Theme Object', () => {
    it('combines all tokens', () => {
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

      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key)
      }
    })
  })
})
