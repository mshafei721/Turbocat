# API Specifications

**Version:** 1.0
**Date:** January 5, 2026
**Base URL:** `https://api.turbocat.dev/v1`

---

## Overview

This document defines the complete RESTful API specification for the Turbocat platform. All endpoints follow REST conventions and return consistent JSON responses.

### API Principles
1. **RESTful Design**: Resource-based URLs, HTTP methods for actions
2. **JSON Format**: All requests and responses use JSON
3. **Versioning**: API versioned in URL path (`/v1/`)
4. **Authentication**: JWT Bearer tokens for protected endpoints
5. **Pagination**: Cursor-based pagination for list endpoints
6. **Filtering**: Query parameters for filtering and sorting
7. **Error Handling**: Consistent error response format

---

## Authentication

### Headers
All authenticated requests must include:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Token Format
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

---

## Standard Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2026-01-05T12:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### List Response (with Pagination)
```json
{
  "success": true,
  "data": [ /* array of resources */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 95,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2026-01-05T12:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-05T12:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user",
      "createdAt": "2026-01-05T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 900
    }
  }
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required, min 8 chars, must include uppercase, lowercase, number, special char
- `fullName`: Optional, max 255 chars

---

### POST /auth/login

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 900
    }
  }
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/logout

Invalidate current session.

**Request:** (empty body)

**Response (204 No Content)**

---

### POST /auth/forgot-password

Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent if account exists"
  }
}
```

---

### POST /auth/reset-password

Reset password using reset token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset"
  }
}
```

---

## User Endpoints

### GET /users/me

Get current user profile.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "avatarUrl": "https://...",
    "role": "user",
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLoginAt": "2026-01-05T12:00:00Z"
  }
}
```

---

### PATCH /users/me

Update current user profile.

**Authentication:** Required

**Request:**
```json
{
  "fullName": "Jane Doe",
  "avatarUrl": "https://...",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "avatarUrl": "https://...",
    "preferences": {
      "theme": "light",
      "notifications": false
    },
    "updatedAt": "2026-01-05T12:00:00Z"
  }
}
```

---

## Agent Endpoints

### GET /agents

List all agents for current user.

**Authentication:** Required

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `pageSize` (integer, default: 20, max: 100): Items per page
- `type` (string): Filter by agent type (code, api, llm, data, workflow)
- `status` (string): Filter by status (draft, active, inactive, archived)
- `search` (string): Search in name and description
- `tags` (string, comma-separated): Filter by tags
- `sortBy` (string, default: createdAt): Sort field
- `sortOrder` (string, default: desc): Sort order (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Web Scraper",
      "description": "Scrapes web content",
      "type": "code",
      "status": "active",
      "version": 1,
      "config": {},
      "capabilities": ["http", "parsing"],
      "totalExecutions": 150,
      "successfulExecutions": 148,
      "avgExecutionTimeMs": 2500,
      "tags": ["web", "scraping"],
      "isPublic": false,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 3,
    "totalItems": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET /agents/:id

Get single agent by ID.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Web Scraper",
    "description": "Scrapes web content",
    "type": "code",
    "status": "active",
    "version": 1,
    "config": {
      "runtime": "python3.11",
      "timeout": 300,
      "memory": 512
    },
    "capabilities": ["http", "parsing"],
    "parameters": {
      "url": {
        "type": "string",
        "required": true,
        "description": "URL to scrape"
      }
    },
    "maxExecutionTime": 300,
    "maxMemoryMb": 512,
    "totalExecutions": 150,
    "successfulExecutions": 148,
    "failedExecutions": 2,
    "avgExecutionTimeMs": 2500,
    "tags": ["web", "scraping"],
    "isPublic": false,
    "isTemplate": false,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-05T10:00:00Z"
  }
}
```

---

### POST /agents

Create a new agent.

**Authentication:** Required

**Request:**
```json
{
  "name": "Data Transformer",
  "description": "Transforms JSON data",
  "type": "data",
  "config": {
    "runtime": "nodejs20"
  },
  "capabilities": ["json", "transform"],
  "parameters": {
    "input": {
      "type": "object",
      "required": true
    }
  },
  "maxExecutionTime": 60,
  "maxMemoryMb": 256,
  "tags": ["data", "transform"]
}
```

**Validation:**
- `name`: Required, 1-255 chars
- `type`: Required, must be valid AgentType
- `config`: Required, must be valid JSON object

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Data Transformer",
    "status": "draft",
    "version": 1,
    /* ... full agent object */
  }
}
```

