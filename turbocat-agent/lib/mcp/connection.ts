/**
 * MCP Connection
 *
 * Wrapper class for individual MCP server connections.
 * Handles connection lifecycle, health checks, rate limiting,
 * and capability invocation.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/connection.ts
 */

import type {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPConnectionStatusType,
  MCPRateLimit,
  MCPInvocationResult,
  MCPHealthCheckResult,
} from './types'

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT: MCPRateLimit = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  currentRequests: 0,
  windowResetAt: Date.now() + 60000,
}

/**
 * Exponential backoff configuration
 */
interface BackoffConfig {
  baseDelayMs: number
  maxDelayMs: number
  maxRetries: number
}

const DEFAULT_BACKOFF: BackoffConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  maxRetries: 5,
}

/**
 * MCPConnection class
 *
 * Manages a single connection to an MCP server.
 */
export class MCPConnection {
  private config: MCPServerConfig
  private status: MCPConnectionStatusType = 'disconnected'
  private rateLimit: MCPRateLimit
  private errorMessage?: string
  private successfulRequests = 0
  private failedRequests = 0
  private connectedAt: number | null = null
  private lastHealthCheck: number | null = null
  private retryCount = 0
  private backoffConfig: BackoffConfig

  // In a real implementation, this would be the actual MCP client
  // For now, we use a mock connection flag
  private isConnectionActive = false

  constructor(config: MCPServerConfig) {
    this.config = config
    this.rateLimit = {
      ...DEFAULT_RATE_LIMIT,
      ...(config.rateLimit || {}),
      currentRequests: 0,
      windowResetAt: Date.now() + (config.rateLimit?.windowMs || DEFAULT_RATE_LIMIT.windowMs),
    }
    this.backoffConfig = DEFAULT_BACKOFF
  }

  /**
   * Get the server configuration
   */
  getConfig(): MCPServerConfig {
    return this.config
  }

  /**
   * Get the current connection status
   */
  getStatus(): MCPConnectionStatus {
    return {
      serverName: this.config.name,
      status: this.status,
      lastHealthCheck: this.lastHealthCheck,
      rateLimit: { ...this.rateLimit },
      errorMessage: this.errorMessage,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      connectedAt: this.connectedAt,
    }
  }

  /**
   * Connect to the MCP server
   *
   * In a real implementation, this would establish the actual connection
   * using the @modelcontextprotocol/sdk. For now, it simulates the connection.
   */
  async connect(): Promise<void> {
    if (this.status === 'connected') {
      return
    }

    this.status = 'connecting'
    this.errorMessage = undefined

    try {
      // Simulate connection establishment
      // In production, this would use the MCP SDK to create the actual connection
      await this.establishConnection()

      this.status = 'connected'
      this.connectedAt = Date.now()
      this.retryCount = 0
      this.lastHealthCheck = Date.now()
      this.isConnectionActive = true
    } catch (error) {
      this.status = 'error'
      this.errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
      this.failedRequests++
      throw error
    }
  }

  /**
   * Establish the actual connection (mock implementation)
   *
   * In production, this would:
   * 1. For stdio: spawn the process with the configured command
   * 2. For http/websocket: establish the HTTP/WS connection
   */
  private async establishConnection(): Promise<void> {
    // Check if required environment variables are set
    if (this.config.requiredEnvVars) {
      for (const envVar of this.config.requiredEnvVars) {
        const value = process.env[envVar] || this.config.env?.[envVar]
        if (!value) {
          throw new Error(`Required environment variable ${envVar} is not set`)
        }
      }
    }

    // Simulate async connection establishment
    await new Promise((resolve) => setTimeout(resolve, 10))

    // For testing purposes, we mark the connection as active
    this.isConnectionActive = true
  }

  /**
   * Disconnect from the MCP server
   */
  async close(): Promise<void> {
    if (this.status === 'disconnected') {
      return
    }

    try {
      // In production, this would close the actual connection
      await this.closeConnection()
    } finally {
      this.status = 'disconnected'
      this.isConnectionActive = false
      this.connectedAt = null
    }
  }

  /**
   * Close the actual connection (mock implementation)
   */
  private async closeConnection(): Promise<void> {
    // Simulate async disconnection
    await new Promise((resolve) => setTimeout(resolve, 5))
    this.isConnectionActive = false
  }

