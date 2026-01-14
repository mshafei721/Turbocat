# Feature Specification: Dashboard & Project Management

**Epic:** Dashboard & Project Management
**Feature ID:** DASH-001
**Status:** Planned
**Priority:** P0 (Critical)
**Effort:** XLarge (10-15 days)
**Owner:** TBD

---

## Overview

Implement a comprehensive dashboard and project management system that allows users to view their app library, create new projects with natural language prompts, see real-time mobile previews, and maintain persistent chat history with the AI. This is the core user experience that differentiates Turbocat as an AI-native app builder.

---

## Business Context

### Problem
- Current dashboard exists but doesn't match the VibeCode vision
- No real-time mobile preview (critical for user confidence)
- ExecutionLog exists but isn't presented as conversational chat
- Project creation flow isn't optimized for natural language input
- Users need visual feedback to trust the AI is building what they want

### Opportunity
- Real-time preview increases user confidence by 70% (Replit, CodeSandbox benchmarks)
- Conversational chat UI improves iteration speed by 3x
- Visual project library increases project revisit rate by 50%
- Natural language input reduces time-to-first-app to <2 minutes

### Success Metrics
- **Primary:** Time to first working app preview < 2 minutes
- **Secondary:** Project revisit rate > 40% within 7 days
- **Quality:** Preview accuracy > 90% (matches final build)
- **Engagement:** Average 8+ iterations per project

---

## User Stories

### US-003: View App Library
**As a** logged-in user
**I want to** see all my created apps in a grid view
**So that** I can quickly find and access my projects

**Acceptance Criteria:**
- [ ] Left sidebar with "+ New app" button at top
- [ ] Grid view shows project cards with mobile preview thumbnails
- [ ] Each card displays: name, platform badge (Mobile/Web), last updated time
- [ ] Search bar filters projects by name
- [ ] Grid/List toggle button in top right
- [ ] Empty state shows "Create your first app" with CTA
- [ ] Clicking a card navigates to project edit view
- [ ] Loading skeletons while fetching projects

### US-004: Create New Project
**As a** user
**I want to** create a new app by describing what I want
**So that** the AI can generate it for me

**Acceptance Criteria:**
- [ ] Clicking "+ New app" navigates to /new
- [ ] Large prompt input field: "Describe what you want to build..."
- [ ] Platform selector chips (Mobile | Web) inline below input
- [ ] Claude model selector dropdown (e.g., "Claude Opus 4.5")
- [ ] Optional "Enable Backend" toggle (beta badge)
- [ ] Submit button or Enter key triggers generation
- [ ] Loading state with "Building your app..." and animated progress
- [ ] Validation: prompt must be at least 10 characters
- [ ] Auto-save draft every 30 seconds

### US-005: Real-Time Mobile Preview
**As a** user building a mobile app
**I want to** see a live preview of my app as it's being built
**So that** I can verify it matches my expectations

**Acceptance Criteria:**
- [ ] Right side of screen shows iPhone frame with live preview
- [ ] Preview updates in real-time as AI generates code
- [ ] Loading state: "Your app preview will appear here"
- [ ] Tooltip: "Preview may not be fully accurate. Test on a real device."
- [ ] "Open on mobile" button links to Expo Go QR code
- [ ] Preview is interactive (tappable buttons, scrollable content)
- [ ] Device frame selector (iPhone 15, iPhone SE, Pixel 7)
- [ ] Orientation toggle (Portrait | Landscape)
- [ ] Console errors displayed in preview footer
- [ ] Refresh button to reload preview

### US-006: Persistent Chat History
**As a** user iterating on my app
**I want to** see the full conversation history with the AI
**So that** I can understand what changes were made and why

