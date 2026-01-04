/**
 * ExecutionTracePanel Component
 *
 * Main panel for displaying complete skill execution trace:
 * - Header with task description and timing
 * - Vertical timeline of TraceSteps
 * - Auto-scroll to current running step
 * - "Cancel Execution" button
 * - "View Raw Logs" toggle
 * - Responsive design (full width on mobile)
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/trace/execution-trace-panel.tsx
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { XCircle, CheckCircle2, Loader2, FileText, Clock, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TraceStep } from './trace-step'
import type { ExecutionTrace } from '@/lib/skills/types'

interface ExecutionTracePanelProps {
  /** Execution trace data */
  trace: ExecutionTrace
  /** Callback when cancel button is clicked */
  onCancel?: () => void
  /** Whether to auto-scroll to current step */
  autoScroll?: boolean
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Format duration in milliseconds to human-readable format
 */
function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1000
  if (seconds < 1) return `${durationMs}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

/**
 * Get overall status configuration
 */
function getOverallStatusConfig(status: ExecutionTrace['status']) {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        borderColor: 'border-gray-200 dark:border-gray-700',
        label: 'Pending',
      }
    case 'running':
      return {
        icon: Loader2,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'Running',
      }
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Completed',
      }
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Failed',
      }
  }
}

/**
 * ExecutionTracePanel Component
 *
 * Displays a complete execution trace with timeline of steps,
 * status indicators, and control buttons.
 */
export function ExecutionTracePanel({ trace, onCancel, autoScroll = true, className }: ExecutionTracePanelProps) {
  const [showRawLogs, setShowRawLogs] = useState(false)
  const statusConfig = getOverallStatusConfig(trace.status)
  const StatusIcon = statusConfig.icon

  // Find the currently running step
  const currentStepIndex = useMemo(() => {
    return trace.steps.findIndex((step) => step.status === 'running')
  }, [trace.steps])

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (trace.steps.length === 0) return 0
    const completedSteps = trace.steps.filter((step) => step.status === 'completed').length
    return Math.round((completedSteps / trace.steps.length) * 100)
  }, [trace.steps])

  // Get elapsed time
  const elapsedTime = useMemo(() => {
    if (trace.durationMs) {
      return formatDuration(trace.durationMs)
    }
    if (trace.startedAt && !trace.completedAt) {
      const elapsed = Date.now() - new Date(trace.startedAt).getTime()
      return formatDuration(elapsed)
    }
    return null
  }, [trace.durationMs, trace.startedAt, trace.completedAt])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium', statusConfig.bgColor, statusConfig.borderColor, statusConfig.color)}
          >
            <StatusIcon className={cn('h-3.5 w-3.5', trace.status === 'running' && 'animate-spin')} />
            <span>{statusConfig.label}</span>
          </div>
          {trace.status === 'running' && (
            <Badge variant="outline" className="text-xs">
              {completionPercentage}% complete
            </Badge>
          )}
        </div>

        {/* Task Description */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <CardTitle className="text-lg font-semibold truncate">{trace.skillName}</CardTitle>
            </div>
            <CardDescription className="text-sm mt-1">{trace.inputPrompt}</CardDescription>
            {trace.detectionReasoning && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                Detected with {(trace.detectedConfidence * 100).toFixed(0)}% confidence: {trace.detectionReasoning}
              </p>
            )}
          </div>

          {/* Timing */}
          {elapsedTime && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 shrink-0">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{elapsedTime}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {trace.status === 'failed' && trace.errorMessage && (
          <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Execution Failed</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{trace.errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {/* Cancel Button */}
          {trace.status === 'running' && onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm" className="gap-1.5">
              <XCircle className="h-4 w-4" />
              Cancel Execution
            </Button>
          )}

          {/* View Raw Logs Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <Switch id="raw-logs" checked={showRawLogs} onCheckedChange={setShowRawLogs} />
            <Label htmlFor="raw-logs" className="text-sm cursor-pointer">
              View Raw Logs
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Steps Timeline */}
        {trace.steps.length > 0 ? (
          <div className="space-y-0">
            {trace.steps.map((step, index) => (
              <TraceStep
                key={`${trace.traceId}-step-${step.step}`}
                step={step}
                isCurrentStep={index === currentStepIndex}
                autoScroll={autoScroll && index === currentStepIndex}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No execution steps yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {trace.status === 'pending' ? 'Execution will begin shortly' : 'Waiting for execution to start'}
            </p>
          </div>
        )}

        {/* Raw Logs Section */}
        {showRawLogs && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Raw Execution Logs</h4>
            </div>
            <div className="rounded-md bg-gray-900 dark:bg-gray-950 p-4 overflow-x-auto max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-100 dark:text-gray-200">{JSON.stringify(trace, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Output Files Summary */}
        {trace.outputFiles && trace.outputFiles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Files Generated</h4>
              <Badge variant="secondary" className="text-xs ml-auto">
                {trace.outputFiles.length} {trace.outputFiles.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {trace.outputFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs font-mono text-green-700 dark:text-green-300"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="break-all truncate" title={file}>
                    {file}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
