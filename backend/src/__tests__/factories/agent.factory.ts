/**
 * Agent Factory
 *
 * Factory for creating test agent data and database records.
 * Supports both raw data generation and database persistence.
 *
 * Usage:
 * ```typescript
 * // Generate raw data (no database)
 * const agentData = agentFactory.build({ userId: 'user-123' });
 *
 * // Create in database (requires existing user)
 * const agent = await agentFactory.create({ userId: user.id });
 *
 * // Create with dependencies (creates user automatically)
 * const agent = await agentFactory.createWithUser();
 * ```
 *
 * @module __tests__/factories/agent.factory
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentType, AgentStatus, User, Prisma } from '@prisma/client';
import { getTestPrisma } from '../integration/setup';
import { userFactory } from './user.factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for building agent data
 */
export interface AgentFactoryInput {
  id?: string;
  name?: string;
  description?: string | null;
  type?: AgentType;
  status?: AgentStatus;
  version?: number;
  parentId?: string | null;
  userId?: string;
  config?: Prisma.InputJsonValue;
  capabilities?: Prisma.InputJsonValue;
  parameters?: Prisma.InputJsonValue;
  maxExecutionTime?: number | null;
  maxMemoryMb?: number | null;
  maxConcurrentExecutions?: number | null;
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  avgExecutionTimeMs?: number;
  tags?: string[];
  isPublic?: boolean;
  isTemplate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Raw agent data without database-generated fields
 */
export interface AgentBuildData {
  id: string;
  name: string;
  description: string | null;
  type: AgentType;
  status: AgentStatus;
  version: number;
  parentId: string | null;
  userId: string;
  config: Prisma.InputJsonValue;
  capabilities: Prisma.InputJsonValue;
  parameters: Prisma.InputJsonValue;
  maxExecutionTime: number | null;
  maxMemoryMb: number | null;
  maxConcurrentExecutions: number | null;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTimeMs: number;
  tags: string[];
  isPublic: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Agent with its owner user
 */
export interface AgentWithUser {
  agent: Agent;
  user: User;
}

// ============================================================================
// Helpers
// ============================================================================

let agentCounter = 0;

/**
 * Generate a unique agent name
 */
const generateAgentName = (): string => {
  agentCounter += 1;
  return `Test Agent ${agentCounter}`;
};

// ============================================================================
// Factory
// ============================================================================

/**
 * Agent Factory
 *
 * Provides methods to build and create agent test data
 */
export const agentFactory = {
  /**
   * Build agent data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Agent data object
   *
   * Usage:
   * ```typescript
   * const agentData = agentFactory.build({ userId: 'user-123' });
   * const llmAgent = agentFactory.build({ userId: 'user-123', type: AgentType.LLM });
   * ```
   */
  build: (overrides: AgentFactoryInput = {}): AgentBuildData => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      name: overrides.name ?? generateAgentName(),
      description: overrides.description ?? 'A test agent for integration testing',
      type: overrides.type ?? AgentType.CODE,
      status: overrides.status ?? AgentStatus.DRAFT,
      version: overrides.version ?? 1,
      parentId: overrides.parentId ?? null,
      userId: overrides.userId ?? uuidv4(), // Must be provided for database operations
      config: overrides.config ?? {
        runtime: 'node',
        entrypoint: 'index.js',
      },
      capabilities: overrides.capabilities ?? ['execute', 'read'],
      parameters: overrides.parameters ?? {
        timeout: 30000,
        retries: 3,
      },
      maxExecutionTime: overrides.maxExecutionTime ?? 300,
      maxMemoryMb: overrides.maxMemoryMb ?? 512,
      maxConcurrentExecutions: overrides.maxConcurrentExecutions ?? 1,
      totalExecutions: overrides.totalExecutions ?? 0,
      successfulExecutions: overrides.successfulExecutions ?? 0,
      failedExecutions: overrides.failedExecutions ?? 0,
      avgExecutionTimeMs: overrides.avgExecutionTimeMs ?? 0,
      tags: overrides.tags ?? ['test', 'integration'],
      isPublic: overrides.isPublic ?? false,
      isTemplate: overrides.isTemplate ?? false,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      deletedAt: overrides.deletedAt ?? null,
    };
  },

