# Turbocat User Flows & Journey Analysis

## Executive Summary

This document analyzes the current state of user flows, identifies gaps, and proposes a comprehensive redesign for the Turbocat vibecoding platform.

---

## Current State Analysis

### Identified Issues

1. **Mock Data Problem**
   - `app/(dashboard)/project/[id]/page.tsx` uses hardcoded `demoProject` and `demoMessages`
   - Project name always shows "TripIntel" regardless of user input
   - Chat shows static demo messages, not real AI responses

2. **Task Creation Flow Broken**
   - `/new` page creates task via `/api/tasks` POST
   - API expects `repoUrl` for existing repo workflow
   - New "from prompt" flow has no repo - flow disconnects

3. **Obsolete Sidebar**
   - `Sidebar.tsx` exists but not integrated with new workspace
   - No file explorer showing generated files
   - Tasks/repos lists are stale

4. **Missing Components**
   - No file browser for generated code
   - No terminal/console view
   - No repo linking step after file generation

---

## Proposed User Journey

### Journey 1: New Project from Prompt (Greenfield)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TURBOCAT USER JOURNEY                               │
│                      New Project from Prompt Flow                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Landing   │───►│   /login    │───►│  /dashboard  │───►│     /new        │
│   Page      │    │   OAuth     │    │  Project     │    │  Prompt +       │
│             │    │   Flow      │    │  List        │    │  Platform       │
└─────────────┘    └─────────────┘    └──────────────┘    └────────┬────────┘
                                                                    │
                                                                    ▼
                   ┌──────────────────────────────────────────────────────────┐
                   │                 /project/[id] - WORKSPACE                │
                   │                                                          │
                   │  ┌─────────────────┬─────────────────┬────────────────┐  │
                   │  │                 │                 │                │  │
                   │  │   File Explorer │   Chat Panel    │   Preview      │  │
                   │  │   (Tree View)   │   (AI Convo)    │   (Live App)   │  │
                   │  │                 │                 │                │  │
                   │  │  - Files        │  - User msgs    │  - Web: iframe │  │
                   │  │  - Folders      │  - AI response  │  - Mobile: QR  │  │
                   │  │  - Terminal     │  - Code blocks  │                │  │
                   │  │                 │                 │                │  │
                   │  └─────────────────┴─────────────────┴────────────────┘  │
                   │                                                          │
                   │  Progress Bar: [████████░░░░░░░░░░░░] 40% Generating...  │
                   │                                                          │
                   └──────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                   ┌──────────────────────────────────────────────────────────┐
                   │              POST-GENERATION OPTIONS                      │
                   │                                                          │
                   │  ┌────────────────────┐  ┌────────────────────┐         │
                   │  │  Connect to GitHub │  │  Skip for Now      │         │
                   │  │  • Create new repo │  │  • Continue editing│         │
                   │  │  • Push to existing│  │  • Export ZIP      │         │
                   │  └────────────────────┘  └────────────────────┘         │
                   │                                                          │
                   └──────────────────────────────────────────────────────────┘
```

### Journey 2: Existing Repository Enhancement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TURBOCAT USER JOURNEY                               │
│                    Existing Repository Enhancement                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌──────────────────────────────────────┐
│  /dashboard │───►│  /new       │───►│  Repository Selection                │
│             │    │             │    │  • Search GitHub repos               │
│             │    │             │    │  • Select from list                  │
│             │    │             │    │  • Enter URL manually                │
└─────────────┘    └─────────────┘    └──────────────────────────────────────┘
                                                         │
                                                         ▼
                   ┌──────────────────────────────────────────────────────────┐
                   │                 /project/[id] - WORKSPACE                │
                   │                                                          │
                   │  • Clone repo into sandbox                               │
                   │  • AI analyzes existing codebase                         │
                   │  • User describes changes                                │
                   │  • AI makes modifications                                │
                   │  • Preview changes in real-time                          │
                   │  • Create PR to original repo                            │
                   │                                                          │
                   └──────────────────────────────────────────────────────────┘
```

---

## Workspace Layout Redesign

