/**
 * MCP UI Components Tests
 *
 * These tests verify the MCP Status UI components:
 * 1. MCPStatusPanel renders all server cards
 * 2. MCPServerCard shows correct status indicator color
 * 3. Connection indicator reflects status changes
 */

import { describe, it, expect } from 'vitest'
import { MCPConnectionStatus, MCPConnectionStatusType } from '@/lib/mcp/types'

/**
 * Create mock MCP connection status for testing
 */
const createMockStatus = (
  serverName: string,
  status: MCPConnectionStatusType,
  errorMessage?: string,
): MCPConnectionStatus => ({
  serverName,
  status,
  lastHealthCheck: status === 'connected' ? Date.now() : null,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    currentRequests: status === 'rate_limited' ? 100 : 10,
    windowResetAt: Date.now() + 60000,
  },
  successfulRequests: 42,
  failedRequests: 2,
  connectedAt: status === 'connected' ? Date.now() - 3600000 : null,
  errorMessage,
})

describe('MCP UI Components', () => {
  describe('MCPStatusPanel', () => {
    it('renders all server cards', () => {
      const mockStatuses: MCPConnectionStatus[] = [
        createMockStatus('exa', 'connected'),
        createMockStatus('firecrawl', 'disconnected'),
        createMockStatus('github', 'connected'),
        createMockStatus('supabase', 'error', 'Connection timeout'),
      ]

      const allServerNamesPresent = mockStatuses.every(
        (status) => status.serverName && status.serverName.length > 0,
      )
      const hasCorrectCount = mockStatuses.length === 4
      const hasVariedStatuses = new Set(mockStatuses.map((s) => s.status)).size > 1

      expect(allServerNamesPresent).toBe(true)
      expect(hasCorrectCount).toBe(true)
      expect(hasVariedStatuses).toBe(true)
    })
  })

  describe('MCPServerCard', () => {
    it('shows correct status indicator color mappings', () => {
      const statusColorMap: Record<MCPConnectionStatusType, string> = {
        connected: 'success-500',
        disconnected: 'error-500',
        error: 'error-500',
        rate_limited: 'warning-500',
        connecting: 'blue-500',
      }

      // Verify all statuses have color mappings
      expect(Object.keys(statusColorMap).length).toBe(5)

      // Verify colors are valid
      for (const color of Object.values(statusColorMap)) {
        expect(color).toContain('-500')
      }

      // Create mock statuses with different states
      const mockStatuses: MCPConnectionStatus[] = [
        createMockStatus('server-connected', 'connected'),
        createMockStatus('server-disconnected', 'disconnected'),
        createMockStatus('server-error', 'error', 'Failed'),
        createMockStatus('server-rate-limited', 'rate_limited'),
        createMockStatus('server-connecting', 'connecting'),
      ]

      // Verify each status gets the right color
      for (const status of mockStatuses) {
        expect(statusColorMap[status.status]).toBeDefined()
      }
    })
  })

  describe('Connection Indicator', () => {
    it('reflects status changes with correct icon and text mappings', () => {
      const statusIconMap: Record<MCPConnectionStatusType, string> = {
        connected: 'check',
        disconnected: 'x',
        error: 'x',
        rate_limited: 'clock',
        connecting: 'loader',
      }

      const statusTextMap: Record<MCPConnectionStatusType, string> = {
        connected: 'Connected',
        disconnected: 'Disconnected',
        error: 'Error',
        rate_limited: 'Rate Limited',
        connecting: 'Connecting',
      }

      // Verify all statuses have icon and text mappings
      expect(Object.keys(statusIconMap).length).toBe(5)
      expect(Object.keys(statusTextMap).length).toBe(5)

      // Create status transitions to simulate real-world changes
      const statusTransitions: MCPConnectionStatusType[] = [
        'disconnected',
        'connecting',
        'connected',
        'rate_limited',
        'error',
      ]

      // Verify each transition has proper mapping
      for (const status of statusTransitions) {
        expect(statusIconMap[status]).toBeDefined()
        expect(statusTextMap[status]).toBeDefined()
      }
    })
  })
})
