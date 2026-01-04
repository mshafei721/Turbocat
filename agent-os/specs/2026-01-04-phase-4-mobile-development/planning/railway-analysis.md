# Railway.app Analysis for Phase 4 Mobile Development

**Analysis Date:** 2026-01-04
**Status:** ✅ **HIGHLY RECOMMENDED**

---

## Executive Summary

**Railway.app is an excellent option for Phase 4 mobile development** and may be **superior to self-managed Docker** on AWS/Digital Ocean/GCP.

**Key Advantages:**
- ✅ Automatic Docker container deployment
- ✅ WebSocket support (critical for Metro bundler)
- ✅ Automatic port exposure and HTTPS
- ✅ Pay-per-use pricing (only pay for actual usage)
- ✅ No infrastructure management required
- ✅ Existing Expo ecosystem presence (Expo-Open-OTA template)
- ✅ Supports long-running processes
- ✅ No explicit container uptime limits

---

## What is Railway.app?

Railway is a Platform-as-a-Service (PaaS) that provides:
- **Automatic Docker deployment:** Detects Dockerfile and builds/deploys automatically
- **Infrastructure abstraction:** No server management, auto-scaling, automatic HTTPS
- **Developer-friendly:** Git integration, preview deployments, environment variables
- **Resource-based pricing:** Pay only for CPU, RAM, network, and storage you actually use

---

## Railway Capabilities for Expo/React Native

### ✅ Docker Container Support

**How it works:**
- Railway automatically detects Dockerfiles in your repo
- Builds and deploys Docker containers seamlessly
- Supports both public and private Docker images

**For Expo:**
- Use existing Expo Docker images (e.g., `sonyarouje/expo-docker`)
- Or create custom Dockerfile with Node.js + Expo CLI + Metro bundler
- Railway handles all the container orchestration

### ✅ WebSocket Support (Critical for Metro Bundler)

**Metro Bundler Requirements:**
- WebSocket connections for hot reloading
- Long-running process (continuous file watching)
- Port exposure (default: 19001 for Metro, 19002 for DevTools)

**Railway Support:**
- ✅ **Full WebSocket support** (proven with multiple WebSocket templates)
- ✅ **Automatic port exposure** via `PORT` environment variable
- ✅ **Automatic HTTPS** (no manual SSL configuration needed)
- ✅ **Long-running processes** supported (no explicit uptime limits)

**Configuration:**
```javascript
// Metro bundler listens on Railway's PORT
const PORT = process.env.PORT || 19001;
```

Railway automatically handles port mapping and external access.

### ✅ Expo Ecosystem Presence

**Evidence:**
- Railway has an official **Expo-Open-OTA template** (100% deploy success rate)
- Expo-Open-OTA is a Go service for delivering OTA updates to React Native apps
- Template uses Docker containers, environment variables, persistent volumes
- Demonstrates Railway can handle Expo-related infrastructure

**What this means:**
- Railway is already used in the Expo ecosystem
- Infrastructure is proven for React Native workflows
- Community familiarity with Expo + Railway deployments

---

## Pricing Analysis

### Pricing Tiers

| Plan | Monthly Cost | Included Credits | RAM | CPU | Storage |
|------|--------------|------------------|-----|-----|---------|
| **Free** | $0 | $1 | 0.5 GB | 1 vCPU | 1 GB ephemeral |
| **Hobby** | $5 | $5 | 8 GB | 8 vCPU | 100 GB ephemeral |
| **Pro** | $20 | $20 | 32 GB | 32 vCPU | 100 GB ephemeral |
| **Enterprise** | Custom | Custom | 48 GB | 64 vCPU | 100 GB ephemeral |

### Resource Costs (Pay-Per-Use)

**Per Minute Billing:**
- **RAM:** $0.000231 / GB / minute = **$10 / GB / month**
- **CPU:** $0.000463 / vCPU / minute = **$20 / vCPU / month**
- **Network Egress:** $0.05 / GB
- **Volume Storage:** $0.15 / GB / month

### Cost Estimation for Phase 4

**Scenario: 10 concurrent mobile projects**

**Per Project (Metro bundler running):**
- RAM: 1 GB (Expo + Metro + Node.js)
- CPU: 0.5 vCPU (average utilization, idle most of the time)
- Network: 2 GB/month (QR code generation, file transfers)
- Storage: 2 GB (node_modules, project files)

