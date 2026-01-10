import { Sandbox } from '@vercel/sandbox'

// Project directory where repo is cloned
export const PROJECT_DIR = '/vercel/sandbox/project'

/**
 * Default timeout for sandbox commands (5 minutes)
 */
export const DEFAULT_COMMAND_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Result of a command execution
 */
export interface CommandResult {
  success: boolean
  exitCode?: number
  output?: string
  error?: string
  streamingLogs?: unknown[]
  command?: string
  /** Whether the command was aborted */
  aborted?: boolean
  /** Duration of command execution in milliseconds */
  durationMs?: number
}

/**
 * Options for running commands with abort/timeout support
 */
export interface CommandOptions {
  /** AbortSignal for cancellation support */
  signal?: AbortSignal
  /** Timeout in milliseconds (defaults to DEFAULT_COMMAND_TIMEOUT_MS) */
  timeoutMs?: number
}

/**
 * Options for streaming command execution
 */
export interface StreamingCommandOptions extends CommandOptions {
  onStdout?: (chunk: string) => void
  onStderr?: (chunk: string) => void
  onJsonLine?: (jsonData: unknown) => void
}

/**
 * Error thrown when a command is aborted
 */
export class CommandAbortedError extends Error {
  constructor(command: string, reason?: string) {
    super(`Command aborted: ${command}${reason ? ` (${reason})` : ''}`)
    this.name = 'CommandAbortedError'
  }
}

/**
 * Error thrown when a command times out
 */
export class CommandTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Command timed out after ${timeoutMs}ms: ${command}`)
    this.name = 'CommandTimeoutError'
  }
}

/**
 * Create an AbortController with optional timeout
 *
 * @param timeoutMs - Optional timeout in milliseconds
 * @returns Object with controller, signal, and cleanup function
 */
export function createCommandAbortController(timeoutMs?: number): {
  controller: AbortController
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout | undefined

  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new CommandTimeoutError('command', timeoutMs))
    }, timeoutMs)
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return { controller, signal: controller.signal, cleanup }
}

/**
 * Run a command in the sandbox with optional abort/timeout support
 *
 * @param sandbox - Vercel Sandbox instance
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Optional abort signal and timeout
 * @returns Command result with success status, output, and timing
 *
 * @example
 * // With timeout
 * const result = await runCommandInSandbox(sandbox, 'npm', ['install'], {
 *   timeoutMs: 60000 // 1 minute timeout
 * })
 *
 * @example
 * // With AbortController for manual cancellation
 * const controller = new AbortController()
 * const resultPromise = runCommandInSandbox(sandbox, 'npm', ['run', 'build'], {
 *   signal: controller.signal
 * })
 * // Cancel after 10 seconds
 * setTimeout(() => controller.abort(), 10000)
 */
export async function runCommandInSandbox(
  sandbox: Sandbox,
  command: string,
  args: string[] = [],
  options: CommandOptions = {},
): Promise<CommandResult> {
  const startTime = Date.now()
  const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command

  // Check if already aborted
  if (options.signal?.aborted) {
    return {
      success: false,
      error: 'Command was aborted before execution',
      command: fullCommand,
      aborted: true,
      durationMs: 0,
    }
  }

  // Create internal timeout controller if timeout specified
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS
  const { controller: timeoutController, cleanup: cleanupTimeout } = createCommandAbortController(timeoutMs)

  // Combine external signal with internal timeout
  const combinedAbortHandler = () => {
    timeoutController.abort()
  }
  options.signal?.addEventListener('abort', combinedAbortHandler)

  try {
    // Race the command execution against abort signals
    const executeCommand = async (): Promise<CommandResult> => {
      const result = await sandbox.runCommand(command, args)

      // Handle stdout and stderr properly
      let stdout = ''
      let stderr = ''

      try {
        stdout = await (result.stdout as () => Promise<string>)()
      } catch {
        // Failed to read stdout
      }

      try {
        stderr = await (result.stderr as () => Promise<string>)()
      } catch {
        // Failed to read stderr
      }

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        output: stdout,
        error: stderr,
        command: fullCommand,
        durationMs: Date.now() - startTime,
      }
    }

    // Create abort promise
    const abortPromise = new Promise<CommandResult>((_, reject) => {
      const handleAbort = () => {
        const reason = timeoutController.signal.reason
        if (reason instanceof CommandTimeoutError) {
          reject(reason)
        } else if (options.signal?.reason) {
          reject(new CommandAbortedError(fullCommand, String(options.signal.reason)))
        } else {
          reject(new CommandAbortedError(fullCommand))
        }
      }

      timeoutController.signal.addEventListener('abort', handleAbort)
    })

    // Race command against abort
    const result = await Promise.race([executeCommand(), abortPromise])
    return result
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof CommandAbortedError || error instanceof CommandTimeoutError) {
      return {
        success: false,
        error: error.message,
        command: fullCommand,
        aborted: true,
        durationMs,
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Command execution failed'
    return {
      success: false,
      error: errorMessage,
      command: fullCommand,
      durationMs,
    }
  } finally {
    cleanupTimeout()
    options.signal?.removeEventListener('abort', combinedAbortHandler)
  }
}

/**
 * Run a command in the project directory with optional abort/timeout support
 *
 * @param sandbox - Vercel Sandbox instance
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Optional abort signal and timeout
 * @returns Command result
 */
export async function runInProject(
  sandbox: Sandbox,
  command: string,
  args: string[] = [],
  options: CommandOptions = {},
): Promise<CommandResult> {
  // Properly escape arguments for shell execution
  const escapeArg = (arg: string) => {
    // Escape single quotes by replacing ' with '\''
    return `'${arg.replace(/'/g, "'\\''")}'`
  }

  const fullCommand = args.length > 0 ? `${command} ${args.map(escapeArg).join(' ')}` : command
  const cdCommand = `cd ${PROJECT_DIR} && ${fullCommand}`
  return await runCommandInSandbox(sandbox, 'sh', ['-c', cdCommand], options)
}

