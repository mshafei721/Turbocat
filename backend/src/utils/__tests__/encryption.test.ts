/**
 * Tests for Encryption Utilities
 *
 * Tests the encryption functionality including:
 * - encrypt/decrypt
 * - encryptObject/decryptObject
 * - maskValue
 * - isEncryptedData
 */

import crypto from 'crypto';
import * as encryption from '../encryption';

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Encryption Utilities', () => {
  // Store original env
  const originalEnv = process.env;

  // Valid 64-character hex key (32 bytes)
  const validEncryptionKey = 'a'.repeat(64);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: validEncryptionKey,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when encryption key is configured', () => {
      expect(encryption.isEncryptionConfigured()).toBe(true);
    });

    it('should return false when encryption key is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(encryption.isEncryptionConfigured()).toBe(false);
    });

    it('should return false when encryption key is invalid length', () => {
      process.env.ENCRYPTION_KEY = 'too-short';
      expect(encryption.isEncryptionConfigured()).toBe(false);
    });

    it('should return false when encryption key contains non-hex characters', () => {
      process.env.ENCRYPTION_KEY = 'g'.repeat(64); // 'g' is not valid hex
      expect(encryption.isEncryptionConfigured()).toBe(false);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string successfully', () => {
      const plaintext = 'my-secret-value';

      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return different encrypted values for the same input (random IV)', () => {
      const plaintext = 'test-value';

      const encrypted1 = encryption.encrypt(plaintext);
      const encrypted2 = encryption.encrypt(plaintext);

      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Content should be different (due to different IVs)
      expect(encrypted1.content).not.toBe(encrypted2.content);
    });

    it('should produce valid encrypted data structure', () => {
      const encrypted = encryption.encrypt('test');

      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('content');
      expect(encrypted).toHaveProperty('tag');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.content).toBe('string');
      expect(typeof encrypted.tag).toBe('string');
    });

    it('should encrypt empty string', () => {
      const plaintext = '';

      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should encrypt special characters and unicode', () => {
      const plaintext = 'Special chars: !@#$%^&*() and unicode: ';

      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt long strings', () => {
      const plaintext = 'x'.repeat(10000);

      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error when encryption key is not configured', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encryption.encrypt('test')).toThrow('ENCRYPTION_KEY');
    });

    it('should throw error for invalid IV length during decryption', () => {
      const encryptedData: encryption.EncryptedData = {
        iv: 'short',
        content: 'some-content',
        tag: 'some-tag',
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow('Invalid IV length');
    });

    it('should throw error for invalid auth tag length during decryption', () => {
      const validIv = Buffer.from(crypto.randomBytes(12)).toString('base64');
      const encryptedData: encryption.EncryptedData = {
        iv: validIv,
        content: 'some-content',
        tag: 'short', // Invalid tag length
      };

      expect(() => encryption.decrypt(encryptedData)).toThrow('Invalid auth tag length');
    });

    it('should throw error for tampered content (authentication failure)', () => {
      const encrypted = encryption.encrypt('original-value');

      // Tamper with the content
      const tamperedData: encryption.EncryptedData = {
        ...encrypted,
        content: Buffer.from('tampered').toString('base64'),
      };

      expect(() => encryption.decrypt(tamperedData)).toThrow();
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt an object of strings', () => {
      const original = {
        API_KEY: 'sk-123456789',
        DB_PASSWORD: 'super-secret-password',
        WEBHOOK_SECRET: 'whsec_abcdef',
      };

      const encrypted = encryption.encryptObject(original);
      const decrypted = encryption.decryptObject(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should encrypt each field independently', () => {
      const original = {
        KEY1: 'value1',
        KEY2: 'value2',
      };

      const encrypted = encryption.encryptObject(original);
      const encryptedKey1 = encrypted['KEY1'];
      const encryptedKey2 = encrypted['KEY2'];

      expect(encryptedKey1).toBeDefined();
      expect(encryptedKey2).toBeDefined();
      expect(encryptedKey1!.iv).not.toBe(encryptedKey2!.iv);
    });

    it('should handle empty object', () => {
      const encrypted = encryption.encryptObject({});
      const decrypted = encryption.decryptObject(encrypted);

      expect(decrypted).toEqual({});
    });

    it('should throw error when encryptObject fails (missing encryption key)', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() =>
        encryption.encryptObject({
          API_KEY: 'test-key',
        }),
      ).toThrow('Failed to encrypt field: API_KEY');
    });

    it('should throw error when decryptObject fails (invalid encrypted data)', () => {
      const invalidEncrypted = {
        API_KEY: {
          iv: 'invalid-short-iv',
          content: 'some-content',
          tag: 'some-tag',
        },
      };

      expect(() => encryption.decryptObject(invalidEncrypted)).toThrow(
        'Failed to decrypt field: API_KEY',
      );
    });

    it('should throw error when decryptObject fails (tampered auth tag)', () => {
      const original = { SECRET: 'my-secret-value' };
      const encrypted = encryption.encryptObject(original);

      // Tamper with the auth tag
      encrypted.SECRET!.tag = Buffer.from('tampered').toString('base64');

      expect(() => encryption.decryptObject(encrypted)).toThrow('Failed to decrypt field: SECRET');
    });
  });

  describe('maskValue', () => {
    it('should mask a value showing first and last 4 characters', () => {
      const masked = encryption.maskValue('my-secret-api-key');

      expect(masked.startsWith('my-s')).toBe(true);
      expect(masked.endsWith('-key')).toBe(true);
      expect(masked).toContain('*');
    });

    it('should fully mask short values', () => {
      const masked = encryption.maskValue('short');

      expect(masked).toBe('*****');
    });

    it('should handle custom visible characters', () => {
      const masked = encryption.maskValue('my-long-secret-value', 2);

      expect(masked.startsWith('my')).toBe(true);
      expect(masked.endsWith('ue')).toBe(true);
    });

    it('should return at least 4 asterisks', () => {
      const masked = encryption.maskValue('ab');

      expect(masked.length).toBeGreaterThanOrEqual(4);
      expect(masked).toMatch(/^\*+$/);
    });
  });

  describe('maskEnvironmentVariables', () => {
    it('should mask all values in an object', () => {
      const envVars = {
        API_KEY: 'sk-123456789abcdef',
        DB_URL: 'postgres://user:pass@host/db',
      };

      const masked = encryption.maskEnvironmentVariables(envVars);

      expect(masked.API_KEY).toContain('*');
      expect(masked.DB_URL).toContain('*');
      expect(masked.API_KEY).not.toBe(envVars.API_KEY);
      expect(masked.DB_URL).not.toBe(envVars.DB_URL);
    });
  });

  describe('isEncryptedData', () => {
    it('should return true for valid encrypted data structure', () => {
      const data: encryption.EncryptedData = {
        iv: 'base64-iv',
        content: 'base64-content',
        tag: 'base64-tag',
      };

      expect(encryption.isEncryptedData(data)).toBe(true);
    });

    it('should return false for null', () => {
      expect(encryption.isEncryptedData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(encryption.isEncryptedData(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(encryption.isEncryptedData('not-encrypted')).toBe(false);
    });

    it('should return false for object missing iv', () => {
      expect(encryption.isEncryptedData({ content: 'x', tag: 'y' })).toBe(false);
    });

    it('should return false for object missing content', () => {
      expect(encryption.isEncryptedData({ iv: 'x', tag: 'y' })).toBe(false);
    });

    it('should return false for object missing tag', () => {
      expect(encryption.isEncryptedData({ iv: 'x', content: 'y' })).toBe(false);
    });

    it('should return false for object with non-string values', () => {
      expect(encryption.isEncryptedData({ iv: 123, content: 'x', tag: 'y' })).toBe(false);
    });
  });
});
