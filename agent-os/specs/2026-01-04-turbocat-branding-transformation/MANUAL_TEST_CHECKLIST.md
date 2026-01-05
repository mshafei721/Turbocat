# Task Group 10: Manual Testing Checklist
## Turbocat Branding Transformation - Phase 3.5

**Testing Date:** _____________
**Tester Name:** _____________
**Branch:** feature/phase4-turbocat-branding
**Dev Server:** http://localhost:3000

---

## Pre-Testing Setup

- [ ] Start dev server: `cd turbocat-agent && npm run dev`
- [ ] Verify server running on http://localhost:3000 (or check console for actual port)
- [ ] Open browser DevTools (F12) and go to Console tab
- [ ] Clear console (click 🚫 icon)

---

## 10.1 Visual Regression Testing (Desktop)

**Browser:** _____________
**Screen Resolution:** _____________

### Homepage Visual Checks

Navigate to: http://localhost:3000

- [ ] Browser tab title shows "Turbocat" (NOT "Coding Agent Template")
- [ ] Homepage heading shows "Turbocat" in large text
- [ ] Subtitle mentions "Multi-agent AI coding platform - compare Claude, Codex, Copilot, Cursor, Gemini, and OpenCode"
- [ ] Turbocat logo visible in header (top-left or top area)
- [ ] NO Vercel logo visible anywhere
- [ ] NO "Deploy Your Own" button visible
- [ ] NO GitHub stars button visible
- [ ] NO broken images (no ⚠️ icons)

**Screenshot saved:** _____ (optional)

### Console Check #1
- [ ] NO red error messages in console
- [ ] NO warnings about missing components

**Notes/Issues:**
```


```

---

## 10.2 Visual Regression Testing (Mobile)

### Mobile View Checks

Resize browser to 375px width (or use DevTools device emulation - iPhone SE)

- [ ] Turbocat logo visible in mobile header
- [ ] Turbocat branding text visible or properly collapsed
- [ ] NO "Deploy Your Own" button visible (mobile)
- [ ] NO GitHub stars button visible (mobile)
- [ ] Mobile footer shows "Powered by Turbocat" (if implemented)
- [ ] Layout is responsive (no horizontal scrolling)
- [ ] Text is readable (not cut off)

**Screenshot saved:** _____ (optional)

### Console Check #2
- [ ] NO red error messages in console
- [ ] NO layout shift warnings

**Notes/Issues:**
```


```

---

## 10.3 Functional Testing - Working Agents (Platform Keys Available)

### Test 1: Claude Agent

**Task Description:** "Create a hello.txt file with content 'Hello from Claude'"

- [ ] Selected "Claude" from agent dropdown
- [ ] Entered task description
- [ ] Clicked "Create Task" or similar submit button
- [ ] NO API key dialog appeared (critical!)
- [ ] Task started executing
- [ ] Task completed successfully
- [ ] File created with correct content

**Task URL:** _____________
**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

### Test 2: Copilot Agent

**Task Description:** "Create a readme.md with 'Copilot test'"

- [ ] Selected "Copilot" from agent dropdown
- [ ] Entered task description
- [ ] Clicked submit
- [ ] NO API key dialog appeared (critical!)
- [ ] Task started executing
- [ ] Task completed successfully
- [ ] File created with correct content

**Task URL:** _____________
**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

### Test 3: Gemini Agent

**Task Description:** "Create a gemini.py file with a hello world function"

- [ ] Selected "Gemini" from agent dropdown
- [ ] Entered task description
- [ ] Clicked submit
- [ ] NO API key dialog appeared (critical!)
- [ ] Task started executing
- [ ] Task completed successfully
- [ ] File created

**Task URL:** _____________
**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

### Test 4: OpenCode Agent

**Task Description:** "Create a opencode.js file with console.log('OpenCode')"

- [ ] Selected "OpenCode" from agent dropdown
- [ ] Entered task description
- [ ] Clicked submit
- [ ] NO API key dialog appeared (critical!)
- [ ] Task started executing
- [ ] Task completed successfully
- [ ] File created with correct content

**Task URL:** _____________
**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

---

## 10.3 Functional Testing - Unavailable Agents (Expected to Fail Gracefully)

### Test 5: Cursor Agent (No API Key Set)

**Task Description:** "Create a cursor.txt file"

