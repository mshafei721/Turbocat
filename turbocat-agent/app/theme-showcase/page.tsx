'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal,
  Sparkle,
  Lightning,
  Snowflake,
  PaintBrush,
  Sun,
  Robot,
  Rainbow,
  Play,
  Pause,
  Heart,
  Bell,
  Gear,
  User,
  MagnifyingGlass,
  PaperPlaneTilt,
  Check,
  X,
  Warning,
  Info,
  Code,
  ChatCircle,
  Folder,
  File,
  Plus,
  CaretDown,
  Moon,
  Star,
  Diamond,
  Planet,
  Waveform
} from '@phosphor-icons/react'

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

type ThemeId =
  | 'terminal-renaissance'
  | 'vercel-precision'
  | 'neon-cyberpunk'
  | 'frosted-glass'
  | 'neubrutalist'
  | 'soft-tech'
  | 'ai-native'
  | 'gradient-flow'
  | 'midnight-luxe'
  | 'aurora-borealis'
  | 'retro-wave'

interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  icon: React.ReactNode
  colors: {
    background: string
    backgroundSecondary: string
    surface: string
    surfaceHover: string
    border: string
    primary: string
    primaryHover: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    text: string
    textMuted: string
    success: string
    warning: string
    error: string
  }
  typography: {
    fontFamily: string
    fontFamilyMono: string
    headingWeight: string
    letterSpacing: string
  }
  effects: {
    borderRadius: string
    shadow: string
    shadowHover: string
    glowColor: string
    blur: string
    transition: string
  }
  specialStyles?: string
}

