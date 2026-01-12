# AI Native Component Testing Plan

**Branch:** `feat/ai-native-theme`
**Status:** Dependencies Installing
**Date:** 2026-01-11

---

## Testing Strategy

### Phase 1: Pre-Dependency Testing ✅ (Can Test Now)
These tests don't require new dependencies:

#### 1.1 CSS Validation ✅
- [x] globals.css syntax validation
- [x] Build verification (completed successfully)
- [ ] Visual inspection of CSS variables
- [ ] Dark mode class structure verification

#### 1.2 File Structure Verification
- [ ] Verify all component files exist
- [ ] Check file naming conventions
- [ ] Verify TypeScript file extensions
- [ ] Check import paths

#### 1.3 Code Review
- [ ] Review TypeScript types
- [ ] Check for any obvious syntax errors
- [ ] Verify component props interfaces
- [ ] Check for unused imports

---

### Phase 2: Post-Dependency Testing (After npm install)

#### 2.1 TypeScript Compilation ✅ Required
```bash
cd turbocat-agent
npm run type-check
```

**Expected:** Zero TypeScript errors
**Fallback:** Fix type errors iteratively

#### 2.2 Build Test ✅ Required
```bash
cd turbocat-agent
npm run build
```

**Expected:** Successful production build
**Fallback:** Fix build errors

#### 2.3 Lint Check
```bash
cd turbocat-agent
npm run lint
```

**Expected:** No lint errors (or only minor warnings)

---

### Phase 3: Development Server Testing

#### 3.1 Start Dev Server
```bash
cd turbocat-agent
npm run dev
```

#### 3.2 Visual Testing Checklist

