'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkle,
  User,
  PaperPlaneRight,
  Spinner,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
  className?: string
}

export function WorkspaceChat({
  messages,
  isLoading = false,
  onSendMessage,
  className,
}: WorkspaceChatProps) {
  const [input, setInput] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage?.(input.trim())
      setInput('')
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
      <div className="border-t border-slate-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or give instructions..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-foreground placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </Button>
        </form>
      </div>
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
