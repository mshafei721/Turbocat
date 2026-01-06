'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { Loader2, AlertCircle, QrCode as QrCodeIcon, Smartphone, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetroStatus = 'starting' | 'running' | 'stopped' | 'error'

export interface MetroLog {
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
}

interface MobilePreviewProps {
  metroUrl: string | null
  status: MetroStatus
  logs?: MetroLog[]
  error?: string
}

/**
 * Mobile Preview Component
 * Phase 4: Mobile Development - Task Group 2
 *
 * Displays QR code for Expo mobile previews with Metro bundler.
 * Features:
 * - Large centered QR code (300x300px)
 * - Instructions for Expo Go app
 * - Metro URL for manual entry
 * - Scrollable Metro logs pane
 * - Loading, error, and stopped states
 */
export function MobilePreview({ metroUrl, status, logs = [], error }: MobilePreviewProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Generate QR code when metroUrl changes
  useEffect(() => {
    if (metroUrl && status === 'running') {
      QRCode.toDataURL(metroUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate QR code:', err)
          setQrCodeDataUrl(null)
        })
    } else {
      setQrCodeDataUrl(null)
    }
  }, [metroUrl, status])

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return timestamp
    }
  }

  // Get log level styling
  const getLogLevelClass = (level: MetroLog['level']) => {
    switch (level) {
      case 'info':
        return 'text-muted-foreground'
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Smartphone className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">Mobile Preview</h3>
        <div className="ml-auto flex items-center gap-2">
          {status === 'running' && <CheckCircle className="w-4 h-4 text-green-500" />}
          {status === 'starting' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
          <span className="text-sm text-muted-foreground capitalize">{status}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Starting State */}
        {status === 'starting' && (
          <div className="flex flex-col items-center justify-center h-full text-center" role="status">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <h4 className="text-lg font-semibold mb-2">Starting Metro Bundler</h4>
            <p className="text-sm text-muted-foreground">
              Setting up your React Native development environment...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h4 className="text-lg font-semibold mb-2">Error</h4>
            <p className="text-sm text-red-600 dark:text-red-400">{error || 'Failed to start Metro bundler'}</p>
          </div>
        )}

        {/* Stopped State */}
        {status === 'stopped' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Stopped</h4>
            <p className="text-sm text-muted-foreground">Metro bundler has been stopped</p>
          </div>
        )}

        {/* Running State - QR Code and Instructions */}
        {status === 'running' && metroUrl && (
          <div className="space-y-6">
            {/* QR Code */}
            <div data-testid="qr-code-container" className="flex justify-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR code for Expo Go app"
                  width={300}
                  height={300}
                  className="border-4 border-border rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-[300px] h-[300px] border-4 border-border rounded-lg flex items-center justify-center bg-muted">
                  <QrCodeIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-center">How to Preview on Your Device</h4>
              <ol className="space-y-3 text-sm" role="list">
                <li className="flex items-start gap-3" role="listitem">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <span>
                    <strong>Download Expo Go</strong> app from the App Store (iOS) or Google Play Store (Android)
                  </span>
                </li>
                <li className="flex items-start gap-3" role="listitem">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <span>
                    <strong>Scan the QR code</strong> above with your device's camera or the Expo Go app
                  </span>
                </li>
                <li className="flex items-start gap-3" role="listitem">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <span>
                    <strong>Open in Expo Go</strong> to see your app running on your device
                  </span>
                </li>
              </ol>

              {/* Manual Entry */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Or manually enter this URL in Expo Go:</p>
                <code className="text-sm font-mono break-all select-all">{metroUrl}</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metro Logs */}
      {logs.length > 0 && (
        <div className="border-t">
          <div className="p-3 bg-muted/50">
            <h4 className="text-sm font-semibold">Metro Logs</h4>
          </div>
          <div
            data-testid="metro-logs-container"
            className="h-48 overflow-y-auto p-3 bg-background font-mono text-xs"
          >
            {logs.map((log, index) => (
              <div key={index} className={cn('mb-1', getLogLevelClass(log.level))}>
                <span className="text-muted-foreground">[{formatTime(log.timestamp)}]</span>{' '}
                <span className="font-semibold uppercase">{log.level}:</span> {log.message}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
