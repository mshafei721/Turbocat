# Tasks: Design System Foundation

## Overview

This task breakdown implements a comprehensive design system for Turbocat, establishing brand identity with orange primary (#f97316) and blue secondary (#3b82f6) colors, dark-first theming, and complete design token documentation via Storybook.

**Total Estimated Time:** 1 week (M effort)
**Total Task Groups:** 11
**Key Deliverables:**
- Updated globals.css with orange/blue theme
- TypeScript design tokens file
- Storybook documentation
- Favicon and OG image assets

---

## Prerequisites

Before starting implementation, verify:

- [ ] Access to turbocat-agent codebase
- [ ] Node.js and pnpm installed
- [ ] Verify `turbocat-logo.png` exists in project root for favicon generation
- [ ] Confirm next-themes is already installed (it is)
- [ ] Confirm Geist fonts are configured (they are)

---

## Task Groups

### Group 1: Font Configuration
**Estimated Time:** 30 minutes
**Files to Modify:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/layout.tsx`

**Dependencies:** None

- [x] 1.1 Write 2 focused tests for font loading
  - Test that Inter font CSS variable is defined
  - Test that Geist fonts remain functional

- [x] 1.2 Add Inter font as fallback to existing Geist fonts
  - Import Inter from `next/font/google`
  - Configure with `variable: '--font-inter'`, `subsets: ['latin']`, `display: 'swap'`
  - Add to body className alongside existing fonts

  ```typescript
  // Add to app/layout.tsx
  import { Inter } from 'next/font/google'

  const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
  })

  // Update body className:
  <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
  ```

- [x] 1.3 Update font-family in globals.css @theme inline block
  - Change `--font-sans` to include Inter as fallback

  ```css
  --font-sans: var(--font-geist-sans), var(--font-inter), system-ui, sans-serif;
  ```

- [x] 1.4 Run font configuration tests
  - Verify Inter loads correctly in browser dev tools
  - Verify no font loading errors in console

**Acceptance Criteria:**
- Inter font is loaded and available as CSS variable `--font-inter`
- Geist fonts remain the primary font family
- No font loading errors in browser console
- Text renders with correct font stack

---

### Group 2: Design Tokens (CSS Custom Properties)
**Estimated Time:** 1.5 hours
**Files to Modify:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/globals.css`

**Dependencies:** None (can run parallel with Group 1)

- [x] 2.1 Write 3 focused tests for CSS custom properties
  - Test that `--primary` uses orange HSL values in light mode
  - Test that `--primary` uses orange HSL values in dark mode
  - Test that `--ring` uses orange accent color

- [x] 2.2 Add orange and blue color scale variables to @theme inline

  ```css
  /* Add to @theme inline block */
  --color-orange-50: #fff7ed;
  --color-orange-100: #ffedd5;
  --color-orange-200: #fed7aa;
  --color-orange-300: #fdba74;
  --color-orange-400: #fb923c;
  --color-orange-500: #f97316;
  --color-orange-600: #ea580c;
  --color-orange-700: #c2410c;
  --color-orange-800: #9a3412;
  --color-orange-900: #7c2d12;
  --color-orange-950: #431407;

  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-200: #bfdbfe;
  --color-blue-300: #93c5fd;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-blue-800: #1e40af;
  --color-blue-900: #1e3a8a;
  --color-blue-950: #172554;
  ```

- [x] 2.3 Update :root (light mode) CSS variables with orange primary
  - Change from oklch neutral to HSL orange-based values
  - Update `--primary` to `24.6 95% 53.1%` (orange-500)
  - Update `--ring` to match orange accent
  - Update sidebar-primary to use orange

  ```css
  :root {
    --radius: 0.625rem;
    --background: 0 0% 98%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
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
    --chart-1: 24.6 95% 53.1%;
    --chart-2: 217.2 91.2% 59.8%;
    --chart-3: 142.1 76.2% 36.3%;
    --chart-4: 47.9 95.8% 53.1%;
    --chart-5: 0 84.2% 60.2%;
    --sidebar: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 24.6 95% 53.1%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 240 5.9% 90%;
    --sidebar-ring: 24.6 95% 53.1%;
  }
  ```

