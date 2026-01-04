# Product Mission

## Pitch

**Turbocat** is an AI-powered vibe-coding platform that helps developers and non-technical creators build beautiful full-stack applications using natural language by providing superior design output, an integrated component gallery, and seamless deployment — all without leaving the browser.

## Foundation

**Turbocat is built on proven foundations, not from scratch.**

We use the following Vercel open-source projects as our seed:

1. **[Vercel Coding Agent Template](https://github.com/vercel-labs/coding-agent-template)** - Our primary foundation providing the AI coding agent infrastructure, sandbox execution, and core development environment.

2. **[Vercel Vibe Coding Platform](https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform)** - Reference implementation for the vibe-coding experience and UI patterns.

### Development Principle

> **Deploy first, enhance second.**
>
> Before making ANY modifications or enhancements, we MUST:
> 1. Fork and deploy the base Vercel coding agent template
> 2. Verify all core functionality works correctly
> 3. Document the baseline behavior and capabilities
> 4. Only then begin enhancements in incremental, testable steps

This approach ensures:
- We always have a working, deployable application
- We understand the existing codebase before changing it
- We can isolate issues to our modifications vs. the base template
- We never break what's already working

## Vision

To democratize software development by enabling anyone to transform ideas into production-ready, visually stunning applications through conversational AI — making the gap between imagination and implementation disappear.

## Users

### Primary Customers

- **Solo Developers & Indie Hackers**: Need to ship fast without compromising on design quality
- **Non-Technical Founders**: Want to prototype and build MVPs without hiring a development team
- **Designers**: Looking to bring their designs to life without deep coding knowledge
- **Agencies & Freelancers**: Need to rapidly iterate on client projects with professional-grade output

### User Personas

**Alex the Indie Hacker** (28-40)
- **Role:** Solo founder building SaaS products
- **Context:** Works alone or with minimal team, needs to wear many hats
- **Pain Points:** Spending too much time on boilerplate code; struggling to make apps look professional; context-switching between tools
- **Goals:** Ship MVPs faster; achieve design quality comparable to well-funded startups; focus on business logic rather than setup

**Maya the Non-Technical Founder** (30-50)
- **Role:** Business professional with a product idea
- **Context:** Has domain expertise but limited coding experience
- **Pain Points:** Dependent on developers to build prototypes; difficulty communicating technical requirements; expensive and slow development cycles
- **Goals:** Build working prototypes independently; validate ideas quickly; maintain control over product development

**Jordan the Designer** (25-35)
- **Role:** UI/UX designer wanting to build functional products
- **Context:** Strong visual skills, basic coding understanding
- **Pain Points:** Design-to-code translation loses fidelity; limited by developer availability; can't iterate on interactions quickly
- **Goals:** See designs come to life exactly as envisioned; prototype interactions; ship personal projects

## The Problem

### The Design Gap in AI Coding Tools

Current AI coding assistants and vibe-coding platforms produce functional but visually underwhelming applications. Users can describe what they want, but the output often looks generic, requires extensive manual styling, and lacks the polish expected of modern applications.

**Quantifiable Impact:**
- Developers spend 30-40% of project time on UI/styling adjustments after AI generation
- Non-technical users abandon AI-generated projects due to unprofessional appearance
- Teams resort to expensive design systems or hiring designers for basic visual quality

**Our Solution:** Turbocat embeds design excellence into its core through an internal gallery of curated design system components, intelligent style inference, and visual-first AI prompting — ensuring every generated application looks production-ready from the first output.

### The Integration Friction

Building real applications requires connecting multiple services: databases, authentication, payments, APIs. Current tools either ignore these needs or require users to manually configure complex integrations.

**Our Solution:** Turbocat provides pre-built integration patterns, MCP server connections, and guided setup flows that make connecting external services as simple as describing what you need.

### Mobile Development Barrier

Web-first AI coding tools force users to start over when targeting mobile platforms, creating duplicate work and fragmented codebases.

**Our Solution:** Turbocat supports React Native Expo alongside web development, with live preview capabilities for mobile apps, enabling true cross-platform development from a single interface.

## Differentiators

### Design Excellence by Default

Unlike other vibe-coding platforms that produce functional but visually basic output, Turbocat maintains an internal gallery of curated, production-quality design system components. Every generated application inherits consistent, modern aesthetics without additional prompting.

This results in: 50%+ reduction in post-generation styling work; professional-grade output suitable for production deployment; consistent design language across all generated components.

### Extensible AI Capabilities via Skills

Unlike static AI coding tools, Turbocat implements a Skills system that extends AI agent capabilities for specific domains — from database design to API integration to design patterns. Skills evolve and improve independently of the core platform.

This results in: Continuously improving AI output quality; specialized expertise for different development scenarios; community-contributed extensions.

### Unified Cross-Platform Development

Unlike web-only coding assistants, Turbocat supports both web (Next.js) and mobile (React Native Expo) development with real-time previews for both platforms from a single conversation.

This results in: Single codebase knowledge for multi-platform apps; faster mobile app prototyping; reduced context-switching between tools.

### MCP Server Ecosystem

Unlike closed AI coding environments, Turbocat embraces the Model Context Protocol (MCP) standard, enabling connections to external tools, services, and data sources that extend the AI's capabilities.

This results in: Access to specialized tools (Exa search, Firecrawl scraping, GitHub integration); custom enterprise integrations; future-proof extensibility.

## Key Features

### Core Features

- **Natural Language Coding:** Describe what you want to build in plain English; Turbocat's AI generates complete, working full-stack applications
- **Real-Time Preview:** See your application update live as the AI generates code; interact with your app immediately without deployment
- **Multi-Agent Support:** Choose from multiple AI coding agents (Claude, Codex, Gemini, Cursor) based on task requirements
- **Sandbox Execution:** All code runs in isolated Vercel Sandbox environments for security and reproducibility

### Design Features

- **Design System Gallery:** Access curated, production-ready UI components that ensure visual consistency and quality
- **Intelligent Styling:** AI understands design context and applies appropriate styles, spacing, and visual hierarchy
- **Component Library Integration:** Built-in shadcn/ui components with Tailwind CSS for rapid, beautiful UI generation

### Integration Features

- **MCP Server Connections:** Connect external tools and services through the Model Context Protocol standard
- **Database Integration:** Automatic PostgreSQL setup with Drizzle ORM for data persistence
- **Authentication Ready:** Built-in OAuth support for GitHub and Vercel; extensible to other providers
- **Third-Party Services:** Guided integration patterns for common services (Supabase, Stripe, etc.)

### Advanced Features

- **Mobile App Development:** Build React Native Expo applications with live preview on device/simulator
- **Skills System:** Extensible AI capabilities through specialized skill modules
- **Branch Management:** Automatic AI-generated branch names and git workflow integration
- **Persistent Sessions:** Keep sandbox environments alive for iterative development sessions

## Success Metrics

### User Success
- Time from idea to working prototype < 30 minutes
- User satisfaction with visual output quality > 4.5/5
- Percentage of generated apps deployed to production > 40%

### Platform Growth
- Monthly active users growth rate
- Skills library expansion
- MCP integrations available
- Community contributions (templates, components, skills)

### Technical Excellence
- AI generation success rate > 95%
- Sandbox uptime > 99.9%
- Preview load time < 3 seconds
