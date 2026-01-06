# Production Deployment Checklist

Use this checklist to ensure your mobile app is ready for production deployment to the Apple App Store and Google Play Store.

## Pre-Deployment (1-2 weeks before launch)

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No console.log or debug statements left in code
- [ ] No TODO or FIXME comments
- [ ] Code follows project style guide
- [ ] No unused imports or variables
- [ ] TypeScript errors resolved (`npm run type-check`)
- [ ] ESLint warnings fixed (`npm run lint`)

### Security

- [ ] No API keys hardcoded in code
- [ ] Secrets stored in environment variables
- [ ] Authentication properly implemented
- [ ] Authorization checks in place
- [ ] Input validation on all forms
- [ ] No sensitive data in logs
- [ ] HTTPS used for all API calls
- [ ] Security headers configured
- [ ] Run security audit: `npm audit`

### Performance

- [ ] App bundle size < 50MB
- [ ] Startup time < 3 seconds
- [ ] Hot reload responsive (< 2 seconds)
- [ ] No memory leaks detected
- [ ] Lists virtualized (FlatList optimization)
- [ ] Images optimized and lazy-loaded
- [ ] Metro bundler configured for production

### Functionality

- [ ] All core features working
- [ ] Happy path tested thoroughly
- [ ] Error cases handled gracefully
- [ ] Offline support (if applicable)
- [ ] Network timeout handling
- [ ] App restarts cleanly
- [ ] Permissions requests clear and necessary

### Device Testing

- [ ] Tested on iPhone (latest version)
- [ ] Tested on Android (latest version)
- [ ] Tested on multiple screen sizes
- [ ] Tested on slow network
- [ ] Tested with low battery
- [ ] Tested with location disabled
- [ ] Tested with notifications disabled
- [ ] No crashes on repeated interactions

### User Experience

- [ ] Loading states for all async operations
- [ ] Error messages are user-friendly (not technical)
- [ ] Success feedback (toasts, confirmations)
- [ ] Buttons are appropriately sized (>44pt)
- [ ] Text is readable (good contrast)
- [ ] Touch targets don't overlap
- [ ] Navigation is intuitive
- [ ] No infinite loops or hangs

---

## Environment Configuration (1 week before launch)

### Environment Variables

- [ ] Create `.env.production` file
- [ ] All API endpoints point to production servers
- [ ] API keys for production services set
- [ ] Railway API token (for iOS and Android auto-builds)
- [ ] Firebase or analytics keys (if using)
- [ ] Feature flags configured for production
- [ ] Error tracking service (Sentry, etc.) configured
- [ ] No development/staging URLs in production build

### app.json Configuration

```json
{
  "name": "Your App Name",
  "slug": "your-app-slug",
  "version": "1.0.0",
  "platforms": ["ios", "android"],
  "ios": {
    "bundleIdentifier": "com.yourcompany.yourapp",
    "buildNumber": "1"
  },
  "android": {
    "package": "com.yourcompany.yourapp",
    "versionCode": 1
  }
}
```

- [ ] App name is finalized
- [ ] Version number set (semantic versioning)
- [ ] Bundle identifier correct (reverse domain)
- [ ] Package name correct
- [ ] App description clear and marketing-friendly
- [ ] Privacy policy URL set
- [ ] Terms of service URL set (if applicable)
- [ ] Icon assets are 1024x1024px PNG
- [ ] Splash screen assets prepared

### Database & API

- [ ] Production database created
- [ ] Database migrations run
- [ ] Backup strategy in place
- [ ] API staging environment tested
- [ ] Production API endpoints working
- [ ] API rate limiting configured
- [ ] CORS configured for mobile app domain
- [ ] Database connection pooling configured

### Feature Flags

- [ ] Feature flags for mobile features created
- [ ] Flag values set to enable features
- [ ] Old features not accidentally disabled
- [ ] Gradual rollout plan documented
- [ ] Kill switch available if problems occur
- [ ] Monitoring configured for feature usage

---

## Build & Release Preparation (1 week before launch)

### iOS Build

- [ ] Apple Developer account created
- [ ] Team ID obtained
- [ ] Code signing certificate created
- [ ] Provisioning profile created
- [ ] App name registered in App Store Connect
- [ ] Privacy policy URL added
- [ ] SKU number assigned
- [ ] Version number (1.0.0 for launch)
- [ ] Build number set (1 for first release)
- [ ] Screenshots taken (English language)
  - [ ] iPhone 6.5-inch
  - [ ] iPhone 5.5-inch
  - [ ] iPad 12.9-inch
- [ ] App preview video (optional but recommended)
- [ ] Keywords optimized (for search)
- [ ] Category selected
- [ ] Ratings & age restrictions set
- [ ] EAS Build configured in Railway
- [ ] Test flight build created and tested
- [ ] Final build signed correctly

### Android Build

