/**
 * Publishing Test Helpers
 *
 * This module provides comprehensive helper functions for testing the publishing flow error scenarios.
 * It extends the base mocks from `publishing-mocks.ts` with specific error condition helpers.
 *
 * Categories:
 * - Error Response Helpers: Create structured error responses
 * - Mock State Helpers: Configure mocks for specific error scenarios
 * - Assertion Helpers: Verify error response formats
 * - Data Factories: Create test data fixtures
 * - Cleanup Helpers: Reset state between tests
 *
 * @module __tests__/helpers/publishing-test-helpers
 */

import { jest } from '@jest/globals';
import type { Response } from 'express';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
      code?: string;
    }>;
  };
  requestId: string;
}

/**
 * Apple API error response structure
 */
export interface AppleApiError {
  response: {
    status: number;
    data: {
      errors: Array<{
        status: string;
        code: string;
        title: string;
        detail: string;
      }>;
    };
  };
  message: string;
}

/**
 * Expo API error response structure
 */
export interface ExpoApiError {
  response: {
    status: number;
    data: {
      error: string;
      message?: string;
    };
  };
  message: string;
}

// =============================================================================
// ERROR RESPONSE FACTORIES
// =============================================================================

/**
 * Create a validation error response
 *
 * @param field Field that failed validation
 * @param message Validation error message
 * @returns Structured validation error
 *
 * @example
 * ```typescript
 * const error = createValidationError('appleTeamId', 'Team ID is required');
 * ```
 */
export function createValidationError(field: string, message: string) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        {
          field,
          message,
          code: 'invalid',
        },
      ],
    },
    requestId: 'test-request-id',
  };
}

/**
 * Create multiple validation errors
 *
 * @param errors Array of field/message pairs
 * @returns Structured validation error with multiple fields
 *
 * @example
 * ```typescript
 * const error = createMultipleValidationErrors([
 *   { field: 'appleTeamId', message: 'Team ID is required' },
 *   { field: 'appleKeyId', message: 'Key ID is required' }
 * ]);
 * ```
 */
export function createMultipleValidationErrors(
  errors: Array<{ field: string; message: string }>,
) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.map((err) => ({
        field: err.field,
        message: err.message,
        code: 'invalid',
      })),
    },
    requestId: 'test-request-id',
  };
}

/**
 * Create Apple API error (unauthorized)
 *
 * @param detail Specific error detail
 * @returns Apple API error structure
 */
export function createAppleAuthError(detail = 'Invalid credentials'): AppleApiError {
  return {
    response: {
      status: 401,
      data: {
        errors: [
          {
            status: '401',
            code: 'NOT_AUTHORIZED',
            title: 'Authentication Failed',
            detail,
          },
        ],
      },
    },
    message: 'Apple API authentication failed',
  };
}

/**
 * Create Apple API error (5xx server error)
 *
 * @param status HTTP status code (500, 502, 503)
 * @returns Apple API error structure
 */