---

### PATCH /agents/:id

Update an existing agent.

**Authentication:** Required

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "active",
  "tags": ["updated", "tags"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    /* updated agent object */
  }
}
```

---

### DELETE /agents/:id

Delete (soft delete) an agent.

**Authentication:** Required

**Response (204 No Content)**

---

### POST /agents/:id/duplicate

Create a copy of an agent.

**Authentication:** Required

**Request:**
```json
{
  "name": "Copy of Web Scraper"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    /* new agent object with parentId set */
  }
}
```

---

### GET /agents/:id/versions

Get version history of an agent.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version": 2,
      "parentId": "parent-uuid",
      "createdAt": "2026-01-05T00:00:00Z"
    },
    {
      "id": "parent-uuid",
      "version": 1,
      "parentId": null,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## Workflow Endpoints

### GET /workflows

List all workflows for current user.

**Authentication:** Required

**Query Parameters:**
- `page`, `pageSize`, `search`, `tags`, `sortBy`, `sortOrder` (same as agents)
- `status` (string): Filter by status

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Data Pipeline",
      "description": "ETL workflow",
      "status": "active",
      "version": 1,
      "scheduleEnabled": true,
      "scheduleCron": "0 0 * * *",
      "totalExecutions": 30,
      "successfulExecutions": 29,
      "lastExecutionAt": "2026-01-05T00:00:00Z",
      "tags": ["etl", "data"],
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /workflows/:id

Get single workflow with steps.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Data Pipeline",
    "description": "ETL workflow",
    "status": "active",
    "definition": {
      "nodes": [],
      "edges": []
    },
    "steps": [
      {
        "id": "step-uuid",
        "stepKey": "extract",
        "stepName": "Extract Data",
        "stepType": "agent",
        "position": 1,
        "agentId": "agent-uuid",
        "config": {},
        "dependsOn": []
      }
    ],
    "triggerConfig": {},
    "scheduleEnabled": true,
    "scheduleCron": "0 0 * * *",
    "scheduleTimezone": "UTC",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### POST /workflows

Create a new workflow.

**Authentication:** Required

**Request:**
```json
{
  "name": "My Workflow",
  "description": "Workflow description",
  "definition": {
    "nodes": [],
    "edges": []
  },
  "steps": [
    {
      "stepKey": "step1",
      "stepName": "First Step",
      "stepType": "agent",
      "position": 1,
      "agentId": "agent-uuid",
      "config": {},
      "dependsOn": []
    }
  ],
  "scheduleEnabled": false,
  "tags": ["workflow"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    /* created workflow */
  }
}
```

---

### PATCH /workflows/:id

Update workflow.

**Authentication:** Required

**Request:** (partial update)
```json
{
  "name": "Updated Workflow",
  "status": "active"
}
```

**Response (200 OK)**

---

### DELETE /workflows/:id

Delete workflow.

**Authentication:** Required

**Response (204 No Content)**

---

### POST /workflows/:id/execute

Trigger workflow execution.

**Authentication:** Required

**Request:**
```json
{
  "inputData": {
    "param1": "value1"
  },
  "triggerType": "manual"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "workflowId": "uuid",
    "status": "pending",
    "createdAt": "2026-01-05T12:00:00Z"
  }
}
```

---

### GET /workflows/:id/executions

Get execution history for workflow.

**Authentication:** Required

**Query Parameters:**
- `page`, `pageSize`
- `status` (string): Filter by execution status

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workflowId": "uuid",
      "status": "completed",
      "startedAt": "2026-01-05T00:00:00Z",
      "completedAt": "2026-01-05T00:05:00Z",
      "durationMs": 300000,
      "stepsCompleted": 5,
      "stepsTotal": 5,
      "createdAt": "2026-01-05T00:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## Execution Endpoints

### GET /executions/:id

Get execution details.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflowId": "uuid",
    "workflow": {
      "id": "uuid",
      "name": "Data Pipeline"
    },
    "status": "completed",
    "triggerType": "manual",
    "startedAt": "2026-01-05T00:00:00Z",
    "completedAt": "2026-01-05T00:05:00Z",
    "durationMs": 300000,
    "inputData": {},
    "outputData": {},
    "stepsCompleted": 5,
    "stepsFailed": 0,
    "stepsTotal": 5,
    "createdAt": "2026-01-05T00:00:00Z"
  }
}
```

---

### GET /executions/:id/logs

