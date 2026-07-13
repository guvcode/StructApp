# Memory — Cascading Ancestor Dropdowns for Taxonomy Management (TAX-621)

Last updated: 2026-07-12T20:42:00-06:00

## What was built

- **TaxonomyLevelPage.tsx** — Replaced single immediate-parent `<select>` with cascading ancestor dropdowns. All ancestor levels appear at once (e.g., managing Sub-Components shows Category → Equipment Type → Component dropdowns). Child selections auto-reset when a parent changes. Entries only render when the immediate parent is selected.
- **Test** (`apps/web-client/tests/taxonomy-cascading-dropdowns.test.tsx`) — 5 tests covering: root level (no ancestors), deep level shows all ancestors, cascading filtering, entries gated by immediate parent, parent change resets children.

## Decisions made

- All ancestors shown at once (not progressive reveal) — user sees the full path
- No path labels on entries — dropdowns provide context
- Frontend-only to TaxonomyLevelPage.tsx — no backend change
- Uses `selectedAncestors: Record<string, string>` instead of `selectedParent: string`

## Current state

- Committed to `task/cascading-taxonomy-dropdowns` (967f8d4)
- All 5 new tests pass
- 7 existing callers unchanged (same `level` prop interface)
- TS compiles clean (only pre-existing errors in other files)
- `.doc/10-progress-tracker.md` updated with TAX-621 entry

## Next session starts with

- Remaining backlog items (BL-006 through BL-033, BL-004)
- Or verify taxonomy management UI renders correctly in a browser

## Open questions

- None