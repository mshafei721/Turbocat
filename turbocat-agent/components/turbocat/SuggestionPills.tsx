'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  useDynamicSuggestions,
  type SuggestionCategory,
} from '@/lib/hooks/use-dynamic-suggestions'

interface SuggestionPillsProps {
  onSelect: (suggestion: string) => void
  className?: string
  showCategories?: boolean
  customSuggestions?: SuggestionCategory[]
  recentPrompts?: string[]
}

export function SuggestionPills({
  onSelect,
  className,
  showCategories = false,
  customSuggestions,
  recentPrompts = [],
}: SuggestionPillsProps) {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    suggestions,
    getRandomSuggestions,
  } = useDynamicSuggestions({
    customSuggestions,
    recentPrompts,
  })

  const [displayedSuggestions, setDisplayedSuggestions] = React.useState(suggestions)

  React.useEffect(() => {
    setDisplayedSuggestions(suggestions)
  }, [suggestions])

  const handleShuffle = () => {
    setDisplayedSuggestions(getRandomSuggestions(4))
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Category tabs */}
      {showCategories && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence mode="popLayout">
          {displayedSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
              onClick={() => onSelect(suggestion)}
              className={cn(
                'rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-400',
                'transition-all duration-200',
                'hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
            >
              {suggestion}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Shuffle button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleShuffle}
          className="h-8 w-8 text-slate-500 hover:text-slate-300"
        >
          <Shuffle size={16} />
        </Button>
      </div>
    </div>
  )
}

export default SuggestionPills
