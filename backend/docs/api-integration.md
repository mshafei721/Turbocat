# Turbocat API Integration Guide

This guide explains how to integrate with the Turbocat backend APIs, providing code examples in JavaScript/TypeScript and documenting common patterns.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Making Requests](#making-requests)
- [Common Patterns](#common-patterns)
- [Working with Agents](#working-with-agents)
- [Working with Workflows](#working-with-workflows)
- [Executing Workflows](#executing-workflows)
- [Handling Pagination](#handling-pagination)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [SDK Example](#sdk-example)

---

## Getting Started

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001/api/v1` |
| Production | `https://api.turbocat.dev/api/v1` |

### API Documentation

Interactive API documentation is available at:
- Development: `http://localhost:3001/api/v1/docs`
- Production: `https://api.turbocat.dev/api/v1/docs`

### OpenAPI Specification

The OpenAPI JSON specification is available at:
- `GET /api/v1/openapi.json`

---

## Authentication

The Turbocat API uses JWT Bearer tokens for authentication. See the [Authentication Guide](./authentication.md) for detailed information.

### Quick Start

```typescript
// 1. Login to get tokens
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});

const { data } = await loginResponse.json();
const accessToken = data.tokens.accessToken;

// 2. Use the token for authenticated requests
const agentsResponse = await fetch('http://localhost:3001/api/v1/agents', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Making Requests

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes* | Bearer token for authenticated endpoints |
| `Content-Type` | Yes | `application/json` for POST/PUT/PATCH |
| `X-Request-ID` | No | Custom request ID for tracing |
| `X-API-Key` | Yes* | API key for service-to-service auth |

*One of `Authorization` or `X-API-Key` is required for protected endpoints.

### Response Format

All responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-07T10:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "timestamp": "2026-01-07T10:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

---

## Common Patterns

### Creating a Resource

```typescript
async function createAgent(accessToken: string) {
  const response = await fetch('http://localhost:3001/api/v1/agents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My First Agent',
      type: 'CODE',
      description: 'A simple code execution agent',
      config: {
        runtime: 'node18',
        entryPoint: 'main.js'
      },
      tags: ['automation', 'code']
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const { data } = await response.json();
  return data.agent;
}
```

### Updating a Resource

```typescript
async function updateAgent(accessToken: string, agentId: string) {
  const response = await fetch(`http://localhost:3001/api/v1/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Agent Name',
      status: 'ACTIVE',
      tags: ['production', 'automation']
    })
  });

  const { data } = await response.json();
  return data.agent;
}
```

### Deleting a Resource

```typescript
async function deleteAgent(accessToken: string, agentId: string) {
  const response = await fetch(`http://localhost:3001/api/v1/agents/${agentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // 204 No Content on success
  return response.status === 204;
}
```

---

## Working with Agents

### List Agents

```typescript
interface ListAgentsParams {
  page?: number;
  pageSize?: number;
  type?: 'CODE' | 'API' | 'LLM' | 'DATA' | 'WORKFLOW';
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  search?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function listAgents(accessToken: string, params: ListAgentsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.type) searchParams.set('type', params.type);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.tags) searchParams.set('tags', params.tags.join(','));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const url = `http://localhost:3001/api/v1/agents?${searchParams}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const { data } = await response.json();
  return {
    agents: data.agents,
    pagination: data.pagination
  };
}

// Usage
const { agents, pagination } = await listAgents(accessToken, {
  type: 'CODE',
  status: 'ACTIVE',
  page: 1,
  pageSize: 20
});

console.log(`Found ${pagination.totalItems} agents`);
```

### Get Agent Details

```typescript
async function getAgent(accessToken: string, agentId: string) {
  const response = await fetch(`http://localhost:3001/api/v1/agents/${agentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const { data } = await response.json();
  return data.agent;
}
```

### Duplicate an Agent

```typescript
async function duplicateAgent(accessToken: string, agentId: string, newName?: string) {
  const response = await fetch(`http://localhost:3001/api/v1/agents/${agentId}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: newName // Optional, defaults to "Copy of {original}"
    })
  });

  const { data } = await response.json();
  return data.agent;
}
```

### Get Version History

```typescript
async function getAgentVersions(accessToken: string, agentId: string) {
  const response = await fetch(`http://localhost:3001/api/v1/agents/${agentId}/versions`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const { data } = await response.json();
  return data.versions;
}
```

---

## Working with Workflows

### Create a Workflow with Steps

```typescript
async function createWorkflow(accessToken: string) {
  const response = await fetch('http://localhost:3001/api/v1/workflows', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Data Processing Pipeline',
      description: 'Fetches data, transforms it, and stores results',
      tags: ['data', 'pipeline'],
      steps: [
        {
          stepKey: 'fetch_data',
          stepName: 'Fetch Data',
          stepType: 'AGENT',
          position: 1,
          agentId: 'agent-uuid-1',
          config: { url: 'https://api.example.com/data' },
          inputs: {},
          outputs: { data: '$.response.body' },
          timeoutMs: 30000,
          onError: 'FAIL'
        },
        {
          stepKey: 'transform',
          stepName: 'Transform Data',
          stepType: 'AGENT',
          position: 2,
          agentId: 'agent-uuid-2',
          dependsOn: ['fetch_data'],
          inputs: { rawData: '{{fetch_data.data}}' },
          outputs: { transformed: '$.result' },
          timeoutMs: 60000,
          onError: 'RETRY',
          retryCount: 3,
          retryDelayMs: 5000
        },
        {
          stepKey: 'store',
          stepName: 'Store Results',
          stepType: 'AGENT',
          position: 3,
          agentId: 'agent-uuid-3',
          dependsOn: ['transform'],
          inputs: { data: '{{transform.transformed}}' },
          timeoutMs: 30000,
          onError: 'FAIL'
        }
      ]
    })
  });

  const { data } = await response.json();
  return data.workflow;
}
```

### Add Steps to Existing Workflow

```typescript
async function addWorkflowStep(
  accessToken: string,
  workflowId: string,
  step: object
) {
  const response = await fetch(
    `http://localhost:3001/api/v1/workflows/${workflowId}/steps`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(step)
    }
  );

  const { data } = await response.json();
  return data.step;
}
```

---

## Executing Workflows

### Start Execution

```typescript
async function executeWorkflow(
  accessToken: string,
  workflowId: string,
  inputs: Record<string, unknown> = {}
) {
  const response = await fetch(
    `http://localhost:3001/api/v1/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs })
    }
  );

  const { data } = await response.json();
  return data.execution;
}

// Usage
const execution = await executeWorkflow(accessToken, 'workflow-uuid', {
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});

console.log(`Execution started: ${execution.id}`);
console.log(`Status: ${execution.status}`);
```

### Monitor Execution Status

```typescript
async function getExecution(accessToken: string, executionId: string) {
  const response = await fetch(
    `http://localhost:3001/api/v1/executions/${executionId}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  const { data } = await response.json();
  return data.execution;
}

// Poll for completion
async function waitForCompletion(
  accessToken: string,
  executionId: string,
  maxWaitMs: number = 300000
) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const execution = await getExecution(accessToken, executionId);

    if (['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(execution.status)) {
      return execution;
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Execution timed out waiting for completion');
}
```

### Get Execution Logs

```typescript
async function getExecutionLogs(
  accessToken: string,
  executionId: string,
  params: { level?: string; stepKey?: string } = {}
) {
  const searchParams = new URLSearchParams();
  if (params.level) searchParams.set('level', params.level);
  if (params.stepKey) searchParams.set('stepKey', params.stepKey);

  const response = await fetch(
    `http://localhost:3001/api/v1/executions/${executionId}/logs?${searchParams}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  const { data } = await response.json();
  return data.logs;
}
```

### Cancel Execution

```typescript
async function cancelExecution(accessToken: string, executionId: string) {
  const response = await fetch(
    `http://localhost:3001/api/v1/executions/${executionId}/cancel`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  const { data } = await response.json();
  return data.execution;
}
```

---

## Handling Pagination

The API uses cursor-based pagination with the following structure:

```typescript
interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### Iterate Through All Pages

```typescript
async function* iterateAllAgents(accessToken: string, params: ListAgentsParams = {}) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { agents, pagination } = await listAgents(accessToken, { ...params, page });

    for (const agent of agents) {
      yield agent;
    }

    hasMore = pagination.hasNextPage;
    page++;
  }
}

// Usage
for await (const agent of iterateAllAgents(accessToken, { type: 'CODE' })) {
  console.log(agent.name);
}
```

### Fetch All Items

```typescript
async function fetchAllAgents(accessToken: string, params: ListAgentsParams = {}) {
  const allAgents = [];

  for await (const agent of iterateAllAgents(accessToken, params)) {
    allAgents.push(agent);
  }

  return allAgents;
}
```

---

## Error Handling

### Error Response Structure

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

interface ErrorResponse {
  success: false;
  error: ApiError;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid request format |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Handling Example

```typescript
class TurbocatApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field?: string; message: string }>,
    public requestId?: string
  ) {
    super(message);
    this.name = 'TurbocatApiError';
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok) {
    throw new TurbocatApiError(
      response.status,
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.message || 'An error occurred',
      json.error?.details,
      json.meta?.requestId
    );
  }

  return json.data as T;
}

// Usage with error handling
try {
  const agent = await apiRequest<{ agent: Agent }>(
    'http://localhost:3001/api/v1/agents/invalid-id',
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
} catch (error) {
  if (error instanceof TurbocatApiError) {
    if (error.code === 'NOT_FOUND') {
      console.log('Agent not found');
    } else if (error.code === 'UNAUTHORIZED') {
      // Refresh token and retry
    } else if (error.code === 'VALIDATION_ERROR') {
      console.log('Validation errors:', error.details);
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry client errors (4xx)
      if (error instanceof TurbocatApiError && error.statusCode < 500) {
        throw error;
      }

      // Calculate exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const agent = await withRetry(() => getAgent(accessToken, agentId));
```

---

## TypeScript Types

### Common Types

```typescript
// Agent Types
type AgentType = 'CODE' | 'API' | 'LLM' | 'DATA' | 'WORKFLOW';
type AgentStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: AgentType;
  status: AgentStatus;
  version: number;
  parentId: string | null;
  config: Record<string, unknown>;
  capabilities: unknown[];
  parameters: Record<string, unknown>;
  maxExecutionTime: number;
  maxMemoryMb: number;
  maxConcurrentExecutions: number;
  tags: string[];
  isPublic: boolean;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTimeMs: number;
  createdAt: string;
  updatedAt: string;
}

// Workflow Types
type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
type TriggerType = 'MANUAL' | 'SCHEDULED' | 'API' | 'WEBHOOK' | 'EVENT';
type WorkflowStepType = 'AGENT' | 'CONDITION' | 'LOOP' | 'PARALLEL' | 'WAIT';
type ErrorHandling = 'FAIL' | 'CONTINUE' | 'RETRY';

interface WorkflowStep {
  id: string;
  stepKey: string;
  stepName: string;
  stepType: WorkflowStepType;
  position: number;
  agentId: string | null;
  config: Record<string, unknown>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependsOn: string[];
  retryCount: number;
  retryDelayMs: number;
  timeoutMs: number;
  onError: ErrorHandling;
}

interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  version: number;
  definition: Record<string, unknown>;
  triggerConfig: Record<string, unknown>;
  scheduleEnabled: boolean;
  scheduleCron: string | null;
  scheduleTimezone: string;
  steps: WorkflowStep[];
  tags: string[];
  isPublic: boolean;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Execution Types
type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';

interface Execution {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  stepsTotal: number;
  stepsCompleted: number;
  stepsFailed: number;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}
```

---

## SDK Example

Here's a complete SDK class for integrating with the Turbocat API:

```typescript
class TurbocatClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
  }

  // ==================== Authentication ====================

  async login(email: string, password: string): Promise<void> {
    const response = await this.request<{
      user: User;
      tokens: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
        refreshTokenExpiresAt: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.accessToken = response.tokens.accessToken;
    this.refreshToken = response.tokens.refreshToken;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{
      accessToken: string;
      accessTokenExpiresAt: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    this.accessToken = response.accessToken;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.accessToken = null;
    this.refreshToken = null;
  }

  // ==================== Agents ====================

  async listAgents(params: ListAgentsParams = {}): Promise<{
    agents: Agent[];
    pagination: Pagination;
  }> {
    const searchParams = this.buildSearchParams(params);
    return this.request(`/agents?${searchParams}`);
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.request<{ agent: Agent }>(`/agents/${id}`);
    return response.agent;
  }

  async createAgent(input: CreateAgentInput): Promise<Agent> {
    const response = await this.request<{ agent: Agent }>('/agents', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.agent;
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    const response = await this.request<{ agent: Agent }>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
    return response.agent;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/agents/${id}`, { method: 'DELETE' });
  }

  async duplicateAgent(id: string, name?: string): Promise<Agent> {
    const response = await this.request<{ agent: Agent }>(
      `/agents/${id}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ name })
      }
    );
    return response.agent;
  }

  // ==================== Workflows ====================

  async listWorkflows(params: ListWorkflowsParams = {}): Promise<{
    workflows: Workflow[];
    pagination: Pagination;
  }> {
    const searchParams = this.buildSearchParams(params);
    return this.request(`/workflows?${searchParams}`);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await this.request<{ workflow: Workflow }>(`/workflows/${id}`);
    return response.workflow;
  }

  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    const response = await this.request<{ workflow: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.workflow;
  }

  async executeWorkflow(
    id: string,
    inputs: Record<string, unknown> = {}
  ): Promise<Execution> {
    const response = await this.request<{ execution: Execution }>(
      `/workflows/${id}/execute`,
      {
        method: 'POST',
        body: JSON.stringify({ inputs })
      }
    );
    return response.execution;
  }

  // ==================== Executions ====================

  async getExecution(id: string): Promise<Execution> {
    const response = await this.request<{ execution: Execution }>(
      `/executions/${id}`
    );
    return response.execution;
  }

  async cancelExecution(id: string): Promise<Execution> {
    const response = await this.request<{ execution: Execution }>(
      `/executions/${id}/cancel`,
      { method: 'POST' }
    );
    return response.execution;
  }

  async waitForExecution(
    id: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {}
  ): Promise<Execution> {
    const { timeoutMs = 300000, pollIntervalMs = 2000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const execution = await this.getExecution(id);

      if (['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(execution.status)) {
        return execution;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Timed out waiting for execution to complete');
  }

  // ==================== Internal Methods ====================

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });

    const json = await response.json();

    if (!response.ok) {
      throw new TurbocatApiError(
        response.status,
        json.error?.code || 'UNKNOWN_ERROR',
        json.error?.message || 'An error occurred',
        json.error?.details,
        json.meta?.requestId
      );
    }

    return json.data as T;
  }

  private buildSearchParams(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    }

    return searchParams.toString();
  }
}

// Usage
const client = new TurbocatClient();

await client.login('user@example.com', 'SecurePass123!');

// List active agents
const { agents } = await client.listAgents({ status: 'ACTIVE' });

// Create and execute a workflow
const workflow = await client.createWorkflow({
  name: 'My Workflow',
  steps: [/* ... */]
});

const execution = await client.executeWorkflow(workflow.id, { data: 'value' });
const result = await client.waitForExecution(execution.id);

console.log(`Execution ${result.status}:`, result.outputData);
```

---

**Last Updated:** January 7, 2026
