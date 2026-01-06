# Agent Core Engine Specifications

**Version:** 1.0
**Date:** January 5, 2026

---

## Overview

This document defines the agent execution engine that powers Turbocat's multi-agent orchestration capabilities. The engine handles agent lifecycle management, workflow execution, job queuing, and monitoring.

### Core Responsibilities
1. **Agent Lifecycle**: Initialize, start, stop, pause agents
2. **Workflow Execution**: Parse DAGs, execute steps, manage dependencies
3. **Job Queue**: Async job processing with Bull/BullMQ
4. **Resource Management**: CPU/memory limits, concurrency control
5. **Error Handling**: Retries, timeouts, failure recovery
6. **Monitoring**: Execution tracking, metrics collection, logging

---

## Agent Types

### 1. Code Agent

Executes code snippets in isolated environments.

**Supported Runtimes:**
- Python 3.11
- Node.js 20
- Deno 1.x
- Go 1.21

**Configuration:**
```typescript
interface CodeAgentConfig {
  runtime: 'python3.11' | 'nodejs20' | 'deno1' | 'go1.21';
  code: string;
  timeout: number; // seconds
  memory: number; // MB
  environment: Record<string, string>; // env vars
  packages?: string[]; // dependencies to install
}
```

**Example:**
```json
{
  "type": "code",
  "config": {
    "runtime": "python3.11",
    "code": "import requests\\nresult = requests.get('https://api.example.com/data').json()\\nprint(result)",
    "timeout": 60,
    "memory": 256,
    "packages": ["requests"]
  }
}
```

---

### 2. API Agent

Makes HTTP requests to external APIs.

**Configuration:**
```typescript
interface ApiAgentConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout: number;
  retries?: number;
  retryDelay?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    credentials: string;
  };
}
```

**Example:**
```json
{
  "type": "api",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/process",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "data": "{{inputs.data}}"
    },
    "timeout": 30,
    "retries": 3
  }
}
```

---

### 3. LLM Agent

Interacts with language models.

**Supported Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Local models (Ollama)

**Configuration:**
```typescript
interface LLMAgentConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: any;
  }>;
}
```

**Example:**
```json
{
  "type": "llm",
  "config": {
    "provider": "openai",
    "model": "gpt-4",
    "systemPrompt": "You are a helpful assistant.",
    "prompt": "Analyze this data: {{inputs.data}}",
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

---

### 4. Data Agent

Processes and transforms data.

**Operations:**
- Filter
- Map
- Reduce
- Sort
- Group
- Join
- Aggregate

**Configuration:**
```typescript
interface DataAgentConfig {
  operation: 'filter' | 'map' | 'reduce' | 'sort' | 'group' | 'join' | 'aggregate';
  source: string; // input reference
  transformation: string | object;
  outputFormat?: 'json' | 'csv' | 'array';
}
```

**Example:**
```json
{
  "type": "data",
  "config": {
    "operation": "filter",
    "source": "{{inputs.data}}",
    "transformation": {
      "condition": "item.value > 100"
    },
    "outputFormat": "json"
  }
}
```

---

### 5. Workflow Agent

Orchestrates other agents in complex workflows.

**Configuration:**
```typescript
interface WorkflowAgentConfig {
  workflowId: string;
  inputs: Record<string, any>;
  waitForCompletion: boolean;
}
```

---

## Workflow Execution

### Workflow Definition

A workflow is a Directed Acyclic Graph (DAG) of steps.

**Structure:**
```typescript
interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    timeout?: number;
    maxRetries?: number;
    onError?: 'fail' | 'continue' | 'retry';
  };
}

