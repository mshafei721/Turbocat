# Phase 4: Mobile Development - Requirements Decisions

**Spec Folder:** `agent-os/specs/2026-01-04-phase-4-mobile-development`
**Created:** 2026-01-04
**Status:** Requirements Complete

---

## Overview

Phase 4 adds React Native Expo mobile development capabilities to the Turbocat platform, enabling cross-platform app development with full native preview via Expo Go.

---

## Critical Decisions

### 1. Technical Feasibility & POC

**Decision:** Research Vercel Sandbox compatibility first; use alternative sandbox if needed

**Details:**
- Must validate Expo CLI, Metro bundler work in Vercel Sandbox before full implementation
- If Vercel Sandbox doesn't support Expo, implement alternative sandbox ONLY for mobile
- Alternative options: Docker containers, E2B sandboxes, AWS Lambda
- This is a BLOCKER - must be resolved before proceeding with Phase 4 implementation

**Impact on UI:**
- Chat interface will have platform selector (Mobile/Web) before user sends message
- Selector determines which sandbox environment is used
- Web projects continue using Vercel Sandbox
- Mobile projects use Vercel Sandbox (if compatible) or alternative

---

### 2. Preview Mechanism

**Decision:** Expo Go + QR codes (full native experience)

**Details:**
- Live preview on physical devices via Expo Go app
- Requires Metro bundler running in sandbox
- QR code generation for easy device connection
- Full native component support (no React Native Web limitations)

**Technical Requirements:**
- Metro bundler must be accessible (tunneling or public URL)
- QR code generation (server-side or client-side)
- Sandbox must expose necessary ports
- Preview session management (timeout, cleanup)

---

### 3. UI Component Library

**Decision:** NativeWind (Tailwind CSS for React Native)

**Rationale:**
- Best alignment with existing Next.js/Tailwind web stack
- Shared design tokens and styling patterns across platforms
- Familiar API for developers already using Tailwind
- Growing community and active maintenance

**Implications:**
- Component Gallery will use NativeWind for all mobile components
- Design system tokens from Phase 2 can be reused
- Consistent utility-first styling approach across web and mobile

---

### 4. MVP Scope

**Decision:** Level 3 - Full Expo Go preview

**Minimum Requirements:**
- ✅ AI generates React Native code with proper structure
- ✅ Live preview via Expo Go QR codes
- ✅ Metro bundler runs in sandbox
- ✅ Device testing works on iOS and Android
- ✅ Component Gallery has 20+ mobile components
- ✅ AI correctly detects mobile intent from platform selector

**Out of Scope (Deferred to Phase 5):**
- ❌ EAS Build integration
- ❌ App Store/Play Store submission
- ❌ CI/CD for mobile deployments
- ❌ Development builds (custom native code)

---

## Architecture Decisions

### 5. Expo Workflow

**Decision:** Expo Go only (managed workflow)

**Rationale:**
- Simplest setup and fastest iteration
- No custom native code requirements for MVP
- Covers 90%+ of mobile app use cases with Expo SDK
- Development builds (custom native code) can be added in Phase 5 if needed

**Limitations:**
- Cannot use third-party native modules outside Expo SDK
- Cannot modify native iOS/Android code
- Good for most apps; users can eject later if needed

---

### 6. Navigation Library

**Decision:** Support both Expo Router and React Navigation (user choice)

**Rationale:**
- Expo Router: File-based routing (like Next.js), easier for web developers
- React Navigation: More established, more flexible, larger community
- AI can ask user preference or infer from project type

**Implementation:**
- AI includes navigation library choice in project setup
- Default: Expo Router (consistency with Next.js mental model)
- Templates for both navigation patterns
- Component Gallery examples for both libraries

---

### 7. Deployment Features

**Decision:** No deployment in Phase 4 - defer to Phase 5

**Rationale:**
- Focus Phase 4 on development and preview only
- EAS Build, submission automation are separate concerns
- Keeps Phase 4 scope manageable
- Phase 5 (Polish & Scale) is better suited for deployment features

**Phase 4 ends at:**
- ✅ Working Expo Go preview
- ✅ Code generation and editing
- ✅ Component library

