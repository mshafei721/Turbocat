'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Monitor, Smartphone, Layers, Globe } from 'lucide-react'

/**
 * Platform filter options for Component Gallery
 * Phase 4: Mobile Development - Task 5.7
 */
export type ComponentPlatform = 'all' | 'web' | 'mobile' | 'universal'

/**
 * Platform filter option configuration
 */
export interface PlatformFilterOption {
  value: ComponentPlatform
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

/**
 * Platform filter options
 */
export const PLATFORM_OPTIONS: PlatformFilterOption[] = [
  {
    value: 'all',
    label: 'All Platforms',
    icon: Globe,
    description: 'Show all components',
  },
  {
    value: 'web',
    label: 'Web',
    icon: Monitor,
    description: 'Next.js / React components',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    description: 'React Native / Expo components',
  },
  {
    value: 'universal',
    label: 'Universal',
    icon: Layers,
    description: 'Cross-platform components',
  },
]

/**
 * Props for ComponentGalleryPlatformFilter
 */
export interface ComponentGalleryPlatformFilterProps {
  /** Current selected platform */
  value?: ComponentPlatform
  /** Change handler */
  onChange?: (platform: ComponentPlatform) => void
  /** Whether to persist selection in URL */
  persistInUrl?: boolean
  /** Whether the filter is disabled */
  disabled?: boolean
  /** Additional className */
  className?: string
}

/**
 * ComponentGalleryPlatformFilter
 *
 * Dropdown filter for filtering components by platform (Web, Mobile, Universal, All).
 * Used in the Component Gallery to show platform-specific components.
 *
 * Features:
 * - Filter components by platform
 * - Persists selection in URL query params
 * - Icons for visual clarity
 * - Accessible keyboard navigation
 * - Screen reader friendly
 *
 * @example
 * ```tsx
 * import { ComponentGalleryPlatformFilter } from '@/components/component-gallery-filter';
 *
 * export default function ComponentGallery() {
 *   const [platform, setPlatform] = useState<ComponentPlatform>('all');
 *
 *   return (
 *     <div>
 *       <ComponentGalleryPlatformFilter
 *         value={platform}
 *         onChange={setPlatform}
 *       />
 *       <ComponentList platform={platform} />
 *     </div>
 *   );
 * }
 * ```
 */
export function ComponentGalleryPlatformFilter({
  value,
  onChange,
  persistInUrl = true,
  disabled = false,
  className,
}: ComponentGalleryPlatformFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial value from URL or prop
  const [selectedPlatform, setSelectedPlatform] = useState<ComponentPlatform>(() => {
    if (value) return value
    if (persistInUrl) {
      const urlPlatform = searchParams.get('platform') as ComponentPlatform | null
      if (urlPlatform && PLATFORM_OPTIONS.some((opt) => opt.value === urlPlatform)) {
        return urlPlatform
      }
    }
    return 'all'
  })

  // Sync with external value changes
  useEffect(() => {
    if (value !== undefined && value !== selectedPlatform) {
      setSelectedPlatform(value)
    }
  }, [value, selectedPlatform])

  // Handle platform change
  const handlePlatformChange = (newPlatform: string) => {
    const platform = newPlatform as ComponentPlatform
    setSelectedPlatform(platform)

    // Update URL if persistence is enabled
    if (persistInUrl) {
      const params = new URLSearchParams(searchParams.toString())
      if (platform === 'all') {
        params.delete('platform')
      } else {
        params.set('platform', platform)
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
      router.push(newUrl, { scroll: false })
    }

    // Call onChange callback
    onChange?.(platform)
  }

  // Get current platform option
  const currentOption = PLATFORM_OPTIONS.find((opt) => opt.value === selectedPlatform) || PLATFORM_OPTIONS[0]
  const Icon = currentOption.icon

  return (
    <Select value={selectedPlatform} onValueChange={handlePlatformChange} disabled={disabled}>
      <SelectTrigger
        className={`w-auto min-w-[160px] ${className || ''}`}
        aria-label="Filter by platform"
      >
        <SelectValue placeholder="Select platform">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{currentOption.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PLATFORM_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className="w-4 h-4" aria-hidden="true" />
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Hook for filtering components by platform
 */
export function useComponentPlatformFilter() {
  const searchParams = useSearchParams()
  const [platform, setPlatform] = useState<ComponentPlatform>('all')

  useEffect(() => {
    const urlPlatform = searchParams.get('platform') as ComponentPlatform | null
    if (urlPlatform && PLATFORM_OPTIONS.some((opt) => opt.value === urlPlatform)) {
      setPlatform(urlPlatform)
    } else {
      setPlatform('all')
    }
  }, [searchParams])

  return {
    platform,
    setPlatform,
    isFiltered: platform !== 'all',
    filterComponent: (componentPlatform: 'web' | 'mobile' | 'universal') => {
      if (platform === 'all') return true
      return componentPlatform === platform
    },
  }
}

/**
 * Platform badge component for showing a component's platform
 */
export function PlatformBadge({
  platform,
  size = 'default',
}: {
  platform: 'web' | 'mobile' | 'universal'
  size?: 'sm' | 'default'
}) {
  const option = PLATFORM_OPTIONS.find((opt) => opt.value === platform)
  if (!option) return null

  const Icon = option.icon
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  const colorClasses =
    platform === 'web'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : platform === 'mobile'
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${colorClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} aria-hidden="true" />
      <span>{option.label}</span>
    </span>
  )
}

export default ComponentGalleryPlatformFilter
