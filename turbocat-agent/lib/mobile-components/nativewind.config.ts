/**
 * NativeWind Configuration for React Native Mobile Components
 * Phase 4: Mobile Development - Task 5.1
 *
 * This module provides the NativeWind (Tailwind for React Native) configuration
 * that matches the web design tokens from globals.css for consistent cross-platform styling.
 */

/**
 * Color palette matching web design tokens
 * These are the same HSL values used in globals.css
 */
export const colorPalette = {
  // Primary colors - Orange (Turbocat brand)
  primary: {
    DEFAULT: 'hsl(24.6, 95%, 53.1%)', // #F97316
    foreground: 'hsl(0, 0%, 100%)', // White
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  // Secondary colors - Blue
  secondary: {
    DEFAULT: 'hsl(240, 4.8%, 95.9%)',
    foreground: 'hsl(240, 5.9%, 10%)',
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Semantic colors
  background: {
    light: 'hsl(0, 0%, 98%)', // #FAFAFA
    dark: 'hsl(0, 0%, 3.9%)', // #0A0A0A
  },
  foreground: {
    light: 'hsl(240, 10%, 3.9%)', // #0A0A0F
    dark: 'hsl(0, 0%, 98%)', // #FAFAFA
  },
  card: {
    light: 'hsl(0, 0%, 100%)', // White
    dark: 'hsl(0, 0%, 7.8%)', // #141414
    foreground: {
      light: 'hsl(240, 10%, 3.9%)',
      dark: 'hsl(0, 0%, 98%)',
    },
  },
  muted: {
    light: 'hsl(240, 4.8%, 95.9%)', // #F4F4F5
    dark: 'hsl(240, 3.7%, 15.9%)', // #27272A
    foreground: {
      light: 'hsl(240, 3.8%, 46.1%)', // #717179
      dark: 'hsl(240, 5%, 64.9%)', // #A1A1AA
    },
  },
  accent: {
    light: 'hsl(240, 4.8%, 95.9%)',
    dark: 'hsl(240, 3.7%, 15.9%)',
    foreground: {
      light: 'hsl(240, 5.9%, 10%)',
      dark: 'hsl(0, 0%, 98%)',
    },
  },
  destructive: {
    light: 'hsl(0, 84.2%, 60.2%)', // #EF4444
    dark: 'hsl(0, 62.8%, 30.6%)', // #7F1D1D
    foreground: 'hsl(0, 0%, 100%)',
  },
  border: {
    light: 'hsl(240, 5.9%, 90%)', // #E4E4E7
    dark: 'hsl(240, 3.7%, 15.9%)', // #27272A
  },
  input: {
    light: 'hsl(240, 5.9%, 90%)',
    dark: 'hsl(240, 3.7%, 15.9%)',
  },
  ring: {
    light: 'hsl(24.6, 95%, 53.1%)', // Orange
    dark: 'hsl(20.5, 90.2%, 48.2%)', // Darker orange
  },

  // Status colors
  success: '#22C55E', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red
  info: '#3B82F6', // Blue

  // Gray scale (for Tailwind gray utilities)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
}

/**
 * Typography scale matching web
 */
export const typography = {
  fontFamily: {
    sans: ['System', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}

/**
 * Spacing scale matching Tailwind defaults
 */
export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
}

/**
 * Border radius matching web (--radius: 0.625rem = 10px)
 */
export const borderRadius = {
  none: 0,
  sm: 6, // calc(var(--radius) - 4px)
  DEFAULT: 8, // calc(var(--radius) - 2px)
  md: 8,
  lg: 10, // var(--radius)
  xl: 14, // calc(var(--radius) + 4px)
  '2xl': 18,
  '3xl': 24,
  full: 9999,
}

/**
 * Shadow configurations for React Native
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 16,
  },
}

/**
 * NativeWind Tailwind Config for React Native projects
 * Use this in your mobile project's tailwind.config.js
 */
export const nativewindConfig = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          ...colorPalette.primary,
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          ...colorPalette.secondary,
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        success: colorPalette.success,
        warning: colorPalette.warning,
        error: colorPalette.error,
        info: colorPalette.info,
        gray: colorPalette.gray,
        orange: colorPalette.primary,
        blue: colorPalette.secondary,
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },
    },
  },
  plugins: [],
}

/**
 * Babel Config for NativeWind
 * Use this in your mobile project's babel.config.js
 */
export const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
`

/**
 * Generate the tailwind.config.js content for mobile projects
 */
export function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // CSS variable-based colors for theme support
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Direct color values
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Orange scale (brand)
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Blue scale
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      fontFamily: {
        sans: ['System', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
`
}

/**
 * Generate CSS variables for theme support in React Native
 */
export function generateThemeVariables(): string {
  return `// Light mode CSS variables
:root {
  --radius: 0.625rem;
  --background: 0 0% 98%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 24.6 95% 53.1%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 100%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 24.6 95% 53.1%;
}

// Dark mode CSS variables
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 7.8%;
  --card-foreground: 0 0% 98%;
  --primary: 20.5 90.2% 48.2%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 20.5 90.2% 48.2%;
}
`
}

export default {
  colorPalette,
  typography,
  spacing,
  borderRadius,
  shadows,
  nativewindConfig,
  babelConfig,
  generateTailwindConfig,
  generateThemeVariables,
}
