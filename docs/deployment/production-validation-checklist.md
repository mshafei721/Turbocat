# Production Validation Checklist - Epic 4: Publishing Flow

## Overview

This checklist ensures the Publishing Flow (Epic 4) is ready for production deployment with all quality gates passed.

**Target:** <5% failure rate for app publishing
**Success Criteria:** Complete end-to-end publishing test with real Apple/Expo accounts

---

## Pre-Production Checklist

### 1. Environment Configuration ✅

- [ ] Production database configured (Supabase)
- [ ] Redis instance configured (Upstash/Railway)
- [ ] Environment variables set:
  - [ ] `ENCRYPTION_KEY` (32 bytes, secure generation)
  - [ ] `DATABASE_URL` (pooled connection)
  - [ ] `DIRECT_URL` (direct connection for migrations)
  - [ ] `REDIS_URL` (production Redis instance)
  - [ ] `FRONTEND_URL` (production URL)
  - [ ] `BACKEND_URL` (production API URL)
- [ ] Secrets manager configured (not .env in prod)
- [ ] SSL/TLS certificates valid

### 2. Database Migrations ✅

- [ ] Run migrations on production database:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```
- [ ] Verify Publishing model exists
- [ ] Verify indexes created
- [ ] Check foreign key constraints
- [ ] Test rollback procedure

### 3. Security Validation ✅

- [ ] No secrets in source code or logs
- [ ] Encryption key properly secured
- [ ] Rate limiting configured (100 req/15min)
- [ ] CORS properly configured
- [ ] OAuth login feature flag set (`ENABLE_OAUTH_LOGIN`)
- [ ] API authentication working
- [ ] User ownership checks in place
- [ ] No credential leakage in error messages
- [ ] Run security audit: `npm audit`
- [ ] Check for known vulnerabilities

### 4. Performance Benchmarks ✅

- [ ] Dashboard loads <1s
- [ ] Project creation <500ms
- [ ] Publishing initiation <2s
- [ ] Status polling <100ms per request
- [ ] Build completion average <30min
- [ ] UI renders at 60fps
- [ ] Bundle size increase <10KB for publishing features
- [ ] Memory usage stable (no leaks)
- [ ] API response times meet SLA

### 5. Error Handling Validation ✅

- [ ] All error paths tested
- [ ] User-friendly error messages
- [ ] Retry mechanisms work
- [ ] Graceful degradation (Redis unavailable)
- [ ] Error logging comprehensive
- [ ] No unhandled promise rejections
- [ ] No uncaught exceptions
- [ ] Sentry integration (if using)

### 6. Monitoring & Observability ✅

- [ ] Structured logging in place
- [ ] Log levels appropriate (info in prod)
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Build queue metrics tracked
- [ ] Success/failure rate dashboards
- [ ] Alerting configured for:
  - [ ] >10% build failure rate
  - [ ] Queue depth >20
  - [ ] API error rate >1%
  - [ ] Database connection issues

---

## Production Test Scenarios

### Scenario 1: Happy Path Publishing ✅ REQUIRED

**Goal:** Complete end-to-end app publishing with real credentials

**Prerequisites:**
- Real Apple Developer account ($99/year)
- App Store Connect API key created
- Real Expo account with access token
- Test project with valid code

**Steps:**
1. Create new project in Turbocat
2. Open PublishingModal
3. Complete prerequisites checklist
4. Enter real Apple credentials:
   - Team ID
   - Key ID
   - Issuer ID
   - Private Key (.p8)
5. Enter real Expo access token
6. Fill app details:
   - Name: "Turbocat Test App [timestamp]"
   - Description: Valid description
   - Category: Developer Tools
   - Age Rating: 4+
   - Support URL: https://turbocat.dev/support
   - Icon URL: Valid 1024x1024 PNG
7. Submit and monitor build progress
8. Wait for completion (5-30 minutes)
9. Verify success state displayed
10. Check App Store Connect for app submission

**Expected Results:**
- ✅ Build starts successfully
- ✅ Status updates in real-time
- ✅ Build completes within 30 minutes
- ✅ App appears in App Store Connect
- ✅ All data encrypted in database
- ✅ Logs show no errors
- ✅ User can close modal and reopen to see status

**Acceptance Criteria:**
- Publishing status = SUBMITTED
- App visible in App Store Connect dashboard
- No errors in application logs
- Database record created and updated correctly
- Encrypted credentials stored properly

---

### Scenario 2: Invalid Apple Credentials ✅ REQUIRED

**Goal:** Verify error handling for invalid credentials

**Steps:**
1. Open PublishingModal
2. Enter invalid Apple credentials (wrong Key ID)
3. Complete other fields correctly
4. Submit

**Expected Results:**
- ✅ Error message displayed: "Invalid Apple credentials"
- ✅ Status remains INITIATED (not started)
- ✅ User can fix credentials and retry
- ✅ No partial data stored
- ✅ No queue jobs created

---

### Scenario 3: Invalid Expo Token ✅ REQUIRED

**Goal:** Verify error handling for invalid Expo token

**Steps:**
1. Open PublishingModal
2. Enter valid Apple credentials
3. Enter invalid Expo token
4. Complete other fields
5. Submit

**Expected Results:**
- ✅ Error message displayed: "Invalid Expo token"
- ✅ Status remains INITIATED
- ✅ User can fix token and retry
- ✅ No build started
- ✅ No queue jobs created

---

### Scenario 4: Build Failure Recovery ✅ REQUIRED

**Goal:** Verify retry mechanism after build failure

**Prerequisites:**
- Use invalid build configuration to force failure

**Steps:**
1. Complete publishing flow with configuration that will fail
2. Wait for build to fail
3. Fix the issue
4. Click "Retry" button
5. Monitor new build

**Expected Results:**
- ✅ Failed state displays with error details
- ✅ Retry button prominent
- ✅ Retry creates new build
- ✅ Old build logs preserved
- ✅ New build tracked separately

---

### Scenario 5: Network Resilience ✅ OPTIONAL

**Goal:** Verify graceful handling of network issues

**Steps:**
1. Start publishing flow
2. Simulate network interruption during build
3. Restore network
4. Verify system recovers

**Expected Results:**
- ✅ Connection lost message displayed
- ✅ Polling resumes automatically
- ✅ Status updates after reconnection
- ✅ No data loss
- ✅ Build completes successfully

---

### Scenario 6: Concurrent Publishing Attempts ✅ OPTIONAL

**Goal:** Verify handling of multiple simultaneous publish requests

**Steps:**
1. Start publishing flow for project A
2. Immediately start another publish for project A
3. Observe behavior

**Expected Results:**
- ✅ Second request rejected with conflict error
- ✅ Message: "Publishing already in progress"
- ✅ First build continues unaffected
- ✅ User can retry after first completes

---

### Scenario 7: Performance Under Load ✅ OPTIONAL

**Goal:** Verify system handles multiple concurrent builds

**Prerequisites:**
- Multiple test accounts/projects

**Steps:**
1. Queue 5-10 simultaneous builds
2. Monitor system performance
3. Verify all complete successfully

**Expected Results:**
- ✅ Queue processes builds sequentially
- ✅ Rate limiting applied (5 jobs/minute)
- ✅ All builds complete within expected time
- ✅ No performance degradation
- ✅ Database connections stable
- ✅ Memory usage reasonable

---

## Post-Deployment Verification

### Day 1 Checks ✅

**Within 24 hours of production deployment:**

- [ ] Monitor error rates (should be <1%)
- [ ] Check build success rate (should be >95%)
- [ ] Review user feedback/support tickets
- [ ] Verify no security incidents
- [ ] Check system performance metrics
- [ ] Review application logs for unexpected errors
- [ ] Validate monitoring/alerting working

### Week 1 Checks ✅

**Within 7 days of production deployment:**

- [ ] Analyze build success rate trend
- [ ] Review average build times
- [ ] Check user adoption (# of publish attempts)
- [ ] Monitor queue depth trends
- [ ] Review feedback from early adopters
- [ ] Validate cost estimates (Expo builds, storage)
- [ ] Check for any edge cases encountered

### Success Metrics ✅

**Production quality gates:**

- [ ] Build success rate >95%
- [ ] Average build time <30 minutes
- [ ] API error rate <1%
- [ ] UI renders without glitches
- [ ] Zero credential leaks detected
- [ ] User satisfaction (NPS >7)
- [ ] Support ticket volume acceptable

---

## Rollback Procedure

**If critical issues discovered:**

### Level 1: Feature Flag Disable (Immediate - 0 downtime)

```bash
# Set environment variable
ENABLE_PUBLISHING="false"
# Restart application
# Publishing modal will be hidden from UI
```

### Level 2: Database Rollback (5-10 minutes)

```bash
cd backend
npx prisma migrate rollback
# Verify application still functional
```

### Level 3: Full Rollback (10-30 minutes)

```bash
# Revert to previous deployment
git revert <publishing-commits>
npm run build
npm run deploy
# Verify application restored to pre-publishing state
```

**Rollback Validation:**
- [ ] Application starts successfully
- [ ] Previous features still working
- [ ] No data corruption
- [ ] Monitoring shows normal metrics

---

## Sign-off Checklist

### Technical Lead Sign-off ✅

- [ ] All pre-production checks passed
- [ ] Required scenarios tested and passed
- [ ] Performance benchmarks met
- [ ] Security validation complete
- [ ] Monitoring configured
- [ ] Rollback procedure documented and tested

**Signed:** _________________________
**Date:** _________________________

### Product Manager Sign-off ✅

- [ ] User experience validated
- [ ] Error messages user-friendly
- [ ] Success metrics defined
- [ ] User documentation complete
- [ ] Support team trained

**Signed:** _________________________
**Date:** _________________________

### Security Lead Sign-off ✅

- [ ] No credential leakage
- [ ] Encryption properly implemented
- [ ] Access controls validated
- [ ] Audit logging complete
- [ ] Compliance requirements met

**Signed:** _________________________
**Date:** _________________________

---

## Contact Information

**On-call Engineer:** [TBD]
**Incident Response:** [TBD]
**Support Escalation:** [TBD]

**Last Updated:** January 2026
**Document Owner:** Engineering Team
**Review Frequency:** Quarterly
