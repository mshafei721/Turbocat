# Turbocat Error Handling Guide

This document provides comprehensive documentation of error handling in the Turbocat API, including all error codes, response formats, and troubleshooting tips.

## Table of Contents

- [Error Response Format](#error-response-format)
- [Error Codes Reference](#error-codes-reference)
- [HTTP Status Codes](#http-status-codes)
- [Validation Errors](#validation-errors)
- [Authentication Errors](#authentication-errors)
- [Resource Errors](#resource-errors)
- [Server Errors](#server-errors)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Best Practices](#best-practices)

---

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific error for this field",
        "code": "validation_code"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-07T10:30:00.000Z",
    "requestId": "abc123-def456-ghi789"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable error description |
| `error.details` | array | Optional array of specific errors (e.g., validation) |
| `meta.timestamp` | string | ISO 8601 timestamp of when error occurred |
| `meta.requestId` | string | Unique request ID for debugging/support |

---

## Error Codes Reference

### Client Errors (4xx)

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `BAD_REQUEST` | 400 | Invalid request format | Malformed JSON, missing Content-Type |
| `VALIDATION_ERROR` | 400 | Request validation failed | Invalid field values, missing required fields |
| `UNAUTHORIZED` | 401 | Authentication required | Missing/expired token, invalid credentials |
| `FORBIDDEN` | 403 | Insufficient permissions | Accessing another user's resource, wrong role |
| `NOT_FOUND` | 404 | Resource not found | Invalid ID, deleted resource |
| `CONFLICT` | 409 | Resource conflict | Duplicate email, unique constraint violation |
| `UNPROCESSABLE_ENTITY` | 422 | Cannot process request | Business logic violation |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | Too many requests in time window |

### Server Errors (5xx)

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error | Bug, unhandled exception |
| `DATABASE_ERROR` | 500 | Database operation failed | Connection issue, query error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Maintenance, dependency down |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service error | Third-party API failure |

---

## HTTP Status Codes

### Success Status Codes

| Status | Description | When Used |
|--------|-------------|-----------|
| 200 OK | Request successful | GET, PATCH, PUT |
| 201 Created | Resource created | POST (create) |
| 204 No Content | Request successful, no content | DELETE |

### Error Status Codes

| Status | Description | Error Code |
|--------|-------------|------------|
| 400 Bad Request | Invalid request | `BAD_REQUEST`, `VALIDATION_ERROR` |
| 401 Unauthorized | Authentication required | `UNAUTHORIZED` |
| 403 Forbidden | Access denied | `FORBIDDEN` |
| 404 Not Found | Resource not found | `NOT_FOUND` |
| 409 Conflict | Resource conflict | `CONFLICT` |
| 422 Unprocessable Entity | Business logic error | `UNPROCESSABLE_ENTITY` |
| 429 Too Many Requests | Rate limited | `TOO_MANY_REQUESTS` |
| 500 Internal Server Error | Server error | `INTERNAL_ERROR`, `DATABASE_ERROR` |
| 502 Bad Gateway | External service error | `EXTERNAL_SERVICE_ERROR` |
| 503 Service Unavailable | Service down | `SERVICE_UNAVAILABLE` |

---

## Validation Errors

Validation errors occur when request data doesn't meet the required schema.

### Example Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "too_small"
      },
      {
        "field": "name",
        "message": "Required",
        "code": "invalid_type"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-07T10:30:00.000Z",
    "requestId": "val-123-456"
  }
}
```

### Common Validation Codes

| Code | Description | Example |
|------|-------------|---------|
| `invalid_type` | Wrong data type | String where number expected |
| `invalid_string` | Invalid string format | Bad email format |
| `too_small` | Value too short/small | Password < 8 chars |
| `too_big` | Value too long/large | Name > 255 chars |
| `invalid_enum_value` | Invalid enum option | Status: "INVALID" |
| `custom` | Custom validation rule | Business logic validation |

### Field-Specific Validations

#### User Registration

| Field | Rules |
|-------|-------|
| `email` | Valid email, max 255 chars, unique |
| `password` | Min 8 chars, max 128 chars |
| `fullName` | Max 255 chars, optional |

#### Agent Creation

| Field | Rules |
|-------|-------|
| `name` | Required, 1-255 chars |
| `type` | Required, enum: CODE, API, LLM, DATA, WORKFLOW |
| `description` | Max 2000 chars, optional |
| `maxExecutionTime` | 1-3600 seconds |
| `maxMemoryMb` | 1-8192 MB |
| `maxConcurrentExecutions` | 1-100 |
| `tags` | Array, max 20 items, each max 50 chars |

#### Workflow Creation

| Field | Rules |
|-------|-------|
| `name` | Required, 1-255 chars |
| `description` | Max 2000 chars, optional |
| `scheduleCron` | Valid cron expression, max 100 chars |
| `scheduleTimezone` | Valid timezone, max 50 chars |
| `steps` | Array, max 100 items |

---

## Authentication Errors

### Token Errors

#### Missing Token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token in the Authorization header."
  }
}
```

**Solution:** Include the Authorization header with a valid Bearer token.

#### Expired Token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token has expired"
  }
}
```

**Solution:** Use the refresh token to get a new access token.

#### Invalid Token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid access token format"
  }
}
```

**Solution:** Ensure the token is correctly formatted and not corrupted.

### Session Errors

#### Session Expired

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session has expired or been invalidated"
  }
}
```

**Solution:** Log in again to create a new session.

### Permission Errors

#### Access Denied

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

**Solution:** Verify you own the resource or have the required role.

#### Insufficient Role

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Required role: ADMIN"
  }
}
```

**Solution:** This operation requires admin privileges.

---

## Resource Errors

### Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Agent not found"
  }
}
```

**Possible Causes:**
- Invalid resource ID
- Resource has been deleted
- Resource belongs to another user

### Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A user with this email already exists"
  }
}
```

