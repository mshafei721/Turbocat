import { getServerSession } from '@/lib/session/get-server-session'
import { DashboardPage } from '@/components/turbocat/DashboardPage'

export const metadata = {
  title: 'Dashboard - Turbocat',
  description: 'Manage your apps and projects',
}

// Demo projects for now - replace with actual data fetching
const demoProjects = [
  {
    id: '1',
    name: 'TripIntel',
    description: 'Travel intelligence app',
    platform: 'mobile' as const,
    status: 'deployed' as const,
    lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    url: 'https://tripintel.app',
  },
  {
    id: '2',
    name: 'FitTrack Pro',
    description: 'Fitness tracking with AI coach',
    platform: 'mobile' as const,
    status: 'building' as const,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    name: 'ExpenseFlow',
    description: 'Smart expense tracking',
    platform: 'web' as const,
    status: 'deployed' as const,
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    url: 'https://expenseflow.app',
  },
]

export default async function DashboardRoute() {
  const session = await getServerSession()

  // TODO: Fetch actual user projects from database
  // const projects = await getUserProjects(session?.user?.id)

  return (
    <DashboardPage
      user={session?.user ?? null}
      projects={demoProjects}
    />
  )
}
