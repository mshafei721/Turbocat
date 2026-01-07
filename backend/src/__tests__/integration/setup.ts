/**
 * Integration Test Setup
 *
 * This file configures the test environment for integration tests.
 * It handles test database connection, setup, and teardown.
 *
 * Environment Variables:
 * - TEST_DATABASE_URL: Connection URL for the test database
 *   (falls back to DATABASE_URL if not set)
 * - NODE_ENV: Should be 'test' when running integration tests
 *
 * Usage:
 * - Import this setup in your integration test files
 * - Use `getTestPrisma()` to get a database client for testing
 * - Use `isTestDatabaseAvailable()` to conditionally skip tests
 *
 * @module __tests__/integration/setup
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// Test Environment Configuration
// ============================================================================

// Force test environment
process.env.NODE_ENV = 'test';

// Set test-specific JWT secrets
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-integration-tests-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-integration-tests-min-32-chars';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Set test encryption key
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-min-for-tests';

// ============================================================================
// Test Database Configuration
// ============================================================================

/**
 * Test database URL priority:
 * 1. TEST_DATABASE_URL environment variable (recommended)
 * 2. DATABASE_URL environment variable (fallback)
 *
 * IMPORTANT: It is strongly recommended to use a separate test database
 * to avoid accidentally modifying development or production data.
 *
 * The test database can be:
 * - A separate Supabase project for testing
 * - A local PostgreSQL instance
 * - A Docker PostgreSQL container
 */
const getTestDatabaseUrl = (): string | undefined => {
  // Prefer TEST_DATABASE_URL for isolation
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  // Fallback to DATABASE_URL with a warning
  if (process.env.DATABASE_URL) {
    console.warn('[Integration Tests] WARNING: Using DATABASE_URL instead of TEST_DATABASE_URL.');
    console.warn('[Integration Tests] It is recommended to use a separate test database.');
    return process.env.DATABASE_URL;
  }

  return undefined;
};

// ============================================================================
// Test Prisma Client
// ============================================================================

let testPrisma: PrismaClient | null = null;
let testDatabaseAvailable = false;
let testDatabaseError: Error | null = null;

/**
 * Initialize the test Prisma client
 * This should be called once before running integration tests
 */
const initializeTestPrisma = async (): Promise<void> => {
  const databaseUrl = getTestDatabaseUrl();

  if (!databaseUrl) {
    testDatabaseAvailable = false;
    testDatabaseError = new Error(
      'No database URL configured. Set TEST_DATABASE_URL or DATABASE_URL environment variable.',
    );
    console.warn('[Integration Tests] No database URL configured.');
    console.warn('[Integration Tests] Integration tests will be skipped.');
    return;
  }

  try {
    // Set the DATABASE_URL for Prisma to use (Prisma reads from env)
    process.env.DATABASE_URL = databaseUrl;

    testPrisma = new PrismaClient({
      log: process.env.DEBUG_TESTS ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });

    // Test the connection
    await testPrisma.$connect();
    await testPrisma.$queryRaw`SELECT 1`;

    testDatabaseAvailable = true;
    console.log('[Integration Tests] Test database connected successfully.');
  } catch (error) {
    testDatabaseAvailable = false;
    testDatabaseError = error instanceof Error ? error : new Error(String(error));
    console.warn(
      '[Integration Tests] Failed to connect to test database:',
      testDatabaseError.message,
    );
    console.warn('[Integration Tests] Integration tests requiring database will be skipped.');

    // Clean up failed client
    if (testPrisma) {
      try {
        await testPrisma.$disconnect();
      } catch {
        // Ignore disconnect errors
      }
      testPrisma = null;
    }
  }
};

/**
 * Get the test Prisma client
 *
 * @returns The test Prisma client or null if not available
 *
 * Usage:
 * ```typescript
 * const prisma = getTestPrisma();
 * if (!prisma) {
 *   console.log('Skipping test - database not available');
 *   return;
 * }
 * const users = await prisma.user.findMany();
 * ```
 */
export const getTestPrisma = (): PrismaClient | null => {
  return testPrisma;
};

/**
 * Check if the test database is available
 *
 * @returns True if the test database is connected and ready
 *
 * Usage:
 * ```typescript
 * describe.skipIf(!isTestDatabaseAvailable())('Database Tests', () => {
 *   // Tests that require database...
 * });
 * ```
 */
export const isTestDatabaseAvailable = (): boolean => {
  return testDatabaseAvailable;
};

/**
 * Get the test database initialization error
 *
 * @returns The error that occurred during database initialization, or null
 */
export const getTestDatabaseError = (): Error | null => {
  return testDatabaseError;
};

/**
 * Disconnect the test database
 * This should be called after all integration tests complete
 */
export const disconnectTestDatabase = async (): Promise<void> => {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
    testDatabaseAvailable = false;
    console.log('[Integration Tests] Test database disconnected.');
  }
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Skip test if database is not available
 * Use this to conditionally skip tests that require database
 *
 * @param testName - Name of the test being skipped
 *
 * Usage:
 * ```typescript
 * it('should create a user', async () => {
 *   if (skipIfNoDatabaseAvailable('should create a user')) return;
 *   // Test code...
 * });
 * ```
 */
export const skipIfNoDatabaseAvailable = (testName: string): boolean => {
  if (!testDatabaseAvailable) {
    console.log(`[Integration Tests] Skipping test: ${testName} - Database not available`);
    return true;
  }
  return false;
};

/**
 * Create a describe block that skips if database is not available
 *
 * Usage:
 * ```typescript
 * describeWithDatabase('User API', () => {
 *   it('should create a user', async () => {
 *     // This test only runs if database is available
 *   });
 * });
 * ```
 */
export const describeWithDatabase = (name: string, fn: () => void): void => {
  if (testDatabaseAvailable) {
    describe(name, fn);
  } else {
    describe.skip(`${name} (database not available)`, fn);
  }
};

/**
 * Create an it block that skips if database is not available
 *
 * Usage:
 * ```typescript
 * itWithDatabase('should query users', async () => {
 *   const prisma = getTestPrisma()!;
 *   const users = await prisma.user.findMany();
 *   expect(users).toBeInstanceOf(Array);
 * });
 * ```
 */
export const itWithDatabase = (
  name: string,
  fn: () => Promise<void> | void,
  timeout?: number,
): void => {
  if (testDatabaseAvailable) {
    it(
      name,
      async () => {
        await fn();
      },
      timeout,
    );
  } else {
    it.skip(`${name} (database not available)`, () => {});
  }
};

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

/**
 * Setup hook to run before all integration tests
 * Initializes the test database connection
 */
export const setupIntegrationTests = async (): Promise<void> => {
  await initializeTestPrisma();
};

/**
 * Teardown hook to run after all integration tests
 * Disconnects from the test database
 */
export const teardownIntegrationTests = async (): Promise<void> => {
  await disconnectTestDatabase();
};

// ============================================================================
// Global Setup (when file is imported)
// ============================================================================

// Note: The actual initialization happens in beforeAll hooks in test files
// or in the Jest global setup file. This prevents connection issues when
// the file is just imported for type checking.

// ============================================================================
// Exports
// ============================================================================

export { initializeTestPrisma, getTestDatabaseUrl };

// Re-export types that might be needed
export type { PrismaClient };
