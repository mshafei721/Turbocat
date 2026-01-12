/**
 * Loading Dots Component
 * Animated loading indicator for AI thinking states
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/loading-dots.tsx
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'accent' | 'muted'
  label?: string
  className?: string
}

export function LoadingDots({ size = 'md', color = 'primary', label, className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  const colorClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    muted: 'bg-muted-foreground',
  }

  const dotClass = cn('rounded-full', sizeClasses[size], colorClasses[color])

  const containerAnimation = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const dotAnimation = {
    initial: { scale: 1, opacity: 0.7 },
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1] as any, // easeInOut cubic bezier
      },
    },
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        className="flex items-center gap-1"
        variants={containerAnimation}
        initial="initial"
        animate="animate"
      >
        <motion.div className={dotClass} variants={dotAnimation} />
        <motion.div className={dotClass} variants={dotAnimation} />
        <motion.div className={dotClass} variants={dotAnimation} />
      </motion.div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