Get execution logs.

**Authentication:** Required

**Query Parameters:**
- `level` (string): Filter by log level
- `stepKey` (string): Filter by step key

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "level": "info",
      "message": "Step started",
      "stepKey": "extract",
      "stepStatus": "running",
      "stepStartedAt": "2026-01-05T00:00:00Z",
      "metadata": {},
      "createdAt": "2026-01-05T00:00:00Z"
    }
  ]
}
```

---

### POST /executions/:id/cancel

Cancel a running execution.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled"
  }
}
```

---

## Template Endpoints

### GET /templates

List available templates.

**Authentication:** Optional (public templates visible without auth)

**Query Parameters:**
- `page`, `pageSize`, `search`, `tags`
- `category` (string): Filter by category
- `type` (string): Filter by template type
- `isOfficial` (boolean): Show only official templates

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Web Scraper Template",
      "description": "Ready-to-use web scraper",
      "category": "Data Collection",
      "type": "agent",
      "isOfficial": true,
      "isPublic": true,
      "usageCount": 250,
      "ratingAverage": 4.5,
      "ratingCount": 45,
      "tags": ["scraping", "web"],
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /templates/:id

Get template details.

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Web Scraper Template",
    "description": "Ready-to-use web scraper",
    "category": "Data Collection",
    "type": "agent",
    "templateData": {
      /* agent/workflow configuration */
    },
    "isOfficial": true,
    "isPublic": true,
    "usageCount": 250,
    "tags": ["scraping", "web"]
  }
}
```

---

### POST /templates/:id/instantiate

Create agent/workflow from template.

**Authentication:** Required

**Request:**
```json
{
  "name": "My Web Scraper",
  "customizations": {
    /* override template values */
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    /* created agent/workflow */
  }
}
```

---

## Deployment Endpoints

### GET /deployments

List all deployments.

**Authentication:** Required

**Query Parameters:**
- `page`, `pageSize`
- `environment` (string): Filter by environment
- `status` (string): Filter by deployment status

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Pipeline",
      "environment": "production",
      "status": "running",
      "healthStatus": "healthy",
      "workflowId": "uuid",
      "endpointUrl": "https://...",
      "deployedAt": "2026-01-01T00:00:00Z",
      "totalRequests": 10000,
      "totalErrors": 5,
      "avgResponseTimeMs": 150
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /deployments/:id

Get deployment details.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Pipeline",
    "description": "Main data pipeline",
    "environment": "production",
    "status": "running",
    "healthStatus": "healthy",
    "workflowId": "uuid",
    "workflow": {
      "id": "uuid",
      "name": "Data Pipeline"
    },
    "config": {},
    "environmentVars": { /* masked */ },
    "endpointUrl": "https://...",
    "allocatedMemoryMb": 1024,
    "allocatedCpuShares": 2048,
    "deployedAt": "2026-01-01T00:00:00Z",
    "lastHealthCheckAt": "2026-01-05T12:00:00Z"
  }
}
```

---

### POST /deployments

Create new deployment.

**Authentication:** Required

**Request:**
```json
{
  "name": "My Deployment",
  "workflowId": "uuid",
  "environment": "production",
  "config": {},
  "environmentVars": {
    "API_KEY": "secret"
  },
  "allocatedMemoryMb": 1024,
  "allocatedCpuShares": 2048
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    /* created deployment */
  }
}
```

---

### PATCH /deployments/:id

Update deployment configuration.

**Authentication:** Required

**Request:**
```json
{
  "config": {},
  "environmentVars": {},
  "allocatedMemoryMb": 2048
}
```

**Response (200 OK)**

---

### DELETE /deployments/:id

Delete deployment.

**Authentication:** Required

**Response (204 No Content)**

---

### POST /deployments/:id/start

Start a stopped deployment.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "starting"
  }
}
```

---

### POST /deployments/:id/stop

Stop a running deployment.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "stopping"
  }
}
```

---

### GET /deployments/:id/logs

Get deployment logs.

**Authentication:** Required

**Query Parameters:**
- `since` (ISO datetime): Logs since timestamp
- `tail` (integer): Last N lines
- `level` (string): Filter by log level

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-01-05T12:00:00Z",
      "level": "info",
      "message": "Request processed",
      "metadata": {}
    }
  ]
}
```

---

## Analytics Endpoints

### GET /analytics/overview

Get system-wide analytics.

**Authentication:** Required

**Query Parameters:**
- `startDate` (ISO date): Start of date range
- `endDate` (ISO date): End of date range

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalAgents": 45,
    "activeAgents": 32,
    "totalWorkflows": 18,
    "activeWorkflows": 12,
    "totalExecutions": 1250,
    "successfulExecutions": 1200,
    "failedExecutions": 50,
    "avgExecutionTimeMs": 3500,
    "totalDeployments": 8,
    "runningDeployments": 6
  }
}
```

