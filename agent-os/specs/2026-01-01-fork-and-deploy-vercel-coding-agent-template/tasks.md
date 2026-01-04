# Tasks: Fork and Deploy Vercel Coding Agent Template

## Overview

This tasks list guides you through forking and deploying the Vercel Coding Agent Template - a multi-agent AI coding platform that enables AI agents (Claude, OpenAI Codex, Gemini) to automatically execute coding tasks on your repositories.

**Total Estimated Time:** 2-3 hours (can be done in one sitting or spread across sessions)

**Final Result:** A fully functional AI coding agent at `https://turbocat.vercel.app`

---

## Prerequisites

Before starting, ensure you have access to the following accounts:

- [ ] **GitHub account** - https://github.com (for repository hosting and OAuth)
- [ ] **Vercel account** - https://vercel.com (for application hosting)
- [ ] **Google account** - https://console.cloud.google.com (for Google OAuth)
- [ ] **Anthropic API key** - https://console.anthropic.com (for Claude AI)
- [ ] **OpenAI API key** - https://platform.openai.com (for OpenAI Codex)
- [ ] **Google AI Studio API key** - https://aistudio.google.com (for Gemini AI)

**Important:** Have a secure place to save credentials (password manager or secure note) as you will need to copy and save several secret keys.

---

## Task Groups

### Group 1: Repository Setup
**Estimated Time:** 10 minutes
**Dependencies:** None

- [ ] **1.1: Fork the template repository**
  - Open browser and go to: `https://github.com/vercel-labs/coding-agent-template`
  - Click the "Fork" button in the top-right corner (next to "Star" and "Watch")
  - In the popup, select your GitHub account as the owner
  - Keep the repository name as `coding-agent-template` or rename to `turbocat-agent`
  - Leave "Copy the main branch only" checked
  - Click "Create fork"
  - Wait for GitHub to redirect you to your new repository

- [ ] **CHECKPOINT 1.1:** Verify your forked repository exists at `https://github.com/YOUR_USERNAME/coding-agent-template`

---

### Group 2: GitHub OAuth Configuration
**Estimated Time:** 15 minutes
**Dependencies:** Group 1

- [ ] **2.1: Navigate to GitHub Developer Settings**
  - Go to: `https://github.com/settings/developers`
  - Alternatively: Click your profile picture (top right) > Settings > Developer settings (bottom left) > OAuth Apps

- [ ] **2.2: Create new OAuth App**
  - Click "New OAuth App" button

- [ ] **2.3: Fill in the OAuth app form**
  - **Application name:** `Turbocat Coding Agent`
  - **Homepage URL:** `https://turbocat.vercel.app`
  - **Application description:** `AI-powered coding agent for repository automation`
  - **Authorization callback URL:** `https://turbocat.vercel.app/api/auth/github/callback`
  - Click "Register application"

- [ ] **2.4: Save GitHub OAuth credentials**
  - On the app page, copy the **Client ID** (looks like: `Ov23liXXXXXXXXXX`)
  - Click "Generate a new client secret"
  - **IMMEDIATELY** copy the **Client Secret** (only shown once!)
  - Save both values:
    ```
    NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liCATsRC7ZlN0DBN
    GITHUB_CLIENT_SECRET=2f9d79f544e3be11707ce69800315eb04b283328
    ```

- [ ] **CHECKPOINT 2.4:** Confirm you have saved both GitHub Client ID and Client Secret

---

### Group 3: Google OAuth Configuration
**Estimated Time:** 25 minutes
**Dependencies:** None (can be done in parallel with Group 2)

- [ ] **3.1: Access Google Cloud Console**
  - Go to: `https://console.cloud.google.com`
  - Sign in with your Google account

- [ ] **3.2: Create a new project**
  - Click the project dropdown at the top (says "Select a project")
  - Click "New Project"
  - **Project name:** `Turbocat Agent`
  - Leave organization as default
  - Click "Create"
  - Wait for project creation (may take 30 seconds)
  - Click "Select Project" when the notification appears

- [ ] **3.3: Configure OAuth consent screen**
  - In the left sidebar, go to: APIs & Services > OAuth consent screen
  - Select "External" user type (unless you have Google Workspace)
  - Click "Create"

