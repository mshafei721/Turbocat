import { AppLayoutWrapper } from '@/components/app-layout-wrapper'

export default async function TasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayoutWrapper>{children}</AppLayoutWrapper>
}
