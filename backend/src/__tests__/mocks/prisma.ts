/**
 * Prisma Client Mock for Unit Testing
 *
 * This module provides a comprehensive mock of the Prisma Client for unit tests.
 * It allows tests to mock database operations without connecting to a real database.
 *
 * Usage:
 * ```typescript
 * // In your test file:
 * import { mockPrisma, mockPrismaModule, resetPrismaMock } from '../__tests__/mocks/prisma';
 *
 * // Mock the prisma module
 * jest.mock('@/lib/prisma', () => mockPrismaModule);
 *
 * // Use mockPrisma to set up return values
 * mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
 *
 * // Reset mocks between tests
 * beforeEach(() => {
 *   resetPrismaMock();
 * });
 * ```
 *
 * @module __tests__/mocks/prisma
 */

import { jest } from '@jest/globals';

// ============================================================================
// Types - Using 'any' for Jest mock compatibility with Jest 30
// ============================================================================

type MockFn = jest.Mock<any>;

interface MockModel {
  findUnique: MockFn;
  findUniqueOrThrow: MockFn;
  findFirst: MockFn;
  findFirstOrThrow: MockFn;
  findMany: MockFn;
  create: MockFn;
  createMany: MockFn;
  update: MockFn;
  updateMany: MockFn;
  upsert: MockFn;
  delete: MockFn;
  deleteMany: MockFn;
  count: MockFn;
  aggregate: MockFn;
  groupBy: MockFn;
}

interface MockPrismaClient {
  // Models
  user: MockModel;
  agent: MockModel;
  workflow: MockModel;
  workflowStep: MockModel;
  execution: MockModel;
  executionLog: MockModel;
  template: MockModel;
  deployment: MockModel;
  apiKey: MockModel;
  auditLog: MockModel;

