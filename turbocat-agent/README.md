# Turbocat

Multi-agent AI coding platform - compare Claude, Codex, Copilot, Cursor, Gemini, and OpenCode in one unified interface.

![Turbocat Screenshot](screenshot.png)

## Features

- 🤖 **6 AI Agents**: Claude, Codex, Copilot, Cursor, Gemini, OpenCode
- 🔀 **Side-by-Side Comparison**: Run the same task across different agents
- 🚀 **Production Ready**: Built on Next.js, deployed on Vercel
- 🎨 **Modern UI**: Dark mode, responsive design, real-time updates
- 🔐 **Secure**: GitHub OAuth, encrypted sessions, rate limiting

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Arctic (GitHub OAuth)
- **Styling**: Tailwind CSS 4 + Radix UI
- **AI SDK**: Vercel AI SDK
- **Deployment**: Vercel

## Architecture

Turbocat is a multi-agent AI coding platform built with modern web technologies:

- **Frontend**: React 19 with Next.js 16 App Router
- **Backend**: Next.js API Routes with PostgreSQL database
- **AI Agents**: Integrated support for 6 major coding agents
- **Sandbox Execution**: Secure code execution via Vercel Sandbox
- **Real-time Updates**: WebSocket-based task monitoring

## How It Works

1. **Task Creation**: Users submit coding tasks through the web interface
2. **Agent Selection**: Choose from 6 available AI coding agents
3. **Sandbox Setup**: Secure execution environment is provisioned
4. **Agent Execution**: AI agent analyzes the task and makes code changes
5. **Git Operations**: Changes are committed and pushed to a new branch
6. **Task Monitoring**: Real-time updates on task progress and completion

## Security & Authentication

- **User Authentication**: Secure GitHub OAuth integration
- **Session Management**: Encrypted JWT-based sessions
- **API Key Management**: Platform-level API keys for all AI agents
- **Sandboxed Execution**: Isolated environments for code execution
- **Rate Limiting**: Protection against abuse

## Database Schema

Turbocat uses PostgreSQL with Drizzle ORM:

- **users**: User profiles and OAuth data
- **accounts**: Linked accounts (GitHub, etc.)
- **tasks**: Coding tasks and execution history
- **connectors**: MCP server integrations (Claude only)
- **keys**: Platform-level API key management

## Getting Started

This is a proprietary platform. For access or partnership inquiries, contact the platform administrator.

### Development Setup

If you have been granted access to the codebase:

```bash
# Clone the repository
git clone <repository-url>
cd turbocat

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

### Required Infrastructure

- `POSTGRES_URL`: PostgreSQL database connection string
- `SANDBOX_VERCEL_TOKEN`: Vercel API token for sandbox creation
- `SANDBOX_VERCEL_TEAM_ID`: Vercel team ID
- `SANDBOX_VERCEL_PROJECT_ID`: Vercel project ID
- `JWE_SECRET`: Session encryption secret
- `ENCRYPTION_KEY`: Data encryption key

### Authentication

- `NEXT_PUBLIC_AUTH_PROVIDERS`: Enabled auth providers (e.g., "github")
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret

### Platform API Keys

- `ANTHROPIC_API_KEY`: For Claude agent
- `OPENAI_API_KEY`: For Codex and OpenCode agents
- `GEMINI_API_KEY`: For Gemini agent
- `CURSOR_API_KEY`: For Cursor agent
- `AI_GATEWAY_API_KEY`: For AI Gateway integration

### Optional

- `NPM_TOKEN`: For private npm packages
- `MAX_SANDBOX_DURATION`: Default sandbox timeout (minutes)
- `MAX_MESSAGES_PER_DAY`: Rate limit per user

## Development Commands

```bash
# Development
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm db:generate        # Generate migrations
pnpm db:push            # Push schema changes
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report

# Code Quality
pnpm lint               # Run ESLint
pnpm type-check         # Run TypeScript check
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting
```

## Agent Support

Turbocat integrates with 6 major AI coding agents:

| Agent | Provider | Status | API Key Required |
|-------|----------|--------|------------------|
| Claude | Anthropic | Active | `ANTHROPIC_API_KEY` |
| Codex | OpenAI via AI Gateway | Active | `AI_GATEWAY_API_KEY` |
| Copilot | GitHub | Active | `GH_TOKEN` |
| Cursor | Cursor | Active | `CURSOR_API_KEY` |
| Gemini | Google | Active | `GEMINI_API_KEY` |
| OpenCode | OpenAI | Active | `OPENAI_API_KEY` |

## MCP Server Support

Connect MCP Servers to extend Claude Code with additional tools and integrations. Currently only works with Claude Code agent.

### How to Add MCP Servers

1. Navigate to the "Connectors" tab
2. Click "Add MCP Server"
3. Enter server details (name, base URL, optional OAuth credentials)
4. Ensure `ENCRYPTION_KEY` is set in environment variables for OAuth support

## Contributing

This is a proprietary codebase. If you have been granted contributor access:

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Write tests for new functionality
4. Submit a pull request for review

## Security Considerations

- All sensitive data is encrypted at rest using `ENCRYPTION_KEY`
- User sessions are encrypted with `JWE_SECRET`
- API keys are stored securely and never exposed to clients
- All code execution happens in isolated Vercel Sandboxes
- Rate limiting prevents abuse of the platform
- Regular security audits are performed

## License

Proprietary - All rights reserved

---

**Turbocat** - Multi-agent AI coding platform
