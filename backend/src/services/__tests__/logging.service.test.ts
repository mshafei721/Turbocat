/**
 * Tests for Logging Service
 *
 * Tests the execution logging functionality including:
 * - logExecutionEvent
 * - logStepEvent
 * - logBatchEvents
 * - getExecutionLogs
 * - getLogCountsByLevel
 */

import { LogLevel, StepStatus } from '@prisma/client';
import * as loggingService from '../logging.service';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    executionLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
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

describe('Logging Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logExecutionEvent', () => {
    it('should log an execution event with basic parameters', async () => {
      const mockLog = {
        id: 'log-123',
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: 'Test message',
        metadata: {},
        createdAt: new Date(),
      };

      mockPrisma.executionLog.create.mockResolvedValue(mockLog);

      const result = await loggingService.logExecutionEvent({
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: 'Test message',
      });

      expect(result).toEqual(mockLog);
      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          executionId: 'exec-123',
          level: LogLevel.INFO,
          message: 'Test message',
        }),
      });
    });

    it('should log an execution event with metadata', async () => {
      const mockLog = {
        id: 'log-123',
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: 'Test message',
        metadata: { key: 'value' },
        createdAt: new Date(),
      };

      mockPrisma.executionLog.create.mockResolvedValue(mockLog);

      await loggingService.logExecutionEvent({
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: 'Test message',
        metadata: { key: 'value' },
      });

      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { key: 'value' },
        }),
      });
    });

    it('should log a step event with step information', async () => {
      const mockLog = {
        id: 'log-123',
        executionId: 'exec-123',
        workflowStepId: 'step-123',
        stepKey: 'step1',
        stepStatus: StepStatus.COMPLETED,
        level: LogLevel.INFO,
        message: 'Step completed',
        createdAt: new Date(),
      };

      mockPrisma.executionLog.create.mockResolvedValue(mockLog);

      await loggingService.logExecutionEvent({
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: 'Step completed',
        workflowStepId: 'step-123',
        stepKey: 'step1',
        stepStatus: StepStatus.COMPLETED,
        stepDurationMs: 1000,
      });

      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowStepId: 'step-123',
          stepKey: 'step1',
          stepStatus: StepStatus.COMPLETED,
          stepDurationMs: 1000,
        }),
      });
    });
  });

  describe('logStepEvent', () => {
    it('should log a step event with formatted message', async () => {
      const mockLog = {
        id: 'log-123',
        executionId: 'exec-123',
        level: LogLevel.INFO,
        message: '[Test Step] Processing data',
        createdAt: new Date(),
      };

      mockPrisma.executionLog.create.mockResolvedValue(mockLog);

      await loggingService.logStepEvent(
        'exec-123',
        'step1',
        'Test Step',
        LogLevel.INFO,
        'Processing data',
      );

      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          executionId: 'exec-123',
          message: '[Test Step] Processing data',
          stepKey: 'step1',
        }),
      });
    });

    it('should include step status and duration', async () => {
      mockPrisma.executionLog.create.mockResolvedValue({
        id: 'log-123',
        executionId: 'exec-123',
        level: LogLevel.INFO,
        createdAt: new Date(),
      });

      await loggingService.logStepEvent(
        'exec-123',
        'step1',
        'Test Step',
        LogLevel.INFO,
        'Completed',
        {
          stepStatus: StepStatus.COMPLETED,
          stepDurationMs: 500,
        },
      );

      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stepStatus: StepStatus.COMPLETED,
          stepDurationMs: 500,
        }),
      });
    });
  });

  describe('logBatchEvents', () => {
    it('should batch log multiple events', async () => {
      mockPrisma.executionLog.createMany.mockResolvedValue({ count: 3 });

      const entries = [
        { level: LogLevel.INFO, message: 'Event 1' },
        { level: LogLevel.INFO, message: 'Event 2' },
        { level: LogLevel.WARN, message: 'Event 3' },
      ];

      const count = await loggingService.logBatchEvents('exec-123', entries);

      expect(count).toBe(3);
      expect(mockPrisma.executionLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ executionId: 'exec-123', message: 'Event 1' }),
          expect.objectContaining({ executionId: 'exec-123', message: 'Event 2' }),
          expect.objectContaining({ executionId: 'exec-123', message: 'Event 3' }),
        ]),
      });
    });

    it('should return 0 for empty entries array', async () => {
      const count = await loggingService.logBatchEvents('exec-123', []);

      expect(count).toBe(0);
      expect(mockPrisma.executionLog.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getExecutionLogs', () => {
    it('should get logs with default parameters', async () => {
      const mockLogs = [
        { id: 'log-1', message: 'Log 1', createdAt: new Date() },
        { id: 'log-2', message: 'Log 2', createdAt: new Date() },
      ];

      mockPrisma.executionLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.executionLog.count.mockResolvedValue(2);

      const result = await loggingService.getExecutionLogs('exec-123');

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter logs by level', async () => {
      mockPrisma.executionLog.findMany.mockResolvedValue([]);
      mockPrisma.executionLog.count.mockResolvedValue(0);

      await loggingService.getExecutionLogs('exec-123', { level: LogLevel.ERROR });

      expect(mockPrisma.executionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            executionId: 'exec-123',
            level: LogLevel.ERROR,
          }),
        }),
      );
    });

    it('should filter logs by stepKey', async () => {
      mockPrisma.executionLog.findMany.mockResolvedValue([]);
      mockPrisma.executionLog.count.mockResolvedValue(0);

      await loggingService.getExecutionLogs('exec-123', { stepKey: 'step1' });

      expect(mockPrisma.executionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            executionId: 'exec-123',
            stepKey: 'step1',
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const mockLogs = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `log-${i}`,
          message: `Log ${i}`,
          createdAt: new Date(),
        }));

      mockPrisma.executionLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.executionLog.count.mockResolvedValue(25);

      const result = await loggingService.getExecutionLogs('exec-123', {
        limit: 10,
        offset: 0,
      });

      expect(result.hasMore).toBe(true);
      expect(mockPrisma.executionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('getLogCountsByLevel', () => {
    it('should return counts by log level', async () => {
      mockPrisma.executionLog.groupBy.mockResolvedValue([
        { level: LogLevel.INFO, _count: { id: 5 } },
        { level: LogLevel.ERROR, _count: { id: 2 } },
        { level: LogLevel.WARN, _count: { id: 1 } },
      ]);

      const result = await loggingService.getLogCountsByLevel('exec-123');

      expect(result[LogLevel.INFO]).toBe(5);
      expect(result[LogLevel.ERROR]).toBe(2);
      expect(result[LogLevel.WARN]).toBe(1);
      expect(result[LogLevel.DEBUG]).toBe(0);
      expect(result[LogLevel.FATAL]).toBe(0);
    });
  });

  describe('getLatestLog', () => {
    it('should return the latest log entry', async () => {
      const mockLog = {
        id: 'log-123',
        message: 'Latest log',
        createdAt: new Date(),
      };

      mockPrisma.executionLog.findFirst.mockResolvedValue(mockLog);

      const result = await loggingService.getLatestLog('exec-123');

      expect(result).toEqual(mockLog);
      expect(mockPrisma.executionLog.findFirst).toHaveBeenCalledWith({
        where: { executionId: 'exec-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null if no logs found', async () => {
      mockPrisma.executionLog.findFirst.mockResolvedValue(null);

      const result = await loggingService.getLatestLog('exec-123');

      expect(result).toBeNull();
    });
  });

  describe('deleteOldLogs', () => {
    it('should delete logs older than specified date', async () => {
      mockPrisma.executionLog.deleteMany.mockResolvedValue({ count: 100 });

      const olderThan = new Date('2024-01-01');
      const count = await loggingService.deleteOldLogs(olderThan);

      expect(count).toBe(100);
      expect(mockPrisma.executionLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: olderThan },
        },
      });
    });
  });
});
