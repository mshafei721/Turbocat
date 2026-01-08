import { getServerSession } from '@/lib/session/get-server-session'
import { WorkspacePage } from '@/components/turbocat/WorkspacePage'
import { notFound } from 'next/navigation'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params
  // TODO: Fetch project name from database
  return {
    title: `Project - Turbocat`,
    description: 'Build and edit your app',
  }
}

// Demo project for now - replace with actual data fetching
const demoProject = {
  id: '1',
  name: 'TripIntel',
  icon: '🌍',
  platform: 'mobile' as const,
  previewUrl: undefined,
  lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  credits: 0.00,
}

const demoMessages = [
  {
    id: '1',
    role: 'assistant' as const,
    content: 'I need to create the missing route files. Let me create them now:',
    updates: 1,
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'Now I need to create the trip/[id].tsx file:',
    updates: 3,
    timestamp: new Date(Date.now() - 55000),
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: 'I need to create the intelligence detail route. Let me create the necessary files:',
    updates: 2,
    timestamp: new Date(Date.now() - 50000),
  },
  {
    id: '4',
    role: 'assistant' as const,
    content: `All errors are from Prisma. Now let me update the root layout to include all the new routes and update the todos:

The app is ready. The lint errors are all from Prisma generated files in the backend, not from my code. Let me finalize the todos:`,
    updates: 1,
    timestamp: new Date(Date.now() - 45000),
  },
  {
    id: '5',
    role: 'assistant' as const,
    content: `Business travelers need to trust this information instantly.

Color Palette:
• Deep slate backgrounds (#0F172A → #1E293B)
• Warm amber accent (#F59E0B) - premium, trustworthy
• Teal for verified/safe (#14B8A6)
• Orange for warnings (#F97316)
• Subtle glass-effect cards

Typography: System SF Pro with clear hierarchy

Animations: Smooth card reveals, progress indicators during generation, micro-interactions on cards`,
    updates: 2,
    timestamp: new Date(Date.now() - 40000),
  },
]

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession()
  const { id } = await params

  // TODO: Fetch project from database
  // const project = await getProject(id)
  // if (!project) notFound()

  // For demo, use the demo project
  const project = { ...demoProject, id }

  return (
    <WorkspacePage
      project={project}
      messages={demoMessages}
      isGenerating={false}
    />
  )
}
