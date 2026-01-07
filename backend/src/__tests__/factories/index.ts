/**
 * Test Data Factories
 *
 * This module exports all test data factories for easy import.
 * Factories generate realistic test data for integration tests.
 *
 * Usage:
 * ```typescript
 * import { userFactory, agentFactory, workflowFactory } from '../factories';
 *
 * const user = await userFactory.create();
 * const agent = await agentFactory.create({ userId: user.id });
 * ```
 *
 * @module __tests__/factories
 */

export * from './user.factory';
export * from './agent.factory';
export * from './workflow.factory';
export * from './execution.factory';
export * from './template.factory';
