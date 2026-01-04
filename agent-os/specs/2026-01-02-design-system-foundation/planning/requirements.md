# Requirements Summary

## Feature: Design System Foundation

**Phase:** 2 (Design Excellence)
**Roadmap Item:** 8
**Effort Estimate:** M (1 week)

---

## Gathered Requirements

### Brand Direction
| Question | Answer |
|----------|--------|
| Primary colors | Orange + Blue |
| Style | Modern, young, vibrant |
| Inspiration | Vercel/Next.js style (clean, minimal, black/white with accent colors) |

### Typography
| Question | Answer |
|----------|--------|
| Font style | Modern Sans-Serif |
| Recommended fonts | Inter, Geist, or similar |
| Focus | Clean, readable, tech-forward |

### Dark Mode
| Question | Answer |
|----------|--------|
| Strategy | Dark-first |
| Default theme | Dark |
| Light theme | Available as option |
| Rationale | Common for developer/coding tools |

### Design Tokens
| Question | Answer |
|----------|--------|
| Scope | Comprehensive |
| Includes | Colors, typography, spacing, borders, shadows, animations, z-index, breakpoints |

### Documentation
| Question | Answer |
|----------|--------|
| Approach | Storybook |
| Type | Interactive component playground with documentation |

### Brand Assets
| Question | Answer |
|----------|--------|
| Logo | Available at `turbocat-logo.png` (project root) |
| Icons | Need to create/source |
| Other assets | Need to create |

---

## Color Palette Direction

Based on user preferences (Orange + Blue, Vercel-style, vibrant), here's the proposed palette:

### Primary Colors
```css
/* Orange - Primary Action/Brand */
--orange-50: #fff7ed
--orange-100: #ffedd5
--orange-200: #fed7aa
--orange-300: #fdba74
--orange-400: #fb923c
--orange-500: #f97316  /* Primary */
--orange-600: #ea580c
--orange-700: #c2410c
--orange-800: #9a3412
--orange-900: #7c2d12

/* Blue - Secondary/Links */
--blue-50: #eff6ff
--blue-100: #dbeafe
--blue-200: #bfdbfe
--blue-300: #93c5fd
--blue-400: #60a5fa
--blue-500: #3b82f6  /* Secondary */
--blue-600: #2563eb
--blue-700: #1d4ed8
--blue-800: #1e40af
--blue-900: #1e3a8a
```

### Neutral Colors (Vercel-style)
```css
/* Dark Mode Base */
--gray-50: #fafafa
--gray-100: #f5f5f5
--gray-200: #e5e5e5
--gray-300: #d4d4d4
--gray-400: #a3a3a3
--gray-500: #737373
--gray-600: #525252
--gray-700: #404040
--gray-800: #262626
--gray-900: #171717
--gray-950: #0a0a0a  /* Dark mode background */
```

### Semantic Colors
```css
/* Success */
--success: #22c55e

/* Warning */
--warning: #eab308

/* Error */
--error: #ef4444

/* Info */
--info: #3b82f6
```

---

## Typography Scale

### Font Family
```css
--font-sans: 'Inter', 'Geist Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'Fira Code', 'JetBrains Mono', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Design Tokens (Comprehensive)

### Spacing
```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

### Border Radius
```css
--radius-none: 0;
--radius-sm: 0.125rem;  /* 2px */
--radius-default: 0.25rem; /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

### Shadows (Dark mode optimized)
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-default: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Animations
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Z-Index
```css
--z-0: 0;
--z-10: 10;
--z-20: 20;
--z-30: 30;
--z-40: 40;
--z-50: 50;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 300;
--z-popover: 400;
--z-tooltip: 500;
```

### Breakpoints
```css
--screen-sm: 640px;
--screen-md: 768px;
--screen-lg: 1024px;
--screen-xl: 1280px;
--screen-2xl: 1536px;
```

---

## Implementation Approach

### 1. Tailwind Configuration
- Extend `tailwind.config.ts` with custom theme
- Add CSS custom properties for design tokens
- Configure dark mode as default

### 2. shadcn/ui Customization
- Update `components.json` with custom theme
- Modify base component styles
- Add custom variants for components

### 3. Storybook Setup
- Install and configure Storybook
- Create stories for design tokens (colors, typography, spacing)
- Document usage guidelines

### 4. Files to Create/Modify
```
turbocat-agent/
├── tailwind.config.ts       # Extend with custom theme
├── app/globals.css          # Add CSS custom properties
├── components.json          # shadcn/ui config
├── lib/
│   └── design-tokens.ts     # Token constants for JS
├── .storybook/
│   ├── main.ts              # Storybook config
│   └── preview.ts           # Storybook preview
└── stories/
    ├── tokens/
    │   ├── Colors.stories.tsx
    │   ├── Typography.stories.tsx
    │   └── Spacing.stories.tsx
    └── Introduction.stories.mdx
```

---

## Visual Assets

### Available
- [x] Logo: `turbocat-logo.png` (project root)

### To Create/Source
- [ ] Icon set (Lucide Icons recommended - already in shadcn/ui)
- [ ] Favicon variations (16x16, 32x32, 180x180)
- [ ] OG image for social sharing
- [ ] Loading spinner/animation

---

## Technical Context

- **Base Platform:** Already deployed at turbocat.vercel.app
- **Tech Stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Current State:** Default shadcn/ui theme (zinc color scheme)
- **Database:** Drizzle ORM with Neon PostgreSQL (no changes needed for design system)

---

## Success Criteria

1. [ ] Tailwind config extended with Turbocat color palette
2. [ ] Typography system implemented with Inter/Geist fonts
3. [ ] Dark mode as default, light mode toggle available
4. [ ] All design tokens documented as CSS custom properties
5. [ ] Storybook running with token documentation
6. [ ] Existing components updated to use new theme
7. [ ] Application maintains consistent styling

---

## Notes

- Use Vercel/Next.js documentation site as visual reference
- Orange for primary actions (CTAs, buttons)
- Blue for secondary elements (links, info)
- Keep dark mode as the primary experience
- Ensure sufficient color contrast for accessibility (WCAG AA)