**Acceptance Criteria:**
- [ ] Left panel shows chronological chat history
- [ ] User messages and AI responses clearly differentiated
- [ ] AI responses show: code changes, design decisions, color palettes
- [ ] Expandable sections for long responses (collapsed by default)
- [ ] Scroll position preserved on page reload
- [ ] Chat persisted to database, loaded on project open
- [ ] Markdown rendering in AI responses (code blocks, lists, bold)
- [ ] Copy button for code snippets
- [ ] "Regenerate" button on AI responses
- [ ] Timestamp on each message

---

## Functional Requirements

### Core Requirements
1. **FR-001:** System MUST display all user projects in grid/list view
2. **FR-002:** System MUST filter projects by name in real-time
3. **FR-003:** System MUST show project thumbnails (generated from last preview)
4. **FR-004:** System MUST display platform badges (Mobile/Web)
5. **FR-005:** System MUST show last updated timestamp (relative time)
6. **FR-006:** System MUST support creating new projects via "+ New app" button
7. **FR-007:** System MUST accept natural language prompts (min 10 chars)
8. **FR-008:** System MUST allow platform selection (Mobile or Web)
9. **FR-009:** System MUST allow model selection (Claude Opus 4.5, Sonnet 4.5)
10. **FR-010:** System MUST validate prompt input before submission

### Real-Time Preview Requirements
11. **FR-011:** System MUST render mobile preview in iPhone frame
12. **FR-012:** System MUST update preview in real-time as code is generated
13. **FR-013:** System MUST show loading state during preview generation
14. **FR-014:** System MUST display console errors in preview footer
15. **FR-015:** System MUST support multiple device frame options
16. **FR-016:** System MUST support portrait/landscape orientation toggle
17. **FR-017:** System MUST generate QR code for Expo Go testing
18. **FR-018:** System MUST allow manual preview refresh
19. **FR-019:** System MUST handle preview errors gracefully

### Chat Persistence Requirements
20. **FR-020:** System MUST save all chat messages to database
21. **FR-021:** System MUST load chat history on project open
22. **FR-022:** System MUST display user and AI messages distinctly
23. **FR-023:** System MUST support markdown rendering in AI responses
24. **FR-024:** System MUST allow expanding/collapsing long responses
25. **FR-025:** System MUST preserve scroll position on reload
26. **FR-026:** System MUST show timestamps on messages
27. **FR-027:** System MUST allow copying code snippets
28. **FR-028:** System MUST support regenerating AI responses

---

## Non-Functional Requirements

### Performance
- **NFR-001:** Dashboard MUST load in < 1 second (P95)
- **NFR-002:** Project search MUST filter in < 100ms (P95)
- **NFR-003:** Preview update latency MUST be < 500ms after code change
- **NFR-004:** Chat messages MUST appear in < 200ms after send
- **NFR-005:** Thumbnail generation MUST complete in < 2 seconds

### Usability
- **NFR-006:** Dashboard MUST be responsive (mobile, tablet, desktop)
- **NFR-007:** Empty state MUST clearly guide users to create first app
- **NFR-008:** Preview MUST show helpful error messages on failure
- **NFR-009:** Chat MUST auto-scroll to latest message
- **NFR-010:** Loading states MUST be visually clear and non-blocking

### Reliability
- **NFR-011:** Preview failure rate MUST be < 5%
- **NFR-012:** Chat persistence MUST have 99.9% success rate
- **NFR-013:** System MUST handle concurrent preview updates
- **NFR-014:** System MUST recover gracefully from preview crashes

---

## User Flow

### View Dashboard Flow
```
1. User logs in and lands on /dashboard
2. System fetches all projects for user (API: GET /api/v1/workflows)
3. System displays projects in grid view with thumbnails
4. User can search, toggle view, or click "+ New app"
```

### Create New Project Flow
```
1. User clicks "+ New app" button
2. System navigates to /new
3. User enters prompt: "A mood tracker with daily journaling"
4. User selects platform: Mobile
5. User selects model: Claude Opus 4.5
6. User clicks "Generate" or presses Enter
7. System creates Workflow record (API: POST /api/v1/workflows)
8. System queues workflow execution (BullMQ job)
9. System navigates to /project/:id with loading state
10. Preview panel shows "Building your app..."
11. AI generates code in background (workflow steps)
12. Preview updates in real-time as code becomes available
13. Chat panel shows AI responses explaining changes
14. User sees working app in preview frame
```

