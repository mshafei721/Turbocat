/**
 * Tests for Email Verification Service
 *
 * Tests the email verification functionality including:
 * - generateVerificationToken (token generation, expiry)
 * - verifyEmail (validation, expiry checking, single-use)
 * - sendVerificationEmail (logging in development)
 */

import * as emailVerificationService from '../email-verification.service';
import { ApiError } from '../../utils/ApiError';

// Mock crypto
const mockRandomBytes = jest.fn();
jest.mock('crypto', () => ({
  randomBytes: (size: number) => {
    const result = mockRandomBytes(size);
    return {
      toString: (_encoding: string) => result,
    };
  },
}));

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  isPrismaAvailable: jest.fn().mockReturnValue(true),
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

describe('Email Verification Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;
  const mockIsPrismaAvailable = require('../../lib/prisma').isPrismaAvailable;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'user',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    isActive: true,
    emailVerified: false,
    emailVerifiedAt: null,
    verificationToken: null,
    verificationTokenExpiry: null,
    preferences: {},
    lastLoginAt: null,
    createdAt: new Date('2026-01-14T12:00:00.000Z'),
    updatedAt: new Date('2026-01-14T12:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrismaAvailable.mockReturnValue(true);
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // generateVerificationToken
  // ===========================================================================

  describe('generateVerificationToken', () => {
    it('should generate token and store with expiry', async () => {
      const token = 'a'.repeat(64); // 64-character hex string
      mockRandomBytes.mockReturnValue(token);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await emailVerificationService.generateVerificationToken('user-123');

      expect(result).toBe(token);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          verificationToken: token,
          verificationTokenExpiry: expect.any(Date),
        },
      });
    });

    it('should generate 64-character hex token', async () => {
      const token = 'b'.repeat(64);
      mockRandomBytes.mockReturnValue(token);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
      });

      const result = await emailVerificationService.generateVerificationToken('user-123');

      expect(result).toHaveLength(64);
      expect(mockRandomBytes).toHaveBeenCalledWith(32); // 32 bytes = 64 hex chars
    });

    it('should set expiry to 24 hours from now', async () => {
      const token = 'c'.repeat(64);
      mockRandomBytes.mockReturnValue(token);

      const now = new Date('2026-01-14T12:00:00.000Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
      });

      await emailVerificationService.generateVerificationToken('user-123');

      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          verificationToken: token,
          verificationTokenExpiry: expectedExpiry,
        },
      });

      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        ApiError,
      );
      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw error if user is deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        ApiError,
      );
      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw error if database unavailable', async () => {
      mockIsPrismaAvailable.mockReturnValue(false);

      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        ApiError,
      );
      await expect(emailVerificationService.generateVerificationToken('user-123')).rejects.toThrow(
        'Database not available',
      );
    });
  });

  // ===========================================================================
  // verifyEmail
  // ===========================================================================

  describe('verifyEmail', () => {
    it('should verify email and delete token on success', async () => {
      const token = 'd'.repeat(64);
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
        verificationTokenExpiry: futureExpiry,
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      await emailVerificationService.verifyEmail(token);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { verificationToken: token },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    });

    it('should mark emailVerified as true', async () => {
      const token = 'e'.repeat(64);
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
        verificationTokenExpiry: futureExpiry,
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await emailVerificationService.verifyEmail(token);

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.emailVerified).toBe(true);
      expect(updateCall.data.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(emailVerificationService.verifyEmail('invalid-token')).rejects.toThrow(ApiError);
      await expect(emailVerificationService.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('should throw error for expired token', async () => {
      const token = 'f'.repeat(64);
      const pastExpiry = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes in past

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
        verificationTokenExpiry: pastExpiry,
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow(ApiError);
      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow(
        'Verification token has expired',
      );

      // Should clean up expired token
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    });

    it('should throw error if token expiry is null', async () => {
      const token = 'g'.repeat(64);

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        verificationToken: token,
        verificationTokenExpiry: null,
      });

      await expect(emailVerificationService.verifyEmail(token)).rejects.toThrow(ApiError);
    });

    it('should throw error if database unavailable', async () => {
      mockIsPrismaAvailable.mockReturnValue(false);

      await expect(emailVerificationService.verifyEmail('any-token')).rejects.toThrow(ApiError);
      await expect(emailVerificationService.verifyEmail('any-token')).rejects.toThrow(
        'Database not available',
      );
    });
  });

  // ===========================================================================
  // sendVerificationEmail
  // ===========================================================================

  describe('sendVerificationEmail', () => {
    it('should log to console in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await emailVerificationService.sendVerificationEmail(
        'user-123',
        'test@example.com',
        'h'.repeat(64),
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(logOutput).toContain('test@example.com');
      expect(logOutput).toContain('h'.repeat(64));

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should include verification URL in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.NODE_ENV = 'development';
      process.env.FRONTEND_URL = 'http://localhost:3000';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const token = 'i'.repeat(64);
      await emailVerificationService.sendVerificationEmail('user-123', 'test@example.com', token);

      const logOutput = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(logOutput).toContain(`http://localhost:3000/verify-email?token=${token}`);

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should warn in production if email service not configured', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const logger = require('../../lib/logger').logger;

      await emailVerificationService.sendVerificationEmail(
        'user-123',
        'test@example.com',
        'j'.repeat(64),
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Email service not configured'),
        expect.any(Object),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
