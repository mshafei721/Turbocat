/**
 * Swagger/OpenAPI Configuration
 *
 * This module configures the OpenAPI specification for the Turbocat API,
 * including all endpoints, schemas, security definitions, and examples.
 *
 * @module swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { APP_VERSION } from './lib/version';

/**
 * OpenAPI specification options
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Turbocat API',
      version: APP_VERSION,
      description: `
# Turbocat API Documentation

Turbocat is a multi-agent orchestration platform that allows you to create, manage, and execute AI agents and workflows.

## Features

- **Agent Management**: Create and manage different types of AI agents (CODE, API, LLM, DATA, WORKFLOW)
- **Workflow Orchestration**: Build complex workflows with multiple steps and dependencies
- **Template System**: Use pre-built templates to quickly create agents and workflows
- **Deployment Management**: Deploy and manage agents/workflows across different environments
- **Analytics**: Track performance and metrics for your agents and workflows

## Getting Started

1. Register for an account using the \`/auth/register\` endpoint
2. Login to get your access and refresh tokens
3. Use the access token in the \`Authorization\` header for authenticated requests
4. Create your first agent or workflow

## Rate Limiting

API requests are rate-limited to ensure fair usage:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination with the following query parameters:
- \`page\`: Page number (default: 1)
- \`pageSize\`: Items per page (default: 20, max: 100)

## Errors

All error responses follow a consistent format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  },
  "requestId": "uuid"
}
\`\`\`
      `,
      contact: {
        name: 'Turbocat Support',
        email: 'support@turbocat.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints for monitoring service status',
      },
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'Agents',
        description: 'Agent CRUD operations and version management',
      },
      {
        name: 'Workflows',
        description: 'Workflow CRUD operations, execution, and history',
      },
      {
        name: 'Templates',
        description: 'Template browsing and instantiation',
      },
      {
        name: 'Deployments',
        description: 'Deployment management and lifecycle operations',
      },
      {
        name: 'Executions',
        description: 'Execution monitoring and management',
      },
      {
        name: 'Analytics',
        description: 'Performance metrics and system health',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /auth/login or /auth/register',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service authentication',
        },
      },
      schemas: {
        // Common schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            requestId: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                      code: { type: 'string' },
                    },
                  },
                },
              },
            },
            requestId: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 20,
            },
            totalItems: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
        // Auth schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
              nullable: true,
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
            },
            isActive: {
              type: 'boolean',
            },
            preferences: {
              type: 'object',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (expires in 15 minutes)',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token (expires in 7 days)',
            },
            accessTokenExpiresAt: {
              type: 'string',
              format: 'date-time',
            },
            refreshTokenExpiresAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              example: 'SecurePass123!',
            },
            fullName: {
              type: 'string',
              maxLength: 255,
              example: 'John Doe',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123!',
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
            },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: {
              type: 'string',
              format: 'uuid',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
            },
          },
        },
        // Agent schemas
        AgentType: {
          type: 'string',
          enum: ['CODE', 'API', 'LLM', 'DATA', 'WORKFLOW'],
          description: 'Type of agent',
        },
        AgentStatus: {
          type: 'string',
          enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
          description: 'Status of the agent',
        },
        Agent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            type: {
              $ref: '#/components/schemas/AgentType',
            },
            status: {
              $ref: '#/components/schemas/AgentStatus',
            },
            version: {
              type: 'integer',
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            config: {
              type: 'object',
              nullable: true,
            },
            capabilities: {
              type: 'array',
              items: {},
              nullable: true,
            },
            parameters: {
              type: 'object',
              nullable: true,
            },
            maxExecutionTime: {
              type: 'integer',
              description: 'Maximum execution time in seconds',
            },
            maxMemoryMb: {
              type: 'integer',
              description: 'Maximum memory allocation in MB',
            },
            maxConcurrentExecutions: {
              type: 'integer',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            isPublic: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateAgentRequest: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'My Code Agent',
            },
            description: {
              type: 'string',
              maxLength: 2000,
              nullable: true,
            },
            type: {
              $ref: '#/components/schemas/AgentType',
            },
            config: {
              type: 'object',
            },
            capabilities: {
              type: 'array',
              items: {},
            },
            parameters: {
              type: 'object',
            },
            maxExecutionTime: {
              type: 'integer',
              minimum: 1,
              maximum: 3600,
              default: 300,
            },
            maxMemoryMb: {
              type: 'integer',
              minimum: 1,
              maximum: 8192,
              default: 512,
            },
            maxConcurrentExecutions: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 1,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50,
              },
              maxItems: 20,
            },
            isPublic: {
              type: 'boolean',
              default: false,
            },
          },
        },
        UpdateAgentRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              maxLength: 2000,
              nullable: true,
            },
            status: {
              $ref: '#/components/schemas/AgentStatus',
            },
            config: {
              type: 'object',
            },
            capabilities: {
              type: 'array',
              items: {},
            },
            parameters: {
              type: 'object',
            },
            maxExecutionTime: {
              type: 'integer',
              minimum: 1,
              maximum: 3600,
            },
            maxMemoryMb: {
              type: 'integer',
              minimum: 1,
              maximum: 8192,
            },
            maxConcurrentExecutions: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50,
              },
              maxItems: 20,
            },
            isPublic: {
              type: 'boolean',
            },
          },
        },
        // Workflow schemas
        WorkflowStatus: {
          type: 'string',
          enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'],
        },
        TriggerType: {
          type: 'string',
          enum: ['MANUAL', 'SCHEDULED', 'API', 'WEBHOOK', 'EVENT'],
        },
        WorkflowStepType: {
          type: 'string',
          enum: ['AGENT', 'CONDITION', 'LOOP', 'PARALLEL', 'WAIT'],
        },
        ErrorHandling: {
          type: 'string',
          enum: ['FAIL', 'CONTINUE', 'RETRY'],
        },
        WorkflowStep: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            stepKey: {
              type: 'string',
              pattern: '^[a-zA-Z0-9_-]+$',
            },
            stepName: {
              type: 'string',
            },
            stepType: {
              $ref: '#/components/schemas/WorkflowStepType',
            },
            position: {
              type: 'integer',
            },
            agentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            config: {
              type: 'object',
            },
            inputs: {
              type: 'object',
            },
            outputs: {
              type: 'object',
            },
            dependsOn: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            retryCount: {
              type: 'integer',
            },
            retryDelayMs: {
              type: 'integer',
            },
            timeoutMs: {
              type: 'integer',
            },
            onError: {
              $ref: '#/components/schemas/ErrorHandling',
            },
          },
        },
        Workflow: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            status: {
              $ref: '#/components/schemas/WorkflowStatus',
            },
            version: {
              type: 'integer',
            },
            definition: {
              type: 'object',
            },
            triggerConfig: {
              type: 'object',
            },
            scheduleEnabled: {
              type: 'boolean',
            },
            scheduleCron: {
              type: 'string',
              nullable: true,
            },
            scheduleTimezone: {
              type: 'string',
            },
            lastExecutionAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            totalExecutions: {
              type: 'integer',
            },
            successfulExecutions: {
              type: 'integer',
            },
            failedExecutions: {
              type: 'integer',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            isPublic: {
              type: 'boolean',
            },
            steps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/WorkflowStep',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateWorkflowRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              maxLength: 2000,
              nullable: true,
            },
            definition: {
              type: 'object',
            },
            triggerConfig: {
              type: 'object',
            },
            scheduleEnabled: {
              type: 'boolean',
              default: false,
            },
            scheduleCron: {
              type: 'string',
              maxLength: 100,
              nullable: true,
            },
            scheduleTimezone: {
              type: 'string',
              maxLength: 50,
              default: 'UTC',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50,
              },
              maxItems: 20,
            },
            isPublic: {
              type: 'boolean',
              default: false,
            },
            steps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/WorkflowStep',
              },
              maxItems: 100,
            },
          },
        },
        // Execution schemas
        ExecutionStatus: {
          type: 'string',
          enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'],
        },
        Execution: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            workflowId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              $ref: '#/components/schemas/ExecutionStatus',
            },
            triggerType: {
              $ref: '#/components/schemas/TriggerType',
            },
            stepsTotal: {
              type: 'integer',
            },
            stepsCompleted: {
              type: 'integer',
            },
            stepsFailed: {
              type: 'integer',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            durationMs: {
              type: 'integer',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Template schemas
        TemplateType: {
          type: 'string',
          enum: ['AGENT', 'WORKFLOW', 'STEP'],
        },
        Template: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            type: {
              $ref: '#/components/schemas/TemplateType',
            },
            category: {
              type: 'string',
            },
            config: {
              type: 'object',
            },
            usageCount: {
              type: 'integer',
            },
            ratingAverage: {
              type: 'number',
              nullable: true,
            },
            ratingCount: {
              type: 'integer',
            },
            isOfficial: {
              type: 'boolean',
            },
            isPublic: {
              type: 'boolean',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Deployment schemas
        Environment: {
          type: 'string',
          enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
        },
        DeploymentStatus: {
          type: 'string',
          enum: ['STOPPED', 'STARTING', 'RUNNING', 'STOPPING', 'FAILED', 'MAINTENANCE'],
        },
        HealthStatus: {
          type: 'string',
          enum: ['UNKNOWN', 'HEALTHY', 'UNHEALTHY', 'DEGRADED'],
        },
        LogLevel: {
          type: 'string',
          enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
        },
        Deployment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            workflowId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            agentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            environment: {
              $ref: '#/components/schemas/Environment',
            },
            status: {
              $ref: '#/components/schemas/DeploymentStatus',
            },
            healthStatus: {
              $ref: '#/components/schemas/HealthStatus',
            },
            config: {
              type: 'object',
            },
            allocatedMemoryMb: {
              type: 'integer',
            },
            allocatedCpuShares: {
              type: 'integer',
            },
            deployedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateDeploymentRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              maxLength: 2000,
              nullable: true,
            },
            workflowId: {
              type: 'string',
              format: 'uuid',
              description: 'Mutually exclusive with agentId',
            },
            agentId: {
              type: 'string',
              format: 'uuid',
              description: 'Mutually exclusive with workflowId',
            },
            environment: {
              $ref: '#/components/schemas/Environment',
            },
            config: {
              type: 'object',
            },
            environmentVars: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              description: 'Environment variables (will be encrypted)',
            },
            allocatedMemoryMb: {
              type: 'integer',
              minimum: 1,
              maximum: 8192,
              default: 512,
            },
            allocatedCpuShares: {
              type: 'integer',
              minimum: 1,
              maximum: 4096,
              default: 1024,
            },
          },
        },
        // Health check schemas
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy', 'degraded'],
            },
            version: {
              type: 'string',
            },
            uptime: {
              type: 'integer',
              description: 'Uptime in milliseconds',
            },
            uptimeFormatted: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'unhealthy', 'not_configured'],
                    },
                    configured: {
                      type: 'boolean',
                    },
                    responseTimeMs: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
            environment: {
              type: 'string',
            },
          },
        },
        // Analytics schemas
        OverviewMetrics: {
          type: 'object',
          properties: {
            totals: {
              type: 'object',
              properties: {
                agents: { type: 'integer' },
                workflows: { type: 'integer' },
                executions: { type: 'integer' },
                deployments: { type: 'integer' },
              },
            },
            executionStats: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                successful: { type: 'integer' },
                failed: { type: 'integer' },
                successRate: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication is required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                  details: [],
                },
                requestId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'You do not have permission to access this resource',
                  details: [],
                },
                requestId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                  details: [],
                },
                requestId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: [
                    {
                      field: 'email',
                      message: 'Invalid email format',
                      code: 'invalid_string',
                    },
                  ],
                },
                requestId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An unexpected error occurred',
                  details: [],
                },
                requestId: '123e4567-e89b-12d3-a456-426614174000',
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        PageSizeParam: {
          name: 'pageSize',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        SortByParam: {
          name: 'sortBy',
          in: 'query',
          description: 'Field to sort by',
          schema: {
            type: 'string',
          },
        },
        SortOrderParam: {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search term',
          schema: {
            type: 'string',
            maxLength: 255,
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

/**
 * Generated OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