**Per Project Cost:**
- RAM: 1 GB × $10 = **$10/month**
- CPU: 0.5 vCPU × $20 = **$10/month**
- Network: 2 GB × $0.05 = **$0.10/month**
- Storage: 2 GB × $0.15 = **$0.30/month**

**Total per project:** ~$20/month

**10 Projects:** ~$200/month
**20 Projects:** ~$400/month

**With Hobby Plan ($5/month + $5 credits):**
- Base cost: $5/month
- Usage: ~$200-400/month
- **Total: $205-405/month**

**With Pro Plan ($20/month + $20 credits):**
- Base cost: $20/month
- Usage: ~$200-400/month
- **Total: $220-420/month**

### Cost Optimization

**Pay only for actual usage:**
- If containers are idle 50% of the time → 50% CPU cost savings
- If containers are stopped when not in use → significant savings
- Auto-scaling down during low usage periods

**Container Lifecycle Management:**
- Start container when user begins mobile project
- Stop container after 30 minutes of inactivity
- Resume container when user returns

**Estimated Optimized Cost:**
- With aggressive cleanup: **$100-200/month** (50% savings)

---

## Comparison: Railway vs. Self-Managed Docker

| Feature | Railway | AWS/Digital Ocean | Winner |
|---------|---------|-------------------|--------|
| **Setup Complexity** | Automatic | Manual | ✅ Railway |
| **Infrastructure Management** | Zero (managed) | Full (self-managed) | ✅ Railway |
| **Docker Support** | Automatic | Manual | ✅ Railway |
| **WebSocket Support** | Built-in | Manual config | ✅ Railway |
| **HTTPS/SSL** | Automatic | Manual (Let's Encrypt) | ✅ Railway |
| **Port Exposure** | Automatic | Manual | ✅ Railway |
| **Auto-Scaling** | Built-in | Manual | ✅ Railway |
| **Container Orchestration** | Automatic | Manual (Docker Compose/K8s) | ✅ Railway |
| **Developer Experience** | Excellent | Good | ✅ Railway |
| **Cost (10 projects)** | ~$200-400/month | ~$150-300/month | ⚖️ Comparable |
| **Cost (optimized)** | ~$100-200/month | ~$100-200/month | ⚖️ Comparable |
| **Time to Deploy** | Minutes | Hours/Days | ✅ Railway |
| **Maintenance Burden** | Zero | High | ✅ Railway |

**Overall Winner:** ✅ **Railway.app**

**Rationale:**
- Comparable pricing when optimized
- Vastly superior developer experience
- Zero infrastructure management
- Faster time to market
- Better auto-scaling and reliability
- Less maintenance burden

---

## Technical Implementation on Railway

### Architecture

```
User → Turbocat UI → Platform Selector
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
              [Web Path]    [Mobile Path]
                    ↓             ↓
            Vercel Sandbox   Railway Container
            (Next.js)        (Expo + Metro)
                    ↓             ↓
            Web Preview      Metro Server (WebSocket)
                                  ↓
                             QR Code → Expo Go
```

### Deployment Flow

1. **User creates mobile project in Turbocat**
2. **Turbocat backend triggers Railway deployment:**
   - Railway API creates new service from Expo Docker template
   - Environment variables configured (project ID, user context)
   - Container spins up with Metro bundler
3. **Railway returns service URL:**
   - WebSocket URL for Metro bundler
   - Public HTTPS endpoint (automatic)
4. **Turbocat generates QR code:**
   - QR code points to Railway Metro server URL
   - User scans with Expo Go app
5. **Live preview in Expo Go:**
   - Hot reloading via WebSocket
   - Real-time code updates

### Docker Configuration

**Dockerfile (Expo + Metro):**
```dockerfile
FROM node:20-alpine

# Install Expo CLI and dependencies
RUN npm install -g expo-cli @expo/ngrok

# Set working directory
WORKDIR /app

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Expose Metro bundler ports
EXPOSE 19000 19001 19002

# Set environment variables
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Start Metro bundler
CMD ["npx", "expo", "start", "--tunnel"]
```

**Railway Configuration (railway.json):**
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npx expo start --tunnel",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300
  }
}
```

### Railway API Integration

**Create Service (Node.js SDK):**
```javascript
import { Railway } from 'railway-sdk'; // hypothetical SDK

const railway = new Railway({ apiKey: process.env.RAILWAY_API_KEY });

