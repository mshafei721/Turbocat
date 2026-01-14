# Development Tasks: Dashboard & Project Management

**Feature:** DASH-001 - Dashboard & Project Management
**Last Updated:** 2026-01-12
**Total Effort:** 10-15 days (2-3 sprints)

---

## Task Overview

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1: Database & Backend Setup | 5 tasks | 2 days | None |
| Phase 2: Project Management API | 6 tasks | 2 days | Phase 1 |
| Phase 3: Dashboard UI | 5 tasks | 2 days | Phase 2 |
| Phase 4: Project Creation Flow | 4 tasks | 2 days | Phase 2, 3 |
| Phase 5: Chat Persistence | 5 tasks | 2 days | Phase 2 |
| Phase 6: Mobile Preview | 7 tasks | 4 days | Phase 2, 5 |
| Phase 7: Testing & Polish | 4 tasks | 2 days | All phases |

---

## Phase 1: Database & Backend Setup (Day 1-2)

### Task 1.1: Create Database Migration
**Effort:** 2 hours
**Owner:** Backend Developer
**Priority:** P0

**Description:**
Create Prisma migration to add ChatMessage model and update Workflow model with project-specific fields.

**Acceptance Criteria:**
- [ ] ChatMessage table created with all fields
- [ ] Workflow table updated with projectName, projectDescription, platform, selectedModel, thumbnailUrl, previewCode, previewError, previewUpdatedAt
- [ ] Foreign key relationship established (ChatMessage -> Workflow)
- [ ] Indexes created for performance (workflowId+createdAt, userId+deletedAt+updatedAt)
- [ ] Migration tested on dev database
- [ ] Rollback script verified

**Commands:**
```bash
cd backend
npx prisma migrate dev --name add_project_features
npx prisma generate
npm run db:migrate
```

---

### Task 1.2: Update Prisma Schema
**Effort:** 30 minutes
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** None

**Description:**
Update schema.prisma with new models and fields.

**Acceptance Criteria:**
- [ ] ChatMessage model defined
- [ ] Workflow model updated
- [ ] Relations configured correctly
- [ ] Indexes defined
- [ ] Schema validated

**Files:**
- `backend/prisma/schema.prisma`

---

### Task 1.3: Seed Development Data
**Effort:** 1 hour
**Owner:** Backend Developer
**Priority:** P1
**Dependencies:** Task 1.1

**Description:**
Create seed script to populate test projects and chat messages for development.

**Acceptance Criteria:**
- [ ] Seed script creates 10 sample projects
- [ ] Each project has 5-10 chat messages
- [ ] Projects have varied platforms (mobile, web)
- [ ] Timestamps are realistic
- [ ] Script is idempotent (can run multiple times)

**Files:**
- `backend/prisma/seed.ts`

---

### Task 1.4: Install Backend Dependencies
**Effort:** 15 minutes
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** None

**Description:**
Install required npm packages for preview service and WebSocket.

**Acceptance Criteria:**
- [ ] socket.io installed
- [ ] metro-bundler or vite installed (for preview)
- [ ] Dependencies added to package.json
- [ ] Lockfile updated

**Commands:**
```bash
cd backend
npm install socket.io@^4.7.0
npm install metro@^0.80.0 metro-resolver@^0.80.0
npm install --save-dev @types/socket.io
```

---

### Task 1.5: Configure Environment Variables
**Effort:** 30 minutes
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** None

**Description:**
Add new environment variables for preview service and WebSocket.

**Acceptance Criteria:**
- [ ] FRONTEND_URL added to .env
- [ ] PREVIEW_CACHE_TTL added (default: 3600)
- [ ] WEBSOCKET_PATH added (default: /api/v1/ws)
- [ ] .env.example updated
- [ ] Environment validation added

**Files:**
- `backend/.env`
- `backend/.env.example`
- `backend/src/config/environment.ts`

---

## Phase 2: Project Management API (Day 3-4)

### Task 2.1: Create ProjectService
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.1, 1.2

**Description:**
Implement ProjectService with methods for CRUD, chat, and preview.

**Acceptance Criteria:**
- [ ] listProjects() with filtering and sorting
- [ ] createProject() with validation
- [ ] getProject() with chat messages
- [ ] getChatHistory() with pagination
- [ ] sendChatMessage() with queue integration
- [ ] getPreview() with caching
- [ ] All methods have error handling
- [ ] Unit tests written (80% coverage)

