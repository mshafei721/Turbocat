/**
 * Tests for ApiError Utility
 *
 * Tests the custom API error class including:
 * - Error construction
 * - Static factory methods
 * - JSON serialization
 */

import { ApiError, ErrorCodes } from '../ApiError';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an error with all properties', () => {
      const error = new ApiError(400, 'Test error', ErrorCodes.BAD_REQUEST, [
        { field: 'email', message: 'Invalid email' },
      ]);

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
      expect(error.details).toHaveLength(1);
      expect(error.isOperational).toBe(true);
    });

    it('should use default code when not provided', () => {
      const error = new ApiError(500, 'Server error');

      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should be instanceof Error', () => {
      const error = new ApiError(400, 'Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });

    it('should capture stack trace', () => {
      const error = new ApiError(400, 'Test');

      expect(error.stack).toBeDefined();
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON format', () => {
      const error = new ApiError(400, 'Test error', ErrorCodes.VALIDATION_ERROR, [
        { field: 'name', message: 'Required' },
      ]);

      const json = error.toJSON();

      expect(json).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Test error',
        details: [{ field: 'name', message: 'Required' }],
      });
    });

    it('should exclude details when not provided', () => {
      const error = new ApiError(400, 'Test error', ErrorCodes.BAD_REQUEST);

      const json = error.toJSON();

      expect(json).toEqual({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Test error',
      });
      expect(json).not.toHaveProperty('details');
    });
  });

  describe('static factory methods', () => {
    describe('badRequest', () => {
      it('should create a 400 Bad Request error', () => {
        const error = ApiError.badRequest('Invalid input');

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
        expect(error.message).toBe('Invalid input');
      });

      it('should use default message', () => {
        const error = ApiError.badRequest();

        expect(error.message).toBe('Bad request');
      });
    });

    describe('validation', () => {
      it('should create a 400 Validation error with details', () => {
        const details = [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ];
        const error = ApiError.validation('Validation failed', details);

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(error.details).toEqual(details);
      });
    });

    describe('unauthorized', () => {
      it('should create a 401 Unauthorized error', () => {
        const error = ApiError.unauthorized('Token expired');

        expect(error.statusCode).toBe(401);
        expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
        expect(error.message).toBe('Token expired');
      });

      it('should use default message', () => {
        const error = ApiError.unauthorized();

        expect(error.message).toBe('Authentication required');
      });
    });

    describe('forbidden', () => {
      it('should create a 403 Forbidden error', () => {
        const error = ApiError.forbidden('Admin access required');

        expect(error.statusCode).toBe(403);
        expect(error.code).toBe(ErrorCodes.FORBIDDEN);
        expect(error.message).toBe('Admin access required');
      });

      it('should use default message', () => {
        const error = ApiError.forbidden();

        expect(error.message).toContain('Access denied');
      });
    });

    describe('notFound', () => {
      it('should create a 404 Not Found error', () => {
        const error = ApiError.notFound('User not found');

        expect(error.statusCode).toBe(404);
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
        expect(error.message).toBe('User not found');
      });

      it('should use default message', () => {
        const error = ApiError.notFound();

        expect(error.message).toBe('Resource not found');
      });
    });

    describe('conflict', () => {
      it('should create a 409 Conflict error', () => {
        const error = ApiError.conflict('Email already registered');

        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(ErrorCodes.CONFLICT);
        expect(error.message).toBe('Email already registered');
      });

      it('should use default message', () => {
        const error = ApiError.conflict();

        expect(error.message).toBe('Resource already exists');
      });
    });

    describe('unprocessableEntity', () => {
      it('should create a 422 Unprocessable Entity error', () => {
        const error = ApiError.unprocessableEntity('Cannot process request');

        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(ErrorCodes.UNPROCESSABLE_ENTITY);
      });
    });

    describe('tooManyRequests', () => {
      it('should create a 429 Too Many Requests error', () => {
        const error = ApiError.tooManyRequests();

        expect(error.statusCode).toBe(429);
        expect(error.code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
        expect(error.message).toContain('Too many requests');
      });
    });

    describe('internal', () => {
      it('should create a 500 Internal Server error', () => {
        const error = ApiError.internal('Database connection failed');

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
        expect(error.isOperational).toBe(false);
      });

      it('should use default message', () => {
        const error = ApiError.internal();

        expect(error.message).toBe('An unexpected error occurred');
      });
    });

    describe('serviceUnavailable', () => {
      it('should create a 503 Service Unavailable error', () => {
        const error = ApiError.serviceUnavailable('Database maintenance');

        expect(error.statusCode).toBe(503);
        expect(error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
      });

      it('should use default message', () => {
        const error = ApiError.serviceUnavailable();

        expect(error.message).toBe('Service temporarily unavailable');
      });
    });

    describe('database', () => {
      it('should create a 500 Database error', () => {
        const error = ApiError.database('Query timeout');

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
        expect(error.isOperational).toBe(false);
      });
    });

    describe('externalService', () => {
      it('should create a 502 External Service error', () => {
        const error = ApiError.externalService('Payment gateway timeout');

        expect(error.statusCode).toBe(502);
        expect(error.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR);
      });
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
      expect(ErrorCodes.UNPROCESSABLE_ENTITY).toBe('UNPROCESSABLE_ENTITY');
      expect(ErrorCodes.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCodes.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    });
  });
});
