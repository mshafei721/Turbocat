import { cookies, headers } from 'next/headers'
import { AppLayout } from './app-layout'
import { getSidebarWidthFromCookie, getSidebarOpenFromCookie } from '@/lib/utils/cookies'

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

// Routes that should NOT use the old AppLayout with TaskSidebar
// These use their own layout structure (new Turbocat design)
const EXCLUDED_ROUTES = [
  '/dashboard',
  '/project/',
  '/new',
  '/profile',
  '/settings',
  '/login',
  '/signup',
]

export async function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const headersList = await headers()

  // Get the current pathname from headers (set by Next.js)
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''

  // Check if this route should be excluded from AppLayout
  const shouldExclude = EXCLUDED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // For excluded routes, just render children without AppLayout
  if (shouldExclude) {
    return <>{children}</>
  }

  const cookieStore = await cookies()
  const cookieString = cookieStore.toString()
  const initialSidebarWidth = getSidebarWidthFromCookie(cookieString)
  const initialSidebarOpen = getSidebarOpenFromCookie(cookieString)

  // Detect if mobile from user agent
  const userAgent = headersList.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  return (
    <AppLayout
      initialSidebarWidth={initialSidebarWidth}
      initialSidebarOpen={initialSidebarOpen}
      initialIsMobile={isMobile}
    >
      {children}
    </AppLayout>
  )
}