### Iterate on Project Flow
```
1. User opens existing project from dashboard
2. System loads chat history (API: GET /api/v1/executions/:id/logs)
3. System loads latest preview from code artifacts
4. User types: "Make the buttons bigger"
5. User sends message (API: POST /api/v1/workflows/:id/execute)
6. System queues new execution
7. AI processes request and updates code
8. Chat shows AI response: "Increased button size from 44pt to 56pt"
9. Preview updates with new button sizes
10. User verifies change and continues iterating
```

### Preview Testing Flow
```
1. User clicks "Open on mobile" in preview panel
2. System generates Expo Go QR code
3. Modal shows QR code + instructions
4. User scans QR code with phone
5. Expo Go opens app on physical device
6. User tests real device behavior
7. User returns to web interface to iterate
```

---

## UI/UX Specifications

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐ ┌─────────────────────────────────────┐│
│ │                  │ │ [Search]  [Grid/List toggle]        ││
│ │  [+ New app]     │ │                                     ││
│ │                  │ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐││
│ │  Turbocat        │ │ │ IMG  │ │ IMG  │ │ IMG  │ │ IMG  │││
│ │  [User Avatar]   │ │ │Title │ │Title │ │Title │ │Title │││
│ │                  │ │ │🔵Web │ │📱Mob │ │📱Mob │ │🔵Web │││
│ │  Projects        │ │ │2h ago│ │1d ago│ │3d ago│ │1w ago│││
│ │  Settings        │ │ └──────┘ └──────┘ └──────┘ └──────┘││
│ │  Help            │ │                                     ││
│ │  Sign out        │ │ ┌──────┐ ┌──────┐ ┌──────┐         ││
│ │                  │ │ │ IMG  │ │ IMG  │ │ IMG  │         ││
│ │                  │ │ │Title │ │Title │ │Title │         ││
│ │                  │ │ │📱Mob │ │🔵Web │ │📱Mob │         ││
│ │                  │ │ │2w ago│ │1m ago│ │2m ago│         ││
│ └──────────────────┘ └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### New Project Screen
```
┌─────────────────────────────────────────────────────────────┐
│                    [< Back to Dashboard]                    │
│                                                             │
│  Describe what you want to build...                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │                                                       │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Platform:  [Mobile] [Web]                                  │
│                                                             │
│  Model: [Claude Opus 4.5 ▼]    [Enable Backend] (Beta)    │
│                                                             │
│  Suggested:  [AI Chat] [Mood Tracker] [Social app] →       │
│                                                             │
│                                        [Generate] →         │
└─────────────────────────────────────────────────────────────┘
```

### Project Editing Screen (Split View)
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐ │ ┌───────────────────────────┐   │
│ │ [< Dashboard]        │ │ │   [iPhone 15 Pro ▼]       │   │
│ │                      │ │ │   [Portrait ⟳]            │   │
│ │ Chat History:        │ │ │                           │   │
│ │                      │ │ │ ┌───────────────────────┐ │   │
│ │ 👤 User:             │ │ │ │                       │ │   │
│ │ "Create a mood       │ │ │ │                       │ │   │
│ │  tracker"            │ │ │ │   PREVIEW             │ │   │
│ │                      │ │ │ │   LOADING...          │ │   │
│ │ 🤖 AI:               │ │ │ │                       │ │   │
│ │ "Created mood        │ │ │ │                       │ │   │
│ │  tracker with:       │ │ │ │                       │ │   │
│ │  - Home screen       │ │ │ │                       │ │   │
│ │  - Daily journal     │ │ │ │                       │ │   │
│ │  - Mood selector..."  │ │ │ │                       │ │   │
│ │  [Show code]         │ │ │ └───────────────────────┘ │   │
│ │                      │ │ │                           │   │
│ │ 👤 User:             │ │ │   [🔄 Refresh] [📱 Open]  │   │
│ │ "Add dark mode"      │ │ │                           │   │
│ │                      │ │ │   Console:                │   │
│ │ 🤖 AI:               │ │ │   No errors               │   │
│ │ "Added theme toggle  │ │ └───────────────────────────┘   │
│ │  Colors: #1a1a1a..." │ │                                 │
│ │                      │ │                                 │
│ │ ─────────────────    │ │                                 │
│ │ [Type message...]    │ │                                 │
│ │              [Send]→ │ │                                 │
│ └──────────────────────┘ └─────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Frontend Implementation
- **Pages:**
  - `/app/(dashboard)/page.tsx` - Main dashboard
  - `/app/(dashboard)/new/page.tsx` - New project creation
  - `/app/(dashboard)/project/[id]/page.tsx` - Project editing view