**Files:**
- `backend/src/services/ProjectService.ts`
- `backend/src/services/__tests__/ProjectService.test.ts`

---

### Task 2.2: Create ProjectController
**Effort:** 2 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.1

**Description:**
Implement REST API endpoints for project management.

**Acceptance Criteria:**
- [ ] GET /api/v1/projects (list with filters)
- [ ] POST /api/v1/projects (create)
- [ ] GET /api/v1/projects/:id (get one)
- [ ] PUT /api/v1/projects/:id (update)
- [ ] DELETE /api/v1/projects/:id (soft delete)
- [ ] GET /api/v1/projects/:id/chat (chat history)
- [ ] POST /api/v1/projects/:id/chat (send message)
- [ ] GET /api/v1/projects/:id/preview (get preview)
- [ ] All endpoints have auth middleware
- [ ] Validation middleware applied

**Files:**
- `backend/src/controllers/ProjectController.ts`
- `backend/src/routes/projects.ts`

---

### Task 2.3: Create PreviewService
**Effort:** 4 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.4

**Description:**
Implement preview bundling and caching service.

**Acceptance Criteria:**
- [ ] bundleCode() for React Native (Metro)
- [ ] bundleCode() for React web (Vite)
- [ ] Error handling for syntax errors
- [ ] Redis caching with TTL
- [ ] generatePreview() updates database
- [ ] getCachedPreview() checks Redis first
- [ ] Unit tests for bundling logic

**Files:**
- `backend/src/services/PreviewService.ts`
- `backend/src/utils/bundler.ts`
- `backend/src/services/__tests__/PreviewService.test.ts`

---

### Task 2.4: Create WebSocketService
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.4

**Description:**
Implement WebSocket server for real-time preview and chat updates.

**Acceptance Criteria:**
- [ ] Socket.io server initialized
- [ ] JWT authentication middleware
- [ ] subscribe-project event handler
- [ ] unsubscribe-project event handler
- [ ] emitPreviewUpdate() method
- [ ] emitChatMessage() method
- [ ] Connection/disconnection logging
- [ ] Error handling and reconnection logic

**Files:**
- `backend/src/services/WebSocketService.ts`
- `backend/src/server.ts` (integration)

---

### Task 2.5: Integrate Workflow Queue
**Effort:** 2 hours
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.1

**Description:**
Update BullMQ workflow execution to emit WebSocket events.

**Acceptance Criteria:**
- [ ] Workflow job emits preview-update on code change
- [ ] Workflow job emits chat-message on AI response
- [ ] Chat messages saved to database
- [ ] Preview code saved to database
- [ ] Error handling emits error events
- [ ] Job progress tracked

**Files:**
- `backend/src/workers/WorkflowWorker.ts`
- `backend/src/engine/WorkflowExecutor.ts`

---

### Task 2.6: Add API Route Registration
**Effort:** 30 minutes
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 2.2

**Description:**
Register new project routes in Express app.

**Acceptance Criteria:**
- [ ] /api/v1/projects routes registered
- [ ] Auth middleware applied to all routes
- [ ] Request validation middleware configured
- [ ] Rate limiting configured (10 req/min for POST)
- [ ] Routes tested with Postman/Insomnia

**Files:**
- `backend/src/app.ts`
- `backend/src/routes/index.ts`

---

## Phase 3: Dashboard UI (Day 5-6)

### Task 3.1: Create Dashboard Page
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Phase 2 complete

**Description:**
Implement main dashboard page with sidebar and project grid.

**Acceptance Criteria:**
- [ ] Page route /dashboard created
- [ ] Sidebar with "New app" button
- [ ] Navigation links (Projects, Settings, Help)
- [ ] Main content area for project grid
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Auth check (redirect to login if not authenticated)

**Files:**
- `turbocat-agent/app/(dashboard)/page.tsx`
- `turbocat-agent/app/(dashboard)/layout.tsx`

---

### Task 3.2: Create ProjectGrid Component
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build project grid/list view component with loading states.

**Acceptance Criteria:**
- [ ] Grid view (4 columns on desktop, 2 on tablet, 1 on mobile)
- [ ] List view (1 column, horizontal card layout)
- [ ] Loading skeletons while fetching
- [ ] Empty state with CTA
- [ ] Responsive grid breakpoints
- [ ] Smooth animations (Framer Motion)

