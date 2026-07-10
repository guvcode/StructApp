# Memory — FIX-013 Timesheet Save Fix

Last updated: 2026-07-10T14:57:00-06:00

## What was built

Fixed timesheet save not working for draft or submitted entries on `task/TS-fix-timesheet-save`:

- **Server service** (`apps/api-server/src/services/timesheets.ts`): Added `pre_inspection` to `updateTimesheet` params type, SQL SET clause, and RETURNING columns. Allowed editing Submitted entries by reverting status to Draft (previously threw `TIMESHEET_NOT_DRAFT`).
- **Server route** (`apps/api-server/src/routes/timesheets.ts`): Added extraction of `pre_inspection` from PATCH request body with `Boolean()` coercion.
- **Client page** (`apps/web-client/src/pages/mobile/TimesheetDetailPage.tsx`): Added `pre_inspection: entry.preInspection` to the update mutation payload.
- **Tests** (`apps/api-server/tests/timesheets.test.ts`): Updated existing test to verify `pre_inspection` and `notes` in response. Added new test for editing a Submitted entry (expects status to revert to Draft). Changed the NOT_DRAFT test to use an Approved entry (since Submitted no longer errors).

## Decisions made

- Editing a submitted timesheet reverts it to Draft (must be resubmitted for re-approval). Approved/Rejected entries remain uneditable.
- `pre_inspection` is included in the PATCH payload for both drafts and submitted entries, ensuring the flag is preserved during edits.

## Problems solved

- `pre_inspection` field was completely missing from the update code path — not extracted in the route handler, not accepted by the service, not sent by the client. Resulted in silent data loss on save.
- Submitted timesheets could not be edited at all — the service gate kept them from being updated.

## Current state

- FIX-013 committed to `task/TS-fix-timesheet-save`
- All 14 server tests pass, 1 client test passes
- No regressions detected (only `updateTimesheet` caller is the PATCH route handler)

## Next session starts with

Pick next task from the progress tracker.

## Open questions

None.