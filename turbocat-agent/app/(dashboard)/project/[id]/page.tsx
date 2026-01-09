import { getServerSession } from '@/lib/session/get-server-session'
import { redirect } from 'next/navigation'
import { ProjectWorkspace } from '@/components/turbocat/ProjectWorkspace'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params
  return {
    title: `Project - Turbocat`,
    description: 'Build and edit your app',
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession()
  const { id } = await params

  if (!session?.user) {
    redirect('/login')
  }

  return <ProjectWorkspace projectId={id} />
}