**Files:**
- `turbocat-agent/components/turbocat/ProjectGrid.tsx`

---

### Task 3.3: Create ProjectCard Component
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.2

**Description:**
Build individual project card with thumbnail, name, platform badge, and timestamp.

**Acceptance Criteria:**
- [ ] Thumbnail image (with fallback)
- [ ] Project name (truncated if long)
- [ ] Platform badge (Mobile/Web with icons)
- [ ] Relative timestamp (2h ago, 1d ago)
- [ ] Hover effects (scale, shadow)
- [ ] Click navigates to /project/:id
- [ ] Card variants (grid vs list)

**Files:**
- `turbocat-agent/components/turbocat/ProjectCard.tsx`

---

### Task 3.4: Create ProjectSearch Component
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Task 3.1

**Description:**
Build search bar with grid/list view toggle.

**Acceptance Criteria:**
- [ ] Search input with icon
- [ ] Debounced search (300ms)
- [ ] Clear button when search active
- [ ] Grid/List toggle buttons
- [ ] Keyboard shortcuts (Cmd+K for focus)
- [ ] Responsive layout

**Files:**
- `turbocat-agent/components/turbocat/ProjectSearch.tsx`

---

### Task 3.5: Create Jotai Atoms for State
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** None

**Description:**
Create Jotai atoms for global project state management.

**Acceptance Criteria:**
- [ ] projectsAtom (all user projects)
- [ ] activeProjectAtom (currently open project)
- [ ] chatHistoryAtom (chat messages)
- [ ] previewStateAtom (loading, error, data)
- [ ] Atoms persisted to localStorage where appropriate
- [ ] Type definitions for all atoms

**Files:**
- `turbocat-agent/lib/atoms.ts`

---

## Phase 4: Project Creation Flow (Day 7-8)

### Task 4.1: Create New Project Page
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Phase 2 complete

**Description:**
Implement /new page for project creation.

**Acceptance Criteria:**
- [ ] Page route /new created
- [ ] Large prompt textarea
- [ ] Platform selector (Mobile/Web chips)
- [ ] Model selector dropdown
- [ ] "Enable Backend" toggle (beta badge)
- [ ] Generate button (disabled until valid input)
- [ ] Loading state during submission
- [ ] Error handling with toast notifications

**Files:**
- `turbocat-agent/app/(dashboard)/new/page.tsx`

---

### Task 4.2: Create PromptInput Component
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 4.1

**Description:**
Build natural language prompt input with suggestions.

**Acceptance Criteria:**
- [ ] Textarea with placeholder
- [ ] Character count (min 10 chars)
- [ ] Auto-resize as user types
- [ ] Submit on Enter (Shift+Enter for new line)
- [ ] Suggested prompts chips (horizontal scroll)
- [ ] Click chip inserts text
- [ ] Focus state styling

**Files:**
- `turbocat-agent/components/turbocat/PromptInput.tsx`

---

### Task 4.3: Create PlatformSelector Component
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 4.1

**Description:**
Build platform selection chips (Mobile/Web).

**Acceptance Criteria:**
- [ ] Two chips: Mobile, Web
- [ ] Single selection (radio behavior)
- [ ] Active state styling
- [ ] Platform icons (Phosphor Icons)
- [ ] Keyboard navigation (arrow keys)
- [ ] Default: Mobile

**Files:**
- `turbocat-agent/components/turbocat/PlatformSelector.tsx`

---

### Task 4.4: Integrate Project Creation API
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 4.1, 4.2, 4.3, Phase 2

**Description:**
Connect new project form to backend API.

**Acceptance Criteria:**
- [ ] Form submission calls POST /api/v1/projects
- [ ] Validation before submission
- [ ] Loading state during API call
- [ ] Success: navigate to /project/:id
- [ ] Error: show toast with message
- [ ] Optimistic UI updates

**Files:**
- `turbocat-agent/app/(dashboard)/new/page.tsx`
- `turbocat-agent/lib/api/projects.ts`

---

## Phase 5: Chat Persistence (Day 9-10)

### Task 5.1: Create ChatPanel Component
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Phase 2 complete

**Description:**
Build chat panel with message list and input.

**Acceptance Criteria:**
- [ ] Scrollable message list
- [ ] Auto-scroll to bottom on new message
- [ ] Loading state while fetching history
- [ ] Empty state message
- [ ] Scroll position preserved on reload
- [ ] Lazy loading of older messages (pagination)

