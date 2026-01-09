import { redirect } from 'next/navigation'

interface TaskPageProps {
  params: Promise<{
    taskId: string
  }>
}

/**
 * Legacy task page - redirects to new /project/[id] route
 * Kept for backward compatibility with existing links/bookmarks
 */
export default async function TaskPage({ params }: TaskPageProps) {
  const { taskId } = await params

  // Redirect to new project route
  redirect(`/project/${taskId}`)
}
