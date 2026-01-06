/**
 * Railway API Client Tests
 * Phase 4: Mobile Development - Task 3.1
 * TDD Approach: Write tests first, then implement
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  RailwayClient,
  createRailwayClient,
  DEFAULT_RETRY_CONFIG,
} from './client'
import { RailwayAPIError } from './types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create successful GraphQL response
function successResponse(data: Record<string, unknown>) {
  return {
    ok: true,
    json: () => Promise.resolve({ data }),
  }
}

// Helper to create error GraphQL response
function errorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    statusText: message,
    headers: {
      get: () => null,
    },
    json: () => Promise.resolve({
      errors: [{ message }],
    }),
  }
}

// Mock all the API calls needed for createContainer
function mockCreateContainerSuccess() {
  // 1. Create project
  mockFetch.mockResolvedValueOnce(successResponse({
    projectCreate: { id: 'project-789', name: 'test-project' },
  }))

  // 2. Create service
  mockFetch.mockResolvedValueOnce(successResponse({
    serviceCreate: { id: 'service-abc', name: 'expo-metro' },
  }))

  // 3. Set EXPO_DEVTOOLS_LISTEN_ADDRESS
  mockFetch.mockResolvedValueOnce(successResponse({
    variableUpsert: true,
  }))

  // 4. Set REACT_NATIVE_PACKAGER_HOSTNAME
  mockFetch.mockResolvedValueOnce(successResponse({
    variableUpsert: true,
  }))

  // 5. Deploy service
  mockFetch.mockResolvedValueOnce(successResponse({
    serviceInstanceDeploy: { id: 'deployment-xyz' },
  }))

  // 6. Get service domains
  mockFetch.mockResolvedValueOnce(successResponse({
    serviceDomains: {
      serviceDomains: [{ domain: 'test-expo-project.up.railway.app' }],
    },
  }))
}

describe('RailwayClient', () => {
  let client: RailwayClient
  const testConfig = {
    apiToken: 'test-token-12345',
    teamId: 'team-abc',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    client = createRailwayClient(testConfig)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createRailwayClient', () => {
    it('should create a client with valid config', () => {
      expect(client).toBeDefined()
      expect(client.createContainer).toBeInstanceOf(Function)
      expect(client.startContainer).toBeInstanceOf(Function)
      expect(client.stopContainer).toBeInstanceOf(Function)
      expect(client.deleteContainer).toBeInstanceOf(Function)
      expect(client.getContainerStatus).toBeInstanceOf(Function)
      expect(client.getContainerLogs).toBeInstanceOf(Function)
    })

    it('should throw error if apiToken is missing', () => {
      expect(() => createRailwayClient({ apiToken: '' })).toThrow('Railway API token is required')
    })
  })

  describe('createContainer', () => {
    const containerConfig = {
      taskId: 'task-123',
      userId: 'user-456',
      projectName: 'test-expo-project',
    }

    it('should create a container successfully', async () => {
      mockCreateContainerSuccess()

      const result = await client.createContainer(containerConfig)

      expect(result).toHaveProperty('containerId')
      expect(result).toHaveProperty('metroUrl')
      expect(result.metroUrl).toContain('railway.app')
      expect(result.projectId).toBe('project-789')
      expect(result.serviceId).toBe('service-abc')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'))

      await expect(client.createContainer(containerConfig)).rejects.toThrow(RailwayAPIError)
    })

    it('should retry on transient failures', async () => {
      // First call fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Then all subsequent calls succeed
      mockCreateContainerSuccess()

      const result = await client.createContainer(containerConfig)
      expect(result).toHaveProperty('containerId')
      // 1 failed + 6 successful calls
      expect(mockFetch).toHaveBeenCalledTimes(7)
    })
  })

  describe('startContainer', () => {
    beforeEach(async () => {
      // Create a container first to populate metadata cache
      mockCreateContainerSuccess()
      await client.createContainer({
        taskId: 'task-start',
        userId: 'user-456',
      })
      vi.clearAllMocks()
    })

    it('should start a container successfully', async () => {
      mockFetch.mockResolvedValueOnce(successResponse({
        serviceInstanceRedeploy: { status: 'SUCCESS' },
      }))

      // Use the containerId from the created container
      const result = await client.startContainer('project-789:service-abc')
      expect(result.status).toBe('starting')
    })

    it('should handle container not found', async () => {
      await expect(client.startContainer('invalid-container')).rejects.toThrow(RailwayAPIError)
    })
  })

  describe('stopContainer', () => {
    it('should stop a container successfully when metadata exists', async () => {
      // Create container first
      mockCreateContainerSuccess()
      await client.createContainer({ taskId: 'task-stop', userId: 'user-456' })
      vi.clearAllMocks()

      mockFetch.mockResolvedValueOnce(successResponse({
        serviceDelete: { id: 'service-abc' },
      }))

      const result = await client.stopContainer('project-789:service-abc')
      expect(result.status).toBe('stopped')
    })

    it('should return stopped for unknown container', async () => {
      // No metadata, returns stopped without API call
      const result = await client.stopContainer('unknown-container')
      expect(result.status).toBe('stopped')
    })
  })

  describe('deleteContainer', () => {
    it('should delete a container successfully', async () => {
      // Create container first
      mockCreateContainerSuccess()
      await client.createContainer({ taskId: 'task-delete', userId: 'user-456' })
      vi.clearAllMocks()

      mockFetch.mockResolvedValueOnce(successResponse({
        projectDelete: { id: 'project-789' },
      }))

      const result = await client.deleteContainer('project-789:service-abc')
      expect(result).toBe(true)
    })

    it('should return true even if container does not exist', async () => {
      const result = await client.deleteContainer('nonexistent')
      expect(result).toBe(true)
    })
  })

  describe('getContainerStatus', () => {
    beforeEach(async () => {
      // Create a container first
      mockCreateContainerSuccess()
      await client.createContainer({ taskId: 'task-status', userId: 'user-456' })
      vi.clearAllMocks()
    })

    it('should return container status with resource usage', async () => {
      mockFetch.mockResolvedValueOnce(successResponse({
        service: {
          id: 'service-abc',
          deployments: {
            edges: [{
              node: {
                status: 'SUCCESS',
                createdAt: new Date().toISOString(),
              },
            }],
          },
        },
      }))

      const result = await client.getContainerStatus('project-789:service-abc')
      expect(result.status).toBe('running')
      expect(result).toHaveProperty('resourceUsage')
    })

    it('should handle container in starting state', async () => {
      mockFetch.mockResolvedValueOnce(successResponse({
        service: {
          id: 'service-abc',
          deployments: {
            edges: [{
              node: {
                status: 'BUILDING',
                createdAt: new Date().toISOString(),
              },
            }],
          },
        },
      }))

      const result = await client.getContainerStatus('project-789:service-abc')
      expect(result.status).toBe('starting')
    })

    it('should handle container in error state', async () => {
      mockFetch.mockResolvedValueOnce(successResponse({
        service: {
          id: 'service-abc',
          deployments: {
            edges: [{
              node: {
                status: 'FAILED',
                createdAt: new Date().toISOString(),
              },
            }],
          },
        },
      }))

      const result = await client.getContainerStatus('project-789:service-abc')
      expect(result.status).toBe('error')
    })

    it('should return stopped for unknown container', async () => {
      const result = await client.getContainerStatus('unknown-container')
      expect(result.status).toBe('stopped')
    })
  })

  describe('getContainerLogs', () => {
    it('should return logs for container with deploymentId', async () => {
      // Create container which stores deploymentId
      mockCreateContainerSuccess()
      await client.createContainer({ taskId: 'task-logs', userId: 'user-456' })
      vi.clearAllMocks()

      // Mock logs API call
      mockFetch.mockResolvedValueOnce(successResponse({
        deploymentLogs: [
          { timestamp: new Date().toISOString(), message: 'Metro bundler started', severity: 'INFO' },
          { timestamp: new Date().toISOString(), message: 'Listening on port 8081', severity: 'INFO' },
        ],
      }))

      const result = await client.getContainerLogs('project-789:service-abc')
      expect(result.logs).toHaveLength(2)
      expect(result.logs[0]).toHaveProperty('message')
      expect(result.hasMore).toBe(false)
    })

    it('should handle empty logs gracefully', async () => {
      const result = await client.getContainerLogs('unknown-container')
      expect(result.logs).toHaveLength(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('retry logic', () => {
    it('should respect max retries', async () => {
      // All calls fail
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(client.createContainer({
        taskId: 'task-123',
        userId: 'user-456',
      })).rejects.toThrow()

      // Should have called fetch maxRetries + 1 times
      expect(mockFetch).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries + 1)
    }, 15000) // Increase timeout for retry delays

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(400, 'Invalid request'))

      await expect(client.createContainer({
        taskId: 'task-123',
        userId: 'user-456',
      })).rejects.toThrow()

      // Should only call once (no retries for 400 errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('rate limiting', () => {
    it('should handle rate limit responses', async () => {
      // First call returns 429
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) => name === 'retry-after' ? '1' : null,
        },
        json: () => Promise.resolve({
          errors: [{ message: 'Rate limited' }],
        }),
      })

      // After retry, succeeds
      mockCreateContainerSuccess()

      const result = await client.createContainer({
        taskId: 'task-123',
        userId: 'user-456',
      })

      expect(result).toHaveProperty('containerId')
    }, 10000) // Increase timeout for rate limit delay
  })
})

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeGreaterThanOrEqual(2)
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeLessThanOrEqual(5)
    expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBeGreaterThanOrEqual(500)
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBeGreaterThanOrEqual(5000)
  })
})
