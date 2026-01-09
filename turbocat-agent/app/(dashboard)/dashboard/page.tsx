import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'
import { DashboardPage } from '@/components/turbocat/DashboardPage'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { eq, desc, and, isNull } from 'drizzle-orm'

export const metadata = {
  title: 'Dashboard - Turbocat',
  description: 'Manage your apps and projects',
}

// Map task status to project status
function mapStatus(status: string): 'building' | 'deployed' | 'error' | 'draft' {
  switch (status) {
    case 'processing':
    case 'pending':
      return 'building'
    case 'completed':
      return 'deployed'
    case 'error':
    case 'stopped':
      return 'error'
    default:
      return 'draft'
  }
}

// Generate project name from task
function getProjectName(task: { title?: string | null; prompt: string }): string {
  if (task.title) return task.title

  // Extract meaningful words from prompt
  const words = task.prompt
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'app', 'build', 'create', 'make'].includes(word.toLowerCase()))
    .slice(0, 3)

  if (words.length === 0) return 'New Project'
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export default async function DashboardRoute() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch user's tasks from database (exclude soft-deleted)
  const userTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt))

  // Transform tasks to projects format
  const projects = userTasks.map(task => ({
    id: task.id,
    name: getProjectName(task),
    description: task.prompt.slice(0, 100) + (task.prompt.length > 100 ? '...' : ''),
    platform: (task.platform || 'web') as 'web' | 'mobile' | 'both',
    status: mapStatus(task.status),
    lastUpdated: task.updatedAt || task.createdAt,
    url: task.sandboxUrl || task.previewUrl || undefined,
  }))

  return (
    <DashboardPage
      user={session?.user ?? null}
      projects={projects}
    />
  )
}
