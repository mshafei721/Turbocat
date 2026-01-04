/**
 * Skills System Database Schema
 *
 * Database schema for storing skills and their execution logs.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/db/schema/skills.ts
 */

import { pgTable, text, timestamp, integer, jsonb, boolean, decimal } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { users } from '../schema'
import { tasks } from '../schema'

// Zod schemas for validation
export const mcpDependencySchema = z.object({
  server: z.string(),
  required: z.boolean(),
  capabilities: z.array(z.string()),
})

export const skillTriggerSchema = z.object({
  pattern: z.string(),
  confidence: z.number().min(0).max(1),
  examples: z.array(z.string()),
})

export const executionStepSchema = z.object({
  step: z.number(),
  description: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

export const executionTraceSchema = z.object({
  traceId: z.string(),
  skillId: z.string(),
  skillName: z.string(),
  inputPrompt: z.string(),
  detectedConfidence: z.number(),
  detectionReasoning: z.string(),
  steps: z.array(executionStepSchema),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  errorMessage: z.string().optional(),
  durationMs: z.number().optional(),
  outputFiles: z.array(z.string()).optional(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * Skills table
 *
 * Stores skill definitions with metadata, triggers, and dependencies.
 */
export const skills = pgTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  version: text('version').notNull().default('1.0.0'),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().default([]),
  scope: text('scope', { enum: ['user', 'global'] })
    .notNull()
    .default('global'),
  content: text('content').notNull(), // Full SKILL.md content
  mcpDependencies: jsonb('mcp_dependencies')
    .$type<Array<{ server: string; required: boolean; capabilities: string[] }>>()
    .default([]),
  triggers: jsonb('triggers')
    .$type<Array<{ pattern: string; confidence: number; examples: string[] }>>()
    .default([]),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Skill executions table
 *
 * Logs every skill execution with complete trace for debugging and analytics.
 */
export const skillExecutions = pgTable('skill_executions', {
  id: text('id').primaryKey(),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  inputPrompt: text('input_prompt').notNull(),
  detectedConfidence: decimal('detected_confidence', { precision: 3, scale: 2 }).notNull(),
  executionTrace: jsonb('execution_trace')
    .$type<{
      traceId: string
      skillId: string
      skillName: string
      inputPrompt: string
      detectedConfidence: number
      detectionReasoning: string
      steps: Array<{
        step: number
        description: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        startedAt?: Date
        completedAt?: Date
        error?: string
        data?: Record<string, unknown>
      }>
      status: 'pending' | 'running' | 'completed' | 'failed'
      errorMessage?: string
      durationMs?: number
      outputFiles?: string[]
      startedAt: Date
      completedAt?: Date
    }>()
    .notNull(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] })
    .notNull()
    .default('pending'),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Zod schemas for insert/select operations
export const insertSkillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  version: z.string().default('1.0.0'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  scope: z.enum(['user', 'global']).default('global'),
  content: z.string().min(1, 'Content is required'),
  mcpDependencies: z.array(mcpDependencySchema).default([]),
  triggers: z.array(skillTriggerSchema).default([]),
  isActive: z.boolean().default(true),
  usageCount: z.number().default(0),
  successRate: z.string().default('0'),
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  version: z.string(),
  category: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  scope: z.enum(['user', 'global']),
  content: z.string(),
  mcpDependencies: z.array(mcpDependencySchema).nullable(),
  triggers: z.array(skillTriggerSchema).nullable(),
  isActive: z.boolean(),
  usageCount: z.number(),
  successRate: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const insertSkillExecutionSchema = z.object({
  id: z.string().optional(),
  skillId: z.string().min(1, 'Skill ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  taskId: z.string().optional(),
  inputPrompt: z.string().min(1, 'Input prompt is required'),
  detectedConfidence: z.string(),
  executionTrace: executionTraceSchema,
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
  errorMessage: z.string().optional(),
  durationMs: z.number().optional(),
  createdAt: z.date().optional(),
})

export const selectSkillExecutionSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  userId: z.string(),
  taskId: z.string().nullable(),
  inputPrompt: z.string(),
  detectedConfidence: z.string(),
  executionTrace: executionTraceSchema,
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  errorMessage: z.string().nullable(),
  durationMs: z.number().nullable(),
  createdAt: z.date(),
})

export type Skill = z.infer<typeof selectSkillSchema>
export type InsertSkill = z.infer<typeof insertSkillSchema>
export type SkillExecution = z.infer<typeof selectSkillExecutionSchema>
export type InsertSkillExecution = z.infer<typeof insertSkillExecutionSchema>