  /**
   * Perform a health check on the connection
   */
  async healthCheck(): Promise<MCPHealthCheckResult> {
    const startTime = Date.now()

    try {
      if (!this.isConnectionActive) {
        return {
          healthy: false,
          responseTimeMs: Date.now() - startTime,
          error: 'Connection is not active',
          checkedAt: Date.now(),
        }
      }

      // In production, this would ping the MCP server
      // For now, we simulate a health check
      await new Promise((resolve) => setTimeout(resolve, 5))

      this.lastHealthCheck = Date.now()

      return {
        healthy: true,
        responseTimeMs: Date.now() - startTime,
        checkedAt: Date.now(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed'

      return {
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        error: errorMessage,
        checkedAt: Date.now(),
      }
    }
  }

  /**
   * Invoke a capability on the MCP server
   *
   * @param capability - Name of the capability to invoke
   * @param params - Parameters to pass to the capability
   */
  async invoke<T = unknown>(
    capability: string,
    params: Record<string, unknown>
  ): Promise<MCPInvocationResult<T>> {
    const startTime = Date.now()

    // Check rate limit
    if (this.isRateLimited()) {
      const waitTime = this.rateLimit.windowResetAt - Date.now()
      this.status = 'rate_limited'

      return {
        success: false,
        error: `Rate limited. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        durationMs: Date.now() - startTime,
        rateLimited: true,
      }
    }

    // Check if connected
    if (!this.isConnectionActive || this.status !== 'connected') {
      return {
        success: false,
        error: 'Not connected to MCP server',
        durationMs: Date.now() - startTime,
        rateLimited: false,
      }
    }

    // Verify capability exists
    const capabilityConfig = this.config.capabilities.find((c) => c.name === capability)
    if (!capabilityConfig) {
      return {
        success: false,
        error: `Capability '${capability}' not found on server '${this.config.name}'`,
        durationMs: Date.now() - startTime,
        rateLimited: false,
      }
    }

    try {
      // Increment rate limit counter
      this.incrementRateLimitCounter()

      // In production, this would invoke the actual MCP tool
      // For now, we simulate a successful invocation
      const result = await this.executeCapability<T>(capability, params)

      this.successfulRequests++
      this.status = 'connected' // Reset from rate_limited if applicable

      return {
        success: true,
        data: result,
        durationMs: Date.now() - startTime,
        rateLimited: false,
      }
    } catch (error) {
      this.failedRequests++
      const errorMessage = error instanceof Error ? error.message : 'Invocation failed'

      // Apply exponential backoff for retries
      if (this.shouldRetry(error)) {
        await this.applyBackoff()
      }

      return {
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
        rateLimited: false,
      }
    }
  }

  /**
   * Execute a capability (mock implementation)
   *
   * In production, this would use the MCP SDK to call the tool
   */
  private async executeCapability<T>(
    _capability: string,
    _params: Record<string, unknown>
  ): Promise<T> {
    // Simulate async execution
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Return mock data - in production this would be the actual result
    return { success: true, mockData: true } as T
  }

  /**
   * Check if currently rate limited
   */
  private isRateLimited(): boolean {
    // Reset window if expired
    if (Date.now() >= this.rateLimit.windowResetAt) {
      this.rateLimit.currentRequests = 0
      this.rateLimit.windowResetAt = Date.now() + this.rateLimit.windowMs
    }

    return this.rateLimit.currentRequests >= this.rateLimit.maxRequests
  }

  /**
   * Increment the rate limit counter
   */
  private incrementRateLimitCounter(): void {
    // Reset window if expired
    if (Date.now() >= this.rateLimit.windowResetAt) {
      this.rateLimit.currentRequests = 0
      this.rateLimit.windowResetAt = Date.now() + this.rateLimit.windowMs
    }

    this.rateLimit.currentRequests++
  }

  /**
   * Check if we should retry after an error
   */
  private shouldRetry(_error: unknown): boolean {
    return this.retryCount < this.backoffConfig.maxRetries
  }

  /**
   * Apply exponential backoff delay
   */
  private async applyBackoff(): Promise<void> {
    const delay = Math.min(
      this.backoffConfig.baseDelayMs * Math.pow(2, this.retryCount),
      this.backoffConfig.maxDelayMs
    )
    this.retryCount++
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(): MCPRateLimit {
    return { ...this.rateLimit }
  }

  /**
   * Check if the connection is currently active
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.isConnectionActive
  }
}
