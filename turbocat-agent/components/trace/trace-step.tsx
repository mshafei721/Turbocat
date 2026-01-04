/**
 * TraceStep Component
 *
 * Displays a single execution step in the trace timeline:
 * - Step number, name, and status icon
 * - Duration when completed
 * - Collapsible details section
 * - Status indicators: pending (gray), running (blue pulse), completed (green check), failed (red x)
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/trace/trace-step.tsx
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TraceStepDetails } from './trace-step-details'
import type { ExecutionStep } from '@/lib/skills/types'

interface TraceStepProps {
  /** Execution step data */
  step: ExecutionStep
  /** Whether this is the currently running step */
  isCurrentStep?: boolean
  /** Whether to auto-scroll to this step */
  autoScroll?: boolean
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Calculate step duration in seconds
 */
function calculateDuration(startedAt?: Date, completedAt?: Date): number | null {
  if (!startedAt || !completedAt) return null
  const duration = completedAt.getTime() - startedAt.getTime()
  return duration / 1000 // Convert to seconds
}

/**
 * Format duration for display
 */
function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

/**
 * Get status indicator configuration
 */
function getStatusConfig(status: ExecutionStep['status']) {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        borderColor: 'border-gray-200 dark:border-gray-700',
        label: 'Pending',
        pulse: false,
      }
    case 'running':
      return {
        icon: Loader2,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'Running',
        pulse: true,
      }
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Completed',
        pulse: false,
      }
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Failed',
        pulse: false,
      }
  }
}

/**
 * TraceStep Component
 *
 * Displays a single step in the execution trace with status indicator,
 * duration, and expandable details.
 */
export function TraceStep({ step, isCurrentStep = false, autoScroll = false, className }: TraceStepProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const stepRef = useRef<HTMLDivElement>(null)
  const statusConfig = getStatusConfig(step.status)
  const StatusIcon = statusConfig.icon
  const duration = calculateDuration(step.startedAt, step.completedAt)

  // Auto-scroll to current step
  useEffect(() => {
    if (autoScroll && isCurrentStep && stepRef.current) {
      stepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [autoScroll, isCurrentStep])

  // Auto-expand running or failed steps
  useEffect(() => {
    if (step.status === 'running' || step.status === 'failed') {
      setIsExpanded(true)
    }
  }, [step.status])

  return (
    <div
      ref={stepRef}
      data-status={step.status}
      className={cn(
        'relative flex gap-3 pb-6 last:pb-0',
        isCurrentStep && 'ring-2 ring-orange-500/20 dark:ring-orange-400/20 rounded-lg -ml-2 pl-2 -mr-2 pr-2',
        className,
      )}
    >
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        {/* Status Indicator */}
        <div
          className={cn(
            'z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
            statusConfig.borderColor,
            statusConfig.bgColor,
          )}
        >
          <StatusIcon
            className={cn('h-4 w-4', statusConfig.color, statusConfig.pulse && 'animate-spin')}
            aria-label={statusConfig.label}
          />
        </div>

        {/* Vertical Line */}
        <div className="absolute top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        {/* Step Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full text-left rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50',
            'focus:outline-none focus:ring-2 focus:ring-orange-500/20',
          )}
          aria-expanded={isExpanded}
          aria-label={`Step ${step.step}: ${step.description}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Step {step.step}</span>
                {step.status === 'running' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium">
                    In Progress
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{step.description}</h4>
              {step.error && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate" title={step.error}>
                  Error: {step.error}
                </p>
              )}
            </div>

            {/* Duration Badge */}
            {duration !== null && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 shrink-0">
                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* Step Details (Collapsible) */}
        {isExpanded && (
          <div className="mt-2 pl-3">
            <TraceStepDetails step={step} isExpanded={isExpanded} />
          </div>
        )}
      </div>
    </div>
  )
}
