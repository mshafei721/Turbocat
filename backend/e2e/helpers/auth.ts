/**
 * Authentication Helpers for E2E Tests
 *
 * This module provides utilities for handling authentication flows
 * in E2E tests. It includes functions for user registration, login,
 * token management, and authenticated request handling.
 *
 * Features:
 * - User registration flow
 * - Login flow with token extraction
 * - Token refresh handling
 * - Session management
 * - Admin user creation
 *
 * Usage:
 * ```typescript
 * const auth = new AuthHelper(apiClient);
 * const { user, tokens } = await auth.registerUser({ email, password });
 * const { tokens } = await auth.login(email, password);
 * ```
 *
 * @module e2e/helpers/auth
 */

import { ApiClient, ParsedResponse } from './api-client';

// ============================================================================
// Types
// ============================================================================

/**
 * User registration input
 */
export interface RegisterInput {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * User login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

/**
 * User data from authentication responses
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Authentication response data
 */
export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Test user credentials for E2E tests
 */
export interface TestUserCredentials {
  email: string;
  password: string;
  fullName?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default test user password
 * Strong enough to pass validation
 */
export const DEFAULT_TEST_PASSWORD = 'TestPassword123!';

/**
 * Counter for generating unique test emails
 */
let userCounter = 0;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique test email
 *
 * @param prefix - Email prefix (default: 'e2e-test')
 * @returns Unique test email address
 */
export function generateTestEmail(prefix: string = 'e2e-test'): string {
  userCounter++;
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${userCounter}@test.turbocat.dev`;
}

/**
 * Generate test user credentials
 *
 * @param overrides - Optional overrides for credentials
 * @returns Test user credentials
 */
export function generateTestCredentials(
  overrides: Partial<TestUserCredentials> = {},
): TestUserCredentials {
  return {
    email: generateTestEmail(),
    password: DEFAULT_TEST_PASSWORD,
    fullName: `E2E Test User ${userCounter}`,
    ...overrides,
  };
}

// ============================================================================
// Auth Helper Class
// ============================================================================

/**
 * Authentication Helper for E2E Tests
 *
 * Provides methods for handling authentication flows during E2E testing.
 */
export class AuthHelper {
  private client: ApiClient;
  private currentUser: AuthUser | null = null;
  private currentTokens: AuthTokens | null = null;

  /**
   * Create a new auth helper
   *
   * @param client - API client instance
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  // ==========================================================================
  // Registration
  // ==========================================================================

  /**
   * Register a new user
   *
   * @param input - Registration input
   * @returns Registration response with user and tokens
   */
  async register(input: RegisterInput): Promise<ParsedResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>('/auth/register', input);

    if (response.ok && response.body.data) {
      this.currentUser = response.body.data.user;
      this.currentTokens = response.body.data.tokens;
      this.client.setAuthToken(response.body.data.tokens.accessToken);
    }

    return response;
  }

  /**
   * Register a new test user with generated credentials
   *
   * @param overrides - Optional credential overrides
   * @returns Registration response with credentials
   */
  async registerTestUser(
    overrides: Partial<TestUserCredentials> = {},
  ): Promise<{ response: ParsedResponse<AuthResponse>; credentials: TestUserCredentials }> {
    const credentials = generateTestCredentials(overrides);
    const response = await this.register(credentials);
    return { response, credentials };
  }

  // ==========================================================================
  // Login
  // ==========================================================================

  /**
   * Login with credentials
   *
   * @param email - User email
   * @param password - User password
   * @returns Login response with user and tokens
   */
  async login(email: string, password: string): Promise<ParsedResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    if (response.ok && response.body.data) {
      this.currentUser = response.body.data.user;
      this.currentTokens = response.body.data.tokens;
      this.client.setAuthToken(response.body.data.tokens.accessToken);
    }

    return response;
  }

  /**
   * Login with test user credentials
   *
   * @param credentials - Test user credentials
   * @returns Login response
   */
  async loginWithCredentials(
    credentials: TestUserCredentials,
  ): Promise<ParsedResponse<AuthResponse>> {
    return this.login(credentials.email, credentials.password);
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  /**
   * Refresh the access token
   *
   * @returns Refresh response with new access token
   */
  async refreshToken(): Promise<ParsedResponse<{ accessToken: string; accessTokenExpiresAt: string }>> {
    if (!this.currentTokens?.refreshToken) {
      throw new Error('No refresh token available. Login first.');
    }

    const response = await this.client.post<{ accessToken: string; accessTokenExpiresAt: string }>(
      '/auth/refresh',
      { refreshToken: this.currentTokens.refreshToken },
    );

    if (response.ok && response.body.data) {
      this.currentTokens = {
        ...this.currentTokens,
        accessToken: response.body.data.accessToken,
        accessTokenExpiresAt: response.body.data.accessTokenExpiresAt,
      };
      this.client.setAuthToken(response.body.data.accessToken);
    }

    return response;
  }

  /**
   * Set authentication token manually
   *
   * @param token - JWT access token
   */
  setToken(token: string): void {
    this.client.setAuthToken(token);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.currentTokens?.accessToken || null;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.currentTokens?.refreshToken || null;
  }

  // ==========================================================================
  // Logout
  // ==========================================================================

  /**
   * Logout the current user
   *
   * @returns Logout response
   */
  async logout(): Promise<ParsedResponse<void>> {
    const response = await this.client.post<void>('/auth/logout');

    // Clear local state regardless of response
    this.currentUser = null;
    this.currentTokens = null;
    this.client.clearAuthToken();

    return response;
  }

  // ==========================================================================
  // Password Reset
  // ==========================================================================

  /**
   * Request password reset
   *
   * @param email - User email
   * @returns Password reset request response
   */
  async forgotPassword(
    email: string,
  ): Promise<ParsedResponse<{ message: string; token?: string }>> {
    return this.client.post<{ message: string; token?: string }>(
      '/auth/forgot-password',
      { email },
    );
  }

  /**
   * Reset password with token
   *
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Password reset response
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ParsedResponse<{ message: string }>> {
    return this.client.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
  }

  // ==========================================================================
  // User State
  // ==========================================================================

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.currentTokens !== null && this.currentUser !== null;
  }

  /**
   * Clear authentication state
   */
  clearAuth(): void {
    this.currentUser = null;
    this.currentTokens = null;
    this.client.clearAuthToken();
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Create and login a test user in one step
   *
   * @param overrides - Optional credential overrides
   * @returns User, tokens, and credentials
   */
  async createAndLoginTestUser(
    overrides: Partial<TestUserCredentials> = {},
  ): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    credentials: TestUserCredentials;
  }> {
    const { response, credentials } = await this.registerTestUser(overrides);

    if (!response.ok || !response.body.data) {
      throw new Error(
        `Failed to create test user: ${response.body.error?.message || 'Unknown error'}`,
      );
    }

    return {
      user: response.body.data.user,
      tokens: response.body.data.tokens,
      credentials,
    };
  }

  /**
   * Create an admin test user
   * Note: This requires database access or a special admin creation endpoint
   *
   * @param overrides - Optional credential overrides
   * @returns Admin user, tokens, and credentials
   */
  async createAdminUser(
    overrides: Partial<TestUserCredentials> = {},
  ): Promise<{
    user: AuthUser;
    tokens: AuthTokens;
    credentials: TestUserCredentials;
  }> {
    // First create a regular user
    const result = await this.createAndLoginTestUser({
      ...overrides,
      email: overrides.email || generateTestEmail('e2e-admin'),
    });

    // Note: In a real scenario, you would need a way to promote the user to admin
    // This could be through a database seed, special endpoint, or direct DB access
    // For now, we return the user as-is

    return result;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new auth helper instance
 *
 * @param client - API client instance
 * @returns New auth helper instance
 *
 * Usage:
 * ```typescript
 * const api = createApiClient(request);
 * const auth = createAuthHelper(api);
 * ```
 */
export function createAuthHelper(client: ApiClient): AuthHelper {
  return new AuthHelper(client);
}

// ============================================================================
// Exports
// ============================================================================

export default AuthHelper;
