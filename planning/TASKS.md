# Phase 1: Foundation Fixes - Tasks

## Task 1: Security - Credential Rotation (USER ACTION)
- [x] 1.1 User revokes all exposed credentials
- [x] 1.2 User generates new credentials
- [x] 1.3 Verify .env.local is in .gitignore
- [x] 1.4 Remove .env.local from git tracking if needed

**Acceptance:** No secrets in git history for new commits

---

## Task 2: Dashboard Layout Refactor
- [x] 2.1 Read current layout.tsx and DashboardPage.tsx
- [x] 2.2 Create new layout structure with sidebar
- [x] 2.3 Update DashboardPage to remove inline sidebar
- [x] 2.4 Verify settings page renders with sidebar
- [x] 2.5 Verify profile page renders with sidebar
- [x] 2.6 Verify project/[id] page renders with sidebar

**Acceptance:** Sidebar visible on all dashboard routes

---

## Task 3: Fix Broken Navigation Links
- [x] 3.1 Read LandingNav.tsx and identify broken links
- [x] 3.2 Read LandingFooter.tsx and identify broken links
- [x] 3.3 Remove or comment out broken external links
- [x] 3.4 Keep only functional internal links

**Acceptance:** No links lead to 404 pages

---

## Task 4: Fix Auth UI Broken Links
- [x] 4.1 Read AuthPage.tsx
- [x] 4.2 Remove forgot-password link (or make it no-op)
- [x] 4.3 Verify login/signup pages render correctly

**Acceptance:** No broken links in auth flow

---

## Task 5: Validation
- [x] 5.1 Run type-check
- [x] 5.2 Run lint
- [x] 5.3 Run tests
- [x] 5.4 Manual navigation verification

**Acceptance:** All checks pass, no visual regressions

---

# Phase 5: Agent SDK Refactoring - Tasks

## Task 1: Download Official Anthropic Skills
- [ ] 1.1 Create `.claude/skills/anthropic/` directory
- [ ] 1.2 Download algorithmic-art skill
- [ ] 1.3 Download brand-guidelines skill
- [ ] 1.4 Download canvas-design skill
- [ ] 1.5 Download doc-coauthoring skill
- [ ] 1.6 Download docx skill
- [ ] 1.7 Download frontend-design skill
- [ ] 1.8 Download internal-comms skill
- [ ] 1.9 Download mcp-builder skill
- [ ] 1.10 Download pdf skill
- [ ] 1.11 Download pptx skill
- [ ] 1.12 Download skill-creator skill
- [ ] 1.13 Download slack-gif-creator skill
- [ ] 1.14 Download theme-factory skill
- [ ] 1.15 Download web-artifacts-builder skill
- [ ] 1.16 Download webapp-testing skill
- [ ] 1.17 Download xlsx skill

**Acceptance:** All 16 skills in `.claude/skills/anthropic/`, each with valid SKILL.md

---

## Task 2: Install Agent SDK in Backend
- [ ] 2.1 Add `@anthropic-ai/claude-agent-sdk` to backend/package.json
- [ ] 2.2 Create `backend/src/services/agent-sdk/index.ts` wrapper
- [ ] 2.3 Create `backend/src/services/agent-sdk/types.ts` type definitions
- [ ] 2.4 Create `backend/src/services/agent-sdk/config.ts` configuration
- [ ] 2.5 Update backend environment template

**Acceptance:** `import { query } from '@anthropic-ai/claude-agent-sdk'` works in backend

---

## Task 3: Install Agent SDK in Frontend
- [ ] 3.1 Add `@anthropic-ai/claude-agent-sdk` to turbocat-agent/package.json
- [ ] 3.2 Create `turbocat-agent/lib/agent-sdk/index.ts` wrapper
- [ ] 3.3 Create `turbocat-agent/lib/agent-sdk/types.ts` type definitions
- [ ] 3.4 Create `turbocat-agent/lib/agent-sdk/client.ts` client-side adapter
- [ ] 3.5 Update frontend environment template

**Acceptance:** Agent SDK accessible from frontend lib modules

---

## Task 4: Configure Skills Loading and Permissions
- [ ] 4.1 Create/update `.claude/settings.json` with settingSources
- [ ] 4.2 Add "Skill" to allowed_tools list
- [ ] 4.3 Configure skill discovery for both anthropic/ and custom skills
- [ ] 4.4 Create skill registry integration

**Acceptance:** Skills from `.claude/skills/anthropic/` are discoverable and loadable

---

## Task 5: Railway Deployment Preparation
- [ ] 5.1 Update `.env.template` with ANTHROPIC_API_KEY documentation
- [ ] 5.2 Update `backend/.env.template` with SDK configuration
- [ ] 5.3 Update `turbocat-agent/.env.template` with SDK configuration
- [ ] 5.4 Create Railway-specific environment documentation

**Acceptance:** All secrets use environment variables, templates documented

---

## Task 6: Validation
- [ ] 6.1 Run backend tests
- [ ] 6.2 Run frontend tests
- [ ] 6.3 Run type checks
- [ ] 6.4 Verify skill loading works
- [ ] 6.5 Manual verification of Agent SDK query

**Acceptance:** All tests pass, SDK functional, skills loadable
