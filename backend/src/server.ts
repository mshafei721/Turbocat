/**
 * Express Server Entry Point
 *
 * This file is responsible for starting the Express server and handling
 * graceful shutdown. The application configuration is in app.ts.
 *
 * @module server
 */

import app from './app';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';
import publishingWorker from './workers/publishing.worker';

// Server configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || 'localhost';

/**
 * Start the server
 */
const server = app.listen(PORT, HOST, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    pid: process.pid,
  });

  logger.info(`Health check available at http://${HOST}:${PORT}/health`);
  logger.info(`API available at http://${HOST}:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
});

// Track server state
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 *
 * Ensures all connections are properly closed before exit:
 * 1. Stop accepting new connections
 * 2. Wait for existing requests to complete
 * 3. Close database connections
 * 4. Exit process
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Set a timeout for graceful shutdown
  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info('HTTP server closed');
          resolve();
        }
      });
    });

    // Close publishing worker (wait for current job to complete)
    if (publishingWorker) {
      logger.info('Closing publishing worker...');
      try {
        await publishingWorker.close();
        logger.info('Publishing worker closed');
      } catch (error) {
        logger.error('Error closing publishing worker', { error });
      }
    }

    // Close database connections
    await disconnectPrisma();
    logger.info('Database connections closed');

    // Clear the timeout
    clearTimeout(shutdownTimeout);

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  // Don't exit immediately - let graceful shutdown handle it
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Don't exit immediately - just log
  // In production, you might want to exit after this
});

export default server;
