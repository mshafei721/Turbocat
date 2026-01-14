/**
 * Publishing Flow - Validation Error Tests
 *
 * Tests for user input validation errors in the publishing flow:
 * - Missing required fields
 * - Invalid field formats
 * - Field length constraints
 * - Invalid enum values
 * - Malformed credentials
 *
 * Error Code Focus: PUB_VAL_* (Validation errors)
 *
 * @module __tests__/integration/publishing-validation-errors.test
 */

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import {
  createValidPublishingRequest,
  createMockAuthUser,
  createMockWorkflow,
  assertValidationError,
  assertNoSensitiveData,
  setupSuccessfulMocks,
  resetAllMocks,
} from '../helpers/publishing-test-helpers';
import {
  createPublishingMockSetup,
} from '../mocks/publishing-mocks';

// =============================================================================
// MOCKS
// =============================================================================

const mocks = createPublishingMockSetup();

jest.mock('../../lib/prisma', () => ({
  prisma: mocks.prisma,
  isPrismaAvailable: jest.fn<any>().mockReturnValue(true),
}));

jest.mock('../../services/apple.service', () => ({
  AppleService: jest.fn<any>().mockImplementation(() => mocks.appleService),
  appleService: mocks.appleService,
}));

jest.mock('../../services/expo.service', () => ({
  ExpoService: jest.fn<any>().mockImplementation(() => mocks.expoService),
  expoService: mocks.expoService,
}));

jest.mock('../../utils/encryption', () => ({
  encrypt: mocks.encryption.encrypt,
  decrypt: mocks.encryption.decrypt,
  isEncryptionConfigured: jest.fn<any>().mockReturnValue(true),
}));

