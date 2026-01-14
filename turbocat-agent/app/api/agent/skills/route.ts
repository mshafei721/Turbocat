/**
 * Agent Skills API Route
 *
 * Proxies skills list request to the backend API.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { agentSkills, isBackendConfigured } from '@/lib/api/backend-client'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check backend configuration
    if (!isBackendConfigured()) {
      return NextResponse.json({ error: 'Backend API is not configured' }, { status: 503 })
    }

    // Proxy to backend
    const result = await agentSkills()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching agent skills:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch skills' },
      { status: 500 },
    )
  }
}
