import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createAppleSession, saveSession } from '@/lib/session/create-apple'

// Apple uses form_post response mode, so we need a POST handler
export async function POST(req: NextRequest): Promise<Response> {
  const formData = await req.formData()
  const code = formData.get('code') as string | null
  const state = formData.get('state') as string | null
  const idToken = formData.get('id_token') as string | null
  const userStr = formData.get('user') as string | null // Only sent on first authorization

  const cookieStore = await cookies()
  const storedState = cookieStore.get('apple_oauth_state')?.value ?? null
  const storedRedirectTo = cookieStore.get('apple_oauth_redirect_to')?.value ?? null

  if (state === null || storedState !== state || storedRedirectTo === null) {
    console.error('[Apple Callback] Invalid OAuth state')
    return Response.redirect(new URL('/?error=invalid_state', req.url))
  }

  // Apple provides id_token directly in the callback, so we can create session without exchanging code
  // However, if we need access_token for API calls, we need to exchange the code
  if (!idToken) {
    console.error('[Apple Callback] No ID token received')
    return Response.redirect(new URL('/?error=no_id_token', req.url))
  }

  const clientId = process.env.APPLE_CLIENT_ID
  const clientSecret = process.env.APPLE_CLIENT_SECRET

  if (!clientId) {
    console.error('[Apple Callback] Apple OAuth not configured')
    return Response.redirect(new URL('/?error=apple_not_configured', req.url))
  }

  try {
    console.log('[Apple Callback] Processing Apple sign-in')

    // Parse user info if provided (only sent on first authorization)
    let userInfo: { name?: { firstName?: string; lastName?: string }; email?: string } | undefined
    if (userStr) {
      try {
        userInfo = JSON.parse(userStr)
      } catch {
        console.error('[Apple Callback] Failed to parse user info')
      }
    }

    // Exchange code for tokens if we have client secret configured
    let accessToken: string | undefined
    let refreshToken: string | undefined

    if (code && clientSecret) {
      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: `${req.nextUrl.origin}/api/auth/callback/apple`,
        }),
      })

      if (tokenResponse.ok) {
        const tokenData = (await tokenResponse.json()) as {
          access_token: string
          refresh_token?: string
          id_token: string
          token_type: string
          expires_in: number
        }
        accessToken = tokenData.access_token
        refreshToken = tokenData.refresh_token
      } else {
        // Log but don't fail - we can still create session with just the id_token
        console.warn('[Apple Callback] Failed to exchange code for tokens, continuing with id_token only')
      }
    }

    // Create session
    const session = await createAppleSession(idToken, accessToken, refreshToken, userInfo)

    if (!session) {
      console.error('[Apple Callback] Failed to create session')
      return Response.redirect(new URL('/?error=session_creation_failed', req.url))
    }

    console.log('[Apple Callback] Session created for user:', session.user.id)

    // Create response with redirect
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: storedRedirectTo,
      },
    })

    // Save session to cookie
    await saveSession(response, session)

    // Clean up OAuth cookies
    cookieStore.delete('apple_oauth_state')
    cookieStore.delete('apple_oauth_redirect_to')

    return response
  } catch (error) {
    console.error('[Apple Callback] OAuth callback error:', error)
    return Response.redirect(new URL('/?error=oauth_error', req.url))
  }
}

// Also handle GET for error redirects from Apple
export async function GET(req: NextRequest): Promise<Response> {
  const error = req.nextUrl.searchParams.get('error')
  if (error) {
    console.error('[Apple Callback] Error from Apple:', error)
    return Response.redirect(new URL(`/?error=${error}`, req.url))
  }
  return Response.redirect(new URL('/?error=invalid_request', req.url))
}
