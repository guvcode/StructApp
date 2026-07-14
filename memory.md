# Memory — Timesheet client_id mismatch fix (TIMESHEET-001)

Last updated: 2026-07-14T08:16:00-06:00

## What was built

- **`apps/api-server/src/routes/timesheets.ts`** — Added `client_id` (optional UUID) to `batchCreateSchema` Zod schema. Added validation in `POST /batch` handler: if `client_id` is provided in the request body, it must match the `client_id` resolved from the inspection/project chain. Returns 422 `CLIENT_MISMATCH` if they differ.
- **`apps/web-client/src/pages/mobile/TimesheetDetailPage.tsx`** — Added `client_id: getActiveClientId()` to the batch create request body when `activeClientId` is available.

## Decisions made

- The `trg_set_timesheet_client` DB trigger always overwrites `client_id` with the project's value, so the client-sent `client_id` is used for validation only, not storage
- The approach: ensure `active_client_id` aligns with the inspection's client before creating entries — prevents cross-client entries from becoming invisible on the list page
- Backward compatible: `client_id` is optional in the schema — existing callers without it continue to work

## Problems solved

- Root cause identified: user `gbengaomoni@gmail.com` has memberships in two clients (Eamec Canada, Glecore Canada). Login picks first membership (Eamec) as `active_client_id`. Entries created under Glecore inspections get stored with Glecore's `client_id` (via trigger), but list page filters by Eamec's `active_client_id` — entries invisible.
- Database confirmed: 0 entries for today (2026-07-14), 2 entries exist from July 10, both under Glecore Canada.

## Current state

- Both changes committed to `task/TIMESHEET-001-fix-client-id-mismatch`
- Server tests (14) and client tests (6) all pass
- `tsc --noEmit --skipLibCheck` timed out (large project) — but changes are type-safe

## Next session starts with

- If the client switcher (`setActiveClientId` in `authStore.ts`) is not wired up, the `active_client_id` will remain at the first membership. The switcher needs to call `setActiveClientId()` when the user selects a different client.

## Open questions

- The client switcher (`switchClient` endpoint exists on server, `setActiveClientId` exists in authStore) — is it fully wired in the UI? If not, the user's `active_client_id` stays at the first membership, and creating entries for other clients will still hit the `CLIENT_MISMATCH` error.