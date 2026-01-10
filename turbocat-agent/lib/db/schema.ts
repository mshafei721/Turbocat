import { pgTable, text, timestamp, integer, jsonb, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { z } from 'zod'

// Log entry types
export const logEntrySchema = z.object({
  type: z.enum(['info', 'command', 'error', 'success']),
  message: z.string(),
  timestamp: z.date().optional(),
})

export type LogEntry = z.infer<typeof logEntrySchema>

// Users table - user profile and primary OAuth account
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(), // Internal user ID (we generate this)
    // Primary OAuth account info (how they signed in)
    provider: text('provider', {
      enum: ['github', 'vercel', 'google', 'apple'],
    }).notNull(), // Primary auth provider
    externalId: text('external_id').notNull(), // External ID from OAuth provider
    accessToken: text('access_token').notNull(), // Encrypted OAuth access token
    refreshToken: text('refresh_token'), // Encrypted OAuth refresh token
    scope: text('scope'), // OAuth scope
    // Profile info
    username: text('username').notNull(),
    email: text('email'),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate signups from same provider + external ID
    providerExternalIdUnique: uniqueIndex('users_provider_external_id_idx').on(table.provider, table.externalId),
  }),
)

export const insertUserSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  provider: z.enum(['github', 'vercel', 'google', 'apple']),
  externalId: z.string().min(1, 'External ID is required'),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  scope: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastLoginAt: z.date().optional(),
})

export const selectUserSchema = z.object({
  id: z.string(),
  provider: z.enum(['github', 'vercel', 'google', 'apple']),
  externalId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  scope: z.string().nullable(),
  username: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date(),
})

export type User = z.infer<typeof selectUserSchema>
export type InsertUser = z.infer<typeof insertUserSchema>

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
  prompt: text('prompt').notNull(),
  title: text('title'),
  repoUrl: text('repo_url'),
  selectedAgent: text('selected_agent').default('claude'),
  selectedModel: text('selected_model'),
  installDependencies: boolean('install_dependencies').default(false),
  maxDuration: integer('max_duration').default(parseInt(process.env.MAX_SANDBOX_DURATION || '300', 10)),
  keepAlive: boolean('keep_alive').default(false),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'error', 'stopped'],
  })
    .notNull()
    .default('pending'),
  progress: integer('progress').default(0),
  logs: jsonb('logs').$type<LogEntry[]>(),
  error: text('error'),
  branchName: text('branch_name'),
  sandboxId: text('sandbox_id'),
  agentSessionId: text('agent_session_id'),
  sandboxUrl: text('sandbox_url'),
  previewUrl: text('preview_url'),
  prUrl: text('pr_url'),
  prNumber: integer('pr_number'),
  prStatus: text('pr_status', {
    enum: ['open', 'closed', 'merged'],
  }),
  prMergeCommitSha: text('pr_merge_commit_sha'),
  mcpServerIds: jsonb('mcp_server_ids').$type<string[]>(),
  // Phase 4: Mobile Development - Platform selector and Railway container tracking
  platform: text('platform', {
    enum: ['web', 'mobile'],
  })
    .notNull()
    .default('web'),
  metroUrl: text('metro_url'), // Metro bundler URL for mobile projects (Railway)
  containerId: text('container_id'), // Railway container ID for lifecycle management
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'),
})

// Manual Zod schemas for validation
export const insertTaskSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  title: z.string().optional(),
  repoUrl: z.string().url('Must be a valid URL').optional(),
  selectedAgent: z.enum(['claude', 'codex', 'copilot', 'cursor', 'gemini', 'opencode']).default('claude'),
  selectedModel: z.string().optional(),
  installDependencies: z.boolean().default(false),
  maxDuration: z.number().default(parseInt(process.env.MAX_SANDBOX_DURATION || '300', 10)),
  keepAlive: z.boolean().default(false),
  status: z.enum(['pending', 'processing', 'completed', 'error', 'stopped']).default('pending'),
  progress: z.number().min(0).max(100).default(0),
  logs: z.array(logEntrySchema).optional(),
  error: z.string().optional(),
  branchName: z.string().optional(),
  sandboxId: z.string().optional(),
  agentSessionId: z.string().optional(),
  sandboxUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  prUrl: z.string().optional(),
  prNumber: z.number().optional(),
  prStatus: z.enum(['open', 'closed', 'merged']).optional(),
  prMergeCommitSha: z.string().optional(),
  mcpServerIds: z.array(z.string()).optional(),
  // Phase 4: Mobile Development fields
  platform: z.enum(['web', 'mobile']).default('web'),
  metroUrl: z.string().optional(),
  containerId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  completedAt: z.date().optional(),
  deletedAt: z.date().optional(),
})

