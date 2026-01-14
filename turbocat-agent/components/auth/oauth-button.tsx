'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GitHubIcon } from '@/components/icons/github-icon'
import { MicrosoftIcon } from '@/components/icons/microsoft-icon'
import { cn } from '@/lib/utils'

/**
 * OAuth Provider Type
 * Supported providers: Google, GitHub, Microsoft
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft'

/**
 * OAuth Button Props Interface
 */
export interface OAuthButtonProps {
  /**
   * OAuth provider (google, github, microsoft)
   */
  provider: OAuthProvider

  /**
   * Optional callback when OAuth flow is initiated
   */
  onInitiate?: () => void

  /**
   * Disabled state (cannot initiate OAuth)
   */
  disabled?: boolean

  /**
   * Loading state (shows spinner)
   */
  loading?: boolean

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Button size variant
   * @default "lg"
   */
  size?: 'default' | 'sm' | 'lg' | 'xl'

  /**
   * Full width button
   * @default true
   */
  fullWidth?: boolean
}

/**
 * Provider Configuration
 * Contains display names, icons, and styling for each provider
 */
const providerConfig: Record<
  OAuthProvider,
  {
    name: string
    icon: React.ComponentType<{ className?: string }>
    className: string
  }
> = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
  },
  github: {
    name: 'GitHub',
    icon: GitHubIcon,
    className: 'hover:bg-gray-50 dark:hover:bg-gray-950/30',
  },
  microsoft: {
    name: 'Microsoft',
    icon: MicrosoftIcon,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
  },
}

/**
 * OAuth Button Component
 *
 * Reusable button component for initiating OAuth authentication flows.
 * Redirects to backend OAuth endpoint when clicked.
 *
 * @example
 * ```tsx
 * <OAuthButton provider="google" />
 * <OAuthButton provider="github" disabled={isLoading} />
 * <OAuthButton
 *   provider="microsoft"
 *   onInitiate={() => console.log('OAuth started')}
 * />
 * ```
 *
 * OAuth Flow:
 * 1. User clicks button
 * 2. Button redirects to: ${NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/${provider}
 * 3. Backend redirects to provider OAuth page
 * 4. User authorizes on provider
 * 5. Provider redirects to backend callback
 * 6. Backend processes callback and redirects to frontend with JWT tokens
 *
 * Accessibility:
 * - ARIA label with provider name
 * - Keyboard navigation (Enter/Space)
 * - Focus visible styles
 * - Disabled state properly communicated
 */
export function OAuthButton({
  provider,
  onInitiate,
  disabled = false,
  loading = false,
  className,
  size = 'lg',
  fullWidth = true,
}: OAuthButtonProps) {
  const [isInitiating, setIsInitiating] = useState(false)

  const config = providerConfig[provider]
  const Icon = config.icon
  const isDisabled = disabled || loading || isInitiating

  /**
   * Handle OAuth button click
   * Redirects to backend OAuth initiation endpoint
   */
  const handleClick = () => {
    if (isDisabled) return

    // Call optional onInitiate callback
    onInitiate?.()

    // Set loading state
    setIsInitiating(true)

    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    // Redirect to backend OAuth endpoint
    // Backend will handle:
    // - CSRF protection (state parameter)
    // - Rate limiting
    // - Redirect to provider
    window.location.href = `${backendUrl}/api/v1/auth/oauth/${provider}`
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      variant="outline"
      size={size}
      className={cn(
        fullWidth && 'w-full',
        config.className,
        'transition-colors',
        'focus-visible:ring-2',
        'focus-visible:ring-primary/50',
        'focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`Sign in with ${config.name}`}
      type="button"
    >
      {isInitiating || loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          <Icon className="h-4 w-4 mr-2" />
          Continue with {config.name}
        </>
      )}
    </Button>
  )
}
