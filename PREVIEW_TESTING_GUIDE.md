# Preview Deployment Testing Guide

**Preview URL:** https://turbocat-agent-7mtvhqu40-mohammed-elshafeis-projects.vercel.app

**Purpose:** Verify the Turbocat branding transformation works correctly before merging to production

---

## Quick Start - 5 Minute Test

### 1. Visual Branding Check (1 minute)
1. Open the preview URL
2. Look for:
   - **Turbocat logo** in header (should see a cat icon/logo)
   - **Turbocat name** in titles
   - **NO Vercel references** anywhere
3. Check browser tab - should show Turbocat favicon

**Pass Criteria:** Turbocat branding visible, no Vercel branding

---

### 2. Agent Functionality Test (3 minutes)
Pick ONE agent to test:

1. Click "New Task" or similar button
2. Select an agent (Claude, Copilot, Gemini, or OpenCode)
3. Type a simple request: "Hello, can you help me?"
4. Verify agent responds

**Pass Criteria:** Agent responds without errors

---

### 3. Console Error Check (1 minute)
1. Press **F12** to open browser developer tools
2. Click **Console** tab
3. Look for red error messages

**Pass Criteria:** No critical errors (warnings are OK)

---

## Detailed Testing (15 minutes)

### Test 1: Branding Verification

**Locations to Check:**

1. **Homepage**
   - [ ] Logo in header/navigation
   - [ ] Page title mentions "Turbocat"
   - [ ] Footer (if any) shows Turbocat info

2. **Tasks Page**
   - [ ] Consistent branding throughout
   - [ ] No "Vercel" text anywhere

3. **Agent Selection**
   - [ ] Branding consistent across all pages

4. **Browser Tab**
   - [ ] Favicon shows Turbocat icon
   - [ ] Page title includes "Turbocat"

**Screenshot Request:** If possible, take a screenshot of the homepage showing the Turbocat branding

---

### Test 2: Agent Testing (Pick 2-3 agents)

#### Claude Agent
1. Create new task
2. Select Claude
3. Test message: "Can you help me create a simple HTML file?"
4. Verify response

**Result:** [ ] Pass [ ] Fail

---

#### Copilot Agent
1. Create new task
2. Select Copilot
3. Test message: "Can you help me write a JavaScript function?"
4. Verify response

**Result:** [ ] Pass [ ] Fail

---

#### Gemini Agent
1. Create new task
2. Select Gemini
3. Test message: "Can you help me with Python code?"
4. Verify response

**Result:** [ ] Pass [ ] Fail

---

#### OpenCode Agent
1. Create new task
2. Select OpenCode
3. Test message: "Can you help me review some code?"
4. Verify response

**Result:** [ ] Pass [ ] Fail

---

### Test 3: Core Functionality

#### Task Management
- [ ] Can create new task
- [ ] Can view task list
- [ ] Can switch between tasks
- [ ] Can delete/close task

#### File Operations (if visible)
- [ ] Can view files
- [ ] File tree displays correctly
- [ ] Can select files

#### GitHub Integration (if configured)
- [ ] GitHub connection works
- [ ] Can see repositories (if connected)

---

### Test 4: Error Detection

**Check these locations for errors:**

1. **Browser Console** (F12 → Console tab)
   - [ ] No red errors
   - Warnings are acceptable

2. **Network Tab** (F12 → Network tab)
   - [ ] No failed API calls (red lines)
   - [ ] All requests returning 200 or 304

3. **Page Rendering**
   - [ ] No broken images
   - [ ] No missing styles
   - [ ] Text is readable

---

## Common Issues to Watch For

### Issue 1: Branding Not Showing
**Symptoms:**
- Still seeing "Vercel" references
- Logo not loading
- Favicon still showing Vercel icon

**What to report:**
- Which page shows the wrong branding
- Screenshot if possible

---

### Issue 2: Agents Not Working
**Symptoms:**
- Error when selecting agent
- No response from agent
- Chat interface not loading

**What to report:**
- Which agent failed
- Exact error message
- Console errors (F12)

---

### Issue 3: Build/Deployment Errors
**Symptoms:**
- Page won't load at all
- 404 errors
- "Application Error" messages

**What to report:**
- Screenshot of error
- URL where error occurred

---

## Reporting Results

### If Everything Works (PASS)
Reply with:
```
PREVIEW TEST: PASS

- Branding: Turbocat logo and name visible, no Vercel references
- Agents tested: [list agents you tested]
- All agents working: YES
- Errors found: NONE
- Ready for production: YES
```

### If Issues Found (FAIL)
Reply with:
```
PREVIEW TEST: FAIL

Issues found:
1. [Describe issue 1]
2. [Describe issue 2]

Screenshots: [attach if possible]
Console errors: [paste errors from F12 console]
```

---

## What Happens Next

### If Tests Pass:
1. I'll merge the feature branch to main
2. Vercel auto-deploys to production
3. Production URL becomes live with Turbocat branding
4. Create final completion report

### If Tests Fail:
1. I'll fix the reported issues
2. Create new preview deployment
3. You test again
4. Repeat until passing

---

## Technical Details (For Reference)

**Deployment Info:**
- Preview URL: https://turbocat-agent-7mtvhqu40-mohammed-elshafeis-projects.vercel.app
- Branch: feature/phase4-turbocat-branding
- Build: Successful (2 minute build time)
- Routes: 33 generated successfully
- Environment: Vercel Portland (pdx1)

**Key Changes:**
- Updated build from Turbopack to webpack
- Fixed PostCSS configuration for compatibility
- All 20 automated tests passing

---

## Need Help?

If you're unsure about any test:
- Just check if you see "Turbocat" instead of "Vercel"
- Try clicking around to see if things work
- Report anything that looks broken

**Minimum Required Test:**
1. Does the preview URL load?
2. Do you see Turbocat branding?
3. Can you create a task and get a response from any agent?

If YES to all three = we're good to proceed!
