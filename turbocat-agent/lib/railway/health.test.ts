/**
 * Metro Bundler Health Check & Monitoring Tests
 * Phase 4: Mobile Development - Task 3.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  MetroHealthMonitor,
  createHealthMonitor,
  DEFAULT_HEALTH_CONFIG,
} from './health'

// Mock fetch for health checks
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MetroHealthMonitor', () => {
  let monitor: MetroHealthMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    monitor = createHealthMonitor()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkHealth', () => {
    it('should return healthy status on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      })

      const result = await monitor.checkHealth('https://test.railway.app')

      expect(result.healthy).toBe(true)
      expect(result.consecutiveFailures).toBe(0)
      expect(result).toHaveProperty('lastCheck')
      expect(result).toHaveProperty('responseTimeMs')
    })

    it('should return unhealthy status on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await monitor.checkHealth('https://test.railway.app')

      expect(result.healthy).toBe(false)
      expect(result).toHaveProperty('error')
    })

    it('should return unhealthy status on network error', async () => {
      // Mock all endpoints to fail
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await monitor.checkHealth('https://test.railway.app')

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Network error')

      // Reset the mock
      mockFetch.mockReset()
    })

    it('should track consecutive failures', async () => {
      // First failure
      mockFetch.mockRejectedValueOnce(new Error('Error 1'))
      const result1 = await monitor.checkHealth('https://test.railway.app')
      expect(result1.consecutiveFailures).toBe(1)

      // Second failure
      mockFetch.mockRejectedValueOnce(new Error('Error 2'))
      const result2 = await monitor.checkHealth('https://test.railway.app')
      expect(result2.consecutiveFailures).toBe(2)

      // Success resets counter
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })
      const result3 = await monitor.checkHealth('https://test.railway.app')
      expect(result3.consecutiveFailures).toBe(0)
    })

    it('should measure response time', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ ok: true, status: 200 }), 100)
      }))

      vi.useRealTimers()
      const result = await monitor.checkHealth('https://test.railway.app')
      vi.useFakeTimers()

      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('startMonitoring', () => {
    it('should start polling at configured interval', async () => {
      const onHealthCheck = vi.fn()
      mockFetch.mockResolvedValue({ ok: true, status: 200 })

      monitor.startMonitoring('container-123', 'https://test.railway.app', {
        onHealthCheck,
      })

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)
      expect(onHealthCheck).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)
      expect(onHealthCheck).toHaveBeenCalledTimes(2)

      monitor.stopMonitoring('container-123')
    })

    it('should call onError after max consecutive failures', async () => {
      const onError = vi.fn()
      mockFetch.mockRejectedValue(new Error('Persistent error'))

      monitor.startMonitoring('container-123', 'https://test.railway.app', {
        onError,
      })

      // Advance through enough failures to trigger error callback
      for (let i = 0; i < DEFAULT_HEALTH_CONFIG.maxConsecutiveFailures; i++) {
        await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)
      }

      expect(onError).toHaveBeenCalled()
      monitor.stopMonitoring('container-123')
    })

    it('should not call onError before max failures reached', async () => {
      const onError = vi.fn()
      mockFetch.mockRejectedValue(new Error('Error'))

      monitor.startMonitoring('container-123', 'https://test.railway.app', {
        onError,
      })

      // Advance through failures but less than max
      for (let i = 0; i < DEFAULT_HEALTH_CONFIG.maxConsecutiveFailures - 1; i++) {
        await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)
      }

      expect(onError).not.toHaveBeenCalled()
      monitor.stopMonitoring('container-123')
    })
  })

  describe('stopMonitoring', () => {
    it('should stop polling when called', async () => {
      const onHealthCheck = vi.fn()
      mockFetch.mockResolvedValue({ ok: true, status: 200 })

      monitor.startMonitoring('container-123', 'https://test.railway.app', {
        onHealthCheck,
      })

      await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)
      expect(onHealthCheck).toHaveBeenCalledTimes(1)

      monitor.stopMonitoring('container-123')

      // Should not call again after stopping
      await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs * 2)
      expect(onHealthCheck).toHaveBeenCalledTimes(1)
    })

    it('should handle stopping non-existent monitor gracefully', () => {
      expect(() => monitor.stopMonitoring('non-existent')).not.toThrow()
    })
  })

  describe('getStatus', () => {
    it('should return current health status', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 })

      monitor.startMonitoring('container-123', 'https://test.railway.app')
      await vi.advanceTimersByTimeAsync(DEFAULT_HEALTH_CONFIG.intervalMs)

      const status = monitor.getStatus('container-123')

      expect(status).not.toBeNull()
      expect(status?.healthy).toBe(true)
      monitor.stopMonitoring('container-123')
    })

    it('should return null for unknown container', () => {
      const status = monitor.getStatus('unknown')
      expect(status).toBeNull()
    })
  })

  describe('isMonitoring', () => {
    it('should return true when monitoring', () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 })
      monitor.startMonitoring('container-123', 'https://test.railway.app')

      expect(monitor.isMonitoring('container-123')).toBe(true)
      monitor.stopMonitoring('container-123')
    })

    it('should return false when not monitoring', () => {
      expect(monitor.isMonitoring('unknown')).toBe(false)
    })
  })
})

describe('DEFAULT_HEALTH_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_HEALTH_CONFIG.intervalMs).toBe(30000) // 30 seconds
    expect(DEFAULT_HEALTH_CONFIG.timeoutMs).toBe(10000) // 10 seconds
    expect(DEFAULT_HEALTH_CONFIG.maxConsecutiveFailures).toBe(3)
  })
})
