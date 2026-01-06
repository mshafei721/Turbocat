# Post-Launch Monitoring Plan

This document outlines the metrics to track, success criteria, and monitoring procedures for Phase 4 Mobile Development after launch.

## Monitoring Overview

### Goals

1. **Ensure Stability** - Detect and respond to issues quickly
2. **Measure Adoption** - Track if users are adopting mobile development
3. **Optimize Performance** - Identify bottlenecks and improvements
4. **Improve User Experience** - Track satisfaction and pain points
5. **Manage Costs** - Ensure infrastructure costs align with projections

### Monitoring Stack

| Category | Tool | Purpose |
|----------|------|---------|
| **Crashes** | Sentry or Crashlytics | Detect app crashes immediately |
| **Analytics** | Firebase or Mixpanel | User behavior and engagement |
| **Performance** | Datadog or New Relic | App and server performance |
| **Infrastructure** | Railway Dashboard | Container status and costs |
| **User Feedback** | Surveys, reviews, support tickets | Qualitative insights |

---

## Key Metrics

### 1. Adoption Metrics

#### Mobile Task Creation Rate

**What to track:** Number of mobile tasks created per day/week

```
Daily metric = Count of tasks where platform='mobile'

Target:
- Week 1-2: 10-20% of all new tasks are mobile
- Week 3-4: 20-30% of all new tasks are mobile
- Month 2+: 30-50% of all new tasks are mobile
```

**Why it matters:**
- Shows if users are adopting mobile development
- Indicates product-market fit
- Lower than expected = need marketing/education

**Alert thresholds:**
- If < 5% mobile tasks for 1 week → investigate
- If drops > 50% from previous week → check for outages
- If > 80% mobile tasks → validate data quality

#### Cumulative Mobile Developers

**What to track:** Unique users who have created at least one mobile task

```
Metric = COUNT(DISTINCT user_id) WHERE platform='mobile'

Target:
- End of Week 1: 10% of active users
- End of Month 1: 30% of active users
- End of Month 3: 60% of active users
```

**Dashboard view:**
```
Mobile Adoption
- Week 1: 25 users tried mobile
- Week 2: 45 users tried mobile (+80%)
- Week 3: 62 users tried mobile (+38%)
- Week 4: 78 users tried mobile (+26%)
```

### 2. Quality Metrics

#### Container Provisioning Success Rate

**What to track:** Percentage of mobile tasks where container starts successfully

```
Metric = (Successful container starts) / (Total mobile tasks) × 100

Target:
- 99%+ success rate
- <1% fail to start
```

**How to measure:**
- Track in database: railwayContainers.status = 'running'
- Alert if < 95% for any hour
- Investigate pattern if trending down

**Common failure modes:**
- Image pull timeout
- Container resource exhaustion
- Railway service degradation
- Network issues

#### QR Code Generation Success Rate

**What to track:** Percentage of metro_url → QR code conversions

```
Metric = (QR codes generated) / (Metro URLs available) × 100

Target:
- 99%+ success rate
- <1% QR generation failures
```

**Alert:** If < 95% for any hour

### 3. Performance Metrics

#### Container Startup Time

**What to track:** Time from task creation to "Running" status

```
Metric = timestamp(status='running') - timestamp(created_at)

Target:
- Median: 60-90 seconds
- P95: <120 seconds
- P99: <180 seconds

Acceptable: <2 minutes for most users
```

**Dashboard visualization:**
```
Startup Time Distribution
0-30s:   ████░ 15%
30-60s:  ████████████░ 40%
60-90s:  █████████░ 30%
90-120s: ██░ 10%
>120s:   █░ 5%

Median: 75s
P95: 118s
P99: 165s
```

**Alert if:**
- Median > 120s for 1 hour
- P99 > 240s
- Trend increasing

#### Metro Bundler Health

**What to track:** Metro uptime and responsiveness

```
Metric = (Bundler responses < 500ms) / (Total requests) × 100

Target:
- 99%+ uptime
- Median response time: <200ms
- P95: <500ms
```

**Track separately:**
- Initial bundle time (app first load)
- Hot reload time (code changes)
- Error recovery time (Metro restart)

#### Hot Reload Latency

**What to track:** Time from code change to update on device

```
Metric = Time visible on Expo Go - Time submitted in Turbocat

Target:
- Median: 2-3 seconds
- P95: <5 seconds
```

**Formula:**
- Record timestamp when user sends change
- Record timestamp when file changes received by Metro
- Record timestamp when hot reload pushed to device
- Calculate latency

