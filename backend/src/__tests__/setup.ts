/**
 * Jest Global Test Setup
 *
 * This file runs before each test file and sets up:
 * - Global test utilities and matchers
 * - Environment configuration
 * - Mock defaults
 * - Console output handling
 *
 * @module __tests__/setup
 */

import { jest } from '@jest/globals';

// ============================================================================
// Mock Redis-dependent modules to prevent connection attempts during tests
// ============================================================================

// Mock publishing queue to prevent Redis connection attempts
// This mock is applied globally to all tests (unit and integration)
jest.mock('../lib/publishingQueue', () => ({
  publishingQueue: null,
  isPublishingQueueAvailable: jest.fn().mockReturnValue(false),
  PUBLISHING_QUEUE_NAME: 'publishing-builds',
}));

// ============================================================================
// Environment Configuration
// ============================================================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-unit-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-unit-tests';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-min';

// ============================================================================
// Console Output Control
// ============================================================================

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Suppress console output during tests unless DEBUG_TESTS is set
if (!process.env.DEBUG_TESTS) {
  beforeAll(() => {
    // Suppress console output for cleaner test output
    console.log = jest.fn<any>();
    console.info = jest.fn<any>();
    console.warn = jest.fn<any>();
    console.debug = jest.fn<any>();
    // Keep console.error for debugging test failures
    // console.error = jest.fn<any>();
  });

  afterAll(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
    // console.error = originalConsole.error;
  });
}

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Wait for a specified number of milliseconds
 * Useful for testing async operations with timing
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate a random string of specified length
 * Useful for creating unique test data
 */
export const randomString = (length: number = 8): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

/**
 * Generate a random email address for testing
 */
export const randomEmail = (): string => {
  return `test-${randomString()}@example.com`;
};

/**
 * Generate a random UUID-like string for testing
 */
export const randomId = (): string => {
  return `test-${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
};

/**
 * Create a mock date for consistent testing
 */
export const mockDate = (dateString: string = '2026-01-06T12:00:00.000Z'): Date => {
  return new Date(dateString);
};

/**
 * Assert that a function throws an error with specific message
 */
export const expectToThrowWithMessage = async (
  fn: () => Promise<unknown> | unknown,
  expectedMessage: string | RegExp,
): Promise<void> => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    } else {
      throw error;
    }
  }
};

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Create a mock user object
 */
export const createMockUser = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  return {
    id: randomId(),
    email: randomEmail(),
    name: 'Test User',
    role: 'USER',
    passwordHash: 'hashed-password',
    emailVerified: true,
    isActive: true,
    createdAt: mockDate(),
    updatedAt: mockDate(),
    deletedAt: null,
    ...overrides,
  };
};

/**
 * Create a mock agent object
 */
export const createMockAgent = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  return {
    id: randomId(),
    userId: randomId(),
    name: 'Test Agent',
    description: 'A test agent',
    type: 'CODE',
    status: 'ACTIVE',
    version: 1,
    configuration: {},
    isPublic: false,
    tags: [],
    createdAt: mockDate(),
    updatedAt: mockDate(),
    deletedAt: null,
    ...overrides,
  };
};

/**
 * Create a mock workflow object
 */
export const createMockWorkflow = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  return {
    id: randomId(),
    userId: randomId(),
    name: 'Test Workflow',
    description: 'A test workflow',
    status: 'ACTIVE',
    version: 1,
    configuration: {},
    isPublic: false,
    tags: [],
    scheduleEnabled: false,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    createdAt: mockDate(),
    updatedAt: mockDate(),
    deletedAt: null,
    ...overrides,
  };
};

/**
 * Create a mock execution object
 */
export const createMockExecution = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  return {
    id: randomId(),
    workflowId: randomId(),
    userId: randomId(),
    status: 'PENDING',
    triggerType: 'MANUAL',
    inputs: {},
    outputs: null,
    error: null,
    startedAt: null,
    completedAt: null,
    durationMs: null,
    createdAt: mockDate(),
    ...overrides,
  };
};

/**
 * Create a mock execution log object
 */
export const createMockExecutionLog = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  return {
    id: randomId(),
    executionId: randomId(),
    level: 'INFO',
    message: 'Test log message',
    metadata: {},
    stepKey: null,
    stepStatus: null,
    stepDurationMs: null,
    createdAt: mockDate(),
    ...overrides,
  };
};

// ============================================================================
// Custom Jest Matchers
// ============================================================================

expect.extend({
  /**
   * Check if a value is a valid UUID
   */
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },

  /**
   * Check if a date is within a certain time range from now
   */
  toBeWithinMinutes(received: Date, minutes: number) {
    const now = new Date();
    const diff = Math.abs(now.getTime() - received.getTime());
    const pass = diff <= minutes * 60 * 1000;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within ${minutes} minutes of now`
          : `expected ${received} to be within ${minutes} minutes of now, but difference was ${diff / 60000} minutes`,
    };
  },

  /**
   * Check if an object has all required keys
   */
  toHaveAllKeys(received: Record<string, unknown>, keys: string[]) {
    const missingKeys = keys.filter((key) => !(key in received));
    const pass = missingKeys.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? `expected object not to have all keys: ${keys.join(', ')}`
          : `expected object to have keys: ${missingKeys.join(', ')}`,
    };
  },
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeWithinMinutes(minutes: number): R;
      toHaveAllKeys(keys: string[]): R;
    }
  }
}

// ============================================================================
// Global Test Hooks
// ============================================================================

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Close any open handles
  jest.useRealTimers();
});

// ============================================================================
// Export Test Utilities
// ============================================================================

export { jest, originalConsole };
