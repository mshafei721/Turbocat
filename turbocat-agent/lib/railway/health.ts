/**
 * Metro Bundler Health Check & Monitoring
 * Phase 4: Mobile Development - Task 3.4
 *
 * Features:
 * - Health check polling (every 30 seconds)
 * - Status tracking: starting, running, stopped, error
 * - Metro logs streaming to database
 * - Error detection and auto-restart
 */

import { MetroHealthStatus, HealthCheckConfig } from './types'

// Default health check configuration
export const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  intervalMs: 30000, // 30 seconds
  timeoutMs: 10000, // 10 seconds
  maxConsecutiveFailures: 3,
}

// Health check endpoint paths to try
const HEALTH_ENDPOINTS = ['/status', '/healthz', '/']

interface MonitoringState {
  url: string
  intervalId: NodeJS.Timeout | null
  status: MetroHealthStatus
  callbacks: MonitoringCallbacks
}

interface MonitoringCallbacks {
  onHealthCheck?: (status: MetroHealthStatus) => void
  onError?: (error: string) => void
  onRecovery?: () => void
}

export interface MetroHealthMonitor {
  /**
   * Check health of a Metro bundler instance
   */
  checkHealth(metroUrl: string): Promise<MetroHealthStatus>

  /**
   * Start continuous monitoring of a container
   */
  startMonitoring(
    containerId: string,
    metroUrl: string,
    callbacks?: MonitoringCallbacks,
    config?: Partial<HealthCheckConfig>,
  ): void

  /**
   * Stop monitoring a container
   */
  stopMonitoring(containerId: string): void

  /**
   * Get current health status for a container
   */
  getStatus(containerId: string): MetroHealthStatus | null

  /**
   * Check if a container is being monitored
   */
  isMonitoring(containerId: string): boolean
}

/**
 * Create a Metro health monitor instance
 */
export function createHealthMonitor(
  config: Partial<HealthCheckConfig> = {},
): MetroHealthMonitor {
  const healthConfig: HealthCheckConfig = {
    ...DEFAULT_HEALTH_CONFIG,
    ...config,
  }

  // Track monitoring state per container
  const monitors = new Map<string, MonitoringState>()

  // Track consecutive failures per URL
  const failureCounts = new Map<string, number>()

  /**
   * Perform a single health check
   */
  async function checkHealth(metroUrl: string): Promise<MetroHealthStatus> {
    const startTime = Date.now()
    let lastError: string | undefined

    // Try multiple endpoints
    for (const endpoint of HEALTH_ENDPOINTS) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), healthConfig.timeoutMs)

        const response = await fetch(`${metroUrl}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          // Reset failure count on success
          failureCounts.set(metroUrl, 0)

          return {
            healthy: true,
            lastCheck: new Date(),
            responseTimeMs: Date.now() - startTime,
            consecutiveFailures: 0,
          }
        } else {
          lastError = `HTTP ${response.status}`
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = 'Health check timed out'
          } else {
            lastError = error.message
          }
        } else {
          lastError = 'Unknown error'
        }
      }
    }

    // Increment failure count
    const currentFailures = (failureCounts.get(metroUrl) || 0) + 1
    failureCounts.set(metroUrl, currentFailures)

    return {
      healthy: false,
      lastCheck: new Date(),
      responseTimeMs: Date.now() - startTime,
      consecutiveFailures: currentFailures,
      error: lastError,
    }
  }

  /**
   * Monitoring loop for a container
   */
  async function performMonitoringCheck(containerId: string): Promise<void> {
    const state = monitors.get(containerId)
    if (!state) return

    const status = await checkHealth(state.url)
    state.status = status

    // Call health check callback
    if (state.callbacks.onHealthCheck) {
      state.callbacks.onHealthCheck(status)
    }

    // Check for recovery
    if (status.healthy && state.status.consecutiveFailures > 0) {
      if (state.callbacks.onRecovery) {
        state.callbacks.onRecovery()
      }
    }

    // Check for error threshold
    if (status.consecutiveFailures >= healthConfig.maxConsecutiveFailures) {
      if (state.callbacks.onError) {
        state.callbacks.onError(
          `Container ${containerId} failed ${status.consecutiveFailures} consecutive health checks: ${status.error}`,
        )
      }
    }
  }

  return {
    checkHealth,

    startMonitoring(
      containerId: string,
      metroUrl: string,
      callbacks: MonitoringCallbacks = {},
      customConfig?: Partial<HealthCheckConfig>,
    ): void {
      // Stop existing monitoring if any
      this.stopMonitoring(containerId)

      const intervalMs = customConfig?.intervalMs || healthConfig.intervalMs

      const state: MonitoringState = {
        url: metroUrl,
        intervalId: null,
        status: {
          healthy: false,
          lastCheck: new Date(),
          consecutiveFailures: 0,
        },
        callbacks,
      }

      // Start the monitoring interval
      state.intervalId = setInterval(() => {
        performMonitoringCheck(containerId)
      }, intervalMs)

      monitors.set(containerId, state)
    },

    stopMonitoring(containerId: string): void {
      const state = monitors.get(containerId)
      if (state?.intervalId) {
        clearInterval(state.intervalId)
      }
      monitors.delete(containerId)
    },

    getStatus(containerId: string): MetroHealthStatus | null {
      return monitors.get(containerId)?.status || null
    },

    isMonitoring(containerId: string): boolean {
      return monitors.has(containerId)
    },
  }
}

/**
 * Parse Metro bundler logs for common issues
 */
export function parseMetroLogs(logs: string): {
  hasError: boolean
  errorType?: 'crash' | 'oom' | 'network' | 'build'
  errorMessage?: string
} {
  const lowerLogs = logs.toLowerCase()

  // Check for out of memory
  if (lowerLogs.includes('out of memory') || lowerLogs.includes('heap out of memory')) {
    return {
      hasError: true,
      errorType: 'oom',
      errorMessage: 'Metro bundler ran out of memory',
    }
  }

  // Check for crashes
  if (lowerLogs.includes('fatal error') || lowerLogs.includes('segmentation fault')) {
    return {
      hasError: true,
      errorType: 'crash',
      errorMessage: 'Metro bundler crashed',
    }
  }

  // Check for network issues
  if (lowerLogs.includes('econnrefused') || lowerLogs.includes('network error')) {
    return {
      hasError: true,
      errorType: 'network',
      errorMessage: 'Network error in Metro bundler',
    }
  }

  // Check for build errors
  if (lowerLogs.includes('error: ') || lowerLogs.includes('syntaxerror')) {
    return {
      hasError: true,
      errorType: 'build',
      errorMessage: 'Build error in Metro bundler',
    }
  }

  return { hasError: false }
}

/**
 * Determine if a Metro error is recoverable
 */
export function isRecoverableError(errorType: string): boolean {
  switch (errorType) {
    case 'network':
    case 'build':
      return true
    case 'oom':
    case 'crash':
      return false
    default:
      return true
  }
}
