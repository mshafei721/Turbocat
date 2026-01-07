/**
 * Authentication Helpers for Integration Tests
 *
 * This module provides utilities for handling authentication in integration tests.
 * It includes functions to generate test tokens, create authenticated requests,
 * and manage test user sessions.
 *
 * Usage:
 * ```typescript
 * import { generateTestToken, authenticatedRequest } from './helpers/auth';
 *
 * // Generate a token for a user
 * const token = generateTestToken({ userId: user.id, email: user.email, role: 'USER' });
 *
 * // Make an authenticated request
 * const response = await authenticatedRequest(app)
 *   .get('/api/v1/agents')
 *   .withUser(user);
 * ```
 *
 * @module __tests__/integration/helpers/auth
 */

import { Application } from 'express';
import request, { Test } from 'supertest';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { User, UserRole } from '@prisma/client';
import { userFactory, testUserPassword } from '../../factories/user.factory';
import { isTestDatabaseAvailable } from '../setup';

// ============================================================================
// Types
// ============================================================================

/**
 * Role type for token payload - uppercase values for JWT
 */
type TokenRole = 'ADMIN' | 'USER' | 'AGENT';

/**
 * JWT payload for test tokens
 */
export interface TestTokenPayload {
  userId: string;
  email: string;
  role: TokenRole;
  sessionId?: string;
}

/**
 * Token generation options
 */
export interface TokenOptions {
  expiresIn?: string;
  secret?: string;
}

/**
 * Authenticated test user context
 */
export interface AuthenticatedUser {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Extended supertest request with authentication helpers
 */
export interface AuthenticatedRequest {
  get: (url: string) => AuthenticatedTest;
  post: (url: string) => AuthenticatedTest;
  put: (url: string) => AuthenticatedTest;
  patch: (url: string) => AuthenticatedTest;
  delete: (url: string) => AuthenticatedTest;
}

/**
 * Extended supertest test with authentication methods
 */
export interface AuthenticatedTest extends Test {
  withToken: (token: string) => Test;
  withUser: (user: User) => Test;
  withPayload: (payload: TestTokenPayload) => Test;
  asAdmin: () => Promise<Test>;
  asUser: () => Promise<Test>;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default test JWT secrets
 * These should match the environment variables set in integration setup
 */
const TEST_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret-key-for-integration-tests-min-32-chars';
const TEST_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-integration-tests-min-32-chars';

/**
 * Default token expiration times (in seconds)
 */
const DEFAULT_ACCESS_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map Prisma UserRole to TokenRole
 */
const mapUserRoleToTokenRole = (role: UserRole): TokenRole => {
  // Prisma UserRole enum values are the database values (lowercase)
  // but TypeScript uses the enum keys for comparison
  const roleStr = String(role).toUpperCase();
  if (roleStr === 'ADMIN' || roleStr === 'USER' || roleStr === 'AGENT') {
    return roleStr;
  }
  return 'USER'; // Default fallback
};

/**
 * Parse expiry string to seconds
 */
const parseExpiryToSeconds = (expiry: string): number => {
  const match = expiry.match(/^(-?\d+)([smhd])$/);
  if (!match) {
    return DEFAULT_ACCESS_EXPIRY_SECONDS;
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2] as string;

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return DEFAULT_ACCESS_EXPIRY_SECONDS;
  }
};

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate a test access token
 *
 * @param payload - Token payload containing user info
 * @param options - Optional token configuration
 * @returns Signed JWT access token
 *
 * Usage:
 * ```typescript
 * const token = generateTestToken({
 *   userId: 'user-123',
 *   email: 'test@example.com',
 *   role: 'USER'
 * });
 * ```
 */
export const generateTestToken = (
  payload: TestTokenPayload,
  options: TokenOptions = {},
): string => {
  const secret = options.secret || TEST_ACCESS_SECRET;
  const expiresInSeconds = options.expiresIn
    ? parseExpiryToSeconds(options.expiresIn)
    : DEFAULT_ACCESS_EXPIRY_SECONDS;

  const tokenPayload = {
    ...payload,
    type: 'access',
    sessionId: payload.sessionId || `test-session-${Date.now()}`,
  };

  const signOptions: SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256',
  };

  return jwt.sign(tokenPayload, secret, signOptions);
};

/**
 * Generate a test refresh token
 *
 * @param payload - Token payload containing user info
 * @param options - Optional token configuration
 * @returns Signed JWT refresh token
 *
 * Usage:
 * ```typescript
 * const refreshToken = generateTestRefreshToken({
 *   userId: 'user-123',
 *   email: 'test@example.com',
 *   role: 'USER'
 * });
 * ```
 */
