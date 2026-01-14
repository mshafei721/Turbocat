import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuildingStep } from '../BuildingStep'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('BuildingStep', () => {
  const defaultProps = {
    publishingId: 'test-publishing-id',
    projectId: 'test-project-id',
  }

  const mockPublishingResponse = (status: string, overrides = {}) => ({
    data: {
      publishing: {
        id: 'test-publishing-id',
        status,
        statusMessage: null,
        buildLogs: null,
        ipaUrl: null,
        expoBuildId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        initiatedAt: '2024-01-01T00:00:00Z',
        buildStartedAt: null,
        buildCompletedAt: null,
        submittedAt: null,
        failedAt: null,
        ...overrides,
      },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as any).mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Loading States', () => {
    it('should render initializing state when publishingId is null', () => {
      render(<BuildingStep {...defaultProps} publishingId={null} />)

      expect(screen.getByText('Initializing build...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    })

    it('should render loading state before status is fetched', () => {
      ;(fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<BuildingStep {...defaultProps} />)

      expect(screen.getByText('Loading status...')).toBeInTheDocument()
    })
  })

  describe('Status Timeline', () => {
    it('should render timeline with correct stages for INITIATED status', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('INITIATED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Initiating')).toBeInTheDocument()
      })

      expect(screen.getByText('Building')).toBeInTheDocument()
      expect(screen.getByText('Submitting')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('should show active state for current stage', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Building Your iOS App')).toBeInTheDocument()
      })
    })

    it('should show completed state for previous stages', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Submitting to App Store')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Indicator', () => {
    it('should show 10% progress for INITIATED status', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('INITIATED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('10% complete')).toBeInTheDocument()
      })
    })

    it('should show 40% progress for BUILDING status', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('40% complete')).toBeInTheDocument()
      })
    })

    it('should show 80% progress for SUBMITTING status', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('80% complete')).toBeInTheDocument()
      })
    })

    it('should show elapsed time counter', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Elapsed:/)).toBeInTheDocument()
      })
    })
  })

  describe('Polling Mechanism', () => {
    it('should poll API every 5 seconds', async () => {
      vi.useFakeTimers()
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      await vi.advanceTimersByTimeAsync(5000)

      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      })

      await vi.advanceTimersByTimeAsync(5000)

      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3)
      })

      vi.useRealTimers()
    })

    it('should stop polling when status is SUBMITTED', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      // Wait a bit to ensure polling has stopped
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not poll again
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should stop polling when status is FAILED', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('FAILED', {
            statusMessage: 'Build failed',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })

      // Wait a bit to ensure polling has stopped
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not poll again
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle network errors gracefully', async () => {
      ;(fetch as any).mockRejectedValue(new Error('Network error'))

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Connection lost. Retrying...')).toBeInTheDocument()
      })
    })

    it('should show timeout error after 30 minutes', async () => {
      vi.useFakeTimers()
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      // Advance 30 minutes + 1 poll
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000 + 5000)

      await vi.waitFor(() => {
        expect(
          screen.getByText('Build timeout - the process took too long. Please try again.'),
        ).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('Build Logs', () => {
    it('should render build logs when available', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            buildLogs: 'Build started\nCompiling...\nBuild in progress',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })
    })

    it('should expand logs accordion when clicked', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            buildLogs: 'Build started\nCompiling...\nBuild in progress',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })

      const logsButton = screen.getByText('View Build Logs')
      await user.click(logsButton)

      await waitFor(() => {
        expect(screen.getByText('Copy Logs')).toBeInTheDocument()
        expect(screen.getByText('Download Logs')).toBeInTheDocument()
      })
    })

    it('should copy logs to clipboard', async () => {
      const user = userEvent.setup({ delay: null })
      const mockLogs = 'Build started\nCompiling...\nBuild in progress'
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            buildLogs: mockLogs,
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })

      const logsButton = screen.getByText('View Build Logs')
      await user.click(logsButton)

      const copyButton = screen.getByText('Copy Logs')
      await user.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockLogs)
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
    })

    it('should download logs as file', async () => {
      const user = userEvent.setup({ delay: null })
      const mockLogs = 'Build started\nCompiling...\nBuild in progress'
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            buildLogs: mockLogs,
          }),
      })

      // Mock document methods
      const mockClick = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      document.createElement = vi.fn().mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      }) as any
      document.body.appendChild = mockAppendChild
      document.body.removeChild = mockRemoveChild

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })

      const logsButton = screen.getByText('View Build Logs')
      await user.click(logsButton)

      const downloadButton = screen.getByText('Download Logs')
      await user.click(downloadButton)

      expect(mockClick).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Build logs downloaded')
    })

    it('should show line numbers in logs', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            buildLogs: 'Line 1\nLine 2\nLine 3',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })

      const logsButton = screen.getByText('View Build Logs')
      await user.click(logsButton)

      await waitFor(() => {
        expect(screen.getByText('(3 lines)')).toBeInTheDocument()
      })
    })
  })

  describe('Success State', () => {
    it('should render success state when status is SUBMITTED', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Your app has been successfully submitted to the App Store.'),
      ).toBeInTheDocument()
    })

    it('should show next steps information', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('What happens next?')).toBeInTheDocument()
      })

      expect(screen.getByText(/Your app is now being reviewed by Apple/)).toBeInTheDocument()
      expect(screen.getByText(/24-48 hours/)).toBeInTheDocument()
    })

    it('should show App Store Connect link', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Track Your Submission')).toBeInTheDocument()
      })

      const link = screen.getByRole('link', { name: /Open App Store Connect/ })
      expect(link).toHaveAttribute('href', 'https://appstoreconnect.apple.com')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should call onComplete callback when build succeeds', async () => {
      const mockOnComplete = vi.fn()
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} onComplete={mockOnComplete} />)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should show close button when onClose prop provided', async () => {
      const mockOnClose = vi.fn()
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('SUBMITTED'),
      })

      render(<BuildingStep {...defaultProps} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
      })
    })
  })

  describe('Failed State', () => {
    it('should render failed state when status is FAILED', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('FAILED', {
            statusMessage: 'Build compilation failed',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Build Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Build compilation failed')).toBeInTheDocument()
    })

    it('should show common errors and solutions', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('FAILED', {
            statusMessage: 'Invalid credentials',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Common Issues & Solutions')).toBeInTheDocument()
      })

      const troubleshootButton = screen.getByText('Common Issues & Solutions')
      await user.click(troubleshootButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid Apple Credentials')).toBeInTheDocument()
        expect(screen.getByText('Bundle ID Conflict')).toBeInTheDocument()
        expect(screen.getByText('Missing or Invalid Icon')).toBeInTheDocument()
        expect(screen.getByText('Build Timeout')).toBeInTheDocument()
      })
    })

    it('should show retry button', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('FAILED', {
            statusMessage: 'Build failed',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry Publishing' })).toBeInTheDocument()
      })
    })

    it('should call retry API when retry button clicked', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            mockPublishingResponse('FAILED', {
              statusMessage: 'Build failed',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { result: 'success' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPublishingResponse('INITIATED'),
        })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry Publishing' })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Retry Publishing' })
      await user.click(retryButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/v1/publishing/${defaultProps.publishingId}/retry`,
          { method: 'POST' },
        )
      })

      expect(toast.success).toHaveBeenCalledWith('Retrying publishing...')
    })

    it('should call onRetry callback when retry succeeds', async () => {
      const user = userEvent.setup({ delay: null })
      const mockOnRetry = vi.fn()
      ;(fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            mockPublishingResponse('FAILED', {
              statusMessage: 'Build failed',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { result: 'success' } }),
        })

      render(<BuildingStep {...defaultProps} onRetry={mockOnRetry} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry Publishing' })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Retry Publishing' })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalled()
      })
    })

    it('should show error toast if retry fails', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            mockPublishingResponse('FAILED', {
              statusMessage: 'Build failed',
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: { message: 'Retry not allowed' },
          }),
        })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry Publishing' })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: 'Retry Publishing' })
      await user.click(retryButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Retry not allowed')
      })
    })

    it('should show build logs in failed state if available', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('FAILED', {
            statusMessage: 'Build failed',
            buildLogs: 'Error: Compilation failed\nError details...',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('View Build Logs')).toBeInTheDocument()
      })
    })
  })

  describe('Status Messages', () => {
    it('should show custom status message when available', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            statusMessage: 'Custom build message',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Custom build message')).toBeInTheDocument()
      })
    })
  })

  describe('Expo Build Link', () => {
    it('should show Expo build link when expoBuildId available', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () =>
          mockPublishingResponse('BUILDING', {
            expoBuildId: 'expo-build-123',
          }),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Expo Build Details')).toBeInTheDocument()
      })

      const link = screen.getByRole('link', { name: /View build on Expo/ })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('href')).toContain('expo-build-123')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-live regions for status updates', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        const statusElements = screen.getAllByRole('status')
        expect(statusElements.length).toBeGreaterThan(0)
        expect(statusElements[0]).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should have aria-busy during polling', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      render(<BuildingStep {...defaultProps} />)

      await waitFor(() => {
        const statusElement = screen.getByRole('status')
        expect(statusElement).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup polling interval on unmount', async () => {
      vi.useFakeTimers()
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPublishingResponse('BUILDING'),
      })

      const { unmount } = render(<BuildingStep {...defaultProps} />)

      await vi.waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      const callCountBeforeUnmount = (fetch as any).mock.calls.length

      unmount()

      await vi.advanceTimersByTimeAsync(10000)

      // Should not call fetch after unmount
      expect((fetch as any).mock.calls.length).toBe(callCountBeforeUnmount)

      vi.useRealTimers()
    })
  })
})
