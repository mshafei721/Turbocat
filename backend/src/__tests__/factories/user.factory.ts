/**
 * User Factory
 *
 * Factory for creating test user data and database records.
 * Supports both raw data generation and database persistence.
 *
 * Usage:
 * ```typescript
 * // Generate raw data (no database)
 * const userData = userFactory.build();
 *
 * // Create in database
 * const user = await userFactory.create();
 *
 * // Create with custom attributes
 * const admin = await userFactory.create({ role: UserRole.ADMIN });
 *
 * // Create multiple users
 * const users = await userFactory.createMany(5);
 * ```
 *
 * @module __tests__/factories/user.factory
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { User, UserRole, Prisma } from '@prisma/client';
import { getTestPrisma } from '../integration/setup';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for building user data
 */
export interface UserFactoryInput {
  id?: string;
  email?: string;
  passwordHash?: string;
  fullName?: string;
  avatarUrl?: string | null;
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  preferences?: Prisma.InputJsonValue;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Raw user data without database-generated fields
 */
export interface UserBuildData {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  preferences: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ============================================================================
// Helpers
// ============================================================================

let userCounter = 0;

/**
 * Generate a unique email for testing
 */
const generateEmail = (): string => {
  userCounter += 1;
  return `test-user-${userCounter}-${Date.now()}@example.com`;
};

/**
 * Generate a random full name
 */
const generateFullName = (): string => {
  const firstNames = ['John', 'Jane', 'Alex', 'Sam', 'Chris', 'Pat', 'Morgan', 'Taylor'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

/**
 * Default password for test users
 * Use testUserPassword to access the plain text password
 */
const DEFAULT_PASSWORD = 'TestPassword123!';
let cachedPasswordHash: string | null = null;

/**
 * Get the hashed default password
 * Caches the hash to avoid repeated bcrypt operations
 */
const getDefaultPasswordHash = async (): Promise<string> => {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  }
  return cachedPasswordHash;
};

/**
 * Hash a password for testing
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Default test user password (plain text)
 * Use this in tests to authenticate
 */
export const testUserPassword = DEFAULT_PASSWORD;

// ============================================================================
// Factory
// ============================================================================

/**
 * User Factory
 *
 * Provides methods to build and create user test data
 */
export const userFactory = {
  /**
   * Build user data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns User data object
   *
   * Usage:
   * ```typescript
   * const userData = userFactory.build();
   * const adminData = userFactory.build({ role: UserRole.ADMIN });
   * ```
   */
  build: (overrides: UserFactoryInput = {}): UserBuildData => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      email: overrides.email ?? generateEmail(),
      passwordHash: overrides.passwordHash ?? '$2b$10$placeholder', // Placeholder - use async methods for real hash
      fullName: overrides.fullName ?? generateFullName(),
      avatarUrl: overrides.avatarUrl ?? null,
      role: overrides.role ?? UserRole.USER,
      isActive: overrides.isActive ?? true,
      emailVerified: overrides.emailVerified ?? false,
      emailVerifiedAt: overrides.emailVerifiedAt ?? null,
      lastLoginAt: overrides.lastLoginAt ?? null,
      preferences: overrides.preferences ?? {},
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      deletedAt: overrides.deletedAt ?? null,
    };
  },

  /**
   * Build user data with async password hashing
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to user data object
   *
   * Usage:
   * ```typescript
   * const userData = await userFactory.buildAsync();
   * ```
   */
  buildAsync: async (overrides: UserFactoryInput = {}): Promise<UserBuildData> => {
    const data = userFactory.build(overrides);
    data.passwordHash = overrides.passwordHash ?? (await getDefaultPasswordHash());
    return data;
  },

  /**
   * Create user in database
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created user
   * @throws Error if database is not available
   *
   * Usage:
   * ```typescript
   * const user = await userFactory.create();
   * const admin = await userFactory.create({ role: UserRole.ADMIN });
   * ```
   */
  create: async (overrides: UserFactoryInput = {}): Promise<User> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create user.');
    }

    const data = await userFactory.buildAsync(overrides);

    return prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role: data.role,
        isActive: data.isActive,
        emailVerified: data.emailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        lastLoginAt: data.lastLoginAt,
        preferences: data.preferences,
      },
    });
  },

  /**
   * Create multiple users in database
   *
   * @param count - Number of users to create
   * @param overrides - Optional field overrides (applied to all users)
   * @returns Promise resolving to array of created users
   *
   * Usage:
   * ```typescript
   * const users = await userFactory.createMany(5);
   * const admins = await userFactory.createMany(3, { role: UserRole.ADMIN });
   * ```
   */
  createMany: async (count: number, overrides: UserFactoryInput = {}): Promise<User[]> => {
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const user = await userFactory.create(overrides);
      users.push(user);
    }

    return users;
  },

  /**
   * Create a verified user (email verified)
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created user
   *
   * Usage:
   * ```typescript
   * const verifiedUser = await userFactory.createVerified();
   * ```
   */
  createVerified: async (overrides: UserFactoryInput = {}): Promise<User> => {
    return userFactory.create({
      ...overrides,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  },

  /**
   * Create an admin user
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created admin user
   *
   * Usage:
   * ```typescript
   * const admin = await userFactory.createAdmin();
   * ```
   */
  createAdmin: async (overrides: UserFactoryInput = {}): Promise<User> => {
    return userFactory.create({
      ...overrides,
      role: UserRole.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  },

  /**
   * Create an inactive user
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created inactive user
   *
   * Usage:
   * ```typescript
   * const inactiveUser = await userFactory.createInactive();
   * ```
   */
  createInactive: async (overrides: UserFactoryInput = {}): Promise<User> => {
    return userFactory.create({
      ...overrides,
      isActive: false,
    });
  },
};

// ============================================================================
// Reset Counter
// ============================================================================

/**
 * Reset the user counter
 * Call this in beforeEach to ensure unique emails across tests
 */
export const resetUserCounter = (): void => {
  userCounter = 0;
};

// Re-export UserRole for convenience
export { UserRole };
