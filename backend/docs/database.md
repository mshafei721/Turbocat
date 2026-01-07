# Turbocat Database Schema Documentation

This document provides comprehensive documentation of the Turbocat database schema, explaining all entities, relationships, indexes, and constraints.

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Enums](#enums)
- [Models](#models)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Query Patterns](#query-patterns)

---

## Overview

Turbocat uses PostgreSQL (via Supabase) as its primary database with Prisma 7 as the ORM. The schema is designed to support:

- Multi-tenant user authentication
- Agent and workflow management
- Execution tracking and logging
- Template marketplace
- Deployment lifecycle management
- Comprehensive audit trail

### Key Design Decisions

1. **UUIDs for Primary Keys** - All tables use UUID primary keys for security and distributed generation
2. **Soft Deletes** - Most tables have a `deletedAt` field for data preservation
3. **JSON Fields** - Flexible storage for configuration and metadata
4. **Audit Trail** - Dedicated AuditLog table for tracking all changes
5. **Version Control** - Self-referential relationships for versioning agents/workflows

---

## Entity Relationship Diagram

```
+------------------+       +------------------+       +------------------+
|      User        |       |      Agent       |       |    Workflow      |
+------------------+       +------------------+       +------------------+
| id (PK)          |<---+  | id (PK)          |   +-->| id (PK)          |
| email            |    |  | userId (FK)      |---+   | userId (FK)      |---+
| passwordHash     |    |  | parentId (FK)    |--+    | parentId (FK)    |--+|
| fullName         |    |  | name             |  |    | name             |  ||
| avatarUrl        |    |  | description      |  |    | description      |  ||
| role             |    |  | type             |  |    | status           |  ||
| isActive         |    |  | status           |  |    | version          |  ||
| preferences      |    |  | version          |  |    | definition       |  ||
| createdAt        |    |  | config           |  |    | triggerConfig    |  ||
| updatedAt        |    |  | capabilities     |  |    | scheduleEnabled  |  ||
| deletedAt        |    |  | parameters       |  |    | scheduleCron     |  ||
+------------------+    |  | tags             |  |    | tags             |  ||
         |              |  | isPublic         |  |    | isPublic         |  ||
         |              |  | createdAt        |  |    | createdAt        |  ||
         |              |  +------------------+  |    +------------------+  ||
         |              |         |             |            |              ||
         |              |         | (self-ref)  |            | (self-ref)   ||
         |              |         +-------------+            +--------------+|
         |              |                                                    |
         |              +----------------------+  +---------------------------+
         |                                     |  |
         v                                     v  v
+------------------+       +------------------+       +------------------+
|     ApiKey       |       |  WorkflowStep    |       |   Execution      |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| userId (FK)      |---+   | workflowId (FK)  |------>| workflowId (FK)  |
| name             |   |   | agentId (FK)     |---+   | userId (FK)      |---+
| keyHash          |   |   | stepKey          |   |   | status           |   |
| keyPrefix        |   |   | stepName         |   |   | triggerType      |   |
| scopes           |   |   | stepType         |   |   | inputData        |   |
| isActive         |   |   | position         |   |   | outputData       |   |
| expiresAt        |   |   | config           |   |   | startedAt        |   |
| usageCount       |   |   | inputs           |   |   | completedAt      |   |
+------------------+   |   | outputs          |   |   | durationMs       |   |
                       |   | dependsOn        |   |   | errorMessage     |   |
                       |   | onError          |   |   +------------------+   |
                       |   +------------------+   |           |              |
                       |          |               |           |              |
                       |          v               |           v              |
                       |   +------------------+   |   +------------------+   |
                       |   |  Deployment      |   |   | ExecutionLog     |   |
                       |   +------------------+   |   +------------------+   |
                       |   | id (PK)          |   |   | id (PK)          |   |
                       +-->| userId (FK)      |   |   | executionId (FK) |   |
                           | workflowId (FK)  |---+   | workflowStepId   |---+
                           | agentId (FK)     |------>| level            |
                           | name             |       | message          |
                           | environment      |       | metadata         |
                           | status           |       | stepKey          |
                           | healthStatus     |       | stepStatus       |
                           | endpointUrl      |       | createdAt        |
                           +------------------+       +------------------+

+------------------+       +------------------+
|    Template      |       |    AuditLog      |
+------------------+       +------------------+
| id (PK)          |       | id (PK)          |
| userId (FK)      |---+   | userId (FK)      |---+
| name             |   |   | action           |   |
| description      |   |   | resourceType     |   |
| type             |   |   | resourceId       |   |
| category         |   |   | changes          |   |
| templateData     |   |   | metadata         |   |
| tags             |   |   | ipAddress        |   |
| isOfficial       |   |   | userAgent        |   |
| isPublic         |   |   | createdAt        |   |
| usageCount       |   +-->+------------------+   |
| ratingAverage    |                             |
| ratingCount      |                             |
+------------------+                             |
                                                 |
                    +----------------------------+
```

---

## Enums

### UserRole

Defines user permission levels.

| Value | Database Value | Description |
|-------|----------------|-------------|
| ADMIN | `admin` | Full system access |
| USER | `user` | Standard user access |
| AGENT | `agent` | Service account for automated operations |

### AgentType

Categorizes agents by their execution model.

| Value | Database Value | Description |
|-------|----------------|-------------|
| CODE | `code` | Executes JavaScript/TypeScript code |
| API | `api` | Makes HTTP API calls |
| LLM | `llm` | Interacts with language models |
| DATA | `data` | Data transformation and processing |
| WORKFLOW | `workflow` | Executes a sub-workflow |

### AgentStatus / WorkflowStatus

Lifecycle states for agents and workflows.

| Value | Database Value | Description |
|-------|----------------|-------------|
| DRAFT | `draft` | Under development, not executable |
| ACTIVE | `active` | Ready for execution |
| INACTIVE | `inactive` | Temporarily disabled |
| ARCHIVED | `archived` | Retired, preserved for history |

### WorkflowStepType

Types of steps in a workflow.

| Value | Database Value | Description |
|-------|----------------|-------------|
| AGENT | `agent` | Executes an agent |
| CONDITION | `condition` | Conditional branching |
| LOOP | `loop` | Iterates over a collection |
| PARALLEL | `parallel` | Executes steps in parallel |
| WAIT | `wait` | Pauses execution for a duration |

### ErrorHandling

Error handling strategies for workflow steps.

| Value | Database Value | Description |
|-------|----------------|-------------|
| FAIL | `fail` | Stop workflow on error |
| CONTINUE | `continue` | Mark failed, continue execution |
| RETRY | `retry` | Retry with configured backoff |

### ExecutionStatus

States of workflow execution.

| Value | Database Value | Description |
|-------|----------------|-------------|
| PENDING | `pending` | Queued, waiting to start |
| RUNNING | `running` | Currently executing |
| COMPLETED | `completed` | Finished successfully |
| FAILED | `failed` | Finished with errors |
| CANCELLED | `cancelled` | Manually cancelled |
| TIMEOUT | `timeout` | Exceeded time limit |

### TriggerType

How an execution was initiated.

| Value | Database Value | Description |
|-------|----------------|-------------|
| MANUAL | `manual` | User-initiated |
| SCHEDULED | `scheduled` | Cron-based trigger |
| API | `api` | REST API call |
| WEBHOOK | `webhook` | External webhook |
| EVENT | `event` | Internal event trigger |

### LogLevel

Severity levels for execution logs.

| Value | Database Value | Description |
|-------|----------------|-------------|
| DEBUG | `debug` | Detailed debugging information |
| INFO | `info` | Normal operation events |
| WARN | `warn` | Warning conditions |
| ERROR | `error` | Error conditions |
| FATAL | `fatal` | Critical failures |

### StepStatus

States of individual workflow steps.

| Value | Database Value | Description |
|-------|----------------|-------------|
| PENDING | `pending` | Not yet started |
| RUNNING | `running` | Currently executing |
| COMPLETED | `completed` | Finished successfully |
| FAILED | `failed` | Finished with error |
| SKIPPED | `skipped` | Skipped due to dependency failure |

### TemplateType

Types of templates available.

| Value | Database Value | Description |
|-------|----------------|-------------|
| AGENT | `agent` | Agent template |
| WORKFLOW | `workflow` | Workflow template |
| STEP | `step` | Single step template |

### Environment

Deployment environment tiers.

| Value | Database Value | Description |
|-------|----------------|-------------|
| DEVELOPMENT | `development` | Development environment |
| STAGING | `staging` | Pre-production testing |
| PRODUCTION | `production` | Live production |

### DeploymentStatus

States of a deployment.

| Value | Database Value | Description |
|-------|----------------|-------------|
| STOPPED | `stopped` | Not running |
| STARTING | `starting` | Starting up |
| RUNNING | `running` | Active and accepting traffic |
| STOPPING | `stopping` | Shutting down |
| FAILED | `failed` | Failed to start/run |
| MAINTENANCE | `maintenance` | Under maintenance |

### HealthStatus

Health check results.

| Value | Database Value | Description |
|-------|----------------|-------------|
| UNKNOWN | `unknown` | Not yet checked |
| HEALTHY | `healthy` | Passing all checks |
| UNHEALTHY | `unhealthy` | Failing health checks |
| DEGRADED | `degraded` | Partially working |

---

## Models

### User

Stores user accounts and authentication information.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| email | VARCHAR(255) | No | - | Unique email address |
| passwordHash | VARCHAR(255) | Yes | - | Bcrypt hashed password |
| fullName | VARCHAR(255) | Yes | - | Display name |
| avatarUrl | TEXT | Yes | - | Profile image URL |
| role | UserRole | No | USER | Permission level |
| isActive | BOOLEAN | No | true | Account active status |
| emailVerified | BOOLEAN | No | false | Email verification status |
| emailVerifiedAt | TIMESTAMP | Yes | - | When email was verified |
| lastLoginAt | TIMESTAMP | Yes | - | Last successful login |
| preferences | JSON | No | {} | User preferences |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Relations:**
- Has many: agents, workflows, executions, templates, deployments, apiKeys, auditLogs

### Agent

Defines AI agents with their configurations and capabilities.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | - | Agent name |
| description | TEXT | Yes | - | Agent description |
| type | AgentType | No | - | Agent category |
| status | AgentStatus | No | DRAFT | Lifecycle status |
| version | INT | No | 1 | Version number |
| parentId | UUID | Yes | - | Parent version reference |
| userId | UUID | No | - | Owner user ID |
| config | JSON | No | {} | Agent configuration |
| capabilities | JSON | No | [] | List of capabilities |
| parameters | JSON | No | {} | Input parameters schema |
| maxExecutionTime | INT | Yes | 300 | Max runtime in seconds |
| maxMemoryMb | INT | Yes | 512 | Max memory allocation |
| maxConcurrentExecutions | INT | Yes | 1 | Concurrency limit |
| totalExecutions | INT | No | 0 | Total execution count |
| successfulExecutions | INT | No | 0 | Successful execution count |
| failedExecutions | INT | No | 0 | Failed execution count |
| avgExecutionTimeMs | INT | No | 0 | Average execution time |
| tags | TEXT[] | No | [] | Searchable tags |
| isPublic | BOOLEAN | No | false | Public visibility |
| isTemplate | BOOLEAN | No | false | Is a template |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Relations:**
- Belongs to: user
- Has many: versions (self-referential), workflowSteps, deployments
- Has one: parent (self-referential)

### Workflow

Defines workflows that orchestrate multiple agents.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | - | Workflow name |
| description | TEXT | Yes | - | Workflow description |
| userId | UUID | No | - | Owner user ID |
| status | WorkflowStatus | No | DRAFT | Lifecycle status |
| version | INT | No | 1 | Version number |
| parentId | UUID | Yes | - | Parent version reference |
| definition | JSON | No | {} | Workflow definition |
| triggerConfig | JSON | No | {} | Trigger configuration |
| scheduleEnabled | BOOLEAN | No | false | Scheduling active |
| scheduleCron | VARCHAR(100) | Yes | - | Cron expression |
| scheduleTimezone | VARCHAR(50) | No | UTC | Timezone for schedule |
| totalExecutions | INT | No | 0 | Total execution count |
| successfulExecutions | INT | No | 0 | Successful execution count |
| failedExecutions | INT | No | 0 | Failed execution count |
| avgExecutionTimeMs | INT | No | 0 | Average execution time |
| lastExecutionAt | TIMESTAMP | Yes | - | Last execution time |
| tags | TEXT[] | No | [] | Searchable tags |
| isPublic | BOOLEAN | No | false | Public visibility |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Relations:**
- Belongs to: user
- Has many: versions (self-referential), steps, executions, deployments
- Has one: parent (self-referential)

### WorkflowStep

Defines individual steps within workflows.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| workflowId | UUID | No | - | Parent workflow |
| agentId | UUID | Yes | - | Associated agent |
| stepKey | VARCHAR(100) | No | - | Unique step identifier |
| stepName | VARCHAR(255) | No | - | Display name |
| stepType | WorkflowStepType | No | - | Step category |
| position | INT | No | - | Execution order |
| config | JSON | No | {} | Step configuration |
| inputs | JSON | No | {} | Input mappings |
| outputs | JSON | No | {} | Output mappings |
| dependsOn | TEXT[] | No | [] | Step dependencies |
| retryCount | INT | No | 0 | Max retry attempts |
| retryDelayMs | INT | No | 1000 | Delay between retries |
| timeoutMs | INT | No | 30000 | Step timeout |
| onError | ErrorHandling | No | FAIL | Error handling strategy |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |

**Constraints:**
- Unique: (workflowId, stepKey)

**Relations:**
- Belongs to: workflow, agent
- Has many: executionLogs

### Execution

Records of workflow executions.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| workflowId | UUID | No | - | Executed workflow |
| userId | UUID | No | - | Triggering user |
| status | ExecutionStatus | No | PENDING | Current status |
| triggerType | TriggerType | No | - | How it was triggered |
| triggerData | JSON | No | {} | Trigger metadata |
| startedAt | TIMESTAMP | Yes | - | When execution started |
| completedAt | TIMESTAMP | Yes | - | When execution finished |
| durationMs | INT | Yes | - | Total execution time |
| inputData | JSON | No | {} | Input parameters |
| outputData | JSON | No | {} | Execution results |
| stepsCompleted | INT | No | 0 | Completed step count |
| stepsFailed | INT | No | 0 | Failed step count |
| stepsTotal | INT | No | 0 | Total step count |
| errorMessage | TEXT | Yes | - | Error description |
| errorStack | TEXT | Yes | - | Error stack trace |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |

**Relations:**
- Belongs to: workflow, user
- Has many: logs

### ExecutionLog

Detailed logs for each execution step.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| executionId | UUID | No | - | Parent execution |
| workflowStepId | UUID | Yes | - | Related step |
| level | LogLevel | No | INFO | Log severity |
| message | TEXT | No | - | Log message |
| metadata | JSON | No | {} | Additional data |
| stepKey | VARCHAR(100) | Yes | - | Step identifier |
| stepStatus | StepStatus | Yes | - | Step status when logged |
| stepStartedAt | TIMESTAMP | Yes | - | Step start time |
| stepCompletedAt | TIMESTAMP | Yes | - | Step completion time |
| stepDurationMs | INT | Yes | - | Step execution time |
| createdAt | TIMESTAMP | No | now() | Log timestamp |

**Relations:**
- Belongs to: execution, workflowStep

### Template

Reusable templates for agents and workflows.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | - | Template name |
| description | TEXT | Yes | - | Template description |
| category | VARCHAR(100) | No | - | Category classification |
| type | TemplateType | No | - | Template type |
| userId | UUID | Yes | - | Creator (null for official) |
| templateData | JSON | No | - | Template content |
| tags | TEXT[] | No | [] | Searchable tags |
| isOfficial | BOOLEAN | No | false | Official template |
| isPublic | BOOLEAN | No | false | Public visibility |
| usageCount | INT | No | 0 | Times instantiated |
| ratingAverage | DECIMAL(3,2) | No | 0 | Average rating |
| ratingCount | INT | No | 0 | Number of ratings |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Relations:**
- Belongs to: user (optional)

### Deployment

Deployed instances of agents or workflows.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| name | VARCHAR(255) | No | - | Deployment name |
| description | TEXT | Yes | - | Deployment description |
| userId | UUID | No | - | Owner user |
| workflowId | UUID | Yes | - | Deployed workflow |
| agentId | UUID | Yes | - | Deployed agent |
| environment | Environment | No | PRODUCTION | Target environment |
| status | DeploymentStatus | No | STOPPED | Current status |
| config | JSON | No | {} | Deployment config |
| environmentVars | JSON | No | {} | Environment variables |
| endpointUrl | TEXT | Yes | - | Public endpoint |
| apiKeyHash | VARCHAR(255) | Yes | - | Hashed API key |
| allocatedMemoryMb | INT | No | 512 | Memory allocation |
| allocatedCpuShares | INT | No | 1024 | CPU allocation |
| deployedAt | TIMESTAMP | Yes | - | Last deployment time |
| lastHealthCheckAt | TIMESTAMP | Yes | - | Last health check |
| healthStatus | HealthStatus | No | UNKNOWN | Health status |
| totalRequests | INT | No | 0 | Total requests served |
| totalErrors | INT | No | 0 | Total error responses |
| avgResponseTimeMs | INT | No | 0 | Average response time |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Constraints:**
- Application-level: Either workflowId OR agentId must be set (not both)

**Relations:**
- Belongs to: user, workflow (optional), agent (optional)

### ApiKey

API keys for programmatic access.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| userId | UUID | No | - | Owner user |
| name | VARCHAR(255) | No | - | Key name |
| keyHash | VARCHAR(255) | No | - | SHA-256 hash of key |
| keyPrefix | VARCHAR(20) | No | - | Key prefix for identification |
| scopes | TEXT[] | No | [] | Permitted operations |
| isActive | BOOLEAN | No | true | Key active status |
| expiresAt | TIMESTAMP | Yes | - | Expiration time |
| lastUsedAt | TIMESTAMP | Yes | - | Last usage time |
| usageCount | INT | No | 0 | Total uses |
| rateLimitPerMinute | INT | No | 60 | Rate limit |
| createdAt | TIMESTAMP | No | now() | Creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Last update timestamp |
| deletedAt | TIMESTAMP | Yes | - | Soft delete timestamp |

**Constraints:**
- Unique: keyHash

**Relations:**
- Belongs to: user

### AuditLog

Comprehensive audit trail for all system operations.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | auto | Primary key |
| userId | UUID | Yes | - | Acting user |
| action | VARCHAR(100) | No | - | Action performed |
| resourceType | VARCHAR(50) | No | - | Resource type |
| resourceId | UUID | Yes | - | Affected resource |
| changes | JSON | No | {} | Before/after values |
| metadata | JSON | No | {} | Additional context |
| ipAddress | TEXT | Yes | - | Client IP address |
| userAgent | TEXT | Yes | - | Client user agent |
| createdAt | TIMESTAMP | No | now() | Action timestamp |

**Relations:**
- Belongs to: user (optional)

---

## Indexes

### User Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| users_email_key | email (unique) | Email uniqueness |
| users_email_idx | email | Email lookups |
| users_role_idx | role | Role-based queries |
| users_created_at_idx | createdAt DESC | Recent users |

### Agent Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| agents_user_id_idx | userId | User's agents |
| agents_type_idx | type | Type filtering |
| agents_status_idx | status | Status filtering |
| agents_is_public_idx | isPublic | Public agent listing |
| agents_tags_idx | tags (GIN) | Tag-based search |
| agents_created_at_idx | createdAt DESC | Recent agents |

### Workflow Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| workflows_user_id_idx | userId | User's workflows |
| workflows_status_idx | status | Status filtering |
| workflows_schedule_enabled_idx | scheduleEnabled | Scheduled workflows |
| workflows_tags_idx | tags (GIN) | Tag-based search |
| workflows_created_at_idx | createdAt DESC | Recent workflows |

### WorkflowStep Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| workflow_steps_workflow_id_step_key_key | workflowId, stepKey (unique) | Step uniqueness |
| workflow_steps_workflow_id_idx | workflowId | Workflow's steps |
| workflow_steps_agent_id_idx | agentId | Agent references |
| workflow_steps_workflow_id_position_idx | workflowId, position | Ordered steps |

### Execution Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| executions_workflow_id_idx | workflowId | Workflow executions |
| executions_user_id_idx | userId | User's executions |
| executions_status_idx | status | Status filtering |
| executions_created_at_idx | createdAt DESC | Recent executions |
| executions_completed_at_idx | completedAt DESC | Completion ordering |

### ExecutionLog Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| execution_logs_execution_id_created_at_idx | executionId, createdAt | Chronological logs |
| execution_logs_level_idx | level | Log level filtering |
| execution_logs_created_at_idx | createdAt DESC | Recent logs |

### Template Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| templates_category_idx | category | Category browsing |
| templates_type_idx | type | Type filtering |
| templates_is_official_idx | isOfficial | Official templates |
| templates_is_public_idx | isPublic | Public templates |
| templates_tags_idx | tags (GIN) | Tag-based search |
| templates_usage_count_idx | usageCount DESC | Popular templates |

### Deployment Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| deployments_user_id_idx | userId | User's deployments |
| deployments_workflow_id_idx | workflowId | Workflow deployments |
| deployments_agent_id_idx | agentId | Agent deployments |
| deployments_status_idx | status | Status filtering |
| deployments_environment_idx | environment | Environment filtering |

### ApiKey Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| api_keys_key_hash_key | keyHash (unique) | Key uniqueness |
| api_keys_user_id_idx | userId | User's keys |
| api_keys_key_hash_idx | keyHash | Key lookups |
| api_keys_key_prefix_idx | keyPrefix | Prefix lookups |
| api_keys_expires_at_idx | expiresAt | Expired key cleanup |

### AuditLog Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| audit_logs_user_id_idx | userId | User's audit trail |
| audit_logs_resource_type_resource_id_idx | resourceType, resourceId | Resource history |
| audit_logs_action_idx | action | Action filtering |
| audit_logs_created_at_idx | createdAt DESC | Recent logs |

---

## Constraints

### Foreign Key Constraints

All foreign keys use the following behaviors:

| Relation | On Delete | On Update |
|----------|-----------|-----------|
| User references | CASCADE | CASCADE |
| Parent references (versioning) | SET NULL | CASCADE |
| Optional references | SET NULL | CASCADE |

### Business Rule Constraints

These constraints are enforced at the application layer:

1. **Deployment Resource Exclusivity**
   - Either `workflowId` OR `agentId` must be set
   - Not both, not neither

2. **Version Tree Integrity**
   - `parentId` must reference an existing, non-deleted record
   - Version numbers must be sequential within a tree

3. **Soft Delete Propagation**
   - Deleting a user soft-deletes related records
   - Queries exclude soft-deleted records by default

---

## Query Patterns

### Pagination

```sql
-- Get paginated agents for a user
SELECT * FROM agents
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Count total for pagination
SELECT COUNT(*) FROM agents
WHERE user_id = $1 AND deleted_at IS NULL;
```

### Filtering with Tags

```sql
-- Find agents with any of the specified tags
SELECT * FROM agents
WHERE user_id = $1
  AND deleted_at IS NULL
  AND tags && ARRAY['ml', 'automation']::text[];
```

### Version History

```sql
-- Get all versions of an agent
SELECT * FROM agents
WHERE (id = $1 OR parent_id = $1)
  -- Include deleted for history
ORDER BY version DESC;
```

### Execution Statistics

```sql
-- Get workflow execution stats
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(duration_ms) as avg_duration
FROM executions
WHERE workflow_id = $1
  AND created_at > NOW() - INTERVAL '30 days';
```

### Search with Full Text

```sql
-- Search agents by name and description
SELECT * FROM agents
WHERE user_id = $1
  AND deleted_at IS NULL
  AND (
    name ILIKE '%' || $2 || '%'
    OR description ILIKE '%' || $2 || '%'
  )
ORDER BY created_at DESC;
```

---

## Migration Reference

See [prisma/README.md](../prisma/README.md) for:
- Migration workflow
- Creating new migrations
- Rollback procedures
- Seed data management

---

**Last Updated:** January 7, 2026
