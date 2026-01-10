import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { generateState } from 'arctic'
import { isRelativeUrl } from '@/lib/utils/is-relative-url'

export async function GET(req: NextRequest): Promise<Response> {
  const clientId = process.env.APPLE_CLIENT_ID

  if (!clientId) {
    return Response.redirect(new URL('/?error=apple_not_configured', req.url))
  }

  const state = generateState()
  const store = await cookies()
  const redirectTo = isRelativeUrl(req.nextUrl.searchParams.get('next') ?? '/dashboard')
    ? (req.nextUrl.searchParams.get('next') ?? '/dashboard')
    : '/dashboard'

  // Store state in cookies
  const cookiesToSet: [string, string][] = [
    ['apple_oauth_redirect_to', redirectTo],
    ['apple_oauth_state', state],
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

  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/apple`

  // Build Apple authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state: state,
  })

  const url = `https://appleid.apple.com/auth/authorize?${params.toString()}`

  return Response.redirect(url)
}
