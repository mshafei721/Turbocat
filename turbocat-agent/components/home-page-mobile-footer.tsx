'use client'

import { TurbocatLogo } from '@/components/logos'

export function HomePageMobileFooter() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
      <TurbocatLogo className="h-5 w-5" />
      <span>Powered by Turbocat</span>
    </div>
  )
}