// Create new service for user's mobile project
const service = await railway.services.create({
  name: `mobile-${userId}-${projectId}`,
  source: {
    type: 'docker',
    image: 'turbocat/expo-metro:latest'
  },
  variables: {
    PROJECT_ID: projectId,
    USER_ID: userId,
    EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0'
  }
});

// Get service URL
const serviceUrl = service.url; // e.g., https://mobile-123-abc.railway.app

// Generate QR code for Expo Go
const qrCode = generateQRCode(serviceUrl);
```

**Stop Service (Cleanup):**
```javascript
// Stop service after 30 minutes of inactivity
await railway.services.stop(service.id);

// Or delete service entirely
await railway.services.delete(service.id);
```

---

## Environment Variables Configuration

**Required for Metro Bundler on Railway:**

```bash
# Railway auto-sets PORT
PORT=19001

# Metro bundler hostname (must be 0.0.0.0 for external access)
REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Expo DevTools address (must listen on all interfaces)
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Turbocat-specific
PROJECT_ID=abc123
USER_ID=user456
TURBOCAT_API_URL=https://api.turbocat.dev
```

Railway automatically handles:
- ✅ HTTPS (SSL certificates)
- ✅ Public URL (e.g., `https://mobile-abc.railway.app`)
- ✅ Port mapping (internal 19001 → external 443)
- ✅ Environment variable injection

---

## Tunnel Mode for Expo Go

**Option 1: Railway's Public URL (Direct Access)**
```bash
# Metro bundler accessible via Railway URL
expo start --hostname 0.0.0.0
```

**Option 2: Expo Tunnel (ngrok)**
```bash
# Expo's built-in tunnel via ngrok
expo start --tunnel
```

**Recommendation:** Use Railway's public URL directly (simpler, no ngrok dependency)

---

## Advantages Over Self-Managed Docker

### 1. **Zero Infrastructure Management**
- No EC2 instances to provision
- No Docker Compose configurations
- No load balancer setup
- No SSL certificate management
- No monitoring/logging setup (Railway includes built-in logs)

### 2. **Automatic Scaling**
- Railway auto-scales containers based on load
- No manual horizontal scaling configuration
- Resource limits adjust dynamically

### 3. **Built-in CI/CD**
- GitHub integration (auto-deploy on push)
- Preview deployments for PRs
- Rollback with one click

### 4. **Developer Experience**
- Web dashboard for logs, metrics, environment variables
- CLI for local testing (`railway run`)
- Fast deployment (< 2 minutes)

### 5. **Cost Efficiency**
- Pay only for actual CPU/RAM usage (idle = low cost)
- No minimum instance costs (unlike EC2 reserved instances)
- No wasted capacity

### 6. **Reliability**
- Built-in health checks
- Automatic restarts on failure
- Multi-region availability (Enterprise)

---

## Disadvantages vs. Self-Managed Docker

### 1. **Vendor Lock-In**
- Railway-specific configuration
- Migration to another platform requires reconfiguration
- **Mitigation:** Use standard Dockerfile (portable to any platform)

### 2. **Less Control**
- Cannot customize underlying infrastructure
- Limited access to host system
- **Mitigation:** Railway provides sufficient control for most use cases

### 3. **Pricing at Scale**
- May become expensive at very high scale (hundreds of projects)
- **Mitigation:** Self-host if scale exceeds Railway economics

---

## Proof of Concept (POC) Plan

### POC Objectives
1. ✅ Deploy Expo app to Railway via Docker
2. ✅ Start Metro bundler with WebSocket support
3. ✅ Generate QR code from Railway URL
4. ✅ Test Expo Go connection on physical device
5. ✅ Measure performance (startup time, hot reload speed)
6. ✅ Test container cleanup and resource usage
7. ✅ Estimate actual costs

### POC Timeline
**1-2 days**

### POC Steps

**Day 1: Setup & Deployment**
1. Create Railway account (Free tier)
2. Create simple Expo app locally
3. Write Dockerfile for Expo + Metro
4. Deploy to Railway via GitHub integration
5. Configure environment variables
6. Test Metro bundler starts successfully

**Day 2: Testing & Validation**
7. Test QR code generation from Railway URL
8. Scan QR code with Expo Go on iOS/Android
9. Test hot reloading (edit code, see changes in real-time)
10. Measure startup time (container cold start → Metro ready)
11. Test container stop/restart
12. Review Railway logs and metrics
13. Calculate actual resource usage and costs

