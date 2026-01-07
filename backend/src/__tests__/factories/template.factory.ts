/**
 * Template Factory
 *
 * Factory for creating test template data and database records.
 * Supports both raw data generation and database persistence.
 *
 * Usage:
 * ```typescript
 * // Generate raw data (no database)
 * const templateData = templateFactory.build();
 *
 * // Create in database
 * const template = await templateFactory.create();
 *
 * // Create with custom attributes
 * const agentTemplate = await templateFactory.create({ type: TemplateType.AGENT });
 * ```
 *
 * @module __tests__/factories/template.factory
 */

import { v4 as uuidv4 } from 'uuid';
import { Template, TemplateType, User, Prisma } from '@prisma/client';
import { getTestPrisma } from '../integration/setup';
import { userFactory } from './user.factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for building template data
 */
export interface TemplateFactoryInput {
  id?: string;
  name?: string;
  description?: string | null;
  category?: string;
  type?: TemplateType;
  userId?: string | null;
  templateData?: Prisma.InputJsonValue;
  tags?: string[];
  isOfficial?: boolean;
  isPublic?: boolean;
  usageCount?: number;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Raw template data without database-generated fields
 */
export interface TemplateBuildData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: TemplateType;
  userId: string | null;
  templateData: Prisma.InputJsonValue;
  tags: string[];
  isOfficial: boolean;
  isPublic: boolean;
  usageCount: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Template with its creator user
 */
export interface TemplateWithUser {
  template: Template;
  user: User | null;
}

// ============================================================================
// Helpers
// ============================================================================

let templateCounter = 0;

/**
 * Generate a unique template name
 */
const generateTemplateName = (): string => {
  templateCounter += 1;
  return `Test Template ${templateCounter}`;
};

/**
 * Get a random template category
 */
const getRandomCategory = (): string => {
  const categories = ['automation', 'data', 'integration', 'ai', 'utility'];
  return categories[Math.floor(Math.random() * categories.length)] as string;
};

// ============================================================================
// Factory
// ============================================================================

/**
 * Template Factory
 *
 * Provides methods to build and create template test data
 */
export const templateFactory = {
  /**
   * Build template data without saving to database
   *
   * @param overrides - Optional field overrides
   * @returns Template data object
   *
   * Usage:
   * ```typescript
   * const templateData = templateFactory.build();
   * const agentTemplate = templateFactory.build({ type: TemplateType.AGENT });
   * ```
   */
  build: (overrides: TemplateFactoryInput = {}): TemplateBuildData => {
    const now = new Date();

    return {
      id: overrides.id ?? uuidv4(),
      name: overrides.name ?? generateTemplateName(),
      description: overrides.description ?? 'A test template for integration testing',
      category: overrides.category ?? getRandomCategory(),
      type: overrides.type ?? TemplateType.AGENT,
      userId: overrides.userId ?? null,
      templateData: overrides.templateData ?? {
        version: '1.0',
        config: {
          runtime: 'node',
          memory: 512,
        },
        parameters: {},
      },
      tags: overrides.tags ?? ['test', 'template'],
      isOfficial: overrides.isOfficial ?? false,
      isPublic: overrides.isPublic ?? true,
      usageCount: overrides.usageCount ?? 0,
      ratingAverage: overrides.ratingAverage ?? 0,
      ratingCount: overrides.ratingCount ?? 0,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      deletedAt: overrides.deletedAt ?? null,
    };
  },

  /**
   * Create template in database
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created template
   * @throws Error if database is not available
   *
   * Usage:
   * ```typescript
   * const template = await templateFactory.create();
   * const agentTemplate = await templateFactory.create({ type: TemplateType.AGENT });
   * ```
   */
  create: async (overrides: TemplateFactoryInput = {}): Promise<Template> => {
    const prisma = getTestPrisma();

    if (!prisma) {
      throw new Error('Test database is not available. Cannot create template.');
    }

    const data = templateFactory.build(overrides);

    return prisma.template.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        userId: data.userId,
        templateData: data.templateData,
        tags: data.tags,
        isOfficial: data.isOfficial,
        isPublic: data.isPublic,
        usageCount: data.usageCount,
        ratingAverage: data.ratingAverage,
        ratingCount: data.ratingCount,
      },
    });
  },

  /**
   * Create template with a new user (creates both)
   *
   * @param templateOverrides - Optional template field overrides
   * @param userOverrides - Optional user field overrides
   * @returns Promise resolving to template and user
   *
   * Usage:
   * ```typescript
   * const { template, user } = await templateFactory.createWithUser();
   * ```
   */
  createWithUser: async (
    templateOverrides: Omit<TemplateFactoryInput, 'userId'> = {},
    userOverrides = {},
  ): Promise<TemplateWithUser> => {
    const user = await userFactory.create(userOverrides);
    const template = await templateFactory.create({
      ...templateOverrides,
      userId: user.id,
    });

    return { template, user };
  },

  /**
   * Create multiple templates
   *
   * @param count - Number of templates to create
   * @param overrides - Optional field overrides (applied to all templates)
   * @returns Promise resolving to array of created templates
   *
   * Usage:
   * ```typescript
   * const templates = await templateFactory.createMany(5);
   * const agentTemplates = await templateFactory.createMany(3, { type: TemplateType.AGENT });
   * ```
   */
  createMany: async (count: number, overrides: TemplateFactoryInput = {}): Promise<Template[]> => {
    const templates: Template[] = [];

    for (let i = 0; i < count; i++) {
      const template = await templateFactory.create(overrides);
      templates.push(template);
    }

    return templates;
  },

  /**
   * Create an official template
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created official template
   *
   * Usage:
   * ```typescript
   * const officialTemplate = await templateFactory.createOfficial();
   * ```
   */
  createOfficial: async (overrides: TemplateFactoryInput = {}): Promise<Template> => {
    return templateFactory.create({
      ...overrides,
      isOfficial: true,
      isPublic: true,
    });
  },

  /**
   * Create a private template (requires user)
   *
   * @param userId - Owner user ID
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created private template
   *
   * Usage:
   * ```typescript
   * const privateTemplate = await templateFactory.createPrivate(user.id);
   * ```
   */
  createPrivate: async (
    userId: string,
    overrides: Omit<TemplateFactoryInput, 'userId'> = {},
  ): Promise<Template> => {
    return templateFactory.create({
      ...overrides,
      userId,
      isPublic: false,
    });
  },

  /**
   * Create a popular template (with usage and ratings)
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created popular template
   *
   * Usage:
   * ```typescript
   * const popularTemplate = await templateFactory.createPopular();
   * ```
   */
  createPopular: async (overrides: TemplateFactoryInput = {}): Promise<Template> => {
    return templateFactory.create({
      ...overrides,
      isPublic: true,
      usageCount: 100 + Math.floor(Math.random() * 900),
      ratingAverage: 4 + Math.random(),
      ratingCount: 20 + Math.floor(Math.random() * 80),
    });
  },

  /**
   * Create templates of each type
   *
   * @returns Promise resolving to map of template types to templates
   *
   * Usage:
   * ```typescript
   * const templatesByType = await templateFactory.createAllTypes();
   * console.log(templatesByType[TemplateType.AGENT]);
   * console.log(templatesByType[TemplateType.WORKFLOW]);
   * ```
   */
  createAllTypes: async (): Promise<Record<TemplateType, Template>> => {
    const types: TemplateType[] = [TemplateType.AGENT, TemplateType.WORKFLOW, TemplateType.STEP];
    const result: Partial<Record<TemplateType, Template>> = {};

    for (const type of types) {
      result[type] = await templateFactory.create({
        type,
        name: `${type} Template`,
      });
    }

    return result as Record<TemplateType, Template>;
  },

  /**
   * Create an agent template with realistic config
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created agent template
   *
   * Usage:
   * ```typescript
   * const agentTemplate = await templateFactory.createAgentTemplate();
   * ```
   */
  createAgentTemplate: async (overrides: TemplateFactoryInput = {}): Promise<Template> => {
    return templateFactory.create({
      ...overrides,
      type: TemplateType.AGENT,
      category: 'automation',
      templateData: {
        version: '1.0',
        agentType: 'CODE',
        config: {
          runtime: 'node',
          memory: 512,
          timeout: 300,
        },
        capabilities: ['execute', 'read', 'write'],
        parameters: {
          entrypoint: 'index.js',
        },
      },
    });
  },

  /**
   * Create a workflow template with realistic config
   *
   * @param overrides - Optional field overrides
   * @returns Promise resolving to created workflow template
   *
   * Usage:
   * ```typescript
   * const workflowTemplate = await templateFactory.createWorkflowTemplate();
   * ```
   */
  createWorkflowTemplate: async (overrides: TemplateFactoryInput = {}): Promise<Template> => {
    return templateFactory.create({
      ...overrides,
      type: TemplateType.WORKFLOW,
      category: 'integration',
      templateData: {
        version: '1.0',
        trigger: {
          type: 'manual',
        },
        steps: [
          {
            key: 'step_1',
            name: 'Initial Step',
            type: 'AGENT',
            config: {},
          },
          {
            key: 'step_2',
            name: 'Processing Step',
            type: 'AGENT',
            dependsOn: ['step_1'],
            config: {},
          },
          {
            key: 'step_3',
            name: 'Final Step',
            type: 'AGENT',
            dependsOn: ['step_2'],
            config: {},
          },
        ],
      },
    });
  },
};

// ============================================================================
// Reset Counter
// ============================================================================

/**
 * Reset the template counter
 * Call this in beforeEach to ensure unique names across tests
 */
export const resetTemplateCounter = (): void => {
  templateCounter = 0;
};

// Re-export enum for convenience
export { TemplateType };
