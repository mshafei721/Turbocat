'use client'

/**
 * OAuth Error Callback Page
 *
 * This page handles OAuth errors from the backend OAuth flow.
 * Displays user-friendly error messages and provides retry options.
 *
 * Flow:
 * 1. Backend OAuth fails → Redirects here with error in URL
 * 2. Extract error from URL query parameters
 * 3. Display user-friendly error message
 * 4. Provide "Try Again" button to redirect to login
 *
 * URL Format:
 * /auth/oauth/error?error=oauth_failed&error_description=User+denied+access
 *
 * Common Errors:
 * - oauth_failed: Generic OAuth failure
 * - access_denied: User denied access
 * - invalid_state: CSRF validation failed
 * - server_error: Backend error
 *
 * @module app/(auth)/oauth/error
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

/**
 * Error message mapping for user-friendly messages
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  oauth_failed: {
    title: 'Authentication Failed',
    message: 'We could not complete the sign-in process. Please try again.',
  },
  access_denied: {
    title: 'Access Denied',
    message: 'You denied access to your account. Please try again and grant the necessary permissions.',
  },
  invalid_state: {
    title: 'Security Check Failed',
    message: 'The authentication request could not be validated. This may be due to an expired session. Please try again.',
  },
  server_error: {
    title: 'Server Error',
    message: 'An error occurred on our servers. Please try again in a few moments.',
  },
  rate_limited: {
    title: 'Too Many Attempts',
    message: 'You have made too many authentication attempts. Please wait a few minutes and try again.',
  },
  invalid_provider: {
    title: 'Invalid Provider',
    message: 'The authentication provider is not supported or configured correctly.',
  },
  default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during sign-in. Please try again.',
  },
}

/**
 * OAuth Error Callback Page Component
 */
export default function OAuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState({
    title: 'Loading...',
    message: '',
    errorCode: '',
    errorDescription: '',
  })

  useEffect(() => {
    // Extract error from URL query parameters
    const errorCode = searchParams.get('error') || 'default'
    const errorDescription = searchParams.get('error_description') || ''

    console.error('[OAuth Error] OAuth authentication failed', {
      errorCode,
      errorDescription,
    })

    // Get user-friendly error message
    const errorMapping = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default

    setErrorInfo({
      title: errorMapping.title,
      message: errorMapping.message,
      errorCode,
      errorDescription,
    })

    // Clean URL (remove error parameters)
    window.history.replaceState({}, '', '/auth/oauth/error')
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-red-800/50 bg-slate-900/80 p-8 backdrop-blur-sm">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1, type: 'spring' }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10"
          >
            <svg
              className="h-10 w-10 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </motion.div>

          {/* Error Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-3 text-center text-2xl font-semibold text-foreground"
          >
            {errorInfo.title}
          </motion.h2>

          {/* Error Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-6 text-center text-sm text-slate-400"
          >
            {errorInfo.message}
          </motion.p>

          {/* Technical Details (collapsed by default) */}
          {errorInfo.errorDescription && (
            <motion.details
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mb-6 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
            >
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-400">
                Technical Details
              </summary>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>
                  <span className="font-medium">Error Code:</span> {errorInfo.errorCode}
                </p>
                <p>
                  <span className="font-medium">Description:</span> {errorInfo.errorDescription}
                </p>
              </div>
            </motion.details>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="space-y-3"
          >
            {/* Try Again Button */}
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Try Again
            </button>

            {/* Help Link */}
            <p className="text-center text-xs text-slate-500">
              Need help?{' '}
              <a href="/support" className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
          </motion.div>
        </div>

        {/* Additional Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mt-6 text-center text-xs text-slate-600"
        >
          If you continue to experience issues, please ensure pop-ups are enabled and try using a different browser.
        </motion.p>
      </motion.div>
    </div>
  )
}
