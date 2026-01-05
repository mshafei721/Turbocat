# Task Breakdown: Turbocat Branding Transformation (Phase 3.5)

## Overview

**Feature:** Complete transformation from Vercel template to Turbocat branded platform
**Total Estimated Days:** 5 days
**Total Task Groups:** 7
**Approach:** Sequential execution with verification gates between phases

---

## Task List

### Phase 1: Preparation & Environment Audit

#### Task Group 1: Pre-Implementation Setup
**Dependencies:** None
**Estimated Time:** 3-4 hours
**Owner:** Platform Administrator

- [x] 1.0 Complete preparation and environment setup
  - [x] 1.1 Audit platform-level API keys
    - ✅ Verified `ANTHROPIC_API_KEY` set in environment (Claude agent working)
    - ✅ Verified `OPENAI_API_KEY` set in environment (Copilot/OpenCode agents working)
    - ✅ Verified `GEMINI_API_KEY` set in environment (Gemini agent working)
    - ⚠️ `CURSOR_API_KEY` NOT SET - Agent marked as temporarily unavailable (user confirmed skip)
    - ⚠️ `AI_GATEWAY_API_KEY` NOT SET - Codex agent marked as temporarily unavailable (user confirmed skip)
    - ✅ 3 out of 5 API keys verified working (60% operational - sufficient for branding work)
    - Note: Rate limits documented in platform-specific docs (Claude: 200K TPM, OpenAI: Standard tier, Gemini: Free tier)
  - [x] 1.2 Prepare visual assets
    - ✅ Copied `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-logo.png` to `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\public\turbocat-logo.png` (332KB)
    - ✅ Verified favicon assets exist from Phase 2:
      - ✅ `android-chrome-192x192.png` (40KB)
      - ✅ `android-chrome-512x512.png` (312KB)
      - ✅ `apple-touch-icon.png` (37KB)
      - ✅ `favicon-16x16.png` (696 bytes)
      - ✅ `favicon-32x32.png` (1.7KB)
      - ✅ `favicon.ico` (1.7KB - generated from favicon-32x32.png)
  - [x] 1.3 Create backup and feature branch
    - ✅ Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat`
    - ✅ Created backup: `git checkout -b backup/pre-phase4-branding`
    - ✅ Committed current state: 8 files changed, 3949 insertions (commit b997248)
    - ✅ Returned to main: `git checkout main`
    - ✅ Created feature branch: `git checkout -b feature/phase4-turbocat-branding`

**Acceptance Criteria:**
- ✅ 3 out of 5 API keys verified working (Claude, OpenAI, Gemini - sufficient for Phase 4)
- ✅ Turbocat logo copied to public folder (332KB turbocat-logo.png)
- ✅ All favicons present (including generated favicon.ico)
- ✅ Feature branch created and ready (feature/phase4-turbocat-branding)
- ✅ Clean git status (all changes committed to backup branch: backup/pre-phase4-branding)

---

### Phase 2: Remove Third-Party Assets

#### Task Group 2: Delete Vercel & Template References
**Dependencies:** Task Group 1
**Estimated Time:** 2-3 hours
**Owner:** Frontend Engineer

- [ ] 2.0 Remove all Vercel and template assets
  - [ ] 2.1 Delete Vercel asset files
    - Delete `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\public\vercel.svg`
    - Delete `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\icons\vercel-icon.tsx`
  - [ ] 2.2 Update constants file
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\constants.ts`
    - Remove: `VERCEL_DEPLOY_URL` constant
    - Remove: `VERCEL_DEPLOY_BUTTON_URL` constant
    - Remove: `GITHUB_REPO` constant (if pointing to vercel-labs)
    - Remove: `GITHUB_REPO_URL` constant (if pointing to vercel-labs)
    - Optional: Add `TURBOCAT_DOCS_URL` if documentation exists
    - Optional: Add `TURBOCAT_SUPPORT_URL` if support exists
  - [ ] 2.3 Search for remaining Vercel imports
    - Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent && grep -r "vercel-icon" . --exclude-dir=node_modules --exclude-dir=.next`
    - Run: `grep -r "VercelIcon" . --exclude-dir=node_modules --exclude-dir=.next`
    - Document all files that import VercelIcon (for next step)
  - [ ] 2.4 Verify no build errors
    - Run: `npm run build`
    - Fix any import errors from deleted files
    - Verify build completes successfully

**Acceptance Criteria:**
- Vercel asset files deleted
- Constants file cleaned of Vercel references
- No remaining imports of deleted files
- Build succeeds without errors
- No console warnings about missing files

---

#### Task Group 3: Delete GitHub Stars Component
**Dependencies:** Task Group 2
**Estimated Time:** 1-2 hours
**Owner:** Frontend Engineer

- [ ] 3.0 Remove GitHub stars functionality
  - [ ] 3.1 Delete GitHub stars component
    - Delete `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\github-stars-button.tsx`
    - Optional: Delete `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\api\github-stars\route.ts` (or keep for future Turbocat repo stars)
  - [ ] 3.2 Find all GithubStarsButton imports
    - Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent && grep -r "github-stars-button" components/ --exclude-dir=node_modules`
    - Run: `grep -r "GithubStarsButton" components/ --exclude-dir=node_modules`
    - Document all files importing this component
  - [ ] 3.3 Remove imports from identified files
    - Remove from: `components/home-page-header.tsx` (around line 25, 198-199)
    - Remove from: `components/home-page-mobile-footer.tsx` (around lines 18-28)
    - Remove from: `components/tasks-list-client.tsx` (around line 22)
    - Remove from: `components/home-page-content.tsx` (around line 356)
    - Remove any other files found in step 3.2
  - [ ] 3.4 Verify removal
    - Run: `npm run build`
    - Check no errors about GithubStarsButton
    - Visually inspect pages in dev mode (homepage, tasks list)