- [ ] Google Play Developer account created
- [ ] Keystore file created and backed up
- [ ] App signing key generated (use Play App Signing)
- [ ] App name registered in Google Play
- [ ] Privacy policy URL added
- [ ] Version code set (1 for launch)
- [ ] Version name set (1.0.0)
- [ ] Screenshots taken (5-8 minimum)
  - [ ] Phone (1080x1920 px)
  - [ ] Tablet (1440x2560 px)
- [ ] Feature graphic (1024x500 px)
- [ ] App icon (512x512 px, high quality)
- [ ] Content rating filled out
- [ ] Category selected
- [ ] EAS Build configured in Railway
- [ ] Internal test build created and tested on real device
- [ ] Final signed APK/AAB verified

### Asset Preparation

- [ ] App icon (high quality, all sizes)
- [ ] Screenshots (platform-specific, localized)
- [ ] App preview video (30 seconds, highlights features)
- [ ] Marketing materials ready
- [ ] Press release written (optional)
- [ ] Social media assets prepared
- [ ] Email announcement drafted

---

## Documentation (1 week before launch)

### In-App Documentation

- [ ] Help section added
- [ ] FAQ screen created
- [ ] Contact support information displayed
- [ ] Terms of service accessible in app
- [ ] Privacy policy accessible in app
- [ ] Changelog visible to users
- [ ] Tutorial or onboarding screen

### Documentation Files

- [ ] README.md complete
- [ ] CHANGELOG.md started (v1.0.0 entry)
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Deployment runbook created
- [ ] Rollback procedure documented
- [ ] Support documentation written

### User Documentation

- [ ] Getting started guide written
- [ ] Feature overview created
- [ ] Tutorial videos (optional)
- [ ] FAQ for common issues
- [ ] Troubleshooting guide
- [ ] Contact/support information

---

## Testing (3-5 days before launch)

### Functional Testing

- [ ] Core user flows work end-to-end
- [ ] All buttons/inputs respond correctly
- [ ] Navigation works correctly
- [ ] Deeplinks (if used) work
- [ ] Platform-specific features work (camera, location, etc.)
- [ ] Permissions requests appear at right time
- [ ] Settings and preferences save correctly
- [ ] Push notifications work (if implemented)

### Device Testing

- [ ] Tested on iPhone 12 minimum
- [ ] Tested on iPhone latest model
- [ ] Tested on Samsung Galaxy A series
- [ ] Tested on Google Pixel latest
- [ ] Tested on tablet devices
- [ ] Tested in dark mode
- [ ] Tested with accessibility features enabled
- [ ] Tested on slow network (3G simulation)
- [ ] Tested with VPN enabled
- [ ] Tested in airplane mode (offline)

### Regression Testing

- [ ] Old bugs haven't reappeared
- [ ] Previous versions' functionality still works
- [ ] No new crashes on interaction
- [ ] Performance not degraded
- [ ] Memory usage stable

### User Acceptance Testing

- [ ] 5+ beta testers have tested
- [ ] Feedback collected and addressed
- [ ] Major issues resolved
- [ ] Minor issues logged for v1.1 release
- [ ] Analytics collection working
- [ ] Crash reporting working

---

## Monitoring & Analytics (3-5 days before launch)

### Analytics Setup

- [ ] Analytics SDK integrated (Firebase, Mixpanel, etc.)
- [ ] Key events tracked:
  - [ ] App opens
  - [ ] Feature usage
  - [ ] User funnels
  - [ ] Retention metrics
- [ ] User identification configured
- [ ] Custom properties set
- [ ] Debug mode verified

### Error & Crash Tracking

- [ ] Sentry or Crashlytics configured
- [ ] Test crash reporting (trigger test crash)
- [ ] Team members added to error dashboard
- [ ] Alerts configured for critical errors
- [ ] Daily error digest set up

### Performance Monitoring

- [ ] Performance monitoring SDK enabled
- [ ] Slow network monitoring active
- [ ] Memory usage tracked
- [ ] CPU usage tracked
- [ ] Battery consumption tracked
- [ ] Dashboard created for team review

### Feature Flags

- [ ] Rollout strategy defined
  - [ ] 0% → 10% → 50% → 100%
  - [ ] Or gradual percentage rollout
- [ ] Monitoring dashboard created
- [ ] Kill-switch accessible and tested
- [ ] Team trained on gradual rollout

---

## Deployment Process (Day of launch)

### Before Release

- [ ] Final code review completed
- [ ] All tests passing
- [ ] No merge conflicts
- [ ] Build artifacts created and signed
- [ ] QA sign-off received
- [ ] Product manager approval received
- [ ] Communication team ready

### iOS Release

- [ ] TestFlight build created and tested
- [ ] Submit to App Review through App Store Connect
- [ ] Expected review time: 24-48 hours
- [ ] Have fallback plan if rejected
- [ ] Monitor for common rejection reasons

### Android Release

- [ ] Internal testing build created
- [ ] Test on 5+ real devices
- [ ] Upload AAB to Play Console
- [ ] Set staged rollout (e.g., 25% first)
- [ ] Monitor for crashes (wait 24 hours before 100%)

