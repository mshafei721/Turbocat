/**
 * Storybook Stories for Execution Trace UI Components
 *
 * Stories demonstrating various states of the execution trace panel:
 * - Complete execution flow
 * - Failed execution
 * - In-progress execution
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/trace/execution-trace-panel.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ExecutionTracePanel } from './execution-trace-panel'
import { TraceStep } from './trace-step'
import { TraceStepDetails } from './trace-step-details'
import type { ExecutionTrace, ExecutionStep } from '@/lib/skills/types'

// Meta configuration
const meta = {
  title: 'Trace/ExecutionTracePanel',
  component: ExecutionTracePanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays complete skill execution trace with timeline of steps, status indicators, and control buttons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onCancel: { action: 'cancel clicked' },
    autoScroll: {
      control: 'boolean',
      description: 'Auto-scroll to current running step',
    },
  },
} satisfies Meta<typeof ExecutionTracePanel>

export default meta
type Story = StoryObj<typeof meta>

// Sample execution traces
const completedTrace: ExecutionTrace = {
  traceId: 'trace-completed-001',
  skillId: 'skill-db-design',
  skillName: 'Database Design',
  inputPrompt: 'Create a database schema for a blog with users, posts, and comments',
  detectedConfidence: 0.95,
  detectionReasoning: 'Detected database design keywords: schema, users, posts, comments',
  steps: [
    {
      step: 1,
      description: 'Parse user requirements',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:00Z'),
      completedAt: new Date('2026-01-04T10:00:05Z'),
      data: {
        reasoning: 'Identified 3 main entities: User, Post, Comment',
        logs: ['Parsing input prompt...', 'Entities found: User, Post, Comment', 'Relationships identified: 1-to-many'],
      },
    },
    {
      step: 2,
      description: 'Generate Drizzle schema definition',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:05Z'),
      completedAt: new Date('2026-01-04T10:00:15Z'),
      data: {
        reasoning: 'Creating TypeScript schema with Drizzle ORM',
        mcpServers: ['context7'],
        codeOutput: `export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})`,
        language: 'typescript',
      },
    },
    {
      step: 3,
      description: 'Create migration files',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:15Z'),
      completedAt: new Date('2026-01-04T10:00:20Z'),
      data: {
        reasoning: 'Generating SQL migration for PostgreSQL',
        outputFiles: ['db/schema/blog.ts', 'migrations/001_initial.sql', 'migrations/002_add_indexes.sql'],
      },
    },
  ],
  status: 'completed',
  durationMs: 20000,
  outputFiles: ['db/schema/blog.ts', 'migrations/001_initial.sql', 'migrations/002_add_indexes.sql'],
  startedAt: new Date('2026-01-04T10:00:00Z'),
  completedAt: new Date('2026-01-04T10:00:20Z'),
}

const failedTrace: ExecutionTrace = {
  traceId: 'trace-failed-001',
  skillId: 'skill-supabase-setup',
  skillName: 'Supabase Setup',
  inputPrompt: 'Set up Supabase authentication with Google provider',
  detectedConfidence: 0.88,
  detectionReasoning: 'Detected Supabase and authentication keywords',
  steps: [
    {
      step: 1,
      description: 'Verify Supabase credentials',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:00Z'),
      completedAt: new Date('2026-01-04T10:00:02Z'),
      data: {
        reasoning: 'Checking environment variables',
        logs: ['SUPABASE_URL found', 'SUPABASE_ANON_KEY found'],
      },
    },
    {
      step: 2,
      description: 'Connect to Supabase project',
      status: 'failed',
      startedAt: new Date('2026-01-04T10:00:02Z'),
      completedAt: new Date('2026-01-04T10:00:05Z'),
      error: 'Connection timeout: Unable to reach Supabase server at https://example.supabase.co',
      data: {
        reasoning: 'Attempting to connect to Supabase MCP server',
        mcpServers: ['supabase'],
        logs: ['Initiating connection...', 'Timeout after 3000ms'],
      },
    },
  ],
  status: 'failed',
  errorMessage: 'Failed to connect to Supabase server. Please check your network connection and credentials.',
  durationMs: 5000,
  startedAt: new Date('2026-01-04T10:00:00Z'),
  completedAt: new Date('2026-01-04T10:00:05Z'),
}

const inProgressTrace: ExecutionTrace = {
  traceId: 'trace-progress-001',
  skillId: 'skill-api-integration',
  skillName: 'API Integration',
  inputPrompt: 'Create REST API endpoints for user management',
  detectedConfidence: 0.92,
  detectionReasoning: 'Detected API and endpoint keywords',
  steps: [
    {
      step: 1,
      description: 'Analyze API requirements',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:00Z'),
      completedAt: new Date('2026-01-04T10:00:03Z'),
      data: {
        reasoning: 'Identified CRUD operations for user resource',
        logs: ['Parsing requirements...', 'Operations: GET, POST, PUT, DELETE'],
      },
    },
    {
      step: 2,
      description: 'Generate API route handlers',
      status: 'running',
      startedAt: new Date('2026-01-04T10:00:03Z'),
      data: {
        reasoning: 'Creating Next.js App Router API routes',
        mcpServers: ['context7', 'github'],
      },
    },
    {
      step: 3,
      description: 'Create validation schemas',
      status: 'pending',
    },
    {
      step: 4,
      description: 'Generate API documentation',
      status: 'pending',
    },
  ],
  status: 'running',
  startedAt: new Date('2026-01-04T10:00:00Z'),
}

// Stories
export const CompleteExecution: Story = {
  args: {
    trace: completedTrace,
    autoScroll: false,
  },
}

export const FailedExecution: Story = {
  args: {
    trace: failedTrace,
    autoScroll: false,
  },
}

export const InProgressExecution: Story = {
  args: {
    trace: inProgressTrace,
    autoScroll: true,
  },
}

export const PendingExecution: Story = {
  args: {
    trace: {
      traceId: 'trace-pending-001',
      skillId: 'skill-ui-component',
      skillName: 'UI Component',
      inputPrompt: 'Create a user profile card component',
      detectedConfidence: 0.85,
      detectionReasoning: 'Detected UI component keywords',
      steps: [],
      status: 'pending',
      startedAt: new Date(),
    },
    autoScroll: false,
  },
}

export const LongExecutionTrace: Story = {
  args: {
    trace: {
      traceId: 'trace-long-001',
      skillId: 'skill-complex',
      skillName: 'Complex Multi-Step Skill',
      inputPrompt: 'Build a complete authentication system with email verification',
      detectedConfidence: 0.89,
      detectionReasoning: 'Detected authentication and email keywords',
      steps: [
        {
          step: 1,
          description: 'Analyze requirements',
          status: 'completed',
          startedAt: new Date('2026-01-04T10:00:00Z'),
          completedAt: new Date('2026-01-04T10:00:02Z'),
        },
        {
          step: 2,
          description: 'Set up database schema',
          status: 'completed',
          startedAt: new Date('2026-01-04T10:00:02Z'),
          completedAt: new Date('2026-01-04T10:00:08Z'),
        },
        {
          step: 3,
          description: 'Create authentication routes',
          status: 'completed',
          startedAt: new Date('2026-01-04T10:00:08Z'),
          completedAt: new Date('2026-01-04T10:00:15Z'),
        },
        {
          step: 4,
          description: 'Implement JWT token generation',
          status: 'completed',
          startedAt: new Date('2026-01-04T10:00:15Z'),
          completedAt: new Date('2026-01-04T10:00:20Z'),
        },
        {
          step: 5,
          description: 'Set up email service',
          status: 'running',
          startedAt: new Date('2026-01-04T10:00:20Z'),
        },
        {
          step: 6,
          description: 'Create verification templates',
          status: 'pending',
        },
        {
          step: 7,
          description: 'Add middleware protection',
          status: 'pending',
        },
        {
          step: 8,
          description: 'Generate documentation',
          status: 'pending',
        },
      ],
      status: 'running',
      startedAt: new Date('2026-01-04T10:00:00Z'),
    },
    autoScroll: true,
  },
}

// Individual component stories
const traceStepMeta = {
  title: 'Trace/TraceStep',
  component: TraceStep,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TraceStep>

export const PendingStep: StoryObj<typeof TraceStep> = {
  render: (args) => <TraceStep {...args} />,
  args: {
    step: {
      step: 1,
      description: 'Waiting to start',
      status: 'pending',
    },
  },
}

export const RunningStep: StoryObj<typeof TraceStep> = {
  render: (args) => <TraceStep {...args} />,
  args: {
    step: {
      step: 2,
      description: 'Processing user data',
      status: 'running',
      startedAt: new Date(),
    },
    isCurrentStep: true,
  },
}

export const CompletedStep: StoryObj<typeof TraceStep> = {
  render: (args) => <TraceStep {...args} />,
  args: {
    step: {
      step: 3,
      description: 'Database schema created',
      status: 'completed',
      startedAt: new Date('2026-01-04T10:00:00Z'),
      completedAt: new Date('2026-01-04T10:00:05Z'),
    },
  },
}

export const FailedStep: StoryObj<typeof TraceStep> = {
  render: (args) => <TraceStep {...args} />,
  args: {
    step: {
      step: 4,
      description: 'Connection failed',
      status: 'failed',
      startedAt: new Date(),
      completedAt: new Date(),
      error: 'Network timeout after 5000ms',
    },
  },
}

// Step details stories
const stepDetailsMeta = {
  title: 'Trace/TraceStepDetails',
  component: TraceStepDetails,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TraceStepDetails>

export const DetailsWithReasoning: StoryObj<typeof TraceStepDetails> = {
  render: (args) => <TraceStepDetails {...args} />,
  args: {
    step: {
      step: 1,
      description: 'Analyze requirements',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      data: {
        reasoning: 'Identified 5 user requirements: authentication, profile management, post creation, comments, and search',
        logs: ['Parsing prompt...', 'Requirements extracted', 'Validation complete'],
      },
    },
    isExpanded: true,
  },
}

export const DetailsWithCode: StoryObj<typeof TraceStepDetails> = {
  render: (args) => <TraceStepDetails {...args} />,
  args: {
    step: {
      step: 2,
      description: 'Generate schema',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      data: {
        codeOutput: `export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})`,
        language: 'typescript',
      },
    },
    isExpanded: true,
  },
}

export const DetailsWithMCPServers: StoryObj<typeof TraceStepDetails> = {
  render: (args) => <TraceStepDetails {...args} />,
  args: {
    step: {
      step: 3,
      description: 'Query documentation',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      data: {
        mcpServers: ['context7', 'exa', 'github'],
        reasoning: 'Searched documentation using multiple MCP servers',
      },
    },
    isExpanded: true,
  },
}

export const DetailsWithOutputFiles: StoryObj<typeof TraceStepDetails> = {
  render: (args) => <TraceStepDetails {...args} />,
  args: {
    step: {
      step: 4,
      description: 'Generate files',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      data: {
        outputFiles: ['db/schema/users.ts', 'db/schema/posts.ts', 'migrations/001_initial.sql', 'migrations/002_indexes.sql'],
        reasoning: 'Created schema files and migration scripts',
      },
    },
    isExpanded: true,
  },
}
