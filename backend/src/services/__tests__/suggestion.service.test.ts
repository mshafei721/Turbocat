/**
 * Suggestion Service Unit Tests
 *
 * Tests for SuggestionService methods:
 * - getSuggestions: Main method to get suggestions for a project
 * - Starter suggestions: For new projects with <= 1 message
 * - Contextual suggestions: For existing projects based on chat history
 * - Project state analysis: Feature detection via regex
 *
 * @module services/__tests__/suggestion.service.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as SuggestionService from '../suggestion.service';
import { ApiError } from '../../utils/ApiError';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    workflow: {
      findFirst: jest.fn(),
    },
  },
  isPrismaAvailable: jest.fn(() => true),
}));

// Import mocked prisma to access the mock
import { prisma } from '../../lib/prisma';
const mockedWorkflow = (prisma as any).workflow;

// Mock logger to avoid console output during tests
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

/**
 * Reset all mocks before each test
 */
const resetMocks = () => {
  jest.clearAllMocks();
};

describe('Suggestion Service', () => {
  const userId = 'test-user-id';
  const projectId = 'test-project-id';

  beforeEach(() => {
    resetMocks();
  });

  // ==========================================================================
  // getSuggestions Tests
  // ==========================================================================
  describe('getSuggestions', () => {
    it('should throw error if project not found', async () => {
      mockedWorkflow.findFirst.mockResolvedValue(null);

      await expect(SuggestionService.getSuggestions(userId, projectId)).rejects.toThrow(ApiError);

      await expect(SuggestionService.getSuggestions(userId, projectId)).rejects.toThrow(
        'Project not found',
      );
    });

    it('should return starter suggestions for new project (0 messages)', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
      expect(suggestions[0]!.category).toBe('starter');
      expect(suggestions[0]!.text).toBe('AI Chat');
      expect(suggestions[0]!.priority).toBe(10);
    });

    it('should return starter suggestions for new project (1 message)', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'web',
        chatMessages: [{ id: 'msg1', content: 'Hello', createdAt: new Date() }],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
      expect(suggestions[0]!.category).toBe('starter');
    });

    it('should return contextual suggestions for project with messages', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [
          { id: 'msg1', content: 'Create a todo app', createdAt: new Date() },
          { id: 'msg2', content: 'Add a button', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
      expect(suggestions.some((s) => s.text === 'Add dark mode')).toBe(true);
      expect(suggestions.some((s) => s.text === 'Add authentication')).toBe(true);
    });

    it('should verify ownership before returning suggestions', async () => {
      mockedWorkflow.findFirst.mockResolvedValue(null);

      await expect(SuggestionService.getSuggestions('wrong-user-id', projectId)).rejects.toThrow(
        'Project not found',
      );

      expect(mockedWorkflow.findFirst).toHaveBeenCalledWith({
        where: {
          id: projectId,
          userId: 'wrong-user-id',
          deletedAt: null,
        },
        include: {
          chatMessages: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    });
  });

  // ==========================================================================
  // Starter Suggestions Tests
  // ==========================================================================
  describe('Starter Suggestions', () => {
    it('should include mobile-specific starters for mobile platform', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
      // Mobile-specific suggestions should be in the top 6
      const texts = suggestions.map((s) => s.text);
      expect(texts).toContain('Habit Tracker');
    });

    it('should include web-specific starters for web platform', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'web',
        chatMessages: [],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
      // Web-specific suggestions should be in the top 6
      const texts = suggestions.map((s) => s.text);
      expect(texts).toContain('Portfolio Site');
    });

    it('should return only common starters for both platform', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'both',
        chatMessages: [],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(5); // Only common starters
      const texts = suggestions.map((s) => s.text);
      expect(texts).toContain('AI Chat');
      expect(texts).toContain('Mood Tracker');
      expect(texts).not.toContain('Habit Tracker'); // Mobile-specific
      expect(texts).not.toContain('Portfolio Site'); // Web-specific
    });

    it('should sort suggestions by priority (descending)', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      // Check priorities are descending
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i]!.priority).toBeGreaterThanOrEqual(suggestions[i + 1]!.priority);
      }
    });
  });

  // ==========================================================================
  // Contextual Suggestions Tests
  // ==========================================================================
  describe('Contextual Suggestions', () => {
    it('should suggest dark mode when not mentioned', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'web',
        chatMessages: [
          { id: 'msg1', content: 'Create a todo app', createdAt: new Date() },
          { id: 'msg2', content: 'Add a button', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Add dark mode')).toBe(true);
    });

    it('should NOT suggest dark mode when already mentioned', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'web',
        chatMessages: [
          { id: 'msg1', content: 'Create a todo app with dark mode', createdAt: new Date() },
          { id: 'msg2', content: 'Make sure dark mode works', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Add dark mode')).toBe(false);
    });

    it('should suggest authentication when not mentioned', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [
          { id: 'msg1', content: 'Create a social app', createdAt: new Date() },
          { id: 'msg2', content: 'Add posts', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Add authentication')).toBe(true);
    });

    it('should NOT suggest authentication when mentioned', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [
          { id: 'msg1', content: 'Add login screen', createdAt: new Date() },
          { id: 'msg2', content: 'Implement authentication', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Add authentication')).toBe(false);
    });

    it('should suggest navigation for projects with >5 messages without nav', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [
          { id: 'msg1', content: 'Screen 1', createdAt: new Date() },
          { id: 'msg2', content: 'Screen 2', createdAt: new Date() },
          { id: 'msg3', content: 'Screen 3', createdAt: new Date() },
          { id: 'msg4', content: 'Screen 4', createdAt: new Date() },
          { id: 'msg5', content: 'Screen 5', createdAt: new Date() },
          { id: 'msg6', content: 'Screen 6', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Add navigation')).toBe(true);
    });

    it('should always suggest design improvements', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'web',
        chatMessages: [
          { id: 'msg1', content: 'Create app', createdAt: new Date() },
          { id: 'msg2', content: 'Done', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions.some((s) => s.text === 'Improve color scheme')).toBe(true);
      expect(suggestions.some((s) => s.text === 'Add loading states')).toBe(true);
      expect(suggestions.some((s) => s.text === 'Improve accessibility')).toBe(true);
    });

    it('should return max 6 suggestions', async () => {
      mockedWorkflow.findFirst.mockResolvedValue({
        id: projectId,
        userId,
        platform: 'mobile',
        chatMessages: [
          { id: 'msg1', content: 'Create app', createdAt: new Date() },
          { id: 'msg2', content: 'Screen 2', createdAt: new Date() },
          { id: 'msg3', content: 'Screen 3', createdAt: new Date() },
          { id: 'msg4', content: 'Screen 4', createdAt: new Date() },
          { id: 'msg5', content: 'Screen 5', createdAt: new Date() },
          { id: 'msg6', content: 'Screen 6', createdAt: new Date() },
        ],
        deletedAt: null,
        name: 'Test Project',
        description: null,
        status: 'DRAFT',
        version: 1,
        parentId: null,
        definition: {},
        triggerConfig: {},
        scheduleEnabled: false,
        scheduleCron: null,
        scheduleTimezone: 'UTC',
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTimeMs: 0,
        lastExecutionAt: null,
        tags: [],
        isPublic: false,
        projectName: null,
        selectedModel: null,
        thumbnailUrl: null,
        previewCode: null,
        previewError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const suggestions = await SuggestionService.getSuggestions(userId, projectId);

      expect(suggestions).toHaveLength(6);
    });
  });
});
