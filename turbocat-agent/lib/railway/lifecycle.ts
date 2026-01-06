/**
 * Container Lifecycle Service
 * Phase 4: Mobile Development - Task 3.3
 *
 * Manages Railway container lifecycle:
 * - provisionContainer(taskId, userId) -> creates container, stores in DB
 * - monitorContainer(containerId) -> updates status, logs
 * - cleanupInactiveContainers() -> stops containers idle >30 min
 * - handleContainerError(containerId, error) -> retry or mark failed
 */

import { db } from '@/lib/db/client'
import { railwayContainers } from '@/lib/db/schema'
import { eq, lt, and } from 'drizzle-orm'
import type { RailwayClient } from './client'
import {
  ContainerStatus,
  ContainerStatusResult,
  RailwayAPIError,
  ContainerEventCallback,
  ContainerEvent,
} from './types'
import { generateId } from '@/lib/utils/id'

// Inactivity timeout: 30 minutes in milliseconds
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

// Max retry attempts for container operations
const MAX_RETRY_ATTEMPTS = 3

// Retry delay base (exponential backoff)
const RETRY_DELAY_MS = 2000

// Track error counts per container for retry logic
const errorCounts = new Map<string, number>()

export interface ContainerLifecycleService {
  provisionContainer(
    taskId: string,
    userId: string,
  ): Promise<{ containerId: string; metroUrl: string; dbId: string }>
  monitorContainer(containerId: string): Promise<ContainerStatusResult & { lastActivityAt: Date }>
  cleanupInactiveContainers(): Promise<{ stoppedCount: number; errors: Array<{ containerId: string; error: string }> }>
  handleContainerError(
    containerId: string,
    error: Error,
  ): Promise<{ action: 'restarted' | 'marked_failed'; message: string }>
  updateActivity(containerId: string): Promise<void>
  getContainerByTaskId(
    taskId: string,
  ): Promise<{ containerId: string; metroUrl: string; status: ContainerStatus } | null>
  onEvent(callback: ContainerEventCallback): void
}

// Helper: sleep for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper: check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof RailwayAPIError) {
    // 404 errors are not retryable (container deleted)
    if (error.statusCode === 404) return false
    // 4xx errors are generally not retryable
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false
    return error.retryable
  }

  // Network and timeout errors are retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('crashed')
    )
  }

  return true
}

/**
 * Create a container lifecycle service
 */