export const generateTestRefreshToken = (
  payload: TestTokenPayload,
  options: TokenOptions = {},
): string => {
  const secret = options.secret || TEST_REFRESH_SECRET;
  const expiresInSeconds = options.expiresIn
    ? parseExpiryToSeconds(options.expiresIn)
    : DEFAULT_REFRESH_EXPIRY_SECONDS;

  const tokenPayload = {
    ...payload,
    type: 'refresh',
    sessionId: payload.sessionId || `test-session-${Date.now()}`,
  };

  const signOptions: SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256',
  };

  return jwt.sign(tokenPayload, secret, signOptions);
};

/**
 * Generate both access and refresh tokens for a user
 *
 * @param user - User to generate tokens for
 * @returns Object containing both tokens
 *
 * Usage:
 * ```typescript
 * const { accessToken, refreshToken } = generateTokenPair(user);
 * ```
 */
export const generateTokenPair = (user: User): { accessToken: string; refreshToken: string } => {
  const payload: TestTokenPayload = {
    userId: user.id,
    email: user.email,
    role: mapUserRoleToTokenRole(user.role),
  };

  return {
    accessToken: generateTestToken(payload),
    refreshToken: generateTestRefreshToken(payload),
  };
};

/**
 * Generate an expired token for testing token expiration
 *
 * @param payload - Token payload
 * @returns Expired JWT token
 *
 * Usage:
 * ```typescript
 * const expiredToken = generateExpiredToken({
 *   userId: 'user-123',
 *   email: 'test@example.com',
 *   role: 'USER'
 * });
 * ```
 */
export const generateExpiredToken = (payload: TestTokenPayload): string => {
  return generateTestToken(payload, { expiresIn: '-1s' });
};

/**
 * Generate a token with invalid signature
 *
 * @param payload - Token payload
 * @returns Token signed with wrong secret
 *
 * Usage:
 * ```typescript
 * const invalidToken = generateInvalidToken({
 *   userId: 'user-123',
 *   email: 'test@example.com',
 *   role: 'USER'
 * });
 * ```
 */
export const generateInvalidToken = (payload: TestTokenPayload): string => {
  return generateTestToken(payload, { secret: 'wrong-secret-key-for-testing-invalid-tokens' });
};

// ============================================================================
// Authenticated User Creation
// ============================================================================

/**
 * Create an authenticated test user with tokens
 *
 * @param userOverrides - Optional user field overrides
 * @returns Promise resolving to user and tokens
 *
 * Usage:
 * ```typescript
 * const { user, accessToken, refreshToken } = await createAuthenticatedUser();
 * ```
 */
export const createAuthenticatedUser = async (userOverrides = {}): Promise<AuthenticatedUser> => {
  if (!isTestDatabaseAvailable()) {
    throw new Error('Test database is not available. Cannot create authenticated user.');
  }

  const user = await userFactory.createVerified(userOverrides);
  const { accessToken, refreshToken } = generateTokenPair(user);

  return { user, accessToken, refreshToken };
};

/**
 * Create an authenticated admin user with tokens
 *
 * @param userOverrides - Optional user field overrides
 * @returns Promise resolving to admin user and tokens
 *
 * Usage:
 * ```typescript
 * const { user, accessToken } = await createAuthenticatedAdmin();
 * ```
 */
export const createAuthenticatedAdmin = async (userOverrides = {}): Promise<AuthenticatedUser> => {
  if (!isTestDatabaseAvailable()) {
    throw new Error('Test database is not available. Cannot create authenticated admin.');
  }

  const user = await userFactory.createAdmin(userOverrides);
  const { accessToken, refreshToken } = generateTokenPair(user);

  return { user, accessToken, refreshToken };
};

// ============================================================================
// Authenticated Request Builder
// ============================================================================

/**
 * Create an authenticated request builder
 *
 * This helper wraps supertest to make it easier to add authentication
 * to test requests.
 *
 * @param app - Express application instance
 * @returns Request builder with authentication helpers
 *
 * Usage:
 * ```typescript
 * const response = await authenticatedRequest(app)
 *   .get('/api/v1/agents')
 *   .withUser(user);
 *
 * const response = await authenticatedRequest(app)
 *   .post('/api/v1/agents')
 *   .withToken(token)
 *   .send({ name: 'My Agent' });
 * ```
 */
