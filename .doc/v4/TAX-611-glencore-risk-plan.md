# TAX-611 — Glencore Risk Matrix (sole model, no coexistence)

## What we are building

Replace StructApp's current 3D risk model (severity × probability × consequences → rawScore → P1-P5) with the Glencore 2D grid (consequence severity × likelihood → fixed 5×5 lookup → risk rank/rating). P1-P5 becomes a direct inspector dropdown input rather than a derived value. No per-client config, no backward-compatibility layer — the system is not live yet.

## Decisions made

- **No `clients.risk_method` column** — single model, no dispatch needed
- **P1-P5 is a direct inspector input** (required dropdown), not derived from the grid
- **Grid produces risk rank (1-25) + risk rating (High/Medium/Low)** as supplementary context stored on the deficiency record
- **`calculatePriorityTier` is deleted** — replaced by `calculateGlencoreRisk` returning `{ riskRank, riskRating }`
- **Mock `calculateRiskPreview` in `useLocalState.ts` is deleted** — frontend uses the real grid
- **Sync contract inputs change** — `severity`, `probability`, `consequences` replaced by `consequenceSeverity` (1-5) + `likelihood` (A-E) + `priorityRating` (P1-P5)
- **P1 notification hook unchanged** — it checks `calculated_priority` column which is now directly inputted, not derived

## How to build it

1. **Replace** `riskCalculator.ts` (server + client) — delete 3D function, add `calculateGlencoreRisk` with the fixed 5×5 grid + rank-to-rating mapping
2. **Delete** `calculateRiskPreview` from `lib/useLocalState.ts` — frontend uses the real calculator directly
3. **Change** `deficiencySyncSchema` — replace `severity`/`probability`/`consequences` with `consequenceSeverity` (z.number().int().min(1).max(5)) + `likelihood` (z.enum(['A','B','C','D','E'])) + `priorityRating` (z.enum(['P1','P2','P3','P4','P5']))
4. **Change** `processSyncPush` — validate against new schema, call Glencore calculator, store `risk_rank`, `risk_rating`, and write `priorityRating` directly to `calculated_priority`
5. **Change** sync pull — remove `component_types` from response (replaced by taxonomy), add nothing extra for risk
6. **Update** frontend `PendingDeficiencyPayload` and `DeficiencyRecord` Dexie type — replace old fields, add new ones
7. **Update** `DeficiencyDetailPage` — replace 3 number inputs with 2 slider-selectors (consequence severity 1-5, likelihood A-E dropdown) + priority dropdown; wire live Glencore risk preview
8. **Update** `InspectionSubmitPage` — ensure P1/P2 photo validation (TAX-608/609) still works since `calculated_priority` still holds P1-P5

## Tests

- **Server**: Glencore grid tests — all 25 cells correct, rank thresholds (≥17 High, ≥7 Medium), boundary values
- **Client**: Vitest — grid matches server, deficiency page renders correct inputs for Glencore mode
- **Sync**: contract validation passes new fields, rejects old fields, `processSyncPush` stores correctly

**Dependency**: TAX-604 must be complete (provides `consequence_severity`, `likelihood`, `risk_rank`, `risk_rating` columns on `deficiency_records`, plus `priority_rating` which maps to the existing `calculated_priority`)

**Priority**: High