interface WorkflowNode {
  id: string;
  type: 'agent' | 'condition' | 'loop' | 'parallel' | 'wait';
  agentId?: string;
  config: any;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  condition?: string; // for conditional edges
}
```

**Example Workflow:**
```json
{
  "nodes": [
    {
      "id": "extract",
      "type": "agent",
      "agentId": "scraper-agent-uuid",
      "config": {
        "url": "https://example.com"
      }
    },
    {
      "id": "transform",
      "type": "agent",
      "agentId": "transformer-agent-uuid",
      "config": {
        "input": "{{extract.output}}"
      }
    },
    {
      "id": "load",
      "type": "agent",
      "agentId": "loader-agent-uuid",
      "config": {
        "data": "{{transform.output}}",
        "destination": "database"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "extract",
      "target": "transform"
    },
    {
      "id": "e2",
      "source": "transform",
      "target": "load"
    }
  ]
}
```

---

### Execution Engine

**Main Components:**

1. **DAG Parser**: Validates workflow structure
2. **Dependency Resolver**: Determines execution order
3. **Step Executor**: Executes individual steps
4. **State Manager**: Tracks execution state
5. **Error Handler**: Manages failures and retries

**Execution Flow:**

```
┌─────────────────┐
│ Workflow Trigger│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse DAG      │ ← Validate structure, check cycles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Resolve Order   │ ← Topological sort
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Initialize      │ ← Create execution record
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Steps   │ ← Process each step
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│ Step │  │ Step │  (Parallel execution when possible)
└───┬──┘  └───┬──┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Complete        │ ← Finalize execution
└─────────────────┘
```

**Implementation:**

```typescript
class WorkflowExecutor {
  private execution: Execution;
  private workflow: Workflow;
  private steps: Map<string, WorkflowStep>;
  private state: Map<string, StepState>;

  async execute(workflowId: string, inputs: any): Promise<Execution> {
    // 1. Load workflow
    this.workflow = await this.loadWorkflow(workflowId);

    // 2. Validate DAG
    this.validateDAG(this.workflow.definition);

    // 3. Create execution record
    this.execution = await prisma.execution.create({
      data: {
        workflowId,
        userId: this.userId,
        status: 'pending',
        inputData: inputs,
        stepsTotal: this.workflow.steps.length,
      },
    });

    try {
      // 4. Start execution
      await this.updateExecutionStatus('running', { startedAt: new Date() });

      // 5. Execute steps
      const result = await this.executeSteps(inputs);

      // 6. Complete execution
      await this.updateExecutionStatus('completed', {
        completedAt: new Date(),
        outputData: result,
        durationMs: Date.now() - this.execution.createdAt.getTime(),
      });

      return this.execution;
    } catch (error) {
      // Handle errors
      await this.handleExecutionError(error);
      throw error;
    }
  }

  private async executeSteps(inputs: any): Promise<any> {
    const sortedSteps = this.topologicalSort();
    const context = { inputs, outputs: {} };

    for (const stepId of sortedSteps) {
      const step = this.steps.get(stepId)!;

      // Wait for dependencies
      await this.waitForDependencies(step);

      // Execute step
      const result = await this.executeStep(step, context);

      // Store result
      context.outputs[step.stepKey] = result;

      // Update state
      this.state.set(stepId, {
        status: 'completed',
        output: result,
      });
    }

    return context.outputs;
  }

  private async executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<any> {
    // Log step start
    await this.logStepEvent(step, 'started');

    try {
      // Resolve inputs
      const inputs = this.resolveInputs(step.inputs, context);

      // Execute based on step type
      let result: any;

      switch (step.stepType) {
        case 'agent':
          result = await this.executeAgent(step.agentId!, inputs);
          break;
        case 'condition':
          result = await this.evaluateCondition(step, context);
          break;
        case 'loop':
          result = await this.executeLoop(step, context);
          break;
        case 'parallel':
          result = await this.executeParallel(step, context);
          break;
        case 'wait':
          result = await this.executeWait(step);
          break;
      }

      // Log step completion
      await this.logStepEvent(step, 'completed', result);

      return result;
    } catch (error) {
      // Handle step error
      await this.handleStepError(step, error);
      throw error;
    }
  }

  private async executeAgent(agentId: string, inputs: any): Promise<any> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Queue agent execution job
    const job = await this.queue.add('execute-agent', {
      agentId: agent.id,
      config: agent.config,
      inputs,
      executionId: this.execution.id,
    });

    // Wait for job completion
    const result = await job.finished();

    return result;
  }

  private resolveInputs(
    inputMappings: any,
    context: ExecutionContext
  ): any {
    // Replace template variables like {{inputs.data}} or {{step1.output}}
    const jsonStr = JSON.stringify(inputMappings);
    const resolved = jsonStr.replace(
      /{{(\w+)\.([^}]+)}}/g,
      (match, source, path) => {
        if (source === 'inputs') {
          return this.getNestedValue(context.inputs, path);
        } else {
          return this.getNestedValue(context.outputs[source], path);
        }
      }
    );

    return JSON.parse(resolved);
  }

  private validateDAG(definition: WorkflowDefinition): void {
    // Check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = definition.edges.filter(e => e.source === nodeId);

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of definition.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          throw new Error('Workflow contains a cycle');
        }
      }
    }
  }

  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Build adjacency list and in-degree map
    for (const node of this.workflow.definition.nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }

    for (const edge of this.workflow.definition.edges) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      for (const neighbor of adjList.get(nodeId)!) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }
}
```

---

## Job Queue System

### Bull/BullMQ Configuration

```typescript
import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Create queue
export const agentQueue = new Queue('agent-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
});

