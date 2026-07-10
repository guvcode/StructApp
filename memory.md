# Memory — ADM-421 Email Queue Admin UI Fix

Last updated: 2026-07-10T13:36:00-06:00

## What was built

Fixed the Email Queue admin UI on `task/ADM-email-queue-ui-fix`:

- **Backend** (`apps/api-server/src/routes/notifications.ts`): Changed `GET /api/v1/notifications` response to nest pagination inside `json.data` (`{ rows, pagination }`) instead of separate top-level fields — aligns with `apiClient` unwrapping `json.data`.
- **Frontend** (`apps/web-client/src/pages/admin/EmailQueuePage.tsx`): Changed destructure from `data?.data` → `data?.rows` to match unwrapped apiClient response.
- **Sidebar** (`apps/web-client/src/components/DesktopSidebar.tsx`): Changed Email Queue entry phase from `P1` → `P0` so it always shows for admin/reviewer (was hidden by the P1 feature-flag whitelist filter).
- **Test** (`apps/web-client/tests/b18-email-queue.test.tsx`): 4 tests — row rendering, Resend-only-on-non-sent, Delete-on-every-row, total count.

## Decisions made

- Pagination nested inside `json.data` on the backend instead of adding a pagination-aware variant of `apiClient` — keeps the client pattern consistent.
- Email Queue sidebar entry set to `P0` (always visible) since the route has no feature flag guard and should always be accessible.

## Current state

- ADM-421 committed to `task/ADM-email-queue-ui-fix`
- All 4 tests pass
- No regressions detected (only consumer of the notifications endpoint is EmailQueuePage itself)
- Pre-existing TS errors unchanged

## Next session starts with

Pick next task from the progress tracker.

## Open questions

None.