/**
 * MCP Types and Interfaces
 *
 * Type definitions for the Model Context Protocol (MCP) Server Manager.
 * These types define the configuration, connection status, and capabilities
 * for MCP servers.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/types.ts
 */

/**
 * Transport type for MCP server connections
 */
export type MCPTransportType = 'stdio' | 'http' | 'websocket'

/**
 * Connection status for an MCP server
 */
export type MCPConnectionStatusType =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'rate_limited'

/**
 * Rate limit configuration for an MCP server
 */
export interface MCPRateLimit {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Current number of requests made in the current window */
  currentRequests: number
  /** Timestamp when the current window resets */
  windowResetAt: number
}

/**
 * Parameters for an MCP capability
 */
export interface MCPCapabilityParameter {
  /** Parameter name */
  name: string
  /** Parameter type (string, number, boolean, object, array) */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** Whether the parameter is required */
  required: boolean
  /** Parameter description */
  description?: string
  /** Default value if not provided */
  defaultValue?: unknown
}

/**
 * MCP Capability definition
 *
 * Represents a single capability (tool) that an MCP server provides.
 */
export interface MCPCapability {
  /** Capability name (tool name) */
  name: string
  /** Human-readable description of what this capability does */
  description: string
  /** Parameters that the capability accepts */
  parameters: MCPCapabilityParameter[]
}

/**
 * MCP Server Configuration
 *
 * Configuration required to connect to an MCP server.
 */
export interface MCPServerConfig {
  /** Unique server name identifier */
  name: string
  /** Transport type for the connection */
  type: MCPTransportType
  /** Command to start the server (for stdio transport) */
  command?: string
  /** Arguments for the command */
  args?: string[]
  /** Environment variables required by the server */
  env?: Record<string, string>
  /** HTTP/WebSocket URL (for http/websocket transport) */
  url?: string
  /** List of capabilities this server provides */
  capabilities: MCPCapability[]
  /** Rate limit configuration */
  rateLimit?: Partial<MCPRateLimit>
  /** Whether this server should auto-connect on startup */
  autoConnect?: boolean
  /** Required environment variable names that must be set */
  requiredEnvVars?: string[]
}

/**
 * MCP Connection Status
 *
 * Real-time status of an MCP server connection.
 */
export interface MCPConnectionStatus {
  /** Server name */
  serverName: string
  /** Current connection status */
  status: MCPConnectionStatusType
  /** Timestamp of the last successful health check */
  lastHealthCheck: number | null
  /** Current rate limit state */
  rateLimit: MCPRateLimit
  /** Error message if status is 'error' */
  errorMessage?: string
  /** Number of successful requests */
  successfulRequests: number
  /** Number of failed requests */
  failedRequests: number
  /** Timestamp when the connection was established */
  connectedAt: number | null
}

/**
 * Result of an MCP capability invocation
 */
export interface MCPInvocationResult<T = unknown> {
  /** Whether the invocation was successful */
  success: boolean
  /** Result data if successful */
  data?: T
  /** Error message if unsuccessful */
  error?: string
  /** Duration of the invocation in milliseconds */
  durationMs: number
  /** Whether rate limiting was applied */
  rateLimited: boolean
}

/**
 * Health check result
 */
export interface MCPHealthCheckResult {
  /** Whether the server is healthy */
  healthy: boolean
  /** Response time in milliseconds */
  responseTimeMs: number
  /** Error message if unhealthy */
  error?: string
  /** Timestamp of the check */
  checkedAt: number
}

/**
 * Available tools summary per server
 */
export interface MCPServerTools {
  /** Server name */
  serverName: string
  /** List of available capabilities */
  capabilities: MCPCapability[]
  /** Whether the server is currently connected */
  isConnected: boolean
}