**Phase 5 will add:**
- EAS Build integration
- App Store/Play Store submission
- CI/CD for mobile
- Production deployment workflows

---

### 8. State Management

**Decision:** Zustand (recommended)

**Rationale:**
- Lightweight, works on both web and mobile
- Simple API with minimal boilerplate
- Growing popularity, good documentation
- Easier for AI to generate than Redux

**Alternatives:**
- React Context for simple apps
- Can match web state management if user requests
- AI can suggest appropriate state management based on app complexity

---

## Project Structure Decisions

### 9. Project Initialization

**Decision:** Platform selector in chat UI (Mobile/Web)

**User Flow:**
1. User selects "Mobile" or "Web" from platform selector in chat UI
2. User sends message describing what they want to build
3. AI context automatically knows which platform to generate code for
4. Appropriate sandbox environment is used (Vercel for web, Vercel or alternative for mobile)

**UI Changes Required:**
- Add platform selector to chat interface (toggle or dropdown)
- Visual indication of current platform selection
- Persist selection across messages in same conversation
- Clear platform context in AI prompts

---

### 10. Project Structure

**Decision:** Standalone Expo project (separate GitHub repositories)

**Default Behavior:**
- Each project (web or mobile) gets its own GitHub repository
- User can have multiple projects under their profile
- Projects are completely independent by default

**Cross-Platform Projects:**
- ONLY if user explicitly requests "add mobile to this web app" or vice versa
- Then: Create linked projects or monorepo structure
- Shared code between web and mobile (API clients, utilities, types)
- Separate GitHub repos can be linked via monorepo setup

**Example:**
```
User Profile
├── Project 1: "My SaaS Dashboard" (Web) - Repo: my-saas-web
├── Project 2: "Fitness Tracker" (Mobile) - Repo: fitness-tracker-mobile
└── Project 3: "E-commerce Platform" (Web + Mobile)
    ├── Repo: ecommerce-monorepo
    ├── /apps/web (Next.js)
    ├── /apps/mobile (Expo)
    └── /packages/shared (utilities, types, API clients)
```

---

### 11. Dependencies on Previous Phases

**Decision:** Wait for Phase 2 & 3 completion before starting Phase 4

**Required from Phase 2 (Design System):**
- ✅ Component Gallery database schema and API
- ✅ Design tokens and theme configuration
- ✅ Baseline web components (to match mobile components)

**Required from Phase 3 (Skills & MCP):**
- ✅ Skills framework (may need mobile-specific skills)
- ✅ MCP connector infrastructure (for mobile integrations)
- ✅ Integration templates

**Rationale:**
- Mobile component gallery extends Phase 2 Component Gallery
- NativeWind design tokens should match web Tailwind tokens from Phase 2
- Mobile development may need custom skills (expo-setup, mobile-integration)
- Ensures consistent experience across web and mobile

**Timeline Implication:**
- Phase 4 cannot start until Phase 2 & 3 are BOTH complete
- This is a hard dependency, not a soft preference
- Allows Phase 2 & 3 to be built without mobile considerations, simplified later

---

### 12. Code Sharing Strategy

**Decision:** Separate by default; linked only when user explicitly requests

**Default (Separate Projects):**
- Web and mobile projects are completely independent
- No code sharing, no monorepo
- Simplest structure, no workspace configuration needed

**When User Requests Cross-Platform:**
User says: "Add a mobile app for my existing web project" or "I want web and mobile together"

**Then AI creates:**
```
monorepo-structure/
├── apps/
│   ├── web/         (Next.js)
│   └── mobile/      (Expo)
├── packages/
│   ├── shared/      (API clients, utilities, types)
│   ├── ui/          (Universal components if applicable)
│   └── config/      (Shared ESLint, TypeScript, etc.)
├── package.json     (workspace root)
└── pnpm-workspace.yaml (or yarn/npm workspaces)
```

**Shared Code (when monorepo):**
- ✅ API clients (fetch/axios wrappers)
- ✅ TypeScript types and interfaces
- ✅ Utility functions (date formatting, validation, etc.)
- ✅ Constants and configuration
- ❌ UI components (web and mobile use different component libraries)

