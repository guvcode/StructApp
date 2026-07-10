# Plan: Admin Timesheet Review — Inspection × Contractor Grid

## Goal
Restructure the admin timesheet review page to show a grid with inspections as rows and contractors as columns. Clicking a cell navigates to a detail subpage with the entry list and approve/reject controls.

## Design Decisions (Confirmed)

| Decision | Choice |
|---|---|
| Grid orientation | **Inspections as rows**, contractors as columns |
| Detail page data | **Router state** (`navigate(path, { state })`) — no extra API call |
| Approve/reject granularity | **Bulk + individual** on the detail page |

## Architecture

### Data Flow

```
/groups endpoint (flat entries)
  → groupIntoGrid() transforms into { inspections[], contractors[], cells Map }
  → TimesheetReviewPage renders HTML table
  → Click cell → navigate(detailPath, { state: { user_id, inspection_id, entries } })
  → TimesheetReviewDetailPage reads state, renders entry list + approve/reject
```

### Route Structure

```
/timesheets/review              → TimesheetReviewPage (grid)
/timesheets/review/detail       → TimesheetReviewDetailPage (entry list)
```

Both wrapped in the existing `FeatureFlagGuard` for the `timesheets` flag.

## Task List

### Task 1 — Add grid data structure and transform

**File: `apps/web-client/src/types/index.ts`**

Add:
```typescript
export interface TimesheetGridCell {
  user_id: string;
  inspection_id: string;
  entries: Timesheet[];
  total_hours: number;
  status: TimesheetStatus | 'Mixed';
}

export interface TimesheetGridData {
  inspections: Array<{ inspection_id: string; inspection_name: string }>;
  contractors: Array<{ user_id: string; user_name: string }>;
  cells: TimesheetGridCell[];
}
```

**File: `apps/web-client/src/services/api/timesheets.ts`**

Add function `groupIntoGrid(entries: Timesheet[]): TimesheetGridData` that:
1. Collects unique contractors (`{ user_id, user_name }`) sorted by name
2. Collects unique inspections (`{ inspection_id, inspection_name }`) sorted by name — entries without `inspection_id` go under `"__none__"` with label `"Other"`
3. Groups entries by `(user_id, inspection_id)` key into `TimesheetGridCell` with computed `total_hours` and `status`
4. Returns `TimesheetGridData`

Remove `groupIntoWeeks`, `getMonday`, `getSunday`, `toISODate` — no longer needed.

**File: `apps/web-client/src/services/api/timesheets.ts`**

Update `getTimesheetGroups` return type from `Promise<TimesheetGroup[]>` to `Promise<TimesheetGridData>`.

### Task 2 — Update TimesheetReviewPage to render grid

**File: `apps/web-client/src/pages/reviewer/TimesheetReviewPage.tsx`**

Replace the card-based expand/collapse UI with an HTML table:

- **Header row**: empty corner cell + one `<th>` per contractor (name)
- **Body rows**: one `<tr>` per inspection
  - First cell: inspection name (bold)
  - Remaining cells: one per contractor showing the cell summary or "—"
  - Each cell is clickable → navigates to detail subpage with `{ state }`
- **Cell content**: `{total_hours}h ({entryCount})` with colored status indicator
  - All Approved → green dot
  - All Submitted → blue dot  
  - Mixed → yellow dot
  - Has Rejected → red dot
- **Filter bar**: preserve status filter
- **Search bar**: filter by contractor name OR inspection name
- Remove `useSearchSort` (replaced by the grid structure)
- Remove `useClientScope` import if unused
- Remove `setExpanded`, `toggleExpand`, `actionTarget`, `ApproveRejectModal` from this page

### Task 3 — Create TimesheetReviewDetailPage

**File: `apps/web-client/src/pages/reviewer/TimesheetReviewDetailPage.tsx`** (new)

Reads entries from `useLocation().state`, validates presence, renders:

- **Header**: "Back" button, contractor name, inspection name, total hours, entry count
- **Action bar**: "Approve All" / "Reject All" buttons (only when there are Submitted entries)
- **Table**: date, work type, hours, status, description, action column
  - Action column: "Approve" / "Reject" buttons per row (only for Submitted entries)
- **Modal**: reuse existing `ApproveRejectModal` for bulk actions
- **Inline actions**: call `approveTimesheet(id, name)` / `rejectTimesheet(id, reason)` individually
- **State after action**: invalidate query cache, show success toast or update local state

### Task 4 — Wire up routes

**File: `apps/web-client/src/routes.tsx`**

Add child route under the existing `timesheets/review` guard:
```tsx
<Route path="timesheets/review" element={<FeatureFlagGuard flagId="timesheets" />}>
  <Route index element={<TimesheetReviewPage />} />
  <Route path="detail" element={<TimesheetReviewDetailPage />} />
</Route>
```

### Task 5 — Clean up

- Remove unused `TimesheetGroup` type if no longer referenced (check all callers)
- Remove unused imports from `TimesheetReviewPage.tsx`
- Remove `ApproveRejectModal` import from `TimesheetReviewPage` if no longer used there

## Files Changed

| File | Change Type |
|---|---|
| `apps/web-client/src/types/index.ts` | Add `TimesheetGridCell`, `TimesheetGridData` |
| `apps/web-client/src/services/api/timesheets.ts` | Replace `groupIntoWeeks` with `groupIntoGrid` |
| `apps/web-client/src/pages/reviewer/TimesheetReviewPage.tsx` | Rewrite to grid |
| `apps/web-client/src/pages/reviewer/TimesheetReviewDetailPage.tsx` | New file |
| `apps/web-client/src/routes.tsx` | Add detail route |

## Edge Cases

1. **Entry with no inspection_id** → grouped under "Other" with empty `inspection_name` — shown as a row
2. **Entry with no user_name** → falls back to `user_id` in display
3. **Empty dataset** → show current EmptyState ("No timesheets pending review")
4. **Cell with mixed statuses** → yellow indicator, bulk approve/reject only acts on Submitted entries
5. **Inspection shown in grid but no entries for a given contractor** → dash "—" in that cell
6. **Detail page accessed directly (no state)** → redirect back to grid or show error with link

## Validation

1. `npx tsc --noEmit --skipLibCheck` in `apps/web-client` — no new errors
2. Navigate to `/timesheets/review` — grid renders with inspection rows and contractor columns
3. Empty state shown when no data
4. Click a cell → navigates to detail page with correct entries
5. Approve All / Reject All works on detail page
6. Individual approve/reject works on detail page
7. Search/filter works on the grid
8. Status filter works on the grid