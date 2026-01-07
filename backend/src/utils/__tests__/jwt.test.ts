/**
 * Tests for JWT Utilities
 *
 * Tests the JWT token generation and verification including:
 * - generateAccessToken
 * - generateRefreshToken
 * - verifyAccessToken
 * - verifyRefreshToken
 * - Token expiration and validation
 */

import jwt from 'jsonwebtoken';
import * as jwtUtils from '../jwt';

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('JWT Utilities', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      JWT_ACCESS_SECRET: 'test-access-secret-key-for-unit-tests-32-chars-min',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-unit-tests-32-chars-min',
      JWT_ACCESS_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockPayload: jwtUtils.JwtUserPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    sessionId: 'session-456',
  };

  describe('isJwtConfigured', () => {
    it('should return true when secrets are configured', () => {
      expect(jwtUtils.isJwtConfigured()).toBe(true);
    });

    it('should return false when access secret is missing', () => {
      delete process.env.JWT_ACCESS_SECRET;
      expect(jwtUtils.isJwtConfigured()).toBe(false);
    });

    it('should return false when refresh secret is missing', () => {
      delete process.env.JWT_REFRESH_SECRET;
      expect(jwtUtils.isJwtConfigured()).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT structure: header.payload.signature
    });

    it('should include user payload in the token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as jwtUtils.DecodedToken;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.sessionId).toBe(mockPayload.sessionId);
      expect(decoded.type).toBe('access');
    });

    it('should throw error when secrets are not configured', () => {
      delete process.env.JWT_ACCESS_SECRET;

      expect(() => jwtUtils.generateAccessToken(mockPayload)).toThrow('JWT secrets not configured');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtUtils.generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user payload with refresh type', () => {
      const token = jwtUtils.generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as jwtUtils.DecodedToken;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = jwtUtils.generateTokenPair(mockPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(tokens.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should have different expiry times for access and refresh tokens', () => {
      const tokens = jwtUtils.generateTokenPair(mockPayload);

      expect(tokens.refreshTokenExpiresAt.getTime()).toBeGreaterThan(
        tokens.accessTokenExpiresAt.getTime(),
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);
      const result = jwtUtils.verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(mockPayload.userId);
      expect(result.payload?.type).toBe('access');
    });

    it('should reject an invalid token', () => {
      const result = jwtUtils.verifyAccessToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED');
    });

    it('should reject a refresh token used as access token', () => {
      const refreshToken = jwtUtils.generateRefreshToken(mockPayload);

      // Verify with access secret should fail or return wrong type
      const result = jwtUtils.verifyAccessToken(refreshToken);

      // Either it fails to verify (different secret) or it detects wrong type
      expect(result.valid).toBe(false);
    });

    it('should reject an expired token', () => {
      // Create an expired token by signing with past expiry
      const expiredToken = jwt.sign(
        { ...mockPayload, type: 'access' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '-1h' },
      );

      const result = jwtUtils.verifyAccessToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = jwtUtils.generateRefreshToken(mockPayload);
      const result = jwtUtils.verifyRefreshToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(mockPayload.userId);
      expect(result.payload?.type).toBe('refresh');
    });

    it('should reject an access token used as refresh token', () => {
      const accessToken = jwtUtils.generateAccessToken(mockPayload);

      const result = jwtUtils.verifyRefreshToken(accessToken);

      expect(result.valid).toBe(false);
    });

    it('should reject a tampered token', () => {
      const token = jwtUtils.generateRefreshToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      const result = jwtUtils.verifyRefreshToken(tamperedToken);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);
      const decoded = jwtUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = jwtUtils.decodeToken('not-a-valid-jwt');

      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for a non-expired token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);

      expect(jwtUtils.isTokenExpired(token)).toBe(false);
    });

    it('should return true for an expired token', () => {
      const expiredToken = jwt.sign(
        { ...mockPayload, type: 'access' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '-1h' },
      );

      expect(jwtUtils.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(jwtUtils.isTokenExpired('invalid')).toBe(true);
    });
  });

  describe('getTokenRemainingTime', () => {
    it('should return positive time for non-expired token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);
      const remaining = jwtUtils.getTokenRemainingTime(token);

      expect(remaining).toBeGreaterThan(0);
    });

    it('should return 0 for expired token', () => {
      const expiredToken = jwt.sign(
        { ...mockPayload, type: 'access' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '-1h' },
      );

      expect(jwtUtils.getTokenRemainingTime(expiredToken)).toBe(0);
    });
  });

  describe('extractUserIdFromToken', () => {
    it('should extract userId from token', () => {
      const token = jwtUtils.generateAccessToken(mockPayload);
      const userId = jwtUtils.extractUserIdFromToken(token);

      expect(userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', () => {
      const userId = jwtUtils.extractUserIdFromToken('invalid');

      expect(userId).toBeNull();
    });
  });
});
