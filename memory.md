# Memory — FIX-010 Taxonomy 403 for Contractors

Last updated: 2026-07-08T16:06:00-06:00

## What was built

**Bug fix: GET /api/v1/taxonomy returning 403 for Contractor users.**

### Root cause
`apps/api-server/src/index.ts` mounted `picklistsRouter` with `requireRole('Admin', 'Reviewer')` BEFORE `taxonomyRouter` at the same `/api/v1` prefix. Express runs middleware in registration order, so every `/api/v1/*` request hit the picklists middleware chain first. For Contractor users, `requireRole('Admin', 'Reviewer')` returned 403 — the request never reached the taxonomy handler.

### Files changed
- **`apps/api-server/src/index.ts`** — Moved `taxonomyRouter` mount before `picklistsRouter` mount (one-line reorder)
- **`apps/api-server/tests/taxonomy-routing.test.ts`** — Structural test verifying taxonomyRouter line precedes picklistsRouter's requireRole guard line in source
- **`.doc/10-progress-tracker.md`** — Added FIX-010 bug entry

## Decisions made

- **Option 1 (reorder)** chosen over **Option 2 (scope role middleware inside router)** — one-line move, minimal risk, taxonomy is intentionally accessible to all authenticated roles (GET has no requireRole)

## Current state

- Fix committed on branch `task/FIX-010-taxonomy-mobile-permission`
- All tests pass (taxonomy service tests + new routing test)
- No TypeScript errors (only pre-existing TS6059 rootDir errors)
- Needs deployment to Render to take effect in production

## Next session starts with

Deploy the fix to Render, or pick up the next item from the progress tracker.

## Open questions

None.