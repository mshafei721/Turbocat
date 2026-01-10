import 'server-only'

import type { Session } from './types'
import { SESSION_COOKIE_NAME } from './constants'
import { encryptJWE } from '@/lib/jwe/encrypt'
import { upsertUser } from '@/lib/db/users'
import { encrypt } from '@/lib/crypto'
import ms from 'ms'

interface AppleIdTokenPayload {
  iss: string // https://appleid.apple.com
  aud: string // Client ID
  exp: number
  iat: number
  sub: string // Apple's unique user ID
  email?: string
  email_verified?: boolean | string
  is_private_email?: boolean | string
  real_user_status?: number
  nonce_supported?: boolean
}

interface AppleUserInfo {
  name?: {
    firstName?: string
    lastName?: string
  }
  email?: string
}

/**
 * Decode Apple ID token (JWT) without verification
 * In production, you should verify the token signature
 */
function decodeAppleIdToken(idToken: string): AppleIdTokenPayload | null {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return null
    }
    // Decode base64url payload
    const payload = parts[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded) as AppleIdTokenPayload
  } catch (error) {
    console.error('Failed to decode Apple ID token:', error)
    return null
  }
}

export async function createAppleSession(
  idToken: string,
  accessToken?: string,
  refreshToken?: string,
  userInfo?: AppleUserInfo,
): Promise<Session | undefined> {
  // Decode the ID token to get user information
  const tokenPayload = decodeAppleIdToken(idToken)

  if (!tokenPayload) {
    console.error('Failed to decode Apple ID token')
    return undefined
  }

  // Email may not be available on subsequent logins (Apple only sends it on first auth)
  // We need to store it on first login
  const email = userInfo?.email || tokenPayload.email
  const name =
    userInfo?.name?.firstName && userInfo?.name?.lastName
      ? `${userInfo.name.firstName} ${userInfo.name.lastName}`
      : userInfo?.name?.firstName || 'Apple User'

  // Generate a username from email or use a default
  const username = email ? email.split('@')[0] : `apple_${tokenPayload.sub.slice(0, 8)}`

  // Create or update user in database
  // Use the id_token as access_token if no access_token is available (for id_token-only flow)
  const tokenToStore = accessToken || idToken
  const userId = await upsertUser({
    provider: 'apple',
    externalId: tokenPayload.sub,
    accessToken: encrypt(tokenToStore),
    refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
    scope: 'name email',
    username,
    email: email || undefined,
    name,
    avatarUrl: undefined, // Apple doesn't provide avatar
  })

  const session: Session = {
    created: Date.now(),
    authProvider: 'apple',
    user: {
      id: userId,
      username,
      email: email || undefined,
      name,
      avatar: '', // Apple doesn't provide avatar, use default in UI
    },
  }

  console.log('Created Apple session with internal user ID:', session.user.id)
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
