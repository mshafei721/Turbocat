/**
 * MCP Server Manager Tests
 *
 * These tests verify the core functionality of the MCP Server Manager:
 * 1. Server registration adds config to registry
 * 2. Connect creates and stores connection
 * 3. GetStatus returns health for all connections
 * 4. Disconnect removes connection from registry
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MCPServerManager } from '@/lib/mcp/manager'
import { MCPServerConfig } from '@/lib/mcp/types'

/**
 * Create a mock MCP server configuration for testing
 */
const createMockServerConfig = (name: string, autoConnect = false): MCPServerConfig => ({
  name,
  type: 'stdio',
  command: 'npx',
  args: ['-y', `@modelcontextprotocol/${name}-server`],
  env: {},
  capabilities: [
    {
      name: 'testCapability',
      description: 'A test capability',
      parameters: [
        {
          name: 'input',
          type: 'string',
          required: true,
          description: 'Test input parameter',
        },
      ],
    },
  ],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
  autoConnect,
})

describe('MCP Server Manager', () => {
  let manager: MCPServerManager

  beforeEach(() => {
    manager = new MCPServerManager()
  })

  describe('Server Registration', () => {
    it('adds config to registry', () => {
      const config = createMockServerConfig('test-server')
      manager.registerServer(config)

      const registeredConfig = manager.getServerConfig('test-server')
      expect(registeredConfig).toBeDefined()
      expect(registeredConfig?.name).toBe(config.name)
      expect(registeredConfig?.type).toBe(config.type)
      expect(registeredConfig?.capabilities.length).toBe(config.capabilities.length)
    })
  })

  describe('Connect', () => {
    it('creates and stores connection', async () => {
      const config = createMockServerConfig('connect-test-server')
      manager.registerServer(config)

      await manager.connect('connect-test-server')

      const status = manager.getConnectionStatus('connect-test-server')
      expect(status).toBeDefined()
      expect(['connecting', 'connected']).toContain(status?.status)
      expect(status?.serverName).toBe('connect-test-server')

      // Cleanup
      await manager.disconnect('connect-test-server')
    })
  })

  describe('GetStatus', () => {
    it('returns health for all connections', async () => {
      // Register multiple servers
      manager.registerServer(createMockServerConfig('server-1'))
      manager.registerServer(createMockServerConfig('server-2'))
      manager.registerServer(createMockServerConfig('server-3'))

      // Connect to only one server
      await manager.connect('server-1')

      // Get status for all servers
      const allStatus = manager.getStatus()

      // Verify all servers are included
      expect(allStatus.length).toBe(3)

      const server1Status = allStatus.find((s) => s.serverName === 'server-1')
      const server2Status = allStatus.find((s) => s.serverName === 'server-2')
      const server3Status = allStatus.find((s) => s.serverName === 'server-3')

      expect(['connecting', 'connected']).toContain(server1Status?.status)
      expect(server2Status?.status).toBe('disconnected')
      expect(server3Status?.status).toBe('disconnected')

      // Cleanup
      await manager.disconnect('server-1')
    })
  })

  describe('Disconnect', () => {
    it('removes connection from registry', async () => {
      const config = createMockServerConfig('disconnect-test-server')
      manager.registerServer(config)

      // Connect
      await manager.connect('disconnect-test-server')
      const statusBeforeDisconnect = manager.getConnectionStatus('disconnect-test-server')
      expect(['connecting', 'connected']).toContain(statusBeforeDisconnect?.status)

      // Disconnect
      await manager.disconnect('disconnect-test-server')

      // Verify disconnected
      const statusAfterDisconnect = manager.getConnectionStatus('disconnect-test-server')
      expect(statusAfterDisconnect?.status).toBe('disconnected')
      expect(statusAfterDisconnect).toBeDefined() // Status still available
    })
  })
})