export function createAppleServerError(status: 500 | 502 | 503 = 500): AppleApiError {
  const titles: Record<number, string> = {
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return {
    response: {
      status,
      data: {
        errors: [
          {
            status: status.toString(),
            code: 'SERVER_ERROR',
            title: titles[status] || 'Server Error',
            detail: 'The Apple API service is currently unavailable',
          },
        ],
      },
    },
    message: `Apple API returned ${status}`,
  };
}

/**
 * Create Apple API timeout error
 *
 * @returns Timeout error structure
 */
export function createAppleTimeoutError() {
  const error: any = new Error('timeout of 10000ms exceeded');
  error.code = 'ECONNABORTED';
  error.isAxiosError = true;
  return error;
}

/**
 * Create Expo API error (unauthorized)
 *
 * @returns Expo API error structure
 */
export function createExpoAuthError(): ExpoApiError {
  return {
    response: {
      status: 401,
      data: {
        error: 'unauthorized',
        message: 'Invalid or expired token',
      },
    },
    message: 'Expo API authentication failed',
  };
}

/**
 * Create Expo API error (5xx server error)
 *
 * @param status HTTP status code (500, 502, 503)
 * @returns Expo API error structure
 */
export function createExpoServerError(status: 500 | 502 | 503 = 500): ExpoApiError {
  return {
    response: {
      status,
      data: {
        error: 'server_error',
        message: 'Expo build service is currently unavailable',
      },
    },
    message: `Expo API returned ${status}`,
  };
}

/**
 * Create Expo API timeout error
 *
 * @returns Timeout error structure
 */
export function createExpoTimeoutError() {
  const error: any = new Error('timeout of 10000ms exceeded');
  error.code = 'ECONNABORTED';
  error.isAxiosError = true;
  return error;
}

/**
 * Create network connection error
 *
 * @returns Network error structure
 */
export function createNetworkError() {
  const error: any = new Error('connect ECONNREFUSED 127.0.0.1:443');
  error.code = 'ECONNREFUSED';
  error.isAxiosError = true;
  return error;
}

/**
 * Create rate limit error (429)
 *
 * @param retryAfter Seconds until rate limit resets
 * @returns Rate limit error structure
 */
export function createRateLimitError(retryAfter = 60) {
  return {
    response: {
      status: 429,
      headers: {
        'retry-after': retryAfter.toString(),
      },
      data: {
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
      },
    },
    message: 'Rate limit exceeded',
  };
}

// =============================================================================
// MOCK STATE HELPERS
// =============================================================================

/**
 * Configure mocks for validation error scenario
 *
 * @param mockAppleService Mock Apple service
 * @param mockExpoService Mock Expo service
 */
export function setupValidationErrorMocks(mockAppleService: any, mockExpoService: any) {
  // Both services should not be called if validation fails early
  mockAppleService.validateCredentials.mockResolvedValue(true);
  mockExpoService.validateToken.mockResolvedValue(true);
}

/**
 * Configure mocks for Apple credential failure
 *
 * @param mockAppleService Mock Apple service
 */
export function setupAppleCredentialFailure(mockAppleService: any) {
  mockAppleService.validateCredentials.mockResolvedValue(false);
}

/**
 * Configure mocks for Expo token failure
 *
 * @param mockExpoService Mock Expo service
 * @param mockAppleService Mock Apple service (succeeds)
 */
export function setupExpoTokenFailure(mockExpoService: any, mockAppleService: any) {
  mockAppleService.validateCredentials.mockResolvedValue(true);
  mockExpoService.validateToken.mockResolvedValue(false);
}

/**
 * Configure mocks for Apple API timeout
 *
 * @param mockAppleService Mock Apple service
 */
export function setupAppleApiTimeout(mockAppleService: any) {
  mockAppleService.validateCredentials.mockRejectedValue(createAppleTimeoutError());
}

/**
 * Configure mocks for Expo API timeout
 *
 * @param mockExpoService Mock Expo service
 */
export function setupExpoApiTimeout(mockExpoService: any) {
  mockExpoService.validateToken.mockRejectedValue(createExpoTimeoutError());
}

/**
 * Configure mocks for Apple server error
 *
 * @param mockAppleService Mock Apple service
 * @param status HTTP status code
 */
export function setupAppleServerError(mockAppleService: any, status: 500 | 502 | 503 = 500) {
  mockAppleService.validateCredentials.mockRejectedValue(createAppleServerError(status));
}

/**
 * Configure mocks for Expo server error
 *
 * @param mockExpoService Mock Expo service
 * @param status HTTP status code
 */
export function setupExpoServerError(mockExpoService: any, status: 500 | 502 | 503 = 500) {
  mockExpoService.validateToken.mockRejectedValue(createExpoServerError(status));
}

/**
 * Configure mocks for network error
 *
 * @param mockService Mock service (Apple or Expo)
 */
export function setupNetworkError(mockService: any) {
  mockService.validateCredentials?.mockRejectedValue(createNetworkError());
  mockService.validateToken?.mockRejectedValue(createNetworkError());
  mockService.startBuild?.mockRejectedValue(createNetworkError());
}

/**
 * Configure mocks for Redis unavailability
 *
 * @param mockPublishingQueue Mock publishing queue
 */
export function setupRedisUnavailable(mockPublishingQueue: any) {
  mockPublishingQueue.add.mockRejectedValue(new Error('Connection to Redis failed'));
}

/**
 * Configure mocks for database connection error
 *
 * @param mockPrisma Mock Prisma client
 */
export function setupDatabaseError(mockPrisma: any) {
  const dbError = new Error('Connection to database failed');
  (dbError as any).code = 'P1001'; // Prisma connection error code

  mockPrisma.workflow.findFirst.mockRejectedValue(dbError);
  mockPrisma.publishing.create.mockRejectedValue(dbError);
}

/**
 * Configure mocks for encryption error
 *
 * @param mockEncryption Mock encryption utilities
 */
export function setupEncryptionError(mockEncryption: any) {
  mockEncryption.encrypt.mockImplementation(() => {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  });
}

// =============================================================================
// DATA FACTORIES
// =============================================================================

/**
 * Create valid publishing request body
 *
 * @param overrides Optional field overrides
 * @returns Valid publishing request body
 */
export function createValidPublishingRequest(overrides: Record<string, any> = {}) {
  return {
    projectId: 'project-123',
    appleTeamId: 'ABCD123456',
    appleKeyId: 'KEY1234567',
    appleIssuerId: '12345678-1234-1234-1234-123456789012',
    applePrivateKey: '-----BEGIN PRIVATE KEY-----\nMockPrivateKey\n-----END PRIVATE KEY-----',
    expoToken: 'expo-token-123',
    appName: 'Test App',
    description: 'This is a test app description that is long enough.',
    category: 'Productivity',
    ageRating: '4+' as const,
    supportUrl: 'https://example.com/support',
    iconUrl: 'https://example.com/icon.png',
    ...overrides,
  };
}

/**
 * Create mock workflow (project) object
 *
 * @param overrides Optional field overrides
 * @returns Mock workflow object
 */
export function createMockWorkflow(overrides: Record<string, any> = {}) {
  return {
    id: 'project-123',
    userId: 'user-123',
    projectName: 'Test Project',
    platform: 'ios',
    selectedModel: 'claude-3-5-sonnet-20241022',
    status: 'ACTIVE',
    version: 1,
    configuration: {},
    isPublic: false,
    tags: [],
    scheduleEnabled: false,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Create mock publishing record
 *
 * @param overrides Optional field overrides
 * @returns Mock publishing object
 */
export function createMockPublishing(overrides: Record<string, any> = {}) {
  return {
    id: 'publishing-123',
    workflowId: 'project-123',
    status: 'INITIATED',
    appleTeamId: 'ABCD123456',
    appleKeyId: 'KEY1234567',
    appleIssuerId: '12345678-1234-1234-1234-123456789012',
    applePrivateKey: JSON.stringify({
      iv: 'mock-iv',
      content: 'encrypted-key',
      tag: 'mock-tag',
    }),
    expoToken: JSON.stringify({
      iv: 'mock-iv',
      content: 'encrypted-token',
      tag: 'mock-tag',
    }),
    appName: 'Test App',
    bundleId: 'com.turbocat.testapp',
    version: '1.0.0',
    description: 'Test app description',
    category: 'Productivity',
    ageRating: '4+',
    supportUrl: 'https://example.com/support',
    iconUrl: 'https://example.com/icon.png',
    expoBuildId: null,
    statusMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workflow: createMockWorkflow(),
    ...overrides,
  };
}

/**
 * Create mock authenticated user
 *
 * @param overrides Optional field overrides
 * @returns Mock user object for req.user
 */
export function createMockAuthUser(overrides: Record<string, any> = {}) {
  return {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  };
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Assert that response is a validation error
 *
 * @param response HTTP response object
 * @param expectedField Optional field name to check
 */
export function assertValidationError(response: any, expectedField?: string) {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.message).toBeDefined();

  if (expectedField) {
    const details = response.body.error.details || [];
    const hasField = details.some((d: any) => d.field === expectedField);
    expect(hasField).toBe(true);
  }
}

/**
 * Assert that response is unauthorized error
 *
 * @param response HTTP response object
 */
export function assertUnauthorizedError(response: any) {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
}

/**
 * Assert that response is forbidden error
 *
 * @param response HTTP response object
 */
export function assertForbiddenError(response: any) {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('FORBIDDEN');
}

/**
 * Assert that response is not found error
 *
 * @param response HTTP response object
 */
export function assertNotFoundError(response: any) {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('NOT_FOUND');
}

/**
 * Assert that response is conflict error
 *
 * @param response HTTP response object
 */
export function assertConflictError(response: any) {
  expect(response.status).toBe(409);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('CONFLICT');
}

/**
 * Assert that response is server error
 *
 * @param response HTTP response object
 */
export function assertServerError(response: any) {
  expect(response.status).toBeGreaterThanOrEqual(500);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBeDefined();
}

/**
 * Assert that response is service unavailable error
 *
 * @param response HTTP response object
 */
export function assertServiceUnavailableError(response: any) {
  expect(response.status).toBe(503);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
}

/**
 * Assert that response is external service error
 *
 * @param response HTTP response object
 */
export function assertExternalServiceError(response: any) {
  expect(response.status).toBeGreaterThanOrEqual(500);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toContain('SERVICE');
}

/**
 * Assert that error response does not contain sensitive data
 *
 * @param response HTTP response object
 */
export function assertNoSensitiveData(response: any) {
  const responseStr = JSON.stringify(response.body);

  // Should not contain private keys
  expect(responseStr).not.toMatch(/BEGIN PRIVATE KEY/);
  expect(responseStr).not.toMatch(/privateKey/);

  // Should not contain tokens
  expect(responseStr).not.toMatch(/expo-token/i);
  expect(responseStr).not.toMatch(/accessToken/);
  expect(responseStr).not.toMatch(/refreshToken/);

  // Should not contain passwords
  expect(responseStr).not.toMatch(/password/i);
  expect(responseStr).not.toMatch(/passwordHash/);
}

// =============================================================================
// CLEANUP HELPERS
// =============================================================================

/**
 * Reset all mocks to default state
 *
 * @param mocks Object containing all mock instances
 */
export function resetAllMocks(mocks: Record<string, any>) {
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

/**
 * Setup default successful mock responses
 *
 * @param mockAppleService Mock Apple service
 * @param mockExpoService Mock Expo service
 * @param mockPrisma Mock Prisma client
 * @param mockPublishingQueue Mock publishing queue
 */
export function setupSuccessfulMocks(
  mockAppleService: any,
  mockExpoService: any,
  mockPrisma: any,
  mockPublishingQueue: any,
) {
  // Apple service succeeds
  mockAppleService.validateCredentials.mockResolvedValue(true);
  mockAppleService.generateJWT.mockReturnValue('mock-jwt');

  // Expo service succeeds
  mockExpoService.validateToken.mockResolvedValue(true);
  mockExpoService.startBuild.mockResolvedValue('build-123');
  mockExpoService.getBuildStatus.mockResolvedValue({
    status: 'finished',
    artifactUrl: 'https://expo.dev/build.ipa',
  });

  // Database operations succeed
  mockPrisma.workflow.findFirst.mockResolvedValue(createMockWorkflow());
  mockPrisma.publishing.create.mockResolvedValue(createMockPublishing());
  mockPrisma.publishing.update.mockResolvedValue(createMockPublishing({ status: 'BUILDING' }));
  mockPrisma.publishing.findUnique.mockResolvedValue(createMockPublishing());

  // Queue operations succeed
  mockPublishingQueue.add.mockResolvedValue({ id: 'job-123' });
}
