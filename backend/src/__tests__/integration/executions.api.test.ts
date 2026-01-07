/**
 * Executions API Integration Tests
 *
 * Tests for execution management endpoints:
 * - GET /executions/:id - Execution details
 * - GET /executions/:id/logs - Execution logs
 * - POST /executions/:id/cancel - Cancel execution
 *
 * @module __tests__/integration/executions.api.test
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import crypto from 'crypto';

const uuidv4 = (): string => crypto.randomUUID();

// Mock user data
const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
const mockUser = {
  id: mockUserId,
  email: 'test@example.com',
  passwordHash: '$2b$10$KIXWQKv8k.G0zUXM7Z8zNeZ.vD.B7hDJ0qIvT9Z7Jx3aW5T1G0qK6',
  fullName: 'Test User',
  role: 'USER',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockWorkflowId = uuidv4();

// Note: Prisma enum values are lowercase (e.g., 'pending', not 'PENDING')
const createMockExecution = (overrides: any = {}) => ({
  id: uuidv4(),
  workflowId: mockWorkflowId,
  userId: mockUserId,
  status: 'pending', // lowercase to match Prisma enum
  triggerType: 'manual',
  inputData: {},
  outputData: null,
  error: null,
  stepsTotal: 3,
  stepsCompleted: 0,
  stepsFailed: 0,
  startedAt: null,
  completedAt: null,
  durationMs: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  workflow: {
    id: mockWorkflowId,
    name: 'Test Workflow',
    userId: mockUserId,
  },
  ...overrides,
});

const createMockLog = (executionId: string, overrides: any = {}) => ({
  id: uuidv4(),
  executionId,
  level: 'INFO',
  message: 'Test log message',
  stepKey: null,
  metadata: {},
  timestamp: new Date(),
  ...overrides,
});

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
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>().mockResolvedValue(0),
  },
  executionLog: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    createMany: jest.fn<any>(),
    count: jest.fn<any>().mockResolvedValue(0),
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
      userId: mockUserId,
      role: 'USER',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    },
  }),
  createSession: jest.fn<any>().mockResolvedValue({
    sessionId: 'test-session-mock',
    userId: mockUserId,
    role: 'USER',
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  }),
  invalidateSession: jest.fn<any>().mockResolvedValue(true),
  isSessionServiceAvailable: jest.fn<any>().mockReturnValue(true),
}));

import request from 'supertest';
import app from '../../app';
import { generateTestToken } from './helpers/auth';

const authToken = generateTestToken({ userId: mockUserId, email: mockUser.email, role: 'USER' });

const resetMocks = () => {
  jest.clearAllMocks();
  mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
  mockPrismaClient.execution.findUnique.mockResolvedValue(null);
  mockPrismaClient.execution.findMany.mockResolvedValue([]);
  mockPrismaClient.execution.count.mockResolvedValue(0);
  mockPrismaClient.executionLog.findMany.mockResolvedValue([]);
  mockPrismaClient.executionLog.count.mockResolvedValue(0);
};

describe('Executions API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // GET /executions/:id - Execution details
  // ==========================================================================
  describe('GET /api/v1/executions/:id', () => {
    it('should get execution details with workflow info (200)', async () => {
      const execution = createMockExecution({ status: 'completed' });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('execution');
      expect(response.body.data.execution).toHaveProperty('workflow');
    });

    it('should get running execution details (200)', async () => {
      const execution = createMockExecution({ status: 'running', startedAt: new Date() });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.execution.status).toBe('running');
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrismaClient.execution.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/executions/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for execution owned by different user (hides existence)', async () => {
      // The service returns null for unauthorized access (security: don't reveal existence)
      // which causes the route to return 404 instead of 403
      const execution = createMockExecution({
        userId: uuidv4(),
        workflow: { id: mockWorkflowId, name: 'Test', userId: uuidv4() },
      });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/executions/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).get(`/api/v1/executions/${uuidv4()}`);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /executions/:id/logs - Execution logs
  // ==========================================================================
  describe('GET /api/v1/executions/:id/logs', () => {
    it('should get execution logs with pagination (200)', async () => {
      const execution = createMockExecution();
      const logs = [
        createMockLog(execution.id, { level: 'INFO', message: 'Started' }),
        createMockLog(execution.id, { level: 'DEBUG', message: 'Processing' }),
        createMockLog(execution.id, { level: 'INFO', message: 'Completed' }),
      ];
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);
      mockPrismaClient.executionLog.findMany.mockResolvedValue(logs);
      mockPrismaClient.executionLog.count.mockResolvedValue(3);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}/logs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter logs by level', async () => {
      const execution = createMockExecution();
      const logs = [createMockLog(execution.id, { level: 'ERROR', message: 'Failed' })];
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);
      mockPrismaClient.executionLog.findMany.mockResolvedValue(logs);
      mockPrismaClient.executionLog.count.mockResolvedValue(1);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}/logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ level: 'ERROR' });

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(1);
    });

    it('should filter logs by step key', async () => {
      const execution = createMockExecution();
      const logs = [createMockLog(execution.id, { stepKey: 'step_1', message: 'Step 1 log' })];
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);
      mockPrismaClient.executionLog.findMany.mockResolvedValue(logs);
      mockPrismaClient.executionLog.count.mockResolvedValue(1);

      const response = await request(app)
        .get(`/api/v1/executions/${execution.id}/logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ stepKey: 'step_1' });

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBe(1);
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrismaClient.execution.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/executions/${uuidv4()}/logs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).get(`/api/v1/executions/${uuidv4()}/logs`);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // POST /executions/:id/cancel - Cancel execution
  // ==========================================================================
  describe('POST /api/v1/executions/:id/cancel', () => {
    it('should cancel running execution (200)', async () => {
      const execution = createMockExecution({ status: 'running', startedAt: new Date() });
      const cancelledExecution = { ...execution, status: 'cancelled', completedAt: new Date() };
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);
      mockPrismaClient.execution.update.mockResolvedValue(cancelledExecution);

      const response = await request(app)
        .post(`/api/v1/executions/${execution.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.execution.status).toBe('cancelled');
    });

    it('should cancel pending execution (200)', async () => {
      const execution = createMockExecution({ status: 'pending' });
      const cancelledExecution = { ...execution, status: 'cancelled' };
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);
      mockPrismaClient.execution.update.mockResolvedValue(cancelledExecution);

      const response = await request(app)
        .post(`/api/v1/executions/${execution.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.execution.status).toBe('cancelled');
    });

    it('should return 400 for completed execution', async () => {
      const execution = createMockExecution({ status: 'completed' });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .post(`/api/v1/executions/${execution.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 400 for already cancelled execution', async () => {
      const execution = createMockExecution({ status: 'cancelled' });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .post(`/api/v1/executions/${execution.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent execution', async () => {
      mockPrismaClient.execution.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/executions/${uuidv4()}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for execution owned by different user', async () => {
      const execution = createMockExecution({
        status: 'running',
        userId: uuidv4(),
        workflow: { id: mockWorkflowId, name: 'Test', userId: uuidv4() },
      });
      mockPrismaClient.execution.findUnique.mockResolvedValue(execution);

      const response = await request(app)
        .post(`/api/v1/executions/${execution.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).post(`/api/v1/executions/${uuidv4()}/cancel`);

      expect(response.status).toBe(401);
    });
  });
});
