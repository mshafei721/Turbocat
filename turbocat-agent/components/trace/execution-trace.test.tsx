/**
 * Execution Trace UI Tests
 *
 * Tests for Execution Trace UI components following TDD approach.
 * Tests written before implementation (Task 10.1).
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/trace/execution-trace.test.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ExecutionTracePanel } from './execution-trace-panel'
import { TraceStep } from './trace-step'
import { TraceStepDetails } from './trace-step-details'
import type { ExecutionTrace, ExecutionStep } from '@/lib/skills/types'

/**
 * Task 10.1: Write 4 focused tests for Execution Trace UI
 */
describe('Execution Trace UI', () => {
  /**
   * Test 1: ExecutionTracePanel renders all steps
   *
   * Verifies that the panel correctly displays all execution steps
   * from the trace.
   */
  describe('ExecutionTracePanel', () => {
    it('should render all execution steps', () => {
      // Arrange
      const mockTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'Database Design',
        inputPrompt: 'Create a user database',
        detectedConfidence: 0.95,
        detectionReasoning: 'Detected database-related keywords',
        steps: [
          {
            step: 1,
            description: 'Parse user requirements',
            status: 'completed',
            startedAt: new Date('2026-01-04T10:00:00Z'),
            completedAt: new Date('2026-01-04T10:00:05Z'),
          },
          {
            step: 2,
            description: 'Generate schema definition',
            status: 'completed',
            startedAt: new Date('2026-01-04T10:00:05Z'),
            completedAt: new Date('2026-01-04T10:00:15Z'),
          },
          {
            step: 3,
            description: 'Create migration files',
            status: 'running',
            startedAt: new Date('2026-01-04T10:00:15Z'),
          },
        ],
        status: 'running',
        startedAt: new Date('2026-01-04T10:00:00Z'),
      }

      // Act
      render(<ExecutionTracePanel trace={mockTrace} />)

      // Assert
      expect(screen.getByText('Database Design')).toBeInTheDocument()
      expect(screen.getByText('Parse user requirements')).toBeInTheDocument()
      expect(screen.getByText('Generate schema definition')).toBeInTheDocument()
      expect(screen.getByText('Create migration files')).toBeInTheDocument()
    })

    it('should display task description and timing', () => {
      // Arrange
      const mockTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'API Integration',
        inputPrompt: 'Create REST API endpoints',
        detectedConfidence: 0.88,
        detectionReasoning: 'API-related request detected',
        steps: [],
        status: 'completed',
        durationMs: 5000,
        startedAt: new Date('2026-01-04T10:00:00Z'),
        completedAt: new Date('2026-01-04T10:00:05Z'),
      }

      // Act
      render(<ExecutionTracePanel trace={mockTrace} />)

      // Assert
      expect(screen.getByText('API Integration')).toBeInTheDocument()
      expect(screen.getByText('Create REST API endpoints')).toBeInTheDocument()
      expect(screen.getByText(/5\.0s/)).toBeInTheDocument() // Duration
    })

    it('should show cancel button when execution is running', () => {
      // Arrange
      const mockOnCancel = vi.fn()
      const mockTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'Test Skill',
        inputPrompt: 'Test prompt',
        detectedConfidence: 0.9,
        detectionReasoning: 'Test reasoning',
        steps: [
          {
            step: 1,
            description: 'Running step',
            status: 'running',
            startedAt: new Date(),
          },
        ],
        status: 'running',
        startedAt: new Date(),
      }

      // Act
      render(<ExecutionTracePanel trace={mockTrace} onCancel={mockOnCancel} />)

      // Assert
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).not.toBeDisabled()
    })

    it('should not show cancel button when execution is completed', () => {
      // Arrange
      const mockTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'Test Skill',
        inputPrompt: 'Test prompt',
        detectedConfidence: 0.9,
        detectionReasoning: 'Test reasoning',
        steps: [],
        status: 'completed',
        durationMs: 1000,
        startedAt: new Date(),
        completedAt: new Date(),
      }

      // Act
      render(<ExecutionTracePanel trace={mockTrace} />)

      // Assert
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  /**
   * Test 2: TraceStep shows correct status indicator
   *
   * Verifies that status icons and colors are correctly displayed
   * for each step state.
   */
  describe('TraceStep', () => {
    it('should show pending status indicator (gray)', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 1,
        description: 'Waiting to start',
        status: 'pending',
      }

      // Act
      const { container } = render(<TraceStep step={mockStep} />)

      // Assert
      expect(screen.getByText('Waiting to start')).toBeInTheDocument()
      // Check for gray status indicator (pending)
      const statusElement = container.querySelector('[data-status="pending"]')
      expect(statusElement).toBeInTheDocument()
    })

    it('should show running status indicator (blue pulse)', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 2,
        description: 'Processing data',
        status: 'running',
        startedAt: new Date(),
      }

      // Act
      const { container } = render(<TraceStep step={mockStep} />)

      // Assert
      expect(screen.getByText('Processing data')).toBeInTheDocument()
      // Check for blue pulsing indicator (running)
      const statusElement = container.querySelector('[data-status="running"]')
      expect(statusElement).toBeInTheDocument()
    })

    it('should show completed status indicator (green check)', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 3,
        description: 'Files created',
        status: 'completed',
        startedAt: new Date('2026-01-04T10:00:00Z'),
        completedAt: new Date('2026-01-04T10:00:02Z'),
      }

      // Act
      const { container } = render(<TraceStep step={mockStep} />)

      // Assert
      expect(screen.getByText('Files created')).toBeInTheDocument()
      // Check for green check indicator (completed)
      const statusElement = container.querySelector('[data-status="completed"]')
      expect(statusElement).toBeInTheDocument()
      // Should show duration
      expect(screen.getByText(/2\.0s/)).toBeInTheDocument()
    })

    it('should show failed status indicator (red x)', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 4,
        description: 'Connection failed',
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        error: 'Connection timeout',
      }

      // Act
      const { container } = render(<TraceStep step={mockStep} />)

      // Assert
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      // Check for red x indicator (failed)
      const statusElement = container.querySelector('[data-status="failed"]')
      expect(statusElement).toBeInTheDocument()
    })
  })

  /**
   * Test 3: TraceStepDetails expands to show reasoning
   *
   * Verifies that the expandable section shows detailed information
   * including reasoning, logs, and outputs.
   */
  describe('TraceStepDetails', () => {
    it('should display step reasoning when expanded', async () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 1,
        description: 'Analyze requirements',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        data: {
          reasoning: 'Identified 3 entities: User, Post, Comment',
          logs: ['Parsing input...', 'Entities found: 3'],
        },
      }

      // Act
      const { container } = render(<TraceStepDetails step={mockStep} isExpanded={true} />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Identified 3 entities/)).toBeInTheDocument()
      })
    })

    it('should display MCP server connections used', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 2,
        description: 'Query database',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        data: {
          mcpServers: ['supabase', 'context7'],
        },
      }

      // Act
      render(<TraceStepDetails step={mockStep} isExpanded={true} />)

      // Assert
      expect(screen.getByText(/supabase/)).toBeInTheDocument()
      expect(screen.getByText(/context7/)).toBeInTheDocument()
    })

    it('should display files generated', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 3,
        description: 'Generate files',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        data: {
          outputFiles: ['schema.ts', 'migrations/001_initial.sql'],
        },
      }

      // Act
      render(<TraceStepDetails step={mockStep} isExpanded={true} />)

      // Assert
      expect(screen.getByText(/schema\.ts/)).toBeInTheDocument()
      expect(screen.getByText(/001_initial\.sql/)).toBeInTheDocument()
    })

    it('should format code output with syntax highlighting', () => {
      // Arrange
      const mockStep: ExecutionStep = {
        step: 4,
        description: 'Generate schema',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        data: {
          codeOutput: 'const schema = { users: { id: number } }',
          language: 'typescript',
        },
      }

      // Act
      const { container } = render(<TraceStepDetails step={mockStep} isExpanded={true} />)

      // Assert
      const codeBlock = container.querySelector('code')
      expect(codeBlock).toBeInTheDocument()
      expect(codeBlock?.textContent).toContain('const schema')
    })
  })

  /**
   * Test 4: Real-time updates as execution progresses
   *
   * Verifies that the trace panel updates in real-time as new steps
   * are added or step statuses change.
   */
  describe('Real-time Updates', () => {
    it('should update when trace status changes', async () => {
      // Arrange
      const initialTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'Test Skill',
        inputPrompt: 'Test',
        detectedConfidence: 0.9,
        detectionReasoning: 'Test',
        steps: [
          {
            step: 1,
            description: 'Step 1',
            status: 'running',
            startedAt: new Date(),
          },
        ],
        status: 'running',
        startedAt: new Date(),
      }

      const { rerender } = render(<ExecutionTracePanel trace={initialTrace} />)

      // Act - Update trace with completed step
      const updatedTrace: ExecutionTrace = {
        ...initialTrace,
        steps: [
          {
            step: 1,
            description: 'Step 1',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
          },
        ],
        status: 'completed',
        completedAt: new Date(),
        durationMs: 1000,
      }

      rerender(<ExecutionTracePanel trace={updatedTrace} />)

      // Assert
      await waitFor(() => {
        const statusElement = document.querySelector('[data-status="completed"]')
        expect(statusElement).toBeInTheDocument()
      })
    })

    it('should auto-scroll to current running step', async () => {
      // Arrange
      const mockTrace: ExecutionTrace = {
        traceId: 'trace-123',
        skillId: 'skill-456',
        skillName: 'Multi-Step Skill',
        inputPrompt: 'Execute all steps',
        detectedConfidence: 0.9,
        detectionReasoning: 'Test',
        steps: [
          {
            step: 1,
            description: 'Step 1',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
          },
          {
            step: 2,
            description: 'Step 2',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
          },
          {
            step: 3,
            description: 'Step 3',
            status: 'running',
            startedAt: new Date(),
          },
        ],
        status: 'running',
        startedAt: new Date(),
      }

      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      // Act
      render(<ExecutionTracePanel trace={mockTrace} autoScroll={true} />)

      // Assert
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })
  })
})
