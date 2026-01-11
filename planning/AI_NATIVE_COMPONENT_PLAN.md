# AI Native Theme Component System - Exhaustive Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to implement a unified component system themed with the "AI Native" design language for Turbocat. The AI Native theme draws inspiration from Claude.ai and modern AI interfaces, featuring warm neutrals, terracotta accents, and a conversation-first approach.

---

## 1. AI Native Theme Specification

### 1.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAF9F7` | Main app background |
| `--background-secondary` | `#F5F4F1` | Secondary surfaces |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-hover` | `#FAF9F7` | Hover states |
| `--border` | `#E7E5E4` | Borders, dividers |
| `--primary` | `#D97706` | Terracotta/amber - primary actions |
| `--primary-hover` | `#B45309` | Primary hover state |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#1E293B` | Slate - secondary actions |
| `--secondary-foreground` | `#FFFFFF` | Text on secondary |
| `--accent` | `#65A30D` | Sage green - success/verified |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--text` | `#1E293B` | Primary text |
| `--text-muted` | `#64748B` | Secondary text |
| `--success` | `#65A30D` | Success states |
| `--warning` | `#D97706` | Warning states |
| `--error` | `#DC2626` | Error states |

### 1.2 Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `'Inter', 'Söhne', system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', monospace` |
| `--heading-weight` | `500` |
| `--letter-spacing` | `0` |

### 1.3 Effects

| Token | Value |
|-------|-------|
| `--radius` | `12px` |
| `--shadow` | `0 1px 3px rgba(0, 0, 0, 0.08)` |
| `--shadow-hover` | `0 4px 12px rgba(0, 0, 0, 0.12)` |
| `--transition` | `all 0.2s ease` |

---

## 2. Current State Analysis

### 2.1 Already Installed (Keep & Theme)

| Category | Package | Status |
|----------|---------|--------|
| **UI Primitives** | Radix UI (14 components) | Already installed |
| **Styling** | Tailwind CSS v4, CVA, clsx, tailwind-merge | Already installed |
| **Icons** | Phosphor Icons | Already installed |
| **Animations** | Framer Motion | Already installed |
| **Toasts** | Sonner | Already installed |
| **Code Editor** | Monaco Editor | Already installed |
| **Syntax Highlighting** | Shiki | Already installed |
| **Theming** | next-themes | Already installed |
| **State** | Jotai | Already installed |
| **AI SDK** | Vercel AI SDK v5 | Already installed |
| **Drawer** | Vaul | Already installed |

### 2.2 Existing shadcn/ui Components

Currently installed in `components/ui/`:
- accordion, alert, alert-dialog, avatar, badge
- button, card, checkbox, dialog, drawer
- dropdown-menu, input, label, progress
- radio-group, select, sonner, switch, tabs
- textarea, tooltip

---

## 3. Component Library Recommendations

### 3.1 Foundation Layer (USE - Already Have)

#### shadcn/ui + Radix UI Primitives
- **Status**: Already installed
- **Theming**: CSS variables (native support)
- **AI Native Compatibility**: 5/5
- **Action**: Theme existing components

**Recommendation**: Continue using shadcn/ui as the foundation. Customize globals.css with AI Native theme tokens.

#### Tailwind CSS v4
- **Status**: Already installed
- **Theming**: `@theme inline` directive
- **Action**: Update theme tokens in globals.css

### 3.2 AI Chat Components (ADD)

#### Option A: Vercel AI Elements (RECOMMENDED)
- **Link**: https://github.com/vercel/ai-elements
- **License**: MIT
- **Bundle Size**: ~15KB (tree-shakeable)
- **Theming**: Built on shadcn/ui, CSS variables
- **AI Native Compatibility**: 5/5
- **Key Components**:
  - `<Thread />` - Message thread container
  - `<Message />` - Individual messages with streaming
  - `<MessageInput />` - Chat input with attachments
  - `<Reasoning />` - AI reasoning display
  - `<ToolCall />` - Tool execution display
  - `<CodeBlock />` - Syntax-highlighted code
  - `<Markdown />` - Markdown renderer

