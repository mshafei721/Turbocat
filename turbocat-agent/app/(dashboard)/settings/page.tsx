import { getServerSession } from '@/lib/session/get-server-session'
import { redirect } from 'next/navigation'
import { SettingsPage } from '@/components/turbocat/SettingsPage'

export default async function Settings() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login')
  }

  return <SettingsPage user={session.user} />
}