**Dashboard:**
```
Hot Reload Times (Last 7 days)
Median: 2.8s
P95:    4.2s
P99:    5.8s

Trend: Stable over 7 days
```

### 4. Reliability Metrics

#### App Crash Rate

**What to track:** Percentage of sessions that crash

```
Metric = (Sessions with crash) / (Total sessions) × 100

Target:
- Week 1-2: <5% (during early usage)
- Week 3+: <1%
- Stable: <0.1%
```

**By platform:**
```
iOS Crash Rate:    0.3%
Android Crash Rate: 0.4%
Average:           0.35%
```

**Alert:** If > 2% for any 1-hour period

#### Mean Time to Recovery (MTTR)

**What to track:** Time to fix app crashes

```
Metric = (Detection time) to (Fix deployed)

Target:
- Critical crashes: < 30 minutes
- High priority: < 2 hours
- Normal: < 1 day
```

**Process:**
1. Crash detected in Sentry (automated alert)
2. Team notified via Slack
3. Investigation begins
4. Fix deployed
5. Monitor crash rate drop

### 5. User Satisfaction Metrics

#### App Store Rating

**What to track:** Star rating in iOS App Store

```
Target:
- Week 1-2: 3.5+ stars
- Week 3+: 4.0+ stars
- Stable: 4.2+ stars

How many reviews:
- Week 1: 10+ reviews
- Week 4: 50+ reviews
- Month 3: 200+ reviews
```

**What affects rating:**
- Crashes (negative impact)
- Performance (slow = negative)
- Ease of use (confusing = negative)
- Feature completeness (missing = negative)

**Action if rating drops:**
1. Read negative reviews
2. Identify common complaint
3. Prioritize fix
4. Communicate timeline
5. Follow up after fix

#### Google Play Rating

**What to track:** Star rating in Google Play Store

```
Target:
- Launch: 3.5+ stars
- Month 1: 4.0+ stars
- Stable: 4.2+ stars
```

**Google Play specific:**
- More detailed review text
- Easier for developers to respond
- Respond to negative reviews within 24 hours

#### Net Promoter Score (NPS)

**What to track:** Would users recommend this feature?

```
Question: "How likely are you to recommend Turbocat mobile development?"
Scale: 0 (not at all) to 10 (very likely)

Calculation:
NPS = (Promoters 9-10%) - (Detractors 0-6%)

Target:
- Launch: 30+ NPS
- Month 1: 40+ NPS
- Month 3: 50+ NPS
```

**Survey cadence:**
- In-app survey after first mobile task
- Email survey weekly
- User interviews monthly

#### Support Ticket Sentiment

**What to track:** Sentiment of support tickets

```
Metric = (Positive tickets) / (Total tickets) × 100

Target:
- 80%+ positive/neutral sentiment
- <20% negative sentiment
```

**Categories:**
- Crash/bug report (negative sentiment)
- Feature request (neutral)
- How-to question (positive resolution)
- Praise (positive)

### 6. Cost Metrics

#### Infrastructure Cost per Task

**What to track:** Average Railway cost per mobile task

```
Metric = (Total Railway spend) / (Number of mobile tasks)

Target:
- Average: $0.50-1.00 per task
- Median: $0.30-0.50
```

**Calculation:**
```
Week 1:
- 50 mobile tasks created
- $25 Railway cost
- Cost per task: $0.50

Month 1:
- 300 mobile tasks
- $120 Railway cost
- Cost per task: $0.40
```

**Alert:** If cost per task > $2.00

#### Monthly Railway Spend

**What to track:** Total monthly container costs

```
Target:
- Week 1-2: $50-100
- Week 3-4: $100-200
- Month 2-3: $200-400

Formula:
Monthly spend = (avg concurrent containers) × (hours/day) × (20 days) × $0.50
```

**Cost breakdown:**
```
Active containers:      8
Idle containers:        2
Avg hours/day:          6
Cost per container/hr: $0.50

Monthly: 8 × 6 × 20 × $0.50 = $480
```

**Alert:** If projected monthly > $500

#### Resource Utilization

**What to track:** Container resource efficiency

```
Metric = (Actual usage) / (Allocated resources)

Memory utilization:
- Target: 60-80%
- Alert if: >90% (add more RAM needed)
- Alert if: <20% (waste)

CPU utilization:
- Target: 40-60%
- Alert if: >80% (need upgrade)
- Alert if: <10% (waste)
```

---

## Monitoring Dashboards

### Real-Time Status Dashboard

