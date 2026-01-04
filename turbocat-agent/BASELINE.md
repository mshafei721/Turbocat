# Turbocat Coding Agent - Baseline Documentation

**Version:** 1.0.0
**Date:** 2026-01-02
**Status:** Deployed (Sandbox Testing Deferred)

---

## Overview

Turbocat Coding Agent is a multi-agent AI coding platform built on the Vercel Coding Agent Template. It enables AI agents (Claude, OpenAI, Gemini) to automatically execute coding tasks on GitHub repositories.

---

## Working Features

### Authentication
| Feature | Status | Details |
|---------|--------|---------|
| GitHub OAuth | ✅ Working | Sign in with GitHub account |
| Session Management | ✅ Working | JWE-encrypted sessions persist across page refreshes |
| Sign Out | ✅ Working | Clears session and redirects to home |

### User Interface
| Feature | Status | Details |
|---------|--------|---------|
| Homepage | ✅ Working | Loads at production and local URLs |
| Sign In Dialog | ✅ Working | Modal with GitHub sign-in option |
| AI Agent Selector | ✅ Working | Claude, OpenAI, Gemini options available |
| Model Selector | ✅ Working | Sonnet 4.5 and other models selectable |
| Task Input | ✅ Working | Text area for describing coding tasks |
| Dark/Light Theme | ✅ Working | Theme toggle available |

### Database
| Feature | Status | Details |
|---------|--------|---------|
| PostgreSQL Connection | ✅ Working | Neon serverless PostgreSQL |
| User Records | ✅ Working | Created on first sign-in |
| Task Records | ✅ Working | Stored when tasks are created |
| Session Storage | ✅ Working | Encrypted session data |

### API Endpoints
| Endpoint | Status | Details |
|----------|--------|---------|
| `/api/auth/signin/github` | ✅ Working | Initiates GitHub OAuth |
| `/api/auth/github/callback` | ✅ Working | Handles OAuth callback |
| `/api/auth/github/status` | ✅ Working | Returns auth status |
| `/api/auth/info` | ✅ Working | Returns user info |
| `/api/auth/signout` | ✅ Working | Clears session |
| `/api/tasks` | ✅ Working | CRUD for tasks |
| `/api/connectors` | ✅ Working | Returns available connectors |

### Infrastructure
| Component | Status | Details |
|-----------|--------|---------|
| Vercel Deployment | ✅ Working | Production build successful |
| Next.js 16.0.10 | ✅ Working | Turbopack build |
| Environment Variables | ✅ Working | 14 variables configured |
| SSL/HTTPS | ✅ Working | Automatic via Vercel |

---

## Known Limitations

### Critical Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Vercel Sandbox requires Pro plan** | AI agents cannot execute code in isolated environments | Use local development or upgrade to Vercel Pro ($20/month) |
| **Google OAuth not supported** | Users cannot sign in with Google | Use GitHub OAuth (template limitation) |

### Minor Limitations

| Limitation | Impact | Notes |
|------------|--------|-------|
| Shiki package warnings during build | None (cosmetic) | Build completes successfully |
| Husky .git warning during Vercel build | None (cosmetic) | Git not available in build environment |

---

## Deferred Items

| Item | Reason | Resolution |
|------|--------|------------|
| AI Sandbox Execution | Requires Vercel Pro plan | Upgrade after project completion |
| End-to-End Branch Creation Test | Depends on sandbox | Test after Vercel Pro upgrade |
| Vercel OAuth Setup | Optional, GitHub works | Can add later if needed |

---

## Configuration

### Environment Variables (Production)

| Variable | Purpose | Status |
|----------|---------|--------|
| `POSTGRES_URL` | Neon database connection | ✅ Configured |
| `SANDBOX_VERCEL_TOKEN` | Vercel API access for sandbox | ✅ Configured |
| `SANDBOX_VERCEL_TEAM_ID` | Vercel team identifier | ✅ Configured |
| `SANDBOX_VERCEL_PROJECT_ID` | Vercel project identifier | ✅ Configured |
| `JWE_SECRET` | Session encryption key | ✅ Configured |
| `ENCRYPTION_KEY` | Token encryption key | ✅ Configured |
| `NEXT_PUBLIC_AUTH_PROVIDERS` | Enabled auth providers | ✅ `github` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth client ID | ✅ Configured |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | ✅ Configured |
| `ANTHROPIC_API_KEY` | Claude AI access | ✅ Configured |
| `OPENAI_API_KEY` | OpenAI access | ✅ Configured |
| `GEMINI_API_KEY` | Gemini AI access | ✅ Configured |
| `MAX_MESSAGES_PER_DAY` | Rate limiting | ✅ `10` |
| `MAX_SANDBOX_DURATION` | Sandbox timeout (seconds) | ✅ `300` |

### OAuth Configuration

**GitHub OAuth App:**
- **App Name:** Turbocat Coding Agent
- **Homepage URL:** `https://turbocat-agent.vercel.app`
- **Callback URL:** `https://turbocat-agent.vercel.app/api/auth/github/callback`
- **Scopes:** `repo`, `read:user`, `user:email`

---

## URLs & Resources

| Resource | URL |
|----------|-----|
| **Production App** | https://turbocat-agent.vercel.app |
| **Local Development** | http://localhost:3000 |
| **GitHub Repository** | https://github.com/mshafei721/turbocat-agent |
| **Vercel Dashboard** | https://vercel.com/mohammed-elshafeis-projects/turbocat-agent |
| **Neon Database** | https://console.neon.tech |
| **GitHub OAuth Settings** | https://github.com/settings/developers |

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.0.10 |
| Runtime | Node.js | 24.x (Vercel) / 22.x (local) |
| Package Manager | pnpm | 10.x |
| Database | PostgreSQL (Neon) | Serverless |
| ORM | Drizzle ORM | 0.36.4 |
| Authentication | Arctic | 3.7.0 |
| AI SDK | Vercel AI SDK | 5.0.51 |
| UI Components | Radix UI | Various |
| Styling | Tailwind CSS | 4.1.x |

---

## Cost Estimates

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | Free |
| Vercel | Pro (required for sandbox) | $20 |
| Neon PostgreSQL | Free tier | Free |
| Anthropic API | Usage-based | ~$5-20 |
| OpenAI API | Usage-based | ~$5-20 |
| Gemini API | Free tier | Free |
| **Total (current)** | | **Free** |
| **Total (with Pro)** | | **~$25-60/month** |

---

## Testing Status

| Test Type | Status | Notes |
|-----------|--------|-------|
| Build | ✅ Pass | Turbopack build successful |
| Deployment | ✅ Pass | Production deployment working |
| OAuth Flow | ✅ Pass | GitHub sign-in working |
| Database Connection | ✅ Pass | Neon PostgreSQL connected |
| User Creation | ✅ Pass | Records created on sign-in |
| Session Persistence | ✅ Pass | Sessions survive page refresh |
| AI Sandbox Execution | ⏸️ Deferred | Requires Vercel Pro |
| Branch Creation | ⏸️ Deferred | Requires Vercel Pro |

---

## Next Steps

1. **Upgrade to Vercel Pro** - Enable AI sandbox functionality
2. **Test AI Agent Execution** - Verify Claude, OpenAI, Gemini agents work
3. **Test Branch Creation** - Verify end-to-end flow from task to PR
4. **Production Monitoring** - Set up error tracking and analytics

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-02 | 1.0.0 | Initial baseline documentation |

---

*Generated as part of Turbocat Coding Agent deployment spec.*
