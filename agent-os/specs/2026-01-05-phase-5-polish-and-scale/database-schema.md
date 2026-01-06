# Database Schema Specification

**Version:** 1.0
**Date:** January 5, 2026
**Database:** PostgreSQL 15+
**ORM:** Prisma 5.x

---

## Overview

This document defines the complete database schema for the Turbocat platform. The schema is designed to support multi-agent orchestration, workflow management, user authentication, and comprehensive audit logging.

### Design Principles
1. **Normalization**: 3NF (Third Normal Form) for data integrity
2. **Soft Deletes**: All entities support soft deletion via `deletedAt` timestamp
3. **Audit Trail**: Comprehensive tracking with `createdAt` and `updatedAt`
4. **Type Safety**: Enums for fixed value sets
5. **Performance**: Strategic indexes on frequently queried fields
6. **Relationships**: Proper foreign keys with cascade rules

---

## Entity Relationship Diagram

```
┌──────────────┐
│    Users     │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴───────┐         ┌───────────────┐
│    Agents    │────────▶│   Templates   │
└──────┬───────┘ use     └───────────────┘
       │ 1
       │
       │ *
┌──────┴───────┐
│  Workflows   │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴─────────┐       ┌────────────────┐
│ WorkflowSteps  │       │  Deployments   │
└────────────────┘       └────────┬───────┘
       │                          │
       │                          │
       │ workflow_id              │ workflow_id
       │                          │
       ▼                          ▼
┌────────────────┐       ┌────────────────┐
│  Executions    │◀──────│ ExecutionLogs  │
└────────────────┘       └────────────────┘
       │
       │ execution_id
       │
       ▼
┌────────────────┐
│  AuditLogs     │
└────────────────┘
```

---

## Table Definitions

### 1. Users

Stores user account information and authentication details.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'agent'))
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Fields:**
- `id` (UUID): Primary key, auto-generated
- `email` (String): Unique email address
- `password_hash` (String): Hashed password (bcrypt)
- `full_name` (String): User's display name
- `avatar_url` (String): Profile picture URL
- `role` (Enum): User role (admin, user, agent)
- `is_active` (Boolean): Account active status
- `email_verified` (Boolean): Email verification status
- `email_verified_at` (DateTime): When email was verified
- `last_login_at` (DateTime): Last successful login
- `preferences` (JSON): User preferences and settings
- `created_at` (DateTime): Record creation timestamp
- `updated_at` (DateTime): Last update timestamp
- `deleted_at` (DateTime): Soft delete timestamp

---

### 2. Agents

Defines AI agents with their configurations and capabilities.

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  capabilities JSONB DEFAULT '[]',
  parameters JSONB DEFAULT '{}',

  -- Resource limits
  max_execution_time INTEGER DEFAULT 300,
  max_memory_mb INTEGER DEFAULT 512,
  max_concurrent_executions INTEGER DEFAULT 1,

  -- Metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT agents_type_check CHECK (type IN ('code', 'api', 'llm', 'data', 'workflow')),
  CONSTRAINT agents_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'))
);

CREATE INDEX idx_agents_user_id ON agents(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_type ON agents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_status ON agents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_is_public ON agents(is_public) WHERE deleted_at IS NULL AND is_public = true;
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);
```

**Fields:**
- `id` (UUID): Primary key
- `name` (String): Agent name
- `description` (Text): Agent description
- `type` (Enum): Agent type (code, api, llm, data, workflow)
- `status` (Enum): Current status (draft, active, inactive, archived)
- `version` (Integer): Version number
- `parent_id` (UUID): Parent agent (for versioning)
- `user_id` (UUID): Owner user ID
- `config` (JSON): Agent configuration
- `capabilities` (JSON): Agent capabilities array
- `parameters` (JSON): Configurable parameters
- `max_execution_time` (Integer): Max execution time in seconds
- `max_memory_mb` (Integer): Max memory in MB
- `max_concurrent_executions` (Integer): Concurrent execution limit
- `total_executions` (Integer): Total execution count
- `successful_executions` (Integer): Successful execution count
- `failed_executions` (Integer): Failed execution count
- `avg_execution_time_ms` (Integer): Average execution time
- `tags` (Array): Searchable tags
- `is_public` (Boolean): Public visibility
- `is_template` (Boolean): Is template flag

---

### 3. Workflows

Defines workflows that orchestrate multiple agents.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES workflows(id) ON DELETE SET NULL,

  -- Workflow definition
  definition JSONB NOT NULL DEFAULT '{}',
  trigger_config JSONB DEFAULT '{}',

  -- Scheduling
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(50) DEFAULT 'UTC',

  -- Metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  last_execution_at TIMESTAMP,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT workflows_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'))
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workflows_status ON workflows(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_workflows_schedule_enabled ON workflows(schedule_enabled) WHERE deleted_at IS NULL AND schedule_enabled = true;
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
```

