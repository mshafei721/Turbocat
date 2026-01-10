/**
 * Share Modal Component Tests
 * Phase 5: Publish Flow
 *
 * These tests verify the Share Modal UI component:
 * 1. Renders modal with share options
 * 2. Shows shareable link
 * 3. Copy link functionality works
 * 4. Visibility options work
 * 5. Social sharing buttons present
 * 6. QR code toggle works
 *
 * @file __tests__/components/share-modal.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
})

import { ShareModal } from '@/components/turbocat/ShareModal'

describe('ShareModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projectId: 'test-project-123',
    projectName: 'Test Project',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test 1: Modal renders when open
   */
  it('should render modal when isOpen is true', () => {
    render(<ShareModal {...defaultProps} />)

    expect(screen.getByText('Share Project')).toBeInTheDocument()
    expect(screen.getByText('Share Test Project with others')).toBeInTheDocument()
  })

  /**
   * Test 2: Shows shareable link
   */
  it('should display shareable link', () => {
    render(<ShareModal {...defaultProps} />)

    const linkInput = screen.getByDisplayValue(/turbocat\.app\/project\/test-project-123/)
    expect(linkInput).toBeInTheDocument()
  })

  /**
   * Test 3: Uses custom projectUrl if provided
   */
  it('should use custom projectUrl if provided', () => {
    render(
      <ShareModal
        {...defaultProps}
        projectUrl="https://my-custom-app.vercel.app"
      />
    )

    const linkInput = screen.getByDisplayValue('https://my-custom-app.vercel.app')
    expect(linkInput).toBeInTheDocument()
  })

  /**
   * Test 4: Copy button copies link to clipboard
   */
  it('should copy link to clipboard when Copy is clicked', async () => {
    render(<ShareModal {...defaultProps} />)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    expect(mockWriteText).toHaveBeenCalledWith(
      'https://turbocat.app/project/test-project-123'
    )

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })
  })

  /**
   * Test 5: Visibility options are displayed
   */
  it('should display visibility options', () => {
    render(<ShareModal {...defaultProps} />)

    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.getByText('Anyone can view this project')).toBeInTheDocument()

    expect(screen.getByText('Unlisted')).toBeInTheDocument()
    expect(screen.getByText('Only people with the link can view')).toBeInTheDocument()

    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(screen.getByText('Only you can view this project')).toBeInTheDocument()
  })

  /**
   * Test 6: Can change visibility option
   */
  it('should allow changing visibility option', () => {
    render(<ShareModal {...defaultProps} />)

    // Default is unlisted
    const unlistedButton = screen.getByText('Unlisted').closest('button')
    expect(unlistedButton).toHaveClass('border-primary')

    // Click public
    const publicButton = screen.getByText('Public').closest('button')
    fireEvent.click(publicButton!)

    // Public should now be selected
    expect(publicButton).toHaveClass('border-primary')
  })

  /**
   * Test 7: Social share buttons are present
   */
  it('should display social share buttons', () => {
    render(<ShareModal {...defaultProps} />)

    expect(screen.getByText('Share via')).toBeInTheDocument()

    // Check for share buttons (by their aria-labels or icons)
    const buttons = screen.getAllByRole('button')
    // Should have Copy, Email, Twitter, LinkedIn, QR code buttons
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })

  /**
   * Test 8: Email share opens mailto link
   */
  it('should open email share when email button is clicked', () => {
    render(<ShareModal {...defaultProps} />)

    // Find email button (second in Share via section)
    const shareViaSection = screen.getByText('Share via').closest('div')
    const buttons = shareViaSection?.querySelectorAll('button')

    // Email is typically the second button after Copy
    if (buttons && buttons.length > 1) {
      fireEvent.click(buttons[1])
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:'),
        '_blank'
      )
    }
  })

  /**
   * Test 9: QR code toggles on click
   */
  it('should toggle QR code display', () => {
    render(<ShareModal {...defaultProps} />)

    // Initially QR code section should not be visible
    expect(screen.queryByText('Scan to open on mobile')).not.toBeInTheDocument()

    // Find and click QR code button (last button in share via)
    const shareViaSection = screen.getByText('Share via').closest('div')
    const buttons = shareViaSection?.querySelectorAll('button')
    const qrButton = buttons?.[buttons.length - 1]

    if (qrButton) {
      fireEvent.click(qrButton)

      // QR code section should now be visible
      expect(screen.getByText('Scan to open on mobile')).toBeInTheDocument()
    }
  })

  /**
   * Test 10: Invite collaborators section is present
   */
  it('should display invite collaborators section', () => {
    render(<ShareModal {...defaultProps} />)

    expect(screen.getByText('Invite collaborators')).toBeInTheDocument()
    expect(screen.getByText('Work together on this project')).toBeInTheDocument()
  })

  /**
   * Test 11: Done button closes modal
   */
  it('should call onClose when Done is clicked', () => {
    const onClose = vi.fn()
    render(<ShareModal {...defaultProps} onClose={onClose} />)

    const doneButton = screen.getByRole('button', { name: /done/i })
    fireEvent.click(doneButton)

    expect(onClose).toHaveBeenCalled()
  })

  /**
   * Test 12: Modal does not render when closed
   */
  it('should not render content when isOpen is false', () => {
    render(<ShareModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Share Project')).not.toBeInTheDocument()
  })
})
