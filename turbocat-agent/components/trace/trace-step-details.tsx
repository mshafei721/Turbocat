/**
 * TraceStepDetails Component
 *
 * Expandable section for each execution step showing:
 * - Reasoning/logs
 * - MCP server connections used
 * - Files generated
 * - Code output with syntax highlighting
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/trace/trace-step-details.tsx
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Server, Code, MessageSquare, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionStep } from '@/lib/skills/types'

interface TraceStepDetailsProps {
  /** Execution step data */
  step: ExecutionStep
  /** Whether the details are expanded */
  isExpanded: boolean
  /** Optional additional CSS classes */
  className?: string
}

/**
 * TraceStepDetails Component
 *
 * Displays detailed information about an execution step including
 * reasoning, logs, MCP connections, and outputs.
 */
export function TraceStepDetails({ step, isExpanded, className }: TraceStepDetailsProps) {
  if (!isExpanded) return null

  // Type guards to ensure we have the right data types
  const hasReasoning = Boolean(step.data?.reasoning && typeof step.data.reasoning === 'string')
  const hasLogs = Boolean(step.data?.logs && Array.isArray(step.data.logs) && step.data.logs.length > 0)
  const hasMcpServers = Boolean(
    step.data?.mcpServers && Array.isArray(step.data.mcpServers) && step.data.mcpServers.length > 0
  )
  const hasOutputFiles = Boolean(
    step.data?.outputFiles && Array.isArray(step.data.outputFiles) && step.data.outputFiles.length > 0
  )
  const hasCodeOutput = Boolean(step.data?.codeOutput && typeof step.data.codeOutput === 'string')
  const hasLanguage = Boolean(step.data?.language && typeof step.data.language === 'string')

  // If no details to show, display a simple message
  if (!hasReasoning && !hasLogs && !hasMcpServers && !hasOutputFiles && !hasCodeOutput) {
    return (
      <div className={cn('text-sm text-gray-500 dark:text-gray-400 italic', className)}>
        No additional details available for this step.
      </div>
    )
  }

  return (
    <Card className={cn('border-l-4 border-l-orange-500 dark:border-l-orange-400', className)}>
      <CardContent className="space-y-4 p-4">
        {hasReasoning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Reasoning
            </div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-300">
              {String(step.data?.reasoning || '')}
            </div>
          </div>
        )}

        {hasLogs && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Logs
            </div>
            <div className="space-y-1">
              {(step.data?.logs as string[] | undefined)?.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-md bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300"
                >
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <span className="break-all">{String(log)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasMcpServers && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              MCP Servers Used
            </div>
            <div className="flex flex-wrap gap-2">
              {(step.data?.mcpServers as string[] | undefined)?.map((server) => (
                <Badge
                  key={server}
                  variant="outline"
                  className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30"
                >
                  <Server className="h-3 w-3 mr-1" />
                  {String(server)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasOutputFiles && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              Files Generated
            </div>
            <div className="space-y-1">
              {(step.data?.outputFiles as string[] | undefined)?.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs font-mono text-green-700 dark:text-green-300"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="break-all">{String(file)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasCodeOutput && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Code className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Code Output
              {hasLanguage && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {String(step.data?.language)}
                </Badge>
              )}
            </div>
            <div className="rounded-md bg-gray-900 dark:bg-gray-950 p-4 overflow-x-auto">
              <pre className="text-xs">
                <code className="text-gray-100 dark:text-gray-200">{String(step.data?.codeOutput || '')}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
