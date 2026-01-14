/**
 * Agent Query API Route
 *
 * Proxies non-streaming agent queries to the backend API.
 * Automatically handles authentication via the backend client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { agentQuery, isBackendConfigured } from '@/lib/api/backend-client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check backend configuration
    if (!isBackendConfigured()) {
      return NextResponse.json({ success: false, error: 'Backend API is not configured' }, { status: 503 })
    }

    const body = await req.json()
    const { prompt, options = {} } = body as { prompt: string; options?: Record<string, unknown> }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 })
    }

    // Proxy to backend
    const result = await agentQuery(prompt, options)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error executing agent query:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute query' },
      { status: 500 },
    )
  }
}
