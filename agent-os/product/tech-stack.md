# Tech Stack

## Overview

Turbocat is built on the Vercel coding agent template, leveraging the Next.js ecosystem with AI SDK integration. This document outlines all technology choices across the stack.

---

## Frontend

### Framework
- **Next.js 15** — React framework with App Router, Server Components, and server actions
- **React 19** — UI library with latest concurrent features and hooks

### Styling
- **Tailwind CSS** — Utility-first CSS framework for rapid UI development
- **shadcn/ui** — Headless component library built on Radix UI primitives
- **PostCSS** — CSS processing for Tailwind and custom transforms

### Typography
- **Geist Font** — Vercel's custom font family via `next/font` for optimal loading

### State Management
- **React Hooks** — Built-in state management for component-level state
- **Server Components** — Server-side data fetching eliminating client state needs

---

## Backend

### Runtime
- **Node.js** — JavaScript runtime (LTS version)
- **Next.js API Routes** — Serverless API endpoints via App Router

### Database
- **PostgreSQL** — Relational database for persistent storage
- **Neon** — Serverless PostgreSQL hosting (auto-provisioned on Vercel)
- **Drizzle ORM** — TypeScript ORM for type-safe database queries and migrations

### Authentication
- **NextAuth.js** — Authentication library for Next.js applications
- **OAuth Providers** — GitHub and Vercel OAuth integration
- **JWE Encryption** — Secure session token handling

---

## AI & Agents

### AI SDK
- **Vercel AI SDK 5** — Unified interface for AI model interactions
- **AI Gateway** — Vercel's AI request routing and management

### Supported Coding Agents
- **Claude Code** (Anthropic) — Primary AI coding agent with MCP support
- **OpenAI Codex CLI** — OpenAI's code generation model
- **GitHub Copilot CLI** — GitHub's AI coding assistant
- **Cursor CLI** — Cursor's AI coding capabilities
- **Google Gemini CLI** — Google's multimodal AI model
- **opencode** — Open-source coding agent

### Model Context Protocol (MCP)
- **MCP Servers** — External tool connections for extended AI capabilities
- **Supported Integrations:**
  - Exa — Web search
  - Firecrawl — Web scraping
  - GitHub — Repository operations
  - Context7 — Code snippets

---

## Infrastructure

### Hosting & Deployment
- **Vercel** — Platform for frontend deployment and serverless functions
- **Vercel Sandbox** — Isolated execution environment for AI-generated code

### Code Execution
- **Vercel Sandbox** — Secure, isolated environments for running generated code
- **Configurable Timeouts** — 5 minutes to 5 hours per session
- **Keep-Alive Mode** — Persistent sandboxes for iterative development

### Version Control
- **Git** — Source control for generated code
- **GitHub** — Repository hosting and collaboration
- **AI-Generated Branch Names** — Automatic descriptive branch naming

---

## Mobile Development (Phase 4)

### Framework
- **React Native** — Cross-platform mobile framework
- **Expo** — React Native toolchain and managed workflow

### Preview
- **Expo Go** — Mobile app for live preview on devices
- **Web Preview** — Browser-based preview option

### Styling
- **NativeWind** (planned) — Tailwind CSS for React Native
- **React Native Paper** (alternative) — Material Design components

---

## Development Tools

### Package Management
- **pnpm** — Fast, disk-efficient package manager

### Code Quality
- **TypeScript** — Static typing for JavaScript
- **ESLint** — JavaScript/TypeScript linting
- **Prettier** — Code formatting (recommended)

### Testing
- **Vitest** (recommended) — Unit testing framework
- **Playwright** (recommended) — End-to-end testing
- **Visual Regression** (planned) — UI component testing

---

## External Services

### Required Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Neon | PostgreSQL database | Auto-provisioned via Vercel |
| GitHub OAuth | User authentication | Client ID/Secret required |
| Vercel OAuth | User authentication | Client ID/Secret required |
| Vercel Sandbox | Code execution | Team token/ID required |

### AI Provider API Keys
| Provider | Agent | Required |
|----------|-------|----------|
| Anthropic | Claude Code | Optional |
| OpenAI | Codex, opencode | Optional |
| Cursor | Cursor CLI | Optional |
| Google | Gemini CLI | Optional |

### Future Integrations (Phase 3+)
| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Database + Auth + Storage | Planned |
| Stripe | Payments | Planned |
| SendGrid | Email | Planned |
| Cloudinary | Media storage | Planned |

---

## Environment Variables

### Required
```bash
# Database (auto-provisioned on Vercel)
POSTGRES_URL=

# Sandbox Configuration
SANDBOX_VERCEL_TOKEN=
SANDBOX_VERCEL_TEAM_ID=
SANDBOX_VERCEL_PROJECT_ID=

# Security
JWE_SECRET=              # Base64-encoded secret for session encryption
ENCRYPTION_KEY=          # 32-byte hex string for token encryption

# Authentication
NEXT_PUBLIC_AUTH_PROVIDERS=github,vercel
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
```

### Optional AI Provider Keys
```bash
ANTHROPIC_API_KEY=       # Claude Code
OPENAI_API_KEY=          # Codex, opencode
CURSOR_API_KEY=          # Cursor CLI
GEMINI_API_KEY=          # Google Gemini
AI_GATEWAY_API_KEY=      # Vercel AI Gateway
```

---

## Architecture Decisions

### Why Next.js 15?
- Server Components reduce client bundle size
- App Router provides modern routing patterns
- Built-in API routes eliminate separate backend
- Seamless Vercel deployment integration

### Why Drizzle ORM?
- Type-safe database queries in TypeScript
- Lightweight compared to Prisma
- Excellent PostgreSQL support
- Simple migration system

### Why shadcn/ui?
- Accessible components built on Radix UI
- Full control over styling and customization
- Copy-paste approach allows modification
- Consistent with Tailwind CSS workflow

### Why Vercel Sandbox?
- Secure isolation for executing AI-generated code
- Built-in git integration for branch management
- Scales automatically with demand
- Native integration with Vercel platform

---

## Future Technical Considerations

- **Edge Runtime** — Evaluate for faster global response times
- **Redis** — Session caching and rate limiting at scale
- **CDN** — Asset optimization for component gallery images
- **WebSockets** — Real-time collaboration features
- **OpenTelemetry** — Distributed tracing for debugging
