/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption and decryption for sensitive data
 * such as environment variables in deployments.
 *
 * Security:
 * - Uses AES-256-GCM for authenticated encryption
 * - Random IV generated for each encryption
 * - Auth tag provides integrity verification
 *
 * Environment:
 * - Requires ENCRYPTION_KEY (64-character hex string = 32 bytes)
 * - Generate with: openssl rand -hex 32
 *
 * @module utils/encryption
 */

import crypto from 'crypto';
import { logger } from '../lib/logger';

/**
 * Encryption algorithm (AES-256-GCM)
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * IV length in bytes (12 bytes recommended for GCM)
 */
const IV_LENGTH = 12;

/**
 * Auth tag length in bytes
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * @returns Buffer containing the encryption key
 * @throws Error if ENCRYPTION_KEY is not configured or invalid
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not configured');
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes). Generate with: openssl rand -hex 32',
    );
  }

  return Buffer.from(key, 'hex');
};

/**
 * Check if encryption is configured
 * @returns True if encryption key is available
 */
export const isEncryptionConfigured = (): boolean => {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
};

/**
 * Encrypted data format
 */
export interface EncryptedData {
  /** Base64 encoded initialization vector */
  iv: string;
  /** Base64 encoded encrypted content */
  content: string;
  /** Base64 encoded authentication tag */
  tag: string;
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Encrypted data object with iv, content, and tag
 * @throws Error if encryption fails or key not configured
 *
 * @example
 * ```typescript
 * const encrypted = encrypt('my-secret-value');
 * // { iv: 'base64...', content: 'base64...', tag: 'base64...' }
 * ```
 */
export const encrypt = (plaintext: string): EncryptedData => {
  const key = getEncryptionKey();

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Get auth tag
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    content: encrypted.toString('base64'),
    tag: tag.toString('base64'),
  };
};

/**
 * Decrypt encrypted data using AES-256-GCM
 *
 * @param encryptedData - The encrypted data object
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails, key not configured, or data tampered
 *
 * @example
 * ```typescript
 * const encrypted = { iv: '...', content: '...', tag: '...' };
 * const plaintext = decrypt(encrypted);
 * ```
 */
export const decrypt = (encryptedData: EncryptedData): string => {
  const key = getEncryptionKey();

  // Decode base64 values
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const content = Buffer.from(encryptedData.content, 'base64');
  const tag = Buffer.from(encryptedData.tag, 'base64');

  // Validate lengths
  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set auth tag
  decipher.setAuthTag(tag);

  // Decrypt
  let decrypted = decipher.update(content);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
};

/**
 * Encrypt an object (typically environment variables)
 *
 * Each value is encrypted individually, allowing for partial updates
 * without re-encrypting unchanged values.
 *
 * @param obj - Object with string values to encrypt
 * @returns Object with encrypted values
 *
 * @example
 * ```typescript
 * const envVars = { API_KEY: 'secret', DB_PASSWORD: 'pass123' };
 * const encrypted = encryptObject(envVars);
 * // { API_KEY: { iv: '...', content: '...', tag: '...' }, ... }
 * ```
 */
export const encryptObject = (obj: Record<string, string>): Record<string, EncryptedData> => {
  const result: Record<string, EncryptedData> = {};

  for (const [key, value] of Object.entries(obj)) {
    try {
      result[key] = encrypt(value);
    } catch (error) {
      logger.error('[Encryption] Failed to encrypt field:', {
        field: key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to encrypt field: ${key}`);
    }
  }

  return result;
};

/**
 * Decrypt an object of encrypted values
 *
 * @param obj - Object with encrypted values
 * @returns Object with decrypted string values
 *
 * @example
 * ```typescript
 * const encrypted = { API_KEY: { iv: '...', content: '...', tag: '...' } };
 * const decrypted = decryptObject(encrypted);
 * // { API_KEY: 'secret' }
 * ```
 */
export const decryptObject = (obj: Record<string, EncryptedData>): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    try {
      result[key] = decrypt(value);
    } catch (error) {
      logger.error('[Encryption] Failed to decrypt field:', {
        field: key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to decrypt field: ${key}`);
    }
  }

  return result;
};

/**
 * Mask a sensitive value for display
 * Shows only the first and last few characters
 *
 * @param value - The value to mask
 * @param visibleChars - Number of visible characters at start and end (default: 4)
 * @returns Masked value like "sec****ret"
 *
 * @example
 * ```typescript
 * maskValue('my-secret-api-key'); // 'my-s****-key'
 * maskValue('short'); // '****'
 * ```
 */
export const maskValue = (value: string, visibleChars: number = 4): string => {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(Math.max(4, value.length));
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(Math.min(8, value.length - visibleChars * 2));

  return `${start}${masked}${end}`;
};

/**
 * Mask environment variables for safe display
 *
 * @param envVars - Object with string values to mask
 * @returns Object with masked values
 *
 * @example
 * ```typescript
 * const envVars = { API_KEY: 'sk-123456789abcdef', DB_URL: 'postgres://user:pass@host/db' };
 * const masked = maskEnvironmentVariables(envVars);
 * // { API_KEY: 'sk-1****cdef', DB_URL: 'post****t/db' }
 * ```
 */
export const maskEnvironmentVariables = (
  envVars: Record<string, string>,
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(envVars)) {
    result[key] = maskValue(value);
  }

  return result;
};

/**
 * Check if a value is an encrypted data object
 *
 * @param value - Value to check
 * @returns True if value has encryption structure
 */
export const isEncryptedData = (value: unknown): value is EncryptedData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.iv === 'string' && typeof obj.content === 'string' && typeof obj.tag === 'string'
  );
};

export default {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  maskValue,
  maskEnvironmentVariables,
  isEncryptionConfigured,
  isEncryptedData,
};
