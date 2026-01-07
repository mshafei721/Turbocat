/**
 * Error Handling Middleware
 *
 * Provides centralized error handling for the Express application.
 * Ensures consistent error response format across all endpoints.
 *
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError, ErrorCodes, ErrorCode } from '../utils/ApiError';
import { logger } from '../lib/logger';

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string; code?: string }>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Extend Express Request to include requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 *
 * Handles:
 * - ApiError instances (operational errors)
 * - Standard Error instances (programming errors)
 * - Unknown errors
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Default error values
  let statusCode = 500;
  let errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: ApiError['details'];
  let isOperational = false;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
    isOperational = err.isOperational;
  }
  // Handle standard errors
  else if (err instanceof Error) {
    message = err.message;

    // Handle specific error types
    if (err.name === 'SyntaxError' && 'body' in err) {
      // JSON parse error
      statusCode = 400;
      errorCode = ErrorCodes.BAD_REQUEST;
      message = 'Invalid JSON in request body';
      isOperational = true;
    } else if (err.name === 'ValidationError') {
      // Validation error (e.g., from Zod)
      statusCode = 400;
      errorCode = ErrorCodes.VALIDATION_ERROR;
      isOperational = true;
    }
  }

  // Log the error
  const logData = {
    requestId,
    statusCode,
    errorCode,
    message,
    details,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Log level based on status code and operational status
  if (statusCode >= 500 && !isOperational) {
    // Programming errors - log with full stack trace
    logger.error('Unhandled error', logData);
  } else if (statusCode >= 500) {
    // Operational server errors
    logger.error('Server error', logData);
  } else if (statusCode >= 400) {
    // Client errors
    logger.warn('Client error', logData);
  }

  // Build response
  const response: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message:
        // In production, hide internal error details
        process.env.NODE_ENV === 'production' && statusCode >= 500 && !isOperational
          ? 'An unexpected error occurred'
          : message,
      ...(details && { details }),
    },
    meta: {
      timestamp,
      requestId,
    },
  };

  // Send response
  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to properly catch and forward errors
 *
 * Usage:
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 * ```
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a success response
 *
 * @param data - Response data
 * @param requestId - Request ID for tracing
 * @returns Formatted success response
 */
export const createSuccessResponse = <T>(data: T, requestId: string): ApiResponse<T> => {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
};

export default errorHandler;
