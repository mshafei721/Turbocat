'use client'

/**
 * CodeBlock Component
 *
 * Syntax-highlighted code block using Shiki with AI Native theme
 * Features: copy-to-clipboard, language badge, line numbers
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/code/code-block.tsx
 */

import { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({ code, language, filename, showLineNumbers = true, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true)
        const result = await codeToHtml(code, {
          lang: language,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          defaultColor: false,
        })
        setHtml(result)
      } catch (error) {
        console.error('Failed to highlight code:', error)
        // Fallback to plain text
        setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
      } finally {
        setIsLoading(false)
      }
    }

    highlightCode()
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative rounded-xl bg-warm-100 dark:bg-slate-900 border border-border overflow-hidden shadow-ai-md',
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-warm-50 dark:bg-slate-800">
          {filename && <span className="text-xs font-mono text-muted-foreground">{filename}</span>}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-warm-200 dark:bg-slate-700 text-muted-foreground">
              {language}
            </span>
          </div>
        </div>
        <div className="p-4 animate-pulse">
          <div className="h-4 bg-warm-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-warm-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
          <div className="h-4 bg-warm-200 dark:bg-slate-700 rounded w-5/6" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative rounded-xl bg-warm-100 dark:bg-slate-900 border border-border overflow-hidden shadow-ai-md transition-ai hover:shadow-ai-lg',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-warm-50 dark:bg-slate-800">
        {filename ? (
          <span className="text-xs font-mono text-muted-foreground truncate">{filename}</span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-100 dark:bg-orange-900/30 text-amber-700 dark:text-orange-400">
            {language}
          </span>
        )}
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-100 dark:bg-orange-900/30 text-amber-700 dark:text-orange-400">
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-warm-200 dark:hover:bg-slate-700 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-lime-600 dark:text-teal-400" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <div
          className={cn(
            'code-block-content',
            showLineNumbers && 'line-numbers',
            '[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-4',
            '[&_code]:!bg-transparent [&_code]:font-mono [&_code]:text-sm',
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

/**
 * Escape HTML special characters
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