**Pros**:
- Native Vercel AI SDK integration
- Handles streaming, tool calls, reasoning
- Already styled for AI interfaces
- shadcn/ui compatible

**Cons**:
- Relatively new (2025)
- Requires AI SDK v5+

**Installation**:
```bash
npx ai-elements@latest add thread message message-input
```

#### Option B: assistant-ui
- **Link**: https://github.com/assistant-ui/assistant-ui
- **License**: MIT
- **Theming**: Radix-style primitives
- **AI Native Compatibility**: 4/5

**Pros**:
- Works with any LLM provider
- Highly composable primitives

**Cons**:
- More setup required
- Less integrated with AI SDK

### 3.3 Code Display Components (ENHANCE)

#### Monaco Editor (Keep)
- **Status**: Already installed (@monaco-editor/react)
- **Action**: Create AI Native theme

```typescript
// AI Native Monaco Theme
{
  base: 'vs',
  inherit: true,
  colors: {
    'editor.background': '#FAF9F7',
    'editor.foreground': '#1E293B',
    'editorCursor.foreground': '#D97706',
    'editor.lineHighlightBackground': '#F5F4F1',
    'editor.selectionBackground': '#D9770620',
    'editorLineNumber.foreground': '#64748B',
  }
}
```

#### Shiki (Keep & Theme)
- **Status**: Already installed
- **Action**: Create custom AI Native theme or use `github-light` as base

### 3.4 Data Display Components (ADD)

#### TanStack Table v8 (RECOMMENDED)
- **Link**: https://tanstack.com/table
- **License**: MIT
- **Bundle Size**: ~15KB
- **Theming**: Headless (bring your own UI)
- **AI Native Compatibility**: 5/5

**Pros**:
- Headless = full style control
- Lightweight
- Virtualization support
- Already works with shadcn/ui patterns

**Installation**:
```bash
pnpm add @tanstack/react-table
```

#### TanStack Virtual (ADD)
- **Link**: https://tanstack.com/virtual
- **License**: MIT
- **Bundle Size**: ~5KB
- **Purpose**: Virtualized lists for chat history, file lists

**Installation**:
```bash
pnpm add @tanstack/react-virtual
```

### 3.5 Rich Text / Markdown (ADD)

#### Tiptap (RECOMMENDED)
- **Link**: https://tiptap.dev
- **License**: MIT (core)
- **Bundle Size**: ~50KB (with extensions)
- **Theming**: CSS + Tailwind compatible
- **AI Native Compatibility**: 5/5

**Key Features**:
- Markdown parsing/serialization
- Collaborative editing ready
- Extensible with plugins
- Good React support

**Recommended Extensions**:
```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown
```

### 3.6 Form Components (ADD)

#### React Hook Form (RECOMMENDED)
- **Link**: https://react-hook-form.com
- **License**: MIT
- **Bundle Size**: ~10KB
- **Integration**: Works with existing shadcn inputs

**Installation**:
```bash
pnpm add react-hook-form @hookform/resolvers
```

Already have Zod for validation.

### 3.7 Navigation Components (ADD)

#### cmdk (Command Palette)
- **Link**: https://cmdk.paco.me
- **License**: MIT
- **Bundle Size**: ~5KB
- **Theming**: CSS variables
- **AI Native Compatibility**: 5/5

**Installation**:
```bash
pnpm add cmdk
```

### 3.8 Charts & Data Visualization (ADD)

#### Recharts (RECOMMENDED)
- **Link**: https://recharts.org
- **License**: MIT
- **Bundle Size**: ~50KB
- **Theming**: Props-based, easy customization

**Installation**:
```bash
pnpm add recharts
```

### 3.9 Additional shadcn/ui Components to Add

