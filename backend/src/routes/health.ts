/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring service health and readiness.
 * Used by load balancers, orchestrators, and monitoring systems.
 *
 * @module routes/health
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../lib/prisma';
import { createSuccessResponse } from '../middleware/errorHandler';
import { logger } from '../lib/logger';
import { APP_VERSION } from '../lib/version';

const router = Router();

/**
 * Service start time for uptime calculation
 */
const startTime = Date.now();

/**
 * Health status interface
 */
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  uptimeFormatted: string;
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy' | 'not_configured';
      configured: boolean;
      responseTimeMs?: number;
      error?: string;
    };
  };
  environment: string;
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: |
 *       Comprehensive health check endpoint that checks all service dependencies
 *       and returns overall status. Used by monitoring systems and load balancers.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get('/', async (req: Request, res: Response) => {
  const requestId = req.requestId || 'unknown';

  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();

    // Calculate uptime
    const uptimeMs = Date.now() - startTime;

    // Determine overall status
    // If database is not configured, service is degraded but still operational
    const isHealthy = dbHealth.healthy;
    const isDegraded = !dbHealth.configured;
    const status = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';

    // Determine database status label
    let dbStatus: 'healthy' | 'unhealthy' | 'not_configured' = 'unhealthy';
    if (dbHealth.healthy) {
      dbStatus = 'healthy';
    } else if (!dbHealth.configured) {
      dbStatus = 'not_configured';
    }

    const healthStatus: HealthStatus = {
      status,
      version: APP_VERSION,
      uptime: uptimeMs,
      uptimeFormatted: formatUptime(uptimeMs),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          configured: dbHealth.configured,
          responseTimeMs: dbHealth.responseTimeMs,
          ...(dbHealth.error && { error: dbHealth.error }),
        },
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Log health check
    logger.debug('Health check performed', {
      requestId,
      status: healthStatus.status,
      dbStatus: healthStatus.services.database.status,
    });

    // Return appropriate status code
    // 200 for healthy/degraded, 503 for unhealthy
    const statusCode = isHealthy || isDegraded ? 200 : 503;
    res.status(statusCode).json(createSuccessResponse(healthStatus, requestId));
  } catch (error) {
    logger.error('Health check failed', { requestId, error });

    const healthStatus: HealthStatus = {
      status: 'unhealthy',
      version: APP_VERSION,
      uptime: Date.now() - startTime,
      uptimeFormatted: formatUptime(Date.now() - startTime),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'unhealthy',
          configured: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(503).json(createSuccessResponse(healthStatus, requestId));
  }
});

/**
 * @openapi
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: |
 *       Simple liveness check that confirms the service is running.
 *       Used by Kubernetes or similar orchestrators.
 *       If this fails, the service should be restarted.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: |
 *       Checks if the service is ready to accept traffic.
 *       Used by load balancers and orchestrators.
 *       Verifies all dependencies are available.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not_ready"
 *                 reason:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealth = await checkDatabaseHealth();

    if (!dbHealth.healthy) {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Database unavailable',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      reason: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
