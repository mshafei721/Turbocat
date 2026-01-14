'use client'

/**
 * OAuth Success Callback Page
 *
 * This page receives JWT tokens from the backend OAuth flow, stores them
 * securely in httpOnly cookies, and redirects to the dashboard.
 *
 * Flow:
 * 1. Backend completes OAuth → Redirects here with tokens in URL
 * 2. Extract tokens from URL query parameters
 * 3. Call API route to set httpOnly cookies
 * 4. Redirect to dashboard
 *
 * URL Format:
 * /auth/oauth/success?accessToken=JWT_TOKEN&refreshToken=JWT_TOKEN
 *
 * Security:
 * - Tokens in URL are temporary (immediately extracted)
 * - URL is cleaned after extraction (router.replace)
 * - Tokens stored in httpOnly cookies (XSS protection)
 * - Basic token validation before storage
 *
 * @module app/(auth)/oauth/success
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

/**
 * OAuth Success Callback Page Component
 */
export default function OAuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        console.log('[OAuth Success] Processing OAuth callback')

        // Extract tokens from URL query parameters
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const accessTokenExpiresAt = searchParams.get('accessTokenExpiresAt')
        const refreshTokenExpiresAt = searchParams.get('refreshTokenExpiresAt')

        // Validate tokens exist
        if (!accessToken || !refreshToken) {
          console.error('[OAuth Success] Missing tokens in URL')
          setError('Invalid authentication response. Missing tokens.')
          setIsProcessing(false)
          return
        }

        // Basic token validation (check if they look like JWTs)
        const isValidJWT = (token: string): boolean => {
          // JWT format: header.payload.signature (3 parts separated by dots)
          const parts = token.split('.')
          return parts.length === 3 && parts.every((part) => part.length > 0)
        }

        if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
          console.error('[OAuth Success] Tokens do not appear to be valid JWTs')
          setError('Invalid authentication tokens.')
          setIsProcessing(false)
          return
        }

        console.log('[OAuth Success] Tokens validated, storing in httpOnly cookies')

        // Call API route to set httpOnly cookies
        const response = await fetch('/api/auth/oauth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[OAuth Success] Failed to set session:', errorData)
          setError('Failed to create session. Please try again.')
          setIsProcessing(false)
          return
        }

        console.log('[OAuth Success] Session created successfully, redirecting to dashboard')

        // Clean URL (remove tokens from URL for security)
        // Use router.replace to avoid adding to browser history
        window.history.replaceState({}, '', '/auth/oauth/success')

        // Redirect to dashboard
        // Check if there's a redirect URL in query params (for future enhancement)
        const redirectUrl = searchParams.get('redirect') || '/'

        // Small delay to ensure cookies are set
        setTimeout(() => {
          router.push(redirectUrl)
        }, 100)
      } catch (err) {
        console.error('[OAuth Success] Unexpected error:', err)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    processOAuthCallback()
  }, [searchParams, router])

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-red-800/50 bg-slate-900/80 p-8 text-center backdrop-blur-sm">
            {/* Error Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-8 w-8 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-foreground">Authentication Failed</h2>
            <p className="mb-6 text-sm text-slate-400">{error}</p>

            {/* Back to Login Button */}
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <LoadingSpinner />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 text-sm text-slate-400"
        >
          {isProcessing ? 'Completing sign in...' : 'Redirecting...'}
        </motion.p>
      </motion.div>
    </div>
  )
}
