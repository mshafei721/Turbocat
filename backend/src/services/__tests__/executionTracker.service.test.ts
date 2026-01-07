/**
 * Tests for Execution Tracker Service
 *
 * Tests the real-time execution tracking functionality including:
 * - ExecutionTracker class
 * - Step status tracking
 * - Progress calculation
 * - Event emission
 */

import { ExecutionStatus, StepStatus } from '@prisma/client';
import {
  ExecutionTracker,
  createExecutionTracker,
  getExecutionStatus,
  isExecutionRunning,
} from '../executionTracker.service';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    execution: {
      update: jest.fn(),
      findUnique: jest.fn(),
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

describe('ExecutionTracker', () => {
  const mockPrisma = require('../../lib/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor and initialization', () => {
    it('should create tracker with correct initial state', () => {
      const tracker = new ExecutionTracker('exec-123', 'workflow-456');

      const state = tracker.getState();
      expect(state.executionId).toBe('exec-123');
      expect(state.workflowId).toBe('workflow-456');
      expect(state.status).toBe(ExecutionStatus.PENDING);
      expect(state.progress).toBe(0);
      expect(state.stepsTotal).toBe(0);
    });

    it('should initialize with workflow steps', async () => {
      const tracker = new ExecutionTracker('exec-123', 'workflow-456');

      await tracker.initialize([
        { stepKey: 'step1', stepName: 'Step 1' },
        { stepKey: 'step2', stepName: 'Step 2' },
        { stepKey: 'step3', stepName: 'Step 3' },
      ]);

      const state = tracker.getState();
      expect(state.stepsTotal).toBe(3);
      expect(state.stepsPending).toBe(3);
      expect(state.steps.size).toBe(3);

      const step1 = tracker.getStepState('step1');
      expect(step1?.status).toBe(StepStatus.PENDING);
      expect(step1?.stepName).toBe('Step 1');

      tracker.destroy();
    });
  });

  describe('step tracking', () => {
    let tracker: ExecutionTracker;

    beforeEach(async () => {
      tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000, // Long interval to prevent interference
      });

      await tracker.initialize([
        { stepKey: 'step1', stepName: 'Step 1' },
        { stepKey: 'step2', stepName: 'Step 2' },
      ]);
    });

    afterEach(() => {
      tracker.destroy();
    });

    it('should start execution', () => {
      tracker.start();

      const state = tracker.getState();
      expect(state.status).toBe(ExecutionStatus.RUNNING);
      expect(state.startedAt).toBeDefined();
    });

    it('should track step start', () => {
      tracker.start();
      tracker.startStep('step1');

      const state = tracker.getState();
      expect(state.stepsRunning).toBe(1);
      expect(state.stepsPending).toBe(1);
      expect(state.currentStep).toBe('step1');

      const step1 = tracker.getStepState('step1');
      expect(step1?.status).toBe(StepStatus.RUNNING);
      expect(step1?.startedAt).toBeDefined();
    });

    it('should track step completion', () => {
      tracker.start();
      tracker.startStep('step1');
      tracker.completeStep('step1', { result: 'success' });

      const state = tracker.getState();
      expect(state.stepsCompleted).toBe(1);
      expect(state.stepsRunning).toBe(0);
      expect(state.progress).toBe(50); // 1 of 2 steps

      const step1 = tracker.getStepState('step1');
      expect(step1?.status).toBe(StepStatus.COMPLETED);
      expect(step1?.output).toEqual({ result: 'success' });
      expect(step1?.completedAt).toBeDefined();
      expect(step1?.durationMs).toBeDefined();
    });

    it('should track step failure', () => {
      tracker.start();
      tracker.startStep('step1');
      tracker.failStep('step1', 'Something went wrong');

      const state = tracker.getState();
      expect(state.stepsFailed).toBe(1);
      expect(state.stepsRunning).toBe(0);
      expect(state.progress).toBe(50);

      const step1 = tracker.getStepState('step1');
      expect(step1?.status).toBe(StepStatus.FAILED);
      expect(step1?.error).toBe('Something went wrong');
    });

    it('should track step skip', () => {
      tracker.start();
      tracker.skipStep('step1', 'Dependency failed');

      const state = tracker.getState();
      expect(state.stepsSkipped).toBe(1);
      expect(state.stepsPending).toBe(1);
      expect(state.progress).toBe(50);

      const step1 = tracker.getStepState('step1');
      expect(step1?.status).toBe(StepStatus.SKIPPED);
      expect(step1?.error).toBe('Dependency failed');
    });

    it('should track step retry', () => {
      tracker.start();
      tracker.startStep('step1');
      tracker.recordRetry('step1', 1);

      const step1 = tracker.getStepState('step1');
      expect(step1?.retryCount).toBe(1);
    });

    it('should handle unknown step gracefully', () => {
      tracker.start();
      tracker.startStep('unknown-step');

      const state = tracker.getState();
      expect(state.stepsRunning).toBe(0);
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress correctly', async () => {
      const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
      });

      await tracker.initialize([
        { stepKey: 'step1', stepName: 'Step 1' },
        { stepKey: 'step2', stepName: 'Step 2' },
        { stepKey: 'step3', stepName: 'Step 3' },
        { stepKey: 'step4', stepName: 'Step 4' },
      ]);

      tracker.start();
      expect(tracker.getProgress()).toBe(0);

      tracker.startStep('step1');
      tracker.completeStep('step1');
      expect(tracker.getProgress()).toBe(25);

      tracker.startStep('step2');
      tracker.completeStep('step2');
      expect(tracker.getProgress()).toBe(50);

      tracker.startStep('step3');
      tracker.failStep('step3', 'error');
      expect(tracker.getProgress()).toBe(75);

      tracker.skipStep('step4');
      expect(tracker.getProgress()).toBe(100);

      tracker.destroy();
    });
  });

  describe('event emission', () => {
    let tracker: ExecutionTracker;

    beforeEach(async () => {
      tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
      });

      await tracker.initialize([{ stepKey: 'step1', stepName: 'Step 1' }]);
    });

    afterEach(() => {
      tracker.destroy();
    });

    it('should emit statusUpdate event on start', (done) => {
      tracker.on('statusUpdate', (event) => {
        expect(event.executionId).toBe('exec-123');
        expect(event.previousStatus).toBe(ExecutionStatus.PENDING);
        expect(event.currentStatus).toBe(ExecutionStatus.RUNNING);
        done();
      });

      tracker.start();
    });

    it('should emit stepStatusChange event on step completion', (done) => {
      tracker.start();
      tracker.startStep('step1');

      tracker.on('stepStatusChange', (event) => {
        if (event.currentStatus === StepStatus.COMPLETED) {
          expect(event.executionId).toBe('exec-123');
          expect(event.stepKey).toBe('step1');
          expect(event.previousStatus).toBe(StepStatus.RUNNING);
          expect(event.durationMs).toBeDefined();
          done();
        }
      });

      tracker.completeStep('step1');
    });
  });

  describe('finalization', () => {
    it('should finalize execution', async () => {
      mockPrisma.execution.update.mockResolvedValue({});

      const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
      });

      await tracker.initialize([{ stepKey: 'step1', stepName: 'Step 1' }]);

      tracker.start();
      tracker.startStep('step1');
      tracker.completeStep('step1', { result: 'done' });

      await tracker.finalize(ExecutionStatus.COMPLETED, { output: 'final' });

      expect(tracker.isComplete()).toBe(true);
      expect(tracker.getState().status).toBe(ExecutionStatus.COMPLETED);

      expect(mockPrisma.execution.update).toHaveBeenCalledWith({
        where: { id: 'exec-123' },
        data: expect.objectContaining({
          status: ExecutionStatus.COMPLETED,
          stepsCompleted: 1,
          stepsFailed: 0,
        }),
      });

      tracker.destroy();
    });

    it('should not finalize twice', async () => {
      mockPrisma.execution.update.mockResolvedValue({});

      const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
      });

      await tracker.initialize([]);
      tracker.start();

      await tracker.finalize(ExecutionStatus.COMPLETED);
      await tracker.finalize(ExecutionStatus.FAILED);

      expect(mockPrisma.execution.update).toHaveBeenCalledTimes(1);

      tracker.destroy();
    });
  });

  describe('intermediate results', () => {
    it('should store intermediate results', async () => {
      const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
        storeIntermediateResults: true,
      });

      await tracker.initialize([{ stepKey: 'step1', stepName: 'Step 1' }]);

      tracker.start();
      tracker.startStep('step1');
      tracker.completeStep('step1', { data: 'test' });

      const state = tracker.getState();
      expect(state.intermediateResults['step1']).toEqual({ data: 'test' });

      tracker.destroy();
    });

    it('should respect intermediate results size limit', async () => {
      const tracker = new ExecutionTracker('exec-123', 'workflow-456', {
        dbUpdateIntervalMs: 10000,
        storeIntermediateResults: true,
        maxIntermediateResultsSize: 50, // Very small limit
      });

      await tracker.initialize([{ stepKey: 'step1', stepName: 'Step 1' }]);

      tracker.start();
      tracker.startStep('step1');
      tracker.completeStep('step1', { largeData: 'x'.repeat(100) }); // Exceeds limit

      const state = tracker.getState();
      expect(state.intermediateResults['step1']).toBeUndefined();

      tracker.destroy();
    });
  });
});