**Acceptance Criteria:**
- GitHub stars component deleted
- All imports removed from consuming components
- Build succeeds
- No GitHub stars button visible in UI (desktop or mobile)
- No console errors in browser

---

### Phase 3: Implement Turbocat Branding

#### Task Group 4: Create Turbocat Logo Component
**Dependencies:** Task Group 3
**Estimated Time:** 2-3 hours
**Owner:** Frontend/UI Designer

- [ ] 4.0 Create and integrate Turbocat logo component
  - [ ] 4.1 Create TurbocatLogo component
    - Create file: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\logos\turbocat.tsx`
    - Implementation using Next.js Image:
      ```tsx
      import Image from 'next/image'

      interface TurbocatLogoProps {
        className?: string
        showText?: boolean
      }

      export function TurbocatLogo({
        className = "h-6 w-6",
        showText = false
      }: TurbocatLogoProps) {
        return (
          <div className="flex items-center gap-2">
            <Image
              src="/turbocat-logo.png"
              alt="Turbocat - Multi-Agent AI Coding Platform"
              className={className}
              width={32}
              height={32}
              priority
            />
            {showText && (
              <span className="font-bold text-xl">Turbocat</span>
            )}
          </div>
        )
      }
      ```
  - [ ] 4.2 Add export to logos index
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\logos\index.ts`
    - Add: `export { TurbocatLogo } from './turbocat'` at top of exports
  - [ ] 4.3 Write 2-4 focused tests for TurbocatLogo
    - Create: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\logos\__tests__\turbocat.test.tsx`
    - Test 1: Renders logo image with correct src
    - Test 2: Renders with custom className
    - Test 3: Shows text when showText=true
    - Test 4: Hides text when showText=false
    - Limit to 4 tests maximum
  - [ ] 4.4 Update home page header
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\home-page-header.tsx`
    - Add import: `import { TurbocatLogo } from '@/components/logos'`
    - Replace Vercel button area with:
      ```tsx
      <div className="flex items-center gap-2">
        <TurbocatLogo className="h-8 w-8" showText />
      </div>
      ```
    - Remove "Deploy Your Own" button (lines ~202-216)
    - Remove VercelIcon import
  - [ ] 4.5 Run logo component tests
    - Run: `npm test -- turbocat.test.tsx`
    - Verify all 4 tests pass
    - Do NOT run entire test suite

