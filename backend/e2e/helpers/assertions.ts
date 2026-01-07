/**
 * Assertion Helpers for E2E Tests
 *
 * This module provides custom assertion utilities for validating
 * API responses, data structures, and common patterns in E2E tests.
 *
 * Features:
 * - Response status assertions
 * - Response body structure validation
 * - Error response validation
 * - Data type assertions
 * - Pagination response validation
 *
 * Usage:
 * ```typescript
 * import { assertOk, assertCreated, assertValidationError } from './assertions';
 *
 * assertOk(response);
 * assertCreated(response);
 * assertHasData(response, ['id', 'name']);
 * ```
 *
 * @module e2e/helpers/assertions
 */

import { expect } from '@playwright/test';
import { ParsedResponse, ApiResponse } from './api-client';

// ============================================================================
// Types
// ============================================================================

/**
 * Pagination metadata structure
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response data
 */
export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Status Code Assertions
// ============================================================================

/**
 * Assert that response has 200 OK status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertOk<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 200 OK, got ${response.status}`,
  ).toBe(200);
  expect(response.body.success).toBe(true);
}

/**
 * Assert that response has 201 Created status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertCreated<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 201 Created, got ${response.status}`,
  ).toBe(201);
  expect(response.body.success).toBe(true);
}

/**
 * Assert that response has 204 No Content status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertNoContent<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 204 No Content, got ${response.status}`,
  ).toBe(204);
}

/**
 * Assert that response has 400 Bad Request status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertBadRequest<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 400 Bad Request, got ${response.status}`,
  ).toBe(400);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 401 Unauthorized status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertUnauthorized<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 401 Unauthorized, got ${response.status}`,
  ).toBe(401);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 403 Forbidden status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertForbidden<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 403 Forbidden, got ${response.status}`,
  ).toBe(403);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 404 Not Found status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertNotFound<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 404 Not Found, got ${response.status}`,
  ).toBe(404);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 409 Conflict status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertConflict<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 409 Conflict, got ${response.status}`,
  ).toBe(409);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 422 Unprocessable Entity status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertUnprocessable<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 422 Unprocessable Entity, got ${response.status}`,
  ).toBe(422);
  expect(response.body.success).toBe(false);
}

/**
 * Assert that response has 500 Internal Server Error status
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertServerError<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.status,
    message || `Expected 500 Internal Server Error, got ${response.status}`,
  ).toBe(500);
  expect(response.body.success).toBe(false);
}

// ============================================================================
// Response Body Assertions
// ============================================================================

/**
 * Assert that response has data
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertHasData<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(
    response.body.data,
    message || 'Expected response to have data',
  ).toBeDefined();
}

/**
 * Assert that response data has specific fields
 *
 * @param response - Parsed API response
 * @param fields - Array of field names to check
 */
export function assertDataHasFields<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  fields: string[],
): void {
  assertHasData(response);
  const data = response.body.data as Record<string, unknown>;

  for (const field of fields) {
    expect(data, `Expected response data to have field "${field}"`).toHaveProperty(field);
  }
}

/**
 * Assert that response data matches expected values
 *
 * @param response - Parsed API response
 * @param expected - Expected partial data
 */
export function assertDataMatches<T>(
  response: ParsedResponse<T>,
  expected: Partial<T>,
): void {
  assertHasData(response);
  expect(response.body.data).toMatchObject(expected as Record<string, unknown>);
}

/**
 * Assert that response has a valid UUID in data
 *
 * @param response - Parsed API response
 * @param field - Field name containing the UUID (default: 'id')
 */
export function assertHasUuid<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  field: string = 'id',
): void {
  assertHasData(response);
  const data = response.body.data as Record<string, unknown>;
  const uuid = data[field] as string;

  expect(uuid, `Expected ${field} to be defined`).toBeDefined();
  expect(uuid, `Expected ${field} to be a valid UUID`).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
}

// ============================================================================
// Error Response Assertions
// ============================================================================

