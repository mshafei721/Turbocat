/**
 * Integration Tests for Railway POC
 * Tests deployment readiness and basic functionality
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Color output for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(type, message) {
  const icons = {
    pass: '✅',
    fail: '❌',
    info: '📋',
    test: '🧪'
  };
  const color = type === 'pass' ? colors.green : type === 'fail' ? colors.red : colors.blue;
  console.log(`${color}${icons[type] || icons.info} ${message}${colors.reset}`);
}

// Test Suite
const tests = {
  total: 0,
  passed: 0,
  failed: 0
};

async function runTest(name, testFn) {
  tests.total++;
  try {
    await testFn();
    tests.passed++;
    log('pass', `${name}`);
    return true;
  } catch (error) {
    tests.failed++;
    log('fail', `${name}: ${error.message}`);
    return false;
  }
}

// Test: File Structure
async function testFileStructure() {
  const requiredFiles = [
    '../expo-poc-app/package.json',
    '../expo-poc-app/App.js',
    '../expo-poc-app/Dockerfile',
    '../expo-poc-app/railway.json',
    '../expo-poc-app/node_modules'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file/directory: ${file}`);
    }
  }
}

// Test: Package JSON Configuration
async function testPackageJSON() {
  const packagePath = path.join(__dirname, '../expo-poc-app/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  if (!packageJson.scripts.railway) {
    throw new Error('Missing railway script in package.json');
  }

  if (!packageJson.dependencies.expo) {
    throw new Error('Missing expo dependency');
  }

  if (!packageJson.dependencies['react-native']) {
    throw new Error('Missing react-native dependency');
  }
}

// Test: App.js POC Content
async function testAppContent() {
  const appPath = path.join(__dirname, '../expo-poc-app/App.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  if (!appContent.includes('Railway.app POC')) {
    throw new Error('App.js missing POC branding');
  }

  if (!appContent.includes('Expo Metro Bundler Test')) {
    throw new Error('App.js missing Expo Metro test text');
  }
}

// Test: Dockerfile Configuration
async function testDockerfile() {
  const dockerfilePath = path.join(__dirname, '../expo-poc-app/Dockerfile');
  const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');

  if (!dockerfile.includes('FROM node:')) {
    throw new Error('Dockerfile missing Node.js base image');
  }

  if (!dockerfile.includes('EXPO_DEVTOOLS_LISTEN_ADDRESS')) {
    throw new Error('Dockerfile missing Expo environment variables');
  }

  if (!dockerfile.includes('CMD')) {
    throw new Error('Dockerfile missing CMD instruction');
  }
}

// Test: Railway Configuration
async function testRailwayConfig() {
  const railwayPath = path.join(__dirname, '../expo-poc-app/railway.json');
  const railwayConfig = JSON.parse(fs.readFileSync(railwayPath, 'utf8'));

  if (railwayConfig.build.builder !== 'DOCKERFILE') {
    throw new Error('Railway builder not set to DOCKERFILE');
  }

  if (!railwayConfig.deploy.startCommand) {
    throw new Error('Railway startCommand not configured');
  }
}

// Test: Monitoring Scripts
async function testMonitoringScripts() {
  const costTrackerPath = path.join(__dirname, '../monitoring/cost-tracker.js');
  const uptimeMonitorPath = path.join(__dirname, '../monitoring/uptime-monitor.js');

  if (!fs.existsSync(costTrackerPath)) {
    throw new Error('Missing cost-tracker.js');
  }

  if (!fs.existsSync(uptimeMonitorPath)) {
    throw new Error('Missing uptime-monitor.js');
  }

  // Test that scripts are executable (have proper Node.js syntax)
  const costTracker = fs.readFileSync(costTrackerPath, 'utf8');
  if (!costTracker.includes('#!/usr/bin/env node')) {
    throw new Error('cost-tracker.js missing shebang');
  }
}

// Test: Dependencies Installation
async function testDependencies() {
  const nodeModulesPath = path.join(__dirname, '../expo-poc-app/node_modules');
  const expoPath = path.join(nodeModulesPath, 'expo');
  const reactPath = path.join(nodeModulesPath, 'react');

  if (!fs.existsSync(expoPath)) {
    throw new Error('Expo not installed in node_modules');
  }

  if (!fs.existsSync(reactPath)) {
    throw new Error('React not installed in node_modules');
  }
}

// Test: Railway URL Check (if URL provided)
async function testRailwayURL(url) {
  if (!url) {
    throw new Error('No Railway URL provided (expected - deploy first)');
  }

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 302) {
        resolve();
      } else {
        reject(new Error(`URL returned status ${res.statusCode}`));
      }
    }).on('error', (error) => {
      reject(new Error(`URL check failed: ${error.message}`));
    }).setTimeout(10000, () => {
      reject(new Error('URL check timeout'));
    });
  });
}

// Main Test Runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('test', 'Railway POC Integration Tests');
  console.log('='.repeat(60) + '\n');

  log('info', 'Phase 1: Pre-Deployment Tests\n');

  await runTest('File structure verification', testFileStructure);
  await runTest('package.json configuration', testPackageJSON);
  await runTest('App.js POC content', testAppContent);
  await runTest('Dockerfile configuration', testDockerfile);
  await runTest('Railway config validation', testRailwayConfig);
  await runTest('Monitoring scripts present', testMonitoringScripts);
  await runTest('Dependencies installed', testDependencies);

  // Post-deployment test (optional)
  const railwayURL = process.argv[2];
  if (railwayURL) {
    log('info', '\nPhase 2: Post-Deployment Tests\n');
    await runTest(`Railway URL accessibility: ${railwayURL}`, () => testRailwayURL(railwayURL));
  } else {
    log('info', '\nPhase 2: Skipped (no Railway URL provided)');
    log('info', 'Run with URL after deployment: node integration.test.js <railway-url>\n');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('info', 'Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.total}`);
  console.log(`${colors.green}Passed: ${tests.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${tests.failed}${colors.reset}`);
  console.log(`Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  if (tests.failed > 0) {
    log('fail', 'Some tests failed. Please review errors above.');
    process.exit(1);
  } else {
    log('pass', 'All tests passed! Ready for Railway deployment.');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  log('fail', `Test runner error: ${error.message}`);
  process.exit(1);
});