/**
 * Run a streaming command in the sandbox with optional abort/timeout support
 *
 * @param sandbox - Vercel Sandbox instance
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Streaming options with callbacks and abort support
 * @returns Command result
 *
 * @example
 * // Streaming with abort support
 * const controller = new AbortController()
 * const result = await runStreamingCommandInSandbox(
 *   sandbox,
 *   'npm',
 *   ['run', 'dev'],
 *   {
 *     signal: controller.signal,
 *     timeoutMs: 120000, // 2 minute timeout
 *     onStdout: (chunk) => console.log(chunk),
 *     onStderr: (chunk) => console.error(chunk),
 *   }
 * )
 */
export async function runStreamingCommandInSandbox(
  sandbox: Sandbox,
  command: string,
  args: string[] = [],
  options: StreamingCommandOptions = {},
): Promise<CommandResult> {
  const startTime = Date.now()
  const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command

  // Check if already aborted
  if (options.signal?.aborted) {
    return {
      success: false,
      error: 'Command was aborted before execution',
      command: fullCommand,
      aborted: true,
      durationMs: 0,
    }
  }

  // Create internal timeout controller if timeout specified
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS
  const { controller: timeoutController, cleanup: cleanupTimeout } = createCommandAbortController(timeoutMs)

  // Combine external signal with internal timeout
  const combinedAbortHandler = () => {
    timeoutController.abort()
  }
  options.signal?.addEventListener('abort', combinedAbortHandler)

  try {
    const executeCommand = async (): Promise<CommandResult> => {
      const result = await sandbox.runCommand(command, args)

      let stdout = ''
      let stderr = ''

      try {
        // stdout is always a function that returns a promise
        if (typeof result.stdout === 'function') {
          stdout = await result.stdout()
          // Process the complete output for JSON lines
          if (options.onJsonLine) {
            const lines = stdout.split('\n')
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine) {
                try {
                  const jsonData = JSON.parse(trimmedLine)
                  options.onJsonLine(jsonData)
                } catch {
                  // Not valid JSON, ignore
                }
              }
            }
          }
          if (options.onStdout) {
            options.onStdout(stdout)
          }
        }
      } catch {
        // Failed to read stdout
      }

      try {
        // stderr is always a function that returns a promise
        if (typeof result.stderr === 'function') {
          stderr = await result.stderr()
          if (options.onStderr) {
            options.onStderr(stderr)
          }
        }
      } catch {
        // Failed to read stderr
      }

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        output: stdout,
        error: stderr,
        command: fullCommand,
        durationMs: Date.now() - startTime,
      }
    }

    // Create abort promise
    const abortPromise = new Promise<CommandResult>((_, reject) => {
      const handleAbort = () => {
        const reason = timeoutController.signal.reason
        if (reason instanceof CommandTimeoutError) {
          reject(reason)
        } else if (options.signal?.reason) {
          reject(new CommandAbortedError(fullCommand, String(options.signal.reason)))
        } else {
          reject(new CommandAbortedError(fullCommand))
        }
      }

      timeoutController.signal.addEventListener('abort', handleAbort)
    })

    // Race command against abort
    const result = await Promise.race([executeCommand(), abortPromise])
    return result
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof CommandAbortedError || error instanceof CommandTimeoutError) {
      return {
        success: false,
        error: error.message,
        command: fullCommand,
        aborted: true,
        durationMs,
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to run streaming command in sandbox'
    return {
      success: false,
      error: errorMessage,
      command: fullCommand,
      durationMs,
    }
  } finally {
    cleanupTimeout()
    options.signal?.removeEventListener('abort', combinedAbortHandler)
  }
}
