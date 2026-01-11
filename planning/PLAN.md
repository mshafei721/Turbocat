# Phase 5: Agent SDK Refactoring Plan

## Goal
Refactor Turbocat to use the Anthropic Agent SDK with a filesystem-based Skill architecture. Download all 16 official Anthropic skills and integrate Claude Agent SDK as the single AI provider across both frontend and backend.

## Scope
1. **Skills Download:** Clone all 16 official Anthropic skills from `anthropics/skills` repo to `.claude/skills/anthropic/`
2. **SDK Setup:** Install and configure `@anthropic-ai/claude-agent-sdk` in both frontend and backend
3. **Permissions:** Configure `settingSources` to include "project" and add "Skill" to allowed tools
4. **Railway Prep:** Ensure all configuration uses environment variables for deployment

## Non-Goals
- Removing existing custom skills (17 skills in `.claude/skills/`)
- Modifying the existing backend LLM executor architecture significantly
- Adding new AI providers (focus is on Claude Agent SDK as single provider)
- Creating new custom skills (just downloading official ones)

## Constraints
- Must maintain backward compatibility with existing agents and workflows
- Cannot break current dashboard, sandbox, or task execution functionality
- Must follow existing TypeScript patterns and monorepo structure
- All secrets must use environment variables (Railway deployment ready)

## Assumptions
- Official Anthropic skills repository is stable and accessible
- Agent SDK is compatible with Node.js 18+ (already required by project)
- Skills can coexist with existing custom skills
- Users will provide `ANTHROPIC_API_KEY` via environment variable

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SDK version incompatibility | Low | High | Pin exact version, test thoroughly |
| Skill loading conflicts | Low | Medium | Namespace skills under `anthropic/` |
| Breaking existing LLM flows | Medium | High | Keep existing executor as fallback |
| Large context from skills | Low | Medium | Use progressive disclosure |

## Rollback Strategy
All changes are reversible via git:
```bash
# Revert SDK changes
git checkout HEAD~1 -- backend/src/services/agent-sdk/
git checkout HEAD~1 -- turbocat-agent/lib/agent-sdk/
git checkout HEAD~1 -- .claude/skills/anthropic/
```

## Impact
**Files to be created:**
- `.claude/skills/anthropic/` - 16 official skill directories
- `backend/src/services/agent-sdk/index.ts` - Backend SDK wrapper
- `turbocat-agent/lib/agent-sdk/index.ts` - Frontend SDK wrapper
- `.claude/settings.json` - Permissions configuration

**Files to be modified:**
- `backend/package.json` - Add @anthropic-ai/claude-agent-sdk
- `turbocat-agent/package.json` - Add @anthropic-ai/claude-agent-sdk
- `.env.template` files - Document ANTHROPIC_API_KEY requirement

## Acceptance Criteria
1. All 16 official Anthropic skills downloaded and accessible
2. Agent SDK initialized in both frontend and backend
3. Skills can be loaded via `settingSources: ["project"]`
4. "Skill" permission enabled in allowed_tools
5. All existing tests pass
6. Environment variables configured for Railway deployment

## Test Plan
```bash
# Backend tests
cd backend && pnpm test

# Frontend tests
cd turbocat-agent && pnpm test

# Type check
cd turbocat-agent && pnpm type-check
cd backend && pnpm build
```
