/**
 * E2E Tests for Authentication Flow
 *
 * Tests the complete user authentication journey including:
 * - User registration
 * - User login
 * - Token refresh
 * - Protected endpoint access (dashboard/health check)
 * - Logout
 *
 * Run with: npm run test:e2e -- --project=api e2e/auth.spec.ts
 *
 * @module e2e/auth.spec
 */

import { test, expect } from '@playwright/test';
import {
  createApiClient,
  createAuthHelper,
  assertOk,
  assertCreated,
  assertUnauthorized,
  assertHasData,
  assertDataHasFields,
  assertUuid,
  assertEmail,
  assertIsoDate,
  generateTestCredentials,
  DEFAULT_TEST_PASSWORD,
} from './helpers';

test.describe('Authentication Flow E2E Tests', () => {
  test.describe('User Registration Flow', () => {
    test('should register a new user successfully', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Generate unique test credentials
      const credentials = generateTestCredentials();

      // Register new user
      const response = await auth.register(credentials);

      // Verify registration succeeded
      assertCreated(response, 'User registration should return 201');
      assertHasData(response, 'Registration should return user data');

      // Verify user data structure
      const data = response.body.data;
      expect(data).toBeDefined();
      expect(data?.user).toBeDefined();
      expect(data?.tokens).toBeDefined();

      // Verify user fields
      const user = data?.user;
      if (user) {
        assertUuid(user.id as unknown, 'user.id');
        assertEmail(user.email as unknown, 'user.email');
        expect(user.email).toBe(credentials.email);
        expect(user.role).toBe('USER');
      }

      // Verify tokens
      const tokens = data?.tokens;
      if (tokens) {
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        expect(typeof tokens.accessToken).toBe('string');
        expect(typeof tokens.refreshToken).toBe('string');
        expect(tokens.accessToken.length).toBeGreaterThan(10);
      }
    });

    test('should reject registration with invalid email', async ({ request }) => {
      const api = createApiClient(request);

      const response = await api.post('/auth/register', {
        email: 'invalid-email-format',
        password: DEFAULT_TEST_PASSWORD,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should reject registration with weak password', async ({ request }) => {
      const api = createApiClient(request);
      const credentials = generateTestCredentials({ password: '123' });

      const response = await api.post('/auth/register', {
        email: credentials.email,
        password: '123', // Too weak
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject duplicate email registration', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // First registration
      const credentials = generateTestCredentials();
      const firstResponse = await auth.register(credentials);
      assertCreated(firstResponse);

      // Clear auth state for second attempt
      auth.clearAuth();

      // Try to register with same email
      const duplicateResponse = await api.post('/auth/register', {
        email: credentials.email,
        password: DEFAULT_TEST_PASSWORD,
      });

      // Should fail with conflict
      expect([400, 409]).toContain(duplicateResponse.status);
      expect(duplicateResponse.body.success).toBe(false);
    });
  });

  test.describe('User Login Flow', () => {
    test('should login with valid credentials', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // First register a user
      const credentials = generateTestCredentials();
      await auth.register(credentials);
      auth.clearAuth();

      // Now login
      const loginResponse = await auth.login(credentials.email, credentials.password);

      // Verify login succeeded
      assertOk(loginResponse, 'Login should return 200');
      assertHasData(loginResponse);

      // Verify user and tokens returned
      const data = loginResponse.body.data;
      expect(data?.user).toBeDefined();
      expect(data?.tokens).toBeDefined();
      expect(data?.user?.email).toBe(credentials.email);
      expect(data?.tokens?.accessToken).toBeDefined();
      expect(data?.tokens?.refreshToken).toBeDefined();
    });

    test('should reject login with wrong password', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // First register a user
      const credentials = generateTestCredentials();
      await auth.register(credentials);
      auth.clearAuth();

      // Try login with wrong password
      const loginResponse = await auth.login(credentials.email, 'WrongPassword999!');

      assertUnauthorized(loginResponse, 'Wrong password should return 401');
    });

    test('should reject login with non-existent email', async ({ request }) => {
      const api = createApiClient(request);

      const response = await api.post('/auth/login', {
        email: 'nonexistent-user-12345@test.turbocat.dev',
        password: DEFAULT_TEST_PASSWORD,
      });

      assertUnauthorized(response, 'Non-existent user should return 401');
    });
  });

  test.describe('Protected Endpoint Access', () => {
    test('should access protected endpoint with valid token', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Register and login
      const { user, tokens } = await auth.createAndLoginTestUser();

      // Access protected endpoint (GET /users/me)
      const response = await api.get('/users/me');

      assertOk(response, 'Protected endpoint should return 200 with valid token');
      assertHasData(response);

      // Verify returned user matches logged in user
      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
    });

    test('should deny access without token', async ({ request }) => {
      const api = createApiClient(request);

      // Try to access protected endpoint without token
      const response = await api.get('/users/me');

      assertUnauthorized(response, 'No token should return 401');
    });

    test('should deny access with invalid token', async ({ request }) => {
      const api = createApiClient(request);

      // Set invalid token
      api.setAuthToken('invalid-token-12345');

      // Try to access protected endpoint
      const response = await api.get('/users/me');

      assertUnauthorized(response, 'Invalid token should return 401');
    });

    test('should access agents endpoint after authentication', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Register and login
      await auth.createAndLoginTestUser();

      // Access agents list (protected endpoint)
      const response = await api.get('/agents');

      assertOk(response, 'Agents endpoint should return 200 with valid token');
      assertHasData(response);
    });

    test('should access workflows endpoint after authentication', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Register and login
      await auth.createAndLoginTestUser();

      // Access workflows list (protected endpoint)
      const response = await api.get('/workflows');

      assertOk(response, 'Workflows endpoint should return 200 with valid token');
      assertHasData(response);
    });
  });

  test.describe('Token Refresh Flow', () => {
    test('should refresh access token', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Register and login
      await auth.createAndLoginTestUser();

      // Get original token
      const originalToken = auth.getAccessToken();

      // Refresh token
      const refreshResponse = await auth.refreshToken();

      assertOk(refreshResponse, 'Token refresh should return 200');

      // Verify new token is returned
      const data = refreshResponse.body.data;
      expect(data?.accessToken).toBeDefined();
      expect(data?.accessToken).not.toBe(originalToken);
    });

    test('should reject refresh with invalid refresh token', async ({ request }) => {
      const api = createApiClient(request);

      const response = await api.post('/auth/refresh', {
        refreshToken: 'invalid-refresh-token-12345',
      });

      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  test.describe('Complete Auth Journey', () => {
    test('should complete full auth flow: register -> login -> access dashboard -> logout', async ({
      request,
    }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Step 1: Register new user
      const credentials = generateTestCredentials();
      const registerResponse = await auth.register(credentials);
      assertCreated(registerResponse, 'Registration should succeed');

      // Clear auth to simulate fresh start
      auth.clearAuth();

      // Step 2: Login with registered credentials
      const loginResponse = await auth.login(credentials.email, credentials.password);
      assertOk(loginResponse, 'Login should succeed');

      // Step 3: Access protected endpoint (simulating dashboard)
      const profileResponse = await api.get('/users/me');
      assertOk(profileResponse, 'Should access protected profile endpoint');

      // Step 4: Access health endpoint (simulating dashboard health check)
      const healthResponse = await api.get('/health', {});
      expect(healthResponse.status).toBe(200);

      // Step 5: Access agents list (part of dashboard)
      const agentsResponse = await api.get('/agents');
      assertOk(agentsResponse, 'Should access agents list');

      // Step 6: Logout
      const logoutResponse = await auth.logout();
      // Logout may return 200 or 204
      expect([200, 204]).toContain(logoutResponse.status);

      // Step 7: Verify cannot access protected endpoints after logout
      const postLogoutResponse = await api.get('/users/me');
      assertUnauthorized(postLogoutResponse, 'Should not access after logout');
    });

    test('should handle multiple login sessions', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Register user
      const credentials = generateTestCredentials();
      await auth.register(credentials);
      auth.clearAuth();

      // First login
      const login1 = await auth.login(credentials.email, credentials.password);
      assertOk(login1);
      const token1 = auth.getAccessToken();

      // Create new auth helper for second session
      const api2 = createApiClient(request);
      const auth2 = createAuthHelper(api2);

      // Second login (simulating another device)
      const login2 = await auth2.login(credentials.email, credentials.password);
      assertOk(login2);
      const token2 = auth2.getAccessToken();

      // Both tokens should be different
      expect(token1).not.toBe(token2);

      // Both should work for accessing protected resources
      const response1 = await api.get('/users/me');
      const response2 = await api2.get('/users/me');

      assertOk(response1, 'First session should still work');
      assertOk(response2, 'Second session should work');
    });
  });
});
