/**
 * New Skill Page
 *
 * Server-side page for creating new skills.
 *
 * @file app/skills/new/page.tsx
 */

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/session/get-server-session'
import { NewSkillForm } from '@/components/skills/new-skill-form'

/**
 * New Skill Page Component
 */
export default async function NewSkillPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <NewSkillForm userId={session.user.id} />
    </div>
  )
}

/**
 * Metadata for the page
 */
export const metadata = {
  title: 'Create New Skill | Turbocat',
  description: 'Create a new AI agent skill with SKILL.md format',
}
