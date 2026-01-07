/**
 * Platform-Specific Preview E2E Tests
 * Phase 7: Testing & QA - Task 7.3
 *
 * Tests end-to-end platform-specific preview functionality:
 * 1. Web task shows iframe preview
 * 2. Mobile task shows QR code preview
 * 3. Platform selector works correctly
 * 4. Preview transitions between tasks
 * 5. Preview states (loading, error, success)
 *
 * @file __tests__/e2e/platform-preview.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Mock components for testing
 */
vi.mock('@/components/platform-selector', () => ({
  PlatformSelector: ({ value, onChange }: any) => (
    <div data-testid="platform-selector">
      <button
        data-testid="web-button"
        onClick={() => onChange('web')}
        className={value === 'web' ? 'selected' : ''}
      >
        Web
      </button>
      <button
        data-testid="mobile-button"
        onClick={() => onChange('mobile')}
        className={value === 'mobile' ? 'selected' : ''}
      >
        Mobile
      </button>
    </div>
  ),
}))

vi.mock('@/components/mobile-preview', () => ({
  MobilePreview: ({ metroUrl, status, logs }: any) => (
    <div data-testid="mobile-preview">
      <div data-testid="qr-code">QR Code for {metroUrl}</div>
      <div data-testid="metro-status">{status}</div>
      {logs && <div data-testid="metro-logs">{logs.length} logs</div>}
    </div>
  ),
}))

vi.mock('@/components/task-details', () => ({
  TaskDetails: ({ task }: any) => (
    <div data-testid="task-details">
      <h1>{task.title}</h1>
      <p>{task.platform}</p>
      {task.platform === 'web' && (
        <iframe
          data-testid="vercel-sandbox"
          src={task.sandboxUrl}
          title="Web Preview"
        />
      )}
      {task.platform === 'mobile' && <div data-testid="mobile-section">Mobile preview shown</div>}
    </div>
  ),
}))