const themes: ThemeConfig[] = [
  // 1. Terminal Renaissance (Retro-Terminal)
  {
    id: 'terminal-renaissance',
    name: 'Terminal Renaissance',
    description: 'Nostalgic hacker aesthetic meets modern functionality. CRT phosphor glow with scanlines.',
    icon: <Terminal weight="bold" size={20} />,
    colors: {
      background: '#0A0A0A',
      backgroundSecondary: '#0F0F0F',
      surface: '#1A1A1A',
      surfaceHover: '#242424',
      border: '#33FF33',
      primary: '#33FF33',
      primaryHover: '#00FF00',
      primaryForeground: '#0A0A0A',
      secondary: '#FFB000',
      secondaryForeground: '#0A0A0A',
      accent: '#00FFFF',
      accentForeground: '#0A0A0A',
      text: '#E0E0E0',
      textMuted: '#808080',
      success: '#33FF33',
      warning: '#FFB000',
      error: '#FF3333',
    },
    typography: {
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      fontFamilyMono: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      headingWeight: '600',
      letterSpacing: '0.05em',
    },
    effects: {
      borderRadius: '2px',
      shadow: '0 0 10px rgba(51, 255, 51, 0.3)',
      shadowHover: '0 0 20px rgba(51, 255, 51, 0.5)',
      glowColor: 'rgba(51, 255, 51, 0.4)',
      blur: '0',
      transition: 'all 0.15s ease',
    },
    specialStyles: 'scanline-overlay',
  },

  // 2. Vercel Precision (Ultra-Minimal)
  {
    id: 'vercel-precision',
    name: 'Vercel Precision',
    description: 'Clean, sophisticated developer tooling with Swiss design influences.',
    icon: <Sparkle weight="bold" size={20} />,
    colors: {
      background: '#000000',
      backgroundSecondary: '#0A0A0A',
      surface: '#111111',
      surfaceHover: '#1A1A1A',
      border: '#333333',
      primary: '#FFFFFF',
      primaryHover: '#E5E5E5',
      primaryForeground: '#000000',
      secondary: '#333333',
      secondaryForeground: '#FFFFFF',
      accent: '#0070F3',
      accentForeground: '#FFFFFF',
      text: '#EDEDED',
      textMuted: '#888888',
      success: '#0070F3',
      warning: '#F5A623',
      error: '#E00',
    },
    typography: {
      fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
      fontFamilyMono: "'Geist Mono', 'JetBrains Mono', monospace",
      headingWeight: '500',
      letterSpacing: '-0.02em',
    },
    effects: {
      borderRadius: '6px',
      shadow: '0 1px 2px rgba(0,0,0,0.5)',
      shadowHover: '0 4px 8px rgba(0,0,0,0.5)',
      glowColor: 'transparent',
      blur: '0',
      transition: 'all 0.15s ease',
    },
  },

  // 3. Neon Cyberpunk (High-Energy Futurism)
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Blade Runner meets code editor - dystopian tech aesthetic with neon accents.',
    icon: <Lightning weight="bold" size={20} />,
    colors: {
      background: '#0D0D1A',
      backgroundSecondary: '#12122A',
      surface: '#1A1A2E',
      surfaceHover: '#252540',
      border: '#00F5FF',
      primary: '#00F5FF',
      primaryHover: '#00FFFF',
      primaryForeground: '#0D0D1A',
      secondary: '#FF00FF',
      secondaryForeground: '#0D0D1A',
      accent: '#FFFF00',
      accentForeground: '#0D0D1A',
      text: '#FFFFFF',
      textMuted: '#A0A0C0',
      success: '#00FF88',
      warning: '#FF6B00',
      error: '#FF0055',
    },
    typography: {
      fontFamily: "'Orbitron', 'Rajdhani', 'Space Grotesk', sans-serif",
      fontFamilyMono: "'Fira Code', 'JetBrains Mono', monospace",
      headingWeight: '700',
      letterSpacing: '0.1em',
    },
    effects: {
      borderRadius: '4px',
      shadow: '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2)',
      shadowHover: '0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(255, 0, 255, 0.4)',
      glowColor: 'rgba(0, 245, 255, 0.5)',
      blur: '0',
      transition: 'all 0.2s ease',
    },
    specialStyles: 'circuit-pattern',
  },

  // 4. Frosted Glass (Glassmorphism)
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    description: 'macOS Big Sur meets AI assistant - translucent layers and depth.',
    icon: <Snowflake weight="bold" size={20} />,
    colors: {
      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
      backgroundSecondary: 'linear-gradient(135deg, #3730A3 0%, #5B21B6 100%)',
      surface: 'rgba(255, 255, 255, 0.1)',
      surfaceHover: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.2)',
      primary: 'rgba(255, 255, 255, 0.95)',
      primaryHover: 'rgba(255, 255, 255, 1)',
      primaryForeground: '#4F46E5',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryForeground: '#FFFFFF',
      accent: '#67E8F9',
      accentForeground: '#0D0D1A',
      text: '#FFFFFF',
      textMuted: 'rgba(255, 255, 255, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', 'SF Pro Display', system-ui, sans-serif",
      fontFamilyMono: "'JetBrains Mono', 'SF Mono', monospace",
      headingWeight: '600',
      letterSpacing: '0',
    },
    effects: {
      borderRadius: '16px',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      shadowHover: '0 16px 48px rgba(0, 0, 0, 0.35)',
      glowColor: 'rgba(255, 255, 255, 0.2)',
      blur: '20px',
      transition: 'all 0.3s ease',
    },
    specialStyles: 'glass-blur',
  },

  // 5. Neubrutalist Rebellion (Bold & Raw)
  {
    id: 'neubrutalist',
    name: 'Neubrutalist Rebellion',
    description: 'Anti-minimalism with intentional visual weight - bold borders and raw character.',
    icon: <PaintBrush weight="bold" size={20} />,
    colors: {
      background: '#FFFEF0',
      backgroundSecondary: '#FFF9DB',
      surface: '#FFE135',
      surfaceHover: '#FFD700',
      border: '#000000',
      primary: '#000000',
      primaryHover: '#1A1A1A',
      primaryForeground: '#FFE135',
      secondary: '#0066FF',
      secondaryForeground: '#FFFFFF',
      accent: '#FF6B6B',
      accentForeground: '#000000',
      text: '#000000',
      textMuted: '#4A4A4A',
      success: '#00D09C',
      warning: '#FF9500',
      error: '#FF3B30',
    },
    typography: {
      fontFamily: "'Space Grotesk', 'Archivo Black', 'Work Sans', sans-serif",
      fontFamilyMono: "'IBM Plex Mono', monospace",
      headingWeight: '800',
      letterSpacing: '0',
    },
    effects: {
      borderRadius: '0',
      shadow: '4px 4px 0 #000000',
      shadowHover: '6px 6px 0 #000000',
      glowColor: 'transparent',
      blur: '0',
      transition: 'all 0.1s ease',
    },
    specialStyles: 'brutal-border',
  },

  // 6. Soft Tech (Modern Neumorphism)
  {
    id: 'soft-tech',
    name: 'Soft Tech',
    description: 'Gentle, tactile interfaces with physical depth - soft shadows and organic shapes.',
    icon: <Sun weight="bold" size={20} />,
    colors: {
      background: '#E0E5EC',
      backgroundSecondary: '#D5DAE1',
      surface: '#E0E5EC',
      surfaceHover: '#E8ECF3',
      border: 'transparent',
      primary: '#6366F1',
      primaryHover: '#5558E3',
      primaryForeground: '#FFFFFF',
      secondary: '#A3B1C6',
      secondaryForeground: '#374151',
      accent: '#8B5CF6',
      accentForeground: '#FFFFFF',
      text: '#374151',
      textMuted: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    typography: {
      fontFamily: "'Poppins', 'Nunito Sans', system-ui, sans-serif",
      fontFamilyMono: "'Source Code Pro', monospace",
      headingWeight: '600',
      letterSpacing: '0',
    },
    effects: {
      borderRadius: '20px',
      shadow: '8px 8px 16px #A3B1C6, -8px -8px 16px #FFFFFF',
      shadowHover: '12px 12px 24px #A3B1C6, -12px -12px 24px #FFFFFF',
      glowColor: 'transparent',
      blur: '0',
      transition: 'all 0.25s ease',
    },
    specialStyles: 'neumorphic',
  },

  // 7. AI Native (Claude/Anthropic Style)
  {
    id: 'ai-native',
    name: 'AI Native',
    description: 'Approachable intelligence with warm, confident design - conversation-first layout.',
    icon: <Robot weight="bold" size={20} />,
    colors: {
      background: '#FAF9F7',
      backgroundSecondary: '#F5F4F1',
      surface: '#FFFFFF',
      surfaceHover: '#FAF9F7',
      border: '#E7E5E4',
      primary: '#D97706',
      primaryHover: '#B45309',
      primaryForeground: '#FFFFFF',
      secondary: '#1E293B',
      secondaryForeground: '#FFFFFF',
      accent: '#65A30D',
      accentForeground: '#FFFFFF',
      text: '#1E293B',
      textMuted: '#64748B',
      success: '#65A30D',
      warning: '#D97706',
      error: '#DC2626',
    },
    typography: {
      fontFamily: "'Inter', 'Söhne', system-ui, sans-serif",
      fontFamilyMono: "'JetBrains Mono', monospace",
      headingWeight: '500',
      letterSpacing: '0',
    },
    effects: {
      borderRadius: '12px',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      shadowHover: '0 4px 12px rgba(0, 0, 0, 0.12)',
      glowColor: 'transparent',
      blur: '0',
      transition: 'all 0.2s ease',
    },
  },

  // 8. Gradient Flow (Modern Creative)
  {
    id: 'gradient-flow',
    name: 'Gradient Flow',
    description: 'Dynamic, expressive design for creative coding - rich gradients and flowing shapes.',
    icon: <Rainbow weight="bold" size={20} />,
    colors: {
      background: '#18181B',
      backgroundSecondary: '#1F1F23',
      surface: '#27272A',
      surfaceHover: '#3F3F46',
      border: '#3F3F46',
      primary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)',
      primaryHover: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #EA580C 100%)',
      primaryForeground: '#FFFFFF',
      secondary: '#3F3F46',
      secondaryForeground: '#FFFFFF',
      accent: '#22D3EE',
      accentForeground: '#18181B',
      text: '#FFFFFF',
      textMuted: '#A1A1AA',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    },
    typography: {
      fontFamily: "'Cal Sans', 'Satoshi', 'Plus Jakarta Sans', sans-serif",
      fontFamilyMono: "'Fira Code', 'JetBrains Mono', monospace",
      headingWeight: '700',
      letterSpacing: '-0.01em',
    },
    effects: {
      borderRadius: '14px',
      shadow: '0 4px 24px rgba(139, 92, 246, 0.25)',
      shadowHover: '0 8px 40px rgba(139, 92, 246, 0.4)',
      glowColor: 'rgba(139, 92, 246, 0.3)',
      blur: '0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    specialStyles: 'gradient-text',
  },

  // 9. Midnight Luxe (Premium Dark Luxury)
  {
    id: 'midnight-luxe',
    name: 'Midnight Luxe',
    description: 'Premium dark luxury inspired by Apple and high-end products - elegant gold accents.',
    icon: <Diamond weight="bold" size={20} />,
    colors: {
      background: '#09090B',
      backgroundSecondary: '#0C0C0F',
      surface: '#141418',
      surfaceHover: '#1C1C22',
      border: '#27272A',
      primary: '#D4AF37',
      primaryHover: '#E5C158',
      primaryForeground: '#09090B',
      secondary: '#27272A',
      secondaryForeground: '#FAFAFA',
      accent: '#C9A962',
      accentForeground: '#09090B',
      text: '#FAFAFA',
      textMuted: '#71717A',
      success: '#22C55E',
      warning: '#D4AF37',
      error: '#EF4444',
    },
    typography: {
      fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
      fontFamilyMono: "'SF Mono', 'JetBrains Mono', monospace",
      headingWeight: '500',
      letterSpacing: '0.01em',
    },
    effects: {
      borderRadius: '10px',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      shadowHover: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
      glowColor: 'rgba(212, 175, 55, 0.15)',
      blur: '0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    specialStyles: 'gold-accent',
  },

  // 10. Aurora Borealis (Nature/Cosmic)
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Nature-inspired cosmic design with northern lights colors - ethereal and calming.',
    icon: <Planet weight="bold" size={20} />,
    colors: {
      background: '#0A0E17',
      backgroundSecondary: '#0D1220',
      surface: '#131A2B',
      surfaceHover: '#1A2438',
      border: '#1E3A5F',
      primary: '#00D9A0',
      primaryHover: '#00F5B4',
      primaryForeground: '#0A0E17',
      secondary: '#7C3AED',
      secondaryForeground: '#FFFFFF',
      accent: '#06B6D4',
      accentForeground: '#0A0E17',
      text: '#E2E8F0',
      textMuted: '#64748B',
      success: '#00D9A0',
      warning: '#FBBF24',
      error: '#F43F5E',
    },
    typography: {
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      fontFamilyMono: "'Fira Code', 'JetBrains Mono', monospace",
      headingWeight: '600',
      letterSpacing: '0',
    },
    effects: {
      borderRadius: '12px',
      shadow: '0 4px 16px rgba(0, 217, 160, 0.1), 0 2px 8px rgba(124, 58, 237, 0.1)',
      shadowHover: '0 8px 32px rgba(0, 217, 160, 0.2), 0 4px 16px rgba(124, 58, 237, 0.15)',
      glowColor: 'rgba(0, 217, 160, 0.3)',
      blur: '0',
      transition: 'all 0.25s ease-out',
    },
    specialStyles: 'aurora-gradient',
  },

  // 11. Retro Wave (80s Synthwave/Vaporwave)
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    description: '80s synthwave aesthetic with sunset gradients - nostalgic neon vibes and grid patterns.',
    icon: <Waveform weight="bold" size={20} />,
    colors: {
      background: '#1A0A2E',
      backgroundSecondary: '#220F3D',
      surface: '#2D1451',
      surfaceHover: '#3D1D6B',
      border: '#FF00AA',
      primary: 'linear-gradient(135deg, #FF00AA 0%, #FF6B00 100%)',
      primaryHover: 'linear-gradient(135deg, #FF33BB 0%, #FF8533 100%)',
      primaryForeground: '#FFFFFF',
      secondary: '#00FFFF',
      secondaryForeground: '#1A0A2E',
      accent: '#FFFF00',
      accentForeground: '#1A0A2E',
      text: '#FFFFFF',
      textMuted: '#C084FC',
      success: '#00FF88',
      warning: '#FFFF00',
      error: '#FF0066',
    },
    typography: {
      fontFamily: "'Audiowide', 'Orbitron', 'Space Grotesk', sans-serif",
      fontFamilyMono: "'VT323', 'IBM Plex Mono', monospace",
      headingWeight: '700',
      letterSpacing: '0.08em',
    },
    effects: {
      borderRadius: '4px',
      shadow: '0 0 20px rgba(255, 0, 170, 0.4), 0 0 40px rgba(255, 107, 0, 0.2)',
      shadowHover: '0 0 30px rgba(255, 0, 170, 0.6), 0 0 60px rgba(255, 107, 0, 0.3)',
      glowColor: 'rgba(255, 0, 170, 0.5)',
      blur: '0',
      transition: 'all 0.2s ease',
    },
    specialStyles: 'synthwave-grid',
  },
]

