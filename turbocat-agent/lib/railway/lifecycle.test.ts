/**
 * Container Lifecycle Service Tests
 * Phase 4: Mobile Development - Task 3.3
 * TDD Approach: Write tests first, then implement
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { RailwayClient } from './client'
import { RailwayAPIError } from './types'

// Mock db module - need to hoist this
const mockDbInsert = vi.fn()
const mockDbUpdate = vi.fn()
const mockDbDelete = vi.fn()
const mockDbSelect = vi.fn()

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: vi.fn().mockResolvedValue([{ id: 'container-db-id' }]),
      }),
    }),
    update: () => ({
      set: () => ({
        where: vi.fn().mockResolvedValue([{ id: 'container-db-id' }]),
      }),
    }),
    delete: () => ({
      where: vi.fn().mockResolvedValue([{ id: 'container-db-id' }]),
    }),
    select: () => ({
      from: () => ({
        where: mockDbSelect,
      }),
    }),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  railwayContainers: { containerId: 'containerId', taskId: 'taskId', status: 'status', lastActivityAt: 'lastActivityAt', id: 'id' },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  lt: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args) => args),
}))

vi.mock('@/lib/utils/id', () => ({
  generateId: vi.fn().mockReturnValue('generated-id-123'),
}))

// Import after mocking
import {
  ContainerLifecycleService,
  createLifecycleService,
  INACTIVITY_TIMEOUT_MS,
} from './lifecycle'

// Create mock Railway client
function createMockClient(): RailwayClient {
  return {
    createContainer: vi.fn().mockResolvedValue({
      containerId: 'railway-container-123',
      metroUrl: 'https://test-project.up.railway.app',
      projectId: 'project-123',
      serviceId: 'service-123',
    }),
    startContainer: vi.fn().mockResolvedValue({ status: 'starting' }),
    stopContainer: vi.fn().mockResolvedValue({ status: 'stopped' }),
    deleteContainer: vi.fn().mockResolvedValue(true),
    getContainerStatus: vi.fn().mockResolvedValue({
      status: 'running',
      resourceUsage: { cpu: 25, ram: 256, network: 10 },
      uptimeSeconds: 3600,
    }),
    getContainerLogs: vi.fn().mockResolvedValue({
      logs: [],
      hasMore: false,
    }),
  }
}

describe('ContainerLifecycleService', () => {
  let service: ContainerLifecycleService
  let mockClient: RailwayClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockClient = createMockClient()
    service = createLifecycleService(mockClient)

    // Reset db select mock
    mockDbSelect.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('provisionContainer', () => {
    it('should create container and store in database', async () => {
      const result = await service.provisionContainer('task-123', 'user-456')

      expect(mockClient.createContainer).toHaveBeenCalledWith({
        taskId: 'task-123',
        userId: 'user-456',
      })
      expect(result).toHaveProperty('containerId')
      expect(result).toHaveProperty('metroUrl')
      expect(result.metroUrl).toContain('railway.app')
    })

    it('should include project name based on task ID', async () => {
      await service.provisionContainer('my-special-task', 'user-456')

      expect(mockClient.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'my-special-task',
        }),
      )
    })

    it('should handle container creation failure', async () => {
      vi.mocked(mockClient.createContainer).mockRejectedValueOnce(
        new RailwayAPIError('Failed to create container', 400),
      )

      await expect(service.provisionContainer('task-123', 'user-456')).rejects.toThrow(
        RailwayAPIError,
      )
    })

    it('should retry on transient failures', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      vi.mocked(mockClient.createContainer)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          containerId: 'railway-container-123',
          metroUrl: 'https://test-project.up.railway.app',
        })

      const result = await service.provisionContainer('task-retry', 'user-456')

      expect(result).toHaveProperty('containerId')
      expect(mockClient.createContainer).toHaveBeenCalledTimes(2)

      // Restore fake timers
      vi.useFakeTimers()
    }, 30000)

    it('should respect max retry attempts', async () => {
      // Use real timers for this test
      vi.useRealTimers()

      // Create new client and service for isolated test
      const newMockClient = createMockClient()
      const newService = createLifecycleService(newMockClient)
      // Use a retryable error (network error)
      vi.mocked(newMockClient.createContainer).mockRejectedValue(new Error('Network error'))

      await expect(newService.provisionContainer('task-retry-max', 'user-456')).rejects.toThrow()
      expect(newMockClient.createContainer).toHaveBeenCalledTimes(3)

      // Restore fake timers
      vi.useFakeTimers()
    }, 30000)
  })

  describe('monitorContainer', () => {
    it('should update container status in database', async () => {
      const result = await service.monitorContainer('container-123')

      expect(mockClient.getContainerStatus).toHaveBeenCalledWith('container-123')
      expect(result).toHaveProperty('status')
      expect(result.status).toBe('running')
    })

    it('should include resource usage data', async () => {
      const result = await service.monitorContainer('container-123')

      expect(result).toHaveProperty('resourceUsage')
      expect(result.resourceUsage).toEqual({ cpu: 25, ram: 256, network: 10 })
    })

    it('should update last activity timestamp', async () => {
      const result = await service.monitorContainer('container-123')

      expect(result).toHaveProperty('lastActivityAt')
    })

    it('should detect error status', async () => {
      vi.mocked(mockClient.getContainerStatus).mockResolvedValueOnce({
        status: 'error',
        resourceUsage: {},
      })

      const result = await service.monitorContainer('container-123')

      expect(result.status).toBe('error')
    })
  })

  describe('cleanupInactiveContainers', () => {
    it('should stop containers idle for more than 30 minutes', async () => {
      mockDbSelect.mockResolvedValueOnce([
        {
          id: 'db-id-1',
          containerId: 'container-1',
          lastActivityAt: new Date(Date.now() - 35 * 60 * 1000),
        },
        {
          id: 'db-id-2',
          containerId: 'container-2',
          lastActivityAt: new Date(Date.now() - 45 * 60 * 1000),
        },
      ])

      const result = await service.cleanupInactiveContainers()

      expect(result.stoppedCount).toBe(2)
      expect(mockClient.stopContainer).toHaveBeenCalledTimes(2)
    })

    it('should not stop recently active containers', async () => {
      mockDbSelect.mockResolvedValueOnce([])

      const result = await service.cleanupInactiveContainers()

      expect(result.stoppedCount).toBe(0)
      expect(mockClient.stopContainer).not.toHaveBeenCalled()
    })

    it('should handle partial failures gracefully', async () => {
      mockDbSelect.mockResolvedValueOnce([
        { id: 'db-id-1', containerId: 'container-1', lastActivityAt: new Date(Date.now() - 35 * 60 * 1000) },
        { id: 'db-id-2', containerId: 'container-2', lastActivityAt: new Date(Date.now() - 35 * 60 * 1000) },
      ])

      vi.mocked(mockClient.stopContainer)
        .mockResolvedValueOnce({ status: 'stopped' })
        .mockRejectedValueOnce(new Error('Failed to stop'))

      const result = await service.cleanupInactiveContainers()

      expect(result.stoppedCount).toBe(1)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('handleContainerError', () => {
    it('should attempt restart on transient errors', async () => {
      const result = await service.handleContainerError(
        'container-restart-123',
        new Error('Metro bundler crashed'),
      )

      expect(mockClient.startContainer).toHaveBeenCalledWith('container-restart-123')
      expect(result.action).toBe('restarted')
    })

    it('should mark as failed after max retries', async () => {
      vi.mocked(mockClient.startContainer).mockRejectedValue(new Error('Cannot restart'))

      let result
      for (let i = 0; i < 4; i++) {
        result = await service.handleContainerError(
          'container-error-test-' + Date.now(),
          new Error('Metro bundler crashed'),
        )
      }

      expect(result?.action).toBe('marked_failed')
    }, 15000)

    it('should not retry on permanent errors', async () => {
      vi.mocked(mockClient.startContainer).mockClear()

      const result = await service.handleContainerError(
        'container-permanent-error',
        new RailwayAPIError('Container deleted', 404),
      )

      expect(mockClient.startContainer).not.toHaveBeenCalled()
      expect(result.action).toBe('marked_failed')
    })
  })

  describe('getContainerByTaskId', () => {
    it('should return container info for valid task', async () => {
      mockDbSelect.mockResolvedValueOnce([
        {
          id: 'db-id',
          containerId: 'container-123',
          metroUrl: 'https://test.railway.app',
          status: 'running',
        },
      ])

      const result = await service.getContainerByTaskId('task-123')

      expect(result).toHaveProperty('containerId')
      expect(result?.status).toBe('running')
    })

    it('should return null for non-existent task', async () => {
      mockDbSelect.mockResolvedValueOnce([])

      const result = await service.getContainerByTaskId('non-existent')

      expect(result).toBeNull()
    })
  })
})

describe('INACTIVITY_TIMEOUT_MS', () => {
  it('should be 30 minutes', () => {
    expect(INACTIVITY_TIMEOUT_MS).toBe(30 * 60 * 1000)
  })
})
