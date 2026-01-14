'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Check, X, Link as LinkIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OAuthButton, OAuthProvider } from '@/components/auth/oauth-button'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GitHubIcon } from '@/components/icons/github-icon'
import { MicrosoftIcon } from '@/components/icons/microsoft-icon'
import {
  fetchUserProfile,
  disconnectOAuthProvider,
  canDisconnectOAuth,
  getProviderDisplayName,
  UserProfile,
} from '@/lib/api/oauth'
import { cn } from '@/lib/utils'

/**
 * OAuth Connection Status
 */
interface OAuthConnectionStatus {
  provider: OAuthProvider
  connected: boolean
  connectedAt?: string | null
  canDisconnect: boolean
}

/**
 * Provider Card Props
 */
interface OAuthProviderCardProps {
  provider: OAuthProvider
  connected: boolean
  canDisconnect: boolean
  isDisconnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

/**
 * Provider Icons
 */
const providerIcons: Record<OAuthProvider, React.ComponentType<{ className?: string }>> = {
  google: GoogleIcon,
  github: GitHubIcon,
  microsoft: MicrosoftIcon,
}

/**
 * OAuth Provider Card
 *
 * Displays connection status and actions for a single OAuth provider.
 */
function OAuthProviderCard({
  provider,
  connected,
  canDisconnect,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: OAuthProviderCardProps) {
  const Icon = providerIcons[provider]
  const displayName = getProviderDisplayName(provider)

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <div className="flex items-center gap-2 mt-1">
            {connected ? (
              <>
                <Check size={14} className="text-green-400" weight="bold" />
                <span className="text-xs text-green-400">Connected</span>
              </>
            ) : (
              <>
                <X size={14} className="text-slate-500" weight="bold" />
                <span className="text-xs text-slate-500">Not connected</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div>
        {connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={!canDisconnect || isDisconnecting}
            className={cn(
              'border-red-900/50 text-red-400 hover:bg-red-950/40',
              (!canDisconnect || isDisconnecting) && 'opacity-50 cursor-not-allowed',
            )}
            aria-label={`Disconnect ${displayName}`}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <OAuthButton
            provider={provider}
            size="sm"
            fullWidth={false}
            onInitiate={onConnect}
            className="min-w-[100px]"
          />
        )}
      </div>
    </div>
  )
}

/**
 * OAuth Connection Section Props
 */
export interface OAuthConnectionSectionProps {
  /** Initial user data (optional, will fetch if not provided) */
  initialUser?: UserProfile
  /** Custom class name */
  className?: string
}

/**
 * OAuth Connection Section Component
 *
 * Displays OAuth provider connection status and allows users to connect/disconnect providers.
 * Implements lockout prevention - user must have at least one auth method.
 *
 * Features:
 * - Shows all 3 OAuth providers (Google, GitHub, Microsoft)
 * - Connect button for unconnected providers
 * - Disconnect button for connected providers
 * - Lockout prevention (cannot disconnect if no password)
 * - Loading states
 * - Error handling
 *
 * @example
 * ```tsx
 * <OAuthConnectionSection initialUser={user} />
 * ```
 */
export function OAuthConnectionSection({ initialUser, className }: OAuthConnectionSectionProps) {
  const router = useRouter()
  const [user, setUser] = React.useState<UserProfile | null>(initialUser || null)
  const [isLoading, setIsLoading] = React.useState(!initialUser)
  const [disconnectingProvider, setDisconnectingProvider] = React.useState<OAuthProvider | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // All supported providers
  const allProviders: OAuthProvider[] = ['google', 'github', 'microsoft']

  /**
   * Fetch user profile on mount
   */
  React.useEffect(() => {
    if (!initialUser) {
      fetchProfile()
    }
  }, [initialUser])

  /**
   * Fetch user profile from API
   */
  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profile = await fetchUserProfile()
      setUser(profile)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile'
      setError(errorMessage)
      console.error('Failed to fetch user profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle disconnect OAuth provider
   */
  const handleDisconnect = async (provider: OAuthProvider) => {
    if (!user) return

    // Check if user can disconnect (has password)
    if (!canDisconnectOAuth(user)) {
      setError(
        'Cannot disconnect. You must have at least one sign-in method. Please set a password first.',
      )
      return
    }

    try {
      setDisconnectingProvider(provider)
      setError(null)
      setSuccessMessage(null)

      await disconnectOAuthProvider(provider)

      // Refresh user profile
      await fetchProfile()

      setSuccessMessage(`Successfully disconnected ${getProviderDisplayName(provider)}`)

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect provider'
      setError(errorMessage)
      console.error('Failed to disconnect OAuth provider:', err)
    } finally {
      setDisconnectingProvider(null)
    }
  }

  /**
   * Handle connect OAuth provider
   */
  const handleConnect = (provider: OAuthProvider) => {
    setError(null)
    setSuccessMessage(null)
    // OAuthButton handles redirect
  }

  /**
   * Get connection status for all providers
   */
  const getConnectionStatuses = (): OAuthConnectionStatus[] => {
    if (!user) {
      return allProviders.map((provider) => ({
        provider,
        connected: false,
        canDisconnect: false,
      }))
    }

    const canDisconnect = canDisconnectOAuth(user)

    return allProviders.map((provider) => ({
      provider,
      connected: user.oauthProvider === provider,
      connectedAt: user.oauthProvider === provider ? user.lastLoginAt : null,
      canDisconnect: canDisconnect,
    }))
  }

  const connectionStatuses = getConnectionStatuses()
  const hasPassword = user?.passwordHash ? true : false

  return (
    <Card className={cn('border-slate-800 bg-slate-900/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield size={20} className="text-blue-400" />
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-slate-400">
          Manage your OAuth provider connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-6 w-6 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="ml-2 text-sm text-slate-400">Loading...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-900/50 bg-red-950/20 p-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-green-900/50 bg-green-950/20 p-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-green-400">{successMessage}</p>
          </motion.div>
        )}

        {/* Provider Cards */}
        {!isLoading && (
          <div className="space-y-3">
            {connectionStatuses.map((status) => (
              <OAuthProviderCard
                key={status.provider}
                provider={status.provider}
                connected={status.connected}
                canDisconnect={status.canDisconnect}
                isDisconnecting={disconnectingProvider === status.provider}
                onConnect={() => handleConnect(status.provider)}
                onDisconnect={() => handleDisconnect(status.provider)}
              />
            ))}
          </div>
        )}

        {/* Auth Status Info */}
        {!isLoading && user && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex items-start gap-2">
              <LinkIcon size={16} className="text-slate-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-300">Authentication Status</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {hasPassword ? (
                      <>
                        <Check size={12} className="text-green-400" weight="bold" />
                        <span className="text-xs text-slate-400">Email/Password enabled</span>
                      </>
                    ) : (
                      <>
                        <X size={12} className="text-slate-500" weight="bold" />
                        <span className="text-xs text-slate-500">Email/Password not set</span>
                      </>
                    )}
                  </div>
                  {!hasPassword && user.oauthProvider && (
                    <p className="text-xs text-amber-400 mt-2">
                      You must set a password before disconnecting your OAuth provider.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-slate-500">
          You can connect multiple OAuth providers to your account. For security, you must have at
          least one sign-in method (OAuth or email/password).
        </p>
      </CardContent>
    </Card>
  )
}