```bash
# Essential components to add
npx shadcn@latest add command      # Command palette
npx shadcn@latest add sheet        # Side panels
npx shadcn@latest add skeleton     # Loading states
npx shadcn@latest add separator    # Visual dividers
npx shadcn@latest add scroll-area  # Custom scrollbars
npx shadcn@latest add popover      # Floating content
npx shadcn@latest add hover-card   # Rich tooltips
npx shadcn@latest add collapsible  # Expandable sections
npx shadcn@latest add breadcrumb   # Navigation breadcrumbs
npx shadcn@latest add resizable    # Resizable panels
npx shadcn@latest add context-menu # Right-click menus
npx shadcn@latest add menubar      # App menu bar
npx shadcn@latest add navigation-menu # Top navigation
npx shadcn@latest add toggle       # Toggle buttons
npx shadcn@latest add toggle-group # Button groups
npx shadcn@latest add slider       # Range sliders
npx shadcn@latest add calendar     # Date picker
npx shadcn@latest add date-picker  # Date input
```

---

## 4. Implementation Phases

### Phase 1: Theme Foundation (Priority: HIGH)

**Goal**: Update globals.css with AI Native theme tokens

**Tasks**:
1. Update `:root` CSS variables with AI Native light mode colors
2. Update `.dark` CSS variables (optional dark variant)
3. Update `@theme inline` Tailwind tokens
4. Create AI Native font configuration
5. Test all existing components with new theme

**Files to Modify**:
- `app/globals.css`
- `tailwind.config.ts` (if needed)
- `components/theme-provider.tsx`

**Estimated Effort**: 4-6 hours

### Phase 2: Core Component Theming (Priority: HIGH)

**Goal**: Theme all existing shadcn/ui components

**Tasks**:
1. Audit all components in `components/ui/`
2. Update button variants for AI Native style
3. Update card, dialog, alert styles
4. Update form components (input, select, checkbox, etc.)
5. Update navigation components (tabs, dropdown-menu)
6. Add consistent focus ring styling
7. Add consistent transition animations

**Files to Modify**:
- All files in `components/ui/`

**Estimated Effort**: 8-12 hours

### Phase 3: AI Chat Components (Priority: HIGH)

**Goal**: Implement AI-native chat interface

**Tasks**:
1. Install Vercel AI Elements or build custom
2. Create themed `<ChatThread />` component
3. Create themed `<ChatMessage />` component (user + AI variants)
4. Create themed `<ChatInput />` component
5. Create `<StreamingText />` component
6. Create `<ToolCallDisplay />` component
7. Create `<ReasoningPanel />` component
8. Integrate with existing task-chat.tsx

**New Files**:
- `components/chat/chat-thread.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/chat-input.tsx`
- `components/chat/streaming-text.tsx`
- `components/chat/tool-call.tsx`
- `components/chat/reasoning-panel.tsx`

**Estimated Effort**: 16-24 hours

### Phase 4: Code Display Enhancement (Priority: MEDIUM)

**Goal**: Create consistent code display components

**Tasks**:
1. Create AI Native Monaco theme
2. Create themed `<CodeBlock />` component with Shiki
3. Create `<InlineCode />` component
4. Create `<DiffViewer />` theme (already have git-diff-view)
5. Add copy-to-clipboard functionality
6. Add language detection badges

**Files to Create/Modify**:
- `lib/monaco-ai-native-theme.ts`
- `components/code/code-block.tsx`
- `components/code/inline-code.tsx`
- Modify `components/file-diff-viewer.tsx`

**Estimated Effort**: 8-12 hours

### Phase 5: Data Components (Priority: MEDIUM)

**Goal**: Add data display capabilities

**Tasks**:
1. Install TanStack Table
2. Create themed `<DataTable />` component
3. Install TanStack Virtual
4. Create `<VirtualList />` component for chat history
5. Add sorting, filtering, pagination UI
6. Create `<EmptyState />` component

**Files to Create**:
- `components/data/data-table.tsx`
- `components/data/virtual-list.tsx`
- `components/data/empty-state.tsx`

**Estimated Effort**: 12-16 hours

### Phase 6: Navigation Enhancement (Priority: MEDIUM)

**Goal**: Improve navigation UX

**Tasks**:
1. Install cmdk
2. Create themed `<CommandPalette />` component
3. Add additional shadcn components (breadcrumb, navigation-menu)
4. Create `<AppSidebar />` with collapsible sections
5. Create `<PageHeader />` standardized component

