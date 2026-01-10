import 'server-only'

import type { Session } from './types'
import { SESSION_COOKIE_NAME } from './constants'
import { encryptJWE } from '@/lib/jwe/encrypt'
import { upsertUser } from '@/lib/db/users'
import { encrypt } from '@/lib/crypto'
import ms from 'ms'

interface GoogleUser {
  sub: string // Google's unique user ID
  email: string
  email_verified: boolean
  name: string
  given_name?: string
  family_name?: string
  picture: string
}

export async function createGoogleSession(
  accessToken: string,
  idToken?: string,
  refreshToken?: string,
): Promise<Session | undefined> {
  // Fetch Google user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!userResponse.ok) {
    console.error('Failed to fetch Google user')
    return undefined
  }

  const googleUser = (await userResponse.json()) as GoogleUser

  if (!googleUser.email_verified) {
    console.error('Google email not verified')
    return undefined
  }

  // Create or update user in database
  const userId = await upsertUser({
    provider: 'google',
    externalId: googleUser.sub,
    accessToken: encrypt(accessToken),
    refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
    scope: 'openid email profile',
    username: googleUser.email.split('@')[0], // Use email prefix as username
    email: googleUser.email,
    name: googleUser.name,
    avatarUrl: googleUser.picture,
  })

  const session: Session = {
    created: Date.now(),
    authProvider: 'google',
    user: {
      id: userId,
      username: googleUser.email.split('@')[0],
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
    },
  }

  console.log('Created Google session with internal user ID:', session.user.id)
  return session
}

const COOKIE_TTL = ms('1y')

export async function saveSession(res: Response, session: Session | undefined): Promise<string | undefined> {
  if (!session) {
    res.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
    )
    return
  }

  const value = await encryptJWE(session, '1y')
  const expires = new Date(Date.now() + COOKIE_TTL).toUTCString()
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_TTL / 1000}; Expires=${expires}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
  )
  return value
}
