/**
 * Database Cleanup Utilities for Integration Tests
 *
 * This module provides utilities to clean the test database between tests,
 * ensuring test isolation and reproducible results.
 *
 * IMPORTANT: These utilities delete data from the database!
 * Only use with a dedicated test database.
 *
 * Usage:
 * ```typescript
 * import { cleanDatabase, cleanTable } from './helpers/dbCleanup';
 *
 * beforeEach(async () => {
 *   await cleanDatabase();
 * });
 * ```
 *
 * @module __tests__/integration/helpers/dbCleanup
 */

import { PrismaClient } from '@prisma/client';
import { getTestPrisma, isTestDatabaseAvailable } from '../setup';

// ============================================================================
// Types
// ============================================================================

/**
 * Table names in the database that can be cleaned
 * Order matters for foreign key constraints (delete children before parents)
 */
const TABLES_IN_DELETE_ORDER = [
  'execution_logs', // Depends on executions, workflow_steps
  'executions', // Depends on workflows, users
  'workflow_steps', // Depends on workflows, agents
  'deployments', // Depends on workflows, agents, users
  'api_keys', // Depends on users
  'audit_logs', // Depends on users
  'workflows', // Depends on users
  'agents', // Depends on users
  'templates', // Depends on users
  'users', // Base table
] as const;

type TableName = (typeof TABLES_IN_DELETE_ORDER)[number];

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean all tables in the database
 *
 * This function deletes all data from all tables in the correct order
 * to respect foreign key constraints.
 *
 * @throws Error if database is not available
 *
 * Usage:
 * ```typescript
 * beforeEach(async () => {
 *   await cleanDatabase();
 * });
 * ```
 */
export const cleanDatabase = async (): Promise<void> => {
  const prisma = getTestPrisma();

  if (!prisma) {
    throw new Error('Test database is not available. Cannot clean database.');
  }

  // Delete from all tables in order (respecting foreign keys)
  for (const table of TABLES_IN_DELETE_ORDER) {
    await cleanTableByName(prisma, table);
  }
};

/**
 * Clean a specific table
 *
 * @param prisma - Prisma client instance
 * @param tableName - Name of the table to clean
 *
 * Usage:
 * ```typescript
 * await cleanTable('users');
 * ```
 */
const cleanTableByName = async (prisma: PrismaClient, tableName: TableName): Promise<void> => {
  try {
    switch (tableName) {
      case 'execution_logs':
        await prisma.executionLog.deleteMany();
        break;
      case 'executions':
        await prisma.execution.deleteMany();
        break;
      case 'workflow_steps':
        await prisma.workflowStep.deleteMany();
        break;
      case 'deployments':
        await prisma.deployment.deleteMany();
        break;
      case 'api_keys':
        await prisma.apiKey.deleteMany();
        break;
      case 'audit_logs':
        await prisma.auditLog.deleteMany();
        break;
      case 'workflows':
        await prisma.workflow.deleteMany();
        break;
      case 'agents':
        await prisma.agent.deleteMany();
        break;
      case 'templates':
        await prisma.template.deleteMany();
        break;
      case 'users':
        await prisma.user.deleteMany();
        break;
    }
  } catch (error) {
    console.error(`[DB Cleanup] Failed to clean table ${tableName}:`, error);
    throw error;
  }
};

/**
 * Clean specific tables (public API)
 *
 * @param tables - Array of table names to clean
 *
 * Usage:
 * ```typescript
 * await cleanTables(['users', 'agents']);
 * ```
 */
export const cleanTables = async (tables: TableName[]): Promise<void> => {
  const prisma = getTestPrisma();

  if (!prisma) {
    throw new Error('Test database is not available. Cannot clean tables.');
  }

  // Sort tables by delete order to respect foreign keys
  const sortedTables = tables.sort(
    (a, b) => TABLES_IN_DELETE_ORDER.indexOf(a) - TABLES_IN_DELETE_ORDER.indexOf(b),
  );

  for (const table of sortedTables) {
    await cleanTableByName(prisma, table);
  }
};

/**
 * Clean only user-related data (users, agents, workflows, etc.)
 * Useful when you want to preserve templates or other reference data
 *
 * Usage:
 * ```typescript
 * beforeEach(async () => {
 *   await cleanUserData();
 * });
 * ```
 */
export const cleanUserData = async (): Promise<void> => {
  await cleanTables([
    'execution_logs',
    'executions',
    'workflow_steps',
    'deployments',
    'api_keys',
    'audit_logs',
    'workflows',
    'agents',
    'users',
  ]);
};

