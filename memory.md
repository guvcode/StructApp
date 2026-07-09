# Memory — FIX-012 Mobile Deficiency Detail Page Bugs

Last updated: 2026-07-08T23:12:00-06:00

## What was built

### FIX-012 — Mobile Deficiency Detail Page bugs
**Three bugs fixed in `apps/web-client/src/pages/mobile/DeficiencyDetailPage.tsx`:**

1. **Save -> Navigate**: After saving a new deficiency, the page now navigates to `/m/deficiencies/{newId}?inspection_id=X` using `navigate(..., { replace: true })`. The mutation returns the `deficiency_id` from the API response, and `onSuccess` navigates to the edit page — making the "Manage Photos" button visible.

2. **Existing data loading**: Added a `useQuery` that tries Dexie `offlineDeficiencies` first, then falls back to `getDeficiencyById` from the API. A `useEffect` populates all 18 form fields from the fetched data. Both camelCase (Dexie) and snake_case (API) field names are handled.

3. **Duplicate save prevention**: Navigation after save naturally prevents re-clicking. Also added a loading skeleton for the edit mode while data is being fetched.

### Tests updated
- `tests/b6-mobile.test.tsx` — Added 2 new tests: "shows edit heading for existing deficiency" and "disables save button when category not selected"
- Fixed broken import paths for mock services (archived)

## Decisions made

- **Navigate vs stay**: Navigate to edit URL on save — makes photos accessible, prevents duplicate saves, URL is bookmarkable
- **Dexie + API fallback**: Load from offline cache first, then API — works offline for contractors in the field
- **useEffect for data population**: Acceptable per project standards (not a data-fetching effect, it syncs query results to form state)

## Current state

- Both commits pushed to `task/FIX-012-deficiency-save-navigate`
- All 3 B6-T06 tests pass
- No new TypeScript errors (only pre-existing ones)
- Pre-existing test failures (DashboardPage, InspectionDetailPage, InspectionSubmitPage) are unrelated API-mocking issues

## Next session starts with

None — this task is complete. The FIX-011 migration should be run against the Render database, then deploy the updated code.

## Open questions

None.