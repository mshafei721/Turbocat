'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CaretDown,
  Broom,
  Clock,
  QrCode,
  ShareNetwork,
  Rocket,
  Sparkle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from './Logo'

interface WorkspaceHeaderProps {
  projectId: string
  projectName: string
  projectIcon?: string
  lastUpdated?: Date
  credits?: number
  onClearContext?: () => void
  onShare?: () => void
  onPublish?: () => void
  className?: string
}

function formatRelativeTime(date?: Date): string {
  if (!date) return 'Just now'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

export function WorkspaceHeader({
  projectId,
  projectName,
  projectIcon,
  lastUpdated,
  credits = 0,
  onClearContext,
  onShare,
  onPublish,
  className,
}: WorkspaceHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>

        <div className="h-5 w-px bg-slate-800" />

        {/* Project Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-foreground hover:bg-slate-800">
              {projectIcon ? (
                <span className="text-lg">{projectIcon}</span>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white">
                  {projectName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{projectName}</span>
              <CaretDown size={14} className="text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Switch project...</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/project/${projectId}/settings`}>Project settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Context */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-400 hover:text-foreground"
          onClick={onClearContext}
        >
          <Broom size={16} />
          <span className="hidden sm:inline">Clear context</span>
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Last Updated */}
        <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
          <Clock size={14} />
          Last updated: {formatRelativeTime(lastUpdated)}
        </div>

        {/* Credits */}
        <Badge variant="outline" className="gap-1.5 border-teal-500/30 bg-teal-500/10 text-teal-400">
          <Sparkle size={12} weight="fill" />
          ${credits.toFixed(2)}
        </Badge>

        {/* QR Code */}
        <Button variant="ghost" size="icon" className="hidden text-slate-400 sm:flex">
          <QrCode size={20} />
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onShare}
        >
          <ShareNetwork size={16} />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Publish */}
        <Button size="sm" className="gap-2" onClick={onPublish}>
          <Rocket size={16} weight="fill" />
          Publish
        </Button>
      </div>
    </motion.header>
  )
}

export default WorkspaceHeader