---

### GET /analytics/agents/:id/metrics

Get agent-specific metrics.

**Authentication:** Required

**Query Parameters:**
- `startDate`, `endDate`
- `groupBy` (string): Group by hour/day/week/month

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "agentId": "uuid",
    "agentName": "Web Scraper",
    "metrics": {
      "executions": [
        {
          "timestamp": "2026-01-05T00:00:00Z",
          "count": 50,
          "successCount": 48,
          "failureCount": 2,
          "avgDurationMs": 2500
        }
      ],
      "performance": {
        "avgExecutionTimeMs": 2500,
        "minExecutionTimeMs": 1200,
        "maxExecutionTimeMs": 5000,
        "p50ExecutionTimeMs": 2300,
        "p95ExecutionTimeMs": 4200,
        "p99ExecutionTimeMs": 4800
      },
      "reliability": {
        "successRate": 0.96,
        "failureRate": 0.04,
        "errorTypes": {
          "timeout": 1,
          "exception": 1
        }
      }
    }
  }
}
```

---

### GET /analytics/workflows/:id/metrics

Get workflow-specific metrics.

**Authentication:** Required

**Response:** (similar structure to agent metrics)

---

### GET /analytics/system-health

Get system health metrics.

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 99.95,
    "database": {
      "status": "healthy",
      "connectionPoolSize": 20,
      "activeConnections": 12,
      "avgQueryTimeMs": 15
    },
    "queue": {
      "status": "healthy",
      "activeJobs": 5,
      "completedJobs": 1000,
      "failedJobs": 2,
      "avgProcessingTimeMs": 1200
    },
    "api": {
      "requestsPerMinute": 150,
      "avgResponseTimeMs": 85,
      "errorRate": 0.001
    }
  }
}
```

---

## API Keys Endpoints

### GET /api-keys

List user's API keys.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Key",
      "keyPrefix": "tk_prod_abc123",
      "scopes": ["read:agents", "execute:workflows"],
      "isActive": true,
      "expiresAt": "2027-01-01T00:00:00Z",
      "lastUsedAt": "2026-01-05T10:00:00Z",
      "usageCount": 5000,
      "rateLimitPerMinute": 100,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api-keys

Create new API key.

**Authentication:** Required

**Request:**
```json
{
  "name": "My API Key",
  "scopes": ["read:agents", "execute:workflows"],
  "expiresAt": "2027-01-01T00:00:00Z",
  "rateLimitPerMinute": 60
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My API Key",
    "key": "tk_prod_abc123def456...",
    "keyPrefix": "tk_prod_abc123",
    "scopes": ["read:agents", "execute:workflows"],
    "expiresAt": "2027-01-01T00:00:00Z",
    "createdAt": "2026-01-05T12:00:00Z"
  }
}
```

**Note:** The full `key` is only returned once upon creation.

---

### DELETE /api-keys/:id

Revoke API key.

**Authentication:** Required

**Response (204 No Content)**

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Default Limits
- **Authenticated users**: 1000 requests/hour
- **API keys**: Configurable per key (default 100 req/min)
- **Unauthenticated**: 100 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1641398400
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 3600
  }
}
```

---

## Webhook Support (Future)

### POST /webhooks

Register a webhook endpoint.

**Authentication:** Required

**Request:**
```json
{
  "url": "https://myapp.com/webhook",
  "events": ["execution.completed", "execution.failed"],
  "secret": "webhook-secret"
}
```

---

## API Versioning

### Version in URL
Current version: `/v1/`

### Deprecation Process
1. New version released (e.g., `/v2/`)
2. Previous version marked deprecated (6 months notice)
3. Previous version remains functional for 12 months
4. Previous version removed

---

## OpenAPI Specification

Complete OpenAPI 3.0 specification available at:
- **JSON**: `https://api.turbocat.dev/v1/openapi.json`
- **YAML**: `https://api.turbocat.dev/v1/openapi.yaml`
- **Interactive Docs**: `https://api.turbocat.dev/docs`

---

**End of API Specifications**