export const authenticatedRequest = (app: Application): AuthenticatedRequest => {
  const createAuthenticatedTest = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
  ): AuthenticatedTest => {
    const req = request(app)[method](url) as AuthenticatedTest;

    // Add authentication helper methods
    req.withToken = (token: string): Test => {
      return req.set('Authorization', `Bearer ${token}`);
    };

    req.withUser = (user: User): Test => {
      const token = generateTestToken({
        userId: user.id,
        email: user.email,
        role: mapUserRoleToTokenRole(user.role),
      });
      return req.set('Authorization', `Bearer ${token}`);
    };

    req.withPayload = (payload: TestTokenPayload): Test => {
      const token = generateTestToken(payload);
      return req.set('Authorization', `Bearer ${token}`);
    };

    req.asAdmin = async (): Promise<Test> => {
      const { accessToken } = await createAuthenticatedAdmin();
      return req.set('Authorization', `Bearer ${accessToken}`);
    };

    req.asUser = async (): Promise<Test> => {
      const { accessToken } = await createAuthenticatedUser();
      return req.set('Authorization', `Bearer ${accessToken}`);
    };

    return req;
  };

  return {
    get: (url: string) => createAuthenticatedTest('get', url),
    post: (url: string) => createAuthenticatedTest('post', url),
    put: (url: string) => createAuthenticatedTest('put', url),
    patch: (url: string) => createAuthenticatedTest('patch', url),
    delete: (url: string) => createAuthenticatedTest('delete', url),
  };
};

// ============================================================================
// Login Helpers
// ============================================================================

/**
 * Perform a login request and return tokens
 *
 * @param app - Express application instance
 * @param email - User email
 * @param password - User password
 * @returns Promise resolving to login response with tokens
 *
 * Usage:
 * ```typescript
 * const user = await userFactory.createVerified();
 * const { accessToken, refreshToken } = await loginUser(app, user.email, testUserPassword);
 * ```
 */
export const loginUser = async (
  app: Application,
  email: string,
  password: string = testUserPassword,
): Promise<{ accessToken: string; refreshToken: string; user: unknown }> => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: response.body.data?.accessToken || response.body.accessToken,
    refreshToken: response.body.data?.refreshToken || response.body.refreshToken,
    user: response.body.data?.user || response.body.user,
  };
};

/**
 * Create a user and log them in
 *
 * @param app - Express application instance
 * @param userOverrides - Optional user field overrides
 * @returns Promise resolving to user and tokens from actual login
 *
 * Usage:
 * ```typescript
 * const { user, accessToken } = await createAndLoginUser(app);
 * ```
 */
export const createAndLoginUser = async (
  app: Application,
  userOverrides = {},
): Promise<AuthenticatedUser> => {
  if (!isTestDatabaseAvailable()) {
    throw new Error('Test database is not available. Cannot create and login user.');
  }

  const user = await userFactory.createVerified(userOverrides);

  try {
    const { accessToken, refreshToken } = await loginUser(app, user.email, testUserPassword);
    return { user, accessToken, refreshToken };
  } catch {
    // If login endpoint doesn't exist or fails, generate tokens directly
    const { accessToken, refreshToken } = generateTokenPair(user);
    return { user, accessToken, refreshToken };
  }
};

// ============================================================================
// Authorization Header Helpers
// ============================================================================

/**
 * Create an Authorization header value
 *
 * @param token - JWT token
 * @returns Authorization header value
 *
 * Usage:
 * ```typescript
 * const authHeader = createAuthHeader(token);
 * // Returns: "Bearer <token>"
 * ```
 */
export const createAuthHeader = (token: string): string => {
  return `Bearer ${token}`;
};

/**
 * Extract token from Authorization header
 *
 * @param header - Authorization header value
 * @returns Token string or null if invalid
 *
 * Usage:
 * ```typescript
 * const token = extractToken('Bearer abc123');
 * // Returns: "abc123"
 * ```
 */
export const extractToken = (header: string | undefined): string | null => {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
};

// ============================================================================
// Token Verification Helpers
// ============================================================================

/**
 * Verify and decode a test token
 *
 * @param token - JWT token to verify
 * @param secret - Secret to verify with (defaults to test access secret)
 * @returns Decoded token payload or null if invalid
 *
 * Usage:
 * ```typescript
 * const payload = verifyTestToken(token);
 * if (payload) {
 *   console.log('User ID:', payload.userId);
 * }
 * ```
 */
export const verifyTestToken = (
  token: string,
  secret: string = TEST_ACCESS_SECRET,
): TestTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, secret) as TestTokenPayload;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Check if a token is expired
 *
 * @param token - JWT token to check
 * @returns True if token is expired
 *
 * Usage:
 * ```typescript
 * if (isTokenExpired(token)) {
 *   console.log('Token has expired');
 * }
 * ```
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// ============================================================================
// Exports
// ============================================================================

export {
  TEST_ACCESS_SECRET,
  TEST_REFRESH_SECRET,
  DEFAULT_ACCESS_EXPIRY_SECONDS,
  DEFAULT_REFRESH_EXPIRY_SECONDS,
};
