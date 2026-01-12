/**
 * Chat Thread Component
 * Displays a list of messages in a conversation thread
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/chat-thread.tsx
 */

'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChatMessage } from './chat-message'
import type { UIMessage } from 'ai'

interface ChatThreadProps {
  messages: UIMessage[]
  isLoading?: boolean
  className?: string
  autoScroll?: boolean
  onMessageSelect?: (messageId: string) => void
}

export function ChatThread({
  messages,
  isLoading = false,
  className,
  autoScroll = true,
  onMessageSelect,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, autoScroll])

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex flex-col space-y-4 p-4 overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <ChatMessage
              message={message}
              isLatest={index === messages.length - 1}
              onSelect={onMessageSelect ? () => onMessageSelect(message.id) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-start"
        >
          <div className="flex items-center space-x-2 px-4 py-3 bg-muted/50 rounded-xl border border-border">
            <div className="flex space-x-1">
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
