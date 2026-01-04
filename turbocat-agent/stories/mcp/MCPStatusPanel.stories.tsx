/**
 * MCP Status Panel Stories
 *
 * Showcases the MCP Status Panel component that displays all MCP servers
 * in a responsive grid layout with refresh and log viewing functionality.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/mcp/MCPStatusPanel.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { MCPStatusPanel } from '@/components/mcp/mcp-status-panel'
import type { MCPConnectionStatus } from '@/lib/mcp/types'
import { useState } from 'react'

/**
 * Create mock server statuses for examples
 */
const createMockStatuses = (): MCPConnectionStatus[] => [
  {
    serverName: 'exa',
    status: 'connected',
    lastHealthCheck: Date.now() - 30000,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      currentRequests: 25,
      windowResetAt: Date.now() + 30000,
    },
    successfulRequests: 142,
    failedRequests: 3,
    connectedAt: Date.now() - 3600000,
  },
  {
    serverName: 'firecrawl',
    status: 'connected',
    lastHealthCheck: Date.now() - 45000,
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000,
      currentRequests: 12,
      windowResetAt: Date.now() + 15000,
    },
    successfulRequests: 67,
    failedRequests: 1,
    connectedAt: Date.now() - 7200000,
  },
  {
    serverName: 'github',
    status: 'rate_limited',
    lastHealthCheck: Date.now() - 5000,
    rateLimit: {
      maxRequests: 5000,
      windowMs: 3600000,
      currentRequests: 5000,
      windowResetAt: Date.now() + 1800000,
    },
    successfulRequests: 4523,
    failedRequests: 127,
    connectedAt: Date.now() - 86400000,
  },
  {
    serverName: 'supabase',
    status: 'error',
    lastHealthCheck: Date.now() - 600000,
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000,
      currentRequests: 0,
      windowResetAt: Date.now() + 60000,
    },
    successfulRequests: 234,
    failedRequests: 45,
    connectedAt: null,
    errorMessage: 'Connection timeout after 30 seconds. Please check your credentials.',
  },
  {
    serverName: 'context7',
    status: 'connected',
    lastHealthCheck: Date.now() - 10000,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      currentRequests: 5,
      windowResetAt: Date.now() + 50000,
    },
    successfulRequests: 89,
    failedRequests: 0,
    connectedAt: Date.now() - 14400000,
  },
  {
    serverName: 'sequential-thinking',
    status: 'disconnected',
    lastHealthCheck: null,
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000,
      currentRequests: 0,
      windowResetAt: Date.now() + 60000,
    },
    successfulRequests: 0,
    failedRequests: 0,
    connectedAt: null,
  },
]

const meta: Meta<typeof MCPStatusPanel> = {
  title: 'MCP/Status Panel',
  component: MCPStatusPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Status Panel provides a comprehensive overview of all MCP servers in a responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile). Includes refresh functionality, log viewing, and collapsible panel.',
      },
    },
  },
  argTypes: {
    statuses: {
      description: 'Array of server connection statuses',
    },
    onRefreshAll: {
      description: 'Callback when refresh all button is clicked',
    },
    onViewLogs: {
      description: 'Callback when view logs button is clicked',
    },
    onServerSelect: {
      description: 'Callback when a server card is clicked',
    },
    onConfigure: {
      description: 'Callback when configure is clicked for a server',
    },
    selectedServer: {
      description: 'Currently selected server name',
    },
    defaultCollapsed: {
      control: 'boolean',
      description: 'Whether the panel starts collapsed',
    },
    isRefreshing: {
      control: 'boolean',
      description: 'Whether refresh is in progress',
    },
  },
}

export default meta
type Story = StoryObj<typeof MCPStatusPanel>

// =============================================================================
// BASIC STORIES
// =============================================================================

/**
 * Default View
 *
 * Shows the panel with all servers in various states.
 */
export const Default: Story = {
  args: {
    statuses: createMockStatuses(),
    onRefreshAll: () => console.log('Refresh all clicked'),
    onViewLogs: () => console.log('View logs clicked'),
    onServerSelect: (name) => console.log('Server selected:', name),
    onConfigure: (name) => console.log('Configure server:', name),
  },
}

/**
 * Empty State
 *
 * Shows the panel when no servers are configured.
 */
export const EmptyState: Story = {
  args: {
    statuses: [],
    onRefreshAll: () => console.log('Refresh all clicked'),
    onViewLogs: () => console.log('View logs clicked'),
  },
}

/**
 * All Connected
 *
 * Shows the panel when all servers are healthy and connected.
 */
