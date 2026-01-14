# Epic 3: Editing & Iteration Tools - Decisions

## [2026-01-13] Implementation Approach

### Decision 1: Rule-Based Suggestions (Not ML)
**Rationale**: Feature spec recommends rule-based initially, ML later if needed
**Trade-offs**:
- Pro: Simpler, faster to implement, deterministic
- Con: Less adaptive than ML model
**Alternative Considered**: ML-based contextual analysis
**Status**: APPROVED

### Decision 2: Backend-Driven Suggestions
**Rationale**: Suggestions require project state analysis (chat history)
**Trade-offs**:
- Pro: Centralized logic, consistent across clients
- Con: Requires API call (but can cache)
**Alternative Considered**: Client-side suggestion generation
**Status**: APPROVED

### Decision 3: Configuration Panels as Separate Components
**Rationale**: Each panel has unique form fields and logic
**Trade-offs**:
- Pro: Easier to maintain, code-split, test individually
- Con: More files to manage (12 panels)
**Alternative Considered**: Single generic panel with config schema
**Status**: APPROVED

### Decision 4: Keyboard Shortcuts Use Cmd/Ctrl+Shift
**Rationale**: Avoid conflicts with browser/IDE shortcuts
**Trade-offs**:
- Pro: Safe, consistent pattern
- Con: Requires two modifiers (slightly less ergonomic)
**Alternative Considered**: Single modifier shortcuts
**Status**: APPROVED