```
╔════════════════════════════════════════════════╗
║      Phase 4 Mobile Development Status        ║
╠════════════════════════════════════════════════╣
║ Active Containers: 12 / 50 limit               ║
║ Container Health: 99.8% ✓                      ║
║ Metro Uptime: 99.9% ✓                          ║
║ App Crash Rate: 0.3% ✓                         ║
║                                                ║
║ Recent Issues: None                            ║
║ Latest Alert: [2 hours ago] High startup time  ║
╚════════════════════════════════════════════════╝

Mobile Tasks (Last 24h):
- Created: 45
- Successful: 44 (97.8%)
- Failed: 1

QR Code Usage:
- Generated: 38
- Scanned: 35
- Success rate: 92.1%

App Crashes (Last 24h):
- Total crashes: 3
- Unique users affected: 2
- Most common: Memory leak in photo gallery
```

### Weekly Analytics Dashboard

```
Week of January 15-21, 2026

Adoption
- New mobile developers: 12
- Cumulative: 87 (23% of active users)
- Tasks created: 156
- % of all tasks: 28%

Performance
- Avg container startup: 82s
- Avg hot reload time: 2.9s
- Metro uptime: 99.8%
- Crash rate: 0.42%

User Satisfaction
- Avg rating: 4.1 stars
- NPS: 42
- Support tickets: 23
- Resolution rate: 87%

Infrastructure
- Containers created: 156
- Peak concurrent: 15
- Monthly projected spend: $320
```

### Monthly Retrospective Report

```
Month 1: January 2026

Achievements
✓ 87 users adopted mobile development
✓ 500+ mobile tasks created
✓ 98%+ platform stability
✓ 4.1 star rating achieved

Challenges
⚠ Container startup slower than expected (avg 82s vs target 60s)
⚠ Memory leak in photo gallery (fixed in v1.0.1)
⚠ 15 users unable to scan QR code (network issues)

Metrics Summary
- Adoption rate: 23% of users trying mobile
- Quality: 0.42% crash rate (target <1%)
- Performance: Metro responding in 200ms median
- Costs: $320 monthly (within budget)

Next Month Focus
- Optimize container startup time
- Improve network resilience
- Add onboarding tutorial for QR scanning
```

---

## Alert Configuration

### Critical Alerts (Immediate Action)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Crash rate | > 5% | Page on-call engineer |
| Container success rate | < 90% | Check Railway status, rollback if needed |
| Metro uptime | < 95% | Restart Metro, investigate logs |
| API response time | > 5s | Check database, add resources |
| Service down | Any | Activate incident response |

### High Priority Alerts (Within 1 hour)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Crash rate | 2-5% | Investigate, plan hotfix |
| QR generation failures | > 10% | Check image generation service |
| Startup time | > 2 minutes | Profile, optimize |
| 1-star reviews | 3+ in 1 hour | Investigate feedback |

### Medium Priority Alerts (Within 4 hours)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Container cost anomaly | 50%+ increase | Review for runaway costs |
| Feature adoption | Declining | Check for bugs or UX issues |
| Support sentiment | < 70% positive | Identify pain points |

### Low Priority Alerts (Daily review)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Utilization trends | Declining | Plan capacity changes |
| Rating | < 4.0 stars | Plan improvements |
| Documentation gaps | Issues reported | Update docs |

---

## Incident Response

### Incident Classification

```
CRITICAL (P1)
- App completely broken or unusable
- Data loss
- Security vulnerability
- >10% of users affected

HIGH (P2)
- Core feature broken
- Performance severely degraded
- 1-10% of users affected

MEDIUM (P3)
- Feature partially broken
- Poor performance
- <1% of users affected

LOW (P4)
- Minor issues
- Cosmetic problems
- Can wait until next release
```

### Incident Response Process

#### P1 (Critical): 15-minute initial response

1. **Alert** (Automated or manual)
   - Slack notification to team
   - Page on-call engineer
   - Create incident ticket

2. **Triage** (5 minutes)
   - Confirm issue is real
   - Assess scope of impact
   - Gather logs/telemetry

3. **Response** (10 minutes)
   - Decide: fix forward, revert, scale resources
   - Start working on fix/rollback
   - Update status in Slack

4. **Resolution** (30-60 minutes)
   - Deploy fix or rollback
   - Verify in staging first
   - Monitor metrics after deploy

5. **Communication**
   - Update users via status page
   - Post-mortem within 24 hours

#### P2 (High): 1-hour initial response

