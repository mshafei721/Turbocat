/**
 * Request Logger Middleware
 *
 * Logs all incoming HTTP requests with timing information.
 *
 * @module middleware/requestLogger
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logHttpRequest, logger } from '../lib/logger';

/**
 * Request logger middleware
 *
 * Logs:
 * - HTTP method
 * - URL path
 * - Response status code
 * - Response time in milliseconds
 * - Request ID
 */
export const requestLogger: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';

  // Log request start (debug level)
  logger.debug(`--> ${req.method} ${req.originalUrl}`, {
    type: 'request_start',
    method: req.method,
    url: req.originalUrl,
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    logHttpRequest(req.method, req.originalUrl, res.statusCode, responseTime, requestId);
  });

  next();
};

export default requestLogger;
