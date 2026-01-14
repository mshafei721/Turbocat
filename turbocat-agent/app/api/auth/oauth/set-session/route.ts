/**
 * OAuth Session API Route
 *
 * Sets httpOnly cookies for JWT tokens received from backend OAuth flow.
 * This endpoint is called by the OAuth callback page after receiving tokens
 * from the backend.
 *
 * Security:
 * - httpOnly cookies prevent XSS attacks
 * - Secure flag in production (HTTPS only)
 * - SameSite=Lax prevents CSRF
 * - Short-lived access token (15 min)
 * - Long-lived refresh token (7 days)
 *
 * @module api/auth/oauth/set-session
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Request body validation schema
 */
const setSessionSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  accessTokenExpiresAt: z.string().optional(),
  refreshTokenExpiresAt: z.string().optional(),
})

/**
 * POST /api/auth/oauth/set-session
 *
 * Creates session by setting httpOnly cookies with JWT tokens.
 *
 * Request Body:
 * {
 *   "accessToken": "eyJhbGc...",
 *   "refreshToken": "eyJhbGc...",
 *   "accessTokenExpiresAt": "2026-01-12T21:00:00.000Z",
 *   "refreshTokenExpiresAt": "2026-01-19T20:45:00.000Z"
 * }
 *
 * Response:
 * {
 *   "success": true
 * }
 *
 * Cookies Set:
 * - turbocat_access_token (httpOnly, 15 min max-age)
 * - turbocat_refresh_token (httpOnly, 7 days max-age)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = setSessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 },
      )
    }

    const { accessToken, refreshToken } = validation.data

    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production'

    // Cookie settings
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax' as const,
      path: '/',
    }

    // Access token: 15 minutes (900 seconds)
    const accessTokenMaxAge = 900

    // Refresh token: 7 days (604800 seconds)
    const refreshTokenMaxAge = 604800

    // Create response with success message
    const response = NextResponse.json({ success: true })

    // Set access token cookie
    response.cookies.set('turbocat_access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge,
    })

    // Set refresh token cookie
    response.cookies.set('turbocat_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAge,
    })

    console.log('[OAuth Session] Session cookies set successfully')

    return response
  } catch (error) {
    console.error('[OAuth Session] Error setting session:', error)

    return NextResponse.json(
      {
        error: 'Failed to set session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/auth/oauth/set-session
 *
 * Clears session by removing httpOnly cookies.
 *
 * Response:
 * {
 *   "success": true
 * }
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const response = NextResponse.json({ success: true })

    // Clear access token cookie
    response.cookies.set('turbocat_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    // Clear refresh token cookie
    response.cookies.set('turbocat_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    console.log('[OAuth Session] Session cookies cleared successfully')

    return response
  } catch (error) {
    console.error('[OAuth Session] Error clearing session:', error)

    return NextResponse.json(
      {
        error: 'Failed to clear session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
