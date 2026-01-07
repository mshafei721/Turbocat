/**
 * Authentication Service
 *
 * This service handles all authentication-related operations including
 * user registration, login, password management, and token operations.
 *
 * Security Features:
 * - Password hashing with bcrypt (12 salt rounds)
 * - Strong password requirements enforcement
 * - Session management with Redis
 * - Audit logging for security events
 *
 * @module services/auth.service
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { isRedisAvailable, setWithExpiry, getAndParse, deleteKey } from '../lib/redis';
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
  JwtUserPayload,
  TokenPair,
} from '../utils/jwt';
import { createSession, invalidateSession, invalidateAllUserSessions } from './session.service';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Role type that matches JWT payload expectations
 * Note: Prisma uses lowercase values ('user', 'admin', 'agent') due to @map
 * but we use uppercase for API responses and JWT
 */
type AuthRole = 'ADMIN' | 'USER' | 'AGENT';

/**
 * Map Prisma role to auth role (uppercase)
 */
const toAuthRole = (prismaRole: string): AuthRole => {
  const roleMap: Record<string, AuthRole> = {
    admin: 'ADMIN',
    user: 'USER',
    agent: 'AGENT',
  };
  return roleMap[prismaRole] || 'USER';
};

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
 * User data returned after authentication (excludes password)
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: AuthRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  preferences: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Authentication response with user and tokens
 */
export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
  sessionId: string;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  accessToken: string;
  accessTokenExpiresAt: Date;
}

/**
 * Password reset token data stored in Redis
 */
interface PasswordResetToken {
  userId: string;
  email: string;
  createdAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Bcrypt salt rounds for password hashing
 * 12 rounds provides good security while maintaining reasonable performance
 */
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Password reset token expiry (1 hour)
 */
const PASSWORD_RESET_EXPIRY_SECONDS = 60 * 60;

/**
 * Password reset token prefix in Redis
 */
const PASSWORD_RESET_PREFIX = 'password_reset:';

/**
 * Password requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password against requirements
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns Validation result with errors if invalid
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecialChar &&
    // eslint-disable-next-line no-useless-escape
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Prisma User type for conversion
 */
interface PrismaUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  preferences: Prisma.JsonValue;
  createdAt: Date;
}

/**
 * Convert Prisma user to auth user (excludes sensitive fields)
 */
const toAuthUser = (user: PrismaUser): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: toAuthRole(user.role),
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    preferences: (user.preferences as Record<string, unknown>) || {},
    createdAt: user.createdAt,
  };
};

/**
 * Create audit log for security events
 */