**Possible Causes:**
- Duplicate email registration
- Unique constraint violation
- Resource already exists

### Invalid ID Format

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid id format"
  }
}
```

**Solution:** Ensure the ID is a valid UUID format:
- Example: `123e4567-e89b-12d3-a456-426614174000`

---

## Server Errors

### Internal Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**What to do:**
1. Note the `requestId` from the response
2. Retry the request after a few seconds
3. If persistent, contact support with the request ID

### Database Error

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Database operation failed"
  }
}
```

**Possible Causes:**
- Database connection issue
- Query timeout
- Transaction deadlock

### Service Unavailable

```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable"
  }
}
```

**What to do:**
1. Wait a few minutes
2. Check status page for maintenance notices
3. Retry with exponential backoff

---

## Troubleshooting Guide

### "Authentication required" (401)

1. **Check token presence**
   ```
   Authorization: Bearer <your-token>
   ```

2. **Verify token format**
   - Should be a JWT (three parts separated by dots)
   - Example: `eyJhbGciOiJIUzI1NiIs...`

3. **Check token expiration**
   - Access tokens expire in 15 minutes
   - Decode at [jwt.io](https://jwt.io) to check `exp` claim

4. **Refresh if expired**
   ```typescript
   POST /api/v1/auth/refresh
   { "refreshToken": "<refresh-token>" }
   ```

### "Validation failed" (400)

1. **Check field requirements**
   - Read the API documentation for required fields
   - Ensure correct data types

2. **Review details array**
   - Each validation error specifies the field and issue
   - Fix all listed errors before retrying

3. **Common fixes**
   - Remove extra whitespace from strings
   - Use correct enum values (UPPERCASE)
   - Ensure arrays don't exceed limits

### "Resource not found" (404)

1. **Verify the ID**
   - Must be a valid UUID
   - Check for typos

2. **Check permissions**
   - You can only access your own resources
   - Admins can access all resources

3. **Verify resource exists**
   - Resource may have been deleted
   - List resources to find valid IDs

### "Rate limit exceeded" (429)

1. **Wait and retry**
   - Default: 100 requests per minute
   - Wait for the rate limit window to reset

2. **Implement backoff**
   ```typescript
   const delay = baseDelay * Math.pow(2, attemptNumber);
   await new Promise(r => setTimeout(r, delay));
   ```

3. **Check rate limit headers**
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1704628260
   ```

### "Internal server error" (500)

1. **Save the request ID**
   - Found in `meta.requestId`
   - Useful for support inquiries

2. **Retry the request**
   - May be a transient error
   - Wait a few seconds before retrying

3. **Contact support**
   - If error persists
   - Include request ID and reproduction steps

---

## Best Practices

### Error Handling in Code

```typescript
async function makeRequest<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    const json = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (json.error?.code) {
        case 'UNAUTHORIZED':
          // Attempt token refresh
          await refreshToken();
          return makeRequest(url, options);

        case 'TOO_MANY_REQUESTS':
          // Wait and retry
          await delay(60000);
          return makeRequest(url, options);

        case 'VALIDATION_ERROR':
          // Log validation details for debugging
          console.error('Validation errors:', json.error.details);
          throw new ValidationError(json.error);

        case 'NOT_FOUND':
          throw new NotFoundError(json.error.message);

        default:
          throw new ApiError(json.error);
      }
    }

    return json.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new NetworkError('Failed to connect to API');
  }
}
```

### Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableCodes: ['INTERNAL_ERROR', 'DATABASE_ERROR', 'SERVICE_UNAVAILABLE']
};

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors
      if (error instanceof ApiError) {
        if (!retryConfig.retryableCodes.includes(error.code)) {
          throw error;
        }
      }

      // Calculate delay with exponential backoff + jitter
      const baseDelay = retryConfig.baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay + jitter, retryConfig.maxDelayMs);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Logging Errors

```typescript
function logApiError(error: ApiError, context: Record<string, unknown>) {
  console.error({
    timestamp: new Date().toISOString(),
    errorCode: error.code,
    errorMessage: error.message,
    requestId: error.requestId,
    statusCode: error.statusCode,
    details: error.details,
    context
  });
}
```

### User-Friendly Messages

```typescript
const userMessages: Record<string, string> = {
  'UNAUTHORIZED': 'Please log in to continue.',
  'FORBIDDEN': 'You don\'t have permission to do this.',
  'NOT_FOUND': 'The item you\'re looking for doesn\'t exist.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'CONFLICT': 'This item already exists.',
  'TOO_MANY_REQUESTS': 'Too many requests. Please wait a moment.',
  'INTERNAL_ERROR': 'Something went wrong. Please try again later.',
  'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.'
};

function getUserMessage(errorCode: string): string {
  return userMessages[errorCode] || 'An error occurred. Please try again.';
}
```

---

## Error Code Quick Reference

| Situation | Error Code | HTTP Status |
|-----------|------------|-------------|
| Missing auth token | UNAUTHORIZED | 401 |
| Expired auth token | UNAUTHORIZED | 401 |
| Invalid auth token | UNAUTHORIZED | 401 |
| Wrong user role | FORBIDDEN | 403 |
| Not resource owner | FORBIDDEN | 403 |
| Invalid request body | VALIDATION_ERROR | 400 |
| Missing required field | VALIDATION_ERROR | 400 |
| Invalid field value | VALIDATION_ERROR | 400 |
| Resource not found | NOT_FOUND | 404 |
| Invalid UUID format | BAD_REQUEST | 400 |
| Duplicate resource | CONFLICT | 409 |
| Rate limit hit | TOO_MANY_REQUESTS | 429 |
| Server error | INTERNAL_ERROR | 500 |
| Database error | DATABASE_ERROR | 500 |
| External API error | EXTERNAL_SERVICE_ERROR | 502 |
| Service down | SERVICE_UNAVAILABLE | 503 |

---

**Last Updated:** January 7, 2026