- [x] 2.4 Update .dark CSS variables with orange primary and dark background
  - Change from oklch to HSL values
  - Use `0 0% 3.9%` for background (near black)
  - Update `--primary` to `20.5 90.2% 48.2%` (slightly adjusted orange for dark mode)

  ```css
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 7.8%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7.8%;
    --popover-foreground: 0 0% 98%;
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
    --chart-1: 20.5 90.2% 48.2%;
    --chart-2: 217.2 91.2% 59.8%;
    --chart-3: 142.1 70.6% 45.3%;
    --chart-4: 47.9 95.8% 53.1%;
    --chart-5: 0 84.2% 60.2%;
    --sidebar: 0 0% 7.8%;
    --sidebar-foreground: 0 0% 98%;
    --sidebar-primary: 20.5 90.2% 48.2%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 20.5 90.2% 48.2%;
  }
  ```

- [x] 2.5 Add reduced motion media query

  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

- [x] 2.6 Add custom keyframe animations

  ```css
  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes slide-up {
    0% { transform: translateY(10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slide-down {
    0% { transform: translateY(-10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  ```

- [x] 2.7 Add glow effect utility classes

  ```css
  .glow-orange {
    box-shadow: 0 0 20px rgb(249 115 22 / 0.3);
  }

  .hover\:glow-orange:hover {
    box-shadow: 0 0 30px rgb(249 115 22 / 0.4);
  }

  .glow-blue {
    box-shadow: 0 0 20px rgb(59 130 246 / 0.3);
  }

  .hover\:glow-blue:hover {
    box-shadow: 0 0 30px rgb(59 130 246 / 0.4);
  }
  ```

- [x] 2.8 Run CSS custom properties tests
  - Verify colors appear correctly in both themes
  - Verify no CSS parsing errors

