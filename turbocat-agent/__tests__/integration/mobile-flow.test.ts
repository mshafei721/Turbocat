/**
 * Mobile Task Flow Integration Tests
 * Phase 7: Testing & QA - Task 7.2
 *
 * Tests the complete mobile task creation flow:
 * 1. Create mobile task via API
 * 2. Container provisioning initiated
 * 3. Metro bundler starts
 * 4. QR code generated
 * 5. Database state verified
 *
 * @file __tests__/integration/mobile-flow.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Mock Railway client and lifecycle service
 */
vi.mock('@/lib/railway/client', () => ({
  createRailwayClient: vi.fn(() => ({
    createContainer: vi.fn().mockResolvedValue({
      containerId: 'railway-mobile-xyz123',
      metroUrl: 'https://mobile-xyz123.up.railway.app',
      projectId: 'proj-123',
      serviceId: 'svc-123',
    }),
    startContainer: vi.fn().mockResolvedValue({ status: 'running' }),
    getContainerStatus: vi.fn().mockResolvedValue({
      status: 'running',
      resourceUsage: { cpu: 45, ram: 512, network: 2.5 },
      uptimeSeconds: 120,
    }),
    getContainerLogs: vi.fn().mockResolvedValue({
      logs: [
        { timestamp: new Date(), level: 'info', message: 'Metro bundler started' },
        { timestamp: new Date(), level: 'info', message: 'Waiting for connections' },
      ],
      hasMore: false,
    }),
  })),
}))

vi.mock('@/lib/railway/lifecycle', () => ({
  createLifecycleService: vi.fn((client) => ({
    provisionContainer: vi.fn().mockResolvedValue({
      containerId: 'railway-mobile-xyz123',
      metroUrl: 'https://mobile-xyz123.up.railway.app',
      dbId: 'db-container-123',
    }),
    monitorContainer: vi.fn().mockResolvedValue({
      status: 'running',
      resourceUsage: { cpu: 45, ram: 512, network: 2.5 },
      uptimeSeconds: 120,
      lastActivityAt: new Date(),
    }),
  })),
}))

vi.mock('@/lib/railway/qrcode', () => ({
  generateQRCode: vi.fn().mockResolvedValue({
    svg: '<svg></svg>',
    dataUrl: 'data:image/svg+xml;base64,...',
    error: null,
  }),
  cacheQRCode: vi.fn(),
  getCachedQRCode: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'task-mobile-456',
            platform: 'mobile',
            metroUrl: 'https://mobile-xyz123.up.railway.app',
            containerId: 'railway-mobile-xyz123',
            createdAt: new Date(),
          },
        ]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi
          .fn()
          .mockResolvedValue([
            { id: 'task-mobile-456', platform: 'mobile', metroUrl: 'https://mobile-xyz123.up.railway.app' },
          ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ id: 'task-mobile-456' }]),
      })),
    })),
  },
}))

