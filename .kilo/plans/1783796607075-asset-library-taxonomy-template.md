# Implementation Plan — Asset Library Taxonomy Template (Option B)

## What we are building

Seed the `deficiency_taxonomy` with the full WTP Asset Library (~105 nodes) for new clients, and create a linking table (`structure_taxonomy_templates`) that maps a `structure_type` to relevant `deficiency_taxonomy` paths at the `component` level. When an inspector opens the Evaluation Form for a structure, taxonomy nodes relevant to that structure's type are promoted as suggested defaults, while the full tree remains accessible for edge cases not covered by the library.

## Language we agreed on

- **Asset Category (XLSX)** → `deficiency_taxonomy` level `category` — e.g., "Process Equipment", "Structural Support"
- **Equipment Type (XLSX)** → `deficiency_taxonomy` level `component` — e.g., "Lime Silo & Slaking System", "Influent Screen / Bar Rack"
- **Component (XLSX)** → `deficiency_taxonomy` level `sub_component` — e.g., "Tank Shell", "Screen Assembly"
- **Subcomponent (XLSX)** → `deficiency_taxonomy` level `focus_area` — e.g., "Bar Rack/Mesh Panel", "Guide Rails/Frame"
- **Deficiency Category / Detailed Description** → filled during inspection (not seeded)
- **Structure Type** → the `structure_types` picklist entry selected when creating a structure

## Decisions made

1. **Linking granularity**: Link at the `component` level (Equipment Type). Each `structure_type` maps to zero or more `component`-level taxonomy nodes. All child nodes under that component are included automatically.
2. **Evaluation Form behavior**: Suggested defaults (Option B). The full taxonomy tree remains accessible; template-relevant nodes are promoted/pinned at the top of each picker. The inspector can browse outside the template for the ~5% of deficiencies not covered.
3. **Existing clients**: New clients only (Option A). The taxonomy seed migration already inserts 4 stub categories for all clients. New clients get the full XLSX tree via `clientOnboarding.ts`. A future per-client "Import Asset Library" button on the Taxonomy page can backfill existing clients.
4. **4-tier → 6-tier mapping**: The XLSX's 4 tiers map to `category` → `component` → `sub_component` → `focus_area`. The remaining taxonomy levels (`deficiency_category`, `detailed_description`) are filled during inspection by the engineer.

## Assumptions

- The `structure_types` picklist will be seeded from the XLSX Equipment Type names (e.g., "Lime Silo & Slaking System" becomes a `structure_type` entry per client)
- The `deficiency_taxonomy` table already exists and has the correct schema (confirmed: migration `1700000007000_create_deficiency_taxonomy.ts`)
- The `structure_types` table already exists (confirmed: migration `1700000010000_create_structure_types.ts`)
- The `structure_type` field on `structures` is a VARCHAR storing the picklist name (not a FK) — this is fine for the template lookup; we match by name
- The existing taxonomy seed migration (`1700000009000_seed_taxonomy_data.ts`) inserts 4 stub categories per client — this is left in place for existing clients; new clients get the full XLSX tree via `clientOnboarding.ts`

## How to build it

### Step 1: Create the linking table

Create migration `1700000017000_create_structure_taxonomy_templates.ts`:

```sql
CREATE TABLE structure_taxonomy_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    structure_type_id UUID NOT NULL REFERENCES structure_types(structure_type_id) ON DELETE CASCADE,
    taxonomy_node_id UUID NOT NULL REFERENCES deficiency_taxonomy(node_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_type_node UNIQUE (structure_type_id, taxonomy_node_id)
);
```

Add RLS policy, tenant trigger, timestamp trigger, and indexes (same pattern as `component_types`).

### Step 2: Create the XLSX seed data as a JSON file

Create `apps/api-server/migrations/data/asset-library-seed.json` — a JSON array of all taxonomy paths from the XLSX, structured as:

```json
[
  {
    "category": "Process Equipment (Mechanical)",
    "component": "Influent Screen / Bar Rack",
    "sub_components": [
      {
        "name": "Screen Assembly",
        "focus_areas": ["Bar Rack / Mesh Panel", "Guide Rails / Frame", "Support Structure / Anchor Bolts / Base"]
      },
      ...
    ]
  },
  ...
]
```

### Step 3: Create the seed migration

Create migration `1700000018000_seed_structure_types_and_taxonomy_from_xlsx.ts` (can be a no-op migration and instead seed via `clientOnboarding.ts` — see Step 4).

### Step 4: Update `clientOnboarding.ts`

Extend `seedDefaultPicklists` to:

1. Insert all `structure_types` from the XLSX Equipment Type names
2. Insert all `deficiency_taxonomy` nodes from the XLSX (4 categories, ~27 components, 100+ sub_components, 100+ focus_areas)
3. Insert `structure_taxonomy_templates` rows linking each `structure_type` to its relevant `component`-level taxonomy node

### Step 5: Add server-side API endpoint

Create `GET /api/v1/structure-taxonomy-templates?structure_type_id=:id` that returns all taxonomy node IDs (and their ancestors) linked to a given structure type. Add a corresponding service function in `apps/api-server/src/services/taxonomy.ts` or a new file.

### Step 6: Update the Evaluation Form frontend

In the Structural Evaluation Form (`/inspections/:id/evaluate` route):

1. Fetch the structure's `type` from the inspection's structure
2. Look up `structure_type_id` by matching the type name to the `structure_types` picklist
3. Fetch the template nodes via `GET /api/v1/structure-taxonomy-templates?structure_type_id=:id`
4. When rendering each taxonomy picker (category, component, sub_component, focus_area, deficiency_category, detailed_description), **pin the template-relevant options at the top** with a visual indicator (e.g., "Common for this asset type" section header)
5. Below the pinned section, show the remaining taxonomy options in the normal order
6. The inspector can still pick any option from either section

### Step 7: Add "Import Asset Library" button to the Taxonomy page (future — out of scope for this task)

### Step 8: Write tests

- Migration test: verify `structure_taxonomy_templates` table is created with correct schema
- Seed test: verify `clientOnboarding.ts` inserts the expected number of taxonomy nodes and templates for a new client
- API test: `GET /api/v1/structure-taxonomy-templates` returns correct nodes for a given structure type
- Frontend test: verify Evaluation Form shows pinned template nodes at the top of each picker

## Validation

1. Run `npx jest` to confirm all existing tests pass
2. Run `npx tsc --noEmit --skipLibCheck` for clean TypeScript compilation
3. Manually verify: create a new client → structures appear with populated `structure_types` picklist → taxonomy page shows full XLSX tree → create a structure with type "Lime Silo & Slaking System" → start an inspection → Evaluation Form shows pinned nodes for that asset type at the top of each picker