### Post-Release

- [ ] Monitor error rates in first hour
- [ ] Check analytics data flowing in
- [ ] Verify crash reporting working
- [ ] Monitor server/API performance
- [ ] Have on-call support ready
- [ ] Respond quickly to critical issues

---

## Rollback Plan

If critical issues discovered:

### For iOS

```
1. Check error dashboard (Sentry/Crashlytics)
2. If critical:
   - Prepare hotfix
   - Update version to 1.0.1
   - Build and sign
   - Submit to TestFlight
   - Test on device
   - Submit to App Review (expedited)
   - Notify users of issue and fix timeline

3. If rejected by App Store:
   - Can't force old version back
   - Communicate issue and timeline
   - Coordinate with customer support
```

### For Android

```
1. Check crash dashboard
2. If critical:
   - Stop staged rollout (pause at current %)
   - Prepare hotfix build
   - Update version to 1.0.1
   - Build and sign APK
   - Internal test on real devices
   - Upload new AAB to Play Console
   - Continue staged rollout (25% first)

3. If widespread crashes:
   - Pause rollout completely
   - Release 1.0.1 hotfix to 25%
   - Monitor for 24 hours
   - Continue rolling out if stable
```

### User Communication

When rolling back:

```
[ISSUE]: Authentication not working for new users
[TIMELINE]: Found in 1 hour, fix in 3 hours, deployed in 6 hours
[ACTION]: We're pausing the update and releasing a fix
[ETA]: New version available in 2 hours
```

---

## Post-Launch Checklist (First 48 hours)

### Monitoring

- [ ] No unusual error spike
- [ ] Server/API performing well
- [ ] Database responding quickly
- [ ] Network latency acceptable
- [ ] Crash rate < 0.1%
- [ ] Users able to complete core flows

### User Feedback

- [ ] Customer support team monitoring reviews
- [ ] Email support responding to inquiries
- [ ] 1-star reviews being addressed
- [ ] Collecting feedback from beta testers
- [ ] Known issues documented

### Metrics

- [ ] Daily active users (DAU) tracked
- [ ] Core funnel metrics healthy
- [ ] Feature adoption tracked
- [ ] Performance metrics normal
- [ ] Analytics data quality verified

### Team

- [ ] Post-launch retrospective scheduled
- [ ] Team decompressed
- [ ] On-call rotation established
- [ ] Communication cadence defined
- [ ] Next sprint planning started

---

## Success Criteria

Your launch is successful if:

- [ ] App approved and live on both stores
- [ ] Users can download and install without issues
- [ ] Core user flows work for >99% of users
- [ ] Crash rate < 0.5% in first 24 hours
- [ ] No data loss incidents
- [ ] Customer satisfaction > 4.0 stars
- [ ] Server/API uptime > 99.9%
- [ ] Response time < 500ms median

---

## Troubleshooting Launch Issues

### App Rejected by App Store

**Common reasons:**
- Missing privacy policy
- Misleading marketing
- Crashes on review device
- Performance issues
- Design issues (navigation, etc.)

**Solution:**
- Read rejection email carefully
- Fix issues mentioned
- Resubmit with detailed notes
- Check Apple guidelines

### Low Downloads/Install Rate

**Possible causes:**
- App Store Optimization (keyword selection)
- Poor screenshots
- Low ratings preventing discovery
- Insufficient marketing

**Solution:**
- A/B test screenshots
- Optimize keywords
- Run targeted ads
- Gather more ratings through email

### Unexpected Crashes

**Steps:**
1. Check Sentry/Crashlytics dashboard
2. Identify common crash pattern
3. Create hotfix (v1.0.1)
4. Test thoroughly before releasing
5. Roll out to small % first
6. Monitor for 24 hours

### High Server Load

**Steps:**
1. Check API/database metrics
2. Identify bottleneck (query? file size?)
3. Scale resources temporarily
4. Optimize code/queries
5. Deploy optimization in v1.0.1

---

## Deployment Template

Save this template for future releases:

```
Release: v1.X.X
Date: [DATE]
Platforms: iOS, Android

Changes in this release:
- [Feature 1]
- [Bug fix 1]
- [Performance improvement 1]

Deployment plan:
- Build created: [TIME]
- TestFlight submitted: [TIME]
- App Review approval: [TIME]
- Release to 25%: [TIME]
- Release to 100%: [TIME]

Monitoring:
- Crash rate: [X%]
- Session length: [X min]
- Core funnel: [X%]

Issues found:
- [Issue 1] → [Fix in v1.X.1]
- [Issue 2] → [Monitor for v1.X.1]

Success: Yes / No
Next steps: [PLAN FOR v1.X.1]
```

---

## Resources

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [Expo Deployment Docs](https://docs.expo.dev/build/setup/)
- [Railway Deployment Docs](https://docs.railway.app/)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

---

**Last Updated:** 2026-01-06
**Use for:** Production deployments to App Store and Google Play
