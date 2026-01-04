/**
 * MCP Server Card Stories
 *
 * Showcases the MCP Server Card component displaying server information,
 * status, request statistics, and rate limiting data.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/mcp/MCPServerCard.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { MCPServerCard } from '@/components/mcp/mcp-server-card'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

/**
 * Create a mock status for story examples
 */
const createMockStatus = (
  name: string,
  status: MCPConnectionStatus['status'],
  partial?: Partial<MCPConnectionStatus>,
): MCPConnectionStatus => ({
  serverName: name,
  status,
  lastHealthCheck: status === 'connected' ? Date.now() - 30000 : null,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    currentRequests: 25,
    windowResetAt: Date.now() + 30000,
  },
  successfulRequests: 142,
  failedRequests: 3,
  connectedAt: status === 'connected' ? Date.now() - 3600000 : null,
  ...partial,
})

const meta: Meta<typeof MCPServerCard> = {
  title: 'MCP/Server Card',
  component: MCPServerCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Server Card displays comprehensive information about an MCP server including connection status, request statistics, rate limiting, and error messages. Responsive design stacks on mobile.',
      },
    },
  },
  argTypes: {
    status: {
      description: 'Server connection status data',
    },
    onConfigure: {
      description: 'Callback when configure button is clicked',
    },
    onClick: {
      description: 'Callback when card is clicked',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is currently selected',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MCPServerCard>

// =============================================================================
// STATUS STORIES
// =============================================================================

/**
 * Connected Server
 *
 * Shows a healthy connected server with request statistics.
 */
export const Connected: Story = {
  args: {
    status: createMockStatus('exa', 'connected'),
  },
}

/**
 * Disconnected Server
 *
 * Shows a disconnected server with configure button.
 */
export const Disconnected: Story = {
  args: {
    status: createMockStatus('firecrawl', 'disconnected', {
      lastHealthCheck: Date.now() - 300000,
      successfulRequests: 0,
      failedRequests: 0,
    }),
    onConfigure: () => console.log('Configure clicked'),
  },
}

/**
 * Error State
 *
 * Shows a server in error state with error message.
 */
export const ErrorState: Story = {
  args: {
    status: createMockStatus('github', 'error', {
      errorMessage: 'Connection timeout after 30 seconds. Please check your API key.',
      lastHealthCheck: Date.now() - 600000,
    }),
    onConfigure: () => console.log('Configure clicked'),
  },
}

/**
 * Rate Limited
 *
 * Shows a server that has hit rate limits.
 */
export const RateLimited: Story = {
  args: {
    status: createMockStatus('supabase', 'rate_limited', {
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
        currentRequests: 100,
        windowResetAt: Date.now() + 45000,
      },
    }),
  },
}

/**
 * Connecting
 *
 * Shows a server in connecting state.
 */
export const Connecting: Story = {
  args: {
    status: createMockStatus('context7', 'connecting', {
      lastHealthCheck: null,
      successfulRequests: 0,
      failedRequests: 0,
    }),
  },
}

// =============================================================================
// VARIANT STORIES
// =============================================================================

/**
 * Selected Card
 *
 * Shows a card in selected state with orange ring.
 */
export const Selected: Story = {
  args: {
    status: createMockStatus('exa', 'connected'),
    isSelected: true,
  },
}

/**
 * High Usage
 *
 * Shows a server with high request volume and rate limit usage.
 */
export const HighUsage: Story = {
  args: {
    status: createMockStatus('github', 'connected', {
      successfulRequests: 4523,
      failedRequests: 127,
      rateLimit: {
        maxRequests: 5000,
        windowMs: 3600000,
        currentRequests: 4750,
        windowResetAt: Date.now() + 300000,
      },
    }),
  },
}

/**
 * Low Success Rate
 *
 * Shows a server with a low success rate.
 */
export const LowSuccessRate: Story = {
  args: {
    status: createMockStatus('firecrawl', 'connected', {
      successfulRequests: 45,
      failedRequests: 55,
      lastHealthCheck: Date.now() - 120000,
    }),
  },
}

/**
 * Fresh Connection
 *
 * Shows a newly connected server with minimal data.
 */
export const FreshConnection: Story = {
  args: {
    status: createMockStatus('sequential-thinking', 'connected', {
      successfulRequests: 0,
      failedRequests: 0,
      connectedAt: Date.now() - 5000,
      lastHealthCheck: Date.now() - 1000,
    }),
  },
}

// =============================================================================
// SHOWCASE STORIES
// =============================================================================

/**
 * All Server Types
 *
 * Shows examples of different MCP servers.
 */
export const AllServerTypes: Story = {
  render: () => (
    <div className="grid gap-4 w-full max-w-4xl">
      <MCPServerCard
        status={createMockStatus('exa', 'connected')}
        onClick={() => console.log('Exa clicked')}
      />
      <MCPServerCard
        status={createMockStatus('firecrawl', 'connected', {
          successfulRequests: 234,
          failedRequests: 12,
        })}
        onClick={() => console.log('Firecrawl clicked')}
      />
      <MCPServerCard
        status={createMockStatus('github', 'rate_limited', {
          rateLimit: {
            maxRequests: 5000,
            windowMs: 3600000,
            currentRequests: 5000,
            windowResetAt: Date.now() + 1800000,
          },
        })}
        onClick={() => console.log('GitHub clicked')}
      />
      <MCPServerCard
        status={createMockStatus('supabase', 'error', {
          errorMessage: 'Invalid credentials',
        })}
        onConfigure={() => console.log('Configure Supabase')}
        onClick={() => console.log('Supabase clicked')}
      />
    </div>
  ),
}

/**
 * Interactive Card
 *
 * Demonstrates card click and configure functionality.
 */
export const Interactive: Story = {
  args: {
    status: createMockStatus('exa', 'disconnected'),
    onClick: () => console.log('Card clicked'),
    onConfigure: () => console.log('Configure clicked'),
  },
}

/**
 * Dark Mode Preview
 *
 * Shows how cards appear in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-950 p-8 rounded-lg space-y-4">
      <MCPServerCard status={createMockStatus('exa', 'connected')} />
      <MCPServerCard
        status={createMockStatus('github', 'error', {
          errorMessage: 'Connection failed',
        })}
        onConfigure={() => console.log('Configure')}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

/**
 * Responsive Showcase
 *
 * Shows how cards adapt to different screen sizes.
 */
export const Responsive: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Mobile (320px)</h3>
        <div className="w-80">
          <MCPServerCard status={createMockStatus('exa', 'connected')} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Desktop (400px+)</h3>
        <div className="w-[500px]">
          <MCPServerCard status={createMockStatus('github', 'connected')} />
        </div>
      </div>
    </div>
  ),
  decorators: [(Story) => <Story />],
}
