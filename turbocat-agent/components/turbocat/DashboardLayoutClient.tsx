'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'

interface DashboardLayoutClientProps {
  user: {
    id: string
    email?: string
    username?: string
    avatar?: string
  } | null
  children: React.ReactNode
}

/**
 * Client-side layout wrapper for dashboard routes.
 * Shows sidebar on /dashboard, /settings, /profile
 * Hides sidebar on /project/[id] (full workspace view)
 */
export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const pathname = usePathname()

  // Project workspace has its own full-screen layout
  const isWorkspaceRoute = pathname.startsWith('/project/')

  if (isWorkspaceRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <DashboardSidebar user={user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayoutClient
