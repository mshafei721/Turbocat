# Fork and Deploy Vercel Coding Agent Template

**Specification Document**

| Field | Value |
|-------|-------|
| Phase | 1 (Foundation) |
| Roadmap Item | 1 |
| Effort Estimate | M (1 week) |
| Created | 2026-01-01 |
| Status | Draft |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals and Success Criteria](#2-goals-and-success-criteria)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Technical Specifications](#4-technical-specifications)
5. [Implementation Steps](#5-implementation-steps)
6. [Dependencies and Prerequisites](#6-dependencies-and-prerequisites)
7. [Testing and Verification Checklist](#7-testing-and-verification-checklist)
8. [Risks and Mitigations](#8-risks-and-mitigations)
9. [Appendix](#9-appendix)

---

## 1. Overview

### 1.1 What This Spec Covers

This specification document provides a complete guide to fork, configure, and deploy the [Vercel Coding Agent Template](https://github.com/vercel-labs/coding-agent-template) - a multi-agent AI coding platform that enables AI agents to automatically execute coding tasks on your repositories.

The template supports multiple AI coding agents:
- **Claude Code** (Anthropic)
- **OpenAI Codex CLI**
- **Google Gemini CLI**
- **GitHub Copilot CLI**
- **Cursor CLI**
- **opencode**

### 1.2 Key Features of the Template

| Feature | Description |
|---------|-------------|
| Multi-Agent Support | Choose from 6 different AI coding agents |
| User Authentication | Secure sign-in with GitHub or Google OAuth |
| Vercel Sandbox | Runs code in isolated, secure sandboxes |
| AI Gateway Integration | Model routing and observability via Vercel AI Gateway |
| AI-Generated Branch Names | Automatically creates descriptive Git branch names |
| Task Management | Track task progress with real-time updates |
| Persistent Storage | Tasks stored in Neon PostgreSQL database |
| Git Integration | Automatic branching and commits |
| MCP Server Support | Extend Claude Code with additional tools |

### 1.3 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| UI Components | shadcn/ui |
| Database | PostgreSQL with Drizzle ORM |
| AI SDK | AI SDK 5 with Vercel AI Gateway |
| Sandbox | Vercel Sandbox |
| Authentication | NextAuth (OAuth with GitHub/Google) |
| Deployment | Vercel Platform |

---

## 2. Goals and Success Criteria

### 2.1 Primary Goals

1. **Fork the Repository**: Create a personal copy of the coding-agent-template in user's GitHub account
2. **Configure Authentication**: Set up GitHub and Google OAuth providers for user sign-in
3. **Configure AI Providers**: Enable Claude, OpenAI, and Gemini AI agents
4. **Set Up Database**: Provision Neon PostgreSQL database for task storage
5. **Deploy to Vercel**: Deploy the application to Vercel with proper environment configuration
6. **Verify Functionality**: Ensure all features work correctly in production

### 2.2 Success Criteria

| Criterion | Verification Method |
|-----------|---------------------|
| Application accessible at `turbocat.vercel.app` | Visit URL in browser |
| GitHub OAuth login works | Click "Sign in with GitHub" and authenticate |
| Google OAuth login works | Click "Sign in with Google" and authenticate |
| Database connected | Check database tables exist in Neon console |
| Claude agent creates tasks | Create a task using Claude Code agent |
| OpenAI agent creates tasks | Create a task using OpenAI Codex agent |
| Gemini agent creates tasks | Create a task using Gemini CLI agent |
| Tasks persist after reload | Refresh page and verify tasks still appear |
| Sandbox executes code | Verify task completes and creates a Git branch |
| Daily task limit enforced | Verify 10 tasks/day limit works |

### 2.3 Out of Scope

- Custom domain configuration (using default Vercel subdomain)
- Email authentication (using OAuth only)
- Custom branding/theming
- Production scaling optimization

---

## 3. Architecture Diagram

### 3.1 System Architecture

```
                                    +------------------+
                                    |   User Browser   |
                                    +--------+---------+
                                             |
                                             | HTTPS
                                             v
+-----------------------------------------------------------------------------------+
|                              VERCEL PLATFORM                                       |
|                                                                                    |
|  +------------------------+     +------------------------+     +---------------+  |
|  |                        |     |                        |     |               |  |
|  |   Next.js 15 App       |     |   Vercel AI Gateway    |     | Vercel        |  |
|  |   (turbocat.vercel.app)|     |   (Model Routing)      |     | Sandbox       |  |
|  |                        |     |                        |     | (Code Exec)   |  |
|  |  +------------------+  |     |  Routes requests to:   |     |               |  |
|  |  | React 19 UI      |  |     |  - Anthropic API       |     | +----------+  |  |
|  |  | shadcn/ui        |  |     |  - OpenAI API          |     | |Git Repo  |  |  |
|  |  | Tailwind CSS     |  |     |  - Google AI API       |     | |Clone     |  |  |
|  |  +------------------+  |     |                        |     | +----------+  |  |
|  |                        |     +------------------------+     |               |  |
|  |  +------------------+  |              |                     | +----------+  |  |
|  |  | NextAuth         |  |              |                     | |AI Agent  |  |  |
|  |  | (Authentication) |  |              v                     | |Execution |  |  |
|  |  +------------------+  |     +------------------------+     | +----------+  |  |
|  |                        |     |                        |     |               |  |
|  +------------------------+     |   AI Provider APIs     |     | +----------+  |  |
|              |                  |                        |     | |Branch &  |  |  |
|              |                  |  - Anthropic (Claude)  |     | |Commit    |  |  |
|              v                  |  - OpenAI (GPT-4)      |     | +----------+  |  |
|  +------------------------+     |  - Google (Gemini)     |     |               |  |
|  |                        |     |                        |     +---------------+  |
|  |   Drizzle ORM          |     +------------------------+                        |
|  |                        |                                                       |
|  +------------------------+                                                       |
|              |                                                                    |
+--------------|--------------------------------------------------------------------+
               |
               | PostgreSQL Connection
               v
+---------------------------+
|                           |
|   NEON PostgreSQL         |
|   (Serverless Database)   |
|                           |
|  +---------------------+  |
|  | Tables:             |  |
|  | - users             |  |
|  | - tasks             |  |
|  | - sessions          |  |
|  | - api_keys          |  |
|  +---------------------+  |
|                           |
+---------------------------+

+-----------------------------------------------------------------------------------+
|                           EXTERNAL SERVICES                                        |
|                                                                                    |
|  +------------------+  +------------------+  +------------------+                  |
|  |                  |  |                  |  |                  |                  |
|  |  GitHub OAuth    |  |  Google OAuth    |  |  GitHub API      |                  |
|  |  (Sign-in)       |  |  (Sign-in)       |  |  (Repo Access)   |                  |
|  |                  |  |                  |  |                  |                  |
|  +------------------+  +------------------+  +------------------+                  |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 3.2 OAuth Authentication Flow

```
+--------+                                           +---------------+
|        |                                           |               |
|  User  |                                           |  Turbocat     |
|        |                                           |  App          |
+---+----+                                           +-------+-------+
    |                                                        |
    |  1. Click "Sign in with GitHub"                        |
    |------------------------------------------------------->|
    |                                                        |
    |  2. Redirect to GitHub OAuth                           |
    |<-------------------------------------------------------|
    |                                                        |
    |                    +------------------+                 |
    |                    |                  |                 |
    |  3. Authorize App  |  GitHub OAuth    |                 |
    |------------------->|  Server          |                 |
    |                    |                  |                 |
    |  4. Redirect with  |                  |                 |
    |     Auth Code      |                  |                 |
    |<-------------------|                  |                 |
    |                    +--------+---------+                 |
    |                             |                           |
    |  5. Send Code to App        |                           |
    |------------------------------------------------------->|
    |                             |                           |
    |                             |  6. Exchange Code for     |
    |                             |     Access Token          |
    |                             |<--------------------------|
    |                             |                           |
    |                             |  7. Return Access Token   |
    |                             |-------------------------->|
    |                                                        |
    |  8. Create Session, Store User                         |
    |                                                        |
    |  9. Redirect to Dashboard                              |
    |<-------------------------------------------------------|
    |                                                        |
```

### 3.3 Task Execution Flow

```
+--------+     +-----------+     +----------+     +---------+     +--------+
|        |     |           |     |          |     |         |     |        |
|  User  |     |  Next.js  |     |  Neon    |     | Vercel  |     | GitHub |
|        |     |  App      |     |  DB      |     | Sandbox |     |        |
+---+----+     +-----+-----+     +----+-----+     +----+----+     +---+----+
    |                |                |                |              |
    | 1. Create Task |                |                |              |
    |--------------->|                |                |              |
    |                |                |                |              |
    |                | 2. Save Task   |                |              |
    |                |--------------->|                |              |
    |                |                |                |              |
    |                | 3. Clone Repo  |                |              |
    |                |-------------------------------->|              |
    |                |                |                |              |
    |                |                |                | 4. Fetch     |
    |                |                |                |------------->|
    |                |                |                |              |
    |                | 5. Execute AI Agent             |              |
    |                |-------------------------------->|              |
    |                |                |                |              |
    |                |                |   6. AI Makes Changes         |
    |                |                |                |              |
    |                | 7. Commit & Push                |              |
    |                |-------------------------------->|              |
    |                |                |                |              |
    |                |                |                | 8. Push      |
    |                |                |                |------------->|
    |                |                |                |              |
    |                | 9. Update Task Status           |              |
    |                |--------------->|                |              |
    |                |                |                |              |
    | 10. Task Complete               |                |              |
    |<---------------|                |                |              |
    |                |                |                |              |
```

---

## 4. Technical Specifications

### 4.1 Environment Variables - Complete Reference

#### 4.1.1 Core Infrastructure (Required)

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `POSTGRES_URL` | Neon PostgreSQL connection string | Auto-provisioned by Vercel during deploy |
| `SANDBOX_VERCEL_TOKEN` | Vercel API token for sandbox creation | Vercel Dashboard > Settings > Tokens |
| `SANDBOX_VERCEL_TEAM_ID` | Your Vercel team/personal ID | Vercel Dashboard > Settings > General |
| `SANDBOX_VERCEL_PROJECT_ID` | Project ID for sandbox | Vercel Dashboard > Project > Settings |
| `JWE_SECRET` | Session encryption (Base64 32 bytes) | Generate: `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Token encryption (Hex 32 bytes) | Generate: `openssl rand -hex 32` |

#### 4.1.2 Authentication Providers

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEXT_PUBLIC_AUTH_PROVIDERS` | Enabled providers (comma-separated) | Set to `github,google` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | GitHub Developer Settings |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |

#### 4.1.3 AI Provider API Keys

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | https://console.anthropic.com |
| `OPENAI_API_KEY` | OpenAI API key for Codex/GPT | https://platform.openai.com |
| `GEMINI_API_KEY` | Google Gemini API key | https://aistudio.google.com |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (optional) | Vercel Dashboard |

#### 4.1.4 Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_MESSAGES_PER_DAY` | 5 | Maximum tasks + follow-ups per user per day |
| `MAX_SANDBOX_DURATION` | 300 | Maximum sandbox duration in minutes (5 hours) |
| `NPM_TOKEN` | - | For private npm packages |

### 4.2 OAuth Configuration Details

#### 4.2.1 GitHub OAuth App Settings

| Setting | Local Development | Production |
|---------|-------------------|------------|
| Application Name | Turbocat Dev | Turbocat |
| Homepage URL | `http://localhost:3000` | `https://turbocat.vercel.app` |
| Authorization Callback URL | `http://localhost:3000/api/auth/github/callback` | `https://turbocat.vercel.app/api/auth/github/callback` |
| Required Scope | `repo` (for repository access) | `repo` |

#### 4.2.2 Google OAuth App Settings

| Setting | Local Development | Production |
|---------|-------------------|------------|
| Application Type | Web Application | Web Application |
| Authorized JavaScript Origins | `http://localhost:3000` | `https://turbocat.vercel.app` |
| Authorized Redirect URI | `http://localhost:3000/api/auth/google/callback` | `https://turbocat.vercel.app/api/auth/google/callback` |

### 4.3 Database Schema Overview

The template uses Drizzle ORM with the following main tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  github_id VARCHAR(255),
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  repository_url VARCHAR(500),
  prompt TEXT,
  status VARCHAR(50),
  agent_type VARCHAR(50),
  branch_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Sessions table (for authentication)
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  session_token VARCHAR(500)
);
```

### 4.4 Task Configuration Options

| Option | Values | Description |
|--------|--------|-------------|
| Maximum Duration | 5 min - 5 hours | How long sandbox stays alive |
| Keep Alive | ON/OFF | Whether to keep sandbox after task completion |
| Agent Type | Claude/Codex/Gemini/etc | Which AI agent executes the task |

---

## 5. Implementation Steps

### Step 1: Fork the Repository

**Time Estimate: 5 minutes**

1. **Open the Template Repository**
   - Navigate to: https://github.com/vercel-labs/coding-agent-template

2. **Fork to Your Account**
   - Click the "Fork" button (top right corner)
   - Select your GitHub account as the destination
   - Keep the default repository name or rename to `turbocat-agent`
   - Click "Create fork"

3. **Wait for Fork to Complete**
   - GitHub will redirect you to your new repository
   - URL will be: `https://github.com/YOUR_USERNAME/coding-agent-template`

**Screenshot Description**: GitHub fork button is located in the top-right area of the repository page, next to "Star" and "Watch" buttons.

---

### Step 2: Create GitHub OAuth App

**Time Estimate: 10 minutes**

1. **Navigate to GitHub Developer Settings**
   - Go to: https://github.com/settings/developers
   - Or: GitHub Profile > Settings > Developer settings > OAuth Apps

2. **Create New OAuth App**
   - Click "New OAuth App" button

3. **Fill in Application Details**

   | Field | Value |
   |-------|-------|
   | Application name | `Turbocat Coding Agent` |
   | Homepage URL | `https://turbocat.vercel.app` |
   | Application description | `AI-powered coding agent for repository automation` |
   | Authorization callback URL | `https://turbocat.vercel.app/api/auth/github/callback` |

4. **Register Application**
   - Click "Register application"

5. **Save Credentials**
   - Copy the **Client ID** (visible on page)
   - Click "Generate a new client secret"
   - Copy the **Client Secret** immediately (only shown once!)

6. **Store Credentials Safely**
   - Save to a secure password manager or note:
   ```
   NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23li...
   GITHUB_CLIENT_SECRET=abc123...
   ```

**Important**: The Client Secret is only shown once. If you lose it, you must generate a new one.

---

### Step 3: Create Google OAuth App

**Time Estimate: 20 minutes**

1. **Access Google Cloud Console**
   - Navigate to: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown (top left, next to "Google Cloud")
   - Click "New Project"
   - Project name: `Turbocat Agent`
   - Click "Create"
   - Wait for project creation, then select it

3. **Enable Required APIs**
   - Go to: APIs & Services > Library
   - Search for "Google+ API" and enable it
   - Search for "Google Identity" and enable it (if available)

4. **Configure OAuth Consent Screen**
   - Go to: APIs & Services > OAuth consent screen
   - Select "External" user type (unless you have Google Workspace)
   - Click "Create"

5. **Fill in App Information**

   | Field | Value |
   |-------|-------|
   | App name | `Turbocat Coding Agent` |
   | User support email | Your email address |
   | App logo | Optional - can skip |
   | App domain > Application home page | `https://turbocat.vercel.app` |
   | App domain > Privacy policy link | `https://turbocat.vercel.app/privacy` (or leave blank) |
   | Authorized domains | `vercel.app` |
   | Developer contact email | Your email address |

6. **Configure Scopes**
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click "Update"
   - Click "Save and Continue"

7. **Add Test Users (for Testing phase)**
   - Click "Add Users"
   - Add your Google email address
   - Click "Save and Continue"

8. **Create OAuth Credentials**
   - Go to: APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: `Turbocat Web Client`

9. **Configure Authorized URLs**

   | Section | URL |
   |---------|-----|
   | Authorized JavaScript origins | `https://turbocat.vercel.app` |
   | Authorized redirect URIs | `https://turbocat.vercel.app/api/auth/google/callback` |

10. **Create and Save**
    - Click "Create"
    - A popup shows your credentials
    - Copy **Client ID** and **Client Secret**
    - Store safely:
    ```
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=GOCSPX-...
    ```

**Important Note (2025+)**: As of June 2025, Google Cloud client secrets are only visible at creation time. Make sure to save them immediately!

---

### Step 4: Generate Encryption Keys

**Time Estimate: 5 minutes**

You need to generate two encryption keys. Here are multiple methods:

**Method A: Using Git Bash (Windows)**

1. Open Git Bash
2. Run these commands:

```bash
# Generate JWE_SECRET (Base64 encoded, 32 bytes)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (Hex encoded, 32 bytes)
openssl rand -hex 32
```

**Method B: Using PowerShell (Windows)**

```powershell
# Generate JWE_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Generate ENCRYPTION_KEY
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

**Method C: Using Online Generator**

For JWE_SECRET (if you cannot run commands):
- Go to: https://generate.plus/en/base64
- Set length to 32 characters
- Copy the result

Save your generated keys:
```
JWE_SECRET=your_base64_string_here==
ENCRYPTION_KEY=your_64_character_hex_string_here
```

---

### Step 5: Create Vercel API Token

**Time Estimate: 5 minutes**

1. **Navigate to Vercel Tokens**
   - Go to: https://vercel.com/account/tokens
   - Or: Vercel Dashboard > Settings > Tokens

2. **Create New Token**
   - Click "Create" button
   - Token Name: `Turbocat Sandbox Token`
   - Scope: Select "Full Account" (required for sandbox creation)
   - Expiration: "No expiration" (or set a date you'll remember)

3. **Generate and Save**
   - Click "Create Token"
   - Copy the token immediately (only shown once!)
   ```
   SANDBOX_VERCEL_TOKEN=vercel_...
   ```

---

### Step 6: Get Vercel Team and Project IDs

**Time Estimate: 5 minutes**

**Get Team ID (or Personal Account ID)**

1. Go to: https://vercel.com/account
2. In the URL, you'll see: `vercel.com/[team-or-username]`
3. Go to Settings > General
4. Find "Team ID" or "Personal Account ID"
5. Copy it:
   ```
   SANDBOX_VERCEL_TEAM_ID=team_...
   ```

Note: If you're using a personal account (not a team), use your personal account ID.

**Get Project ID** (after initial deployment, see Step 8)

---

### Step 7: Local Development Setup (Optional but Recommended)

**Time Estimate: 30 minutes**

Testing locally before production deployment helps catch issues early.

1. **Clone Your Forked Repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/coding-agent-template.git
   cd coding-agent-template
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

   If you don't have pnpm:
   ```bash
   npm install -g pnpm
   pnpm install
   ```

3. **Create Local Environment File**

   Create `.env.local` in the project root:

   ```bash
   # Core Infrastructure
   POSTGRES_URL=postgresql://user:pass@localhost:5432/turbocat
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
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...

   # Optional Configuration
   MAX_MESSAGES_PER_DAY=10
   MAX_SANDBOX_DURATION=300
   ```

4. **Set Up Local Database**

   Option A: Use Neon (Recommended)
   - Go to https://neon.tech
   - Create free account
   - Create new project: `turbocat-dev`
   - Copy connection string to `POSTGRES_URL`

   Option B: Use local PostgreSQL
   - Install PostgreSQL
   - Create database: `createdb turbocat`
   - Use: `postgresql://localhost:5432/turbocat`

5. **Run Database Migrations**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

6. **Start Development Server**

   ```bash
   pnpm dev
   ```

7. **Test Local Application**
   - Open: http://localhost:3000
   - Try signing in with GitHub (use local callback URLs)
   - Verify the interface loads correctly

**For Local OAuth Testing**, create separate OAuth apps with localhost URLs:
- GitHub callback: `http://localhost:3000/api/auth/github/callback`
- Google callback: `http://localhost:3000/api/auth/google/callback`

---

### Step 8: Deploy to Vercel

**Time Estimate: 15 minutes**

**Method A: One-Click Deploy (Recommended)**

1. **Click Deploy Button**
   - Go to your forked repository
   - Click the "Deploy with Vercel" button in README
   - Or use: https://vercel.com/new/clone?repository-url=YOUR_FORK_URL

2. **Connect Repository**
   - Select your GitHub account
   - Select the forked repository
   - Click "Import"

3. **Configure Project**
   - Project Name: `turbocat` (this determines your URL)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: Leave as-is

4. **Add Environment Variables**

   Add each variable from Step 4-6 (authentication and AI keys):

   | Name | Value |
   |------|-------|
   | `SANDBOX_VERCEL_TOKEN` | Your Vercel API token |
   | `SANDBOX_VERCEL_TEAM_ID` | Your team/personal ID |
   | `JWE_SECRET` | Generated Base64 key |
   | `ENCRYPTION_KEY` | Generated hex key |
   | `NEXT_PUBLIC_AUTH_PROVIDERS` | `github,google` |
   | `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub Client ID |
   | `GITHUB_CLIENT_SECRET` | GitHub Client Secret |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Client ID |
   | `GOOGLE_CLIENT_SECRET` | Google Client Secret |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `OPENAI_API_KEY` | Your OpenAI API key |
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `MAX_MESSAGES_PER_DAY` | `10` |
   | `MAX_SANDBOX_DURATION` | `300` |

5. **Database Setup**
   - During deployment, Vercel offers to create a Neon database
   - Click "Add" next to Neon Postgres
   - This automatically creates database and sets `POSTGRES_URL`

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Note any build errors

7. **Get Project ID**
   - After deployment, go to Project Settings
   - Find "Project ID" in General settings
   - Add environment variable:
     ```
     SANDBOX_VERCEL_PROJECT_ID=prj_...
     ```
   - Redeploy for changes to take effect

**Method B: Manual Deploy via CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

### Step 9: Configure Production Database

**Time Estimate: 10 minutes**

If Vercel auto-provisioned your database, this step is done. Otherwise:

1. **Access Neon Console**
   - Go to: https://console.neon.tech
   - Sign in or create account

2. **Create New Project**
   - Click "New Project"
   - Project name: `turbocat-production`
   - Database name: `turbocat`
   - Region: Select closest to your users
   - Click "Create Project"

3. **Get Connection String**
   - On project dashboard, find "Connection Details"
   - Copy the "Connection string" (pooled recommended)
   - Format: `postgresql://user:password@host/database?sslmode=require`

4. **Add to Vercel**
   - Go to Vercel Project > Settings > Environment Variables
   - Add `POSTGRES_URL` with the connection string

5. **Run Migrations**
   - Option A: Use Vercel's deployment process (automatic)
   - Option B: Run manually:
   ```bash
   # Set production database URL
   export POSTGRES_URL="your_neon_connection_string"
   pnpm db:push
   ```

---

### Step 10: Verify Deployment

**Time Estimate: 15 minutes**

Follow the complete verification checklist in Section 7.

**Quick Verification Steps:**

1. **Access Application**
   - Open: https://turbocat.vercel.app
   - Verify homepage loads without errors

2. **Test GitHub Login**
   - Click "Sign in"
   - Select "Sign in with GitHub"
   - Authorize the application
   - Verify you're redirected to dashboard

3. **Test Google Login**
   - Sign out
   - Click "Sign in"
   - Select "Sign in with Google"
   - Authorize the application
   - Verify you're redirected to dashboard

4. **Create Test Task**
   - Click "New Task"
   - Enter a public repository URL
   - Enter a simple prompt: "Add a comment to the README file"
   - Select Claude Code as the agent
   - Click "Create Task"
   - Watch for task progress

5. **Verify Database**
   - Go to Neon Console
   - Open SQL Editor
   - Run: `SELECT * FROM users;`
   - Verify your user record exists

---

## 6. Dependencies and Prerequisites

### 6.1 Required Accounts

| Account | Purpose | Sign Up URL |
|---------|---------|-------------|
| GitHub | Repository hosting, OAuth | https://github.com |
| Vercel | Application hosting | https://vercel.com |
| Google Cloud | OAuth authentication | https://console.cloud.google.com |
| Neon | PostgreSQL database | https://neon.tech |
| Anthropic | Claude AI API | https://console.anthropic.com |
| OpenAI | GPT/Codex API | https://platform.openai.com |
| Google AI Studio | Gemini API | https://aistudio.google.com |

### 6.2 API Keys Required

| Key | Estimated Cost | Free Tier |
|-----|----------------|-----------|
| Anthropic API Key | ~$0.01-0.03/task | $5 free credit |
| OpenAI API Key | ~$0.01-0.05/task | $5 free credit (new accounts) |
| Gemini API Key | Free tier generous | 60 requests/minute free |

### 6.3 Software Requirements (for local development)

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| pnpm | 8+ | Package manager |
| Git | Latest | Version control |
| OpenSSL | Latest | Key generation |

### 6.4 Cost Estimates

| Service | Monthly Cost (Low Usage) | Notes |
|---------|-------------------------|-------|
| Vercel Hobby | Free | Sufficient for personal use |
| Neon Free Tier | Free | 0.5 GB storage, branching |
| Anthropic API | ~$5-20 | Based on task count |
| OpenAI API | ~$5-20 | Based on task count |
| Gemini API | Free | Generous free tier |
| **Total** | **~$10-40/month** | Can be lower with careful usage |

---

## 7. Testing and Verification Checklist

### 7.1 Pre-Deployment Checklist

- [ ] GitHub repository forked successfully
- [ ] GitHub OAuth App created with correct callback URL
- [ ] Google OAuth App created with correct redirect URI
- [ ] All API keys obtained (Anthropic, OpenAI, Gemini)
- [ ] Encryption keys generated (JWE_SECRET, ENCRYPTION_KEY)
- [ ] Vercel API token created
- [ ] Vercel Team/Account ID noted

### 7.2 Deployment Verification Checklist

- [ ] Vercel deployment completed without errors
- [ ] Application accessible at https://turbocat.vercel.app
- [ ] No console errors on homepage
- [ ] Environment variables all set in Vercel dashboard
- [ ] Database connected (check Neon console)

### 7.3 Authentication Testing Checklist

**GitHub OAuth:**
- [ ] "Sign in with GitHub" button visible
- [ ] Clicking redirects to GitHub authorization page
- [ ] After authorization, redirected to dashboard
- [ ] User profile shows correct GitHub information
- [ ] Session persists after page refresh
- [ ] Sign out works correctly

**Google OAuth:**
- [ ] "Sign in with Google" button visible
- [ ] Clicking redirects to Google authorization page
- [ ] After authorization, redirected to dashboard
- [ ] User profile shows correct Google information
- [ ] Session persists after page refresh
- [ ] Sign out works correctly

### 7.4 AI Agent Testing Checklist

**Claude Code Agent:**
- [ ] Can select Claude Code from agent dropdown
- [ ] Task creates successfully
- [ ] Task shows progress updates
- [ ] Task completes (or shows meaningful error)
- [ ] Git branch created in repository

**OpenAI Codex Agent:**
- [ ] Can select Codex from agent dropdown
- [ ] Task creates successfully
- [ ] Task shows progress updates
- [ ] Task completes (or shows meaningful error)

**Gemini Agent:**
- [ ] Can select Gemini from agent dropdown
- [ ] Task creates successfully
- [ ] Task shows progress updates
- [ ] Task completes (or shows meaningful error)

### 7.5 Feature Testing Checklist

- [ ] Task list shows all created tasks
- [ ] Task details page shows logs and status
- [ ] Repository URL validation works
- [ ] Task limit (10/day) enforced
- [ ] Sandbox timeout (5 hours) respected
- [ ] User can add their own API keys in profile
- [ ] MCP Server configuration available (Claude only)

### 7.6 Database Verification

Run these queries in Neon SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check users
SELECT id, email, name FROM users LIMIT 5;

-- Check tasks
SELECT id, status, agent_type, created_at FROM tasks ORDER BY created_at DESC LIMIT 10;

-- Check sessions
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();
```

---

## 8. Risks and Mitigations

### 8.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth callback URL mismatch | High | Critical | Double-check URLs match exactly (including trailing slashes) |
| API key exposure | Medium | Critical | Never commit .env files; use Vercel environment variables |
| Database connection issues | Medium | High | Test connection string before deployment |
| Sandbox timeout too short | Low | Medium | Set MAX_SANDBOX_DURATION appropriately |
| AI API rate limits | Medium | Medium | Implement rate limiting; use multiple providers |

### 8.2 Security Risks

| Risk | Mitigation |
|------|------------|
| Client secrets leaked | Store only in Vercel env vars; never in code |
| Session hijacking | JWE_SECRET provides encryption |
| API key theft | ENCRYPTION_KEY encrypts stored keys |
| Unauthorized repository access | OAuth tokens are user-specific |
| SQL injection | Drizzle ORM provides parameterized queries |

### 8.3 Operational Risks

| Risk | Mitigation |
|------|------------|
| Vercel Hobby plan limits | Monitor usage; upgrade if needed |
| Neon database limits | Monitor storage; archive old tasks |
| AI provider outages | Multiple AI agents provide fallback |
| GitHub API rate limits | Cache repository data; implement backoff |

### 8.4 Cost Risks

| Risk | Mitigation |
|------|------------|
| Unexpected AI API costs | Set MAX_MESSAGES_PER_DAY limit |
| Runaway sandbox costs | Set MAX_SANDBOX_DURATION limit |
| Database growth | Implement task cleanup policy |

### 8.5 Troubleshooting Common Issues

**Issue: "OAuth callback URL mismatch"**
- Solution: Ensure callback URLs in OAuth app settings exactly match the app URLs
- Check for: http vs https, trailing slashes, typos

**Issue: "Database connection refused"**
- Solution: Verify POSTGRES_URL is correct and includes `?sslmode=require`
- Check: Neon project is active; IP allowlist if applicable

**Issue: "Invalid API key"**
- Solution: Verify API keys are correctly copied without extra spaces
- Check: API key has necessary permissions; billing is active

**Issue: "Sandbox creation failed"**
- Solution: Verify SANDBOX_VERCEL_TOKEN has full account access
- Check: Team ID and Project ID are correct

**Issue: "Task stuck in pending"**
- Solution: Check Vercel function logs for errors
- Check: Sandbox duration isn't exceeded; AI API is responding

---

## 9. Appendix

### 9.1 Complete Environment Variables Reference

```bash
# ============================================
# CORE INFRASTRUCTURE (Required)
# ============================================

# PostgreSQL database connection string
# Auto-provisioned by Vercel with Neon integration
POSTGRES_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require

# Vercel API token for sandbox creation
# Create at: https://vercel.com/account/tokens
SANDBOX_VERCEL_TOKEN=vercel_api_token_here

# Vercel Team ID (or Personal Account ID)
# Find at: Vercel Dashboard > Settings > General
SANDBOX_VERCEL_TEAM_ID=team_or_personal_id

# Vercel Project ID (get after initial deployment)
# Find at: Vercel Project > Settings > General
SANDBOX_VERCEL_PROJECT_ID=prj_project_id

# Session encryption secret (Base64, 32 bytes)
# Generate: openssl rand -base64 32
JWE_SECRET=base64_encoded_32_byte_secret

# Token encryption key (Hex, 32 bytes = 64 hex chars)
# Generate: openssl rand -hex 32
ENCRYPTION_KEY=64_character_hex_string

# ============================================
# AUTHENTICATION (Required - at least one)
# ============================================

# Enabled authentication providers (comma-separated)
# Options: github, google, vercel
NEXT_PUBLIC_AUTH_PROVIDERS=github,google

# GitHub OAuth Application
# Create at: https://github.com/settings/developers
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=github_client_secret

# Google OAuth Application
# Create at: https://console.cloud.google.com/apis/credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx

# ============================================
# AI PROVIDER API KEYS (At least one required)
# ============================================

# Anthropic API Key (for Claude Code)
# Get at: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-XXXXX

# OpenAI API Key (for Codex CLI, OpenCode)
# Get at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-XXXXX

# Google Gemini API Key (for Gemini CLI)
# Get at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyXXXXX

# Vercel AI Gateway API Key (optional, for branch name generation)
# Get at: Vercel Dashboard > AI Gateway
AI_GATEWAY_API_KEY=vag_XXXXX

# ============================================
# OPTIONAL CONFIGURATION
# ============================================

# Maximum tasks + follow-ups per user per day
# Default: 5
MAX_MESSAGES_PER_DAY=10

# Maximum sandbox duration in minutes
# Default: 300 (5 hours), Max: 300
MAX_SANDBOX_DURATION=300

# NPM token for private packages (optional)
NPM_TOKEN=npm_XXXXX
```

### 9.2 Useful URLs

| Resource | URL |
|----------|-----|
| Template Repository | https://github.com/vercel-labs/coding-agent-template |
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Sandbox Docs | https://vercel.com/docs/vercel-sandbox |
| Neon Console | https://console.neon.tech |
| GitHub Developer Settings | https://github.com/settings/developers |
| Google Cloud Console | https://console.cloud.google.com |
| Anthropic Console | https://console.anthropic.com |
| OpenAI Platform | https://platform.openai.com |
| Google AI Studio | https://aistudio.google.com |
| AI SDK Documentation | https://sdk.vercel.ai/docs |
| Drizzle ORM Docs | https://orm.drizzle.team/docs |
| NextAuth Documentation | https://next-auth.js.org |

### 9.3 Command Reference

**Local Development**
```bash
# Install dependencies
pnpm install

# Generate database migrations
pnpm db:generate

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

**Key Generation**
```bash
# Generate JWE_SECRET (Git Bash / Linux / Mac)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (Git Bash / Linux / Mac)
openssl rand -hex 32
```

**Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Pull environment variables
vercel env pull .env.local
```

### 9.4 Database Queries for Monitoring

```sql
-- Count users by auth provider
SELECT
  CASE
    WHEN github_id IS NOT NULL THEN 'GitHub'
    WHEN google_id IS NOT NULL THEN 'Google'
    ELSE 'Unknown'
  END as provider,
  COUNT(*) as count
FROM users
GROUP BY provider;

-- Tasks per day
SELECT
  DATE(created_at) as date,
  COUNT(*) as task_count
FROM tasks
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Task success rate by agent
SELECT
  agent_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM tasks
GROUP BY agent_type;

-- Active sessions
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > NOW();

-- Storage usage estimate
SELECT
  pg_size_pretty(pg_total_relation_size('tasks')) as tasks_size,
  pg_size_pretty(pg_total_relation_size('users')) as users_size;
```

### 9.5 Glossary

| Term | Definition |
|------|------------|
| OAuth | Open Authorization protocol for secure delegated access |
| Client ID | Public identifier for OAuth application |
| Client Secret | Confidential key for OAuth application |
| JWT | JSON Web Token, compact URL-safe token format |
| JWE | JSON Web Encryption, encrypted JWT |
| Sandbox | Isolated execution environment for running code |
| ORM | Object-Relational Mapping, database abstraction layer |
| MCP | Model Context Protocol, for extending AI capabilities |
| AI Gateway | Vercel service for routing and observing AI requests |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-01 | Spec Writer Agent | Initial specification |

---

**End of Specification Document**