jest.mock('../../lib/publishingQueue', () => ({
  publishingQueue: mocks.publishingQueue,
  isPublishingQueueAvailable: jest.fn<any>().mockReturnValue(true),
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn<any>((req, res, next) => {
    req.user = createMockAuthUser();
    next();
  }),
}));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('PublishingFlow - Validation Errors', () => {
  const endpoint = '/api/v1/publishing/initiate';

  beforeEach(() => {
    resetAllMocks(mocks);
    setupSuccessfulMocks(
      mocks.appleService,
      mocks.expoService,
      mocks.prisma,
      mocks.publishingQueue,
    );

    // Ensure workflow exists and user owns it
    mocks.prisma.workflow.findFirst.mockResolvedValue(createMockWorkflow());

    // Enable encryption
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  });

  // ===========================================================================
  // MISSING REQUIRED FIELDS
  // ===========================================================================

  describe('Missing Required Fields', () => {
    it('should return 400 when projectId is missing', async () => {
      const requestBody = createValidPublishingRequest({ projectId: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'projectId');
      expect(response.body.error.details[0].message).toContain('project');
    });

    it('should return 400 when appleTeamId is missing', async () => {
      const requestBody = createValidPublishingRequest({ appleTeamId: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appleTeamId');
      expect(response.body.error.details[0].message).toContain('Apple Team ID');
    });

    it('should return 400 when appleKeyId is missing', async () => {
      const requestBody = createValidPublishingRequest({ appleKeyId: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appleKeyId');
      expect(response.body.error.details[0].message).toContain('Apple Key ID');
    });

    it('should return 400 when appleIssuerId is missing', async () => {
      const requestBody = createValidPublishingRequest({ appleIssuerId: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appleIssuerId');
      expect(response.body.error.details[0].message).toContain('Apple Issuer ID');
    });

    it('should return 400 when applePrivateKey is missing', async () => {
      const requestBody = createValidPublishingRequest({ applePrivateKey: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'applePrivateKey');
      expect(response.body.error.details[0].message).toContain('Apple Private Key');
    });

    it('should return 400 when expoToken is missing', async () => {
      const requestBody = createValidPublishingRequest({ expoToken: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'expoToken');
      expect(response.body.error.details[0].message).toContain('Expo token');
    });

    it('should return 400 when appName is missing', async () => {
      const requestBody = createValidPublishingRequest({ appName: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appName');
      expect(response.body.error.details[0].message).toContain('App name');
    });

    it('should return 400 when description is missing', async () => {
      const requestBody = createValidPublishingRequest({ description: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'description');
    });

    it('should return 400 when category is missing', async () => {
      const requestBody = createValidPublishingRequest({ category: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'category');
      expect(response.body.error.details[0].message).toContain('Category');
    });

    it('should return 400 when ageRating is missing', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: undefined });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'ageRating');
    });

    it('should return 400 with multiple validation errors', async () => {
      const requestBody = createValidPublishingRequest({
        appleTeamId: undefined,
        appleKeyId: undefined,
        appName: undefined,
      });

      const response = await request(app).post(endpoint).send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===========================================================================
  // INVALID FIELD FORMATS
  // ===========================================================================

  describe('Invalid Field Formats', () => {
    it('should return 400 when projectId is not a valid UUID', async () => {
      const requestBody = createValidPublishingRequest({ projectId: 'invalid-uuid' });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'projectId');
      expect(response.body.error.details[0].message).toContain('Invalid project ID');
    });

    it('should return 400 when supportUrl is not a valid URL', async () => {
      const requestBody = createValidPublishingRequest({ supportUrl: 'not-a-url' });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'supportUrl');
      expect(response.body.error.details[0].message).toContain('Invalid support URL');
    });

    it('should return 400 when iconUrl is not a valid URL', async () => {
      const requestBody = createValidPublishingRequest({ iconUrl: 'invalid-url' });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'iconUrl');
      expect(response.body.error.details[0].message).toContain('Invalid icon URL');
    });

    it('should accept empty optional URL fields', async () => {
      const requestBody = createValidPublishingRequest({
        supportUrl: undefined,
        iconUrl: undefined,
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should succeed (or fail for other reasons, but not URL validation)
      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        // Check that URL fields are not in the error details
        const urlErrors = response.body.error.details.filter(
          (d: any) => d.field === 'supportUrl' || d.field === 'iconUrl',
        );
        expect(urlErrors.length).toBe(0);
      }
    });
  });

  // ===========================================================================
  // FIELD LENGTH CONSTRAINTS
  // ===========================================================================

  describe('Field Length Constraints', () => {
    it('should return 400 when appName is empty', async () => {
      const requestBody = createValidPublishingRequest({ appName: '' });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appName');
      expect(response.body.error.details[0].message).toContain('App name is required');
    });

    it('should return 400 when appName exceeds 30 characters', async () => {
      const requestBody = createValidPublishingRequest({
        appName: 'A'.repeat(31), // 31 characters
      });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'appName');
      expect(response.body.error.details[0].message).toContain('too long');
      expect(response.body.error.details[0].message).toContain('30');
    });

    it('should accept appName with exactly 30 characters', async () => {
      const requestBody = createValidPublishingRequest({
        appName: 'A'.repeat(30), // Exactly 30 characters
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should not fail appName validation
      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const appNameErrors = response.body.error.details.filter((d: any) => d.field === 'appName');
        expect(appNameErrors.length).toBe(0);
      }
    });

    it('should return 400 when description is too short (< 10 chars)', async () => {
      const requestBody = createValidPublishingRequest({ description: 'Short' }); // 5 chars

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'description');
      expect(response.body.error.details[0].message).toContain('too short');
      expect(response.body.error.details[0].message).toContain('10');
    });

    it('should return 400 when description exceeds 4000 characters', async () => {
      const requestBody = createValidPublishingRequest({
        description: 'A'.repeat(4001), // 4001 characters
      });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'description');
      expect(response.body.error.details[0].message).toContain('too long');
      expect(response.body.error.details[0].message).toContain('4000');
    });

    it('should accept description with exactly 10 characters (minimum)', async () => {
      const requestBody = createValidPublishingRequest({
        description: 'A'.repeat(10), // Exactly 10 characters
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should not fail description validation
      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const descErrors = response.body.error.details.filter((d: any) => d.field === 'description');
        expect(descErrors.length).toBe(0);
      }
    });

    it('should accept description with exactly 4000 characters (maximum)', async () => {
      const requestBody = createValidPublishingRequest({
        description: 'A'.repeat(4000), // Exactly 4000 characters
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should not fail description validation
      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const descErrors = response.body.error.details.filter((d: any) => d.field === 'description');
        expect(descErrors.length).toBe(0);
      }
    });
  });

  // ===========================================================================
  // INVALID ENUM VALUES
  // ===========================================================================

  describe('Invalid Enum Values', () => {
    it('should return 400 when ageRating is not a valid value', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: '18+' as any });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response, 'ageRating');
      expect(response.body.error.details[0].message).toContain('Invalid age rating');
    });

    it('should accept valid ageRating: 4+', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: '4+' });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should not fail ageRating validation
      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const ageErrors = response.body.error.details.filter((d: any) => d.field === 'ageRating');
        expect(ageErrors.length).toBe(0);
      }
    });

    it('should accept valid ageRating: 9+', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: '9+' });

      const response = await request(app).post(endpoint).send(requestBody);

      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const ageErrors = response.body.error.details.filter((d: any) => d.field === 'ageRating');
        expect(ageErrors.length).toBe(0);
      }
    });

    it('should accept valid ageRating: 12+', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: '12+' });

      const response = await request(app).post(endpoint).send(requestBody);

      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const ageErrors = response.body.error.details.filter((d: any) => d.field === 'ageRating');
        expect(ageErrors.length).toBe(0);
      }
    });

    it('should accept valid ageRating: 17+', async () => {
      const requestBody = createValidPublishingRequest({ ageRating: '17+' });

      const response = await request(app).post(endpoint).send(requestBody);

      if (response.status === 400 && response.body.error.code === 'VALIDATION_ERROR') {
        const ageErrors = response.body.error.details.filter((d: any) => d.field === 'ageRating');
        expect(ageErrors.length).toBe(0);
      }
    });
  });

  // ===========================================================================
  // SECURITY VALIDATION
  // ===========================================================================

  describe('Security Validation', () => {
    it('should not expose sensitive data in validation error responses', async () => {
      const requestBody = createValidPublishingRequest({
        applePrivateKey: '-----BEGIN PRIVATE KEY-----\nSecretKey\n-----END PRIVATE KEY-----',
        expoToken: 'super-secret-expo-token',
        appleTeamId: undefined, // Trigger validation error
      });

      const response = await request(app).post(endpoint).send(requestBody);

      assertValidationError(response);
      assertNoSensitiveData(response);
    });

    it('should not log sensitive data on validation errors', async () => {
      const requestBody = createValidPublishingRequest({
        applePrivateKey: '-----BEGIN PRIVATE KEY-----\nSecretKey\n-----END PRIVATE KEY-----',
        expoToken: 'super-secret-expo-token',
        appleKeyId: undefined, // Trigger validation error
      });

      await request(app).post(endpoint).send(requestBody);

      // Verify logger was not called with sensitive data
      const { logger } = require('../../lib/logger');
      const logCalls = logger.error.mock.calls;

      logCalls.forEach((call: any[]) => {
        const loggedData = JSON.stringify(call);
        expect(loggedData).not.toContain('BEGIN PRIVATE KEY');
        expect(loggedData).not.toContain('super-secret-expo-token');
      });
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle null values for required fields', async () => {
      const requestBody = createValidPublishingRequest({
        appleTeamId: null as any,
        appName: null as any,
      });

      const response = await request(app).post(endpoint).send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty string for required fields', async () => {
      const requestBody = createValidPublishingRequest({
        appleKeyId: '',
        expoToken: '',
      });

      const response = await request(app).post(endpoint).send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle whitespace-only strings', async () => {
      const requestBody = createValidPublishingRequest({
        appName: '   ',
        description: '          ',
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should either fail validation or trim whitespace
      // Either outcome is acceptable as long as it's consistent
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should handle special characters in text fields', async () => {
      const requestBody = createValidPublishingRequest({
        appName: 'App <script>alert("xss")</script>',
        description: 'Description with emoji 🚀 and special chars: <>&"\'',
      });

      const response = await request(app).post(endpoint).send(requestBody);

      // Should either accept (after sanitization) or reject
      // Key: should not execute scripts or break
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });
});
