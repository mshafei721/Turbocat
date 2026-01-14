/**
 * Backend JWT Generation for Frontend
 *
 * Creates JWT tokens compatible with the backend auth system.
 * Uses jose library with HS256 algorithm to match backend's jsonwebtoken.
 *
 * Environment Variables Required:
 * - JWT_ACCESS_SECRET: Must match backend's JWT_ACCESS_SECRET
 */

import { SignJWT } from 'jose'

export interface BackendJwtPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'USER' | 'AGENT'
  sessionId?: string
}

const JWT_ACCESS_EXPIRY = '15m'

/**
 * Get JWT secret from environment
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET not configured')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Generate a backend-compatible access token
 *
 * @param payload - User payload to encode in the token
 * @returns The signed JWT access token
 */
export async function generateBackendAccessToken(payload: BackendJwtPayload): Promise<string> {
  const secret = getJwtSecret()

  const token = await new SignJWT({
    ...payload,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(JWT_ACCESS_EXPIRY)
    .sign(secret)

  return token
}

/**
 * Check if JWT generation is configured
 */
export function isBackendJwtConfigured(): boolean {
  return !!process.env.JWT_ACCESS_SECRET
}
