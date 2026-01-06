# Cost Monitoring Guide

This guide explains how Railway containers are charged, how to monitor costs, and how to optimize your spending.

## Understanding Railway Costs

### What You're Paying For

Railway charges for:
- **Container runtime** - Time your container is running
- **Storage** - Space used by your app and dependencies
- **Bandwidth** - Data sent from container to your phone

You do NOT pay for:
- **Idle containers** - Stopped containers don't charge (after 30 minutes of inactivity)
- **Build time** - Docker image building
- **QR code generation** - Scanning cost is free

### Cost Formula

```
Monthly Cost = (Container Hours × $0.50) + (Storage GB × $0.01)

Example:
- 10 concurrent projects × 8 hours/day × 20 working days = 1,600 hours/month
- 1,600 hours × $0.50 = $800/month
- Plus minimal storage costs

BUT with auto-cleanup:
- Containers stop after 30 min of inactivity
- Typical usage: 8 hours/day active, rest is stopped
- Realistic cost: $50-200/month
```

## For Users: Monitoring Costs

As a user, you don't directly control costs. However:

### How to Keep Costs Down

1. **Don't leave projects idle**
   - Containers auto-stop after 30 minutes
   - Leaving browser window open doesn't cost more
   - Just close Turbocat when done

2. **Close Expo Go when done**
   - Closing Expo Go doesn't stop container
   - Send a message in Turbocat to fully stop

3. **Consolidate projects**
   - One large project costs less than many small ones
   - Combine related features in one app

4. **Work in focused sessions**
   - Rather than 8 separate 1-hour sessions
   - Do 1 focused 8-hour session
   - Containers run continuously vs. 8 restarts

### Monitoring Your Usage

Ask Turbocat about costs:
```
"How much has my account spent on mobile development this month?"
```

Turbocat shows:
- Total spend this month
- Number of container hours
- Average cost per project
- Projections for month

## For Administrators: Cost Management

This section is for system administrators managing a Turbocat deployment.

### Cost Monitoring Dashboard

The admin panel shows:

| Metric | What It Means |
|--------|---------------|
| Active Containers | Containers running right now |
| Monthly Cost | Total Railway spending |
| Per-Container Cost | Average cost per user |
| Cost Per Hour | Hourly burn rate |
| Projected Total | Estimate for full month |

### Configuring Cost Controls

Set these environment variables:

```bash
# Maximum concurrent containers (hard limit)
RAILWAY_MAX_CONTAINERS=50

# Stop containers after idle time
RAILWAY_IDLE_TIMEOUT_MINUTES=30

# Alert when spending reaches this
RAILWAY_COST_ALERT_THRESHOLD=200

# Hard cap - stop all containers
RAILWAY_MAX_MONTHLY_SPEND=500
```

### Budget Alerts

Turbocat can alert you when spending reaches thresholds:

- **50% of budget** - Yellow warning
- **75% of budget** - Orange warning
- **100% of budget** - Red alert, auto-stop new containers

Configure alerts:

```bash
# Alert at these percentages
RAILWAY_ALERT_THRESHOLDS=50,75,100

# Send alerts to
RAILWAY_ALERT_EMAIL=ops@company.com
RAILWAY_SLACK_WEBHOOK=https://hooks.slack.com/...
```

### Container Lifecycle Costs

#### Scenario 1: Always-On User

```
User works 8 hours every day
- 8 containers running × 30 hours/month = 240 hours
- Cost: 240 × $0.50 = $120/month
```

#### Scenario 2: Casual Developer

```
User works 2 hours per day on average
- 2 containers running × 40 hours/month = 80 hours
- Cost: 80 × $0.50 = $40/month
```

#### Scenario 3: Full Team (20 users)

```
Average 10 active containers, 8 hours/day
- 10 containers × 160 hours/month = 1,600 hours
- Cost: 1,600 × $0.50 = $800/month
```

### Cost Optimization Strategies

#### Strategy 1: Aggressive Idle Timeout

```bash
RAILWAY_IDLE_TIMEOUT_MINUTES=15  # vs. default 30

Savings:
- Reduces idle container costs by ~50%
- Users may experience slow start times
- Trade-off: speed vs. cost
```

#### Strategy 2: Container Limits

```bash
RAILWAY_MAX_CONTAINERS=20  # Hard limit

If team wants 30 containers:
- Oldest unused containers stop
- Users notified to clean up
- Prevents accidental runaway costs
```

#### Strategy 3: Off-Peak Scheduling

```bash
# Auto-stop all containers after work hours
RAILWAY_AUTO_STOP_TIME=18:00  # Stop at 6 PM
RAILWAY_AUTO_START_TIME=09:00  # Start at 9 AM

Savings:
- 10 hours/day not running
- ~30% cost reduction
- Users can't develop after hours
```

#### Strategy 4: Resource Limits