- [ ] **3.4: Fill in consent screen details**
  - **App name:** `Turbocat Coding Agent`
  - **User support email:** Select your email
  - **App logo:** Skip (optional)
  - Scroll down to "App domain":
    - **Application home page:** `https://turbocat.vercel.app`
    - Leave privacy policy and terms of service blank
  - **Authorized domains:** Click "+ Add Domain" and enter: `vercel.app`
  - **Developer contact email:** Enter your email
  - Click "Save and Continue"

- [ ] **3.5: Configure scopes**
  - Click "Add or Remove Scopes"
  - Find and check these scopes:
    - `email` (or `.../auth/userinfo.email`)
    - `profile` (or `.../auth/userinfo.profile`)
    - `openid`
  - Click "Update"
  - Click "Save and Continue"

- [ ] **3.6: Add test users**
  - Click "+ Add Users"
  - Enter your Google email address
  - Click "Add"
  - Click "Save and Continue"
  - Click "Back to Dashboard"

- [ ] **3.7: Create OAuth credentials**
  - In the left sidebar, go to: APIs & Services > Credentials
  - Click "Create Credentials" > "OAuth client ID"
  - **Application type:** Web application
  - **Name:** `Turbocat Web Client`

- [ ] **3.8: Configure authorized URLs**
  - Under "Authorized JavaScript origins", click "+ Add URI":
    - `https://turbocat.vercel.app`
  - Under "Authorized redirect URIs", click "+ Add URI":
    - `https://turbocat.vercel.app/api/auth/google/callback`
  - Click "Create"

- [ ] **3.9: Save Google OAuth credentials**
  - A popup will show your credentials
  - Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
  - Copy the **Client Secret** (looks like: `GOCSPX-XXXXX`)
  - Save both values:
    ```
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your-client-secret
    ```
  - Click "OK"

- [ ] **CHECKPOINT 3.9:** Confirm you have saved both Google Client ID and Client Secret

---

### Group 4: Generate Encryption Keys
**Estimated Time:** 10 minutes
**Dependencies:** None (can be done in parallel with Groups 2-3)

- [ ] **4.1: Open PowerShell**
  - Press Windows key, type "PowerShell", and open it

- [ ] **4.2: Generate JWE_SECRET (session encryption)**
  - Copy and paste this command into PowerShell:
    ```powershell
    [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    ```
  - Press Enter
  - Copy the output (looks like: `abc123XYZ...==`)
  - Save as:
    ```
    JWE_SECRET=your_base64_string_here
    ```

- [ ] **4.3: Generate ENCRYPTION_KEY (token encryption)**
  - Copy and paste this command into PowerShell:
    ```powershell
    -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
    ```
  - Press Enter
  - Copy the output (64 characters of letters and numbers)
  - Save as:
    ```
    ENCRYPTION_KEY=your_64_character_hex_string_here
    ```

- [ ] **CHECKPOINT 4.3:** Confirm you have both JWE_SECRET and ENCRYPTION_KEY saved

---

### Group 5: Create Vercel API Token
**Estimated Time:** 5 minutes
**Dependencies:** Vercel account

- [ ] **5.1: Navigate to Vercel tokens page**
  - Go to: `https://vercel.com/account/tokens`
  - Sign in if needed

- [ ] **5.2: Create new token**
  - Click "Create" button
  - **Token Name:** `Turbocat Sandbox Token`
  - **Scope:** Select "Full Account" (required for sandbox creation)
  - **Expiration:** Select "No expiration" (or 1 year if you prefer)
  - Click "Create Token"

- [ ] **5.3: Save Vercel token**
  - **IMMEDIATELY** copy the token (only shown once!)
  - Save as:
    ```
    SANDBOX_VERCEL_TOKEN=wnN3p92SBGP3CgmRig6eVP29
    ```

- [ ] **CHECKPOINT 5.3:** Confirm you have saved the Vercel API token

---

### Group 6: Get Vercel Account IDs
**Estimated Time:** 5 minutes
**Dependencies:** Group 5

- [ ] **6.1: Get Vercel Team/Personal Account ID**
  - Go to: `https://vercel.com/account`
  - Click "Settings" in the sidebar
  - Scroll down to find "Your ID" or "Team ID"
  - Copy the ID (looks like: `team_abc123` or a similar string)
  - Save as:
    ```
    SANDBOX_VERCEL_TEAM_ID=team_hJOoFuAnrUzXTXQflPE3iQGt
    ```

- [ ] **CHECKPOINT 6.1:** Confirm you have saved the Vercel Team/Account ID

**Note:** The Project ID will be obtained after initial deployment (see Task 8.4)

---

