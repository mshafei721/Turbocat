/**
 * Turbocat Motion System
 *
 * Framer Motion presets with reduced motion support
 */

import type { Variants, Transition } from 'framer-motion'

// =============================================================================
// DURATION TOKENS
// =============================================================================

export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const

// =============================================================================
// EASING CURVES
// =============================================================================

export const easing = {
  // Standard Material Design curves
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],

  // Custom Turbocat curves
  smooth: [0.25, 0.1, 0.25, 1],
  snappy: [0.4, 0, 0.6, 1],

  // Spring presets (for Framer Motion)
  spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springGentle: { type: 'spring' as const, stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 600, damping: 15 },
} as const

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const transitions: Record<string, Transition> = {
  default: {
    duration: duration.normal,
    ease: easing.standard,
  },
  fast: {
    duration: duration.fast,
    ease: easing.standard,
  },
  slow: {
    duration: duration.slow,
    ease: easing.smooth,
  },
  spring: easing.spring,
  springGentle: easing.springGentle,
  springBouncy: easing.springBouncy,
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: easing.springBouncy,
  },
  exit: { opacity: 0, scale: 0.8 },
}

// Slide animations (for drawers, modals, etc.)
export const slideInFromRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
}

export const slideInFromLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
}

export const slideInFromTop: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
}

export const slideInFromBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
}

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: duration.fast,
    },
  },
}

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: easing.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
  },
}

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.decelerate,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: duration.fast,
      ease: easing.accelerate,
    },
  },
}

// =============================================================================
// HOVER ANIMATIONS
// =============================================================================

export const hoverScale = {
  scale: 1.02,
  transition: { duration: duration.fast },
}

export const hoverScaleLarge = {
  scale: 1.05,
  transition: easing.spring,
}

export const hoverLift = {
  y: -4,
  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
  transition: { duration: duration.fast },
}

export const tapScale = {
  scale: 0.98,
}

// =============================================================================
// SKELETON/LOADING ANIMATIONS
// =============================================================================

export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
}

export const pulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 1,
    },
  },
}

// =============================================================================
// REDUCED MOTION UTILITIES
// =============================================================================

/**
 * Returns animation props that respect reduced motion preference
 */
export function withReducedMotion<T extends object>(
  animationProps: T,
  fallback: Partial<T> = {}
): T {
  // This will be checked at runtime via CSS media query
  // Components should use useReducedMotion() hook from framer-motion
  return animationProps
}

/**
 * CSS for reduced motion support
 */
export const reducedMotionCSS = `
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
`

// =============================================================================
// EXPORT ALL
// =============================================================================

export const motionPresets = {
  // Durations
  duration,
  easing,
  transitions,

  // Variants
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleInBounce,
  slideInFromRight,
  slideInFromLeft,
  slideInFromTop,
  slideInFromBottom,

  // Stagger
  staggerContainer,
  staggerContainerFast,
  staggerItem,
  staggerItemScale,

  // Page
  pageTransition,

  // Hover/Tap
  hoverScale,
  hoverScaleLarge,
  hoverLift,
  tapScale,

  // Loading
  shimmer,
  pulse,
} as const

export default motionPresets
