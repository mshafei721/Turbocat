/**
 * Reasoning Panel Component
 * Collapsible panel to display AI reasoning and thought process
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/reasoning-panel.tsx
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Brain, Lightbulb, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ReasoningStep {
  type: 'thought' | 'observation' | 'action'
  content: string
  timestamp?: Date
}

interface ReasoningPanelProps {
  steps: ReasoningStep[]
  title?: string
  defaultExpanded?: boolean
  className?: string
}

export function ReasoningPanel({
  steps,
  title = 'AI Reasoning',
  defaultExpanded = false,
  className,
}: ReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const stepIcons = {
    thought: Brain,
    observation: Lightbulb,
    action: TrendingUp,
  }

  const stepColors = {
    thought: 'text-primary',
    observation: 'text-accent',
    action: 'text-blue-500',
  }

  const stepBg = {
    thought: 'bg-primary/10',
    observation: 'bg-accent/10',
    action: 'bg-blue-500/10',
  }

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border border-border overflow-hidden',
        'bg-muted/30 backdrop-blur-sm',
        'shadow-ai-sm hover:shadow-ai-md transition-ai',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-3 p-4',
          'hover:bg-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{steps.length} steps</div>
          </div>
        </div>

        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
              {steps.map((step, index) => {
                const Icon = stepIcons[step.type]
                const color = stepColors[step.type]
                const bg = stepBg[step.type]

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn('flex gap-3 p-3 rounded-lg', bg, 'border border-border/50')}
                  >
                    {/* Icon */}
                    <div className={cn('flex-shrink-0 mt-0.5', color)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-medium capitalize text-muted-foreground">{step.type}</div>
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words">{step.content}</div>
                      {step.timestamp && (
                        <div className="text-xs text-muted-foreground">
                          {step.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
