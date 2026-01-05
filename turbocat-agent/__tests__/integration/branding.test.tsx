import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomePageHeader } from '@/components/home-page-header'
import { metadata } from '@/app/layout'

// Mock Next.js font modules
vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))

vi.mock('jotai', () => ({
  useAtom: vi.fn(() => ['', vi.fn()]),
  useAtomValue: vi.fn(() => ({ connected: false })),
  useSetAtom: vi.fn(() => vi.fn()),
  atom: vi.fn((v) => v),
}))

vi.mock('@/components/app-layout', () => ({
  useTasks: () => ({ toggleSidebar: vi.fn(), addTaskOptimistically: vi.fn(() => ({ id: 'test' })) }),
}))

vi.mock('@/components/connectors-provider', () => ({
  useConnectors: () => ({ connectors: [] }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('Branding Integration Tests', () => {
  describe('Integration Test 1: Header Logo Rendering', () => {
    it('should render TurbocatLogo in header', () => {
      render(<HomePageHeader selectedOwner='' selectedRepo='' onOwnerChange={vi.fn()} onRepoChange={vi.fn()} user={null} />)
      expect(screen.getByAltText('Turbocat - Multi-Agent AI Coding Platform')).toBeInTheDocument()
      expect(screen.getByText('Turbocat')).toBeInTheDocument()
    })
    
    it('should NOT render any Vercel logo in header', () => {
      render(<HomePageHeader selectedOwner='' selectedRepo='' onOwnerChange={vi.fn()} onRepoChange={vi.fn()} user={null} />)
      expect(screen.queryByAltText(/vercel/i)).not.toBeInTheDocument()
    })
  })

  describe('Integration Test 3: Metadata Branding', () => {
    it('should have Turbocat as main page title', () => {
      expect(metadata.title).toBe('Turbocat')
    })
    
    it('should have Turbocat in description', () => {
      expect(metadata.description).toContain('Multi-agent AI coding platform')
    })
    
    it('should have Turbocat in OpenGraph metadata', () => {
      expect(metadata.openGraph?.title).toBe('Turbocat')
      expect(metadata.openGraph?.description).toContain('Multi-agent AI coding platform')
    })
    
    it('should have Turbocat in Twitter metadata', () => {
      expect(metadata.twitter?.title).toBe('Turbocat')
      expect(metadata.twitter?.description).toContain('Multi-agent AI coding platform')
    })
  })

  describe('Integration Test 4: Vercel Component Removal', () => {
    it('should NOT render Vercel logo anywhere in header', () => {
      const { container } = render(<HomePageHeader selectedOwner='test' selectedRepo='test' onOwnerChange={vi.fn()} onRepoChange={vi.fn()} user={{ id: '1', email: 'test@example.com' }} />)
      expect(container.innerHTML).not.toMatch(/vercel/i)
    })
    
    it('should NOT render Deploy Your Own button', () => {
      render(<HomePageHeader selectedOwner='' selectedRepo='' onOwnerChange={vi.fn()} onRepoChange={vi.fn()} user={null} />)
      expect(screen.queryByText(/deploy your own/i)).not.toBeInTheDocument()
    })
    
    it('should NOT render GitHub stars button', () => {
      render(<HomePageHeader selectedOwner='' selectedRepo='' onRepoChange={vi.fn()} onOwnerChange={vi.fn()} user={null} />)
      expect(screen.queryByText(/star/i)).not.toBeInTheDocument()
    })
  })
})