export const selectTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(),
  title: z.string().nullable(),
  repoUrl: z.string().nullable(),
  selectedAgent: z.string().nullable(),
  selectedModel: z.string().nullable(),
  installDependencies: z.boolean().nullable(),
  maxDuration: z.number().nullable(),
  keepAlive: z.boolean().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'error', 'stopped']),
  progress: z.number().nullable(),
  logs: z.array(logEntrySchema).nullable(),
  error: z.string().nullable(),
  branchName: z.string().nullable(),
  sandboxId: z.string().nullable(),
  agentSessionId: z.string().nullable(),
  sandboxUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  prUrl: z.string().nullable(),
  prNumber: z.number().nullable(),
  prStatus: z.enum(['open', 'closed', 'merged']).nullable(),
  prMergeCommitSha: z.string().nullable(),
  mcpServerIds: z.array(z.string()).nullable(),
  // Phase 4: Mobile Development fields
  platform: z.enum(['web', 'mobile']),
  metroUrl: z.string().nullable(),
  containerId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
})

export type Task = z.infer<typeof selectTaskSchema>
export type InsertTask = z.infer<typeof insertTaskSchema>

export const connectors = pgTable('connectors', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['local', 'remote'],
  })
    .notNull()
    .default('remote'),
  // For remote MCP servers
  baseUrl: text('base_url'),
  oauthClientId: text('oauth_client_id'),
  oauthClientSecret: text('oauth_client_secret'),
  // For local MCP servers
  command: text('command'),
  // Environment variables (for both local and remote) - stored encrypted
  env: text('env'),
  status: text('status', {
    enum: ['connected', 'disconnected'],
  })
    .notNull()
    .default('disconnected'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const insertConnectorSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['local', 'remote']).default('remote'),
  // For remote MCP servers
  baseUrl: z.string().url('Must be a valid URL').optional(),
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  // For local MCP servers
  command: z.string().optional(),
  // Environment variables (for both local and remote) - will be encrypted
  env: z.record(z.string(), z.string()).optional(),
  status: z.enum(['connected', 'disconnected']).default('disconnected'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectConnectorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['local', 'remote']),
  // For remote MCP servers
  baseUrl: z.string().nullable(),
  oauthClientId: z.string().nullable(),
  oauthClientSecret: z.string().nullable(),
  // For local MCP servers
  command: z.string().nullable(),
  // Environment variables (for both local and remote) - stored encrypted as string
  env: z.string().nullable(),
  status: z.enum(['connected', 'disconnected']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Connector = z.infer<typeof selectConnectorSchema>
export type InsertConnector = z.infer<typeof insertConnectorSchema>

// Accounts table - Additional accounts linked to users
// Currently only GitHub can be connected as an additional account
// (e.g., Vercel users can connect their GitHub account)
// Multiple users can connect to the same external account (each as a separate record)
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
    provider: text('provider', {
      enum: ['github'],
    })
      .notNull()
      .default('github'), // Only GitHub for now
    externalUserId: text('external_user_id').notNull(), // GitHub user ID
    accessToken: text('access_token').notNull(), // Encrypted OAuth access token
    refreshToken: text('refresh_token'), // Encrypted OAuth refresh token
    expiresAt: timestamp('expires_at'),
    scope: text('scope'),
    username: text('username').notNull(), // GitHub username
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: a user can only have one account per provider
    userIdProviderUnique: uniqueIndex('accounts_user_id_provider_idx').on(table.userId, table.provider),
  }),
)

export const insertAccountSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  provider: z.enum(['github']).default('github'),
  externalUserId: z.string().min(1, 'External user ID is required'),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  scope: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.enum(['github']),
  externalUserId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresAt: z.date().nullable(),
  scope: z.string().nullable(),
  username: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Account = z.infer<typeof selectAccountSchema>
export type InsertAccount = z.infer<typeof insertAccountSchema>

// Keys table - user's API keys for various services
// Each row represents one API key for one provider for one user
export const keys = pgTable(
  'keys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
    provider: text('provider', {
      enum: ['anthropic', 'openai', 'cursor', 'gemini', 'aigateway'],
    }).notNull(),
    value: text('value').notNull(), // Encrypted API key value
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: a user can only have one key per provider
    userIdProviderUnique: uniqueIndex('keys_user_id_provider_idx').on(table.userId, table.provider),
  }),
)

