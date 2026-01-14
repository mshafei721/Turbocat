# Epic 5 Issues & Blockers

## Session: 2026-01-14

(Issues will be logged here as they arise during implementation)

---

## Common Gotchas to Avoid

Based on Epic 1 and Epic 3 learnings:

1. **Prisma Mock Issues**: Import mocked modules AFTER jest.mock() declaration, cast to `any` for access
2. **Radix UI Checkboxes**: Use `data-state="checked"` attribute, NOT `.checked` property
3. **Number Input Updates**: Use `tripleClick + keyboard` instead of `clear + type`
4. **Fetch Credentials**: Always use `credentials: 'include'` for httpOnly cookies
5. **JWT Validation**: Basic format check (3 parts separated by dots)
6. **TypeScript Strict Nulls**: Use non-null assertion `!` when safe after validation
7. **Cache Keys**: Include userId in Redis keys to prevent cross-user leakage
8. **Error Propagation**: Use `next(error)` in Express routes for centralized handling
