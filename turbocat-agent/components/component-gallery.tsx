'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Search, Grid, List, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ComponentGalleryPlatformFilter,
  useComponentPlatformFilter,
  PlatformBadge,
  type ComponentPlatform,
} from '@/components/component-gallery-filter'
import { MobileComponentPreview, CodeOnlyPreview, type ComponentMetadata } from '@/components/mobile-component-preview'

/**
 * Component Gallery - Task 5.7 & 5.8
 * Phase 4: Mobile Development
 *
 * Displays all available components with filtering by platform and category.
 * Supports both grid and list views with search functionality.
 */

export type ViewMode = 'grid' | 'list'

/**
 * Component entry for the gallery
 */
export interface GalleryComponent {
  id: string
  metadata: ComponentMetadata
  templateCode?: string
  preview?: React.ReactNode
}

/**
 * Category definition
 */
export interface GalleryCategory {
  id: string
  label: string
  count: number
}

/**
 * Props for ComponentGallery
 */
export interface ComponentGalleryProps {
  /** Components to display */
  components: GalleryComponent[]
  /** Categories for filtering */
  categories?: GalleryCategory[]
  /** Initial view mode */
  defaultViewMode?: ViewMode
  /** Show search input */
  showSearch?: boolean
  /** Show platform filter */
  showPlatformFilter?: boolean
  /** Show category filter */
  showCategoryFilter?: boolean
  /** Additional className */
  className?: string
}

/**
 * Component Card for grid view
 */
function ComponentCard({
  component,
  onClick,
}: {
  component: GalleryComponent
  onClick: () => void
}) {
  const { metadata } = component

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-4 hover:border-primary hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {metadata.name}
        </h3>
        <PlatformBadge platform={metadata.platform as 'web' | 'mobile' | 'universal'} size="sm" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {metadata.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-0.5 rounded">{metadata.category}</span>
        <span>{metadata.props.length} props</span>
      </div>
    </button>
  )
}

/**
 * Component Row for list view
 */
function ComponentRow({
  component,
  onClick,
}: {
  component: GalleryComponent
  onClick: () => void
}) {
  const { metadata } = component

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-primary hover:shadow-md transition-all group"
    >
      {/* Name and Platform */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
            {metadata.name}
          </h3>
          <PlatformBadge platform={metadata.platform as 'web' | 'mobile' | 'universal'} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {metadata.description}
        </p>
      </div>

      {/* Category */}
      <span className="text-xs bg-muted px-2 py-1 rounded shrink-0">
        {metadata.category}
      </span>

      {/* Props Count */}
      <span className="text-xs text-muted-foreground shrink-0">
        {metadata.props.length} props
      </span>
    </button>
  )
}

/**
 * Component Detail Panel
 */
function ComponentDetail({
  component,
  onClose,
}: {
  component: GalleryComponent
  onClose: () => void
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{component.metadata.name}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {component.preview ? (
            <MobileComponentPreview
              metadata={component.metadata}
              templateCode={component.templateCode}
            >
              {component.preview}
            </MobileComponentPreview>
          ) : (
            <CodeOnlyPreview
              metadata={component.metadata}
              templateCode={component.templateCode}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * ComponentGallery
 *
 * Main gallery component for browsing and previewing mobile components.
 */
export function ComponentGallery({
  components,
  categories = [],
  defaultViewMode = 'grid',
  showSearch = true,
  showPlatformFilter = true,
  showCategoryFilter = true,
  className,
}: ComponentGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<GalleryComponent | null>(null)
  const { platform, filterComponent } = useComponentPlatformFilter()

  // Filter components based on search, platform, and category
  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const { metadata } = component

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          metadata.name.toLowerCase().includes(query) ||
          metadata.description.toLowerCase().includes(query) ||
          metadata.category.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Platform filter
      if (platform !== 'all' && metadata.platform !== platform) {
        return false
      }

      // Category filter
      if (selectedCategory && metadata.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false
      }

      return true
    })
  }, [components, searchQuery, platform, selectedCategory])

  // Calculate category counts based on current filters (excluding category filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    components.forEach((component) => {
      const { metadata } = component

      // Apply search and platform filters only
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          metadata.name.toLowerCase().includes(query) ||
          metadata.description.toLowerCase().includes(query) ||
          metadata.category.toLowerCase().includes(query)
        if (!matchesSearch) return
      }

      if (platform !== 'all' && metadata.platform !== platform) {
        return
      }

      const category = metadata.category.toLowerCase()
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }, [components, searchQuery, platform])

  return (
    <div className={cn('flex h-full', className)}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Platform Filter */}
          {showPlatformFilter && <ComponentGalleryPlatformFilter />}

          {/* Category Filter (Dropdown) */}
          {showCategoryFilter && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label} ({categoryCounts[category.id.toLowerCase()] || 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 py-2 text-sm text-muted-foreground border-b">
          {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} found
          {selectedCategory && ` in ${selectedCategory}`}
          {platform !== 'all' && ` for ${platform}`}
        </div>

        {/* Components Grid/List */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {filteredComponents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No components found</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onClick={() => setSelectedComponent(component)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredComponents.map((component) => (
                  <ComponentRow
                    key={component.id}
                    component={component}
                    onClick={() => setSelectedComponent(component)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedComponent && (
        <div className="w-[600px] border-l bg-background">
          <ComponentDetail
            component={selectedComponent}
            onClose={() => setSelectedComponent(null)}
          />
        </div>
      )}
    </div>
  )
}

export default ComponentGallery
