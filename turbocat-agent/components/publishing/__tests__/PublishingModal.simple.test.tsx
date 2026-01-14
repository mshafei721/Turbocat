/**
 * Simple Publishing Modal Tests
 *
 * Simplified tests to verify basic functionality.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublishingModal } from '../PublishingModal'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('PublishingModal - Basic Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: 'test-project-123',
    projectName: 'Test App',
  }

  it('should render modal when open', () => {
    render(<PublishingModal {...defaultProps} />)
    expect(screen.getByText('Publish to App Store')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<PublishingModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Publish to App Store')).not.toBeInTheDocument()
  })

  it('should display Prerequisites step initially', () => {
    render(<PublishingModal {...defaultProps} />)
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument()
    expect(screen.getByText('Before you begin')).toBeInTheDocument()
  })

  it('should have Next and Back buttons', () => {
    render(<PublishingModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('should disable Back button on first step', () => {
    render(<PublishingModal {...defaultProps} />)
    const backButton = screen.getByRole('button', { name: /back/i })
    expect(backButton).toBeDisabled()
  })
})
