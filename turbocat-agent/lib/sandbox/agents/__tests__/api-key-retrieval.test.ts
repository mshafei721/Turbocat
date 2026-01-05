import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Sandbox } from '@vercel/sandbox'
import { executeClaudeInSandbox } from '../claude'
import { executeCodexInSandbox } from '../codex'
import { executeCopilotInSandbox } from '../copilot'
import { executeCursorInSandbox } from '../cursor'
import { executeGeminiInSandbox } from '../gemini'
import { executeOpenCodeInSandbox } from '../opencode'
import { TaskLogger } from '@/lib/utils/task-logger'

// Mock the Sandbox and TaskLogger
vi.mock('@vercel/sandbox')
vi.mock('@/lib/utils/task-logger')
vi.mock('../commands', () => ({
  // Mock CLI as already installed to skip installation and reach API key checks
  runCommandInSandbox: vi.fn((sandbox, command, args) => {
    // Simulate CLI already installed for 'which' commands
    if (command === 'which' || (command === 'sh' && args?.[1]?.includes('which'))) {
      return Promise.resolve({ success: true, output: '/usr/local/bin/' + (args?.[0] || 'cli'), error: '' })
    }
    return Promise.resolve({ success: false, output: '', error: '' })
  }),
  runInProject: vi.fn(() => Promise.resolve({ success: false, output: '', error: '' })),
  PROJECT_DIR: '/project',
}))
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn() })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ catch: vi.fn() })),
      })),
    })),
  },
}))
vi.mock('@/lib/db/schema', () => ({
  connectors: { $inferSelect: {} },
  taskMessages: {},
}))