/**
 * Assert that response has an error
 *
 * @param response - Parsed API response
 * @param message - Optional custom message
 */
export function assertHasError<T>(
  response: ParsedResponse<T>,
  message?: string,
): void {
  expect(response.body.success).toBe(false);
  expect(
    response.body.error,
    message || 'Expected response to have error',
  ).toBeDefined();
}

/**
 * Assert that error has a specific code
 *
 * @param response - Parsed API response
 * @param expectedCode - Expected error code
 */
export function assertErrorCode<T>(
  response: ParsedResponse<T>,
  expectedCode: string,
): void {
  assertHasError(response);
  expect(response.body.error?.code).toBe(expectedCode);
}

/**
 * Assert that error message contains text
 *
 * @param response - Parsed API response
 * @param text - Text to search for in error message
 */
export function assertErrorContains<T>(
  response: ParsedResponse<T>,
  text: string,
): void {
  assertHasError(response);
  expect(response.body.error?.message?.toLowerCase()).toContain(text.toLowerCase());
}

/**
 * Assert validation error with specific field errors
 *
 * @param response - Parsed API response
 * @param fieldErrors - Expected field errors (field name -> error message substring)
 */
export function assertValidationError<T>(
  response: ParsedResponse<T>,
  fieldErrors?: Record<string, string>,
): void {
  expect(response.status).toBe(400);
  assertHasError(response);
  expect(response.body.error?.code).toBe('VALIDATION_ERROR');

  if (fieldErrors && response.body.error?.details) {
    const details = response.body.error.details as Array<{ field: string; message: string }>;

    for (const [field, expectedMessage] of Object.entries(fieldErrors)) {
      const fieldError = details.find((d) => d.field === field);
      expect(fieldError, `Expected validation error for field "${field}"`).toBeDefined();
      expect(fieldError?.message?.toLowerCase()).toContain(expectedMessage.toLowerCase());
    }
  }
}

// ============================================================================
// Pagination Assertions
// ============================================================================

/**
 * Assert that response has valid pagination
 *
 * @param response - Parsed API response
 * @param dataKey - Key containing the array data (e.g., 'agents', 'workflows')
 */
export function assertHasPagination<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  dataKey: string,
): void {
  assertHasData(response);
  const data = response.body.data as Record<string, unknown>;

  expect(data, `Expected response to have "${dataKey}" array`).toHaveProperty(dataKey);
  expect(Array.isArray(data[dataKey]), `Expected "${dataKey}" to be an array`).toBe(true);

  expect(data, 'Expected response to have pagination').toHaveProperty('pagination');
  const pagination = data['pagination'] as PaginationMeta;

  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('pageSize');
  expect(pagination).toHaveProperty('totalItems');
  expect(pagination).toHaveProperty('totalPages');
  expect(pagination).toHaveProperty('hasNextPage');
  expect(pagination).toHaveProperty('hasPreviousPage');

  expect(typeof pagination.page).toBe('number');
  expect(typeof pagination.pageSize).toBe('number');
  expect(typeof pagination.totalItems).toBe('number');
  expect(typeof pagination.totalPages).toBe('number');
  expect(typeof pagination.hasNextPage).toBe('boolean');
  expect(typeof pagination.hasPreviousPage).toBe('boolean');
}

/**
 * Assert pagination values
 *
 * @param response - Parsed API response
 * @param expected - Expected pagination values
 */
export function assertPaginationValues<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  expected: Partial<PaginationMeta>,
): void {
  const data = response.body.data as Record<string, unknown>;
  const pagination = data['pagination'] as PaginationMeta;

  if (expected.page !== undefined) {
    expect(pagination.page).toBe(expected.page);
  }
  if (expected.pageSize !== undefined) {
    expect(pagination.pageSize).toBe(expected.pageSize);
  }
  if (expected.totalItems !== undefined) {
    expect(pagination.totalItems).toBe(expected.totalItems);
  }
  if (expected.totalPages !== undefined) {
    expect(pagination.totalPages).toBe(expected.totalPages);
  }
  if (expected.hasNextPage !== undefined) {
    expect(pagination.hasNextPage).toBe(expected.hasNextPage);
  }
  if (expected.hasPreviousPage !== undefined) {
    expect(pagination.hasPreviousPage).toBe(expected.hasPreviousPage);
  }
}

