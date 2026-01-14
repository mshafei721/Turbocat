import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppleCredentialsStep } from '../AppleCredentialsStep'
import type { PublishingFormData } from '../PublishingModal'

describe('AppleCredentialsStep', () => {
  const mockUpdateFormData = vi.fn()
  const defaultProps = {
    formData: {} as Partial<PublishingFormData>,
    updateFormData: mockUpdateFormData,
    validationErrors: {},
  }

  beforeEach(() => {
    mockUpdateFormData.mockClear()
  })

  describe('Rendering', () => {
    it('renders all 4 form fields', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByLabelText(/apple team id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/issuer id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/private key/i)).toBeInTheDocument()
    })

    it('renders header and description', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText('Apple Developer Credentials')).toBeInTheDocument()
      expect(screen.getByText(/Enter your App Store Connect API credentials/i)).toBeInTheDocument()
    })

    it('renders security alert', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText(/Your credentials are encrypted using AES-256/i)).toBeInTheDocument()
    })

    it('renders collapsible help section', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText(/Where do I find these credentials/i)).toBeInTheDocument()
    })
  })

  describe('Character Counters', () => {
    it('displays character count for Team ID', () => {
      render(<AppleCredentialsStep {...defaultProps} formData={{ appleTeamId: 'ABC123' }} />)

      expect(screen.getByText('6/10')).toBeInTheDocument()
    })

    it('highlights character count when Team ID is complete', () => {
      render(<AppleCredentialsStep {...defaultProps} formData={{ appleTeamId: 'ABC123DEFG' }} />)

      const counter = screen.getByText('10/10')
      expect(counter).toHaveClass('text-success')
    })

    it('displays character count for Key ID', () => {
      render(<AppleCredentialsStep {...defaultProps} formData={{ appleKeyId: 'KEY12' }} />)

      expect(screen.getByText('5/10')).toBeInTheDocument()
    })
  })

  describe('Validation Indicators', () => {
    it('shows green checkmark for valid Team ID', () => {
      render(<AppleCredentialsStep {...defaultProps} formData={{ appleTeamId: 'ABC123DEFG' }} />)

      expect(screen.getByLabelText('Valid')).toBeInTheDocument()
    })

    it('shows green checkmark for valid Issuer ID (UUID)', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          formData={{ appleIssuerId: '12345678-1234-1234-1234-123456789012' }}
        />,
      )

      expect(screen.getByLabelText('Valid')).toBeInTheDocument()
    })

    it('shows green checkmark for valid Private Key', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          formData={{
            applePrivateKey: '-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----',
          }}
        />,
      )

      expect(screen.getByLabelText('Valid')).toBeInTheDocument()
    })
  })

  describe('Validation Errors', () => {
    it('displays validation error for Team ID', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          validationErrors={{ appleTeamId: 'Team ID must be 10 alphanumeric characters' }}
        />,
      )

      expect(screen.getByText('Team ID must be 10 alphanumeric characters')).toBeInTheDocument()
    })

    it('displays validation error for Key ID', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          validationErrors={{ appleKeyId: 'Key ID must be 10 alphanumeric characters' }}
        />,
      )

      expect(screen.getByText('Key ID must be 10 alphanumeric characters')).toBeInTheDocument()
    })

    it('displays validation error for Issuer ID', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          validationErrors={{ appleIssuerId: 'Issuer ID must be a valid UUID' }}
        />,
      )

      expect(screen.getByText('Issuer ID must be a valid UUID')).toBeInTheDocument()
    })

    it('displays validation error for Private Key', () => {
      render(
        <AppleCredentialsStep
          {...defaultProps}
          validationErrors={{
            applePrivateKey: 'Private Key must start with -----BEGIN PRIVATE KEY-----',
          }}
        />,
      )

      expect(screen.getByText('Private Key must start with -----BEGIN PRIVATE KEY-----')).toBeInTheDocument()
    })
  })

  describe('Private Key Visibility Toggle', () => {
    it('renders show/hide button for private key', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByRole('button', { name: /show private key/i })).toBeInTheDocument()
    })

    it('toggles private key visibility on button click', async () => {
      const user = userEvent.setup()
      render(<AppleCredentialsStep {...defaultProps} />)

      const toggleButton = screen.getByRole('button', { name: /show private key/i })

      // Initially shows "Show"
      expect(toggleButton).toHaveAccessibleName(/show private key/i)

      // Click to show
      await user.click(toggleButton)
      expect(toggleButton).toHaveAccessibleName(/hide private key/i)

      // Click to hide again
      await user.click(toggleButton)
      expect(toggleButton).toHaveAccessibleName(/show private key/i)
    })
  })

  describe('Accessibility', () => {
    it('associates labels with inputs using htmlFor and id', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      const teamIdLabel = screen.getByText(/Apple Team ID/i).closest('label')
      const teamIdInput = screen.getByLabelText(/apple team id/i)

      expect(teamIdLabel).toHaveAttribute('for', 'appleTeamId')
      expect(teamIdInput).toHaveAttribute('id', 'appleTeamId')
    })

    it('sets aria-invalid when field has validation error', () => {
      render(<AppleCredentialsStep {...defaultProps} validationErrors={{ appleTeamId: 'Invalid' }} />)

      const input = screen.getByLabelText(/apple team id/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('sets aria-describedby to link error message and help text', () => {
      render(<AppleCredentialsStep {...defaultProps} validationErrors={{ appleTeamId: 'Invalid' }} />)

      const input = screen.getByLabelText(/apple team id/i)
      const describedBy = input.getAttribute('aria-describedby')

      expect(describedBy).toContain('appleTeamId-error')
      expect(describedBy).toContain('appleTeamId-help')
    })
  })

  describe('Security Features', () => {
    it('displays security badge for encrypted storage', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText(/Your credentials are encrypted using AES-256/i)).toBeInTheDocument()
    })

    it('displays warning about not sharing credentials', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText(/Never share these credentials with anyone/i)).toBeInTheDocument()
    })

    it('displays security note for private key', () => {
      render(<AppleCredentialsStep {...defaultProps} />)

      expect(screen.getByText(/This key is encrypted before storage and never logged/i)).toBeInTheDocument()
    })
  })

  describe('Field Validation Logic', () => {
    it('validates Team ID format (exactly 10 uppercase alphanumeric)', () => {
      const { rerender } = render(
        <AppleCredentialsStep {...defaultProps} formData={{ appleTeamId: 'ABC123DEFG' }} />,
      )
      expect(screen.getByLabelText('Valid')).toBeInTheDocument()

      // Invalid: too short
      rerender(<AppleCredentialsStep {...defaultProps} formData={{ appleTeamId: 'ABC123' }} />)
      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()
    })

    it('validates Key ID format (exactly 10 uppercase alphanumeric)', () => {
      const { rerender } = render(
        <AppleCredentialsStep {...defaultProps} formData={{ appleKeyId: 'KEY1234567' }} />,
      )
      expect(screen.getByLabelText('Valid')).toBeInTheDocument()

      // Invalid: too short
      rerender(<AppleCredentialsStep {...defaultProps} formData={{ appleKeyId: 'KEY123' }} />)
      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()
    })

    it('validates Issuer ID format (UUID with hyphens)', () => {
      const { rerender } = render(
        <AppleCredentialsStep
          {...defaultProps}
          formData={{ appleIssuerId: '12345678-1234-1234-1234-123456789012' }}
        />,
      )
      expect(screen.getByLabelText('Valid')).toBeInTheDocument()

      // Invalid: no hyphens
      rerender(
        <AppleCredentialsStep
          {...defaultProps}
          formData={{ appleIssuerId: '12345678123412341234123456789012' }}
        />,
      )
      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()

      // Invalid: wrong format
      rerender(<AppleCredentialsStep {...defaultProps} formData={{ appleIssuerId: 'not-a-uuid' }} />)
      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()
    })

    it('validates Private Key format (must contain BEGIN PRIVATE KEY)', () => {
      const { rerender } = render(
        <AppleCredentialsStep
          {...defaultProps}
          formData={{
            applePrivateKey: '-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----',
          }}
        />,
      )
      expect(screen.getByLabelText('Valid')).toBeInTheDocument()

      // Invalid: missing BEGIN marker
      rerender(<AppleCredentialsStep {...defaultProps} formData={{ applePrivateKey: 'MIGTAgEA...' }} />)
      expect(screen.queryByLabelText('Valid')).not.toBeInTheDocument()
    })
  })
})
