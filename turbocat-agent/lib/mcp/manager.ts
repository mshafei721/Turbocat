/**
 * MCP Server Manager
 *
 * Central management class for MCP server connections.
 * Handles server registration, connection lifecycle, health monitoring,
 * and capability routing.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/manager.ts
 */

import { MCPConnection } from './connection'
import type {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPServerTools,
  MCPInvocationResult,
  MCPHealthCheckResult,
} from './types'

/**
 * MCPServerManager
 *
 * Manages multiple MCP server connections, providing a unified interface
 * for registration, connection management, and capability invocation.
 */
export class MCPServerManager {
  /** Registry of server configurations */
  private serverRegistry: Map<string, MCPServerConfig> = new Map()

  /** Active connections */
  private connections: Map<string, MCPConnection> = new Map()

  /** Connection status cache for disconnected servers */
  private statusCache: Map<string, MCPConnectionStatus> = new Map()

  /**
   * Register an MCP server configuration
   *
   * Adds a server configuration to the registry. The server is not
   * automatically connected - use connect() to establish a connection.
   *
   * @param config - Server configuration to register
   * @throws Error if a server with the same name is already registered
   */
  registerServer(config: MCPServerConfig): void {
    if (this.serverRegistry.has(config.name)) {
      throw new Error(`Server '${config.name}' is already registered`)
    }

    this.serverRegistry.set(config.name, config)

    // Initialize status cache with disconnected status
    this.statusCache.set(config.name, {
      serverName: config.name,
      status: 'disconnected',
      lastHealthCheck: null,
      rateLimit: {
        maxRequests: config.rateLimit?.maxRequests || 100,
        windowMs: config.rateLimit?.windowMs || 60000,
        currentRequests: 0,
        windowResetAt: Date.now() + (config.rateLimit?.windowMs || 60000),
      },
      successfulRequests: 0,
      failedRequests: 0,
      connectedAt: null,
    })
  }

  /**
   * Unregister an MCP server
   *
   * Removes a server configuration from the registry.
   * If the server is connected, it will be disconnected first.
   *
   * @param serverName - Name of the server to unregister
   */
  async unregisterServer(serverName: string): Promise<void> {
    // Disconnect if connected
    if (this.connections.has(serverName)) {
      await this.disconnect(serverName)
    }

    this.serverRegistry.delete(serverName)
    this.statusCache.delete(serverName)
  }

