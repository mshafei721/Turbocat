# Development Tasks: Editing & Iteration Tools

**Feature:** EDIT-001 - Editing & Iteration Tools
**Last Updated:** 2026-01-12
**Total Effort:** 3-5 days

---

## Task Overview

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1: Backend Suggestions | 4 tasks | 1 day | None |
| Phase 2: Suggested Prompts UI | 3 tasks | 1 day | Phase 1 |
| Phase 3: Advanced Toolbar | 3 tasks | 1 day | None |
| Phase 4: Configuration Panels | 4 tasks | 2 days | Phase 3 |
| Phase 5: Testing & Polish | 2 tasks | 1 day | All phases |

---

## Phase 1: Backend Suggestions (Day 1)

### Task 1.1: Create SuggestionService
**Effort:** 3 hours
**Owner:** Backend Developer
**Priority:** P0

**Description:**
Implement suggestion service with starter and contextual suggestion logic.

**Acceptance Criteria:**
- [ ] getStarterSuggestions() returns 6 suggestions
- [ ] getContextualSuggestions() analyzes chat history
- [ ] analyzeProjectState() detects features (dark mode, auth, etc.)
- [ ] Suggestions have priority sorting
- [ ] Unit tests written (80% coverage)

**Files:**
- `backend/src/services/SuggestionService.ts`
- `backend/src/services/__tests__/SuggestionService.test.ts`

---

### Task 1.2: Create Suggestion Controller
**Effort:** 1 hour
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.1

**Description:**
Create REST API endpoint for fetching suggestions.

**Acceptance Criteria:**
- [ ] GET /api/v1/projects/:id/suggestions endpoint
- [ ] Auth middleware applied
- [ ] Error handling implemented
- [ ] Returns suggestions array

**Files:**
- `backend/src/controllers/SuggestionController.ts`
- `backend/src/routes/projects.ts`

---

### Task 1.3: Add Route Registration
**Effort:** 15 minutes
**Owner:** Backend Developer
**Priority:** P0
**Dependencies:** Task 1.2

**Description:**
Register new suggestion route in Express app.

**Acceptance Criteria:**
- [ ] Route registered in projects router
- [ ] Tested with Postman/Insomnia

**Files:**
- `backend/src/routes/projects.ts`

---

### Task 1.4: Write Unit Tests
**Effort:** 1 hour
**Owner:** Backend Developer
**Priority:** P1
**Dependencies:** Task 1.1, 1.2

**Description:**
Write comprehensive unit tests for suggestion logic.

**Acceptance Criteria:**
- [ ] Test starter suggestions for mobile/web
- [ ] Test contextual suggestions with various states
- [ ] Test analyzeProjectState() with different inputs
- [ ] All tests pass

**Files:**
- `backend/src/services/__tests__/SuggestionService.test.ts`

---

## Phase 2: Suggested Prompts UI (Day 2)

### Task 2.1: Create SuggestedPrompts Component
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Phase 1 complete

**Description:**
Build suggested prompts component with horizontal scroll.

**Acceptance Criteria:**
- [ ] Horizontal scrollable chip container
- [ ] Fetches suggestions from API
- [ ] Clicking chip calls onSelect callback
- [ ] Loading state while fetching
- [ ] Empty state (no suggestions) handled
- [ ] Styled with Tailwind (pill chips)

**Files:**
- `turbocat-agent/components/turbocat/SuggestedPrompts.tsx`

---

### Task 2.2: Integrate with ChatPanel
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 2.1

**Description:**
Add SuggestedPrompts to ChatPanel component.

**Acceptance Criteria:**
- [ ] Suggestions displayed below chat input
- [ ] Clicking suggestion inserts text into input
- [ ] Suggestions update after AI response (via WebSocket)
- [ ] Component positioned correctly

**Files:**
- `turbocat-agent/components/turbocat/ChatPanel.tsx`

---

### Task 2.3: Add Refresh Logic
**Effort:** 1 hour
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Task 2.2

**Description:**
Implement suggestion refresh after AI responses.

**Acceptance Criteria:**
- [ ] Fetch new suggestions after chat message sent
- [ ] Debounce fetching (500ms)
- [ ] Cache suggestions for 5 minutes
- [ ] Handle fetch errors gracefully

**Files:**
- `turbocat-agent/components/turbocat/SuggestedPrompts.tsx`

---

