'use client'

import * as React from 'react'

export interface SuggestionCategory {
  id: string
  label: string
  suggestions: string[]
}

const DEFAULT_SUGGESTIONS: SuggestionCategory[] = [
  {
    id: 'apps',
    label: 'App Ideas',
    suggestions: [
      'A fitness tracking app with workout plans',
      'An expense tracker with charts and budgets',
      'A recipe app with shopping lists',
      'A habit tracker with streaks and reminders',
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    suggestions: [
      'A task management app with Kanban boards',
      'A note-taking app with markdown support',
      'A time tracking app with reports',
      'A calendar app with scheduling',
    ],
  },
  {
    id: 'social',
    label: 'Social',
    suggestions: [
      'A chat app with real-time messaging',
      'A social feed with posts and comments',
      'An event planning app with RSVPs',
      'A group collaboration workspace',
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    suggestions: [
      'A product catalog with shopping cart',
      'An inventory management system',
      'A subscription service dashboard',
      'A marketplace with seller profiles',
    ],
  },
]

interface UseDynamicSuggestionsOptions {
  initialCategory?: string
  recentPrompts?: string[]
  customSuggestions?: SuggestionCategory[]
}

export function useDynamicSuggestions(options: UseDynamicSuggestionsOptions = {}) {
  const {
    initialCategory = 'apps',
    recentPrompts = [],
    customSuggestions,
  } = options

  const [activeCategory, setActiveCategory] = React.useState(initialCategory)
  const [searchQuery, setSearchQuery] = React.useState('')

  const categories = customSuggestions || DEFAULT_SUGGESTIONS

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0]

  const filteredSuggestions = React.useMemo(() => {
    let suggestions = currentCategory.suggestions

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      suggestions = categories
        .flatMap((c) => c.suggestions)
        .filter((s) => s.toLowerCase().includes(query))
    }

    // Remove recently used prompts from suggestions
    if (recentPrompts.length > 0) {
      suggestions = suggestions.filter(
        (s) => !recentPrompts.some((r) => r.toLowerCase() === s.toLowerCase())
      )
    }

    return suggestions.slice(0, 4)
  }, [currentCategory.suggestions, searchQuery, recentPrompts, categories])

  const getRandomSuggestions = React.useCallback((count: number = 4) => {
    const allSuggestions = categories.flatMap((c) => c.suggestions)
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }, [categories])

  const getSuggestionsForContext = React.useCallback(
    (context: string) => {
      const contextLower = context.toLowerCase()
      
      // Find relevant category based on context keywords
      if (contextLower.includes('fitness') || contextLower.includes('health') || contextLower.includes('workout')) {
        return categories.find((c) => c.id === 'apps')?.suggestions.slice(0, 4) || []
      }
      if (contextLower.includes('task') || contextLower.includes('note') || contextLower.includes('schedule')) {
        return categories.find((c) => c.id === 'productivity')?.suggestions.slice(0, 4) || []
      }
      if (contextLower.includes('chat') || contextLower.includes('social') || contextLower.includes('message')) {
        return categories.find((c) => c.id === 'social')?.suggestions.slice(0, 4) || []
      }
      if (contextLower.includes('shop') || contextLower.includes('product') || contextLower.includes('inventory')) {
        return categories.find((c) => c.id === 'ecommerce')?.suggestions.slice(0, 4) || []
      }

      return getRandomSuggestions(4)
    },
    [categories, getRandomSuggestions]
  )

  return {
    categories,
    activeCategory,
    setActiveCategory,
    currentCategory,
    suggestions: filteredSuggestions,
    searchQuery,
    setSearchQuery,
    getRandomSuggestions,
    getSuggestionsForContext,
  }
}

export default useDynamicSuggestions
