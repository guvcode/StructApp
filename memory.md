# Memory — FIX-010 Taxonomy 403 + FIX-011 Deficiency Schema

Last updated: 2026-07-08T17:03:00-06:00

## What was built

### FIX-010 — Taxonomy 403 for Contractors
**Bug fix: GET /api/v1/taxonomy returning 403 for Contractor users.**
- `taxonomyRouter` was mounted after `picklistsRouter`'s `requireRole('Admin', 'Reviewer')` guard at the same `/api/v1` prefix. Express ran the restrictive middleware first.
- Fix: one-line reorder in `apps/api-server/src/index.ts`
- Committed on `task/FIX-010-taxonomy-mobile-permission` (already pushed)

### FIX-011 — Deficiency records schema mismatch
**Bug fix: POST /api/v1/inspections/:id/deficiencies returning 500.**
- `createDeficiency` INSERT referenced `structure_id`, `created_by`, `priority_tier`, `location_desc` — columns that were never added to the `deficiency_records` table via any migration.
- The INSERT also omitted old v2 required columns (`component`, `severity`, `probability`, `consequences`) replaced by the Glencore grid in TAX-611.
- Fix: migration `1700000020000_fix_deficiency_records_schema.ts` adds the four missing columns as nullable and makes the four old columns nullable.
- Committed on `task/FIX-011-deficiency-records-schema` (just pushed — new branch)

## Decisions made

- FIX-010: Reorder over scoping role middleware — simpler, minimal risk
- FIX-011: Migration approach (not altering the INSERT) — keeps INSERT as-is, fixes the actual schema to match what the code expects

## Current state

- Both fixes committed and pushed
- All tests pass (deficiencies, taxonomy, routing, migration structural tests)
- No TypeScript errors (only pre-existing TS6059 rootDir)
- Deployed Render instance has the FIX-010 code but NOT the FIX-011 migration

## Next session starts with

Run the FIX-011 migration against the Render database, then deploy the latest code. Sequence:
1. `npx node-pg-migrate up` on Render database
2. Deploy updated code (both fixes)
3. Verify taxonomy and deficiency creation work in production

## Open questions

None.