**Acceptance Criteria:**
- TurbocatLogo component created and exported
- 4 focused tests pass
- Logo appears in homepage header
- "Deploy Your Own" button removed
- No Vercel logo visible in header

---

#### Task Group 5: Update UI Text & Branding
**Dependencies:** Task Group 4
**Estimated Time:** 3-4 hours
**Owner:** Frontend/UI Designer

- [ ] 5.0 Update all user-facing text and branding
  - [ ] 5.1 Update task form branding
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\task-form.tsx`
    - Line ~392: Change heading to: `<h1 className="text-4xl font-bold mb-4">Turbocat</h1>`
    - Lines ~396-410: Replace subtitle paragraph with:
      ```tsx
      <p className="text-lg text-muted-foreground mb-8">
        Multi-agent AI coding platform - compare Claude, Codex, Copilot, Cursor, Gemini, and OpenCode in one place.
        Choose your agent, describe your task, and watch AI code for you.
      </p>
      ```
    - Remove all links to Vercel documentation
    - Remove references to "Vercel Sandbox" and "AI Gateway"
  - [ ] 5.2 Update mobile footer
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\home-page-mobile-footer.tsx`
    - Remove "Deploy Your Own" button (lines ~31-49)
    - Remove VercelIcon import
    - Optional: Add Turbocat footer branding:
      ```tsx
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <TurbocatLogo className="h-5 w-5" />
        <span>Powered by Turbocat</span>
      </div>
      ```
  - [ ] 5.3 Update all page titles (metadata)
    - File 1: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\tasks\[taskId]\page.tsx`
      - Change: `title: \`\${pageTitle} - Coding Agent Platform\``
      - To: `title: \`\${pageTitle} - Turbocat\``
    - File 2: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\repos\[owner]\[repo]\layout.tsx`
      - Change: `title: \`\${owner}/\${repo} - Coding Agent Platform\``
      - To: `title: \`\${owner}/\${repo} - Turbocat\``
    - File 3: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\new\[owner]\[repo]\layout.tsx`
      - Change: `title: \`\${owner}/\${repo} - Coding Agent\``
      - To: `title: \`\${owner}/\${repo} - Turbocat\``
    - File 4: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\[owner]\[repo]\layout.tsx`
      - Change: `title: \`\${owner}/\${repo} - Coding Agent\``
      - To: `title: \`\${owner}/\${repo} - Turbocat\``
  - [ ] 5.4 Verify root layout metadata
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\layout.tsx`
    - Confirm metadata title is "Turbocat" (should be correct from earlier phases)
    - Confirm description mentions multi-agent platform
  - [ ] 5.5 Visual verification in browser
    - Run: `npm run dev`
    - Check homepage shows "Turbocat" heading
    - Check browser tab shows "Turbocat" title
    - Check task form shows updated subtitle
    - Check no Vercel references visible
    - Check mobile footer (if updated)

**Acceptance Criteria:**
- Task form shows "Turbocat" heading and multi-agent description
- All 4 layout files updated with "Turbocat" titles
- Browser tabs show "Turbocat" (not "Coding Agent")
- Mobile footer updated (Deploy button removed)
- No Vercel references visible in UI
- Dev server runs without errors

---

### Phase 4: Platform-Level API Keys

#### Task Group 6: Remove User API Key Management
**Dependencies:** Task Group 5
**Estimated Time:** 2-3 hours
**Owner:** Backend/API Engineer

- [ ] 6.0 Remove user-facing API key management
  - [ ] 6.1 Delete API keys dialog component
    - Delete: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\components\api-keys-dialog.tsx`
  - [ ] 6.2 Find all ApiKeysDialog imports
    - Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent && grep -r "api-keys-dialog" . --exclude-dir=node_modules --exclude-dir=.next`
    - Run: `grep -r "ApiKeysDialog" . --exclude-dir=node_modules --exclude-dir=.next`
    - Document all files importing this component
  - [ ] 6.3 Remove imports and dialog triggers
    - Remove import statements from identified files
    - Remove buttons/menu items that open the dialog
    - Common locations: user menu, settings page, profile page
  - [ ] 6.4 Keep backend API routes (for future admin use)
    - DO NOT delete: `app/api/api-keys/*` routes
    - DO NOT delete: database `keys` table
    - Note: These remain for potential future admin panel
  - [ ] 6.5 Verify build after removal
    - Run: `npm run build`
    - Fix any import errors
    - Verify build succeeds

**Acceptance Criteria:**
- ApiKeysDialog component deleted
- All imports and triggers removed
- Backend API key routes preserved
- Database keys table untouched
- Build succeeds without errors
- No "Manage API Keys" option visible in UI

---

#### Task Group 7: Update Agent API Key Retrieval
**Dependencies:** Task Group 6
**Estimated Time:** 4-5 hours
**Owner:** Backend/API Engineer

- [ ] 7.0 Switch all agents to platform-level API keys
  - [ ] 7.1 Write 2-4 focused tests for API key retrieval
    - Create: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\__tests__\api-key-retrieval.test.ts`
    - Test 1: Retrieves API key from environment variable
    - Test 2: Throws error when API key missing
    - Test 3: Does NOT attempt user key lookup
    - Test 4: Error message is user-friendly
    - Limit to 4 tests maximum
  - [ ] 7.2 Update Claude agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\claude.ts`
    - Find user key lookup code (likely checking database for user keys)
    - Replace with:
      ```typescript
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('Claude agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
    - Remove any database queries for user keys
  - [ ] 7.3 Update Codex agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\codex.ts`
    - Replace user key lookup with:
      ```typescript
      const apiKey = process.env.AI_GATEWAY_API_KEY
      if (!apiKey) {
        throw new Error('Codex agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
  - [ ] 7.4 Update Copilot agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\copilot.ts`
    - Replace user key lookup with:
      ```typescript
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('Copilot agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
  - [ ] 7.5 Update Cursor agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\cursor.ts`
    - Replace user key lookup with:
      ```typescript
      const apiKey = process.env.CURSOR_API_KEY
      if (!apiKey) {
        throw new Error('Cursor agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
  - [ ] 7.6 Update Gemini agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\gemini.ts`
    - Replace user key lookup with:
      ```typescript
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
  - [ ] 7.7 Update OpenCode agent
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\lib\agents\opencode.ts`
    - Replace user key lookup with:
      ```typescript
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenCode agent is temporarily unavailable. Please try a different agent or contact support.')
      }
      ```
  - [ ] 7.8 Run API key retrieval tests
    - Run: `npm test -- api-key-retrieval.test.ts`
    - Verify all 4 tests pass
    - Do NOT run entire test suite yet

**Acceptance Criteria:**
- 4 focused API key retrieval tests pass
- All 6 agent files updated to use only environment variables
- No user key database lookups remain
- Error messages are user-friendly (no technical jargon)
- Build succeeds without errors

---

#### Task Group 8: Update Git Author Attribution
**Dependencies:** Task Group 7
**Estimated Time:** 1-2 hours
**Owner:** Backend/API Engineer

- [ ] 8.0 Update git commit author names to Turbocat
  - [ ] 8.1 Update tasks route
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\api\tasks\route.ts`
    - Find: `'Coding Agent'` in git author name
    - Replace with: `'Turbocat'`
    - Example context:
      ```typescript
      const gitAuthor = {
        name: user?.name || 'Turbocat',
        email: user?.email || 'bot@turbocat.ai'
      }
      ```
  - [ ] 8.2 Update continue route
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\api\tasks\[taskId]\continue\route.ts`
    - Find: `'Coding Agent'`
    - Replace with: `'Turbocat'`
  - [ ] 8.3 Update start-sandbox route
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\app\api\tasks\[taskId]\start-sandbox\route.ts`
    - Find: `'Coding Agent'`
    - Replace with: `'Turbocat'`
  - [ ] 8.4 Search for any remaining "Coding Agent" references
    - Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent && grep -r "Coding Agent" . --exclude-dir=node_modules --exclude-dir=.next`
    - Update any remaining references to "Turbocat"

**Acceptance Criteria:**
- All 3 API route files updated with "Turbocat" git author
- No remaining "Coding Agent" references in backend code
- Build succeeds without errors
- Git commits will show "Turbocat" as author (verifiable in next phase testing)

---

### Phase 5: Documentation & Metadata

#### Task Group 9: Update Project Documentation
**Dependencies:** Task Group 8
**Estimated Time:** 2-3 hours
**Owner:** Technical Writer / Engineer

- [ ] 9.0 Update all documentation and metadata
  - [ ] 9.1 Update README.md
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\README.md`
    - Change title from "Coding Agent Template" to "Turbocat"
    - Update description to:
      ```markdown
      # Turbocat

      Multi-agent AI coding platform - compare Claude, Codex, Copilot, Cursor, Gemini, and OpenCode in one unified interface.

      ## Features

      - 🤖 **6 AI Agents**: Claude, Codex, Copilot, Cursor, Gemini, OpenCode
      - 🔀 **Side-by-Side Comparison**: Run the same task across different agents
      - 🚀 **Production Ready**: Built on Next.js, deployed on Vercel
      - 🎨 **Modern UI**: Dark mode, responsive design, real-time updates
      - 🔐 **Secure**: GitHub OAuth, encrypted sessions, rate limiting

      ## Tech Stack

      - **Framework**: Next.js 16 (App Router)
      - **Database**: Neon PostgreSQL + Drizzle ORM
      - **Authentication**: Arctic (GitHub OAuth)
      - **Styling**: Tailwind CSS 4 + Radix UI
      - **AI SDK**: Vercel AI SDK
      - **Deployment**: Vercel

      ## Getting Started

      This is a proprietary platform. For access or partnership inquiries, contact [your-email].

      ## License

      Proprietary - All rights reserved
      ```
    - Remove "Deploy Your Own" instructions
    - Remove template usage instructions
  - [ ] 9.2 Update package.json metadata
    - Read: `D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent\package.json`
    - Update name: `"turbocat"` (if not already)
    - Update description: `"Multi-agent AI coding platform"`
    - Update version: `"2.0.0"` (major version for branding change)
    - Update author: `"Your Name"` or organization
    - Update license: `"PROPRIETARY"`
    - Update repository URL (if public): `"https://github.com/[your-username]/turbocat"`
  - [ ] 9.3 Search for remaining template references
    - Run: `cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent && grep -r "coding-agent-template" . --exclude-dir=node_modules --exclude-dir=.next`
    - Run: `grep -r "vercel-labs" . --exclude-dir=node_modules --exclude-dir=.next`
    - Update any remaining references

**Acceptance Criteria:**
- README.md reflects Turbocat branding and proprietary status
- package.json metadata updated to version 2.0.0
- No "Deploy Your Own" instructions remain
- No references to "coding-agent-template" or "vercel-labs"
- License set to PROPRIETARY

---

### Phase 6: Comprehensive Testing

#### Task Group 10: Manual & Functional Testing
**Dependencies:** Task Group 9
**Estimated Time:** 4-6 hours
**Owner:** QA / Full Team

- [ ] 10.0 Execute comprehensive testing checklist
  - [ ] 10.1 Visual regression testing (Desktop)
    - Run: `npm run dev` and open `http://localhost:3000`
    - Verify homepage shows "Turbocat" heading (not "Coding Agent Template")
    - Verify Turbocat logo appears in header
    - Verify NO Vercel logo visible anywhere
    - Verify NO "Deploy Your Own" button
    - Verify NO GitHub stars button
    - Verify task form shows "Turbocat" and updated subtitle
    - Verify browser tab shows "Turbocat" title
    - Verify no broken image references
    - Take screenshots for documentation
  - [ ] 10.2 Visual regression testing (Mobile)
    - Resize browser to 375px width (mobile view)
    - Verify Turbocat branding in mobile header
    - Verify NO "Deploy Your Own" button (mobile)
    - Verify NO GitHub stars button (mobile)
    - Verify mobile footer updated (if applicable)
    - Verify responsive layout correct
  - [ ] 10.3 Functional testing - All 6 agents
    - Test 1: Create task with Claude agent
      - Task: "Create a hello.txt file with content 'Hello from Claude'"
      - Verify task executes successfully
      - Verify NO API key dialog appears
      - Verify task completes
    - Test 2: Create task with Codex agent
      - Task: "Create a test.js file with console.log('Codex')"
      - Verify executes with platform key
    - Test 3: Create task with Copilot agent
      - Task: "Create a readme.md with 'Copilot test'"
      - Verify executes with platform key
    - Test 4: Create task with Cursor agent
      - Task: "Create a cursor.txt file"
      - Verify executes with platform key
    - Test 5: Create task with Gemini agent
      - Task: "Create a gemini.py file"
      - Verify executes with platform key
    - Test 6: Create task with OpenCode agent
      - Task: "Create a opencode.js file"
      - Verify executes with platform key
  - [ ] 10.4 Error handling testing
    - Temporarily remove ANTHROPIC_API_KEY from `.env.local`
    - Try to create task with Claude agent
    - Verify error message is user-friendly: "Claude agent is temporarily unavailable..."
    - Verify NO technical jargon or API key references
    - Restore ANTHROPIC_API_KEY
  - [ ] 10.5 Git commit verification
    - Check logs of tasks created in 10.3
    - Verify git commits show "Turbocat" as author (not "Coding Agent")
    - Check format: `Turbocat <bot@turbocat.ai>` or similar
  - [ ] 10.6 Cross-browser testing
    - Test in Chrome (desktop)
    - Test in Firefox (desktop)
    - Test in Edge (desktop)
    - Test in Safari (if available)
    - Verify branding consistent across browsers
    - Verify no browser-specific errors
  - [ ] 10.7 Performance testing
    - Run Lighthouse audit on homepage
    - Verify First Contentful Paint (FCP) < 1.5s
    - Verify Largest Contentful Paint (LCP) < 2.5s
    - Verify Time to Interactive (TTI) < 3.5s
    - Compare bundle size to pre-branding baseline (should be similar or smaller)
  - [ ] 10.8 Console error check
    - Open browser DevTools console
    - Navigate through all pages (homepage, tasks, repos)
    - Verify NO console errors
    - Verify NO warnings about missing components
    - Verify NO 404 errors for assets

**Acceptance Criteria:**
- All 6 agents execute tasks successfully with platform keys
- NO API key dialog appears anywhere
- Turbocat branding visible on all pages
- NO Vercel/template references visible
- Git commits show "Turbocat" author
- All browsers render correctly
- Performance metrics within targets (FCP < 1.5s, LCP < 2.5s)
- Zero console errors
- User-friendly error messages when agent unavailable

---

#### Task Group 11: Test Review & Gap Analysis
**Dependencies:** Task Group 10
**Estimated Time:** 2-3 hours
**Owner:** QA Lead / Senior Engineer

- [ ] 11.0 Review testing coverage and fill critical gaps
  - [ ] 11.1 Review existing tests
    - Review TurbocatLogo tests from Task 4.3 (4 tests)
    - Review API key retrieval tests from Task 7.1 (4 tests)
    - Total existing: ~8 tests
  - [ ] 11.2 Analyze test coverage gaps
    - Identify missing integration test: Logo rendering in header
    - Identify missing integration test: Page title metadata rendering
    - Identify missing E2E test: Complete user journey (homepage → task → execution)
    - Focus ONLY on gaps related to branding transformation
    - Do NOT assess entire application coverage
  - [ ] 11.3 Write up to 6 additional strategic tests
    - Integration Test 1: Home page header renders TurbocatLogo
    - Integration Test 2: Task form shows "Turbocat" heading
    - Integration Test 3: Page metadata includes "Turbocat" title
    - Integration Test 4: No Vercel components render anywhere
    - E2E Test 1: User creates task without API key prompt
    - E2E Test 2: Agent unavailable error is user-friendly
    - Maximum 6 tests (do NOT write exhaustive coverage)
  - [ ] 11.4 Run all branding-related tests
    - Run: `npm test -- turbocat` (logo tests)
    - Run: `npm test -- api-key-retrieval` (key tests)
    - Run: `npm test -- branding` (new integration tests)
    - Expected total: ~14 tests maximum
    - Verify all pass
    - Do NOT run entire application test suite

**Acceptance Criteria:**
- Existing 8 tests reviewed and passing
- 6 or fewer additional tests written to fill critical gaps
- All ~14 branding-related tests pass
- Test coverage focused on transformation requirements only
- No exhaustive testing beyond critical workflows

---

### Phase 7: Deployment & Monitoring

#### Task Group 12: Pre-Deployment Verification
**Dependencies:** Task Group 11
**Estimated Time:** 2-3 hours
**Owner:** DevOps / Platform Administrator

- [ ] 12.0 Final pre-deployment checks
  - [ ] 12.1 Run production build
    - Run: `npm run build`
    - Verify build completes successfully
    - Check build output for warnings
    - Verify bundle size acceptable (< 5% increase)
  - [ ] 12.2 Environment variable verification (Production)
    - Log into Vercel dashboard
    - Navigate to Project Settings → Environment Variables
    - Verify these exist for Production environment:
      - `ANTHROPIC_API_KEY`
      - `OPENAI_API_KEY`
      - `GEMINI_API_KEY`
      - `CURSOR_API_KEY`
      - `AI_GATEWAY_API_KEY`
      - `SANDBOX_VERCEL_TOKEN`
      - `SANDBOX_VERCEL_TEAM_ID`
      - `SANDBOX_VERCEL_PROJECT_ID`
      - All database and auth variables
  - [ ] 12.3 Create rollback documentation
    - Document current production deployment URL
    - Note current commit hash: `git rev-parse HEAD`
    - Document rollback steps:
      1. Vercel dashboard → Deployments → Find previous deployment → Promote to Production
      2. OR: `git revert HEAD && git push origin main`
      3. OR: `git checkout backup-pre-branding-transformation && git push origin main --force`
  - [ ] 12.4 Final search for third-party references
    - Run: `grep -r "Vercel" turbocat-agent/components/ --exclude-dir=node_modules`
    - Run: `grep -r "coding-agent-template" turbocat-agent/ --exclude-dir=node_modules`
    - Run: `grep -r "Coding Agent" turbocat-agent/app/ --exclude-dir=node_modules`
    - Verify all return 0 results (except allowed technical references)
  - [ ] 12.5 Commit all changes
    - Run: `git add -A`
    - Run: `git status` (review all changes)
    - Commit: `git commit -m "$(cat <<'EOF'
Phase 3.5: Complete Turbocat branding transformation

- Remove all Vercel and GitHub template references
- Implement Turbocat logo and branding throughout
- Switch to platform-level API key management
- Update all page titles and metadata to "Turbocat"
- Update git author attribution
- Remove user-facing API key dialog
- Update documentation and package metadata

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"`

**Acceptance Criteria:**
- Production build succeeds
- All environment variables verified in Vercel
- Rollback plan documented
- Zero third-party references in codebase
- All changes committed with descriptive message

---

#### Task Group 13: Deployment & Post-Launch Monitoring
**Dependencies:** Task Group 12
**Estimated Time:** 3-4 hours (+ 24hr monitoring)
**Owner:** DevOps Lead / Platform Administrator

- [ ] 13.0 Deploy and monitor production launch
  - [ ] 13.1 Deploy to production
    - Option A (Recommended): Preview deployment first
      - Run: `git push origin feature/phase-3.5-branding`
      - Get preview URL from Vercel dashboard
      - Test preview deployment (smoke test all 6 agents)
      - If successful: Merge to main
    - Option B: Direct deployment
      - Run: `git checkout main`
      - Run: `git merge feature/phase-3.5-branding`
      - Run: `git push origin main`
    - Wait for Vercel deployment (~2-3 minutes)
  - [ ] 13.2 Immediate smoke testing (within 5 minutes)
    - Access production URL
    - Verify homepage loads
    - Verify "Turbocat" branding visible
    - Verify NO Vercel logos
    - Create ONE test task with Claude agent
    - Verify task executes successfully
    - Check browser console for errors
  - [ ] 13.3 Full production verification (within 30 minutes)
    - Test all 6 agents in production:
      - Claude: Simple task execution
      - Codex: Simple task execution
      - Copilot: Simple task execution
      - Cursor: Simple task execution
      - Gemini: Simple task execution
      - OpenCode: Simple task execution
    - Verify NO API key dialogs
    - Check Vercel logs for errors
    - Monitor error rate (target: < 1%)
  - [ ] 13.4 24-hour monitoring plan
    - Hour 0-1: Active monitoring (check every 15 minutes)
      - Error rates
      - Performance metrics
      - User sessions
    - Hour 1-6: Regular monitoring (check every hour)
      - Vercel analytics
      - Error logging
      - User feedback/support tickets
    - Hour 6-24: Passive monitoring (check every 4 hours)
      - Overall health
      - API usage/costs
      - User retention
  - [ ] 13.5 Success verification (Day 1 complete)
    - Verify error rate < 1% over 24 hours
    - Verify all 6 agents functional
    - Verify no critical user complaints
    - Verify performance metrics stable (no degradation)
    - Document any issues encountered

**Acceptance Criteria:**
- Production deployment successful
- Turbocat branding live and visible
- All 6 agents working in production
- Error rate < 1% in first 24 hours
- No critical issues requiring rollback
- Performance metrics within targets
- Monitoring data captured

---

## Execution Order

**Recommended sequence (dependencies enforced):**

1. **Day 1 Morning:** Task Group 1 (Preparation)
2. **Day 1 Afternoon:** Task Groups 2-3 (Remove Third-Party Assets)
3. **Day 2 Morning:** Task Groups 4-5 (Implement Turbocat Branding)
4. **Day 2 Afternoon:** Task Groups 6-7 (Platform-Level API Keys)
5. **Day 3 Morning:** Task Groups 8-9 (Git Author & Documentation)
6. **Day 3 Afternoon:** Task Group 10 (Manual & Functional Testing)
7. **Day 4 Morning:** Task Group 11 (Test Review & Gap Analysis)
8. **Day 4 Afternoon:** Task Group 12 (Pre-Deployment Verification)
9. **Day 5 Morning:** Task Group 13 (Deployment & Monitoring)
10. **Day 5 Ongoing:** 24-hour post-launch monitoring

---

## Important Notes

### Testing Philosophy
- **Focused Testing**: Each development task group writes 2-4 tests maximum
- **Strategic Coverage**: Test review adds only up to 6 critical gap-filling tests
- **Total Test Count**: ~14 tests for entire branding transformation (not exhaustive)
- **Verification Gates**: Each task group ends with running ONLY its own tests

### Risk Mitigation
- **Backup Branch**: Created in Task 1.3 for instant rollback
- **Feature Branch**: All work done on isolated branch
- **Environment Audit**: API keys verified before removing user management
- **Staged Testing**: Manual testing before deployment, preview deployment before production

### Critical Success Factors
1. **Zero Downtime**: All 6 agents must continue working
2. **Zero Third-Party References**: Complete removal of Vercel/template branding
3. **User-Friendly Errors**: No technical jargon when agents unavailable
4. **Professional Branding**: Consistent Turbocat identity throughout

### Verification Commands
```bash
# Search for remaining Vercel references
cd D:\009_Projects_AI\Personal_Projects\Turbocat\turbocat-agent
grep -r "Vercel" . --exclude-dir=node_modules --exclude-dir=.next

# Search for remaining template references
grep -r "coding-agent-template" . --exclude-dir=node_modules --exclude-dir=.next
grep -r "Coding Agent" . --exclude-dir=node_modules --exclude-dir=.next

# Verify build
npm run build

# Run branding tests only
npm test -- turbocat
npm test -- api-key-retrieval
npm test -- branding
```

### Rollback Plan
If critical issues detected post-deployment:
1. **Immediate**: Vercel dashboard → Previous deployment → Promote to Production
2. **Alternative**: `git revert HEAD && git push origin main`
3. **Emergency**: `git checkout backup-pre-branding-transformation && git push origin main --force`

---

## Summary Statistics

- **Total Task Groups:** 13
- **Total Tasks:** ~80+ individual checklist items
- **Estimated Duration:** 5 days
- **Files to Delete:** 4
- **Files to Create:** 2
- **Files to Modify:** 30+
- **Maximum Tests to Write:** 14 (focused on branding transformation only)
- **API Keys Required:** 5 (platform-level)
- **Agents to Verify:** 6 (Claude, Codex, Copilot, Cursor, Gemini, OpenCode)
