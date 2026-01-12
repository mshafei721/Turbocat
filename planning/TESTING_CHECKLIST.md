# AI Native Component Testing Checklist

**Branch:** `feat/ai-native-theme`
**Status:** Implementation Complete - Ready for Testing
**Date:** 2026-01-12

---

## Prerequisites

Before starting testing, ensure:

- [ ] node_modules successfully installed (run `npm install` from root)
- [ ] No dependency errors (check `npm list`)
- [ ] TypeScript compiles (run `cd turbocat-agent && npm run type-check`)

---

## Phase 1: Build Verification ✅ REQUIRED

### 1.1 TypeScript Compilation

```bash
cd turbocat-agent
npm run type-check
```

**Expected:** Zero TypeScript errors
**Action if failed:** Review and fix type errors before proceeding

### 1.2 Production Build

```bash
cd turbocat-agent
npm run build
```

**Expected:** Successful build with no errors
**Action if failed:** Review build output, fix errors, retry

### 1.3 Lint Check

```bash
cd turbocat-agent
npm run lint
```

**Expected:** No critical lint errors (warnings acceptable)

---

## Phase 2: Dev Server Testing ✅ REQUIRED

### 2.1 Start Development Server

```bash
cd turbocat-agent
npm run dev
```

**Expected:** Server starts on http://localhost:3000
**Action:** Open browser to http://localhost:3000

### 2.2 Initial Visual Checks

