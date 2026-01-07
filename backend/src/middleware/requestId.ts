/**
 * Request ID Middleware
 *
 * Generates and attaches a unique request ID to each incoming request.
 * This ID is used for request tracing and logging.
 *
 * @module middleware/requestId
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID header name
 * Uses X-Request-ID as it's a common convention
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate or extract request ID middleware
 *
 * If the incoming request has an X-Request-ID header, use that.
 * Otherwise, generate a new UUID.
 *
 * The request ID is:
 * - Attached to req.requestId for use in handlers
 * - Set as X-Request-ID response header for client correlation
 */
export const requestIdMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers[REQUEST_ID_HEADER] as string | undefined) || uuidv4();

  // Attach to request object
  req.requestId = requestId;

  // Set response header
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

export default requestIdMiddleware;
