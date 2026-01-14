/**
 * Publishing Test Helpers
 *
 * This module provides utilities for testing the publishing flow including:
 * - Mock API responses (Apple App Store Connect, Expo)
 * - Factory functions for test data (credentials, publish data)
 * - Database setup and teardown utilities
 *
 * Usage:
 * ```typescript
 * import {
 *   createMockPublishData,
 *   mockAppleValidation,
 *   mockExpoValidation
 * } from './helpers/publishing-helpers';
 *
 * const publishData = createMockPublishData();
 * mockAppleValidation(true); // Mock successful validation
 * mockExpoValidation(true);
 * ```
 *
 * @module __tests__/integration/helpers/publishing-helpers
 */

import { PublishData } from '../../../services/publishing.service';
import { PublishingStatus } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Mock Apple API response
 */
export interface MockAppleResponse {
  status: number;
  data?: {
    data: Array<{
      id: string;
      type: string;
      attributes: Record<string, unknown>;
    }>;
  };
  errors?: Array<{
    status: string;
    code: string;
    title: string;
    detail: string;
  }>;
}

/**
 * Mock Expo API response
 */
export interface MockExpoResponse {
  status: number;
  data?: {
    id: string;
    status: 'in-progress' | 'finished' | 'errored';
    artifacts?: {
      buildUrl?: string;
    };
    error?: string;
  };
}

/**
 * Test publishing record structure
 */
export interface TestPublishing {
  id: string;
  workflowId: string;
  status: PublishingStatus;
  appleTeamId: string;
  appleKeyId: string;
  appleIssuerId: string;
  applePrivateKey: string;
  expoToken: string;
  appName: string;
  bundleId: string;
  version: string;
  description: string;
  category: string;
  ageRating: string;
  supportUrl?: string;
  iconUrl?: string;
  expoBuildId?: string;
  statusMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create mock publish data for testing
 *
 * @param overrides Optional overrides for default values
 * @returns Mock PublishData object
 *
 * @example
 * ```typescript
 * const publishData = createMockPublishData({
 *   appName: 'Custom App Name'
 * });
 * ```
 */
export function createMockPublishData(overrides: Partial<PublishData> = {}): PublishData {
  return {
    appleTeamId: 'TEAM123456',
    appleKeyId: 'KEY1234567',
    appleIssuerId: '12345678-1234-1234-1234-123456789012',
    applePrivateKey: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgTest1234567890Test
1234567890Test1234567890Test1234567890Test=
-----END PRIVATE KEY-----`,
    expoToken: 'expo_test_token_1234567890abcdef',
    appName: 'Test Mobile App',
    description: 'A comprehensive test application for validating the publishing flow.',
    category: 'Productivity',
    ageRating: '4+',
    supportUrl: 'https://example.com/support',
    iconUrl: 'https://example.com/icon.png',
    ...overrides,
  };
}

/**
 * Create mock Apple credentials
 *
 * @returns Mock Apple credentials object
 */
export function createMockAppleCredentials() {
  return {
    teamId: 'TEAM123456',
    keyId: 'KEY1234567',
    issuerId: '12345678-1234-1234-1234-123456789012',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgTest1234567890Test
1234567890Test1234567890Test1234567890Test=
-----END PRIVATE KEY-----`,
  };
}

/**
 * Create mock Expo token
 *
 * @returns Mock Expo token string
 */
export function createMockExpoToken(): string {
  return 'expo_test_token_1234567890abcdef';
}

/**
 * Create mock publishing record for testing
 *
 * @param overrides Optional overrides for default values
 * @returns Mock publishing record
 */
export function createMockPublishing(
  overrides: Partial<TestPublishing> = {},
): TestPublishing {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    workflowId: '550e8400-e29b-41d4-a716-446655440001',
    status: 'INITIATED' as PublishingStatus,
    appleTeamId: 'TEAM123456',
    appleKeyId: 'KEY1234567',
    appleIssuerId: '12345678-1234-1234-1234-123456789012',
    applePrivateKey: JSON.stringify({
      iv: 'mock-iv-base64==',
      content: 'mock-encrypted-private-key==',
      tag: 'mock-tag-base64==',
    }),
    expoToken: JSON.stringify({
      iv: 'mock-iv-base64==',
      content: 'mock-encrypted-token==',
      tag: 'mock-tag-base64==',
    }),
    appName: 'Test Mobile App',
    bundleId: 'com.turbocat.testmobileapp',
    version: '1.0.0',
    description: 'A test application',
    category: 'Productivity',
    ageRating: '4+',
    supportUrl: 'https://example.com/support',
    iconUrl: 'https://example.com/icon.png',
    createdAt: new Date('2026-01-13T00:00:00.000Z'),
    updatedAt: new Date('2026-01-13T00:00:00.000Z'),
    ...overrides,
  };
}

// =============================================================================
// MOCK API RESPONSES
// =============================================================================

/**
 * Create mock successful Apple API response
 *
 * @returns Mock Apple API response for successful validation
 */
