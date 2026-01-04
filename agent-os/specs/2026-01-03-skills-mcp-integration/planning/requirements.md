# Phase 3: Skills & MCP Integration - Requirements

**Spec Folder:** `agent-os/specs/2026-01-03-skills-mcp-integration`
**Created:** 2026-01-03
**Status:** Requirements Gathered

---

## Scope Summary

Phase 3 builds the extensibility layer for Turbocat, enabling enhanced AI capabilities through a Skills system and comprehensive MCP (Model Context Protocol) integrations.

---

## Key Decisions

### Skills System Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Skills Format** | Claude Code SKILL.md | Standard format, portable, version-controlled, follows Anthropic official patterns |
| **Invocation Method** | Natural Language | AI automatically detects when to use skills based on user intent |
| **Skills Scope** | User/Global | Skills available across all user's projects |
| **Skills Reference** | Anthropic Official + [claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | Follow official patterns and advanced tool use SOPs |

### Skills Implementation

| Decision | Choice | Details |
|----------|--------|---------|
| **Core Skills** | All skills per Anthropic patterns | database-design, api-integration, ui-component, supabase-setup |
| **Skills + MCP Relationship** | Skills declare MCP dependencies | Skills can require specific MCP servers |
| **Execution Visibility** | Full trace | Complete AI reasoning and decision trace visible to users |
| **UI Component Skill** | Bidirectional with Gallery | Read from AND contribute new components to Phase 2 Component Gallery |

### MCP Integrations

| Decision | Choice | Priority |
|----------|--------|----------|
| **Multi-Agent MCP** | All agents support MCP | Verify Gemini/Codex latest MCP documentation |
| **Must-Have MCP Servers** | ALL listed + extras | Exa, Firecrawl, GitHub Deep, Supabase Full, Context7, Sequential Thinking |
| **Integration Templates** | Full package | Skills + code templates + MCP server configurations |

### Dependencies & Timeline

| Decision | Choice | Impact |
|----------|--------|--------|
| **Phase 2 Dependency** | Full Phase 2 complete | Must wait for design tokens, Storybook, Component Gallery |
| **Effort Estimates** | Original estimates OK | L/M/S estimates remain accurate |
| **Visual Assets** | Generate ASCII diagrams | Create architecture diagrams in spec |

---

## Requirements by Component

### 1. Skills System Architecture (L effort - 2 weeks)

**Requirements:**
- Implement Claude Code SKILL.md format with YAML frontmatter
- Natural language skill detection and invocation
- User/global skill scope (available across all projects)
- Skills can declare MCP server dependencies
- Full execution trace visibility
- Reference Anthropic official skill patterns

**Files/Patterns:**
- SKILL.md format per Claude Code specification
- Skills stored in user-accessible location (database or config)
- Skill registry for discovery and management

### 2. Core Skills Implementation (L effort - 2 weeks)

**Required Skills:**
1. **database-design** - Generate Drizzle ORM schemas, migrations, seed data
2. **api-integration** - REST/GraphQL endpoint scaffolding and patterns
3. **ui-component** - Design-aware component generation
   - Bidirectional with Phase 2 Component Gallery
   - Read existing components
   - Contribute new components to gallery
   - Enforce design system tokens
4. **supabase-setup** - Full Supabase provisioning

**Pattern Reference:**
- [Advanced Tool Use SOPs](https://github.com/jeremylongshore/claude-code-plugins-plus-skills/blob/main/000-docs/207-DR-SOPS-11-advanced-tool-use.md)

### 3. MCP Connector Enhancement (M effort - 1 week)

**Requirements:**
- Verify Gemini and Codex MCP support in latest documentation
- Ensure MCP works across all supported agents
- Enhanced status feedback UI:
  - Connection health monitoring
  - Tool availability status
  - Rate limit tracking
  - Error logs with retry options

### 4. MCP Integrations (Must-Have for MVP)

| Integration | Effort | Purpose |
|-------------|--------|---------|
| **Exa Search** | S (2-3 days) | Web search for documentation and examples |
| **Firecrawl Scraping** | S (2-3 days) | Website analysis for design inspiration |
| **GitHub Deep** | M (1 week) | Repository analysis, issue tracking, PR workflows |
| **Supabase Full** | M (1 week) | Database + Auth + Realtime + Storage |
| **Context7** | S (2-3 days) | Code snippets and context management |
| **Sequential Thinking** | S (2-3 days) | Multi-step reasoning and planning |

### 5. Integration Templates (L effort - 2 weeks)

**Full Package Approach:**
Each integration template includes:
- Skill definition (SKILL.md)
- Code templates (pre-configured snippets)
- MCP server configuration

**Templates to Build:**
- Stripe payments
- SendGrid email
- Cloudinary media storage

---

## Architecture Overview

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   User Prompt     | --> |   AI Agent        | --> |   Skill Detector  |
|   (Natural Lang)  |     |   (Claude/Gemini) |     |                   |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                                                            v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   Skill Registry  | <-- |   Skill Loader    | <-- |   Matched Skill   |
|   (User/Global)   |     |   (SKILL.md)      |     |                   |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                                                            v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   MCP Server      | <-- |   Skill Executor  | --> |   Execution Trace |
|   (Dependencies)  |     |                   |     |   (Full Visibility)|
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                                                            v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   Vercel Sandbox  | <-- |   Code Generator  | --> |   User Output     |
|   (Execution)     |     |                   |     |   (Files/Changes) |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

---

## MCP Server Architecture

```
+------------------------------------------------------------------+
|                        TURBOCAT PLATFORM                          |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+  +-------------------+  +-------------------+
|  |   Claude Agent    |  |   Gemini Agent    |  |   Codex Agent     |
|  |   (Native MCP)    |  |   (Verify MCP)    |  |   (Verify MCP)    |
|  +-------------------+  +-------------------+  +-------------------+
|           |                     |                     |           |
|           +---------------------+---------------------+           |
|                                 |                                 |
|                                 v                                 |
|  +-----------------------------------------------------------+   |
|  |                    MCP SERVER MANAGER                      |   |
|  |  - Connection Health    - Tool Registry                    |   |
|  |  - Rate Limiting        - Error Handling                   |   |
|  +-----------------------------------------------------------+   |
|                                 |                                 |
|     +---------------------------+---------------------------+     |
|     |           |           |           |           |       |     |
|     v           v           v           v           v       v     |
|  +------+  +-------+  +--------+  +--------+  +-------+  +----+  |
|  | Exa  |  |Fire-  |  | GitHub |  |Supabase|  |Context|  |Seq.|  |
|  |Search|  |crawl  |  | Deep   |  | Full   |  |   7   |  |Think| |
|  +------+  +-------+  +--------+  +--------+  +-------+  +----+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Skills + Component Gallery Integration

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   ui-component    | --> |   Component       | <-- |   User Request    |
|   Skill           |     |   Gallery DB      |     |   "Create card"   |
|                   |     |   (Phase 2)       |     |                   |
+-------------------+     +-------------------+     +-------------------+
        |                         ^
        |                         |
        v                         |
+-------------------+     +-------------------+
|                   |     |                   |
|   Read Existing   |     |   Contribute New  |
|   Components      |     |   Components      |
|   (Reference)     |     |   (Bidirectional) |
+-------------------+     +-------------------+
```

---

## Phase Dependencies

```
PHASE 1 (Complete)          PHASE 2 (Must Complete)         PHASE 3 (This Spec)
+------------------+        +---------------------+         +--------------------+
| Fork & Deploy    | -----> | Design System       | -----> | Skills & MCP       |
| Vercel Template  |        | Foundation          |        | Integration        |
|                  |        |                     |        |                    |
| - Deployed app   |        | - Design tokens     |        | - Skills system    |
| - Auth working   |        | - Storybook         |        | - MCP connectors   |
| - Sandbox ready  |        | - Component Gallery |        | - Integration      |
+------------------+        +---------------------+         +--------------------+
                                    |
                                    v
                            UI-COMPONENT SKILL
                            DEPENDS ON GALLERY
```

---

## Effort Breakdown

| Component | Effort | Duration | Dependencies |
|-----------|--------|----------|--------------|
| Skills System Architecture | L | 2 weeks | Phase 2 complete |
| Core Skills Implementation | L | 2 weeks | Skills Architecture |
| MCP Connector Enhancement | M | 1 week | None |
| Exa Search Integration | S | 2-3 days | MCP Enhancement |
| Firecrawl Integration | S | 2-3 days | MCP Enhancement |
| GitHub Deep Integration | M | 1 week | MCP Enhancement |
| Supabase Full Integration | M | 1 week | MCP Enhancement |
| Context7 Integration | S | 2-3 days | MCP Enhancement |
| Sequential Thinking | S | 2-3 days | MCP Enhancement |
| Integration Templates | L | 2 weeks | All MCP integrations |

**Total Estimated Duration:** 8-10 weeks (after Phase 2 completes)

---

## Research Sources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Best Practices](https://modelcontextprotocol.info/docs/best-practices/)
- [Code Execution with MCP - Anthropic](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Claude Code Skills Guide](https://www.cursor-ide.com/blog/claude-code-skills)
- [Advanced Tool Use SOPs](https://github.com/jeremylongshore/claude-code-plugins-plus-skills/blob/main/000-docs/207-DR-SOPS-11-advanced-tool-use.md)
- [Exa MCP Documentation](https://docs.exa.ai/reference/exa-mcp)
- [Firecrawl MCP Server](https://docs.firecrawl.dev/mcp-server)

---

## Next Steps

1. Complete Phase 2 (Design System Foundation)
2. Run `/write-spec` to generate the detailed specification document
3. Create task breakdown for implementation
4. Begin implementation after Phase 2 completes

---

*Requirements gathered: 2026-01-03*
