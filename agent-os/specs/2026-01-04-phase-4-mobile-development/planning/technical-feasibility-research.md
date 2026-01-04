# Technical Feasibility Research: Vercel Sandbox + Expo Compatibility

**Research Date:** 2026-01-04
**Researcher:** Claude (Sonnet 4.5)
**Status:** ❌ CRITICAL BLOCKER IDENTIFIED

---

## Executive Summary

**FINDING:** Vercel Sandbox **CANNOT** support Expo/React Native development environments with Metro bundler.

**REASON:** Vercel Sandbox is NOT designed for long-running processes like Metro bundler. It's optimized for ephemeral code execution, not persistent development servers.

**RECOMMENDATION:** Use alternative sandbox solution for Phase 4 mobile development.

---

## Research Findings

### 1. Vercel Sandbox Capabilities

**What Vercel Sandbox IS:**
- Ephemeral compute primitive for safely running untrusted code
- Designed for AI agents, code generation, and isolated execution
- Based on Amazon Linux 2023 with Node.js, Python, Bun runtimes
- Supports npm, pnpm, yarn, apt package managers
- Maximum runtime: 5 hours (Pro/Enterprise), 45 minutes (Hobby), default 5 minutes
- Full sudo access, 2048 MB memory per vCPU

**What Vercel Sandbox is NOT:**
- ❌ NOT suitable for long-running processes (per official documentation)
- ❌ NOT designed for Metro bundler or persistent development servers
- ❌ NOT built for React Native/Expo mobile development
- ❌ NO first-class support for React Native/Expo (confirmed by Vercel moderators)

