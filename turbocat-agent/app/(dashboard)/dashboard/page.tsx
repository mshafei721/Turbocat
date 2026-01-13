import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'
import { DashboardPage } from '@/components/turbocat/DashboardPage'

export const metadata = {
  title: 'Dashboard - Turbocat',
  description: 'Manage your apps and projects',
}

/**
 * Map Project API status to UI status
 * Project API: 'draft' | 'active' | 'building' | 'deployed' | 'error'
 * UI expects: 'building' | 'deployed' | 'error' | 'draft'
 */
function mapStatus(status: string): 'building' | 'deployed' | 'error' | 'draft' {
  switch (status) {
    case 'active':
    case 'building':
      return 'building'
    case 'deployed':
      return 'deployed'
    case 'error':
      return 'error'
    case 'draft':
    default:
      return 'draft'
  }
}

export default async function DashboardRoute() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
    // Fetch projects from new Project API (Epic 2)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/v1/projects`, {
      credentials: 'include', // Use cookie-based authentication
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('Failed to fetch projects:', response.status, response.statusText)
      // Return empty projects on error
      return <DashboardPage projects={[]} />
    }

    const data = await response.json()
    const projectsData = data.data?.projects || []

    // Transform to UI format
    const projects = projectsData.map((project: {
      id: string
      name: string
      description: string | null
      platform: 'web' | 'mobile' | 'both' | null
      status: string
      thumbnailUrl: string | null
      lastUpdated: string
      previewCode: string | null
    }) => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      thumbnail: project.thumbnailUrl || undefined,
      platform: (project.platform || 'web') as 'web' | 'mobile' | 'both',
      status: mapStatus(project.status),
      lastUpdated: new Date(project.lastUpdated),
      url: undefined, // TODO: Add preview URL when available
    }))

    return <DashboardPage projects={projects} />
  } catch (error) {
    console.error('Error fetching projects:', error)
    // Return empty projects on error
    return <DashboardPage projects={[]} />
  }
}