**Fields:**
- `id` (UUID): Primary key
- `name` (String): Workflow name
- `description` (Text): Workflow description
- `user_id` (UUID): Owner user ID
- `status` (Enum): Current status
- `version` (Integer): Version number
- `parent_id` (UUID): Parent workflow (for versioning)
- `definition` (JSON): Workflow DAG definition
- `trigger_config` (JSON): Trigger configuration
- `schedule_enabled` (Boolean): Is scheduling enabled
- `schedule_cron` (String): Cron expression
- `schedule_timezone` (String): Timezone for scheduling
- `total_executions` (Integer): Total execution count
- `successful_executions` (Integer): Success count
- `failed_executions` (Integer): Failure count
- `avg_execution_time_ms` (Integer): Average execution time
- `last_execution_at` (DateTime): Last execution timestamp
- `tags` (Array): Searchable tags
- `is_public` (Boolean): Public visibility

---

### 4. WorkflowSteps

Defines individual steps within workflows.

```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  step_key VARCHAR(100) NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,

  -- Configuration
  config JSONB DEFAULT '{}',
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',

  -- Dependencies
  depends_on TEXT[] DEFAULT '{}',

  -- Error handling
  retry_count INTEGER DEFAULT 0,
  retry_delay_ms INTEGER DEFAULT 1000,
  timeout_ms INTEGER DEFAULT 30000,
  on_error VARCHAR(50) DEFAULT 'fail',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT workflow_steps_type_check CHECK (step_type IN ('agent', 'condition', 'loop', 'parallel', 'wait')),
  CONSTRAINT workflow_steps_on_error_check CHECK (on_error IN ('fail', 'continue', 'retry')),
  CONSTRAINT workflow_steps_unique_key UNIQUE (workflow_id, step_key)
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_agent_id ON workflow_steps(agent_id);
CREATE INDEX idx_workflow_steps_position ON workflow_steps(workflow_id, position);
```

**Fields:**
- `id` (UUID): Primary key
- `workflow_id` (UUID): Parent workflow
- `agent_id` (UUID): Agent to execute
- `step_key` (String): Unique step identifier within workflow
- `step_name` (String): Display name
- `step_type` (Enum): Step type
- `position` (Integer): Order in workflow
- `config` (JSON): Step configuration
- `inputs` (JSON): Input mappings
- `outputs` (JSON): Output mappings
- `depends_on` (Array): Dependencies (step keys)
- `retry_count` (Integer): Number of retries
- `retry_delay_ms` (Integer): Delay between retries
- `timeout_ms` (Integer): Step timeout
- `on_error` (Enum): Error handling strategy

---

### 5. Executions

Records of workflow executions.

```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  trigger_type VARCHAR(50) NOT NULL,
  trigger_data JSONB DEFAULT '{}',

  -- Execution details
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Input/Output
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',

  -- Results
  steps_completed INTEGER DEFAULT 0,
  steps_failed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,

  -- Error information
  error_message TEXT,
  error_stack TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT executions_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
  CONSTRAINT executions_trigger_check CHECK (trigger_type IN ('manual', 'scheduled', 'api', 'webhook', 'event'))
);

CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX idx_executions_completed_at ON executions(completed_at DESC) WHERE completed_at IS NOT NULL;
```

**Fields:**
- `id` (UUID): Primary key
- `workflow_id` (UUID): Workflow being executed
- `user_id` (UUID): User who triggered
- `status` (Enum): Execution status
- `trigger_type` (Enum): How execution was triggered
- `trigger_data` (JSON): Trigger metadata
- `started_at` (DateTime): Start time
- `completed_at` (DateTime): Completion time
- `duration_ms` (Integer): Total duration
- `input_data` (JSON): Execution inputs
- `output_data` (JSON): Execution outputs
- `steps_completed` (Integer): Completed steps count
- `steps_failed` (Integer): Failed steps count
- `steps_total` (Integer): Total steps count
- `error_message` (Text): Error message if failed
- `error_stack` (Text): Error stack trace

