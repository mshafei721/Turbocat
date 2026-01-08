'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  FolderSimplePlus,
  Rocket,
  Lightning,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: Icon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: IconComponent = FolderSimplePlus,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50"
      >
        <IconComponent size={40} className="text-slate-400" />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mb-6 max-w-sm text-sm text-slate-400">{description}</p>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            <Lightning size={18} weight="fill" />
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Preset empty states
export function NoProjectsEmptyState({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <EmptyState
      icon={Rocket}
      title="No projects yet"
      description="Start building your first app by describing what you want to create. Our AI will help bring your vision to life."
      actionLabel="Create your first project"
      onAction={onCreateProject}
    />
  )
}

export default EmptyState
