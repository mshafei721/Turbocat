# Raw Idea: Phase 3 - Extensibility — Skills & MCP Integration

## Overview
Build the extensibility layer that enables enhanced AI capabilities and external integrations.

## Scope

### 1. Skills System Architecture
Design and implement the skills framework: skill definition schema, registration system, and skill invocation from AI agents (L effort)

### 2. Core Skills Implementation
Build foundational skills: database-design (schema generation), api-integration (REST/GraphQL patterns), ui-component (design-aware generation) (L effort)

### 3. MCP Connector Enhancement
Extend existing MCP server support beyond Claude Code to other agents; improve connector UI with better status feedback (M effort)

### 4. Exa Search Integration
Add MCP connector for Exa search, enabling AI agents to research and reference external documentation and examples (S effort)

### 5. Firecrawl Scraping Integration
Add MCP connector for Firecrawl, enabling AI agents to analyze existing websites for design inspiration and content extraction (S effort)

### 6. GitHub Deep Integration
Enhance GitHub MCP integration for repository analysis, issue tracking, and PR creation workflows (M effort)

### 7. Supabase Integration Skill
Create a skill for Supabase setup: database provisioning, auth configuration, real-time subscriptions, and storage buckets (M effort)

### 8. Integration Templates
Build pre-configured integration patterns for common services (Stripe payments, SendGrid email, Cloudinary media) as reusable skills (L effort)

## Context

- Phase 1 (Foundation - Deploy) is complete: turbocat-agent.vercel.app deployed
- Phase 2 (Design System) is in progress
- This is Phase 3 which builds on the deployed platform
- Tech stack: Next.js 15, React 19, Vercel AI SDK, MCP servers

## Source
Based on roadmap (agent-os/product/roadmap.md) - Phase 3: Extensibility — Skills & MCP Integration