// =============================================================================
// DEMO COMPONENTS
// =============================================================================

function DemoButton({
  theme,
  variant = 'primary',
  children
}: {
  theme: ThemeConfig
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  children: React.ReactNode
}) {
  const baseStyles: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.effects.borderRadius,
    transition: theme.effects.transition,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.primaryForeground,
      border: 'none',
      boxShadow: theme.effects.shadow,
    },
    secondary: {
      background: theme.colors.secondary,
      color: theme.colors.secondaryForeground,
      border: `2px solid ${theme.colors.border}`,
    },
    outline: {
      background: 'transparent',
      color: theme.colors.text,
      border: `2px solid ${theme.colors.border}`,
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.textMuted,
      border: 'none',
    },
  }

  return (
    <motion.button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      whileHover={{
        scale: theme.id === 'neubrutalist' ? 1.02 : 1.05,
        boxShadow: theme.effects.shadowHover,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}

function DemoCard({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  const isGlass = theme.id === 'frosted-glass'
  const isNeu = theme.id === 'soft-tech'

  return (
    <motion.div
      style={{
        background: theme.colors.surface,
        borderRadius: theme.effects.borderRadius,
        border: isNeu ? 'none' : `1px solid ${theme.colors.border}`,
        padding: '24px',
        boxShadow: theme.effects.shadow,
        backdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
        WebkitBackdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
        fontFamily: theme.typography.fontFamily,
      }}
      whileHover={{
        boxShadow: theme.effects.shadowHover,
        y: theme.id === 'neubrutalist' ? 0 : -4,
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

function DemoBadge({
  theme,
  variant = 'default',
  children
}: {
  theme: ThemeConfig
  variant?: 'default' | 'success' | 'warning' | 'error'
  children: React.ReactNode
}) {
  const colors: Record<string, string> = {
    default: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: theme.id === 'neubrutalist' ? '0' : '9999px',
        background: colors[variant],
        color: theme.id === 'neubrutalist' || theme.id === 'ai-native' || theme.id === 'soft-tech'
          ? '#FFFFFF'
          : theme.colors.primaryForeground,
        fontFamily: theme.typography.fontFamily,
        border: theme.id === 'neubrutalist' ? '2px solid #000' : 'none',
      }}
    >
      {children}
    </span>
  )
}

function DemoInput({ theme, placeholder }: { theme: ThemeConfig; placeholder: string }) {
  const isNeu = theme.id === 'soft-tech'
  const isGlass = theme.id === 'frosted-glass'

  return (
    <input
      type="text"
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
        background: isGlass ? 'rgba(255,255,255,0.1)' : isNeu ? theme.colors.background : theme.colors.surface,
        color: theme.colors.text,
        border: isNeu ? 'none' : `1px solid ${theme.colors.border}`,
        borderRadius: theme.effects.borderRadius,
        boxShadow: isNeu ? 'inset 4px 4px 8px #A3B1C6, inset -4px -4px 8px #FFFFFF' : 'none',
        outline: 'none',
        transition: theme.effects.transition,
      }}
    />
  )
}

function DemoAvatar({ theme }: { theme: ThemeConfig }) {
  return (
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: theme.id === 'neubrutalist' ? '0' : '50%',
        background: theme.colors.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: theme.id === 'neubrutalist' ? '3px solid #000' : 'none',
        boxShadow: theme.effects.shadow,
      }}
    >
      <User size={24} color={theme.colors.primaryForeground} weight="bold" />
    </div>
  )
}

function DemoProgress({ theme, value }: { theme: ThemeConfig; value: number }) {
  const isNeu = theme.id === 'soft-tech'

  return (
    <div
      style={{
        width: '100%',
        height: '8px',
        background: isNeu ? theme.colors.background : theme.colors.surface,
        borderRadius: theme.effects.borderRadius,
        overflow: 'hidden',
        boxShadow: isNeu ? 'inset 2px 2px 4px #A3B1C6, inset -2px -2px 4px #FFFFFF' : 'none',
        border: theme.id === 'neubrutalist' ? '2px solid #000' : 'none',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          height: '100%',
          background: theme.colors.primary,
          borderRadius: theme.effects.borderRadius,
        }}
      />
    </div>
  )
}

function DemoSwitch({ theme, checked }: { theme: ThemeConfig; checked: boolean }) {
  const isNeu = theme.id === 'soft-tech'

  return (
    <div
      style={{
        width: '52px',
        height: '28px',
        borderRadius: theme.id === 'neubrutalist' ? '0' : '9999px',
        background: checked ? theme.colors.primary : (isNeu ? theme.colors.background : theme.colors.surface),
        padding: '3px',
        cursor: 'pointer',
        transition: theme.effects.transition,
        boxShadow: isNeu
          ? (checked ? 'none' : 'inset 2px 2px 4px #A3B1C6, inset -2px -2px 4px #FFFFFF')
          : 'none',
        border: theme.id === 'neubrutalist' ? '2px solid #000' : `1px solid ${theme.colors.border}`,
      }}
    >
      <motion.div
        animate={{ x: checked ? 24 : 0 }}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: theme.id === 'neubrutalist' ? '0' : '50%',
          background: checked ? theme.colors.primaryForeground : theme.colors.textMuted,
          boxShadow: isNeu ? '2px 2px 4px #A3B1C6, -2px -2px 4px #FFFFFF' : theme.effects.shadow,
        }}
      />
    </div>
  )
}

