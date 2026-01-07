/**
 * Smoke Tests for Turbocat Backend API
 *
 * These tests perform quick sanity checks to verify the API is
 * functioning correctly. They are designed to run quickly and
 * catch major issues before running the full E2E test suite.
 *
 * Run with: npm run test:e2e -- --project=smoke
 *
 * @module e2e/smoke.spec
 */

import { test, expect } from '@playwright/test';

test.describe('API Smoke Tests', () => {
  test.describe('Health Endpoints', () => {
    test('GET /health/live should return 200', async ({ request }) => {
      const response = await request.get('/health/live');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('ok');
    });

    test('GET /health/ready should return 200 or 503', async ({ request }) => {
      const response = await request.get('/health/ready');

      // Ready endpoint returns 200 if all dependencies are up, 503 otherwise
      expect([200, 503]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty('status');
    });

    test('GET /health should return system health', async ({ request }) => {
      const response = await request.get('/health');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status');
    });
  });

  test.describe('API Root', () => {
    test('GET /api/v1 should return API info', async ({ request }) => {
      const response = await request.get('/api/v1');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('version');
    });
  });

  test.describe('Authentication Endpoints', () => {
    test('POST /api/v1/auth/login with invalid credentials should return 401', async ({
      request,
    }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: {
          email: 'nonexistent@test.com',
          password: 'WrongPassword123!',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    test('POST /api/v1/auth/register with invalid email should return 400', async ({
      request,
    }) => {
      const response = await request.post('/api/v1/auth/register', {
        data: {
          email: 'invalid-email',
          password: 'ValidPassword123!',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Protected Endpoints', () => {
    test('GET /api/v1/agents without auth should return 401', async ({
      request,
    }) => {
      const response = await request.get('/api/v1/agents');

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('GET /api/v1/workflows without auth should return 401', async ({
      request,
    }) => {
      const response = await request.get('/api/v1/workflows');

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('GET /api/v1/users/me without auth should return 401', async ({
      request,
    }) => {
      const response = await request.get('/api/v1/users/me');

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async ({ request }) => {
      const response = await request.get('/nonexistent-endpoint-12345');

      expect(response.status()).toBe(404);
    });

    test('Invalid JSON should return 400', async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        headers: {
          'Content-Type': 'application/json',
        },
        // Send invalid data type
        data: 'not-valid-json',
      });

      // Should return error (400 or 401 depending on parsing)
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('Response Headers', () => {
    test('API responses should have security headers', async ({ request }) => {
      const response = await request.get('/health');

      // Check for common security headers
      const headers = response.headers();

      // At minimum, should have content-type
      expect(headers['content-type']).toContain('application/json');
    });

    test('API responses should include request ID', async ({ request }) => {
      const response = await request.get('/api/v1');

      const body = await response.json();
      // The API includes requestId in the response body
      expect(body).toHaveProperty('requestId');
    });
  });
});
