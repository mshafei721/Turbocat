# Railway.app Deployment Guide - Expo POC

## Pre-Deployment Checklist ✅

All pre-deployment tests have passed:
- ✅ package.json configured correctly
- ✅ Dependencies installed (696 packages)
- ✅ POC-branded App.js created
- ✅ Dockerfile optimized for Railway
- ✅ railway.json configuration ready
- ✅ Expo framework installed

## Deployment Methods

### Method 1: Railway CLI (Recommended for POC)

#### Step 1: Create New Railway Project
```bash
cd D:\009_Projects_AI\Personal_Projects\Turbocat\implementation\phase-0-railway-poc\expo-poc-app
railway init
```

When prompted:
- **Workspace:** Select "Mohammed Elshafei's Projects"
- **Project Name:** Enter `expo-metro-poc` (or leave blank for random name)

#### Step 2: Deploy to Railway
```bash
railway up
```

This will:
1. Upload your code to Railway
2. Build the Docker image
3. Deploy the container
4. Generate a public URL

#### Step 3: Get Deployment URL
```bash
railway domain
```

If no domain exists, create one:
```bash
railway domain --add
```

### Method 2: GitHub Integration (Alternative)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial POC deployment"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Visit https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Dockerfile

## Post-Deployment Steps

### 1. Verify Deployment
```bash
railway status
```

Expected output:
- Service: Running
- Build: Succeeded
- Deployment: Active

### 2. Get QR Code URL

The Expo Metro bundler will generate a QR code accessible at:
```
https://<your-railway-domain>.railway.app
```

### 3. Test with Expo Go

1. **Install Expo Go** on physical device:
   - iOS: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

2. **Scan QR Code:**
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Point camera at QR code from Railway URL

3. **Expected Result:**
   ```
   Screen displays:
   🚀 Railway.app POC
   Expo Metro Bundler Test
   ✅ Connection Successful!
   Phase 0: Railway Deployment POC
   Deploy Date: 2026-01-05
   ```

## Monitoring Setup

### View Logs
```bash
railway logs
```

### Monitor Resource Usage
```bash
railway status --json
```

### Check Deployment Costs
Visit: https://railway.app/account/billing

## Troubleshooting

### Issue: Container exits immediately
**Solution:** Check logs with `railway logs` and verify PORT environment variable

### Issue: QR code not accessible
**Solution:** Ensure domain is created with `railway domain`

### Issue: Expo Go can't connect
**Solution:** Verify tunnel mode is working and firewall allows connections

### Issue: Build fails
**Solution:** Review Dockerfile and ensure all dependencies in package.json

## Success Criteria

- [ ] Railway deployment succeeds
- [ ] Public URL is accessible
- [ ] QR code renders correctly
- [ ] Expo Go connects from physical device
- [ ] App displays POC branding
- [ ] Costs remain under $5 for 48 hours

## Next Steps

After successful deployment:
1. Document deployment time and URL in POC-REPORT.md
2. Begin 48-hour monitoring period
3. Track costs hourly
4. Test QR code persistence
5. Monitor container uptime

## Railway Configuration Details

**Current Settings:**
- Builder: Dockerfile
- Start Command: `npm run railway`
- Health Check: `/status` endpoint
- Port: 8081 (or Railway-assigned PORT)
- Restart Policy: ON_FAILURE (max 10 retries)

**Environment Variables:**
- `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0`
- `REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0`
- `PORT` (auto-assigned by Railway)

## Cost Estimation

Based on Railway.app pricing:
- Starter Plan: $5/month (~$0.007/hour)
- Expected 48-hour cost: ~$0.33
- Well within $5 POC budget

## Files Reference

All files located at:
```
D:\009_Projects_AI\Personal_Projects\Turbocat\implementation\phase-0-railway-poc\expo-poc-app\
```

Key files:
- `Dockerfile` - Container configuration
- `railway.json` - Railway deployment settings
- `package.json` - Node.js dependencies and scripts
- `App.js` - POC application code
- `test-local.js` - Pre-deployment validation
