/**
 * Agents API Integration Tests
 *
 * Tests for agent management endpoints:
 * - POST /agents - Create agent
 * - GET /agents - List agents with pagination
 * - GET /agents/:id - Get agent details
 * - PATCH /agents/:id - Update agent
 * - DELETE /agents/:id - Soft delete agent
 *
 * @module __tests__/integration/agents.api.test
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import crypto from 'crypto';

const uuidv4 = (): string => crypto.randomUUID();

// Mock user and agent data
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

// Note: Prisma enum values are lowercase (e.g., 'code', 'draft')
const createMockAgent = (overrides: any = {}) => ({
  id: uuidv4(),
  userId: mockUserId,
  name: 'Test Agent',
  description: 'A test agent',
  type: 'code', // lowercase to match Prisma enum
  status: 'draft', // lowercase to match Prisma enum
  version: 1,
  config: {},
  capabilities: [],
  parameters: {},
  maxExecutionTime: 300,
  maxMemoryMb: 512,
  maxConcurrentExecutions: 1,
  tags: [],
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
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
    findFirst: jest.fn<any>().mockResolvedValue(null),
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>().mockResolvedValue(0),
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
  mockPrismaClient.agent.findFirst.mockResolvedValue(null);
  mockPrismaClient.agent.findMany.mockResolvedValue([]);
  mockPrismaClient.agent.count.mockResolvedValue(0);
};

describe('Agents API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // POST /agents - Create agent
  // ==========================================================================
  describe('POST /api/v1/agents', () => {
    const agentsEndpoint = '/api/v1/agents';

    it('should create a new agent successfully (201)', async () => {
      const createData = { name: 'My Test Agent', type: 'CODE', description: 'A test agent' };
      const createdAgent = createMockAgent({ name: createData.name });
      mockPrismaClient.agent.create.mockResolvedValue(createdAgent);

      const response = await request(app)
        .post(agentsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('agent');
    });

    it('should return 400 for validation error (missing name)', async () => {
      const response = await request(app)
        .post(agentsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'CODE' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .post(agentsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', type: 'INVALID_TYPE' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).post(agentsEndpoint).send({ name: 'Test', type: 'CODE' });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /agents - List agents
  // ==========================================================================
  describe('GET /api/v1/agents', () => {
    const agentsEndpoint = '/api/v1/agents';

    it('should list agents with pagination (200)', async () => {
      const agents = [createMockAgent({ name: 'Agent 1' }), createMockAgent({ name: 'Agent 2' })];
      mockPrismaClient.agent.findMany.mockResolvedValue(agents);
      mockPrismaClient.agent.count.mockResolvedValue(2);

      const response = await request(app)
        .get(agentsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('agents');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).get(agentsEndpoint);
      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /agents/:id - Get agent details
  // ==========================================================================
  describe('GET /api/v1/agents/:id', () => {
    it('should get agent details (200)', async () => {
      const agent = createMockAgent();
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);

      const response = await request(app)
        .get(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('agent');
    });

    it('should return 404 for non-existent agent', async () => {
      mockPrismaClient.agent.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/agents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/agents/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for agent owned by different user (security: hide existence)', async () => {
      const agent = createMockAgent({ userId: uuidv4() }); // Different user
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);

      const response = await request(app)
        .get(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Service returns null for non-owner to hide resource existence
      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // PATCH /agents/:id - Update agent
  // ==========================================================================
  describe('PATCH /api/v1/agents/:id', () => {
    it('should update agent successfully (200)', async () => {
      const agent = createMockAgent();
      const updatedAgent = { ...agent, name: 'Updated Name' };
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);
      mockPrismaClient.agent.update.mockResolvedValue(updatedAgent);

      const response = await request(app)
        .patch(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for empty update body', async () => {
      const agent = createMockAgent();
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);

      const response = await request(app)
        .patch(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent agent', async () => {
      mockPrismaClient.agent.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/agents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // DELETE /agents/:id - Soft delete
  // ==========================================================================
  describe('DELETE /api/v1/agents/:id', () => {
    it('should soft delete agent successfully (204)', async () => {
      const agent = createMockAgent();
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);
      mockPrismaClient.agent.update.mockResolvedValue({ ...agent, deletedAt: new Date() });

      const response = await request(app)
        .delete(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent agent', async () => {
      mockPrismaClient.agent.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/agents/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for agent owned by different user (security: hide existence)', async () => {
      const agent = createMockAgent({ userId: uuidv4() });
      mockPrismaClient.agent.findFirst.mockResolvedValue(agent);

      const response = await request(app)
        .delete(`/api/v1/agents/${agent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Service returns null for non-owner to hide resource existence
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).delete(`/api/v1/agents/${uuidv4()}`);
      expect(response.status).toBe(401);
    });
  });
});
