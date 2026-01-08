# Post-Deployment Monitoring Checklist

**For:** Turbocat Branding Transformation - Production Deployment
**Monitoring Period:** First 24 hours after production deployment
**Created:** 2026-01-05

---

## Hour 0-1: Immediate Post-Deployment (Critical)

### 1. Deployment Verification (First 5 minutes)
- [ ] **Production URL loads successfully**
  - URL: [Production URL will be provided]
  - Expected: Homepage loads without errors

- [ ] **Turbocat branding visible**
  - Logo displays correctly
  - Favicon shows Turbocat icon
  - No Vercel references

- [ ] **Check Vercel Dashboard**
  - Navigate to: https://vercel.com/dashboard
  - Verify: Deployment status shows "Ready"
  - Check: Build logs show no errors

---

### 2. Quick Smoke Test (5 minutes)
- [ ] **Test one agent**
  - Create a new task
  - Select any agent (Claude recommended)
  - Send test message
  - Verify response received

- [ ] **Check browser console**
  - Press F12
  - Look for errors (red messages)
  - Note: Some warnings are acceptable

- [ ] **Test navigation**
  - Click through main pages
  - Verify all pages load
  - No broken links

---

### 3. Monitor Vercel Logs (10 minutes)
Run this command to watch live logs:
```bash
vercel logs --follow
```

**What to look for:**
- No error messages
- Successful API calls
- Normal request patterns

**Stop monitoring:** Ctrl+C when confident

---

## Hour 1-4: Early Monitoring

### Check Every Hour

#### Vercel Dashboard Metrics
Navigate to: https://vercel.com/dashboard → Your Project → Analytics

**Monitor:**
- [ ] **Request count:** Should be normal (not zero, not exploding)
- [ ] **Error rate:** Should be < 1%
- [ ] **Response time:** Should be < 2 seconds average

---

#### Test Core Functionality (5 minutes each hour)
- [ ] Hour 1: Test Claude agent
- [ ] Hour 2: Test Copilot agent
- [ ] Hour 3: Test Gemini agent
- [ ] Hour 4: Test OpenCode agent

---

#### Check for User Reports
If you have any users or team members:
- [ ] Ask if they notice any issues
- [ ] Check if branding looks correct to them
- [ ] Verify they can create tasks successfully

---

## Hour 4-12: Regular Monitoring

### Check Every 2-4 Hours

#### Vercel Dashboard
- [ ] Check analytics for unusual patterns
- [ ] Verify error rate stays low
- [ ] Monitor bandwidth usage

---

#### Spot Check Functionality (2 minutes)
- [ ] Load homepage
- [ ] Create one task
- [ ] Verify agent responds
- [ ] Check console for errors

---

## Hour 12-24: Background Monitoring

### Check 2-3 Times

#### Vercel Logs Summary
```bash
vercel logs | grep -i error | head -20
```

**Look for:**
- Repeated error patterns
- Any critical failures
- Database connection issues

---

#### Performance Check
- [ ] Page load time acceptable (< 3 seconds)
- [ ] Agent responses timely
- [ ] No degraded performance

---

## Issues to Watch For

### Critical Issues (Immediate Action Required)

#### 1. Site Down / 500 Errors
**Symptoms:**
- Production URL not loading
- "Application Error" message
- 500 Internal Server Error

**Action:**
1. Check Vercel deployment status
2. Review recent deployment logs
3. If needed, rollback to previous deployment:
   ```bash
   vercel rollback
   ```
4. Contact support if issue persists

---

#### 2. Authentication Broken
**Symptoms:**
- Cannot log in
- GitHub OAuth failing
- API key errors

**Action:**
1. Verify environment variables in Vercel dashboard
2. Check API key configuration
3. Test authentication flow
4. Review auth-related logs

---

#### 3. Agents Not Responding
**Symptoms:**
- All agents fail to respond
- Timeout errors
- API connection errors

**Action:**
1. Check agent API keys in .env
2. Verify API endpoints accessible
3. Review agent-related error logs
4. Test individual agent APIs

---

### Medium Priority Issues (Fix Within 24 Hours)

#### 1. Branding Issues
**Symptoms:**
- Some pages still show Vercel branding
- Logo not loading on certain pages
- Favicon not updating

