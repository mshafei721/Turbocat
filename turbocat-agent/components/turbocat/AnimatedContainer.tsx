'use client'

import * as React from 'react'
import { motion, type Variants, type Transition } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'scaleIn'
  | 'slideInLeft'
  | 'slideInRight'
  | 'stagger'

interface AnimatedContainerProps {
  animation?: AnimationType
  delay?: number
  duration?: number
  className?: string
  children: React.ReactNode
}

const animations: Record<AnimationType, Variants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
  },
  stagger: {
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
  },
}

export function AnimatedContainer({
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.3,
  className,
  children,
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion()
  const variants = animations[animation]

  const transition: Transition = {
    duration: shouldReduceMotion ? 0 : duration,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.25, 0.1, 0.25, 1],
  }

  // If reduced motion, render without animation
  if (shouldReduceMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

// Stagger item for use inside AnimatedContainer with stagger animation
interface StaggerItemProps {
  className?: string
  children: React.ReactNode
}

export function StaggerItem({
  className,
  children,
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedContainer
