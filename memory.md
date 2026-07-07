# Memory — OFFLINE-PIN-001 Offline PIN Login

Last updated: 2026-07-07T15:08:00-06:00

## What was built

**Offline PIN login system** for mobile PWA — completed PWA-208:

- **Backend** (`apps/api-server/src/routes/auth.ts`): POST/GET/DELETE `/auth/pin` — self-service PIN management. SHA-256 from client re-hashed with argon2 before storing.
- **Dexie** (`apps/web-client/src/lib/db.ts`): v1→v2 upgrade; `AuthState` gains `pinHash` and `userData` fields. Upgrade preserves all existing data.
- **Hook** (`apps/web-client/src/hooks/usePinAuth.ts`): SHA-256 via Web Crypto API, 5-attempt lockout (30s), session caching via `setSession()` stored in Dexie `userData`.
- **PinSetupPage** (`apps/web-client/src/pages/auth/PinSetupPage.tsx`): 4-6 digit PIN entry with numeric keypad, confirm flow, skip button.
- **LoginPage** (`apps/web-client/src/pages/auth/LoginPage.tsx`): offline detection (`navigator.onLine`), PIN entry UI with lockout countdown, email/password fallback when online.
- **RouteGuard** (`apps/web-client/src/components/RouteGuard.tsx`): `/m/setup-pin` as public route; one-time PIN setup prompt after online login (sessionStorage flag).
- **SettingsPage** (`apps/web-client/src/pages/mobile/SettingsPage.tsx`): PIN status row between install and logout — shows enabled/off status, links to `/m/setup-pin`.
- **API** (`apps/web-client/src/services/api/auth.ts`, `endpoints.ts`): `syncPinToServer()`, `checkServerPin()`, `clearServerPin()`.

## Decisions made

- SHA-256 for local Dexie storage (fast, works offline); server re-hashes with argon2
- 5-attempt lockout tracked in localStorage (survives Dexie clears)
- Server sync is fire-and-forget (`savePinLocally` succeeds first, sync is `.catch(noop)`)
- PIN setup prompt uses sessionStorage flag set during online login, consumed by RouteGuard once per session

## Problems solved

- `exactOptionalPropertyTypes` in tsconfig required destructuring with `...rest` to clear optional fields instead of assigning `undefined`
- Dynamic imports for `authStore` functions replaced `require()` in LoginPage (ESM compatibility)
- Pre-existing TypeScript errors (GenericPicklistPage, riskCalculator, etc.) are unrelated to this feature

## Current state

- All new code compiles clean (0 new TS errors)
- No new migrations needed (PIN columns exist from v3 migration)
- Backend endpoints are wired; frontend has full PIN flow

## Next session starts with

Sprint 6 — Taxonomy & Cascading Deficiency Flow (pending in progress tracker)

## Open questions

Memory saved to memory.md.

Next session: run /remember restore to pick up from here.