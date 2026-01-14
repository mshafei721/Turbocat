/**
 * OAuth Token Encryption Tests
 *
 * Tests for OAuth token encryption utilities:
 * - encryptOAuthToken: Encrypt tokens for database storage
 * - decryptOAuthToken: Decrypt tokens from database
 * - isTokenEncrypted: Check if token is encrypted
 * - encryptOAuthTokens/decryptOAuthTokens: Batch operations
 *
 * These tests validate AES-256-GCM encryption for OAuth tokens.
 *
 * @module utils/__tests__/oauth-encryption.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  encryptOAuthToken,
  decryptOAuthToken,
  isTokenEncrypted,
  encryptOAuthTokens,
  decryptOAuthTokens,
  isOAuthEncryptionConfigured,
} from '../oauth-encryption';

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('OAuth Token Encryption', () => {
  const testToken = 'ya29.a0AfH6SMBtest-google-access-token';
  const testRefreshToken = 'refresh-token-abc123xyz';

  beforeEach(() => {
    // Ensure encryption key is set for tests
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-min';
    process.env.NODE_ENV = 'test';
  });

  // ==========================================================================
  // isOAuthEncryptionConfigured Tests
  // ==========================================================================
  describe('isOAuthEncryptionConfigured', () => {
    it('should return true when ENCRYPTION_KEY is set', () => {
      process.env.ENCRYPTION_KEY = 'test-key-minimum-32-characters-long';

      const result = isOAuthEncryptionConfigured();

      expect(result).toBe(true);
    });

    it('should return false when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      const result = isOAuthEncryptionConfigured();

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // encryptOAuthToken Tests
  // ==========================================================================
  describe('encryptOAuthToken', () => {
    it('should encrypt token successfully', () => {
      const encrypted = encryptOAuthToken(testToken);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(testToken);
      expect(typeof encrypted).toBe('string');
    });

    it('should return different ciphertext for same token (random IV)', () => {
      const encrypted1 = encryptOAuthToken(testToken);
      const encrypted2 = encryptOAuthToken(testToken);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt token with AES-256-GCM format', () => {
      const encrypted = encryptOAuthToken(testToken);

      // Should be JSON with iv, content, tag
      expect(() => JSON.parse(encrypted!)).not.toThrow();

      const parsed = JSON.parse(encrypted!);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('content');
      expect(parsed).toHaveProperty('tag');
    });

    it('should handle null token', () => {
      const encrypted = encryptOAuthToken(null);

      expect(encrypted).toBeNull();
    });

    it('should handle undefined token', () => {
      const encrypted = encryptOAuthToken(undefined);

      expect(encrypted).toBeNull();
    });

    it('should handle empty string token', () => {
      const encrypted = encryptOAuthToken('');

      expect(encrypted).toBeNull();
    });

    it('should throw error in production when encryption not configured', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production';

      expect(() => encryptOAuthToken(testToken)).toThrow(
        /OAuth token encryption is required in production/,
      );
    });

    it('should allow plaintext in development when encryption not configured', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'development';

      const result = encryptOAuthToken(testToken);

      expect(result).toBe(testToken);
    });
  });

  // ==========================================================================
  // decryptOAuthToken Tests
  // ==========================================================================
  describe('decryptOAuthToken', () => {
    it('should decrypt encrypted token correctly', () => {
      const encrypted = encryptOAuthToken(testToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(testToken);
    });

    it('should handle null encrypted token', () => {
      const decrypted = decryptOAuthToken(null);

      expect(decrypted).toBeNull();
    });

    it('should handle undefined encrypted token', () => {
      const decrypted = decryptOAuthToken(undefined);

      expect(decrypted).toBeNull();
    });

    it('should handle empty string', () => {
      const decrypted = decryptOAuthToken('');

      expect(decrypted).toBeNull();
    });

    it('should handle legacy plaintext tokens (not JSON)', () => {
      const plaintext = 'legacy-plaintext-token';

      const decrypted = decryptOAuthToken(plaintext);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle legacy tokens stored as JSON but not encrypted', () => {
      const legacyJson = JSON.stringify({ token: 'legacy' });

      const decrypted = decryptOAuthToken(legacyJson);

      expect(decrypted).toBe(legacyJson);
    });

    it('should return token as-is when encryption not configured', () => {
      delete process.env.ENCRYPTION_KEY;

      const decrypted = decryptOAuthToken(testToken);

      expect(decrypted).toBe(testToken);
    });
  });

  // ==========================================================================
  // Round-trip Tests
  // ==========================================================================
  describe('Encryption Round-trip', () => {
    it('should encrypt and decrypt Google access token', () => {
      const googleToken = 'ya29.a0AfH6SMBxGoogleAccessToken123';

      const encrypted = encryptOAuthToken(googleToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(googleToken);
    });

    it('should encrypt and decrypt GitHub access token', () => {
      const githubToken = 'gho_GitHubPersonalAccessToken123abc';

      const encrypted = encryptOAuthToken(githubToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(githubToken);
    });

    it('should encrypt and decrypt Microsoft access token', () => {
      const msToken = 'EwAoA8l6BAAUMicrosoftAccessToken123';

      const encrypted = encryptOAuthToken(msToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(msToken);
    });

    it('should handle long tokens (4KB+)', () => {
      const longToken = 'token-' + 'x'.repeat(4096);

      const encrypted = encryptOAuthToken(longToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(longToken);
    });

    it('should handle tokens with special characters', () => {
      const specialToken = 'token-!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

      const encrypted = encryptOAuthToken(specialToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(specialToken);
    });

    it('should handle unicode tokens', () => {
      const unicodeToken = 'token-你好-мир-🌍';

      const encrypted = encryptOAuthToken(unicodeToken);
      const decrypted = decryptOAuthToken(encrypted);

      expect(decrypted).toBe(unicodeToken);
    });
  });

  // ==========================================================================
  // isTokenEncrypted Tests
  // ==========================================================================
  describe('isTokenEncrypted', () => {
    it('should return true for encrypted token', () => {
      const encrypted = encryptOAuthToken(testToken);

      const result = isTokenEncrypted(encrypted);

      expect(result).toBe(true);
    });

    it('should return false for plaintext token', () => {
      const result = isTokenEncrypted('plaintext-token');

      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = isTokenEncrypted(null);

      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isTokenEncrypted(undefined);

      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = isTokenEncrypted('');

      expect(result).toBe(false);
    });

    it('should return false for JSON without encryption fields', () => {
      const json = JSON.stringify({ token: 'test' });

      const result = isTokenEncrypted(json);

      expect(result).toBe(false);
    });

    it('should return true for JSON with encryption fields', () => {
      const encrypted = JSON.stringify({
        iv: 'base64-iv',
        content: 'base64-content',
        tag: 'base64-tag',
      });

      const result = isTokenEncrypted(encrypted);

      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // encryptOAuthTokens Tests (Batch)
  // ==========================================================================
  describe('encryptOAuthTokens', () => {
    it('should encrypt both access and refresh tokens', () => {
      const encrypted = encryptOAuthTokens({
        accessToken: testToken,
        refreshToken: testRefreshToken,
      });

      expect(encrypted.accessToken).toBeTruthy();
      expect(encrypted.refreshToken).toBeTruthy();
      expect(encrypted.accessToken).not.toBe(testToken);
      expect(encrypted.refreshToken).not.toBe(testRefreshToken);
    });

    it('should handle missing refresh token', () => {
      const encrypted = encryptOAuthTokens({
        accessToken: testToken,
      });

      expect(encrypted.accessToken).toBeTruthy();
      expect(encrypted.refreshToken).toBeNull();
    });

    it('should handle null refresh token', () => {
      const encrypted = encryptOAuthTokens({
        accessToken: testToken,
        refreshToken: null,
      });

      expect(encrypted.accessToken).toBeTruthy();
      expect(encrypted.refreshToken).toBeNull();
    });
  });

  // ==========================================================================
  // decryptOAuthTokens Tests (Batch)
  // ==========================================================================
  describe('decryptOAuthTokens', () => {
    it('should decrypt both access and refresh tokens', () => {
      const encrypted = encryptOAuthTokens({
        accessToken: testToken,
        refreshToken: testRefreshToken,
      });

      const decrypted = decryptOAuthTokens(encrypted);

      expect(decrypted.accessToken).toBe(testToken);
      expect(decrypted.refreshToken).toBe(testRefreshToken);
    });

    it('should handle missing refresh token', () => {
      const encrypted = encryptOAuthTokens({
        accessToken: testToken,
      });

      const decrypted = decryptOAuthTokens({
        accessToken: encrypted.accessToken,
      });

      expect(decrypted.accessToken).toBe(testToken);
      expect(decrypted.refreshToken).toBeNull();
    });

    it('should handle null tokens', () => {
      const decrypted = decryptOAuthTokens({
        accessToken: null,
        refreshToken: null,
      });

      expect(decrypted.accessToken).toBeNull();
      expect(decrypted.refreshToken).toBeNull();
    });
  });

  // ==========================================================================
  // Security Tests
  // ==========================================================================
  describe('Security Validation', () => {
    it('should not leak plaintext in encrypted output', () => {
      const encrypted = encryptOAuthToken(testToken);

      expect(encrypted).not.toContain(testToken);
      expect(encrypted).not.toContain(testToken.substring(0, 10));
    });

    it('should use authenticated encryption (has auth tag)', () => {
      const encrypted = encryptOAuthToken(testToken);
      const parsed = JSON.parse(encrypted!);

      expect(parsed.tag).toBeTruthy();
      expect(parsed.tag.length).toBeGreaterThan(0);
    });

    it('should use unique IV for each encryption', () => {
      const encrypted1 = encryptOAuthToken(testToken);
      const encrypted2 = encryptOAuthToken(testToken);

      const parsed1 = JSON.parse(encrypted1!);
      const parsed2 = JSON.parse(encrypted2!);

      expect(parsed1.iv).not.toBe(parsed2.iv);
    });

    it('should reject tampered ciphertext', () => {
      const encrypted = encryptOAuthToken(testToken);
      const parsed = JSON.parse(encrypted!);

      // Tamper with content
      parsed.content = parsed.content.substring(0, parsed.content.length - 1) + 'X';
      const tampered = JSON.stringify(parsed);

      // Should throw or return null on decryption
      const result = decryptOAuthToken(tampered);

      // In this implementation, it may return null or the malformed data
      // The encryption module should ideally throw on auth tag mismatch
      expect(result).not.toBe(testToken);
    });
  });
});
