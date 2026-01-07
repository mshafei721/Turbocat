/**
 * API Client Helper for E2E Tests
 *
 * This module provides a typed API client for making requests
 * to the Turbocat backend during E2E tests. It wraps Playwright's
 * request context with convenience methods and type safety.
 *
 * Features:
 * - Typed request/response handling
 * - Automatic JSON serialization
 * - Built-in error handling
 * - Authentication support
 * - Request logging (optional)
 *
 * Usage:
 * ```typescript
 * const client = new ApiClient(request, '/api/v1');
 * const response = await client.get('/health');
 * const data = await client.post('/auth/login', { email, password });
 * ```
 *
 * @module e2e/helpers/api-client
 */

import { APIRequestContext, APIResponse } from '@playwright/test';

// ============================================================================
// Types
// ============================================================================

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  requestId?: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

/**
 * Response wrapper with parsed data
 */
export interface ParsedResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: ApiResponse<T>;
  raw: APIResponse;
  ok: boolean;
}

// ============================================================================
// API Client Class
// ============================================================================

/**
 * API Client for E2E Testing
 *
 * Provides a clean interface for making API requests during E2E tests.
 * Handles authentication, request formatting, and response parsing.
 */
export class ApiClient {
  private request: APIRequestContext;
  private basePath: string;
  private authToken: string | null = null;
  private debug: boolean;

  /**
   * Create a new API client
   *
   * @param request - Playwright API request context
   * @param basePath - Base path for API routes (e.g., '/api/v1')
   * @param debug - Enable debug logging
   */
  constructor(
    request: APIRequestContext,
    basePath: string = '/api/v1',
    debug: boolean = false,
  ) {
    this.request = request;
    this.basePath = basePath;
    this.debug = debug;
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Set the authentication token for subsequent requests
   *
   * @param token - JWT access token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get the current authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  /**
   * Make a GET request
   *
   * @param path - API path (relative to basePath)
   * @param options - Request options
   * @returns Parsed response
   */
  async get<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    return this.makeRequest<T>('GET', path, undefined, options);
  }

  /**
   * Make a POST request
   *
   * @param path - API path (relative to basePath)
   * @param body - Request body
   * @param options - Request options
   * @returns Parsed response
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    return this.makeRequest<T>('POST', path, body, options);
  }

  /**
   * Make a PUT request
   *
   * @param path - API path (relative to basePath)
   * @param body - Request body
   * @param options - Request options
   * @returns Parsed response
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    return this.makeRequest<T>('PUT', path, body, options);
  }

  /**
   * Make a PATCH request
   *
   * @param path - API path (relative to basePath)
   * @param body - Request body
   * @param options - Request options
   * @returns Parsed response
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    return this.makeRequest<T>('PATCH', path, body, options);
  }

  /**
   * Make a DELETE request
   *
   * @param path - API path (relative to basePath)
   * @param options - Request options
   * @returns Parsed response
   */
  async delete<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    return this.makeRequest<T>('DELETE', path, undefined, options);
  }

  // ==========================================================================
  // Request Handling
  // ==========================================================================

  /**
   * Make an HTTP request
   *
   * @param method - HTTP method
   * @param path - API path
   * @param body - Request body (optional)
   * @param options - Request options
   * @returns Parsed response
   */
  private async makeRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ParsedResponse<T>> {
    const url = this.buildUrl(path, options.params);
    const headers = this.buildHeaders(options.headers);

    if (this.debug) {
      console.log(`[ApiClient] ${method} ${url}`);
      if (body) {
        console.log('[ApiClient] Body:', JSON.stringify(body, null, 2));
      }
    }

    const requestOptions: Parameters<APIRequestContext['fetch']>[1] = {
      method,
      headers,
      timeout: options.timeout || 30000,
    };

    if (body !== undefined) {
      requestOptions.data = body;
    }

    const response = await this.request.fetch(url, requestOptions);

    return this.parseResponse<T>(response);
  }

  /**
   * Build the full URL for a request
   *
   * @param path - API path
   * @param params - Query parameters
   * @returns Full URL
   */
  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    // Handle paths that don't include the base path (like /health)
    const fullPath = path.startsWith('/api/') || path.startsWith('/health')
      ? path
      : `${this.basePath}${path.startsWith('/') ? path : `/${path}`}`;

    if (!params || Object.keys(params).length === 0) {
      return fullPath;
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value));
    }

    return `${fullPath}?${searchParams.toString()}`;
  }

  /**
   * Build headers for a request
   *
   * @param customHeaders - Custom headers to include
   * @returns Combined headers
   */
  private buildHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Parse the API response
   *
   * @param response - Raw Playwright response
   * @returns Parsed response with typed data
   */
  private async parseResponse<T = unknown>(
    response: APIResponse,
  ): Promise<ParsedResponse<T>> {
    let body: ApiResponse<T>;

    try {
      body = await response.json();
    } catch {
      // If response is not JSON, wrap it
      const text = await response.text();
      body = {
        success: response.ok(),
        data: text as unknown as T,
      };
    }

    const headers: Record<string, string> = {};
    const responseHeaders = response.headers();
    for (const [key, value] of Object.entries(responseHeaders)) {
      headers[key] = value;
    }

    if (this.debug) {
      console.log(`[ApiClient] Response: ${response.status()}`);
      console.log('[ApiClient] Body:', JSON.stringify(body, null, 2));
    }

    return {
      status: response.status(),
      statusText: response.statusText(),
      headers,
      body,
      raw: response,
      ok: response.ok(),
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new API client instance
 *
 * @param request - Playwright API request context
 * @param basePath - Base path for API routes
 * @param debug - Enable debug logging
 * @returns New API client instance
 *
 * Usage:
 * ```typescript
 * test('example', async ({ request }) => {
 *   const api = createApiClient(request);
 *   const response = await api.get('/health');
 * });
 * ```
 */
export function createApiClient(
  request: APIRequestContext,
  basePath: string = '/api/v1',
  debug: boolean = false,
): ApiClient {
  return new ApiClient(request, basePath, debug);
}

// ============================================================================
// Exports
// ============================================================================

export default ApiClient;