- **Components:**
  - `<ProjectGrid>` - Grid/list view of projects
  - `<ProjectCard>` - Individual project card with thumbnail
  - `<ProjectSearch>` - Search and filter bar
  - `<NewProjectForm>` - Project creation form
  - `<MobilePreview>` - iPhone frame with live preview
  - `<ChatPanel>` - Persistent chat history
  - `<ChatMessage>` - Individual chat message component
  - `<PromptInput>` - Natural language input with suggestions
  - `<DeviceFrameSelector>` - Device frame picker

- **State Management:**
  - Jotai atoms for:
    - `projectsAtom` - All user projects
    - `activeProjectAtom` - Currently open project
    - `chatHistoryAtom` - Chat messages for active project
    - `previewStateAtom` - Preview loading/error state

- **Real-Time Updates:**
  - WebSocket connection to backend for live preview updates
  - Optimistic UI updates for chat messages
  - Polling fallback if WebSocket unavailable

### Backend Implementation
- **New/Modified Routes:**
  - `GET /api/v1/projects` - List all user projects (alias for workflows)
  - `POST /api/v1/projects` - Create new project (creates workflow + initial execution)
  - `GET /api/v1/projects/:id` - Get project details
  - `PUT /api/v1/projects/:id` - Update project metadata
  - `DELETE /api/v1/projects/:id` - Soft delete project
  - `GET /api/v1/projects/:id/chat` - Get chat history (execution logs formatted as chat)
  - `POST /api/v1/projects/:id/chat` - Send new message (triggers execution)
  - `GET /api/v1/projects/:id/preview` - Get latest preview code
  - `WS /api/v1/projects/:id/preview/stream` - WebSocket for live updates

- **Database Schema Changes:**
  ```prisma
  model Workflow {
    // Existing fields...
    projectName      String
    projectDescription String?
    platform         String  // "mobile" | "web"
    selectedModel    String  // "claude-opus-4.5" | "claude-sonnet-4.5"
    thumbnailUrl     String?
    previewCode      String? @db.Text
    previewError     String?
    chatMessages     ChatMessage[]
  }

  model ChatMessage {
    id          String   @id @default(uuid())
    workflowId  String
    workflow    Workflow @relation(fields: [workflowId], references: [id])
    role        String   // "user" | "assistant"
    content     String   @db.Text
    metadata    Json?    // code changes, design decisions, etc.
    createdAt   DateTime @default(now())
    @@index([workflowId, createdAt])
  }
  ```

- **Preview Service:**
  - Generate preview from latest code artifacts
  - Bundle React Native code for web preview
  - Handle errors and syntax issues gracefully
  - Cache preview bundles (Redis)

- **Chat Service:**
  - Format ExecutionLog records as chat messages
  - Extract code changes from execution context
  - Highlight design decisions in AI responses
  - Support markdown rendering

---

## Dependencies

### External Services
- **Expo Snack API** - For mobile preview rendering (or self-hosted bundler)
- **WebSocket Server** - For real-time preview updates
- **Image Generation** - For project thumbnails (canvas screenshot)

