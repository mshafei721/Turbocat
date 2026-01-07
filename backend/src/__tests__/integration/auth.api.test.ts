/**
 * Auth API Integration Tests
 *
 * Tests for authentication endpoints:
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 * - POST /auth/refresh - Token refresh
 * - POST /auth/logout - Session invalidation
 *
 * Note: These tests use mocked Prisma client to avoid database dependency.
 *
 * @module __tests__/integration/auth.api.test
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Create inline mock before any imports
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  passwordHash: '$2b$10$KIXWQKv8k.G0zUXM7Z8zNeZ.vD.B7hDJ0qIvT9Z7Jx3aW5T1G0qK6', // TestPass123!
  fullName: 'Test User',
  role: 'USER',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  lastLoginAt: null,
  settings: {},
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
  agent: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>(),
  },
  workflow: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>(),
  },
  workflowStep: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    createMany: jest.fn<any>(),
  },
  execution: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>(),
  },
  executionLog: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    createMany: jest.fn<any>(),
    count: jest.fn<any>(),
  },
  template: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    count: jest.fn<any>(),
    update: jest.fn<any>(),
    groupBy: jest.fn<any>(),
  },
  deployment: { findUnique: jest.fn<any>(), findMany: jest.fn<any>(), count: jest.fn<any>() },
  apiKey: { findUnique: jest.fn<any>(), findMany: jest.fn<any>(), count: jest.fn<any>() },
  auditLog: { create: jest.fn<any>() },
  $connect: jest.fn<any>().mockResolvedValue(undefined),
  $disconnect: jest.fn<any>().mockResolvedValue(undefined),
  $transaction: jest.fn<any>().mockImplementation((cb: any) => {
    if (typeof cb === 'function') {
      return cb(mockPrismaClient);
    }
    return Promise.all(cb);
  }),
  $executeRaw: jest.fn<any>(),
  $queryRaw: jest.fn<any>(),
};

jest.mock('../../lib/prisma', () => ({
  prisma: mockPrismaClient,
  isPrismaAvailable: jest.fn<any>().mockReturnValue(true),
  getPrismaInitError: jest.fn<any>().mockReturnValue(undefined),
  disconnectPrisma: jest.fn<any>().mockResolvedValue(undefined),
  checkDatabaseHealth: jest.fn<any>().mockResolvedValue({ healthy: true }),
  getDatabaseInfo: jest
    .fn<any>()
    .mockReturnValue({ provider: 'postgresql', configured: true, available: true }),
}));

// Mock session service to bypass Redis session validation
jest.mock('../../services/session.service', () => ({
  validateSession: jest.fn<any>().mockResolvedValue({
    valid: true,
    session: {
      sessionId: 'test-session-mock',
      userId: mockUser.id,
      role: 'USER',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    },
  }),
  createSession: jest.fn<any>().mockResolvedValue({
    sessionId: 'test-session-mock',
    userId: mockUser.id,
    role: 'USER',
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  }),
  invalidateSession: jest.fn<any>().mockResolvedValue(true),
  isSessionServiceAvailable: jest.fn<any>().mockReturnValue(true),
}));

import request from 'supertest';
import app from '../../app';
import { generateTestToken, generateTestRefreshToken } from './helpers/auth';

const resetMocks = () => {
  jest.clearAllMocks();
  mockPrismaClient.user.findUnique.mockResolvedValue(null);
  mockPrismaClient.user.findFirst.mockResolvedValue(null);
};

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // POST /auth/register - Validation Tests
  // ==========================================================================
  describe('POST /api/v1/auth/register', () => {
    const registerEndpoint = '/api/v1/auth/register';

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post(registerEndpoint)
        .send({ email: 'not-an-email', password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post(registerEndpoint)
        .send({ email: 'valid@example.com', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post(registerEndpoint)
        .send({ password: 'SecurePass123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post(registerEndpoint)
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for existing email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post(registerEndpoint)
        .send({ email: 'test@example.com', password: 'SecurePass123!' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // POST /auth/login - Validation Tests
  // ==========================================================================
  describe('POST /api/v1/auth/login', () => {
    const loginEndpoint = '/api/v1/auth/login';

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({ password: 'SomePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post(loginEndpoint).send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post(loginEndpoint)
        .send({ email: 'nonexistent@example.com', password: 'SomePassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // POST /auth/refresh
  // ==========================================================================
  describe('POST /api/v1/auth/refresh', () => {
    const refreshEndpoint = '/api/v1/auth/refresh';

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app).post(refreshEndpoint).send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post(refreshEndpoint)
        .send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const refreshToken = generateTestRefreshToken({
        userId: mockUser.id,
        email: mockUser.email,
        role: 'USER',
      });

      const response = await request(app).post(refreshEndpoint).send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });
  });

  // ==========================================================================
  // POST /auth/logout
  // ==========================================================================
  describe('POST /api/v1/auth/logout', () => {
    const logoutEndpoint = '/api/v1/auth/logout';

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app).post(logoutEndpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should logout successfully with valid token', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const accessToken = generateTestToken({
        userId: mockUser.id,
        email: mockUser.email,
        role: 'USER',
      });

      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);
    });
  });
});
