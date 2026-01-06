/**
 * Railway API Types
 * Phase 4: Mobile Development - Railway Backend Integration
 */

// Container status states
export type ContainerStatus = 'starting' | 'running' | 'stopped' | 'error'

// Resource usage metrics
export interface ResourceUsage {
  cpu?: number // CPU usage percentage (0-100)
  ram?: number // RAM usage in MB
  network?: number // Network usage in MB
}

// Project configuration for creating a new container
export interface ContainerConfig {
  taskId: string
  userId: string
  projectName?: string // Optional custom name for the Railway project
  template?: 'expo-metro' | 'custom' // Template to use
  envVars?: Record<string, string> // Additional environment variables
}

// Container creation result
export interface ContainerCreateResult {
  containerId: string
  metroUrl: string
  projectId?: string // Railway project ID
  serviceId?: string // Railway service ID
}

// Container status result
export interface ContainerStatusResult {
  status: ContainerStatus
  resourceUsage?: ResourceUsage
  uptimeSeconds?: number
  lastHealthCheck?: Date
}

// Container logs result
export interface ContainerLogsResult {
  logs: LogEntry[]
  hasMore: boolean
  cursor?: string // For pagination
}

// Log entry from container
export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source?: 'metro' | 'system' | 'app'
}

// Railway API configuration
export interface RailwayConfig {
  apiToken: string
  teamId?: string
  defaultProjectId?: string
  baseUrl?: string // For testing/mocking
}

// Railway API error
export class RailwayAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public retryable: boolean = false,
  ) {
    super(message)
    this.name = 'RailwayAPIError'
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

// Health check configuration
export interface HealthCheckConfig {
  intervalMs: number // How often to check (default: 30000 = 30 seconds)
  timeoutMs: number // Health check timeout (default: 10000 = 10 seconds)
  maxConsecutiveFailures: number // Max failures before marking as error
}

// Metro bundler health status
export interface MetroHealthStatus {
  healthy: boolean
  lastCheck: Date
  responseTimeMs?: number
  consecutiveFailures: number
  error?: string
}

// QR code generation options
export interface QRCodeOptions {
  size?: number // Width/height in pixels (default: 300)
  format?: 'svg' | 'png' // Output format (default: 'svg')
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' // Error correction (default: 'M')
  margin?: number // Quiet zone margin (default: 4)
}

// QR code result
export interface QRCodeResult {
  data: string // SVG string or base64 PNG
  format: 'svg' | 'png'
  url: string // The Metro URL encoded
  generatedAt: Date
}

// Container lifecycle events
export type ContainerEvent =
  | { type: 'created'; containerId: string; metroUrl: string }
  | { type: 'started'; containerId: string }
  | { type: 'stopped'; containerId: string; reason?: string }
  | { type: 'error'; containerId: string; error: string }
  | { type: 'health_check'; containerId: string; healthy: boolean }
  | { type: 'activity'; containerId: string; timestamp: Date }

// Callback for container events
export type ContainerEventCallback = (event: ContainerEvent) => void | Promise<void>