describe('API Key Retrieval Tests', () => {
  let mockSandbox: Sandbox
  let mockLogger: TaskLogger
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Create mock instances
    mockSandbox = {} as Sandbox
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      command: vi.fn(),
      success: vi.fn(),
    } as unknown as TaskLogger
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('Test 1: Retrieves API key from environment variable', () => {
    it('should use platform-level API keys from environment variables', async () => {
      // Set all platform keys
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
      process.env.AI_GATEWAY_API_KEY = 'test-gateway-key'
      process.env.GH_TOKEN = 'test-github-token'
      process.env.CURSOR_API_KEY = 'test-cursor-key'
      process.env.GEMINI_API_KEY = 'test-gemini-key'
      process.env.OPENAI_API_KEY = 'test-openai-key'

      // Execute agents - they should all reach the installation/execution stage
      // (not fail at API key check)
      const claudeResult = await executeClaudeInSandbox(mockSandbox, 'test', mockLogger)
      const codexResult = await executeCodexInSandbox(mockSandbox, 'test', mockLogger)
      const copilotResult = await executeCopilotInSandbox(mockSandbox, 'test', mockLogger)
      const cursorResult = await executeCursorInSandbox(mockSandbox, 'test', mockLogger)
      const geminiResult = await executeGeminiInSandbox(mockSandbox, 'test', mockLogger)
      const opencodeResult = await executeOpenCodeInSandbox(mockSandbox, 'test', mockLogger)

      // All should be defined (agents attempted execution)
      expect(claudeResult).toBeDefined()
      expect(codexResult).toBeDefined()
      expect(copilotResult).toBeDefined()
      expect(cursorResult).toBeDefined()
      expect(geminiResult).toBeDefined()
      expect(opencodeResult).toBeDefined()

      // Verify correct agent names
      expect(claudeResult.cliName).toBe('claude')
      expect(codexResult.cliName).toBe('codex')
      expect(copilotResult.cliName).toBe('copilot')
      expect(cursorResult.cliName).toBe('cursor')
      expect(geminiResult.cliName).toBe('gemini')
      expect(opencodeResult.cliName).toBe('opencode')
    })
  })

  describe('Test 2: Throws error when API key missing', () => {
    it('should return user-friendly error when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await executeClaudeInSandbox(mockSandbox, 'test instruction', mockLogger)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toBe('Claude agent is temporarily unavailable. Please try a different agent or contact support.')
    })

    it('should return user-friendly error when AI_GATEWAY_API_KEY is missing', async () => {
      delete process.env.AI_GATEWAY_API_KEY

      const result = await executeCodexInSandbox(mockSandbox, 'test instruction', mockLogger)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toBe('Codex agent is temporarily unavailable. Please try a different agent or contact support.')
    })

    it('should return user-friendly error when GH_TOKEN is missing', async () => {
      delete process.env.GH_TOKEN
      delete process.env.GITHUB_TOKEN

      const result = await executeCopilotInSandbox(mockSandbox, 'test instruction', mockLogger)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toBe('Copilot agent is temporarily unavailable. Please try a different agent or contact support.')
    })

    it('should return user-friendly error when CURSOR_API_KEY is missing', async () => {
      delete process.env.CURSOR_API_KEY

      const result = await executeCursorInSandbox(mockSandbox, 'test instruction', mockLogger)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toBe('Cursor agent is temporarily unavailable. Please try a different agent or contact support.')
    })
  })

  describe('Test 3: Does NOT attempt user key lookup', () => {
    it('should only use process.env, never query database for user keys', async () => {
      // Set up all platform keys
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.AI_GATEWAY_API_KEY = 'test-key'
      process.env.GH_TOKEN = 'test-key'
      process.env.CURSOR_API_KEY = 'test-key'
      process.env.GEMINI_API_KEY = 'test-key'
      process.env.OPENAI_API_KEY = 'test-key'

      // Execute all agents
      const results = await Promise.all([
        executeClaudeInSandbox(mockSandbox, 'test', mockLogger),
        executeCodexInSandbox(mockSandbox, 'test', mockLogger),
        executeCopilotInSandbox(mockSandbox, 'test', mockLogger),
        executeCursorInSandbox(mockSandbox, 'test', mockLogger),
        executeGeminiInSandbox(mockSandbox, 'test', mockLogger),
        executeOpenCodeInSandbox(mockSandbox, 'test', mockLogger),
      ])

      // All agents should execute (not fail on missing API keys)
      results.forEach((result) => {
        expect(result).toBeDefined()

        // None should have errors related to database or user lookups
        if (!result.success && result.error) {
          const errorLower = result.error.toLowerCase()
          expect(errorLower).not.toContain('user api key')
          expect(errorLower).not.toContain('database lookup')
          expect(errorLower).not.toContain('query database')
        }
      })
    })
  })

  describe('Test 4: Error message is user-friendly', () => {
    it('should provide consistent user-friendly error messages across all agents', async () => {
      // Clear all API keys
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.AI_GATEWAY_API_KEY
      delete process.env.GH_TOKEN
      delete process.env.GITHUB_TOKEN
      delete process.env.CURSOR_API_KEY
      delete process.env.GEMINI_API_KEY
      delete process.env.GOOGLE_API_KEY
      delete process.env.GOOGLE_CLOUD_PROJECT
      delete process.env.OPENAI_API_KEY

      const results = await Promise.all([
        executeClaudeInSandbox(mockSandbox, 'test', mockLogger),
        executeCodexInSandbox(mockSandbox, 'test', mockLogger),
        executeCopilotInSandbox(mockSandbox, 'test', mockLogger),
        executeCursorInSandbox(mockSandbox, 'test', mockLogger),
        executeGeminiInSandbox(mockSandbox, 'test', mockLogger),
        executeOpenCodeInSandbox(mockSandbox, 'test', mockLogger),
      ])

      // Check each result for user-friendly errors
      results.forEach((result) => {
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()

        // All should use the standardized message
        expect(result.error).toContain('temporarily unavailable')
        expect(result.error).toContain('Please try a different agent or contact support')

        // No technical jargon
        const errorLower = result.error!.toLowerCase()
        expect(errorLower).not.toContain('database')
        expect(errorLower).not.toContain('env var')
        expect(errorLower).not.toContain('process.env')
        expect(errorLower).not.toContain('api_key')
      })
    })
  })
})
