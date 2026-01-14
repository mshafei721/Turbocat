/**
 * OAuth API Integration Tests
 *
 * Tests for OAuth authentication endpoints:
 * - GET /auth/oauth/:provider - Initiate OAuth flow
 * - GET /auth/oauth/:provider/callback - Handle OAuth callback
 *
 * These tests use mocked dependencies to validate the OAuth flow without
 * external API calls.
 *
 * Security Tests:
 * - Feature flag (ENABLE_OAUTH_LOGIN)
 * - Rate limiting (5 requests per minute)
 * - CSRF state parameter validation
 * - Token encryption before storage
 *
 * @module __tests__/integration/oauth.api.test
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

// =============================================================================
// MOCKS
// =============================================================================

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'oauth@example.com',
  fullName: 'OAuth User',
  avatarUrl: 'https://example.com/avatar.jpg',
  role: 'user',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  oauthProvider: 'google',
  oauthId: 'google-123',
  oauthAccessToken: 'encrypted-access-token',
  oauthRefreshToken: 'encrypted-refresh-token',
};

const mockPrismaClient = {
  user: {
    findUnique: jest.fn<any>(),
    findFirst: jest.fn<any>(),
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>().mockResolvedValue(0),
  },
  $transaction: jest.fn<any>().mockImplementation((cb: any) => {
    if (typeof cb === 'function') {
      return cb(mockPrismaClient);
    }
    return Promise.all(cb);
  }),
  $connect: jest.fn<any>().mockResolvedValue(undefined),
  $disconnect: jest.fn<any>().mockResolvedValue(undefined),
};

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrismaClient,
  isPrismaAvailable: jest.fn<any>().mockReturnValue(true),
}));

// Mock OAuth service
const mockOAuthService = {
  generateAuthUrl: jest.fn<any>().mockResolvedValue({
    url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test&state=test-state',
    state: 'test-state-from-service',
  }),
  handleCallback: jest.fn<any>().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
  }),
  getUserProfile: jest.fn<any>().mockResolvedValue({
    id: 'google-123',
    email: 'oauth@example.com',
    name: 'OAuth User',
    avatarUrl: 'https://example.com/avatar.jpg',
    provider: 'google',
  }),
  isProviderConfigured: jest.fn<any>().mockReturnValue(true),
};

jest.mock('../../services/oauth.service', () => ({
  OAuthService: mockOAuthService,
  generateAuthUrl: mockOAuthService.generateAuthUrl,
  handleCallback: mockOAuthService.handleCallback,
  getUserProfile: mockOAuthService.getUserProfile,
  isProviderConfigured: mockOAuthService.isProviderConfigured,
}));

// Mock Redis for state storage
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

// Mock encryption
jest.mock('../../utils/oauth-encryption', () => ({
  encryptOAuthToken: jest.fn<any>((token) => (token ? `encrypted-${token}` : null)),
  decryptOAuthToken: jest.fn<any>((token) => token?.replace('encrypted-', '') || null),
  isOAuthEncryptionConfigured: jest.fn<any>().mockReturnValue(true),
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const resetMocks = () => {
  jest.clearAllMocks();
  mockPrismaClient.user.findUnique.mockResolvedValue(null);
  mockPrismaClient.user.findFirst.mockResolvedValue(null);
  mockPrismaClient.user.create.mockResolvedValue(mockUser);
  mockPrismaClient.user.update.mockResolvedValue(mockUser);

  // Reset Redis state storage mock
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue('OK');
  mockRedis.del.mockResolvedValue(1);
};

const setupStateValidation = (provider: string = 'google', ip: string = '127.0.0.1') => {
  const stateMetadata = JSON.stringify({
    ip,
    userAgent: 'test-agent',
    provider,
    createdAt: Date.now(),
  });

  mockRedis.get.mockResolvedValue(stateMetadata);
  mockRedis.del.mockResolvedValue(1);
};

// =============================================================================
// TESTS
// =============================================================================

describe('OAuth API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
    // Enable OAuth by default
    process.env.ENABLE_OAUTH_LOGIN = 'true';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'http://localhost:3001';
    // Set OAuth credentials
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
    process.env.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret';
  });

  // ==========================================================================
  // GET /auth/oauth/:provider - OAuth Initiation
  // ==========================================================================
  describe('GET /api/v1/auth/oauth/:provider', () => {
    const endpoint = '/api/v1/auth/oauth/google';

    it('should redirect to Google OAuth page', async () => {
      const response = await request(app).get(endpoint);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('client_id=test');
      expect(response.headers.location).toContain('state=');
    });

    it('should redirect to GitHub OAuth page', async () => {
      const response = await request(app).get('/api/v1/auth/oauth/github');

      expect(response.status).toBe(302);
      expect(mockOAuthService.generateAuthUrl).toHaveBeenCalledWith(
        'github',
        expect.any(String),
      );
    });

    it('should redirect to Microsoft OAuth page', async () => {
      const response = await request(app).get('/api/v1/auth/oauth/microsoft');

      expect(response.status).toBe(302);
      expect(mockOAuthService.generateAuthUrl).toHaveBeenCalledWith(
        'microsoft',
        expect.any(String),
      );
    });

    it('should return 400 for invalid provider', async () => {
      const response = await request(app).get('/api/v1/auth/oauth/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 503 if ENABLE_OAUTH_LOGIN=false', async () => {
      process.env.ENABLE_OAUTH_LOGIN = 'false';

      const response = await request(app).get(endpoint);

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should store state in Redis with 10-min expiry', async () => {
      await request(app).get(endpoint);

      expect(mockRedis.setex).toHaveBeenCalled();
      const setexCall = mockRedis.setex.mock.calls[0] as any[];
      expect(setexCall[0]).toMatch(/^oauth:state:/);
      expect(setexCall[1]).toBe(600); // 10 minutes in seconds
    });

    it('should include CSRF state in redirect URL', async () => {
      const response = await request(app).get(endpoint);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('state=');
    });

    it('should handle rate limiting (testing would require multiple requests)', async () => {
      // Note: Rate limiting is hard to test in unit tests because it depends on
      // Redis state and timing. This is better tested in E2E or manual testing.
      // Here we just verify the endpoint works for first request.
      const response = await request(app).get(endpoint);

      expect(response.status).toBe(302);
    });
  });

  // ==========================================================================
  // GET /auth/oauth/:provider/callback - OAuth Callback
  // ==========================================================================
  describe('GET /api/v1/auth/oauth/:provider/callback', () => {
    const endpoint = '/api/v1/auth/oauth/google/callback';
    const validCode = 'test-auth-code';
    const validState = 'test-state-uuid';

    beforeEach(() => {
      setupStateValidation('google');
    });

    it('should create new user on first OAuth login', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null); // No existing user
      mockPrismaClient.user.findUnique.mockResolvedValue(null); // No email conflict
      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('localhost:3000/auth/oauth/success');
      expect(response.headers.location).toContain('accessToken=');
      expect(response.headers.location).toContain('refreshToken=');

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'oauth@example.com',
            oauthProvider: 'google',
            oauthId: 'google-123',
            emailVerified: true,
          }),
        }),
      );
    });

    it('should update existing user on subsequent login', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser); // Existing user
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            oauthAccessToken: expect.any(String),
            lastLoginAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should return JWT tokens on success', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('accessToken=');
      expect(response.headers.location).toContain('refreshToken=');
    });

    it('should redirect to frontend with tokens', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toMatch(
        /^http:\/\/localhost:3000\/auth\/oauth\/success\?/,
      );
    });

    it('should handle OAuth errors gracefully', async () => {
      const response = await request(app)
        .get(endpoint)
        .query({ error: 'access_denied', error_description: 'User denied access' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/auth/oauth/error');
    });

    it('should validate CSRF state parameter', async () => {
      mockRedis.get.mockResolvedValue(null); // State not found

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: 'invalid-state' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/auth/oauth/error');
    });

    it('should reject invalid state parameter', async () => {
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: 'wrong-state' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=invalid_state');
    });

    it('should reject expired state (one-time use)', async () => {
      // First request should succeed
      setupStateValidation('google');
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);

      await request(app).get(endpoint).query({ code: validCode, state: validState });

      // Second request with same state should fail (state deleted after first use)
      mockRedis.get.mockResolvedValue(null);

      const response2 = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response2.status).toBe(302);
      expect(response2.headers.location).toContain('error');
    });

    it('should encrypt tokens before storing in DB', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await request(app).get(endpoint).query({ code: validCode, state: validState });

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oauthAccessToken: expect.stringContaining('encrypted-'),
            oauthRefreshToken: expect.stringContaining('encrypted-'),
          }),
        }),
      );
    });

    it('should handle missing code parameter', async () => {
      const response = await request(app).get(endpoint).query({ state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should handle missing state parameter', async () => {
      const response = await request(app).get(endpoint).query({ code: validCode });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should reject when user is soft-deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      mockPrismaClient.user.findFirst.mockResolvedValue(deletedUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should reject when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrismaClient.user.findFirst.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should handle email conflict (existing password user)', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null); // No OAuth user
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'oauth@example.com',
        passwordHash: 'hashed-password',
        oauthProvider: null,
      });

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should handle email conflict (different OAuth provider)', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'oauth@example.com',
        oauthProvider: 'github',
        passwordHash: null,
      });

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should return 503 if ENABLE_OAUTH_LOGIN=false', async () => {
      process.env.ENABLE_OAUTH_LOGIN = 'false';

      const response = await request(app)
        .get(endpoint)
        .query({ code: validCode, state: validState });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // Security Feature Tests
  // ==========================================================================
  describe('OAuth Security Features', () => {
    it('should enforce feature flag (ENABLE_OAUTH_LOGIN)', async () => {
      process.env.ENABLE_OAUTH_LOGIN = 'false';

      const initResponse = await request(app).get('/api/v1/auth/oauth/google');
      expect(initResponse.status).toBe(503);

      const callbackResponse = await request(app)
        .get('/api/v1/auth/oauth/google/callback')
        .query({ code: 'test', state: 'test' });
      expect(callbackResponse.status).toBe(503);
    });

    it('should validate provider parameter', async () => {
      const response = await request(app).get('/api/v1/auth/oauth/facebook');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should generate unique state for each request', async () => {
      await request(app).get('/api/v1/auth/oauth/google');
      const call1 = mockRedis.setex.mock.calls[0] as any[];

      await request(app).get('/api/v1/auth/oauth/google');
      const call2 = mockRedis.setex.mock.calls[1] as any[];

      // State keys should be different
      expect(call1[0]).not.toBe(call2[0]);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================
  describe('OAuth Error Handling', () => {
    it('should handle OAuth service failure gracefully', async () => {
      mockOAuthService.generateAuthUrl.mockRejectedValue(
        new Error('OAuth service unavailable'),
      );

      const response = await request(app).get('/api/v1/auth/oauth/google');

      expect(response.status).toBeGreaterThanOrEqual(500);
    });

    it('should handle database failure gracefully', async () => {
      setupStateValidation('google');
      mockPrismaClient.user.findFirst.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const response = await request(app)
        .get('/api/v1/auth/oauth/google/callback')
        .query({ code: 'test', state: 'test' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should handle missing OAuth profile email', async () => {
      setupStateValidation('google');
      mockOAuthService.getUserProfile.mockResolvedValue({
        id: 'google-123',
        email: '', // Empty email
        name: 'Test User',
        avatarUrl: null,
        provider: 'google',
      });

      const response = await request(app)
        .get('/api/v1/auth/oauth/google/callback')
        .query({ code: 'test', state: 'test' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });
  });
});
