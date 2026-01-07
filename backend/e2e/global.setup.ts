/**
 * Global Setup for E2E Tests
 *
 * This file runs once before all E2E tests. It handles:
 * - Environment validation
 * - API health check
 * - Test database preparation (if needed)
 * - Global test data seeding
 *
 * @module e2e/global.setup
 */

import { FullConfig, request } from '@playwright/test';

/**
 * Get the base URL for API requests
 */
function getBaseUrl(): string {
  return process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || '3001'}`;
}

/**
 * Check if the API is healthy
 *
 * @param baseUrl - Base URL of the API
 * @returns True if API is healthy
 */
async function checkApiHealth(baseUrl: string): Promise<boolean> {
  const context = await request.newContext({ baseURL: baseUrl });

  try {
    const response = await context.get('/health/live', {
      timeout: 10000,
    });

    if (!response.ok()) {
      console.error(`Health check failed: ${response.status()}`);
      return false;
    }

    const body = await response.json();
    console.log('API Health Check:', body);
    return true;
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  } finally {
    await context.dispose();
  }
}

/**
 * Wait for API to be ready with retries
 *
 * @param baseUrl - Base URL of the API
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Delay between retries in milliseconds
 */
async function waitForApi(
  baseUrl: string,
  maxRetries: number = 30,
  delayMs: number = 2000,
): Promise<void> {
  console.log(`Waiting for API at ${baseUrl}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Health check attempt ${attempt}/${maxRetries}`);

    const healthy = await checkApiHealth(baseUrl);
    if (healthy) {
      console.log('API is ready!');
      return;
    }

    if (attempt < maxRetries) {
      console.log(`Waiting ${delayMs}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`API at ${baseUrl} did not become healthy within ${maxRetries * delayMs}ms`);
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  console.log('Validating E2E test environment...');

  // Log environment info
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    E2E_BASE_URL: process.env.E2E_BASE_URL || 'not set (using default)',
    PORT: process.env.PORT || 'not set (using default)',
    CI: process.env.CI || 'not set',
  });

  // Warn about production environment
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Running E2E tests against production environment!');
  }
}

/**
 * Global setup function
 *
 * This function is called once before all tests run.
 * It prepares the test environment and validates prerequisites.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n========================================');
  console.log('E2E Global Setup Starting');
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    // Step 1: Validate environment
    validateEnvironment();

    // Step 2: Get base URL
    const baseUrl = getBaseUrl();
    console.log(`Base URL: ${baseUrl}`);

    // Step 3: Wait for API to be ready
    // Skip if running with webServer config (Playwright manages server)
    if (config.webServer) {
      console.log('Using Playwright webServer config - API will be started automatically');
    } else {
      await waitForApi(baseUrl);
    }

    // Step 4: Store test metadata
    process.env.E2E_SETUP_COMPLETE = 'true';
    process.env.E2E_SETUP_TIMESTAMP = new Date().toISOString();

    const duration = Date.now() - startTime;
    console.log(`\nGlobal setup completed in ${duration}ms`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('E2E Global Setup Failed!');
    console.error('========================================');
    console.error(error);
    throw error;
  }
}

export default globalSetup;