### Three-Panel Layout

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Project Name ▼ | Clear Context | Credits | Share | Publish     │
├──────────────────┬───────────────────────────────┬─────────────────────────────┤
│                  │                               │                             │
│   FILE EXPLORER  │       CHAT PANEL              │      PREVIEW PANEL          │
│   (240px)        │       (flex-1)                │      (flex-1)               │
│                  │                               │                             │
│  📁 src/         │  ┌─────────────────────────┐  │  ┌─────────────────────┐   │
│    📄 App.tsx    │  │ AI: I'll help you...    │  │  │                     │   │
│    📄 index.ts   │  │                         │  │  │   [Live Preview]    │   │
│  📁 components/  │  │ Code blocks with        │  │  │                     │   │
│    📄 Button.tsx │  │ copy/apply buttons      │  │  │   - Iframe (web)    │   │
│  📄 package.json │  │                         │  │  │   - QR Code (mobile)│   │
│                  │  └─────────────────────────┘  │  │                     │   │
│  ──────────────  │                               │  └─────────────────────┘   │
│                  │  ┌─────────────────────────┐  │                             │
│   TERMINAL       │  │ Type your message...    │  │  [Web] [Mobile] [Console]  │
│   $ npm run dev  │  │                    Send │  │                             │
│   > Ready...     │  └─────────────────────────┘  │                             │
│                  │                               │                             │
└──────────────────┴───────────────────────────────┴─────────────────────────────┘
```

### File Explorer Features

1. **Tree View**
   - Collapsible folders
   - File icons by type
   - Modified indicator (dot)
   - Selected file highlighting

2. **Context Menu**
   - Create file/folder
   - Rename
   - Delete
   - Copy path

3. **Terminal Section**
   - Real-time sandbox terminal
   - Command history
   - Output streaming

### Chat Panel Features

1. **Message Types**
   - User messages (right-aligned bubble)
   - AI responses (left-aligned, full width)
   - Code blocks with syntax highlighting
   - File operation cards (created, modified, deleted)

2. **Input Area**
   - Multi-line textarea
   - File attachment
   - Voice input (future)

### Preview Panel Features

1. **Web Mode**
   - Live iframe preview
   - Refresh button
   - Open in new tab
   - Responsive viewport selector

2. **Mobile Mode**
   - QR code for Expo Go
   - Device frame mockup
   - Platform toggle (iOS/Android)

---

## Data Flow Architecture

### Task States

```
┌─────────┐    ┌────────────┐    ┌──────────────┐    ┌───────────┐
│ pending │───►│ processing │───►│  completed   │───►│  archived │
└─────────┘    └────────────┘    └──────────────┘    └───────────┘
                     │                                      ▲
                     │           ┌─────────┐                │
                     └──────────►│  error  │────────────────┘
                                 └─────────┘
```

### Database Schema Updates Needed

```typescript
// tasks table additions
{
  // Project metadata (from prompt)
  projectName: text('project_name'),        // AI-generated or user-provided
  projectIcon: text('project_icon'),        // Emoji or image URL
  projectDescription: text('project_description'),

  // File tracking
  generatedFiles: jsonb('generated_files'), // Array of file paths

  // GitHub connection (optional)
  githubRepoId: text('github_repo_id'),     // After user connects
  githubRepoUrl: text('github_repo_url'),

  // Sandbox state
  sandboxFiles: jsonb('sandbox_files'),     // Current file tree
}
```

---

## Implementation Tasks

### Phase 1: Fix Current Issues (Critical)

- [ ] 1.1 Update `/project/[id]/page.tsx` to fetch real task data
- [ ] 1.2 Generate project name from prompt (AI or first 3 words)
- [ ] 1.3 Fetch and display real chat messages from `taskMessages` table
- [ ] 1.4 Remove all mock/demo data

### Phase 2: File Explorer Sidebar

- [ ] 2.1 Create `FileExplorer.tsx` component
- [ ] 2.2 Integrate with sandbox file API
- [ ] 2.3 Add terminal view component
- [ ] 2.4 Update `WorkspacePage` layout to 3-panel

### Phase 3: Chat Panel Enhancements

- [ ] 3.1 Real-time message streaming
- [ ] 3.2 Code block rendering with copy/apply
- [ ] 3.3 File operation cards
- [ ] 3.4 Progress indicators

### Phase 4: GitHub Integration

- [ ] 4.1 Post-generation "Connect to GitHub" modal
- [ ] 4.2 Create new repo option
- [ ] 4.3 Push to existing repo option
- [ ] 4.4 Skip option with export ZIP

### Phase 5: Preview Panel

- [ ] 5.1 Live iframe preview with refresh
- [ ] 5.2 Mobile QR code integration
- [ ] 5.3 Console output view
- [ ] 5.4 Viewport selector

---

## API Endpoints Needed

### New Endpoints

```typescript
// GET /api/tasks/[taskId]/files
// Returns file tree from sandbox

// POST /api/tasks/[taskId]/file
// Read file content from sandbox

// PUT /api/tasks/[taskId]/file
// Write file content to sandbox

// DELETE /api/tasks/[taskId]/file
// Delete file from sandbox

// POST /api/tasks/[taskId]/github/connect
// Connect task to GitHub repo (create new or link existing)

// GET /api/tasks/[taskId]/messages
// Get chat messages (already exists, need to verify)

// POST /api/tasks/[taskId]/messages
// Send new message (already exists, need to verify)
```

---

## Questions for User

1. **File Explorer Position**: Left sidebar or collapsible tab?
2. **Terminal**: Always visible or in a tab/panel?
3. **Mobile Preview**: QR code only or also device frame mockup?
4. **GitHub Connect**: Mandatory or optional step?
5. **Export Options**: ZIP download, GitHub, or both?

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database schema changes | High | Use migrations, test thoroughly |
| Breaking existing tasks | Medium | Add new fields as nullable |
| Sandbox file API complexity | Medium | Start with read-only, add write later |
| Real-time streaming | Low | Use existing streaming infrastructure |

---

## Next Steps

1. **Review this document** - Confirm user flows match expectations
2. **Answer questions** - Clarify design decisions
3. **Phase 1 Implementation** - Fix mock data issues
4. **Iterate** - Add features incrementally

