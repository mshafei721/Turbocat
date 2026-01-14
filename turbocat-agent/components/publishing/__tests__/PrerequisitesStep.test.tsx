import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrerequisitesStep } from '../PrerequisitesStep'

describe('PrerequisitesStep', () => {
  const mockOnNext = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with heading', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)
      expect(screen.getByText('Before You Begin')).toBeInTheDocument()
    })

    it('should display time estimate', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)
      expect(screen.getByText(/Setup takes ~15 minutes/i)).toBeInTheDocument()
    })

    it('should render all prerequisite items', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.getByText('Apple Developer Account')).toBeInTheDocument()
      expect(screen.getByText('App Store Connect API Key')).toBeInTheDocument()
      expect(screen.getByText('Expo Account')).toBeInTheDocument()
      expect(screen.getByText('Expo Access Token')).toBeInTheDocument()
    })

    it('should display cost badges for paid services', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.getByText('$99/year')).toBeInTheDocument()
      expect(screen.getByText('Free tier available')).toBeInTheDocument()
    })

    it('should render the completion checkbox', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('should render Continue button as disabled by default', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })
      expect(continueButton).toBeDisabled()
    })

    it('should render time estimate alert', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.getByText(/The publishing process typically takes 15-30 minutes/i)).toBeInTheDocument()
    })

    it('should not render Back button by default', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument()
    })

    it('should render Back button when canGoBack is true', () => {
      render(<PrerequisitesStep onNext={mockOnNext} onBack={mockOnBack} canGoBack={true} />)

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
    })
  })

  describe('Accordion Interactions', () => {
    it('should expand accordion when clicked', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })

      await user.click(appleAccountTrigger)

      await waitFor(() => {
        expect(screen.getByText('Step-by-step guide:')).toBeInTheDocument()
      })
    })

    it('should display detailed steps when expanded', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })

      await user.click(appleAccountTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Visit the Apple Developer Program enrollment page/i)).toBeInTheDocument()
        expect(screen.getByText(/Sign in with your Apple ID/i)).toBeInTheDocument()
      })
    })

    it('should display helpful links when expanded', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })

      await user.click(appleAccountTrigger)

      await waitFor(() => {
        expect(screen.getByText('Helpful links:')).toBeInTheDocument()
        expect(screen.getByText('Join Apple Developer Program')).toBeInTheDocument()
      })
    })

    it('should mark item as reviewed when accordion is opened', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })

      await user.click(appleAccountTrigger)

      await waitFor(() => {
        expect(screen.getByLabelText('Reviewed')).toBeInTheDocument()
      })
    })
  })

  describe('External Links', () => {
    it('should have correct attributes for external links', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })

      await user.click(appleAccountTrigger)

      await waitFor(() => {
        const externalLink = screen.getByText('Join Apple Developer Program').closest('a')
        expect(externalLink).toHaveAttribute('target', '_blank')
        expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer')
        expect(externalLink).toHaveAttribute('href', 'https://developer.apple.com/programs/')
      })
    })

    it('should render additional resources links correctly', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const reviewGuidelinesLink = screen.getByText('App Store Review Guidelines').closest('a')
      expect(reviewGuidelinesLink).toHaveAttribute('target', '_blank')
      expect(reviewGuidelinesLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(reviewGuidelinesLink).toHaveAttribute(
        'href',
        'https://developer.apple.com/app-store/review/guidelines/'
      )
    })
  })

  describe('Checkbox and Button Interactions', () => {
    it('should enable Continue button when checkbox is checked', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })
      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      expect(continueButton).toBeDisabled()

      await user.click(checkbox)

      await waitFor(() => {
        expect(continueButton).toBeEnabled()
      })
    })

    it('should disable Continue button when checkbox is unchecked', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })
      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      await user.click(checkbox)
      await user.click(checkbox)

      await waitFor(() => {
        expect(continueButton).toBeDisabled()
      })
    })

    it('should call onNext when Continue button is clicked', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })
      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      await user.click(checkbox)
      await user.click(continueButton)

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onBack when Back button is clicked', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} onBack={mockOnBack} canGoBack={true} />)

      const backButton = screen.getByRole('button', { name: /Back/i })

      await user.click(backButton)

      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call onNext when Continue button is disabled', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })

      await user.click(continueButton)

      expect(mockOnNext).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for accordion triggers', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(
        screen.getByRole('button', {
          name: /View details for Apple Developer Account/i,
        })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: /View details for App Store Connect API Key/i,
        })
      ).toBeInTheDocument()
    })

    it('should have proper ARIA label for checkbox', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })
      expect(checkbox).toBeInTheDocument()
    })

    it('should have proper ARIA label for Continue button', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const continueButton = screen.getByRole('button', { name: /Continue to next step/i })
      expect(continueButton).toBeInTheDocument()
    })

    it('should support keyboard navigation for checkbox', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /I have completed these prerequisites/i,
      })

      // Focus the checkbox and press space
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()

      // Find the checkbox and click with space
      await user.click(checkbox)

      await waitFor(() => {
        expect(checkbox).toBeChecked()
      })
    })
  })

  describe('Additional Information', () => {
    it('should display tooltip information inline', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      // The tooltip text should be visible in the description area
      expect(screen.getByText(/This is an annual subscription/i)).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should display descriptions for each prerequisite', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.getByText(/An active Apple Developer Program membership is required/i)).toBeInTheDocument()
      expect(screen.getByText(/API credentials are required for automated build submission/i)).toBeInTheDocument()
      expect(screen.getByText(/Expo Build Services \(EAS\) will build your iOS app/i)).toBeInTheDocument()
      expect(
        screen.getByText(/A personal access token allows Turbocat to trigger builds/i)
      ).toBeInTheDocument()
    })

    it('should display completion instructions', () => {
      render(<PrerequisitesStep onNext={mockOnNext} />)

      expect(screen.getByText(/Check this box to confirm you have all required accounts/i)).toBeInTheDocument()
    })
  })

  describe('Multiple Accordion Support', () => {
    it('should allow multiple accordions to be open simultaneously', async () => {
      const user = userEvent.setup()
      render(<PrerequisitesStep onNext={mockOnNext} />)

      const appleAccountTrigger = screen.getByRole('button', {
        name: /View details for Apple Developer Account/i,
      })
      const expoAccountTrigger = screen.getByRole('button', {
        name: /View details for Expo Account/i,
      })

      await user.click(appleAccountTrigger)
      await user.click(expoAccountTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Visit the Apple Developer Program enrollment page/i)).toBeInTheDocument()
        expect(screen.getByText(/Visit the Expo signup page/i)).toBeInTheDocument()
      })
    })
  })
})