// ============================================================================
// Data Type Assertions
// ============================================================================

/**
 * Assert that a value is a valid ISO date string
 *
 * @param value - Value to check
 * @param fieldName - Field name for error message
 */
export function assertIsoDate(value: unknown, fieldName: string = 'date'): void {
  expect(typeof value, `Expected ${fieldName} to be a string`).toBe('string');
  const date = new Date(value as string);
  expect(date.toString(), `Expected ${fieldName} to be a valid date`).not.toBe('Invalid Date');
}

/**
 * Assert that a value is a valid email format
 *
 * @param value - Value to check
 * @param fieldName - Field name for error message
 */
export function assertEmail(value: unknown, fieldName: string = 'email'): void {
  expect(typeof value, `Expected ${fieldName} to be a string`).toBe('string');
  expect(value as string, `Expected ${fieldName} to be a valid email`).toMatch(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  );
}

/**
 * Assert that a value is a valid UUID format
 *
 * @param value - Value to check
 * @param fieldName - Field name for error message
 */
export function assertUuid(value: unknown, fieldName: string = 'id'): void {
  expect(typeof value, `Expected ${fieldName} to be a string`).toBe('string');
  expect(value as string, `Expected ${fieldName} to be a valid UUID`).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
}

// ============================================================================
// Response Time Assertions
// ============================================================================

/**
 * Assert that response time is within acceptable limits
 *
 * @param startTime - Request start time (Date.now())
 * @param maxMs - Maximum acceptable response time in milliseconds
 * @param message - Optional custom message
 */
export function assertResponseTime(
  startTime: number,
  maxMs: number,
  message?: string,
): void {
  const elapsed = Date.now() - startTime;
  expect(
    elapsed,
    message || `Expected response time under ${maxMs}ms, got ${elapsed}ms`,
  ).toBeLessThanOrEqual(maxMs);
}

// ============================================================================
// Array Assertions
// ============================================================================

/**
 * Assert that response data contains array with minimum length
 *
 * @param response - Parsed API response
 * @param arrayKey - Key containing the array
 * @param minLength - Minimum expected length
 */
export function assertArrayMinLength<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  arrayKey: string,
  minLength: number,
): void {
  assertHasData(response);
  const data = response.body.data as Record<string, unknown>;
  const array = data[arrayKey];

  expect(Array.isArray(array), `Expected ${arrayKey} to be an array`).toBe(true);
  expect((array as unknown[]).length, `Expected ${arrayKey} to have at least ${minLength} items`).toBeGreaterThanOrEqual(minLength);
}

/**
 * Assert that response data contains array with exact length
 *
 * @param response - Parsed API response
 * @param arrayKey - Key containing the array
 * @param length - Expected length
 */
export function assertArrayLength<T extends Record<string, unknown>>(
  response: ParsedResponse<T>,
  arrayKey: string,
  length: number,
): void {
  assertHasData(response);
  const data = response.body.data as Record<string, unknown>;
  const array = data[arrayKey];

  expect(Array.isArray(array), `Expected ${arrayKey} to be an array`).toBe(true);
  expect((array as unknown[]).length, `Expected ${arrayKey} to have ${length} items`).toBe(length);
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
  assertHasData,
  assertDataHasFields,
  assertDataMatches,
  assertHasUuid,
  assertHasError,
  assertErrorCode,
  assertErrorContains,
  assertValidationError,
  assertHasPagination,
  assertPaginationValues,
  assertIsoDate,
  assertEmail,
  assertUuid,
  assertResponseTime,
  assertArrayMinLength,
  assertArrayLength,
};