// Create worker
const worker = new Worker(
  'agent-execution',
  async (job) => {
    const { agentId, config, inputs, executionId } = job.data;

    try {
      // Execute agent
      const result = await executeAgentLogic(agentId, config, inputs);

      // Log success
      await logExecutionEvent(executionId, {
        level: 'info',
        message: `Agent ${agentId} completed successfully`,
        metadata: { result },
      });

      return result;
    } catch (error) {
      // Log failure
      await logExecutionEvent(executionId, {
        level: 'error',
        message: `Agent ${agentId} failed: ${error.message}`,
        metadata: { error: error.stack },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 jobs concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // per minute
    },
  }
);

// Create scheduler (for delayed jobs)
const scheduler = new QueueScheduler('agent-execution', { connection });

// Event handlers
worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress:`, progress);
});
```

---

## Resource Management

### CPU and Memory Limits

```typescript
import { spawn } from 'child_process';

async function executeCodeAgent(config: CodeAgentConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [
      '--memory', `${config.memory}m`,
      '--cpus', '1.0',
      '--rm', // Remove container after execution
      '--network', 'none', // No network access (can be configured)
      'runtime-image', // Docker image for runtime
      '/bin/sh', '-c', config.code,
    ];

    const process = spawn('docker', ['run', ...args], {
      timeout: config.timeout * 1000,
      env: config.environment,
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ output: stdout, exitCode: 0 });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', reject);
  });
}
```

---

## Error Handling

### Retry Logic

```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    retryDelay: number;
    onError?: 'fail' | 'continue' | 'retry';
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < options.maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, options.retryDelay));
      }
    }
  }

  // All retries exhausted
  if (options.onError === 'continue') {
    return null as T; // Continue with null
  }

  throw lastError!;
}
```

---

## Monitoring and Metrics

### Execution Tracking

```typescript
interface ExecutionMetrics {
  executionId: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  stepsCompleted: number;
  stepsTotal: number;
  stepsFailed: number;
  metrics: {
    avgStepDurationMs: number;
    longestStepMs: number;
    shortestStepMs: number;
  };
}

async function collectExecutionMetrics(
  executionId: string
): Promise<ExecutionMetrics> {
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: {
      logs: {
        where: {
          stepStatus: { not: null },
        },
      },
    },
  });

  const stepDurations = execution.logs
    .filter(log => log.stepDurationMs !== null)
    .map(log => log.stepDurationMs!);

  return {
    executionId: execution.id,
    workflowId: execution.workflowId,
    status: execution.status,
    startedAt: execution.startedAt!,
    completedAt: execution.completedAt || undefined,
    durationMs: execution.durationMs || undefined,
    stepsCompleted: execution.stepsCompleted,
    stepsTotal: execution.stepsTotal,
    stepsFailed: execution.stepsFailed,
    metrics: {
      avgStepDurationMs: stepDurations.length
        ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
        : 0,
      longestStepMs: Math.max(...stepDurations, 0),
      shortestStepMs: Math.min(...stepDurations, Infinity),
    },
  };
}
```

---

## Testing Agent Execution

### Unit Tests

```typescript
describe('WorkflowExecutor', () => {
  describe('validateDAG', () => {
    it('should detect cycles in workflow', () => {
      const definition = {
        nodes: [
          { id: 'a', type: 'agent' },
          { id: 'b', type: 'agent' },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'a' }, // Cycle!
        ],
      };

      expect(() => executor.validateDAG(definition)).toThrow('contains a cycle');
    });
  });

  describe('topologicalSort', () => {
    it('should return correct execution order', () => {
      const definition = {
        nodes: [
          { id: 'a', type: 'agent' },
          { id: 'b', type: 'agent' },
          { id: 'c', type: 'agent' },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'c' },
        ],
      };

      const order = executor.topologicalSort(definition);

      expect(order).toEqual(['a', 'b', 'c']);
    });
  });
});
```

---

**End of Agent Core Specifications**