**Files to Create**:
- `components/navigation/command-palette.tsx`
- `components/navigation/app-sidebar.tsx`
- `components/navigation/page-header.tsx`

**Estimated Effort**: 8-12 hours

### Phase 7: Form Enhancement (Priority: LOW)

**Goal**: Improve form UX

**Tasks**:
1. Install React Hook Form
2. Create form wrapper components
3. Add inline validation UI
4. Create `<FormField />` composable
5. Add slider, calendar, date-picker from shadcn

**Estimated Effort**: 6-8 hours

### Phase 8: Rich Text (Priority: LOW)

**Goal**: Add rich text editing capability

**Tasks**:
1. Install Tiptap
2. Create themed `<RichTextEditor />` component
3. Add markdown shortcuts
4. Create `<MarkdownRenderer />` component

**Estimated Effort**: 8-12 hours

---

## 5. Component Inventory

### 5.1 Components to Keep (Theme Only)

| Component | Location | Notes |
|-----------|----------|-------|
| Button | ui/button.tsx | Update variants |
| Card | ui/card.tsx | Update shadows |
| Dialog | ui/dialog.tsx | Update overlay |
| Input | ui/input.tsx | Update focus ring |
| Select | ui/select.tsx | Update dropdown |
| Checkbox | ui/checkbox.tsx | Update colors |
| Switch | ui/switch.tsx | Update colors |
| Tabs | ui/tabs.tsx | Update indicator |
| Progress | ui/progress.tsx | Update colors |
| Badge | ui/badge.tsx | Add AI Native variants |
| Avatar | ui/avatar.tsx | Update ring |
| Tooltip | ui/tooltip.tsx | Update styling |
| Alert | ui/alert.tsx | Update variants |
| AlertDialog | ui/alert-dialog.tsx | Update overlay |
| Drawer | ui/drawer.tsx | Update styling |
| DropdownMenu | ui/dropdown-menu.tsx | Update styling |

### 5.2 Components to Add

| Component | Priority | Source |
|-----------|----------|--------|
| Command | HIGH | shadcn/ui |
| Sheet | HIGH | shadcn/ui |
| Skeleton | HIGH | shadcn/ui |
| Scroll Area | HIGH | shadcn/ui |
| Separator | HIGH | shadcn/ui |
| Popover | HIGH | shadcn/ui |
| ChatThread | HIGH | AI Elements / Custom |
| ChatMessage | HIGH | AI Elements / Custom |
| ChatInput | HIGH | AI Elements / Custom |
| CodeBlock | MEDIUM | Custom + Shiki |
| DataTable | MEDIUM | Custom + TanStack |
| VirtualList | MEDIUM | Custom + TanStack |
| CommandPalette | MEDIUM | Custom + cmdk |
| Resizable | MEDIUM | shadcn/ui |
| HoverCard | LOW | shadcn/ui |
| Calendar | LOW | shadcn/ui |
| Slider | LOW | shadcn/ui |
| RichTextEditor | LOW | Custom + Tiptap |

### 5.3 Specialized Components to Create

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| StreamingText | Animated text streaming | Framer Motion |
| ToolCallDisplay | Show AI tool executions | None |
| ReasoningPanel | Collapsible AI reasoning | Collapsible |
| FileTree | File browser sidebar | Recursive component |
| TerminalOutput | Terminal-style output | Custom |
| LoadingDots | AI thinking indicator | Framer Motion |
| MessageReaction | Like/copy/regenerate | Button, Tooltip |
| AttachmentPreview | File attachments in chat | Card, Image |

---

## 6. Design System Files

### 6.1 File Structure