export const insertKeySchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  provider: z.enum(['anthropic', 'openai', 'cursor', 'gemini', 'aigateway']),
  value: z.string().min(1, 'API key value is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectKeySchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.enum(['anthropic', 'openai', 'cursor', 'gemini', 'aigateway']),
  value: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Key = z.infer<typeof selectKeySchema>
export type InsertKey = z.infer<typeof insertKeySchema>

// Task messages table - stores user and agent messages for each task
export const taskMessages = pgTable('task_messages', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }), // Foreign key to tasks table
  role: text('role', {
    enum: ['user', 'agent'],
  }).notNull(), // Who sent the message
  content: text('content').notNull(), // The message content
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const insertTaskMessageSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1, 'Task ID is required'),
  role: z.enum(['user', 'agent']),
  content: z.string().min(1, 'Content is required'),
  createdAt: z.date().optional(),
})

export const selectTaskMessageSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  role: z.enum(['user', 'agent']),
  content: z.string(),
  createdAt: z.date(),
})

export type TaskMessage = z.infer<typeof selectTaskMessageSchema>
export type InsertTaskMessage = z.infer<typeof insertTaskMessageSchema>

// Settings table - key-value pairs for overriding environment variables per user
export const settings = pgTable(
  'settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Required user reference
    key: text('key').notNull(), // Setting key (e.g., 'maxMessagesPerDay')
    value: text('value').notNull(), // Setting value (stored as text)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate keys per user
    userIdKeyUnique: uniqueIndex('settings_user_id_key_idx').on(table.userId, table.key),
  }),
)

export const insertSettingSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectSettingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  key: z.string(),
  value: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Setting = z.infer<typeof selectSettingSchema>
export type InsertSetting = z.infer<typeof insertSettingSchema>

// Phase 4: Railway Container Registry Table
// Tracks active Railway containers for mobile project lifecycle management
export const railwayContainers = pgTable('railway_containers', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }), // Foreign key to tasks table
  containerId: text('container_id').notNull().unique(), // Railway container ID (unique)
  metroUrl: text('metro_url').notNull(), // Public HTTPS URL for Metro bundler
  status: text('status', {
    enum: ['starting', 'running', 'stopped', 'error'],
  })
    .notNull()
    .default('starting'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  resourceUsage: jsonb('resource_usage').$type<{
    cpu?: number // CPU usage percentage
    ram?: number // RAM usage in MB
    network?: number // Network usage in MB
  }>(),
})

export const insertRailwayContainerSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  taskId: z.string().min(1, 'Task ID is required'),
  containerId: z.string().min(1, 'Container ID is required'),
  metroUrl: z.string().url('Must be a valid URL'),
  status: z.enum(['starting', 'running', 'stopped', 'error']).default('starting'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastActivityAt: z.date().optional(),
  resourceUsage: z
    .object({
      cpu: z.number().optional(),
      ram: z.number().optional(),
      network: z.number().optional(),
    })
    .optional(),
})

export const selectRailwayContainerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string(),
  containerId: z.string(),
  metroUrl: z.string(),
  status: z.enum(['starting', 'running', 'stopped', 'error']),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActivityAt: z.date(),
  resourceUsage: z
    .object({
      cpu: z.number().optional(),
      ram: z.number().optional(),
      network: z.number().optional(),
    })
    .nullable(),
})

export type RailwayContainer = z.infer<typeof selectRailwayContainerSchema>
export type InsertRailwayContainer = z.infer<typeof insertRailwayContainerSchema>

// Keep legacy export for backwards compatibility during migration
export const userConnections = accounts
export type UserConnection = Account
export type InsertUserConnection = InsertAccount

// ============================================================================
// Phase 3: Credits System
// ============================================================================

// Credits table - user credit balance
export const credits = pgTable('credits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0), // Current credit balance
  totalEarned: integer('total_earned').notNull().default(0), // Lifetime credits earned
  totalSpent: integer('total_spent').notNull().default(0), // Lifetime credits spent
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const insertCreditSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, 'User ID is required'),
  balance: z.number().int().default(0),
  totalEarned: z.number().int().default(0),
  totalSpent: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectCreditSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  totalEarned: z.number(),
  totalSpent: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Credit = z.infer<typeof selectCreditSchema>
export type InsertCredit = z.infer<typeof insertCreditSchema>

// Credit transactions table - history of credit changes
export const creditTransactions = pgTable('credit_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Positive for credits earned, negative for spent
  type: text('type', {
    enum: ['purchase', 'referral_bonus', 'promo_code', 'usage', 'refund', 'adjustment'],
  }).notNull(),
  description: text('description'), // Human-readable description
  referenceId: text('reference_id'), // ID of related entity (e.g., referral ID, promo code ID)
  referenceType: text('reference_type', {
    enum: ['referral', 'promo_code', 'task', 'subscription'],
  }),
  balanceAfter: integer('balance_after').notNull(), // Balance after this transaction
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const insertCreditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().int(),
  type: z.enum(['purchase', 'referral_bonus', 'promo_code', 'usage', 'refund', 'adjustment']),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.enum(['referral', 'promo_code', 'task', 'subscription']).optional(),
  balanceAfter: z.number().int(),
  createdAt: z.date().optional(),
})

