/**
 * E2E Test Helpers Index
 *
 * This module exports all E2E test helpers from a single entry point
 * for convenient importing in test files.
 *
 * Usage:
 * ```typescript
 * import {
 *   ApiClient,
 *   createApiClient,
 *   AuthHelper,
 *   createAuthHelper,
 *   assertOk,
 *   assertCreated,
 *   generateAgentData,
 *   generateWorkflowData,
 * } from './helpers';
 * ```
 *
 * @module e2e/helpers
 */

// ============================================================================
// API Client
// ============================================================================

export {
  ApiClient,
  createApiClient,
  type ApiResponse,
  type ApiErrorResponse,
  type RequestOptions,
  type ParsedResponse,
} from './api-client';

// ============================================================================
// Authentication
// ============================================================================

export {
  AuthHelper,
  createAuthHelper,
  generateTestEmail,
  generateTestCredentials,
  DEFAULT_TEST_PASSWORD,
  type RegisterInput,
  type LoginInput,
  type AuthTokens,
  type AuthUser,
  type AuthResponse,
  type TestUserCredentials,
} from './auth';

// ============================================================================
// Assertions
// ============================================================================

export {
  // Status assertions
  assertOk,
  assertCreated,
  assertNoContent,
  assertBadRequest,
  assertUnauthorized,
  assertForbidden,
  assertNotFound,
  assertConflict,
  assertUnprocessable,
  assertServerError,
  // Data assertions
  assertHasData,
  assertDataHasFields,
  assertDataMatches,
  assertHasUuid,
  // Error assertions
  assertHasError,
  assertErrorCode,
  assertErrorContains,
  assertValidationError,
  // Pagination assertions
  assertHasPagination,
  assertPaginationValues,
  // Type assertions
  assertIsoDate,
  assertEmail,
  assertUuid,
  // Performance assertions
  assertResponseTime,
  // Array assertions
  assertArrayMinLength,
  assertArrayLength,
  // Types
  type PaginationMeta,
  type PaginatedData,
} from './assertions';

// ============================================================================
// Test Data Factories
// ============================================================================

export {
  // Agent factories
  generateAgentData,
  generateCodeAgent,
  generateApiAgent,
  generateLlmAgent,
  generateDataAgent,
  // Step factories
  generateStepData,
  generateAgentStep,
  generateConditionStep,
  generateWaitStep,
  // Workflow factories
  generateWorkflowData,
  generateWorkflowWithSteps,
  generateScheduledWorkflow,
  // Execution factories
  generateExecutionInput,
  // Bulk factories
  generateMultipleAgents,
  generateMultipleWorkflows,
  // Utilities
  randomString,
  randomItem,
  randomNumber,
  resetCounter,
  // Types
  type AgentType,
  type AgentStatus,
  type WorkflowStatus,
  type WorkflowStepType,
  type ErrorHandling,
  type TriggerType,
  type AgentInput,
  type WorkflowStepInput,
  type WorkflowInput,
  type ExecutionInput,
} from './test-data';

// ============================================================================
// Default Export
// ============================================================================

/**
 * Combined helper object for convenient access
 */
export default {
  // Re-export for backwards compatibility
};