```bash
# Default container resources
RAILWAY_CONTAINER_MEMORY=2048MB
RAILWAY_CONTAINER_CPU=1000m

# Reduce for lower spec
RAILWAY_CONTAINER_MEMORY=1024MB  # Save memory
RAILWAY_CONTAINER_CPU=500m        # Reduce CPU

Trade-off:
- Slower builds
- Metro bundler might be slower
- Cheaper
```

### Monitoring and Reporting

#### Daily Cost Check

```bash
#!/bin/bash
# Check daily spend

curl -H "Authorization: Bearer $RAILWAY_API_TOKEN" \
  https://api.railway.app/graphql \
  -d '{"query": "{ billing { spent } }"}'
```

#### Weekly Cost Report

Create automated reports showing:
- Active containers count
- Total hours run
- Average cost per container
- Projected monthly total
- Anomalies (unusually high spend)

#### Monthly Cost Review

Review with the team:
1. **Actual vs. Budget** - How close to limits?
2. **Per-User Costs** - Who's using most resources?
3. **Usage Patterns** - When is usage highest?
4. **Optimizations** - Did changes help?

### Cost Anomalies

Alert when:
- Single container runs >24 hours continuously
- Spend increases 50%+ unexpectedly
- Unusually large number of containers
- One user accounts for >50% of spending

### Scaling Costs

As team grows:

| Team Size | Estimated Monthly Cost | Per-User Cost |
|-----------|------------------------|---------------|
| 1 user | $50 | $50 |
| 5 users | $200 | $40 |
| 10 users | $350 | $35 |
| 20 users | $600 | $30 |
| 50 users | $1,200 | $24 |

Cost per user decreases with scale because:
- Not everyone is active at same time
- Shared infrastructure costs less
- Cleanup automation improves

## Cost Optimization Checklist

For Turbocat Administrators:

- [ ] Set `RAILWAY_IDLE_TIMEOUT_MINUTES` to 30 (optimal)
- [ ] Set `RAILWAY_MAX_CONTAINERS` based on team size
- [ ] Configure cost alerts at 50%, 75%, 100%
- [ ] Set up Slack notifications for alerts
- [ ] Review weekly cost reports
- [ ] Document cost vs. budget in retrospectives
- [ ] Monitor for anomalies
- [ ] Evaluate per-user costs quarterly
- [ ] Plan for scaling with projections
- [ ] Test auto-stop scheduling in staging first

## Billing Best Practices

### For Users

1. **Work in focused sessions**
   - Rather than constant small work
   - Reduces container restarts

2. **Close apps when done**
   - Explicitly stop containers
   - Don't rely solely on auto-stop

3. **Consolidate related work**
   - One monorepo vs. multiple projects
   - Fewer containers = lower cost

4. **Monitor your projects**
   - Ask about monthly usage
   - Be aware of cost impact

### For Administrators

1. **Transparent Pricing**
   - Users should understand costs
   - Share cost reports regularly
   - Explain trade-offs

2. **Enforce Limits**
   - Set container limits
   - Stop runaway costs early
   - Alert on anomalies

3. **Optimize Continuously**
   - Review costs monthly
   - Test optimizations in staging
   - Document what works

4. **Plan for Growth**
   - Project costs as team grows
   - Budget accordingly
   - Communicate pricing to new users

## Cost Estimation Tool

Quick cost estimates:

```
For X active containers running Y hours per day:
Monthly Cost ≈ X × Y × 20 × $0.50

Examples:
- 1 container, 8 hr/day = 1 × 8 × 20 × $0.50 = $80/month
- 5 containers, 4 hr/day = 5 × 4 × 20 × $0.50 = $200/month
- 10 containers, 8 hr/day = 10 × 8 × 20 × $0.50 = $800/month
```

## Frequently Asked Questions

### How much does a single mobile app cost?

**Typical usage:** $5-15/month
- 1 hour/day development = $50/month
- 20 min/day development = $15/month
- Very light testing = $5/month

### Can I get discounts for team usage?

Contact sales@turbocat.app for enterprise pricing.

### Do I pay if I don't use the platform?

No, you only pay for:
- Running containers
- Storage used
- Bandwidth consumed

No subscription fee or monthly minimum.

### What if I exceed my budget?

1. **Alert at 75%** - Get notified early
2. **Container limit** - New containers blocked
3. **Manual intervention** - Admin can pause oldest projects
4. **Payment option** - Increase budget or clean up projects

### Can I reduce costs?

Yes! Best practices:
- Set aggressive idle timeout (15 min)
- Consolidate projects
- Work in focused sessions
- Monitor and alert on anomalies

### Is there a free tier?

Turbocat's mobile development requires Railway containers, so it's not free. However:
- Low usage (few hours/month) is cheap ($5-10)
- Can evaluate feasibility affordably
- Costs scale with usage

## Support

**Questions about costs?**
- Check your Railway dashboard: [railway.app](https://railway.app)
- Ask in Turbocat: "What are my costs this month?"
- Contact support: support@turbocat.app
- Email: billing@turbocat.app

---

**Last Updated:** 2026-01-06
**Cost Structure Valid:** 2026
