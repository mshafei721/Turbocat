#!/usr/bin/env node
/**
 * Local Test Script for Expo POC App
 * Validates app structure and dependencies before Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Pre-Deployment Tests...\n');

// Test 1: Check package.json exists and is valid
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('✅ package.json is valid');
  console.log(`   - Name: ${packageJson.name}`);
  console.log(`   - Version: ${packageJson.version}`);
  console.log(`   - Railway script: ${packageJson.scripts.railway ? 'Found' : 'Missing'}`);
} catch (error) {
  console.error('❌ package.json error:', error.message);
  process.exit(1);
}

// Test 2: Check node_modules exists
if (fs.existsSync('./node_modules')) {
  console.log('✅ node_modules directory exists');
} else {
  console.error('❌ node_modules not found - run npm install');
  process.exit(1);
}

// Test 3: Check App.js exists
if (fs.existsSync('./App.js')) {
  console.log('✅ App.js exists');
  const appContent = fs.readFileSync('./App.js', 'utf8');
  if (appContent.includes('Railway.app POC')) {
    console.log('   - POC branding detected');
  }
} else {
  console.error('❌ App.js not found');
  process.exit(1);
}

// Test 4: Check Dockerfile exists
if (fs.existsSync('./Dockerfile')) {
  console.log('✅ Dockerfile exists');
} else {
  console.error('❌ Dockerfile not found');
  process.exit(1);
}

// Test 5: Check railway.json exists
if (fs.existsSync('./railway.json')) {
  console.log('✅ railway.json exists');
  try {
    const railwayConfig = JSON.parse(fs.readFileSync('./railway.json', 'utf8'));
    console.log(`   - Builder: ${railwayConfig.build.builder}`);
  } catch (error) {
    console.error('❌ railway.json is invalid');
    process.exit(1);
  }
} else {
  console.error('❌ railway.json not found');
  process.exit(1);
}

// Test 6: Check critical dependencies
try {
  const expo = require.resolve('expo');
  console.log('✅ Expo is installed');
} catch (error) {
  console.error('❌ Expo not installed');
  process.exit(1);
}

console.log('\n✨ All pre-deployment tests passed!');
console.log('📦 Ready for Railway deployment\n');
