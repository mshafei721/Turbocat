/**
 * OAuth Security Middleware Tests
 *
 * Tests for OAuth security middleware:
 * - generateOAuthState: CSRF state generation
 * - storeOAuthState: Redis state storage with TTL
 * - validateOAuthState: State validation and one-time use
 * - checkOAuthEnabled: Feature flag middleware
 * - createOAuthRateLimiter: Rate limiting middleware
 *
 * These tests validate the comprehensive security features of OAuth.
 *
 * @module middleware/__tests__/oauth-security.middleware.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  generateOAuthState,
  storeOAuthState,
  validateOAuthState,
  isOAuthEnabled,
  checkOAuthEnabled,
  generateOAuthStateMiddleware,
  validateOAuthStateMiddleware,
  createOAuthInitMiddleware,
  createOAuthCallbackMiddleware,
  type OAuthStateMetadata,
} from '../oauth-security.middleware';
import type { Request, Response, NextFunction } from 'express';

// =============================================================================
// MOCKS
// =============================================================================

const mockRedis = {
  setex: jest.fn<any>().mockResolvedValue('OK'),
  get: jest.fn<any>().mockResolvedValue(null),
  del: jest.fn<any>().mockResolvedValue(1),
  call: jest.fn<any>().mockResolvedValue(null),
};

jest.mock('../../lib/redis', () => ({
  redis: mockRedis,
  isRedisAvailable: jest.fn<any>().mockReturnValue(true),
  connectRedis: jest.fn<any>().mockResolvedValue(undefined),
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// =============================================================================
// HELPERS
// =============================================================================

const resetMocks = () => {
  jest.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue('OK');
  mockRedis.del.mockResolvedValue(1);
};

const createMockRequest = (overrides = {}): Request => {
  return {
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as Request;
};

const createMockResponse = (): Response => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const createMockNext = (): NextFunction => {
  return jest.fn<NextFunction>();
};

// =============================================================================
// TESTS
// =============================================================================

describe('OAuth Security Middleware', () => {
  beforeEach(() => {
    resetMocks();
    process.env.ENABLE_OAUTH_LOGIN = 'true';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  // ==========================================================================
  // generateOAuthState Tests
  // ==========================================================================
  describe('generateOAuthState', () => {
    it('should generate UUID v4 state', () => {
      const state = generateOAuthState();

      expect(state).toBeTruthy();
      expect(state).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique states', () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();

      expect(state1).not.toBe(state2);
    });

    it('should generate cryptographically secure UUIDs', () => {
      const states = new Set();

      // Generate 100 states and ensure no duplicates
      for (let i = 0; i < 100; i++) {
        states.add(generateOAuthState());
      }

      expect(states.size).toBe(100);
    });
  });

  // ==========================================================================
  // storeOAuthState Tests
  // ==========================================================================
  describe('storeOAuthState', () => {
    const state = 'test-state-uuid';
    const metadata: OAuthStateMetadata = {
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      provider: 'google',
      createdAt: Date.now(),
    };

    it('should store state in Redis with 10-minute TTL', async () => {
      const result = await storeOAuthState(state, metadata);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `oauth:state:${state}`,
        600, // 10 minutes
        expect.any(String),
      );
    });

    it('should serialize metadata as JSON', async () => {
      await storeOAuthState(state, metadata);

      const call = mockRedis.setex.mock.calls[0] as any[];
      const storedValue = call[2];
      const parsed = JSON.parse(storedValue);

      expect(parsed).toEqual(metadata);
    });

    it('should return false when Redis is unavailable', async () => {
      const { isRedisAvailable } = await import('../../lib/redis');
      (isRedisAvailable as jest.Mock).mockReturnValue(false);

      const result = await storeOAuthState(state, metadata);

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      const result = await storeOAuthState(state, metadata);

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // validateOAuthState Tests
  // ==========================================================================
  describe('validateOAuthState', () => {
    const state = 'test-state-uuid';
    const ip = '127.0.0.1';
    const provider = 'google';

    const validMetadata: OAuthStateMetadata = {
      ip,
      userAgent: 'test-agent',
      provider,
      createdAt: Date.now() - 60000, // 1 minute ago
    };

    beforeEach(() => {
      mockRedis.get.mockResolvedValue(JSON.stringify(validMetadata));
    });

    it('should validate and consume state (one-time use)', async () => {
      const result = await validateOAuthState(state, ip, provider);

      expect(result.valid).toBe(true);
      expect(result.metadata).toEqual(validMetadata);
      expect(mockRedis.get).toHaveBeenCalledWith(`oauth:state:${state}`);
      expect(mockRedis.del).toHaveBeenCalledWith(`oauth:state:${state}`);
    });

    it('should reject missing state', async () => {
      const result = await validateOAuthState('', ip, provider);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing');
    });

    it('should reject when state not found in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await validateOAuthState(state, ip, provider);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it('should reject when provider mismatch', async () => {
      const result = await validateOAuthState(state, ip, 'github');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should log IP mismatch but not reject', async () => {
      const result = await validateOAuthState(state, '192.168.1.1', provider);

      // Should still be valid (users behind proxies may have IP changes)
      expect(result.valid).toBe(true);
    });

    it('should reject expired state (>10 minutes)', async () => {
      const expiredMetadata = {
        ...validMetadata,
        createdAt: Date.now() - 11 * 60 * 1000, // 11 minutes ago
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(expiredMetadata));

      const result = await validateOAuthState(state, ip, provider);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should return false when Redis unavailable', async () => {
      const { isRedisAvailable } = await import('../../lib/redis');
      (isRedisAvailable as jest.Mock).mockReturnValue(false);

      const result = await validateOAuthState(state, ip, provider);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('unavailable');
    });

    it('should handle Redis errors', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await validateOAuthState(state, ip, provider);

      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should delete state after retrieval (one-time use)', async () => {
      await validateOAuthState(state, ip, provider);

      expect(mockRedis.del).toHaveBeenCalledWith(`oauth:state:${state}`);
    });
  });

  // ==========================================================================
  // isOAuthEnabled Tests
  // ==========================================================================
  describe('isOAuthEnabled', () => {
    it('should return true when ENABLE_OAUTH_LOGIN=true', () => {
      process.env.ENABLE_OAUTH_LOGIN = 'true';

      const result = isOAuthEnabled();

      expect(result).toBe(true);
    });

    it('should return false when ENABLE_OAUTH_LOGIN=false', () => {
      process.env.ENABLE_OAUTH_LOGIN = 'false';

      const result = isOAuthEnabled();

      expect(result).toBe(false);
    });

    it('should return false when ENABLE_OAUTH_LOGIN is not set', () => {
      delete process.env.ENABLE_OAUTH_LOGIN;

      const result = isOAuthEnabled();

      expect(result).toBe(false);
    });

    it('should return false for any value other than "true"', () => {
      process.env.ENABLE_OAUTH_LOGIN = '1';
      expect(isOAuthEnabled()).toBe(false);

      process.env.ENABLE_OAUTH_LOGIN = 'yes';
      expect(isOAuthEnabled()).toBe(false);

      process.env.ENABLE_OAUTH_LOGIN = 'TRUE';
      expect(isOAuthEnabled()).toBe(false);
    });
  });

  // ==========================================================================
  // checkOAuthEnabled Middleware Tests
  // ==========================================================================
  describe('checkOAuthEnabled middleware', () => {
    it('should call next() when OAuth is enabled', () => {
      process.env.ENABLE_OAUTH_LOGIN = 'true';

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      checkOAuthEnabled(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 503 when OAuth is disabled', () => {
      process.env.ENABLE_OAUTH_LOGIN = 'false';

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      checkOAuthEnabled(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SERVICE_UNAVAILABLE',
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // generateOAuthStateMiddleware Tests
  // ==========================================================================
  describe('generateOAuthStateMiddleware', () => {
    it('should generate state and attach to request', async () => {
      const req = createMockRequest({
        params: { provider: 'google' },
        headers: { 'user-agent': 'test-agent' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateOAuthStateMiddleware(req, res, next);

      expect((req as any).oauthState).toBeTruthy();
      expect((req as any).oauthState).toMatch(/^[0-9a-f-]{36}$/);
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should store state metadata in Redis', async () => {
      const req = createMockRequest({
        params: { provider: 'github' },
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await generateOAuthStateMiddleware(req, res, next);

      expect(mockRedis.setex).toHaveBeenCalled();
      const call = mockRedis.setex.mock.calls[0] as any[];
      const metadata = JSON.parse(call[2]);

      expect(metadata).toHaveProperty('provider', 'github');
      expect(metadata).toHaveProperty('ip', '192.168.1.1');
      expect(metadata).toHaveProperty('userAgent', 'Mozilla/5.0');
      expect(metadata).toHaveProperty('createdAt');
    });

    it('should call next with error if Redis fails', async () => {
      mockRedis.setex.mockResolvedValue(null); // Simulate failure

      const req = createMockRequest({ params: { provider: 'google' } });
      const res = createMockResponse();
      const next = createMockNext();

      await generateOAuthStateMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ==========================================================================
  // validateOAuthStateMiddleware Tests
  // ==========================================================================
  describe('validateOAuthStateMiddleware', () => {
    const state = 'test-state-uuid';
    const validMetadata: OAuthStateMetadata = {
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      provider: 'google',
      createdAt: Date.now(),
    };

    beforeEach(() => {
      mockRedis.get.mockResolvedValue(JSON.stringify(validMetadata));
    });

    it('should validate state and attach metadata to request', async () => {
      const req = createMockRequest({
        query: { state },
        params: { provider: 'google' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await validateOAuthStateMiddleware(req, res, next);

      expect((req as any).oauthStateMetadata).toEqual(validMetadata);
      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to error page on invalid state', async () => {
      mockRedis.get.mockResolvedValue(null);

      const req = createMockRequest({
        query: { state: 'invalid-state' },
        params: { provider: 'google' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await validateOAuthStateMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/error?error=invalid_state'),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should redirect to error page on validation error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const req = createMockRequest({
        query: { state },
        params: { provider: 'google' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await validateOAuthStateMiddleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/error'),
      );
    });

    it('should delete state after validation (one-time use)', async () => {
      const req = createMockRequest({
        query: { state },
        params: { provider: 'google' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await validateOAuthStateMiddleware(req, res, next);

      expect(mockRedis.del).toHaveBeenCalledWith(`oauth:state:${state}`);
    });
  });

  // ==========================================================================
  // Combined Middleware Tests
  // ==========================================================================
  describe('createOAuthInitMiddleware', () => {
    it('should return array of middleware functions', () => {
      const middleware = createOAuthInitMiddleware();

      expect(Array.isArray(middleware)).toBe(true);
      expect(middleware.length).toBe(3); // Feature flag + rate limiter + state gen
    });

    it('should include checkOAuthEnabled middleware', () => {
      const middleware = createOAuthInitMiddleware();

      // First middleware should be feature flag check
      expect(middleware[0]).toBe(checkOAuthEnabled);
    });
  });

  describe('createOAuthCallbackMiddleware', () => {
    it('should return array of middleware functions', () => {
      const middleware = createOAuthCallbackMiddleware();

      expect(Array.isArray(middleware)).toBe(true);
      expect(middleware.length).toBe(3); // Feature flag + rate limiter + state validation
    });

    it('should include checkOAuthEnabled middleware', () => {
      const middleware = createOAuthCallbackMiddleware();

      // First middleware should be feature flag check
      expect(middleware[0]).toBe(checkOAuthEnabled);
    });
  });

  // ==========================================================================
  // Security Integration Tests
  // ==========================================================================
  describe('OAuth Security Integration', () => {
    it('should enforce CSRF protection end-to-end', async () => {
      const state = generateOAuthState();
      const metadata: OAuthStateMetadata = {
        ip: '127.0.0.1',
        userAgent: 'test',
        provider: 'google',
        createdAt: Date.now(),
      };

      // Store state
      const stored = await storeOAuthState(state, metadata);
      expect(stored).toBe(true);

      // Validate state
      const result = await validateOAuthState(state, '127.0.0.1', 'google');
      expect(result.valid).toBe(true);

      // Verify one-time use (should fail on second attempt)
      mockRedis.get.mockResolvedValue(null);
      const result2 = await validateOAuthState(state, '127.0.0.1', 'google');
      expect(result2.valid).toBe(false);
    });

    it('should reject replay attacks (reused state)', async () => {
      const state = generateOAuthState();
      const metadata: OAuthStateMetadata = {
        ip: '127.0.0.1',
        userAgent: 'test',
        provider: 'google',
        createdAt: Date.now(),
      };

      await storeOAuthState(state, metadata);
      await validateOAuthState(state, '127.0.0.1', 'google');

      // Second validation should fail (state already consumed)
      mockRedis.get.mockResolvedValue(null);
      const result = await validateOAuthState(state, '127.0.0.1', 'google');

      expect(result.valid).toBe(false);
    });

    it('should expire states after 10 minutes', async () => {
      const state = generateOAuthState();
      const metadata: OAuthStateMetadata = {
        ip: '127.0.0.1',
        userAgent: 'test',
        provider: 'google',
        createdAt: Date.now() - 11 * 60 * 1000, // 11 minutes ago
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(metadata));

      const result = await validateOAuthState(state, '127.0.0.1', 'google');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });
});
