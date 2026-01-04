/**
 * MCP Server Card Component
 *
 * Displays information about an MCP server including:
 * - Server name and status indicator
 * - Request count and success rate
 * - Rate limit information
 * - Error messages
 * - Configure button for disconnected servers
 *
 * Responsive design: stacks on mobile
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/mcp/mcp-server-card.tsx
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Settings, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MCPConnectionIndicator } from './mcp-connection-indicator'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

interface MCPServerCardProps {
  /** Server connection status data */
  status: MCPConnectionStatus
  /** Optional additional CSS classes */
  className?: string
  /** Callback when configure button is clicked */
  onConfigure?: () => void
  /** Callback when card is clicked */
  onClick?: () => void
  /** Whether the card is currently selected */
  isSelected?: boolean
}

/**
 * Format timestamp to human-readable relative time
 */
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never'

  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  if (seconds > 0) return `${seconds}s ago`
  return 'Just now'
}

/**
 * Format server name to display format
 */
function formatServerName(name: string): string {
  // Capitalize first letter and replace hyphens with spaces
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Calculate success rate percentage
 */
function calculateSuccessRate(successful: number, failed: number): number {
  const total = successful + failed
  if (total === 0) return 100
  return Math.round((successful / total) * 100)
}

/**
 * Calculate rate limit usage percentage
 */
function calculateRateLimitUsage(current: number, max: number): number {
  return Math.round((current / max) * 100)
}

/**
 * MCPServerCard Component
 *
 * Displays comprehensive information about an MCP server in a card format.
 * Responsive and accessible with keyboard navigation support.
 */
export function MCPServerCard({
  status,
  className,
  onConfigure,
  onClick,
  isSelected = false,
}: MCPServerCardProps) {
  const displayName = formatServerName(status.serverName)
  const successRate = calculateSuccessRate(status.successfulRequests, status.failedRequests)
  const rateLimitUsage = calculateRateLimitUsage(
    status.rateLimit.currentRequests,
    status.rateLimit.maxRequests,
  )
  const lastHealthCheckText = formatRelativeTime(status.lastHealthCheck)
  const totalRequests = status.successfulRequests + status.failedRequests

  const isDisconnected = status.status === 'disconnected' || status.status === 'error'
  const isRateLimited = status.status === 'rate_limited'

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-orange-500 dark:ring-orange-400',
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
      aria-label={`${displayName} server card`}
      aria-pressed={isSelected}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{displayName}</CardTitle>
            <CardDescription className="text-sm mt-1">
              Last check: {lastHealthCheckText}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MCPConnectionIndicator status={status.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        {status.errorMessage && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{status.errorMessage}</p>
          </div>
        )}

        {/* Request Statistics */}
        {!isDisconnected && totalRequests > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Activity size={14} />
                <span>Requests</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalRequests} total
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Success Rate</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {status.successfulRequests}
                </span>{' '}
                successful
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {status.failedRequests}
                </span>{' '}
                failed
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Information */}
        {!isDisconnected && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                <span>Rate Limit</span>
              </div>
              <Badge
                variant={isRateLimited ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {status.rateLimit.currentRequests}/{status.rateLimit.maxRequests}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Usage</span>
                <span className="font-medium">{rateLimitUsage}%</span>
              </div>
              <Progress
                value={rateLimitUsage}
                className={cn(
                  'h-1.5',
                  rateLimitUsage >= 90 && 'bg-red-200 dark:bg-red-900/20',
                )}
              />
            </div>
          </div>
        )}

        {/* Configure Button for Disconnected Servers */}
        {isDisconnected && onConfigure && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onConfigure()
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Settings size={14} className="mr-1.5" />
            Configure Server
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