function DemoToast({ theme, type }: { theme: ThemeConfig; type: 'success' | 'warning' | 'error' | 'info' }) {
  const icons = {
    success: <Check size={18} weight="bold" />,
    warning: <Warning size={18} weight="bold" />,
    error: <X size={18} weight="bold" />,
    info: <Info size={18} weight="bold" />,
  }

  const colors = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.accent,
  }

  const messages = {
    success: 'Operation completed successfully',
    warning: 'Please review before continuing',
    error: 'Something went wrong',
    info: 'Here is some information',
  }

  const isGlass = theme.id === 'frosted-glass'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: isGlass ? 'rgba(255,255,255,0.15)' : theme.colors.surface,
        borderRadius: theme.effects.borderRadius,
        border: theme.id === 'neubrutalist'
          ? '3px solid #000'
          : `1px solid ${theme.colors.border}`,
        borderLeft: theme.id === 'neubrutalist'
          ? '6px solid #000'
          : `4px solid ${colors[type]}`,
        boxShadow: theme.effects.shadow,
        backdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <div style={{ color: colors[type] }}>{icons[type]}</div>
      <span style={{ color: theme.colors.text, fontSize: '14px' }}>{messages[type]}</span>
    </div>
  )
}

function DemoCodeBlock({ theme }: { theme: ThemeConfig }) {
  const code = `function vibeCode(idea: string) {
  const app = await ai.generate(idea);
  return app.deploy();
}`

  const isGlass = theme.id === 'frosted-glass'
  const isTerminal = theme.id === 'terminal-renaissance'

  return (
    <div
      style={{
        background: isGlass
          ? 'rgba(0,0,0,0.3)'
          : isTerminal
            ? '#0A0A0A'
            : theme.colors.backgroundSecondary,
        borderRadius: theme.effects.borderRadius,
        border: theme.id === 'neubrutalist'
          ? '3px solid #000'
          : `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
        fontFamily: theme.typography.fontFamilyMono,
        backdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderBottom: theme.id === 'neubrutalist'
            ? '3px solid #000'
            : `1px solid ${theme.colors.border}`,
          background: isGlass ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
      >
        <Code size={16} color={theme.colors.textMuted} />
        <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>vibe.ts</span>
      </div>
      <pre
        style={{
          padding: '14px',
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.6',
          color: isTerminal ? theme.colors.primary : theme.colors.text,
          overflow: 'auto',
        }}
      >
        {code}
      </pre>
    </div>
  )
}

function DemoChatMessage({ theme, isAI }: { theme: ThemeConfig; isAI: boolean }) {
  const isGlass = theme.id === 'frosted-glass'

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: theme.id === 'neubrutalist' ? '0' : '50%',
          background: isAI ? theme.colors.primary : theme.colors.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: theme.id === 'neubrutalist' ? '2px solid #000' : 'none',
        }}
      >
        {isAI ? (
          <Robot size={18} color={theme.colors.primaryForeground} weight="bold" />
        ) : (
          <User size={18} color={theme.colors.secondaryForeground} weight="bold" />
        )}
      </div>
      <div
        style={{
          flex: 1,
          padding: '12px 16px',
          background: isGlass
            ? 'rgba(255,255,255,0.1)'
            : isAI
              ? theme.colors.surface
              : theme.colors.backgroundSecondary,
          borderRadius: theme.effects.borderRadius,
          border: theme.id === 'neubrutalist'
            ? '2px solid #000'
            : `1px solid ${theme.colors.border}`,
          fontFamily: theme.typography.fontFamily,
          backdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', color: theme.colors.text, lineHeight: '1.5' }}>
          {isAI
            ? "I've analyzed your request. Let me create a beautiful landing page with modern animations and a clean design system."
            : "Build me a landing page for my AI startup"
          }
        </p>
      </div>
    </div>
  )
}

function DemoSidebar({ theme }: { theme: ThemeConfig }) {
  const isGlass = theme.id === 'frosted-glass'
  const isNeu = theme.id === 'soft-tech'

  const items = [
    { icon: <Folder size={18} />, label: 'Projects', active: true },
    { icon: <ChatCircle size={18} />, label: 'Chat', active: false },
    { icon: <Code size={18} />, label: 'Code', active: false },
    { icon: <Gear size={18} />, label: 'Settings', active: false },
  ]

  return (
    <div
      style={{
        width: '200px',
        padding: '16px',
        background: isGlass ? 'rgba(255,255,255,0.08)' : theme.colors.surface,
        borderRadius: theme.effects.borderRadius,
        border: theme.id === 'neubrutalist' ? '3px solid #000' : `1px solid ${theme.colors.border}`,
        backdropFilter: isGlass ? `blur(${theme.effects.blur})` : 'none',
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <div style={{ marginBottom: '16px', fontWeight: theme.typography.headingWeight, color: theme.colors.text }}>
        Menu
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: isNeu ? theme.effects.borderRadius : theme.id === 'neubrutalist' ? '0' : '8px',
              background: item.active
                ? (isNeu ? theme.colors.primary : isGlass ? 'rgba(255,255,255,0.15)' : theme.colors.surfaceHover)
                : 'transparent',
              color: item.active ? (isNeu ? '#FFF' : theme.colors.text) : theme.colors.textMuted,
              cursor: 'pointer',
              transition: theme.effects.transition,
              border: theme.id === 'neubrutalist' && item.active ? '2px solid #000' : 'none',
              boxShadow: isNeu && item.active ? theme.effects.shadow : 'none',
            }}
          >
            {item.icon}
            <span style={{ fontSize: '14px' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ThemeShowcasePage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('terminal-renaissance')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentTheme = themes.find(t => t.id === selectedTheme)!

  const isGradientBg = currentTheme.id === 'frosted-glass'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isGradientBg ? currentTheme.colors.background : currentTheme.colors.background,
        color: currentTheme.colors.text,
        fontFamily: currentTheme.typography.fontFamily,
        transition: 'all 0.5s ease',
        position: 'relative',
      }}
    >
      {/* Scanline overlay for Terminal theme */}
      {currentTheme.id === 'terminal-renaissance' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            zIndex: 100,
          }}
        />
      )}

      {/* Synthwave grid overlay for Retro Wave theme */}
      {currentTheme.id === 'retro-wave' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            pointerEvents: 'none',
            background: `
              linear-gradient(to bottom, transparent 0%, rgba(26, 10, 46, 0.8) 100%),
              repeating-linear-gradient(90deg, rgba(255, 0, 170, 0.1) 0px, rgba(255, 0, 170, 0.1) 1px, transparent 1px, transparent 60px),
              repeating-linear-gradient(0deg, rgba(255, 0, 170, 0.1) 0px, rgba(255, 0, 170, 0.1) 1px, transparent 1px, transparent 60px)
            `,
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
            zIndex: 0,
            opacity: 0.6,
          }}
        />
      )}

      {/* Aurora gradient overlay for Aurora Borealis theme */}
      {currentTheme.id === 'aurora-borealis' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 30% 0%, rgba(0, 217, 160, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(124, 58, 237, 0.15) 0%, transparent 40%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Gold shimmer for Midnight Luxe theme */}
      {currentTheme.id === 'midnight-luxe' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%)',
            opacity: 0.6,
            zIndex: 100,
          }}
        />
      )}

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '20px 32px',
          borderBottom: `1px solid ${currentTheme.colors.border}`,
          background: currentTheme.id === 'frosted-glass'
            ? 'rgba(0,0,0,0.2)'
            : currentTheme.colors.backgroundSecondary,
          backdropFilter: currentTheme.id === 'frosted-glass' ? 'blur(20px)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: currentTheme.typography.headingWeight,
                margin: 0,
                letterSpacing: currentTheme.typography.letterSpacing,
                background: currentTheme.id === 'gradient-flow'
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)'
                  : 'none',
                WebkitBackgroundClip: currentTheme.id === 'gradient-flow' ? 'text' : 'unset',
                WebkitTextFillColor: currentTheme.id === 'gradient-flow' ? 'transparent' : 'unset',
              }}
            >
              UI/UX Theme Showcase
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: currentTheme.colors.textMuted }}>
              11 Distinct Visual Directions for Turbocat
            </p>
          </div>

          {/* Theme Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                background: currentTheme.id === 'frosted-glass'
                  ? 'rgba(255,255,255,0.15)'
                  : currentTheme.colors.surface,
                border: currentTheme.id === 'neubrutalist'
                  ? '3px solid #000'
                  : `1px solid ${currentTheme.colors.border}`,
                borderRadius: currentTheme.effects.borderRadius,
                color: currentTheme.colors.text,
                cursor: 'pointer',
                fontFamily: currentTheme.typography.fontFamily,
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: currentTheme.effects.shadow,
                backdropFilter: currentTheme.id === 'frosted-glass' ? 'blur(20px)' : 'none',
                minWidth: '280px',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {currentTheme.icon}
                {currentTheme.name}
              </span>
              <CaretDown
                size={16}
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: currentTheme.id === 'frosted-glass'
                      ? 'rgba(0,0,0,0.8)'
                      : currentTheme.colors.surface,
                    border: currentTheme.id === 'neubrutalist'
                      ? '3px solid #000'
                      : `1px solid ${currentTheme.colors.border}`,
                    borderRadius: currentTheme.effects.borderRadius,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    zIndex: 100,
                    backdropFilter: currentTheme.id === 'frosted-glass' ? 'blur(20px)' : 'none',
                  }}
                >
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setSelectedTheme(theme.id)
                        setIsDropdownOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        width: '100%',
                        padding: '14px 16px',
                        background: selectedTheme === theme.id
                          ? (currentTheme.id === 'frosted-glass' ? 'rgba(255,255,255,0.1)' : currentTheme.colors.surfaceHover)
                          : 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${currentTheme.colors.border}`,
                        color: currentTheme.colors.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: currentTheme.typography.fontFamily,
                      }}
                    >
                      <span style={{
                        color: selectedTheme === theme.id
                          ? (currentTheme.id === 'gradient-flow' ? '#8B5CF6' : currentTheme.colors.primary)
                          : currentTheme.colors.textMuted,
                        flexShrink: 0,
                      }}>
                        {theme.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{theme.name}</div>
                        <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted, marginTop: '2px' }}>
                          {theme.description.slice(0, 60)}...
                        </div>
                      </div>
                      {selectedTheme === theme.id && (
                        <Check size={16} style={{ marginLeft: 'auto', color: currentTheme.colors.success }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Theme Description */}
      <section style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <DemoCard theme={currentTheme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: currentTheme.id === 'neubrutalist' ? '0' : '12px',
                background: currentTheme.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: currentTheme.effects.shadow,
                border: currentTheme.id === 'neubrutalist' ? '3px solid #000' : 'none',
              }}
            >
              <span style={{ color: currentTheme.colors.primaryForeground }}>{currentTheme.icon}</span>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: currentTheme.typography.headingWeight,
                  letterSpacing: currentTheme.typography.letterSpacing,
                }}
              >
                {currentTheme.name}
              </h2>
              <p style={{ margin: '4px 0 0', color: currentTheme.colors.textMuted, fontSize: '14px' }}>
                {currentTheme.description}
              </p>
            </div>
          </div>

          {/* Theme specs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: `1px solid ${currentTheme.colors.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted, marginBottom: '4px' }}>Font</div>
              <div style={{ fontSize: '14px' }}>{currentTheme.typography.fontFamily.split(',')[0].replace(/'/g, '')}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted, marginBottom: '4px' }}>Border Radius</div>
              <div style={{ fontSize: '14px' }}>{currentTheme.effects.borderRadius}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted, marginBottom: '4px' }}>Style</div>
              <div style={{ fontSize: '14px' }}>{currentTheme.specialStyles || 'Standard'}</div>
            </div>
          </div>
        </DemoCard>
      </section>

      {/* Components Grid */}
      <section style={{ padding: '0 32px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: currentTheme.typography.headingWeight,
            marginBottom: '20px',
            letterSpacing: currentTheme.typography.letterSpacing,
          }}
        >
          Component Examples
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Buttons */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Buttons
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <DemoButton theme={currentTheme} variant="primary">
                <Play size={16} weight="bold" /> Primary
              </DemoButton>
              <DemoButton theme={currentTheme} variant="secondary">
                Secondary
              </DemoButton>
              <DemoButton theme={currentTheme} variant="outline">
                Outline
              </DemoButton>
              <DemoButton theme={currentTheme} variant="ghost">
                Ghost
              </DemoButton>
            </div>
          </DemoCard>

          {/* Badges */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Badges & Status
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <DemoBadge theme={currentTheme} variant="default">Default</DemoBadge>
              <DemoBadge theme={currentTheme} variant="success"><Check size={12} /> Success</DemoBadge>
              <DemoBadge theme={currentTheme} variant="warning"><Warning size={12} /> Warning</DemoBadge>
              <DemoBadge theme={currentTheme} variant="error"><X size={12} /> Error</DemoBadge>
            </div>
          </DemoCard>

          {/* Form Elements */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Form Elements
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DemoInput theme={currentTheme} placeholder="Enter your prompt..." />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DemoSwitch theme={currentTheme} checked={true} />
                <span style={{ fontSize: '14px' }}>Enable AI suggestions</span>
              </div>
            </div>
          </DemoCard>

          {/* Progress */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Progress & Loading
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span>Building app...</span>
                  <span style={{ color: currentTheme.colors.textMuted }}>75%</span>
                </div>
                <DemoProgress theme={currentTheme} value={75} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DemoAvatar theme={currentTheme} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>User Profile</div>
                  <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted }}>Avatar component</div>
                </div>
              </div>
            </div>
          </DemoCard>

          {/* Toasts */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Notifications
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DemoToast theme={currentTheme} type="success" />
              <DemoToast theme={currentTheme} type="error" />
            </div>
          </DemoCard>

          {/* Sidebar */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Navigation
            </h4>
            <DemoSidebar theme={currentTheme} />
          </DemoCard>
        </div>
      </section>

      {/* Chat & Code Section */}
      <section style={{ padding: '0 32px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: currentTheme.typography.headingWeight,
            marginBottom: '20px',
            letterSpacing: currentTheme.typography.letterSpacing,
          }}
        >
          Chat & Code
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Chat */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              AI Chat Interface
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DemoChatMessage theme={currentTheme} isAI={false} />
              <DemoChatMessage theme={currentTheme} isAI={true} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: currentTheme.id === 'frosted-glass'
                    ? 'rgba(255,255,255,0.1)'
                    : currentTheme.colors.backgroundSecondary,
                  borderRadius: currentTheme.effects.borderRadius,
                  border: currentTheme.id === 'neubrutalist'
                    ? '2px solid #000'
                    : `1px solid ${currentTheme.colors.border}`,
                }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: currentTheme.colors.text,
                    fontSize: '14px',
                    fontFamily: currentTheme.typography.fontFamily,
                  }}
                />
                <button
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: currentTheme.id === 'neubrutalist' ? '0' : '50%',
                    background: currentTheme.colors.primary,
                    border: currentTheme.id === 'neubrutalist' ? '2px solid #000' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <PaperPlaneTilt size={18} color={currentTheme.colors.primaryForeground} weight="bold" />
                </button>
              </div>
            </div>
          </DemoCard>

          {/* Code */}
          <DemoCard theme={currentTheme}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: currentTheme.colors.textMuted }}>
              Code Preview
            </h4>
            <DemoCodeBlock theme={currentTheme} />
          </DemoCard>
        </div>
      </section>

      {/* Color Palette */}
      <section style={{ padding: '0 32px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: currentTheme.typography.headingWeight,
            marginBottom: '20px',
            letterSpacing: currentTheme.typography.letterSpacing,
          }}
        >
          Color Palette
        </h3>

        <DemoCard theme={currentTheme}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
            }}
          >
            {Object.entries({
              Primary: currentTheme.colors.primary,
              Secondary: currentTheme.colors.secondary,
              Accent: currentTheme.colors.accent,
              Background: currentTheme.colors.background,
              Surface: currentTheme.colors.surface,
              Border: currentTheme.colors.border,
              Text: currentTheme.colors.text,
              'Text Muted': currentTheme.colors.textMuted,
              Success: currentTheme.colors.success,
              Warning: currentTheme.colors.warning,
              Error: currentTheme.colors.error,
            }).map(([name, color]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: '48px',
                    background: color,
                    borderRadius: currentTheme.id === 'neubrutalist' ? '0' : '8px',
                    border: currentTheme.id === 'neubrutalist'
                      ? '2px solid #000'
                      : `1px solid ${currentTheme.colors.border}`,
                    marginBottom: '8px',
                  }}
                />
                <div style={{ fontSize: '12px', color: currentTheme.colors.textMuted }}>{name}</div>
                <div style={{ fontSize: '10px', color: currentTheme.colors.textMuted, fontFamily: currentTheme.typography.fontFamilyMono }}>
                  {color.length > 20 ? 'gradient' : color}
                </div>
              </div>
            ))}
          </div>
        </DemoCard>
      </section>
    </div>
  )
}
