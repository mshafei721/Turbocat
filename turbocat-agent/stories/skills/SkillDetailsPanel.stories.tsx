/**
 * Skill Details Panel Stories
 *
 * Showcases the Skill Details Panel component that displays full skill
 * information including MCP dependencies, trigger patterns, and actions.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/skills/SkillDetailsPanel.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SkillDetailsPanel } from '@/components/skills/skill-details-panel'
import type { SkillDefinition } from '@/lib/skills/types'
import type { MCPConnectionStatus } from '@/lib/mcp/types'
import { useState } from 'react'

/**
 * Create mock skill
 */
const createMockSkill = (overrides?: Partial<SkillDefinition>): SkillDefinition => ({
  id: 'skill-database-design',
  name: 'Database Design',
  slug: 'database-design',
  description: 'Automatically design and generate database schemas with relationships using Drizzle ORM. Supports PostgreSQL, MySQL, and SQLite.',
  version: '1.2.0',
  category: 'core',
  tags: ['database', 'schema', 'drizzle', 'orm'],
  scope: 'global',
  content: '# Database Design Skill\n\nAutomatically create database schemas.',
  mcpDependencies: [
    {
      server: 'supabase',
      required: true,
      capabilities: ['executeSQL', 'getTableSchema', 'createTable'],
    },
    {
      server: 'github',
      required: false,
      capabilities: ['searchCode', 'readFile'],
    },
  ],
  triggers: [
    {
      pattern: 'database|schema|table|entity|model',
      confidence: 0.8,
      examples: [
        'Create a database schema for a blog',
        'Design tables for user authentication',
        'Generate a schema for e-commerce',
      ],
    },
  ],
  isActive: true,
  usageCount: 42,
  successRate: 95.5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
})

/**
 * Create mock MCP statuses
 */
const createMockMCPStatuses = (): MCPConnectionStatus[] => [
  {
    serverName: 'supabase',
    status: 'connected',
    lastHealthCheck: Date.now(),
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000,
      currentRequests: 10,
      windowResetAt: Date.now() + 60000,
    },
    successfulRequests: 150,
    failedRequests: 2,
    connectedAt: Date.now() - 3600000,
  },
  {
    serverName: 'github',
    status: 'connected',
    lastHealthCheck: Date.now(),
    rateLimit: {
      maxRequests: 5000,
      windowMs: 3600000,
      currentRequests: 42,
      windowResetAt: Date.now() + 3600000,
    },
    successfulRequests: 200,
    failedRequests: 5,
    connectedAt: Date.now() - 7200000,
  },
  {
    serverName: 'exa',
    status: 'disconnected',
    lastHealthCheck: null,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      currentRequests: 0,
      windowResetAt: Date.now() + 60000,
    },
    successfulRequests: 0,
    failedRequests: 0,
    connectedAt: null,
  },
]

const meta: Meta<typeof SkillDetailsPanel> = {
  title: 'Skills/Skill Details Panel',
  component: SkillDetailsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Skill Details Panel displays comprehensive skill information including MCP dependencies with connection status, trigger patterns, examples, and action buttons.',
      },
    },
  },
  argTypes: {
    skill: {
      description: 'Skill definition data',
    },
    mcpStatuses: {
      description: 'MCP server connection statuses',
    },
    onToggleActive: {
      description: 'Callback when activate/deactivate button is clicked',
    },
    onViewSkillMd: {
      description: 'Callback when View SKILL.md button is clicked',
    },
    onViewLogs: {
      description: 'Callback when View Logs button is clicked',
    },
    isToggling: {
      control: 'boolean',
      description: 'Whether toggle is in progress',
    },
  },
}

export default meta
type Story = StoryObj<typeof SkillDetailsPanel>

// =============================================================================
// BASIC STORIES
// =============================================================================

/**
 * Default View
 *
 * Shows the panel with all MCP servers connected.
 */