**Files:**
- `turbocat-agent/components/turbocat/ChatPanel.tsx`

---

### Task 5.2: Create ChatMessage Component
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 5.1

**Description:**
Build individual chat message component with user/AI differentiation.

**Acceptance Criteria:**
- [ ] User messages: right-aligned, blue background
- [ ] AI messages: left-aligned, gray background
- [ ] Markdown rendering (react-markdown)
- [ ] Code syntax highlighting (react-syntax-highlighter)
- [ ] Expandable/collapsible for long messages
- [ ] Timestamp display
- [ ] Copy button for code blocks
- [ ] "Regenerate" button on AI messages

**Files:**
- `turbocat-agent/components/turbocat/ChatMessage.tsx`

---

### Task 5.3: Integrate Chat History API
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 5.1, Phase 2

**Description:**
Connect chat panel to backend chat API.

**Acceptance Criteria:**
- [ ] Fetch chat history on project open
- [ ] Load last 50 messages initially
- [ ] Pagination for older messages (load more)
- [ ] Loading state while fetching
- [ ] Error handling with retry

**Files:**
- `turbocat-agent/components/turbocat/ChatPanel.tsx`
- `turbocat-agent/lib/api/chat.ts`

---

### Task 5.4: Integrate Send Message API
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 5.2, Phase 2

**Description:**
Implement sending chat messages to backend.

**Acceptance Criteria:**
- [ ] Send message on Enter key
- [ ] Optimistic UI update (show message immediately)
- [ ] API call to POST /api/v1/projects/:id/chat
- [ ] Loading indicator while waiting for AI response
- [ ] Error handling (remove optimistic message on failure)
- [ ] Clear input after send

**Files:**
- `turbocat-agent/components/turbocat/ChatPanel.tsx`

---

### Task 5.5: Integrate WebSocket for Real-Time Chat
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 5.4, Phase 2 (Task 2.4)

**Description:**
Connect WebSocket for real-time chat message updates.

**Acceptance Criteria:**
- [ ] WebSocket connection established on project open
- [ ] Subscribe to project channel
- [ ] Receive chat-message events
- [ ] Append messages to chat history
- [ ] Handle connection errors and reconnection
- [ ] Unsubscribe on component unmount

**Files:**
- `turbocat-agent/lib/hooks/useSocket.ts`
- `turbocat-agent/components/turbocat/ChatPanel.tsx`

---

## Phase 6: Mobile Preview (Day 11-14)

### Task 6.1: Install Frontend Dependencies
**Effort:** 15 minutes
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** None

**Description:**
Install required npm packages for preview rendering.

**Acceptance Criteria:**
- [ ] react-device-frameset installed
- [ ] react-markdown installed
- [ ] react-syntax-highlighter installed
- [ ] qrcode.react installed
- [ ] socket.io-client installed
- [ ] Dependencies added to package.json

**Commands:**
```bash
cd turbocat-agent
npm install react-device-frameset@^2.0.0
npm install react-markdown@^9.0.0
npm install react-syntax-highlighter@^15.5.0
npm install qrcode.react@^3.1.0
npm install socket.io-client@^4.7.0
```

---

### Task 6.2: Create MobilePreview Component
**Effort:** 4 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 6.1

**Description:**
Build mobile preview component with device frame.

**Acceptance Criteria:**
- [ ] DeviceFrameset wrapper for iPhone/Pixel
- [ ] iframe for preview rendering
- [ ] Loading state: "Building your app..."
- [ ] Error state with retry button
- [ ] Device selector dropdown
- [ ] Orientation toggle (portrait/landscape)
- [ ] Console errors displayed in footer
- [ ] Refresh button
- [ ] "Open on mobile" button

**Files:**
- `turbocat-agent/components/turbocat/MobilePreview.tsx`

---

### Task 6.3: Integrate Preview API
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 6.2, Phase 2

**Description:**
Connect preview component to backend preview API.

**Acceptance Criteria:**
- [ ] Fetch preview on component mount
- [ ] GET /api/v1/projects/:id/preview
- [ ] Display code in iframe
- [ ] Handle preview errors
- [ ] Loading state while fetching
- [ ] Retry on failure

**Files:**
- `turbocat-agent/components/turbocat/MobilePreview.tsx`
- `turbocat-agent/lib/api/preview.ts`

---

