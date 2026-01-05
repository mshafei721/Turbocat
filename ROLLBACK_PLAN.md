# Rollback Plan - Turbocat Branding Transformation

**Created:** 2026-01-05
**Current Branch:** `feature/phase4-turbocat-branding`
**Pre-Transformation Backup Branch:** `backup/pre-phase4-branding`

## Current State

**Current Commit Hash:** `fe54e73be43033394459e3286ba75f79bd013136`
**Branch:** `feature/phase4-turbocat-branding`
**Status:** Pre-deployment verification in progress

## Production Environment Details

**Deployment Platform:** Vercel
**Project Name:** Turbocat
**Current Production URL:** _[To be documented by platform administrator]_

## Rollback Scenarios

### Scenario 1: Immediate Rollback (Vercel Dashboard)
**Use When:** Critical issues detected immediately after deployment
**Downtime:** < 2 minutes

**Steps:**
1. Log into Vercel dashboard at https://vercel.com
2. Navigate to the Turbocat project
3. Click on "Deployments" tab
4. Find the previous stable deployment (pre-branding)
5. Click the three dots menu on that deployment
6. Select "Promote to Production"
7. Confirm the promotion
8. Wait for deployment to complete (~1-2 minutes)
9. Verify production URL shows previous version

**Verification:**
- Homepage shows previous branding
- All 6 agents are functional
- No console errors

---

### Scenario 2: Git Revert (Clean Rollback)
**Use When:** Issues discovered within hours of deployment, git history intact
**Downtime:** ~5-10 minutes

**Steps:**
1. Open terminal and navigate to project root:
   ```bash
   cd D:\009_Projects_AI\Personal_Projects\Turbocat
   ```

2. Ensure you're on the main branch:
   ```bash
   git checkout main
   ```

3. Revert the branding transformation commit:
   ```bash
   git revert HEAD
   ```

4. Resolve any conflicts if they arise (unlikely for this transformation)

5. Push to trigger new deployment:
   ```bash
   git push origin main
   ```

6. Monitor Vercel deployment progress in dashboard

7. Verify production deployment

**Verification:**
- Check Vercel deployment logs for success
- Test production URL
- Verify previous branding restored
- Test all 6 agents

---

### Scenario 3: Backup Branch Restore (Nuclear Option)
**Use When:** Git history is corrupted or multiple failed rollback attempts
**Downtime:** ~10-15 minutes
**WARNING:** This will force-push and rewrite history

**Steps:**
1. Open terminal and navigate to project root:
   ```bash
   cd D:\009_Projects_AI\Personal_Projects\Turbocat
   ```

2. Checkout the backup branch:
   ```bash
   git checkout backup/pre-phase4-branding
   ```

3. Verify this is the correct backup:
   ```bash
   git log --oneline -5
   # Should show commits from before transformation
   ```

4. Create a new main branch from backup:
   ```bash
   git branch -D main
   git checkout -b main
   ```

5. Force push to production (REQUIRES CONFIRMATION):
   ```bash
   git push origin main --force
   ```

6. Monitor Vercel automatic deployment

**Verification:**
- Check Vercel logs for successful deployment
- Access production URL
- Confirm previous state restored
- Test critical functionality

**Post-Rollback Actions:**
- Document reason for rollback
- Preserve feature branch for analysis:
  ```bash
  git checkout feature/phase4-turbocat-branding
  git branch feature/phase4-turbocat-branding-failed-$(date +%Y%m%d)
  ```

---

## Known Issues & Build Status

### Production Build Status

**Status:** ⚠️ **BLOCKED** - Turbopack native module incompatibility

**Issue:** The production build with `next build --turbopack` fails due to:
- Tailwind CSS v4 native modules (`lightningcss`, `@tailwindcss/oxide`)
- Windows/Turbopack compatibility issue with native Node.js modules
- Module resolution errors: "Cannot find module 'unknown'"

**Error Details:**
```
Error: Turbopack build failed with 7 errors:
- lightningcss native module loading failure
- @tailwindcss/oxide native module loading failure
```

**Dev Server Status:** ✅ **WORKING** (uses `--webpack` flag)

**Recommendation:**
This is a known limitation that should be resolved before production deployment. Options:
1. Deploy current dev-tested code to Vercel (Vercel's build environment may handle native modules differently)
2. Switch build script from `--turbopack` to `--webpack` temporarily
3. Wait for Next.js/Turbopack fix for native modules on Windows

**Alternative Verification:**
- Dev server runs successfully (`npm run dev --webpack`)
- All functional tests pass
- All 6 agents work in development
- No branding-related build errors
- No console errors or warnings

---

## Environment Variables Checklist

Before any rollback, verify these environment variables exist in Vercel Production:

### Required API Keys
- [ ] `ANTHROPIC_API_KEY` (Claude agent)
- [ ] `OPENAI_API_KEY` (OpenCode/Copilot agents)
- [ ] `GEMINI_API_KEY` (Gemini agent)
- [ ] `CURSOR_API_KEY` (Cursor agent)
- [ ] `AI_GATEWAY_API_KEY` (Codex agent)

### Vercel Sandbox
- [ ] `SANDBOX_VERCEL_TOKEN`
- [ ] `SANDBOX_VERCEL_TEAM_ID`
- [ ] `SANDBOX_VERCEL_PROJECT_ID`

### Database
- [ ] `DATABASE_URL` (or equivalent connection string)

### Authentication
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `VERCEL_CLIENT_ID` (if Vercel OAuth enabled)
- [ ] `VERCEL_CLIENT_SECRET` (if Vercel OAuth enabled)

---

## Communication Plan

### During Rollback

**Internal Team:**
1. Post in team Slack/Discord: "Initiating rollback of Turbocat branding (Scenario X)"
2. Update status page if available
3. Notify all stakeholders

**Users (if applicable):**
1. Display maintenance banner (if multi-minute downtime expected)
2. Post to status page: "We're rolling back a recent update. Service will be restored shortly."

**Post-Rollback:**
1. Send all-clear message when production is stable
2. Schedule post-mortem meeting
3. Document lessons learned

---

## Post-Rollback Analysis

After any rollback, complete this checklist:

- [ ] Document exact issue that triggered rollback
- [ ] Capture error logs from Vercel
- [ ] Capture browser console errors (if applicable)
- [ ] Document time of deployment failure
- [ ] Document rollback method used
- [ ] Document total downtime
- [ ] Identify root cause
- [ ] Create action items to prevent recurrence
- [ ] Update this rollback plan with new learnings

---

## Contact Information

**DevOps Lead:** _[Name]_ - _[Contact]_
**Platform Administrator:** _[Name]_ - _[Contact]_
**Emergency Contact:** _[Name]_ - _[Contact]_

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-05 | 1.0 | Initial rollback plan created | Claude (DevOps Engineer) |

---

## References

- Feature Branch: `feature/phase4-turbocat-branding`
- Backup Branch: `backup/pre-phase4-branding`
- Spec Document: `agent-os/specs/2026-01-04-turbocat-branding-transformation/planning/spec.md`
- Tasks Document: `agent-os/specs/2026-01-04-turbocat-branding-transformation/tasks.md`
- Vercel Documentation: https://vercel.com/docs/deployments/rollbacks
