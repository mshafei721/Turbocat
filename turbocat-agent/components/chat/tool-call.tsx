/**
 * Tool Call Component
 * Displays tool execution information and results
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/tool-call.tsx
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ToolCallProps {
  toolCall: {
    toolCallId?: string
    toolName: string
    state?: 'pending' | 'running' | 'success' | 'error'
    args?: Record<string, unknown>
    result?: unknown
  }
  className?: string
}

export function ToolCall({ toolCall, className }: ToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const stateConfig: Record<string, { icon: any; color: string; bg: string; label: string; animate?: boolean }> = {
    pending: {
      icon: Loader2,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      label: 'Pending',
    },
    running: {
      icon: Loader2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      label: 'Running',
      animate: true,
    },
    success: {
      icon: CheckCircle,
      color: 'text-accent',
      bg: 'bg-accent/10',
      label: 'Success',
    },
    error: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Error',
    },
  }

  const state = toolCall.state || 'success'
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        'shadow-ai-sm hover:shadow-ai-md transition-ai',
        config.bg,
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3',
          'hover:bg-muted/30 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
      >
        {/* Expand Icon */}
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>

        {/* Tool Icon */}
        <div className={cn('flex-shrink-0 p-1.5 rounded-md', config.color)}>
          {config.animate ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Icon className="w-4 h-4" />
            </motion.div>
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>

        {/* Tool Name & State */}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{toolCall.toolName}</div>
          <div className={cn('text-xs', config.color)}>{config.label}</div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3 border-t border-border/50">
              {/* Arguments */}
              {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Arguments:</div>
                  <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(toolCall.args, null, 2)}
                  </pre>
                </div>
              )}

              {/* Result */}
              {toolCall.result !== undefined && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Result:</div>
                  <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                    {typeof toolCall.result === 'string'
                      ? toolCall.result
                      : JSON.stringify(toolCall.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Tool Call ID */}
              {toolCall.toolCallId && (
                <div className="text-xs text-muted-foreground">ID: {toolCall.toolCallId}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