**Action:**
- Note which pages have issues
- Create fix on feature branch
- Deploy fix to preview first
- Merge to production when verified

---

#### 2. Performance Degradation
**Symptoms:**
- Slow page loads (> 5 seconds)
- High server response times
- Timeout errors

**Action:**
- Check Vercel analytics
- Review database query performance
- Monitor API response times
- Optimize if needed

---

#### 3. Minor UI Issues
**Symptoms:**
- Styling glitches
- Layout issues on mobile
- Non-critical visual bugs

**Action:**
- Document the issues
- Create fix when convenient
- Not urgent unless affecting usability

---

### Low Priority (Monitor Only)

#### Console Warnings
- Acceptable if functionality works
- Can be addressed in future updates

#### Slow API Calls
- If occasional, not critical
- Monitor if pattern develops

---

## Monitoring Commands Reference

### Check Deployment Status
```bash
cd turbocat-agent
vercel ls
```

### View Recent Logs
```bash
vercel logs
```

### Follow Live Logs
```bash
vercel logs --follow
```

### Check Production Deployment
```bash
vercel inspect --prod
```

### Get Deployment URL
```bash
vercel ls --prod
```

---

## Rollback Procedure (Emergency Only)

**When to rollback:**
- Site completely down
- Critical functionality broken
- Data corruption risk
- Security issue discovered

**How to rollback:**

### Option 1: Vercel Rollback (Fastest)
```bash
vercel rollback
```
This reverts to the previous deployment.

---

### Option 2: Git Rollback (More Control)
```bash
# Switch to backup branch
git checkout backup/pre-phase4-branding

# Force push to main (emergency only!)
git push origin backup/pre-phase4-branding:main --force

# Vercel will auto-deploy the old version
```

**Warning:** Only use force push in true emergencies!

---

### Option 3: Vercel Dashboard Rollback
1. Go to: https://vercel.com/dashboard
2. Navigate to your project
3. Click "Deployments" tab
4. Find previous successful deployment
5. Click three dots → "Promote to Production"

---

## Success Metrics

**Deployment considered successful if after 24 hours:**

- [ ] **Uptime:** 99%+ (allowed brief downtime during deployment)
- [ ] **Error Rate:** < 1% of requests
- [ ] **Response Time:** < 2 seconds average
- [ ] **Agent Functionality:** All 4+ agents working
- [ ] **No Critical Bugs:** Site fully functional
- [ ] **Branding Complete:** Turbocat visible everywhere, no Vercel references
- [ ] **User Feedback:** Positive or neutral (no major complaints)

---

## Reporting Template

### Hourly Check (Hours 1-4)
```
Time: [HH:MM]
Status: [OK / ISSUES]
Errors: [None / List any errors]
Agents Tested: [Which agent(s)]
Notes: [Any observations]
```

### Summary Check (Hours 4, 12, 24)
```
Time Range: [Start - End]
Overall Status: [GOOD / FAIR / POOR]
Total Errors: [Count]
Performance: [GOOD / SLOW / DEGRADED]
Issues Found: [List or "None"]
Action Taken: [What you did]
```

---

## Contact Information

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support
- Status Page: https://www.vercel-status.com/

### Emergency Rollback Decision Tree

```
Is the site completely down?
├─ YES → Rollback immediately
└─ NO → Continue
    ├─ Are critical features broken?
    │  ├─ YES → Consider rollback
    │  └─ NO → Continue
    │     ├─ Are there many errors in logs?
    │     │  ├─ YES → Investigate, consider rollback
    │     │  └─ NO → Monitor and fix issues normally
```

---

## Post-24-Hour Actions

After 24 hours of successful monitoring:

- [ ] **Create completion report**
- [ ] **Archive monitoring logs**
- [ ] **Update documentation**
- [ ] **Close deployment task**
- [ ] **Celebrate successful deployment!**

---

## Notes Section

Use this space to track observations during monitoring:

```
Hour 1:
[Your notes here]

Hour 2:
[Your notes here]

Hour 4:
[Your notes here]

Hour 12:
[Your notes here]

Hour 24:
[Your notes here]
```

---

**Remember:** It's normal to see some minor issues in the first few hours. Focus on:
1. Site is accessible
2. Core functionality works
3. No critical errors

Everything else can be fixed with regular updates!