describe('Utility Functions', () => {
  const mockPrisma = require('../../lib/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExecutionTracker', () => {
    it('should create tracker instance', () => {
      const tracker = createExecutionTracker('exec-123', 'workflow-456');

      expect(tracker).toBeInstanceOf(ExecutionTracker);
      expect(tracker.workflowId).toBe('workflow-456');

      tracker.destroy();
    });
  });

  describe('getExecutionStatus', () => {
    it('should get execution status from database', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        status: ExecutionStatus.RUNNING,
        stepsCompleted: 5,
        stepsFailed: 1,
        stepsTotal: 10,
      });

      const result = await getExecutionStatus('exec-123');

      expect(result).toEqual({
        status: ExecutionStatus.RUNNING,
        progress: 60, // (5 + 1) / 10 * 100
        stepsCompleted: 5,
        stepsFailed: 1,
        stepsTotal: 10,
      });
    });

    it('should return null for non-existent execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      const result = await getExecutionStatus('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('isExecutionRunning', () => {
    it('should return true for PENDING status', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        status: ExecutionStatus.PENDING,
      });

      const result = await isExecutionRunning('exec-123');

      expect(result).toBe(true);
    });

    it('should return true for RUNNING status', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        status: ExecutionStatus.RUNNING,
      });

      const result = await isExecutionRunning('exec-123');

      expect(result).toBe(true);
    });

    it('should return false for COMPLETED status', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue({
        status: ExecutionStatus.COMPLETED,
      });

      const result = await isExecutionRunning('exec-123');

      expect(result).toBe(false);
    });

    it('should return false for non-existent execution', async () => {
      mockPrisma.execution.findUnique.mockResolvedValue(null);

      const result = await isExecutionRunning('invalid-id');

      expect(result).toBe(false);
    });
  });
});
