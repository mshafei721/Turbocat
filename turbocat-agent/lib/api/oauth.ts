/**
 * OAuth API Client
 *
 * Utilities for managing OAuth provider connections.
 * Handles fetching user profile and disconnecting OAuth providers.
 *
 * @module lib/api/oauth
 */

/**
 * OAuth Provider Type
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft'

/**
 * User Profile Response
 * Matches backend User model fields
 */
export interface UserProfile {
  id: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
  role: 'USER' | 'ADMIN' | 'AGENT'
  isActive: boolean
  emailVerified: boolean
  oauthProvider?: string | null
  oauthId?: string | null
  passwordHash?: string | null // Only for checking if user has password auth
  lastLoginAt?: string | null
  preferences: Record<string, any>
  createdAt: string
  updatedAt: string
}

/**
 * API Response Wrapper
 */
interface ApiResponse<T> {
  success: boolean
  data: T
  requestId: string
}

/**
 * API Error Response
 */
interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
  }
}

/**
 * Fetch current user profile with OAuth connection status
 *
 * @returns User profile with OAuth provider info
 * @throws Error if request fails
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const response = await fetch(`${backendUrl}/api/v1/users/me`, {
    method: 'GET',
    credentials: 'include', // Send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to fetch user profile',
        statusCode: response.status,
      },
    }))

    throw new Error(errorData.error?.message || 'Failed to fetch user profile')
  }

  const data: ApiResponse<{ user: UserProfile }> = await response.json()
  return data.data.user
}

/**
 * Disconnect OAuth provider
 *
 * Removes OAuth connection from user account.
 * Backend should validate that user has another auth method (password).
 *
 * @param provider - OAuth provider to disconnect
 * @throws Error if request fails or would cause lockout
 */
export async function disconnectOAuthProvider(provider: OAuthProvider): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const response = await fetch(`${backendUrl}/api/v1/users/me/oauth`, {
    method: 'DELETE',
    credentials: 'include', // Send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider }),
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to disconnect OAuth provider',
        statusCode: response.status,
      },
    }))

    throw new Error(errorData.error?.message || 'Failed to disconnect OAuth provider')
  }
}

/**
 * Check if user can disconnect OAuth provider
 *
 * User can disconnect if they have another auth method (password).
 *
 * @param user - User profile
 * @returns True if user can disconnect OAuth
 */
export function canDisconnectOAuth(user: UserProfile): boolean {
  // If user has password, can disconnect OAuth
  if (user.passwordHash) {
    return true
  }

  // If user has only OAuth, cannot disconnect (would be locked out)
  if (!user.passwordHash && user.oauthProvider) {
    return false
  }

  return false
}

/**
 * Get OAuth provider display name
 */
export function getProviderDisplayName(provider: OAuthProvider): string {
  const names: Record<OAuthProvider, string> = {
    google: 'Google',
    github: 'GitHub',
    microsoft: 'Microsoft',
  }
  return names[provider]
}
