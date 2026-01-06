/**
 * QR Code Generation Service
 * Phase 4: Mobile Development - Task 3.5
 *
 * Features:
 * - Generate QR code from Metro URL
 * - Return SVG or PNG format
 * - Cache QR codes with TTL
 * - Rate limiting support (via API route)
 */

import QRCode from 'qrcode'
import { QRCodeOptions, QRCodeResult } from './types'

// Default options
const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  size: 300,
  format: 'svg',
  errorCorrectionLevel: 'M',
  margin: 4,
}

/**
 * Generate a QR code for the given URL
 */
export async function generateQRCode(
  url: string,
  options: QRCodeOptions = {},
): Promise<QRCodeResult> {
  const opts: Required<QRCodeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let data: string

  if (opts.format === 'svg') {
    data = await generateQRCodeSVG(url, opts.size, opts.errorCorrectionLevel, opts.margin)
  } else {
    data = await generateQRCodePNG(url, opts.size, opts.errorCorrectionLevel, opts.margin)
  }

  return {
    data,
    format: opts.format,
    url,
    generatedAt: new Date(),
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  url: string,
  size: number = DEFAULT_OPTIONS.size,
  errorCorrectionLevel: QRCodeOptions['errorCorrectionLevel'] = DEFAULT_OPTIONS.errorCorrectionLevel,
  margin: number = DEFAULT_OPTIONS.margin,
): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin,
    errorCorrectionLevel,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })

  return svg
}

/**
 * Generate QR code as base64 PNG
 */
export async function generateQRCodePNG(
  url: string,
  size: number = DEFAULT_OPTIONS.size,
  errorCorrectionLevel: QRCodeOptions['errorCorrectionLevel'] = DEFAULT_OPTIONS.errorCorrectionLevel,
  margin: number = DEFAULT_OPTIONS.margin,
): Promise<string> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin,
    errorCorrectionLevel,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })

  // Remove the data URI prefix to return just base64
  return dataUrl.replace(/^data:image\/png;base64,/, '')
}

// Cache entry type
interface CacheEntry {
  value: QRCodeResult
  expiresAt: number
}

/**
 * QR Code Cache interface
 */
export interface QRCodeCache {
  get(key: string): QRCodeResult | null
  set(key: string, value: QRCodeResult, ttlMs?: number): void
  getOrGenerate(
    key: string,
    generateFn: () => Promise<QRCodeResult>,
    ttlMs?: number,
  ): Promise<QRCodeResult>
  delete(key: string): void
  clear(): void
  size(): number
}

// Default cache TTL: 1 hour
const DEFAULT_CACHE_TTL = 60 * 60 * 1000

/**
 * Create a QR code cache instance
 */
export function createQRCodeCache(): QRCodeCache {
  const cache = new Map<string, CacheEntry>()

  function isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  function cleanup(): void {
    for (const [key, entry] of cache) {
      if (isExpired(entry)) {
        cache.delete(key)
      }
    }
  }

  return {
    get(key: string): QRCodeResult | null {
      const entry = cache.get(key)

      if (!entry) {
        return null
      }

      if (isExpired(entry)) {
        cache.delete(key)
        return null
      }

      return entry.value
    },

    set(key: string, value: QRCodeResult, ttlMs: number = DEFAULT_CACHE_TTL): void {
      cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
    },

    async getOrGenerate(
      key: string,
      generateFn: () => Promise<QRCodeResult>,
      ttlMs: number = DEFAULT_CACHE_TTL,
    ): Promise<QRCodeResult> {
      const existing = this.get(key)

      if (existing) {
        return existing
      }

      const newValue = await generateFn()
      this.set(key, newValue, ttlMs)
      return newValue
    },

    delete(key: string): void {
      cache.delete(key)
    },

    clear(): void {
      cache.clear()
    },

    size(): number {
      // Clean up expired entries first
      cleanup()
      return cache.size
    },
  }
}

// Global cache instance
let _qrCodeCache: QRCodeCache | null = null

/**
 * Get the global QR code cache instance
 */
export function getQRCodeCache(): QRCodeCache {
  if (!_qrCodeCache) {
    _qrCodeCache = createQRCodeCache()
  }
  return _qrCodeCache
}
