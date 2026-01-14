/**
 * Agent Query API Route
 *
 * Executes non-streaming agent queries using the Claude Agent SDK.
 * Uses the ANTHROPIC_API_KEY from server environment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import type { AgentQueryOptions, AgentResult, AgentMessage } from '@/lib/agent-sdk/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 503 },
      )
    }

    const body = await req.json()
    const { prompt, options = {} } = body as { prompt: string; options?: AgentQueryOptions }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 })
    }

    // Import the SDK dynamically
    let query: typeof import('@anthropic-ai/claude-agent-sdk').query
    try {
      const sdk = await import('@anthropic-ai/claude-agent-sdk')
      query = sdk.query
    } catch {
      return NextResponse.json(
        { success: false, error: 'Claude Agent SDK is not available' },
        { status: 503 },
      )
    }

    const messages: AgentMessage[] = []

    try {
      const result = query({
        prompt,
        options: {
          model: options.model || 'claude-sonnet-4-5-20250929',
          cwd: process.cwd(),
          maxTurns: options.maxTurns,
          systemPrompt: options.systemPrompt,
          allowedTools: options.allowedTools,
          settingSources: ['project'],
        },
      })

      let finalResult: string | undefined
      let totalCostUsd: number | undefined

      for await (const message of result) {
        if (message.type === 'text') {
          messages.push({
            type: 'text',
            content: message.text,
          })
        } else if (message.type === 'tool_use') {
          messages.push({
            type: 'tool_use',
            toolName: message.name,
            toolInput: message.input as Record<string, unknown>,
          })
        } else if (message.type === 'tool_result') {
          messages.push({
            type: 'tool_result',
            result: message.content,
          })
        } else if (message.type === 'result') {
          finalResult = message.result
          totalCostUsd = message.total_cost_usd
          messages.push({
            type: 'result',
            result: message.result,
            totalCostUsd: message.total_cost_usd,
          })
        }
      }

      const agentResult: AgentResult = {
        success: true,
        result: finalResult,
        totalCostUsd,
        messages,
      }

      return NextResponse.json(agentResult)
    } catch (execError) {
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error'
      messages.push({
        type: 'error',
        error: errorMessage,
      })

      return NextResponse.json({
        success: false,
        error: errorMessage,
        messages,
      })
    }
  } catch (error) {
    console.error('Error executing agent query:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute query' },
      { status: 500 },
    )
  }
}
