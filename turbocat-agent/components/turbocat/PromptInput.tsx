'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  PaperPlaneRight,
  Microphone,
  ImageSquare,
  Sparkle,
  Spinner,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PromptInputProps {
  onSubmit?: (prompt: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
  suggestions?: string[]
  maxLength?: number
}

export function PromptInput({
  onSubmit,
  placeholder = 'Describe the app you want to build...',
  isLoading = false,
  className,
  suggestions = [
    'A fitness tracking app with workout plans',
    'An expense tracker with charts',
    'A recipe app with shopping lists',
    'A habit tracker with streaks',
  ],
  maxLength = 2000,
}: PromptInputProps) {
  const [prompt, setPrompt] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [prompt])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (prompt.trim() && !isLoading) {
      onSubmit?.(prompt.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
    textareaRef.current?.focus()
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full max-w-3xl mx-auto', className)}>
        {/* Main Input Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative"
        >
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                'relative rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm',
                'shadow-lg shadow-slate-950/50',
                'transition-all duration-200',
                'hover:border-slate-600',
                'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                isLoading && 'opacity-80 pointer-events-none'
              )}
            >
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading}
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent px-5 py-4 pr-32 text-base outline-none',
                  'placeholder:text-slate-500',
                  'disabled:cursor-not-allowed',
                  'min-h-[56px] max-h-[200px]'
                )}
              />

              {/* Action Buttons */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* Character Count */}
                {prompt.length > 0 && (
                  <span className="text-xs text-slate-500 mr-2">
                    {prompt.length}/{maxLength}
                  </span>
                )}

                {/* Image Upload */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-200"
                      disabled={isLoading}
                    >
                      <ImageSquare size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach image</TooltipContent>
                </Tooltip>

                {/* Voice Input */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-200"
                      disabled={isLoading}
                    >
                      <Microphone size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice input</TooltipContent>
                </Tooltip>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-xl',
                    !prompt.trim() && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!prompt.trim() || isLoading}
                >
                  {isLoading ? (
                    <Spinner size={18} className="animate-spin" />
                  ) : (
                    <PaperPlaneRight size={18} weight="fill" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* AI Badge */}
          <div className="absolute -top-3 left-4">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkle size={12} className="text-primary" weight="fill" />
              AI Powered
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4"
          >
            <p className="text-xs text-slate-500 mb-2">Try these ideas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 * (index + 3) }}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
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
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default PromptInput
