/**
 * Playwright Configuration for E2E API Testing
 *
 * This configuration is optimized for testing a backend API,
 * not a browser-based frontend. It uses Playwright's request
 * context for making HTTP requests to the API endpoints.
 *
 * Key Features:
 * - API-only testing (no browser required for most tests)
 * - Configurable base URL for different environments
 * - Retry logic for flaky network conditions
 * - Parallel test execution with worker limits
 * - Comprehensive reporting (HTML, JSON, JUnit)
 * - Global setup and teardown for environment preparation
 *
 * Usage:
 *   npm run test:e2e                    # Run all E2E tests
 *   npm run test:e2e -- --project=api   # Run API tests only
 *   npm run test:e2e -- --project=smoke # Run smoke tests only
 *   npm run test:e2e -- --ui            # Run with Playwright UI
 *
 * Environment Variables:
 *   E2E_BASE_URL   - Base URL for API (default: http://localhost:3001)
 *   PORT           - Backend port (default: 3001)
 *   CI             - Set to 'true' in CI environments
 *
 * @module playwright.config
 */

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test first, then .env
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Get the API base URL from environment or default to localhost
 */
const getBaseUrl = (): string => {
  // Check for explicit E2E test URL first
  if (process.env.E2E_BASE_URL) {
    return process.env.E2E_BASE_URL;
  }

  // Fall back to backend URL for local development
  const port = process.env.PORT || '3001';
  return `http://localhost:${port}`;
};

/**
 * Get the API version prefix
 */
const getApiVersion = (): string => {
  return process.env.API_VERSION || 'v1';
};

/**
 * Playwright configuration for E2E API testing
 */
export default defineConfig({
  // ==========================================================================
  // Test Discovery
  // ==========================================================================

  // Test directory containing E2E test files
  testDir: './e2e',

  // Test file pattern - matches both .spec.ts and .e2e.ts files
  testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],

  // Ignore helper files and setup files
  testIgnore: ['**/helpers/**', '**/global.*.ts'],

  // ==========================================================================
  // Test Execution
  // ==========================================================================

  // Timeout for each test in milliseconds (30 seconds)
  // API tests should be fast, but allow for database operations
  timeout: 30000,

  // Timeout for assertions (5 seconds)
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is found in source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  // More retries on CI due to potential network flakiness
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  // Limit parallelism to avoid overwhelming the test database
  workers: process.env.CI ? 2 : 4,

  // ==========================================================================
  // Reporting
  // ==========================================================================

  // Reporter configuration
  reporter: [
    // Console reporter for real-time output
    ['list'],
    // HTML report for detailed analysis
    ['html', { outputFolder: 'e2e-results/html', open: 'never' }],
    // JSON report for CI integration and custom processing
    ['json', { outputFile: 'e2e-results/results.json' }],
    // JUnit report for CI systems (GitHub Actions, Jenkins, etc.)
    ...(process.env.CI
      ? [['junit', { outputFile: 'e2e-results/junit.xml' }] as const]
      : []),
  ],

  // Output directory for test artifacts (traces, screenshots, etc.)
  outputDir: 'e2e-results/artifacts',

  // ==========================================================================
  // Global Setup and Teardown
  // ==========================================================================

  // Global setup - runs once before all tests
  globalSetup: './e2e/global.setup.ts',

  // Global teardown - runs once after all tests
  globalTeardown: './e2e/global.teardown.ts',

  // ==========================================================================
  // Projects
  // ==========================================================================

  projects: [
    // Primary API testing project
    {
      name: 'api',
      testDir: './e2e',
      testIgnore: ['**/smoke.spec.ts', '**/helpers/**', '**/global.*.ts'],
      use: {
        // Base URL for API requests
        baseURL: getBaseUrl(),

        // Extra HTTP headers for all requests
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },

        // Trace configuration for debugging
        trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
      },
    },

    // Smoke tests - quick sanity checks for deployments
    {
      name: 'smoke',
      testDir: './e2e',
      testMatch: '**/smoke.spec.ts',
      use: {
        baseURL: getBaseUrl(),
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        trace: 'on-first-retry',
      },
      // Smoke tests should be fast
      timeout: 15000,
      retries: 1,
    },
  ],

  // ==========================================================================
  // Web Server
  // ==========================================================================

  // Web server configuration
  // Start the backend server before running tests
  webServer: {
    // Command to start the server
    command: 'npm run dev',

    // URL to wait for before running tests
    url: `${getBaseUrl()}/health/live`,

    // Timeout for server startup (2 minutes)
    timeout: 120000,

    // Reuse existing server if already running (helpful for local dev)
    reuseExistingServer: !process.env.CI,

    // Stdout handling
    stdout: 'pipe',
    stderr: 'pipe',

    // Environment variables for the server
    env: {
      NODE_ENV: 'test',
      PORT: process.env.PORT || '3001',
    },
  },

  // ==========================================================================
  // Metadata
  // ==========================================================================

  // Metadata for test reports
  metadata: {
    project: 'Turbocat Backend',
    type: 'E2E API Tests',
    environment: process.env.NODE_ENV || 'test',
    apiVersion: getApiVersion(),
    baseUrl: getBaseUrl(),
  },
});
