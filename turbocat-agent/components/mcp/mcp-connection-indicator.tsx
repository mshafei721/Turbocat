/**
 * MCP Connection Indicator Component
 *
 * Displays the connection status for an MCP server with appropriate
 * icon, color, and accessibility label.
 *
 * Status colors:
 * - connected: success-500 (green)
 * - disconnected/error: error-500 (red)
 * - rate_limited: warning-500 (yellow)
 * - connecting: blue-500 (blue)
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/mcp/mcp-connection-indicator.tsx
 */

'use client'

import { Check, X, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MCPConnectionStatusType } from '@/lib/mcp/types'
import { colors } from '@/lib/design-tokens'

interface MCPConnectionIndicatorProps {
  /** Current connection status */
  status: MCPConnectionStatusType
  /** Optional additional CSS classes */
  className?: string
  /** Show text label alongside icon (default: true) */
  showLabel?: boolean
  /** Custom size for icon (default: 16) */
  iconSize?: number
}

/**
 * Get the appropriate icon component for the status
 */
function getStatusIcon(status: MCPConnectionStatusType, size: number) {
  const iconProps = { size, className: 'shrink-0' }

  switch (status) {
    case 'connected':
      return <Check {...iconProps} />
    case 'disconnected':
    case 'error':
      return <X {...iconProps} />
    case 'rate_limited':
      return <Clock {...iconProps} />
    case 'connecting':
      return <Loader2 {...iconProps} className={cn(iconProps.className, 'animate-spin')} />
  }
}

/**
 * Get the text label for the status
 */
function getStatusLabel(status: MCPConnectionStatusType): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'disconnected':
      return 'Disconnected'
    case 'error':
      return 'Error'
    case 'rate_limited':
      return 'Rate Limited'
    case 'connecting':
      return 'Connecting'
  }
}

/**
 * Get the color classes for the status
 */
function getStatusColor(status: MCPConnectionStatusType): string {
  switch (status) {
    case 'connected':
      return 'text-green-600 dark:text-green-400'
    case 'disconnected':
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'rate_limited':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'connecting':
      return 'text-blue-600 dark:text-blue-400'
  }
}

/**
 * MCPConnectionIndicator Component
 *
 * Displays the connection status with icon and optional label.
 * Fully accessible with ARIA labels and semantic colors.
 */
export function MCPConnectionIndicator({
  status,
  className,
  showLabel = true,
  iconSize = 16,
}: MCPConnectionIndicatorProps) {
  const icon = getStatusIcon(status, iconSize)
  const label = getStatusLabel(status)
  const colorClasses = getStatusColor(status)

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', colorClasses, className)}
      role="status"
      aria-label={`Connection status: ${label}`}
    >
      {icon}
      {showLabel && (
        <span className="text-sm font-medium" aria-hidden="true">
          {label}
        </span>
      )}
      {/* Screen reader only text for better accessibility */}
      <span className="sr-only">{label}</span>
    </div>
  )
}
