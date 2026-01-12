/**
 * EmptyState Component
 *
 * Reusable empty state with AI Native theme
 * Variants: no-data, no-results, error
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/data/empty-state.tsx
 */

import { FileQuestion, Search, AlertCircle, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'error'
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const VARIANT_CONFIGS = {
  'no-data': {
    icon: <FolderOpen className="w-12 h-12 text-muted-foreground" />,
    title: 'No data yet',
    description: 'Get started by creating your first item',
  },
  'no-results': {
    icon: <Search className="w-12 h-12 text-muted-foreground" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters',
  },
  error: {
    icon: <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />,
    title: 'Something went wrong',
    description: 'Unable to load data. Please try again.',
  },
}

export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIGS[variant]
  const displayIcon = icon ?? config.icon
  const displayTitle = title ?? config.title
  const displayDescription = description ?? config.description

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center',
        'rounded-xl border border-dashed border-border',
        'bg-warm-50 dark:bg-slate-900/50',
        className,
      )}
    >
      {/* Icon */}
      <div className="mb-4">{displayIcon}</div>

      {/* Title */}
      <h3 className="text-lg font-medium text-foreground mb-2">{displayTitle}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">{displayDescription}</p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'transition-colors',
            'text-sm font-medium',
            'shadow-ai-sm hover:shadow-ai-md',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * EmptyStateInline - Compact version for inline use
 */
interface EmptyStateInlineProps {
  message: string
  className?: string
}

export function EmptyStateInline({ message, className }: EmptyStateInlineProps) {
  return (
    <div className={cn('flex items-center justify-center p-4 text-center', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileQuestion className="w-4 h-4" />
        <span>{message}</span>
      </div>
    </div>
  )
}
