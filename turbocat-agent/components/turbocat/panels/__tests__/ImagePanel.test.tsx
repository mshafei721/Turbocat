/**
 * ImagePanel Component Tests
 *
 * Tests for the ImagePanel component (representative panel test):
 * - Rendering with form fields
 * - Form validation (required fields)
 * - State updates (checkboxes, radio, number input)
 * - Prompt generation
 * - Close and cancel handlers
 * - Insert button behavior
 *
 * @module components/turbocat/panels/__tests__/ImagePanel.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePanel } from '../ImagePanel'

describe('ImagePanel', () => {
  const mockOnInsert = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render panel with title', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      expect(screen.getByText('Add Image Upload')).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('Close panel')
      expect(closeButton).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      // Source checkboxes
      expect(screen.getByLabelText('Camera')).toBeInTheDocument()
      expect(screen.getByLabelText('Gallery')).toBeInTheDocument()

      // Max size input
      expect(screen.getByLabelText('Max Size (MB):')).toBeInTheDocument()

      // Format checkboxes
      expect(screen.getByLabelText('JPG')).toBeInTheDocument()
      expect(screen.getByLabelText('PNG')).toBeInTheDocument()
      expect(screen.getByLabelText('HEIC')).toBeInTheDocument()
      expect(screen.getByLabelText('GIF')).toBeInTheDocument()

      // Aspect ratio radios
      expect(screen.getByLabelText('Free')).toBeInTheDocument()
      expect(screen.getByLabelText('Square')).toBeInTheDocument()
      expect(screen.getByLabelText('16:9')).toBeInTheDocument()
      expect(screen.getByLabelText('4:3')).toBeInTheDocument()
    })

    it('should render Cancel and Insert buttons', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Insert')).toBeInTheDocument()
    })

    it('should render modal overlay', () => {
      const { container } = render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const modal = container.querySelector('.fixed.inset-0')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Default Values', () => {
    it('should have default source values checked', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      // Radix UI checkboxes use data-state attribute
      const cameraCheckbox = screen.getByLabelText('Camera')
      const galleryCheckbox = screen.getByLabelText('Gallery')

      expect(cameraCheckbox).toHaveAttribute('data-state', 'checked')
      expect(galleryCheckbox).toHaveAttribute('data-state', 'checked')
    })

    it('should have default max size of 5MB', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const maxSizeInput = screen.getByLabelText('Max Size (MB):') as HTMLInputElement
      expect(maxSizeInput.value).toBe('5')
    })

    it('should have default formats checked', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const jpgCheckbox = screen.getByLabelText('JPG')
      const pngCheckbox = screen.getByLabelText('PNG')
      const heicCheckbox = screen.getByLabelText('HEIC')
      const gifCheckbox = screen.getByLabelText('GIF')

      expect(jpgCheckbox).toHaveAttribute('data-state', 'checked')
      expect(pngCheckbox).toHaveAttribute('data-state', 'checked')
      expect(heicCheckbox).toHaveAttribute('data-state', 'checked')
      expect(gifCheckbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('should have default aspect ratio of 16:9', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const ratio169 = screen.getByLabelText('16:9')
      expect(ratio169).toHaveAttribute('data-state', 'checked')
    })
  })

  describe('Form Interactions', () => {
    it('should toggle source checkbox on click', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const cameraCheckbox = screen.getByLabelText('Camera')
      expect(cameraCheckbox).toHaveAttribute('data-state', 'checked')

      await user.click(cameraCheckbox)

      await waitFor(() => {
        expect(cameraCheckbox).toHaveAttribute('data-state', 'unchecked')
      })
    })

    it('should update max size on input change', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const maxSizeInput = screen.getByLabelText('Max Size (MB):') as HTMLInputElement

      // Select all and type new value
      await user.tripleClick(maxSizeInput)
      await user.keyboard('10')

      await waitFor(() => {
        expect(maxSizeInput.value).toBe('10')
      })
    })

    it('should toggle format checkbox on click', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const gifCheckbox = screen.getByLabelText('GIF')
      expect(gifCheckbox).toHaveAttribute('data-state', 'unchecked')

      await user.click(gifCheckbox)

      await waitFor(() => {
        expect(gifCheckbox).toHaveAttribute('data-state', 'checked')
      })
    })

    it('should update aspect ratio on radio selection', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const squareRadio = screen.getByLabelText('Square')
      expect(squareRadio).toHaveAttribute('data-state', 'unchecked')

      await user.click(squareRadio)

      await waitFor(() => {
        expect(squareRadio).toHaveAttribute('data-state', 'checked')
      })
    })
  })

  describe('Form Validation', () => {
    it('should disable Insert button when no source selected', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const insertButton = screen.getByText('Insert') as HTMLButtonElement
      expect(insertButton.disabled).toBe(false)

      // Uncheck both sources
      const cameraCheckbox = screen.getByLabelText('Camera')
      const galleryCheckbox = screen.getByLabelText('Gallery')

      await user.click(cameraCheckbox)
      await user.click(galleryCheckbox)

      await waitFor(() => {
        expect(insertButton.disabled).toBe(true)
      })
    })

    it('should disable Insert button when no format selected', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const insertButton = screen.getByText('Insert') as HTMLButtonElement

      // Uncheck all formats
      const jpgCheckbox = screen.getByLabelText('JPG')
      const pngCheckbox = screen.getByLabelText('PNG')
      const heicCheckbox = screen.getByLabelText('HEIC')

      await user.click(jpgCheckbox)
      await user.click(pngCheckbox)
      await user.click(heicCheckbox)

      await waitFor(() => {
        expect(insertButton.disabled).toBe(true)
      })
    })

    it('should enable Insert button when validation passes', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const insertButton = screen.getByText('Insert') as HTMLButtonElement

      // Start with invalid state (no sources)
      const cameraCheckbox = screen.getByLabelText('Camera')
      const galleryCheckbox = screen.getByLabelText('Gallery')
      await user.click(cameraCheckbox)
      await user.click(galleryCheckbox)

      await waitFor(() => {
        expect(insertButton.disabled).toBe(true)
      })

      // Make valid by checking camera
      await user.click(cameraCheckbox)

      await waitFor(() => {
        expect(insertButton.disabled).toBe(false)
      })
    })
  })

  describe('Close Handlers', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('Close panel')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Prompt Generation', () => {
    it('should generate correct prompt with default values', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const insertButton = screen.getByText('Insert')
      await user.click(insertButton)

      expect(mockOnInsert).toHaveBeenCalledWith(
        'Add image upload with camera and gallery access, max 5MB, support JPG/PNG/HEIC formats, 16:9 aspect ratio',
      )
    })

    it('should generate prompt with single source', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      // Uncheck gallery
      const galleryCheckbox = screen.getByLabelText('Gallery')
      await user.click(galleryCheckbox)

      const insertButton = screen.getByText('Insert')
      await user.click(insertButton)

      expect(mockOnInsert).toHaveBeenCalledWith(
        expect.stringContaining('with camera access'),
      )
    })

    it('should generate prompt with custom max size', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const maxSizeInput = screen.getByLabelText('Max Size (MB):')
      // Select all and replace
      await user.tripleClick(maxSizeInput)
      await user.keyboard('20')

      const insertButton = screen.getByText('Insert')
      await user.click(insertButton)

      expect(mockOnInsert).toHaveBeenCalledWith(expect.stringContaining('max 20MB'))
    })

    it('should generate prompt with custom formats', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      // Uncheck HEIC, check GIF
      const heicCheckbox = screen.getByLabelText('HEIC')
      const gifCheckbox = screen.getByLabelText('GIF')
      await user.click(heicCheckbox)
      await user.click(gifCheckbox)

      const insertButton = screen.getByText('Insert')
      await user.click(insertButton)

      expect(mockOnInsert).toHaveBeenCalledWith(
        expect.stringContaining('support JPG/PNG/GIF formats'),
      )
    })

    it('should generate prompt with custom aspect ratio', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const squareRadio = screen.getByLabelText('Square')
      await user.click(squareRadio)

      const insertButton = screen.getByText('Insert')
      await user.click(insertButton)

      expect(mockOnInsert).toHaveBeenCalledWith(expect.stringContaining('Square aspect ratio'))
    })

    it('should not call onInsert when validation fails', async () => {
      const user = userEvent.setup()
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      // Uncheck all sources
      const cameraCheckbox = screen.getByLabelText('Camera')
      const galleryCheckbox = screen.getByLabelText('Gallery')
      await user.click(cameraCheckbox)
      await user.click(galleryCheckbox)

      const insertButton = screen.getByText('Insert') as HTMLButtonElement
      expect(insertButton.disabled).toBe(true)

      // Try to click disabled button (won't fire event)
      await user.click(insertButton)

      expect(mockOnInsert).not.toHaveBeenCalled()
    })
  })

  describe('Styling and Layout', () => {
    it('should have modal overlay with proper classes', () => {
      const { container } = render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(overlay).toBeInTheDocument()
    })

    it('should have panel card with proper width', () => {
      const { container } = render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const panel = container.querySelector('.w-\\[400px\\]')
      expect(panel).toBeInTheDocument()
    })

    it('should have scrollable content area', () => {
      const { container } = render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const scrollArea = container.querySelector('.overflow-y-auto')
      expect(scrollArea).toBeInTheDocument()
    })

    it('should have animation classes', () => {
      const { container } = render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const panel = container.querySelector('.animate-in')
      expect(panel).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const labels = screen.getAllByRole('checkbox')
      labels.forEach((checkbox) => {
        const id = checkbox.getAttribute('id')
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          expect(label).toBeInTheDocument()
        }
      })
    })

    it('should have aria-label on close button', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('Close panel')
      expect(closeButton).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2) // Close, Cancel, Insert
    })

    it('should have proper input types', () => {
      render(<ImagePanel onInsert={mockOnInsert} onClose={mockOnClose} />)

      const maxSizeInput = screen.getByLabelText('Max Size (MB):') as HTMLInputElement
      expect(maxSizeInput.type).toBe('number')
    })
  })
})