  /**
   * Get server configuration by name
   *
   * @param serverName - Name of the server
   * @returns Server configuration or undefined if not found
   */
  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.serverRegistry.get(serverName)
  }

  /**
   * Get all registered server names
   */
  getRegisteredServers(): string[] {
    return Array.from(this.serverRegistry.keys())
  }

  /**
   * Connect to an MCP server
   *
   * Establishes a connection to the specified server.
   * The server must be registered before connecting.
   *
   * @param serverName - Name of the server to connect to
   * @throws Error if server is not registered or connection fails
   */
  async connect(serverName: string): Promise<void> {
    const config = this.serverRegistry.get(serverName)
    if (!config) {
      throw new Error(`Server '${serverName}' is not registered`)
    }

    // If already connected, return
    if (this.connections.has(serverName)) {
      const existingConnection = this.connections.get(serverName)!
      if (existingConnection.isConnected()) {
        return
      }
    }

    // Create new connection
    const connection = new MCPConnection(config)

    // Store connection before connecting (so status is available)
    this.connections.set(serverName, connection)

    // Update status cache
    this.updateStatusCache(serverName, connection.getStatus())

    try {
      await connection.connect()
      // Update status cache after successful connection
      this.updateStatusCache(serverName, connection.getStatus())
    } catch (error) {
      // Update status cache with error
      this.updateStatusCache(serverName, connection.getStatus())
      throw error
    }
  }

  /**
   * Disconnect from an MCP server
   *
   * Closes the connection to the specified server.
   *
   * @param serverName - Name of the server to disconnect from
   */
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName)
    if (!connection) {
      // If no connection but server is registered, just ensure status is disconnected
      if (this.serverRegistry.has(serverName)) {
        const cachedStatus = this.statusCache.get(serverName)
        if (cachedStatus) {
          cachedStatus.status = 'disconnected'
          cachedStatus.connectedAt = null
        }
      }
      return
    }

    await connection.close()

    // Update status cache with disconnected status
    const status = connection.getStatus()
    this.updateStatusCache(serverName, status)

    // Remove the connection but keep the status cache
    this.connections.delete(serverName)
  }

  /**
   * Get connection status for a specific server
   *
   * @param serverName - Name of the server
   * @returns Connection status or undefined if not registered
   */
  getConnectionStatus(serverName: string): MCPConnectionStatus | undefined {
    // First check active connections
    const connection = this.connections.get(serverName)
    if (connection) {
      return connection.getStatus()
    }

    // Fall back to cached status
    return this.statusCache.get(serverName)
  }

  /**
   * Get status for all registered servers
   *
   * Returns the health status for all registered servers,
   * including disconnected ones.
   *
   * @returns Array of connection statuses
   */
  getStatus(): MCPConnectionStatus[] {
    const statuses: MCPConnectionStatus[] = []

    for (const serverName of this.serverRegistry.keys()) {
      const status = this.getConnectionStatus(serverName)
      if (status) {
        statuses.push(status)
      }
    }

    return statuses
  }

  /**
   * Get available tools from all connected servers
   *
   * Lists capabilities for each registered server along with
   * their connection status.
   *
   * @returns Array of server tools information
   */
  getAvailableTools(): MCPServerTools[] {
    const tools: MCPServerTools[] = []

    for (const [serverName, config] of this.serverRegistry.entries()) {
      const connection = this.connections.get(serverName)
      const isConnected = connection?.isConnected() ?? false

      tools.push({
        serverName,
        capabilities: config.capabilities,
        isConnected,
      })
    }

    return tools
  }

  /**
   * Invoke a capability on a specific server
   *
   * @param serverName - Name of the server
   * @param capability - Name of the capability to invoke
   * @param params - Parameters to pass to the capability
   * @returns Invocation result
   */
  async invoke<T = unknown>(
    serverName: string,
    capability: string,
    params: Record<string, unknown>
  ): Promise<MCPInvocationResult<T>> {
    const connection = this.connections.get(serverName)

    if (!connection) {
      return {
        success: false,
        error: `Server '${serverName}' is not connected`,
        durationMs: 0,
        rateLimited: false,
      }
    }

    const result = await connection.invoke<T>(capability, params)

    // Update status cache after invocation
    this.updateStatusCache(serverName, connection.getStatus())

    return result
  }

  /**
   * Perform health check on a specific server
   *
   * @param serverName - Name of the server
   * @returns Health check result
   */
  async healthCheck(serverName: string): Promise<MCPHealthCheckResult> {
    const connection = this.connections.get(serverName)

    if (!connection) {
      return {
        healthy: false,
        responseTimeMs: 0,
        error: `Server '${serverName}' is not connected`,
        checkedAt: Date.now(),
      }
    }

    const result = await connection.healthCheck()

    // Update status cache after health check
    this.updateStatusCache(serverName, connection.getStatus())

    return result
  }

  /**
   * Perform health check on all connected servers
   *
   * @returns Map of server names to health check results
   */
  async healthCheckAll(): Promise<Map<string, MCPHealthCheckResult>> {
    const results = new Map<string, MCPHealthCheckResult>()

    for (const serverName of this.connections.keys()) {
      const result = await this.healthCheck(serverName)
      results.set(serverName, result)
    }

    return results
  }

  /**
   * Connect to all servers with autoConnect enabled
   *
   * @returns Map of server names to connection success/failure
   */
  async autoConnectAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()

    for (const [serverName, config] of this.serverRegistry.entries()) {
      if (config.autoConnect) {
        try {
          await this.connect(serverName)
          results.set(serverName, true)
        } catch {
          results.set(serverName, false)
        }
      }
    }

    return results
  }

  /**
   * Disconnect from all connected servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map((serverName) =>
      this.disconnect(serverName)
    )

    await Promise.all(disconnectPromises)
  }

  /**
   * Update the status cache for a server
   */
  private updateStatusCache(serverName: string, status: MCPConnectionStatus): void {
    this.statusCache.set(serverName, { ...status })
  }

  /**
   * Get the number of registered servers
   */
  getServerCount(): number {
    return this.serverRegistry.size
  }

  /**
   * Get the number of connected servers
   */
  getConnectedCount(): number {
    let count = 0
    for (const connection of this.connections.values()) {
      if (connection.isConnected()) {
        count++
      }
    }
    return count
  }
}

/**
 * Create a singleton instance of MCPServerManager
 */
let mcpManagerInstance: MCPServerManager | null = null

export function getMCPManager(): MCPServerManager {
  if (!mcpManagerInstance) {
    mcpManagerInstance = new MCPServerManager()
  }
  return mcpManagerInstance
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetMCPManager(): void {
  mcpManagerInstance = null
}
