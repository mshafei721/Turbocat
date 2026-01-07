/**
 * Tests for Agent Service
 *
 * Tests the agent management functionality including:
 * - createAgent
 * - getAgentById
 * - updateAgent
 * - deleteAgent (soft delete)
 * - listAgents (pagination and filtering)
 */

import { AgentType, AgentStatus } from '@prisma/client';
import * as agentService from '../agent.service';
import { ApiError } from '../../utils/ApiError';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    agent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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

describe('Agent Service', () => {
  const mockPrisma = require('../../lib/prisma').prisma;
  const mockIsPrismaAvailable = require('../../lib/prisma').isPrismaAvailable;

  const mockUserId = 'user-123';
  const mockAgentId = 'agent-456';

  const mockAgent = {
    id: mockAgentId,
    userId: mockUserId,
    name: 'Test Agent',
    description: 'A test agent for unit testing',
    type: AgentType.CODE,
    status: AgentStatus.DRAFT,
    version: 1,
    config: {},
    capabilities: [],
    parameters: {},
    maxExecutionTime: 300,
    maxMemoryMb: 512,
    maxConcurrentExecutions: 1,
    tags: ['test', 'automation'],
    isPublic: false,
    parentId: null,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTimeMs: 0,
    lastExecutionAt: null,
    createdAt: new Date('2026-01-06T12:00:00.000Z'),
    updatedAt: new Date('2026-01-06T12:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrismaAvailable.mockReturnValue(true);
  });

  describe('createAgent', () => {
    it('should create an agent successfully with valid input', async () => {
      const input: agentService.CreateAgentInput = {
        name: 'Test Agent',
        description: 'A test agent',
        type: AgentType.CODE,
        tags: ['test'],
        isPublic: false,
      };

      const expectedAgent = {
        ...mockAgent,
        name: input.name,
        description: input.description,
        type: input.type,
        tags: input.tags,
      };

      mockPrisma.agent.create.mockResolvedValue(expectedAgent);

      const result = await agentService.createAgent(mockUserId, input);

      expect(result).toEqual(expectedAgent);
      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Agent',
          description: 'A test agent',
          type: AgentType.CODE,
          status: AgentStatus.DRAFT,
          version: 1,
          userId: mockUserId,
          tags: ['test'],
          isPublic: false,
        }),
      });
    });

    it('should create an agent with default values when optional fields are not provided', async () => {
      const input: agentService.CreateAgentInput = {
        name: 'Minimal Agent',
        type: AgentType.API,
      };

      const expectedAgent = {
        ...mockAgent,
        name: input.name,
        type: input.type,
        description: null,
        tags: [],
      };

      mockPrisma.agent.create.mockResolvedValue(expectedAgent);

      const result = await agentService.createAgent(mockUserId, input);

      expect(result).toEqual(expectedAgent);
      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Minimal Agent',
          type: AgentType.API,
          maxExecutionTime: 300,
          maxMemoryMb: 512,
          maxConcurrentExecutions: 1,
          isPublic: false,
        }),
      });
    });

    it('should trim whitespace from name and description', async () => {
      const input: agentService.CreateAgentInput = {
        name: '  Spaced Agent  ',
        description: '  Spaced description  ',
        type: AgentType.DATA,
      };

      mockPrisma.agent.create.mockResolvedValue({
        ...mockAgent,
        name: 'Spaced Agent',
        description: 'Spaced description',
      });

      await agentService.createAgent(mockUserId, input);

      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Spaced Agent',
          description: 'Spaced description',
        }),
      });
    });

    it('should throw ServiceUnavailable when database is not available', async () => {
      mockIsPrismaAvailable.mockReturnValue(false);

      const input: agentService.CreateAgentInput = {
        name: 'Test Agent',
        type: AgentType.CODE,
      };

      await expect(agentService.createAgent(mockUserId, input)).rejects.toThrow(ApiError);
      await expect(agentService.createAgent(mockUserId, input)).rejects.toMatchObject({
        statusCode: 503,
        message: 'Database not available',
      });
    });
  });

  describe('getAgentById', () => {
    it('should return an agent when found and user is owner', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);

      const result = await agentService.getAgentById(mockAgentId, mockUserId);

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.agent.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: mockAgentId,
          deletedAt: null,
        }),
      });
    });

    it('should return null when agent is not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      const result = await agentService.getAgentById('non-existent-id', mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when user is not the owner and not admin', async () => {
      const otherUserAgent = { ...mockAgent, userId: 'other-user-id' };
      mockPrisma.agent.findFirst.mockResolvedValue(otherUserAgent);

      const result = await agentService.getAgentById(mockAgentId, mockUserId, false);

      expect(result).toBeNull();
    });

    it('should return agent when user is admin regardless of ownership', async () => {
      const otherUserAgent = { ...mockAgent, userId: 'other-user-id' };
      mockPrisma.agent.findFirst.mockResolvedValue(otherUserAgent);

      const result = await agentService.getAgentById(mockAgentId, mockUserId, true);

      expect(result).toEqual(otherUserAgent);
    });
  });

  describe('updateAgent', () => {
    it('should update an agent successfully', async () => {
      const input: agentService.UpdateAgentInput = {
        name: 'Updated Agent Name',
        description: 'Updated description',
        status: AgentStatus.ACTIVE,
      };

      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.agent.update.mockResolvedValue({
        ...mockAgent,
        ...input,
      });

      const result = await agentService.updateAgent(mockAgentId, mockUserId, input);

      expect(result.name).toBe('Updated Agent Name');
      expect(result.description).toBe('Updated description');
      expect(result.status).toBe(AgentStatus.ACTIVE);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: mockAgentId },
        data: expect.objectContaining({
          name: 'Updated Agent Name',
          description: 'Updated description',
          status: AgentStatus.ACTIVE,
        }),
      });
    });

    it('should throw NotFound when agent does not exist', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      const input: agentService.UpdateAgentInput = {
        name: 'Updated Name',
      };

      await expect(agentService.updateAgent('non-existent-id', mockUserId, input)).rejects.toThrow(
        ApiError,
      );
      await expect(
        agentService.updateAgent('non-existent-id', mockUserId, input),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Agent not found',
      });
    });

    it('should only update provided fields', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.agent.update.mockResolvedValue({
        ...mockAgent,
        tags: ['new-tag'],
      });

      const input: agentService.UpdateAgentInput = {
        tags: ['new-tag'],
      };

      await agentService.updateAgent(mockAgentId, mockUserId, input);

      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: mockAgentId },
        data: { tags: ['new-tag'] },
      });
    });
  });

  describe('deleteAgent', () => {
    it('should soft delete an agent by setting deletedAt', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.agent.update.mockResolvedValue({
        ...mockAgent,
        deletedAt: new Date(),
      });

      await agentService.deleteAgent(mockAgentId, mockUserId);

      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: mockAgentId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFound when agent does not exist', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(agentService.deleteAgent('non-existent-id', mockUserId)).rejects.toThrow(
        ApiError,
      );
      await expect(agentService.deleteAgent('non-existent-id', mockUserId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Agent not found',
      });
    });

    it('should throw NotFound when user is not owner and not admin', async () => {
      const otherUserAgent = { ...mockAgent, userId: 'other-user-id' };
      mockPrisma.agent.findFirst.mockResolvedValue(otherUserAgent);

      await expect(agentService.deleteAgent(mockAgentId, mockUserId, false)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Agent not found',
      });
    });
  });

  describe('listAgents', () => {
    const mockAgentsList = [
      { ...mockAgent, id: 'agent-1', name: 'Agent 1' },
      { ...mockAgent, id: 'agent-2', name: 'Agent 2' },
      { ...mockAgent, id: 'agent-3', name: 'Agent 3' },
    ];

    it('should return paginated list of agents', async () => {
      mockPrisma.agent.findMany.mockResolvedValue(mockAgentsList);
      mockPrisma.agent.count.mockResolvedValue(3);

      const result = await agentService.listAgents(mockUserId, { page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.meta).toMatchObject({
        page: 1,
        pageSize: 10,
        totalItems: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should filter agents by type', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([mockAgentsList[0]]);
      mockPrisma.agent.count.mockResolvedValue(1);

      await agentService.listAgents(mockUserId, { type: AgentType.CODE });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: AgentType.CODE,
          }),
        }),
      );
    });

    it('should filter agents by status', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await agentService.listAgents(mockUserId, { status: AgentStatus.ACTIVE });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AgentStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.agent.findMany.mockResolvedValue(mockAgentsList.slice(0, 2));
      mockPrisma.agent.count.mockResolvedValue(5);

      const result = await agentService.listAgents(mockUserId, { page: 1, pageSize: 2 });

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.totalPages).toBe(3);
      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 2,
        }),
      );
    });

    it('should apply sorting parameters', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await agentService.listAgents(mockUserId, { sortBy: 'name', sortOrder: 'asc' });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('userOwnsAgent', () => {
    it('should return true when user owns the agent', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue({ id: mockAgentId });

      const result = await agentService.userOwnsAgent(mockAgentId, mockUserId);

      expect(result).toBe(true);
      expect(mockPrisma.agent.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockAgentId,
          userId: mockUserId,
          deletedAt: null,
        },
        select: { id: true },
      });
    });

    it('should return false when user does not own the agent', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      const result = await agentService.userOwnsAgent(mockAgentId, 'other-user');

      expect(result).toBe(false);
    });
  });
});
