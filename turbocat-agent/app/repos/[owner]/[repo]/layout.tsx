import { RepoLayout } from '@/components/repo-layout'
import { getServerSession } from '@/lib/session/get-server-session'
import { Metadata } from 'next'

interface LayoutPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
  children: React.ReactNode
}

export default async function Layout({ params, children }: LayoutPageProps) {
  const { owner, repo } = await params
  const session = await getServerSession()

  return (
    <RepoLayout
      owner={owner}
      repo={repo}
      user={session?.user ?? null}
      authProvider={session?.authProvider ?? null}
    >
      {children}
    </RepoLayout>
  )
}

export async function generateMetadata({ params }: LayoutPageProps): Promise<Metadata> {
  const { owner, repo } = await params

  return {
    title: `${owner}/${repo} - Turbocat`,
    description: 'View repository commits, issues, and pull requests',
  }
}
