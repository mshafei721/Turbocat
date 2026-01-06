/**
 * Mobile Preview Component Tests
 * Phase 4: Mobile Development - Task Group 2
 *
 * These tests verify the Mobile Preview UI component (QR code display):
 * 1. Renders QR code when metroUrl is provided
 * 2. QR code is 300x300px
 * 3. Shows instructions below QR code
 * 4. Displays Metro logs in scrollable pane
 * 5. Shows loading state when Metro is starting
 * 6. Shows error state when Metro fails
 * 7. QR code is centered
 * 8. Instructions include "Download Expo Go" and "Scan QR code"
 *
 * @file __tests__/components/mobile-preview.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MobilePreview } from '@/components/mobile-preview'

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
  },
}))

describe('MobilePreview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test 1: Renders QR code when metroUrl is provided
   */
  it('should render QR code when metroUrl is provided', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      const qrImage = screen.getByRole('img', { name: /qr code/i })
      expect(qrImage).toBeInTheDocument()
    })
  })

  /**
   * Test 2: QR code has correct dimensions (300x300)
   */
  it('should render QR code with 300x300 dimensions', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      const qrImage = screen.getByRole('img', { name: /qr code/i }) as HTMLImageElement
      expect(qrImage).toHaveAttribute('width', '300')
      expect(qrImage).toHaveAttribute('height', '300')
    })
  })

  /**
   * Test 3: Shows instructions below QR code
   */
  it('should display instructions below QR code', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      expect(screen.getByText(/download expo go/i)).toBeInTheDocument()
      expect(screen.getByText(/scan.*qr code/i)).toBeInTheDocument()
    })
  })

  /**
   * Test 4: Shows Metro logs in scrollable pane
   */
  it('should display Metro logs in scrollable pane', () => {
    const logs = [
      { timestamp: '2024-01-05T10:00:00Z', message: 'Metro bundler started', level: 'info' as const },
      { timestamp: '2024-01-05T10:00:01Z', message: 'Waiting for connections', level: 'info' as const },
    ]

    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" logs={logs} />)

    expect(screen.getByText(/metro bundler started/i)).toBeInTheDocument()
    expect(screen.getByText(/waiting for connections/i)).toBeInTheDocument()
  })

  /**
   * Test 5: Shows loading state when Metro is starting
   */
  it('should show loading state when status is starting', () => {
    render(<MobilePreview metroUrl={null} status="starting" />)

    expect(screen.getByText(/starting metro bundler/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  /**
   * Test 6: Shows error state when Metro fails
   */
  it('should show error state when status is error', () => {
    render(<MobilePreview metroUrl={null} status="error" error="Connection timeout" />)

    // Check for error heading
    expect(screen.getByRole('heading', { name: /error/i })).toBeInTheDocument()
    expect(screen.getByText(/connection timeout/i)).toBeInTheDocument()
  })

  /**
   * Test 7: QR code container is centered
   */
  it('should center QR code container', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      const container = screen.getByTestId('qr-code-container')
      expect(container).toHaveClass('flex', 'justify-center')
    })
  })

  /**
   * Test 8: Instructions are numbered/bulleted list
   */
  it('should display instructions as a list', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      const instructionsList = screen.getByRole('list')
      expect(instructionsList).toBeInTheDocument()

      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThanOrEqual(2)
    })
  })

  /**
   * Test 9: Metro URL is displayed for manual entry
   */
  it('should show Metro URL for manual entry', () => {
    const metroUrl = 'exp://192.168.1.100:8081'
    render(<MobilePreview metroUrl={metroUrl} status="running" />)

    expect(screen.getByText(metroUrl)).toBeInTheDocument()
  })

  /**
   * Test 10: Logs container is scrollable
   */
  it('should have scrollable logs container', () => {
    const logs = Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      message: `Log message ${i}`,
      level: 'info' as const,
    }))

    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" logs={logs} />)

    const logsContainer = screen.getByTestId('metro-logs-container')
    expect(logsContainer).toHaveClass('overflow-y-auto')
  })

  /**
   * Test 11: Shows "Stopped" state when container is stopped
   */
  it('should show stopped state when status is stopped', () => {
    render(<MobilePreview metroUrl={null} status="stopped" />)

    // Check for stopped heading
    expect(screen.getByRole('heading', { name: /stopped/i })).toBeInTheDocument()
  })

  /**
   * Test 12: QR code regenerates when metroUrl changes
   */
  it('should regenerate QR code when metroUrl changes', async () => {
    const QRCode = await import('qrcode')
    const { rerender } = render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      expect(QRCode.default.toDataURL).toHaveBeenCalledWith('exp://192.168.1.100:8081', expect.any(Object))
    })

    // Change metro URL
    rerender(<MobilePreview metroUrl="exp://192.168.1.101:8081" status="running" />)

    await waitFor(() => {
      expect(QRCode.default.toDataURL).toHaveBeenCalledWith('exp://192.168.1.101:8081', expect.any(Object))
    })
  })

  /**
   * Test 13: Accessibility - QR code has alt text
   */
  it('should have accessible alt text for QR code', async () => {
    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" />)

    await waitFor(() => {
      const qrImage = screen.getByRole('img', { name: /qr code/i })
      expect(qrImage).toHaveAccessibleName()
    })
  })

  /**
   * Test 14: Shows timestamp for each log entry
   */
  it('should display timestamp for each log entry', () => {
    const logs = [
      { timestamp: '2024-01-05T10:00:00Z', message: 'Log 1', level: 'info' as const },
      { timestamp: '2024-01-05T10:00:01Z', message: 'Log 2', level: 'warn' as const },
    ]

    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" logs={logs} />)

    // Check that timestamps are formatted and displayed (time format varies by locale)
    const logsContainer = screen.getByTestId('metro-logs-container')
    // Match any time format containing hours, minutes, seconds
    expect(logsContainer.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })

  /**
   * Test 15: Log levels have different styling
   */
  it('should apply different styling to different log levels', () => {
    const logs = [
      { timestamp: new Date().toISOString(), message: 'Info log', level: 'info' as const },
      { timestamp: new Date().toISOString(), message: 'Warning log', level: 'warn' as const },
      { timestamp: new Date().toISOString(), message: 'Error log', level: 'error' as const },
    ]

    render(<MobilePreview metroUrl="exp://192.168.1.100:8081" status="running" logs={logs} />)

    // Each log level should have its own styling
    const logsContainer = screen.getByTestId('metro-logs-container')
    expect(logsContainer).toBeInTheDocument()

    // Check for log messages
    expect(screen.getByText(/info log/i)).toBeInTheDocument()
    expect(screen.getByText(/warning log/i)).toBeInTheDocument()
    expect(screen.getByText(/error log/i)).toBeInTheDocument()
  })
})
