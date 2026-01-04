/**
 * Vitest Setup File
 *
 * Configure testing environment and global utilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/vitest.setup.ts
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn()

// Cleanup after each test
afterEach(() => {
  cleanup()
})
