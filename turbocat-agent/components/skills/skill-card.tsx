/**
 * Skill Card Component
 *
 * Displays essential skill information in a card format:
 * - Skill name, category, version
 * - Usage count and success rate
 * - Color-coded status indicator (active/inactive)
 * - Click to select and show details
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/skills/skill-card.tsx
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, Activity, TrendingUp, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillDefinition } from '@/lib/skills/types'

interface SkillCardProps {
  /** Skill definition data */
  skill: SkillDefinition
  /** Optional additional CSS classes */
  className?: string
  /** Callback when card is clicked */
  onClick?: () => void
  /** Whether the card is currently selected */
  isSelected?: boolean
}

/**
 * Format skill name to display format
 */
function formatSkillName(name: string): string {
  return name
}

/**
 * Get category color for badge
 */
function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    core: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    integration: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    custom: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    utility: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  }

  return colors[category || 'core'] || 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
}

/**
 * Get status indicator color and icon
 */
function getStatusIndicator(isActive: boolean) {
  if (isActive) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle2,
      label: 'Active',
    }
  }

  return {
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: XCircle,
    label: 'Inactive',
  }
}

/**
 * Format success rate with color coding
 */
function getSuccessRateColor(successRate: number): string {
  if (successRate >= 90) return 'text-green-600 dark:text-green-400'
  if (successRate >= 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * SkillCard Component
 *
 * Displays comprehensive information about a skill in a card format.
 * Responsive and accessible with keyboard navigation support.
 */
export function SkillCard({ skill, className, onClick, isSelected = false }: SkillCardProps) {
  const displayName = formatSkillName(skill.name)
  const statusIndicator = getStatusIndicator(skill.isActive ?? true)
  const successRate = skill.successRate ?? 0
  const usageCount = skill.usageCount ?? 0
  const StatusIcon = statusIndicator.icon

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-orange-500 dark:ring-orange-400',
        !skill.isActive && 'opacity-60',
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`${displayName} skill card`}
      aria-pressed={isSelected}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <CardTitle className="text-lg font-semibold truncate">{displayName}</CardTitle>
            </div>
            <CardDescription className="text-sm line-clamp-2">{skill.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium',
                statusIndicator.bgColor,
                statusIndicator.borderColor,
                statusIndicator.color,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{statusIndicator.label}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category and Version */}
        <div className="flex flex-wrap gap-2">
          {skill.category && (
            <Badge variant="secondary" className={cn('text-xs', getCategoryColor(skill.category))}>
              {skill.category}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            v{skill.version}
          </Badge>
          {skill.tags && skill.tags.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {skill.tags[0]}
              {skill.tags.length > 1 && ` +${skill.tags.length - 1}`}
            </Badge>
          )}
        </div>

        {/* Usage Statistics */}
        {usageCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Activity size={14} />
                <span>Usage</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {usageCount} {usageCount === 1 ? 'time' : 'times'}
              </Badge>
            </div>
          </div>
        )}

        {/* Success Rate */}
        {successRate > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <TrendingUp size={14} />
                <span>Success Rate</span>
              </div>
              <span className={cn('text-xs font-medium', getSuccessRateColor(successRate))}>
                {successRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={successRate} className="h-1.5" />
          </div>
        )}

        {/* MCP Dependencies Count */}
        {skill.mcpDependencies && skill.mcpDependencies.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>MCP Servers</span>
            <span className="font-medium">
              {skill.mcpDependencies.length} {skill.mcpDependencies.length === 1 ? 'dependency' : 'dependencies'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