## Phase 3: Advanced Toolbar (Day 3)

### Task 3.1: Create AdvancedToolbar Component
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P0

**Description:**
Build advanced toolbar with 12 icon buttons.

**Acceptance Criteria:**
- [ ] Display 12 icons with Phosphor Icons
- [ ] Tooltips on hover
- [ ] Collapse/expand functionality
- [ ] Icons disabled based on platform (e.g., Haptics for web)
- [ ] Clicking icon sets activePanel state
- [ ] Keyboard shortcuts registered

**Files:**
- `turbocat-agent/components/turbocat/AdvancedToolbar.tsx`

---

### Task 3.2: Implement Keyboard Shortcuts
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Task 3.1

**Description:**
Add keyboard shortcut handling for all toolbar icons.

**Acceptance Criteria:**
- [ ] Listen for Cmd/Ctrl+Shift+[Key] combinations
- [ ] Open corresponding panel on shortcut
- [ ] Prevent default browser behavior
- [ ] Shortcuts work on Mac and Windows

**Files:**
- `turbocat-agent/components/turbocat/AdvancedToolbar.tsx`

---

### Task 3.3: Integrate with ChatPanel
**Effort:** 30 minutes
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Add AdvancedToolbar to ChatPanel below suggested prompts.

**Acceptance Criteria:**
- [ ] Toolbar positioned at bottom of chat panel
- [ ] onInsert callback inserts prompt into input
- [ ] Toolbar state persisted in localStorage

**Files:**
- `turbocat-agent/components/turbocat/ChatPanel.tsx`

---

## Phase 4: Configuration Panels (Day 4-5)

### Task 4.1: Create ImagePanel
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build configuration panel for image upload feature.

**Acceptance Criteria:**
- [ ] Source selection (Camera, Gallery)
- [ ] Max size input (MB)
- [ ] Format checkboxes (JPG, PNG, HEIC, GIF)
- [ ] Aspect ratio radio buttons
- [ ] Generate prompt from config
- [ ] Modal overlay with slide-in animation

**Files:**
- `turbocat-agent/components/turbocat/panels/ImagePanel.tsx`

---

### Task 4.2: Create AudioPanel
**Effort:** 1.5 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build configuration panel for audio recording feature.

**Acceptance Criteria:**
- [ ] Source selection (Microphone, File Upload)
- [ ] Max duration input
- [ ] Format selection (MP3, WAV, AAC)
- [ ] Generate prompt from config

**Files:**
- `turbocat-agent/components/turbocat/panels/AudioPanel.tsx`

---

### Task 4.3: Create APIPanel
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P0
**Dependencies:** Task 3.1

**Description:**
Build configuration panel for API integration.

**Acceptance Criteria:**
- [ ] Method selection (GET, POST, PUT, DELETE)
- [ ] URL input with validation
- [ ] Headers key-value input
- [ ] Authentication selection (None, Bearer, API Key)
- [ ] Generate prompt from config

**Files:**
- `turbocat-agent/components/turbocat/panels/APIPanel.tsx`

---

### Task 4.4: Create Remaining Panels
**Effort:** 6 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Task 4.1, 4.2, 4.3

**Description:**
Create configuration panels for remaining 9 features.

**Acceptance Criteria:**
- [ ] PaymentPanel (Stripe, PayPal config)
- [ ] CloudPanel (AWS S3, Firebase config)
- [ ] HapticsPanel (Intensity, pattern)
- [ ] FilePanel (Permissions, directory)
- [ ] EnvPanel (Key-value pairs)
- [ ] LogsPanel (Log level, target)
- [ ] UIPanel (Component library picker)
- [ ] SelectPanel (Dropdown, checkboxes, radio)
- [ ] RequestPanel (Similar to APIPanel but simpler)

**Files:**
- `turbocat-agent/components/turbocat/panels/*.tsx` (9 files)

---

## Phase 5: Testing & Polish (Day 5)

### Task 5.1: Write E2E Tests
**Effort:** 3 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** All phases complete

**Description:**
Write Playwright E2E tests for suggestions and toolbar.

**Acceptance Criteria:**
- [ ] Test clicking suggested prompt inserts text
- [ ] Test toolbar icon click opens panel
- [ ] Test keyboard shortcut opens panel
- [ ] Test panel configuration and submission
- [ ] Test collapse/expand toolbar

