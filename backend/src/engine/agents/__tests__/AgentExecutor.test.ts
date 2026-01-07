/**
 * Tests for AgentExecutor base class
 */

import { AgentType, AgentStatus, Agent, Prisma } from '@prisma/client';
import { AgentExecutor, AgentExecutionInput, DEFAULT_CONFIG } from '../AgentExecutor';

// Create a concrete implementation for testing
class TestAgentExecutor extends AgentExecutor {
  public executeInternalCalled = false;
  public lastInput: AgentExecutionInput | null = null;
  public mockOutput: unknown = { test: 'result' };
  public shouldThrow = false;
  public throwError: Error | null = null;
  public executeDelay = 0;

  getAgentType(): AgentType {
    return AgentType.CODE;
  }

  protected async executeInternal(input: AgentExecutionInput): Promise<unknown> {
    this.executeInternalCalled = true;
    this.lastInput = input;

    if (this.executeDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.executeDelay));
    }

    if (this.shouldThrow) {
      throw this.throwError || new Error('Test error');
    }

    return this.mockOutput;
  }
}

// Create a mock agent
const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'test-agent-id',
  name: 'Test Agent',
  description: 'A test agent',
  type: AgentType.CODE,
  status: AgentStatus.ACTIVE,
  version: 1,
  parentId: null,
  userId: 'test-user-id',
  config: {} as Prisma.JsonValue,
  capabilities: [] as Prisma.JsonValue,
  parameters: {} as Prisma.JsonValue,
  maxExecutionTime: null,
  maxMemoryMb: 512,
  maxConcurrentExecutions: 1,
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  avgExecutionTimeMs: 0,
  tags: [],
  isPublic: false,
  isTemplate: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('AgentExecutor', () => {
  let executor: TestAgentExecutor;

  beforeEach(() => {
    executor = new TestAgentExecutor();
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const exec = new TestAgentExecutor();
      expect(exec['config']).toEqual(DEFAULT_CONFIG);
    });

    it('should merge provided config with defaults', () => {
      const exec = new TestAgentExecutor({
        timeoutMs: 5000,
        verbose: true,
      });
      expect(exec['config'].timeoutMs).toBe(5000);
      expect(exec['config'].verbose).toBe(true);
      expect(exec['config'].maxMemoryMb).toBe(DEFAULT_CONFIG.maxMemoryMb);
    });
  });

  describe('getAgentType', () => {
    it('should return the correct agent type', () => {
      expect(executor.getAgentType()).toBe(AgentType.CODE);
    });
  });

  describe('execute', () => {
    it('should execute successfully and return result', async () => {
      const agent = createMockAgent();
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ test: 'result' });
      expect(result.error).toBeUndefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(executor.executeInternalCalled).toBe(true);
    });

    it('should handle execution errors', async () => {
      executor.shouldThrow = true;
      executor.throwError = new Error('Execution failed');

      const agent = createMockAgent();
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(false);
      expect(result.output).toBeNull();
      expect(result.error).toBe('Execution failed');
      expect(result.errorStack).toBeDefined();
    });

    it('should timeout if execution takes too long', async () => {
      executor.executeDelay = 200;
      const exec = new TestAgentExecutor({ timeoutMs: 100 });
      exec.executeDelay = 200;

      const agent = createMockAgent();
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await exec.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should use agent maxExecutionTime if set', async () => {
      const agent = createMockAgent({ maxExecutionTime: 1 }); // 1 second
      executor.executeDelay = 50; // 50ms, should succeed

      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(true);
    });

    it('should include logs in result', async () => {
      const exec = new TestAgentExecutor({ verbose: false });
      const agent = createMockAgent();
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await exec.execute(input);

      expect(result.logs).toBeDefined();
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.logs!.length).toBeGreaterThan(0);
    });

    it('should pass context to executeInternal', async () => {
      const agent = createMockAgent();
      const context = {
        executionId: 'exec-123',
        workflowId: 'workflow-456',
        stepKey: 'step1',
      };
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
        context,
      };

      await executor.execute(input);

      expect(executor.lastInput?.context).toEqual(context);
    });
  });

  describe('validateInput', () => {
    it('should throw if agent is missing', async () => {
      const input = {
        agent: undefined as any,
        inputs: { data: 'test' },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent is required');
    });

    it('should throw if inputs are missing', async () => {
      const agent = createMockAgent();
      const input = {
        agent,
        inputs: undefined as any,
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Inputs are required');
    });
  });

  describe('log method', () => {
    it('should capture logs during execution', async () => {
      const agent = createMockAgent();
      const input: AgentExecutionInput = {
        agent,
        inputs: { data: 'test' },
      };

      const result = await executor.execute(input);

      // Should have at least start and complete logs
      const infoLogs = result.logs!.filter((l) => l.level === 'info');
      expect(infoLogs.length).toBeGreaterThanOrEqual(2);
    });
  });
});
