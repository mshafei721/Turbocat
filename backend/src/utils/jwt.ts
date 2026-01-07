/**
 * JWT Token Generation and Verification Utilities
 *
 * This module provides utilities for generating and verifying JWT tokens
 * for authentication purposes. It uses separate secrets for access and
 * refresh tokens to enhance security.
 *
 * Token Types:
 * - Access Token: Short-lived (15 min default), used for API requests
 * - Refresh Token: Long-lived (7 days default), used to obtain new access tokens
 *
 * Environment Variables Required:
 * - JWT_ACCESS_SECRET: Secret for signing access tokens (min 32 characters)
 * - JWT_REFRESH_SECRET: Secret for signing refresh tokens (min 32 characters)
 * - JWT_ACCESS_EXPIRY: Access token expiry (default: 15m)
 * - JWT_REFRESH_EXPIRY: Refresh token expiry (default: 7d)
 *
 * @module utils/jwt
 */

import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
  SignOptions,
} from 'jsonwebtoken';
import { logger } from '../lib/logger';

/**
 * User payload stored in JWT tokens
 */
export interface JwtUserPayload {
  /** User ID (UUID) */
  userId: string;
  /** User email */
  email: string;
  /** User role */
  role: 'ADMIN' | 'USER' | 'AGENT';
  /** Session ID for tracking/invalidation */
  sessionId?: string;
}

/**
 * Decoded JWT token structure
 */
export interface DecodedToken extends JwtUserPayload {
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Token type (access or refresh) */
  type: 'access' | 'refresh';
}

/**
 * Token generation result
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  valid: boolean;
  payload?: DecodedToken;
  error?: string;
  errorCode?: 'EXPIRED' | 'INVALID' | 'MALFORMED' | 'NOT_BEFORE';
}

/**
 * Minimum secret length for security
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Default token expiry times
 */
const DEFAULT_ACCESS_EXPIRY = '15m';
const DEFAULT_REFRESH_EXPIRY = '7d';

/**
 * Get JWT secrets from environment
 */
interface JwtSecrets {
  accessSecret: string;
  refreshSecret: string;
}

const getJwtSecrets = (): JwtSecrets | null => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    logger.warn('[JWT] Missing JWT secrets in environment');
    return null;
  }

  if (accessSecret.length < MIN_SECRET_LENGTH) {
    logger.warn('[JWT] JWT_ACCESS_SECRET is too short (min 32 characters)');
  }

  if (refreshSecret.length < MIN_SECRET_LENGTH) {
    logger.warn('[JWT] JWT_REFRESH_SECRET is too short (min 32 characters)');
  }

  // Warn if using same secret for both (security risk)
  if (accessSecret === refreshSecret) {
    logger.warn('[JWT] Using same secret for access and refresh tokens is not recommended');
  }

  return { accessSecret, refreshSecret };
};

/**
 * Get token expiry configuration from environment
 * Returns expiry in seconds for jwt.sign()
 */
const getTokenExpiry = (): {
  accessExpiry: number;
  refreshExpiry: number;
  accessExpiryStr: string;
  refreshExpiryStr: string;
} => {
  const accessExpiryStr = process.env.JWT_ACCESS_EXPIRY || DEFAULT_ACCESS_EXPIRY;
  const refreshExpiryStr = process.env.JWT_REFRESH_EXPIRY || DEFAULT_REFRESH_EXPIRY;

  return {
    accessExpiry: parseExpiryToSeconds(accessExpiryStr),
    refreshExpiry: parseExpiryToSeconds(refreshExpiryStr),
    accessExpiryStr,
    refreshExpiryStr,
  };
};

/**
 * Parse expiry string to seconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 */
const parseExpiryToSeconds = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 15 minutes if invalid format
    logger.warn(`[JWT] Invalid expiry format: ${expiry}, defaulting to 15m`);
    return 15 * 60;
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2] as string;

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 15 * 60;
  }
};

/**
 * Parse expiry string to milliseconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 */
const parseExpiryToMs = (expiry: string): number => {
  return parseExpiryToSeconds(expiry) * 1000;
};

/**
 * Check if JWT utilities are properly configured
 */
export const isJwtConfigured = (): boolean => {
  return getJwtSecrets() !== null;
};

/**
 * Generate an access token
 *
 * @param payload - User payload to encode in the token
 * @returns The signed JWT access token
 * @throws Error if JWT secrets are not configured
 *
 * Usage:
 * ```typescript
 * const accessToken = generateAccessToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'USER',
 *   sessionId: 'session-abc'
 * });
 * ```
 */
export const generateAccessToken = (payload: JwtUserPayload): string => {
  const secrets = getJwtSecrets();
  if (!secrets) {
    throw new Error('JWT secrets not configured');
  }

  const { accessExpiry } = getTokenExpiry();

  const tokenPayload = {
    ...payload,
    type: 'access' as const,
  };

  const signOptions: SignOptions = {
    expiresIn: accessExpiry,
    algorithm: 'HS256',
  };

  const token = jwt.sign(tokenPayload, secrets.accessSecret, signOptions);

  return token;
};

/**
 * Generate a refresh token
 *
 * @param payload - User payload to encode in the token
 * @returns The signed JWT refresh token
 * @throws Error if JWT secrets are not configured
 *
 * Usage:
 * ```typescript
 * const refreshToken = generateRefreshToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'USER',
 *   sessionId: 'session-abc'
 * });
 * ```
 */
