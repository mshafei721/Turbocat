#!/usr/bin/env node
/**
 * Railway Uptime Monitor
 * Tracks deployment availability during 48-hour POC period
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'uptime-log.json');

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify({
    startTime: new Date().toISOString(),
    checks: [],
    stats: {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptime: 0
    }
  }, null, 2));
}

function checkEndpoint(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = protocol.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: res.statusCode === 200 || res.statusCode === 302,
        statusCode: res.statusCode,
        responseTime: responseTime
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        responseTime: 10000,
        error: 'Timeout'
      });
    });
  });
}

async function performCheck(url) {
  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));

  const result = await checkEndpoint(url);

  const check = {
    timestamp: new Date().toISOString(),
    url: url,
    success: result.success,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    error: result.error || null
  };

  log.checks.push(check);
  log.stats.totalChecks++;

  if (result.success) {
    log.stats.successfulChecks++;
  } else {
    log.stats.failedChecks++;
  }

  log.stats.uptime = ((log.stats.successfulChecks / log.stats.totalChecks) * 100).toFixed(2);
  log.lastUpdate = new Date().toISOString();

  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} ${new Date().toLocaleString()} | ${result.statusCode} | ${result.responseTime}ms`);
  console.log(`   Uptime: ${log.stats.uptime}% (${log.stats.successfulChecks}/${log.stats.totalChecks})`);

  if (!result.success && result.error) {
    console.log(`   Error: ${result.error}`);
  }

  return check;
}

function generateReport() {
  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));

  console.log('\n📈 Uptime Report\n');
  console.log('=' .repeat(60));
  console.log(`Monitoring Start: ${new Date(log.startTime).toLocaleString()}`);
  console.log(`Last Check: ${new Date(log.lastUpdate).toLocaleString()}`);
  console.log(`Total Checks: ${log.stats.totalChecks}`);
  console.log(`Successful: ${log.stats.successfulChecks}`);
  console.log(`Failed: ${log.stats.failedChecks}`);
  console.log(`Uptime: ${log.stats.uptime}%`);
  console.log('=' .repeat(60));

  if (log.checks.length > 0) {
    const recentChecks = log.checks.slice(-10);
    console.log('\nRecent Checks:');
    recentChecks.forEach(check => {
      const icon = check.success ? '✅' : '❌';
      console.log(`  ${icon} ${new Date(check.timestamp).toLocaleString()} | ${check.statusCode} | ${check.responseTime}ms`);
    });

    // Calculate average response time
    const successfulChecks = log.checks.filter(c => c.success);
    if (successfulChecks.length > 0) {
      const avgResponseTime = successfulChecks.reduce((sum, c) => sum + c.responseTime, 0) / successfulChecks.length;
      console.log(`\nAverage Response Time: ${avgResponseTime.toFixed(2)}ms`);
    }
  }

  return log;
}

// CLI handling
const command = process.argv[2];
const url = process.argv[3];

switch (command) {
  case 'check':
    if (!url) {
      console.error('❌ Please provide URL: node uptime-monitor.js check <url>');
      process.exit(1);
    }
    performCheck(url);
    break;

  case 'watch':
    if (!url) {
      console.error('❌ Please provide URL: node uptime-monitor.js watch <url>');
      process.exit(1);
    }
    console.log(`🔄 Starting uptime monitoring for: ${url}`);
    console.log('Checking every 2 minutes...\n');
    performCheck(url);
    setInterval(() => performCheck(url), 2 * 60 * 1000);
    break;

  case 'report':
    generateReport();
    break;

  default:
    console.log('Usage:');
    console.log('  node uptime-monitor.js check <url>  - Perform single check');
    console.log('  node uptime-monitor.js watch <url>  - Continuous monitoring');
    console.log('  node uptime-monitor.js report       - Generate uptime report');
}
