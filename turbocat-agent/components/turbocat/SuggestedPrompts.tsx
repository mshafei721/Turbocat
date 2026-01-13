'use client'

import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'

interface Suggestion {
  id: string
  text: string
  category: string
  icon?: string
}

interface SuggestedPromptsProps {
  projectId: string
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ projectId, onSelect }: SuggestedPromptsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [projectId])

  const fetchSuggestions = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${backendUrl}/api/v1/projects/${projectId}/suggestions`, {
        method: 'GET',
        credentials: 'include', // Send httpOnly cookies with session
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.data.suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || suggestions.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 py-2 overflow-x-auto">
      <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
        <Sparkle size={16} />
        Suggested:
      </span>
      <div className="flex gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.text)}
            className="chip px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  )
}
