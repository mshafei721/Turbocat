/**
 * Skills Dashboard Stories
 *
 * Showcases the Skills Dashboard component - the main interface for
 * managing and viewing skills with search, filtering, and details panel.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/skills/SkillsDashboard.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SkillsDashboard } from '@/components/skills/skills-dashboard'
import type { SkillDefinition } from '@/lib/skills/types'
import type { MCPConnectionStatus } from '@/lib/mcp/types'
import { useState } from 'react'

/**
 * Create mock skills
 */
const createMockSkills = (): SkillDefinition[] => [
  {
    id: 'skill-1',
    name: 'Database Design',
    slug: 'database-design',
    description: 'Automatically design and generate database schemas with relationships using Drizzle ORM',
    version: '1.2.0',
    category: 'core',
    tags: ['database', 'schema', 'drizzle'],
    scope: 'global',
    content: '# Database Design Skill',
    mcpDependencies: [
      {
        server: 'supabase',
        required: true,
        capabilities: ['executeSQL', 'getTableSchema'],
      },
    ],
    triggers: [
      {
        pattern: 'database|schema|table',
        confidence: 0.8,
        examples: ['Create a database schema'],
      },
    ],
    isActive: true,
    usageCount: 156,
    successRate: 95.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'skill-2',
    name: 'API Integration',
    slug: 'api-integration',
    description: 'Generate RESTful API endpoints with validation using Zod and Next.js App Router',
    version: '1.0.0',
    category: 'core',
    tags: ['api', 'rest', 'validation'],
    scope: 'global',
    content: '# API Integration Skill',
    mcpDependencies: [
      {
        server: 'github',
        required: false,
        capabilities: ['searchCode'],
      },
    ],
    triggers: [
      {
        pattern: 'api|endpoint|route',
        confidence: 0.85,
        examples: ['Create an API endpoint'],
      },
    ],
    isActive: true,
    usageCount: 89,
    successRate: 92.0,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'skill-3',
    name: 'UI Component',
    slug: 'ui-component',
    description: 'Create accessible UI components using shadcn/ui primitives and design tokens',
    version: '2.1.0',
    category: 'core',
    tags: ['ui', 'component', 'react'],
    scope: 'global',
    content: '# UI Component Skill',
    mcpDependencies: [],
    triggers: [
      {
        pattern: 'component|ui|form|button',
        confidence: 0.75,
        examples: ['Create a form component'],
      },
    ],
    isActive: true,
    usageCount: 234,
    successRate: 88.5,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'skill-4',
    name: 'Supabase Setup',
    slug: 'supabase-setup',
    description: 'Configure Supabase database, authentication, and storage buckets',
    version: '1.5.0',
    category: 'integration',
    tags: ['supabase', 'auth', 'storage'],
    scope: 'global',
    content: '# Supabase Setup Skill',
    mcpDependencies: [
      {
        server: 'supabase',
        required: true,
        capabilities: ['executeSQL', 'createBucket', 'configureAuth'],
      },
    ],
    triggers: [
      {
        pattern: 'supabase|auth|storage',
        confidence: 0.9,
        examples: ['Set up Supabase auth'],
      },
    ],
    isActive: true,
    usageCount: 67,
    successRate: 96.0,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'skill-5',
    name: 'Stripe Payment',
    slug: 'stripe-payment',
    description: 'Integrate Stripe payment processing with webhooks and checkout',
    version: '1.0.0',
    category: 'integration',
    tags: ['stripe', 'payment', 'checkout'],
    scope: 'global',
    content: '# Stripe Payment Skill',
    mcpDependencies: [],
    triggers: [
      {
        pattern: 'payment|stripe|checkout',
        confidence: 0.9,
        examples: ['Add Stripe payment'],
      },
    ],
    isActive: true,
    usageCount: 45,
    successRate: 94.5,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'skill-6',
    name: 'Legacy Integration',
    slug: 'legacy-integration',
    description: 'Old integration that has been deprecated',
    version: '0.5.0',
    category: 'custom',
    tags: ['legacy', 'deprecated'],
    scope: 'global',
    content: '# Legacy Integration',
    mcpDependencies: [],
    triggers: [
      {
        pattern: 'legacy',
        confidence: 0.5,
        examples: ['Legacy task'],
      },
    ],
    isActive: false,
    usageCount: 12,
    successRate: 60.0,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-15'),
  },
]

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
]

const meta: Meta<typeof SkillsDashboard> = {
  title: 'Skills/Skills Dashboard',
  component: SkillsDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Skills Dashboard is the main interface for managing AI agent skills. It includes search, category filtering, skill cards grid, and a detail panel. Responsive layout adapts from mobile to desktop.',
      },
    },
  },
  argTypes: {
    skills: {
      description: 'Array of skill definitions',
    },
    mcpStatuses: {
      description: 'MCP server connection statuses',
    },
    onAddSkill: {
      description: 'Callback when Add Skill button is clicked',
    },
    onSkillSelect: {
      description: 'Callback when a skill is selected',
    },
    onToggleActive: {
      description: 'Callback when activate/deactivate is clicked',
    },
    onViewSkillMd: {
      description: 'Callback when View SKILL.md button is clicked',
    },
    onViewLogs: {
      description: 'Callback when View Logs button is clicked',
    },
    selectedSkillSlug: {
      description: 'Currently selected skill slug',
    },
    isToggling: {
      control: 'boolean',
      description: 'Whether toggle is in progress',
    },
  },
}

