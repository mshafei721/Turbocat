import { getServerSession } from '@/lib/session/get-server-session'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/turbocat/ProfilePage'

export default async function Profile() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login')
  }

  return <ProfilePage user={session.user} authProvider={session.authProvider} />
}