  // Prisma client methods
  $connect: MockFn;
  $disconnect: MockFn;
  $executeRaw: MockFn;
  $executeRawUnsafe: MockFn;
  $queryRaw: MockFn;
  $queryRawUnsafe: MockFn;
  $transaction: MockFn;
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Create a mock model with all standard Prisma operations
 */
const createMockModel = (): MockModel => ({
  findUnique: jest.fn<any>().mockResolvedValue(null),
  findUniqueOrThrow: jest.fn<any>().mockRejectedValue(new Error('Record not found')),
  findFirst: jest.fn<any>().mockResolvedValue(null),
  findFirstOrThrow: jest.fn<any>().mockRejectedValue(new Error('Record not found')),
  findMany: jest.fn<any>().mockResolvedValue([]),
  create: jest
    .fn<any>()
    .mockImplementation((args: { data: unknown }) => Promise.resolve(args.data)),
  createMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
  update: jest
    .fn<any>()
    .mockImplementation((args: { data: unknown }) => Promise.resolve(args.data)),
  updateMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
  upsert: jest
    .fn<any>()
    .mockImplementation((args: { create: unknown }) => Promise.resolve(args.create)),
  delete: jest.fn<any>().mockResolvedValue(null),
  deleteMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
  count: jest.fn<any>().mockResolvedValue(0),
  aggregate: jest.fn<any>().mockResolvedValue({}),
  groupBy: jest.fn<any>().mockResolvedValue([]),
});

/**
 * Create a complete mock Prisma client
 */
const createMockPrismaClient = (): MockPrismaClient => ({
  // Models
  user: createMockModel(),
  agent: createMockModel(),
  workflow: createMockModel(),
  workflowStep: createMockModel(),
  execution: createMockModel(),
  executionLog: createMockModel(),
  template: createMockModel(),
  deployment: createMockModel(),
  apiKey: createMockModel(),
  auditLog: createMockModel(),

  // Prisma client methods
  $connect: jest.fn<any>().mockResolvedValue(undefined),
  $disconnect: jest.fn<any>().mockResolvedValue(undefined),
  $executeRaw: jest.fn<any>().mockResolvedValue(0),
  $executeRawUnsafe: jest.fn<any>().mockResolvedValue(0),
  $queryRaw: jest.fn<any>().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn<any>().mockResolvedValue([]),
  $transaction: jest.fn<any>().mockImplementation((callback: unknown) => {
    // For array of promises, resolve them in sequence
    if (Array.isArray(callback)) {
      return Promise.all(callback);
    }
    // For callback function, call it with the mock client
    if (typeof callback === 'function') {
      return (callback as (tx: MockPrismaClient) => Promise<unknown>)(mockPrisma);
    }
    return Promise.resolve(callback);
  }),
});

// ============================================================================
// Mock Instance
// ============================================================================

/**
 * The mock Prisma client instance
 * Use this to set up mock return values in your tests
 */
export const mockPrisma: MockPrismaClient = createMockPrismaClient();

// ============================================================================
// Module Mock
// ============================================================================

/**
 * Mock module that can be used with jest.mock()
 *
 * Usage:
 * ```typescript
 * jest.mock('@/lib/prisma', () => mockPrismaModule);
 * // or
 * jest.mock('../../lib/prisma', () => mockPrismaModule);
 * ```
 */
export const mockPrismaModule = {
  prisma: mockPrisma,
  isPrismaAvailable: jest.fn<any>().mockReturnValue(true),
  getPrismaInitError: jest.fn<any>().mockReturnValue(undefined),
  disconnectPrisma: jest.fn<any>().mockResolvedValue(undefined),
  checkDatabaseHealth: jest.fn<any>().mockResolvedValue({
    healthy: true,
    responseTimeMs: 10,
    configured: true,
  }),
  getDatabaseInfo: jest.fn<any>().mockReturnValue({
    provider: 'postgresql',
    configured: true,
    available: true,
  }),
  getPoolMetrics: jest.fn<any>().mockReturnValue({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    slowQueries: 0,
    avgQueryTimeMs: 0,
    lastUpdated: new Date(),
    poolConfig: {
      connectionLimit: 10,
      poolTimeout: 10,
      connectTimeout: 5,
      pgBouncerEnabled: false,
    },
  }),
  getPoolConfig: jest.fn<any>().mockReturnValue({
    connectionLimit: 10,
    poolTimeout: 10,
    connectTimeout: 5,
    pgBouncerEnabled: false,
  }),
  resetPoolMetrics: jest.fn<any>(),
  recordQueryMetrics: jest.fn<any>(),
  getPoolHealthSummary: jest.fn<any>().mockReturnValue({
    successRate: 100,
    avgQueryTimeMs: 0,
    slowQueryRate: 0,
    totalQueries: 0,
    isHealthy: true,
  }),
};

// ============================================================================
// Reset Functions
// ============================================================================

/**
 * Reset all mock functions on a model
 */
const resetMockModel = (model: MockModel): void => {
  model.findUnique.mockReset().mockResolvedValue(null);
  model.findUniqueOrThrow.mockReset().mockRejectedValue(new Error('Record not found'));
  model.findFirst.mockReset().mockResolvedValue(null);
  model.findFirstOrThrow.mockReset().mockRejectedValue(new Error('Record not found'));
  model.findMany.mockReset().mockResolvedValue([]);
  model.create
    .mockReset()
    .mockImplementation((args: { data: unknown }) => Promise.resolve(args.data));
  model.createMany.mockReset().mockResolvedValue({ count: 0 });
  model.update
    .mockReset()
    .mockImplementation((args: { data: unknown }) => Promise.resolve(args.data));
  model.updateMany.mockReset().mockResolvedValue({ count: 0 });
  model.upsert
    .mockReset()
    .mockImplementation((args: { create: unknown }) => Promise.resolve(args.create));
  model.delete.mockReset().mockResolvedValue(null);
  model.deleteMany.mockReset().mockResolvedValue({ count: 0 });
  model.count.mockReset().mockResolvedValue(0);
  model.aggregate.mockReset().mockResolvedValue({});
  model.groupBy.mockReset().mockResolvedValue([]);
};

/**
 * Reset all Prisma mocks to their default state
 * Call this in beforeEach() to ensure test isolation
 */
export const resetPrismaMock = (): void => {
  // Reset all model mocks
  resetMockModel(mockPrisma.user);
  resetMockModel(mockPrisma.agent);
  resetMockModel(mockPrisma.workflow);
  resetMockModel(mockPrisma.workflowStep);
  resetMockModel(mockPrisma.execution);
  resetMockModel(mockPrisma.executionLog);
  resetMockModel(mockPrisma.template);
  resetMockModel(mockPrisma.deployment);
  resetMockModel(mockPrisma.apiKey);
  resetMockModel(mockPrisma.auditLog);

  // Reset client methods
  mockPrisma.$connect.mockReset().mockResolvedValue(undefined);
  mockPrisma.$disconnect.mockReset().mockResolvedValue(undefined);
  mockPrisma.$executeRaw.mockReset().mockResolvedValue(0);
  mockPrisma.$executeRawUnsafe.mockReset().mockResolvedValue(0);
  mockPrisma.$queryRaw.mockReset().mockResolvedValue([]);
  mockPrisma.$queryRawUnsafe.mockReset().mockResolvedValue([]);
  mockPrisma.$transaction.mockReset().mockImplementation((callback: unknown) => {
    if (Array.isArray(callback)) {
      return Promise.all(callback);
    }
    if (typeof callback === 'function') {
      return (callback as (tx: MockPrismaClient) => Promise<unknown>)(mockPrisma);
    }
    return Promise.resolve(callback);
  });

  // Reset module mock functions
  mockPrismaModule.isPrismaAvailable.mockReset().mockReturnValue(true);
  mockPrismaModule.getPrismaInitError.mockReset().mockReturnValue(undefined);
  mockPrismaModule.disconnectPrisma.mockReset().mockResolvedValue(undefined);
  mockPrismaModule.checkDatabaseHealth.mockReset().mockResolvedValue({
    healthy: true,
    responseTimeMs: 10,
    configured: true,
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Set up a model to return specific data for findUnique
 */
export const mockFindUnique = <T>(model: MockModel, data: T | null): void => {
  model.findUnique.mockResolvedValue(data);
  if (data) {
    model.findUniqueOrThrow.mockResolvedValue(data);
  } else {
    model.findUniqueOrThrow.mockRejectedValue(new Error('Record not found'));
  }
};

/**
 * Set up a model to return specific data for findMany
 */
export const mockFindMany = <T>(model: MockModel, data: T[]): void => {
  model.findMany.mockResolvedValue(data);
  model.count.mockResolvedValue(data.length);
};

/**
 * Set up a model to return specific data for create
 */
export const mockCreate = <T>(model: MockModel, data: T): void => {
  model.create.mockResolvedValue(data);
};

/**
 * Set up a model to throw an error
 */
export const mockError = (model: MockModel, method: keyof MockModel, error: Error): void => {
  model[method].mockRejectedValue(error);
};

/**
 * Simulate a transaction that commits successfully
 */
export const mockSuccessfulTransaction = <T>(result: T): void => {
  mockPrisma.$transaction.mockResolvedValue(result);
};

/**
 * Simulate a transaction that rolls back due to an error
 */
export const mockFailedTransaction = (error: Error): void => {
  mockPrisma.$transaction.mockRejectedValue(error);
};

// ============================================================================
// Export Types
// ============================================================================

export type { MockModel, MockPrismaClient, MockFn };
