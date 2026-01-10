'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkle,
  User,
  PaperPlaneRight,
  Spinner,
  ImageSquare,
  Microphone,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModelSelector } from './ModelSelector'
import { FeatureToolbar } from './FeatureToolbar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  updates?: number
  timestamp?: Date
}

interface WorkspaceChatProps {
  messages: ChatMessage[]
  isLoading?: boolean
  onSendMessage?: (message: string) => void
  onModelChange?: (modelId: string) => void
  onFeatureClick?: (featureId: string) => void
  selectedModel?: string
  activeFeatures?: string[]
  className?: string
}

export function WorkspaceChat({
  messages,
  isLoading = false,
  onSendMessage,
  onModelChange,
  onFeatureClick,
  selectedModel,
  activeFeatures = [],
  className,
}: WorkspaceChatProps) {
  const [input, setInput] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [input])

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage?.(input.trim())
      setInput('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">Loading history...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {message.role === 'assistant' ? (
                    <AssistantMessage message={message} />
                  ) : (
                    <UserMessage message={message} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-slate-400"
              >
                <Spinner size={16} className="animate-spin" />
                <span>Thinking...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <TooltipProvider>
        <div className="border-t border-slate-800 p-4 space-y-3">
          {/* Model Selector & Feature Toolbar */}
          <div className="flex items-center justify-between gap-2">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={isLoading}
            />
            <FeatureToolbar
              activeFeatures={activeFeatures}
              onFeatureClick={onFeatureClick}
              disabled={isLoading}
              variant="compact"
            />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-xl border border-slate-700 bg-slate-900/80 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or give instructions..."
                rows={1}
                disabled={isLoading}
                className={cn(
                  'w-full resize-none bg-transparent px-4 py-3 pr-24 text-sm outline-none',
                  'placeholder:text-slate-500',
                  'disabled:cursor-not-allowed',
                  'min-h-[44px] max-h-[150px]'
                )}
              />

              {/* Action Buttons */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* Image Upload */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-slate-200"
                      disabled={isLoading}
                    >
                      <ImageSquare size={16} />
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
                      className="h-7 w-7 text-slate-400 hover:text-slate-200"
                      disabled={isLoading}
                    >
                      <Microphone size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice input</TooltipContent>
                </Tooltip>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-lg',
                    !input.trim() && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Spinner size={16} className="animate-spin" />
                  ) : (
                    <PaperPlaneRight size={16} weight="fill" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Hint */}
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Shift + Enter</kbd> for new line
          </p>
        </div>
      </TooltipProvider>
    </div>
  )
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="space-y-2">
      {/* Update Count Badge */}
      {message.updates && message.updates > 0 && (
        <div className="flex items-center gap-2">
          <Sparkle size={14} className="text-primary" weight="fill" />
          <span className="text-xs font-medium text-primary">
            {message.updates} update{message.updates > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Message Content */}
      <div className="text-sm leading-relaxed text-slate-300">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700">
        <User size={14} className="text-slate-300" />
      </div>
      <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-foreground">
        {message.content}
      </div>
    </div>
  )
}

export default WorkspaceChat
