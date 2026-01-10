import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createGoogleSession, saveSession } from '@/lib/session/create-google'

export async function GET(req: NextRequest): Promise<Response> {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value ?? null
  const storedVerifier = cookieStore.get('google_oauth_code_verifier')?.value ?? null
  const storedRedirectTo = cookieStore.get('google_oauth_redirect_to')?.value ?? null

  if (
    code === null ||
    state === null ||
    storedState !== state ||
    storedRedirectTo === null ||
    storedVerifier === null
  ) {
    console.error('[Google Callback] Invalid OAuth state')
    return Response.redirect(new URL('/?error=invalid_state', req.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google`

  if (!clientId || !clientSecret) {
    console.error('[Google Callback] Google OAuth not configured')
    return Response.redirect(new URL('/?error=google_not_configured', req.url))
  }

  try {
    console.log('[Google Callback] Starting OAuth token exchange')

    // Exchange code for access token using PKCE
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        code_verifier: storedVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Google Callback] Token exchange failed:', errorText)
      return Response.redirect(new URL('/?error=token_exchange_failed', req.url))
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string
      id_token?: string
      refresh_token?: string
      expires_in: number
      token_type: string
      scope: string
      error?: string
      error_description?: string
    }

    if (!tokenData.access_token) {
      console.error('[Google Callback] No access token:', tokenData.error_description || tokenData.error)
      return Response.redirect(new URL('/?error=no_access_token', req.url))
    }

    console.log('[Google Callback] Token exchange successful, creating session')

    // Create session
    const session = await createGoogleSession(
      tokenData.access_token,
      tokenData.id_token,
      tokenData.refresh_token,
    )

    if (!session) {
      console.error('[Google Callback] Failed to create session')
      return Response.redirect(new URL('/?error=session_creation_failed', req.url))
    }

    console.log('[Google Callback] Session created for user:', session.user.id)

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
    cookieStore.delete('google_oauth_state')
    cookieStore.delete('google_oauth_code_verifier')
    cookieStore.delete('google_oauth_redirect_to')

    return response
  } catch (error) {
    console.error('[Google Callback] OAuth callback error:', error)
    return Response.redirect(new URL('/?error=oauth_error', req.url))
  }
}
