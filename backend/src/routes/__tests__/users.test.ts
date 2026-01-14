/**
 * Users Route Tests
 * Tests for user profile management endpoints (PATCH /users/:id)
 *
 * @module routes/__tests__/users
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

// Mock dependencies before imports
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
  isPrismaAvailable: jest.fn(() => true),
}));

jest.mock('../../services/auth.service', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePassword: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Use valid UUID for auth mock (matching Express 5 UUID regex)
const mockAuthUserId = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = {
      userId: mockAuthUserId,
      email: 'test@example.com',
      role: 'USER' as const,
      sessionId: 'test-session-id',
    };
    req.requestId = 'test-request-id';
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Import after mocks
import usersRouter from '../users';
import { prisma } from '../../lib/prisma';
import * as authService from '../../services/auth.service';
import { errorHandler } from '../../middleware/errorHandler';

type MockedPrisma = {
  user: {
    findUnique: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
  };
  auditLog: {
    create: jest.MockedFunction<any>;
  };
};

// Test app setup
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/users', usersRouter);
  app.use(errorHandler);
  return app;
};

// Use the same UUID from auth mock for all tests
const testUserId = mockAuthUserId;

describe('PATCH /users/:id', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  const mockUser = {
    id: testUserId,
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    fullName: 'Test User',
    avatarUrl: null,
    role: 'user',
    isActive: true,
    emailVerified: false,
    emailVerifiedAt: null,
    verificationToken: null,
    verificationTokenExpiry: null,
    oauthProvider: null,
    oauthId: null,
    oauthAccessToken: null,
    oauthRefreshToken: null,
    lastLoginAt: null,
    preferences: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  describe('Success Cases', () => {
    it('should successfully update fullName', async () => {
      const updatedUser = { ...mockUser, fullName: 'Jane Doe' };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ fullName: 'Jane Doe' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.fullName).toBe('Jane Doe');
      expect(response.body.data.user.passwordHash).toBeUndefined();

      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { fullName: 'Jane Doe' },
      });
    });

    it('should successfully update email (normalized)', async () => {
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      (prisma as MockedPrisma).user.findUnique
        .mockResolvedValueOnce(mockUser) // First call: fetch current user
        .mockResolvedValueOnce(null); // Second call: check email uniqueness

      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ email: '  NewEmail@Example.COM  ' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('newemail@example.com');

      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { email: 'newemail@example.com' },
      });
    });

    it('should successfully update avatarUrl', async () => {
      const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ avatarUrl: 'https://example.com/avatar.jpg' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should successfully update preferences', async () => {
      const updatedUser = { ...mockUser, preferences: { theme: 'dark', notifications: true } };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ preferences: { theme: 'dark', notifications: true } });

      expect(response.status).toBe(200);
      expect(response.body.data.user.preferences).toEqual({
        theme: 'dark',
        notifications: true,
      });
    });

    it('should successfully change password with valid currentPassword', async () => {
      const updatedUser = { ...mockUser, passwordHash: '$2b$12$newhash' };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);
      (authService.validatePassword as jest.MockedFunction<any>).mockReturnValue({
        valid: true,
        errors: [],
      });
      (authService.hashPassword as jest.MockedFunction<any>).mockResolvedValue('$2b$12$newhash');

      const response = await request(app).patch(`/users/${testUserId}`).send({
        password: 'NewSecurePass123!',
        currentPassword: 'OldSecurePass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(authService.verifyPassword).toHaveBeenCalledWith(
        'OldSecurePass123!',
        mockUser.passwordHash,
      );
      expect(authService.validatePassword).toHaveBeenCalledWith('NewSecurePass123!');
      expect(authService.hashPassword).toHaveBeenCalledWith('NewSecurePass123!');
      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { passwordHash: '$2b$12$newhash' },
      });
    });

    it('should successfully update multiple fields at once', async () => {
      const updatedUser = {
        ...mockUser,
        fullName: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark' },
      };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({
          fullName: 'Jane Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          preferences: { theme: 'dark' },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.fullName).toBe('Jane Doe');
      expect(response.body.data.user.avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('Authorization & Ownership', () => {
    it('should return 403 when trying to update another user', async () => {
      // Use a different valid UUID to test ownership check (v4 format)
      const otherUserId = '11111111-1111-4111-8111-111111111111';

      const response = await request(app)
        .patch(`/users/${otherUserId}`)
        .send({ fullName: 'Hacker' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('only update your own profile');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).patch('/users/invalid-uuid').send({ fullName: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid user ID format');
    });
  });

  describe('Password Change Validation', () => {
    it('should return 400 if password provided without currentPassword', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ password: 'NewPass123!' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Current password is required');

      expect(authService.hashPassword).not.toHaveBeenCalled();
    });

    it('should return 401 if currentPassword is incorrect', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(false);

      const response = await request(app).patch(`/users/${testUserId}`).send({
        password: 'NewPass123!',
        currentPassword: 'WrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Current password is incorrect');

      expect(authService.hashPassword).not.toHaveBeenCalled();
    });

    it('should return 400 if new password is weak', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);
      (authService.validatePassword as jest.MockedFunction<any>).mockReturnValue({
        valid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      const response = await request(app).patch(`/users/${testUserId}`).send({
        password: 'weakpass',
        currentPassword: 'OldPass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('does not meet requirements');
      expect(response.body.error.details).toHaveLength(1);

      expect(authService.hashPassword).not.toHaveBeenCalled();
    });

    it('should return 400 if user is OAuth-only (no passwordHash)', async () => {
      const oauthUser = { ...mockUser, passwordHash: null, oauthProvider: 'google' };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(oauthUser);

      const response = await request(app).patch(`/users/${testUserId}`).send({
        password: 'NewPass123!',
        currentPassword: 'OldPass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('OAuth-only accounts');

      expect(authService.verifyPassword).not.toHaveBeenCalled();
    });
  });

  describe('Email Validation', () => {
    it('should return 409 if email is already taken by another user', async () => {
      const existingUser = { ...mockUser, id: 'other-user-id', email: 'taken@example.com' };

      (prisma as MockedPrisma).user.findUnique
        .mockResolvedValueOnce(mockUser) // First call: fetch current user
        .mockResolvedValueOnce(existingUser); // Second call: check email uniqueness

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ email: 'taken@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already in use');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email (case-insensitive)', async () => {
      const updatedUser = { ...mockUser };

      (prisma as MockedPrisma).user.findUnique
        .mockResolvedValueOnce(mockUser) // First call: fetch current user
        .mockResolvedValueOnce(mockUser); // Second call: same user found (allowed)

      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ email: 'TEST@EXAMPLE.COM' });

      expect(response.status).toBe(200);

      expect((prisma as MockedPrisma).user.update).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if no fields provided', async () => {
      const response = await request(app).patch(`/users/${testUserId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('No fields to update');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 for invalid avatarUrl', async () => {
      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ avatarUrl: 'not-a-url' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 for empty fullName', async () => {
      const response = await request(app).patch(`/users/${testUserId}`).send({ fullName: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('should return 404 if user not found', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(null);

      const response = await request(app).patch(`/users/${testUserId}`).send({ fullName: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('User not found');
    });

    it('should return 404 if user is soft-deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(deletedUser);

      const response = await request(app).patch(`/users/${testUserId}`).send({ fullName: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('User not found');
    });

    it('should exclude passwordHash from response', async () => {
      const updatedUser = { ...mockUser, fullName: 'Jane Doe' };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch(`/users/${testUserId}`)
        .send({ fullName: 'Jane Doe' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.fullName).toBe('Jane Doe');
    });

    it('should set avatarUrl to null when provided as null', async () => {
      const updatedUser = { ...mockUser, avatarUrl: null };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).user.update.mockResolvedValue(updatedUser);

      const response = await request(app).patch(`/users/${testUserId}`).send({ avatarUrl: null });

      expect(response.status).toBe(200);
      expect(response.body.data.user.avatarUrl).toBeNull();

      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { avatarUrl: null },
      });
    });
  });
});

describe('DELETE /users/:id', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  const mockUser = {
    id: testUserId,
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    fullName: 'Test User',
    avatarUrl: null,
    role: 'user',
    isActive: true,
    emailVerified: false,
    emailVerifiedAt: null,
    verificationToken: null,
    verificationTokenExpiry: null,
    oauthProvider: null,
    oauthId: null,
    oauthAccessToken: null,
    oauthRefreshToken: null,
    lastLoginAt: null,
    preferences: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  describe('Success Cases', () => {
    it('should successfully soft-delete account with valid password', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).auditLog.create.mockResolvedValue({} as any);
      (prisma as MockedPrisma).user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);

      const response = await request(app).delete(`/users/${testUserId}`).send({
        password: 'MyPassword123!',
        reason: 'No longer need the service',
      });

      expect(response.status).toBe(204);

      // Verify audit log created
      expect((prisma as MockedPrisma).auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          action: 'user.delete',
          resourceType: 'user',
          resourceId: testUserId,
        }),
      });

      // Verify soft delete (update, not DELETE)
      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should allow OAuth-only user to delete without password', async () => {
      const oauthUser = {
        ...mockUser,
        passwordHash: null,
        oauthProvider: 'google',
      };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(oauthUser);
      (prisma as MockedPrisma).auditLog.create.mockResolvedValue({} as any);
      (prisma as MockedPrisma).user.update.mockResolvedValue({
        ...oauthUser,
        deletedAt: new Date(),
      });

      const response = await request(app).delete(`/users/${testUserId}`).send({
        reason: 'Switching to another provider',
      });

      expect(response.status).toBe(204);

      // Should NOT call verifyPassword for OAuth-only users
      expect(authService.verifyPassword).not.toHaveBeenCalled();

      // Verify soft delete
      expect((prisma as MockedPrisma).user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Lockout Prevention', () => {
    it('should reject deletion if user has no auth methods', async () => {
      const noAuthUser = {
        ...mockUser,
        passwordHash: null,
        oauthProvider: null,
      };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(noAuthUser);

      const response = await request(app).delete(`/users/${testUserId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain(
        'You must have at least one authentication method',
      );

      // Should NOT soft delete
      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });
  });

  describe('Authorization & Ownership', () => {
    it('should return 403 when trying to delete another user', async () => {
      // Use a different valid UUID to test ownership check (v4 format)
      const otherUserId = '11111111-1111-4111-8111-111111111111';

      const response = await request(app).delete(`/users/${otherUserId}`).send({
        password: 'MyPassword123!',
      });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('only delete your own account');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).delete('/users/invalid-uuid').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid user ID format');
    });
  });

  describe('Re-authentication Validation', () => {
    it('should return 400 if password user does not provide password', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).delete(`/users/${testUserId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Password is required');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(false);

      const response = await request(app).delete(`/users/${testUserId}`).send({
        password: 'WrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Incorrect password');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should return 404 if user not found', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(null);

      const response = await request(app).delete(`/users/${testUserId}`).send({
        password: 'MyPassword123!',
      });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('User not found');
    });

    it('should return 404 if user is already soft-deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };

      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(deletedUser);

      const response = await request(app).delete(`/users/${testUserId}`).send({
        password: 'MyPassword123!',
      });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('User not found');

      expect((prisma as MockedPrisma).user.update).not.toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log entry before deletion', async () => {
      (prisma as MockedPrisma).user.findUnique.mockResolvedValue(mockUser);
      (prisma as MockedPrisma).auditLog.create.mockResolvedValue({} as any);
      (prisma as MockedPrisma).user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });
      (authService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);

      const response = await request(app).delete(`/users/${testUserId}`).send({
        password: 'MyPassword123!',
        reason: 'Testing deletion',
      });

      expect(response.status).toBe(204);

      // Verify audit log created with correct data
      expect((prisma as MockedPrisma).auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          action: 'user.delete',
          resourceType: 'user',
          resourceId: testUserId,
          changes: expect.objectContaining({
            deletedAt: expect.any(String),
            reason: 'Testing deletion',
          }),
          metadata: expect.objectContaining({
            hasPassword: true,
            hasOAuth: false,
          }),
        }),
      });
    });
  });
});
