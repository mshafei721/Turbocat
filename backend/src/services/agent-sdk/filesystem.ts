/**
 * Filesystem Service for Claude Agent SDK
 *
 * Manages the SDK's filesystem requirements for cloud deployments:
 * - Working directory management for sandboxes
 * - Skills directory bundling and access
 * - Session state persistence (.jsonl files)
 * - Hybrid approach: persistent sandboxes for project chats, ephemeral for executions
 *
 * @module services/agent-sdk/filesystem
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';
import { logger } from '../../lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface SandboxConfig {
  /** Unique sandbox identifier */
  sandboxId: string;
  /** Project ID this sandbox belongs to */
  projectId: string;
  /** User ID who owns this sandbox */
  userId: string;
  /** Sandbox type: persistent for project chats, ephemeral for one-off executions */
  type: 'persistent' | 'ephemeral';
  /** Working directory path */
  workingDir: string;
  /** Claude directory path (.claude/) */
  claudeDir: string;
  /** Session storage path */
  sessionDir: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last accessed timestamp */
  lastAccessedAt: Date;
}

export interface SessionState {
  /** Session ID */
  sessionId: string;
  /** Sandbox ID */
  sandboxId: string;
  /** Project ID */
  projectId: string;
  /** User ID */
  userId: string;
  /** Conversation history file path */
  historyPath: string;
  /** Number of turns in conversation */
  turnCount: number;
  /** Total cost accumulated */
  totalCostUsd: number;
  /** Last message timestamp */
  lastMessageAt: Date;
  /** Is session active */
  isActive: boolean;
}

export interface FilesystemConfig {
  /** Base directory for all sandboxes */
  sandboxBaseDir: string;
  /** Skills directory (bundled with container) */
  skillsDir: string;
  /** Maximum age for ephemeral sandboxes (ms) */
  ephemeralMaxAge: number;
  /** Maximum age for persistent sandbox inactivity (ms) */
  persistentInactivityTimeout: number;
  /** Enable S3 backup for session persistence */
  enableS3Backup: boolean;
  /** S3 bucket for session backup (if enabled) */
  s3Bucket?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EPHEMERAL_MAX_AGE = 1000 * 60 * 60; // 1 hour
const DEFAULT_PERSISTENT_INACTIVITY = 1000 * 60 * 60 * 24 * 7; // 7 days

// ============================================================================
// Filesystem Service Class
// ============================================================================

export class FilesystemService {
  private config: FilesystemConfig;
  private sandboxes: Map<string, SandboxConfig> = new Map();
  private sessions: Map<string, SessionState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<FilesystemConfig>) {
    const backendDir = path.resolve(__dirname, '../../../');

    this.config = {
      sandboxBaseDir:
        process.env.SANDBOX_BASE_DIR || path.join(backendDir, '.sandboxes'),
      skillsDir:
        process.env.SKILLS_DIRECTORY || path.join(backendDir, '.claude/skills'),
      ephemeralMaxAge:
        Number(process.env.EPHEMERAL_MAX_AGE) || DEFAULT_EPHEMERAL_MAX_AGE,
      persistentInactivityTimeout:
        Number(process.env.PERSISTENT_INACTIVITY_TIMEOUT) ||
        DEFAULT_PERSISTENT_INACTIVITY,
      enableS3Backup: process.env.ENABLE_S3_BACKUP === 'true',
      s3Bucket: process.env.S3_SESSION_BUCKET,
      ...config,
    };

    this.ensureDirectories();
    this.startCleanupTask();

    logger.info('[FilesystemService] Initialized', {
      sandboxBaseDir: this.config.sandboxBaseDir,
      skillsDir: this.config.skillsDir,
      enableS3Backup: this.config.enableS3Backup,
    });
  }

  // ==========================================================================
  // Directory Management
  // ==========================================================================

  /**
   * Ensure base directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.config.sandboxBaseDir,
      path.join(this.config.sandboxBaseDir, 'persistent'),
      path.join(this.config.sandboxBaseDir, 'ephemeral'),
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        logger.debug('[FilesystemService] Created directory', { dir });
      }
    }
  }

  /**
   * Get the skills directory path
   */
  getSkillsDirectory(): string {
    return this.config.skillsDir;
  }