### Task 6.4: Integrate WebSocket for Real-Time Preview
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 6.3, Phase 2 (Task 2.4)

**Description:**
Connect WebSocket for real-time preview updates.

**Acceptance Criteria:**
- [ ] Subscribe to preview-update events
- [ ] Update iframe src on event
- [ ] Handle partial updates (incremental rendering)
- [ ] Smooth transition animations
- [ ] Error handling and reconnection
- [ ] Fallback to polling if WebSocket fails

**Files:**
- `turbocat-agent/components/turbocat/MobilePreview.tsx`
- `turbocat-agent/lib/hooks/useSocket.ts`

---

### Task 6.5: Create Expo QR Code Modal
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Task 6.2

**Description:**
Build modal with QR code for Expo Go testing.

**Acceptance Criteria:**
- [ ] Modal opens on "Open on mobile" click
- [ ] QR code generated with project URL
- [ ] Instructions: "1. Install Expo Go, 2. Scan QR code"
- [ ] Copy link button
- [ ] Close modal on overlay click or Escape
- [ ] Responsive design

**Files:**
- `turbocat-agent/components/turbocat/ExpoQRModal.tsx`

---

### Task 6.6: Create Project Edit Page (Split Layout)
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 5.1, 6.2

**Description:**
Build split-screen project editing page with chat and preview.

**Acceptance Criteria:**
- [ ] Page route /project/:id created
- [ ] Left panel: ChatPanel (40% width)
- [ ] Right panel: MobilePreview (60% width)
- [ ] Resizable divider between panels
- [ ] Responsive: stack panels on mobile
- [ ] Back to dashboard button
- [ ] Loading state while fetching project
- [ ] 404 if project not found

**Files:**
- `turbocat-agent/app/(dashboard)/project/[id]/page.tsx`

---

### Task 6.7: Add Thumbnail Generation
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P2
**Dependencies:** Task 6.2

**Description:**
Implement client-side screenshot capture for project thumbnails.

**Acceptance Criteria:**
- [ ] Capture screenshot of preview iframe
- [ ] Convert to base64 or blob
- [ ] Upload to S3 or save to backend
- [ ] Update project thumbnailUrl
- [ ] Trigger on preview load or manual button
- [ ] Handle CORS issues

**Files:**
- `turbocat-agent/lib/utils/thumbnail.ts`
- `turbocat-agent/components/turbocat/MobilePreview.tsx`

---

## Phase 7: Testing & Polish (Day 15-16)

### Task 7.1: Write Integration Tests
**Effort:** 4 hours
**Owner:** Backend Developer
**Priority:** P1
**Dependencies:** All backend tasks

**Description:**
Write integration tests for project management flow.

**Acceptance Criteria:**
- [ ] Test: Create project -> Queue execution -> Save to DB
- [ ] Test: Send chat message -> Queue execution -> Emit WebSocket
- [ ] Test: Generate preview -> Cache in Redis -> Update DB
- [ ] Test: WebSocket authentication and subscription
- [ ] Test: Pagination and filtering
- [ ] All tests pass in CI

**Files:**
- `backend/src/__tests__/integration/ProjectFlow.test.ts`
- `backend/src/__tests__/integration/ChatFlow.test.ts`
- `backend/src/__tests__/integration/PreviewFlow.test.ts`

---

### Task 7.2: Write E2E Tests
**Effort:** 4 hours
**Owner:** QA / Frontend Developer
**Priority:** P1
**Dependencies:** All frontend tasks

**Description:**
Write Playwright E2E tests for user flows.

**Acceptance Criteria:**
- [ ] Test: Dashboard loads and displays projects
- [ ] Test: Search filters projects correctly
- [ ] Test: Create new project end-to-end
- [ ] Test: Send chat message and receive AI response
- [ ] Test: Preview updates in real-time
- [ ] Test: Mobile device switching
- [ ] All tests pass in CI

**Files:**
- `turbocat-agent/tests/e2e/dashboard.spec.ts`
- `turbocat-agent/tests/e2e/project-creation.spec.ts`
- `turbocat-agent/tests/e2e/chat.spec.ts`
- `turbocat-agent/tests/e2e/preview.spec.ts`

---

### Task 7.3: Performance Optimization
**Effort:** 3 hours
**Owner:** Full Stack Developer
**Priority:** P1
**Dependencies:** Phase 6 complete

**Description:**
Optimize performance of dashboard, chat, and preview.