**Sources:**
- [Vercel Sandbox Documentation](https://vercel.com/docs/vercel-sandbox)
- [Vercel Community Discussion](https://community.vercel.com/t/what-the-best-way-to-use-v0-for-react-native-expo-apps/10031)
- [Run untrusted code with Vercel Sandbox](https://vercel.com/changelog/run-untrusted-code-with-vercel-sandbox)

---

### 2. Vercel + Expo Integration (What Actually Works)

**✅ Expo Web Deployment on Vercel:**
- Expo web apps can be deployed to Vercel hosting platform
- Uses standard `vercel.json` with `expo export -p web` build command
- This is NOT the same as running Expo CLI in Vercel Sandbox

**✅ Vercel AI SDK + Expo:**
- Vercel AI SDK officially supports Expo 52+
- AI-powered features can be added to React Native apps
- This is client-side integration, not sandbox execution

**❌ Vercel V0 + React Native:**
- V0 is "primarily intended for Next.js applications on web"
- No first-class support for React Native/Expo
- "Add to Codebase" feature fails for Expo projects
- No preview functionality for Expo apps
- Users must download ZIP files and run locally

**Sources:**
- [Streamlining Expo Web Deployment on Vercel](https://medium.com/@PreetamGahlot/streamlining-the-deployment-of-expo-web-applications-on-vercel-2e3f32f3b39e)
- [Vercel AI SDK Expo Support](https://ai-sdk.dev/docs/getting-started/expo)
- [V0 React Native Community Discussion](https://community.vercel.com/t/what-the-best-way-to-use-v0-for-react-native-expo-apps/10031)

---

### 3. Metro Bundler Requirements

**What Metro Bundler Needs:**
- Long-running Node.js process (continuously watching files)
- WebSocket connections for hot reloading
- File system watchers for code changes
- Port exposure (default: 8081 for Metro, 19000+ for Expo)
- Persistent state between file changes

**Why This Conflicts with Vercel Sandbox:**
- Vercel Sandbox is designed for **ephemeral** execution
- Default timeout: 5 minutes (max: 5 hours)
- Optimized for short-lived tasks, not continuous servers
- Not designed for WebSocket-heavy applications

**Metro Bundler in Expo:**
- Required for Expo Go preview (QR code scanning)
- Required for hot reloading in development
- Cannot be easily stopped and restarted without losing state

**Sources:**
- [Metro Bundler Documentation](https://metrobundler.dev/)
- [Expo Metro Guide](https://docs.expo.dev/guides/customizing-metro/)
- [React Native Metro Docs](https://reactnative.dev/docs/metro)

---

## Alternative Solutions

### ✅ Option 1: Docker Containers (RECOMMENDED)

**Advantages:**
- ✅ Proven solution with multiple working examples
- ✅ Can run Metro bundler as long-running process
- ✅ Full control over environment and dependencies
- ✅ Can be cloud-hosted (AWS EC2, Digital Ocean, GCP)
- ✅ Many open-source templates available

**Technical Implementation:**
- Use Docker containers for Expo development environment
- Metro bundler runs inside container with port exposure
- Tunnel mode (`--tunnel`) for remote access via ngrok
- QR code generation works with tunneled URL

**Available Resources:**
- [Dev Container for React Native with Expo](https://dev.to/animusna/dev-container-for-react-native-with-expo-f7j)
- [Running Expo/React Native in Docker](https://dev.to/ghost/running-exporeact-native-in-docker-4hme)
- [Expo Docker GitHub Repos](https://github.com/sonyarouje/expo-docker)
- [How to Run Expo Web in Docker](https://www.rockyourcode.com/how-to-run-react-native-expo-web-in-a-docker-container/)

**Architecture:**
```
User → Turbocat UI → Docker Container (Expo + Metro)
                           ↓
                      Expo Tunnel (ngrok)
                           ↓
                      QR Code → Expo Go
```

**Implementation Complexity:** Medium
**Cost:** Low to Medium (cloud hosting)
**Maintenance:** Medium (Docker image updates)

---

### ✅ Option 2: Expo Snack (Open-Source, Self-Hosted)

**Advantages:**
- ✅ Built specifically for React Native preview
- ✅ Open-source (MIT license)
- ✅ Can be self-hosted
- ✅ Supports both Expo Go and web preview
- ✅ Official Expo solution

**Technical Details:**
- **Repository:** [github.com/expo/snack](https://github.com/expo/snack)
- **Tech Stack:** TypeScript (95.7%), monorepo with Yarn/Turbo
- **Components:**
  - Website (snack.expo.dev)
  - Snack SDK (for custom integrations)
  - Snackager (package bundler)
  - Runtime (web-player with react-native-web)

**Features:**
- Dynamically bundles and compiles code
- Runs in Expo Go or web-player
- Live editing with real-time preview
- QR code support for device testing
- Embeddable previews

**Limitations:**
- Requires hosting infrastructure for self-hosted version
- May have package/module limitations
- Documentation for self-hosting not extensive

**Sources:**
- [Expo Snack GitHub](https://github.com/expo/snack)
- [Expo Snack](https://snack.expo.dev/)
- [Building Expo Snack Case Study](https://www.callstack.com/case-studies/expo)

**Implementation Complexity:** High (self-hosting setup)
**Cost:** Medium to High (hosting infrastructure)
**Maintenance:** Medium to High (keep updated with Expo versions)

---

### ⚠️ Option 3: E2B Sandboxes

**What E2B Offers:**
- Secure cloud sandboxes powered by Firecracker
- Python & JS/TS SDK for code execution
- Jupyter server + FastAPI architecture
- Containerized isolation

**Limitations for React Native:**
- ❌ NO specific React Native documentation
- ❌ Designed for server-side Node.js, not mobile frameworks
- ❌ No mention of Metro bundler support
- ❌ May have similar limitations to Vercel Sandbox

**Sources:**
- [E2B Documentation](https://e2b.dev/docs/sdk-reference/js-sdk/v1.0.2/sandbox)
- [E2B Code Interpreter](https://github.com/e2b-dev/code-interpreter)

**Verdict:** NOT recommended for Phase 4 without further validation

**Implementation Complexity:** Unknown (needs POC)
**Cost:** Unknown
**Maintenance:** Unknown

---

### ❌ Option 4: React Native Web Only (Fallback)

**Approach:**
- Skip native Expo Go preview entirely
- Use React Native Web for browser-based preview only
- AI generates React Native code that runs via RN Web

**Advantages:**
- ✅ Can work in Vercel Sandbox (web preview only)
- ✅ No Metro bundler required
- ✅ Simpler architecture

**Limitations:**
- ❌ NOT full React Native experience (web-compatible components only)
- ❌ Many React Native components don't work on web
- ❌ No native device testing
- ❌ Defeats purpose of Phase 4 (mobile development)
- ❌ Does NOT meet MVP requirements (Level 3: Full Expo Go preview)

**Verdict:** Only acceptable as temporary fallback, NOT as final solution

---

## Technical Comparison Matrix

| Solution | Expo Go Support | Metro Bundler | QR Codes | Self-Hosted | Cloud Hosted | Complexity | Cost | Recommended |
|----------|-----------------|---------------|----------|-------------|--------------|------------|------|-------------|
| **Vercel Sandbox** | ❌ No | ❌ No | ❌ No | N/A | ✅ Yes | Low | Low | ❌ **NO** |
| **Docker Containers** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Medium | Low-Med | ✅ **YES** |
| **Expo Snack (Self-hosted)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | High | Med-High | ✅ **YES** |
| **E2B Sandboxes** | ❓ Unknown | ❓ Unknown | ❓ Unknown | ❌ No | ✅ Yes | Unknown | Unknown | ⚠️ Needs POC |
| **React Native Web** | ❌ No | ❌ No | ❌ No | N/A | ✅ Yes | Low | Low | ❌ Fallback only |

---

## Recommendations

### Primary Recommendation: Docker Containers

**Use Docker containers for Phase 4 mobile sandbox environment.**

**Rationale:**
1. **Proven Technology:** Multiple working examples exist
2. **Meets All Requirements:** Supports Expo Go, Metro bundler, QR codes
3. **Flexible Deployment:** Can be self-hosted or cloud-hosted
4. **Cost-Effective:** Low hosting costs (AWS EC2, Digital Ocean droplets)
5. **Battle-Tested:** Community has solved common issues
6. **Isolation:** Each project gets its own container
7. **Scalable:** Can spin up containers on-demand

**Implementation Plan:**
1. Create Expo Docker image with Node.js LTS, Expo CLI, Metro bundler
2. Set up container orchestration (Docker Compose or Kubernetes)
3. Implement Metro tunnel mode for remote access (ngrok integration)
4. QR code generation from tunneled URL
5. Container lifecycle management (start, stop, cleanup)
6. Cloud hosting on AWS EC2 or Digital Ocean

**Reference Implementations:**
- [Dev Container for React Native with Expo](https://dev.to/animusna/dev-container-for-react-native-with-expo-f7j)
- [Expo Docker Image](https://github.com/sonyarouje/expo-docker)
- [Dockerized React Native](https://github.com/taher07/dockerized-react-native)

---

### Secondary Recommendation: Expo Snack (Long-term)

**Consider Expo Snack for future enhancement (Phase 5+).**

**Rationale:**
- Official Expo solution
- Best developer experience
- Most feature-complete
- Can be integrated into Turbocat UI seamlessly

**Why Not Primary:**
- Higher implementation complexity (self-hosting monorepo)
- Requires significant infrastructure investment
- Steeper learning curve
- May have limitations on package ecosystem

**Use Case:**
- Start with Docker containers for Phase 4 MVP
- Migrate to self-hosted Expo Snack in Phase 5 if needed
- Or use hosted Expo Snack API if available (simplest)

---

### Fallback: React Native Web

**Only use if Docker/Snack prove unfeasible.**

This does NOT meet Phase 4 MVP requirements but could serve as temporary workaround.

---

## Architecture Impact

### Current Architecture (Web Only)
```
User → Turbocat UI → Vercel Sandbox (Next.js) → Preview
```

### New Architecture (Web + Mobile)
```
User → Turbocat UI → Platform Selector
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
              [Web Path]    [Mobile Path]
                    ↓             ↓
            Vercel Sandbox   Docker Container
            (Next.js)        (Expo + Metro)
                    ↓             ↓
            Web Preview      Expo Tunnel
                                  ↓
                             QR Code → Expo Go
```

### UI Changes Required

**Chat Interface:**
- Add platform selector (Web/Mobile toggle)
- Visual indication of selected platform
- Different preview area for mobile (QR code display)

**Preview Area:**
- Web: iframe with Vercel Sandbox preview (existing)
- Mobile: QR code + Metro bundler status + logs
- Instructions for installing Expo Go

**Backend Changes:**
- Route mobile projects to Docker container API
- Manage Docker container lifecycle
- Generate QR codes from tunnel URLs
- Monitor Metro bundler status

---

## Next Steps

### Immediate Actions (Before Phase 4 Specification)

1. **Validate Docker Approach (1-2 days POC):**
   - [ ] Set up basic Expo Docker container locally
   - [ ] Test Metro bundler with tunnel mode
   - [ ] Generate QR code and test with Expo Go
   - [ ] Measure container startup time
   - [ ] Test container cleanup and resource usage

2. **Select Cloud Provider (1 day research):**
   - [ ] Compare AWS EC2, Digital Ocean, GCP pricing
   - [ ] Evaluate container orchestration options
   - [ ] Estimate monthly costs for expected usage
   - [ ] Test container deployment on selected provider

3. **Document Technical Specs (1 day):**
   - [ ] Docker image configuration
   - [ ] Container resource requirements
   - [ ] Network configuration (ports, tunneling)
   - [ ] API endpoints for container management

4. **Update Phase 4 Requirements (immediate):**
   - [ ] Update requirements document with Docker solution
   - [ ] Revise architecture diagrams
   - [ ] Update effort estimates based on Docker complexity
   - [ ] Identify risks specific to Docker approach

### After Validation

5. **Run `/write-spec`** to create detailed Phase 4 specification
6. Wait for Phase 2 & 3 completion
7. Begin Phase 4 implementation

---

## Risks & Mitigations (Updated)

### Risk 1: Docker Container Performance
**Risk:** Containers may have slow startup time, impacting user experience
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:** Pre-warm containers, implement container pooling, optimize Docker image size
**Fallback:** Use Expo Snack hosted API if container performance unacceptable

### Risk 2: Tunnel Reliability
**Risk:** ngrok tunnels may be unstable or rate-limited
**Likelihood:** Medium
**Impact:** High (breaks QR code preview)
**Mitigation:** Use Expo's official tunnel service, implement fallback tunneling options, consider custom reverse proxy
**Fallback:** React Native Web preview as temporary workaround

### Risk 3: Cloud Hosting Costs
**Risk:** Docker container hosting costs may exceed budget
**Likelihood:** Low to Medium
**Impact:** Medium
**Mitigation:** Implement aggressive container cleanup, use spot instances, monitor usage closely
**Fallback:** Reduce max concurrent mobile projects, optimize container resource limits

### Risk 4: Container Security
**Risk:** User code running in Docker containers may pose security risks
**Likelihood:** Low (with proper configuration)
**Impact:** High
**Mitigation:** Use Docker security best practices, network isolation, resource limits, regular security audits
**Fallback:** Use more restrictive sandboxing (gVisor, Kata Containers)

### Risk 5: Expo/Metro Version Compatibility
**Risk:** Expo and Metro versions may have breaking changes
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:** Pin Expo/Metro versions, test updates in staging, maintain compatibility matrix
**Fallback:** Support multiple Expo versions via different Docker images

---

## Cost Estimates (Docker Approach)

### Cloud Hosting Options

**AWS EC2:**
- t3.medium (2 vCPU, 4 GB RAM): ~$30/month per instance
- Estimated need: 5-10 instances for concurrent users
- Total: $150-300/month

**Digital Ocean:**
- Basic Droplet (2 vCPU, 4 GB RAM): ~$24/month
- Estimated need: 5-10 droplets
- Total: $120-240/month

**Google Cloud Platform:**
- e2-medium (2 vCPU, 4 GB RAM): ~$25/month
- Estimated need: 5-10 instances
- Total: $125-250/month

### Additional Costs
- Docker registry: $0-50/month (Docker Hub free tier or private registry)
- Load balancer: $10-20/month
- Monitoring: $0-50/month (free tier or paid service)
- ngrok/tunneling: $0-100/month (free tier may suffice, Pro if needed)

### Total Estimated Monthly Cost
**$250-500/month** for moderate usage (10-20 concurrent mobile projects)

### Cost Optimization Strategies
- Container auto-scaling (scale down during low usage)
- Container timeout/cleanup (kill idle containers after 30 minutes)
- Spot instances (70% cost savings on AWS)
- Shared containers for multiple users (if isolation allows)

---

## Conclusion

**Vercel Sandbox is NOT suitable for Phase 4 mobile development.**

**Recommended Path Forward:**
1. Use **Docker containers** for Phase 4 MVP
2. Build POC to validate approach (1-2 days)
3. Select cloud provider and configure hosting
4. Update Phase 4 specification with Docker architecture
5. Consider Expo Snack migration in Phase 5+ for enhanced experience

**This unblocks Phase 4 development** with a proven, cost-effective solution.

---

## References & Sources

### Vercel Sandbox
- [Vercel Sandbox Documentation](https://vercel.com/docs/vercel-sandbox)
- [Vercel Sandbox NPM Package](https://www.npmjs.com/package/@vercel/sandbox)
- [Safely Running AI Generated Code](https://vercel.com/guides/running-ai-generated-code-sandbox)
- [Node.js 24 LTS on Sandbox](https://vercel.com/changelog/node-js-24-lts-is-now-available-on-sandbox)

### Vercel + Expo Integration
- [V0 React Native Discussion](https://community.vercel.com/t/what-the-best-way-to-use-v0-for-react-native-expo-apps/10031)
- [Expo Web on Vercel](https://medium.com/@PreetamGahlot/streamlining-the-deployment-of-expo-web-applications-on-vercel-2e3f32f3b39e)
- [Vercel AI SDK + Expo](https://ai-sdk.dev/docs/getting-started/expo)
- [React Native Vercel AI GitHub](https://github.com/bidah/react-native-vercel-ai)

### Metro Bundler
- [Metro Bundler Official Docs](https://metrobundler.dev/)
- [Expo Metro Guide](https://docs.expo.dev/guides/customizing-metro/)
- [React Native Metro](https://reactnative.dev/docs/metro)
- [Why Metro? - Expo](https://docs.expo.dev/guides/why-metro/)

### Docker + React Native
- [Dev Container for React Native with Expo](https://dev.to/animusna/dev-container-for-react-native-with-expo-f7j)
- [Dockerize React Native](https://medium.com/@ashaymotiwala/dockerize-your-react-native-application-the-right-way-541e049c59cf)
- [Expo in Docker](https://dev.to/ghost/running-exporeact-native-in-docker-4hme)
- [Expo Docker GitHub](https://github.com/sonyarouje/expo-docker)
- [Dockerized React Native](https://github.com/taher07/dockerized-react-native)

### Expo Snack
- [Expo Snack](https://snack.expo.dev/)
- [Expo Snack GitHub](https://github.com/expo/snack)
- [Expo Snack SDK](https://github.com/expo/snack/blob/main/docs/snack-sdk.md)
- [Building Expo Snack - Callstack](https://www.callstack.com/case-studies/expo)

### E2B
- [E2B Sandbox Documentation](https://e2b.dev/docs/sdk-reference/js-sdk/v1.0.2/sandbox)
- [E2B Code Interpreter](https://github.com/e2b-dev/code-interpreter)
- [E2B NPM Package](https://www.npmjs.com/package/@e2b/sdk)

---

**Research Complete:** 2026-01-04
**Recommendation:** Docker Containers for Phase 4 MVP
**Status:** Ready for POC validation
