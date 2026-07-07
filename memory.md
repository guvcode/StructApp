# Memory — CONN-1 through CONN-6 Backend Integration

Last updated: 2026-07-05T16:37:00-06:00

## What was built

**CONN-1 — Infrastructure:**
- `services/api/apiClient.ts` — centralized fetch wrapper with Bearer token from authStore, 401 auto-refresh, unified `{ success, data, error_code }` response parsing, `ApiError` class
- `services/api/endpoints.ts` — all endpoint URL constants with factory functions
- `types/index.ts` — `BackendUserRole` enum, `mapBackendRole()`, `mapToBackendRole()` functions for role casing alignment

**CONN-2 — Auth & Users:**
- `routes/users.ts` (backend) — GET /, GET /:id, PATCH /:id, POST /:id/deactivate, /resend-invite, /revoke-invite, /reset-password, /reset-pin
- `services/users.ts` (backend) — `listUsers`, `getUserById`, `updateUser`, `replaceMemberships`, `deactivateUser`
- `services/api/auth.ts` (frontend) — login, logout, fetchSession, inviteUser, activateInvite (mirrors mockAuth functions)
- `services/api/users.ts` (frontend) — getUsers, getUser, getUsersByRole, updateUser, deactivateUser
- Updated `useUsers.ts` hooks, `LoginPage.tsx`, `ActivatePage.tsx`, `InviteUserPage.tsx`, `LogoutButton.tsx` to use API services

**CONN-3 — Register:**
- `routes/register.ts` (backend) — projects/sites/structures CRUD endpoints
- `services/register.ts` (backend) — listProjects, getProjectById, createProject, updateProject, listSites, getSiteById, createSite, updateSite, listStructures, searchStructures, getStructureById, createStructure, updateStructure
- `services/api/register.ts` (frontend) — mirrors mockRegister functions
- Updated `useRegister.ts` hooks to use API services

**CONN-4 — Inspections & Deficiencies:**
- Added GET / and GET /:id to inspections router (backend)
- Added POST /bulk-reassign to inspections router (backend)
- `services/api/inspections.ts` (frontend) — mirrors mockInspection functions
- Updated `useInspections.ts` and `useDeficiencies.ts` hooks

**CONN-5 — Remediation & Timesheets:**
- `services/api/remediation.ts` (frontend) — mirrors mockRemediation functions
- `services/api/timesheets.ts` (frontend) — mirrors mockTimesheet functions
- Updated hooks to use API services

**CONN-6 — Reports & Remaining:**
- `services/api/reports.ts` (frontend) — mirrors mockReports functions
- Updated `useReports.ts`, `useClients.ts`, `useDashboard.ts` hooks

**Tests:**
- `tests/users.test.ts` — 10 passing tests for users service
- `tests/clients.test.ts` — 10 passing tests for clients service
- `tests/register.test.ts` — 17 passing tests for register service

## Decisions made

- **API client**: Centralized `fetch` wrapper reading tokens from `authStore.getSession()`, not Dexie. 401 triggers auto-refresh via `POST /auth/refresh`, clears session on failure.
- **Role casing**: Frontend keeps lowercase `UserRole`; backend uses PascalCase `BackendUserRole`. `mapBackendRole()`/`mapToBackendRole()` translate between them.
- **Service layer**: Backend SQL logic extracted into `services/users.ts`, `services/clients.ts`, `services/register.ts` (following pattern from existing `services/auth.ts`). Routes delegate to services.
- **Mock replacement**: `services/api/` directory mirrors mock service function signatures; hooks switched imports from `mock*` to `api/*`.

## Current state

All CONN-1 through CONN-6 items complete and committed to `task/CONN-1-to-6-backend-integration`. 36 tests passing. Backend routes mounted at `/api/v1/users`, `/api/v1/clients`, `/api/v1/projects`, `/api/v1/sites`, `/api/v1/structures`. Frontend hooks now call real API endpoints.

## Next session starts with

4 remaining hooks still using mock services directly: `useCalendar`, `useSync`, `useAuditLogs`, `useImports` — need API service files created for these.

Or: start Sprint 6 TAX items or address pre-existing test fixes (BL-006 through BL-019).

## Open questions

None.