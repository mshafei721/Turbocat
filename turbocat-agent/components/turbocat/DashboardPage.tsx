'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass,
  Plus,
  SquaresFour,
  List,
  CaretDown,
  FunnelSimple,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardSidebar } from './DashboardSidebar'
import { ProjectCard } from './ProjectCard'
import { NoProjectsEmptyState } from './EmptyState'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string
  platform: 'web' | 'mobile' | 'both'
  status: 'building' | 'deployed' | 'error' | 'draft'
  lastUpdated: Date
  url?: string
}

interface DashboardPageProps {
  user?: {
    id: string
    email?: string
    username?: string
    avatar?: string
  } | null
  projects?: Project[]
  className?: string
}

export function DashboardPage({ user, projects = [], className }: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [filterPlatform, setFilterPlatform] = React.useState<'all' | 'web' | 'mobile'>('all')

  // Filter projects based on search and platform
  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPlatform =
        filterPlatform === 'all' || project.platform === filterPlatform

      return matchesSearch && matchesPlatform
    })
  }, [projects, searchQuery, filterPlatform])

  const handleDeleteProject = (id: string) => {
    // Implement delete logic
    console.log('Delete project:', id)
  }

  const handleDuplicateProject = (id: string) => {
    // Implement duplicate logic
    console.log('Duplicate project:', id)
  }

  return (
    <div className={cn('flex min-h-screen bg-slate-950', className)}>
      {/* Sidebar */}
      <DashboardSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <h1 className="text-3xl font-bold text-foreground">App library</h1>

            <Link href="/new">
              <Button className="gap-2">
                <Plus size={18} weight="bold" />
                Create
              </Button>
            </Link>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters and View Toggle */}
            <div className="flex items-center gap-2">
              {/* Platform Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FunnelSimple size={16} />
                    {filterPlatform === 'all' ? 'All platforms' : filterPlatform}
                    <CaretDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterPlatform('all')}>
                    All platforms
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPlatform('web')}>
                    Web
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPlatform('mobile')}>
                    Mobile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-l-lg rounded-r-none',
                    viewMode === 'grid' && 'bg-slate-700 text-foreground'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <SquaresFour size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-l-none rounded-r-lg',
                    viewMode === 'list' && 'bg-slate-700 text-foreground'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Projects Grid/List */}
          <AnimatePresence mode="wait">
            {filteredProjects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12"
              >
                {projects.length === 0 ? (
                  <NoProjectsEmptyState />
                ) : (
                  <div className="text-center">
                    <p className="text-slate-400">No projects match your search.</p>
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => {
                        setSearchQuery('')
                        setFilterPlatform('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  viewMode === 'grid'
                    ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                    : 'flex flex-col gap-4'
                )}
              >
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProjectCard
                      id={project.id}
                      name={project.name}
                      description={project.description}
                      thumbnail={project.thumbnail}
                      platform={project.platform}
                      status={project.status}
                      lastUpdated={project.lastUpdated}
                      url={project.url}
                      onDelete={handleDeleteProject}
                      onDuplicate={handleDuplicateProject}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