export default meta
type Story = StoryObj<typeof SkillsDashboard>

// =============================================================================
// BASIC STORIES
// =============================================================================

/**
 * Default View
 *
 * Shows the dashboard with multiple skills.
 */
export const Default: Story = {
  args: {
    skills: createMockSkills(),
    mcpStatuses: createMockMCPStatuses(),
    onAddSkill: () => console.log('Add skill clicked'),
    onSkillSelect: (skill) => console.log('Selected:', skill.name),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * With Selection
 *
 * Shows the dashboard with a skill selected.
 */
export const WithSelection: Story = {
  args: {
    skills: createMockSkills(),
    mcpStatuses: createMockMCPStatuses(),
    selectedSkillSlug: 'database-design',
    onAddSkill: () => console.log('Add skill clicked'),
    onSkillSelect: (skill) => console.log('Selected:', skill.name),
    onToggleActive: (slug, status) => console.log('Toggle:', slug, status),
    onViewSkillMd: (slug) => console.log('View SKILL.md:', slug),
    onViewLogs: (slug) => console.log('View logs:', slug),
  },
}

/**
 * Empty State
 *
 * Shows the dashboard with no skills.
 */
export const EmptyState: Story = {
  args: {
    skills: [],
    mcpStatuses: createMockMCPStatuses(),
    onAddSkill: () => console.log('Add skill clicked'),
  },
}

/**
 * Only Active Skills
 *
 * Shows only active skills.
 */
export const OnlyActiveSkills: Story = {
  args: {
    skills: createMockSkills().filter((s) => s.isActive),
    mcpStatuses: createMockMCPStatuses(),
    onAddSkill: () => console.log('Add skill clicked'),
    onSkillSelect: (skill) => console.log('Selected:', skill.name),
  },
}

/**
 * Only Inactive Skills
 *
 * Shows only inactive skills.
 */
export const OnlyInactiveSkills: Story = {
  args: {
    skills: createMockSkills().filter((s) => !s.isActive),
    mcpStatuses: createMockMCPStatuses(),
    onAddSkill: () => console.log('Add skill clicked'),
    onSkillSelect: (skill) => console.log('Selected:', skill.name),
  },
}

// =============================================================================
// INTERACTIVE STORIES
// =============================================================================

/**
 * Fully Interactive
 *
 * Demonstrates all interactive features.
 */
export const FullyInteractive: Story = {
  render: () => {
    const [skills, setSkills] = useState(createMockSkills())
    const [selectedSlug, setSelectedSlug] = useState<string | undefined>()
    const [isToggling, setIsToggling] = useState(false)

    const handleToggle = async (slug: string, currentStatus: boolean) => {
      setIsToggling(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSkills((prevSkills) =>
        prevSkills.map((skill) =>
          skill.slug === slug ? { ...skill, isActive: !currentStatus } : skill,
        ),
      )
      setIsToggling(false)
      console.log('Toggled', slug, 'to', !currentStatus)
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <SkillsDashboard
          skills={skills}
          mcpStatuses={createMockMCPStatuses()}
          selectedSkillSlug={selectedSlug}
          onAddSkill={() => console.log('Add skill clicked')}
          onSkillSelect={(skill) => setSelectedSlug(skill.slug === selectedSlug ? undefined : skill.slug)}
          onToggleActive={handleToggle}
          onViewSkillMd={(slug) => console.log('View SKILL.md:', slug)}
          onViewLogs={(slug) => console.log('View logs:', slug)}
          isToggling={isToggling}
        />
      </div>
    )
  },
}

// =============================================================================
// LAYOUT STORIES
// =============================================================================

/**
 * Dark Mode
 *
 * Shows the dashboard in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark min-h-screen bg-gray-950 p-6">
      <SkillsDashboard
        skills={createMockSkills()}
        mcpStatuses={createMockMCPStatuses()}
        selectedSkillSlug="api-integration"
        onAddSkill={() => console.log('Add skill clicked')}
        onSkillSelect={(skill) => console.log('Selected:', skill.name)}
        onToggleActive={(slug, status) => console.log('Toggle:', slug, status)}
        onViewSkillMd={(slug) => console.log('View SKILL.md:', slug)}
        onViewLogs={(slug) => console.log('View logs:', slug)}
      />
    </div>
  ),
}

/**
 * Mobile View
 *
 * Shows the dashboard on mobile screen size.
 */
export const MobileView: Story = {
  render: () => (
    <div className="max-w-sm">
      <SkillsDashboard
        skills={createMockSkills()}
        mcpStatuses={createMockMCPStatuses()}
        onAddSkill={() => console.log('Add skill clicked')}
        onSkillSelect={(skill) => console.log('Selected:', skill.name)}
      />
    </div>
  ),
}

/**
 * Tablet View
 *
 * Shows the dashboard on tablet screen size.
 */
export const TabletView: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkillsDashboard
        skills={createMockSkills()}
        mcpStatuses={createMockMCPStatuses()}
        selectedSkillSlug="database-design"
        onAddSkill={() => console.log('Add skill clicked')}
        onSkillSelect={(skill) => console.log('Selected:', skill.name)}
      />
    </div>
  ),
}