- [ ] Selected "Cursor" from agent dropdown
- [ ] Entered task description
- [ ] Clicked submit
- [ ] Received user-friendly error message
- [ ] Error message says: "Cursor agent is temporarily unavailable. Please try a different agent or contact support." (or similar)
- [ ] NO technical jargon (no mentions of environment variables, process.env, etc.)
- [ ] NO API key dialog appeared

**Actual Error Message:**
```


```

**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

### Test 6: Codex Agent (No API Key Set)

**Task Description:** "Create a codex.txt file"

- [ ] Selected "Codex" from agent dropdown
- [ ] Entered task description
- [ ] Clicked submit
- [ ] Received user-friendly error message
- [ ] Error message says: "Codex agent is temporarily unavailable. Please try a different agent or contact support." (or similar)
- [ ] NO technical jargon
- [ ] NO API key dialog appeared

**Actual Error Message:**
```


```

**Result:** ✅ Pass / ❌ Fail
**Notes:**
```


```

---

## 10.4 Error Handling Testing (Advanced - Optional)

**⚠️ WARNING:** This test requires modifying `.env.local` file. Only perform if comfortable.

### Temporarily Break Claude Agent

1. **Before Test:**
   - [ ] Back up `.env.local` file
   - [ ] Open `turbocat-agent/.env.local`
   - [ ] Comment out `ANTHROPIC_API_KEY` (add # at start of line)
   - [ ] Save file
   - [ ] Restart dev server (`npm run dev`)

2. **Test:**
   - [ ] Try to create a task with Claude agent
   - [ ] Verify error message: "Claude agent is temporarily unavailable..."
   - [ ] Error is user-friendly (no technical details)

3. **After Test:**
   - [ ] Restore `.env.local` (uncomment `ANTHROPIC_API_KEY`)
   - [ ] Save file
   - [ ] Restart dev server

**Result:** ✅ Pass / ❌ Fail / ⏭️ Skipped
**Notes:**
```


```

---

## 10.5 Git Commit Verification

**Instructions:** Check git commit authors for tasks created in section 10.3

### For Each Task Created Above:

Navigate to task URL and check the git commits (if visible in UI) or check via command line:

**Task 1 (Claude):**
- [ ] Git author shows "Turbocat" (NOT "Coding Agent")
- [ ] Email shows "bot@turbocat.ai" or user's email

**Task 2 (Copilot):**
- [ ] Git author shows "Turbocat"
- [ ] Email correct

**Task 3 (Gemini):**
- [ ] Git author shows "Turbocat"
- [ ] Email correct

**Task 4 (OpenCode):**
- [ ] Git author shows "Turbocat"
- [ ] Email correct

**Alternative Command-Line Check:**
```bash
# Navigate to a task's sandbox directory and run:
cd <task-sandbox-directory>
git log --format="%an <%ae>" -1
# Should show: Turbocat <bot@turbocat.ai>
```

**Result:** ✅ Pass / ❌ Fail / ⏭️ Skipped
**Notes:**
```


```

---

## 10.6 Cross-Browser Testing

### Browser 1: Chrome

- [ ] Homepage loads correctly
- [ ] Turbocat branding visible
- [ ] Task creation works
- [ ] NO console errors

**Version:** _____________
**Result:** ✅ Pass / ❌ Fail

### Browser 2: Firefox

- [ ] Homepage loads correctly
- [ ] Turbocat branding visible
- [ ] Task creation works
- [ ] NO console errors

**Version:** _____________
**Result:** ✅ Pass / ❌ Fail

### Browser 3: Edge

- [ ] Homepage loads correctly
- [ ] Turbocat branding visible
- [ ] Task creation works
- [ ] NO console errors

**Version:** _____________
**Result:** ✅ Pass / ❌ Fail

### Browser 4: Safari (Optional)

- [ ] Homepage loads correctly
- [ ] Turbocat branding visible
- [ ] Task creation works
- [ ] NO console errors

**Version:** _____________
**Result:** ✅ Pass / ❌ Fail / ⏭️ Skipped (no Safari available)

**Notes:**
```


```

---

## 10.7 Performance Testing

### Lighthouse Audit (Chrome Only)

**Instructions:**
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" only
4. Select "Desktop"
5. Click "Analyze page load"

**Results:**

- [ ] First Contentful Paint (FCP): _____ seconds (Target: < 1.5s)
- [ ] Largest Contentful Paint (LCP): _____ seconds (Target: < 2.5s)
- [ ] Time to Interactive (TTI): _____ seconds (Target: < 3.5s)
- [ ] Overall Performance Score: _____ / 100

**Pass Criteria:** FCP < 1.5s, LCP < 2.5s, TTI < 3.5s

**Result:** ✅ Pass / ❌ Fail / ⏭️ Skipped

**Screenshot of Lighthouse report saved:** _____ (optional)

**Notes:**
```


```

---

## 10.8 Console Error Check (Final)

### Full Application Navigation

**Instructions:** With console open, navigate through all pages and check for errors

**Homepage** (http://localhost:3000)
- [ ] NO red error messages
- [ ] NO warnings about missing components
- [ ] NO 404 errors for assets

**Tasks List Page** (create a task first, then go to /tasks)
- [ ] NO red error messages
- [ ] NO warnings
- [ ] NO 404 errors

**Individual Task Page** (click on a task)
- [ ] NO red error messages
- [ ] NO warnings
- [ ] NO 404 errors

**Repos Page** (if accessible)
- [ ] NO red error messages
- [ ] NO warnings
- [ ] NO 404 errors

**Final Console Status:**
- [ ] ZERO red error messages across all pages
- [ ] Acceptable warnings only (not related to our changes)

**Notes/Acceptable Warnings:**
```


```

---

## Overall Test Results Summary

### Critical Tests Status

| Test Category | Status | Notes |
|--------------|--------|-------|
| Desktop Visual | ⬜ Pass / ❌ Fail |  |
| Mobile Visual | ⬜ Pass / ❌ Fail |  |
| Claude Agent | ⬜ Pass / ❌ Fail |  |
| Copilot Agent | ⬜ Pass / ❌ Fail |  |
| Gemini Agent | ⬜ Pass / ❌ Fail |  |
| OpenCode Agent | ⬜ Pass / ❌ Fail |  |
| Cursor Error Msg | ⬜ Pass / ❌ Fail |  |
| Codex Error Msg | ⬜ Pass / ❌ Fail |  |
| Git Author | ⬜ Pass / ❌ Fail |  |
| Console Errors | ⬜ Pass / ❌ Fail |  |

### Acceptance Criteria Final Check

- [ ] All 6 agents tested (4 working, 2 showing friendly errors)
- [ ] NO API key dialog appeared anywhere
- [ ] Turbocat branding visible on all pages
- [ ] NO Vercel/template references visible
- [ ] Git commits show "Turbocat" author
- [ ] At least 2 browsers tested successfully
- [ ] Performance metrics within targets (or close)
- [ ] Zero critical console errors
- [ ] User-friendly error messages for unavailable agents

**Overall Result:** ⬜ PASS / ❌ FAIL

**Blocker Issues Found:**
```


```

**Non-Blocker Issues Found:**
```


```

**Recommendations:**
```


```

---

## Sign-Off

**Tester Signature:** _____________
**Date Completed:** _____________
**Time Spent:** _____ hours

**Ready for Task Group 11?** ⬜ Yes / ⬜ No (issues must be fixed first)

---

## Appendix: Quick Reference

### Expected Agent Status
- ✅ **Claude**: Working (ANTHROPIC_API_KEY set)
- ✅ **Copilot**: Working (OPENAI_API_KEY set)
- ✅ **Gemini**: Working (GEMINI_API_KEY set)
- ✅ **OpenCode**: Working (OPENAI_API_KEY set)
- ❌ **Cursor**: Unavailable (CURSOR_API_KEY not set)
- ❌ **Codex**: Unavailable (AI_GATEWAY_API_KEY not set)

### Common Issues & Solutions

**Issue:** API key dialog appears
**Solution:** This is a critical failure - agents should use platform keys, not user keys

**Issue:** "Coding Agent" still visible
**Solution:** Check which file, report to developer

**Issue:** Vercel logo still visible
**Solution:** Check which component, report to developer

**Issue:** Console errors about missing files
**Solution:** Note the file path, report to developer

**Issue:** Task fails to execute
**Solution:** Check error message, verify API keys in .env.local

### Support

If you encounter issues during testing, please:
1. Document the issue in this checklist
2. Take screenshots if possible
3. Copy any error messages from console
4. Contact the development team with this completed checklist

---

**End of Manual Test Checklist**