```
turbocat-agent/
├── app/
│   └── globals.css              # Theme tokens
├── lib/
│   ├── themes/
│   │   ├── ai-native.ts         # Theme config export
│   │   └── monaco-theme.ts      # Monaco editor theme
│   └── utils.ts                 # cn() helper (existing)
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── chat/                    # AI chat components
│   │   ├── chat-thread.tsx
│   │   ├── chat-message.tsx
│   │   ├── chat-input.tsx
│   │   ├── streaming-text.tsx
│   │   ├── tool-call.tsx
│   │   └── reasoning-panel.tsx
│   ├── code/                    # Code display components
│   │   ├── code-block.tsx
│   │   └── inline-code.tsx
│   ├── data/                    # Data components
│   │   ├── data-table.tsx
│   │   ├── virtual-list.tsx
│   │   └── empty-state.tsx
│   └── navigation/              # Navigation components
│       ├── command-palette.tsx
│       ├── app-sidebar.tsx
│       └── page-header.tsx
```

---

## 7. Dependencies Summary

### 7.1 To Install

```bash
# Core additions
pnpm add cmdk @tanstack/react-table @tanstack/react-virtual

# Form enhancement
pnpm add react-hook-form @hookform/resolvers

# Rich text (optional)
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown

# Charts (optional)
pnpm add recharts

# AI Elements (if using Vercel's library)
npx ai-elements@latest init
```

### 7.2 shadcn/ui Components to Add

```bash
npx shadcn@latest add command sheet skeleton separator scroll-area \
  popover hover-card collapsible breadcrumb resizable context-menu \
  menubar navigation-menu toggle toggle-group slider calendar
```

---

## 8. Testing Strategy

### 8.1 Visual Testing

- Storybook stories for all components
- Dark/light mode toggle testing
- Responsive breakpoint testing
- Focus state visibility testing

### 8.2 Accessibility Testing

- Keyboard navigation
- Screen reader compatibility
- Color contrast (WCAG AA)
- Focus management in dialogs

### 8.3 Integration Testing

- Component composition
- Theme switching
- State management with Jotai
- AI SDK streaming integration

---

## 9. Migration Checklist

- [ ] Update globals.css with AI Native theme tokens
- [ ] Test existing pages with new theme
- [ ] Update button.tsx variants
- [ ] Update all form components
- [ ] Update card/dialog/alert components
- [ ] Add missing shadcn components
- [ ] Create chat component suite
- [ ] Create code display components
- [ ] Create data table component
- [ ] Create command palette
- [ ] Update file browser styling
- [ ] Update task page styling
- [ ] Update settings page styling
- [ ] Create Storybook stories
- [ ] Run accessibility audit
- [ ] Performance optimization

---

## 10. Resources

### Documentation
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Tailwind v4 Theming](https://ui.shadcn.com/docs/tailwind-v4)
- [Vercel AI Elements](https://github.com/vercel/ai-elements)
- [TanStack Table](https://tanstack.com/table/latest)
- [cmdk](https://cmdk.paco.me)
- [Tiptap](https://tiptap.dev)

### Theme Generators
- [tweakcn](https://tweakcn.com/) - Visual shadcn theme editor
- [shadcn-custom-theme](https://github.com/kiliman/shadcn-custom-theme)

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Radix UI deprecation | Medium | High | Monitor React Aria as alternative |
| AI Elements breaking changes | Low | Medium | Pin version, test before updates |
| Theme inconsistencies | Medium | Low | Comprehensive Storybook coverage |
| Bundle size increase | Medium | Medium | Tree-shake, lazy load heavy components |
| Dark mode contrast issues | Low | Medium | Test with accessibility tools |

---

## 12. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Theme Foundation | 1 day | None |
| Phase 2: Core Theming | 2 days | Phase 1 |
| Phase 3: AI Chat | 3-4 days | Phase 1 |
| Phase 4: Code Display | 1-2 days | Phase 1 |
| Phase 5: Data Components | 2-3 days | Phase 2 |
| Phase 6: Navigation | 1-2 days | Phase 2 |
| Phase 7: Forms | 1 day | Phase 2 |
| Phase 8: Rich Text | 1-2 days | Phase 2 |

**Total Estimated Time**: 12-18 days

---

## 13. Approval Required

This plan affects:
- Core architecture (component system)
- Multiple files (>20)
- User-facing UI/UX
- New dependencies

**Approval Gate**: Please review and approve before proceeding with implementation.