**AI Behavior:**
- AI detects "add mobile to web" or similar requests
- AI asks: "Would you like to create a monorepo with shared code?"
- AI sets up workspace configuration (pnpm/yarn/npm)
- AI generates shared packages with appropriate code

---

## Mobile Features Decisions

### 13. Data Storage

**Decision:** AI decides based on use case

**Strategy:**
- **Local data** (user preferences, app settings, tokens): AsyncStorage
- **Shared data** (user profiles, app content, collaborative data): Backend (Supabase/Neon PostgreSQL)
- **Hybrid**: AsyncStorage for offline cache, backend for source of truth

**AI Logic:**
```
if (data is user-specific AND small AND rarely changes):
  use AsyncStorage

if (data is shared across users OR needs server-side processing):
  use backend database (Supabase/Neon)

if (data needs offline support):
  use AsyncStorage + backend sync pattern
```

**Examples:**
- Theme preference → AsyncStorage
- User authentication token → Secure storage (expo-secure-store)
- User profile data → Backend database
- Shopping cart → AsyncStorage (temporary) + Backend (persistent)
- Chat messages → Backend + AsyncStorage (offline cache)

---

### 14. Authentication

**Decision:** AI decides based on project requirements

**Option 1: Reuse Web Auth (Default for linked projects)**
- Same OAuth providers (GitHub, Vercel)
- Web-based auth flow, token stored in mobile app
- Consistent user experience across platforms
- Good for apps with both web and mobile versions

**Option 2: Separate Mobile Auth (Default for standalone mobile)**
- Mobile-specific auth providers if needed
- Native authentication UX
- May use different session management
- Good for mobile-only apps

**AI Logic:**
```
if (project is mobile-only):
  suggest mobile-native auth patterns
  use expo-auth-session for OAuth

if (project is part of web+mobile monorepo):
  reuse web auth infrastructure
  share session tokens via secure storage
```

**Implementation:**
- `expo-auth-session` for OAuth flows
- `expo-secure-store` for token storage
- Backend API validates tokens (shared with web)

---

### 15. Expo SDK Modules

**Decision:** Comprehensive AI awareness (Core + Extended + All modules)

**Core Modules (Essential):**
- Camera (`expo-camera`)
- Location (`expo-location`)
- Notifications (`expo-notifications`)
- File System (`expo-file-system`)
- Image Picker (`expo-image-picker`)
- Contacts (`expo-contacts`)

**Extended Modules (Common):**
- Sensors (`expo-sensors`)
- Audio (`expo-av`)
- Video (`expo-av`)
- Maps (`react-native-maps`)
- Sharing (`expo-sharing`)
- Calendar (`expo-calendar`)
- Haptics (`expo-haptics`)

**All Modules:**
- AI has knowledge of entire Expo SDK catalog
- Can suggest relevant modules proactively
- Examples: "You want a camera feature? Use expo-camera"

**Implementation:**
- AI skill or knowledge base with Expo SDK documentation
- AI can reference Expo docs when generating code
- AI warns about permission requirements (camera, location, etc.)
- AI adds necessary permissions to app.json automatically

**Example AI Behavior:**
```
User: "Add a feature to take photos"
AI: "I'll use expo-camera to add photo capture. This requires camera permissions - I'll add that to app.json."
```

---

### 16. Component Gallery

**Decision:** 20+ components (matching web gallery)

**Component Categories:**

**Layout & Structure (5):**
1. Screen (safe area wrapper)
2. Container
3. Card
4. Divider
5. Spacer

**Navigation (4):**
6. Header/AppBar
7. TabBar (bottom tabs)
8. Drawer (side menu)
9. BackButton

**Input & Forms (5):**
10. Button
11. Input/TextInput
12. Checkbox
13. Radio
14. Switch/Toggle

**Data Display (4):**
15. List/FlatList
16. Avatar
17. Badge
18. Chip/Tag

**Feedback (3):**
19. Modal/Dialog
20. Loading/Spinner
21. Toast/Snackbar