### Success Criteria
- ✅ Metro bundler runs on Railway
- ✅ Expo Go connects via QR code
- ✅ Hot reloading works in < 5 seconds
- ✅ Container starts in < 2 minutes
- ✅ Cost projection aligns with estimates ($200-400/month for 10-20 projects)

---

## Risks & Mitigations

### Risk 1: Railway Service Limits
**Risk:** Railway may have hidden limits on WebSocket connections or long-running processes
**Likelihood:** Low (no documented limits found)
**Impact:** High (breaks Metro bundler)
**Mitigation:** POC will validate; Railway support can clarify limits
**Fallback:** Use self-managed Docker if Railway limits too restrictive

### Risk 2: Network Performance
**Risk:** Railway's network latency may slow Metro bundler communication
**Likelihood:** Low (Railway uses CDN, low latency)
**Impact:** Medium (slower hot reloading)
**Mitigation:** POC will measure performance; test from different geographic locations
**Fallback:** Use Expo tunnel mode (ngrok) if direct connection slow

### Risk 3: Cost Overruns
**Risk:** Actual usage may exceed estimates (memory leaks, inefficient containers)
**Likelihood:** Medium
**Impact:** Medium (higher monthly costs)
**Mitigation:** Monitor Railway usage closely, implement aggressive container cleanup, set budget alerts
**Fallback:** Optimize container resource limits, switch to self-managed if costs too high

### Risk 4: Expo/Metro Version Compatibility
**Risk:** Railway environment may have issues with specific Expo/Metro versions
**Likelihood:** Low (Docker ensures consistency)
**Impact:** Medium
**Mitigation:** Pin Expo/Metro versions in Dockerfile, test thoroughly in POC
**Fallback:** Adjust Docker image to match compatible versions

---

## Recommendation

**✅ USE RAILWAY.APP FOR PHASE 4 MOBILE DEVELOPMENT**

### Why Railway Over Self-Managed Docker?

1. **Faster Time to Market:** Deploy in minutes vs. days
2. **Zero Maintenance:** No infrastructure to manage
3. **Better Developer Experience:** Built-in logs, metrics, CI/CD
4. **Comparable Costs:** $200-400/month (optimized: $100-200/month)
5. **Proven for Expo Ecosystem:** Expo-Open-OTA template demonstrates compatibility
6. **Auto-Scaling:** Handles traffic spikes automatically
7. **Less Risk:** No infrastructure complexity, fewer failure points

### When to Use Self-Managed Docker Instead?

- **Very high scale** (hundreds of concurrent projects → self-hosting cheaper)
- **Specific infrastructure requirements** (custom networking, specialized hardware)
- **Vendor lock-in concerns** (must own infrastructure)
- **Railway proves inadequate** (POC reveals blockers)

### Next Steps

1. **Build Railway POC (1-2 days):**
   - Deploy Expo app to Railway
   - Test Metro bundler + QR code + Expo Go
   - Validate performance and costs

2. **Update Phase 4 Spec:**
   - Use Railway as primary sandbox for mobile
   - Document Railway architecture
   - Revise cost estimates

3. **Proceed with Phase 4 after Phase 2 & 3 completion**

---

## References & Sources

### Railway Documentation
- [Railway Pricing](https://railway.com/pricing)
- [Railway Pricing Plans](https://docs.railway.com/reference/pricing/plans)
- [Deploy Node.js TypeScript WebSockets](https://railway.com/deploy/DZV--w)
- [WebSocket Connection FAQ](https://station.railway.com/questions/web-socket-connection-failed-bec532a2)

### Railway + Expo
- [Deploy Expo-Open-OTA on Railway](https://railway.com/template/MGW3k1)

### Railway Comparisons
- [Railway vs Render](https://docs.railway.com/maturity/compare-to-render)
- [6 Best Railway Alternatives](https://northflank.com/blog/railway-alternatives)

### Expo + Docker
- [Dev Container for React Native with Expo](https://dev.to/animusna/dev-container-for-react-native-with-expo-f7j)
- [Dockerized React Native](https://github.com/eriknastesjo/dockerized-react-native)
- [Docker Expo App](https://github.com/CJSantee/docker-expo)

### Metro Bundler
- [Metro Bundler Documentation](https://metrobundler.dev/)
- [Expo Metro Guide](https://docs.expo.dev/guides/customizing-metro/)

---

**Analysis Complete:** 2026-01-04
**Recommendation:** ✅ Railway.app (Primary), Self-Managed Docker (Fallback)
**Status:** Ready for POC validation
