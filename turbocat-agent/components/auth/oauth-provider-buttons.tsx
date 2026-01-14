'use client'

import { useState } from 'react'
import { OAuthButton, type OAuthProvider } from './oauth-button'
import { cn } from '@/lib/utils'

/**
 * OAuth Provider Buttons Props Interface
 */
export interface OAuthProviderButtonsProps {
  /**
   * Additional CSS classes for container
   */
  className?: string

  /**
   * Show divider with text above buttons
   * @default false
   */
  showDivider?: boolean

  /**
   * Text to display in divider
   * @default "Or continue with"
   */
  dividerText?: string

  /**
   * Callback when a provider is selected
   */
  onProviderSelect?: (provider: OAuthProvider) => void

  /**
   * Providers to display
   * @default ["google", "github", "microsoft"]
   */
  providers?: OAuthProvider[]

  /**
   * Button size variant
   * @default "lg"
   */
  size?: 'default' | 'sm' | 'lg' | 'xl'

  /**
   * Stack buttons vertically or horizontally
   * @default "vertical"
   */
  layout?: 'vertical' | 'horizontal'

  /**
   * Globally disable all buttons
   * @default false
   */
  disabled?: boolean

  /**
   * Show error message
   */
  error?: string | null
}

/**
 * OAuth Provider Buttons Component
 *
 * Renders OAuth buttons for all configured providers.
 * Manages loading state so only one provider can be loading at a time.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OAuthProviderButtons />
 *
 * // With divider
 * <OAuthProviderButtons
 *   showDivider
 *   dividerText="Or sign in with"
 * />
 *
 * // Horizontal layout with custom providers
 * <OAuthProviderButtons
 *   layout="horizontal"
 *   providers={["google", "github"]}
 * />
 *
 * // With error handling
 * <OAuthProviderButtons
 *   error="OAuth failed. Please try again."
 *   onProviderSelect={(provider) => {
 *     console.log('Selected:', provider)
 *   }}
 * />
 * ```
 *
 * Features:
 * - Displays multiple OAuth provider buttons
 * - Optional divider with customizable text
 * - Loading state management (only one button can be loading)
 * - Error display
 * - Responsive layout options
 * - Accessible (ARIA labels, keyboard navigation)
 *
 * Accessibility:
 * - Error messages announced to screen readers
 * - Buttons have proper ARIA labels
 * - Keyboard navigation support
 * - Focus management
 */
export function OAuthProviderButtons({
  className,
  showDivider = false,
  dividerText = 'Or continue with',
  onProviderSelect,
  providers = ['google', 'github', 'microsoft'],
  size = 'lg',
  layout = 'vertical',
  disabled = false,
  error,
}: OAuthProviderButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)

  /**
   * Handle provider button click
   * Sets loading state and calls optional callback
   */
  const handleProviderClick = (provider: OAuthProvider) => {
    setLoadingProvider(provider)
    onProviderSelect?.(provider)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Optional Divider */}
      {showDivider && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{dividerText}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">Authentication Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* OAuth Buttons */}
      <div
        className={cn(
          'flex',
          layout === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-2',
          layout === 'horizontal' && 'sm:gap-3',
        )}
      >
        {providers.map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            onInitiate={() => handleProviderClick(provider)}
            loading={loadingProvider === provider}
            disabled={disabled || (loadingProvider !== null && loadingProvider !== provider)}
            size={size}
            fullWidth={layout === 'vertical'}
            className={layout === 'horizontal' ? 'flex-1 min-w-[140px]' : undefined}
          />
        ))}
      </div>

      {/* Help Text */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
