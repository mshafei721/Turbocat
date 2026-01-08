import { getServerSession } from '@/lib/session/get-server-session'
import { LandingPage } from '@/components/turbocat/LandingPage'

export default async function Home() {
  const session = await getServerSession()

  return <LandingPage user={session?.user ?? null} />
}
