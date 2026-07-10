# Memory — REFACTOR-001 Literal Constants Across Forms

Last updated: 2026-07-10T10:55:00-06:00

## What was built

Replaced hardcoded string literals with canonical status constants (`InspectionStatus`, `TimesheetStatus`, `PriorityTier`, `RemediationStatus`) from `types/index.ts` across 12 files:

- `apps/web-client/src/pages/mobile/TimesheetListPage.tsx` — `TimesheetStatus` for filter array + 4 status comparisons
- `apps/web-client/src/pages/mobile/InspectionDetailPage.tsx` — `InspectionStatus` for 7 status comparisons
- `apps/web-client/src/pages/mobile/DeficiencyPhotosPage.tsx` — `InspectionStatus` for readOnly check
- `apps/web-client/src/pages/mobile/DeficiencyDetailPage.tsx` — `InspectionStatus` for readOnly check; `PriorityTier` for PRIORITY_OPTIONS
- `apps/web-client/src/pages/mobile/DashboardPage.tsx` — `InspectionStatus` for 6 filter conditions + status color/label
- `apps/web-client/src/pages/reviewer/TimesheetReviewPage.tsx` — `TimesheetStatus` for filter array + 3 canActOn conditions
- `apps/web-client/src/components/DesktopSidebar.tsx` — `InspectionStatus` + `RemediationStatus` for route config strings
- `apps/web-client/src/components/ReopenInspectionModal.tsx` — `InspectionStatus` for TARGET_STATUSES
- `apps/web-client/src/components/InspectionCalendarView.tsx` — `InspectionStatus` for openCount filter
- `apps/web-client/src/components/BulkReassignDialog.tsx` — `InspectionStatus` for open/approved filters
- `apps/web-client/src/components/GovernanceMetadataPanel.tsx` — `InspectionStatus` for hasReturn check
- `apps/web-client/src/pages/admin/AdminDashboardPage.tsx` — `InspectionStatus` for status badge styling

## Decisions made

- Constants used directly from `types/index.ts` (`InspectionStatus`, `TimesheetStatus`, `PriorityTier`, `RemediationStatus`) — consistent with existing reviewer page pattern
- `object.values(PriorityTier)` replaces `['P1','P2','P3','P4','P5']` inline array
- Route URL strings in `DesktopSidebar.tsx` use template literals with constants (e.g. ``/inspections?status=${InspectionStatus.Submitted}``)

## Current state

- All 12 files refactored on `task/REFACTOR-001-literal-constants-forms`
- No new TypeScript errors (only pre-existing ones in PicklistLandingPage, GenericPicklistPage, usePicklists, etc.)
- FIX-015 stash has been committed and pushed to `task/FIX-015-timesheet-batch-save`

## Next session starts with

Run regression tests and commit this branch. Then pick the next task from the progress tracker (Sprint cross-track items remain).

## Open questions

None.