const createAuditLog = async (
  action: string,
  userId: string | null,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  if (!isPrismaAvailable() || !prisma) {
    logger.warn('[Auth] Cannot create audit log - database not available');
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        resourceType,
        resourceId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error('[Auth] Failed to create audit log:', {
      action,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// =============================================================================
// AUTHENTICATION OPERATIONS
// =============================================================================

/**
 * Register a new user
 *
 * @param input - Registration input (email, password, fullName)
 * @param ipAddress - Client IP address for session
 * @param userAgent - Client user agent for session
 * @returns Authentication response with user and tokens
 * @throws ApiError on validation failure or duplicate email
 */
export const register = async (
  input: RegisterInput,
  ipAddress: string = 'unknown',
  userAgent: string = 'unknown',
): Promise<AuthResponse> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  // Validate password
  const passwordValidation = validatePassword(input.password);
  if (!passwordValidation.valid) {
    throw ApiError.validation(
      'Password does not meet requirements',
      passwordValidation.errors.map((error) => ({ field: 'password', message: error })),
    );
  }

  // Normalize email
  const email = input.email.toLowerCase().trim();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user (Prisma uses lowercase role values)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      role: 'user', // Prisma expects lowercase
      isActive: true,
      emailVerified: false,
      preferences: {},
    },
  });

  logger.info('[Auth] User registered:', { userId: user.id, email: user.email });

  // Convert role for session (session service expects uppercase)
  const authRole = toAuthRole(user.role);

  // Create session
  const session = await createSession({
    userId: user.id,
    role: authRole,
    ipAddress,
    userAgent,
  });

  // Generate tokens
  const jwtPayload: JwtUserPayload = {
    userId: user.id,
    email: user.email,
    role: authRole,
    sessionId: session.sessionId,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Create audit log
  await createAuditLog(
    'USER_REGISTERED',
    user.id,
    'user',
    user.id,
    { email: user.email },
    ipAddress,
    userAgent,
  );

  return {
    user: toAuthUser(user),
    tokens,
    sessionId: session.sessionId,
  };
};

/**
 * Authenticate a user with email and password
 *
 * @param input - Login input (email, password)
 * @param ipAddress - Client IP address for session
 * @param userAgent - Client user agent for session
 * @returns Authentication response with user and tokens
 * @throws ApiError on invalid credentials or inactive account
 */
export const login = async (
  input: LoginInput,
  ipAddress: string = 'unknown',
  userAgent: string = 'unknown',
): Promise<AuthResponse> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  // Normalize email
  const email = input.email.toLowerCase().trim();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Generic error message to prevent user enumeration
  const invalidCredentialsError = ApiError.unauthorized('Invalid email or password');

  if (!user) {
    // Perform a dummy password hash comparison to prevent timing attacks
    await bcrypt.compare(input.password, '$2b$12$invalid.hash.to.prevent.timing.attacks');
    throw invalidCredentialsError;
  }

  // Check if user is deleted
  if (user.deletedAt) {
    throw invalidCredentialsError;
  }

  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  // Check if user has a password (might be OAuth-only user)
  if (!user.passwordHash) {
    throw invalidCredentialsError;
  }

  // Verify password
  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    // Log failed login attempt
    await createAuditLog(
      'LOGIN_FAILED',
      user.id,
      'user',
      user.id,
      { reason: 'invalid_password' },
      ipAddress,
      userAgent,
    );
    throw invalidCredentialsError;
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Convert role for session
  const authRole = toAuthRole(user.role);

  // Create session
  const session = await createSession({
    userId: user.id,
    role: authRole,
    ipAddress,
    userAgent,
  });

  // Generate tokens
  const jwtPayload: JwtUserPayload = {
    userId: user.id,
    email: user.email,
    role: authRole,
    sessionId: session.sessionId,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Create audit log
  await createAuditLog(
    'USER_LOGIN',
    user.id,
    'user',
    user.id,
    { email: user.email },
    ipAddress,
    userAgent,
  );

  logger.info('[Auth] User logged in:', { userId: user.id, email: user.email });

  return {
    user: toAuthUser(user),
    tokens,
    sessionId: session.sessionId,
  };
};

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Valid refresh token
 * @returns New access token and expiry
 * @throws ApiError on invalid or expired refresh token
 */
export const refreshAccessToken = (refreshToken: string): RefreshResponse => {
  // Verify refresh token
  const result = verifyRefreshToken(refreshToken);

  if (!result.valid || !result.payload) {
    const errorMessage =
      result.errorCode === 'EXPIRED'
        ? 'Refresh token has expired. Please log in again.'
        : 'Invalid refresh token';

    throw ApiError.unauthorized(errorMessage);
  }

  const payload = result.payload;

  // Generate new access token
  const jwtPayload: JwtUserPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  };

  const accessToken = generateAccessToken(jwtPayload);

  // Calculate expiry (from environment or default 15 minutes)
  const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  const expiryMs = parseExpiryToMs(accessExpiry);

  logger.debug('[Auth] Access token refreshed:', { userId: payload.userId });

  return {
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + expiryMs),
  };
};

/**
 * Parse expiry string to milliseconds
 */
const parseExpiryToMs = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 15 * 60 * 1000; // Default 15 minutes
  }

  const value = parseInt(match[1] as string, 10);
  const unit = match[2] as string;

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
};