export const generateRefreshToken = (payload: JwtUserPayload): string => {
  const secrets = getJwtSecrets();
  if (!secrets) {
    throw new Error('JWT secrets not configured');
  }

  const { refreshExpiry } = getTokenExpiry();

  const tokenPayload = {
    ...payload,
    type: 'refresh' as const,
  };

  const signOptions: SignOptions = {
    expiresIn: refreshExpiry,
    algorithm: 'HS256',
  };

  const token = jwt.sign(tokenPayload, secrets.refreshSecret, signOptions);

  return token;
};

/**
 * Generate both access and refresh tokens
 *
 * @param payload - User payload to encode in the tokens
 * @returns Token pair with expiration dates
 * @throws Error if JWT secrets are not configured
 *
 * Usage:
 * ```typescript
 * const tokens = generateTokenPair({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'USER',
 *   sessionId: 'session-abc'
 * });
 * console.log(tokens.accessToken);
 * console.log(tokens.refreshToken);
 * console.log(tokens.accessTokenExpiresAt);
 * ```
 */
export const generateTokenPair = (payload: JwtUserPayload): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const { accessExpiryStr, refreshExpiryStr } = getTokenExpiry();
  const now = Date.now();

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(now + parseExpiryToMs(accessExpiryStr)),
    refreshTokenExpiresAt: new Date(now + parseExpiryToMs(refreshExpiryStr)),
  };
};

/**
 * Verify an access token
 *
 * @param token - The JWT access token to verify
 * @returns Verification result with payload if valid
 *
 * Usage:
 * ```typescript
 * const result = verifyAccessToken(token);
 * if (result.valid) {
 *   console.log('User ID:', result.payload.userId);
 * } else {
 *   console.log('Error:', result.error);
 * }
 * ```
 */
export const verifyAccessToken = (token: string): TokenVerificationResult => {
  const secrets = getJwtSecrets();
  if (!secrets) {
    return {
      valid: false,
      error: 'JWT secrets not configured',
      errorCode: 'INVALID',
    };
  }

  try {
    const decoded = jwt.verify(token, secrets.accessSecret, {
      algorithms: ['HS256'],
    }) as DecodedToken;

    // Verify it's an access token
    if (decoded.type !== 'access') {
      return {
        valid: false,
        error: 'Invalid token type: expected access token',
        errorCode: 'INVALID',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    return handleJwtError(error);
  }
};

/**
 * Verify a refresh token
 *
 * @param token - The JWT refresh token to verify
 * @returns Verification result with payload if valid
 *
 * Usage:
 * ```typescript
 * const result = verifyRefreshToken(token);
 * if (result.valid) {
 *   // Generate new access token
 *   const newAccessToken = generateAccessToken(result.payload);
 * }
 * ```
 */
export const verifyRefreshToken = (token: string): TokenVerificationResult => {
  const secrets = getJwtSecrets();
  if (!secrets) {
    return {
      valid: false,
      error: 'JWT secrets not configured',
      errorCode: 'INVALID',
    };
  }

  try {
    const decoded = jwt.verify(token, secrets.refreshSecret, {
      algorithms: ['HS256'],
    }) as DecodedToken;

    // Verify it's a refresh token
    if (decoded.type !== 'refresh') {
      return {
        valid: false,
        error: 'Invalid token type: expected refresh token',
        errorCode: 'INVALID',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    return handleJwtError(error);
  }
};

/**
 * Handle JWT verification errors
 */
const handleJwtError = (error: unknown): TokenVerificationResult => {
  if (error instanceof TokenExpiredError) {
    return {
      valid: false,
      error: 'Token has expired',
      errorCode: 'EXPIRED',
    };
  }

  if (error instanceof NotBeforeError) {
    return {
      valid: false,
      error: 'Token not yet valid',
      errorCode: 'NOT_BEFORE',
    };
  }

  if (error instanceof JsonWebTokenError) {
    return {
      valid: false,
      error: error.message,
      errorCode: 'MALFORMED',
    };
  }

  return {
    valid: false,
    error: 'Unknown token verification error',
    errorCode: 'INVALID',
  };
};

/**
 * Decode a token without verification
 * Useful for debugging or getting token info without validation
 *
 * WARNING: This does NOT verify the token signature!
 * Only use for non-security purposes like logging or debugging.
 *
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if malformed
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.decode(token) as DecodedToken | null;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Check if a token is expired without full verification
 *
 * @param token - The JWT token to check
 * @returns True if expired, false if valid or unknown
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get remaining time until token expiration in seconds
 *
 * @param token - The JWT token to check
 * @returns Remaining seconds until expiration, or 0 if expired/invalid
 */
export const getTokenRemainingTime = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const remainingMs = decoded.exp * 1000 - Date.now();
  return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
};

/**
 * Extract user ID from token without full verification
 *
 * WARNING: Use only for logging/debugging. Always verify tokens
 * before using them for authorization decisions.
 *
 * @param token - The JWT token
 * @returns User ID or null if invalid
 */
export const extractUserIdFromToken = (token: string): string | null => {
  const decoded = decodeToken(token);
  return decoded?.userId || null;
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
  isJwtConfigured,
};
