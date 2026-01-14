import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpoTokenStep } from '../ExpoTokenStep'
import type { PublishingFormData } from '../PublishingModal'

// Mock fetch for token verification
global.fetch = vi.fn()

describe('ExpoTokenStep', () => {
  const mockUpdateFormData = vi.fn()
  const defaultProps = {
    formData: {} as Partial<PublishingFormData>,
    updateFormData: mockUpdateFormData,
    validationErrors: {},
  }

  beforeEach(() => {
    mockUpdateFormData.mockClear()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the token input field', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders header and description', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Expo Access Token', level: 3 })).toBeInTheDocument()
      expect(screen.getByText(/Provide your Expo access token to enable building/i)).toBeInTheDocument()
    })

    it('renders security alert with AES-256-GCM encryption message', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/Your token is encrypted with AES-256-GCM/i)).toBeInTheDocument()
    })

    it('renders collapsible help section', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/How to Get Your Expo Access Token/i)).toBeInTheDocument()
    })

    it('renders security warning with amber styling', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/Security Warning/i)).toBeInTheDocument()
      expect(screen.getByText(/Never share your Expo access token with anyone/i)).toBeInTheDocument()
    })
  })

  describe('Token Visibility Toggle', () => {
    it('renders show/hide button for token', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /show token/i })).toBeInTheDocument()
    })

    it('toggles token visibility on button click', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...') as HTMLInputElement
      const toggleButton = screen.getByRole('button', { name: /show token/i })

      // Initially hidden (password type)
      expect(input.type).toBe('password')
      expect(toggleButton).toHaveAccessibleName(/show token/i)

      // Click to show
      await user.click(toggleButton)
      expect(input.type).toBe('text')
      expect(toggleButton).toHaveAccessibleName(/hide token/i)

      // Click to hide again
      await user.click(toggleButton)
      expect(input.type).toBe('password')
      expect(toggleButton).toHaveAccessibleName(/show token/i)
    })
  })

  describe('Input Handling', () => {
    it('calls updateFormData when token is entered', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      await user.type(input, 'test')

      // user.type() calls onChange for each character
      expect(mockUpdateFormData).toHaveBeenCalledWith({ expoToken: 't' })
      expect(mockUpdateFormData).toHaveBeenCalledWith({ expoToken: 'e' })
      expect(mockUpdateFormData).toHaveBeenCalledWith({ expoToken: 's' })
      expect(mockUpdateFormData).toHaveBeenCalledWith({ expoToken: 't' })
    })

    it('displays the token value from formData', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_my_token_123456' }} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...') as HTMLInputElement
      expect(input.value).toBe('expo_my_token_123456')
    })

    it('trims whitespace on blur', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: '  expo_token_123456  ' }} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      await user.click(input)
      await user.tab() // Blur the input

      expect(mockUpdateFormData).toHaveBeenCalledWith({ expoToken: 'expo_token_123456' })
    })

    it('does not trim if no whitespace present', async () => {
      const user = userEvent.setup()
      const mockUpdate = vi.fn()
      render(
        <ExpoTokenStep
          {...defaultProps}
          updateFormData={mockUpdate}
          formData={{ expoToken: 'expo_token_123456' }}
        />,
      )

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      await user.click(input)
      await user.tab() // Blur the input

      // Should not call updateFormData since no trimming needed
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    it('shows green checkmark for valid token (>= 20 characters)', () => {
      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      expect(screen.getByLabelText('Valid')).toBeInTheDocument()
    })

    it('does not show checkmark for short token (< 20 characters)', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: 'short_token' }} />)

      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()
    })

    it('shows red X icon when validation error exists', () => {
      render(
        <ExpoTokenStep
          {...defaultProps}
          formData={{ expoToken: 'short' }}
          validationErrors={{ expoToken: 'Token must be at least 20 characters' }}
        />,
      )

      expect(screen.getByLabelText('Invalid')).toBeInTheDocument()
    })

    it('displays validation error message', () => {
      render(
        <ExpoTokenStep
          {...defaultProps}
          validationErrors={{ expoToken: 'Token must be at least 20 characters' }}
        />,
      )

      expect(screen.getByText('Token must be at least 20 characters')).toBeInTheDocument()
    })

    it('shows invalid icon after blur for short token', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: 'short' }} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      await user.click(input)
      await user.tab() // Blur (marks as touched)

      // Should show invalid icon after touched
      expect(screen.getByLabelText('Invalid')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('associates label with input using htmlFor and id', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      // Get the label by its text content and find the for attribute
      const labels = screen.getAllByText(/Expo Access Token/i)
      const label = labels.find(el => el.tagName === 'LABEL')
      const input = screen.getByPlaceholderText('expo_abc123xyz...')

      expect(label).toHaveAttribute('for', 'expoToken')
      expect(input).toHaveAttribute('id', 'expoToken')
    })

    it('sets aria-invalid when field has validation error', () => {
      render(
        <ExpoTokenStep
          {...defaultProps}
          validationErrors={{ expoToken: 'Invalid token' }}
        />,
      )

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('sets aria-describedby to link error message and help text', () => {
      render(
        <ExpoTokenStep
          {...defaultProps}
          validationErrors={{ expoToken: 'Invalid token' }}
        />,
      )

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      const describedBy = input.getAttribute('aria-describedby')

      expect(describedBy).toContain('expoToken-error')
      expect(describedBy).toContain('expoToken-help')
    })

    it('sets aria-describedby to only help text when no error', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      const describedBy = input.getAttribute('aria-describedby')

      expect(describedBy).toBe('expoToken-help')
    })

    it('provides aria-label for visibility toggle button', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      const toggleButton = screen.getByRole('button', { name: /show token/i })
      expect(toggleButton).toHaveAttribute('aria-label')
    })
  })

  describe('Help Section', () => {
    it('renders step-by-step instructions when expanded', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} />)

      const accordion = screen.getByText(/How to Get Your Expo Access Token/i)
      await user.click(accordion)

      expect(screen.getByText(/Log in to https:\/\/expo.dev/i)).toBeInTheDocument()
      expect(screen.getByText(/Navigate to Account Settings/i)).toBeInTheDocument()
      expect(screen.getByText(/Click the "Create Token" button/i)).toBeInTheDocument()
    })

    it('renders links to Expo dashboard and documentation', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} />)

      const accordion = screen.getByText(/How to Get Your Expo Access Token/i)
      await user.click(accordion)

      const dashboardLink = screen.getByRole('link', { name: /Go to Expo Access Tokens/i })
      expect(dashboardLink).toHaveAttribute('href')
      expect(dashboardLink).toHaveAttribute('target', '_blank')
      expect(dashboardLink).toHaveAttribute('rel', 'noopener noreferrer')

      const docsLink = screen.getByRole('link', { name: /Read Expo Documentation/i })
      expect(docsLink).toHaveAttribute('href', 'https://docs.expo.dev/accounts/programmatic-access/')
    })

    it('displays token type information', async () => {
      const user = userEvent.setup()
      render(<ExpoTokenStep {...defaultProps} />)

      const accordion = screen.getByText(/How to Get Your Expo Access Token/i)
      await user.click(accordion)

      await waitFor(
        () => {
          expect(screen.getByText(/Personal Access Token/i)).toBeInTheDocument()
        },
        { timeout: 3000 },
      )
      // Use getAllByText since text appears in both the component and help text
      const robotTokenTexts = screen.getAllByText(/Robot Access Token/i)
      expect(robotTokenTexts.length).toBeGreaterThan(0)
      expect(screen.getByRole('link', { name: /Learn about token types/i })).toBeInTheDocument()
    })
  })

  describe('Security Features', () => {
    it('displays encryption badge', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/This token is encrypted before storage/i)).toBeInTheDocument()
    })

    it('displays warning about not sharing token', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/Never share your Expo access token with anyone/i)).toBeInTheDocument()
    })

    it('displays usage note', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/We use this token only to start builds on your behalf/i)).toBeInTheDocument()
    })

    it('displays token revocation information', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(screen.getByText(/You can revoke this token at any time/i)).toBeInTheDocument()
    })
  })

  describe('Token Verification', () => {
    it('does not show verify button when token is short', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: 'short' }} />)

      expect(screen.queryByRole('button', { name: /verify token/i })).not.toBeInTheDocument()
    })

    it('shows verify button when token is >= 20 characters', () => {
      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      expect(screen.getByRole('button', { name: /verify token/i })).toBeInTheDocument()
    })

    it('calls API and shows success message on successful verification', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      const verifyButton = screen.getByRole('button', { name: /verify token/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Token verified successfully!/i)).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/publishing/verify-expo-token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'expo_valid_token_12345' }),
        }),
      )
    })

    it('shows error message on failed verification', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid token format' }),
      })

      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_invalid_token_123' }} />,
      )

      const verifyButton = screen.getByRole('button', { name: /verify token/i })
      await user.click(verifyButton)

      await waitFor(
        () => {
          expect(screen.getByText(/Invalid token format/i)).toBeInTheDocument()
        },
        { timeout: 3000 },
      )
    })

    it('shows loading state during verification', async () => {
      const user = userEvent.setup()
      let resolvePromise: any
      ;(global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = () => resolve({ ok: true, json: async () => ({}) })
          }),
      )

      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      const verifyButton = screen.getByRole('button', { name: /verify token/i })
      await user.click(verifyButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/Verifying.../i)).toBeInTheDocument()
      })
      expect(verifyButton).toBeDisabled()

      // Resolve the promise to clean up
      if (resolvePromise) resolvePromise()
    })

    it('gracefully handles API unavailability', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      const verifyButton = screen.getByRole('button', { name: /verify token/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Verification unavailable/i)).toBeInTheDocument()
      })
    })

    it('disables verify button when token is invalid', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: 'short' }} />)

      const verifyButton = screen.queryByRole('button', { name: /verify token/i })
      expect(verifyButton).not.toBeInTheDocument()
    })
  })

  describe('Field States', () => {
    it('shows placeholder text', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      expect(input).toBeInTheDocument()
    })

    it('shows help text below input', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      expect(
        screen.getByText(/Your personal or robot access token from Expo with build permissions/i),
      ).toBeInTheDocument()
    })

    it('displays required asterisk in label', () => {
      render(<ExpoTokenStep {...defaultProps} />)

      const labels = screen.getAllByText(/Expo Access Token/i)
      const label = labels.find(el => el.tagName === 'LABEL')
      expect(label?.textContent).toContain('*')
    })
  })

  describe('Responsive Behavior', () => {
    it('applies full width on mobile for verify button', () => {
      render(
        <ExpoTokenStep {...defaultProps} formData={{ expoToken: 'expo_valid_token_12345' }} />,
      )

      const verifyButton = screen.getByRole('button', { name: /verify token/i })
      expect(verifyButton).toHaveClass('w-full', 'sm:w-auto')
    })
  })

  describe('Integration with PublishingModal', () => {
    it('works with empty formData', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{}} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('works with partial formData', () => {
      render(<ExpoTokenStep {...defaultProps} formData={{ expoToken: undefined }} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('properly updates formData via callback', async () => {
      const user = userEvent.setup()
      const mockUpdate = vi.fn()

      render(<ExpoTokenStep {...defaultProps} updateFormData={mockUpdate} />)

      const input = screen.getByPlaceholderText('expo_abc123xyz...')
      await user.type(input, 'test')

      // user.type() calls onChange for each character individually
      expect(mockUpdate).toHaveBeenCalledWith({ expoToken: 't' })
      expect(mockUpdate).toHaveBeenCalledWith({ expoToken: 'e' })
      expect(mockUpdate).toHaveBeenCalledWith({ expoToken: 's' })
      expect(mockUpdate).toHaveBeenCalledWith({ expoToken: 't' })
      expect(mockUpdate).toHaveBeenCalledTimes(4)
    })
  })
})
