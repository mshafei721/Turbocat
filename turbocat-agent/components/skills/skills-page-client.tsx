/**
 * Skills Page Client Component
 *
 * Client-side component for the Skills page.
 * Handles state management and user interactions.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/skills/skills-page-client.tsx
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SkillsDashboard } from './skills-dashboard'
import type { SkillDefinition } from '@/lib/skills/types'
import type { MCPConnectionStatus } from '@/lib/mcp/types'

interface SkillsPageClientProps {
  /** Initial skills data from server */
  initialSkills: SkillDefinition[]
  /** Current user */
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
  /** Authentication provider */
  authProvider: string
}

/**
 * SkillsPageClient Component
 *
 * Client component that manages skills state and interactions.
 */
export function SkillsPageClient({ initialSkills, user, authProvider }: SkillsPageClientProps) {
  const router = useRouter()
  const [skills, setSkills] = useState<SkillDefinition[]>(initialSkills)
  const [selectedSkillSlug, setSelectedSkillSlug] = useState<string | undefined>()
  const [mcpStatuses, setMcpStatuses] = useState<MCPConnectionStatus[] | undefined>()
  const [isToggling, setIsToggling] = useState(false)

  // Fetch MCP statuses on mount
  useEffect(() => {
    const fetchMCPStatuses = async () => {
      try {
        // TODO: Implement MCP status fetching API
        // For now, we'll use mock data
        const mockStatuses: MCPConnectionStatus[] = [
          {
            serverName: 'supabase',
            status: 'connected',
            lastHealthCheck: Date.now(),
            rateLimit: {
              maxRequests: 1000,
              windowMs: 60000,
              currentRequests: 10,
              windowResetAt: Date.now() + 60000,
            },
            successfulRequests: 150,
            failedRequests: 2,
            connectedAt: Date.now() - 3600000,
          },
          {
            serverName: 'github',
            status: 'connected',
            lastHealthCheck: Date.now(),
            rateLimit: {
              maxRequests: 5000,
              windowMs: 3600000,
              currentRequests: 42,
              windowResetAt: Date.now() + 3600000,
            },
            successfulRequests: 200,
            failedRequests: 5,
            connectedAt: Date.now() - 7200000,
          },
          {
            serverName: 'exa',
            status: 'disconnected',
            lastHealthCheck: null,
            rateLimit: {
              maxRequests: 100,
              windowMs: 60000,
              currentRequests: 0,
              windowResetAt: Date.now() + 60000,
            },
            successfulRequests: 0,
            failedRequests: 0,
            connectedAt: null,
          },
        ]

        setMcpStatuses(mockStatuses)
      } catch (error) {
        console.error('Error fetching MCP statuses:', error)
      }
    }

    fetchMCPStatuses()
  }, [])

  /**
   * Handle skill selection
   */
  const handleSkillSelect = (skill: SkillDefinition) => {
    setSelectedSkillSlug(skill.slug === selectedSkillSlug ? undefined : skill.slug)
  }

  /**
   * Handle activate/deactivate toggle
   */
  const handleToggleActive = async (skillSlug: string, currentStatus: boolean) => {
    setIsToggling(true)

    try {
      // Call API to toggle skill status
      const response = await fetch('/api/skills/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: skillSlug,
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle skill status')
      }

      // Update local state
      setSkills((prevSkills) =>
        prevSkills.map((skill) =>
          skill.slug === skillSlug ? { ...skill, isActive: !currentStatus } : skill,
        ),
      )

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Error toggling skill status:', error)
      alert('Failed to toggle skill status. Please try again.')
    } finally {
      setIsToggling(false)
    }
  }

  /**
   * Handle View SKILL.md
   */
  const handleViewSkillMd = (skillSlug: string) => {
    // TODO: Navigate to skill details page or open modal when route is implemented
    toast.info('Skill details coming soon', {
      description: `View details for ${skillSlug}`,
    })
  }

  /**
   * Handle View Logs
   */
  const handleViewLogs = (skillSlug: string) => {
    // TODO: Navigate to logs page with skill filter when route is implemented
    toast.info('Skill logs coming soon', {
      description: `View logs for ${skillSlug}`,
    })
  }

  /**
   * Handle Add Skill
   */
  const handleAddSkill = () => {
    // TODO: Navigate to add skill page when route is implemented
    toast.info('Add skill coming soon', {
      description: 'Create custom skills for your workspace',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SkillsDashboard
        skills={skills}
        mcpStatuses={mcpStatuses}
        onAddSkill={handleAddSkill}
        onSkillSelect={handleSkillSelect}
        onToggleActive={handleToggleActive}
        onViewSkillMd={handleViewSkillMd}
        onViewLogs={handleViewLogs}
        selectedSkillSlug={selectedSkillSlug}
        isToggling={isToggling}
      />
    </div>
  )
}
