# Requirements Summary

## Feature: Fork and Deploy Vercel Coding Agent Template

**Phase:** 1 (Foundation)
**Roadmap Item:** 1
**Effort Estimate:** M (1 week)

---

## Gathered Requirements

### Vercel Account & Deployment
| Question | Answer |
|----------|--------|
| Vercel account | ✅ Yes, existing account |
| Account type | Personal account |
| Domain preference | Default Vercel subdomain (e.g., turbocat.vercel.app) |

### Authentication
| Question | Answer |
|----------|--------|
| Auth providers | GitHub + Google + Email auth |
| OAuth apps configured | Neither configured - needs setup guidance |

**Action Required:** Guide user through setting up:
- GitHub OAuth App
- Google OAuth App
- Email authentication (likely via NextAuth email provider or magic links)

### AI Agents
| Question | Answer |
|----------|--------|
| AI agents to enable | All available (Claude, OpenAI, Gemini) |
| API keys available | ✅ All three (Anthropic, OpenAI, Google) |

### Database
| Question | Answer |
|----------|--------|
| Database provider | Neon (auto-provision via Vercel) |

### Configuration
| Question | Answer |
|----------|--------|
| Task limit per user/day | 10 tasks/day |
| Max sandbox duration | 300 minutes (5 hours) - Default |

### Deployment Approach
| Question | Answer |
|----------|--------|
| Deployment method | Fork repository to user's GitHub |
| Local testing | Yes, test locally before production deploy |

### Visual Assets
| Question | Answer |
|----------|--------|
| Visual assets | Generate architecture diagrams |

---

## Environment Variables Checklist

### Required - Must Configure
- [ ] `POSTGRES_URL` - Neon auto-provisions this
- [ ] `SANDBOX_VERCEL_TOKEN` - Vercel API token for sandbox
- [ ] `SANDBOX_VERCEL_TEAM_ID` - Vercel team ID (or personal account ID)
- [ ] `SANDBOX_VERCEL_PROJECT_ID` - Project ID for sandbox
- [ ] `JWE_SECRET` - Session encryption key (generate random)
- [ ] `ENCRYPTION_KEY` - Token encryption key (generate random)

### Authentication - Must Configure
- [ ] `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth app secret
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (to add)
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret (to add)

### AI API Keys - User Has These
- [ ] `ANTHROPIC_API_KEY` - Claude API key ✅
- [ ] `OPENAI_API_KEY` - OpenAI API key ✅
- [ ] `GEMINI_API_KEY` - Google Gemini API key ✅

### Optional Configuration
- [ ] `MAX_MESSAGES_PER_DAY` = 10
- [ ] `MAX_SANDBOX_DURATION` = 300

---

## Deployment Sequence

1. **Fork Repository**
   - Fork `vercel-labs/coding-agent-template` to user's GitHub

2. **Local Development Setup**
   - Clone forked repo locally
   - Install dependencies with pnpm
   - Configure `.env.local` with all required variables
   - Run database migrations
   - Test locally

3. **OAuth App Setup** (User needs guidance)
   - Create GitHub OAuth App
   - Create Google OAuth App
   - Configure callback URLs

4. **Deploy to Vercel**
   - Connect forked repo to Vercel
   - Configure environment variables
   - Enable Neon PostgreSQL integration
   - Deploy

5. **Verify Deployment**
   - Test authentication flow
   - Test task creation
   - Test sandbox execution
   - Document baseline behavior

---

## Notes

- This is Phase 1, Item 1 - CRITICAL foundation
- No other phases can begin until this is complete and verified
- User has zero technical experience - provide detailed guidance
- Reference: https://github.com/vercel-labs/coding-agent-template
