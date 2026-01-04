/**
 * Skill Card Stories
 *
 * Showcases the Skill Card component that displays skill information
 * in a card format with usage statistics and success rate.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/skills/SkillCard.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SkillCard } from '@/components/skills/skill-card'
import type { SkillDefinition } from '@/lib/skills/types'
import { useState } from 'react'

/**
 * Create mock skill for examples
 */
const createMockSkill = (overrides?: Partial<SkillDefinition>): SkillDefinition => ({
  id: 'skill-database-design',
  name: 'Database Design',
  slug: 'database-design',
  description: 'Automatically design and generate database schemas with relationships using Drizzle ORM',
  version: '1.0.0',
  category: 'core',
  tags: ['database', 'schema', 'drizzle'],
  scope: 'global',
  content: '# Database Design Skill\n\nAutomatically create database schemas.',
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
      examples: ['Create a database schema', 'Design tables for blog'],
    },
  ],
  isActive: true,
  usageCount: 42,
  successRate: 95.5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
})

const meta: Meta<typeof SkillCard> = {
  title: 'Skills/Skill Card',
  component: SkillCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Skill Card displays essential skill information including name, category, version, usage statistics, and success rate. Supports active/inactive states and selection.',
      },
    },
  },
  argTypes: {
    skill: {
      description: 'Skill definition data',
    },
    onClick: {
      description: 'Callback when card is clicked',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is currently selected',
    },
  },
}

export default meta
type Story = StoryObj<typeof SkillCard>

// =============================================================================
// BASIC STORIES
// =============================================================================

/**
 * Default View
 *
 * Shows the card with a high-performing skill.
 */
export const Default: Story = {
  args: {
    skill: createMockSkill(),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Selected State
 *
 * Shows the card in selected state with orange ring.
 */
export const Selected: Story = {
  args: {
    skill: createMockSkill(),
    isSelected: true,
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Inactive Skill
 *
 * Shows an inactive skill with reduced opacity.
 */
export const Inactive: Story = {
  args: {
    skill: createMockSkill({
      isActive: false,
      name: 'Legacy Integration',
      description: 'Old integration that has been replaced',
      successRate: 60,
      usageCount: 5,
    }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * New Skill
 *
 * Shows a skill with no usage history yet.
 */
export const NewSkill: Story = {
  args: {
    skill: createMockSkill({
      name: 'Image Processing',
      description: 'Process and optimize images using AI',
      category: 'utility',
      usageCount: 0,
      successRate: 0,
    }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Low Success Rate
 *
 * Shows a skill with poor performance metrics.
 */
export const LowSuccessRate: Story = {
  args: {
    skill: createMockSkill({
      name: 'Experimental API',
      description: 'Experimental integration with third-party API',
      successRate: 45,
      usageCount: 20,
    }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * High Usage
 *
 * Shows a heavily used skill.
 */
export const HighUsage: Story = {
  args: {
    skill: createMockSkill({
      name: 'API Integration',
      description: 'Generate RESTful API endpoints with validation',
      category: 'core',
      usageCount: 234,
      successRate: 98.5,
    }),
    onClick: () => console.log('Card clicked'),
  },
}

// =============================================================================
// CATEGORY VARIATIONS
// =============================================================================

/**
 * Core Category
 */
export const CoreCategory: Story = {
  args: {
    skill: createMockSkill({ category: 'core' }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Integration Category
 */
export const IntegrationCategory: Story = {
  args: {
    skill: createMockSkill({
      category: 'integration',
      name: 'Stripe Payment',
      description: 'Integrate Stripe payment processing',
    }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Custom Category
 */
export const CustomCategory: Story = {
  args: {
    skill: createMockSkill({
      category: 'custom',
      name: 'Custom Workflow',
      description: 'User-defined custom workflow automation',
    }),
    onClick: () => console.log('Card clicked'),
  },
}

/**
 * Utility Category
 */
export const UtilityCategory: Story = {
  args: {
    skill: createMockSkill({
      category: 'utility',
      name: 'Data Validation',
      description: 'Validate and sanitize user input',
    }),
    onClick: () => console.log('Card clicked'),
  },
}

// =============================================================================
// INTERACTIVE STORIES
// =============================================================================

/**
 * Interactive Selection
 *
 * Demonstrates card selection toggle.
 */
export const InteractiveSelection: Story = {
  render: () => {
    const [selectedSlug, setSelectedSlug] = useState<string | undefined>()

    const skills = [
      createMockSkill(),
      createMockSkill({
        id: 'skill-api',
        slug: 'api-integration',
        name: 'API Integration',
        description: 'Create API endpoints',
      }),
      createMockSkill({
        id: 'skill-ui',
        slug: 'ui-component',
        name: 'UI Component',
        description: 'Generate UI components',
      }),
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard
            key={skill.slug}
            skill={skill}
            isSelected={selectedSlug === skill.slug}
            onClick={() => setSelectedSlug(skill.slug === selectedSlug ? undefined : skill.slug)}
          />
        ))}
      </div>
    )
  },
}

// =============================================================================
// LAYOUT STORIES
// =============================================================================

/**
 * Grid Layout
 *
 * Shows multiple cards in a responsive grid.
 */
export const GridLayout: Story = {
  render: () => {
    const skills = [
      createMockSkill(),
      createMockSkill({
        id: 'skill-api',
        slug: 'api-integration',
        name: 'API Integration',
        description: 'Generate RESTful API endpoints with validation',
        category: 'core',
        usageCount: 156,
        successRate: 92,
      }),
      createMockSkill({
        id: 'skill-ui',
        slug: 'ui-component',
        name: 'UI Component',
        description: 'Create accessible UI components',
        category: 'core',
        usageCount: 89,
        successRate: 88,
      }),
      createMockSkill({
        id: 'skill-supabase',
        slug: 'supabase-setup',
        name: 'Supabase Setup',
        description: 'Configure Supabase database and auth',
        category: 'integration',
        usageCount: 45,
        successRate: 96,
      }),
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} onClick={() => console.log('Clicked', skill.name)} />
        ))}
      </div>
    )
  },
}

/**
 * Dark Mode
 *
 * Shows the card in dark mode.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-950 p-8 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkillCard
          skill={createMockSkill()}
          onClick={() => console.log('Card clicked')}
        />
        <SkillCard
          skill={createMockSkill({
            name: 'API Integration',
            description: 'Create REST APIs',
            isActive: false,
          })}
          onClick={() => console.log('Card clicked')}
        />
      </div>
    </div>
  ),
}
