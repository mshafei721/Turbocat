# Product Roadmap

## Overview

This roadmap outlines the development phases for Turbocat, starting with deploying the base Vercel coding agent template and progressively enhancing it with design excellence, integrations, and mobile support.

---

## Phase 1: Foundation — Deploy Base Platform

Deploy and configure the Vercel coding agent template as the foundation for Turbocat.

> **⚠️ CRITICAL: Deploy First, Enhance Second**
>
> Phase 1 focuses ONLY on deploying and verifying the base Vercel templates work correctly.
> **DO NOT** begin any enhancements or modifications until:
> - The base application is fully deployed and accessible
> - All core functionality has been manually tested and verified working
> - Baseline behavior is documented
>
> Reference repositories:
> - Primary: https://github.com/vercel-labs/coding-agent-template
> - Secondary: https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform

1. [ ] Fork and Deploy Vercel Template — Clone the vercel-labs/coding-agent-template repository, configure environment variables, and deploy to Vercel with Neon PostgreSQL auto-provisioning `M`

2. [ ] Authentication Setup — Configure OAuth providers (GitHub, Vercel) with proper client credentials, session encryption (JWE_SECRET), and token encryption (ENCRYPTION_KEY) `S`

3. [ ] Sandbox Configuration — Set up Vercel Sandbox credentials (SANDBOX_VERCEL_TOKEN, SANDBOX_VERCEL_TEAM_ID, SANDBOX_VERCEL_PROJECT_ID) and verify isolated code execution works `S`

4. [ ] AI Agent API Keys — Configure API keys for supported coding agents (Anthropic, OpenAI, Cursor, Gemini) and verify multi-agent selection functionality `S`

5. [ ] Database Schema Verification — Verify Drizzle ORM migrations, test task creation/retrieval, and ensure PostgreSQL connection stability `S`

6. [ ] End-to-End Flow Test — Test complete user flow: sign in, create task with repository URL, select agent, execute in sandbox, verify branch creation and code changes `M`

7. [ ] Baseline Documentation — Document all working features, known limitations, and current behavior as a baseline before any modifications; create a checklist of functionality to preserve `S`

---

## Phase 2: Design Excellence — Visual Enhancement

Transform the visual output quality to differentiate Turbocat from other vibe-coding platforms.

8. [ ] Design System Foundation — Extend shadcn/ui configuration with custom theme tokens, color palettes, and typography scales that define Turbocat's visual identity `M`

9. [ ] Component Gallery Database — Create database schema and API for storing design system components with metadata (category, tags, preview images, code snippets) `M`

10. [ ] Component Gallery UI — Build an internal gallery interface for browsing, searching, and previewing design system components with live code examples `L`

11. [ ] Curated Component Library — Design and implement 20+ production-quality UI components (cards, forms, navigation, data display) with consistent styling `L`

12. [ ] AI Style Prompt Enhancement — Modify AI prompting to reference the component gallery and apply design system tokens when generating UI code `M`

13. [ ] Visual Quality Validation — Create automated visual regression tests and manual review process to ensure generated UIs meet quality standards `M`

---

## Phase 3: Extensibility — Skills & MCP Integration

Build the extensibility layer that enables enhanced AI capabilities and external integrations.

14. [ ] Skills System Architecture — Design and implement the skills framework: skill definition schema, registration system, and skill invocation from AI agents `L`

15. [ ] Core Skills Implementation — Build foundational skills: database-design (schema generation), api-integration (REST/GraphQL patterns), ui-component (design-aware generation) `L`

16. [ ] MCP Connector Enhancement — Extend existing MCP server support beyond Claude Code to other agents; improve connector UI with better status feedback `M`

17. [ ] Exa Search Integration — Add MCP connector for Exa search, enabling AI agents to research and reference external documentation and examples `S`

18. [ ] Firecrawl Scraping Integration — Add MCP connector for Firecrawl, enabling AI agents to analyze existing websites for design inspiration and content extraction `S`

19. [ ] GitHub Deep Integration — Enhance GitHub MCP integration for repository analysis, issue tracking, and PR creation workflows `M`

20. [ ] Supabase Integration Skill — Create a skill for Supabase setup: database provisioning, auth configuration, real-time subscriptions, and storage buckets `M`

21. [ ] Integration Templates — Build pre-configured integration patterns for common services (Stripe payments, SendGrid email, Cloudinary media) as reusable skills `L`

---

## Phase 4: Mobile Development — React Native Expo

Enable cross-platform development with React Native Expo support and live mobile previews.

22. [ ] Expo Sandbox Environment — Configure Vercel Sandbox to support React Native Expo projects with required Node.js and Expo CLI dependencies `L`

23. [ ] Mobile Preview Infrastructure — Implement live preview system for Expo apps using Expo Go or web-based preview (Snack-style) `XL`

24. [ ] React Native Component Gallery — Extend component gallery with React Native-specific components using React Native Paper or NativeWind styling `L`

25. [ ] Mobile-Aware AI Prompting — Modify AI prompting to detect mobile app requests and generate appropriate React Native code with platform-specific patterns `M`

26. [ ] Cross-Platform Code Sharing — Implement patterns for shared code between web (Next.js) and mobile (Expo) targets within the same project `L`

27. [ ] Device Preview Testing — Enable QR code generation for testing Expo apps on physical devices via Expo Go app `M`

---

## Phase 5: Polish & Scale — Production Readiness

Enhance platform stability, user experience, and prepare for broader adoption.

28. [ ] User Dashboard Enhancement — Redesign dashboard with project organization, task history filtering, and quick-action shortcuts for common workflows `M`

29. [ ] Template Library — Create starter templates for common app types (SaaS dashboard, e-commerce, blog, portfolio) with pre-configured design and integrations `L`

30. [ ] Collaboration Features — Add team workspaces, shared projects, and basic permission controls for agency and team use cases `XL`

31. [ ] Usage Analytics — Implement analytics for tracking generation success rates, popular components, and user journey optimization `M`

32. [ ] Performance Optimization — Optimize sandbox startup time, preview loading, and AI response streaming for improved user experience `M`

33. [ ] Documentation & Onboarding — Create comprehensive user documentation, interactive tutorials, and in-app onboarding flow for new users `L`

---

## Future Considerations

Items for evaluation after core phases complete:

- [ ] Self-hosted deployment option for enterprise customers
- [ ] Plugin marketplace for community-contributed skills and components
- [ ] AI model fine-tuning on successful generation patterns
- [ ] Desktop app version (Electron/Tauri) for offline development
- [ ] White-label option for agencies
- [ ] API access for programmatic project generation

---

> **Notes**
> - Order reflects technical dependencies and incremental value delivery
> - Each item represents an end-to-end functional and testable feature
> - Effort estimates: XS (1 day), S (2-3 days), M (1 week), L (2 weeks), XL (3+ weeks)
> - **Phase 1 MUST complete fully before any other phases begin** (deploy first, enhance second!)
> - Phases 2-4 can partially overlap after Phase 1 is complete
> - Review and adjust priorities after each phase based on user feedback
> - Total: 33 features across 5 phases + future considerations
