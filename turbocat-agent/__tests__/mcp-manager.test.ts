/**
 * MCP Server Manager Tests
 *
 * These tests verify the core functionality of the MCP Server Manager:
 * 1. Server registration adds config to registry
 * 2. Connect creates and stores connection
 * 3. GetStatus returns health for all connections
 * 4. Disconnect removes connection from registry
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/__tests__/mcp-manager.test.ts
 */

import { MCPServerManager } from '@/lib/mcp/manager'
import { MCPServerConfig, MCPConnectionStatusType } from '@/lib/mcp/types'

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

/**
 * Test 1: Server registration adds config to registry
 *
 * When a server is registered with MCPServerManager, it should be
 * stored in the internal registry and retrievable via getServerConfig.
 */
export const testServerRegistrationAddsToRegistry = async (): Promise<boolean> => {
  console.log('Test 1 - Server registration adds config to registry')

  try {
    const manager = new MCPServerManager()
    const config = createMockServerConfig('test-server')

    // Register the server
    manager.registerServer(config)

    // Verify it was added to the registry
    const registeredConfig = manager.getServerConfig('test-server')
    const isRegistered = registeredConfig !== undefined
    const nameMatches = registeredConfig?.name === config.name
    const typeMatches = registeredConfig?.type === config.type
    const hasCapabilities =
      registeredConfig?.capabilities.length === config.capabilities.length

    const passed = isRegistered && nameMatches && typeMatches && hasCapabilities

    console.log(`  Is registered: ${isRegistered}`)
    console.log(`  Name matches: ${nameMatches}`)
    console.log(`  Type matches: ${typeMatches}`)
    console.log(`  Has capabilities: ${hasCapabilities}`)
    console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`)

    return passed
  } catch (error) {
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    console.log('  Result: FAIL')
    return false
  }
}

/**
 * Test 2: Connect creates and stores connection
 *
 * When connect is called for a registered server, it should create
 * a connection object and store it internally.
 */
export const testConnectCreatesAndStoresConnection = async (): Promise<boolean> => {
  console.log('Test 2 - Connect creates and stores connection')

  try {
    const manager = new MCPServerManager()
    const config = createMockServerConfig('connect-test-server')

    // Register the server
    manager.registerServer(config)

    // Connect to the server (mock connection - won't actually connect)
    await manager.connect('connect-test-server')

    // Verify connection was created
    const status = manager.getConnectionStatus('connect-test-server')
    const hasStatus = status !== undefined
    const statusIsConnectingOrConnected: boolean =
      status?.status === 'connecting' || status?.status === 'connected'
    const hasServerName = status?.serverName === 'connect-test-server'

    const passed = hasStatus && statusIsConnectingOrConnected && hasServerName

    console.log(`  Has status: ${hasStatus}`)
    console.log(`  Status is connecting/connected: ${statusIsConnectingOrConnected} (${status?.status})`)
    console.log(`  Server name matches: ${hasServerName}`)
    console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`)

    // Cleanup
    await manager.disconnect('connect-test-server')

    return passed
  } catch (error) {
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    console.log('  Result: FAIL')
    return false
  }
}

/**
 * Test 3: GetStatus returns health for all connections
 *
 * The getStatus method should return the health status for all
 * registered servers, including disconnected ones.
 */
export const testGetStatusReturnsHealthForAllConnections = async (): Promise<boolean> => {
  console.log('Test 3 - GetStatus returns health for all connections')

  try {
    const manager = new MCPServerManager()

    // Register multiple servers
    manager.registerServer(createMockServerConfig('server-1'))
    manager.registerServer(createMockServerConfig('server-2'))
    manager.registerServer(createMockServerConfig('server-3'))

    // Connect to only one server
    await manager.connect('server-1')

    // Get status for all servers
    const allStatus = manager.getStatus()

    // Verify all servers are included
    const hasAllServers = allStatus.length === 3
    const server1Status = allStatus.find((s) => s.serverName === 'server-1')
    const server2Status = allStatus.find((s) => s.serverName === 'server-2')
    const server3Status = allStatus.find((s) => s.serverName === 'server-3')

    const server1Connected =
      server1Status?.status === 'connecting' || server1Status?.status === 'connected'
    const server2Disconnected = server2Status?.status === 'disconnected'
    const server3Disconnected = server3Status?.status === 'disconnected'

    const passed =
      hasAllServers && server1Connected && server2Disconnected && server3Disconnected

    console.log(`  Has all servers: ${hasAllServers} (${allStatus.length})`)
    console.log(`  Server 1 connected: ${server1Connected} (${server1Status?.status})`)
    console.log(`  Server 2 disconnected: ${server2Disconnected} (${server2Status?.status})`)
    console.log(`  Server 3 disconnected: ${server3Disconnected} (${server3Status?.status})`)
    console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`)

    // Cleanup
    await manager.disconnect('server-1')

    return passed
  } catch (error) {
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    console.log('  Result: FAIL')
    return false
  }
}

/**
 * Test 4: Disconnect removes connection from registry
 *
 * When disconnect is called, the connection should be removed
 * and the status should change to 'disconnected'.
 */
export const testDisconnectRemovesConnection = async (): Promise<boolean> => {
  console.log('Test 4 - Disconnect removes connection from registry')

  try {
    const manager = new MCPServerManager()
    const config = createMockServerConfig('disconnect-test-server')

    // Register and connect
    manager.registerServer(config)
    await manager.connect('disconnect-test-server')

    // Verify connected
    const statusBeforeDisconnect = manager.getConnectionStatus('disconnect-test-server')
    const wasConnectedOrConnecting =
      statusBeforeDisconnect?.status === 'connecting' ||
      statusBeforeDisconnect?.status === 'connected'

    // Disconnect
    await manager.disconnect('disconnect-test-server')

    // Verify disconnected
    const statusAfterDisconnect = manager.getConnectionStatus('disconnect-test-server')
    const isDisconnected = statusAfterDisconnect?.status === 'disconnected'

    // Connection should be removed but status should still be available
    const statusStillAvailable = statusAfterDisconnect !== undefined

    const passed = wasConnectedOrConnecting && isDisconnected && statusStillAvailable

    console.log(`  Was connected/connecting: ${wasConnectedOrConnecting} (${statusBeforeDisconnect?.status})`)
    console.log(`  Is disconnected: ${isDisconnected} (${statusAfterDisconnect?.status})`)
    console.log(`  Status still available: ${statusStillAvailable}`)
    console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`)

    return passed
  } catch (error) {
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    console.log('  Result: FAIL')
    return false
  }
}

/**
 * Run all MCP Manager tests
 */
export const runAllMCPManagerTests = async (): Promise<void> => {
  console.log('='.repeat(60))
  console.log('MCP Server Manager Tests')
  console.log('='.repeat(60))

  const tests = [
    testServerRegistrationAddsToRegistry,
    testConnectCreatesAndStoresConnection,
    testGetStatusReturnsHealthForAllConnections,
    testDisconnectRemovesConnection,
  ]

  const results: boolean[] = []

  for (const test of tests) {
    console.log('')
    const result = await test()
    results.push(result)
  }

  const passed = results.filter(Boolean).length
  const total = results.length

  console.log('')
  console.log('='.repeat(60))
  console.log(`Results: ${passed}/${total} tests passed`)
  console.log('='.repeat(60))

  if (passed !== total) {
    process.exit(1)
  }
}

// For Node.js execution
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllMCPManagerTests().catch(console.error)
}
