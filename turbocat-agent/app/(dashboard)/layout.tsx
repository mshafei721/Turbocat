import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'
import { DashboardLayoutClient } from '@/components/turbocat/DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // If user is not logged in, redirect to login
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <DashboardLayoutClient user={session.user}>
      {children}
    </DashboardLayoutClient>
  )
}
