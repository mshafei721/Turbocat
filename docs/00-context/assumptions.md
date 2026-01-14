# Core Assumptions

## Product Assumptions

### User Assumptions
1. **Non-Technical Users**
   - Users have app ideas but lack coding skills
   - Users can describe what they want in natural language
   - Users understand basic app concepts (buttons, screens, data)
   - Users are willing to iterate through conversation

2. **Mobile-First Mindset**
   - Primary use case is mobile app creation
   - Users want apps in the App Store
   - Users have Apple devices to test (or will trust preview)
   - Web apps are secondary but important

3. **Time Sensitivity**
   - Users want results quickly (minutes, not days)
   - Users will abandon if preview takes too long
   - Users expect instant feedback on changes

### Technical Assumptions

#### Current Stack (To Be Verified)
1. **Frontend**
   - Next.js 14+ with App Router
   - React 18+ with Server Components
   - Tailwind CSS for styling
   - TypeScript for type safety

2. **Backend**
   - Node.js/TypeScript backend
   - Express or NestJS framework
   - PostgreSQL or similar SQL database
   - Supabase or similar auth provider

3. **AI Integration**
   - Claude (Anthropic) as primary LLM
   - Streaming responses for real-time updates
   - Function calling for structured output
   - Context management for long conversations

4. **Mobile Preview**
   - Expo for React Native development
   - Live preview via Expo Go or similar
   - Build service for production apps
   - EAS Build for App Store submissions

### Infrastructure Assumptions
1. **Hosting**
   - Vercel for frontend hosting
   - Scalable backend hosting (AWS/GCP/Railway)
   - CDN for static assets
   - Real-time websocket support

2. **Deployment**
   - CI/CD via GitHub Actions or Vercel
   - Automated testing pipeline
   - Staged rollouts (dev → staging → prod)
   - Rollback capability

3. **Security**
   - OAuth 2.0 for authentication
   - JWT tokens for sessions
   - Encrypted credentials storage
   - API rate limiting
   - HTTPS everywhere

### Business Assumptions
1. **Monetization**
   - Freemium model with limited free tier
   - Pay per app or subscription
   - Enterprise plans for teams
   - Marketplace revenue share (future)

2. **Growth**
   - Product-led growth (PLG)
   - Viral loop through shared apps
   - App Store presence drives discovery
   - Content marketing for SEO

3. **Support**
   - Self-service documentation
   - Community forum/Discord
   - Email support for paid users
   - Live chat for enterprise

## Risk Assumptions

### High Risk
1. **AI Reliability**
   - Risk: AI generates broken code
   - Mitigation: Validation layer, automated testing
   - Assumption: 95%+ success rate achievable

2. **App Store Approval**
   - Risk: Generated apps rejected by Apple
   - Mitigation: Follow HIG, review checklist, pre-validation
   - Assumption: Can achieve >80% approval rate

3. **Legal/IP Issues**
   - Risk: Copyright claims on generated code
   - Mitigation: Train on licensed data, clear ToS
   - Assumption: Using commercially licensed LLMs protects us

### Medium Risk
1. **Performance at Scale**
   - Risk: Slow response as user base grows
   - Mitigation: Caching, efficient prompts, load balancing
   - Assumption: Can handle 10k DAU with current architecture

2. **Cost of AI Inference**
   - Risk: AI costs exceed revenue
   - Mitigation: Prompt optimization, caching, tiered pricing
   - Assumption: Margins sustainable at $20/month average revenue per user

### Low Risk
1. **Technical Debt**
   - Risk: Move fast now, pay later
   - Mitigation: Refactor in phases, test coverage
   - Assumption: Acceptable trade-off for speed to market

## Constraints

### Hard Constraints
1. **iOS First** - Apple ecosystem required for mobile publishing
2. **English Only** - Initial launch in English (i18n later)
3. **Web Required** - Need web interface for development
4. **Real-Time Preview** - Non-negotiable for UX

### Soft Constraints
1. **Mobile Preview** - Could fall back to screenshots if live preview fails
2. **Backend Generation** - Could start frontend-only
3. **Multi-Platform** - Could focus iOS only initially
4. **Collaboration** - Single user MVP acceptable

## Validation Status

| Assumption | Validated? | Method | Confidence |
|------------|-----------|--------|------------|
| Users want AI app builder | ✅ Yes | Market research, waitlist | High |
| Non-tech users can describe apps | ✅ Yes | User interviews | High |
| Real-time preview is key | ✅ Yes | User testing | High |
| Claude is sufficient LLM | 🟡 Partial | Technical testing | Medium |
| Current architecture scales | ❌ No | Needs load testing | Low |
| App Store approval achievable | ❌ No | Needs real submissions | Low |
| Monetization model viable | ❌ No | Needs pricing tests | Low |

## Dependencies

### External Dependencies
1. **Anthropic (Claude)** - Core AI capability
2. **Expo** - Mobile build and preview
3. **Apple Developer Program** - App Store publishing
4. **OAuth Providers** - Google, Apple for auth
5. **Vercel/Hosting** - Infrastructure

### Internal Dependencies
1. **Design System** - AI Native theme must be complete
2. **Prompt Engineering** - Effective prompts for code generation
3. **Testing Framework** - Automated validation of generated apps
4. **Documentation** - User guides and API docs

## What We Don't Assume

### Explicitly Out of Scope
1. We do NOT assume users can code
2. We do NOT assume users will read documentation
3. We do NOT assume users understand technical terms
4. We do NOT assume users have development experience
5. We do NOT assume perfect AI output (validation required)
6. We do NOT assume users will pay without seeing value first

### Areas of Uncertainty
1. **Optimal pricing** - Needs experimentation
2. **Feature priority** - Will learn from usage data
3. **Platform mix** - iOS vs Android vs Web usage patterns
4. **Retention drivers** - What makes users come back?

---

**Document Status:** Living Document
**Last Updated:** 2026-01-12
**Review Trigger:** When major assumptions validated or invalidated
**Owner:** Product & Engineering Teams
