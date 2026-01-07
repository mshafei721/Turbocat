/**
 * Workflows API Integration Tests
 *
 * Tests for workflow management endpoints:
 * - POST /workflows - Create workflow with steps
 * - GET /workflows/:id - Get workflow with steps
 * - PATCH /workflows/:id - Update workflow
 * - POST /workflows/:id/execute - Trigger execution
 * - GET /workflows/:id/executions - Execution history
 *
 * @module __tests__/integration/workflows.api.test
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

// Note: Prisma enum values are lowercase (e.g., 'draft', 'active')
const createMockWorkflow = (overrides: any = {}) => ({
  id: uuidv4(),
  userId: mockUserId,
  name: 'Test Workflow',
  description: 'A test workflow',
  status: 'draft', // lowercase to match Prisma enum
  version: 1,
  config: {},
  schedule: null,
  tags: [],
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  steps: [],
  ...overrides,
});

// Note: Prisma enum values are lowercase (e.g., 'pending', 'running')
const createMockExecution = (workflowId: string, overrides: any = {}) => ({
  id: uuidv4(),
  workflowId,
  userId: mockUserId,
  status: 'pending', // lowercase to match Prisma enum
  triggerType: 'manual', // lowercase to match Prisma enum
  inputData: {},
  outputData: null,
  error: null,
  stepsTotal: 1,
  stepsCompleted: 0,
  stepsFailed: 0,
  startedAt: null,
  completedAt: null,
  durationMs: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    findFirst: jest.fn<any>(),
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    count: jest.fn<any>().mockResolvedValue(0),
  },
  workflowStep: {
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>().mockResolvedValue([]),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
    delete: jest.fn<any>(),
    deleteMany: jest.fn<any>(),
    createMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
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
  mockPrismaClient.workflow.findUnique.mockResolvedValue(null);
  mockPrismaClient.workflow.findMany.mockResolvedValue([]);
  mockPrismaClient.workflow.count.mockResolvedValue(0);
};

describe('Workflows API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // POST /workflows - Create workflow
  // ==========================================================================
  describe('POST /api/v1/workflows', () => {
    const workflowsEndpoint = '/api/v1/workflows';

    it('should create a workflow (201)', async () => {
      const createData = { name: 'Test Workflow', description: 'A test workflow' };
      const createdWorkflow = createMockWorkflow({ name: createData.name });
      mockPrismaClient.workflow.create.mockResolvedValue(createdWorkflow);

      const response = await request(app)
        .post(workflowsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('workflow');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post(workflowsEndpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No name' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app).post(workflowsEndpoint).send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  // ==========================================================================
  // GET /workflows/:id - Get workflow
  // ==========================================================================
  describe('GET /api/v1/workflows/:id', () => {
    it('should get workflow with steps (200)', async () => {
      const workflow = createMockWorkflow({
        steps: [{ id: uuidv4(), stepKey: 'step_1', stepName: 'Step 1' }],
      });
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);

      const response = await request(app)
        .get(`/api/v1/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('workflow');
    });

    it('should return 404 for non-existent workflow', async () => {
      mockPrismaClient.workflow.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/workflows/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for workflow owned by different user', async () => {
      const workflow = createMockWorkflow({ userId: uuidv4() });
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);

      const response = await request(app)
        .get(`/api/v1/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ==========================================================================
  // PATCH /workflows/:id - Update workflow
  // ==========================================================================
  describe('PATCH /api/v1/workflows/:id', () => {
    it('should update workflow successfully (200)', async () => {
      const workflow = createMockWorkflow();
      const updatedWorkflow = { ...workflow, name: 'Updated Name' };
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);
      mockPrismaClient.workflow.update.mockResolvedValue(updatedWorkflow);

      const response = await request(app)
        .patch(`/api/v1/workflows/${workflow.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for empty update body', async () => {
      const response = await request(app)
        .patch(`/api/v1/workflows/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent workflow', async () => {
      mockPrismaClient.workflow.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/workflows/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // POST /workflows/:id/execute - Trigger execution
  // ==========================================================================
  describe('POST /api/v1/workflows/:id/execute', () => {
    it('should trigger execution (201)', async () => {
      const workflow = createMockWorkflow({
        status: 'active',
        steps: [{ id: uuidv4(), stepKey: 'step_1' }],
      });
      const execution = createMockExecution(workflow.id);
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);
      mockPrismaClient.execution.create.mockResolvedValue(execution);

      const response = await request(app)
        .post(`/api/v1/workflows/${workflow.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ triggerType: 'MANUAL' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('execution');
    });

    it('should return 400 for inactive workflow', async () => {
      const workflow = createMockWorkflow({ status: 'draft' });
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);

      const response = await request(app)
        .post(`/api/v1/workflows/${workflow.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent workflow', async () => {
      mockPrismaClient.workflow.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/workflows/${uuidv4()}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  // ==========================================================================
  // GET /workflows/:id/executions - Execution history
  // ==========================================================================
  describe('GET /api/v1/workflows/:id/executions', () => {
    it('should get execution history (200)', async () => {
      const workflow = createMockWorkflow();
      const executions = [
        createMockExecution(workflow.id, { status: 'COMPLETED' }),
        createMockExecution(workflow.id, { status: 'FAILED' }),
      ];
      mockPrismaClient.workflow.findUnique.mockResolvedValue(workflow);
      mockPrismaClient.execution.findMany.mockResolvedValue(executions);
      mockPrismaClient.execution.count.mockResolvedValue(2);

      const response = await request(app)
        .get(`/api/v1/workflows/${workflow.id}/executions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('executions');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return 404 for non-existent workflow', async () => {
      mockPrismaClient.workflow.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/workflows/${uuidv4()}/executions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