---

### 6. ExecutionLogs

Detailed logs for each execution step.

```sql
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,

  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Step execution details
  step_key VARCHAR(100),
  step_status VARCHAR(50),
  step_started_at TIMESTAMP,
  step_completed_at TIMESTAMP,
  step_duration_ms INTEGER,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT execution_logs_level_check CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  CONSTRAINT execution_logs_step_status_check CHECK (step_status IN ('pending', 'running', 'completed', 'failed', 'skipped'))
);

CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id, created_at);
CREATE INDEX idx_execution_logs_level ON execution_logs(level) WHERE level IN ('error', 'fatal');
CREATE INDEX idx_execution_logs_created_at ON execution_logs(created_at DESC);
```

**Fields:**
- `id` (UUID): Primary key
- `execution_id` (UUID): Parent execution
- `workflow_step_id` (UUID): Related workflow step
- `level` (Enum): Log level
- `message` (Text): Log message
- `metadata` (JSON): Additional data
- `step_key` (String): Step identifier
- `step_status` (Enum): Step execution status
- `step_started_at` (DateTime): Step start time
- `step_completed_at` (DateTime): Step completion time
- `step_duration_ms` (Integer): Step duration

---

### 7. Templates

Reusable templates for agents and workflows.

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Template content
  template_data JSONB NOT NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_official BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT templates_type_check CHECK (type IN ('agent', 'workflow', 'step')),
  CONSTRAINT templates_rating_check CHECK (rating_average >= 0 AND rating_average <= 5)
);

CREATE INDEX idx_templates_category ON templates(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_type ON templates(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_is_official ON templates(is_official) WHERE deleted_at IS NULL AND is_official = true;
CREATE INDEX idx_templates_is_public ON templates(is_public) WHERE deleted_at IS NULL AND is_public = true;
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);
```

**Fields:**
- `id` (UUID): Primary key
- `name` (String): Template name
- `description` (Text): Template description
- `category` (String): Template category
- `type` (Enum): Template type (agent, workflow, step)
- `user_id` (UUID): Creator user ID
- `template_data` (JSON): Template content
- `tags` (Array): Searchable tags
- `is_official` (Boolean): Official template flag
- `is_public` (Boolean): Public visibility
- `usage_count` (Integer): Times used
- `rating_average` (Decimal): Average rating
- `rating_count` (Integer): Number of ratings

---

### 8. Deployments

Deployed instances of agents or workflows.

```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  status VARCHAR(50) NOT NULL DEFAULT 'stopped',

  -- Configuration
  config JSONB DEFAULT '{}',
  environment_vars JSONB DEFAULT '{}',

  -- Endpoints
  endpoint_url TEXT,
  api_key_hash VARCHAR(255),

  -- Resource allocation
  allocated_memory_mb INTEGER DEFAULT 512,
  allocated_cpu_shares INTEGER DEFAULT 1024,

  -- Lifecycle
  deployed_at TIMESTAMP,
  last_health_check_at TIMESTAMP,
  health_status VARCHAR(50) DEFAULT 'unknown',

  -- Metrics
  total_requests INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT deployments_environment_check CHECK (environment IN ('development', 'staging', 'production')),
  CONSTRAINT deployments_status_check CHECK (status IN ('stopped', 'starting', 'running', 'stopping', 'failed', 'maintenance')),
  CONSTRAINT deployments_health_check CHECK (health_status IN ('unknown', 'healthy', 'unhealthy', 'degraded')),
  CONSTRAINT deployments_target_check CHECK (
    (workflow_id IS NOT NULL AND agent_id IS NULL) OR
    (workflow_id IS NULL AND agent_id IS NOT NULL)
  )
);

