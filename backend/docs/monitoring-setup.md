# Monitoring and Logging Setup Guide

This document provides guidance for setting up monitoring, error tracking, and logging for the Turbocat backend in production environments.

## Table of Contents

1. [Error Tracking with Sentry](#error-tracking-with-sentry)
2. [Log Aggregation](#log-aggregation)
3. [Performance Monitoring](#performance-monitoring)
4. [Alerting Rules](#alerting-rules)
5. [Health Monitoring](#health-monitoring)
6. [Cost-Effective Options](#cost-effective-options)

---

## Error Tracking with Sentry

[Sentry](https://sentry.io) provides real-time error tracking and helps you monitor and fix crashes in real-time.

### Setup Instructions

1. **Create a Sentry Account**
   - Sign up at [sentry.io](https://sentry.io) (free tier: 5,000 errors/month)
   - Create a new project for Node.js/Express

2. **Install Sentry SDK**
   ```bash
   npm install @sentry/node @sentry/profiling-node
   ```

3. **Configure Sentry in Your Application**

   Create `src/lib/sentry.ts`:
   ```typescript
   import * as Sentry from '@sentry/node';
   import { nodeProfilingIntegration } from '@sentry/profiling-node';

   export function initSentry() {
     if (!process.env.SENTRY_DSN) {
       console.warn('SENTRY_DSN not configured - Sentry disabled');
       return;
     }

     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV || 'development',
       release: process.env.APP_VERSION || '1.0.0',
       integrations: [
         nodeProfilingIntegration(),
       ],
       tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
       profilesSampleRate: 0.1,
     });
   }

   export { Sentry };
   ```

4. **Add to Application Entry Point**

   In `src/server.ts`:
   ```typescript
   import { initSentry, Sentry } from './lib/sentry';

   // Initialize Sentry before other imports
   initSentry();

   // ... rest of your server setup

   // Add Sentry error handler after routes
   app.use(Sentry.Handlers.errorHandler());
   ```

5. **Environment Variable**
   Add to `.env.production`:
   ```
   SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
   ```

### Best Practices

- Set `tracesSampleRate` to a lower value in production (0.1-0.2) to reduce costs
- Use `beforeSend` to filter sensitive data
- Add user context when available:
  ```typescript
  Sentry.setUser({ id: userId, email: userEmail });
  ```

---

## Log Aggregation

The application uses Winston for structured logging. Here are options for log aggregation:

### Option 1: Logtail (Recommended for Cost)

[Logtail](https://logtail.com) offers a generous free tier (1GB/month).

1. **Install Logtail Transport**
   ```bash
   npm install @logtail/node @logtail/winston
   ```

2. **Configure Winston with Logtail**
   ```typescript
   import { Logtail } from '@logtail/node';
   import { LogtailTransport } from '@logtail/winston';

   const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

   const logger = winston.createLogger({
     transports: [
       new LogtailTransport(logtail),
       // ... other transports
     ],
   });
   ```

### Option 2: Railway Logs (If Using Railway)

Railway provides built-in log aggregation for deployed services.

- Logs are automatically collected from stdout/stderr
- Access via Railway dashboard or CLI: `railway logs`
- Retention: 7 days on free tier

### Option 3: Self-Hosted with Loki + Grafana

For more control, use the Grafana stack:

```yaml
# docker-compose.yml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
```

### Log Format

Production logs should be JSON formatted for easier parsing:

```typescript
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});
```

Example log output:
```json
{
  "level": "info",
  "message": "Request completed",
  "timestamp": "2026-01-07T10:30:00.000Z",
  "requestId": "abc123",
  "method": "POST",
  "path": "/api/v1/agents",
  "statusCode": 201,
  "duration": 145
}
```

---

## Performance Monitoring

### Option 1: Sentry Performance (Included with Sentry)

If you're already using Sentry for error tracking, performance monitoring is included:

```typescript
// Transactions are automatically created for HTTP requests
// Manual transactions for background jobs:
const transaction = Sentry.startTransaction({
  op: 'task',
  name: 'Process Agent Execution',
});

try {
  await processExecution();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

### Option 2: Express Prometheus Metrics

For self-hosted monitoring with Prometheus + Grafana:

1. **Install Dependencies**
   ```bash
   npm install prom-client express-prometheus-middleware
   ```

2. **Configure Metrics Endpoint**
   ```typescript
   import promBundle from 'express-prom-bundle';

   const metricsMiddleware = promBundle({
     includeMethod: true,
     includePath: true,
     includeStatusCode: true,
     includeUp: true,
     promClient: {
       collectDefaultMetrics: {}
     }
   });

   app.use(metricsMiddleware);
   ```

3. **Access Metrics**
   Metrics available at `/metrics` endpoint in Prometheus format.

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_request_duration_seconds` | Request latency | p95 > 500ms |
| `http_requests_total` | Request count | Sudden drop > 50% |
| `process_cpu_user_seconds_total` | CPU usage | > 80% for 5min |
| `nodejs_heap_size_used_bytes` | Memory usage | > 80% of limit |
| `prisma_query_duration_seconds` | Database query time | p95 > 100ms |

---

## Alerting Rules

### Recommended Alert Configuration

Configure alerts in your monitoring platform for these conditions:

#### Critical Alerts (Immediate Response)

1. **Service Down**
   - Condition: Health check fails for 3 consecutive checks
   - Action: Page on-call engineer

2. **High Error Rate**
   - Condition: 5xx error rate > 5% for 5 minutes
   - Action: Page on-call engineer

3. **Database Connection Failure**
   - Condition: Database health check fails
   - Action: Page on-call engineer

#### Warning Alerts (Business Hours Response)

1. **High Latency**
   - Condition: p95 latency > 500ms for 10 minutes
   - Action: Notify via Slack/email

2. **Memory Usage High**
   - Condition: Memory > 80% for 15 minutes
   - Action: Notify via Slack/email

3. **Increased Error Rate**
   - Condition: 4xx error rate > 10% for 10 minutes
   - Action: Notify via Slack/email

### Uptime Monitoring Services

- [UptimeRobot](https://uptimerobot.com) - Free tier: 50 monitors
- [Better Uptime](https://betterstack.com/better-uptime) - Free tier available
- [Cronitor](https://cronitor.io) - Free tier: 5 monitors

Configure to ping `/health` endpoint every 1-5 minutes.

---

## Health Monitoring

The application provides three health endpoints:

### `/health` - Detailed Health Check
```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T10:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "services": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 }
  }
}
```

### `/health/live` - Liveness Probe
Simple check that the process is running. Returns 200 if alive.

### `/health/ready` - Readiness Probe
Checks if the service is ready to accept requests (database connected, etc.).

### Kubernetes/Container Health Checks

If deploying to Kubernetes or container orchestrators:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Cost-Effective Options

### Free Tier Summary

| Service | Free Tier | Best For |
|---------|-----------|----------|
| Sentry | 5,000 errors/month | Error tracking |
| Logtail | 1GB logs/month | Log aggregation |
| UptimeRobot | 50 monitors | Uptime monitoring |
| Railway Logs | 7 day retention | Simple deployments |
| Grafana Cloud | 10k metrics series | Self-managed monitoring |

### Total Cost for Small Projects

For a small project with moderate traffic, you can achieve comprehensive monitoring for **$0/month** using:

1. **Sentry** - Error tracking (free tier)
2. **Logtail** - Log aggregation (free tier)
3. **UptimeRobot** - Uptime monitoring (free tier)
4. **Railway/Render logs** - Platform logs (included)

### Scaling Considerations

As your application grows:

| Traffic Level | Recommended Setup | Estimated Cost |
|---------------|-------------------|----------------|
| < 10k req/day | Free tiers | $0/month |
| 10k-100k req/day | Sentry Team + Logtail | ~$30/month |
| > 100k req/day | Datadog or self-hosted | $100+/month |

---

## Quick Start Checklist

- [ ] Create Sentry account and get DSN
- [ ] Add SENTRY_DSN to production environment
- [ ] Configure log aggregation (Logtail or platform logs)
- [ ] Set up uptime monitoring for `/health` endpoint
- [ ] Configure alert notifications (email/Slack)
- [ ] Test alerts by temporarily breaking health check
- [ ] Document on-call procedures

---

## Support

For questions about monitoring setup, refer to:
- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Express Prometheus Middleware](https://github.com/jochen-schweizer/express-prom-bundle)
