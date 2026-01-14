/**
 * Publishing Service Mocks
 *
 * This module provides mock implementations for testing the publishing flow:
 * - Mock AppleService
 * - Mock ExpoService
 * - Mock PublishingService
 * - Mock BullMQ Queue
 * - Mock Encryption utilities
 *
 * Usage:
 * ```typescript
 * import {
 *   createMockAppleService,
 *   createMockExpoService,
 *   createMockPublishingQueue
 * } from './mocks/publishing-mocks';
 *
 * const mockAppleService = createMockAppleService();
 * mockAppleService.validateCredentials.mockResolvedValue(true);
 * ```
 *
 * @module __tests__/mocks/publishing-mocks
 */

import { jest } from '@jest/globals';

// =============================================================================
// APPLE SERVICE MOCKS
// =============================================================================

/**
 * Create mock AppleService instance
 *
 * @returns Mock AppleService with jest mock functions
 */
export function createMockAppleService() {
  return {
    generateJWT: jest.fn<any>().mockReturnValue('mock-jwt-token'),
    validateCredentials: jest.fn<any>().mockResolvedValue(true),
    createApp: jest.fn<any>().mockResolvedValue({
      data: {
        id: 'app-123',
        type: 'apps',
        attributes: {
          name: 'Test App',
          bundleId: 'com.example.testapp',
        },
      },
    }),
    uploadBuild: jest.fn<any>().mockRejectedValue(new Error('Not implemented')),
  };
}

// =============================================================================
// EXPO SERVICE MOCKS
// =============================================================================

/**
 * Create mock ExpoService instance
 *
 * @returns Mock ExpoService with jest mock functions
 */
export function createMockExpoService() {
  return {
    validateToken: jest.fn<any>().mockResolvedValue(true),
    startBuild: jest.fn<any>().mockResolvedValue('build-123456'),
    getBuildStatus: jest.fn<any>().mockResolvedValue({
      status: 'finished',
      artifactUrl: 'https://expo.dev/artifacts/build.ipa',
    }),
  };
}

// =============================================================================
// PUBLISHING SERVICE MOCKS
// =============================================================================

/**
 * Create mock PublishingService instance
 *
 * @returns Mock PublishingService with jest mock functions
 */
export function createMockPublishingService() {
  return {
    initiatePublishing: jest.fn<any>(),
    executeBuildAndSubmit: jest.fn<any>().mockResolvedValue('SUBMITTED'),
    updateStatus: jest.fn<any>().mockResolvedValue(undefined),
    getStatus: jest.fn<any>().mockResolvedValue(null),
    retry: jest.fn<any>().mockResolvedValue({ success: true, message: 'Publishing retry started' }),
    generateBundleId: jest.fn<any>().mockImplementation((appName: string) => {
      const sanitized = appName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      return `com.turbocat.${sanitized}`;
    }),
  };
}

// =============================================================================
// BULL MQ MOCKS
// =============================================================================

/**
 * Create mock BullMQ Queue instance
 *
 * @returns Mock Queue with jest mock functions
 */
export function createMockPublishingQueue() {
  return {
    add: jest.fn<any>().mockResolvedValue({
      id: 'job-123',
      name: 'build-and-submit',
      data: {},
    }),
    getJob: jest.fn<any>().mockResolvedValue(null),
    getJobs: jest.fn<any>().mockResolvedValue([]),
    clean: jest.fn<any>().mockResolvedValue([]),
    close: jest.fn<any>().mockResolvedValue(undefined),
    on: jest.fn<any>(),
    off: jest.fn<any>(),
  };
}

/**
 * Mock isPublishingQueueAvailable function
 *
 * @param available Whether queue should be available
 * @returns Mock function
 */
export function mockPublishingQueueAvailability(available: boolean = true) {
  return jest.fn<any>().mockReturnValue(available);
}

// =============================================================================
// ENCRYPTION MOCKS
// =============================================================================

/**
 * Mock encrypted data structure
 */
export const mockEncryptedData = {
  iv: 'mock-iv-base64==',
  content: 'mock-encrypted-content-base64==',
  tag: 'mock-tag-base64==',
};

/**
 * Create mock encryption functions
 *
 * @returns Object with encrypt and decrypt mock functions
 */
export function createMockEncryption() {
  return {
    encrypt: jest.fn<any>().mockReturnValue(mockEncryptedData),
    decrypt: jest.fn<any>().mockReturnValue('decrypted-value'),
  };
}

// =============================================================================
// PRISMA MOCKS
// =============================================================================

/**
 * Create mock Prisma client for publishing tests
 *
 * @returns Mock Prisma client with publishing-specific methods
 */
