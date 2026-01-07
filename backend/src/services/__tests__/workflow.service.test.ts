/**
 * Tests for Workflow Service
 *
 * Tests the workflow management functionality including:
 * - createWorkflow (with steps)
 * - validateDAG (cycle detection)
 * - updateWorkflow (with step updates)
 * - executeWorkflow (queues execution)
 */

import {
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  WorkflowStepType,
  ErrorHandling,
} from '@prisma/client';
import * as workflowService from '../workflow.service';
import { ApiError } from '../../utils/ApiError';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    workflow: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    workflowStep: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    execution: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  isPrismaAvailable: jest.fn().mockReturnValue(true),
}));

// Mock logger to prevent console output
jest.mock('../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Workflow Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;
  const mockIsPrismaAvailable = require('../../lib/prisma').isPrismaAvailable;

  const mockUserId = 'user-123';
  const mockWorkflowId = 'workflow-456';

  const mockWorkflow = {
    id: mockWorkflowId,
    userId: mockUserId,
    name: 'Test Workflow',
    description: 'A test workflow',
    status: WorkflowStatus.DRAFT,
    version: 1,
    definition: {},
    triggerConfig: {},
    scheduleEnabled: false,
    scheduleCron: null,
    scheduleTimezone: 'UTC',
    tags: ['test'],
    isPublic: false,
    parentId: null,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastExecutionAt: null,
    createdAt: new Date('2026-01-06T12:00:00.000Z'),
    updatedAt: new Date('2026-01-06T12:00:00.000Z'),
    deletedAt: null,
    steps: [],
  };

  const mockStep = {
    id: 'step-1',
    workflowId: mockWorkflowId,
    stepKey: 'step1',
    stepName: 'First Step',
    stepType: WorkflowStepType.AGENT,
    position: 0,
    agentId: null,
    config: {},
    inputs: {},
    outputs: {},
    dependsOn: [],
    retryCount: 0,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    onError: ErrorHandling.FAIL,
    createdAt: new Date(),
    updatedAt: new Date(),
    agent: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrismaAvailable.mockReturnValue(true);
  });

  describe('validateDAG', () => {
    it('should pass for a valid DAG with no cycles', () => {
      const steps: workflowService.CreateWorkflowStepInput[] = [
        {
          stepKey: 'step1',
          stepName: 'Step 1',
          stepType: WorkflowStepType.AGENT,
          position: 0,
          dependsOn: [],
        },
        {
          stepKey: 'step2',
          stepName: 'Step 2',
          stepType: WorkflowStepType.AGENT,
          position: 1,
          dependsOn: ['step1'],
        },
        {
          stepKey: 'step3',
          stepName: 'Step 3',
          stepType: WorkflowStepType.AGENT,
          position: 2,
          dependsOn: ['step1', 'step2'],
        },
      ];

      expect(() => workflowService.validateDAG(steps)).not.toThrow();
    });

    it('should detect a simple cycle (A -> B -> A)', () => {
      const steps: workflowService.CreateWorkflowStepInput[] = [
        {
          stepKey: 'stepA',
          stepName: 'Step A',
          stepType: WorkflowStepType.AGENT,
          position: 0,
          dependsOn: ['stepB'],
        },
        {
          stepKey: 'stepB',
          stepName: 'Step B',
          stepType: WorkflowStepType.AGENT,
          position: 1,
          dependsOn: ['stepA'],
        },
      ];

      expect(() => workflowService.validateDAG(steps)).toThrow(ApiError);
      expect(() => workflowService.validateDAG(steps)).toThrow(/Cycle detected/);
    });

    it('should detect a longer cycle (A -> B -> C -> A)', () => {
      const steps: workflowService.CreateWorkflowStepInput[] = [
        {
          stepKey: 'stepA',
          stepName: 'Step A',
          stepType: WorkflowStepType.AGENT,
          position: 0,
          dependsOn: ['stepC'],
        },
        {
          stepKey: 'stepB',
          stepName: 'Step B',
          stepType: WorkflowStepType.AGENT,
          position: 1,
          dependsOn: ['stepA'],
        },
        {
          stepKey: 'stepC',
          stepName: 'Step C',
          stepType: WorkflowStepType.AGENT,
          position: 2,
          dependsOn: ['stepB'],
        },
      ];

      expect(() => workflowService.validateDAG(steps)).toThrow(ApiError);
      expect(() => workflowService.validateDAG(steps)).toThrow(/Cycle detected/);
    });

    it('should throw error for non-existent dependency', () => {
      const steps: workflowService.CreateWorkflowStepInput[] = [
        {
          stepKey: 'step1',
          stepName: 'Step 1',
          stepType: WorkflowStepType.AGENT,
          position: 0,
          dependsOn: ['nonExistentStep'],
        },
      ];

      expect(() => workflowService.validateDAG(steps)).toThrow(ApiError);
      expect(() => workflowService.validateDAG(steps)).toThrow(/non-existent step/);
    });

    it('should pass for steps with no dependencies', () => {
      const steps: workflowService.CreateWorkflowStepInput[] = [
        {
          stepKey: 'step1',
          stepName: 'Step 1',
          stepType: WorkflowStepType.AGENT,
          position: 0,
        },
        {
          stepKey: 'step2',
          stepName: 'Step 2',
          stepType: WorkflowStepType.AGENT,
          position: 1,
        },
      ];

      expect(() => workflowService.validateDAG(steps)).not.toThrow();
    });
  });

  describe('createWorkflow', () => {
    it('should create a workflow with steps successfully', async () => {
      const input: workflowService.CreateWorkflowInput = {
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          {
            stepKey: 'step1',
            stepName: 'First Step',
            stepType: WorkflowStepType.AGENT,
            position: 0,
          },
          {
            stepKey: 'step2',
            stepName: 'Second Step',
            stepType: WorkflowStepType.AGENT,
            position: 1,
            dependsOn: ['step1'],
          },
        ],
      };

      const expectedWorkflow = {
        ...mockWorkflow,
        steps: [
          { ...mockStep, stepKey: 'step1', stepName: 'First Step', position: 0 },
          {
            ...mockStep,
            id: 'step-2',
            stepKey: 'step2',
            stepName: 'Second Step',
            position: 1,
            dependsOn: ['step1'],
          },
        ],
      };

      // Mock transaction to execute the callback
      mockPrisma.$transaction.mockImplementation(async (callback: Function) => {
        const mockTx = {
          workflow: {
            create: jest.fn().mockResolvedValue({ id: mockWorkflowId }),
            findUnique: jest.fn().mockResolvedValue(expectedWorkflow),
          },
          workflowStep: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(mockTx);
      });

      const result = await workflowService.createWorkflow(mockUserId, input);

      expect(result).toEqual(expectedWorkflow);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error for duplicate step keys', async () => {
      const input: workflowService.CreateWorkflowInput = {
        name: 'Test Workflow',
        steps: [
          {
            stepKey: 'step1',
            stepName: 'First Step',
            stepType: WorkflowStepType.AGENT,
            position: 0,
          },
          {
            stepKey: 'step1', // Duplicate
            stepName: 'Second Step',
            stepType: WorkflowStepType.AGENT,
            position: 1,
          },
        ],
      };

      await expect(workflowService.createWorkflow(mockUserId, input)).rejects.toThrow(ApiError);
      await expect(workflowService.createWorkflow(mockUserId, input)).rejects.toThrow(
        /Duplicate step key/,
      );
    });

    it('should create a workflow without steps', async () => {
      const input: workflowService.CreateWorkflowInput = {
        name: 'Empty Workflow',
        description: 'Workflow without steps',
      };

      const expectedWorkflow = {
        ...mockWorkflow,
        name: 'Empty Workflow',
        description: 'Workflow without steps',
        steps: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: Function) => {
        const mockTx = {
          workflow: {
            create: jest.fn().mockResolvedValue({ id: mockWorkflowId }),
            findUnique: jest.fn().mockResolvedValue(expectedWorkflow),
          },
          workflowStep: {
            createMany: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await workflowService.createWorkflow(mockUserId, input);

      expect(result.steps).toHaveLength(0);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow metadata successfully', async () => {
      const workflowWithSteps = { ...mockWorkflow, steps: [mockStep] };

      mockPrisma.workflow.findFirst.mockResolvedValue(workflowWithSteps);

      const updatedWorkflow = {
        ...workflowWithSteps,
        name: 'Updated Workflow',
        status: WorkflowStatus.ACTIVE,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: Function) => {
        const mockTx = {
          workflow: {
            update: jest.fn().mockResolvedValue(updatedWorkflow),
            findUnique: jest.fn().mockResolvedValue(updatedWorkflow),
          },
          workflowStep: {
            deleteMany: jest.fn(),
            update: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const input: workflowService.UpdateWorkflowInput = {
        name: 'Updated Workflow',
        status: WorkflowStatus.ACTIVE,
      };

      const result = await workflowService.updateWorkflow(mockWorkflowId, mockUserId, input);

      expect(result.name).toBe('Updated Workflow');
      expect(result.status).toBe(WorkflowStatus.ACTIVE);
    });

    it('should throw NotFound when workflow does not exist', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      const input: workflowService.UpdateWorkflowInput = {
        name: 'Updated Name',
      };

      await expect(
        workflowService.updateWorkflow('non-existent-id', mockUserId, input),
      ).rejects.toThrow(ApiError);
      await expect(
        workflowService.updateWorkflow('non-existent-id', mockUserId, input),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Workflow not found',
      });
    });

    it('should validate steps when updating with new steps', async () => {
      const workflowWithSteps = { ...mockWorkflow, steps: [mockStep] };
      mockPrisma.workflow.findFirst.mockResolvedValue(workflowWithSteps);

      const input: workflowService.UpdateWorkflowInput = {
        steps: [
          {
            stepKey: 'stepA',
            stepName: 'Step A',
            stepType: WorkflowStepType.AGENT,
            position: 0,
            dependsOn: ['stepB'], // Creates cycle
          },
          {
            stepKey: 'stepB',
            stepName: 'Step B',
            stepType: WorkflowStepType.AGENT,
            position: 1,
            dependsOn: ['stepA'],
          },
        ],
      };

      await expect(
        workflowService.updateWorkflow(mockWorkflowId, mockUserId, input),
      ).rejects.toThrow(/Cycle detected/);
    });
  });

  describe('executeWorkflow', () => {
    it('should create an execution record for an active workflow', async () => {
      const activeWorkflow = {
        ...mockWorkflow,
        status: WorkflowStatus.ACTIVE,
        steps: [mockStep],
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(activeWorkflow);

      const mockExecution = {
        id: 'exec-123',
        workflowId: mockWorkflowId,
        userId: mockUserId,
        status: ExecutionStatus.PENDING,
        triggerType: TriggerType.MANUAL,
        triggerData: {},
        inputData: {},
        stepsTotal: 1,
        stepsCompleted: 0,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      mockPrisma.execution.create.mockResolvedValue(mockExecution);

      const result = await workflowService.executeWorkflow(mockWorkflowId, mockUserId);

      expect(result).toEqual(mockExecution);
      expect(mockPrisma.execution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: mockWorkflowId,
          userId: mockUserId,
          status: ExecutionStatus.PENDING,
          triggerType: TriggerType.MANUAL,
          stepsTotal: 1,
        }),
      });
    });

    it('should throw error for non-active workflow', async () => {
      const draftWorkflow = {
        ...mockWorkflow,
        status: WorkflowStatus.DRAFT,
        steps: [mockStep],
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(draftWorkflow);

      await expect(workflowService.executeWorkflow(mockWorkflowId, mockUserId)).rejects.toThrow(
        ApiError,
      );
      await expect(workflowService.executeWorkflow(mockWorkflowId, mockUserId)).rejects.toThrow(
        /must be ACTIVE/,
      );
    });

    it('should throw error for workflow with no steps', async () => {
      const emptyWorkflow = {
        ...mockWorkflow,
        status: WorkflowStatus.ACTIVE,
        steps: [],
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(emptyWorkflow);

      await expect(workflowService.executeWorkflow(mockWorkflowId, mockUserId)).rejects.toThrow(
        ApiError,
      );
      await expect(workflowService.executeWorkflow(mockWorkflowId, mockUserId)).rejects.toThrow(
        /no steps/,
      );
    });

    it('should throw NotFound when workflow does not exist', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      await expect(
        workflowService.executeWorkflow('non-existent-id', mockUserId),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Workflow not found',
      });
    });

    it('should support custom trigger type and input data', async () => {
      const activeWorkflow = {
        ...mockWorkflow,
        status: WorkflowStatus.ACTIVE,
        steps: [mockStep],
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(activeWorkflow);
      mockPrisma.execution.create.mockResolvedValue({
        id: 'exec-123',
        triggerType: TriggerType.API,
        inputData: { customInput: 'value' },
      });

      const input: workflowService.ExecuteWorkflowInput = {
        triggerType: TriggerType.API,
        inputData: { customInput: 'value' },
      };

      await workflowService.executeWorkflow(mockWorkflowId, mockUserId, input);

      expect(mockPrisma.execution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          triggerType: TriggerType.API,
          inputData: { customInput: 'value' },
        }),
      });
    });
  });

  describe('getWorkflowById', () => {
    it('should return workflow with steps when found', async () => {
      const workflowWithSteps = {
        ...mockWorkflow,
        steps: [mockStep, { ...mockStep, id: 'step-2', stepKey: 'step2', position: 1 }],
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(workflowWithSteps);

      const result = await workflowService.getWorkflowById(mockWorkflowId, mockUserId);

      expect(result).toEqual(workflowWithSteps);
      expect(result?.steps).toHaveLength(2);
    });

    it('should return null when workflow is not found', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      const result = await workflowService.getWorkflowById('non-existent-id', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('listWorkflows', () => {
    it('should return paginated list of workflows', async () => {
      const mockWorkflows = [
        { ...mockWorkflow, id: 'wf-1', name: 'Workflow 1' },
        { ...mockWorkflow, id: 'wf-2', name: 'Workflow 2' },
      ];

      mockPrisma.workflow.findMany.mockResolvedValue(mockWorkflows);
      mockPrisma.workflow.count.mockResolvedValue(2);

      const result = await workflowService.listWorkflows(mockUserId);

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.workflow.findMany.mockResolvedValue([]);
      mockPrisma.workflow.count.mockResolvedValue(0);

      await workflowService.listWorkflows(mockUserId, { status: WorkflowStatus.ACTIVE });

      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: WorkflowStatus.ACTIVE,
          }),
        }),
      );
    });
  });
});
