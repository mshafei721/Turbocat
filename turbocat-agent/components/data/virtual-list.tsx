'use client'

/**
 * VirtualList Component
 *
 * Virtualized list using TanStack Virtual with AI Native theme
 * Features: variable row heights, infinite scroll, loading state
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/data/virtual-list.tsx
 */

import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: number
  overscan?: number
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  className?: string
  itemClassName?: string
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className,
  itemClassName,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  // Infinite scroll logic
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse()

    if (!lastItem) return

    // Load more when user scrolls near the end
    if (lastItem.index >= items.length - 1 && hasMore && !isLoading && onLoadMore) {
      onLoadMore()
    }
  }, [virtualizer.getVirtualItems(), items.length, hasMore, isLoading, onLoadMore])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className={cn('h-full overflow-auto', className)}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={itemClassName}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-amber-600 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading more...</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * VirtualListItem - Helper component for consistent item styling
 */
interface VirtualListItemProps {
  children: React.ReactNode
  onClick?: () => void
  isSelected?: boolean
  className?: string
}

export function VirtualListItem({ children, onClick, isSelected, className }: VirtualListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3 border-b border-border',
        'hover:bg-warm-50 dark:hover:bg-slate-800/50',
        'transition-colors',
        onClick && 'cursor-pointer',
        isSelected && 'bg-amber-50 dark:bg-orange-900/20 border-l-2 border-l-amber-600 dark:border-l-orange-400',
        className,
      )}
    >
      {children}
    </div>
  )
}
