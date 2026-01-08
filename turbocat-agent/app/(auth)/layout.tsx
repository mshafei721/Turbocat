import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // If user is already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}