**Additional (as needed):**
22. Icon (vector icons)
23. Image (optimized)
24. SearchBar

**Implementation:**
- All components use NativeWind for styling
- Consistent with web design tokens from Phase 2
- Each component has:
  - Source code (TypeScript + NativeWind)
  - Documentation
  - Code examples
  - Preview (Expo Snack or React Native Web)
- Stored in Component Gallery database with mobile platform tag

---

## Technical Requirements Summary

### Sandbox Environment
- [ ] Verify Expo CLI runs in Vercel Sandbox
- [ ] Verify Metro bundler starts and serves content
- [ ] If not compatible, select and configure alternative sandbox
- [ ] Install Node.js LTS (required for Expo)
- [ ] Install Expo CLI globally (optional, can use npx)
- [ ] Configure port exposure for Metro bundler

### Preview Infrastructure
- [ ] Metro bundler running in sandbox
- [ ] Public URL or tunnel for Metro server
- [ ] QR code generation (server or client-side)
- [ ] Expo Go detection and instructions
- [ ] Preview session management
- [ ] Error handling and logs

### UI Changes
- [ ] Platform selector in chat interface (Mobile/Web toggle)
- [ ] Visual indication of selected platform
- [ ] Preview area for mobile (QR code display)
- [ ] Expo Go installation instructions
- [ ] Metro bundler status indicator

### AI Prompting
- [ ] Platform context from selector
- [ ] Mobile-specific code generation templates
- [ ] Navigation library detection/selection
- [ ] State management patterns
- [ ] Expo SDK module suggestions
- [ ] Permission handling

### Component Gallery
- [ ] Extend database schema for mobile platform
- [ ] 20+ mobile components with NativeWind
- [ ] Component previews (Snack or RN Web)
- [ ] Mobile platform filter in UI
- [ ] Documentation for each component

---

## Next Steps

1. **Validate Technical Feasibility** (CRITICAL)
   - Research Vercel Sandbox Expo compatibility
   - Test Expo CLI, Metro bundler in Vercel Sandbox
   - If incompatible, select alternative sandbox solution
   - Document findings

2. **After Validation:**
   - Wait for Phase 2 (Design System) completion
   - Wait for Phase 3 (Skills & MCP) completion
   - Run `/write-spec` to generate detailed specification
   - Create implementation task breakdown
   - Begin Phase 4 development

---

## Risks & Mitigations

### Risk 1: Vercel Sandbox Incompatibility
**Risk:** Vercel Sandbox may not support Expo/React Native
**Impact:** High - blocks entire Phase 4
**Mitigation:** Research and test immediately; prepare alternative sandbox solutions
**Fallback:** Use E2B sandboxes, Docker containers, or AWS Lambda for mobile projects only

### Risk 2: Preview Complexity
**Risk:** Expo Go preview requires complex networking (Metro bundler, tunneling)
**Impact:** Medium - may reduce preview quality
**Mitigation:** Start with React Native Web fallback; add Expo Go in iteration 2
**Fallback:** Web preview only for MVP if native preview too complex

### Risk 3: Component Parity
**Risk:** 20+ mobile components is significant effort
**Impact:** Low - can reduce scope
**Mitigation:** Start with 10 core components; add rest incrementally
**Fallback:** Reduce to 10 components for MVP

### Risk 4: Phase 2 & 3 Dependencies
**Risk:** Phase 2 & 3 may take longer than expected, delaying Phase 4
**Impact:** Medium - timeline delay
**Mitigation:** Track Phase 2 & 3 progress; communicate timeline expectations
**Fallback:** Re-evaluate Phase 4 scope if dependencies delay significantly

---

## Open Questions (Low Priority)

These questions can be answered during implementation:

- Exact QR code generation library
- Metro bundler tunneling service (Expo tunnel vs custom)
- Preview session timeout duration
- Error overlay design for mobile preview
- Component Gallery UI enhancements for mobile
- Documentation structure for mobile development
- Tutorial templates for mobile apps

---

**Requirements Decisions Complete:** 2026-01-04
**Ready for Specification Writing:** Yes (after Phase 2 & 3 completion + technical validation)