export function createMockPrismaClient() {
  return {
    workflow: {
      findFirst: jest.fn<any>(),
      findUnique: jest.fn<any>(),
      findMany: jest.fn<any>(),
      create: jest.fn<any>(),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
    },
    publishing: {
      findFirst: jest.fn<any>(),
      findUnique: jest.fn<any>(),
      findMany: jest.fn<any>(),
      create: jest.fn<any>(),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
      deleteMany: jest.fn<any>(),
    },
    $transaction: jest.fn<any>().mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        return callback(createMockPrismaClient());
      }
      return Promise.all(callback);
    }),
    $connect: jest.fn<any>().mockResolvedValue(undefined),
    $disconnect: jest.fn<any>().mockResolvedValue(undefined),
  };
}

// =============================================================================
// AXIOS MOCKS
// =============================================================================

/**
 * Create mock axios instance for external API calls
 *
 * @returns Mock axios with get/post methods
 */
export function createMockAxios() {
  return {
    get: jest.fn<any>(),
    post: jest.fn<any>(),
    put: jest.fn<any>(),
    delete: jest.fn<any>(),
    patch: jest.fn<any>(),
  };
}

/**
 * Mock successful Apple API validation
 *
 * @param mockAxios Mock axios instance
 */
export function mockAppleValidationSuccess(mockAxios: ReturnType<typeof createMockAxios>) {
  mockAxios.get.mockResolvedValue({
    status: 200,
    data: {
      data: [
        {
          id: 'app-123',
          type: 'apps',
          attributes: { name: 'Test App' },
        },
      ],
    },
  });
}

/**
 * Mock failed Apple API validation
 *
 * @param mockAxios Mock axios instance
 * @param errorMessage Optional error message
 */
export function mockAppleValidationFailure(
  mockAxios: ReturnType<typeof createMockAxios>,
  errorMessage = 'Invalid credentials',
) {
  mockAxios.get.mockRejectedValue({
    response: {
      status: 401,
      data: {
        errors: [
          {
            status: '401',
            code: 'INVALID_CREDENTIALS',
            title: 'Authentication Failed',
            detail: errorMessage,
          },
        ],
      },
    },
    message: errorMessage,
  });
}

/**
 * Mock successful Expo token validation
 *
 * @param mockAxios Mock axios instance
 */
export function mockExpoTokenValidationSuccess(mockAxios: ReturnType<typeof createMockAxios>) {
  mockAxios.get.mockResolvedValue({
    status: 200,
    data: { id: 'user-123' },
  });
}

/**
 * Mock failed Expo token validation
 *
 * @param mockAxios Mock axios instance
 */
export function mockExpoTokenValidationFailure(mockAxios: ReturnType<typeof createMockAxios>) {
  mockAxios.get.mockRejectedValue({
    response: {
      status: 401,
      data: { error: 'Invalid token' },
    },
    message: 'Expo token validation failed',
  });
}

/**
 * Mock successful Expo build start
 *
 * @param mockAxios Mock axios instance
 */
export function mockExpoBuildStartSuccess(mockAxios: ReturnType<typeof createMockAxios>) {
  mockAxios.post.mockResolvedValue({
    status: 200,
    data: {
      id: 'build-123456',
      status: 'in-progress',
    },
  });
}

/**
 * Mock failed Expo build start
 *
 * @param mockAxios Mock axios instance
 */
export function mockExpoBuildStartFailure(mockAxios: ReturnType<typeof createMockAxios>) {
  mockAxios.post.mockRejectedValue({
    response: {
      status: 500,
      data: { error: 'Build service unavailable' },
    },
    message: 'Failed to start Expo build',
  });
}

// =============================================================================
// COMBINED MOCKS
// =============================================================================

/**
 * Create complete mock setup for publishing tests
 *
 * @returns Object containing all mock instances
 */
export function createPublishingMockSetup() {
  return {
    appleService: createMockAppleService(),
    expoService: createMockExpoService(),
    publishingService: createMockPublishingService(),
    publishingQueue: createMockPublishingQueue(),
    encryption: createMockEncryption(),
    prisma: createMockPrismaClient(),
    axios: createMockAxios(),
  };
}

/**
 * Reset all mocks in a publishing mock setup
 *
 * @param mocks Mock setup object
 */
export function resetPublishingMocks(mocks: ReturnType<typeof createPublishingMockSetup>) {
  Object.values(mocks).forEach((mock) => {
    if (mock && typeof mock === 'object') {
      Object.values(mock).forEach((fn) => {
        if (jest.isMockFunction(fn)) {
          (fn as jest.Mock).mockClear();
        }
      });
    }
  });
}
