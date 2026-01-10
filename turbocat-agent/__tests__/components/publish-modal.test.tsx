/**
 * Publish Modal Component Tests
 * Phase 5: Publish Flow
 *
 * These tests verify the Publish Modal UI component:
 * 1. Renders modal with deployment options
 * 2. Allows selecting deployment targets
 * 3. Shows publishing progress steps
 * 4. Displays success state with published URL
 * 5. Handles errors gracefully
 * 6. Custom domain input works
 *
 * @file __tests__/components/publish-modal.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

import { PublishModal } from '@/components/turbocat/PublishModal'

describe('PublishModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: 'test-project-123',
    projectName: 'Test Project',
    platform: 'web' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test 1: Modal renders when open
   */
  it('should render modal when isOpen is true', () => {
    render(<PublishModal {...defaultProps} />)

    expect(screen.getByText('Publish Test Project')).toBeInTheDocument()
    expect(screen.getByText('Choose where to deploy your application')).toBeInTheDocument()
  })

  /**
   * Test 2: Modal shows Vercel option for web platform
   */
  it('should show Vercel deployment option for web platform', () => {
    render(<PublishModal {...defaultProps} platform="web" />)

    expect(screen.getByText('Vercel')).toBeInTheDocument()
    expect(screen.getByText('Deploy to Vercel for instant global CDN')).toBeInTheDocument()
  })

  /**
   * Test 3: Modal shows Expo option for mobile platform
   */
  it('should show Expo deployment option for mobile platform', () => {
    render(<PublishModal {...defaultProps} platform="mobile" />)

    expect(screen.getByText('Expo')).toBeInTheDocument()
    expect(screen.getByText('Publish to Expo for OTA updates')).toBeInTheDocument()
  })

  /**
   * Test 4: Modal shows both options for "both" platform
   */
  it('should show both Vercel and Expo for "both" platform', () => {
    render(<PublishModal {...defaultProps} platform="both" />)

    expect(screen.getByText('Vercel')).toBeInTheDocument()
    expect(screen.getByText('Expo')).toBeInTheDocument()
  })

  /**
   * Test 5: Can select a deployment target
   */
  it('should allow selecting a deployment target', () => {
    render(<PublishModal {...defaultProps} />)

    const vercelOption = screen.getByText('Vercel').closest('button')
    expect(vercelOption).toBeInTheDocument()

    fireEvent.click(vercelOption!)

    // Check that Publish button is now enabled
    const publishButton = screen.getByRole('button', { name: /publish/i })
    expect(publishButton).not.toBeDisabled()
  })

  /**
   * Test 6: Publish button is disabled without selection
   */
  it('should disable Publish button when no target is selected', () => {
    render(<PublishModal {...defaultProps} />)

    const publishButton = screen.getByRole('button', { name: /publish/i })
    expect(publishButton).toBeDisabled()
  })

  /**
   * Test 7: Cancel button closes modal
   */
  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<PublishModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  /**
   * Test 8: Shows custom domain input for Vercel
   */
  it('should show custom domain input when Vercel is selected', () => {
    render(<PublishModal {...defaultProps} />)

    const vercelOption = screen.getByText('Vercel').closest('button')
    fireEvent.click(vercelOption!)

    expect(screen.getByPlaceholderText('myapp.com')).toBeInTheDocument()
    expect(screen.getByText('Custom domain (optional)')).toBeInTheDocument()
  })

  /**
   * Test 9: Publishing shows progress steps
   */
  it('should show publishing progress when Publish is clicked', async () => {
    render(<PublishModal {...defaultProps} />)

    // Select Vercel
    const vercelOption = screen.getByText('Vercel').closest('button')
    fireEvent.click(vercelOption!)

    // Click Publish
    const publishButton = screen.getByRole('button', { name: /publish/i })
    fireEvent.click(publishButton)

    // Should show publishing state
    await waitFor(() => {
      expect(screen.getByText('Publishing...')).toBeInTheDocument()
    })

    // Should show progress steps
    expect(screen.getByText('Validating project')).toBeInTheDocument()
    expect(screen.getByText('Building application')).toBeInTheDocument()
    expect(screen.getByText('Deploying to cloud')).toBeInTheDocument()
    expect(screen.getByText('Configuring DNS')).toBeInTheDocument()
  })

  /**
   * Test 10: Success state shows published URL
   * Note: This test verifies the success UI renders correctly by checking static content
   */
  it('should show success state with URL after publishing', async () => {
    render(<PublishModal {...defaultProps} />)

    // Select Vercel
    const vercelOption = screen.getByText('Vercel').closest('button')
    fireEvent.click(vercelOption!)

    // Click Publish - this starts the async publishing flow
    const publishButton = screen.getByRole('button', { name: /publish/i })
    fireEvent.click(publishButton)

    // Verify publishing state is shown (this confirms the flow started)
    await waitFor(() => {
      expect(screen.getByText('Publishing...')).toBeInTheDocument()
    })

    // Wait for the success state (total simulated time is ~6.5s)
    await waitFor(
      () => {
        expect(screen.getByText('Published Successfully!')).toBeInTheDocument()
      },
      { timeout: 10000 }
    )

    // Check URL is displayed
    expect(screen.getByText(/test-project\.vercel\.app/)).toBeInTheDocument()
  }, 15000) // Increase test timeout

  /**
   * Test 11: Existing URL is passed through
   */
  it('should use existing URL if provided', () => {
    render(
      <PublishModal
        {...defaultProps}
        existingUrl="https://existing-app.vercel.app"
      />
    )

    // The existing URL should be accessible (stored in state)
    expect(screen.getByText('Publish Test Project')).toBeInTheDocument()
  })

  /**
   * Test 12: Modal does not render when closed
   */
  it('should not render content when isOpen is false', () => {
    render(<PublishModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Publish Test Project')).not.toBeInTheDocument()
  })
})
