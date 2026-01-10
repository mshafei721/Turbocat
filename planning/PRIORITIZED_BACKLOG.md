# Prioritized Backlog

*Synthesized from RLM Subagent Analysis - 2026-01-10*

## P0: Build Blockers

| ID | Issue | Source | Impact | Effort | Action |
|----|-------|--------|--------|--------|--------|
| P0-1 | No backend deployment pipeline in CI | build-ci | Backend builds but never deploys automatically | Medium | Add Railway/Docker deployment job to ci.yml |
| P0-2 | Tests/type-check continue-on-error | build-ci | Broken code can pass CI | Low | Remove continue-on-error flags in frontend CI |

## P1: Correctness Bugs

| ID | Issue | Source | Impact | Effort | Action |
|----|-------|--------|--------|--------|--------|
| P1-1 | Giant components (TaskDetails 2639 LOC) | frontend | Hard to maintain, test, debug | High | Extract sub-components: TaskDetailsHeader, Content, Actions |
| P1-2 | useTask hook retry complexity | frontend | Race conditions, memory leaks | Medium | Refactor retry logic, add tests |
| P1-3 | AppLayout 8 useEffect hooks | frontend | State inconsistency risk | Medium | Consolidate effects, extract custom hooks |
| P1-4 | Polling intervals hardcoded (5s) | frontend | No optimization for different conditions | Low | Extract usePolling hook with configurable interval |
| P1-5 | Mobile detection unreliable | frontend | Inconsistent sidebar behavior | Low | Use client-only detection or useMediaQuery |

## P2: Security Issues

| ID | Issue | Source | Impact | Effort | Action |
|----|-------|--------|--------|--------|--------|
| P2-1 | Dual auth systems (JWT vs OAuth) | backend | User ID collision risk if merged | High | Create shared auth service layer |
| P2-2 | Password reset token in dev response | security | Expected, but verify prod separation | Low | Verify NODE_ENV checks in production |
| P2-3 | Rate limiting graceful degradation | security | Allows requests if Redis down | Medium | Add Redis availability monitoring |
| P2-4 | No global rate limiting | security | Brute force exposure | Medium | Add rate limiting middleware globally |
| P2-5 | JWT secret length warning only | security | Weak keys possible | Low | Throw error if < 32 chars in production |

## P3: Maintainability

| ID | Issue | Source | Impact | Effort | Action |
|----|-------|--------|--------|--------|--------|
| P3-1 | Mixed package managers (npm + pnpm) | build-ci | Dependency conflicts, confusion | Medium | Migrate to pnpm workspaces at root |
| P3-2 | Dual database architecture | cartographer | Sync/consistency issues | High | Document data flow, consider unification |
| P3-3 | Test coverage gaps (~10 files for 123 components) | frontend | Regressions not caught | High | Add tests for major domain components |
| P3-4 | Coverage thresholds disabled | test-quality | No enforcement | Low | Enable thresholds with 60-70% baseline |
| P3-5 | No error boundaries | frontend | Component crashes = app crash | Low | Add ErrorBoundary to layout hierarchy |
| P3-6 | No shared types package | cartographer | API contract drift | Medium | Create shared types for frontend/backend |
| P3-7 | No audit logging in turbocat-agent | backend | Compliance gap | Medium | Add AuditLog equivalent |
| P3-8 | 517 timing-sensitive tests | test-quality | Flaky tests on CI | Medium | Use mock timers consistently |

## P4: Enhancements

| ID | Issue | Source | Impact | Effort | Action |
|----|-------|--------|--------|--------|--------|
| P4-1 | No unified API documentation | cartographer | Onboarding friction | Low | Expose Swagger at /api/docs |
| P4-2 | Missing Storybook domain stories | frontend | Component discovery hard | Low | Add stories for TaskSidebar, RepoSelector |
| P4-3 | No accessibility tests | frontend | Unknown a11y issues | Medium | Add jest-axe tests in Storybook |
| P4-4 | Expo Dockerfile uses :latest | build-ci | Unstable builds | Low | Pin to node:20-alpine |
| P4-5 | Artifact retention 7 days | build-ci | Historical data loss | Low | Increase to 30/90 days |
| P4-6 | No health endpoint in turbocat-agent | backend | No readiness probe | Low | Add GET /api/health |

---

## Quick Wins (< 1 hour each)

1. **Remove continue-on-error flags** in `.github/workflows/ci.yml` (P0-2)
2. **Enable coverage thresholds** in `jest.config.js` (P3-4)
3. **Add ErrorBoundary** component to layouts (P3-5)
4. **Pin Dockerfile versions** to node:20-alpine (P4-4)
5. **Increase artifact retention** to 30 days (P4-5)
6. **Add /api/health endpoint** in turbocat-agent (P4-6)
7. **Enforce JWT secret length** in production (P2-5)

---

## Subagent Buffers Summary

| Agent | Key Finding | Primary Risk | Recommended Action |
|-------|-------------|--------------|-------------------|
| repo-cartographer | Dual DB (Supabase + Neon) | Sync issues | Document data flow |
| build-ci | No backend CD pipeline | Manual deploys | Add deployment job |
| backend | Two competing auth systems | User ID collision | Create shared auth |
| frontend | Giant components (2600+ LOC) | Unmaintainable | Extract sub-components |
| data-security | Excellent security posture | Rate limit fallback | Monitor Redis |
| test-quality | 517 timing operations | Flaky tests | Use mock timers |

---

*Generated by RLM synthesis process*