/**
 * Logout user by invalidating session
 *
 * @param sessionId - Session ID to invalidate
 * @param userId - User ID for audit log
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export const logout = async (
  sessionId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  // Invalidate session
  await invalidateSession(sessionId);

  // Create audit log
  await createAuditLog('USER_LOGOUT', userId, 'user', userId, { sessionId }, ipAddress, userAgent);

  logger.info('[Auth] User logged out:', { userId, sessionId });
};

// =============================================================================
// PASSWORD RESET OPERATIONS
// =============================================================================

/**
 * Initiate password reset flow
 *
 * @param email - User email address
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @returns Reset token (in production, this would be sent via email)
 */
export const forgotPassword = async (
  email: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ message: string; token?: string }> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success message to prevent user enumeration
  const successMessage =
    'If an account with that email exists, a password reset link has been sent.';

  if (!user || user.deletedAt || !user.isActive) {
    // Don't reveal if user exists
    logger.debug('[Auth] Password reset requested for non-existent/inactive email:', {
      email: normalizedEmail,
    });
    return { message: successMessage };
  }

  // Generate reset token
  const resetToken = uuidv4();
  const resetKey = `${PASSWORD_RESET_PREFIX}${resetToken}`;

  // Store token data in Redis
  if (isRedisAvailable()) {
    const tokenData: PasswordResetToken = {
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
    };

    await setWithExpiry(resetKey, tokenData, PASSWORD_RESET_EXPIRY_SECONDS);
  } else {
    logger.warn('[Auth] Redis not available for password reset token storage');
    throw ApiError.serviceUnavailable('Password reset service temporarily unavailable');
  }

  // Create audit log
  await createAuditLog(
    'PASSWORD_RESET_REQUESTED',
    user.id,
    'user',
    user.id,
    { email: user.email },
    ipAddress,
    userAgent,
  );

  logger.info('[Auth] Password reset token generated:', { userId: user.id, email: user.email });

  // In development, return the token for testing
  // In production, you would send this via email using a service like Resend
  if (process.env.NODE_ENV === 'development') {
    return {
      message: successMessage,
      token: resetToken, // Only in development!
    };
  }

  // TODO: Send password reset email
  // await sendPasswordResetEmail(user.email, resetToken);

  return { message: successMessage };
};

/**
 * Reset password using reset token
 *
 * @param token - Password reset token
 * @param newPassword - New password
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  if (!isPrismaAvailable() || !prisma) {
    throw ApiError.serviceUnavailable('Database not available');
  }

  if (!isRedisAvailable()) {
    throw ApiError.serviceUnavailable('Password reset service temporarily unavailable');
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw ApiError.validation(
      'Password does not meet requirements',
      passwordValidation.errors.map((error) => ({ field: 'newPassword', message: error })),
    );
  }

  // Get token data from Redis
  const resetKey = `${PASSWORD_RESET_PREFIX}${token}`;
  const tokenData = await getAndParse<PasswordResetToken>(resetKey);

  if (!tokenData) {
    throw ApiError.badRequest('Invalid or expired password reset token');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
  });

  if (!user || user.deletedAt) {
    throw ApiError.badRequest('Invalid or expired password reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate reset token
  await deleteKey(resetKey);

  // Invalidate all existing sessions for security
  await invalidateAllUserSessions(user.id);

  // Create audit log
  await createAuditLog(
    'PASSWORD_RESET_COMPLETED',
    user.id,
    'user',
    user.id,
    { email: user.email },
    ipAddress,
    userAgent,
  );

  logger.info('[Auth] Password reset completed:', { userId: user.id, email: user.email });
};

// =============================================================================
// USER LOOKUP
// =============================================================================

/**
 * Find user by ID
 *
 * @param userId - User ID
 * @returns User or null if not found
 */
export const findUserById = async (userId: string): Promise<AuthUser | null> => {
  if (!isPrismaAvailable() || !prisma) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  return toAuthUser(user);
};

/**
 * Find user by email
 *
 * @param email - User email
 * @returns User or null if not found
 */
export const findUserByEmail = async (email: string): Promise<AuthUser | null> => {
  if (!isPrismaAvailable() || !prisma) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  return toAuthUser(user);
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  validatePassword,
  hashPassword,
  verifyPassword,
  findUserById,
  findUserByEmail,
};
