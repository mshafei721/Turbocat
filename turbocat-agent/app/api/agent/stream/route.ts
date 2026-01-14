/**
 * Agent Stream API Route
 *
 * Executes streaming agent queries using the Claude Agent SDK.
 * Returns Server-Sent Events for real-time streaming responses.
 */

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import type { AgentQueryOptions } from '@/lib/agent-sdk/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const { prompt, options = {} } = body as { prompt: string; options?: AgentQueryOptions }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Import the SDK dynamically
    let query: typeof import('@anthropic-ai/claude-agent-sdk').query
    try {
      const sdk = await import('@anthropic-ai/claude-agent-sdk')
      query = sdk.query
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Claude Agent SDK is not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const encoder = new TextEncoder()
    const startTime = Date.now()

    const stream = new ReadableStream({
      async start(controller) {
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

          for await (const message of result) {
            const event = { type: message.type, data: message }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }

          const durationMs = Date.now() - startTime
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', durationMs })}\n\n`))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Error executing agent stream:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to start stream' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
