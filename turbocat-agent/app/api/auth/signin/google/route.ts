import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { generateState, generateCodeVerifier } from 'arctic'
import { isRelativeUrl } from '@/lib/utils/is-relative-url'

export async function GET(req: NextRequest): Promise<Response> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google`

  if (!clientId) {
    return Response.redirect(new URL('/?error=google_not_configured', req.url))
  }

  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const store = await cookies()
  const redirectTo = isRelativeUrl(req.nextUrl.searchParams.get('next') ?? '/dashboard')
    ? (req.nextUrl.searchParams.get('next') ?? '/dashboard')
    : '/dashboard'

  // Store state and PKCE verifier in cookies
  const cookiesToSet: [string, string][] = [
    ['google_oauth_redirect_to', redirectTo],
    ['google_oauth_state', state],
    ['google_oauth_code_verifier', codeVerifier],
  ]

  for (const [key, value] of cookiesToSet) {
    store.set(key, value, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax',
    })
  }

  // Generate PKCE code challenge
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  // Build Google authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return Response.redirect(url)
}