**Acceptance Criteria:**
- [ ] Dashboard loads in < 1 second (measure with Lighthouse)
- [ ] Preview updates in < 500ms
- [ ] Chat messages appear in < 200ms
- [ ] Implement React.memo for expensive components
- [ ] Add Redis caching for project list
- [ ] Optimize database queries (add indexes)
- [ ] Lazy load images and thumbnails

**Files:**
- Various (optimizations across codebase)

---

### Task 7.4: UI Polish & Bug Fixes
**Effort:** 4 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Phase 6 complete

**Description:**
Final UI polish, accessibility improvements, and bug fixes.

**Acceptance Criteria:**
- [ ] All animations smooth (60fps)
- [ ] Loading states consistent across app
- [ ] Error messages user-friendly
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: ARIA labels added
- [ ] Accessibility: color contrast meets WCAG AA
- [ ] Mobile responsiveness tested on real devices
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

**Files:**
- Various (UI polish across components)

---

## Task Dependencies Diagram

```
Phase 1: Database & Backend Setup
├─ Task 1.1 (Migration) ────────┐
├─ Task 1.2 (Schema) ────────────┤
├─ Task 1.3 (Seed) ←────────────┘
├─ Task 1.4 (Dependencies)
└─ Task 1.5 (Environment)
           │
           ↓
Phase 2: Project Management API
├─ Task 2.1 (ProjectService) ←──┐
├─ Task 2.2 (ProjectController)  │
├─ Task 2.3 (PreviewService)     │
├─ Task 2.4 (WebSocketService)   │
├─ Task 2.5 (Workflow Queue)     │
└─ Task 2.6 (Route Registration) │
           │                     │
           ├─────────────────────┘
           │
           ↓
Phase 3: Dashboard UI            Phase 4: Project Creation
├─ Task 3.1 (Dashboard Page)     ├─ Task 4.1 (New Page)
├─ Task 3.2 (ProjectGrid) ←──┐   ├─ Task 4.2 (PromptInput)
├─ Task 3.3 (ProjectCard)     │   ├─ Task 4.3 (PlatformSelector)
├─ Task 3.4 (ProjectSearch)   │   └─ Task 4.4 (API Integration)
└─ Task 3.5 (Jotai Atoms)     │
           │                  │
           ↓                  │
Phase 5: Chat Persistence ←───┘
├─ Task 5.1 (ChatPanel)
├─ Task 5.2 (ChatMessage)
├─ Task 5.3 (Chat API)
├─ Task 5.4 (Send Message)
└─ Task 5.5 (WebSocket Chat)
           │
           ↓
Phase 6: Mobile Preview
├─ Task 6.1 (Dependencies)
├─ Task 6.2 (MobilePreview)
├─ Task 6.3 (Preview API)
├─ Task 6.4 (WebSocket Preview)
├─ Task 6.5 (QR Modal)
├─ Task 6.6 (Edit Page) ←──────── Task 5.1, 6.2
└─ Task 6.7 (Thumbnails)
           │
           ↓
Phase 7: Testing & Polish
├─ Task 7.1 (Integration Tests)
├─ Task 7.2 (E2E Tests)
├─ Task 7.3 (Performance)
└─ Task 7.4 (UI Polish)
```

---

## Daily Breakdown

### Day 1-2: Backend Foundation
**Morning:**
- Task 1.1: Database migration (2h)
- Task 1.2: Update Prisma schema (0.5h)

**Afternoon:**
- Task 1.3: Seed development data (1h)
- Task 1.4: Install dependencies (0.25h)
- Task 1.5: Configure environment (0.5h)
- Start Task 2.1: ProjectService (1.5h)

### Day 3-4: Project API
**Morning:**
- Complete Task 2.1: ProjectService (1.5h)
- Task 2.2: ProjectController (2h)

**Afternoon:**
- Task 2.3: PreviewService (4h)

**Evening:**
- Start Task 2.4: WebSocketService (1h)

**Next Morning:**
- Complete Task 2.4: WebSocketService (2h)
- Task 2.5: Workflow Queue integration (2h)

**Afternoon:**
- Task 2.6: Route registration (0.5h)
- API testing with Postman (1h)

### Day 5-6: Dashboard UI
**Morning:**
- Task 3.1: Dashboard page (2h)
- Task 3.2: ProjectGrid component (2h)