**Files:**
- `turbocat-agent/tests/e2e/editing-tools.spec.ts`

---

### Task 5.2: UI Polish & Bug Fixes
**Effort:** 2 hours
**Owner:** Frontend Developer
**Priority:** P1
**Dependencies:** Phase 4 complete

**Description:**
Final UI polish, animations, and bug fixes.

**Acceptance Criteria:**
- [ ] Smooth animations (chip hover, panel slide)
- [ ] Responsive design (mobile, tablet)
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Cross-browser testing
- [ ] Loading states consistent

**Files:**
- Various (polish across components)

---

## Task Dependencies Diagram

```
Phase 1: Backend
├─ Task 1.1 (SuggestionService) ────┐
├─ Task 1.2 (Controller) ←──────────┤
├─ Task 1.3 (Route Registration)    │
└─ Task 1.4 (Unit Tests) ←──────────┘
           │
           ↓
Phase 2: Suggested Prompts
├─ Task 2.1 (Component)
├─ Task 2.2 (Integration) ←─────────┤
└─ Task 2.3 (Refresh Logic)         │
           │                        │
           ↓                        │
Phase 3: Toolbar ←──────────────────┘
├─ Task 3.1 (Toolbar Component)
├─ Task 3.2 (Keyboard Shortcuts)
└─ Task 3.3 (Integration)
           │
           ↓
Phase 4: Config Panels
├─ Task 4.1 (ImagePanel)
├─ Task 4.2 (AudioPanel)
├─ Task 4.3 (APIPanel)
└─ Task 4.4 (Remaining 9 Panels)
           │
           ↓
Phase 5: Testing & Polish
├─ Task 5.1 (E2E Tests)
└─ Task 5.2 (UI Polish)
```

---

## Daily Breakdown

### Day 1: Backend Suggestions
**Morning:**
- Task 1.1: SuggestionService (3h)

**Afternoon:**
- Task 1.2: Controller (1h)
- Task 1.3: Route registration (0.25h)
- Task 1.4: Unit tests (1h)

### Day 2: Suggested Prompts UI
**Morning:**
- Task 2.1: SuggestedPrompts component (2h)
- Task 2.2: Integration with ChatPanel (1h)

**Afternoon:**
- Task 2.3: Refresh logic (1h)
- Testing and polish (1h)

### Day 3: Advanced Toolbar
**Morning:**
- Task 3.1: AdvancedToolbar component (3h)

**Afternoon:**
- Task 3.2: Keyboard shortcuts (2h)
- Task 3.3: Integration (0.5h)

### Day 4: Configuration Panels (Part 1)
**Morning:**
- Task 4.1: ImagePanel (2h)
- Task 4.2: AudioPanel (1.5h)

**Afternoon:**
- Task 4.3: APIPanel (2h)
- Start Task 4.4: PaymentPanel, CloudPanel (1.5h)

### Day 5: Configuration Panels (Part 2) + Testing
**Morning:**
- Complete Task 4.4: Remaining 7 panels (4h)

**Afternoon:**
- Task 5.1: E2E tests (3h)
- Task 5.2: UI polish (2h)

---

## Progress Tracking

### Phase 1: Backend Suggestions
- [ ] Task 1.1: Create SuggestionService
- [ ] Task 1.2: Create Suggestion Controller
- [ ] Task 1.3: Add Route Registration
- [ ] Task 1.4: Write Unit Tests

### Phase 2: Suggested Prompts UI
- [ ] Task 2.1: Create SuggestedPrompts Component
- [ ] Task 2.2: Integrate with ChatPanel
- [ ] Task 2.3: Add Refresh Logic

### Phase 3: Advanced Toolbar
- [ ] Task 3.1: Create AdvancedToolbar Component
- [ ] Task 3.2: Implement Keyboard Shortcuts
- [ ] Task 3.3: Integrate with ChatPanel

### Phase 4: Configuration Panels
- [ ] Task 4.1: Create ImagePanel
- [ ] Task 4.2: Create AudioPanel
- [ ] Task 4.3: Create APIPanel
- [ ] Task 4.4: Create Remaining Panels

### Phase 5: Testing & Polish
- [ ] Task 5.1: Write E2E Tests
- [ ] Task 5.2: UI Polish & Bug Fixes

---

**Total Tasks:** 16
**Estimated Duration:** 3-5 days
**Team Size:** 2 developers (1 backend, 1 frontend)

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
