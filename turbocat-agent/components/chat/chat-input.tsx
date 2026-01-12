/**
 * Chat Input Component
 * Input field with submit button for sending messages
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/chat-input.tsx
 */

'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send, StopCircle, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSubmit: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
  allowAttachments?: boolean
}

export function ChatInput({
  onSubmit,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className,
  allowAttachments = false,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading || disabled) return

    onSubmit(trimmedInput)
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const canSend = input.trim().length > 0 && !isLoading && !disabled

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-end gap-2 p-4 bg-background border-t border-border',
        'sticky bottom-0 backdrop-blur-sm bg-background/95',
        className
      )}
    >
      {/* Attachment Button (Optional) */}
      {allowAttachments && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || disabled}
          className="flex-shrink-0 mb-1"
          onClick={() => {
            // TODO: Implement file attachment
            console.log('Attachment clicked')
          }}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
      )}

      {/* Input Field */}
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          maxLength={maxLength}
          rows={1}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none pr-12',
            'rounded-xl border-border',
            'focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-ai'
          )}
        />

        {/* Character Counter */}
        {input.length > maxLength * 0.8 && (
          <div
            className={cn(
              'absolute bottom-2 right-2 text-xs',
              input.length >= maxLength ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {input.length}/{maxLength}
          </div>
        )}
      </div>

      {/* Submit / Stop Button */}
      {isLoading ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onStop}
          className="flex-shrink-0 mb-1 text-destructive hover:text-destructive/90"
        >
          <StopCircle className="w-5 h-5" />
        </Button>
      ) : (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="default"
            size="icon"
            onClick={handleSubmit}
            disabled={!canSend}
            className={cn(
              'flex-shrink-0 mb-1 rounded-xl',
              'bg-primary hover:bg-primary/90',
              'shadow-ai-sm hover:shadow-ai-md',
              'transition-ai',
              canSend && 'hover:glow-primary'
            )}
          >
            <Send className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
