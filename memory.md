# Memory — REFACTOR-001 Literal Constants Across Forms

Last updated: 2026-07-10T11:10:00-06:00

## What was built

Replaced hardcoded string literals with canonical status constants (`InspectionStatus`, `TimesheetStatus`, `PriorityTier`, `RemediationStatus`) from `types/index.ts` across 12 files on `task/REFACTOR-001-literal-constants-forms`.

Also: committed and pushed FIX-015 (`client_id` parameter switch) to `task/FIX-015-timesheet-batch-save`.

## Decisions made

- Constants used directly from `types/index.ts` — consistent with existing reviewer page pattern
- `Object.values(PriorityTier)` replaces inline `['P1','P2','P3','P4','P5']`
- Route URL strings use template literals with constants

## Current state

- REFACTOR-001 committed and pushed (2 commits: `c477e4a` + `79215dd`)
- FIX-015 committed and pushed (`17cc4f3`)
- Progress tracker updated, `validate.js` added to `.gitignore`
- Remaining stashes: OFFLINE-PIN-001, MOD-419, EDT-415 (untouched)
- Pre-existing TS errors in PicklistLandingPage, GenericPicklistPage, usePicklists, riskCalculator, etc. unchanged

## Next session starts with

Pick next task from the progress tracker.

## Open questions

None.