CREATE INDEX idx_deployments_user_id ON deployments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deployments_workflow_id ON deployments(workflow_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deployments_agent_id ON deployments(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deployments_status ON deployments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deployments_environment ON deployments(environment) WHERE deleted_at IS NULL;
```

**Fields:**
- `id` (UUID): Primary key
- `name` (String): Deployment name
- `description` (Text): Deployment description
- `user_id` (UUID): Owner user ID
- `workflow_id` (UUID): Deployed workflow (mutually exclusive with agent_id)
- `agent_id` (UUID): Deployed agent (mutually exclusive with workflow_id)
- `environment` (Enum): Deployment environment
- `status` (Enum): Current status
- `config` (JSON): Deployment configuration
- `environment_vars` (JSON): Environment variables
- `endpoint_url` (String): API endpoint URL
- `api_key_hash` (String): Hashed API key
- `allocated_memory_mb` (Integer): Memory allocation
- `allocated_cpu_shares` (Integer): CPU shares
- `deployed_at` (DateTime): Deployment timestamp
- `last_health_check_at` (DateTime): Last health check
- `health_status` (Enum): Health status
- `total_requests` (Integer): Total API requests
- `total_errors` (Integer): Total errors
- `avg_response_time_ms` (Integer): Average response time

---

### 9. ApiKeys

API keys for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,

  scopes TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,

  usage_count INTEGER DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 60,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix) WHERE deleted_at IS NULL;
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
```

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Owner user ID
- `name` (String): API key name
- `key_hash` (String): Hashed key value
- `key_prefix` (String): Key prefix (for identification)
- `scopes` (Array): Allowed scopes
- `is_active` (Boolean): Active status
- `expires_at` (DateTime): Expiration timestamp
- `last_used_at` (DateTime): Last usage timestamp
- `usage_count` (Integer): Usage counter
- `rate_limit_per_minute` (Integer): Rate limit

---

### 10. AuditLogs

Comprehensive audit trail for all system operations.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,

  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): User who performed action
- `action` (String): Action performed (e.g., 'create', 'update', 'delete')
- `resource_type` (String): Type of resource affected
- `resource_id` (UUID): ID of affected resource
- `changes` (JSON): Before/after values
- `metadata` (JSON): Additional context
- `ip_address` (String): IP address of request
- `user_agent` (String): User agent string

---

## Prisma Schema

Complete Prisma schema definition:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique @db.VarChar(255)
  passwordHash      String?   @map("password_hash") @db.VarChar(255)
  fullName          String?   @map("full_name") @db.VarChar(255)
  avatarUrl         String?   @map("avatar_url")
  role              UserRole  @default(USER)
  isActive          Boolean   @default(true) @map("is_active")
  emailVerified     Boolean   @default(false) @map("email_verified")
  emailVerifiedAt   DateTime? @map("email_verified_at")
  lastLoginAt       DateTime? @map("last_login_at")
  preferences       Json      @default("{}")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  agents            Agent[]
  workflows         Workflow[]
  executions        Execution[]
  templates         Template[]
  deployments       Deployment[]
  apiKeys           ApiKey[]
  auditLogs         AuditLog[]

  @@index([email])
  @@index([role])
  @@index([createdAt])
  @@map("users")
}

enum UserRole {
  ADMIN   @map("admin")
  USER    @map("user")
  AGENT   @map("agent")
}

model Agent {
  id                      String      @id @default(uuid()) @db.Uuid
  name                    String      @db.VarChar(255)
  description             String?
  type                    AgentType
  status                  AgentStatus @default(DRAFT)
  version                 Int         @default(1)
  parentId                String?     @map("parent_id") @db.Uuid
  userId                  String      @map("user_id") @db.Uuid

  config                  Json        @default("{}")
  capabilities            Json        @default("[]")
  parameters              Json        @default("{}")

  maxExecutionTime        Int?        @default(300) @map("max_execution_time")
  maxMemoryMb             Int?        @default(512) @map("max_memory_mb")
  maxConcurrentExecutions Int?        @default(1) @map("max_concurrent_executions")

  totalExecutions         Int         @default(0) @map("total_executions")
  successfulExecutions    Int         @default(0) @map("successful_executions")
  failedExecutions        Int         @default(0) @map("failed_executions")
  avgExecutionTimeMs      Int         @default(0) @map("avg_execution_time_ms")

  tags                    String[]    @default([])
  isPublic                Boolean     @default(false) @map("is_public")
  isTemplate              Boolean     @default(false) @map("is_template")

  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  deletedAt               DateTime?   @map("deleted_at")

  user                    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent                  Agent?      @relation("AgentVersions", fields: [parentId], references: [id])
  versions                Agent[]     @relation("AgentVersions")
  workflowSteps           WorkflowStep[]
  deployments             Deployment[]

  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([isPublic])
  @@index([tags])
  @@index([createdAt])
  @@map("agents")
}

