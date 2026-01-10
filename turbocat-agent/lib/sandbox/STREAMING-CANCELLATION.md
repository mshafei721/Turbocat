# Streaming Cancellation Patterns

This document describes how to use abort signals and timeouts with sandbox commands to enable graceful cancellation of long-running operations.

## Overview

The sandbox command system supports:
- **AbortController/AbortSignal** for manual cancellation
- **Automatic timeouts** with configurable duration
- **Combined signals** for both timeout and manual abort

## Quick Start

### Basic Timeout

```typescript
import { runCommandInSandbox } from '@/lib/sandbox/commands'

// Command with 60-second timeout
const result = await runCommandInSandbox(sandbox, 'npm', ['install'], {
  timeoutMs: 60000
})

if (result.aborted) {
  console.log('Command timed out:', result.error)
}
```

### Manual Cancellation

```typescript
import { runCommandInSandbox } from '@/lib/sandbox/commands'

// Create controller for manual cancellation
const controller = new AbortController()

// Start long-running command
const resultPromise = runCommandInSandbox(sandbox, 'npm', ['run', 'build'], {
  signal: controller.signal
})

// Cancel after 30 seconds if needed
const cancelTimeout = setTimeout(() => {
  controller.abort('Build taking too long')
}, 30000)

const result = await resultPromise
clearTimeout(cancelTimeout)

if (result.aborted) {
  console.log('Command was cancelled:', result.error)
}
```

### With Streaming Callbacks

```typescript
import { runStreamingCommandInSandbox } from '@/lib/sandbox/commands'

const controller = new AbortController()

const result = await runStreamingCommandInSandbox(
  sandbox,
  'npm',
  ['run', 'dev'],
  {
    signal: controller.signal,
    timeoutMs: 120000, // 2 minute timeout
    onStdout: (chunk) => {
      console.log('[stdout]', chunk)
      // Cancel if we see a specific pattern
      if (chunk.includes('Error:')) {
        controller.abort('Error detected in output')
      }
    },
    onStderr: (chunk) => console.error('[stderr]', chunk),
  }
)
```

## API Reference

### CommandOptions

```typescript
interface CommandOptions {
  /** AbortSignal for cancellation support */
  signal?: AbortSignal
  /** Timeout in milliseconds (defaults to 5 minutes) */
  timeoutMs?: number
}
```

### CommandResult

```typescript
interface CommandResult {
  success: boolean
  exitCode?: number
  output?: string
  error?: string
  command?: string
  /** Whether the command was aborted */
  aborted?: boolean
  /** Duration of command execution in milliseconds */
  durationMs?: number
}
```

### Error Types

```typescript
// Thrown when a command is manually aborted
class CommandAbortedError extends Error {
  name: 'CommandAbortedError'
}

// Thrown when a command exceeds its timeout
class CommandTimeoutError extends Error {
  name: 'CommandTimeoutError'
}
```

### Helper Function

```typescript
import { createCommandAbortController } from '@/lib/sandbox/commands'

// Create an AbortController with optional timeout
const { controller, signal, cleanup } = createCommandAbortController(60000)

try {
  const result = await runCommandInSandbox(sandbox, 'npm', ['test'], { signal })
} finally {
  cleanup() // Always cleanup to prevent memory leaks
}
```

## Patterns

### Pattern 1: Task Cancellation on User Request

```typescript
// In a React component or API route
let abortController: AbortController | null = null

async function startTask() {
  abortController = new AbortController()

  const result = await runCommandInSandbox(
    sandbox,
    'npm',
    ['run', 'build'],
    { signal: abortController.signal }
  )

  return result
}

function cancelTask() {
  abortController?.abort('User cancelled')
  abortController = null
}
```

### Pattern 2: Cascading Abort Through Multiple Commands

```typescript
async function runBuildPipeline(signal: AbortSignal) {
  // Each command respects the same abort signal
  const installResult = await runCommandInSandbox(
    sandbox, 'npm', ['install'], { signal }
  )
  if (!installResult.success || installResult.aborted) return installResult

  const lintResult = await runCommandInSandbox(
    sandbox, 'npm', ['run', 'lint'], { signal }
  )
  if (!lintResult.success || lintResult.aborted) return lintResult

  const buildResult = await runCommandInSandbox(
    sandbox, 'npm', ['run', 'build'], { signal }
  )
  return buildResult
}

// Usage
const controller = new AbortController()
const result = await runBuildPipeline(controller.signal)
```

### Pattern 3: Timeout with Cleanup

```typescript
async function runWithTimeout(sandbox: Sandbox, timeoutMs: number) {
  const result = await runCommandInSandbox(
    sandbox,
    'npm',
    ['run', 'long-task'],
    { timeoutMs }
  )

  if (result.aborted) {
    // Attempt cleanup
    await runCommandInSandbox(sandbox, 'pkill', ['-f', 'long-task'], {
      timeoutMs: 5000 // Short timeout for cleanup
    })
  }

  return result
}
```

### Pattern 4: Progress Monitoring with Early Exit

```typescript
async function runWithProgressCheck(sandbox: Sandbox) {
  const controller = new AbortController()
  let lastProgressTime = Date.now()

  const result = await runStreamingCommandInSandbox(
    sandbox,
    'npm',
    ['run', 'build'],
    {
      signal: controller.signal,
      timeoutMs: 300000, // 5 minute overall timeout
      onStdout: (chunk) => {
        lastProgressTime = Date.now()
        console.log(chunk)
      }
    }
  )

  // Also run a progress checker
  const progressChecker = setInterval(() => {
    if (Date.now() - lastProgressTime > 60000) {
      controller.abort('No progress for 60 seconds')
      clearInterval(progressChecker)
    }
  }, 10000)

  return result
}
```

## Default Behavior

- **Default timeout**: 5 minutes (`DEFAULT_COMMAND_TIMEOUT_MS`)
- **Abort handling**: Returns `{ aborted: true }` in result
- **Duration tracking**: All results include `durationMs`
- **Error messages**: Descriptive errors for timeout vs manual abort

## Best Practices

1. **Always use timeouts** for commands that could hang
2. **Clean up controllers** to prevent memory leaks
3. **Check `aborted` flag** in results for proper error handling
4. **Use cascading signals** for multi-step operations
5. **Log duration** for performance monitoring
6. **Handle cleanup** when aborting long-running processes

## Migration Guide

If you have existing code using the old API without abort support:

```typescript
// Before
const result = await runCommandInSandbox(sandbox, 'npm', ['install'])

// After (with timeout)
const result = await runCommandInSandbox(sandbox, 'npm', ['install'], {
  timeoutMs: 120000 // 2 minutes
})

// The function signature is backward compatible
// Old calls without options still work with default timeout
```
