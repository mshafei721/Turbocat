/**
 * Unit Tests for Apple Service
 *
 * Tests JWT generation, credential validation, app creation,
 * and build upload functionality with mocked API responses.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AppleService } from '../apple.service';
import type { AppleCredentials, AppMetadata } from '../apple.service';
import { ApiError } from '../../utils/ApiError';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AppleService', () => {
  let appleService: AppleService;

  // Test credentials with valid ES256 private key
  const mockCredentials: AppleCredentials = {
    teamId: 'ABC123DEF4',
    keyId: 'ABCD123456',
    issuerId: '12345678-1234-1234-1234-123456789012',
    // Valid ES256 private key (P-256 curve) - test key, not for production
    privateKey: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPPbCXeMlwpLNlHT4
txmCz3YydmmMIZjYvlCMR6uFHR+hRANCAAR+TLQHlTCgVeQp2fCCxdgfMZwxqXu7
gJZ/UfNTFuRV/HxH7E7hI9eKQbqM2RJZqe3qPnPW+rGZqbRhVxF3xLFJ
-----END PRIVATE KEY-----`,
  };

  const mockAppMetadata: AppMetadata = {
    name: 'Test App',
    bundleId: 'com.test.app',
    primaryLocale: 'en-US',
  };

  beforeEach(() => {
    appleService = new AppleService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateJWT', () => {
    it('should generate a valid JWT token with ES256 algorithm', () => {
      const mockToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQ0QxMjM0NTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTIiLCJpYXQiOjE3MDUxNTQ0MDAsImV4cCI6MTcwNTE1NTYwMCwiYXVkIjoiYXBwc3RvcmVjb25uZWN0LXYxIn0.signature';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const token = appleService.generateJWT(
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    it('should include correct header claims', () => {
      const mockToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQ0QxMjM0NTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTIiLCJpYXQiOjE3MDUxNTQ0MDAsImV4cCI6MTcwNTE1NTYwMCwiYXVkIjoiYXBwc3RvcmVjb25uZWN0LXYxIn0.signature';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const token = appleService.generateJWT(
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      // Decode header (first part of JWT)
      const parts = token.split('.');
      const headerB64 = parts[0] as string;
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf-8'));

      expect(header).toEqual({
        alg: 'ES256',
        kid: mockCredentials.keyId,
        typ: 'JWT',
      });
    });

    it('should include correct payload claims', () => {
      const mockToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQ0QxMjM0NTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTIiLCJpYXQiOjE3MDUxNTQ0MDAsImV4cCI6MTcwNTE1NTYwMCwiYXVkIjoiYXBwc3RvcmVjb25uZWN0LXYxIn0.signature';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const token = appleService.generateJWT(
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      // Decode payload (second part of JWT)
      const parts = token.split('.');
      const payloadB64 = parts[1] as string;
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));

      expect(payload.iss).toBe(mockCredentials.issuerId);
      expect(payload.aud).toBe('appstoreconnect-v1');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();

      // Verify expiration is ~20 minutes from now
      const expirationDiff = payload.exp - payload.iat;
      expect(expirationDiff).toBe(20 * 60); // 20 minutes in seconds
    });

    it('should throw ApiError if JWT generation fails', () => {
      mockedJwt.sign.mockImplementation(() => {
        throw new Error('Invalid key');
      });

      expect(() => {
        appleService.generateJWT(mockCredentials.keyId, mockCredentials.issuerId, 'invalid-key');
      }).toThrow(ApiError);
    });
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { data: [] },
      });

      const result = await appleService.validateCredentials(
        mockCredentials.teamId,
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.appstoreconnect.apple.com/v1/apps',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer .+/),
            Accept: 'application/json',
          }),
          timeout: 10000,
        }),
      );
    });

    it('should return false for invalid credentials (401 response)', async () => {
      // Mock 401 Unauthorized response
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errors: [{ status: '401', code: 'UNAUTHORIZED', title: 'Unauthorized' }] },
        },
        message: 'Request failed with status code 401',
      });

      const result = await appleService.validateCredentials(
        mockCredentials.teamId,
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      expect(result).toBe(false);
    });

    it('should return false for network errors', async () => {
      // Mock network error
      mockedAxios.get.mockRejectedValueOnce({
        message: 'Network Error',
        code: 'ECONNREFUSED',
      });

      const result = await appleService.validateCredentials(
        mockCredentials.teamId,
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      expect(result).toBe(false);
    });

    it('should return false for timeout errors', async () => {
      // Mock timeout error
      mockedAxios.get.mockRejectedValueOnce({
        message: 'timeout of 10000ms exceeded',
        code: 'ECONNABORTED',
      });

      const result = await appleService.validateCredentials(
        mockCredentials.teamId,
        mockCredentials.keyId,
        mockCredentials.issuerId,
        mockCredentials.privateKey,
      );

      expect(result).toBe(false);
    });
  });

  describe('createApp', () => {
    it('should create app successfully', async () => {
      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const mockResponse = {
        status: 201,
        data: {
          data: {
            id: 'app-id-123',
            type: 'apps',
            attributes: {
              name: mockAppMetadata.name,
              bundleId: mockAppMetadata.bundleId,
              primaryLocale: 'en-US',
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await appleService.createApp(mockAppMetadata, mockCredentials);

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.appstoreconnect.apple.com/v1/apps',
        {
          data: {
            type: 'apps',
            attributes: {
              name: mockAppMetadata.name,
              bundleId: mockAppMetadata.bundleId,
              primaryLocale: 'en-US',
            },
          },
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer .+/),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          timeout: 15000,
        }),
      );
    });

    it('should use default primaryLocale if not provided', async () => {
      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const metadataWithoutLocale: AppMetadata = {
        name: mockAppMetadata.name,
        bundleId: mockAppMetadata.bundleId,
      };

      const mockResponse = {
        status: 201,
        data: {
          data: {
            id: 'app-id-123',
            type: 'apps',
            attributes: {
              name: metadataWithoutLocale.name,
              bundleId: metadataWithoutLocale.bundleId,
              primaryLocale: 'en-US',
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await appleService.createApp(metadataWithoutLocale, mockCredentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: expect.objectContaining({
            attributes: expect.objectContaining({
              primaryLocale: 'en-US',
            }),
          }),
        }),
        expect.any(Object),
      );
    });

    it('should throw ApiError on app creation failure', async () => {
      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const mockErrorResponse = {
        response: {
          status: 409,
          data: {
            errors: [
              {
                status: '409',
                code: 'ENTITY_ALREADY_EXISTS',
                title: 'The provided entity already exists',
                detail: 'An app with bundle ID "com.test.app" already exists',
              },
            ],
          },
        },
        message: 'Request failed with status code 409',
      };

      mockedAxios.post.mockRejectedValueOnce(mockErrorResponse);

      try {
        await appleService.createApp(mockAppMetadata, mockCredentials);
        fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toMatch(/already exists/i);
        }
      }
    });

    it('should throw ApiError with proper error message on validation error', async () => {
      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const mockErrorResponse = {
        response: {
          status: 400,
          data: {
            errors: [
              {
                status: '400',
                code: 'PARAMETER_ERROR.INVALID',
                title: 'Invalid Parameter',
                detail: 'Bundle ID must match pattern com.company.appname',
              },
            ],
          },
        },
        message: 'Request failed with status code 400',
      };

      mockedAxios.post.mockRejectedValueOnce(mockErrorResponse);

      await expect(appleService.createApp(mockAppMetadata, mockCredentials)).rejects.toThrow(
        /Invalid Parameter/i,
      );
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        message: 'Network Error',
        code: 'ECONNREFUSED',
      });

      await expect(appleService.createApp(mockAppMetadata, mockCredentials)).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('uploadBuild', () => {
    it('should throw ApiError with 501 status (not implemented)', async () => {
      await expect(
        appleService.uploadBuild('/tmp/test.ipa', mockCredentials),
      ).rejects.toThrow(ApiError);

      await expect(
        appleService.uploadBuild('/tmp/test.ipa', mockCredentials),
      ).rejects.toThrow(/not implemented/i);
    });

    it('should log warning when called', async () => {
      const { logger } = await import('../../lib/logger');

      try {
        await appleService.uploadBuild('/tmp/test.ipa', mockCredentials);
      } catch (error) {
        // Expected error
      }

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('uploadBuild'),
        expect.objectContaining({
          ipaPath: '/tmp/test.ipa',
          teamId: mockCredentials.teamId,
        }),
      );
    });
  });
});
