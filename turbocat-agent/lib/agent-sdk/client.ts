'use client'

/**
 * Client-side utilities for Claude Agent SDK
 *
 * This module provides React hooks and utilities for interacting
 * with the Agent SDK through the backend API.
 */

import { useState, useCallback, useRef } from 'react'
import type { AgentQueryOptions, AgentResult, AgentStreamEvent, SkillDefinition } from './types'

/**
 * Hook for executing agent queries
 */
export function useAgentQuery() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (prompt: string, options: AgentQueryOptions = {}) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, options }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Agent query failed: ${response.statusText}`)
      }

      const data: AgentResult = await response.json()
      setResult(data)
      return data
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage, messages: [] }
    } finally {
      setLoading(false)
    }
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return {
    execute,
    cancel,
    loading,
    result,
    error,
  }
}

/**
 * Hook for streaming agent responses
 */
export function useAgentStream() {
  const [streaming, setStreaming] = useState(false)
  const [events, setEvents] = useState<AgentStreamEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stream = useCallback(
    async (
      prompt: string,
      options: AgentQueryOptions = {},
      onEvent?: (event: AgentStreamEvent) => void,
    ) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setStreaming(true)
      setError(null)
      setEvents([])

      try {
        const response = await fetch('/api/agent/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, options }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Agent stream failed: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: AgentStreamEvent = JSON.parse(line.slice(6))
                setEvents((prev) => [...prev, event])
                onEvent?.(event)
              } catch {
                // Skip malformed events
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
      } finally {
        setStreaming(false)
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return {
    stream,
    cancel,
    streaming,
    events,
    error,
  }
}

/**
 * Hook for fetching available skills
 */
export function useSkills() {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<SkillDefinition[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await globalThis.fetch('/api/agent/skills')

      if (!response.ok) {
        throw new Error(`Failed to fetch skills: ${response.statusText}`)
      }

      const data: SkillDefinition[] = await response.json()
      setSkills(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetch,
    loading,
    skills,
    error,
  }
}
