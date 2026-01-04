/**
 * MCP Connection Indicator Stories
 *
 * Showcases all connection status indicators for MCP servers.
 * Displays appropriate icons and colors for each connection state.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/mcp/MCPConnectionIndicator.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { MCPConnectionIndicator } from '@/components/mcp/mcp-connection-indicator'
import type { MCPConnectionStatusType } from '@/lib/mcp/types'

const meta: Meta<typeof MCPConnectionIndicator> = {
  title: 'MCP/Connection Indicator',
  component: MCPConnectionIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Connection Indicator displays the current status of an MCP server connection with appropriate icon, color, and accessibility label. Color-coded: green (connected), red (disconnected/error), yellow (rate limited), blue (connecting).',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'error', 'rate_limited', 'connecting'],
      description: 'The connection status to display',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show the text label',
    },
    iconSize: {
      control: 'number',
      description: 'Size of the icon in pixels',
    },
  },
}

export default meta
type Story = StoryObj<typeof MCPConnectionIndicator>

// =============================================================================
// STATUS STORIES
// =============================================================================

/**
 * Connected Status
 *
 * Shows the green check icon indicating a successful connection.
 */
export const Connected: Story = {
  args: {
    status: 'connected',
  },
}

/**
 * Disconnected Status
 *
 * Shows the red X icon indicating the server is offline.
 */
export const Disconnected: Story = {
  args: {
    status: 'disconnected',
  },
}

/**
 * Error Status
 *
 * Shows the red X icon indicating a connection error.
 */
export const Error: Story = {
  args: {
    status: 'error',
  },
}

/**
 * Rate Limited Status
 *
 * Shows the yellow clock icon indicating rate limiting is active.
 */
export const RateLimited: Story = {
  args: {
    status: 'rate_limited',
  },
}

/**
 * Connecting Status
 *
 * Shows the blue spinning loader icon indicating connection in progress.
 */
export const Connecting: Story = {
  args: {
    status: 'connecting',
  },
}

// =============================================================================
// VARIANT STORIES
// =============================================================================

/**
 * Without Label
 *
 * Shows only the icon without text label (icon-only mode).
 */
export const WithoutLabel: Story = {
  args: {
    status: 'connected',
    showLabel: false,
  },
}

/**
 * Large Icon
 *
 * Shows the indicator with a larger icon size.
 */
export const LargeIcon: Story = {
  args: {
    status: 'connected',
    iconSize: 24,
  },
}

/**
 * Small Icon
 *
 * Shows the indicator with a smaller icon size.
 */
export const SmallIcon: Story = {
  args: {
    status: 'connected',
    iconSize: 12,
  },
}

// =============================================================================
// SHOWCASE STORIES
// =============================================================================

/**
 * All Statuses
 *
 * Shows all possible connection statuses side by side for comparison.
 */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <MCPConnectionIndicator status="connected" />
      <MCPConnectionIndicator status="disconnected" />
      <MCPConnectionIndicator status="error" />
      <MCPConnectionIndicator status="rate_limited" />
      <MCPConnectionIndicator status="connecting" />
    </div>
  ),
}

/**
 * All Statuses Icon Only
 *
 * Shows all statuses without labels for compact display.
 */
export const AllStatusesIconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <MCPConnectionIndicator status="connected" showLabel={false} />
      <MCPConnectionIndicator status="disconnected" showLabel={false} />
      <MCPConnectionIndicator status="error" showLabel={false} />
      <MCPConnectionIndicator status="rate_limited" showLabel={false} />
      <MCPConnectionIndicator status="connecting" showLabel={false} />
    </div>
  ),
}

/**
 * Status Transitions
 *
 * Demonstrates how status indicators appear during connection lifecycle.
 */
export const StatusTransitions: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-md">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Connection Lifecycle</h3>
        <p className="text-sm text-muted-foreground">
          Visual representation of status changes during MCP server connection.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">1. Initial State</span>
          <MCPConnectionIndicator status="disconnected" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">2. Connecting</span>
          <MCPConnectionIndicator status="connecting" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">3. Connected</span>
          <MCPConnectionIndicator status="connected" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">4. Rate Limited</span>
          <MCPConnectionIndicator status="rate_limited" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">5. Error/Offline</span>
          <MCPConnectionIndicator status="error" />
        </div>
      </div>
    </div>
  ),
}

/**
 * Dark Mode Preview
 *
 * Shows how indicators appear in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-950 p-8 rounded-lg">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Dark Mode</h3>
        <MCPConnectionIndicator status="connected" />
        <MCPConnectionIndicator status="disconnected" />
        <MCPConnectionIndicator status="error" />
        <MCPConnectionIndicator status="rate_limited" />
        <MCPConnectionIndicator status="connecting" />
      </div>
    </div>
  ),
}
