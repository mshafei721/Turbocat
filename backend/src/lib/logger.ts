/**
 * Winston Logger Configuration
 *
 * Provides structured logging with different log levels and transports.
 * In development: logs to console with colors
 * In production: logs to files and console with JSON format
 *
 * @module lib/logger
 */

import winston from 'winston';
import path from 'path';

// Define log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * Log level configuration from environment
 * Defaults to 'debug' in development, 'info' in production
 */
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

/**
 * Custom format for development console output
 * Includes timestamp, level, and message with colors
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let metaString = '';
    if (Object.keys(metadata).length > 0) {
      metaString = ` ${JSON.stringify(metadata)}`;
    }
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  }),
);

/**
 * Custom format for production output
 * JSON format for easy parsing by log aggregation tools
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

/**
 * Get transports based on environment
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport - always enabled
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
  );

  // File transports - only in production or if explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );
  }

  return transports;
};

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: getLogLevel(),
  defaultMeta: { service: 'turbocat-backend' },
  transports: getTransports(),
  // Don't exit on uncaught exceptions, let the error handler deal with it
  exitOnError: false,
});

/**
 * Create a child logger with additional context
 *
 * @param context - Additional context to include in all log messages
 * @returns Child logger with context
 *
 * Usage:
 * ```typescript
 * const requestLogger = createChildLogger({ requestId: 'abc123' });
 * requestLogger.info('Processing request');
 * ```
 */
export const createChildLogger = (context: Record<string, unknown>): winston.Logger => {
  return logger.child(context);
};

/**
 * Log an HTTP request
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param responseTime - Response time in milliseconds
 * @param requestId - Unique request ID
 */
export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  requestId: string,
): void => {
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

  logger.log(logLevel, `${method} ${url} ${statusCode} ${responseTime}ms`, {
    type: 'http',
    method,
    url,
    statusCode,
    responseTime,
    requestId,
  });
};

// Add 'http' as a custom level between info and verbose
// Winston default levels: error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6

export default logger;