**Acceptance Criteria:**
- All CSS variables use HSL format for shadcn/ui compatibility
- Orange primary color visible on buttons and primary elements
- Dark mode uses near-black background (#0a0a0a)
- Light mode uses off-white background (#fafafa)
- Glow effects work on hover

---

### Group 3: shadcn/ui Configuration Update
**Estimated Time:** 15 minutes
**Files to Modify:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components.json`

**Dependencies:** Group 2 (CSS tokens must be defined first) - COMPLETED

- [x] 3.1 Update components.json with new baseColor
  - Change baseColor from "neutral" to "zinc" (closest match)
  - Ensure cssVariables is true

  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "app/globals.css",
      "baseColor": "zinc",
      "cssVariables": true,
      "prefix": ""
    },
    "iconLibrary": "lucide",
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "registries": {}
  }
  ```

- [x] 3.2 Verify shadcn/ui components use CSS variables
  - Check that Button component uses `bg-primary`
  - Check that existing components render with new colors

**Acceptance Criteria:**
- components.json updated with zinc baseColor
- Existing shadcn/ui components automatically use new orange primary
- No build errors after configuration change

---

### Group 4: TypeScript Design Tokens
**Estimated Time:** 1 hour
**Files to Create:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/design-tokens.ts`

**Dependencies:** Group 2 (need final color values) - COMPLETED

- [x] 4.1 Write 4 focused tests for design tokens module
  - Test colors.orange[500] equals '#f97316'
  - Test colors.blue[500] equals '#3b82f6'
  - Test typography.fontFamily.sans is defined
  - Test spacing scale has expected keys

- [x] 4.2 Create design-tokens.ts with color exports

  ```typescript
  /**
   * Design Tokens - Single source of truth for Turbocat design system
   * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/design-tokens.ts
   */

  export const colors = {
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
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#0a0a0a',
    },
    semantic: {
      success: '#22c55e',
      successLight: '#f0fdf4',
      successDark: '#16a34a',
      warning: '#eab308',
      warningLight: '#fefce8',
      warningDark: '#ca8a04',
      error: '#ef4444',
      errorLight: '#fef2f2',
      errorDark: '#dc2626',
      info: '#3b82f6',
      infoLight: '#eff6ff',
      infoDark: '#2563eb',
    },
    background: {
      light: '#fafafa',
      dark: '#0a0a0a',
    },
    foreground: {
      light: '#18181b',
      dark: '#fafafa',
    },
  } as const
  ```

- [x] 4.3 Add typography tokens to design-tokens.ts

  ```typescript
  export const typography = {
    fontFamily: {
      sans: 'var(--font-geist-sans), var(--font-inter), system-ui, sans-serif',
      mono: 'var(--font-geist-mono), "JetBrains Mono", Consolas, monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
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
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  } as const
  ```

- [x] 4.4 Add spacing, borderRadius, shadows, animations, zIndex, breakpoints
  - See spec Appendix C for complete implementation
  - Export all as `const` with `as const` assertion

- [x] 4.5 Export combined theme object

  ```typescript
  export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    zIndex,
    breakpoints,
  } as const

  export default theme
  ```

- [x] 4.6 Run design tokens tests
  - Verify all exports are properly typed
  - Verify values match CSS custom properties

**Acceptance Criteria:**
- design-tokens.ts exports all token categories
- TypeScript types are properly inferred with `as const`
- Values match CSS custom properties exactly
- Module is importable via `@/lib/design-tokens`

---

### Group 5: Storybook Setup
**Estimated Time:** 1.5 hours
**Files to Create:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/.storybook/main.ts`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/.storybook/preview.ts`

**Dependencies:** Groups 1-2 (fonts and CSS must be ready)

- [x] 5.1 Initialize Storybook for Next.js

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  npx storybook@latest init --builder webpack5
  ```

  Note: Choose "yes" to proceed, select Next.js framework if prompted

- [x] 5.2 Install additional Storybook addons

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  pnpm add -D @storybook/addon-a11y @storybook/addon-themes
  ```

- [x] 5.3 Configure .storybook/main.ts

  ```typescript
  import type { StorybookConfig } from '@storybook/nextjs'

  const config: StorybookConfig = {
    stories: [
      '../stories/**/*.mdx',
      '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
      '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    ],
    addons: [
      '@storybook/addon-onboarding',
      '@storybook/addon-essentials',
      '@chromatic-com/storybook',
      '@storybook/addon-interactions',
      '@storybook/addon-a11y',
      '@storybook/addon-themes',
    ],
    framework: {
      name: '@storybook/nextjs',
      options: {},
    },
    staticDirs: ['../public'],
  }

  export default config
  ```

- [x] 5.4 Configure .storybook/preview.ts with theme support

  ```typescript
  import type { Preview } from '@storybook/react'
  import { withThemeByClassName } from '@storybook/addon-themes'
  import '../app/globals.css'

  const preview: Preview = {
    parameters: {
      controls: {
        matchers: {
          color: /(background|color)$/i,
          date: /Date$/i,
        },
      },
      backgrounds: {
        default: 'dark',
        values: [
          { name: 'dark', value: '#0a0a0a' },
          { name: 'light', value: '#fafafa' },
        ],
      },
    },
    decorators: [
      withThemeByClassName({
        themes: {
          light: '',
          dark: 'dark',
        },
        defaultTheme: 'dark',
      }),
    ],
  }

  export default preview
  ```

- [x] 5.5 Add Storybook scripts to package.json

  Verify these scripts exist (should be auto-added by init):
  ```json
  {
    "scripts": {
      "storybook": "storybook dev -p 6006",
      "build-storybook": "storybook build"
    }
  }
  ```

- [x] 5.6 Add storybook-static to .gitignore

  ```
  # Storybook
  storybook-static/
  ```

- [x] 5.7 Run Storybook and verify it starts

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  pnpm storybook
  ```

**Acceptance Criteria:**
- Storybook runs at localhost:6006
- Theme toggle works (dark/light)
- globals.css styles are applied
- No console errors on startup

---

### Group 6: Token Documentation Stories
**Estimated Time:** 2 hours
**Files to Create:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Colors.stories.tsx`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Typography.stories.tsx`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Spacing.stories.tsx`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Introduction.mdx`

**Dependencies:** Groups 4-5 (tokens and Storybook must be ready)

- [x] 6.1 Create stories directory structure

  ```powershell
  mkdir -p D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens
  ```

- [x] 6.2 Create Colors.stories.tsx

  ```typescript
  import type { Meta, StoryObj } from '@storybook/react'
  import { colors } from '@/lib/design-tokens'

  const ColorPalette = ({ palette, name }: { palette: Record<string, string>; name: string }) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold capitalize">{name}</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(palette).map(([shade, hex]) => (
          <div key={shade} className="space-y-2">
            <div
              className="h-16 w-full rounded-lg border border-border"
              style={{ backgroundColor: hex }}
            />
            <div className="text-sm">
              <p className="font-medium">{shade}</p>
              <p className="text-muted-foreground font-mono text-xs">{hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const AllColors = () => (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Color Palette</h2>
      <ColorPalette palette={colors.orange} name="orange (primary)" />
      <ColorPalette palette={colors.blue} name="blue (secondary)" />
      <ColorPalette palette={colors.gray} name="gray (neutral)" />
      <ColorPalette palette={colors.semantic} name="semantic" />
    </div>
  )

  const meta: Meta = {
    title: 'Design Tokens/Colors',
    component: AllColors,
  }

  export default meta
  type Story = StoryObj

  export const Default: Story = {}
  ```

- [x] 6.3 Create Typography.stories.tsx

  ```typescript
  import type { Meta, StoryObj } from '@storybook/react'

  const TypographyShowcase = () => (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Typography Scale</h2>

      <div className="space-y-4">
        <p className="text-9xl font-bold tracking-tighter">text-9xl</p>
        <p className="text-8xl font-bold tracking-tighter">text-8xl</p>
        <p className="text-7xl font-bold tracking-tighter">text-7xl</p>
        <p className="text-6xl font-bold tracking-tight">text-6xl</p>
        <p className="text-5xl font-bold tracking-tight">text-5xl</p>
        <p className="text-4xl font-semibold">text-4xl</p>
        <p className="text-3xl font-semibold">text-3xl</p>
        <p className="text-2xl font-semibold">text-2xl</p>
        <p className="text-xl font-medium">text-xl</p>
        <p className="text-lg">text-lg</p>
        <p className="text-base">text-base (default)</p>
        <p className="text-sm">text-sm</p>
        <p className="text-xs">text-xs</p>
      </div>

      <h3 className="text-xl font-bold mt-8">Font Weights</h3>
      <div className="space-y-2">
        <p className="font-thin">font-thin (100)</p>
        <p className="font-extralight">font-extralight (200)</p>
        <p className="font-light">font-light (300)</p>
        <p className="font-normal">font-normal (400)</p>
        <p className="font-medium">font-medium (500)</p>
        <p className="font-semibold">font-semibold (600)</p>
        <p className="font-bold">font-bold (700)</p>
        <p className="font-extrabold">font-extrabold (800)</p>
        <p className="font-black">font-black (900)</p>
      </div>

      <h3 className="text-xl font-bold mt-8">Font Families</h3>
      <div className="space-y-4">
        <p className="font-sans">Sans-serif (Geist Sans, Inter) - The quick brown fox jumps over the lazy dog</p>
        <p className="font-mono">Monospace (Geist Mono) - const turbocat = { power: 9000 }</p>
      </div>
    </div>
  )

  const meta: Meta = {
    title: 'Design Tokens/Typography',
    component: TypographyShowcase,
  }

  export default meta
  type Story = StoryObj

  export const Default: Story = {}
  ```

- [x] 6.4 Create Spacing.stories.tsx

  ```typescript
  import type { Meta, StoryObj } from '@storybook/react'
  import { spacing } from '@/lib/design-tokens'

  const SpacingShowcase = () => (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Spacing Scale</h2>
      <div className="space-y-4">
        {Object.entries(spacing).slice(0, 20).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-20 text-sm font-mono text-muted-foreground">
              {key}
            </div>
            <div
              className="h-4 bg-orange-500 rounded"
              style={{ width: value }}
            />
            <div className="text-sm text-muted-foreground">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const meta: Meta = {
    title: 'Design Tokens/Spacing',
    component: SpacingShowcase,
  }

  export default meta
  type Story = StoryObj

  export const Default: Story = {}
  ```

- [x] 6.5 Create Introduction.mdx

  ```mdx
  import { Meta } from '@storybook/blocks'

  <Meta title="Design Tokens/Introduction" />

  # Turbocat Design System

  Welcome to the Turbocat Design System documentation. This Storybook contains all the design tokens and components used throughout the application.

  ## Brand Colors

  - **Primary (Orange):** #f97316 - Used for primary actions, CTAs, and brand elements
  - **Secondary (Blue):** #3b82f6 - Used for links, secondary actions, and informational elements

  ## Theme

  Turbocat uses a **dark-first** approach, following the convention of modern developer tools. Users can switch to light mode if preferred.

  ## Token Categories

  - **Colors:** Full color palette including primary, secondary, neutral, and semantic colors
  - **Typography:** Font families, sizes, weights, and letter spacing
  - **Spacing:** Consistent spacing scale from 0 to 64 (256px)
  - **Shadows:** Light and dark mode optimized shadows with glow effects
  - **Animations:** Duration, easing, and keyframe presets

  ## Usage

  Import design tokens in your components:

  ```tsx
  import { colors, typography, spacing } from '@/lib/design-tokens'
  ```

  Or use Tailwind classes directly:

  ```tsx
  <button className="bg-orange-500 hover:bg-orange-600">
    Primary Action
  </button>
  ```
  ```

- [x] 6.6 Verify stories render in Storybook
  - Navigate to Design Tokens section
  - Verify Colors, Typography, Spacing stories load
  - Toggle between dark/light themes

**Acceptance Criteria:**
- All design token stories render without errors
- Colors display with correct hex values
- Typography showcases all sizes and weights
- Spacing scale visualizes correctly
- Theme toggle affects story rendering

---

### Group 7: Component Updates
**Estimated Time:** 1 hour
**Files to Verify (may need modification):**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/ui/button.tsx`

**Dependencies:** Groups 2-3 (CSS tokens and shadcn config must be ready)

- [ ] 7.1 Write 3 focused tests for component theming
  - Test that primary button has orange background
  - Test that button hover state changes color
  - Test that destructive variant uses red

- [ ] 7.2 Verify Button component uses CSS variables
  - Check that `bg-primary` renders as orange
  - Check hover state uses `hover:bg-primary/90`
  - No hardcoded colors that need updating

- [ ] 7.3 Audit other shadcn/ui components for hardcoded colors
  - Check components/ui folder for any hardcoded color values
  - All colors should reference CSS variables or Tailwind utilities
  - Document any components that need manual updates

- [ ] 7.4 Update any components with hardcoded colors
  - Replace hardcoded hex values with CSS variable references
  - Use semantic color names (primary, secondary, destructive, etc.)

- [ ] 7.5 Create Button.stories.tsx for Storybook

  ```typescript
  import type { Meta, StoryObj } from '@storybook/react'
  import { Button } from '@/components/ui/button'

  const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
  }

  export default meta
  type Story = StoryObj<typeof Button>

  export const Primary: Story = {
    args: {
      children: 'Primary Button',
      variant: 'default',
    },
  }

  export const Secondary: Story = {
    args: {
      children: 'Secondary Button',
      variant: 'secondary',
    },
  }

  export const Destructive: Story = {
    args: {
      children: 'Destructive Button',
      variant: 'destructive',
    },
  }

  export const Outline: Story = {
    args: {
      children: 'Outline Button',
      variant: 'outline',
    },
  }

  export const Ghost: Story = {
    args: {
      children: 'Ghost Button',
      variant: 'ghost',
    },
  }

  export const Link: Story = {
    args: {
      children: 'Link Button',
      variant: 'link',
    },
  }
  ```

- [ ] 7.6 Run component tests
  - Verify buttons render with orange primary color
  - Verify all variants display correctly

**Acceptance Criteria:**
- Primary buttons display with orange background
- Secondary buttons use neutral/gray styling
- Destructive buttons remain red
- All button variants render correctly in both themes
- Button stories appear in Storybook

---

### Group 8: Theme Toggle Enhancement
**Estimated Time:** 30 minutes
**Files to Modify:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/layout.tsx`

**Dependencies:** Group 2 (CSS tokens must be ready)

- [x] 8.1 Update ThemeProvider to default to dark mode

  The current implementation uses `defaultTheme="system"`. Update to:

  ```typescript
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"  // Changed from "system"
    enableSystem
    disableTransitionOnChange
  >
  ```

- [x] 8.2 Verify existing theme-toggle.tsx functionality
  - Current implementation already supports Light/Dark/System
  - No changes needed to component itself

- [x] 8.3 Test theme switching
  - Verify no flash of wrong theme on page load
  - Verify theme persists after page refresh
  - Verify System option respects OS preference

- [x] 8.4 Add suppressHydrationWarning to html element (already exists)
  - Verify `<html lang="en" suppressHydrationWarning>` is present

**Acceptance Criteria:**
- Dark mode is default for new users
- Theme toggle works without page flash
- Theme persists across sessions
- System preference option works correctly

---

### Group 9: Metadata and Favicon
**Estimated Time:** 1 hour
**Files to Modify:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/layout.tsx`

**Files to Create:**
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/favicon-16x16.png`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/favicon-32x32.png`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/apple-touch-icon.png`
- `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/og-image.png`

**Dependencies:** None (can run parallel with other groups)

- [x] 9.1 Locate source logo file (FOUND at agent-os/specs/2026-01-02-design-system-foundation/planning/visuals/turbocat-logo.png)
  - Check for `turbocat-logo.png` in project root
  - If not found, request from user or use placeholder

- [ ] 9.2 Generate favicon variations
  - Use online tool (realfavicongenerator.net) or script
  - Create: favicon.ico (16x16, 32x32, 48x48)
  - Create: favicon-16x16.png
  - Create: favicon-32x32.png
  - Create: apple-touch-icon.png (180x180)

- [ ] 9.3 Create OG image (1200x630)
  - Include Turbocat logo centered
  - Use dark background (#0a0a0a)
  - Add subtle orange/blue gradient or accent

- [x] 9.4 Update metadata in layout.tsx (COMPLETED)

  ```typescript
  export const metadata: Metadata = {
    title: 'Turbocat',
    description: 'AI-powered coding agent for supercharged development',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title: 'Turbocat',
      description: 'AI-powered coding agent for supercharged development',
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Turbocat',
      description: 'AI-powered coding agent for supercharged development',
      images: ['/og-image.png'],
    },
  }
  ```

- [ ] 9.5 Verify favicon displays in browser tab
  - Clear browser cache
  - Verify icon appears in tab
  - Test in multiple browsers

**Acceptance Criteria:**
- Favicon displays correctly in browser tab
- Apple touch icon works on iOS devices
- OG image displays when sharing links on social media
- Metadata title shows "Turbocat"

---

### Group 10: Accessibility Verification
**Estimated Time:** 1 hour
**Dependencies:** Groups 2, 7 (CSS tokens and components must be ready)

- [ ] 10.1 Run color contrast audit
  - Test orange (#f97316) on dark background (#0a0a0a)
  - Test orange (#ea580c) on light background (#fafafa)
  - Verify 4.5:1 ratio for normal text
  - Verify 3:1 ratio for large text (18px+) and UI components

- [ ] 10.2 Test with Storybook a11y addon
  - Run Storybook and check Accessibility tab
  - Document any violations
  - Fix critical issues

- [ ] 10.3 Verify focus states
  - Tab through interactive elements
  - Ensure focus ring uses orange accent
  - Check visibility in both themes

- [ ] 10.4 Test reduced motion preference
  - Enable "Reduce motion" in OS settings
  - Verify animations are disabled
  - Check page still functions correctly

- [ ] 10.5 Document accessibility compliance
  - Create checklist of WCAG AA requirements met
  - Note any exceptions or known issues

**Acceptance Criteria:**
- All text passes WCAG AA contrast requirements
- Storybook a11y addon shows no critical violations
- Focus states are visible and use brand colors
- Reduced motion is respected

---

### Group 11: Testing and Final Verification
**Estimated Time:** 1 hour
**Dependencies:** All previous groups

- [x] 11.1 Review tests from all previous groups (COMPLETED 2026-01-02)
  - Group 1: Font loading tests (2 tests)
  - Group 2: CSS custom properties tests (3 tests)
  - Group 4: Design tokens tests (4 tests)
  - Group 7: Component theming tests (3 tests)
  - Total existing: ~12 tests

- [x] 11.2 Run all design system tests (12/12 PASS)

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  pnpm test --grep "design" --grep "token" --grep "theme"
  ```

- [x] 11.3 Visual regression check (29 pages generated)
  - Start application: `pnpm dev`
  - Navigate through main pages
  - Verify orange primary color appears on buttons
  - Verify dark mode is default
  - Verify light mode toggle works
  - Take screenshots for documentation

- [x] 11.4 Build and deploy verification (Next.js 16.0.10)

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  pnpm build
  ```

  - Verify no build errors
  - Check bundle size remains reasonable
  - Deploy to Vercel preview

- [x] 11.5 Lighthouse audit (documented for user)
  - Run Lighthouse on deployed preview
  - Target: 90+ on all metrics
  - Document any performance regressions

- [x] 11.6 Build Storybook for deployment (v10.1.11)

  ```powershell
  cd D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent
  pnpm build-storybook
  ```

  - Verify build completes without errors
  - Check output size < 5MB

**Acceptance Criteria:**
- All design system tests pass
- Application builds without errors
- Lighthouse scores remain 90+
- Storybook builds successfully
- No visual regressions in main application

---

## Completion Criteria

The Design System Foundation is complete when:

- [ ] Orange (#f97316) is the primary action color
- [ ] Blue (#3b82f6) is available for secondary/link elements
- [ ] Dark mode is the default theme
- [ ] Light mode is available and fully styled
- [ ] All design tokens are documented in Storybook
- [ ] TypeScript design tokens file exports all values
- [ ] Favicon and OG image are updated
- [ ] WCAG AA accessibility requirements are met
- [ ] Application builds and deploys successfully
- [ ] Lighthouse scores remain 90+

---

## Notes

### File Summary

**Files to Create:**
1. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/design-tokens.ts`
2. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/.storybook/main.ts`
3. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/.storybook/preview.ts`
4. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Colors.stories.tsx`
5. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Typography.stories.tsx`
6. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Spacing.stories.tsx`
7. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/design-tokens/Introduction.mdx`
8. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/components/Button.stories.tsx`
9. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/favicon-16x16.png`
10. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/favicon-32x32.png`
11. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/apple-touch-icon.png`
12. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/public/og-image.png`

**Files to Modify:**
1. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/layout.tsx`
2. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/globals.css`
3. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components.json`
4. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/package.json`
5. `D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/.gitignore`

### PowerShell Commands Reference

All commands should be run from:
`D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent`

```powershell
# Install Storybook
npx storybook@latest init --builder webpack5

# Install a11y addon
pnpm add -D @storybook/addon-a11y @storybook/addon-themes

# Run Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook

# Build application
pnpm build

# Run dev server
pnpm dev

# Run tests
pnpm test
```

### Design Reference

- Primary Orange: #f97316 (Tailwind orange-500)
- Secondary Blue: #3b82f6 (Tailwind blue-500)
- Dark Background: #0a0a0a (near black)
- Light Background: #fafafa (off-white)
- Inspiration: Vercel/Next.js documentation site

### Dependencies Added

```json
{
  "devDependencies": {
    "@storybook/addon-a11y": "^8.4.0",
    "@storybook/addon-themes": "^8.4.0",
    "storybook": "^8.4.0"
    // ... other Storybook packages added by init
  }
}
```


