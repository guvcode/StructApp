# Memory — FIX-015 Timesheet Cache Invalidation Fix

Last updated: 2026-07-10T10:12:00-06:00

## What was built

### TSM-904 — TimesheetDetailPage uses `useCreateTimesheetBatch` hook

**Root cause:** `TimesheetDetailPage.tsx` imported and called the raw `createTimesheetBatch` API function directly instead of using the `useCreateTimesheetBatch` React Query hook. This meant the React Query cache key `['timesheets', userId]` was never invalidated after saving, so the `TimesheetListPage` showed stale (empty) data after navigation.

**Fix:** Replaced the raw API import/call with the `useCreateTimesheetBatch` hook. The hook's `onSuccess` callback calls `client.invalidateQueries({ queryKey: ['timesheets'] })`, ensuring the list page fetches fresh data on mount.

**Files changed:**
- `apps/web-client/src/pages/mobile/TimesheetDetailPage.tsx` — Changed import from `services/api/timesheets` to `hooks/useTimesheets`; added `createBatch = useCreateTimesheetBatch()`; changed `await createTimesheetBatch(body)` to `await createBatch.mutateAsync(body)`
- `apps/web-client/tests/b17-timesheet-detail.test.tsx` — New test file verifying `useCreateTimesheetBatch.mutateAsync` is called on save
- `.doc/10-progress-tracker.md` — Added TSM-904 entry

## Decisions made

- Use the existing React Query hook pattern for data mutations (consistent with rest of codebase)
- No server-side changes needed — the `POST /batch` endpoint and `GET /` endpoint already use correct `client_id` logic

## Current state

- Fix committed to `task/FIX-015-timesheet-batch-save`
- All timesheet API tests pass (5/5)
- New test (b17) passes
- No new TypeScript errors
- Pre-existing errors in other files unchanged

## Next session starts with

FIX-015 task is complete. Next: pick a new task from the progress tracker (Sprint 6 has all items completed; Sprint cross-track items remain).

## Open questions

None.