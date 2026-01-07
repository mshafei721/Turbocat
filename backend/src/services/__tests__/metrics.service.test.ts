/**
 * Tests for Metrics Service
 *
 * Tests the execution metrics functionality including:
 * - calculatePercentiles
 * - collectExecutionMetrics
 * - updateWorkflowMetrics
 * - updateAgentMetrics
 * - getWorkflowExecutionStats
 */

import { ExecutionStatus, StepStatus } from '@prisma/client';
import * as metricsService from '../metrics.service';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    execution: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    executionLog: {
      findMany: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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

describe('Metrics Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePercentiles', () => {
    it('should return zeros for empty array', () => {
      const result = metricsService.calculatePercentiles([]);

      expect(result).toEqual({
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
      });
    });

    it('should calculate percentiles for a single value', () => {
      const result = metricsService.calculatePercentiles([100]);

      expect(result.min).toBe(100);
      expect(result.max).toBe(100);
      expect(result.avg).toBe(100);
      expect(result.count).toBe(1);
    });

    it('should calculate percentiles for multiple values', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = metricsService.calculatePercentiles(values);

      expect(result.min).toBe(10);
      expect(result.max).toBe(100);
      expect(result.avg).toBe(55);
      expect(result.count).toBe(10);
      expect(result.p50).toBeGreaterThanOrEqual(50);
      expect(result.p50).toBeLessThanOrEqual(60);
      expect(result.p95).toBeGreaterThanOrEqual(90);
      expect(result.p99).toBeGreaterThanOrEqual(95);
    });

    it('should handle unsorted input', () => {
      const values = [50, 10, 90, 30, 70, 20, 80, 40, 60, 100];
      const result = metricsService.calculatePercentiles(values);

      expect(result.min).toBe(10);
      expect(result.max).toBe(100);
    });
  });

  describe('collectExecutionMetrics', () => {
    it('should collect metrics from execution and logs', async () => {
      const mockExecution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        durationMs: 5000,
        stepsTotal: 3,
        logs: [
          { stepKey: 'step1', stepStatus: StepStatus.COMPLETED, stepDurationMs: 1000 },
          { stepKey: 'step2', stepStatus: StepStatus.COMPLETED, stepDurationMs: 2000 },
          { stepKey: 'step3', stepStatus: StepStatus.FAILED, stepDurationMs: 500 },
        ],
      };

      mockPrisma.execution.findUnique.mockResolvedValue(mockExecution);

      const result = await metricsService.collectExecutionMetrics('exec-123');

      expect(result.executionId).toBe('exec-123');
      expect(result.workflowId).toBe('workflow-123');
      expect(result.totalDurationMs).toBe(5000);
      expect(result.stepsCompleted).toBe(2);
      expect(result.stepsFailed).toBe(1);
      expect(result.stepsTotal).toBe(3);
      expect(result.stepDurations['step1']).toBe(1000);
      expect(result.stepDurations['step2']).toBe(2000);
      expect(result.stepStatuses['step1']).toBe(StepStatus.COMPLETED);
      expect(result.stepStatuses['step3']).toBe(StepStatus.FAILED);
    });

    it('should throw error if execution not found', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      await expect(metricsService.collectExecutionMetrics('invalid-id')).rejects.toThrow(
        'Execution not found',
      );
    });

    it('should handle execution with no logs', async () => {
      const mockExecution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        durationMs: 1000,
        stepsTotal: 0,
        logs: [],
      };

      mockPrisma.execution.findUnique.mockResolvedValue(mockExecution);

      const result = await metricsService.collectExecutionMetrics('exec-123');

      expect(result.stepsCompleted).toBe(0);
      expect(result.stepsFailed).toBe(0);
      expect(Object.keys(result.stepDurations)).toHaveLength(0);
    });
  });

  describe('updateWorkflowMetrics', () => {
    it('should update workflow metrics correctly', async () => {
      const mockWorkflow = {
        totalExecutions: 10,
        successfulExecutions: 8,
        failedExecutions: 2,
        avgExecutionTimeMs: 5000,
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.update.mockResolvedValue({});

      await metricsService.updateWorkflowMetrics('workflow-123', {
        totalExecutions: 1,
        successfulExecutions: 1,
        executionDurationMs: 3000,
        lastExecutionAt: new Date(),
      });

      expect(mockPrisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-123' },
        data: expect.objectContaining({
          totalExecutions: 11,
          successfulExecutions: 9,
          failedExecutions: 2,
        }),
      });
    });

    it('should handle non-existent workflow gracefully', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      // Should not throw
      await metricsService.updateWorkflowMetrics('invalid-id', {
        totalExecutions: 1,
      });

      expect(mockPrisma.workflow.update).not.toHaveBeenCalled();
    });

    it('should recalculate average execution time', async () => {
      const mockWorkflow = {
        totalExecutions: 4,
        successfulExecutions: 4,
        failedExecutions: 0,
        avgExecutionTimeMs: 1000, // Previous average of 1000ms for 4 executions
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.update.mockResolvedValue({});

      await metricsService.updateWorkflowMetrics('workflow-123', {
        totalExecutions: 1,
        successfulExecutions: 1,
        executionDurationMs: 2000, // New execution took 2000ms
      });

      // Expected: (1000 * 4 + 2000 * 1) / 5 = 1200
      expect(mockPrisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-123' },
        data: expect.objectContaining({
          avgExecutionTimeMs: 1200,
        }),
      });
    });
  });

  describe('updateAgentMetrics', () => {
    it('should update agent metrics correctly', async () => {
      const mockAgent = {
        totalExecutions: 50,
        successfulExecutions: 45,
        failedExecutions: 5,
        avgExecutionTimeMs: 2000,
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrisma.agent.update.mockResolvedValue({});

      await metricsService.updateAgentMetrics('agent-123', {
        totalExecutions: 1,
        failedExecutions: 1,
        executionDurationMs: 500,
      });

      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          totalExecutions: 51,
          successfulExecutions: 45,
          failedExecutions: 6,
        }),
      });
    });

    it('should handle non-existent agent gracefully', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      // Should not throw
      await metricsService.updateAgentMetrics('invalid-id', {
        totalExecutions: 1,
      });

      expect(mockPrisma.agent.update).not.toHaveBeenCalled();
    });
  });

  describe('getWorkflowExecutionStats', () => {
    it('should return execution statistics', async () => {
      mockPrisma.execution.groupBy.mockResolvedValue([
        { status: ExecutionStatus.COMPLETED, _count: { id: 80 } },
        { status: ExecutionStatus.FAILED, _count: { id: 15 } },
        { status: ExecutionStatus.CANCELLED, _count: { id: 5 } },
      ]);

      mockPrisma.execution.aggregate.mockResolvedValue({
        _avg: { durationMs: 3000 },
      });

      const result = await metricsService.getWorkflowExecutionStats('workflow-123');

      expect(result.total).toBe(100);
      expect(result.completed).toBe(80);
      expect(result.failed).toBe(15);
      expect(result.cancelled).toBe(5);
      expect(result.successRate).toBe(80);
      expect(result.avgDurationMs).toBe(3000);
    });

    it('should return zero stats for workflow with no executions', async () => {
      mockPrisma.execution.groupBy.mockResolvedValue([]);
      mockPrisma.execution.aggregate.mockResolvedValue({
        _avg: { durationMs: null },
      });

      const result = await metricsService.getWorkflowExecutionStats('workflow-123');

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.avgDurationMs).toBe(0);
    });
  });

  describe('recordStepDurations', () => {
    it('should calculate stats for step duration entries', () => {
      const entries = [
        { stepKey: 'step1', durationMs: 1000, status: StepStatus.COMPLETED },
        { stepKey: 'step2', durationMs: 2000, status: StepStatus.COMPLETED },
        { stepKey: 'step3', durationMs: 500, status: StepStatus.FAILED },
      ];

      const result = metricsService.recordStepDurations(entries);

      expect(result.totalDurationMs).toBe(3500);
      expect(result.avgDurationMs).toBe(1167); // Math.round(3500/3)
      expect(result.completed).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should return zeros for empty entries', () => {
      const result = metricsService.recordStepDurations([]);

      expect(result.totalDurationMs).toBe(0);
      expect(result.avgDurationMs).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('calculateWorkflowPercentiles', () => {
    it('should calculate percentiles for workflow executions', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([
        { durationMs: 1000 },
        { durationMs: 2000 },
        { durationMs: 3000 },
        { durationMs: 4000 },
        { durationMs: 5000 },
        { durationMs: 6000 },
        { durationMs: 7000 },
        { durationMs: 8000 },
        { durationMs: 9000 },
        { durationMs: 10000 },
      ]);

      const result = await metricsService.calculateWorkflowPercentiles('workflow-123');

      expect(result.min).toBe(1000);
      expect(result.max).toBe(10000);
      expect(result.count).toBe(10);
      expect(result.p50).toBeGreaterThanOrEqual(5000);
      expect(result.p50).toBeLessThanOrEqual(6000);
    });

    it('should return zeros for workflow with no completed executions', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);

      const result = await metricsService.calculateWorkflowPercentiles('workflow-123');

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.count).toBe(0);
    });
  });
});
