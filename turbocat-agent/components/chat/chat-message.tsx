/**
 * Chat Message Component
 * Displays a single message with role-based styling
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/chat/chat-message.tsx
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StreamingText } from './streaming-text'
import { ToolCall } from './tool-call'
import type { UIMessage } from 'ai'

interface ChatMessageProps {
  message: UIMessage
  isLatest?: boolean
  onSelect?: () => void
  className?: string
}

export function ChatMessage({ message, isLatest = false, onSelect, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  // Type-safe access to message properties (AI SDK v5 compatibility)
  const msg = message as any
  const content = msg.content || ''
  const toolInvocations = msg.toolInvocations || msg.tool_calls || []
  const createdAt = msg.createdAt || msg.created_at

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleStyles = {
    user: {
      bg: 'bg-primary/10 dark:bg-primary/20',
      border: 'border-primary/20 dark:border-primary/30',
      text: 'text-foreground',
      icon: User,
      iconBg: 'bg-primary text-primary-foreground',
    },
    assistant: {
      bg: 'bg-accent/10 dark:bg-accent/20',
      border: 'border-accent/20 dark:border-accent/30',
      text: 'text-foreground',
      icon: Bot,
      iconBg: 'bg-accent text-accent-foreground',
    },
    system: {
      bg: 'bg-muted',
      border: 'border-border',
      text: 'text-muted-foreground',
      icon: Bot,
      iconBg: 'bg-muted-foreground text-background',
    },
  }

  const style = roleStyles[message.role] || roleStyles.assistant
  const Icon = style.icon

  // Tool calls are already extracted above
  const toolCalls = toolInvocations

  return (
    <motion.div
      layout
      className={cn(
        'group relative flex gap-3 rounded-xl p-4 border transition-ai',
        style.bg,
        style.border,
        'hover:shadow-ai-md',
        onSelect && 'cursor-pointer hover:scale-[1.01]',
        className
      )}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', style.iconBg)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Role Label */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground capitalize">{message.role}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0">
              {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Message Text */}
        <div className={cn('prose prose-sm dark:prose-invert max-w-none', style.text)}>
          {isLatest && isAssistant ? (
            <StreamingText text={content} />
          ) : (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          )}
        </div>

        {/* Tool Calls */}
        {toolCalls.length > 0 && (
          <div className="space-y-2 mt-3">
            {toolCalls.map((tool: any, index: number) => (
              <ToolCall key={tool.toolCallId || index} toolCall={tool} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        {createdAt && (
          <div className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
