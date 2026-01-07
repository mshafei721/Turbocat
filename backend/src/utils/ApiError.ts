/**
 * Custom API Error Class
 *
 * Provides a standardized error format for API responses.
 * All API errors should use this class for consistent error handling.
 *
 * @module utils/ApiError
 */

/**
 * Standard error codes used across the API
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error detail for validation errors or multiple issues
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Custom API Error class
 *
 * Usage:
 * ```typescript
 * throw new ApiError(400, 'Invalid input', ErrorCodes.VALIDATION_ERROR, [
 *   { field: 'email', message: 'Invalid email format' }
 * ]);
 * ```
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  /**
   * Create a new API error
   *
   * @param statusCode - HTTP status code
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param details - Additional error details (e.g., validation errors)
   * @param isOperational - Whether this is an operational error (vs programming error)
   */
  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: ErrorDetail[],
    isOperational = true,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks to work
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }

  // Static factory methods for common errors

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = 'Bad request', details?: ErrorDetail[]): ApiError {
    return new ApiError(400, message, ErrorCodes.BAD_REQUEST, details);
  }

  /**
   * Create a 400 Validation Error
   */
  static validation(message = 'Validation failed', details?: ErrorDetail[]): ApiError {
    return new ApiError(400, message, ErrorCodes.VALIDATION_ERROR, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message, ErrorCodes.UNAUTHORIZED);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Access denied. Insufficient permissions.'): ApiError {
    return new ApiError(403, message, ErrorCodes.FORBIDDEN);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, ErrorCodes.NOT_FOUND);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message, ErrorCodes.CONFLICT);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessableEntity(message = 'Unprocessable entity', details?: ErrorDetail[]): ApiError {
    return new ApiError(422, message, ErrorCodes.UNPROCESSABLE_ENTITY, details);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, message, ErrorCodes.TOO_MANY_REQUESTS);
  }

  /**
   * Create a 500 Internal Server error
   */
  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError(500, message, ErrorCodes.INTERNAL_ERROR, undefined, false);
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, message, ErrorCodes.SERVICE_UNAVAILABLE);
  }

  /**
   * Create a database error (500)
   */
  static database(message = 'Database operation failed'): ApiError {
    return new ApiError(500, message, ErrorCodes.DATABASE_ERROR, undefined, false);
  }

  /**
   * Create an external service error (502)
   */
  static externalService(message = 'External service error'): ApiError {
    return new ApiError(502, message, ErrorCodes.EXTERNAL_SERVICE_ERROR);
  }
}

export default ApiError;