export const selectCreditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  type: z.enum(['purchase', 'referral_bonus', 'promo_code', 'usage', 'refund', 'adjustment']),
  description: z.string().nullable(),
  referenceId: z.string().nullable(),
  referenceType: z.enum(['referral', 'promo_code', 'task', 'subscription']).nullable(),
  balanceAfter: z.number(),
  createdAt: z.date(),
})

export type CreditTransaction = z.infer<typeof selectCreditTransactionSchema>
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>

// ============================================================================
// Phase 3: Referral System
// ============================================================================

// Referrals table - tracks referral relationships and rewards
export const referrals = pgTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // User who made the referral
  refereeId: text('referee_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }), // User who was referred
  referralCode: text('referral_code').notNull(), // The code used
  status: text('status', {
    enum: ['pending', 'completed', 'expired', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  creditsEarned: integer('credits_earned').default(0), // Credits awarded to referrer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // When the referee completed qualifying action
})

export const insertReferralSchema = z.object({
  id: z.string(),
  referrerId: z.string().min(1, 'Referrer ID is required'),
  refereeId: z.string().min(1, 'Referee ID is required'),
  referralCode: z.string().min(1, 'Referral code is required'),
  status: z.enum(['pending', 'completed', 'expired', 'cancelled']).default('pending'),
  creditsEarned: z.number().int().default(0),
  createdAt: z.date().optional(),
  completedAt: z.date().optional(),
})

export const selectReferralSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  refereeId: z.string(),
  referralCode: z.string(),
  status: z.enum(['pending', 'completed', 'expired', 'cancelled']),
  creditsEarned: z.number().nullable(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
})

export type Referral = z.infer<typeof selectReferralSchema>
export type InsertReferral = z.infer<typeof insertReferralSchema>

// User referral codes table - each user's unique referral code
export const referralCodes = pgTable('referral_codes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(), // Unique referral code
  totalReferrals: integer('total_referrals').notNull().default(0),
  totalCreditsEarned: integer('total_credits_earned').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const insertReferralCodeSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, 'User ID is required'),
  code: z.string().min(1, 'Code is required'),
  totalReferrals: z.number().int().default(0),
  totalCreditsEarned: z.number().int().default(0),
  createdAt: z.date().optional(),
})

export const selectReferralCodeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  code: z.string(),
  totalReferrals: z.number(),
  totalCreditsEarned: z.number(),
  createdAt: z.date(),
})

export type ReferralCode = z.infer<typeof selectReferralCodeSchema>
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>

// ============================================================================
// Phase 3: Promo Code System
// ============================================================================

// Promo codes table - promotional code definitions
export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // The promo code string
  description: text('description'),
  creditsReward: integer('credits_reward').notNull(), // Credits given when redeemed
  maxUses: integer('max_uses'), // Null = unlimited
  currentUses: integer('current_uses').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at'), // Null = immediately active
  expiresAt: timestamp('expires_at'), // Null = never expires
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const insertPromoCodeSchema = z.object({
  id: z.string(),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  creditsReward: z.number().int().positive('Credits reward must be positive'),
  maxUses: z.number().int().positive().optional(),
  currentUses: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const selectPromoCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  creditsReward: z.number(),
  maxUses: z.number().nullable(),
  currentUses: z.number(),
  isActive: z.boolean(),
  startsAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type PromoCode = z.infer<typeof selectPromoCodeSchema>
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>

// Promo code redemptions table - tracks who redeemed what
export const promoCodeRedemptions = pgTable(
  'promo_code_redemptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    promoCodeId: text('promo_code_id')
      .notNull()
      .references(() => promoCodes.id, { onDelete: 'cascade' }),
    creditsAwarded: integer('credits_awarded').notNull(),
    redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
  },
  (table) => ({
    // Each user can only redeem a promo code once
    userPromoCodeUnique: uniqueIndex('promo_redemptions_user_promo_idx').on(table.userId, table.promoCodeId),
  }),
)

export const insertPromoCodeRedemptionSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, 'User ID is required'),
  promoCodeId: z.string().min(1, 'Promo code ID is required'),
  creditsAwarded: z.number().int(),
  redeemedAt: z.date().optional(),
})

export const selectPromoCodeRedemptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  promoCodeId: z.string(),
  creditsAwarded: z.number(),
  redeemedAt: z.date(),
})

export type PromoCodeRedemption = z.infer<typeof selectPromoCodeRedemptionSchema>
export type InsertPromoCodeRedemption = z.infer<typeof insertPromoCodeRedemptionSchema>

// Export skills schema
export * from './schema/skills'
