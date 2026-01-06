/**
 * Railway Backend Integration Module
 * Phase 4: Mobile Development - Tasks 3.1-3.5
 *
 * This module provides the complete Railway container management
 * solution for running Expo Metro bundlers for mobile development.
 */

// Types
export * from './types'

// Railway API Client (Task 3.1)
export {
  createRailwayClient,
  getRailwayClientFromEnv,
  DEFAULT_RETRY_CONFIG,
  type RailwayClient,
} from './client'

// Container Lifecycle Service (Task 3.3)
export {
  createLifecycleService,
  getLifecycleService,
  INACTIVITY_TIMEOUT_MS,
  type ContainerLifecycleService,
} from './lifecycle'

// Metro Health Monitoring (Task 3.4)
export {
  createHealthMonitor,
  DEFAULT_HEALTH_CONFIG,
  parseMetroLogs,
  isRecoverableError,
  type MetroHealthMonitor,
} from './health'

// QR Code Generation (Task 3.5)
export {
  generateQRCode,
  generateQRCodeSVG,
  generateQRCodePNG,
  createQRCodeCache,
  getQRCodeCache,
  type QRCodeCache,
} from './qrcode'
