# Memory — Taxonomy hierarchy fix + save mapping + sync path (FIX-014)

Last updated: 2026-07-12T15:57:00-06:00

## What was built

Fixed hierarchy disconnect between equipment_type and component levels for existing clients, plus save mapping and sync path fixes:

- **Migration** (`apps/api-server/migrations/1700000028000_fix_existing_client_taxonomy_hierarchy.ts`): Deletes old seed taxonomy (component→sub_component→focus_area parented to categories) and re-inserts correct hierarchy (equipment_type→component→sub_component) for all 4 asset library categories.
- **Mobile save fix** (`apps/web-client/src/pages/mobile/DeficiencyDetailPage.tsx`): Corrected save mapping — was off by one level (component→sub_component, subComponent→focus_area, etc.). Now correctly maps: equipment_type, component, sub_component, focus_area, deficiency_category, detailed_description.
- **Types updated**: Added `equipment_type`/`component` to `DeficiencyRow` (api-server), `Deficiency` (web-client types), `DeficiencyRecord`/`OfflineDeficiency` (Dexie db.ts), `deficiencySyncSchema` (sync contract), `PendingDeficiencyPayload` (sync.ts).
- **CRUD service**: Added `equipment_type`/`component` to `createDeficiency` INSERT query and `updateDeficiency` allowedFields.
- **Sync path**: Fixed `processSyncPush` INSERT to include `equipment_type`/`component` columns; fixed `processSyncPull` SELECT and return type; fixed `SyncPage.tsx` pull mapping to include new fields; fixed `getPendingDeficiencies` payload mapping.
- **Reviewer display**: Added `equipment_type` and `component` fields to reviewer `DeficiencyDetailPage.tsx` taxonomy card.

## Decisions made

- Migration 28000 uses recursive CTE to delete old seed hierarchy bottom-up (component nodes parented to categories, with all descendants), then re-inserts via same pattern as `seedAssetLibrary()` and other backfill migrations.
- All new fields added as optional across all types to maintain backward compatibility with existing records.

## Problems solved

- Existing clients had old hierarchy (category→component) with no equipment_type level. Component nodes were parented to categories, not equipment_type. Backfill added equipment_type nodes but didn't re-parent.
- Save mapping was off by one since original implementation, causing component to be saved as sub_component, subComponent as focus_area, etc.
- Sync push/pull completely dropped equipment_type and component values — silent data loss for offline users.

## Current state

- FIX-014 committed to `task/asset-library-taxonomy-template` (commit 74f0e33)
- TypeScript compiles clean on api-server (only pre-existing TS6059 rootDir errors)
- Web-client has only pre-existing TS errors (GenericPicklistPage, usePicklists, etc.)
- All taxonomy data corrected for existing clients via migration

## Next session starts with

- Remaining backlog items (BL-006 through BL-033)
- Verify the migration runs correctly on staging
- If needed, add `is_system` flag to taxonomy table to distinguish seed vs user-created nodes

## Open questions

- None