export function createLifecycleService(client: RailwayClient): ContainerLifecycleService {
  const eventCallbacks: ContainerEventCallback[] = []

  // Emit event to all registered callbacks
  function emitEvent(event: ContainerEvent): void {
    for (const callback of eventCallbacks) {
      try {
        const result = callback(event)
        if (result instanceof Promise) {
          result.catch((err) => console.error('Event callback error:', err))
        }
      } catch (err) {
        console.error('Event callback error:', err)
      }
    }
  }

  return {
    async provisionContainer(
      taskId: string,
      userId: string,
    ): Promise<{ containerId: string; metroUrl: string; dbId: string }> {
      let lastError: unknown

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          // Create container via Railway API
          const result = await client.createContainer({
            taskId,
            userId,
          })

          // Generate database ID
          const dbId = generateId()

          // Store in database
          await db
            .insert(railwayContainers)
            .values({
              id: dbId,
              userId,
              taskId,
              containerId: result.containerId,
              metroUrl: result.metroUrl,
              status: 'starting',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastActivityAt: new Date(),
            })

          // Emit created event
          emitEvent({
            type: 'created',
            containerId: result.containerId,
            metroUrl: result.metroUrl,
          })

          return {
            containerId: result.containerId,
            metroUrl: result.metroUrl,
            dbId,
          }
        } catch (error) {
          lastError = error

          // Don't retry non-retryable errors
          if (!isRetryableError(error)) {
            throw error
          }

          // Wait before retrying (exponential backoff)
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
          }
        }
      }

      throw lastError
    },

    async monitorContainer(
      containerId: string,
    ): Promise<ContainerStatusResult & { lastActivityAt: Date }> {
      // Get status from Railway
      const status = await client.getContainerStatus(containerId)

      const now = new Date()

      // Update database
      await db
        .update(railwayContainers)
        .set({
          status: status.status,
          resourceUsage: status.resourceUsage,
          updatedAt: now,
          lastActivityAt: now,
        })
        .where(eq(railwayContainers.containerId, containerId))

      // Emit health check event
      emitEvent({
        type: 'health_check',
        containerId,
        healthy: status.status === 'running',
      })

      return {
        ...status,
        lastActivityAt: now,
      }
    },

    async cleanupInactiveContainers(): Promise<{
      stoppedCount: number
      errors: Array<{ containerId: string; error: string }>
    }> {
      const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT_MS)

      // Find inactive containers
      const inactiveContainers = await db
        .select()
        .from(railwayContainers)
        .where(
          and(
            lt(railwayContainers.lastActivityAt, cutoffTime),
            eq(railwayContainers.status, 'running'),
          ),
        )

      let stoppedCount = 0
      const errors: Array<{ containerId: string; error: string }> = []

      // Stop each inactive container
      for (const container of inactiveContainers) {
        try {
          await client.stopContainer(container.containerId)

          // Update database
          await db
            .update(railwayContainers)
            .set({
              status: 'stopped',
              updatedAt: new Date(),
            })
            .where(eq(railwayContainers.id, container.id))

          // Emit stopped event
          emitEvent({
            type: 'stopped',
            containerId: container.containerId,
            reason: 'inactivity',
          })

          stoppedCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({
            containerId: container.containerId,
            error: errorMessage,
          })
        }
      }

      return { stoppedCount, errors }
    },

    async handleContainerError(
      containerId: string,
      error: Error,
    ): Promise<{ action: 'restarted' | 'marked_failed'; message: string }> {
      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Mark as failed in database
        await db
          .update(railwayContainers)
          .set({
            status: 'error',
            updatedAt: new Date(),
          })
          .where(eq(railwayContainers.containerId, containerId))

        // Emit error event
        emitEvent({
          type: 'error',
          containerId,
          error: error.message,
        })

        // Clear error count
        errorCounts.delete(containerId)

        return {
          action: 'marked_failed',
          message: `Container marked as failed: ${error.message}`,
        }
      }

      // Get current error count
      const currentCount = errorCounts.get(containerId) || 0
      const newCount = currentCount + 1
      errorCounts.set(containerId, newCount)

      // Check if max retries exceeded
      if (newCount >= MAX_RETRY_ATTEMPTS) {
        // Mark as failed
        await db
          .update(railwayContainers)
          .set({
            status: 'error',
            updatedAt: new Date(),
          })
          .where(eq(railwayContainers.containerId, containerId))

        // Emit error event
        emitEvent({
          type: 'error',
          containerId,
          error: `Max retries exceeded: ${error.message}`,
        })

        // Clear error count
        errorCounts.delete(containerId)

        return {
          action: 'marked_failed',
          message: `Container marked as failed after ${MAX_RETRY_ATTEMPTS} retries`,
        }
      }

      // Attempt restart
      try {
        await client.startContainer(containerId)

        // Update status to starting
        await db
          .update(railwayContainers)
          .set({
            status: 'starting',
            updatedAt: new Date(),
          })
          .where(eq(railwayContainers.containerId, containerId))

        // Emit started event
        emitEvent({
          type: 'started',
          containerId,
        })

        return {
          action: 'restarted',
          message: `Container restarted (attempt ${newCount}/${MAX_RETRY_ATTEMPTS})`,
        }
      } catch (restartError) {
        // Restart failed, recursively handle
        return this.handleContainerError(
          containerId,
          restartError instanceof Error ? restartError : new Error('Restart failed'),
        )
      }
    },

    async updateActivity(containerId: string): Promise<void> {
      await db
        .update(railwayContainers)
        .set({
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(railwayContainers.containerId, containerId))

      // Emit activity event
      emitEvent({
        type: 'activity',
        containerId,
        timestamp: new Date(),
      })
    },

    async getContainerByTaskId(
      taskId: string,
    ): Promise<{ containerId: string; metroUrl: string; status: ContainerStatus } | null> {
      const result = await db
        .select()
        .from(railwayContainers)
        .where(eq(railwayContainers.taskId, taskId))

      if (result.length === 0) {
        return null
      }

      const container = result[0]
      return {
        containerId: container.containerId,
        metroUrl: container.metroUrl,
        status: container.status as ContainerStatus,
      }
    },

    onEvent(callback: ContainerEventCallback): void {
      eventCallbacks.push(callback)
    },
  }
}

/**
 * Singleton lifecycle service instance
 * Use this in production with the real Railway client
 */
let _lifecycleService: ContainerLifecycleService | null = null

export function getLifecycleService(client: RailwayClient): ContainerLifecycleService {
  if (!_lifecycleService) {
    _lifecycleService = createLifecycleService(client)
  }
  return _lifecycleService
}
