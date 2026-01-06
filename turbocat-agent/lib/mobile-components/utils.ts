/**
 * Utility functions for Mobile Components
 * Phase 4: Mobile Development - Task 5.1
 *
 * Cross-platform compatible utilities for NativeWind components.
 */

/**
 * Combines class names, filtering out falsy values
 * Similar to the web cn() utility but simpler for React Native
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Creates a variant-based className generator
 * Useful for component variants like size, color, etc.
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  config: T,
): (variants: { [K in keyof T]?: keyof T[K] }) => string {
  return (variants) => {
    const classes: string[] = []

    for (const [variantKey, variantValue] of Object.entries(variants)) {
      if (variantValue && config[variantKey] && config[variantKey][variantValue as string]) {
        classes.push(config[variantKey][variantValue as string])
      }
    }

    return classes.join(' ')
  }
}

/**
 * Type-safe platform check
 * Use this when you need platform-specific behavior
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  // This would use Platform.OS in a real React Native app
  // For now, we return 'web' as a placeholder
  return 'web'
}

/**
 * Accessibility helper to create accessible props
 */
export interface AccessibilityProps {
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?:
    | 'none'
    | 'button'
    | 'link'
    | 'search'
    | 'image'
    | 'keyboardkey'
    | 'text'
    | 'adjustable'
    | 'imagebutton'
    | 'header'
    | 'summary'
    | 'alert'
    | 'checkbox'
    | 'combobox'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'scrollbar'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'timer'
    | 'toolbar'
  accessibilityState?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    busy?: boolean
    expanded?: boolean
  }
}

export function createAccessibilityProps(options: {
  label: string
  hint?: string
  role?: AccessibilityProps['accessibilityRole']
  disabled?: boolean
  selected?: boolean
  checked?: boolean
}): AccessibilityProps {
  return {
    accessible: true,
    accessibilityLabel: options.label,
    accessibilityHint: options.hint,
    accessibilityRole: options.role,
    accessibilityState: {
      disabled: options.disabled,
      selected: options.selected,
      checked: options.checked,
    },
  }
}

/**
 * Color helpers for converting HSL to RGB for React Native
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * Convert HSL string to hex color for React Native
 */
export function hslToHex(hslString: string): string {
  // Parse HSL string like "hsl(24.6, 95%, 53.1%)"
  const match = hslString.match(/hsl\((\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/)
  if (!match) return '#000000'

  const h = parseFloat(match[1])
  const s = parseFloat(match[2])
  const l = parseFloat(match[3])

  const { r, g, b } = hslToRgb(h, s, l)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Debounce helper for touch events
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle helper for scroll events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number

  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan),
      )
    }
  }
}