enum AgentType {
  CODE      @map("code")
  API       @map("api")
  LLM       @map("llm")
  DATA      @map("data")
  WORKFLOW  @map("workflow")
}

enum AgentStatus {
  DRAFT     @map("draft")
  ACTIVE    @map("active")
  INACTIVE  @map("inactive")
  ARCHIVED  @map("archived")
}

model Workflow {
  id                    String         @id @default(uuid()) @db.Uuid
  name                  String         @db.VarChar(255)
  description           String?
  userId                String         @map("user_id") @db.Uuid
  status                WorkflowStatus @default(DRAFT)
  version               Int            @default(1)
  parentId              String?        @map("parent_id") @db.Uuid

  definition            Json           @default("{}")
  triggerConfig         Json           @default("{}") @map("trigger_config")

  scheduleEnabled       Boolean        @default(false) @map("schedule_enabled")
  scheduleCron          String?        @map("schedule_cron") @db.VarChar(100)
  scheduleTimezone      String         @default("UTC") @map("schedule_timezone") @db.VarChar(50)

  totalExecutions       Int            @default(0) @map("total_executions")
  successfulExecutions  Int            @default(0) @map("successful_executions")
  failedExecutions      Int            @default(0) @map("failed_executions")
  avgExecutionTimeMs    Int            @default(0) @map("avg_execution_time_ms")
  lastExecutionAt       DateTime?      @map("last_execution_at")

  tags                  String[]       @default([])
  isPublic              Boolean        @default(false) @map("is_public")

  createdAt             DateTime       @default(now()) @map("created_at")
  updatedAt             DateTime       @updatedAt @map("updated_at")
  deletedAt             DateTime?      @map("deleted_at")

  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent                Workflow?      @relation("WorkflowVersions", fields: [parentId], references: [id])
  versions              Workflow[]     @relation("WorkflowVersions")
  steps                 WorkflowStep[]
  executions            Execution[]
  deployments           Deployment[]

  @@index([userId])
  @@index([status])
  @@index([scheduleEnabled])
  @@index([tags])
  @@index([createdAt])
  @@map("workflows")
}

enum WorkflowStatus {
  DRAFT     @map("draft")
  ACTIVE    @map("active")
  INACTIVE  @map("inactive")
  ARCHIVED  @map("archived")
}

model WorkflowStep {
  id              String              @id @default(uuid()) @db.Uuid
  workflowId      String              @map("workflow_id") @db.Uuid
  agentId         String?             @map("agent_id") @db.Uuid

  stepKey         String              @map("step_key") @db.VarChar(100)
  stepName        String              @map("step_name") @db.VarChar(255)
  stepType        WorkflowStepType    @map("step_type")
  position        Int

  config          Json                @default("{}")
  inputs          Json                @default("{}")
  outputs         Json                @default("{}")

  dependsOn       String[]            @default([]) @map("depends_on")

  retryCount      Int                 @default(0) @map("retry_count")
  retryDelayMs    Int                 @default(1000) @map("retry_delay_ms")
  timeoutMs       Int                 @default(30000) @map("timeout_ms")
  onError         ErrorHandling       @default(FAIL) @map("on_error")

  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  workflow        Workflow            @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  agent           Agent?              @relation(fields: [agentId], references: [id])
  executionLogs   ExecutionLog[]

  @@unique([workflowId, stepKey])
  @@index([workflowId])
  @@index([agentId])
  @@index([workflowId, position])
  @@map("workflow_steps")
}

enum WorkflowStepType {
  AGENT     @map("agent")
  CONDITION @map("condition")
  LOOP      @map("loop")
  PARALLEL  @map("parallel")
  WAIT      @map("wait")
}

enum ErrorHandling {
  FAIL      @map("fail")
  CONTINUE  @map("continue")
  RETRY     @map("retry")
}