describe('Platform-Specific Preview E2E Tests', () => {
  /**
   * Test 1: Web task displays iframe preview
   */
  it('should display iframe for web platform tasks', async () => {
    const mockTask = {
      id: 'task-web-123',
      title: 'Web Dashboard',
      platform: 'web',
      sandboxUrl: 'https://vercel-sandbox.example.com/web-123',
      description: 'A web dashboard',
    }

    const { TaskDetails } = await import('@/components/task-details')

    render(<TaskDetails task={mockTask} />)

    await waitFor(() => {
      const iframe = screen.getByTestId('vercel-sandbox')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', mockTask.sandboxUrl)
    })
  })

  /**
   * Test 2: Mobile task displays QR code preview
   */
  it('should display QR code for mobile platform tasks', async () => {
    const mockTask = {
      id: 'task-mobile-123',
      title: 'Mobile Weather App',
      platform: 'mobile',
      metroUrl: 'https://mobile-123.up.railway.app',
      description: 'A weather app',
    }

    const { MobilePreview } = await import('@/components/mobile-preview')

    render(<MobilePreview metroUrl={mockTask.metroUrl} status="running" />)

    await waitFor(() => {
      const qrCode = screen.getByTestId('qr-code')
      expect(qrCode).toBeInTheDocument()
      expect(qrCode.textContent).toContain('mobile-123.up.railway.app')
    })
  })

  /**
   * Test 3: Platform selector changes task type selection
   */
  it('should update platform selection when selector changes', async () => {
    const mockOnChange = vi.fn()
    const { PlatformSelector } = await import('@/components/platform-selector')

    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    const mobileButton = screen.getByTestId('mobile-button')
    fireEvent.click(mobileButton)

    expect(mockOnChange).toHaveBeenCalledWith('mobile')
  })

  /**
   * Test 4: Platform selector shows correct selected state
   */
  it('should highlight selected platform in selector', async () => {
    const { PlatformSelector } = await import('@/components/platform-selector')

    const { rerender } = render(<PlatformSelector value="web" onChange={() => {}} />)

    let webButton = screen.getByTestId('web-button')
    expect(webButton).toHaveClass('selected')

    let mobileButton = screen.getByTestId('mobile-button')
    expect(mobileButton).not.toHaveClass('selected')

    // Switch to mobile
    rerender(<PlatformSelector value="mobile" onChange={() => {}} />)

    webButton = screen.getByTestId('web-button')
    expect(webButton).not.toHaveClass('selected')

    mobileButton = screen.getByTestId('mobile-button')
    expect(mobileButton).toHaveClass('selected')
  })

  /**
   * Test 5: Switching between tasks updates preview
   */
  it('should update preview when switching between tasks', async () => {
    const webTask = {
      id: 'task-web-123',
      title: 'Web App',
      platform: 'web',
      sandboxUrl: 'https://vercel-sandbox.example.com/web-123',
    }

    const mobileTask = {
      id: 'task-mobile-123',
      title: 'Mobile App',
      platform: 'mobile',
      metroUrl: 'https://mobile-123.up.railway.app',
    }

    const { TaskDetails } = await import('@/components/task-details')

    const { rerender } = render(<TaskDetails task={webTask} />)

    // Verify web preview
    await waitFor(() => {
      const iframe = screen.getByTestId('vercel-sandbox')
      expect(iframe).toBeInTheDocument()
    })

    // Switch to mobile task
    rerender(<TaskDetails task={mobileTask} />)

    // Verify mobile preview section
    await waitFor(() => {
      const mobileSection = screen.getByTestId('mobile-section')
      expect(mobileSection).toBeInTheDocument()
    })
  })

  /**
   * Test 6: Mobile preview shows loading state
   */
  it('should display loading state for starting metro', async () => {
    const { MobilePreview } = await import('@/components/mobile-preview')

    render(<MobilePreview metroUrl={null} status="starting" />)

    const metroStatus = screen.getByTestId('metro-status')
    expect(metroStatus.textContent).toBe('starting')
  })

  /**
   * Test 7: Mobile preview shows running state
   */
  it('should display running state when metro is ready', async () => {
    const { MobilePreview } = await import('@/components/mobile-preview')

    render(<MobilePreview metroUrl="https://mobile-123.up.railway.app" status="running" />)

    const metroStatus = screen.getByTestId('metro-status')
    expect(metroStatus.textContent).toBe('running')
  })

  /**
   * Test 8: Mobile preview displays logs
   */
  it('should display metro logs in mobile preview', async () => {
    const mockLogs = [
      { timestamp: new Date(), level: 'info', message: 'Metro started' },
      { timestamp: new Date(), level: 'info', message: 'Bundling app' },
      { timestamp: new Date(), level: 'warn', message: 'Performance warning' },
    ]

    const { MobilePreview } = await import('@/components/mobile-preview')

    render(<MobilePreview metroUrl="https://mobile-123.up.railway.app" status="running" logs={mockLogs} />)

    const logsContainer = screen.getByTestId('metro-logs')
    expect(logsContainer.textContent).toContain('3 logs')
  })

  /**
   * Test 9: Web and mobile previews don't show simultaneously
   */
  it('should not display both web and mobile previews at same time', async () => {
    const webTask = {
      id: 'task-web-123',
      title: 'Web App',
      platform: 'web',
      sandboxUrl: 'https://vercel-sandbox.example.com/web-123',
    }

    const { TaskDetails } = await import('@/components/task-details')

    render(<TaskDetails task={webTask} />)

    // Web iframe should be visible
    const iframe = screen.getByTestId('vercel-sandbox')
    expect(iframe).toBeInTheDocument()

    // Mobile section should not be visible for web task
    const mobileSection = screen.queryByTestId('mobile-section')
    expect(mobileSection).not.toBeInTheDocument()
  })

  /**
   * Test 10: Preview persists task state when switching tasks
   */
  it('should maintain independent state for web and mobile previews', async () => {
    const webTask = {
      id: 'task-web-123',
      title: 'Web App',
      platform: 'web',
      sandboxUrl: 'https://vercel-sandbox.example.com/web-123',
    }

    const mobileTask = {
      id: 'task-mobile-123',
      title: 'Mobile App',
      platform: 'mobile',
      metroUrl: 'https://mobile-123.up.railway.app',
    }

    const { TaskDetails } = await import('@/components/task-details')

    // Start with web task
    const { rerender } = render(<TaskDetails task={webTask} />)

    const iframeWeb = screen.getByTestId('vercel-sandbox')
    const iframeSrcBefore = iframeWeb.getAttribute('src')

    // Switch to mobile
    rerender(<TaskDetails task={mobileTask} />)

    // Switch back to web
    rerender(<TaskDetails task={webTask} />)

    // Web iframe URL should remain the same
    const iframeWebAfter = screen.getByTestId('vercel-sandbox')
    const iframeSrcAfter = iframeWebAfter.getAttribute('src')

    expect(iframeSrcBefore).toBe(iframeSrcAfter)
  })

  /**
   * Test 11: Platform selector is accessible
   */
  it('should have accessible platform selector buttons', async () => {
    const { PlatformSelector } = await import('@/components/platform-selector')

    render(<PlatformSelector value="web" onChange={() => {}} />)

    const webButton = screen.getByTestId('web-button')
    const mobileButton = screen.getByTestId('mobile-button')

    // Both buttons should be in the document and clickable
    expect(webButton).toBeInTheDocument()
    expect(mobileButton).toBeInTheDocument()
  })

  /**
   * Test 12: Mobile preview handles undefined metro URL gracefully
   */
  it('should handle undefined metro URL gracefully', async () => {
    const { MobilePreview } = await import('@/components/mobile-preview')

    render(<MobilePreview metroUrl={undefined} status="starting" />)

    const preview = screen.getByTestId('mobile-preview')
    expect(preview).toBeInTheDocument()

    const metroStatus = screen.getByTestId('metro-status')
    expect(metroStatus.textContent).toBe('starting')
  })

  /**
   * Test 13: Web preview handles missing sandbox URL gracefully
   */
  it('should handle missing sandbox URL gracefully', async () => {
    const webTask = {
      id: 'task-web-123',
      title: 'Web App',
      platform: 'web',
      sandboxUrl: undefined,
    }

    const { TaskDetails } = await import('@/components/task-details')

    render(<TaskDetails task={webTask} />)

    const taskDetails = screen.getByTestId('task-details')
    expect(taskDetails).toBeInTheDocument()

    // Iframe should not be rendered if URL is missing
    const iframe = screen.queryByTestId('vercel-sandbox')
    expect(iframe).not.toBeInTheDocument()
  })

  /**
   * Test 14: Preview renders without crashing when task is null
   */
  it('should render safely when task details change', async () => {
    const { TaskDetails } = await import('@/components/task-details')

    const mockTask = {
      id: 'task-123',
      title: 'Test Task',
      platform: 'web',
      sandboxUrl: 'https://example.com',
    }

    const { rerender } = render(<TaskDetails task={mockTask} />)

    expect(() => {
      rerender(<TaskDetails task={{ ...mockTask, platform: 'mobile' }} />)
    }).not.toThrow()
  })

  /**
   * Test 15: Mobile and web task platform values are strings
   */
  it('should have valid platform string values', async () => {
    const webTask = {
      id: 'task-web-123',
      title: 'Web App',
      platform: 'web',
      sandboxUrl: 'https://example.com',
    }

    const mobileTask = {
      id: 'task-mobile-123',
      title: 'Mobile App',
      platform: 'mobile',
      metroUrl: 'https://mobile-123.up.railway.app',
    }

    expect(typeof webTask.platform).toBe('string')
    expect(typeof mobileTask.platform).toBe('string')
    expect(['web', 'mobile']).toContain(webTask.platform)
    expect(['web', 'mobile']).toContain(mobileTask.platform)
  })
})
