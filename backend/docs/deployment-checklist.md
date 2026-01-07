# Deployment Checklist

Use this checklist for every production deployment to ensure nothing is missed.

---

## Pre-Deployment (Before You Start)

### Code Quality
- [ ] All tests pass locally (`npm test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code review completed and approved
- [ ] No TODO/FIXME comments in production code
- [ ] No console.log statements (use logger instead)

### Security
- [ ] No secrets committed to repository
- [ ] Dependencies audited (`npm audit`)
- [ ] No critical vulnerabilities in dependencies
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints

### Database
- [ ] Migration files created for schema changes
- [ ] Migrations tested on staging/local
- [ ] Rollback migration available (if applicable)
- [ ] No destructive migrations without backup plan
- [ ] Index added for new queries

### Configuration
- [ ] All required environment variables documented
- [ ] Production secrets generated (new deployment only)
- [ ] Frontend URL configured for CORS
- [ ] Log level appropriate for production
- [ ] Error tracking DSN configured (Sentry)

---

## Deployment Execution

### Backup (For Updates)
- [ ] Database backup confirmed (Supabase auto-backup)
- [ ] Note current deployment version for rollback
- [ ] Document current git commit: `____________`

### Deploy
- [ ] Deploy to staging first (if available)
- [ ] Staging verification complete
- [ ] Notify team of deployment start
- [ ] Trigger production deployment
- [ ] Monitor deployment logs for errors

### Database Migration
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify migration success in logs
- [ ] Check migration status: `npx prisma migrate status`

---

## Post-Deployment Verification

### Health Checks (Must Pass)
- [ ] `/health` returns 200 with "healthy" status
- [ ] `/health/live` returns 200
- [ ] `/health/ready` returns 200
- [ ] Database connection verified in health check
- [ ] Redis connection verified in health check

### Functional Tests
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens issued correctly
- [ ] Protected endpoints require authentication
- [ ] API rate limiting active

### Monitoring
- [ ] Application logs appearing
- [ ] Error tracking connected (Sentry)
- [ ] Uptime monitoring active
- [ ] No errors in logs

### Performance
- [ ] Response time < 500ms (p95)
- [ ] No memory leaks detected
- [ ] No unusual CPU usage

---

## Rollback Decision Matrix

| Condition | Action |
|-----------|--------|
| Health check fails for > 5 min | ROLLBACK |
| Error rate > 10% for > 5 min | ROLLBACK |
| p95 latency > 2s for > 10 min | ROLLBACK |
| Critical feature broken | ROLLBACK |
| Minor bug found | Fix forward |
| Performance degraded < 50% | Monitor |

### Rollback Procedure

**Immediate Actions (within 5 minutes):**

1. [ ] **Decision**: Confirm rollback is needed (refer to Decision Matrix above)
2. [ ] **Notify**: Alert team that rollback is in progress

**Platform-Specific Rollback:**

**Railway:**
```powershell
# Option 1: Redeploy previous commit via CLI
railway redeploy --commit <previous-commit-sha>

# Option 2: Via Dashboard
# Go to Deployments > Click on previous successful deployment > Redeploy
```

**Render:**
```powershell
# Via Dashboard only
# Go to Events > Find last successful deploy > Click "Rollback to this deploy"
```

**Manual Rollback (any platform):**
```powershell
# 1. Checkout previous version
git checkout <previous-commit-sha>

# 2. Force deploy
git push origin HEAD:main --force

# 3. Or create rollback branch
git checkout -b rollback-<date>
git push origin rollback-<date>
```

**Database Rollback (if migration was applied):**
```powershell
# WARNING: Only if you have a rollback migration ready
# Railway
railway run npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
# Contact Supabase support or use Point-in-Time Recovery (paid plans)
```

3. [ ] Verify rollback completed successfully
4. [ ] Run health checks to confirm services are healthy
5. [ ] Notify team of rollback completion
6. [ ] Document rollback reason and lessons learned

**Post-Rollback:**
- [ ] Create incident report
- [ ] Schedule post-mortem meeting
- [ ] Fix issue in development
- [ ] Test fix thoroughly before redeploying

---

## Post-Deployment Tasks

### Documentation
- [ ] Update API documentation if endpoints changed
- [ ] Update README if setup changed
- [ ] Update CHANGELOG with deployment notes

### Communication
- [ ] Notify team of successful deployment
- [ ] Update status page (if applicable)
- [ ] Close related tickets/issues

### Monitoring (24 Hours)
- [ ] Check error rates after 1 hour
- [ ] Check error rates after 4 hours
- [ ] Check error rates after 24 hours
- [ ] Review any new error patterns

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | | |
| Database Admin | | |
| DevOps Lead | | |
| Product Owner | | |

---

## Deployment Log

Use this section to record deployment details:

```
Date: _______________
Time: _______________
Deployer: _______________
Version/Commit: _______________
Environment: [ ] Staging [ ] Production

Pre-deployment checks: [ ] Complete
Deployment method: [ ] Auto-deploy [ ] Manual
Migration required: [ ] Yes [ ] No

Post-deployment health check: [ ] Pass [ ] Fail
Issues encountered:
_______________________________________________
_______________________________________________

Rollback required: [ ] Yes [ ] No
If yes, reason:
_______________________________________________

Sign-off: _______________
```

---

## Quick Reference

### Useful Commands

```bash
# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Health check
curl https://your-api.com/health

# Rollback
./scripts/rollback.ps1  # Windows
./scripts/rollback.sh   # Linux/Mac

# View logs
railway logs  # Railway
```

### Important URLs

- Production API: https://_______________
- Staging API: https://_______________
- Supabase Dashboard: https://supabase.com/dashboard
- Railway Dashboard: https://railway.app
- Sentry: https://sentry.io

---

## Version History

| Date | Version | Deployer | Notes |
|------|---------|----------|-------|
| | | | |
| | | | |
| | | | |
