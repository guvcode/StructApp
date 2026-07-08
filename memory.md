# Memory — MOB-701 to MOB-707 Client-Scoped Inspections + Offline Cache

Last updated: 2026-07-08T08:15:00-06:00

## What was built

**Client-scoped contractor experience** — contractors see only clients with assigned inspections; offline cache of last 20 inspections per client + deficiencies in Dexie; readable dashboard cards.

### API changes (`apps/api-server/`)
- **`routes/clients.ts`**: New `GET /clients/with-assigned-inspections` — returns distinct clients where `inspections.inspector_id = $1`
- **`routes/inspections.ts`**: Accept optional `client_id` query param, adds `AND i.client_id = $N` to WHERE clause
- **`services/sync.ts`**: `processSyncPull` now returns `inspections` (last 20 by `created_at DESC`) and `deficiencies` (all for those inspections)

### Frontend changes (`apps/web-client/`)
- **`lib/db.ts`**: Dexie v3 — adds `offlineInspections`, `offlineDeficiencies`, `offlineTaxonomy` tables
- **`lib/queryClientErrorHandler.ts`**: Throttle 403 toasts (10s dedup), suppress background poll errors (`sync:*` keys), pass `queryKey` to Sentry tags
- **`lib/queryClient.ts`**: Pass `query.queryKey` / `mutation.options.mutationKey` to error handler
- **`hooks/useInspections.ts`**: `useInspectionsByAssignee` accepts optional `clientId` param
- **`services/api/inspections.ts`**: `getInspectionsByAssignee` passes `client_id` as query param
- **`services/api/endpoints.ts`**: Add `clients.withAssignedInspections` URL
- **`pages/auth/ClientPickerPage.tsx`**: Contractors call `/clients/with-assigned-inspections`; loading/error states added
- **`pages/mobile/DashboardPage.tsx`**: Scoped by `activeClientId`; cards show client name, site name, structure ID, status; offline fallback reads from Dexie
- **`pages/mobile/SyncPage.tsx`**: Pull handler persists inspections, deficiencies (all taxonomy/risk fields mapped), taxonomy to Dexie; null-safe `lastSync` display
- **`components/RouteGuard.tsx`**, **`pages/auth/LoginPage.tsx`**, **`pages/mobile/InspectionSubmitPage.tsx`**: Wrap localStorage/sessionStorage in try/catch

## Decisions made

- Client scoping via query param (not JWT refresh) — `active_client_id` is local-only; no round-trip on switch
- Sync pull extended (not a new endpoint) — existing `POST /sync/pull-package` now returns inspections + deficiencies
- Offline cache uses Dexie v3 upgrade — preserves existing v1/v2 data
- Dashboard reads from API when online, Dexie when offline (`navigator.onLine` toggle)
- Deficiency taxonomy/risk fields mapped to `OfflineDeficiency` type with all v4 columns preserved

## Problems solved

- Parallel 403 toasts caused by `useSyncState` polling + multiple queries on Dashboard — fixed by 10s throttle and background poll suppression
- Safari private browsing crashes on unprotected `localStorage.getItem` — wrapped in try/catch
- Dashboard showed bare UUIDs (site_id, client_id) — now resolves to names via lookup queries and offline Dexie data

## Current state

- All changes committed on branch `task/CLIENT-003-client-scoped-inspections`
- All new code compiles clean (0 new TS errors from changed files)
- Pre-existing TS errors in GenericPicklistPage, riskCalculator, etc. are unchanged
- 20 of 27 test suites pass; 7 failing suites are pre-existing (DB connection, TS compilation in unrelated files, removed exports)
- Progress tracker updated: Sprint 6 counter shows 27 total / 27 completed

## Next session starts with

Sprint 6 — remaining taxonomy work or the next feature from the progress tracker.

## Open questions

None.