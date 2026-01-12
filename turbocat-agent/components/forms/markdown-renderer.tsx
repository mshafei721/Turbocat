'use client'

import * as React from 'react'
import { Streamdown } from 'streamdown'
import { cn } from '@/lib/utils'

/**
 * MarkdownRenderer - AI Native Markdown Renderer using Streamdown
 *
 * Features:
 * - Uses existing Streamdown library
 * - AI Native styling
 * - Syntax highlighting support
 * - Dark mode support
 * - Responsive typography
 *
 * Usage:
 * <MarkdownRenderer content="# Hello\n\nThis is **bold**" />
 */

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-sm sm:prose-base lg:prose-lg max-w-none',
        'prose-headings:font-medium prose-headings:tracking-tight',
        'prose-p:leading-7',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm',
        'prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-muted/50',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        'prose-img:rounded-lg prose-img:shadow-md',
        'prose-hr:border-border',
        'dark:prose-invert',
        'dark:prose-a:text-primary',
        'dark:prose-code:bg-slate-800',
        'dark:prose-pre:bg-slate-900',
        className,
      )}
    >
      <Streamdown>{content}</Streamdown>
    </div>
  )
}