export const Default: Story = {
  args: {
    skill: createMockSkill(),
    mcpStatuses: createMockMCPStatuses(),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * Inactive Skill
 *
 * Shows an inactive skill with activate button.
 */
export const InactiveSkill: Story = {
  args: {
    skill: createMockSkill({ isActive: false }),
    mcpStatuses: createMockMCPStatuses(),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * Disconnected Dependencies
 *
 * Shows skill with some MCP servers disconnected.
 */
export const DisconnectedDependencies: Story = {
  args: {
    skill: createMockSkill(),
    mcpStatuses: [
      {
        serverName: 'supabase',
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
      ...createMockMCPStatuses().filter((s) => s.serverName !== 'supabase'),
    ],
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * Error State
 *
 * Shows skill with MCP servers in error state.
 */
export const ErrorState: Story = {
  args: {
    skill: createMockSkill(),
    mcpStatuses: [
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
        successfulRequests: 50,
        failedRequests: 10,
        connectedAt: null,
        errorMessage: 'Connection timeout after 30 seconds',
      },
      ...createMockMCPStatuses().filter((s) => s.serverName !== 'supabase'),
    ],
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * No MCP Dependencies
 *
 * Shows skill without any MCP dependencies.
 */
export const NoDependencies: Story = {
  args: {
    skill: createMockSkill({
      name: 'Simple Utility',
      description: 'A simple utility skill with no external dependencies',
      mcpDependencies: [],
    }),
    mcpStatuses: createMockMCPStatuses(),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * Multiple Triggers
 *
 * Shows skill with multiple trigger patterns.
 */
export const MultipleTriggers: Story = {
  args: {
    skill: createMockSkill({
      triggers: [
        {
          pattern: 'database|schema|table',
          confidence: 0.85,
          examples: ['Create a database', 'Design schema'],
        },
        {
          pattern: 'migration|migrate',
          confidence: 0.9,
          examples: ['Run migration', 'Create migration file'],
        },
        {
          pattern: 'entity|model',
          confidence: 0.75,
          examples: ['Define entity', 'Create model'],
        },
      ],
    }),
    mcpStatuses: createMockMCPStatuses(),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

// =============================================================================
// INTERACTIVE STORIES
// =============================================================================

/**
 * Interactive Toggle
 *
 * Demonstrates toggle active/inactive functionality.
 */
export const InteractiveToggle: Story = {
  render: () => {
    const [skill, setSkill] = useState(createMockSkill())
    const [isToggling, setIsToggling] = useState(false)

    const handleToggle = async (slug: string, currentStatus: boolean) => {
      setIsToggling(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSkill({ ...skill, isActive: !currentStatus })
      setIsToggling(false)
      console.log('Toggled to:', !currentStatus)
    }

    return (
      <SkillDetailsPanel
        skill={skill}
        mcpStatuses={createMockMCPStatuses()}
        onToggleActive={handleToggle}
        onViewSkillMd={(slug) => console.log('View SKILL.md:', slug)}
        onViewLogs={(slug) => console.log('View logs:', slug)}
        isToggling={isToggling}
      />
    )
  },
}

// =============================================================================
// LAYOUT STORIES
// =============================================================================

/**
 * Dark Mode
 *
 * Shows the panel in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-950 p-8 rounded-lg">
      <SkillDetailsPanel
        skill={createMockSkill()}
        mcpStatuses={createMockMCPStatuses()}
        onToggleActive={(slug, status) => console.log('Toggle:', slug, status)}
        onViewSkillMd={(slug) => console.log('View SKILL.md:', slug)}
        onViewLogs={(slug) => console.log('View logs:', slug)}
      />
    </div>
  ),
}

/**
 * Compact View
 *
 * Shows the panel in a narrower container.
 */
export const CompactView: Story = {
  render: () => (
    <div className="max-w-md">
      <SkillDetailsPanel
        skill={createMockSkill()}
        mcpStatuses={createMockMCPStatuses()}
        onToggleActive={(slug, status) => console.log('Toggle:', slug, status)}
        onViewSkillMd={(slug) => console.log('View SKILL.md:', slug)}
        onViewLogs={(slug) => console.log('View logs:', slug)}
      />
    </div>
  ),
}