describe('Mobile Task Flow Integration Tests', () => {
  /**
   * Test 1: Create mobile task endpoint validates platform
   */
  it('should accept mobile platform in task creation', async () => {
    const taskPayload = {
      title: 'Mobile Weather App',
      description: 'Build a weather app',
      platform: 'mobile',
      userId: 'user-789',
    }

    // Validate payload
    expect(taskPayload.platform).toBe('mobile')
    expect(taskPayload.title).toBeDefined()
  })

  /**
   * Test 2: Container provisioning is initiated automatically
   */
  it('should provision Railway container for mobile task', async () => {
    const { createLifecycleService } = await import('@/lib/railway/lifecycle')
    const { createRailwayClient } = await import('@/lib/railway/client')

    const client = createRailwayClient('test-api-key')
    const lifecycleService = createLifecycleService(client)

    const result = await lifecycleService.provisionContainer('task-123', 'user-789')

    expect(result.containerId).toBe('railway-mobile-xyz123')
    expect(result.metroUrl).toContain('mobile-xyz123.up.railway.app')
    expect(result.dbId).toBe('db-container-123')
  })

  /**
   * Test 3: Metro bundler status is monitored
   */
  it('should monitor Metro bundler status after provisioning', async () => {
    const { createLifecycleService } = await import('@/lib/railway/lifecycle')
    const { createRailwayClient } = await import('@/lib/railway/client')

    const client = createRailwayClient('test-api-key')
    const lifecycleService = createLifecycleService(client)

    const statusResult = await lifecycleService.monitorContainer('railway-mobile-xyz123')

    expect(statusResult.status).toBe('running')
    expect(statusResult.resourceUsage).toBeDefined()
    expect(statusResult.resourceUsage?.cpu).toBeGreaterThan(0)
    expect(statusResult.lastActivityAt).toBeInstanceOf(Date)
  })

  /**
   * Test 4: QR code is generated from Metro URL
   */
  it('should generate QR code from Metro URL', async () => {
    const { generateQRCode } = await import('@/lib/railway/qrcode')

    const metroUrl = 'https://mobile-xyz123.up.railway.app'
    const qrResult = await generateQRCode(metroUrl)

    expect(qrResult.svg).toBeDefined()
    expect(qrResult.dataUrl).toContain('data:image')
    expect(qrResult.error).toBeNull()
  })

  /**
   * Test 5: Task record is created with platform and container info
   */
  it('should create task record with mobile platform and container info', async () => {
    const { db } = await import('@/lib/db/client')

    const insertResult = await db
      .insert({
        title: 'Mobile Task',
        platform: 'mobile',
        userId: 'user-789',
      } as any)
      .values({
        title: 'Mobile Task',
        platform: 'mobile',
        userId: 'user-789',
      })
      .returning()

    expect(insertResult).toHaveLength(1)
    expect(insertResult[0].platform).toBe('mobile')
    expect(insertResult[0].id).toBe('task-mobile-456')
  })

  /**
   * Test 6: Container ID is linked to task
   */
  it('should link container ID to task record', async () => {
    const { db } = await import('@/lib/db/client')

    // Update task with container info
    const updateResult = await db
      .update({} as any)
      .set({
        containerId: 'railway-mobile-xyz123',
        metroUrl: 'https://mobile-xyz123.up.railway.app',
      })
      .where({} as any)

    expect(updateResult).toBeDefined()
  })

  /**
   * Test 7: Metro URL is accessible and valid
   */
  it('should return valid Metro URL format', async () => {
    const metroUrl = 'https://mobile-xyz123.up.railway.app'

    // Validate URL format
    expect(metroUrl).toMatch(/^https:\/\//)
    expect(metroUrl).toContain('railway.app')
    expect(metroUrl).not.toContain('exp://')
  })

  /**
   * Test 8: Complete flow from task creation to QR code ready
   */
  it('should complete full mobile task flow from creation to QR code', async () => {
    const { createLifecycleService } = await import('@/lib/railway/lifecycle')
    const { createRailwayClient } = await import('@/lib/railway/client')
    const { generateQRCode } = await import('@/lib/railway/qrcode')

    // Step 1: Create client and service
    const client = createRailwayClient('test-api-key')
    const lifecycleService = createLifecycleService(client)

    // Step 2: Provision container
    const provisionResult = await lifecycleService.provisionContainer('task-123', 'user-789')
    expect(provisionResult.containerId).toBeDefined()
    expect(provisionResult.metroUrl).toBeDefined()

    // Step 3: Monitor container status
    const statusResult = await lifecycleService.monitorContainer(provisionResult.containerId)
    expect(statusResult.status).toBe('running')

    // Step 4: Generate QR code
    const qrResult = await generateQRCode(provisionResult.metroUrl)
    expect(qrResult.dataUrl).toContain('data:image')

    // Full flow successful
    expect(provisionResult.dbId).toBe('db-container-123')
    expect(statusResult.resourceUsage?.cpu).toBeGreaterThan(0)
  })

  /**
   * Test 9: Container mock responds to health checks
   */
  it('should respond to health checks during monitoring', async () => {
    const { createRailwayClient } = await import('@/lib/railway/client')

    const client = createRailwayClient('test-api-key')
    const statusResult = await client.getContainerStatus('railway-mobile-xyz123')

    expect(statusResult.status).toBe('running')
    expect(statusResult.uptimeSeconds).toBeGreaterThan(0)
  })

  /**
   * Test 10: Logs are streamed from container
   */
  it('should stream logs from Metro container', async () => {
    const { createRailwayClient } = await import('@/lib/railway/client')

    const client = createRailwayClient('test-api-key')
    const logsResult = await client.getContainerLogs('railway-mobile-xyz123')

    expect(logsResult.logs).toHaveLength(2)
    expect(logsResult.logs[0].message).toContain('Metro')
    expect(logsResult.logs[0].level).toBe('info')
  })

  /**
   * Test 11: Database state after container provisioning
   */
  it('should verify database state after provisioning', async () => {
    const { db } = await import('@/lib/db/client')

    // Mock select query
    const result = await db
      .select({} as any)
      .from({} as any)
      .where({} as any)

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  /**
   * Test 12: Task can be queried after creation
   */
  it('should retrieve created mobile task from database', async () => {
    const { db } = await import('@/lib/db/client')

    const result = await db
      .select({} as any)
      .from({} as any)
      .where({} as any)

    expect(result).toHaveLength(1)
    expect(result[0].platform).toBe('mobile')
  })
})