**Afternoon:**
- Task 3.3: ProjectCard component (2h)
- Task 3.4: ProjectSearch component (1h)
- Task 3.5: Jotai atoms (1h)

### Day 7-8: Project Creation
**Morning:**
- Task 4.1: New project page (2h)
- Task 4.2: PromptInput component (2h)

**Afternoon:**
- Task 4.3: PlatformSelector (1h)
- Task 4.4: API integration (2h)
- Testing project creation flow (1h)

### Day 9-10: Chat Persistence
**Morning:**
- Task 5.1: ChatPanel component (3h)
- Task 5.2: ChatMessage component (1h)

**Afternoon:**
- Task 5.2: Complete ChatMessage (1h)
- Task 5.3: Chat history API integration (1h)
- Task 5.4: Send message API (2h)

**Evening:**
- Task 5.5: WebSocket chat integration (2h)

### Day 11-14: Mobile Preview
**Day 11 Morning:**
- Task 6.1: Install dependencies (0.25h)
- Task 6.2: MobilePreview component (3h)

**Day 11 Afternoon:**
- Task 6.2: Complete MobilePreview (1h)
- Task 6.3: Preview API integration (2h)

**Day 12:**
- Task 6.4: WebSocket preview integration (3h)
- Task 6.5: Expo QR modal (2h)

**Day 13:**
- Task 6.6: Project edit page (split layout) (3h)
- Integration testing (2h)

**Day 14:**
- Task 6.7: Thumbnail generation (2h)
- Bug fixes and polish (3h)

### Day 15-16: Testing & Polish
**Day 15 Morning:**
- Task 7.1: Integration tests (4h)

**Day 15 Afternoon:**
- Task 7.2: E2E tests (4h)

**Day 16 Morning:**
- Task 7.3: Performance optimization (3h)

**Day 16 Afternoon:**
- Task 7.4: UI polish and bug fixes (4h)

---

## Progress Tracking

### Phase 1: Database & Backend Setup
- [ ] Task 1.1: Create Database Migration
- [ ] Task 1.2: Update Prisma Schema
- [ ] Task 1.3: Seed Development Data
- [ ] Task 1.4: Install Backend Dependencies
- [ ] Task 1.5: Configure Environment Variables

### Phase 2: Project Management API
- [ ] Task 2.1: Create ProjectService
- [ ] Task 2.2: Create ProjectController
- [ ] Task 2.3: Create PreviewService
- [ ] Task 2.4: Create WebSocketService
- [ ] Task 2.5: Integrate Workflow Queue
- [ ] Task 2.6: Add API Route Registration

### Phase 3: Dashboard UI
- [ ] Task 3.1: Create Dashboard Page
- [ ] Task 3.2: Create ProjectGrid Component
- [ ] Task 3.3: Create ProjectCard Component
- [ ] Task 3.4: Create ProjectSearch Component
- [ ] Task 3.5: Create Jotai Atoms for State

### Phase 4: Project Creation Flow
- [ ] Task 4.1: Create New Project Page
- [ ] Task 4.2: Create PromptInput Component
- [ ] Task 4.3: Create PlatformSelector Component
- [ ] Task 4.4: Integrate Project Creation API

### Phase 5: Chat Persistence
- [ ] Task 5.1: Create ChatPanel Component
- [ ] Task 5.2: Create ChatMessage Component
- [ ] Task 5.3: Integrate Chat History API
- [ ] Task 5.4: Integrate Send Message API
- [ ] Task 5.5: Integrate WebSocket for Real-Time Chat

### Phase 6: Mobile Preview
- [ ] Task 6.1: Install Frontend Dependencies
- [ ] Task 6.2: Create MobilePreview Component
- [ ] Task 6.3: Integrate Preview API
- [ ] Task 6.4: Integrate WebSocket for Real-Time Preview
- [ ] Task 6.5: Create Expo QR Code Modal
- [ ] Task 6.6: Create Project Edit Page (Split Layout)
- [ ] Task 6.7: Add Thumbnail Generation

### Phase 7: Testing & Polish
- [ ] Task 7.1: Write Integration Tests
- [ ] Task 7.2: Write E2E Tests
- [ ] Task 7.3: Performance Optimization
- [ ] Task 7.4: UI Polish & Bug Fixes

---

**Total Tasks:** 31
**Estimated Duration:** 10-15 days (2-3 sprints)
**Team Size:** 2-3 developers (1 backend, 1-2 frontend)

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
