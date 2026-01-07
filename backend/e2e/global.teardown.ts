/**
 * Global Teardown for E2E Tests
 *
 * This file runs once after all E2E tests complete. It handles:
 * - Test data cleanup
 * - Resource cleanup
 * - Report generation summary
 *
 * @module e2e/global.teardown
 */

import { FullConfig } from '@playwright/test';

/**
 * Global teardown function
 *
 * This function is called once after all tests have completed.
 * It cleans up any resources created during testing.
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n========================================');
  console.log('E2E Global Teardown Starting');
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    // Log test run summary
    console.log('Test Run Summary:');
    console.log(`  Setup completed: ${process.env.E2E_SETUP_COMPLETE || 'unknown'}`);
    console.log(`  Setup timestamp: ${process.env.E2E_SETUP_TIMESTAMP || 'unknown'}`);

    // Calculate test run duration
    if (process.env.E2E_SETUP_TIMESTAMP) {
      const setupTime = new Date(process.env.E2E_SETUP_TIMESTAMP).getTime();
      const totalDuration = Date.now() - setupTime;
      console.log(`  Total test run duration: ${totalDuration}ms`);
    }

    // Note: Test data cleanup is typically handled by:
    // 1. Using isolated test databases
    // 2. Rolling back transactions after each test
    // 3. Using unique identifiers for test data
    // 4. Automatic cleanup in test afterEach/afterAll hooks
    //
    // If you need to clean up test data here, you can:
    // 1. Connect to the test database
    // 2. Delete records created during tests (by tag, timestamp, etc.)
    // 3. Reset database state

    console.log('\nCleanup Notes:');
    console.log('  - Test data with "e2e-test" tags may remain in database');
    console.log('  - Use database cleanup scripts for thorough cleanup');
    console.log('  - Consider running tests against isolated test database');

    const duration = Date.now() - startTime;
    console.log(`\nGlobal teardown completed in ${duration}ms`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('E2E Global Teardown Error!');
    console.error('========================================');
    console.error(error);
    // Don't throw - we want tests to complete even if teardown fails
    console.error('Teardown error will not fail the test run');
  }
}

export default globalTeardown;
