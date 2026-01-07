/**
 * Tests for Auth Service
 *
 * Tests the authentication functionality including:
 * - register (new user)
 * - login (valid/invalid credentials)
 * - refreshAccessToken (valid token)
 * - validatePassword
 */

import * as authService from '../auth.service';
import { ApiError } from '../../utils/ApiError';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
  isPrismaAvailable: jest.fn().mockReturnValue(true),
}));

// Mock Redis
jest.mock('../../lib/redis', () => ({
  isRedisAvailable: jest.fn().mockReturnValue(true),
  setWithExpiry: jest.fn().mockResolvedValue(true),
  getAndParse: jest.fn(),
  deleteKey: jest.fn().mockResolvedValue(true),
}));

// Mock JWT utilities
jest.mock('../../utils/jwt', () => ({
  generateTokenPair: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    accessTokenExpiresAt: new Date('2026-01-06T12:15:00.000Z'),
    refreshTokenExpiresAt: new Date('2026-01-13T12:00:00.000Z'),
  }),
  generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
  verifyRefreshToken: jest.fn(),
}));

// Mock session service
jest.mock('../session.service', () => ({
  createSession: jest.fn().mockResolvedValue({
    sessionId: 'mock-session-id',
    userId: 'user-123',
    expiresAt: new Date('2026-01-13T12:00:00.000Z'),
  }),
  invalidateSession: jest.fn().mockResolvedValue(true),
  invalidateAllUserSessions: jest.fn().mockResolvedValue(2),
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Auth Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;
  const mockIsPrismaAvailable = require('../../lib/prisma').isPrismaAvailable;
  const mockBcrypt = require('bcrypt');
  const mockJwt = require('../../utils/jwt');

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'user',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    isActive: true,
    emailVerified: false,
    preferences: {},
    lastLoginAt: null,
    createdAt: new Date('2026-01-06T12:00:00.000Z'),
    updatedAt: new Date('2026-01-06T12:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrismaAvailable.mockReturnValue(true);
    mockBcrypt.compare.mockResolvedValue(true);
  });

  describe('validatePassword', () => {
    it('should pass for a valid password meeting all requirements', () => {
      const result = authService.validatePassword('ValidPass123!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for password shorter than 8 characters', () => {
      const result = authService.validatePassword('Abc1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should fail for password without uppercase letter', () => {
      const result = authService.validatePassword('lowercase123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should fail for password without lowercase letter', () => {
      const result = authService.validatePassword('UPPERCASE123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should fail for password without number', () => {
      const result = authService.validatePassword('NoNumbersHere!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should fail for password without special character', () => {
      const result = authService.validatePassword('NoSpecialChar1');

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('special character'))).toBe(true);
    });

    it('should return multiple errors for password failing multiple requirements', () => {
      const result = authService.validatePassword('short');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const input: authService.RegisterInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        fullName: 'Test User',
      };

      const result = await authService.register(input);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.sessionId).toBe('mock-session-id');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'user',
        }),
      });
    });

    it('should throw validation error for weak password', async () => {
      const input: authService.RegisterInput = {
        email: 'test@example.com',
        password: 'weak',
      };

      await expect(authService.register(input)).rejects.toThrow(ApiError);
      await expect(authService.register(input)).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should throw conflict error for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const input: authService.RegisterInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(authService.register(input)).rejects.toThrow(ApiError);
      await expect(authService.register(input)).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('already exists'),
      });
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const input: authService.RegisterInput = {
        email: 'TEST@EXAMPLE.COM',
        password: 'ValidPass123!',
      };

      await authService.register(input);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw ServiceUnavailable when database is not available', async () => {
      mockIsPrismaAvailable.mockReturnValue(false);

      const input: authService.RegisterInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(authService.register(input)).rejects.toMatchObject({
        statusCode: 503,
        message: 'Database not available',
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      const input: authService.LoginInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const result = await authService.login(input);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('USER'); // Converted to uppercase
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.sessionId).toBe('mock-session-id');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw unauthorized for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const input: authService.LoginInput = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      await expect(authService.login(input)).rejects.toThrow(ApiError);
      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('should throw unauthorized for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const input: authService.LoginInput = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      };

      await expect(authService.login(input)).rejects.toThrow(ApiError);
      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('should throw forbidden for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const input: authService.LoginInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(authService.login(input)).rejects.toThrow(ApiError);
      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('deactivated'),
      });
    });

    it('should throw unauthorized for deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(deletedUser);

      const input: authService.LoginInput = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('should throw unauthorized for user without password hash', async () => {
      const oauthUser = { ...mockUser, passwordHash: null };
      mockPrisma.user.findUnique.mockResolvedValue(oauthUser);

      const input: authService.LoginInput = {
        email: 'test@example.com',
        password: 'SomePassword123!',
      };

      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('should normalize email to lowercase when logging in', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const input: authService.LoginInput = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'ValidPass123!',
      };

      await authService.login(input);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should return a new access token for valid refresh token', () => {
      mockJwt.verifyRefreshToken.mockReturnValue({
        valid: true,
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          sessionId: 'session-123',
        },
      });

      const result = authService.refreshAccessToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should throw unauthorized for expired refresh token', () => {
      mockJwt.verifyRefreshToken.mockReturnValue({
        valid: false,
        errorCode: 'EXPIRED',
      });

      expect(() => authService.refreshAccessToken('expired-token')).toThrow(ApiError);
      expect(() => authService.refreshAccessToken('expired-token')).toThrow(/expired/);
    });

    it('should throw unauthorized for invalid refresh token', () => {
      mockJwt.verifyRefreshToken.mockReturnValue({
        valid: false,
        errorCode: 'INVALID',
      });

      expect(() => authService.refreshAccessToken('invalid-token')).toThrow(ApiError);
      expect(() => authService.refreshAccessToken('invalid-token')).toThrow(
        /Invalid refresh token/,
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const result = await authService.hashPassword('TestPassword123!');

      expect(result).toBe('hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('TestPassword123!', 12);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authService.verifyPassword('correct-password', 'hashed-password');

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authService.verifyPassword('wrong-password', 'hashed-password');

      expect(result).toBe(false);
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.findUserById('user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.findUserById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when user is deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      const result = await authService.findUserById('user-123');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should return user when found by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.findUserByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should normalize email before search', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authService.findUserByEmail('  TEST@EXAMPLE.COM  ');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });
});
