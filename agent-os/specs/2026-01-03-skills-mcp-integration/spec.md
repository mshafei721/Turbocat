# Skills & MCP Integration Specification

**Feature:** Skills System & MCP Integration
**Phase:** 3 (Extensibility)
**Roadmap Items:** 14-21
**Effort Estimate:** L-XL (8-10 weeks total)
**Status:** Draft
**Created:** 2026-01-03
**Author:** Spec Writer Agent

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Criteria](#2-goals--success-criteria)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Skills System Specification](#4-skills-system-specification)
5. [MCP Integration Specifications](#5-mcp-integration-specifications)
6. [Core Skills Detailed Specs](#6-core-skills-detailed-specs)
7. [Integration Templates Specs](#7-integration-templates-specs)
8. [UI/UX Requirements](#8-uiux-requirements)
9. [Testing Requirements](#9-testing-requirements)
10. [Dependencies & Effort Estimates](#10-dependencies--effort-estimates)
11. [Appendices](#11-appendices)

---

## 1. Overview

### 1.1 What This Spec Covers

This specification defines the complete extensibility layer for Turbocat, enabling enhanced AI capabilities through:

- **Skills System:** A framework for defining, registering, and invoking specialized AI behaviors using the Claude Code SKILL.md format
- **MCP Integrations:** Comprehensive Model Context Protocol server connections for external tools and services
- **Core Skills:** Foundational skills for database design, API integration, UI components, and Supabase setup
- **Integration Templates:** Full-package solutions combining skills, code templates, and MCP configurations for common services

### 1.2 Context

| Context | Details |
|---------|---------|
| Phase 1 | Complete - turbocat-agent.vercel.app deployed |
| Phase 2 | Must complete before Phase 3 starts |
| Phase 2 Dependencies | Design tokens, Storybook, Component Gallery |
| Tech Stack | Next.js 15, React 19, Vercel AI SDK, MCP servers |
| Primary Agent | Claude Code with native MCP support |
| Additional Agents | Gemini CLI, Codex CLI (verify MCP support) |

### 1.3 Key Differentiators

| Capability | Description |
|------------|-------------|
| Natural Language Invocation | AI automatically detects when to use skills based on user intent |
| Full Execution Trace | Complete AI reasoning and decision trace visible to users |
| Bidirectional Component Integration | UI Component skill reads from AND contributes to Component Gallery |
| Multi-Agent MCP Support | MCP capabilities across Claude, Gemini, and Codex agents |
| Full Package Templates | Skills + code templates + MCP configs bundled together |

### 1.4 Reference Sources

| Source | Purpose |
|--------|---------|
| [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25) | Official protocol specification |
| [Anthropic MCP Best Practices](https://www.anthropic.com/engineering/code-execution-with-mcp) | Implementation patterns |
| [Claude Code Skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | SKILL.md format reference |
| [Advanced Tool Use SOPs](https://github.com/jeremylongshore/claude-code-plugins-plus-skills/blob/main/000-docs/207-DR-SOPS-11-advanced-tool-use.md) | Best practices for tool use |

---

## 2. Goals & Success Criteria

### 2.1 Primary Goals

1. **Skills System Architecture:** Implement Claude Code SKILL.md format with YAML frontmatter and natural language detection
2. **Core Skills Implementation:** Build database-design, api-integration, ui-component, and supabase-setup skills
3. **MCP Connector Enhancement:** Extend MCP support to all agents with improved status UI
4. **MCP Integrations:** Implement Exa, Firecrawl, GitHub Deep, Supabase Full, Context7, Sequential Thinking
5. **Integration Templates:** Create full-package templates for Stripe, SendGrid, Cloudinary
6. **Execution Visibility:** Provide complete AI reasoning trace to users

### 2.2 Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| Skill Detection Accuracy | Natural language intent detection | > 90% accuracy |
| Skill Execution Success | Skills complete without errors | > 95% success rate |
| MCP Connection Health | Server availability | > 99% uptime |
| User Satisfaction | Execution trace clarity | > 4.5/5 rating |
| Component Gallery Integration | Bidirectional sync works | 100% components accessible |
| Multi-Agent MCP | All agents can use MCP | Claude + verified agents |
| Template Completeness | Each template fully functional | 100% of 3 templates |

### 2.3 Non-Goals (Out of Scope)

- Custom skill authoring UI (future phase)
- Skill marketplace/sharing
- Real-time collaborative skill editing
- Skill versioning system
- Custom MCP server creation by users

---

## 3. Architecture Diagrams

### 3.1 Skills System Architecture

```
+------------------------------------------------------------------+
|                      USER INTERACTION LAYER                       |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+     +-------------------+                  |
|  |   User Prompt     |     |   Chat Interface  |                  |
|  |   (Natural Lang)  |     |   (Full Trace)    |                  |
|  +-------------------+     +-------------------+                  |
|           |                         ^                             |
|           v                         |                             |
+------------------------------------------------------------------+
|                      AI AGENT LAYER                               |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+     +-------------------+                  |
|  |   AI Agent        |     |   Skill Detector  |                  |
|  |   (Claude/Gemini) | --> |   (Intent Match)  |                  |
|  +-------------------+     +-------------------+                  |
|                                    |                              |
|                                    v                              |
+------------------------------------------------------------------+
|                      SKILLS FRAMEWORK                             |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+     +-------------------+                  |
|  |   Skill Registry  |     |   Skill Loader    |                  |
|  |   (User/Global)   | <-- |   (SKILL.md)      |                  |
|  +-------------------+     +-------------------+                  |
|           |                         |                             |
|           v                         v                             |
|  +-------------------+     +-------------------+                  |
|  |   Skill Executor  |     |   MCP Resolver    |                  |
|  |   (Run Logic)     | --> |   (Dependencies)  |                  |
|  +-------------------+     +-------------------+                  |
|           |                         |                             |
+-----------|-------------------------|-----------------------------+
            v                         v
+------------------------------------------------------------------+
|                      EXECUTION LAYER                              |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+     +-------------------+                  |
|  |   Execution Trace |     |   MCP Server      |                  |
|  |   (Full Visibility|     |   Manager         |                  |
|  +-------------------+     +-------------------+                  |
|           |                         |                             |
|           v                         v                             |
|  +-------------------+     +-------------------+                  |
|  |   Vercel Sandbox  |     |   External APIs   |                  |
|  |   (Code Exec)     |     |   (Exa, GitHub..) |                  |
|  +-------------------+     +-------------------+                  |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.2 MCP Server Architecture

```
+------------------------------------------------------------------+
|                        TURBOCAT PLATFORM                          |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+  +-------------------+  +-------------------+
|  |   Claude Agent    |  |   Gemini Agent    |  |   Codex Agent     |
|  |   (Native MCP)    |  |   (Verify MCP)    |  |   (Verify MCP)    |
|  +-------------------+  +-------------------+  +-------------------+
|           |                     |                     |           |
|           +---------------------+---------------------+           |
|                                 |                                 |
|                                 v                                 |
|  +-----------------------------------------------------------+   |
|  |                    MCP SERVER MANAGER                      |   |
|  |  +-------------+  +-------------+  +-------------+         |   |
|  |  | Connection  |  | Tool        |  | Rate Limit  |         |   |
|  |  | Health      |  | Registry    |  | Tracker     |         |   |
|  |  +-------------+  +-------------+  +-------------+         |   |
|  |  +-------------+  +-------------+  +-------------+         |   |
|  |  | Error       |  | Retry       |  | Status      |         |   |
|  |  | Handler     |  | Logic       |  | Reporter    |         |   |
|  |  +-------------+  +-------------+  +-------------+         |   |
|  +-----------------------------------------------------------+   |
|                                 |                                 |
|     +---------------------------+---------------------------+     |
|     |           |           |           |           |       |     |
|     v           v           v           v           v       v     |
|  +------+  +--------+  +--------+  +--------+  +-------+  +----+  |
|  | Exa  |  | Fire-  |  | GitHub |  |Supabase|  |Context|  |Seq.|  |
|  |Search|  | crawl  |  | Deep   |  | Full   |  |   7   |  |Think| |
|  +------+  +--------+  +--------+  +--------+  +-------+  +----+  |
|     |           |           |           |           |       |     |
|     v           v           v           v           v       v     |
|  +------+  +--------+  +--------+  +--------+  +-------+  +----+  |
|  | Web  |  | Web    |  | Repo   |  | DB +   |  | Code  |  |Multi| |
|  |Search|  | Scrape |  | + PR   |  | Auth   |  |Snippets| |Step |  |
|  +------+  +--------+  +--------+  +--------+  +-------+  +----+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.3 Skills + Component Gallery Integration

```
+------------------------------------------------------------------+
|                    UI COMPONENT SKILL FLOW                        |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+                    +-------------------+   |
|  |   User Request    |                    |   Component       |   |
|  |   "Create card    | -----------------> |   Gallery DB      |   |
|  |    component"     |                    |   (Phase 2)       |   |
|  +-------------------+                    +-------------------+   |
|           |                                       ^   |           |
|           v                                       |   v           |
|  +-------------------+                    +-------------------+   |
|  |   ui-component    |                    |   Existing        |   |
|  |   Skill Activated | -----------------> |   Components      |   |
|  +-------------------+      READS         |   (Reference)     |   |
|           |                               +-------------------+   |
|           |                                                       |
|           v                                                       |
|  +-------------------+                    +-------------------+   |
|  |   Design Token    |                    |   Generated       |   |
|  |   Validation      | -----------------> |   Component       |   |
|  +-------------------+                    +-------------------+   |
|           |                                       |               |
|           v                                       v               |
|  +-------------------+                    +-------------------+   |
|  |   Quality Check   |                    |   Component       |   |
|  |   (Accessibility) | -----------------> |   Gallery DB      |   |
|  +-------------------+      WRITES        |   (Contribution)  |   |
|                                           +-------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.4 Integration Template Structure

```
+------------------------------------------------------------------+
|                 INTEGRATION TEMPLATE PACKAGE                      |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+                                            |
|  |   SKILL.md        |  <-- Skill definition with triggers       |
|  |   (Definition)    |      YAML frontmatter + markdown body     |
|  +-------------------+                                            |
|           |                                                       |
|           v                                                       |
|  +-------------------+                                            |
|  |   Code Templates  |  <-- Pre-configured code snippets         |
|  |   (.tsx/.ts)      |      API clients, hooks, components       |
|  +-------------------+                                            |
|           |                                                       |
|           v                                                       |
|  +-------------------+                                            |
|  |   MCP Config      |  <-- Server connection settings           |
|  |   (mcp.json)      |      Credentials, endpoints, scopes       |
|  +-------------------+                                            |
|           |                                                       |
|           v                                                       |
|  +-------------------+                                            |
|  |   Environment     |  <-- Required env vars template           |
|  |   Template (.env) |      User must configure before use       |
|  +-------------------+                                            |
|                                                                   |
|  EXAMPLE: Stripe Integration Template                             |
|  +-------------------+  +-------------------+  +-------------------+
|  | stripe.skill.md   |  | stripe-client.ts  |  | stripe.mcp.json  |
|  | - Payment triggers|  | - Checkout API    |  | - API key config |
|  | - Webhook handling|  | - Webhook handler |  | - Endpoints      |
|  | - Invoice creation|  | - Invoice utils   |  | - Scopes         |
|  +-------------------+  +-------------------+  +-------------------+
|                                                                   |
+------------------------------------------------------------------+
```

### 3.5 Phase Dependencies

```
PHASE 1 (Complete)          PHASE 2 (Must Complete)         PHASE 3 (This Spec)
+------------------+        +---------------------+         +--------------------+
| Fork & Deploy    |        | Design System       |         | Skills & MCP       |
| Vercel Template  | -----> | Foundation          | -----> | Integration        |
|                  |        |                     |         |                    |
| - Deployed app   |        | - Design tokens     |         | - Skills system    |
| - Auth working   |        | - Storybook         |         | - MCP connectors   |
| - Sandbox ready  |        | - Component Gallery |         | - Integration      |
| - Multi-agent    |        | - Theme system      |         |   templates        |
+------------------+        +---------------------+         +--------------------+
                                    |
                                    v
                            +---------------------+
                            |  UI-COMPONENT SKILL |
                            |  DEPENDS ON:        |
                            |  - Component Gallery|
                            |  - Design Tokens    |
                            |  - Storybook        |
                            +---------------------+
```

### 3.6 Execution Trace Flow

```
+------------------------------------------------------------------+
|                     EXECUTION TRACE UI                            |
+------------------------------------------------------------------+
|                                                                   |
|  USER PROMPT: "Create a payment form with Stripe integration"    |
|  ----------------------------------------------------------------|
|                                                                   |
|  [1] INTENT DETECTION                                             |
|  +-----------------------------------------------------------+   |
|  | Detected Skills: ui-component, stripe-integration          |   |
|  | Confidence: 94%                                            |   |
|  | Reasoning: User mentioned "payment" + "form" + "Stripe"    |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [2] SKILL LOADING                                                |
|  +-----------------------------------------------------------+   |
|  | Loading: ui-component.skill.md                             |   |
|  | Loading: stripe-integration.skill.md                       |   |
|  | MCP Dependencies: supabase, context7                       |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [3] MCP CONNECTION                                               |
|  +-----------------------------------------------------------+   |
|  | Supabase: Connected (healthy)                              |   |
|  | Context7: Connected (healthy)                              |   |
|  | Stripe API: Checking credentials...                        |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [4] EXECUTION                                                    |
|  +-----------------------------------------------------------+   |
|  | Step 1: Fetching existing payment components from gallery  |   |
|  | Step 2: Applying design tokens for form styling            |   |
|  | Step 3: Generating Stripe checkout component               |   |
|  | Step 4: Creating webhook handler                           |   |
|  | Step 5: Writing files to sandbox                           |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [5] OUTPUT                                                       |
|  +-----------------------------------------------------------+   |
|  | Files created: 3                                           |   |
|  | - components/payment-form.tsx                              |   |
|  | - lib/stripe-client.ts                                     |   |
|  | - app/api/webhooks/stripe/route.ts                         |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 4. Skills System Specification

### 4.1 SKILL.md Format

Skills follow the Claude Code SKILL.md format with YAML frontmatter and markdown body.

#### 4.1.1 Frontmatter Schema

```yaml
---
# Required fields
name: string              # Display name (e.g., "Database Design")
description: |            # Multi-line description with trigger phrases
  When to use this skill...
  Trigger phrases include...

# Optional fields
version: string           # Semantic version (default: "1.0.0")
author: string            # Skill author
category: string          # Category for grouping
tags: string[]            # Searchable tags
scope: "user" | "global"  # Availability scope (default: "global")

# MCP Dependencies
mcp_dependencies:         # Required MCP servers
  - server: string        # Server name (e.g., "supabase")
    required: boolean     # Whether skill fails without it
    capabilities: string[] # Required capabilities

# Skill triggers
triggers:
  - pattern: string       # Regex or keyword pattern
    confidence: number    # 0-1 confidence threshold
    examples: string[]    # Example phrases
---
```

#### 4.1.2 Body Structure

```markdown
## Overview

Brief description of what this skill does.

## When to Use This Skill

- Bullet points describing activation scenarios
- Example user intents
- Common use cases

## How It Works

1. Step-by-step process
2. What the skill does
3. Expected outputs

## Prerequisites

- Required setup
- Environment variables
- External services

## Examples

### Example 1: [Scenario Name]

**User says:** "..."

**Skill does:**
- Action 1
- Action 2

**Output:**
```
Expected output format
```

## Limitations

- What this skill does NOT do
- Edge cases
- Known issues
```

### 4.2 Skill Registry

#### 4.2.1 Database Schema

```sql
-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0.0',
  category VARCHAR(100),
  tags TEXT[],
  scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('user', 'global')),
  content TEXT NOT NULL, -- Full SKILL.md content
  mcp_dependencies JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Skill executions log
CREATE TABLE skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id),
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  input_prompt TEXT,
  detected_confidence DECIMAL(3,2),
  execution_trace JSONB,
  status VARCHAR(50) CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_scope ON skills(scope);
CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_skill_executions_skill ON skill_executions(skill_id);
CREATE INDEX idx_skill_executions_user ON skill_executions(user_id);
```

#### 4.2.2 Skill Registration API

```typescript
// lib/skills/registry.ts

interface SkillDefinition {
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  scope: 'user' | 'global';
  content: string;
  mcpDependencies: MCPDependency[];
  triggers: SkillTrigger[];
}

interface MCPDependency {
  server: string;
  required: boolean;
  capabilities: string[];
}

interface SkillTrigger {
  pattern: string;
  confidence: number;
  examples: string[];
}

export class SkillRegistry {
  // Register a new skill
  async register(skill: SkillDefinition): Promise<string>;

  // Update existing skill
  async update(slug: string, skill: Partial<SkillDefinition>): Promise<void>;

  // Get skill by slug
  async get(slug: string): Promise<SkillDefinition | null>;

  // List all skills (optionally filtered)
  async list(options?: {
    category?: string;
    scope?: 'user' | 'global';
    active?: boolean;
  }): Promise<SkillDefinition[]>;

  // Detect applicable skills from user prompt
  async detect(prompt: string): Promise<{
    skill: SkillDefinition;
    confidence: number;
    matchedTrigger: string;
  }[]>;

  // Deactivate skill
  async deactivate(slug: string): Promise<void>;
}
```

### 4.3 Skill Detection System

#### 4.3.1 Natural Language Intent Detection

```typescript
// lib/skills/detector.ts

interface DetectionResult {
  skill: SkillDefinition;
  confidence: number;
  matchedTrigger: SkillTrigger;
  reasoning: string;
}

export class SkillDetector {
  private registry: SkillRegistry;
  private minConfidence = 0.7; // 70% minimum confidence

  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }

  /**
   * Detect skills from user prompt using multiple strategies:
   * 1. Keyword matching from trigger patterns
   * 2. Semantic similarity (embeddings)
   * 3. LLM-based intent classification
   */
  async detect(prompt: string): Promise<DetectionResult[]> {
    const allSkills = await this.registry.list({ active: true });
    const results: DetectionResult[] = [];

    for (const skill of allSkills) {
      for (const trigger of skill.triggers) {
        const keywordScore = this.matchKeywords(prompt, trigger.pattern);
        const exampleScore = this.matchExamples(prompt, trigger.examples);

        // Weighted average
        const confidence = (keywordScore * 0.6) + (exampleScore * 0.4);

        if (confidence >= trigger.confidence && confidence >= this.minConfidence) {
          results.push({
            skill,
            confidence,
            matchedTrigger: trigger,
            reasoning: this.generateReasoning(prompt, skill, trigger),
          });
        }
      }
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private matchKeywords(prompt: string, pattern: string): number {
    const regex = new RegExp(pattern, 'gi');
    const matches = prompt.match(regex);
    return matches ? Math.min(matches.length * 0.3, 1) : 0;
  }

  private matchExamples(prompt: string, examples: string[]): number {
    // Simple overlap scoring
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
    let maxScore = 0;

    for (const example of examples) {
      const exampleWords = example.toLowerCase().split(/\s+/);
      const overlap = exampleWords.filter(w => promptWords.has(w)).length;
      const score = overlap / exampleWords.length;
      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  private generateReasoning(
    prompt: string,
    skill: SkillDefinition,
    trigger: SkillTrigger
  ): string {
    return `Detected "${skill.name}" skill based on trigger pattern "${trigger.pattern}" ` +
           `matching user prompt keywords. Confidence: ${trigger.confidence * 100}%`;
  }
}
```

### 4.4 Skill Executor

```typescript
// lib/skills/executor.ts

interface ExecutionContext {
  userId: string;
  taskId: string;
  prompt: string;
  skill: SkillDefinition;
  mcpConnections: Map<string, MCPConnection>;
  sandbox: SandboxInstance;
}

interface ExecutionTrace {
  steps: ExecutionStep[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

interface ExecutionStep {
  id: string;
  type: 'detection' | 'loading' | 'mcp_connect' | 'execution' | 'output';
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  details?: Record<string, unknown>;
}

export class SkillExecutor {
  private trace: ExecutionTrace;

  async execute(context: ExecutionContext): Promise<ExecutionTrace> {
    this.trace = {
      steps: [],
      startTime: new Date(),
      status: 'running',
    };

    try {
      // Step 1: Verify MCP dependencies
      await this.verifyMCPDependencies(context);

      // Step 2: Parse skill content
      const skillInstructions = await this.parseSkillContent(context.skill);

      // Step 3: Execute skill logic via AI agent
      await this.executeSkillLogic(context, skillInstructions);

      // Step 4: Write outputs
      await this.writeOutputs(context);

      this.trace.status = 'completed';
    } catch (error) {
      this.trace.status = 'failed';
      this.trace.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.trace.endTime = new Date();
    }

    // Log execution
    await this.logExecution(context);

    return this.trace;
  }

  private addStep(step: Omit<ExecutionStep, 'id' | 'startTime'>): ExecutionStep {
    const fullStep: ExecutionStep = {
      ...step,
      id: crypto.randomUUID(),
      startTime: new Date(),
    };
    this.trace.steps.push(fullStep);
    return fullStep;
  }

  private async verifyMCPDependencies(context: ExecutionContext): Promise<void> {
    const step = this.addStep({
      type: 'mcp_connect',
      name: 'MCP Dependencies',
      description: 'Verifying MCP server connections',
      status: 'running',
    });

    for (const dep of context.skill.mcpDependencies) {
      const connection = context.mcpConnections.get(dep.server);

      if (!connection && dep.required) {
        throw new Error(`Required MCP server "${dep.server}" not connected`);
      }

      if (connection) {
        const health = await connection.healthCheck();
        step.details = { ...step.details, [dep.server]: health };
      }
    }

    step.status = 'completed';
    step.endTime = new Date();
  }

  private async parseSkillContent(skill: SkillDefinition): Promise<string> {
    const step = this.addStep({
      type: 'loading',
      name: 'Skill Loading',
      description: `Loading ${skill.name} skill content`,
      status: 'running',
    });

    // Parse SKILL.md content
    const { content } = skill;

    step.status = 'completed';
    step.endTime = new Date();
    step.details = { skillVersion: skill.version };

    return content;
  }

  private async executeSkillLogic(
    context: ExecutionContext,
    instructions: string
  ): Promise<void> {
    const step = this.addStep({
      type: 'execution',
      name: 'Skill Execution',
      description: 'Executing skill logic with AI agent',
      status: 'running',
    });

    // Inject skill instructions into AI agent context
    // Execute via sandbox
    // This is where the actual AI execution happens

    step.status = 'completed';
    step.endTime = new Date();
  }

  private async writeOutputs(context: ExecutionContext): Promise<void> {
    const step = this.addStep({
      type: 'output',
      name: 'Output Generation',
      description: 'Writing generated files',
      status: 'running',
    });

    // Write files to sandbox
    // Update Component Gallery if applicable

    step.status = 'completed';
    step.endTime = new Date();
  }

  private async logExecution(context: ExecutionContext): Promise<void> {
    // Log to skill_executions table
  }
}
```

---

## 5. MCP Integration Specifications

### 5.1 MCP Server Manager

```typescript
// lib/mcp/manager.ts

interface MCPServerConfig {
  name: string;
  type: 'stdio' | 'http' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  capabilities: MCPCapability[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

interface MCPCapability {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

interface MCPConnectionStatus {
  server: string;
  status: 'connected' | 'disconnected' | 'error' | 'rate_limited';
  lastHealthCheck: Date;
  errorMessage?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

export class MCPServerManager {
  private connections: Map<string, MCPConnection>;
  private configs: Map<string, MCPServerConfig>;

  constructor() {
    this.connections = new Map();
    this.configs = new Map();
  }

  // Register server configuration
  registerServer(config: MCPServerConfig): void {
    this.configs.set(config.name, config);
  }

  // Connect to server
  async connect(serverName: string): Promise<MCPConnection> {
    const config = this.configs.get(serverName);
    if (!config) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    const connection = await this.createConnection(config);
    this.connections.set(serverName, connection);
    return connection;
  }

  // Get connection status for all servers
  async getStatus(): Promise<MCPConnectionStatus[]> {
    const statuses: MCPConnectionStatus[] = [];

    for (const [name, connection] of this.connections) {
      try {
        const health = await connection.healthCheck();
        statuses.push({
          server: name,
          status: health.healthy ? 'connected' : 'error',
          lastHealthCheck: new Date(),
          rateLimitRemaining: health.rateLimit?.remaining,
          rateLimitReset: health.rateLimit?.reset,
        });
      } catch (error) {
        statuses.push({
          server: name,
          status: 'error',
          lastHealthCheck: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return statuses;
  }

  // Disconnect from server
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    if (connection) {
      await connection.close();
      this.connections.delete(serverName);
    }
  }

  // Get available tools from connected servers
  async getAvailableTools(): Promise<Map<string, MCPCapability[]>> {
    const tools = new Map<string, MCPCapability[]>();

    for (const [name, config] of this.configs) {
      tools.set(name, config.capabilities);
    }

    return tools;
  }
}
```

### 5.2 Individual MCP Server Specifications

#### 5.2.1 Exa Search Integration

| Field | Value |
|-------|-------|
| Server Name | `exa` |
| Purpose | Web search for documentation and examples |
| Effort | S (2-3 days) |
| Documentation | https://docs.exa.ai/reference/exa-mcp |

**Configuration:**
```json
{
  "name": "exa",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic-ai/exa-mcp-server"],
  "env": {
    "EXA_API_KEY": "${EXA_API_KEY}"
  },
  "capabilities": [
    {
      "name": "search",
      "description": "Search the web for relevant content",
      "parameters": {
        "query": "string",
        "numResults": "number",
        "type": "neural | keyword | auto"
      }
    },
    {
      "name": "findSimilar",
      "description": "Find pages similar to a given URL",
      "parameters": {
        "url": "string",
        "numResults": "number"
      }
    },
    {
      "name": "getContents",
      "description": "Get full contents of URLs",
      "parameters": {
        "urls": "string[]"
      }
    }
  ],
  "rateLimit": {
    "requests": 100,
    "windowMs": 60000
  }
}
```

**Use Cases:**
- Search documentation for libraries
- Find code examples and patterns
- Research best practices
- Find similar implementations

#### 5.2.2 Firecrawl Scraping Integration

| Field | Value |
|-------|-------|
| Server Name | `firecrawl` |
| Purpose | Website analysis for design inspiration and content extraction |
| Effort | S (2-3 days) |
| Documentation | https://docs.firecrawl.dev/mcp-server |

**Configuration:**
```json
{
  "name": "firecrawl",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "firecrawl-mcp"],
  "env": {
    "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
  },
  "capabilities": [
    {
      "name": "scrape",
      "description": "Scrape a single URL and extract content",
      "parameters": {
        "url": "string",
        "formats": "markdown | html | rawHtml | screenshot"
      }
    },
    {
      "name": "crawl",
      "description": "Crawl a website and extract multiple pages",
      "parameters": {
        "url": "string",
        "maxDepth": "number",
        "limit": "number"
      }
    },
    {
      "name": "map",
      "description": "Get sitemap of a website",
      "parameters": {
        "url": "string"
      }
    }
  ],
  "rateLimit": {
    "requests": 50,
    "windowMs": 60000
  }
}
```

**Use Cases:**
- Analyze competitor websites for design inspiration
- Extract content structure from existing sites
- Get screenshots for visual reference
- Map site architecture

#### 5.2.3 GitHub Deep Integration

| Field | Value |
|-------|-------|
| Server Name | `github` |
| Purpose | Repository analysis, issue tracking, PR workflows |
| Effort | M (1 week) |
| Documentation | https://github.com/modelcontextprotocol/servers/tree/main/src/github |

**Configuration:**
```json
{
  "name": "github",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic-ai/github-mcp-server"],
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  },
  "capabilities": [
    {
      "name": "searchRepositories",
      "description": "Search GitHub repositories",
      "parameters": {
        "query": "string",
        "sort": "stars | forks | updated"
      }
    },
    {
      "name": "getRepository",
      "description": "Get repository details",
      "parameters": {
        "owner": "string",
        "repo": "string"
      }
    },
    {
      "name": "getFileContents",
      "description": "Read file from repository",
      "parameters": {
        "owner": "string",
        "repo": "string",
        "path": "string",
        "branch": "string"
      }
    },
    {
      "name": "createIssue",
      "description": "Create a new issue",
      "parameters": {
        "owner": "string",
        "repo": "string",
        "title": "string",
        "body": "string",
        "labels": "string[]"
      }
    },
    {
      "name": "createPullRequest",
      "description": "Create a pull request",
      "parameters": {
        "owner": "string",
        "repo": "string",
        "title": "string",
        "body": "string",
        "head": "string",
        "base": "string"
      }
    },
    {
      "name": "listPullRequests",
      "description": "List pull requests",
      "parameters": {
        "owner": "string",
        "repo": "string",
        "state": "open | closed | all"
      }
    },
    {
      "name": "searchCode",
      "description": "Search code in repositories",
      "parameters": {
        "query": "string",
        "language": "string"
      }
    }
  ],
  "rateLimit": {
    "requests": 5000,
    "windowMs": 3600000
  }
}
```

**Use Cases:**
- Clone and analyze repository structure
- Search for code patterns and implementations
- Create issues for tracking work
- Create PRs with AI-generated changes
- Find relevant libraries and packages

#### 5.2.4 Supabase Full Integration

| Field | Value |
|-------|-------|
| Server Name | `supabase` |
| Purpose | Database + Auth + Realtime + Storage |
| Effort | M (1 week) |
| Documentation | https://github.com/supabase/mcp-server-supabase |

**Configuration:**
```json
{
  "name": "supabase",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase"],
  "env": {
    "SUPABASE_URL": "${SUPABASE_URL}",
    "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
  },
  "capabilities": [
    {
      "name": "executeSQL",
      "description": "Execute SQL queries",
      "parameters": {
        "query": "string"
      }
    },
    {
      "name": "getTableSchema",
      "description": "Get schema for a table",
      "parameters": {
        "table": "string"
      }
    },
    {
      "name": "listTables",
      "description": "List all tables in database",
      "parameters": {}
    },
    {
      "name": "createTable",
      "description": "Create a new table",
      "parameters": {
        "name": "string",
        "columns": "ColumnDefinition[]"
      }
    },
    {
      "name": "configureAuth",
      "description": "Configure authentication settings",
      "parameters": {
        "providers": "AuthProvider[]"
      }
    },
    {
      "name": "createBucket",
      "description": "Create storage bucket",
      "parameters": {
        "name": "string",
        "public": "boolean"
      }
    },
    {
      "name": "uploadFile",
      "description": "Upload file to storage",
      "parameters": {
        "bucket": "string",
        "path": "string",
        "file": "Buffer"
      }
    },
    {
      "name": "enableRealtime",
      "description": "Enable realtime for tables",
      "parameters": {
        "tables": "string[]"
      }
    }
  ],
  "rateLimit": {
    "requests": 1000,
    "windowMs": 60000
  }
}
```

**Use Cases:**
- Create and manage database schemas
- Execute SQL queries and migrations
- Configure authentication providers
- Set up storage buckets
- Enable realtime subscriptions

#### 5.2.5 Context7 Integration

| Field | Value |
|-------|-------|
| Server Name | `context7` |
| Purpose | Code snippets and context management |
| Effort | S (2-3 days) |
| Documentation | https://context7.dev/docs |

**Configuration:**
```json
{
  "name": "context7",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@context7/mcp-server"],
  "env": {
    "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
  },
  "capabilities": [
    {
      "name": "resolveLibrary",
      "description": "Resolve library to Context7 ID",
      "parameters": {
        "libraryName": "string",
        "query": "string"
      }
    },
    {
      "name": "queryDocs",
      "description": "Query documentation for a library",
      "parameters": {
        "libraryId": "string",
        "query": "string"
      }
    },
    {
      "name": "getCodeSnippets",
      "description": "Get code snippets for a topic",
      "parameters": {
        "libraryId": "string",
        "topic": "string",
        "limit": "number"
      }
    }
  ],
  "rateLimit": {
    "requests": 100,
    "windowMs": 60000
  }
}
```

**Use Cases:**
- Look up library documentation
- Find code snippets and examples
- Get API references
- Research implementation patterns

#### 5.2.6 Sequential Thinking Integration

| Field | Value |
|-------|-------|
| Server Name | `sequential-thinking` |
| Purpose | Multi-step reasoning and planning |
| Effort | S (2-3 days) |
| Documentation | https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking |

**Configuration:**
```json
{
  "name": "sequential-thinking",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@anthropic-ai/sequential-thinking-mcp-server"],
  "env": {},
  "capabilities": [
    {
      "name": "sequentialThinking",
      "description": "Dynamic problem-solving through sequential thought steps",
      "parameters": {
        "thought": "string",
        "thoughtNumber": "number",
        "totalThoughts": "number",
        "nextThoughtNeeded": "boolean",
        "isRevision": "boolean",
        "revisesThought": "number",
        "branchFromThought": "number",
        "branchId": "string",
        "needsMoreThoughts": "boolean"
      }
    }
  ],
  "rateLimit": {
    "requests": 1000,
    "windowMs": 60000
  }
}
```

**Use Cases:**
- Break down complex problems
- Planning and design with revision
- Analysis requiring course correction
- Multi-step solutions with context
- Filter irrelevant information
- Generate and verify hypotheses

### 5.3 Multi-Agent MCP Support

#### 5.3.1 Agent MCP Compatibility Matrix

| Agent | Native MCP | Verified | Notes |
|-------|-----------|----------|-------|
| Claude Code | Yes | Yes | Full support, reference implementation |
| Google Gemini CLI | TBD | Pending | Verify latest documentation |
| OpenAI Codex CLI | TBD | Pending | Verify latest documentation |
| Cursor CLI | Partial | Pending | Check MCP adapter availability |
| GitHub Copilot CLI | TBD | Pending | Verify latest documentation |

#### 5.3.2 Verification Steps

Before Phase 3 implementation, verify MCP support for each agent:

1. **Gemini CLI:**
   - Check Google AI documentation for MCP support
   - Test with simple MCP server connection
   - Document any adapter requirements

2. **Codex CLI:**
   - Review OpenAI documentation for MCP
   - Test tool calling with MCP servers
   - Document limitations

3. **Cursor CLI:**
   - Check Cursor documentation
   - Test MCP integration
   - Document configuration requirements

---

## 6. Core Skills Detailed Specs

### 6.1 database-design Skill

#### 6.1.1 Skill Definition

```yaml
---
name: Database Design
description: |
  Generate Drizzle ORM schemas, migrations, and seed data based on natural
  language descriptions. Use this skill when users describe data models,
  relationships, or database requirements.

  Trigger phrases include:
  - "create a database schema"
  - "design tables for"
  - "I need a data model"
  - "set up my database"
  - "create entities"
  - "define relationships between"

version: "1.0.0"
author: "Turbocat"
category: "backend"
tags: ["database", "drizzle", "orm", "schema", "migrations"]
scope: "global"

mcp_dependencies:
  - server: "supabase"
    required: false
    capabilities: ["getTableSchema", "listTables"]
  - server: "context7"
    required: false
    capabilities: ["queryDocs"]

triggers:
  - pattern: "database|schema|table|entity|model|migration"
    confidence: 0.7
    examples:
      - "Create a database schema for a blog"
      - "I need tables for users and posts"
      - "Design a data model for e-commerce"
      - "Set up the database for my app"
---

## Overview

The database-design skill generates complete Drizzle ORM schemas based on
natural language descriptions of data requirements.

## When to Use This Skill

- User describes data models or entities
- User asks about database structure
- User wants to create or modify tables
- User describes relationships between data

## How It Works

1. Parse user's natural language description
2. Identify entities and their attributes
3. Determine relationships (one-to-one, one-to-many, many-to-many)
4. Generate Drizzle ORM schema files
5. Create migration files
6. Optionally generate seed data

## Prerequisites

- Drizzle ORM installed in project
- PostgreSQL database configured (Neon recommended)
- POSTGRES_URL environment variable set

## Examples

### Example 1: Blog Schema

**User says:** "Create a database schema for a blog with users, posts, and comments"

**Skill generates:**
- `db/schema/users.ts`
- `db/schema/posts.ts`
- `db/schema/comments.ts`
- `db/schema/index.ts`
- `db/migrations/0001_create_blog_tables.sql`

## Limitations

- Only generates PostgreSQL-compatible schemas
- Requires Drizzle ORM (not Prisma)
- Does not handle complex graph relationships
- Limited to common data types
```

#### 6.1.2 Generated Output Structure

```typescript
// db/schema/users.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 6.2 api-integration Skill

#### 6.2.1 Skill Definition

```yaml
---
name: API Integration
description: |
  Scaffold REST and GraphQL API endpoints with proper patterns, validation,
  and error handling. Use this skill when users need to create API routes
  or integrate with external services.

  Trigger phrases include:
  - "create an API endpoint"
  - "add a route for"
  - "build a REST API"
  - "integrate with [service]"
  - "fetch data from"
  - "make API calls to"

version: "1.0.0"
author: "Turbocat"
category: "backend"
tags: ["api", "rest", "graphql", "routes", "endpoints"]
scope: "global"

mcp_dependencies:
  - server: "context7"
    required: false
    capabilities: ["queryDocs", "getCodeSnippets"]
  - server: "exa"
    required: false
    capabilities: ["search"]

triggers:
  - pattern: "api|endpoint|route|fetch|request|rest|graphql"
    confidence: 0.7
    examples:
      - "Create an API endpoint for users"
      - "Add a POST route for creating orders"
      - "Build REST APIs for my data models"
      - "Integrate with the Stripe API"
---

## Overview

The api-integration skill generates API routes and integration code following
best practices for error handling, validation, and type safety.

## When to Use This Skill

- User wants to create API endpoints
- User needs to integrate external APIs
- User asks for route handlers
- User describes API requirements

## How It Works

1. Analyze user requirements
2. Determine HTTP methods and routes
3. Generate route handlers with Next.js App Router
4. Add validation with Zod schemas
5. Implement error handling
6. Create TypeScript types

## Output Structure

For a "create user API endpoint" request:

- `app/api/users/route.ts` - GET/POST handlers
- `app/api/users/[id]/route.ts` - GET/PUT/DELETE handlers
- `lib/validations/user.ts` - Zod schemas
- `lib/api/errors.ts` - Error handling utilities
```

### 6.3 ui-component Skill

#### 6.3.1 Skill Definition

```yaml
---
name: UI Component
description: |
  Generate design-aware UI components that integrate with the Phase 2
  Component Gallery. This skill reads existing components for reference
  and can contribute new components back to the gallery.

  Trigger phrases include:
  - "create a component for"
  - "build a [type] component"
  - "I need a UI for"
  - "design a card/form/button/etc"
  - "make a [component]"

version: "1.0.0"
author: "Turbocat"
category: "frontend"
tags: ["ui", "components", "react", "shadcn", "tailwind"]
scope: "global"

mcp_dependencies:
  - server: "context7"
    required: false
    capabilities: ["queryDocs"]

triggers:
  - pattern: "component|card|form|button|modal|dialog|table|list|nav"
    confidence: 0.7
    examples:
      - "Create a pricing card component"
      - "Build a contact form"
      - "I need a user profile card"
      - "Design a product listing grid"
---

## Overview

The ui-component skill generates React components using shadcn/ui primitives,
Tailwind CSS styling with design tokens, and TypeScript types.

## Bidirectional Component Gallery Integration

### Reading from Gallery

1. Query Component Gallery database for similar components
2. Reference existing patterns and styles
3. Maintain consistency with established components

### Contributing to Gallery

1. Generated components are validated for quality
2. Pass accessibility checks
3. Use design tokens correctly
4. Automatically added to Component Gallery (optional)

## Design Token Enforcement

All generated components MUST:
- Use design tokens from `lib/design-tokens.ts`
- Apply orange-500 for primary actions
- Use blue-500 for links and secondary actions
- Follow dark-first theme approach
- Meet WCAG AA contrast requirements

## How It Works

1. Parse component requirements
2. Check Component Gallery for similar components
3. Generate component with shadcn/ui + Tailwind
4. Validate against design tokens
5. Run accessibility checks
6. Optionally add to Component Gallery

## Example Output

```tsx
// components/ui/pricing-card.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  popular?: boolean;
  onSelect: () => void;
}

export function PricingCard({ title, price, features, popular, onSelect }: PricingCardProps) {
  return (
    <Card className={popular ? 'border-orange-500 shadow-glow-orange' : ''}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <p className="text-3xl font-bold text-orange-500">{price}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success-500" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onSelect} className="w-full">
          Select Plan
        </Button>
      </CardFooter>
    </Card>
  );
}
```
```

### 6.4 supabase-setup Skill

#### 6.4.1 Skill Definition

```yaml
---
name: Supabase Setup
description: |
  Configure and provision Supabase services including database, authentication,
  real-time subscriptions, and storage buckets. This skill helps users set up
  a complete Supabase backend.

  Trigger phrases include:
  - "set up Supabase"
  - "configure authentication"
  - "create a storage bucket"
  - "enable realtime"
  - "add Supabase to my project"
  - "connect to Supabase"

version: "1.0.0"
author: "Turbocat"
category: "backend"
tags: ["supabase", "auth", "database", "storage", "realtime"]
scope: "global"

mcp_dependencies:
  - server: "supabase"
    required: true
    capabilities: ["executeSQL", "configureAuth", "createBucket", "enableRealtime"]

triggers:
  - pattern: "supabase|auth(?:entication)?|storage|bucket|realtime|subscription"
    confidence: 0.8
    examples:
      - "Set up Supabase for my project"
      - "Configure Google and GitHub login"
      - "Create a storage bucket for images"
      - "Enable realtime on my tables"
---

## Overview

The supabase-setup skill provides guided configuration for Supabase services.

## Prerequisites

- Supabase project created
- Environment variables configured:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

## Capabilities

### Database Provisioning
- Create tables with proper types
- Set up Row Level Security (RLS)
- Create database functions and triggers
- Configure foreign key relationships

### Authentication Configuration
- Enable auth providers (Google, GitHub, Email)
- Configure redirect URLs
- Set up email templates
- Create auth policies

### Storage Buckets
- Create public/private buckets
- Configure access policies
- Set up file size limits
- Enable CDN caching

### Realtime Subscriptions
- Enable realtime on tables
- Configure broadcast channels
- Set up presence tracking

## How It Works

1. Verify Supabase MCP connection
2. Parse user requirements
3. Execute Supabase operations via MCP
4. Generate client-side integration code
5. Create environment variable templates

## Example: Full Setup

**User says:** "Set up Supabase with user auth and a posts table with realtime"

**Skill generates:**

1. Database schema with users and posts tables
2. RLS policies for data access
3. OAuth configuration for GitHub/Google
4. Realtime enabled on posts table
5. Client code in `lib/supabase/client.ts`
6. Server code in `lib/supabase/server.ts`
7. Type definitions in `types/supabase.ts`
```

---

## 7. Integration Templates Specs

### 7.1 Template Structure

Each integration template is a complete package containing:

```
templates/[service-name]/
├── [service].skill.md      # Skill definition
├── code/
│   ├── client.ts           # API client
│   ├── hooks.ts            # React hooks
│   ├── types.ts            # TypeScript types
│   └── components/         # UI components
├── mcp/
│   └── config.json         # MCP configuration
├── env/
│   └── .env.template       # Required environment variables
└── docs/
    └── README.md           # Usage documentation
```

### 7.2 Stripe Payments Template

#### 7.2.1 Skill Definition

```yaml
---
name: Stripe Integration
description: |
  Complete Stripe payments integration including checkout, subscriptions,
  and webhook handling. Use this skill for payment-related features.

  Trigger phrases include:
  - "add Stripe payments"
  - "create checkout"
  - "subscription billing"
  - "payment form"
  - "accept payments"
  - "Stripe webhook"

version: "1.0.0"
author: "Turbocat"
category: "integrations"
tags: ["stripe", "payments", "checkout", "subscriptions", "billing"]
scope: "global"

mcp_dependencies:
  - server: "context7"
    required: false
    capabilities: ["queryDocs"]

triggers:
  - pattern: "stripe|payment|checkout|subscription|billing|invoice"
    confidence: 0.8
    examples:
      - "Add Stripe payments to my app"
      - "Create a checkout page"
      - "Set up subscription billing"
      - "Handle Stripe webhooks"
---
```

#### 7.2.2 Code Templates

```typescript
// templates/stripe/code/client.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// templates/stripe/code/hooks.ts
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToCheckout = async (priceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return { redirectToCheckout, loading, error };
}

// templates/stripe/code/components/checkout-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useStripeCheckout } from '../hooks';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  priceId: string;
  children: React.ReactNode;
}

export function CheckoutButton({ priceId, children }: CheckoutButtonProps) {
  const { redirectToCheckout, loading, error } = useStripeCheckout();

  return (
    <div>
      <Button
        onClick={() => redirectToCheckout(priceId)}
        disabled={loading}
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {children}
      </Button>
      {error && <p className="text-error-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

#### 7.2.3 Environment Template

```bash
# templates/stripe/env/.env.template

# Stripe API Keys
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret
# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# Product/Price IDs (optional, for reference)
# STRIPE_PRICE_BASIC=price_...
# STRIPE_PRICE_PRO=price_...
```

### 7.3 SendGrid Email Template

#### 7.3.1 Skill Definition

```yaml
---
name: SendGrid Email
description: |
  SendGrid email integration for transactional emails, templates, and
  marketing campaigns. Use this skill for email functionality.

  Trigger phrases include:
  - "send emails"
  - "email notifications"
  - "SendGrid integration"
  - "email template"
  - "transactional email"

version: "1.0.0"
author: "Turbocat"
category: "integrations"
tags: ["sendgrid", "email", "notifications", "templates"]
scope: "global"

triggers:
  - pattern: "email|sendgrid|notification|newsletter|mail"
    confidence: 0.8
    examples:
      - "Send welcome emails to new users"
      - "Set up email notifications"
      - "Add SendGrid to my project"
---
```

#### 7.3.2 Code Templates

```typescript
// templates/sendgrid/code/client.ts
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = process.env.SENDGRID_FROM_EMAIL!;

  await sgMail.send({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    templateId: options.templateId,
    dynamicTemplateData: options.dynamicTemplateData,
  });
}

// templates/sendgrid/code/templates/welcome.ts
import { sendEmail } from '../client';

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to Turbocat!',
    templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
    dynamicTemplateData: {
      name,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    },
  });
}
```

### 7.4 Cloudinary Media Template

#### 7.4.1 Skill Definition

```yaml
---
name: Cloudinary Media
description: |
  Cloudinary integration for image and video upload, transformation, and
  optimization. Use this skill for media handling features.

  Trigger phrases include:
  - "upload images"
  - "image optimization"
  - "Cloudinary integration"
  - "media storage"
  - "video upload"

version: "1.0.0"
author: "Turbocat"
category: "integrations"
tags: ["cloudinary", "images", "media", "upload", "cdn"]
scope: "global"

triggers:
  - pattern: "cloudinary|image|upload|media|video|cdn|optimize"
    confidence: 0.8
    examples:
      - "Add image upload functionality"
      - "Optimize images with Cloudinary"
      - "Set up media storage"
---
```

#### 7.4.2 Code Templates

```typescript
// templates/cloudinary/code/client.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  };
}

export async function uploadImage(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'turbocat',
        transformation: options.transformation,
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error('Upload failed'));
      }
    );

    if (typeof file === 'string') {
      uploadStream.end(Buffer.from(file, 'base64'));
    } else {
      uploadStream.end(file);
    }
  });
}

export function getOptimizedUrl(publicId: string, options: UploadOptions = {}): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options.transformation,
  });
}

// templates/cloudinary/code/hooks.ts
import { useState } from 'react';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      setImageUrl(url);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error, imageUrl };
}
```

---

## 8. UI/UX Requirements

### 8.1 Skills Management UI

#### 8.1.1 Skills Dashboard

```
+------------------------------------------------------------------+
|                      SKILLS DASHBOARD                             |
+------------------------------------------------------------------+
|  [+ Add Skill]  [Refresh]                    [Search skills...]  |
+------------------------------------------------------------------+
|                                                                   |
|  ACTIVE SKILLS (12)                                               |
|  +-----------------------------------------------------------+   |
|  |  [database-design]  [api-integration]  [ui-component]     |   |
|  |  [supabase-setup]   [stripe-payments]  [sendgrid-email]   |   |
|  |  [cloudinary-media] [...]              [...]              |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  SKILL DETAILS: database-design                                   |
|  +-----------------------------------------------------------+   |
|  |  Name: Database Design                                     |   |
|  |  Version: 1.0.0                                           |   |
|  |  Category: backend                                        |   |
|  |  Scope: global                                            |   |
|  |                                                           |   |
|  |  MCP Dependencies:                                        |   |
|  |  - supabase (optional)                                    |   |
|  |  - context7 (optional)                                    |   |
|  |                                                           |   |
|  |  Usage: 127 executions | 94% success rate                 |   |
|  |                                                           |   |
|  |  [View SKILL.md]  [Deactivate]  [View Logs]               |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
```

### 8.2 MCP Connection Status UI

#### 8.2.1 MCP Server Panel

```
+------------------------------------------------------------------+
|                    MCP SERVER STATUS                              |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------+  +---------------+  +---------------+          |
|  | Exa Search    |  | Firecrawl     |  | GitHub        |          |
|  | [Connected]   |  | [Connected]   |  | [Connected]   |          |
|  | 87 req/min    |  | 23 req/min    |  | 4,892 req/hr  |          |
|  | Healthy       |  | Healthy       |  | Healthy       |          |
|  +---------------+  +---------------+  +---------------+          |
|                                                                   |
|  +---------------+  +---------------+  +---------------+          |
|  | Supabase      |  | Context7      |  | Seq Thinking  |          |
|  | [Disconnected]|  | [Connected]   |  | [Connected]   |          |
|  | Configure -->  |  | 45 req/min    |  | N/A           |          |
|  | Missing keys  |  | Healthy       |  | Healthy       |          |
|  +---------------+  +---------------+  +---------------+          |
|                                                                   |
|  [Refresh All]  [View Logs]  [Configure]                         |
|                                                                   |
+------------------------------------------------------------------+
```

#### 8.2.2 Connection Health Indicators

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| Connected | Check circle | success-500 | Server responding normally |
| Disconnected | X circle | error-500 | No connection |
| Rate Limited | Clock | warning-500 | Approaching rate limit |
| Error | Alert triangle | error-500 | Error state |
| Configuring | Loader | blue-500 | In progress |

### 8.3 Execution Trace UI

#### 8.3.1 Trace Panel Design

```
+------------------------------------------------------------------+
|                    EXECUTION TRACE                                |
+------------------------------------------------------------------+
|  Task: "Create a payment form with Stripe"                       |
|  Started: 2026-01-03 14:32:15 | Duration: 12.4s                  |
+------------------------------------------------------------------+
|                                                                   |
|  [1/5] INTENT DETECTION                              [Completed] |
|  +-----------------------------------------------------------+   |
|  |  Detected: stripe-integration, ui-component                |   |
|  |  Confidence: 94%                                           |   |
|  |  Show reasoning... v                                       |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [2/5] SKILL LOADING                                 [Completed] |
|  +-----------------------------------------------------------+   |
|  |  Loaded: stripe-integration.skill.md                       |   |
|  |  Loaded: ui-component.skill.md                             |   |
|  |  Dependencies: supabase, context7                          |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [3/5] MCP CONNECTION                                [Completed] |
|  +-----------------------------------------------------------+   |
|  |  Supabase: Connected                                       |   |
|  |  Context7: Connected                                       |   |
|  |  Stripe API: Verified                                      |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [4/5] EXECUTION                                      [Running] |
|  +-----------------------------------------------------------+   |
|  |  Step 1: Fetching existing payment components        [Done] |   |
|  |  Step 2: Applying design tokens                      [Done] |   |
|  |  Step 3: Generating Stripe checkout component    [Running] |   |
|  |  Step 4: Creating webhook handler                [Pending] |   |
|  |  Step 5: Writing files to sandbox                [Pending] |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [5/5] OUTPUT                                         [Pending] |
|  +-----------------------------------------------------------+   |
|  |  Awaiting execution completion...                          |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  [Cancel Execution]  [View Raw Logs]                             |
|                                                                   |
+------------------------------------------------------------------+
```

### 8.4 Responsive Design Requirements

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (< 640px) | Stack vertically | Collapsible trace steps |
| Tablet (640-1024px) | Two columns | Side panel for details |
| Desktop (> 1024px) | Full layout | All panels visible |

### 8.5 Accessibility Requirements

- All status indicators have text labels
- Keyboard navigation for all interactive elements
- Screen reader announcements for status changes
- Focus management in trace panel
- Color contrast meets WCAG AA

---

## 9. Testing Requirements

### 9.1 Unit Tests

#### 9.1.1 Skills System Tests

```typescript
// tests/skills/registry.test.ts
import { SkillRegistry } from '@/lib/skills/registry';

describe('SkillRegistry', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  describe('register', () => {
    it('should register a valid skill', async () => {
      const skill = {
        name: 'Test Skill',
        slug: 'test-skill',
        description: 'A test skill',
        version: '1.0.0',
        category: 'test',
        tags: ['test'],
        scope: 'global' as const,
        content: '---\nname: Test\n---\n# Test',
        mcpDependencies: [],
        triggers: [],
      };

      const id = await registry.register(skill);
      expect(id).toBeDefined();
    });

    it('should reject duplicate slugs', async () => {
      const skill = { /* ... */ };
      await registry.register(skill);
      await expect(registry.register(skill)).rejects.toThrow();
    });
  });

  describe('detect', () => {
    it('should detect skill from matching prompt', async () => {
      // ... test detection logic
    });

    it('should return empty for non-matching prompt', async () => {
      // ... test non-match
    });
  });
});

// tests/skills/detector.test.ts
import { SkillDetector } from '@/lib/skills/detector';

describe('SkillDetector', () => {
  describe('matchKeywords', () => {
    it('should match trigger patterns', () => {
      // ... test keyword matching
    });
  });

  describe('matchExamples', () => {
    it('should score example similarity', () => {
      // ... test example matching
    });
  });
});
```

#### 9.1.2 MCP Integration Tests

```typescript
// tests/mcp/manager.test.ts
import { MCPServerManager } from '@/lib/mcp/manager';

describe('MCPServerManager', () => {
  let manager: MCPServerManager;

  beforeEach(() => {
    manager = new MCPServerManager();
  });

  describe('registerServer', () => {
    it('should register server configuration', () => {
      manager.registerServer({
        name: 'test-server',
        type: 'stdio',
        command: 'echo',
        args: ['test'],
        capabilities: [],
      });

      // Verify registration
    });
  });

  describe('connect', () => {
    it('should connect to registered server', async () => {
      // ... test connection
    });

    it('should throw for unknown server', async () => {
      await expect(manager.connect('unknown')).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return status for all connections', async () => {
      // ... test status reporting
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// tests/integration/skill-execution.test.ts
import { SkillExecutor } from '@/lib/skills/executor';
import { MCPServerManager } from '@/lib/mcp/manager';

describe('Skill Execution Integration', () => {
  it('should execute database-design skill end-to-end', async () => {
    // Setup
    const manager = new MCPServerManager();
    // ... configure MCP servers

    const executor = new SkillExecutor();
    const context = {
      userId: 'test-user',
      taskId: 'test-task',
      prompt: 'Create a database schema for a blog',
      skill: databaseDesignSkill,
      mcpConnections: manager.connections,
      sandbox: mockSandbox,
    };

    // Execute
    const trace = await executor.execute(context);

    // Verify
    expect(trace.status).toBe('completed');
    expect(trace.steps).toHaveLength(5);
    // Verify files were generated
  });

  it('should handle MCP dependency failures gracefully', async () => {
    // ... test with missing MCP server
  });
});
```

### 9.3 E2E Tests

```typescript
// tests/e2e/skills-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Skills Flow', () => {
  test('user can trigger skill via natural language', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="prompt-input"]', 'Create a database schema for users and posts');
    await page.click('[data-testid="submit-button"]');

    // Verify skill detection
    await expect(page.locator('[data-testid="detected-skill"]')).toContainText('database-design');

    // Verify execution trace
    await expect(page.locator('[data-testid="execution-trace"]')).toBeVisible();
    await expect(page.locator('[data-testid="trace-step-1"]')).toHaveAttribute('data-status', 'completed');

    // Verify output
    await expect(page.locator('[data-testid="generated-files"]')).toContainText('schema.ts');
  });

  test('MCP status panel shows connection health', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="mcp-status-toggle"]');

    await expect(page.locator('[data-testid="mcp-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="mcp-server-exa"]')).toHaveAttribute('data-status', 'connected');
  });
});
```

### 9.4 Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Skill Registry | 90% |
| Skill Detector | 85% |
| Skill Executor | 80% |
| MCP Manager | 85% |
| MCP Connections | 80% |
| UI Components | 75% |
| Integration Templates | 80% |

---

## 10. Dependencies & Effort Estimates

### 10.1 Phase Dependencies

```
                    +---------------------+
                    |     PHASE 2         |
                    | Design System       |
                    | Foundation          |
                    +---------------------+
                              |
                              | MUST COMPLETE
                              v
+------------------------------------------------------------------+
|                         PHASE 3                                   |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+                                            |
|  | MCP Enhancement   | <-- Can start immediately                 |
|  | (Week 1)          |                                           |
|  +-------------------+                                            |
|           |                                                       |
|           v                                                       |
|  +-------------------+  +-------------------+                     |
|  | MCP Integrations  |  | Skills System     |                     |
|  | (Weeks 2-4)       |  | Architecture      |                     |
|  | - Exa             |  | (Weeks 2-3)       |                     |
|  | - Firecrawl       |  +-------------------+                     |
|  | - GitHub Deep     |           |                                |
|  | - Supabase Full   |           v                                |
|  | - Context7        |  +-------------------+                     |
|  | - Seq Thinking    |  | Core Skills       |                     |
|  +-------------------+  | (Weeks 4-5)       |                     |
|           |             | - database-design |                     |
|           |             | - api-integration |                     |
|           |             | - supabase-setup  |                     |
|           |             +-------------------+                     |
|           |                     |                                 |
|           |                     v                                 |
|           |             +-------------------+                     |
|           |             | ui-component      | <-- Needs Gallery   |
|           |             | (Week 6)          |                     |
|           |             +-------------------+                     |
|           |                     |                                 |
|           +---------------------+                                 |
|                     |                                             |
|                     v                                             |
|           +-------------------+                                   |
|           | Integration       |                                   |
|           | Templates         |                                   |
|           | (Weeks 7-8)       |                                   |
|           | - Stripe          |                                   |
|           | - SendGrid        |                                   |
|           | - Cloudinary      |                                   |
|           +-------------------+                                   |
|                     |                                             |
|                     v                                             |
|           +-------------------+                                   |
|           | Testing &         |                                   |
|           | Polish            |                                   |
|           | (Weeks 9-10)      |                                   |
|           +-------------------+                                   |
|                                                                   |
+------------------------------------------------------------------+
```

### 10.2 Effort Breakdown

| Component | Effort | Duration | Dependencies |
|-----------|--------|----------|--------------|
| Skills System Architecture | L | 2 weeks | Phase 2 complete |
| Core Skills (3 initial) | L | 2 weeks | Skills Architecture |
| ui-component Skill | M | 1 week | Component Gallery |
| MCP Connector Enhancement | M | 1 week | None |
| Exa Search Integration | S | 2-3 days | MCP Enhancement |
| Firecrawl Integration | S | 2-3 days | MCP Enhancement |
| GitHub Deep Integration | M | 1 week | MCP Enhancement |
| Supabase Full Integration | M | 1 week | MCP Enhancement |
| Context7 Integration | S | 2-3 days | MCP Enhancement |
| Sequential Thinking | S | 2-3 days | MCP Enhancement |
| Stripe Template | M | 1 week | All MCP + Skills |
| SendGrid Template | S | 3-4 days | All MCP + Skills |
| Cloudinary Template | S | 3-4 days | All MCP + Skills |
| Testing & Documentation | M | 1 week | All components |

### 10.3 Effort Legend

| Symbol | Effort | Duration |
|--------|--------|----------|
| XS | Extra Small | 1 day |
| S | Small | 2-3 days |
| M | Medium | 1 week |
| L | Large | 2 weeks |
| XL | Extra Large | 3+ weeks |

### 10.4 Total Estimated Duration

**8-10 weeks** after Phase 2 completes

### 10.5 Resource Requirements

| Resource | Requirement |
|----------|-------------|
| Developer(s) | 1-2 full-time |
| External API Keys | Exa, Firecrawl, GitHub, Supabase, Context7 |
| Testing Infrastructure | CI/CD with MCP server mocks |
| Documentation | Storybook, README updates |

### 10.6 External Service Costs (Monthly Estimates)

| Service | Free Tier | Estimated Usage | Cost |
|---------|-----------|-----------------|------|
| Exa | 1,000 searches | ~5,000 | $50/mo |
| Firecrawl | 500 scrapes | ~2,000 | $40/mo |
| GitHub API | 5,000 req/hr | Within limit | Free |
| Supabase | Free tier | Within limit | Free |
| Context7 | Free tier | Within limit | Free |

---

## 11. Appendices

### Appendix A: Complete SKILL.md Examples

#### A.1 database-design.skill.md

```yaml
---
name: Database Design
description: |
  Generate Drizzle ORM schemas, migrations, and seed data based on natural
  language descriptions of data requirements. This skill understands common
  data patterns and relationships.

  Use this skill when:
  - User describes data models or entities
  - User asks about database structure
  - User wants to create or modify tables
  - User describes relationships between data

  Trigger phrases include:
  - "create a database schema for"
  - "design tables for"
  - "I need a data model for"
  - "set up my database with"
  - "create entities for"
  - "define the relationships between"
  - "add a [table] table"
  - "modify the schema to include"

version: "1.0.0"
author: "Turbocat Team"
category: "backend"
tags: ["database", "drizzle", "orm", "schema", "migrations", "postgresql"]
scope: "global"

mcp_dependencies:
  - server: "supabase"
    required: false
    capabilities: ["getTableSchema", "listTables", "executeSQL"]
  - server: "context7"
    required: false
    capabilities: ["queryDocs", "getCodeSnippets"]

triggers:
  - pattern: "database|schema|table|entity|model|migration|column|field"
    confidence: 0.7
    examples:
      - "Create a database schema for a blog with users, posts, and comments"
      - "I need tables for products, orders, and customers"
      - "Design a data model for a project management app"
      - "Set up the database for my e-commerce site"
      - "Add a categories table with parent-child relationships"
  - pattern: "drizzle|postgres|sql|foreign key|one-to-many|many-to-many"
    confidence: 0.8
    examples:
      - "Create a Drizzle schema for user authentication"
      - "Set up PostgreSQL tables with proper indexes"
      - "Define a one-to-many relationship between users and posts"
---

## Overview

The database-design skill generates complete Drizzle ORM schemas based on
natural language descriptions of data requirements. It understands common
patterns like user authentication, e-commerce, CMS, and social applications.

## When to Use This Skill

- User describes data models, entities, or tables
- User asks about database structure or design
- User wants to create new tables or modify existing ones
- User describes relationships between different data types
- User mentions Drizzle, PostgreSQL, or database migrations

## How It Works

1. **Parse Requirements:** Analyze user's natural language description to identify entities, attributes, and relationships
2. **Pattern Recognition:** Match against common patterns (auth, e-commerce, CMS, etc.)
3. **Schema Generation:** Create Drizzle ORM schema files with proper types
4. **Relationship Mapping:** Define foreign keys and junction tables for relationships
5. **Migration Creation:** Generate SQL migration files
6. **Optional Seeding:** Create seed data for testing

## Prerequisites

- Drizzle ORM installed (`drizzle-orm`, `drizzle-kit`)
- PostgreSQL database configured (Neon recommended)
- `POSTGRES_URL` environment variable set
- `db/` directory for schema files

## Output Structure

For each schema generation request, this skill creates:

```
db/
├── schema/
│   ├── index.ts           # Exports all schemas
│   ├── [entity].ts        # One file per entity
│   └── relations.ts       # Relationship definitions
├── migrations/
│   └── XXXX_description.sql
└── seed/
    └── seed.ts            # Optional seed data
```

## Entity Detection Rules

1. **Nouns become tables:** "users and posts" -> users, posts tables
2. **Adjectives become columns:** "active users with emails" -> is_active, email columns
3. **Verbs indicate relationships:** "users write posts" -> posts.author_id -> users.id
4. **Pluralization matters:** "categories" = table, "category" = reference

## Common Patterns

### User Authentication
- users, sessions, accounts, verification_tokens
- OAuth provider linking
- Password hashing indicators

### E-commerce
- products, categories, orders, order_items, customers
- Inventory tracking
- Payment references

### CMS/Blog
- posts, authors, categories, tags, comments
- Publishing workflow (draft, published)
- SEO metadata

### Social
- users, posts, comments, likes, follows
- Notification system
- Activity feed

## Examples

### Example 1: Blog Schema

**User says:** "Create a database schema for a blog with users who can write posts and leave comments"

**Skill generates:**

```typescript
// db/schema/users.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// db/schema/posts.ts
import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  excerpt: text('excerpt'),
  published: boolean('published').default(false),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
});

// db/schema/comments.ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';
import { users } from './users';
import { posts } from './posts';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  postId: uuid('post_id').references(() => posts.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Example 2: E-commerce Schema

**User says:** "I need a database for an online store with products, categories, and orders"

**Skill generates:** Full e-commerce schema with products, categories, orders, order_items, and proper relationships.

## Limitations

- Only generates PostgreSQL-compatible schemas
- Requires Drizzle ORM (not Prisma or other ORMs)
- Complex graph relationships may need manual adjustment
- Limited to standard SQL data types
- Does not handle database-specific features like partitioning

## Related Skills

- `api-integration`: Generate API endpoints for database operations
- `supabase-setup`: Configure Supabase with generated schemas
```

### Appendix B: MCP Configuration Files

#### B.1 Complete mcp-config.json

```json
{
  "servers": {
    "exa": {
      "name": "exa",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      },
      "capabilities": [
        { "name": "search", "description": "Search the web" },
        { "name": "findSimilar", "description": "Find similar pages" },
        { "name": "getContents", "description": "Get page contents" }
      ],
      "rateLimit": { "requests": 100, "windowMs": 60000 }
    },
    "firecrawl": {
      "name": "firecrawl",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
      },
      "capabilities": [
        { "name": "scrape", "description": "Scrape a URL" },
        { "name": "crawl", "description": "Crawl a website" },
        { "name": "map", "description": "Get sitemap" }
      ],
      "rateLimit": { "requests": 50, "windowMs": 60000 }
    },
    "github": {
      "name": "github",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "capabilities": [
        { "name": "searchRepositories", "description": "Search repos" },
        { "name": "getRepository", "description": "Get repo details" },
        { "name": "getFileContents", "description": "Read files" },
        { "name": "createIssue", "description": "Create issues" },
        { "name": "createPullRequest", "description": "Create PRs" },
        { "name": "searchCode", "description": "Search code" }
      ],
      "rateLimit": { "requests": 5000, "windowMs": 3600000 }
    },
    "supabase": {
      "name": "supabase",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "capabilities": [
        { "name": "executeSQL", "description": "Run SQL queries" },
        { "name": "getTableSchema", "description": "Get table schema" },
        { "name": "listTables", "description": "List all tables" },
        { "name": "configureAuth", "description": "Configure auth" },
        { "name": "createBucket", "description": "Create storage bucket" },
        { "name": "enableRealtime", "description": "Enable realtime" }
      ],
      "rateLimit": { "requests": 1000, "windowMs": 60000 }
    },
    "context7": {
      "name": "context7",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      },
      "capabilities": [
        { "name": "resolveLibrary", "description": "Resolve library ID" },
        { "name": "queryDocs", "description": "Query documentation" },
        { "name": "getCodeSnippets", "description": "Get code examples" }
      ],
      "rateLimit": { "requests": 100, "windowMs": 60000 }
    },
    "sequential-thinking": {
      "name": "sequential-thinking",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/sequential-thinking-mcp-server"],
      "env": {},
      "capabilities": [
        { "name": "sequentialThinking", "description": "Multi-step reasoning" }
      ],
      "rateLimit": { "requests": 1000, "windowMs": 60000 }
    }
  },
  "defaultTimeout": 30000,
  "retryConfig": {
    "maxRetries": 3,
    "initialDelay": 1000,
    "maxDelay": 10000
  }
}
```

### Appendix C: Environment Variables Template

```bash
# =============================================================================
# PHASE 3: SKILLS & MCP INTEGRATION - ENVIRONMENT VARIABLES
# =============================================================================

# -----------------------------------------------------------------------------
# MCP SERVER CREDENTIALS
# -----------------------------------------------------------------------------

# Exa Search API
# Get from: https://dashboard.exa.ai
EXA_API_KEY=

# Firecrawl API
# Get from: https://firecrawl.dev
FIRECRAWL_API_KEY=

# GitHub Personal Access Token
# Get from: https://github.com/settings/tokens
# Scopes needed: repo, read:org, read:user
GITHUB_TOKEN=

# Supabase Project Credentials
# Get from: https://supabase.com/dashboard
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Context7 API
# Get from: https://context7.dev
CONTEXT7_API_KEY=

# -----------------------------------------------------------------------------
# INTEGRATION TEMPLATE CREDENTIALS
# -----------------------------------------------------------------------------

# Stripe
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# SendGrid
# Get from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Cloudinary
# Get from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| SKILL.md | Markdown file format for defining Claude Code skills with YAML frontmatter |
| MCP | Model Context Protocol - Standard for AI tool integration |
| Skill Registry | Database/system for storing and discovering skills |
| Skill Detector | System that matches user prompts to applicable skills |
| Skill Executor | Engine that runs skill logic with execution tracing |
| Execution Trace | Complete log of AI reasoning and decisions during execution |
| Integration Template | Full package with skill + code templates + MCP config |
| Component Gallery | Phase 2 database of reusable UI components |
| Design Tokens | Standardized design values (colors, spacing, etc.) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-03 | Spec Writer Agent | Initial specification |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Architect | | | |

---

*End of Specification*
