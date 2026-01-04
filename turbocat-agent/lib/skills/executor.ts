/**
 * Skill Executor
 *
 * Executes skills with complete trace management, MCP dependency resolution,
 * and step-by-step execution tracking.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/executor.ts
 */

import { db } from '../db/client'
import { skillExecutions, type InsertSkillExecution } from '../db/schema/skills'
import { nanoid } from 'nanoid'
import type { ExecutionContext, ExecutionTrace, ExecutionStep, MCPDependency } from './types'

/**
 * SkillExecutor class
 *
 * Manages skill execution with complete trace and MCP dependency validation.
 */
export class SkillExecutor {
  /**
   * Execute a skill with full trace management
   *
   * @param context - Execution context with skill, prompt, and dependencies
   * @returns Complete execution trace
   */
  async execute(context: ExecutionContext): Promise<ExecutionTrace> {
    const startTime = Date.now()
    const trace = context.trace

    try {
      // Update trace status to running
      trace.status = 'running'
      trace.startedAt = new Date()

      // Step 1: Verify MCP dependencies
      await this.addStep(trace, 'Verifying MCP dependencies', async () => {
        await this.verifyMCPDependencies(context)
      })

      // Step 2: Parse skill content
      let skillInstructions = ''
      await this.addStep(trace, 'Parsing skill content', async () => {
        skillInstructions = this.parseSkillContent(context.skill)
      })

      // Step 3: Execute skill logic
      await this.addStep(trace, 'Executing skill instructions', async () => {
        await this.executeSkillLogic(context, skillInstructions)
      })

      // Step 4: Write outputs (if any)
      await this.addStep(trace, 'Writing output files', async () => {
        await this.writeOutputs(context)
      })

      // Mark as completed
      trace.status = 'completed'
      trace.completedAt = new Date()
      trace.durationMs = Date.now() - startTime

      // Log execution to database
      await this.logExecution(context)

      return trace
    } catch (error) {
      // Handle execution failure
      trace.status = 'failed'
      trace.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      trace.completedAt = new Date()
      trace.durationMs = Date.now() - startTime

      // Mark last step as failed
      if (trace.steps.length > 0) {
        const lastStep = trace.steps[trace.steps.length - 1]
        lastStep.status = 'failed'
        lastStep.error = trace.errorMessage
        lastStep.completedAt = new Date()
      }

      // Log failed execution
      await this.logExecution(context)

      return trace
    }
  }

  /**
   * Verify that all required MCP dependencies are available
   *
   * @param context - Execution context
   * @throws Error if required MCP server is not available
   */
  private async verifyMCPDependencies(context: ExecutionContext): Promise<void> {
    const { skill, mcpConnections } = context

    for (const dependency of skill.mcpDependencies || []) {
      const isConnected = mcpConnections.get(dependency.server)

      if (dependency.required && !isConnected) {
        throw new Error(
          `Required MCP server "${dependency.server}" is not available. ` +
            `Required capabilities: ${dependency.capabilities.join(', ')}`,
        )
      }

      // Log warning for optional dependencies
      if (!dependency.required && !isConnected) {
        console.warn(`Optional MCP server "${dependency.server}" is not available, continuing without it`)
      }
    }
  }

  /**
   * Parse skill content to extract instructions
   *
   * @param skill - Skill definition
   * @returns Parsed instructions as markdown
   */
  private parseSkillContent(skill: any): string {
    // Extract markdown body from SKILL.md content
    // The content field contains the full SKILL.md including frontmatter
    // We need to extract just the body (everything after the second ---)

    const content = skill.content
    const frontmatterEnd = content.indexOf('---', 4) // Find second ---

    if (frontmatterEnd === -1) {
      // No frontmatter, return full content
      return content
    }

    // Return everything after the frontmatter
    return content.substring(frontmatterEnd + 3).trim()
  }

  /**
   * Execute the skill's core logic
   *
   * This is a simplified implementation. In production, this would:
   * 1. Parse the skill instructions
   * 2. Create a specialized AI agent context
   * 3. Execute the instructions using the AI agent
   * 4. Capture outputs and results
   *
   * @param context - Execution context
   * @param instructions - Parsed skill instructions
   */
  private async executeSkillLogic(context: ExecutionContext, instructions: string): Promise<void> {
    // For now, this is a placeholder that simulates execution
    // In production, this would integrate with the AI agent system

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100))

    // In a real implementation, this would:
    // 1. Create an AI agent with the skill instructions as context
    // 2. Execute the agent with the user's prompt
    // 3. Capture file changes, API calls, etc.
    // 4. Store results in trace.outputFiles

    console.log(`Executing skill: ${context.skill.name}`)
    console.log(`Instructions length: ${instructions.length} characters`)
    console.log(`User prompt: ${context.prompt}`)
  }

  /**
   * Write outputs to filesystem or sandbox
   *
   * @param context - Execution context
   */
  private async writeOutputs(context: ExecutionContext): Promise<void> {
    // Placeholder for writing outputs
    // In production, this would write files to the sandbox or filesystem
    // based on what the skill execution produced

    context.trace.outputFiles = context.trace.outputFiles || []

    // Example: In real implementation, files would be written here
    // For now, just log that outputs would be written
    console.log(`Writing outputs to: ${context.workingDirectory}`)
  }

  /**
   * Log execution to database
   *
   * @param context - Execution context
   */
  private async logExecution(context: ExecutionContext): Promise<void> {
    const executionLog = {
      id: nanoid(),
      skillId: context.skill.id!,
      userId: context.userId,
      taskId: context.taskId,
      inputPrompt: context.prompt,
      detectedConfidence: context.confidence.toString(),
      executionTrace: context.trace as any, // Cast to satisfy type
      status: context.trace.status,
      errorMessage: context.trace.errorMessage,
      durationMs: context.trace.durationMs,
    }

    try {
      await db.insert(skillExecutions).values(executionLog)
    } catch (error) {
      console.error('Failed to log skill execution:', error)
      // Don't throw - logging failure shouldn't break execution
    }
  }

  /**
   * Add an execution step to the trace
   *
   * @param trace - Execution trace
   * @param description - Step description
   * @param action - Async action to execute
   */
  private async addStep(trace: ExecutionTrace, description: string, action: () => Promise<void>): Promise<void> {
    const stepNumber = trace.steps.length + 1
    const step: ExecutionStep = {
      step: stepNumber,
      description,
      status: 'running',
      startedAt: new Date(),
    }

    trace.steps.push(step)

    try {
      await action()
      step.status = 'completed'
      step.completedAt = new Date()
    } catch (error) {
      step.status = 'failed'
      step.error = error instanceof Error ? error.message : 'Unknown error'
      step.completedAt = new Date()
      throw error // Re-throw to stop execution
    }
  }
}
