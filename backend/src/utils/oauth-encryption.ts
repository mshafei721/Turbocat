/**
 * OAuth Token Encryption Utilities
 *
 * Provides AES-256-GCM encryption specifically for OAuth tokens.
 * OAuth tokens (access and refresh) are encrypted before storage in the database
 * and decrypted when needed for API calls to OAuth providers.
 *
 * Uses the existing encryption infrastructure but with clear naming for OAuth use case.
 *
 * Security:
 * - AES-256-GCM provides authenticated encryption
 * - Random IV for each encryption prevents pattern analysis
 * - Auth tag prevents tampering
 * - Reuses ENCRYPTION_KEY from environment (same key as other sensitive data)
 *
 * @module utils/oauth-encryption
 */

import { encrypt, decrypt, isEncryptionConfigured, EncryptedData } from './encryption';
import { logger } from '../lib/logger';

/**
 * Encrypted OAuth token format stored in database
 *
 * Tokens are stored as JSON-serialized EncryptedData objects.
 * Format: { iv: 'base64', content: 'base64', tag: 'base64' }
 */
export type EncryptedOAuthToken = string;

/**
 * Check if OAuth token encryption is available
 *
 * @returns True if encryption key is configured
 */
export const isOAuthEncryptionConfigured = (): boolean => {
  return isEncryptionConfigured();
};

/**
 * Encrypt an OAuth token for database storage
 *
 * @param token - The raw OAuth token (access or refresh)
 * @returns Encrypted token as JSON string, or null if encryption fails/not configured
 *
 * @example
 * ```typescript
 * const encryptedAccessToken = encryptOAuthToken(oauthTokens.accessToken);
 * const encryptedRefreshToken = encryptOAuthToken(oauthTokens.refreshToken);
 *
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: {
 *     oauthAccessToken: encryptedAccessToken,
 *     oauthRefreshToken: encryptedRefreshToken,
 *   },
 * });
 * ```
 */
export const encryptOAuthToken = (token: string | null | undefined): string | null => {
  // Handle null/undefined tokens
  if (!token) {
    return null;
  }

  // Check if encryption is configured
  if (!isEncryptionConfigured()) {
    logger.warn('[OAuth Encryption] Encryption not configured - storing token in plaintext');
    // In production, this should fail. In development, allow plaintext for testing.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OAuth token encryption is required in production. Set ENCRYPTION_KEY.');
    }
    return token;
  }

  try {
    // Encrypt the token
    const encrypted: EncryptedData = encrypt(token);

    // Serialize to JSON string for database storage
    const serialized = JSON.stringify(encrypted);

    logger.debug('[OAuth Encryption] Token encrypted successfully', {
      tokenLength: token.length,
      encryptedLength: serialized.length,
    });

    return serialized;
  } catch (error) {
    logger.error('[OAuth Encryption] Failed to encrypt token', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to encrypt OAuth token');
  }
};

/**
 * Decrypt an OAuth token from database storage
 *
 * @param encryptedToken - The encrypted token (JSON string or plaintext)
 * @returns Decrypted token, or null if decryption fails
 *
 * @example
 * ```typescript
 * const user = await prisma.user.findUnique({
 *   where: { id: userId },
 *   select: { oauthAccessToken: true, oauthRefreshToken: true },
 * });
 *
 * const accessToken = decryptOAuthToken(user.oauthAccessToken);
 * const refreshToken = decryptOAuthToken(user.oauthRefreshToken);
 * ```
 */
export const decryptOAuthToken = (encryptedToken: string | null | undefined): string | null => {
  // Handle null/undefined tokens
  if (!encryptedToken) {
    return null;
  }

  // Check if encryption is configured
  if (!isEncryptionConfigured()) {
    logger.warn('[OAuth Encryption] Encryption not configured - returning token as-is');
    return encryptedToken;
  }

  try {
    // Try to parse as JSON (encrypted format)
    const parsed = JSON.parse(encryptedToken) as unknown;

    // Validate it looks like EncryptedData
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'iv' in parsed &&
      'content' in parsed &&
      'tag' in parsed
    ) {
      // It's encrypted - decrypt it
      const decrypted = decrypt(parsed as EncryptedData);

      logger.debug('[OAuth Encryption] Token decrypted successfully', {
        encryptedLength: encryptedToken.length,
        decryptedLength: decrypted.length,
      });

      return decrypted;
    }

    // Parsed but not encrypted format - might be legacy plaintext stored as JSON
    logger.warn('[OAuth Encryption] Token appears to be in legacy format');
    return encryptedToken;
  } catch (parseError) {
    // Not valid JSON - assume it's legacy plaintext
    logger.warn('[OAuth Encryption] Token is not encrypted (legacy format)', {
      tokenLength: encryptedToken.length,
    });
    return encryptedToken;
  }
};

/**
 * Check if a token appears to be encrypted
 *
 * @param token - The token to check
 * @returns True if token appears to be in encrypted format
 */
export const isTokenEncrypted = (token: string | null | undefined): boolean => {
  if (!token) {
    return false;
  }

  try {
    const parsed = JSON.parse(token) as unknown;
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'iv' in parsed &&
      'content' in parsed &&
      'tag' in parsed
    );
  } catch {
    return false;
  }
};

/**
 * Encrypt OAuth tokens for database storage
 *
 * Convenience function that encrypts both access and refresh tokens.
 *
 * @param tokens - Object containing accessToken and optional refreshToken
 * @returns Object with encrypted tokens
 *
 * @example
 * ```typescript
 * const encryptedTokens = encryptOAuthTokens({
 *   accessToken: oauthTokens.accessToken,
 *   refreshToken: oauthTokens.refreshToken,
 * });
 *
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: {
 *     oauthAccessToken: encryptedTokens.accessToken,
 *     oauthRefreshToken: encryptedTokens.refreshToken,
 *   },
 * });
 * ```
 */
export const encryptOAuthTokens = (tokens: {
  accessToken: string;
  refreshToken?: string | null;
}): {
  accessToken: string | null;
  refreshToken: string | null;
} => {
  return {
    accessToken: encryptOAuthToken(tokens.accessToken),
    refreshToken: encryptOAuthToken(tokens.refreshToken),
  };
};

/**
 * Decrypt OAuth tokens from database storage
 *
 * Convenience function that decrypts both access and refresh tokens.
 *
 * @param tokens - Object containing encrypted accessToken and optional refreshToken
 * @returns Object with decrypted tokens
 */
export const decryptOAuthTokens = (tokens: {
  accessToken: string | null;
  refreshToken?: string | null;
}): {
  accessToken: string | null;
  refreshToken: string | null;
} => {
  return {
    accessToken: decryptOAuthToken(tokens.accessToken),
    refreshToken: decryptOAuthToken(tokens.refreshToken),
  };
};

export default {
  isOAuthEncryptionConfigured,
  encryptOAuthToken,
  decryptOAuthToken,
  isTokenEncrypted,
  encryptOAuthTokens,
  decryptOAuthTokens,
};