### Group 7: Local Development Setup (OPTIONAL - Recommended)
**Estimated Time:** 45 minutes
**Dependencies:** Groups 1-6

**Note:** This group is optional but recommended. It allows you to test the application locally before deploying to production, which helps catch configuration issues early.

- [ ] **7.1: Install required software**
  - Verify Node.js is installed: Open PowerShell and run `node --version`
  - If not installed, download from: `https://nodejs.org` (LTS version)
  - Install pnpm: Run `npm install -g pnpm`

- [ ] **7.2: Clone your forked repository**
  - Open PowerShell
  - Navigate to your projects folder: `cd D:\009_Projects_AI\Personal_Projects\Turbocat`
  - Clone the repo:
    ```powershell
    git clone https://github.com/YOUR_USERNAME/coding-agent-template.git
    cd coding-agent-template
    ```

- [ ] **7.3: Install dependencies**
  - In the project folder, run:
    ```powershell
    pnpm install
    ```
  - Wait for installation to complete (may take 2-5 minutes)

- [ ] **7.4: Create local environment file**
  - Create a new file called `.env.local` in the project root
  - Add all your collected credentials:
    ```
    # Core Infrastructure
    POSTGRES_URL=will_be_set_later
    SANDBOX_VERCEL_TOKEN=your_vercel_token
    SANDBOX_VERCEL_TEAM_ID=your_team_id
    SANDBOX_VERCEL_PROJECT_ID=will_get_after_deploy
    JWE_SECRET=your_jwe_secret
    ENCRYPTION_KEY=your_encryption_key

    # Authentication
    NEXT_PUBLIC_AUTH_PROVIDERS=github,google
    NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # AI Keys
    ANTHROPIC_API_KEY=your_anthropic_key
    OPENAI_API_KEY=your_openai_key
    GEMINI_API_KEY=your_gemini_key

    # Configuration
    MAX_MESSAGES_PER_DAY=10
    MAX_SANDBOX_DURATION=300
    ```

- [ ] **7.5: Set up development database (using Neon free tier)**
  - Go to: `https://neon.tech`
  - Sign up or sign in
  - Click "Create Project"
  - **Project name:** `turbocat-dev`
  - Click "Create Project"
  - Copy the connection string from the dashboard
  - Update `.env.local` with:
    ```
    POSTGRES_URL=your_neon_connection_string
    ```

- [ ] **7.6: Run database migrations**
  - In PowerShell (in project folder), run:
    ```powershell
    pnpm db:generate
    pnpm db:push
    ```

- [ ] **7.7: Start development server**
  - Run:
    ```powershell
    pnpm dev
    ```
  - Open browser to: `http://localhost:3000`
  - Verify the page loads (you may not be able to log in without local OAuth apps)

- [ ] **CHECKPOINT 7.7:** Confirm the application loads at localhost:3000

---

### Group 8: Deploy to Vercel
**Estimated Time:** 20 minutes
**Dependencies:** Groups 1-6 (Group 7 optional)

- [ ] **8.1: Start Vercel deployment**
  - Go to: `https://vercel.com/new`
  - Click "Import Git Repository"
  - Select "GitHub" and authorize if prompted
  - Find and select your forked repository (`coding-agent-template`)
  - Click "Import"

- [ ] **8.2: Configure project settings**
  - **Project Name:** `turbocat` (this determines your URL: turbocat.vercel.app)
  - **Framework Preset:** Should auto-detect as Next.js
  - **Root Directory:** Leave as default

- [ ] **8.3: Add environment variables**
  - Expand the "Environment Variables" section
  - Add each of the following variables one by one:

  | Name | Value |
  |------|-------|
  | `SANDBOX_VERCEL_TOKEN` | (your Vercel API token from Group 5) |
  | `SANDBOX_VERCEL_TEAM_ID` | (your Team/Account ID from Group 6) |
  | `JWE_SECRET` | (your generated Base64 key from Group 4) |
  | `ENCRYPTION_KEY` | (your generated hex key from Group 4) |
  | `NEXT_PUBLIC_AUTH_PROVIDERS` | `github,google` |
  | `NEXT_PUBLIC_GITHUB_CLIENT_ID` | (from Group 2) |
  | `GITHUB_CLIENT_SECRET` | (from Group 2) |
  | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (from Group 3) |
  | `GOOGLE_CLIENT_SECRET` | (from Group 3) |
  | `ANTHROPIC_API_KEY` | (your Anthropic API key) |
  | `OPENAI_API_KEY` | (your OpenAI API key) |
  | `GEMINI_API_KEY` | (your Gemini API key) |
  | `MAX_MESSAGES_PER_DAY` | `10` |
  | `MAX_SANDBOX_DURATION` | `300` |

