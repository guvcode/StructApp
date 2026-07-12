# Memory — Asset Library Taxonomy Template (BL-034)

Last updated: 2026-07-11T14:53:00-06:00

## What was built

Full WTP Asset Library taxonomy seeding and template linking for new clients:

- **Migration** (`apps/api-server/migrations/1700000020000_create_structure_taxonomy_templates.ts`): Created `structure_taxonomy_templates` linking table (`client_id`, `structure_type_id`, `taxonomy_node_id`) with RLS, unique constraint, and indexes.
- **XLSX seed data** (`apps/api-server/migrations/data/asset-library-seed.json`): Parsed from `.doc/groupings/WTP_Structural_Integrity_Asset_Library_V1.xlsx` — 4 categories, 46 components, 101 sub-components, 104 focus areas.
- **Client onboarding** (`apps/api-server/src/services/clientOnboarding.ts`): Added `seedAssetLibrary()` that inserts structure_types, deficiency_taxonomy nodes, and template links in a single transaction with `ON CONFLICT` idempotency.
- **Template API** (`apps/api-server/src/services/structureTemplates.ts`, `apps/api-server/src/routes/structureTemplates.ts`): `GET /api/v1/structure-taxonomy-templates?structure_type_id=:id` returns templates + recursive ancestor chains.
- **Frontend pinning** (`apps/web-client/src/pages/mobile/DeficiencyDetailPage.tsx`): Fetches templates for the structure's type, groups component options into "Suggested for this asset type" (pinned) and "Other components" via `<optgroup>`.
- **Tests** (`apps/api-server/tests/structureTemplates.test.ts`): 3 tests covering template list, empty result, ancestor chain. Migration test extended for table structure/RLS/constraint.

## Decisions made

- Linking at `component` level: each structure_type maps to component-level taxonomy nodes. All descendants (sub_component, focus_area) inherit implicitly.
- Pinned nodes displayed via `<optgroup>` in the component dropdown (most impactful level). Sub-component and below are implicitly pinned by parent selection.
- Separate API endpoint rather than modifying the existing taxonomy endpoint — cleaner, no impact on existing callers.
- Optional template fetching — query gracefully handles missing `structure_type_id` or empty results.

## Problems solved

- XLSX parsing: all 4 columns filled on every row (not merged cells). Category/component boundaries detected by value changes rather than empty cells.
- Parent-child FK resolution: `INSERT ... RETURNING node_id` captures parent IDs for chained inserts, with fallback `SELECT` for the `ON CONFLICT DO NOTHING` case.
- `category` column correctly set to top-level category label for all descendant nodes.

## Current state

- BL-034 committed to `task/asset-library-taxonomy-template` (2 commits)
- All existing taxonomy/picklist tests pass (13 tests)
- New template service tests pass (3 tests)
- TypeScript compiles clean (no real errors — only pre-existing TS6059 rootDir warnings)
- No regressions detected

## Next session starts with

- Backlog: BL-006 through BL-033 (test fixes, features) in progress tracker
- The `seedDefaultPicklists` and `seedAssetLibrary` functions in `clientOnboarding.ts` need to be wired into the client registration flow (a separate task)
- The "Import Asset Library" button on the Taxonomy page (Step 7) is deferred to a future task

## Open questions

- When client registration flow is built, `seedAssetLibrary` should be called after `seedDefaultPicklists` for new clients
- Existing clients with the 4 stub categories should get a per-client "Import Asset Library" button (future)