/**
 * Skills Page
 *
 * Server-side page for managing and viewing AI agent skills.
 * Fetches skills from the database and provides interactive dashboard.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/app/skills/page.tsx
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'
import { SkillsPageClient } from '@/components/skills/skills-page-client'
import { SkillRegistry } from '@/lib/skills/registry'
import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'

/**
 * Loading fallback component
 */
function SkillsPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 animate-pulse" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading skills...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error fallback component
 */
function SkillsPageError({ error }: { error: Error }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Package className="h-12 w-12 text-red-400 dark:text-red-600" />
            <p className="text-sm text-red-600 dark:text-red-400">Error loading skills</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Skills Page Component
 *
 * Server component that fetches skills and renders the client dashboard.
 */
export default async function SkillsPage() {
  const session = await getServerSession()

  // Redirect to home if not authenticated
  if (!session?.user) {
    redirect('/')
  }

  try {
    // Initialize skill registry
    const registry = new SkillRegistry()

    // Fetch all skills (active and inactive)
    const allSkills = await registry.list()

    // Sort by usage count and success rate
    const sortedSkills = allSkills.sort((a, b) => {
      // Active skills first
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1
      }

      // Then by usage count
      const usageA = a.usageCount ?? 0
      const usageB = b.usageCount ?? 0
      if (usageA !== usageB) {
        return usageB - usageA
      }

      // Then by success rate
      const successA = a.successRate ?? 0
      const successB = b.successRate ?? 0
      return successB - successA
    })

    return (
      <Suspense fallback={<SkillsPageLoading />}>
        <SkillsPageClient
          initialSkills={sortedSkills}
          user={session.user}
          authProvider={session.authProvider}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Error loading skills:', error)
    return <SkillsPageError error={error instanceof Error ? error : new Error('Unknown error')} />
  }
}

/**
 * Metadata for the page
 */
export const metadata = {
  title: 'Skills | Turbocat',
  description: 'Manage and monitor AI agent skills with MCP integrations',
}