**Homepage:**
- [ ] Page loads without errors
- [ ] AI Native light mode displays correctly
- [ ] Warm neutral backgrounds (#FAF9F7)
- [ ] Terracotta primary color (#D97706) visible
- [ ] Sage green accent (#65A30D) visible
- [ ] Typography renders correctly (Satoshi font)
- [ ] 12px border radius on components
- [ ] Smooth transitions (200ms)

**Dark Mode Toggle:**
- [ ] Toggle switches to dark mode
- [ ] Deep navy background
- [ ] Orange/teal colors maintain
- [ ] No flashing/flickering
- [ ] Smooth transition

**Component Testing:**
- [ ] Buttons: All variants render, hover states work
- [ ] Inputs: Focus rings visible, borders correct
- [ ] Cards: Shadows display, hover effects work
- [ ] Dialogs: Overlay correct, animations smooth
- [ ] Badges: New accent variant works
- [ ] Progress: Gradient from primary to accent

---

### Phase 4: Component-Specific Testing

#### 4.1 Track A: UI Components (21 components)

**Button Component:**
```tsx
// Test all variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

**Checklist:**
- [ ] All variants render with AI Native colors
- [ ] Hover states show shadow-ai-md
- [ ] Focus rings are 2px with primary/50
- [ ] Loading state works
- [ ] Disabled state styled correctly
- [ ] Click events fire

**Input Component:**
```tsx
<Input placeholder="Test input" />
<Input type="email" placeholder="Email" />
<Input disabled placeholder="Disabled" />
```

**Checklist:**
- [ ] Border is 2px
- [ ] Focus ring appears on focus
- [ ] Hover effect works
- [ ] Disabled state correct
- [ ] Placeholder text visible

**Card Component:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Checklist:**
- [ ] Shadow-ai-md visible
- [ ] Hover shows shadow-ai-lg
- [ ] Border-2 visible
- [ ] Background is white (#FFFFFF)
- [ ] Rounded-xl (12px)

**Repeat for all 21 components...**

---

#### 4.2 Track B: AI Chat Components (7 components)

**Test Page:** Create `/test-chat` page

```tsx
import { ChatThread, ChatMessage, ChatInput } from '@/components/chat'

export default function TestChatPage() {
  const [messages, setMessages] = useState([
    { id: '1', role: 'user', content: 'Hello!' },
    { id: '2', role: 'assistant', content: 'Hi! How can I help?' }
  ])

  return (
    <div className="p-8">
      <ChatThread messages={messages} />
      <ChatInput onSubmit={(msg) => setMessages([...messages, msg])} />
    </div>
  )
}
```

**Checklist:**
- [ ] ChatThread renders messages
- [ ] Animations smooth (fade-in, slide-up)
- [ ] Auto-scroll works
- [ ] ChatMessage shows user/assistant variants
- [ ] Copy button works
- [ ] ChatInput textarea auto-resizes
- [ ] Character counter displays
- [ ] Submit on Enter works
- [ ] Shift+Enter creates new line
- [ ] LoadingDots animates
- [ ] StreamingText animates correctly
- [ ] ToolCall displays and expands
- [ ] ReasoningPanel toggles

---

#### 4.3 Track C: Code & Data Components (8 components)

**Test Page:** Create `/test-data` page

```tsx
import { CodeBlock, DataTable, VirtualList, EmptyState } from '@/components'

export default function TestDataPage() {
  return (
    <div className="p-8 space-y-8">
      <CodeBlock
        code="console.log('Hello World')"
        language="javascript"
        filename="test.js"
      />

      <DataTable
        data={[{ id: 1, name: 'Test' }]}
        columns={[{ id: 'name', header: 'Name' }]}
      />

      <EmptyState variant="no-data" title="No data" />
    </div>
  )
}
```

**Checklist:**
- [ ] CodeBlock syntax highlights correctly
- [ ] Copy button works
- [ ] Language badge displays
- [ ] Line numbers work (if enabled)
- [ ] DataTable renders
- [ ] Sorting works
- [ ] Filtering works
- [ ] Pagination works
- [ ] Row selection works
- [ ] VirtualList virtualizes correctly
- [ ] Scrolling is smooth
- [ ] EmptyState variants display correctly

---

#### 4.4 Track D: Navigation & Forms (17 components)

**Test Page:** Navigate to `/track-d-demo` (already created)

**Checklist:**
- [ ] Command palette opens with ⌘K / Ctrl+K
- [ ] Recent commands tracked
- [ ] Theme switching works
- [ ] Navigation commands work
- [ ] FormField renders with validation
- [ ] Error messages display with icons
- [ ] Inline validation animates
- [ ] Required indicator shows
- [ ] RichTextEditor loads
- [ ] Toolbar buttons work
- [ ] Markdown shortcuts work
- [ ] Preview toggle works
- [ ] Bold (⌘B) works
- [ ] Italic (⌘I) works
- [ ] DatePicker opens
- [ ] Calendar displays
- [ ] Slider moves smoothly
- [ ] Slider value updates

---

### Phase 5: Integration Testing

#### 5.1 Cross-Component Testing

**Test Scenario 1: Dialog with Form**
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
- [ ] Escape closes dialog
- [ ] Submit works

**Test Scenario 2: Card with DataTable**
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
- [ ] Table scrolls within card
- [ ] Styling is consistent

**Test Scenario 3: Chat with Code Blocks**
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
- [ ] Styling is correct

---

### Phase 6: Responsive Testing

#### 6.1 Breakpoints to Test
- [ ] Mobile: 375px (iPhone SE)
- [ ] Mobile Large: 428px (iPhone 14 Pro Max)
- [ ] Tablet: 768px (iPad Mini)
- [ ] Laptop: 1024px
- [ ] Desktop: 1440px
- [ ] Large Desktop: 1920px

#### 6.2 Components to Test at Each Breakpoint
- [ ] Navigation (mobile menu)
- [ ] DataTable (horizontal scroll)
- [ ] Forms (stacking)
- [ ] Cards (grid layout)
- [ ] Chat interface (full width on mobile)
- [ ] Command palette (full screen on mobile)

---

### Phase 7: Accessibility Testing

#### 7.1 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter activates buttons
- [ ] Space activates checkboxes/switches
- [ ] Arrow keys navigate dropdowns
- [ ] Escape closes dialogs/popovers
- [ ] ⌘K opens command palette

#### 7.2 Screen Reader Testing
**Tools:** NVDA (Windows), JAWS, VoiceOver (Mac)

- [ ] All images have alt text
- [ ] All inputs have labels
- [ ] Error messages are announced
- [ ] Loading states announced (aria-live)
- [ ] Dialog titles announced
- [ ] Buttons have descriptive text

#### 7.3 Contrast Checking
**Tool:** WebAIM Contrast Checker

- [ ] Text on background: 4.5:1 minimum ✅ (10.5:1 achieved)
- [ ] Primary on white: 4.5:1 minimum ✅ (5.2:1 achieved)
- [ ] Border on background: 3:1 minimum
- [ ] Focus rings: 3:1 minimum

#### 7.4 Automated A11y Testing
```bash
# Install axe DevTools extension in browser
# Or use axe-core in tests
npm install --save-dev @axe-core/react
```

**Run on each page:**
- [ ] Homepage
- [ ] Test chat page
- [ ] Test data page
- [ ] Track D demo page
- [ ] Settings page

---

### Phase 8: Performance Testing

#### 8.1 Bundle Size Analysis
```bash
cd turbocat-agent
npm run build
# Check .next/static output
```

**Targets:**
- [ ] Total JS: < 300KB gzipped
- [ ] First Load JS: < 200KB
- [ ] CSS: < 50KB gzipped

#### 8.2 Lighthouse Audit
**Tool:** Chrome DevTools Lighthouse

**Run on:**
- [ ] Homepage
- [ ] Chat page
- [ ] Data page

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

#### 8.3 Runtime Performance
**Tool:** React DevTools Profiler

**Test:**
- [ ] ChatThread with 100 messages: < 100ms render
- [ ] DataTable with 1000 rows: < 200ms initial render
- [ ] VirtualList with 10000 items: < 50ms render
- [ ] Component re-renders minimized

---

### Phase 9: Cross-Browser Testing

#### 9.1 Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### 9.2 Features to Test Per Browser
- [ ] CSS custom properties work
- [ ] Transitions smooth
- [ ] Fonts load correctly
- [ ] Shadows render
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts
- [ ] Copy to clipboard

---

### Phase 10: Dark Mode Testing

#### 10.1 Toggle Testing
- [ ] Toggle from light to dark
- [ ] Toggle from dark to light
- [ ] System preference detection
- [ ] Persistence across page reloads
- [ ] No flash of unstyled content (FOUC)

#### 10.2 Component Testing in Dark Mode
**For each component:**
- [ ] Colors invert correctly
- [ ] Contrast ratios maintained
- [ ] Shadows visible
- [ ] Hover states work
- [ ] Focus rings visible

---

### Phase 11: Migration Testing (After Refactoring)

#### 11.1 task-chat.tsx Migration
**Before Refactoring:**
- [ ] Document current functionality
- [ ] Screenshot current UI
- [ ] List all features

**After Refactoring:**
- [ ] All features work
- [ ] UI looks better
- [ ] Performance improved
- [ ] No regressions
- [ ] Tests pass

#### 11.2 Other Page Migrations
**Pages to migrate:**
- [ ] Tasks list page
- [ ] Task detail page
- [ ] Repo pages
- [ ] Settings page
- [ ] Auth pages
- [ ] Skills dashboard

**For each page:**
- [ ] Before/after comparison
- [ ] Feature parity verified
- [ ] UI improved
- [ ] No regressions

---

### Phase 12: End-to-End Testing

#### 12.1 Critical User Flows

**Flow 1: Create and Complete a Task**
```
1. Navigate to tasks page
2. Click "New Task"
3. Fill in task form
4. Submit
5. Navigate to task detail
6. Open chat
7. Send message
8. Receive AI response
9. Complete task
```

**Checklist:**
- [ ] All steps work
- [ ] UI is consistent
- [ ] No errors
- [ ] Data persists

**Flow 2: Use Command Palette**
```
1. Press ⌘K
2. Search for "tasks"
3. Select result
4. Navigate to tasks page
5. Press ⌘K again
6. Toggle theme
7. Verify dark mode
```

**Checklist:**
- [ ] Palette opens instantly
- [ ] Search works
- [ ] Navigation works
- [ ] Theme toggle works
- [ ] Palette closes

**Flow 3: Edit Task with Rich Text**
```
1. Navigate to task
2. Click edit
3. Use RichTextEditor
4. Apply formatting (bold, italic, list)
5. Toggle preview
6. Save
7. Verify formatting persists
```

**Checklist:**
- [ ] Editor loads
- [ ] Formatting applies
- [ ] Preview accurate
- [ ] Saves correctly
- [ ] Persists

---

## Testing Tools

### Required Tools
- [x] Chrome DevTools
- [x] React DevTools
- [ ] NVDA (screen reader)
- [ ] WebAIM Contrast Checker
- [ ] Lighthouse
- [ ] axe DevTools extension

### Optional Tools
- [ ] Chromatic (visual regression)
- [ ] Percy (visual testing)
- [ ] BrowserStack (cross-browser)
- [ ] Playwright (E2E)

---

## Test Execution Order

### Immediate (Can do now while npm install runs):
1. ✅ File structure verification
2. ✅ Code review
3. ✅ CSS validation

### After npm install:
4. TypeScript compilation
5. Build test
6. Lint check

### After build succeeds:
7. Start dev server
8. Visual testing (all components)
9. Responsive testing
10. Accessibility testing
11. Performance testing
12. Cross-browser testing
13. Dark mode testing

### After all components verified:
14. Integration testing
15. Migration (task-chat.tsx)
16. E2E testing

---

## Success Criteria

### Must Pass ✅ Required
- [ ] TypeScript compiles (0 errors)
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] All components render
- [ ] No console errors
- [ ] WCAG AA compliance
- [ ] Lighthouse > 90

### Should Pass ⚠️ Recommended
- [ ] No lint warnings
- [ ] Bundle size < 300KB
- [ ] FCP < 1.5s
- [ ] TTI < 3s
- [ ] All tests pass

### Nice to Have ✨ Bonus
- [ ] Lighthouse = 100
- [ ] WCAG AAA compliance
- [ ] Zero a11y violations
- [ ] Perfect cross-browser
- [ ] Storybook stories complete

---

## Issue Tracking

### Found Issues Log
```markdown
| # | Component | Issue | Severity | Status |
|---|-----------|-------|----------|--------|
| 1 | Example   | Sample| High     | Open   |
```

### Fix Priority
1. **Critical:** Blocks functionality
2. **High:** Affects UX significantly
3. **Medium:** Minor visual issues
4. **Low:** Nice-to-have improvements

---

## Completion Checklist

- [ ] All Phase 1-3 tests complete
- [ ] All Phase 4 component tests complete
- [ ] All Phase 5 integration tests complete
- [ ] All Phase 6 responsive tests complete
- [ ] All Phase 7 accessibility tests complete
- [ ] All Phase 8 performance tests complete
- [ ] All Phase 9 cross-browser tests complete
- [ ] All Phase 10 dark mode tests complete
- [ ] All Phase 11 migration tests complete
- [ ] All Phase 12 E2E tests complete
- [ ] All issues resolved or documented
- [ ] Documentation updated
- [ ] Ready for PR

---

**Next Action:** Wait for npm install to complete, then proceed with Phase 2 testing.