export function createMockAppleSuccessResponse(): MockAppleResponse {
  return {
    status: 200,
    data: {
      data: [
        {
          id: 'app-123',
          type: 'apps',
          attributes: {
            name: 'Test App',
            bundleId: 'com.example.testapp',
          },
        },
      ],
    },
  };
}

/**
 * Create mock failed Apple API response
 *
 * @param errorMessage Optional custom error message
 * @returns Mock Apple API response for failed validation
 */
export function createMockAppleErrorResponse(
  errorMessage = 'Invalid credentials',
): MockAppleResponse {
  return {
    status: 401,
    errors: [
      {
        status: '401',
        code: 'INVALID_CREDENTIALS',
        title: 'Authentication Failed',
        detail: errorMessage,
      },
    ],
  };
}

/**
 * Create mock successful Expo API response for token validation
 *
 * @returns Mock Expo API response for successful token validation
 */
export function createMockExpoTokenValidationResponse(): MockExpoResponse {
  return {
    status: 200,
    data: {
      id: 'user-123',
      status: 'finished',
    },
  };
}

/**
 * Create mock successful Expo build start response
 *
 * @returns Mock Expo API response for build initiation
 */
export function createMockExpoBuildStartResponse(): MockExpoResponse {
  return {
    status: 200,
    data: {
      id: 'build-123456',
      status: 'in-progress',
    },
  };
}

/**
 * Create mock successful Expo build status response
 *
 * @param status Build status
 * @returns Mock Expo API response for build status
 */
export function createMockExpoBuildStatusResponse(
  status: 'in-progress' | 'finished' | 'errored' = 'finished',
): MockExpoResponse {
  return {
    status: 200,
    data: {
      id: 'build-123456',
      status,
      artifacts: status === 'finished' ? { buildUrl: 'https://expo.dev/artifacts/build.ipa' } : undefined,
      error: status === 'errored' ? 'Build compilation failed' : undefined,
    },
  };
}

// =============================================================================
// TEST DATA GENERATORS
// =============================================================================

/**
 * Generate random UUID for testing
 *
 * @returns Random UUID string
 */
export function generateTestId(): string {
  return `test-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

/**
 * Generate test user ID
 *
 * @returns Test user ID
 */
export function generateTestUserId(): string {
  return '550e8400-e29b-41d4-a716-446655440000';
}

/**
 * Generate test project ID
 *
 * @returns Test project ID
 */
export function generateTestProjectId(): string {
  return '550e8400-e29b-41d4-a716-446655440001';
}

/**
 * Generate test publishing ID
 *
 * @returns Test publishing ID
 */
export function generateTestPublishingId(): string {
  return '550e8400-e29b-41d4-a716-446655440002';
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate publishing request body structure
 *
 * @param body Request body to validate
 * @returns True if valid, false otherwise
 */
export function isValidPublishingRequest(body: unknown): body is PublishData {
  if (typeof body !== 'object' || body === null) return false;

  const data = body as Record<string, unknown>;

  return (
    typeof data.appleTeamId === 'string' &&
    typeof data.appleKeyId === 'string' &&
    typeof data.appleIssuerId === 'string' &&
    typeof data.applePrivateKey === 'string' &&
    typeof data.expoToken === 'string' &&
    typeof data.appName === 'string' &&
    typeof data.description === 'string' &&
    typeof data.category === 'string' &&
    typeof data.ageRating === 'string'
  );
}

/**
 * Validate publishing response structure
 *
 * @param response Response to validate
 * @returns True if valid, false otherwise
 */
export function isValidPublishingResponse(response: unknown): response is { publishing: TestPublishing } {
  if (typeof response !== 'object' || response === null) return false;

  const data = response as Record<string, unknown>;
  if (typeof data.publishing !== 'object' || data.publishing === null) return false;

  const publishing = data.publishing as Record<string, unknown>;

  return (
    typeof publishing.id === 'string' &&
    typeof publishing.workflowId === 'string' &&
    typeof publishing.status === 'string' &&
    typeof publishing.appName === 'string' &&
    typeof publishing.bundleId === 'string'
  );
}

// =============================================================================
// CLEANUP HELPERS
// =============================================================================

/**
 * Clean up test publishing records from database
 *
 * @param prisma Prisma client instance
 * @param publishingIds Array of publishing IDs to delete
 */
export async function cleanupTestPublishing(
  prisma: any,
  publishingIds: string[],
): Promise<void> {
  if (publishingIds.length === 0) return;

  await prisma.publishing.deleteMany({
    where: {
      id: {
        in: publishingIds,
      },
    },
  });
}

/**
 * Clean up all test publishing records by workflow ID
 *
 * @param prisma Prisma client instance
 * @param workflowId Workflow ID
 */
export async function cleanupPublishingByWorkflow(
  prisma: any,
  workflowId: string,
): Promise<void> {
  await prisma.publishing.deleteMany({
    where: {
      workflowId,
    },
  });
}
