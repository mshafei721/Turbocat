'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Monitor, Smartphone } from 'lucide-react'

export type Platform = 'web' | 'mobile'

interface PlatformSelectorProps {
  value?: Platform
  onChange: (platform: Platform) => void
  disabled?: boolean
}

const PLATFORMS = [
  { value: 'web' as const, label: 'Web', icon: Monitor },
  { value: 'mobile' as const, label: 'Mobile', icon: Smartphone },
]

const STORAGE_KEY = 'turbocat-last-platform'

/**
 * Platform Selector Component
 * Phase 4: Mobile Development - Task Group 2
 *
 * Allows users to select between Web and Mobile platforms for their tasks.
 * Features:
 * - Dropdown selector with Web/Mobile options
 * - Icons for visual clarity (Monitor for Web, Smartphone for Mobile)
 * - Persists selection to localStorage
 * - Defaults to 'web' platform
 * - Keyboard accessible
 * - Screen reader friendly
 */
export function PlatformSelector({ value, onChange, disabled = false }: PlatformSelectorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(value || 'web')

  // Load saved platform from localStorage on mount
  useEffect(() => {
    if (!value) {
      const savedPlatform = localStorage.getItem(STORAGE_KEY)
      if (savedPlatform === 'web' || savedPlatform === 'mobile') {
        setSelectedPlatform(savedPlatform)
        onChange(savedPlatform)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedPlatform(value)
    }
  }, [value])

  const handlePlatformChange = (platform: string) => {
    const newPlatform = platform as Platform
    setSelectedPlatform(newPlatform)
    onChange(newPlatform)

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, newPlatform)
  }

  const currentPlatform = PLATFORMS.find((p) => p.value === selectedPlatform) || PLATFORMS[0]
  const Icon = currentPlatform.icon

  return (
    <Select value={selectedPlatform} onValueChange={handlePlatformChange} disabled={disabled}>
      <SelectTrigger
        className="w-auto sm:min-w-[120px] border-0 bg-transparent shadow-none focus:ring-0 h-8 shrink-0"
        aria-label="Platform"
      >
        <SelectValue placeholder="Platform">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{currentPlatform.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PLATFORMS.map((platform) => (
          <SelectItem key={platform.value} value={platform.value}>
            <div className="flex items-center gap-2">
              <platform.icon className="w-4 h-4" aria-hidden="true" />
              <span>{platform.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