export const AllConnected: Story = {
  args: {
    statuses: createMockStatuses()
      .filter((s) => s.serverName !== 'github' && s.serverName !== 'supabase' && s.serverName !== 'sequential-thinking')
      .map((s) => ({ ...s, status: 'connected' as const })),
    onRefreshAll: () => console.log('Refresh all clicked'),
    onViewLogs: () => console.log('View logs clicked'),
  },
}

/**
 * All Offline
 *
 * Shows the panel when all servers are disconnected.
 */
export const AllOffline: Story = {
  args: {
    statuses: createMockStatuses().map((s) => ({
      ...s,
      status: 'disconnected' as const,
      connectedAt: null,
      lastHealthCheck: null,
    })),
    onRefreshAll: () => console.log('Refresh all clicked'),
    onViewLogs: () => console.log('View logs clicked'),
    onConfigure: (name) => console.log('Configure server:', name),
  },
}

/**
 * Collapsed State
 *
 * Shows the panel in collapsed state showing only header.
 */
export const Collapsed: Story = {
  args: {
    statuses: createMockStatuses(),
    defaultCollapsed: true,
    onRefreshAll: () => console.log('Refresh all clicked'),
  },
}

/**
 * Refreshing
 *
 * Shows the panel during refresh operation with spinning icon.
 */
export const Refreshing: Story = {
  args: {
    statuses: createMockStatuses(),
    isRefreshing: true,
    onRefreshAll: () => console.log('Refresh all clicked'),
  },
}

// =============================================================================
// INTERACTIVE STORIES
// =============================================================================

/**
 * Interactive Panel
 *
 * Fully interactive panel with server selection and actions.
 */
export const Interactive: Story = {
  render: () => {
    const [selectedServer, setSelectedServer] = useState<string | undefined>()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
      setIsRefreshing(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsRefreshing(false)
      console.log('Refreshed all servers')
    }

    return (
      <MCPStatusPanel
        statuses={createMockStatuses()}
        selectedServer={selectedServer}
        isRefreshing={isRefreshing}
        onRefreshAll={handleRefresh}
        onViewLogs={() => console.log('View logs clicked')}
        onServerSelect={(name) => {
          console.log('Server selected:', name)
          setSelectedServer(name)
        }}
        onConfigure={(name) => {
          console.log('Configure server:', name)
        }}
      />
    )
  },
}

/**
 * Toggle Collapse
 *
 * Demonstrates the collapsible panel functionality.
 */
export const ToggleCollapse: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the chevron button to toggle panel collapse
        </p>
        <MCPStatusPanel
          statuses={createMockStatuses()}
          defaultCollapsed={false}
          onRefreshAll={() => console.log('Refresh all clicked')}
        />
      </div>
    )
  },
}

// =============================================================================
// LAYOUT STORIES
// =============================================================================

/**
 * Responsive Layout
 *
 * Shows how the grid adapts to different screen sizes.
 */
export const ResponsiveLayout: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Mobile (< 768px) - 1 column</h3>
        <div className="max-w-sm">
          <MCPStatusPanel
            statuses={createMockStatuses().slice(0, 3)}
            onRefreshAll={() => console.log('Refresh')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tablet (768px - 1024px) - 2 columns</h3>
        <div className="max-w-3xl">
          <MCPStatusPanel
            statuses={createMockStatuses().slice(0, 4)}
            onRefreshAll={() => console.log('Refresh')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Desktop (>= 1024px) - 3 columns</h3>
        <div className="max-w-6xl">
          <MCPStatusPanel
            statuses={createMockStatuses()}
            onRefreshAll={() => console.log('Refresh')}
          />
        </div>
      </div>
    </div>
  ),
}

/**
 * Dark Mode Preview
 *
 * Shows the panel in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-950 p-8 rounded-lg">
      <MCPStatusPanel
        statuses={createMockStatuses()}
        onRefreshAll={() => console.log('Refresh all clicked')}
        onViewLogs={() => console.log('View logs clicked')}
        onServerSelect={(name) => console.log('Server selected:', name)}
        onConfigure={(name) => console.log('Configure server:', name)}
      />
    </div>
  ),
}

/**
 * Full Page Example
 *
 * Shows the panel in a full page context.
 */
export const FullPageExample: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MCP Server Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all Model Context Protocol server connections
          </p>
        </div>

        <MCPStatusPanel
          statuses={createMockStatuses()}
          onRefreshAll={() => console.log('Refresh all clicked')}
          onViewLogs={() => console.log('View logs clicked')}
          onServerSelect={(name) => console.log('Server selected:', name)}
          onConfigure={(name) => console.log('Configure server:', name)}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}