  /**
   * Create agent in database
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created agent
   * @throws Error if database is not available or userId is missing
   *
   * Usage:
   * ```typescript
   * const user = await userFactory.create();
   * const agent = await agentFactory.create({ userId: user.id });
   * ```
   */
  create: async (overrides: AgentFactoryInput): Promise<Agent> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create agent.');
    }

    if (!overrides.userId) {
      throw new Error('userId is required to create an agent.');
    }

    const data = agentFactory.build(overrides);

    return prisma.agent.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        version: data.version,
        parentId: data.parentId,
        userId: data.userId,
        config: data.config,
        capabilities: data.capabilities,
        parameters: data.parameters,
        maxExecutionTime: data.maxExecutionTime,
        maxMemoryMb: data.maxMemoryMb,
        maxConcurrentExecutions: data.maxConcurrentExecutions,
        totalExecutions: data.totalExecutions,
        successfulExecutions: data.successfulExecutions,
        failedExecutions: data.failedExecutions,
        avgExecutionTimeMs: data.avgExecutionTimeMs,
        tags: data.tags,
        isPublic: data.isPublic,
        isTemplate: data.isTemplate,
      },
    });
  },

  /**
   * Create agent with a new user (creates both)
   *
   * @param agentOverrides - Optional agent field overrides
   * @param userOverrides - Optional user field overrides
   * @returns Promise resolving to agent and user
   *
   * Usage:
   * ```typescript
   * const { agent, user } = await agentFactory.createWithUser();
   * ```
   */
  createWithUser: async (
    agentOverrides: Omit<AgentFactoryInput, 'userId'> = {},
    userOverrides = {},
  ): Promise<AgentWithUser> => {
    const user = await userFactory.create(userOverrides);
    const agent = await agentFactory.create({
      ...agentOverrides,
      userId: user.id,
    });

    return { agent, user };
  },

  /**
   * Create multiple agents for a user
   *
   * @param userId - Owner user ID
   * @param count - Number of agents to create
   * @param overrides - Optional field overrides (applied to all agents)
   * @returns Promise resolving to array of created agents
   *
   * Usage:
   * ```typescript
   * const agents = await agentFactory.createMany(user.id, 5);
   * ```
   */
  createMany: async (
    userId: string,
    count: number,
    overrides: Omit<AgentFactoryInput, 'userId'> = {},
  ): Promise<Agent[]> => {
    const agents: Agent[] = [];

    for (let i = 0; i < count; i++) {
      const agent = await agentFactory.create({
        ...overrides,
        userId,
      });
      agents.push(agent);
    }

    return agents;
  },

  /**
   * Create an active agent
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created active agent
   *
   * Usage:
   * ```typescript
   * const activeAgent = await agentFactory.createActive({ userId: user.id });
   * ```
   */
  createActive: async (overrides: AgentFactoryInput): Promise<Agent> => {
    return agentFactory.create({
      ...overrides,
      status: AgentStatus.ACTIVE,
    });
  },

  /**
   * Create a public template agent
   *
   * @param overrides - Optional field overrides (must include userId)
   * @returns Promise resolving to created template agent
   *
   * Usage:
   * ```typescript
   * const template = await agentFactory.createTemplate({ userId: user.id });
   * ```
   */
  createTemplate: async (overrides: AgentFactoryInput): Promise<Agent> => {
    return agentFactory.create({
      ...overrides,
      isPublic: true,
      isTemplate: true,
      status: AgentStatus.ACTIVE,
    });
  },

  /**
   * Create agents of each type
   *
   * @param userId - Owner user ID
   * @returns Promise resolving to map of agent types to agents
   *
   * Usage:
   * ```typescript
   * const agentsByType = await agentFactory.createAllTypes(user.id);
   * console.log(agentsByType[AgentType.CODE]);
   * console.log(agentsByType[AgentType.LLM]);
   * ```
   */
  createAllTypes: async (userId: string): Promise<Record<AgentType, Agent>> => {
    const types: AgentType[] = [
      AgentType.CODE,
      AgentType.API,
      AgentType.LLM,
      AgentType.DATA,
      AgentType.WORKFLOW,
    ];
    const result: Partial<Record<AgentType, Agent>> = {};

    for (const type of types) {
      result[type] = await agentFactory.create({
        userId,
        type,
        name: `${type} Agent`,
      });
    }

    return result as Record<AgentType, Agent>;
  },
};

// ============================================================================
// Reset Counter
// ============================================================================

/**
 * Reset the agent counter
 * Call this in beforeEach to ensure unique names across tests
 */
export const resetAgentCounter = (): void => {
  agentCounter = 0;
};

// Re-export enums for convenience
export { AgentType, AgentStatus };
