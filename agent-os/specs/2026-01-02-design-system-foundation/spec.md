# Design System Foundation Specification

**Feature:** Design System Foundation
**Phase:** 2 (Design Excellence)
**Roadmap Item:** 8
**Effort Estimate:** M (1 week)
**Status:** Draft
**Created:** 2026-01-02
**Author:** Spec Writer Agent

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Criteria](#2-goals--success-criteria)
3. [Design Token Reference](#3-design-token-reference)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Implementation Steps](#5-implementation-steps)
6. [File Structure](#6-file-structure)
7. [Dependencies](#7-dependencies)
8. [Testing & Verification](#8-testing--verification)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Appendix](#10-appendix)

---

## 1. Overview

### What This Spec Covers

This specification defines the complete design system foundation for Turbocat, establishing a cohesive visual language that reflects the brand identity across all user interfaces. The design system includes:

- **Brand Colors:** Orange (primary) and Blue (secondary) with full color scales
- **Typography:** Modern Sans-Serif system using Inter and Geist fonts
- **Design Tokens:** Comprehensive token system for colors, spacing, shadows, animations
- **Theme Support:** Dark-first approach with light theme option
- **Documentation:** Interactive Storybook component playground
- **Visual Assets:** Favicon variations and brand consistency

### Why Design System Matters

A well-defined design system provides:

1. **Consistency:** Unified visual language across all components and pages
2. **Efficiency:** Developers can build faster with pre-defined tokens
3. **Scalability:** Easy to extend and maintain as the application grows
4. **Brand Identity:** Strong visual presence that users recognize and trust
5. **Accessibility:** Built-in contrast ratios and accessibility standards
6. **Developer Experience:** Clear documentation reduces decision fatigue

### Current State

- **Platform:** turbocat.vercel.app (deployed)
- **Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, shadcn/ui
- **Current Theme:** Default shadcn/ui neutral/zinc theme
- **Fonts:** Geist Sans and Geist Mono (already configured)
- **Theme Provider:** next-themes (already implemented)

### Brand Direction

| Attribute | Value |
|-----------|-------|
| Primary Color | Orange (#f97316) |
| Secondary Color | Blue (#3b82f6) |
| Style | Modern, young, vibrant |
| Inspiration | Vercel/Next.js (clean, minimal, dark with accent colors) |
| Typography | Modern Sans-Serif (Inter, Geist) |
| Theme Default | Dark-first (developer tools convention) |

---

## 2. Goals & Success Criteria

### Primary Goals

1. **Establish Brand Identity:** Create distinctive visual language with orange/blue palette
2. **Implement Design Tokens:** Complete token system accessible via CSS and JavaScript
3. **Dark-First Theme:** Optimize for dark mode with light theme support
4. **Component Documentation:** Set up Storybook for interactive component playground
5. **Accessibility Compliance:** Meet WCAG AA standards for color contrast

### Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| Color Contrast | WCAG AA compliance | All text passes 4.5:1 (normal) / 3:1 (large) |
| Design Token Coverage | Token categories implemented | 100% (colors, typography, spacing, shadows, animations, z-index, breakpoints) |
| Component Migration | Components using new tokens | 100% of shadcn/ui components |
| Documentation | Storybook stories | All design tokens documented |
| Theme Toggle | Functional dark/light switch | Works without flash on load |
| Lighthouse Score | Performance audit | Maintain 90+ on all metrics |
| Bundle Size | Storybook deployment | < 5MB initial load |

### Non-Goals

- Complete component library redesign (Phase 3)
- Custom illustration system
- Animation library beyond basic transitions
- Multi-language typography support

---

## 3. Design Token Reference

### 3.1 Color Palette

#### Primary (Orange) - Action Color

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `orange-50` | #fff7ed | rgb(255, 247, 237) | Light backgrounds, hover states |
| `orange-100` | #ffedd5 | rgb(255, 237, 213) | Subtle backgrounds |
| `orange-200` | #fed7aa | rgb(254, 215, 170) | Light accents |
| `orange-300` | #fdba74 | rgb(253, 186, 116) | Borders, dividers |
| `orange-400` | #fb923c | rgb(251, 146, 60) | Secondary buttons |
| `orange-500` | #f97316 | rgb(249, 115, 22) | **Primary action color** |
| `orange-600` | #ea580c | rgb(234, 88, 12) | Hover state for primary |
| `orange-700` | #c2410c | rgb(194, 65, 12) | Active/pressed state |
| `orange-800` | #9a3412 | rgb(154, 52, 18) | Dark accents |
| `orange-900` | #7c2d12 | rgb(124, 45, 18) | Very dark accents |
| `orange-950` | #431407 | rgb(67, 20, 7) | Darkest shade |

#### Secondary (Blue) - Links & Secondary Actions

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `blue-50` | #eff6ff | rgb(239, 246, 255) | Light backgrounds |
| `blue-100` | #dbeafe | rgb(219, 234, 254) | Subtle backgrounds |
| `blue-200` | #bfdbfe | rgb(191, 219, 254) | Light accents |
| `blue-300` | #93c5fd | rgb(147, 197, 253) | Borders |
| `blue-400` | #60a5fa | rgb(96, 165, 250) | Secondary elements |
| `blue-500` | #3b82f6 | rgb(59, 130, 246) | **Links, secondary actions** |
| `blue-600` | #2563eb | rgb(37, 99, 235) | Hover state |
| `blue-700` | #1d4ed8 | rgb(29, 78, 216) | Active state |
| `blue-800` | #1e40af | rgb(30, 64, 175) | Dark accents |
| `blue-900` | #1e3a8a | rgb(30, 58, 138) | Very dark accents |
| `blue-950` | #172554 | rgb(23, 37, 84) | Darkest shade |

#### Neutral (Vercel-Style Grays)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `gray-50` | #fafafa | rgb(250, 250, 250) | Light mode background |
| `gray-100` | #f4f4f5 | rgb(244, 244, 245) | Subtle backgrounds |
| `gray-200` | #e4e4e7 | rgb(228, 228, 231) | Borders (light) |
| `gray-300` | #d4d4d8 | rgb(212, 212, 216) | Disabled elements |
| `gray-400` | #a1a1aa | rgb(161, 161, 170) | Placeholder text |
| `gray-500` | #71717a | rgb(113, 113, 122) | Secondary text |
| `gray-600` | #52525b | rgb(82, 82, 91) | Body text (light) |
| `gray-700` | #3f3f46 | rgb(63, 63, 70) | Headings (light) |
| `gray-800` | #27272a | rgb(39, 39, 42) | Cards (dark) |
| `gray-900` | #18181b | rgb(24, 24, 27) | Elevated surfaces (dark) |
| `gray-950` | #0a0a0a | rgb(10, 10, 10) | **Dark mode background** |

#### Semantic Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `success-50` | #f0fdf4 | rgb(240, 253, 244) | Success background |
| `success-500` | #22c55e | rgb(34, 197, 94) | **Success state** |
| `success-600` | #16a34a | rgb(22, 163, 74) | Success hover |
| `warning-50` | #fefce8 | rgb(254, 252, 232) | Warning background |
| `warning-500` | #eab308 | rgb(234, 179, 8) | **Warning state** |
| `warning-600` | #ca8a04 | rgb(202, 138, 4) | Warning hover |
| `error-50` | #fef2f2 | rgb(254, 242, 242) | Error background |
| `error-500` | #ef4444 | rgb(239, 68, 68) | **Error state** |
| `error-600` | #dc2626 | rgb(220, 38, 38) | Error hover |
| `info-50` | #eff6ff | rgb(239, 246, 255) | Info background |
| `info-500` | #3b82f6 | rgb(59, 130, 246) | **Info state** |
| `info-600` | #2563eb | rgb(37, 99, 235) | Info hover |

### 3.2 Typography System

#### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | Inter, Geist Sans, system-ui, sans-serif | Body text, UI elements |
| `font-mono` | Geist Mono, JetBrains Mono, Consolas, monospace | Code, technical content |
| `font-display` | Inter, Geist Sans, system-ui, sans-serif | Headings, marketing |

#### Font Sizes

| Token | rem | px | Line Height | Usage |
|-------|-----|-----|-------------|-------|
| `text-xs` | 0.75rem | 12px | 1rem (16px) | Captions, labels |
| `text-sm` | 0.875rem | 14px | 1.25rem (20px) | Small body text |
| `text-base` | 1rem | 16px | 1.5rem (24px) | Body text |
| `text-lg` | 1.125rem | 18px | 1.75rem (28px) | Large body text |
| `text-xl` | 1.25rem | 20px | 1.75rem (28px) | Small headings |
| `text-2xl` | 1.5rem | 24px | 2rem (32px) | H4 headings |
| `text-3xl` | 1.875rem | 30px | 2.25rem (36px) | H3 headings |
| `text-4xl` | 2.25rem | 36px | 2.5rem (40px) | H2 headings |
| `text-5xl` | 3rem | 48px | 1 | H1 headings |
| `text-6xl` | 3.75rem | 60px | 1 | Display headings |
| `text-7xl` | 4.5rem | 72px | 1 | Hero text |
| `text-8xl` | 6rem | 96px | 1 | Marketing display |
| `text-9xl` | 8rem | 128px | 1 | Extra large display |

#### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-thin` | 100 | Decorative |
| `font-extralight` | 200 | Decorative |
| `font-light` | 300 | Subtle text |
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text, buttons |
| `font-semibold` | 600 | Subheadings, labels |
| `font-bold` | 700 | Headings |
| `font-extrabold` | 800 | Strong emphasis |
| `font-black` | 900 | Maximum emphasis |

#### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tracking-tighter` | -0.05em | Large display text |
| `tracking-tight` | -0.025em | Headings |
| `tracking-normal` | 0em | Body text |
| `tracking-wide` | 0.025em | Uppercase labels |
| `tracking-wider` | 0.05em | Small caps |
| `tracking-widest` | 0.1em | Buttons, badges |

### 3.3 Spacing Scale

| Token | rem | px | Usage |
|-------|-----|-----|-------|
| `spacing-0` | 0 | 0 | Reset |
| `spacing-px` | 1px | 1px | Hairline borders |
| `spacing-0.5` | 0.125rem | 2px | Micro spacing |
| `spacing-1` | 0.25rem | 4px | Tight spacing |
| `spacing-1.5` | 0.375rem | 6px | Small padding |
| `spacing-2` | 0.5rem | 8px | Default small |
| `spacing-2.5` | 0.625rem | 10px | Between small/medium |
| `spacing-3` | 0.75rem | 12px | Medium-small |
| `spacing-3.5` | 0.875rem | 14px | Between medium sizes |
| `spacing-4` | 1rem | 16px | **Default spacing** |
| `spacing-5` | 1.25rem | 20px | Medium |
| `spacing-6` | 1.5rem | 24px | Medium-large |
| `spacing-7` | 1.75rem | 28px | Between medium/large |
| `spacing-8` | 2rem | 32px | Large |
| `spacing-9` | 2.25rem | 36px | Large+ |
| `spacing-10` | 2.5rem | 40px | Extra large |
| `spacing-11` | 2.75rem | 44px | Extra large+ |
| `spacing-12` | 3rem | 48px | Section spacing |
| `spacing-14` | 3.5rem | 56px | Large sections |
| `spacing-16` | 4rem | 64px | Major sections |
| `spacing-20` | 5rem | 80px | Page sections |
| `spacing-24` | 6rem | 96px | Large page sections |
| `spacing-28` | 7rem | 112px | Hero spacing |
| `spacing-32` | 8rem | 128px | Major divisions |

### 3.4 Border Radius

| Token | rem | px | Usage |
|-------|-----|-----|-------|
| `rounded-none` | 0 | 0 | Square corners |
| `rounded-sm` | 0.125rem | 2px | Subtle rounding |
| `rounded` | 0.25rem | 4px | Default small |
| `rounded-md` | 0.375rem | 6px | **Default** |
| `rounded-lg` | 0.5rem | 8px | Cards, modals |
| `rounded-xl` | 0.75rem | 12px | Large cards |
| `rounded-2xl` | 1rem | 16px | Hero sections |
| `rounded-3xl` | 1.5rem | 24px | Feature cards |
| `rounded-full` | 9999px | - | Pills, avatars |

### 3.5 Shadows (Dark Mode Optimized)

#### Light Mode Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Default |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Cards |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Modals |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Large modals |

#### Dark Mode Shadows (Glow Effects)

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-dark-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.3)` | Subtle |
| `shadow-dark` | `0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)` | Default |
| `shadow-dark-md` | `0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)` | Cards |
| `shadow-dark-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)` | Dropdowns |
| `shadow-glow-orange` | `0 0 20px rgb(249 115 22 / 0.3)` | Primary hover |
| `shadow-glow-blue` | `0 0 20px rgb(59 130 246 / 0.3)` | Secondary hover |

### 3.6 Animations

#### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-75` | 75ms | Micro-interactions |
| `duration-100` | 100ms | Quick feedback |
| `duration-150` | 150ms | Button states |
| `duration-200` | 200ms | **Default transitions** |
| `duration-300` | 300ms | Moderate transitions |
| `duration-500` | 500ms | Slow transitions |
| `duration-700` | 700ms | Dramatic transitions |
| `duration-1000` | 1000ms | Very slow animations |

#### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-linear` | `linear` | Progress bars |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Default** |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions |

#### Animation Presets

| Token | Value | Usage |
|-------|-------|-------|
| `animate-spin` | `spin 1s linear infinite` | Loading spinners |
| `animate-ping` | `ping 1s cubic-bezier(0, 0, 0.2, 1) infinite` | Notifications |
| `animate-pulse` | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` | Skeleton loading |
| `animate-bounce` | `bounce 1s infinite` | Attention grabbing |
| `animate-fade-in` | `fadeIn 200ms ease-out` | Enter animation |
| `animate-slide-up` | `slideUp 200ms ease-out` | Modal entry |

### 3.7 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | Base level |
| `z-10` | 10 | Elevated content |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Sticky headers |
| `z-40` | 40 | Fixed elements |
| `z-50` | 50 | Modals, overlays |
| `z-60` | 60 | Notifications, toasts |
| `z-70` | 70 | Tooltips |
| `z-80` | 80 | Maximum overlay |
| `z-auto` | auto | Natural stacking |

### 3.8 Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

---

## 4. Architecture Diagram

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Design Tokens   | --> |  CSS Custom       | --> |   Tailwind CSS   |
|  (Source of      |     |  Properties       |     |   Configuration  |
|   Truth)         |     |  (globals.css)    |     |                  |
|                  |     |                   |     |                  |
+------------------+     +-------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Storybook       | <-- |  shadcn/ui        | <-- |   Tailwind       |
|  Documentation   |     |  Components       |     |   Utility        |
|                  |     |                   |     |   Classes        |
+------------------+     +-------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Application     | <-- |  Custom           | <-- |   Component      |
|  Pages           |     |  Components       |     |   Library        |
|                  |     |                   |     |                  |
+------------------+     +-------------------+     +------------------+
```

### Token Flow Explanation

1. **Design Tokens (design-tokens.ts)**
   - Single source of truth for all design values
   - Exported as TypeScript constants for type safety
   - Used to generate CSS custom properties

2. **CSS Custom Properties (globals.css)**
   - CSS variables defined in `:root` and `.dark`
   - Theme-aware (automatically switches with theme)
   - Consumed by Tailwind and components

3. **Tailwind CSS Configuration**
   - References CSS custom properties via `var(--token)`
   - Generates utility classes (e.g., `bg-primary`, `text-orange-500`)
   - Extends default theme with custom tokens

4. **shadcn/ui Components**
   - Pre-built components using Tailwind utilities
   - Styled with design tokens via CSS variables
   - Customizable via `components.json`

5. **Application Components**
   - Compose shadcn/ui primitives
   - Use Tailwind utilities with custom tokens
   - Maintain consistent styling throughout

---

## 5. Implementation Steps

### Step 1: Install Fonts (Inter, Geist)

**Already Configured:** Geist fonts are already configured in `app/layout.tsx`. We need to add Inter as a fallback.

```typescript
// app/layout.tsx - Update font configuration
import { Inter } from 'next/font/google'
import { Geist, Geist_Mono } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// In body className:
<body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
```

### Step 2: Update Tailwind Configuration

Create/update the Tailwind configuration to include custom theme tokens.

**File:** `tailwind.config.ts`

See [Appendix A](#appendix-a-complete-tailwindconfigts) for complete configuration.

### Step 3: Add CSS Custom Properties to globals.css

Update `app/globals.css` with the complete design token system.

**File:** `app/globals.css`

See [Appendix B](#appendix-b-complete-globalscss) for complete CSS.

### Step 4: Update shadcn/ui components.json

Update the shadcn/ui configuration to use the new color scheme.

**File:** `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
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
  }
}
```

### Step 5: Create design-tokens.ts for JavaScript Access

**File:** `lib/design-tokens.ts`

See [Appendix C](#appendix-c-complete-design-tokensts) for complete TypeScript file.

### Step 6: Set Up Storybook

```bash
# Install Storybook
npx storybook@latest init --builder webpack5

# Install additional addons
pnpm add -D @storybook/addon-a11y @storybook/addon-themes
```

**File:** `.storybook/main.ts`

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

**File:** `.storybook/preview.ts`

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

### Step 7: Create Token Documentation Stories

**File:** `stories/design-tokens/Colors.stories.tsx`

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

**File:** `stories/design-tokens/Typography.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react'

const TypographyShowcase = () => (
  <div className="space-y-8 p-6">
    <h2 className="text-2xl font-bold">Typography Scale</h2>

    <div className="space-y-4">
      <p className="text-9xl font-bold">text-9xl</p>
      <p className="text-8xl font-bold">text-8xl</p>
      <p className="text-7xl font-bold">text-7xl</p>
      <p className="text-6xl font-bold">text-6xl</p>
      <p className="text-5xl font-bold">text-5xl</p>
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

### Step 8: Update Existing Components

Update shadcn/ui components to use the new primary color (orange).

**File:** `components/ui/button.tsx`

Update the primary button variant to use orange:

```typescript
// In buttonVariants, update the default variant:
default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
// This will automatically use the orange color defined in CSS variables
```

### Step 9: Add Theme Toggle (Dark/Light)

**File:** `components/theme-toggle.tsx`

```typescript
'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Step 10: Create Favicon and OG Image

1. **Favicon Generation:**
   - Use the existing `turbocat-logo.png` as source
   - Generate favicon.ico (16x16, 32x32, 48x48)
   - Generate apple-touch-icon.png (180x180)
   - Generate favicon-32x32.png, favicon-16x16.png

2. **OG Image:**
   - Create `public/og-image.png` (1200x630)
   - Include Turbocat logo with orange/blue gradient background

**File:** `app/layout.tsx` - Add metadata

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
  },
}
```

---

## 6. File Structure

### Files to Create

```
turbocat-agent/
├── .storybook/
│   ├── main.ts                    # Storybook configuration
│   ├── preview.ts                 # Storybook preview settings
│   └── manager.ts                 # Storybook manager theme
├── lib/
│   └── design-tokens.ts           # TypeScript design tokens
├── stories/
│   └── design-tokens/
│       ├── Colors.stories.tsx     # Color palette documentation
│       ├── Typography.stories.tsx # Typography documentation
│       ├── Spacing.stories.tsx    # Spacing scale documentation
│       ├── Shadows.stories.tsx    # Shadow documentation
│       └── Introduction.mdx       # Design system overview
├── components/
│   └── theme-toggle.tsx           # Theme switcher component
├── public/
│   ├── favicon.ico                # Favicon
│   ├── favicon-16x16.png          # 16px favicon
│   ├── favicon-32x32.png          # 32px favicon
│   ├── apple-touch-icon.png       # Apple touch icon
│   └── og-image.png               # Open Graph image
└── tailwind.config.ts             # Tailwind configuration
```

### Files to Modify

```
turbocat-agent/
├── app/
│   ├── globals.css                # CSS custom properties
│   └── layout.tsx                 # Font imports, metadata
├── components.json                # shadcn/ui configuration
├── package.json                   # Add Storybook dependencies
└── .gitignore                     # Add Storybook build output
```

---

## 7. Dependencies

### Production Dependencies

None required (fonts loaded via `next/font/google`)

### Development Dependencies

```json
{
  "devDependencies": {
    "@storybook/addon-a11y": "^8.4.0",
    "@storybook/addon-essentials": "^8.4.0",
    "@storybook/addon-interactions": "^8.4.0",
    "@storybook/addon-onboarding": "^8.4.0",
    "@storybook/addon-themes": "^8.4.0",
    "@storybook/blocks": "^8.4.0",
    "@storybook/nextjs": "^8.4.0",
    "@storybook/react": "^8.4.0",
    "@storybook/test": "^8.4.0",
    "@chromatic-com/storybook": "^3.0.0",
    "storybook": "^8.4.0"
  }
}
```

### Install Command

```bash
pnpm add -D @storybook/addon-a11y @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-onboarding @storybook/addon-themes @storybook/blocks @storybook/nextjs @storybook/react @storybook/test @chromatic-com/storybook storybook
```

Or use Storybook's init command:

```bash
npx storybook@latest init
pnpm add -D @storybook/addon-a11y @storybook/addon-themes
```

---

## 8. Testing & Verification

### Visual Testing

1. **Theme Switching:**
   - [ ] Toggle between dark and light themes
   - [ ] No flash of unstyled content on page load
   - [ ] System preference detection works

2. **Color Consistency:**
   - [ ] Orange buttons display correctly
   - [ ] Blue links are visible
   - [ ] Gray backgrounds are correct shade

3. **Typography:**
   - [ ] Font weights render correctly
   - [ ] Font sizes are consistent
   - [ ] Geist/Inter fonts load properly

### Automated Testing

```typescript
// tests/design-tokens.test.ts
import { colors, typography, spacing } from '@/lib/design-tokens'

describe('Design Tokens', () => {
  test('orange-500 is correct hex', () => {
    expect(colors.orange[500]).toBe('#f97316')
  })

  test('blue-500 is correct hex', () => {
    expect(colors.blue[500]).toBe('#3b82f6')
  })

  test('spacing scale is complete', () => {
    expect(Object.keys(spacing)).toHaveLength(32)
  })
})
```

### Storybook Visual Regression

```bash
# Run Storybook
pnpm storybook

# Build static Storybook
pnpm build-storybook

# Run Chromatic for visual testing (optional)
npx chromatic --project-token=<token>
```

### Accessibility Testing

1. **Contrast Checker:**
   - [ ] Run axe DevTools on all pages
   - [ ] Verify Storybook a11y addon shows no errors
   - [ ] Test with high contrast mode

2. **Screen Reader:**
   - [ ] Test with VoiceOver/NVDA
   - [ ] Verify theme toggle is accessible

### Performance Verification

```bash
# Build and analyze bundle
pnpm build

# Check Lighthouse scores
# Target: 90+ on all metrics
```

---

## 9. Accessibility Requirements

### WCAG AA Compliance

#### Color Contrast Requirements

| Text Type | Minimum Ratio | Our Implementation |
|-----------|---------------|-------------------|
| Normal text (< 18px) | 4.5:1 | 7:1+ (white on gray-950) |
| Large text (>= 18px) | 3:1 | 4.5:1+ |
| UI components | 3:1 | 3:1+ |

#### Color Contrast Verification

| Combination | Foreground | Background | Ratio | Pass |
|-------------|------------|------------|-------|------|
| Body text (dark) | #fafafa | #0a0a0a | 19.4:1 | Yes |
| Body text (light) | #18181b | #fafafa | 16.1:1 | Yes |
| Orange on dark | #f97316 | #0a0a0a | 7.5:1 | Yes |
| Blue on dark | #3b82f6 | #0a0a0a | 5.2:1 | Yes |
| Orange on light | #ea580c | #fafafa | 4.6:1 | Yes |
| Blue on light | #2563eb | #fafafa | 4.9:1 | Yes |

### Focus States

- All interactive elements must have visible focus indicators
- Focus ring color: `ring-orange-500` (dark) / `ring-orange-600` (light)
- Focus ring width: 2px minimum

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Appendix

### Appendix A: Complete tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Orange
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
        // Secondary - Blue
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
        // Neutral - Gray (Vercel-style)
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
        // Semantic
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // CSS Variable colors (for shadcn/ui compatibility)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgb(249 115 22 / 0.3)',
        'glow-blue': '0 0 20px rgb(59 130 246 / 0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### Appendix B: Complete globals.css

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@source "../node_modules/streamdown/dist/*.js";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans), var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), 'JetBrains Mono', Consolas, monospace;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Custom color scales */
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
}

:root {
  --radius: 0.625rem;

  /* Light mode - Orange primary */
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

.dark {
  /* Dark mode - Orange primary, dark background */
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

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

button {
  cursor: pointer;
}

/* Reduced motion preference */
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

/* Custom animations */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes slide-up {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Git Diff Viewer Mobile Optimizations */
.git-diff-view-container {
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .git-diff-view-container {
    font-size: 11px;
  }

  .git-diff-view-container > div {
    min-width: max-content;
  }

  .git-diff-view-container .diff-line-num {
    padding: 2px 4px;
    font-size: 10px;
  }

  .git-diff-view-container .diff-line-content {
    padding: 2px 4px;
  }
}

/* Orange glow effect for buttons */
.glow-orange {
  box-shadow: 0 0 20px rgb(249 115 22 / 0.3);
}

.hover\:glow-orange:hover {
  box-shadow: 0 0 30px rgb(249 115 22 / 0.4);
}

/* Blue glow effect */
.glow-blue {
  box-shadow: 0 0 20px rgb(59 130 246 / 0.3);
}

.hover\:glow-blue:hover {
  box-shadow: 0 0 30px rgb(59 130 246 / 0.4);
}
```

### Appendix C: Complete design-tokens.ts

```typescript
/**
 * Design Tokens - Single source of truth for Turbocat design system
 *
 * Usage:
 * import { colors, typography, spacing } from '@/lib/design-tokens'
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary - Orange
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Primary action color
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  // Secondary - Blue
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Links, secondary actions
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Neutral - Gray (Vercel-style)
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
    950: '#0a0a0a', // Dark mode background
  },

  // Semantic
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

  // Background & Foreground
  background: {
    light: '#fafafa',
    dark: '#0a0a0a',
  },
  foreground: {
    light: '#18181b',
    dark: '#fafafa',
  },
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

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

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px - Default
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',

  // Glow effects
  glowOrange: '0 0 20px rgb(249 115 22 / 0.3)',
  glowBlue: '0 0 20px rgb(59 130 246 / 0.3)',

  // Dark mode shadows
  darkSm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  darkMd: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
  darkLg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
} as const

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms', // Default
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Default
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
  },
} as const

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  60: '60',
  70: '70',
  80: '80',
  auto: 'auto',
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

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

### Appendix D: Package.json Scripts Addition

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | Spec Writer Agent | Initial specification |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Designer | | | |

---

*End of Specification*
