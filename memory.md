# Memory — FIX-015 assigned contractor display + reassignment history

Last updated: 2026-07-22T21:35:00-06:00

## What was built

- **Assigned contractor display** — All four detail pages now show the assigned contractor (`InspectionDetailPage` reviewer/mobile, `DeficiencyDetailPage` reviewer/mobile). Mobile deficiency page surfaces `inspection.assignee_name` when the deficiency has no own assignee. Reviewer deficiency page explicitly shows inspection assignee when both exist.
- **Reassignment history API** — New `GET /api/v1/inspections/:id/reassignment-history` endpoint backed by `getReassignmentHistory()` in `inspections-admin.ts`. Resolves old/new inspector and performer display names in a single batch query. Returns `[]` on no history or API error so detail pages render gracefully.
- **Reassignment trail UI** — `InspectionDetailPage` reviewer and mobile render a "Reassignment Trail" section when `reassignmentHistory.length > 0` showing old→new contractor, date, and reason.
- **Reuses `system_audit_logs` REASSIGN** — No new tables required. `old_values`/`new_values` JSONB carry `inspector_id` and `reason`.

## Files changed

- `apps/api-server/src/services/inspections-admin.ts`
- `apps/api-server/src/routes/inspections.ts`
- `apps/api-server/tests/inspections.test.ts`
- `apps/web-client/src/types/index.ts`
- `apps/web-client/src/services/api/endpoints.ts`
- `apps/web-client/src/services/api/inspections.ts`
- `apps/web-client/src/pages/reviewer/InspectionDetailPage.tsx`
- `apps/web-client/src/pages/reviewer/DeficiencyDetailPage.tsx`
- `apps/web-client/src/pages/mobile/InspectionDetailPage.tsx`
- `apps/web-client/src/pages/mobile/DeficiencyDetailPage.tsx`

## Decisions made

- RLS bypass set to `true` inside the history query so any authenticated user in the client can see reassignment history for inspections in their tenant.
- `requireAuth` (all roles) instead of role-restricted so inspectors and contractors can view their own reassignment history.
- API client helper swallows errors and returns `[]` to prevent detail page crashes when the endpoint is unavailable.
- Batch-fetch user display names in a single `ANY($1::uuid[])` query to avoid N+1.

## Current state

- Uncommitted on `task/BL-038-photo-metadata-visibility`
- Added 3 unit tests for `getReassignmentHistory` (empty results, resolved names, rollback on error)
- Pre-existing api-server test failures (`returnInspection`/`submitInspection`/`createInspection` notifications) are unrelated.
- Pre-existing web-client TS errors (`GenericPicklistPage`, `usePicklists`, etc.) are unrelated.
- Progress tracker updated: FIX-015 marked COMPLETED.

## Next session starts with

- `/remember restore` to load this memory
- Commit pending changes if not already done.

## Open questions

- Branch hygiene: FIX-015 work was implemented on `task/BL-038-photo-metadata-visibility`. Consider migrating to a dedicated `task/FIX-015` branch before merging if team prefers strict per-feature branches.