- [ ] **8.4: Enable Neon database**
  - Look for "Integrations" or "Storage" section
  - If Vercel offers to add Neon Postgres, click "Add" or "Enable"
  - This automatically creates a database and sets `POSTGRES_URL`
  - If not shown, you will configure this manually in Group 9

- [ ] **8.5: Deploy**
  - Click "Deploy"
  - Wait for the build to complete (typically 2-5 minutes)
  - Watch the logs for any errors

- [ ] **8.6: Get and add Project ID**
  - After deployment completes, go to Project Settings (click the gear icon)
  - Find "Project ID" in the General section
  - Copy the Project ID
  - Go to Settings > Environment Variables
  - Add new variable:
    - **Name:** `SANDBOX_VERCEL_PROJECT_ID`
    - **Value:** (your Project ID)
  - Click "Save"

- [ ] **8.7: Trigger redeployment**
  - Go to the "Deployments" tab
  - Click the three dots next to the latest deployment
  - Click "Redeploy"
  - Wait for deployment to complete

- [ ] **CHECKPOINT 8.7:** Deployment complete - site should be accessible at `https://turbocat.vercel.app`

---

### Group 9: Configure Database (if not auto-provisioned)
**Estimated Time:** 15 minutes
**Dependencies:** Group 8
**Note:** Skip this group if Vercel auto-provisioned Neon in Task 8.4

- [ ] **9.1: Create Neon database**
  - Go to: `https://console.neon.tech`
  - Sign in or create account
  - Click "New Project"
  - **Project name:** `turbocat-production`
  - **Database name:** `turbocat`
  - **Region:** Select closest to your users
  - Click "Create Project"

- [ ] **9.2: Get connection string**
  - On the project dashboard, find "Connection Details"
  - Click the copy button next to "Connection string"
  - Make sure "Pooled connection" is selected (recommended)

- [ ] **9.3: Add to Vercel**
  - Go to your Vercel project: `https://vercel.com/your-username/turbocat/settings/environment-variables`
  - Add new variable:
    - **Name:** `POSTGRES_URL`
    - **Value:** (paste the Neon connection string)
  - Click "Save"

- [ ] **9.4: Redeploy**
  - Go to Deployments tab
  - Click redeploy on the latest deployment
  - Wait for completion

- [ ] **CHECKPOINT 9.4:** Database should now be connected

---

### Group 10: Verification & Testing
**Estimated Time:** 20 minutes
**Dependencies:** Groups 8-9

#### 10.1: Basic Access Verification
- [ ] **10.1.1: Access the application**
  - Open browser to: `https://turbocat.vercel.app`
  - Verify the homepage loads without errors
  - Check browser console for errors (F12 > Console tab)

#### 10.2: GitHub Authentication Test
- [ ] **10.2.1: Test GitHub sign-in**
  - Click "Sign in" on the homepage
  - Click "Sign in with GitHub"
  - Authorize the application when prompted
  - Verify you are redirected to the dashboard
  - Verify your GitHub profile information is shown

- [ ] **10.2.2: Test session persistence**
  - Refresh the page (F5)
  - Verify you remain signed in

- [ ] **10.2.3: Test sign-out**
  - Click sign-out/logout
  - Verify you are logged out

#### 10.3: Google Authentication Test
- [ ] **10.3.1: Test Google sign-in**
  - Click "Sign in" on the homepage
  - Click "Sign in with Google"
  - Select your Google account
  - Authorize the application
  - Verify you are redirected to the dashboard
  - Verify your Google profile information is shown

- [ ] **10.3.2: Test session persistence**
  - Refresh the page (F5)
  - Verify you remain signed in

#### 10.4: AI Agent Test (Claude)
- [ ] **10.4.1: Create a test task with Claude**
  - Sign in if needed
  - Click "New Task" or similar button
  - **Repository URL:** Enter a public repository you own (or create a test repo)
  - **Prompt:** `Add a comment to the README.md file that says "Test by Turbocat"`
  - **Agent:** Select "Claude Code"
  - Click "Create Task"
  - Watch for task progress updates