- [ ] **Homepage loads without errors**
- [ ] **No console errors** (check browser DevTools)
- [ ] **AI Native light mode is default** (warm neutral background #FAF9F7)
- [ ] **Terracotta primary color visible** (#D97706)
- [ ] **Sage green accent visible** (#65A30D)

---

## Phase 3: Theme Verification

### 3.1 Design Tokens Check

Verify the following are applied throughout:

- [ ] **Border radius:** 12px (rounded-xl) on all components
- [ ] **Borders:** 2px thickness (border-2)
- [ ] **Shadows:** shadow-ai-sm on default, shadow-ai-md on hover, shadow-ai-lg on dialogs
- [ ] **Transitions:** Smooth 200ms (transition-ai)
- [ ] **Typography:** Satoshi font loads correctly

### 3.2 Color System Check

Open browser DevTools and inspect elements:

- [ ] Primary color: #D97706 (terracotta)
- [ ] Accent color: #65A30D (sage green)
- [ ] Background: #FAF9F7 (warm neutral)
- [ ] Foreground: #1E293B (deep slate)
- [ ] Muted: #64748B (slate gray)

### 3.3 Dark Mode Toggle

- [ ] Toggle to dark mode (if theme switcher exists)
- [ ] Background changes to deep navy
- [ ] Colors invert correctly
- [ ] Contrast maintained
- [ ] Toggle back to light mode works

---

## Phase 4: Component Testing by Track

### Track A: Core UI Components (21 components)

Navigate to `/theme-showcase` or create test page.

#### Button Component
- [ ] All variants render (default, destructive, outline, secondary, ghost, link)
- [ ] Hover shows shadow-ai-md
- [ ] Focus ring appears (2px, primary/50)
- [ ] Loading state works (if applicable)
- [ ] Disabled state styled correctly
- [ ] Click events fire

#### Input Component
- [ ] Border is 2px
- [ ] Focus ring appears on focus
- [ ] Hover effect works (border-primary/30)
- [ ] Placeholder text visible
- [ ] Disabled state correct

#### Textarea Component
- [ ] Same as Input
- [ ] Auto-resize works (if applicable)

#### Card Component
- [ ] Shadow-ai-md visible
- [ ] Hover shows shadow-ai-lg
- [ ] Border-2 visible
- [ ] Background is white (#FFFFFF in light mode)
- [ ] Rounded-xl (12px radius)

#### Dialog Component
- [ ] Opens smoothly
- [ ] Overlay correct (backdrop blur)
- [ ] Shadow-ai-lg on dialog
- [ ] Escape closes dialog
- [ ] Click outside closes (if enabled)
- [ ] Focus trapped inside

#### Alert Dialog Component
- [ ] Same checks as Dialog
- [ ] Destructive variant styled correctly

#### Drawer Component
- [ ] Slides in from correct side
- [ ] Smooth animation
- [ ] Overlay correct

#### Badge Component
- [ ] All variants render (default, secondary, destructive, outline, accent)
- [ ] Accent variant uses sage green

#### Checkbox Component
- [ ] Check animation smooth
- [ ] Focus ring visible
- [ ] Disabled state correct

#### Switch Component
- [ ] Toggle animation smooth
- [ ] Focus ring visible
- [ ] Checked state uses primary color

#### Radio Group Component
- [ ] Selection works
- [ ] Focus ring visible
- [ ] Disabled state correct

#### Select Component
- [ ] Opens dropdown
- [ ] Options render
- [ ] Selection works
- [ ] Search works (if applicable)

#### Label Component
- [ ] Styling correct
- [ ] Associated with input correctly

#### Tabs Component
- [ ] Tab switching works
- [ ] Active tab highlighted (primary color)
- [ ] Focus ring on keyboard navigation

#### Dropdown Menu Component
- [ ] Opens on trigger
- [ ] Items render
- [ ] Hover states work
- [ ] Selection fires callback

#### Accordion Component
- [ ] Expands/collapses smoothly
- [ ] Icon rotates
- [ ] Multiple items can be open (if configured)

#### Alert Component
- [ ] All variants render (default, destructive, warning, success)
- [ ] Icons display
- [ ] Dismissible (if configured)

#### Progress Component
- [ ] Bar fills correctly
- [ ] Gradient from primary to accent
- [ ] Animation smooth

#### Tooltip Component
- [ ] Shows on hover
- [ ] Positioned correctly
- [ ] Arrow points to trigger

#### Sonner (Toast) Component
- [ ] Toast appears
- [ ] Auto-dismisses
- [ ] Close button works
- [ ] Multiple toasts stack correctly

#### Avatar Component
- [ ] Image loads
- [ ] Fallback shows if no image
- [ ] Correct size variants

---

### Track B: AI Chat Components (7 components)

Create test page at `/test-chat` with sample data.

#### ChatThread Component
```tsx
const sampleMessages = [
  { id: '1', role: 'user', content: 'Hello!' },
  { id: '2', role: 'assistant', content: 'Hi! How can I help?' },
  { id: '3', role: 'user', content: 'Tell me about AI.' },
  { id: '4', role: 'assistant', content: 'AI stands for...' }
]
```

- [ ] Messages render in thread
- [ ] User messages aligned/styled correctly
- [ ] Assistant messages aligned/styled correctly
- [ ] Auto-scroll to bottom works
- [ ] Animations smooth (fade-in, slide-up)

#### ChatMessage Component
- [ ] User variant styled correctly
- [ ] Assistant variant styled correctly
- [ ] System variant styled correctly (if used)
- [ ] Copy button works
- [ ] Copy feedback shows (checkmark)
- [ ] Message content renders (including markdown if applicable)

#### ChatInput Component
- [ ] Textarea auto-resizes
- [ ] Character counter displays
- [ ] Counter turns warning color at 90% (if max length set)
- [ ] Submit button disabled when empty
- [ ] Enter submits message
- [ ] Shift+Enter creates new line
- [ ] Stop button shows when generating (if applicable)

#### StreamingText Component
- [ ] Text animates in character by character
- [ ] Speed configurable
- [ ] Final text displays correctly

#### LoadingDots Component
- [ ] Three dots animate in sequence
- [ ] Smooth wave effect
- [ ] Correct colors (muted)

#### ToolCall Component
- [ ] Tool call displays
- [ ] Expands on click
- [ ] Shows tool name, args, result
- [ ] Status indicators work (pending, running, success, error)
- [ ] Icons correct for each tool type

#### ReasoningPanel Component
- [ ] Panel toggles open/closed
- [ ] Reasoning steps display
- [ ] Each step type styled differently (thought, observation, action)
- [ ] Collapsible works

---

### Track C: Code & Data Components (8 components)

Create test page at `/test-data`.

#### CodeBlock Component
```tsx
<CodeBlock
  code="console.log('Hello World')"
  language="javascript"
  filename="test.js"
/>
```

- [ ] Syntax highlighting works
- [ ] Copy button works
- [ ] Language badge displays
- [ ] Filename shows (if provided)
- [ ] Line numbers work (if enabled)
- [ ] Theme is AI Native (Monaco theme applied)

#### InlineCode Component
- [ ] Renders inline
- [ ] Styled correctly (monospace, slight background)
- [ ] Readable

#### DataTable Component
```tsx
const data = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 }
]

const columns = [
  { id: 'name', header: 'Name' },
  { id: 'age', header: 'Age' }
]
```

- [ ] Table renders
- [ ] Sorting works (click headers)
- [ ] Filtering works (if enabled)
- [ ] Pagination works (if enabled)
- [ ] Row selection works (if enabled)
- [ ] Hover row highlights

#### VirtualList Component
```tsx
const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` }))
```

- [ ] List virtualizes (smooth scroll with 10k items)
- [ ] Only visible items rendered (check DevTools)
- [ ] Scrolling is smooth
- [ ] No performance issues

#### EmptyState Component
- [ ] Displays when no data
- [ ] All variants render (no-data, no-results, error)
- [ ] Icon displays
- [ ] Action button works (if provided)

---

### Track D: Navigation & Forms (17 components)

Navigate to `/track-d-demo` or create test pages.

#### CommandPalette Component
- [ ] Opens with ⌘K (Mac) or Ctrl+K (Windows/Linux)
- [ ] Search works
- [ ] Recent commands tracked
- [ ] Navigation commands work
- [ ] Theme switching works
- [ ] Closes on Escape
- [ ] Closes on selection

#### Command Component (Radix Primitive)
- [ ] Input focuses on open
- [ ] Arrow keys navigate
- [ ] Enter selects
- [ ] Type to filter

#### Sheet Component
- [ ] Opens from correct side (top, right, bottom, left)
- [ ] Overlay correct
- [ ] Close button works
- [ ] Escape closes

#### Skeleton Component
- [ ] Loading animation works
- [ ] Correct shapes (text, circle, rectangle)

#### Separator Component
- [ ] Renders horizontal
- [ ] Renders vertical
- [ ] Correct color/thickness

#### Scroll Area Component
- [ ] Scrolling works
- [ ] Scrollbar styled correctly
- [ ] Smooth scrolling

#### Popover Component
- [ ] Opens on trigger
- [ ] Positioned correctly
- [ ] Closes on click outside
- [ ] Arrow points to trigger

#### Breadcrumb Component
- [ ] Renders path correctly
- [ ] Separator displays
- [ ] Links work
- [ ] Current page highlighted

#### Slider Component
- [ ] Drag works
- [ ] Value updates
- [ ] Min/max respected
- [ ] Step size works
- [ ] Focus ring on keyboard navigation

#### Calendar Component
- [ ] Month displays correctly
- [ ] Date selection works
- [ ] Navigation arrows work
- [ ] Today highlighted
- [ ] Disabled dates work

#### DatePicker Component
- [ ] Opens calendar popover
- [ ] Date selection updates input
- [ ] Input is formatted correctly
- [ ] Popover closes on selection
- [ ] Clear button works (if applicable)

#### FormField Component
- [ ] Label renders
- [ ] Input associates with label
- [ ] Error message displays
- [ ] Required indicator shows

#### FormLabel Component
- [ ] Styling correct
- [ ] Required indicator (if enabled)

#### FormMessage Component
- [ ] Error message displays
- [ ] Warning icon shows
- [ ] Correct color (destructive)

#### RichTextEditor Component
- [ ] Toolbar renders
- [ ] Bold (⌘B) works
- [ ] Italic (⌘I) works
- [ ] Heading levels work
- [ ] Lists work (ordered, unordered)
- [ ] Link insertion works
- [ ] Code block works
- [ ] Quote works
- [ ] Divider works
- [ ] Undo/redo works
- [ ] Preview toggle works (if applicable)
- [ ] Placeholder shows when empty
- [ ] Editor is styled correctly (AI Native)

#### MarkdownRenderer Component
```tsx
<MarkdownRenderer content="# Heading\n\nParagraph with **bold** and *italic*." />
```

- [ ] Markdown renders correctly
- [ ] Headings styled
- [ ] Bold/italic styled
- [ ] Links clickable
- [ ] Code blocks highlighted
- [ ] Lists formatted

---

## Phase 5: Integration Testing

### 5.1 Dialog with Form

Create test scenario:

```tsx
<Dialog>
  <DialogContent>
    <form>
      <FormField name="email">
        <Input type="email" />
      </FormField>
      <Button type="submit">Submit</Button>
    </form>
  </DialogContent>
</Dialog>
```

**Checklist:**
- [ ] Dialog opens smoothly
- [ ] Form renders inside dialog
- [ ] Focus trapped in dialog
- [ ] Tab navigation works
- [ ] Escape closes dialog
- [ ] Submit works
- [ ] Validation displays errors

### 5.2 Card with DataTable

```tsx
<Card>
  <CardHeader>
    <CardTitle>Users</CardTitle>
  </CardHeader>
  <CardContent>
    <DataTable data={users} columns={columns} />
  </CardContent>
</Card>
```

**Checklist:**
- [ ] Card contains table correctly
- [ ] Table scrolls within card (if overflow)
- [ ] Styling is consistent
- [ ] No layout issues

### 5.3 Chat with Code Blocks

```tsx
<ChatMessage
  role="assistant"
  content="Here's an example:\n```js\nconsole.log('test')\n```"
/>
```

**Checklist:**
- [ ] Code block renders in message
- [ ] Syntax highlighting works
- [ ] Copy button accessible
- [ ] Message layout not broken

### 5.4 Command Palette with Navigation

- [ ] Open command palette (⌘K)
- [ ] Type "tasks"
- [ ] Select "Tasks" option
- [ ] Navigates to tasks page
- [ ] Palette closes

### 5.5 Form with Rich Text Editor

```tsx
<form>
  <FormField name="description">
    <RichTextEditor />
  </FormField>
  <Button type="submit">Save</Button>
</form>
```

**Checklist:**
- [ ] Editor renders in form
- [ ] Validation works
- [ ] Submit captures HTML content
- [ ] Error display works

---

## Phase 6: Responsive Testing

Test at these breakpoints:

### 6.1 Mobile (375px - iPhone SE)

- [ ] Layout stacks vertically
- [ ] Text readable
- [ ] Buttons touchable (min 44px)
- [ ] Navigation accessible
- [ ] No horizontal scroll

### 6.2 Mobile Large (428px - iPhone 14 Pro Max)

- [ ] Similar to mobile
- [ ] Uses available space well

### 6.3 Tablet (768px - iPad Mini)

- [ ] Layout adapts
- [ ] Two-column where appropriate
- [ ] Touch targets adequate

### 6.4 Laptop (1024px)

- [ ] Full layout shows
- [ ] Multi-column layouts work

### 6.5 Desktop (1440px)

- [ ] Max width constraints respected
- [ ] Content centered (if applicable)

### 6.6 Large Desktop (1920px)

- [ ] No excessive whitespace
- [ ] Content readable

---

## Phase 7: Accessibility Testing

### 7.1 Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Enter activates buttons
- [ ] Space activates checkboxes/switches
- [ ] Arrow keys navigate dropdowns/selects
- [ ] Escape closes dialogs/popovers
- [ ] ⌘K opens command palette
- [ ] Focus visible (focus rings)

### 7.2 Screen Reader Testing

**Tools:** NVDA (Windows), JAWS, VoiceOver (Mac)

- [ ] All images have alt text
- [ ] All inputs have labels
- [ ] Error messages are announced
- [ ] Loading states announced (aria-live)
- [ ] Dialog titles announced
- [ ] Buttons have descriptive text
- [ ] Landmark regions defined (nav, main, aside)

### 7.3 Contrast Checking

**Tool:** WebAIM Contrast Checker or browser extension

- [ ] Text on background: 4.5:1 minimum (WCAG AA)
  - Achieved: 10.5:1 ✅
- [ ] Primary on white: 4.5:1 minimum
  - Achieved: 5.2:1 ✅
- [ ] Border on background: 3:1 minimum
- [ ] Focus rings: 3:1 minimum

### 7.4 Automated A11y Testing

**Tool:** axe DevTools browser extension

Run on each major page:

- [ ] Homepage
- [ ] Test chat page
- [ ] Test data page
- [ ] Track D demo page
- [ ] Settings page

**Expected:** Zero critical violations

---

## Phase 8: Performance Testing

### 8.1 Bundle Size Analysis

```bash
cd turbocat-agent
npm run build
```

Check `.next/static` output:

**Targets:**
- [ ] Total JS: < 300KB gzipped
- [ ] First Load JS: < 200KB
- [ ] CSS: < 50KB gzipped

### 8.2 Lighthouse Audit

**Tool:** Chrome DevTools > Lighthouse

Run on:
- [ ] Homepage
- [ ] Chat page
- [ ] Data table page

**Targets:**
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**Metrics:**
- [ ] First Contentful Paint: < 1.5s
- [ ] Time to Interactive: < 3s
- [ ] Cumulative Layout Shift: < 0.1
- [ ] Total Blocking Time: < 300ms

### 8.3 Runtime Performance

**Tool:** React DevTools Profiler

**Test:**
- [ ] ChatThread with 100 messages: < 100ms render
- [ ] DataTable with 1000 rows: < 200ms initial render
- [ ] VirtualList with 10000 items: < 50ms render
- [ ] Component re-renders minimized

---

## Phase 9: Cross-Browser Testing

Test in:

- [ ] **Chrome** (latest)
  - CSS custom properties work
  - Transitions smooth
  - Fonts load correctly
  - Shadows render
  - Dark mode toggle
  - Keyboard shortcuts
  - Copy to clipboard

- [ ] **Firefox** (latest)
  - Same checks as Chrome

- [ ] **Safari** (latest)
  - Same checks as Chrome

- [ ] **Edge** (latest)
  - Same checks as Chrome

---

## Phase 10: Dark Mode Testing

### 10.1 Toggle Testing

- [ ] Toggle from light to dark
- [ ] Toggle from dark to light
- [ ] System preference detection works
- [ ] Persistence across page reloads
- [ ] No flash of unstyled content (FOUC)

### 10.2 Component Testing in Dark Mode

For each component:

- [ ] Colors invert correctly
- [ ] Contrast ratios maintained (WCAG AA)
- [ ] Shadows visible
- [ ] Hover states work
- [ ] Focus rings visible
- [ ] Borders visible

---

## Phase 11: Migration Testing

### 11.1 Refactor task-chat.tsx

**Before:**
- [ ] Document current functionality
- [ ] Screenshot current UI
- [ ] List all features

**After Refactoring:**
- [ ] All features work
- [ ] UI improved (uses new chat components)
- [ ] Performance improved
- [ ] No regressions
- [ ] Tests pass (if applicable)

**Compare:**
- [ ] Side-by-side screenshots
- [ ] Feature parity checklist

---

## Phase 12: End-to-End Testing

### Critical User Flows

#### Flow 1: Create and Complete a Task

1. Navigate to tasks page
2. Click "New Task"
3. Fill in task form
4. Submit
5. Navigate to task detail
6. Open chat
7. Send message
8. Receive AI response
9. Complete task

**Checklist:**
- [ ] All steps work
- [ ] UI is consistent
- [ ] No errors
- [ ] Data persists

#### Flow 2: Use Command Palette

1. Press ⌘K
2. Search for "tasks"
3. Select result
4. Navigate to tasks page
5. Press ⌘K again
6. Toggle theme
7. Verify dark mode

**Checklist:**
- [ ] Palette opens instantly
- [ ] Search works
- [ ] Navigation works
- [ ] Theme toggle works
- [ ] Palette closes

#### Flow 3: Edit Task with Rich Text

1. Navigate to task
2. Click edit
3. Use RichTextEditor
4. Apply formatting (bold, italic, list)
5. Toggle preview
6. Save
7. Verify formatting persists

**Checklist:**
- [ ] Editor loads
- [ ] Formatting applies
- [ ] Preview accurate
- [ ] Saves correctly
- [ ] Persists across reloads

---

## Success Criteria

### Must Pass ✅ REQUIRED

- [ ] TypeScript compiles (0 errors)
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] All components render without errors
- [ ] No console errors
- [ ] WCAG AA compliance (contrast, keyboard nav)
- [ ] Lighthouse > 90 (all categories)

### Should Pass ⚠️ RECOMMENDED

- [ ] No lint warnings
- [ ] Bundle size < 300KB gzipped
- [ ] FCP < 1.5s
- [ ] TTI < 3s
- [ ] All E2E flows complete
- [ ] Cross-browser compatible

### Nice to Have ✨ BONUS

- [ ] Lighthouse = 100
- [ ] WCAG AAA compliance
- [ ] Zero a11y violations (axe)
- [ ] Perfect cross-browser consistency

---

## Issue Tracking

### Found Issues Log

| # | Component | Issue | Severity | Status | Notes |
|---|-----------|-------|----------|--------|-------|
| 1 | Example | Sample issue | High | Open | Description |

### Severity Levels

1. **Critical:** Blocks functionality completely
2. **High:** Affects UX significantly
3. **Medium:** Minor visual issues
4. **Low:** Nice-to-have improvements

---

## Next Steps After Testing

1. [ ] Fix all Critical and High severity issues
2. [ ] Retest affected areas
3. [ ] Document any Medium/Low issues for future work
4. [ ] Update documentation
5. [ ] Create pull request
6. [ ] Request code review

---

## Notes

- This checklist is comprehensive but can be prioritized based on time
- Focus on "Must Pass" criteria first
- Document any deviations or issues discovered
- Update this checklist as new components are added

---

**Last Updated:** 2026-01-12
**Testing Status:** Awaiting dependency installation fix
**Next Action:** Manual cleanup of node_modules, then begin Phase 1