  /**
   * Check if skills directory exists and is accessible
   */
  async validateSkillsDirectory(): Promise<{
    valid: boolean;
    error?: string;
    skillCount?: number;
  }> {
    try {
      const stats = await fs.stat(this.config.skillsDir);
      if (!stats.isDirectory()) {
        return { valid: false, error: 'Skills path is not a directory' };
      }

      const entries = await fs.readdir(this.config.skillsDir);
      const skillDirs = entries.filter((e) =>
        existsSync(path.join(this.config.skillsDir, e, 'SKILL.md')),
      );

      return { valid: true, skillCount: skillDirs.length };
    } catch (error) {
      return {
        valid: false,
        error: `Skills directory not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==========================================================================
  // Sandbox Management
  // ==========================================================================

  /**
   * Create a new sandbox for agent execution
   */
  async createSandbox(
    projectId: string,
    userId: string,
    type: 'persistent' | 'ephemeral' = 'ephemeral',
  ): Promise<SandboxConfig> {
    const sandboxId = this.generateSandboxId(projectId, userId, type);

    // Check if persistent sandbox already exists
    if (type === 'persistent') {
      const existing = await this.getSandbox(sandboxId);
      if (existing) {
        // Update last accessed time
        existing.lastAccessedAt = new Date();
        this.sandboxes.set(sandboxId, existing);
        logger.debug('[FilesystemService] Reusing existing sandbox', {
          sandboxId,
        });
        return existing;
      }
    }

    const baseDir = path.join(
      this.config.sandboxBaseDir,
      type,
      userId,
      projectId,
    );
    const workingDir = path.join(baseDir, 'workspace');
    const claudeDir = path.join(baseDir, '.claude');
    const sessionDir = path.join(baseDir, 'sessions');

    // Create directories
    await fs.mkdir(workingDir, { recursive: true });
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.mkdir(sessionDir, { recursive: true });

    // Copy skills to sandbox's .claude directory
    await this.setupClaudeDirectory(claudeDir);

    const sandbox: SandboxConfig = {
      sandboxId,
      projectId,
      userId,
      type,
      workingDir,
      claudeDir,
      sessionDir,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sandboxes.set(sandboxId, sandbox);

    logger.info('[FilesystemService] Created sandbox', {
      sandboxId,
      type,
      projectId,
      userId,
    });

    return sandbox;
  }

  /**
   * Get an existing sandbox
   */
  async getSandbox(sandboxId: string): Promise<SandboxConfig | null> {
    // Check memory cache first
    if (this.sandboxes.has(sandboxId)) {
      return this.sandboxes.get(sandboxId)!;
    }

    // Try to reconstruct from filesystem
    const parts = this.parseSandboxId(sandboxId);
    if (!parts) return null;

    const baseDir = path.join(
      this.config.sandboxBaseDir,
      parts.type,
      parts.userId,
      parts.projectId,
    );

    if (!existsSync(baseDir)) return null;

    const sandbox: SandboxConfig = {
      sandboxId,
      projectId: parts.projectId,
      userId: parts.userId,
      type: parts.type,
      workingDir: path.join(baseDir, 'workspace'),
      claudeDir: path.join(baseDir, '.claude'),
      sessionDir: path.join(baseDir, 'sessions'),
      createdAt: new Date(), // Could read from metadata file if needed
      lastAccessedAt: new Date(),
    };

    this.sandboxes.set(sandboxId, sandbox);
    return sandbox;
  }

  /**
   * Get or create a sandbox for a project
   */
  async getOrCreateSandbox(
    projectId: string,
    userId: string,
    type: 'persistent' | 'ephemeral' = 'ephemeral',
  ): Promise<SandboxConfig> {
    const sandboxId = this.generateSandboxId(projectId, userId, type);
    const existing = await this.getSandbox(sandboxId);

    if (existing) {
      existing.lastAccessedAt = new Date();
      return existing;
    }

    return this.createSandbox(projectId, userId, type);
  }

  /**
   * Delete a sandbox and all its contents
   */
  async deleteSandbox(sandboxId: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId);
    if (!sandbox) return;

    // Backup session data to S3 if enabled
    if (this.config.enableS3Backup && sandbox.type === 'persistent') {
      await this.backupSessionToS3(sandbox);
    }

    // Remove from filesystem
    const baseDir = path.dirname(sandbox.workingDir);
    await fs.rm(baseDir, { recursive: true, force: true });

    // Remove from cache
    this.sandboxes.delete(sandboxId);

    // Remove associated sessions
    for (const [sessionId, session] of this.sessions) {
      if (session.sandboxId === sandboxId) {
        this.sessions.delete(sessionId);
      }
    }

    logger.info('[FilesystemService] Deleted sandbox', { sandboxId });
  }

  // ==========================================================================
  // Claude Directory Setup
  // ==========================================================================

  /**
   * Setup .claude directory with skills symlink
   */
  private async setupClaudeDirectory(claudeDir: string): Promise<void> {
    const skillsLink = path.join(claudeDir, 'skills');

    // Create symlink to shared skills directory
    if (!existsSync(skillsLink)) {
      try {
        // Use junction on Windows, symlink on Unix
        const linkType = process.platform === 'win32' ? 'junction' : 'dir';
        await fs.symlink(this.config.skillsDir, skillsLink, linkType);
        logger.debug('[FilesystemService] Created skills symlink', {
          from: skillsLink,
          to: this.config.skillsDir,
        });
      } catch (error) {
        // If symlink fails, copy the skills directory
        logger.warn(
          '[FilesystemService] Symlink failed, copying skills directory',
          { error },
        );
        await this.copyDirectory(this.config.skillsDir, skillsLink);
      }
    }

    // Create CLAUDE.md if it doesn't exist
    const claudeMdPath = path.join(claudeDir, '..', 'CLAUDE.md');
    if (!existsSync(claudeMdPath)) {
      await fs.writeFile(
        claudeMdPath,
        '# Project Configuration\n\nThis is a Turbocat agent sandbox.\n',
      );
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Create a new session for conversation tracking
   */
  async createSession(
    sandboxId: string,
    projectId: string,
    userId: string,
  ): Promise<SessionState> {
    const sandbox = await this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    const sessionId = crypto.randomUUID();
    const historyPath = path.join(sandbox.sessionDir, `${sessionId}.jsonl`);

    // Initialize empty history file
    await fs.writeFile(historyPath, '');

    const session: SessionState = {
      sessionId,
      sandboxId,
      projectId,
      userId,
      historyPath,
      turnCount: 0,
      totalCostUsd: 0,
      lastMessageAt: new Date(),
      isActive: true,
    };

    this.sessions.set(sessionId, session);

    logger.info('[FilesystemService] Created session', {
      sessionId,
      sandboxId,
      projectId,
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionState | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get active session for a project
   */
  async getActiveSession(
    projectId: string,
    userId: string,
  ): Promise<SessionState | null> {
    for (const session of this.sessions.values()) {
      if (
        session.projectId === projectId &&
        session.userId === userId &&
        session.isActive
      ) {
        return session;
      }
    }
    return null;
  }

  /**
   * Append message to session history
   */
  async appendToHistory(
    sessionId: string,
    message: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...message,
    });

    await fs.appendFile(session.historyPath, line + '\n');

    session.turnCount++;
    session.lastMessageAt = new Date();

    if (typeof message.costUsd === 'number') {
      session.totalCostUsd += message.costUsd;
    }

    logger.debug('[FilesystemService] Appended to history', {
      sessionId,
      turnCount: session.turnCount,
    });
  }

  /**
   * Read session history
   */
  async readHistory(sessionId: string): Promise<Record<string, unknown>[]> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      const content = await fs.readFile(session.historyPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.isActive = false;

    // Backup to S3 if enabled
    if (this.config.enableS3Backup) {
      await this.backupSessionToS3({
        ...this.sandboxes.get(session.sandboxId)!,
        sessionDir: path.dirname(session.historyPath),
      } as SandboxConfig);
    }

    logger.info('[FilesystemService] Ended session', {
      sessionId,
      turnCount: session.turnCount,
      totalCostUsd: session.totalCostUsd,
    });
  }

  // ==========================================================================
  // S3 Backup (Optional)
  // ==========================================================================

  /**
   * Backup session data to S3
   */
  private async backupSessionToS3(sandbox: SandboxConfig): Promise<void> {
    if (!this.config.enableS3Backup || !this.config.s3Bucket) {
      return;
    }

    // This would integrate with AWS SDK
    // For now, just log that backup would occur
    logger.info('[FilesystemService] Would backup session to S3', {
      sandboxId: sandbox.sandboxId,
      bucket: this.config.s3Bucket,
    });

    // TODO: Implement actual S3 upload
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // await s3.send(new PutObjectCommand({
    //   Bucket: this.config.s3Bucket,
    //   Key: `sessions/${sandbox.userId}/${sandbox.projectId}/${sandbox.sandboxId}.tar.gz`,
    //   Body: createTarball(sandbox.sessionDir),
    // }));
  }

  /**
   * Restore session data from S3
   */
  async restoreSessionFromS3(
    sandboxId: string,
  ): Promise<boolean> {
    if (!this.config.enableS3Backup || !this.config.s3Bucket) {
      return false;
    }

    // TODO: Implement actual S3 download
    logger.info('[FilesystemService] Would restore session from S3', {
      sandboxId,
      bucket: this.config.s3Bucket,
    });

    return false;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Start background cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSandboxes().catch((error) => {
          logger.error('[FilesystemService] Cleanup failed', { error });
        });
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Clean up expired sandboxes
   */
  async cleanupExpiredSandboxes(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [sandboxId, sandbox] of this.sandboxes) {
      const age = now - sandbox.lastAccessedAt.getTime();

      const shouldCleanup =
        (sandbox.type === 'ephemeral' && age > this.config.ephemeralMaxAge) ||
        (sandbox.type === 'persistent' &&
          age > this.config.persistentInactivityTimeout);

      if (shouldCleanup) {
        await this.deleteSandbox(sandboxId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('[FilesystemService] Cleaned up expired sandboxes', {
        count: cleaned,
      });
    }

    return cleaned;
  }

  /**
   * Stop the filesystem service
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Final cleanup of ephemeral sandboxes
    for (const [sandboxId, sandbox] of this.sandboxes) {
      if (sandbox.type === 'ephemeral') {
        await this.deleteSandbox(sandboxId);
      }
    }

    logger.info('[FilesystemService] Shutdown complete');
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Generate a deterministic sandbox ID
   */
  private generateSandboxId(
    projectId: string,
    userId: string,
    type: 'persistent' | 'ephemeral',
  ): string {
    if (type === 'persistent') {
      // Deterministic ID for persistent sandboxes (same project/user = same sandbox)
      return `${type}-${userId}-${projectId}`;
    }
    // Unique ID for ephemeral sandboxes
    return `${type}-${userId}-${projectId}-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Parse sandbox ID to extract components
   */
  private parseSandboxId(
    sandboxId: string,
  ): { type: 'persistent' | 'ephemeral'; userId: string; projectId: string } | null {
    const parts = sandboxId.split('-');
    if (parts.length < 3) return null;

    const type = parts[0] as 'persistent' | 'ephemeral';
    if (type !== 'persistent' && type !== 'ephemeral') return null;

    return {
      type,
      userId: parts[1]!,
      projectId: parts[2]!,
    };
  }

  /**
   * Get SDK working directory for a sandbox
   */
  getSdkWorkingDirectory(sandbox: SandboxConfig): string {
    return sandbox.workingDir;
  }

  /**
   * Get SDK options for a sandbox
   */
  getSdkOptions(sandbox: SandboxConfig): {
    cwd: string;
    settingSources: ('project' | 'user')[];
  } {
    return {
      cwd: sandbox.workingDir,
      settingSources: ['project'],
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let filesystemServiceInstance: FilesystemService | null = null;

/**
 * Get or create the filesystem service instance
 */
export function getFilesystemService(): FilesystemService {
  if (!filesystemServiceInstance) {
    filesystemServiceInstance = new FilesystemService();
  }
  return filesystemServiceInstance;
}

/**
 * Initialize filesystem service with custom config
 */
export function initFilesystemService(
  config?: Partial<FilesystemConfig>,
): FilesystemService {
  filesystemServiceInstance = new FilesystemService(config);
  return filesystemServiceInstance;
}
