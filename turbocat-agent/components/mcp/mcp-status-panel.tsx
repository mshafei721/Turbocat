/**
 * MCP Status Panel Component
 *
 * Main panel for displaying MCP server status with:
 * - Grid layout for server cards (responsive: 3 cols desktop, 2 tablet, 1 mobile)
 * - "Refresh All" button to update all server statuses
 * - "View Logs" button linking to log viewer
 * - Collapsible panel with toggle
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/mcp/mcp-status-panel.tsx
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MCPServerCard } from './mcp-server-card'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

interface MCPStatusPanelProps {
  /** Array of server connection statuses */
  statuses: MCPConnectionStatus[]
  /** Callback when refresh all button is clicked */
  onRefreshAll?: () => void | Promise<void>
  /** Callback when view logs button is clicked */
  onViewLogs?: () => void
  /** Callback when a server card is clicked */
  onServerSelect?: (serverName: string) => void
  /** Callback when configure is clicked for a server */
  onConfigure?: (serverName: string) => void
  /** Currently selected server name */
  selectedServer?: string
  /** Whether the panel starts collapsed */
  defaultCollapsed?: boolean
  /** Optional additional CSS classes */
  className?: string
  /** Whether refresh is in progress */
  isRefreshing?: boolean
}

/**
 * Calculate server status summary
 */
function getStatusSummary(statuses: MCPConnectionStatus[]) {
  const connected = statuses.filter((s) => s.status === 'connected').length
  const disconnected = statuses.filter((s) => s.status === 'disconnected').length
  const error = statuses.filter((s) => s.status === 'error').length
  const rateLimited = statuses.filter((s) => s.status === 'rate_limited').length
  const connecting = statuses.filter((s) => s.status === 'connecting').length

  return {
    total: statuses.length,
    connected,
    disconnected,
    error,
    rateLimited,
    connecting,
    healthy: connected,
    unhealthy: disconnected + error,
  }
}

/**
 * MCPStatusPanel Component
 *
 * Displays a comprehensive overview of all MCP server statuses in a collapsible panel.
 * Includes refresh functionality and navigation to logs.
 */
export function MCPStatusPanel({
  statuses,
  onRefreshAll,
  onViewLogs,
  onServerSelect,
  onConfigure,
  selectedServer,
  defaultCollapsed = false,
  className,
  isRefreshing = false,
}: MCPStatusPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const summary = getStatusSummary(statuses)

  const handleRefresh = async () => {
    if (onRefreshAll) {
      await onRefreshAll()
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-xl font-semibold">MCP Server Status</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Monitor connection health and performance for all MCP servers
            </CardDescription>

            {/* Summary Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                <Server className="h-3 w-3 mr-1" />
                {summary.total} total
              </Badge>
              {summary.connected > 0 && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {summary.connected} connected
                </Badge>
              )}
              {summary.unhealthy > 0 && (
                <Badge variant="outline" className="text-xs border-red-500 text-red-700 dark:text-red-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  {summary.unhealthy} offline
                </Badge>
              )}
              {summary.rateLimited > 0 && (
                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {summary.rateLimited} rate limited
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh All
            </Button>
            {onViewLogs && (
              <Button onClick={onViewLogs} size="sm" variant="outline" className="gap-1.5">
                <FileText className="h-4 w-4" />
                View Logs
              </Button>
            )}
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="sm"
              variant="ghost"
              className="gap-1.5"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <CardContent>
          {statuses.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No MCP servers configured
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Add server configurations to see their status here
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                'grid-cols-1',
                'md:grid-cols-2',
                'lg:grid-cols-3',
              )}
            >
              {statuses.map((status) => (
                <MCPServerCard
                  key={status.serverName}
                  status={status}
                  onClick={() => onServerSelect?.(status.serverName)}
                  onConfigure={() => onConfigure?.(status.serverName)}
                  isSelected={selectedServer === status.serverName}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
