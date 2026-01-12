/**
 * Templates API Integration Tests
 *
 * Tests for template endpoints:
 * - GET /templates - List public templates (no auth)
 * - GET /templates/:id - Get template details
 * - POST /templates/:id/instantiate - Create from template
 *
 * @module __tests__/integration/templates.api.test
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

// Note: Prisma enum values are lowercase due to @map in schema
const createMockTemplate = (overrides: any = {}) => ({
  id: uuidv4(),
  userId: null,
  name: 'Test Template',
  description: 'A test template',
  type: 'agent', // lowercase to match Prisma @map
  category: 'automation',
  version: '1.0.0',
  templateData: { agentType: 'CODE', config: {} },
  inputSchema: {},
  outputSchema: {},
  tags: [],
  isPublic: true,
  isOfficial: true,
  usageCount: 0,
  rating: 0,
  ratingCount: 0,
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
    findFirst: jest.fn<any>().mockResolvedValue(null),
    findMany: jest.fn<any>().mockResolvedValue([]),
    count: jest.fn<any>().mockResolvedValue(0),
    update: jest.fn<any>(),
    groupBy: jest.fn<any>().mockResolvedValue([]),
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
  mockPrismaClient.template.findFirst.mockResolvedValue(null);
  mockPrismaClient.template.findMany.mockResolvedValue([]);
  mockPrismaClient.template.count.mockResolvedValue(0);
};

describe('Templates API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // GET /templates - List public templates (no auth required)
  // ==========================================================================
  describe('GET /api/v1/templates', () => {
    const templatesEndpoint = '/api/v1/templates';

    it('should list public templates without authentication (200)', async () => {
      const templates = [
        createMockTemplate({ name: 'Template 1' }),
        createMockTemplate({ name: 'Template 2' }),
      ];
      mockPrismaClient.template.findMany.mockResolvedValue(templates);
      mockPrismaClient.template.count.mockResolvedValue(2);

      const response = await request(app).get(templatesEndpoint);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templates');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter templates by type', async () => {
      const templates = [createMockTemplate({ type: 'AGENT' })];
      mockPrismaClient.template.findMany.mockResolvedValue(templates);
      mockPrismaClient.template.count.mockResolvedValue(1);

      const response = await request(app).get(templatesEndpoint).query({ type: 'AGENT' });

      expect(response.status).toBe(200);
      expect(response.body.data.templates.length).toBe(1);
    });

    it('should filter templates by category', async () => {
      const templates = [createMockTemplate({ category: 'automation' })];
      mockPrismaClient.template.findMany.mockResolvedValue(templates);
      mockPrismaClient.template.count.mockResolvedValue(1);

      const response = await request(app).get(templatesEndpoint).query({ category: 'automation' });

      expect(response.status).toBe(200);
      expect(response.body.data.templates.length).toBe(1);
    });

    it('should paginate results', async () => {
      const templates = [createMockTemplate()];
      mockPrismaClient.template.findMany.mockResolvedValue(templates);
      mockPrismaClient.template.count.mockResolvedValue(25);

      const response = await request(app).get(templatesEndpoint).query({ page: 2, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('totalItems', 25);
      expect(response.body.data.pagination).toHaveProperty('page', 2);
    });
  });

  // ==========================================================================
  // GET /templates/:id - Get template details
  // ==========================================================================
  describe('GET /api/v1/templates/:id', () => {
    it('should get public template details without auth (200)', async () => {
      const template = createMockTemplate({ isPublic: true });
      mockPrismaClient.template.findFirst.mockResolvedValue(template);

      const response = await request(app).get(`/api/v1/templates/${template.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
    });

    it('should return 404 for non-existent template', async () => {
      mockPrismaClient.template.findFirst.mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/templates/${uuidv4()}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/v1/templates/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // POST /templates/:id/instantiate - Create from template
  // ==========================================================================
  describe('POST /api/v1/templates/:id/instantiate', () => {
    it('should instantiate agent template (201)', async () => {
      const template = createMockTemplate({ type: 'agent', templateData: { agentType: 'code' } });
      const createdAgent = {
        id: uuidv4(),
        userId: mockUserId,
        name: 'My Agent',
        type: 'code', // lowercase to match Prisma enum
        status: 'draft', // lowercase to match Prisma enum
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaClient.template.findFirst.mockResolvedValue(template);
      mockPrismaClient.template.update.mockResolvedValue({ ...template, usageCount: 1 });
      mockPrismaClient.agent.create.mockResolvedValue(createdAgent);

      const response = await request(app)
        .post(`/api/v1/templates/${template.id}/instantiate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My Agent' });

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resourceType', 'agent');
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .post(`/api/v1/templates/${uuidv4()}/instantiate`)
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent template', async () => {
      mockPrismaClient.template.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/templates/${uuidv4()}/instantiate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid name format', async () => {
      const template = createMockTemplate();
      mockPrismaClient.template.findFirst.mockResolvedValue(template);

      const response = await request(app)
        .post(`/api/v1/templates/${template.id}/instantiate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'a'.repeat(256) }); // Too long

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================================================
  // GET /templates/categories - Get categories
  // ==========================================================================
  describe('GET /api/v1/templates/categories', () => {
    it('should return template categories (200)', async () => {
      mockPrismaClient.template.groupBy.mockResolvedValue([
        { category: 'automation' },
        { category: 'data' },
      ]);

      const response = await request(app).get('/api/v1/templates/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
    });
  });
});
