/**
 * Skills System Type Definitions
 *
 * Type definitions for the Skills System that allows AI agents to
 * learn and execute specialized behaviors using SKILL.md format.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/types.ts
 */

/**
 * MCP Dependency definition for skills
 *
 * Defines which MCP servers a skill requires to function.
 */
export interface MCPDependency {
  /** MCP server name (e.g., 'supabase', 'github') */
  server: string
  /** Whether the skill can run without this server */
  required: boolean
  /** Specific capabilities needed from the server */
  capabilities: string[]
}

/**
 * Skill Trigger definition
 *
 * Defines patterns and examples that trigger skill activation.
 */
export interface SkillTrigger {
  /** Regex pattern or keywords that trigger this skill */
  pattern: string
  /** Confidence threshold (0-1) for activation */
  confidence: number
  /** Example phrases that should trigger this skill */
  examples: string[]
}

/**
 * Skill Definition
 *
 * Complete definition of a skill including metadata, content, and dependencies.
 */
export interface SkillDefinition {
  /** Unique identifier (auto-generated) */
  id?: string
  /** Display name of the skill */
  name: string
  /** URL-safe identifier (derived from name) */
  slug: string
  /** Multi-line description of what the skill does */
  description: string
  /** Semantic version (e.g., '1.0.0') */
  version: string
  /** Category for grouping skills */
  category?: string
  /** Searchable tags */
  tags?: string[]
  /** Availability scope - 'user' for user-specific, 'global' for all users */
  scope: 'user' | 'global'
  /** Full SKILL.md content (frontmatter + body) */
  content: string
  /** MCP server dependencies */
  mcpDependencies: MCPDependency[]
  /** Trigger patterns for skill detection */
  triggers: SkillTrigger[]
  /** Whether the skill is active */
  isActive?: boolean
  /** Number of times the skill has been used */
  usageCount?: number
  /** Success rate percentage (0-100) */
  successRate?: number
  /** User ID who created the skill (for user-scoped skills) */
  createdBy?: string
  /** Creation timestamp */
  createdAt?: Date
  /** Last update timestamp */
  updatedAt?: Date
}

/**
 * Execution Step
 *
 * Represents a single step in skill execution.
 */
export interface ExecutionStep {
  /** Step number */
  step: number
  /** Step description */
  description: string
  /** Status of this step */
  status: 'pending' | 'running' | 'completed' | 'failed'
  /** Start time of this step */
  startedAt?: Date
  /** Completion time of this step */
  completedAt?: Date
  /** Error message if step failed */
  error?: string
  /** Additional data from this step */
  data?: Record<string, unknown>
}

/**
 * Execution Trace
 *
 * Complete trace of skill execution with all steps and metadata.
 */
export interface ExecutionTrace {
  /** Unique trace ID */
  traceId: string
  /** Skill that was executed */
  skillId: string
  /** Skill name for display */
  skillName: string
  /** User's original prompt */
  inputPrompt: string
  /** Detection confidence (0-1) */
  detectedConfidence: number
  /** Why this skill was detected */
  detectionReasoning: string
  /** Execution steps */
  steps: ExecutionStep[]
  /** Overall execution status */
  status: 'pending' | 'running' | 'completed' | 'failed'
  /** Error message if execution failed */
  errorMessage?: string
  /** Total execution duration in milliseconds */
  durationMs?: number
  /** Files created or modified */
  outputFiles?: string[]
  /** Start time */
  startedAt: Date
  /** Completion time */
  completedAt?: Date
}

/**
 * Execution Context
 *
 * Context provided to skill executor with all necessary information.
 */
export interface ExecutionContext {
  /** Skill to execute */
  skill: SkillDefinition
  /** User's original prompt */
  prompt: string
  /** User ID */
  userId: string
  /** Task ID associated with execution */
  taskId?: string
  /** Detection confidence */
  confidence: number
  /** Working directory for file operations */
  workingDirectory: string
  /** MCP server connections available */
  mcpConnections: Map<string, boolean>
  /** Execution trace to update */
  trace: ExecutionTrace
  /** Environment variables */
  env?: Record<string, string>
}

/**
 * Detection Result
 *
 * Result of skill detection from user prompt.
 */
export interface DetectionResult {
  /** Detected skill */
  skill: SkillDefinition
  /** Confidence score (0-1) */
  confidence: number
  /** Which trigger pattern matched */
  matchedTrigger: SkillTrigger
  /** Explanation of why this skill was detected */
  reasoning: string
}

/**
 * Skill Registry Options
 *
 * Options for filtering skills in registry.list()
 */
export interface SkillRegistryListOptions {
  /** Filter by category */
  category?: string
  /** Filter by scope */
  scope?: 'user' | 'global'
  /** Filter by active status */
  active?: boolean
  /** Filter by user ID (for user-scoped skills) */
  userId?: string
}

/**
 * Skill Registry Interface
 *
 * Public interface for skill registry operations.
 * Used for dependency injection and mocking in tests.
 */
export interface ISkillRegistry {
  /** Register a new skill */
  register(skill: SkillDefinition): Promise<string>
  /** Update an existing skill */
  update(slug: string, updates: Partial<SkillDefinition>): Promise<void>
  /** Get a skill by slug */
  get(slug: string): Promise<SkillDefinition | null>
  /** List skills with optional filtering */
  list(options?: SkillRegistryListOptions): Promise<SkillDefinition[]>
  /** Deactivate a skill */
  deactivate(slug: string): Promise<void>
  /** Activate a skill */
  activate(slug: string): Promise<void>
  /** Increment usage count for a skill */
  incrementUsage(skillId: string): Promise<void>
  /** Update success rate for a skill */
  updateSuccessRate(skillId: string, successRate: number): Promise<void>
}

/**
 * Skill Execution Log
 *
 * Database record for skill execution.
 */
export interface SkillExecutionLog {
  /** Unique execution ID */
  id: string
  /** Skill ID that was executed */
  skillId: string
  /** User who triggered the execution */
  userId: string
  /** Associated task ID */
  taskId?: string
  /** User's input prompt */
  inputPrompt: string
  /** Detection confidence */
  detectedConfidence: number
  /** Full execution trace */
  executionTrace: ExecutionTrace
  /** Execution status */
  status: 'pending' | 'running' | 'completed' | 'failed'
  /** Error message if failed */
  errorMessage?: string
  /** Execution duration in milliseconds */
  durationMs?: number
  /** Creation timestamp */
  createdAt: Date
}

/**
 * Parsed Skill Content
 *
 * Result of parsing a SKILL.md file.
 */
export interface ParsedSkillContent {
  /** Parsed frontmatter metadata */
  frontmatter: {
    name: string
    description: string
    version?: string
    author?: string
    category?: string
    tags?: string[]
    scope?: 'user' | 'global'
    mcp_dependencies?: MCPDependency[]
    triggers?: SkillTrigger[]
  }
  /** Markdown body content (instructions) */
  body: string
  /** Original full content */
  rawContent: string
}
