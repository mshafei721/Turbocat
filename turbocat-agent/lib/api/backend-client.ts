/**
 * Backend API Client
 *
 * Provides authenticated access to the backend API from Next.js server components
 * and API routes. Automatically generates JWT tokens from the frontend session.
 *
 * Environment Variables Required:
 * - BACKEND_URL: Backend API base URL (e.g., https://api.turbocat.dev)
 * - JWT_ACCESS_SECRET: Must match backend's JWT_ACCESS_SECRET
 */

import { getServerSession } from '@/lib/session/get-server-session'
import { generateBackendAccessToken, isBackendJwtConfigured } from './backend-jwt'

export interface BackendClientOptions {
  timeout?: number
  headers?: Record<string, string>
}

export interface BackendResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  requestId?: string
}

/**
 * Get backend URL from environment
 */
function getBackendUrl(): string {
  const url = process.env.BACKEND_URL
  if (!url) {
    throw new Error('BACKEND_URL not configured')
  }
  return url.replace(/\/$/, '') // Remove trailing slash
}

/**
 * Check if backend client is properly configured
 */
export function isBackendConfigured(): boolean {
  return !!process.env.BACKEND_URL && isBackendJwtConfigured()
}

/**
 * Make an authenticated request to the backend API
 *
 * @param endpoint - API endpoint (e.g., '/agent/query')
 * @param options - Fetch options
 * @returns Backend response
 */
export async function backendFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & BackendClientOptions = {},
): Promise<BackendResponse<T>> {
  // Get frontend session
  const session = await getServerSession()
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Not authenticated',
    }
  }

  // Generate backend JWT from session
  const token = await generateBackendAccessToken({
    userId: session.user.id,
    email: session.user.email || '',
    role: 'USER',
  })

  const baseUrl = getBackendUrl()
  const url = `${baseUrl}/api/v1${endpoint}`

  const { timeout = 30000, headers: customHeaders, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...customHeaders,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        requestId: data.requestId,
      }
    }

    return {
      success: true,
      data: data.data || data,
      requestId: data.requestId,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Make a streaming request to the backend API
 *
 * @param endpoint - API endpoint (e.g., '/agent/stream')
 * @param body - Request body
 * @returns ReadableStream of SSE events
 */
export async function backendStream(
  endpoint: string,
  body: unknown,
): Promise<{ stream: ReadableStream<Uint8Array> | null; error?: string }> {
  // Get frontend session
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { stream: null, error: 'Not authenticated' }
  }

  // Generate backend JWT from session
  const token = await generateBackendAccessToken({
    userId: session.user.id,
    email: session.user.email || '',
    role: 'USER',
  })

  const baseUrl = getBackendUrl()
  const url = `${baseUrl}/api/v1${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json()
      return { stream: null, error: data.error || `Request failed with status ${response.status}` }
    }

    return { stream: response.body }
  } catch (error) {
    return { stream: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Agent API - Execute non-streaming query
 */
export async function agentQuery(prompt: string, options?: Record<string, unknown>) {
  return backendFetch('/agent/query', {
    method: 'POST',
    body: JSON.stringify({ prompt, options }),
  })
}

/**
 * Agent API - Execute streaming query
 */
export async function agentStream(prompt: string, options?: Record<string, unknown>) {
  return backendStream('/agent/stream', { prompt, options })
}

/**
 * Agent API - List available skills
 */
export async function agentSkills() {
  return backendFetch('/agent/skills')
}

/**
 * Agent API - Project chat
 */
export async function agentChat(projectId: string, prompt: string, options?: Record<string, unknown>) {
  return backendFetch(`/agent/chat/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ prompt, options }),
  })
}

/**
 * Agent API - Get chat history
 */
export async function agentChatHistory(projectId: string, sessionId?: string) {
  const params = sessionId ? `?sessionId=${sessionId}` : ''
  return backendFetch(`/agent/chat/${projectId}/history${params}`)
}
