import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppDetailsStep } from '../AppDetailsStep'
import type { PublishingFormData } from '../PublishingModal'

// Mock Image constructor for icon preview testing
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src: string = ''

  constructor() {
    setTimeout(() => {
      if (this.src.includes('valid-icon.png')) {
        this.onload?.()
      } else if (this.src.includes('invalid-icon.png')) {
        this.onerror?.()
      }
    }, 0)
  }
}

global.Image = MockImage as any

describe('AppDetailsStep', () => {
  const mockUpdateFormData = vi.fn()
  const defaultFormData: Partial<PublishingFormData> = {
    appName: '',
    description: '',
    category: '',
    ageRating: '4+',
    supportUrl: '',
    iconUrl: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders all required form fields', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Check header
      expect(screen.getByText('App Details')).toBeInTheDocument()
      expect(screen.getByText(/Provide information about your app/)).toBeInTheDocument()

      // Check form fields
      expect(screen.getByLabelText(/App Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/App Description/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Age Rating/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Support URL/)).toBeInTheDocument()
      expect(screen.getByLabelText(/App Icon URL/)).toBeInTheDocument()
    })

    it('renders optional field indicators', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Support URL and Icon URL should show (Optional)
      const optionalLabels = screen.getAllByText(/\(Optional\)/)
      expect(optionalLabels).toHaveLength(2)
    })

    it('renders required field indicators', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // App Name, Description, Category, and Age Rating should have asterisks
      const requiredAsterisks = screen.getAllByText('*')
      expect(requiredAsterisks.length).toBeGreaterThanOrEqual(4)
    })

    it('renders App Store Guidelines accordion', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByText('App Store Guidelines & Requirements')).toBeInTheDocument()
    })

    it('renders Bundle ID preview field', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByLabelText(/Bundle ID/)).toBeInTheDocument()
      expect(screen.getByDisplayValue('com.turbocat.myapp')).toBeInTheDocument()
    })

    it('renders final info alert', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(
        screen.getByText(/you can review and modify these details in your App Store Connect account/)
      ).toBeInTheDocument()
    })
  })

  describe('App Name Field', () => {
    it('updates app name on input', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      await user.type(input, 'My App')

      expect(mockUpdateFormData).toHaveBeenCalledWith({ appName: 'M' })
      expect(mockUpdateFormData).toHaveBeenCalledWith({ appName: 'y' })
    })

    it('displays character counter for app name', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'Test App' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByText('8/30')).toBeInTheDocument()
    })

    it('enforces 30 character limit', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Name/) as HTMLInputElement
      expect(input.maxLength).toBe(30)
    })

    it('shows validation error for app name', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ appName: 'App name is required' }}
        />
      )

      expect(screen.getByText('App name is required')).toBeInTheDocument()
    })

    it('trims whitespace on blur', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: '  Test  ' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      await user.click(input)
      await user.tab() // blur

      expect(mockUpdateFormData).toHaveBeenCalledWith({ appName: 'Test' })
    })
  })

  describe('Description Field', () => {
    it('updates description on input', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const textarea = screen.getByLabelText(/App Description/)
      await user.type(textarea, 'This is my app description')

      expect(mockUpdateFormData).toHaveBeenCalled()
    })

    it('displays character counter for description', () => {
      const descriptionText = 'Test description here'
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, description: descriptionText }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // The character count is displayed in the format: {length}/4000 (min 10)
      const charCount = descriptionText.length
      const counterPattern = new RegExp(`${charCount}/4000.*min 10`)
      expect(screen.getByText(counterPattern)).toBeInTheDocument()
    })

    it('enforces 4000 character limit', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const textarea = screen.getByLabelText(/App Description/) as HTMLTextAreaElement
      expect(textarea.maxLength).toBe(4000)
    })

    it('shows validation error for description', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ description: 'Description must be at least 10 characters' }}
        />
      )

      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument()
    })
  })

  describe('Category Field', () => {
    it('renders category select', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const select = screen.getByRole('combobox', { name: /Category/ })
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Select a category')).toBeInTheDocument()
    })

    it('displays selected category', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, category: 'Business' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Category select should show the selected value
      expect(screen.getByText('Business')).toBeInTheDocument()
    })

    it('shows validation error for category', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ category: 'Category is required' }}
        />
      )

      expect(screen.getByText('Category is required')).toBeInTheDocument()
    })
  })

  describe('Age Rating Field', () => {
    it('renders age rating select', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const select = screen.getByRole('combobox', { name: /Age Rating/ })
      expect(select).toBeInTheDocument()
      // Default value is 4+
      expect(screen.getByText('4+')).toBeInTheDocument()
    })

    it('displays age rating descriptions in options', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const select = screen.getByRole('combobox', { name: /Age Rating/ })
      await user.click(select)

      await waitFor(() => {
        expect(screen.getByText('No objectionable content')).toBeInTheDocument()
      })
    })

    it('displays selected age rating', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, ageRating: '12+' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Age rating select should show the selected value
      expect(screen.getByText('12+')).toBeInTheDocument()
    })
  })

  describe('Support URL Field', () => {
    it('updates support URL on input', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/Support URL/)
      await user.type(input, 'https://example.com')

      expect(mockUpdateFormData).toHaveBeenCalled()
    })

    it('shows validation error for invalid URL', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ supportUrl: 'Support URL must be a valid URL' }}
        />
      )

      expect(screen.getByText('Support URL must be a valid URL')).toBeInTheDocument()
    })

    it('trims whitespace on blur', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, supportUrl: '  https://example.com  ' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/Support URL/)
      await user.click(input)
      await user.tab() // blur

      expect(mockUpdateFormData).toHaveBeenCalledWith({ supportUrl: 'https://example.com' })
    })
  })

  describe('Icon URL Field', () => {
    it('updates icon URL on input', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Icon URL/)
      await user.type(input, 'https://example.com/icon.png')

      expect(mockUpdateFormData).toHaveBeenCalled()
    })

    it('shows validation error for invalid URL', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ iconUrl: 'Icon URL must be a valid URL' }}
        />
      )

      expect(screen.getByText('Icon URL must be a valid URL')).toBeInTheDocument()
    })

    it('shows loading spinner while loading icon', async () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, iconUrl: 'https://example.com/valid-icon.png' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Should show preview section
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument()
      })
    })

    it('displays icon preview when URL is valid', async () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, iconUrl: 'https://example.com/valid-icon.png' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      await waitFor(() => {
        const img = screen.getByAltText('App icon preview')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://example.com/valid-icon.png')
      })
    })

    it('shows preview section when icon URL is provided', async () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, iconUrl: 'https://example.com/invalid-icon.png' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      // Preview section should be visible
      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Bundle ID Preview', () => {
    it('generates bundle ID from app name', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'My Awesome App' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByDisplayValue('com.turbocat.myawesomeapp')).toBeInTheDocument()
    })

    it('sanitizes app name in bundle ID', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'My-App! 123' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByDisplayValue('com.turbocat.myapp123')).toBeInTheDocument()
    })

    it('shows default bundle ID when app name is empty', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: '' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByDisplayValue('com.turbocat.myapp')).toBeInTheDocument()
    })

    it('bundle ID field is read-only', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/Bundle ID/) as HTMLInputElement
      expect(input.readOnly).toBe(true)
      expect(input.disabled).toBe(true)
    })
  })

  describe('Character Counters', () => {
    it('shows character counter in muted color when below minimum', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: '' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const counter = screen.getByText('0/30')
      expect(counter).toHaveClass('text-muted-foreground')
    })

    it('shows character counter in success color when within valid range', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'Valid App Name' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const counter = screen.getByText('14/30')
      expect(counter).toHaveClass('text-success')
    })

    it('shows character counter for description with minimum indicator', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, description: 'Short' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByText('5/4000 (min 10)')).toBeInTheDocument()
    })
  })

  describe('Validation Icons', () => {
    it('shows checkmark icon for valid app name', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'Valid App' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const validIcon = screen.getByLabelText('Valid')
      expect(validIcon).toBeInTheDocument()
    })

    it('shows error icon for invalid field', () => {
      render(
        <AppDetailsStep
          formData={{ ...defaultFormData, appName: 'Test' }}
          updateFormData={mockUpdateFormData}
          validationErrors={{ appName: 'App name is required' }}
        />
      )

      const invalidIcon = screen.getByLabelText('Invalid')
      expect(invalidIcon).toBeInTheDocument()
    })
  })

  describe('App Store Guidelines Accordion', () => {
    it('expands guidelines section on click', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const trigger = screen.getByText('App Store Guidelines & Requirements')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Key Requirements')).toBeInTheDocument()
        expect(screen.getByText('Age Rating Guide')).toBeInTheDocument()
        expect(screen.getByText('Helpful Resources')).toBeInTheDocument()
      })
    })

    it('displays age rating guide in guidelines', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const trigger = screen.getByText('App Store Guidelines & Requirements')
      await user.click(trigger)

      // Wait for accordion to open and show age rating guide
      await waitFor(() => {
        expect(screen.getByText('Age Rating Guide')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('includes helpful links in guidelines', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const trigger = screen.getByText('App Store Guidelines & Requirements')
      await user.click(trigger)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /App Store Review Guidelines/ })
        expect(link).toHaveAttribute('href', 'https://developer.apple.com/app-store/review/guidelines/')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('Accessibility', () => {
    it('associates labels with inputs', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const appNameInput = screen.getByLabelText(/App Name/)
      expect(appNameInput).toHaveAttribute('id', 'appName')
    })

    it('sets aria-invalid for fields with errors', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ appName: 'App name is required' }}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates error messages with inputs via aria-describedby', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{ appName: 'App name is required' }}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      expect(input).toHaveAttribute('aria-describedby')
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toContain('appName-error')
    })

    it('associates help text with inputs via aria-describedby', () => {
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      expect(input).toHaveAttribute('aria-describedby', 'appName-help')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty form data gracefully', () => {
      render(
        <AppDetailsStep formData={{}} updateFormData={mockUpdateFormData} validationErrors={{}} />
      )

      expect(screen.getByLabelText(/App Name/)).toHaveValue('')
      expect(screen.getByDisplayValue('com.turbocat.myapp')).toBeInTheDocument()
    })

    it('handles undefined optional fields', () => {
      render(
        <AppDetailsStep
          formData={{
            appName: 'Test',
            description: 'Description',
            category: 'Business',
            ageRating: '4+',
          }}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      expect(screen.getByLabelText(/Support URL/)).toHaveValue('')
      expect(screen.getByLabelText(/App Icon URL/)).toHaveValue('')
    })

    it('handles very long app names by enforcing max length', async () => {
      const user = userEvent.setup()
      render(
        <AppDetailsStep
          formData={defaultFormData}
          updateFormData={mockUpdateFormData}
          validationErrors={{}}
        />
      )

      const input = screen.getByLabelText(/App Name/)
      const longName = 'A'.repeat(50)
      await user.type(input, longName)

      // Should be capped at 30 characters
      const calls = mockUpdateFormData.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0].appName.length).toBeLessThanOrEqual(30)
    })
  })
})
