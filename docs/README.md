# Turbocat Documentation Hub

**Single Source of Truth for Product Development**

This documentation system replaces the previous `/planning` structure with a comprehensive, production-ready approach to product development and implementation.

## Directory Structure

### 📋 00-context/
**Project Foundation & State**
- `vision.md` - Product vision, mission, and long-term goals
- `assumptions.md` - Core assumptions about users, tech stack, and constraints
- `system-state.md` - Current state of the codebase and infrastructure

### 🎯 01-product/
**Product Requirements**
- `prd.md` - Product Requirements Document with user stories, acceptance criteria

### ⚡ 02-features/
**Feature Specifications**
Each feature gets its own directory:
```
feature-<name>/
├── feature-spec.md    # What we're building and why
├── tech-design.md     # How we'll build it
├── dev-tasks.md       # Step-by-step implementation tasks
└── test-plan.md       # Verification and testing strategy
```

### 📝 03-logs/
**Development History & Insights**
- `implementation-log.md` - Daily development progress
- `decisions-log.md` - Technical decisions and rationale
- `bug-log.md` - Issues discovered and resolutions
- `validation-log.md` - Test results and verification evidence
- `insights.md` - Learnings and patterns discovered

### 🔧 04-process/
**Development Workflow**
- `dev-workflow.md` - How we develop features
- `definition-of-done.md` - Completion criteria
- `llm-prompts.md` - Effective prompts for AI assistance

## Usage

### Starting New Work
1. Check `00-context/system-state.md` for current state
2. Review `01-product/prd.md` for requirements
3. Create feature directory in `02-features/`
4. Follow `04-process/dev-workflow.md`

### During Development
- Update `03-logs/implementation-log.md` daily
- Document decisions in `03-logs/decisions-log.md`
- Log issues in `03-logs/bug-log.md`
- Record test results in `03-logs/validation-log.md`

### Completing Work
- Verify against `04-process/definition-of-done.md`
- Update `00-context/system-state.md`
- Extract insights to `03-logs/insights.md`

## Migration from /planning

Previous planning files have been reviewed and consolidated:
- `ISSUE_FIX_PLAN.md` → Integrated into feature specs
- `ISSUE_FIX_TASKS.md` → Migrated to dev-tasks.md
- `ISSUE_FIX_DECISIONS.md` → Captured in decisions-log.md
- `ISSUE_FIX_STATUS.md` → Will update system-state.md

---

**Last Updated:** 2026-01-12
**Status:** Active Development
