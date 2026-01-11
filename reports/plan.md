# Turbocat Architectural Review & Monorepo Unification Plan

## Executive Summary

This document outlines the plan for a comprehensive architectural review, code cleanup, and monorepo unification of the Turbocat platform. The goal is to identify and remove dead code, fix deployment gaps, unify the repository structure, and establish zero-touch deployments to Vercel (frontend) and Railway (backend).

## 1. Repository Topology

### Current Structure
```
turbocat/                           # Root (npm, minimal config)
├── backend/                        # Express.js 5.2 + Prisma (npm)
├── turbocat-agent/                 # Next.js 16 + React 19 (npm + pnpm lockfile)
├── agent-os/                       # Agent orchestration specs/commands
├── implementation/                 # Phase POC implementations
├── planning/                       # Root-level planning docs
└── .github/workflows/              # CI/CD (only tests frontend)
```

### Target Structure
```
turbocat/                           # Root workspace (npm workspaces)
├── apps/
│   ├── frontend/                   # Next.js 16 (moved from turbocat-agent)
│   └── backend/                    # Express.js 5.2 (moved from backend)
├── packages/
│   └── shared/                     # Shared types, utilities
├── agent-os/                       # Agent orchestration (unchanged)
├── planning/                       # Planning docs (unchanged)
└── .github/workflows/              # CI/CD (unified for all apps)
```

## 2. Stack Discovery

### Frontend (turbocat-agent/)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.0.10 |
| React | React | 19.2.1 |
| Styling | Tailwind CSS | 4.1.13 |
| UI Components | shadcn/ui + Radix | Latest |
| State | Jotai | 2.15.0 |
| Database ORM | Drizzle | 0.36.4 |
| Testing | Vitest | 4.0.16 |
| AI SDK | @anthropic-ai/claude-agent-sdk | 0.2.3 |
| Deployment | Vercel | Configured |

### Backend (backend/)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | Express.js | 5.2.1 |
| Database ORM | Prisma | 7.2.0 |
| Queue | BullMQ | 5.66.4 |
| Cache | Redis (ioredis) | 5.9.0 |
| Validation | Zod | 4.3.5 |
| Testing | Jest | 30.2.0 |
| AI SDK | @anthropic-ai/claude-agent-sdk | 0.2.4 |
| Deployment | Railway | NOT Configured |

### Package Manager
- **Current**: npm (with orphaned pnpm-lock.yaml in frontend)
- **Recommendation**: Stick with npm, remove pnpm-lock.yaml

## 3. Identified Issues

### P0 - Critical (Must Fix)

| Issue | Location | Description |
|-------|----------|-------------|
| No Dockerfile | backend/ | Railway cannot deploy without container config |
| No Railway config | root | Missing railway.json/railway.toml |
| CI masks failures | .github/workflows/ci.yml:55-59 | `continue-on-error: true` on tests/typecheck |
| CI only tests frontend | .github/workflows/ci.yml | Backend has no CI coverage |
| Package name collision | root + frontend package.json | Both named "turbocat" |
| Dual lock files | turbocat-agent/ | Has both npm and pnpm lock files |

### P1 - High (Should Fix)

| Issue | Location | Description |
|-------|----------|-------------|
| No workspace config | root package.json | No npm workspaces defined |
| Frontend uses pnpm in CI | ci.yml | But has npm lockfile as primary |
| No shared types | - | Frontend/backend duplicate types |
| Missing typecheck in backend CI | ci.yml | Only frontend is typechecked |

### P2 - Medium (Nice to Fix)

| Issue | Location | Description |
|-------|----------|-------------|
| Orphaned tests directory | backend/tests/ | Empty, tests in src/__tests__ |
| No E2E in CI | ci.yml | Playwright E2E not in pipeline |
| No coverage thresholds | both | Coverage configured but not enforced |

## 4. Deployment Configuration Gaps

### Vercel (Frontend) - Status: PARTIAL
- [x] vercel.json exists with function config
- [x] .vercel/ directory for project linking
- [ ] Needs monorepo-aware root directory config
- [ ] Needs environment variable documentation

### Railway (Backend) - Status: NOT CONFIGURED
- [ ] No Dockerfile
- [ ] No railway.json/railway.toml
- [ ] No Procfile
- [ ] No health check configuration for Railway
- [ ] Missing environment variable mapping

## 5. Proposed Changes

### Phase 1: Baseline & Cleanup (Low Risk)
1. Run and capture baseline verification
2. Remove pnpm-lock.yaml from frontend
3. Fix CI to not mask failures
4. Add backend to CI pipeline

### Phase 2: Monorepo Unification (Medium Risk)
1. Configure npm workspaces in root package.json
2. Move turbocat-agent/ → apps/frontend/
3. Move backend/ → apps/backend/
4. Create packages/shared/ for shared types
5. Update import paths and tsconfig aliases
6. Fix package name collision (rename frontend to @turbocat/web)

### Phase 3: Deployment Configuration (Medium Risk)
1. Create Dockerfile for backend
2. Create railway.json with service definitions
3. Update vercel.json for monorepo
4. Configure CI/CD for both platforms

### Phase 4: Code Audit & Cleanup (Low Risk)
1. Identify dead routes/components
2. Remove unused exports
3. Consolidate duplicate utilities
4. Run tests after each cleanup

## 6. Risk Assessment

| Phase | Risk Level | Rollback Plan |
|-------|-----------|---------------|
| Phase 1 | Low | Git revert individual commits |
| Phase 2 | Medium | Create backup branch before moves |
| Phase 3 | Medium | Deploy to staging first |
| Phase 4 | Low | Each removal is atomic commit |

## 7. Success Criteria

All must be TRUE for completion:
- [ ] build_green - All packages build successfully
- [ ] tests_pass - All tests pass (no continue-on-error masking)
- [ ] lint_clean - ESLint passes with no warnings
- [ ] typecheck_clean - TypeScript compiles with no errors
- [ ] coverage_delta >= 0 - Coverage does not decrease
- [ ] no_dead_code_reported - Dead code scan clean
- [ ] routes_valid - All routes have handlers
- [ ] deploy_smoke_green - Staging deploys work
- [ ] unified_repo_ready - Monorepo structure complete
- [ ] vercel_deploy_green - Frontend deploys to Vercel
- [ ] railway_deploy_green - Backend deploys to Railway

## 8. Commands Reference

### Build Commands
```bash
# Frontend
cd turbocat-agent && npm run build

# Backend
cd backend && npm run build
```

### Test Commands
```bash
# Frontend
cd turbocat-agent && npm test

# Backend
cd backend && npm test
```

### Lint Commands
```bash
# Frontend
cd turbocat-agent && npm run lint

# Backend
cd backend && npm run lint
```

### Typecheck Commands
```bash
# Frontend
cd turbocat-agent && npm run type-check

# Backend
cd backend && npm run typecheck
```

## 9. Next Steps

1. Run baseline verification and capture logs
2. Create reports/baseline/ artifacts
3. Update CI to stop masking failures
4. Begin Phase 1 cleanup
