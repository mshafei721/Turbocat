/**
 * Skills Dashboard Component
 *
 * Main dashboard for managing skills:
 * - Header with "Add Skill" button and search
 * - Grid of SkillCards for active skills
 * - Side panel for SkillDetailsPanel
 * - Filter by category dropdown
 * - Responsive layout (list on mobile)
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/skills/skills-dashboard.tsx
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkillCard } from './skill-card'
import { SkillDetailsPanel } from './skill-details-panel'
import type { SkillDefinition } from '@/lib/skills/types'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

interface SkillsDashboardProps {
  /** Array of skill definitions */
  skills: SkillDefinition[]
  /** MCP server connection statuses */
  mcpStatuses?: MCPConnectionStatus[]
  /** Callback when Add Skill button is clicked */
  onAddSkill?: () => void
  /** Callback when a skill is selected */
  onSkillSelect?: (skill: SkillDefinition) => void
  /** Callback when activate/deactivate is clicked */
  onToggleActive?: (skillSlug: string, currentStatus: boolean) => void | Promise<void>
  /** Callback when View SKILL.md button is clicked */
  onViewSkillMd?: (skillSlug: string) => void
  /** Callback when View Logs button is clicked */
  onViewLogs?: (skillSlug: string) => void
  /** Currently selected skill slug */
  selectedSkillSlug?: string
  /** Optional additional CSS classes */
  className?: string
  /** Whether toggle is in progress */
  isToggling?: boolean
}

/**
 * Get unique categories from skills
 */
function getCategories(skills: SkillDefinition[]): string[] {
  const categories = new Set<string>()
  skills.forEach((skill) => {
    if (skill.category) {
      categories.add(skill.category)
    }
  })
  return Array.from(categories).sort()
}

/**
 * SkillsDashboard Component
 *
 * Comprehensive dashboard for managing and viewing skills.
 * Includes search, filtering, and detail view.
 */
export function SkillsDashboard({
  skills,
  mcpStatuses,
  onAddSkill,
  onSkillSelect,
  onToggleActive,
  onViewSkillMd,
  onViewLogs,
  selectedSkillSlug,
  className,
  isToggling = false,
}: SkillsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories
  const categories = useMemo(() => getCategories(skills), [skills])

  // Filter skills based on search and category
  const filteredSkills = useMemo(() => {
    let filtered = skills

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query) ||
          skill.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((skill) => skill.category === selectedCategory)
    }

    return filtered
  }, [skills, searchQuery, selectedCategory])

  // Get active and inactive counts
  const activeCount = filteredSkills.filter((s) => s.isActive).length
  const inactiveCount = filteredSkills.filter((s) => !s.isActive).length

  // Get selected skill
  const selectedSkill = useMemo(
    () => skills.find((s) => s.slug === selectedSkillSlug),
    [skills, selectedSkillSlug],
  )

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-xl font-semibold">Skills Dashboard</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Manage and monitor AI agent skills with MCP integrations
              </CardDescription>

              {/* Summary Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {skills.length} total
                </Badge>
                {activeCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-green-500 text-green-700 dark:text-green-400"
                  >
                    {activeCount} active
                  </Badge>
                )}
                {inactiveCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-500 text-gray-700 dark:text-gray-400"
                  >
                    {inactiveCount} inactive
                  </Badge>
                )}
              </div>
            </div>

            {/* Add Skill Button */}
            {onAddSkill && (
              <Button onClick={onAddSkill} size="sm" className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                Add Skill
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search skills by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Results Count */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Found {filteredSkills.length} {filteredSkills.length === 1 ? 'skill' : 'skills'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Grid and Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Grid */}
        <div className={cn('lg:col-span-2', selectedSkill && 'lg:col-span-2')}>
          {filteredSkills.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No skills match your filters'
                    : 'No skills configured'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first skill to get started'}
                </p>
              </div>
            </Card>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                'grid-cols-1',
                'sm:grid-cols-2',
                selectedSkill ? 'lg:grid-cols-1 xl:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3',
              )}
            >
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.slug}
                  skill={skill}
                  onClick={() => onSkillSelect?.(skill)}
                  isSelected={selectedSkillSlug === skill.slug}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        {selectedSkill && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <SkillDetailsPanel
                skill={selectedSkill}
                mcpStatuses={mcpStatuses}
                onToggleActive={onToggleActive}
                onViewSkillMd={onViewSkillMd}
                onViewLogs={onViewLogs}
                isToggling={isToggling}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
