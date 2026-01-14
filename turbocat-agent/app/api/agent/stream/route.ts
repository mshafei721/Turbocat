/**
 * Agent Stream API Route
 *
 * Proxies streaming agent queries to the backend API.
 * Returns Server-Sent Events for real-time streaming responses.
 */

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { agentStream, isBackendConfigured } from '@/lib/api/backend-client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check backend configuration
    if (!isBackendConfigured()) {
      return new Response(JSON.stringify({ success: false, error: 'Backend API is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { prompt, options = {} } = body as { prompt: string; options?: Record<string, unknown> }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Proxy to backend stream
    const result = await agentStream(prompt, options)

    if (!result.stream) {
      return new Response(JSON.stringify({ success: false, error: result.error || 'Failed to start stream' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Forward the backend stream
    return new Response(result.stream, {
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
