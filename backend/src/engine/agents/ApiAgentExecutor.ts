/**
 * API Agent Executor
 *
 * Executes API agents that make HTTP requests to external services.
 * Supports all HTTP methods, authentication, retry logic, and timeouts.
 *
 * @module engine/agents/ApiAgentExecutor
 */

import { Agent, AgentType } from '@prisma/client';
import {
  AgentExecutor,
  AgentExecutorConfig,
  AgentExecutionInput,
  ExecutionMetrics,
} from './AgentExecutor';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Authentication types
 */
export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

/**
 * API authentication configuration
 */
export interface ApiAuthConfig {
  type: AuthType;
  /** Token for bearer auth */
  token?: string;
  /** Username for basic auth */
  username?: string;
  /** Password for basic auth */
  password?: string;
  /** API key value */
  apiKey?: string;
  /** Header name for API key (default: X-API-Key) */
  apiKeyHeader?: string;
}

/**
 * API agent configuration in agent.config
 */
export interface ApiAgentConfig {
  /** Target URL (can include template variables) */
  url: string;
  /** HTTP method */
  method: HttpMethod;
  /** Request headers */
  headers?: Record<string, string>;
  /** Authentication configuration */
  auth?: ApiAuthConfig;
  /** Query parameters */
  queryParams?: Record<string, string>;
  /** Request body (for POST, PUT, PATCH) */
  body?: unknown;
  /** Content type (default: application/json) */
  contentType?: string;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeoutMs?: number;
  /** Number of retry attempts (default: 0) */
  retryCount?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelayMs?: number;
  /** HTTP status codes to retry on (default: [429, 500, 502, 503, 504]) */
  retryOnStatusCodes?: number[];
  /** Whether to follow redirects (default: true) */
  followRedirects?: boolean;
  /** Expected response type: json, text, blob (default: json) */
  responseType?: 'json' | 'text' | 'blob';
}

/**
 * API execution result
 */
export interface ApiExecutionResult {
  /** HTTP status code */
  statusCode: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  data: unknown;
  /** Request URL (after variable substitution) */
  requestUrl: string;
  /** Time taken for the request in milliseconds */
  responseTimeMs: number;
  /** Number of retries performed */
  retryCount: number;
}

// =============================================================================
// API AGENT EXECUTOR
// =============================================================================

/**
 * Executor for API agents
 *
 * Features:
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
 * - Authentication: Bearer, Basic, API Key
 * - Retry logic with configurable delays
 * - Timeout handling
 * - Header and query parameter support
 * - Template variable substitution in URL and body
 */
export class ApiAgentExecutor extends AgentExecutor {
  private executionMetrics: ExecutionMetrics = {};

  constructor(config: AgentExecutorConfig = {}) {
    super(config);
  }

  /**
   * Get the agent type this executor handles
   */
  getAgentType(): AgentType {
    return AgentType.API;
  }

  /**
   * Execute the API agent
   */
  protected async executeInternal(input: AgentExecutionInput): Promise<ApiExecutionResult> {
    this.validateInput(input);

    const agentConfig = this.parseAgentConfig(input.agent, input.inputs);

    this.log('info', `Executing API agent`, {
      method: agentConfig.method,
      url: agentConfig.url,
      hasAuth: !!agentConfig.auth,
    });

    // Execute with retry logic
    const result = await this.executeWithRetry(agentConfig);

    // Update metrics
    this.executionMetrics = {
      networkBytes: JSON.stringify(result.data).length,
      apiCalls: result.retryCount + 1,
    };

    return result;
  }

  /**
   * Parse and validate agent configuration
   */
  private parseAgentConfig(agent: Agent, inputs: Record<string, unknown>): ApiAgentConfig {
    const config = agent.config as Record<string, unknown> | null;

    if (!config) {
      throw new Error('API agent requires configuration with url and method');
    }

    let url = config.url as string;
    if (!url) {
      throw new Error('API agent requires a URL');
    }

    // Substitute template variables in URL
    url = this.substituteVariables(url, inputs);

    const method = ((config.method as string) || 'GET').toUpperCase() as HttpMethod;
    if (!this.isValidMethod(method)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }

    // Process body with variable substitution
    let body = config.body;
    if (body && typeof body === 'object') {
      body = this.substituteObjectVariables(body as Record<string, unknown>, inputs);
    }

    return {
      url,
      method,
      headers: config.headers as Record<string, string> | undefined,
      auth: config.auth as ApiAuthConfig | undefined,
      queryParams: config.queryParams as Record<string, string> | undefined,
      body,
      contentType: (config.contentType as string) || 'application/json',
      requestTimeoutMs: (config.requestTimeoutMs as number) || 30000,
      retryCount: (config.retryCount as number) || 0,
      retryDelayMs: (config.retryDelayMs as number) || 1000,
      retryOnStatusCodes: (config.retryOnStatusCodes as number[]) || [429, 500, 502, 503, 504],
      followRedirects: config.followRedirects !== false,
      responseType: (config.responseType as 'json' | 'text' | 'blob') || 'json',
    };
  }

