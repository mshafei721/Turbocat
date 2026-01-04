/**
 * MCP Module Index
 *
 * Exports all MCP (Model Context Protocol) related functionality.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/index.ts
 */

// Types
export type {
  MCPTransportType,
  MCPConnectionStatusType,
  MCPRateLimit,
  MCPCapabilityParameter,
  MCPCapability,
  MCPServerConfig,
  MCPConnectionStatus,
  MCPInvocationResult,
  MCPHealthCheckResult,
  MCPServerTools,
} from './types'

// Connection
export { MCPConnection } from './connection'

// Manager
export { MCPServerManager, getMCPManager, resetMCPManager } from './manager'

// Configuration
export {
  substituteEnvVars,
  substituteEnvVarsInObject,
  checkRequiredEnvVars,
  loadMCPConfig,
  loadAllMCPConfigs,
  getAutoConnectConfigs,
  validateConfigEnvVars,
  DEFAULT_MCP_CONFIGS,
} from './config'