// ============================================================================
// Reset Sequences
// ============================================================================

/**
 * Reset all sequences in the database
 *
 * Note: In PostgreSQL with UUID primary keys (as used in this schema),
 * sequences are typically only used for auto-increment columns.
 * This schema uses UUIDs, so this function is primarily for reference
 * or if sequences are added later.
 *
 * For UUID-based tables, this function is essentially a no-op but is
 * included for completeness and future compatibility.
 *
 * Usage:
 * ```typescript
 * await resetSequences();
 * ```
 */
export const resetSequences = async (): Promise<void> => {
  const prisma = getTestPrisma();

  if (!prisma) {
    throw new Error('Test database is not available. Cannot reset sequences.');
  }

  // The current schema uses UUIDs for all primary keys,
  // so there are no sequences to reset.
  // This function is included for API completeness.

  // If you add tables with SERIAL/BIGSERIAL columns, you can reset them:
  // await prisma.$executeRaw`ALTER SEQUENCE tablename_id_seq RESTART WITH 1`;

  // For now, just log that no sequences need resetting
  if (process.env.DEBUG_TESTS) {
    console.log('[DB Cleanup] No sequences to reset (schema uses UUIDs)');
  }
};

// ============================================================================
// Transaction-based Cleanup
// ============================================================================

/**
 * Clean database within a transaction
 *
 * This is faster than individual deletes but requires proper
 * ordering due to foreign key constraints.
 *
 * Usage:
 * ```typescript
 * await cleanDatabaseTransaction();
 * ```
 */
export const cleanDatabaseTransaction = async (): Promise<void> => {
  const prisma = getTestPrisma();

  if (!prisma) {
    throw new Error('Test database is not available. Cannot clean database.');
  }

  await prisma.$transaction(async (tx) => {
    // Delete in order of foreign key dependencies
    await tx.executionLog.deleteMany();
    await tx.execution.deleteMany();
    await tx.workflowStep.deleteMany();
    await tx.deployment.deleteMany();
    await tx.apiKey.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.workflow.deleteMany();
    await tx.agent.deleteMany();
    await tx.template.deleteMany();
    await tx.user.deleteMany();
  });
};

// ============================================================================
// Truncate Tables (Faster but requires CASCADE or proper ordering)
// ============================================================================

/**
 * Truncate all tables using raw SQL
 *
 * This is the fastest way to clean the database but requires
 * CASCADE or disabling foreign key checks.
 *
 * NOTE: This uses TRUNCATE with CASCADE which is PostgreSQL-specific.
 * Use cleanDatabase() for a more portable solution.
 *
 * Usage:
 * ```typescript
 * await truncateAllTables();
 * ```
 */
export const truncateAllTables = async (): Promise<void> => {
  const prisma = getTestPrisma();

  if (!prisma) {
    throw new Error('Test database is not available. Cannot truncate tables.');
  }

  try {
    // Use TRUNCATE with CASCADE to handle foreign keys
    // Note: TRUNCATE is faster than DELETE but requires CASCADE for FK tables
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        execution_logs,
        executions,
        workflow_steps,
        deployments,
        api_keys,
        audit_logs,
        workflows,
        agents,
        templates,
        users
      CASCADE
    `);
  } catch (error) {
    // If TRUNCATE fails (e.g., permissions), fall back to deleteMany
    console.warn('[DB Cleanup] TRUNCATE failed, falling back to deleteMany:', error);
    await cleanDatabaseTransaction();
  }
};

// ============================================================================
// Conditional Cleanup
// ============================================================================

/**
 * Clean database only if available
 *
 * This is a safe wrapper that doesn't throw if the database is unavailable.
 * Useful in beforeEach hooks where you want tests to skip rather than fail.
 *
 * @returns True if cleanup was performed, false if skipped
 *
 * Usage:
 * ```typescript
 * beforeEach(async () => {
 *   await cleanDatabaseIfAvailable();
 * });
 * ```
 */
export const cleanDatabaseIfAvailable = async (): Promise<boolean> => {
  if (!isTestDatabaseAvailable()) {
    if (process.env.DEBUG_TESTS) {
      console.log('[DB Cleanup] Skipping - database not available');
    }
    return false;
  }

  await cleanDatabase();
  return true;
};

// ============================================================================
// Exports
// ============================================================================

export { TABLES_IN_DELETE_ORDER };
export type { TableName };
