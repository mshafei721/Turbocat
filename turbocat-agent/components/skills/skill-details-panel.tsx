/**
 * Skill Details Panel Component
 *
 * Displays full skill information in a side panel:
 * - Complete skill metadata
 * - MCP dependencies with connection status
 * - Trigger patterns and examples
 * - Action buttons (View SKILL.md, Activate/Deactivate, View Logs)
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/skills/skill-details-panel.tsx
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Power,
  PowerOff,
  FileCode,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Tag,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillDefinition, MCPDependency } from '@/lib/skills/types'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

interface SkillDetailsPanelProps {
  /** Skill definition data */
  skill: SkillDefinition
  /** MCP server connection statuses */
  mcpStatuses?: MCPConnectionStatus[]
  /** Callback when activate/deactivate button is clicked */
  onToggleActive?: (skillSlug: string, currentStatus: boolean) => void | Promise<void>
  /** Callback when View SKILL.md button is clicked */
  onViewSkillMd?: (skillSlug: string) => void
  /** Callback when View Logs button is clicked */
  onViewLogs?: (skillSlug: string) => void
  /** Optional additional CSS classes */
  className?: string
  /** Whether toggle is in progress */
  isToggling?: boolean
}

/**
 * Get connection status for a specific MCP server
 */
function getMCPServerStatus(
  serverName: string,
  mcpStatuses?: MCPConnectionStatus[],
): 'connected' | 'disconnected' | 'error' | 'unknown' {
  if (!mcpStatuses) return 'unknown'

  const status = mcpStatuses.find((s) => s.serverName === serverName)
  if (!status) return 'unknown'

  if (status.status === 'connected') return 'connected'
  if (status.status === 'error') return 'error'
  return 'disconnected'
}

/**
 * Get status indicator for MCP dependency
 */
function getDependencyStatusIndicator(status: 'connected' | 'disconnected' | 'error' | 'unknown') {
  switch (status) {
    case 'connected':
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle2,
        label: 'Connected',
      }
    case 'error':
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: XCircle,
        label: 'Error',
      }
    case 'disconnected':
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: XCircle,
        label: 'Disconnected',
      }
    case 'unknown':
    default:
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: AlertCircle,
        label: 'Unknown',
      }
  }
}

/**
 * Format date to readable string
 */
function formatDate(date?: Date): string {
  if (!date) return 'Unknown'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * SkillDetailsPanel Component
 *
 * Displays comprehensive skill information with action buttons.
 * Includes MCP dependency status and trigger patterns.
 */
export function SkillDetailsPanel({
  skill,
  mcpStatuses,
  onToggleActive,
  onViewSkillMd,
  onViewLogs,
  className,
  isToggling = false,
}: SkillDetailsPanelProps) {
  const isActive = skill.isActive ?? true
  const requiredDeps = skill.mcpDependencies?.filter((dep) => dep.required) || []
  const optionalDeps = skill.mcpDependencies?.filter((dep) => !dep.required) || []

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl font-semibold mb-2">{skill.name}</CardTitle>
            <CardDescription className="text-sm">{skill.description}</CardDescription>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {skill.category && (
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            v{skill.version}
          </Badge>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={cn('text-xs', isActive && 'bg-green-500 hover:bg-green-600')}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag size={16} />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* MCP Dependencies */}
        {skill.mcpDependencies && skill.mcpDependencies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Server size={16} />
              <span>MCP Dependencies</span>
            </div>

            {/* Required Dependencies */}
            {requiredDeps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Required</p>
                {requiredDeps.map((dep) => {
                  const status = getMCPServerStatus(dep.server, mcpStatuses)
                  const indicator = getDependencyStatusIndicator(status)
                  const StatusIcon = indicator.icon

                  return (
                    <div
                      key={dep.server}
                      className={cn(
                        'flex items-start justify-between gap-3 p-3 rounded-md border',
                        indicator.bgColor,
                        indicator.borderColor,
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">{dep.server}</span>
                          <div className={cn('flex items-center gap-1 text-xs', indicator.color)}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{indicator.label}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dep.capabilities.map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Optional Dependencies */}
            {optionalDeps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Optional</p>
                {optionalDeps.map((dep) => {
                  const status = getMCPServerStatus(dep.server, mcpStatuses)
                  const indicator = getDependencyStatusIndicator(status)
                  const StatusIcon = indicator.icon

                  return (
                    <div
                      key={dep.server}
                      className={cn(
                        'flex items-start justify-between gap-3 p-3 rounded-md border',
                        indicator.bgColor,
                        indicator.borderColor,
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">{dep.server}</span>
                          <div className={cn('flex items-center gap-1 text-xs', indicator.color)}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{indicator.label}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dep.capabilities.map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Trigger Patterns */}
        {skill.triggers && skill.triggers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Zap size={16} />
              <span>Trigger Patterns</span>
            </div>
            {skill.triggers.map((trigger, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs font-mono text-orange-600 dark:text-orange-400">
                    {trigger.pattern}
                  </code>
                  <Badge variant="secondary" className="text-xs">
                    {(trigger.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
                {trigger.examples && trigger.examples.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Examples:</p>
                    <ul className="space-y-1">
                      {trigger.examples.map((example, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 pl-3">
                          &quot;{example}&quot;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>Created</span>
            </div>
            <span>{formatDate(skill.createdAt)}</span>
          </div>
          {skill.updatedAt && skill.updatedAt !== skill.createdAt && (
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>Updated</span>
              </div>
              <span>{formatDate(skill.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          {onViewSkillMd && (
            <Button
              onClick={() => onViewSkillMd(skill.slug)}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <FileCode className="h-4 w-4 mr-2" />
              View SKILL.md
            </Button>
          )}

          {onToggleActive && (
            <Button
              onClick={() => onToggleActive(skill.slug, isActive)}
              disabled={isToggling}
              variant={isActive ? 'outline' : 'default'}
              size="sm"
              className={cn(
                'w-full justify-start',
                !isActive && 'bg-orange-500 hover:bg-orange-600 text-white',
              )}
            >
              {isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate Skill
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate Skill
                </>
              )}
            </Button>
          )}

          {onViewLogs && (
            <Button
              onClick={() => onViewLogs(skill.slug)}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Execution Logs
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
