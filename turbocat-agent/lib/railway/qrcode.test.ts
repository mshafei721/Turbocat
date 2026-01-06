/**
 * QR Code Generation Service Tests
 * Phase 4: Mobile Development - Task 3.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  generateQRCode,
  generateQRCodeSVG,
  generateQRCodePNG,
  QRCodeCache,
  createQRCodeCache,
} from './qrcode'

describe('QR Code Generation', () => {
  describe('generateQRCode', () => {
    it('should generate QR code as SVG by default', async () => {
      const result = await generateQRCode('https://test.railway.app')

      expect(result.format).toBe('svg')
      expect(result.data).toContain('<svg')
      expect(result.url).toBe('https://test.railway.app')
      expect(result).toHaveProperty('generatedAt')
    })

    it('should generate QR code as PNG when specified', async () => {
      const result = await generateQRCode('https://test.railway.app', {
        format: 'png',
      })

      expect(result.format).toBe('png')
      // PNG as base64 should start with data URI or base64
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should respect size option', async () => {
      const smallResult = await generateQRCode('https://test.railway.app', {
        size: 100,
      })
      const largeResult = await generateQRCode('https://test.railway.app', {
        size: 400,
      })

      // SVG should contain different viewBox or dimensions
      expect(smallResult.data).toContain('100')
      expect(largeResult.data).toContain('400')
    })

    it('should handle error correction levels', async () => {
      const result = await generateQRCode('https://test.railway.app', {
        errorCorrectionLevel: 'H',
      })

      expect(result.data).toContain('<svg')
    })

    it('should include margin in QR code', async () => {
      const result = await generateQRCode('https://test.railway.app', {
        margin: 8,
      })

      expect(result.data).toContain('<svg')
    })
  })

  describe('generateQRCodeSVG', () => {
    it('should generate valid SVG', async () => {
      const svg = await generateQRCodeSVG('https://test.railway.app')

      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('viewBox')
    })

    it('should handle Expo URLs', async () => {
      const svg = await generateQRCodeSVG('exp://192.168.1.1:19000')

      expect(svg).toContain('<svg')
    })

    it('should handle long URLs', async () => {
      const longUrl = 'https://very-long-project-name-that-needs-more-characters.up.railway.app/some/path?with=query&params=here'
      const svg = await generateQRCodeSVG(longUrl)

      expect(svg).toContain('<svg')
    })
  })

  describe('generateQRCodePNG', () => {
    it('should generate valid base64 PNG', async () => {
      const png = await generateQRCodePNG('https://test.railway.app')

      // Base64 PNG starts with specific bytes (iVBORw0 is PNG header in base64)
      expect(png).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('should generate larger PNG for larger size', async () => {
      const small = await generateQRCodePNG('https://test.railway.app', 100)
      const large = await generateQRCodePNG('https://test.railway.app', 400)

      expect(large.length).toBeGreaterThan(small.length)
    })
  })
})

describe('QRCodeCache', () => {
  let cache: QRCodeCache

  beforeEach(() => {
    vi.useFakeTimers()
    cache = createQRCodeCache()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('get/set', () => {
    it('should cache QR codes', async () => {
      const qrCode = await generateQRCode('https://test.railway.app')
      cache.set('task-123', qrCode)

      const cached = cache.get('task-123')
      expect(cached).toEqual(qrCode)
    })

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent')
      expect(result).toBeNull()
    })

    it('should respect TTL', async () => {
      const qrCode = await generateQRCode('https://test.railway.app')
      cache.set('task-123', qrCode, 60000) // 1 minute TTL

      // Should exist immediately
      expect(cache.get('task-123')).toEqual(qrCode)

      // Should expire after TTL
      vi.advanceTimersByTime(70000)
      expect(cache.get('task-123')).toBeNull()
    })
  })

  describe('getOrGenerate', () => {
    it('should return cached value if exists', async () => {
      const qrCode = await generateQRCode('https://test.railway.app')
      cache.set('task-123', qrCode)

      const generateFn = vi.fn()
      const result = await cache.getOrGenerate('task-123', generateFn)

      expect(result).toEqual(qrCode)
      expect(generateFn).not.toHaveBeenCalled()
    })

    it('should generate and cache new value if not exists', async () => {
      const newQrCode = await generateQRCode('https://new.railway.app')
      const generateFn = vi.fn().mockResolvedValue(newQrCode)

      const result = await cache.getOrGenerate('task-new', generateFn)

      expect(result).toEqual(newQrCode)
      expect(generateFn).toHaveBeenCalled()
      expect(cache.get('task-new')).toEqual(newQrCode)
    })
  })

  describe('delete', () => {
    it('should remove cached item', async () => {
      const qrCode = await generateQRCode('https://test.railway.app')
      cache.set('task-123', qrCode)

      cache.delete('task-123')
      expect(cache.get('task-123')).toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove all cached items', async () => {
      const qr1 = await generateQRCode('https://test1.railway.app')
      const qr2 = await generateQRCode('https://test2.railway.app')

      cache.set('task-1', qr1)
      cache.set('task-2', qr2)

      cache.clear()

      expect(cache.get('task-1')).toBeNull()
      expect(cache.get('task-2')).toBeNull()
    })
  })

  describe('size', () => {
    it('should return number of cached items', async () => {
      expect(cache.size()).toBe(0)

      const qr1 = await generateQRCode('https://test1.railway.app')
      cache.set('task-1', qr1)
      expect(cache.size()).toBe(1)

      const qr2 = await generateQRCode('https://test2.railway.app')
      cache.set('task-2', qr2)
      expect(cache.size()).toBe(2)
    })
  })
})