  /**
   * Check if HTTP method is valid
   */
  private isValidMethod(method: string): method is HttpMethod {
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method);
  }

  /**
   * Substitute template variables in a string
   * Supports {{variable}} syntax
   */
  private substituteVariables(template: string, inputs: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(inputs, trimmedKey);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Recursively substitute variables in an object
   */
  private substituteObjectVariables(
    obj: Record<string, unknown>,
    inputs: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.substituteVariables(value, inputs);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'string'
            ? this.substituteVariables(item, inputs)
            : typeof item === 'object' && item !== null
              ? this.substituteObjectVariables(item as Record<string, unknown>, inputs)
              : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.substituteObjectVariables(value as Record<string, unknown>, inputs);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeWithRetry(config: ApiAgentConfig): Promise<ApiExecutionResult> {
    let lastError: Error | null = null;
    let retryCount = 0;

    const maxRetries = config.retryCount ?? 0;
    const retryStatusCodes = config.retryOnStatusCodes ?? [429, 500, 502, 503, 504];
    const retryDelay = config.retryDelayMs ?? 1000;

    while (retryCount <= maxRetries) {
      try {
        const result = await this.makeRequest(config);

        // Check if we should retry based on status code
        if (retryCount < maxRetries && retryStatusCodes.includes(result.statusCode)) {
          this.log('warn', `Request returned ${result.statusCode}, retrying...`, {
            attempt: retryCount + 1,
            maxRetries,
          });
          retryCount++;
          await this.delay(retryDelay * retryCount);
          continue;
        }

        result.retryCount = retryCount;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (retryCount < maxRetries) {
          this.log('warn', `Request failed, retrying...`, {
            error: lastError.message,
            attempt: retryCount + 1,
            maxRetries,
          });
          retryCount++;
          await this.delay(retryDelay * retryCount);
        } else {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Make the actual HTTP request using fetch
   */
  private async makeRequest(config: ApiAgentConfig): Promise<ApiExecutionResult> {
    const startTime = Date.now();

    // Build URL with query parameters
    const url = new URL(config.url);
    if (config.queryParams) {
      for (const [key, value] of Object.entries(config.queryParams)) {
        url.searchParams.append(key, value);
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': config.contentType ?? 'application/json',
      ...config.headers,
    };

    // Add authentication headers
    this.addAuthHeaders(headers, config.auth);

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
      redirect: config.followRedirects ? 'follow' : 'manual',
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body !== undefined) {
      fetchOptions.body =
        typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    fetchOptions.signal = controller.signal;

    try {
      this.log('debug', `Making ${config.method} request`, {
        url: url.toString(),
        hasBody: !!fetchOptions.body,
      });

      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;

      // Parse response based on type
      let data: unknown;
      try {
        if (config.responseType === 'json') {
          data = await response.json();
        } else if (config.responseType === 'text') {
          data = await response.text();
        } else {
          // For blob, return base64 encoded string
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          data = Buffer.from(buffer).toString('base64');
        }
      } catch {
        // If parsing fails, try to get text
        data = await response.text().catch(() => null);
      }

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      this.log('info', `Request completed`, {
        statusCode: response.status,
        responseTimeMs,
      });

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        requestUrl: url.toString(),
        responseTimeMs,
        retryCount: 0,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${config.requestTimeoutMs}ms`);
      }

      throw error;
    }
  }

  /**
   * Add authentication headers based on config
   */
  private addAuthHeaders(headers: Record<string, string>, auth?: ApiAuthConfig): void {
    if (!auth || auth.type === 'none') {
      return;
    }

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;

      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'api_key':
        if (auth.apiKey) {
          const headerName = auth.apiKeyHeader || 'X-API-Key';
          headers[headerName] = auth.apiKey;
        }
        break;
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Collect execution metrics
   */
  protected collectMetrics(): ExecutionMetrics | undefined {
    return this.executionMetrics;
  }

  /**
   * Validate input specific to API agents
   */
  protected validateInput(input: AgentExecutionInput): void {
    super.validateInput(input);

    if (input.agent.type !== AgentType.API) {
      throw new Error(`ApiAgentExecutor can only execute API agents, got: ${input.agent.type}`);
    }
  }
}

export default ApiAgentExecutor;