- [ ] **10.4.2: Verify task completion**
  - Wait for the task to complete (may take 1-5 minutes)
  - Check if a new branch was created in the repository
  - Verify the changes were made as expected

#### 10.5: AI Agent Test (OpenAI) - Optional
- [ ] **10.5.1: Create a test task with OpenAI Codex**
  - Click "New Task"
  - Enter same repository
  - **Prompt:** `Add a blank line at the end of README.md`
  - **Agent:** Select "Codex" or "OpenAI"
  - Create and monitor the task

#### 10.6: AI Agent Test (Gemini) - Optional
- [ ] **10.6.1: Create a test task with Gemini**
  - Click "New Task"
  - Enter same repository
  - **Prompt:** `Add today's date as a comment at the top of README.md`
  - **Agent:** Select "Gemini"
  - Create and monitor the task

#### 10.7: Database Verification
- [ ] **10.7.1: Verify database records**
  - Go to: `https://console.neon.tech`
  - Open your project
  - Go to SQL Editor
  - Run: `SELECT * FROM users LIMIT 5;`
  - Verify your user record exists
  - Run: `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5;`
  - Verify your test tasks appear

- [ ] **CHECKPOINT 10.7:** All tests pass - deployment is complete and functional

---

## Completion Criteria

Your deployment is complete when:

1. [ ] Application accessible at `https://turbocat.vercel.app`
2. [ ] GitHub OAuth login works
3. [ ] Google OAuth login works
4. [ ] At least one AI agent successfully completes a task
5. [ ] User and task records appear in the database
6. [ ] No critical errors in browser console
7. [ ] Session persists after page refresh

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue: "OAuth callback URL mismatch"**
- **Cause:** The callback URL in your OAuth app doesn't match exactly
- **Solution:**
  - GitHub: Go to `https://github.com/settings/developers`, find your app, verify callback URL is exactly `https://turbocat.vercel.app/api/auth/github/callback`
  - Google: Go to Cloud Console > Credentials, verify redirect URI is exactly `https://turbocat.vercel.app/api/auth/google/callback`
  - Check for trailing slashes, http vs https, and typos

**Issue: "Invalid API key"**
- **Cause:** API key copied incorrectly or has extra spaces
- **Solution:** Re-copy the API key without any leading/trailing spaces

**Issue: "Database connection refused"**
- **Cause:** POSTGRES_URL is incorrect or missing
- **Solution:** Verify the connection string in Vercel environment variables includes `?sslmode=require`

**Issue: "Sandbox creation failed"**
- **Cause:** SANDBOX_VERCEL_TOKEN doesn't have full access
- **Solution:** Create a new token with "Full Account" scope at `https://vercel.com/account/tokens`

**Issue: "Task stuck in pending"**
- **Cause:** Sandbox timeout or AI API issue
- **Solution:** Check Vercel function logs at `https://vercel.com/your-username/turbocat/logs`

**Issue: Build fails on Vercel**
- **Cause:** Missing environment variables or dependency issues
- **Solution:**
  - Check all required environment variables are set
  - View build logs for specific error messages
  - Ensure `POSTGRES_URL` is set before first deployment

---

## Notes

### Important Reminders
- **Never commit `.env.local` or any secrets to Git** - these are for local use only
- **Client secrets are only shown once** - save them immediately when generated
- **Vercel auto-provisions Neon database** - let it handle this during deployment if possible
- **Test locally before production** - catches configuration issues early (Optional Group 7)

### Cost Estimates
| Service | Monthly Cost |
|---------|-------------|
| Vercel Hobby | Free |
| Neon Free Tier | Free |
| Anthropic API | ~$5-20 (usage based) |
| OpenAI API | ~$5-20 (usage based) |
| Gemini API | Free (generous free tier) |
| **Total** | **~$10-40/month** |i have p

### Useful URLs
| Resource | URL |
|----------|-----|
| Your App | `https://turbocat.vercel.app` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Neon Console | `https://console.neon.tech` |
| GitHub OAuth Apps | `https://github.com/settings/developers` |
| Google Cloud Console | `https://console.cloud.google.com` |

---

## Document Info

| Field | Value |
|-------|-------|
| Created | 2026-01-02 |
| Based on Spec | `D:/009_Projects_AI/Personal_Projects/Turbocat/agent-os/specs/2026-01-01-fork-and-deploy-vercel-coding-agent-template/spec.md` |
| Total Task Groups | 10 |
| Estimated Total Time | 2-3 hours |
