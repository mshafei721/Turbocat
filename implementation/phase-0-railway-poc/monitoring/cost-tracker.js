#!/usr/bin/env node
/**
 * Railway Cost Tracking Script
 * Monitors deployment costs during 48-hour POC period
 * Note: Manual cost tracking - Railway API integration for automated tracking
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'cost-log.json');
const HOURLY_RATE = 0.007; // Estimated Railway starter plan hourly rate

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify({
    startTime: new Date().toISOString(),
    entries: [],
    totalCost: 0
  }, null, 2));
}

function logEntry(manualStatus = 'running') {
  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  const now = new Date();
  const startTime = new Date(log.startTime);
  const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
  const estimatedCost = hoursElapsed * HOURLY_RATE;

  const entry = {
    timestamp: now.toISOString(),
    hoursElapsed: hoursElapsed.toFixed(2),
    estimatedCost: estimatedCost.toFixed(4),
    status: manualStatus,
    deploymentActive: true
  };

  log.entries.push(entry);
  log.totalCost = estimatedCost.toFixed(4);
  log.lastUpdate = now.toISOString();

  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

  console.log(`📊 Cost Tracking Update`);
  console.log(`   Time: ${now.toLocaleString()}`);
  console.log(`   Hours Elapsed: ${entry.hoursElapsed}h`);
  console.log(`   Estimated Cost: $${entry.estimatedCost}`);
  console.log(`   Status: ${entry.status}`);
  console.log(`   Budget Remaining: $${(5 - estimatedCost).toFixed(4)}`);
  console.log(`   Progress: ${((hoursElapsed / 48) * 100).toFixed(1)}% of 48h monitoring\n`);

  return entry;
}

function generateReport() {
  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));

  console.log('\n📈 POC Cost Report\n');
  console.log('=' .repeat(50));
  console.log(`Start Time: ${new Date(log.startTime).toLocaleString()}`);
  console.log(`Last Update: ${new Date(log.lastUpdate).toLocaleString()}`);
  console.log(`Total Entries: ${log.entries.length}`);
  console.log(`Total Estimated Cost: $${log.totalCost}`);
  console.log(`Budget Used: ${((log.totalCost / 5) * 100).toFixed(2)}%`);
  console.log('=' .repeat(50));

  if (log.entries.length > 0) {
    console.log('\nRecent Entries:');
    log.entries.slice(-5).forEach(entry => {
      console.log(`  ${new Date(entry.timestamp).toLocaleString()} | $${entry.estimatedCost} | ${entry.status}`);
    });
  }

  return log;
}

function resetTracking() {
  fs.writeFileSync(LOG_FILE, JSON.stringify({
    startTime: new Date().toISOString(),
    entries: [],
    totalCost: 0
  }, null, 2));
  console.log('✅ Cost tracking reset. Starting fresh monitoring.');
}

// CLI handling
const command = process.argv[2];

switch (command) {
  case 'log':
    logEntry();
    break;
  case 'report':
    generateReport();
    break;
  case 'reset':
    resetTracking();
    break;
  case 'watch':
    console.log('🔄 Starting cost monitoring (updates every 5 minutes)...\n');
    console.log('💡 TIP: Check Railway dashboard for actual costs');
    console.log('   https://railway.app/account/billing\n');
    logEntry();
    setInterval(logEntry, 5 * 60 * 1000);
    break;
  default:
    console.log('Railway Cost Tracker - POC Monitoring Tool\n');
    console.log('Usage:');
    console.log('  node cost-tracker.js log     - Log current status');
    console.log('  node cost-tracker.js report  - Generate cost report');
    console.log('  node cost-tracker.js watch   - Continuous monitoring (5min intervals)');
    console.log('  node cost-tracker.js reset   - Reset tracking (start fresh)\n');
    console.log('Note: Estimates based on $0.007/hour. Check Railway dashboard for actual costs.');
}
