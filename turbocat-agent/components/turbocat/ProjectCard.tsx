'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DeviceMobile,
  Desktop,
  Clock,
  DotsThree,
  Globe,
  Lightning,
  CheckCircle,
  WarningCircle,
  Trash,
  Copy,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectCardProps {
  id: string
  name: string
  description?: string
  thumbnail?: string
  platform: 'web' | 'mobile' | 'both'
  status: 'building' | 'deployed' | 'error' | 'draft'
  lastUpdated: Date
  url?: string
  className?: string
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

const platformIcons = {
  web: Desktop,
  mobile: DeviceMobile,
  both: Globe,
}

const statusConfig = {
  building: {
    label: 'Building',
    variant: 'secondary' as const,
    icon: Lightning,
    className: 'text-amber-400 animate-pulse',
  },
  deployed: {
    label: 'Deployed',
    variant: 'success' as const,
    icon: CheckCircle,
    className: 'text-success',
  },
  error: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: WarningCircle,
    className: 'text-destructive',
  },
  draft: {
    label: 'Draft',
    variant: 'outline' as const,
    icon: Clock,
    className: 'text-slate-400',
  },
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function ProjectCard({
  id,
  name,
  description,
  thumbnail,
  platform,
  status,
  lastUpdated,
  url,
  className,
  onDelete,
  onDuplicate,
}: ProjectCardProps) {
  const PlatformIcon = platformIcons[platform]
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/project/${id}`}>
        <Card
          className={cn(
            'group cursor-pointer overflow-hidden transition-all duration-200',
            'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50',
            className
          )}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-slate-800">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PlatformIcon size={48} className="text-slate-600" />
              </div>
            )}

            {/* Status Badge Overlay */}
            <div className="absolute right-2 top-2">
              <Badge
                variant={statusInfo.variant}
                className="gap-1 backdrop-blur-sm"
              >
                <StatusIcon
                  size={12}
                  weight="fill"
                  className={statusInfo.className}
                />
                {statusInfo.label}
              </Badge>
            </div>

            {/* Actions Overlay (visible on hover) */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              <Button variant="secondary" size="sm">
                Open Project
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-semibold text-foreground">
                  {name}
                </h3>
                {description && (
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {description}
                  </p>
                )}
              </div>

              {/* Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-foreground"
                  >
                    <DotsThree size={20} weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {url && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          window.open(url, '_blank')
                        }}
                      >
                        <ArrowSquareOut size={16} className="mr-2" />
                        Open Live Site
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onDuplicate?.(id)
                    }}
                  >
                    <Copy size={16} className="mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete?.(id)
                    }}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <PlatformIcon size={14} />
                <span className="capitalize">{platform}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{formatRelativeTime(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

export default ProjectCard
