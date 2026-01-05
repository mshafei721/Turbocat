'use client'

import { Task } from '@/lib/db/schema'
import { PageHeader } from '@/components/page-header'
import { TaskActions } from '@/components/task-actions'
import { useTasks } from '@/components/app-layout'
import { User } from '@/components/auth/user'
import type { Session } from '@/lib/session/types'

interface TaskPageHeaderProps {
  task: Task
  user: Session['user'] | null
  authProvider: Session['authProvider'] | null
}

export function TaskPageHeader({ task, user, authProvider }: TaskPageHeaderProps) {
  const { toggleSidebar } = useTasks()

  return (
    <PageHeader
      showMobileMenu={true}
      onToggleMobileMenu={toggleSidebar}
      showPlatformName={true}
      actions={
        <div className="flex items-center gap-2">
          <TaskActions task={task} />
          <User user={user} authProvider={authProvider} />
        </div>
      }
    />
  )
}
