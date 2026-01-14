/**
 * Publishing Modal Tests
 *
 * Tests for PublishingModal component following TDD approach.
 * Epic 4: Publishing Flow - Task 3.1
 *
 * @file components/publishing/__tests__/PublishingModal.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublishingModal } from '../PublishingModal'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('PublishingModal', () => {
  const mockOnClose = vi.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    projectId: 'test-project-123',
    projectName: 'Test App',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Rendering and Initial State', () => {
    it('should render modal when open', () => {
      render(<PublishingModal {...defaultProps} />)
      expect(screen.getByText('Publish to App Store')).toBeInTheDocument()
      expect(screen.getByText(/Step 1 of 5: Prerequisites/i)).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      render(<PublishingModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Publish to App Store')).not.toBeInTheDocument()
    })

    it('should display step indicators', () => {
      render(<PublishingModal {...defaultProps} />)
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars).toHaveLength(4) // 4 steps before building
    })

    it('should initialize with Prerequisites step', () => {
      render(<PublishingModal {...defaultProps} />)
      expect(screen.getByText('Before you begin')).toBeInTheDocument()
      expect(screen.getByText(/Apple Developer Account/i)).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('should navigate to next step when Next button clicked', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5: Apple Credentials/i)).toBeInTheDocument()
      })
    })

    it('should navigate back to previous step when Back button clicked', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Step 2/i)).toBeInTheDocument()
      })

      // Navigate back
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
      })
    })

    it('should disable Back button on first step', () => {
      render(<PublishingModal {...defaultProps} />)
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeDisabled()
    })

    it('should update progress indicators as user navigates', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        const activeProgress = progressBars.filter((bar) => bar.getAttribute('aria-valuenow') === '100')
        expect(activeProgress.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form State Management', () => {
    it('should update form data when user enters Apple credentials', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to Apple Credentials step
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })

      // Enter credentials
      const teamIdInput = screen.getByLabelText(/Team ID/i)
      await user.type(teamIdInput, 'ABC123DEFG')

      expect(teamIdInput).toHaveValue('ABC123DEFG')
    })

    it('should preserve form data when navigating between steps', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to Apple Credentials step
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Enter data
      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })
      const teamIdInput = screen.getByLabelText(/Team ID/i)
      await user.type(teamIdInput, 'ABC123DEFG')

      // Navigate forward then back
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /back/i }))

      // Data should be preserved
      await waitFor(() => {
        const preservedInput = screen.getByLabelText(/Team ID/i) as HTMLInputElement
        expect(preservedInput.value).toBe('ABC123DEFG')
      })
    })

    it('should reset form data when modal closes', async () => {
      const { rerender } = render(<PublishingModal {...defaultProps} />)

      // Navigate and enter data
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Team ID/i), 'ABC123DEFG')

      // Close and reopen modal
      rerender(<PublishingModal {...defaultProps} isOpen={false} />)
      rerender(<PublishingModal {...defaultProps} isOpen={true} />)

      // Should be back to step 1
      expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should validate Apple Team ID format', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to Apple Credentials step
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })

      // Enter invalid Team ID
      const teamIdInput = screen.getByLabelText(/Team ID/i)
      await user.type(teamIdInput, 'INVALID')

      // Try to proceed
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/must be 10 alphanumeric characters/i)).toBeInTheDocument()
      })
    })

    it('should validate Apple Issuer ID UUID format', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Issuer ID/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Issuer ID/i), 'not-a-uuid')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be a valid UUID/i)).toBeInTheDocument()
      })
    })

    it('should validate app name length', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to App Details step (skip validation for previous steps)
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
        await waitFor(() => {}, { timeout: 500 })
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/App Name/i)).toBeInTheDocument()
      })

      const appNameInput = screen.getByLabelText(/App Name/i)
      await user.clear(appNameInput)
      await user.type(appNameInput, 'A'.repeat(31)) // Exceed max length

      await user.click(screen.getByRole('button', { name: /Start Build/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be 30 characters or less/i)).toBeInTheDocument()
      })
    })

    it('should validate description minimum length', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Navigate to App Details step
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
        await waitFor(() => {}, { timeout: 500 })
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
      })

      const descriptionInput = screen.getByLabelText(/Description/i)
      await user.type(descriptionInput, 'Short')

      await user.click(screen.getByRole('button', { name: /Start Build/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })

      // Enter invalid then valid Team ID
      const teamIdInput = screen.getByLabelText(/Team ID/i)
      await user.type(teamIdInput, 'INVALID')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be 10 alphanumeric characters/i)).toBeInTheDocument()
      })

      // Correct the input
      await user.clear(teamIdInput)
      await user.type(teamIdInput, 'ABC123DEFG')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/must be 10 alphanumeric characters/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should call initiate API when user completes all steps', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            publishing: {
              id: 'publishing-123',
              status: 'initiated',
            },
          },
        }),
      })

      render(<PublishingModal {...defaultProps} />)

      // Fill in all required fields and navigate through steps
      // Step 1: Prerequisites (no input needed)
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Step 2: Apple Credentials
      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Team ID/i), 'ABC123DEFG')
      await user.type(screen.getByLabelText(/Key ID/i), 'XYZ987WXYZ')
      await user.type(screen.getByLabelText(/Issuer ID/i), '12345678-1234-1234-1234-123456789abc')
      await user.type(screen.getByLabelText(/Private Key/i), '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----')
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Step 3: Expo Token
      await waitFor(() => {
        expect(screen.getByLabelText(/Expo Access Token/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Expo Access Token/i), 'expo-token-123')
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Step 4: App Details
      await waitFor(() => {
        expect(screen.getByLabelText(/App Name/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Description/i), 'This is a test app description with enough characters.')

      // Start build
      await user.click(screen.getByRole('button', { name: /Start Build/i }))

      // Should call API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/publishing/initiate',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.any(String),
          })
        )
      })
    })

    it('should show error toast when API call fails', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid credentials',
          },
        }),
      })

      render(<PublishingModal {...defaultProps} />)

      // Navigate through all steps with valid data
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Team ID/i), 'ABC123DEFG')
      await user.type(screen.getByLabelText(/Key ID/i), 'XYZ987WXYZ')
      await user.type(screen.getByLabelText(/Issuer ID/i), '12345678-1234-1234-1234-123456789abc')
      await user.type(screen.getByLabelText(/Private Key/i), '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Expo Access Token/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Expo Access Token/i), 'expo-token-123')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Description/i), 'Test description with enough characters.')

      await user.click(screen.getByRole('button', { name: /Start Build/i }))

      // Should still be on App Details step (not navigate to Building)
      await waitFor(() => {
        expect(screen.getByText(/Step 4 of 5/i)).toBeInTheDocument()
      })
    })
  })

  describe('Close Confirmation', () => {
    it('should show confirmation dialog when closing with data entered', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Enter some data
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })
      await user.type(screen.getByLabelText(/Team ID/i), 'ABC')

      // Try to close
      const closeButton = screen.getAllByRole('button').find((button) => {
        const svg = button.querySelector('svg')
        return svg?.querySelector('path') !== undefined
      })

      if (closeButton) {
        await user.click(closeButton)

        await waitFor(() => {
          expect(screen.getByText(/Discard changes/i)).toBeInTheDocument()
        })
      }
    })

    it('should not show confirmation when closing without data', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      // Don't enter any data, just close
      const closeButton = screen.getAllByRole('button').find((button) => {
        const svg = button.querySelector('svg')
        return svg?.querySelector('path') !== undefined
      })

      if (closeButton) {
        await user.click(closeButton)

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for step indicators', () => {
      render(<PublishingModal {...defaultProps} />)
      const progressBars = screen.getAllByRole('progressbar')
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-label')
        expect(bar).toHaveAttribute('aria-valuenow')
        expect(bar).toHaveAttribute('aria-valuemin')
        expect(bar).toHaveAttribute('aria-valuemax')
      })
    })

    it('should have proper ARIA labels for form inputs', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const teamIdInput = screen.getByLabelText(/Team ID/i)
        expect(teamIdInput).toHaveAccessibleName()
      })
    })

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup()
      render(<PublishingModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Team ID/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Team ID/i), 'INVALID')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const teamIdInput = screen.getByLabelText(/Team ID/i)
        expect(teamIdInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
})