### Internal Dependencies
- **Workflow Engine** - Already exists, needs enhancement for chat formatting
- **ExecutionLog Model** - Already exists, needs migration to ChatMessage model
- **BullMQ Queue** - Already exists, used for async project generation
- **Redis** - Already used, add caching for preview bundles

### Frontend Dependencies (New)
```json
{
  "react-device-frameset": "^2.0.0",  // Device frames
  "react-markdown": "^9.0.0",          // Markdown rendering
  "react-syntax-highlighter": "^15.5.0", // Code syntax
  "qrcode.react": "^3.1.0",            // QR codes for Expo Go
  "socket.io-client": "^4.7.0"         // WebSocket client
}
```

---

## Rollout Plan

### Phase 1: Core Dashboard (3 days)
- Redesign dashboard UI to match vision
- Implement project grid/list view
- Add search and filtering
- Create project card component with thumbnails

### Phase 2: Project Creation (3 days)
- Build new project creation form
- Integrate with workflow API
- Add platform/model selection
- Implement suggested prompts

### Phase 3: Chat Persistence (2 days)
- Migrate ExecutionLog to ChatMessage model
- Build chat panel UI
- Implement chat loading and display
- Add markdown rendering

### Phase 4: Real-Time Preview (5 days)
- Set up preview bundling service
- Create mobile preview component with device frames
- Implement WebSocket connection
- Add device frame selector
- Integrate Expo Go QR codes

### Phase 5: Polish & Testing (2 days)
- Add loading states and error handling
- Test preview accuracy
- Performance optimization
- User acceptance testing

---

## Success Criteria

### Launch Criteria (Must Have)
- [ ] Dashboard loads in < 1 second
- [ ] Project creation works end-to-end
- [ ] Preview renders correctly for 90% of cases
- [ ] Chat history persists and loads correctly
- [ ] Mobile testing via Expo Go functional
- [ ] Search filters projects correctly
- [ ] All UI matches VibeCode vision

### Post-Launch (Within 2 Weeks)
- [ ] 80%+ of users create at least one project
- [ ] Average 5+ iterations per project
- [ ] Preview accuracy > 90%
- [ ] User satisfaction score > 4.5/5
- [ ] < 5% preview error rate

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Preview rendering too slow | High | Medium | Implement aggressive caching, optimize bundler |
| WebSocket reliability issues | High | Medium | Add polling fallback, robust reconnection logic |
| Device frame accuracy varies | Medium | High | Test on multiple devices, show disclaimer |
| Chat history grows too large | Medium | Low | Implement pagination, archive old messages |
| Expo Snack API rate limits | High | Low | Self-host preview bundler, cache aggressively |

---

## Open Questions

1. **Preview Technology:** Use Expo Snack API vs self-hosted bundler?
   - **Recommendation:** Start with Expo Snack, migrate to self-hosted if needed

2. **Device Frame Library:** Which device frames to support initially?
   - **Recommendation:** iPhone 15 Pro, iPhone SE, Pixel 7 (covers 80% of users)

3. **Chat Message Limit:** How many messages to load initially?
   - **Recommendation:** Load last 50 messages, lazy load older on scroll

4. **Thumbnail Generation:** Client-side or server-side?
   - **Recommendation:** Client-side screenshot, upload to S3

5. **Real-Time Updates:** WebSocket only or also polling?
   - **Recommendation:** WebSocket primary, polling fallback every 5 seconds

---

## References

- UI Reference: `vibecode app user dashboard.png`
- UI Reference: `vibe code app new project screen.png`
- UI Reference: `vibe code app existing project with chat-presistant and preview.png`
- [Expo Snack API Documentation](https://docs.expo.dev/workflow/snack/)
- [React Device Frameset](https://github.com/zheeeng/react-device-frameset)
- Current Backend: `docs/00-context/system-state.md`

---

**Last Updated:** 2026-01-12
**Status:** Ready for Technical Design