- Assign to on-call engineer
- Investigate root cause
- Plan fix
- Deploy fix or workaround
- Monitor

#### P3/P4: Standard process

- Add to backlog
- Prioritize in next sprint
- Include in regular release

---

## Review Cadence

### Hourly (Automated)

- Crash rate threshold check
- Container success rate check
- API response time check
- Uptime monitoring

### Daily (Manual - 10 minutes)

```
9 AM Daily Standup:
- Any crashes overnight?
- Any failed deployments?
- Any spikes in errors?
- Any user complaints?
```

### Weekly (Dedicated meeting - 30 minutes)

**Participants:** Developers, DevOps, Product Manager

```
Agenda:
1. Adoption metrics review (5 min)
2. Performance metrics review (5 min)
3. Issues/bugs found (10 min)
4. User feedback summary (5 min)
5. Next week priorities (5 min)
```

### Monthly (Retrospective - 1 hour)

**Participants:** Full team + stakeholders

```
Agenda:
1. Month overview and achievements (10 min)
2. Metrics analysis (15 min)
   - Adoption
   - Quality
   - Performance
   - Costs
3. Challenges and learnings (15 min)
4. User feedback themes (10 min)
5. Next month priorities (10 min)
```

### Quarterly (Strategic review - 2 hours)

**Participants:** Leadership + team leads

```
Agenda:
1. 90-day performance review (30 min)
2. Market feedback analysis (30 min)
3. Roadmap planning (30 min)
4. Resource planning (30 min)
```

---

## Success Criteria (First Month)

### Phase 4 Launch is Successful if:

**Adoption:**
- [ ] 20%+ of active users create mobile task
- [ ] 100+ cumulative mobile developers
- [ ] 300+ mobile tasks created

**Quality:**
- [ ] Container success rate > 98%
- [ ] App crash rate < 1%
- [ ] 99%+ uptime

**Performance:**
- [ ] Container startup < 90s median
- [ ] Hot reload < 5s P95
- [ ] Metro responses < 500ms

**User Satisfaction:**
- [ ] 4.0+ star rating
- [ ] 40+ NPS score
- [ ] <20% negative support sentiment

**Costs:**
- [ ] Within $300-400 monthly budget
- [ ] Cost per task < $1.00
- [ ] No runaway costs

**If not met:**
- Investigate root cause
- Plan corrective actions
- Target remediation in v1.1

---

## Tools & Resources

### Monitoring Tools

- **Crashes:** Sentry, Firebase Crashlytics
- **Analytics:** Firebase Analytics, Mixpanel, Amplitude
- **Performance:** Datadog, New Relic, Grafana
- **Infrastructure:** Railway Dashboard, Prometheus
- **Reviews:** App Store Connect, Google Play Console

### Team Communication

- **Alerts:** Slack, PagerDuty
- **Dashboards:** Grafana, Datadog, custom dashboards
- **Documentation:** Confluence, Notion
- **Incident tracking:** Linear, Jira

### Query Examples

#### PostgreSQL - Container Success Rate

```sql
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total,
  COUNT(CASE WHEN status='running' THEN 1 END) as successful,
  ROUND(100.0 * COUNT(CASE WHEN status='running' THEN 1 END) / COUNT(*), 2) as success_rate
FROM railway_containers
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

#### PostgreSQL - Mobile Task Creation Rate

```sql
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(CASE WHEN platform='mobile' THEN 1 END) as mobile_tasks,
  COUNT(*) as total_tasks,
  ROUND(100.0 * COUNT(CASE WHEN platform='mobile' THEN 1 END) / COUNT(*), 2) as pct_mobile
FROM tasks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
```

---

## Escalation Path

### If Metrics Deteriorate

1. **Investigate** - Check logs, query metrics
2. **Triage** - Determine root cause
3. **Mitigate** - Apply immediate fix or workaround
4. **Fix** - Deploy proper solution
5. **Communicate** - Update users and stakeholders
6. **Prevent** - Add monitoring/testing to prevent recurrence

### Escalation Tree

```
Engineer → Lead → Manager → VP → Exec
  ↓         ↓       ↓       ↓      ↓
  1h       2h      4h      8h    24h
```

---

## Documentation

- [Cost Monitoring Guide](./05-cost-monitoring.md)
- [Troubleshooting Guide](./04-troubleshooting.md)
- [Deployment Checklist](./06-deployment-checklist.md)

---

**Last Updated:** 2026-01-06
**Monitoring Plan Version:** 1.0
**Valid For:** Phase 4 Launch and beyond
