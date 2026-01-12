/**
 * InlineCode Component
 *
 * Simple inline code styling with AI Native theme
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/code/inline-code.tsx
 */

import { cn } from '@/lib/utils'

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded-md font-mono text-sm',
        'bg-amber-100 dark:bg-orange-900/30',
        'text-amber-800 dark:text-orange-300',
        'border border-amber-200 dark:border-orange-800/50',
        className,
      )}
    >
      {children}
    </code>
  )
}
