/**
 * Tests for DataAgentExecutor
 */

import { AgentType, AgentStatus, Agent, Prisma } from '@prisma/client';
import { DataAgentExecutor, DataExecutionResult } from '../DataAgentExecutor';
import { AgentExecutionInput } from '../AgentExecutor';

// Create a mock agent
const createMockAgent = (config: Record<string, unknown> = {}): Agent => ({
  id: 'test-agent-id',
  name: 'Test Data Agent',
  description: 'A test data agent',
  type: AgentType.DATA,
  status: AgentStatus.ACTIVE,
  version: 1,
  parentId: null,
  userId: 'test-user-id',
  config: config as Prisma.JsonValue,
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
});

describe('DataAgentExecutor', () => {
  let executor: DataAgentExecutor;

  beforeEach(() => {
    executor = new DataAgentExecutor();
  });

  describe('getAgentType', () => {
    it('should return DATA agent type', () => {
      expect(executor.getAgentType()).toBe(AgentType.DATA);
    });
  });

  describe('filter operation', () => {
    it('should filter array based on conditions', async () => {
      const agent = createMockAgent({
        operation: 'filter',
        operationConfig: {
          conditions: [{ field: 'age', operator: 'gt', value: 18 }],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 15 },
            { name: 'Charlie', age: 30 },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toHaveLength(2);
      expect((output.result as any[])[0].name).toBe('Alice');
      expect((output.result as any[])[1].name).toBe('Charlie');
    });

    it('should handle multiple conditions with AND logic', async () => {
      const agent = createMockAgent({
        operation: 'filter',
        operationConfig: {
          conditions: [
            { field: 'age', operator: 'gt', value: 18 },
            { field: 'status', operator: 'eq', value: 'active' },
          ],
          logic: 'and',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', age: 25, status: 'active' },
            { name: 'Bob', age: 25, status: 'inactive' },
            { name: 'Charlie', age: 15, status: 'active' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toHaveLength(1);
      expect((output.result as any[])[0].name).toBe('Alice');
    });

    it('should handle multiple conditions with OR logic', async () => {
      const agent = createMockAgent({
        operation: 'filter',
        operationConfig: {
          conditions: [
            { field: 'age', operator: 'gt', value: 28 },
            { field: 'status', operator: 'eq', value: 'vip' },
          ],
          logic: 'or',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', age: 25, status: 'vip' },
            { name: 'Bob', age: 30, status: 'regular' },
            { name: 'Charlie', age: 20, status: 'regular' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toHaveLength(2);
    });

    it('should support contains operator', async () => {
      const agent = createMockAgent({
        operation: 'filter',
        operationConfig: {
          conditions: [{ field: 'email', operator: 'contains', value: '@gmail' }],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { email: 'alice@gmail.com' },
            { email: 'bob@yahoo.com' },
            { email: 'charlie@gmail.com' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toHaveLength(2);
    });
  });

  describe('map operation', () => {
    it('should map fields', async () => {
      const agent = createMockAgent({
        operation: 'map',
        operationConfig: {
          fields: {
            fullName: 'name',
            yearsOld: 'age',
          },
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      expect(items[0].fullName).toBe('Alice');
      expect(items[0].yearsOld).toBe(25);
      expect(items[0].name).toBeUndefined();
    });
  });

  describe('sort operation', () => {
    it('should sort array ascending', async () => {
      const agent = createMockAgent({
        operation: 'sort',
        operationConfig: {
          field: 'age',
          direction: 'asc',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Charlie', age: 30 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 35 },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      expect(items[0].name).toBe('Alice');
      expect(items[1].name).toBe('Charlie');
      expect(items[2].name).toBe('Bob');
    });

    it('should sort array descending', async () => {
      const agent = createMockAgent({
        operation: 'sort',
        operationConfig: {
          field: 'age',
          direction: 'desc',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Charlie', age: 30 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 35 },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      expect(items[0].name).toBe('Bob');
      expect(items[1].name).toBe('Charlie');
      expect(items[2].name).toBe('Alice');
    });
  });

  describe('group operation', () => {
    it('should group by field', async () => {
      const agent = createMockAgent({
        operation: 'group',
        operationConfig: {
          field: 'department',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', department: 'Engineering' },
            { name: 'Bob', department: 'Sales' },
            { name: 'Charlie', department: 'Engineering' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const groups = output.result as Record<string, any[]>;
      expect(groups['Engineering']).toHaveLength(2);
      expect(groups['Sales']).toHaveLength(1);
    });
  });

  describe('reduce operation', () => {
    it('should sum values', async () => {
      const agent = createMockAgent({
        operation: 'reduce',
        operationConfig: {
          operation: 'sum',
          field: 'amount',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [{ amount: 100 }, { amount: 200 }, { amount: 300 }],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toBe(600);
    });

    it('should calculate average', async () => {
      const agent = createMockAgent({
        operation: 'reduce',
        operationConfig: {
          operation: 'avg',
          field: 'score',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [{ score: 80 }, { score: 90 }, { score: 100 }],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toBe(90);
    });
  });

  describe('unique operation', () => {
    it('should remove duplicates by field', async () => {
      const agent = createMockAgent({
        operation: 'unique',
        operationConfig: {
          field: 'email',
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { email: 'alice@test.com', name: 'Alice 1' },
            { email: 'bob@test.com', name: 'Bob' },
            { email: 'alice@test.com', name: 'Alice 2' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toHaveLength(2);
    });
  });

  describe('pick operation', () => {
    it('should select only specified fields', async () => {
      const agent = createMockAgent({
        operation: 'pick',
        operationConfig: {
          fields: ['name', 'email'],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', email: 'alice@test.com', age: 25, status: 'active' },
            { name: 'Bob', email: 'bob@test.com', age: 30, status: 'inactive' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      expect(Object.keys(items[0])).toEqual(['name', 'email']);
    });
  });

  describe('omit operation', () => {
    it('should exclude specified fields', async () => {
      const agent = createMockAgent({
        operation: 'omit',
        operationConfig: {
          fields: ['password', 'secret'],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [{ name: 'Alice', password: '123', secret: 'abc' }],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      expect(items[0].name).toBe('Alice');
      expect(items[0].password).toBeUndefined();
      expect(items[0].secret).toBeUndefined();
    });
  });

  describe('flatten operation', () => {
    it('should flatten nested arrays', async () => {
      const agent = createMockAgent({
        operation: 'flatten',
        operationConfig: {
          depth: 1,
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            [1, 2],
            [3, 4],
            [5, 6],
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.result).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('aggregate operation', () => {
    it('should aggregate with grouping', async () => {
      const agent = createMockAgent({
        operation: 'aggregate',
        operationConfig: {
          groupBy: 'category',
          aggregations: [
            { field: 'amount', operation: 'sum', alias: 'total' },
            { field: 'amount', operation: 'count', alias: 'count' },
          ],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { category: 'A', amount: 100 },
            { category: 'A', amount: 200 },
            { category: 'B', amount: 150 },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      const items = output.result as any[];
      const catA = items.find((i) => i.category === 'A');
      const catB = items.find((i) => i.category === 'B');
      expect(catA.total).toBe(300);
      expect(catA.count).toBe(2);
      expect(catB.total).toBe(150);
      expect(catB.count).toBe(1);
    });
  });

  describe('pipeline mode', () => {
    it('should execute multiple operations in sequence', async () => {
      const agent = createMockAgent({
        pipeline: [
          {
            operation: 'filter',
            config: {
              conditions: [{ field: 'age', operator: 'gte', value: 18 }],
            },
          },
          {
            operation: 'sort',
            config: {
              field: 'age',
              direction: 'desc',
            },
          },
          {
            operation: 'pick',
            config: {
              fields: ['name', 'age'],
            },
          },
        ],
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: {
          data: [
            { name: 'Alice', age: 25, status: 'active' },
            { name: 'Bob', age: 15, status: 'inactive' },
            { name: 'Charlie', age: 30, status: 'active' },
          ],
        },
      };

      const result = await executor.execute(input);
      const output = result.output as DataExecutionResult;

      expect(result.success).toBe(true);
      expect(output.operationsPerformed).toEqual(['filter', 'sort', 'pick']);
      const items = output.result as any[];
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('Charlie');
      expect(items[1].name).toBe('Alice');
      expect(Object.keys(items[0])).toEqual(['name', 'age']);
    });
  });

  describe('error handling', () => {
    it('should fail if agent type is wrong', async () => {
      const agent = createMockAgent({});
      (agent as any).type = AgentType.API;

      const input: AgentExecutionInput = {
        agent,
        inputs: { data: [] },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('DATA agents');
    });

    it('should fail if filter is applied to non-array', async () => {
      const agent = createMockAgent({
        operation: 'filter',
        operationConfig: {
          conditions: [{ field: 'x', operator: 'eq', value: 1 }],
        },
      });

      const input: AgentExecutionInput = {
        agent,
        inputs: { data: { notAnArray: true } },
      };

      const result = await executor.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('array');
    });
  });
});