model Execution {
  id              String           @id @default(uuid()) @db.Uuid
  workflowId      String           @map("workflow_id") @db.Uuid
  userId          String           @map("user_id") @db.Uuid

  status          ExecutionStatus  @default(PENDING)
  triggerType     TriggerType      @map("trigger_type")
  triggerData     Json             @default("{}") @map("trigger_data")

  startedAt       DateTime?        @map("started_at")
  completedAt     DateTime?        @map("completed_at")
  durationMs      Int?             @map("duration_ms")

  inputData       Json             @default("{}") @map("input_data")
  outputData      Json             @default("{}") @map("output_data")

  stepsCompleted  Int              @default(0) @map("steps_completed")
  stepsFailed     Int              @default(0) @map("steps_failed")
  stepsTotal      Int              @default(0) @map("steps_total")

  errorMessage    String?          @map("error_message")
  errorStack      String?          @map("error_stack")

  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  workflow        Workflow         @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs            ExecutionLog[]

  @@index([workflowId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([completedAt])
  @@map("executions")
}

enum ExecutionStatus {
  PENDING   @map("pending")
  RUNNING   @map("running")
  COMPLETED @map("completed")
  FAILED    @map("failed")
  CANCELLED @map("cancelled")
  TIMEOUT   @map("timeout")
}

enum TriggerType {
  MANUAL    @map("manual")
  SCHEDULED @map("scheduled")
  API       @map("api")
  WEBHOOK   @map("webhook")
  EVENT     @map("event")
}

model ExecutionLog {
  id                String         @id @default(uuid()) @db.Uuid
  executionId       String         @map("execution_id") @db.Uuid
  workflowStepId    String?        @map("workflow_step_id") @db.Uuid

  level             LogLevel       @default(INFO)
  message           String
  metadata          Json           @default("{}")

  stepKey           String?        @map("step_key") @db.VarChar(100)
  stepStatus        StepStatus?    @map("step_status")
  stepStartedAt     DateTime?      @map("step_started_at")
  stepCompletedAt   DateTime?      @map("step_completed_at")
  stepDurationMs    Int?           @map("step_duration_ms")

  createdAt         DateTime       @default(now()) @map("created_at")

  execution         Execution      @relation(fields: [executionId], references: [id], onDelete: Cascade)
  workflowStep      WorkflowStep?  @relation(fields: [workflowStepId], references: [id])

  @@index([executionId, createdAt])
  @@index([level])
  @@index([createdAt])
  @@map("execution_logs")
}

enum LogLevel {
  DEBUG @map("debug")
  INFO  @map("info")
  WARN  @map("warn")
  ERROR @map("error")
  FATAL @map("fatal")
}

enum StepStatus {
  PENDING   @map("pending")
  RUNNING   @map("running")
  COMPLETED @map("completed")
  FAILED    @map("failed")
  SKIPPED   @map("skipped")
}

model Template {
  id              String        @id @default(uuid()) @db.Uuid
  name            String        @db.VarChar(255)
  description     String?
  category        String        @db.VarChar(100)
  type            TemplateType

  userId          String?       @map("user_id") @db.Uuid

  templateData    Json          @map("template_data")

  tags            String[]      @default([])
  isOfficial      Boolean       @default(false) @map("is_official")
  isPublic        Boolean       @default(false) @map("is_public")

  usageCount      Int           @default(0) @map("usage_count")
  ratingAverage   Decimal       @default(0) @map("rating_average") @db.Decimal(3, 2)
  ratingCount     Int           @default(0) @map("rating_count")

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")

  user            User?         @relation(fields: [userId], references: [id])

  @@index([category])
  @@index([type])
  @@index([isOfficial])
  @@index([isPublic])
  @@index([tags])
  @@index([usageCount])
  @@map("templates")
}

enum TemplateType {
  AGENT     @map("agent")
  WORKFLOW  @map("workflow")
  STEP      @map("step")
}

model Deployment {
  id                  String             @id @default(uuid()) @db.Uuid
  name                String             @db.VarChar(255)
  description         String?

  userId              String             @map("user_id") @db.Uuid
  workflowId          String?            @map("workflow_id") @db.Uuid
  agentId             String?            @map("agent_id") @db.Uuid

  environment         Environment        @default(PRODUCTION)
  status              DeploymentStatus   @default(STOPPED)

  config              Json               @default("{}")
  environmentVars     Json               @default("{}") @map("environment_vars")

  endpointUrl         String?            @map("endpoint_url")
  apiKeyHash          String?            @map("api_key_hash") @db.VarChar(255)

  allocatedMemoryMb   Int                @default(512) @map("allocated_memory_mb")
  allocatedCpuShares  Int                @default(1024) @map("allocated_cpu_shares")

  deployedAt          DateTime?          @map("deployed_at")
  lastHealthCheckAt   DateTime?          @map("last_health_check_at")
  healthStatus        HealthStatus       @default(UNKNOWN) @map("health_status")

  totalRequests       Int                @default(0) @map("total_requests")
  totalErrors         Int                @default(0) @map("total_errors")
  avgResponseTimeMs   Int                @default(0) @map("avg_response_time_ms")

  createdAt           DateTime           @default(now()) @map("created_at")
  updatedAt           DateTime           @updatedAt @map("updated_at")
  deletedAt           DateTime?          @map("deleted_at")

  user                User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  workflow            Workflow?          @relation(fields: [workflowId], references: [id])
  agent               Agent?             @relation(fields: [agentId], references: [id])

  @@index([userId])
  @@index([workflowId])
  @@index([agentId])
  @@index([status])
  @@index([environment])
  @@map("deployments")
}

enum Environment {
  DEVELOPMENT @map("development")
  STAGING     @map("staging")
  PRODUCTION  @map("production")
}

enum DeploymentStatus {
  STOPPED     @map("stopped")
  STARTING    @map("starting")
  RUNNING     @map("running")
  STOPPING    @map("stopping")
  FAILED      @map("failed")
  MAINTENANCE @map("maintenance")
}

enum HealthStatus {
  UNKNOWN   @map("unknown")
  HEALTHY   @map("healthy")
  UNHEALTHY @map("unhealthy")
  DEGRADED  @map("degraded")
}

model ApiKey {
  id                  String    @id @default(uuid()) @db.Uuid
  userId              String    @map("user_id") @db.Uuid

  name                String    @db.VarChar(255)
  keyHash             String    @unique @map("key_hash") @db.VarChar(255)
  keyPrefix           String    @map("key_prefix") @db.VarChar(20)

  scopes              String[]  @default([])

  isActive            Boolean   @default(true) @map("is_active")
  expiresAt           DateTime? @map("expires_at")
  lastUsedAt          DateTime? @map("last_used_at")

  usageCount          Int       @default(0) @map("usage_count")
  rateLimitPerMinute  Int       @default(60) @map("rate_limit_per_minute")

  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([keyHash])
  @@index([keyPrefix])
  @@index([expiresAt])
  @@map("api_keys")
}

model AuditLog {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String?   @map("user_id") @db.Uuid

  action        String    @db.VarChar(100)
  resourceType  String    @map("resource_type") @db.VarChar(50)
  resourceId    String?   @map("resource_id") @db.Uuid

  changes       Json      @default("{}")
  metadata      Json      @default("{}")

  ipAddress     String?   @map("ip_address")
  userAgent     String?   @map("user_agent")

  createdAt     DateTime  @default(now()) @map("created_at")

  user          User?     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## Migration Strategy

### Initial Migration
```bash
# Create initial migration
npx prisma migrate dev --name init

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Seed Data
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@turbocat.dev',
      fullName: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Create sample templates
  const templates = [
    {
      name: 'Web Scraper Agent',
      description: 'Agent for scraping web content',
      category: 'Data Collection',
      type: 'AGENT',
      isOfficial: true,
      isPublic: true,
      templateData: { /* ... */ },
    },
    // ... more templates
  ];

  for (const template of templates) {
    await prisma.template.create({ data: template });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Frequently queried fields have indexes
- Composite indexes for common query patterns
- GIN indexes for array fields (tags)

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` judiciously to avoid N+1 queries
- Implement pagination for list queries
- Use database views for complex queries

### Connection Pooling
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Backup and Recovery

### Automated Backups
- Daily full backups (Supabase handles this)
- Point-in-time recovery available
- Test restore procedures monthly

### Data Retention
- Soft-deleted records retained for 90 days
- Audit logs retained for 1 year
- Execution logs retained for 30 days (configurable)

---

**End of Database Schema Specification**
