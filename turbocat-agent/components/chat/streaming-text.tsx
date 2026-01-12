/**
 * Streaming Text Component
 * Animates text as it streams in character by character
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/streaming-text.tsx
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StreamingTextProps {
  text: string
  speed?: number // characters per second
  className?: string
  showCursor?: boolean
  onComplete?: () => void
}

export function StreamingText({
  text,
  speed = 50,
  className,
  showCursor = true,
  onComplete,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 1000 / speed)

      return () => clearTimeout(timeout)
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, speed, isComplete, onComplete])

  return (
    <div className={cn('relative inline-block', className)}>
      <span className="whitespace-pre-wrap break-words">{displayedText}</span>
      {!isComplete && showCursor && (
        <motion.span
          className="inline-block w-0.5 h-4 ml-0.5 bg-primary"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}
