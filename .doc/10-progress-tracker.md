# 10. High-Fidelity Engineering Progress Tracker

## 10.0 Current Status

**Phase:** Backend integration complete (CONN-1 through CONN-6 done), BL-001 completed
**Last completed:** BL-001 — Structure Types picklist (migration, service, routes, frontend page, StructureListPage dropdown)
**Next:** Sprint 6 — Taxonomy & Cascading Deficiency Flow

### Sprint status counters

| Sprint | Rows | Not Started | In Progress | Completed | Blocked |
|---|---|---|---|---|---|
| 0 | 1 | 0 | 0 | 1 | 0 |
| 1 | 6 | 0 | 0 | 6 | 0 |
| 2 | 3 | 0 | 0 | 3 | 0 |
| 3 | 6 | 2 | 1 | 4 | 0 |
| 4 | 2 | 2 | 0 | 0 | 0 |
| 5 | 34 | 0 | 0 | 34 | 0 |
| 6 | 30 | 0 | 0 | 30 | 0 |
| B1 | 7 | 0 | 0 | 7 | 0 |
| B2 | 10 | 0 | 0 | 10 | 0 |
| cross | 5 | 3 | 0 | 2 | 0 |

## 10.1 Core Data and Security Track (v2)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| ST-101 | Run migrations, verify triggers | 0 | 🟩 COMPLETED | None |
| ST-102 | RLS session-context middleware | 1 | 🟩 COMPLETED | ST-101 |
| ST-103 | JWT auth + refresh + invite router | 1 | 🟩 COMPLETED | None |
| ST-104 | Per-table audit trigger cloning (v2 baseline) | 1 | 🟩 COMPLETED | ST-101 |
| ST-105 | `client_memberships` enforcement + switch-client (v2 baseline, Admin-only) | 1 | 🟩 COMPLETED | ST-102 |
| ST-106 | `POST /auth/forgot-password` + `POST /auth/reset-password` (added during v3 review) | 1 | 🟩 COMPLETED | ST-103 |
| ST-107 | `password_reset_tokens` table + migration + Resend wiring | 1 | 🟩 COMPLETED | ST-103 |

## 10.2 Offline and Frontend PWA Track (v2)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| PWA-201 | Tailwind spacing tokens | 1 | 🟩 COMPLETED | None |
| PWA-202 | Dexie schema incl. `authState` | 2 | 🟩 COMPLETED | None |
| PWA-203 | EXIF capture & buffer extraction | 3 | 🟩 COMPLETED | PWA-202 |
| PWA-204 | `ConnectivityBanner` hook | 3 | 🟩 COMPLETED | None |
| PWA-205 | Workbox service worker | 4 | 🟩 COMPLETED | UI freeze |
| PWA-206 | Token refresh-on-sync flow (ADR-010) | 3 | 🟩 COMPLETED | ST-103 |
| PWA-207 | `<QrScanButton>` component | 2 | 🟩 COMPLETED | None |
| PWA-208 | Offline PIN login (SHA-256 local verify, server argon2 sync) | 5 | 🟩 COMPLETED | PWA-202 |

## 10.3 Integration & Business Logic Track (v2)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| INT-301 | CSV staging + validation service | 2 | 🟩 COMPLETED | ST-101 |
| INT-302 | Atomic sync handler | 3 | 🟩 COMPLETED | PWA-202, ST-102 |
| INT-303 | Cloudinary streaming pipeline | 3 | 🟩 COMPLETED | Cloudinary account |
| INT-304 | PDF (PDFKit) / Word (docx) / Excel (exceljs) report jobs (ADR-007) | 4 | 🟩 COMPLETED | INT-302 |
| INT-305 | Shared `riskCalculator.ts` wired client + server | 3 | 🟩 COMPLETED ⚠️ SUPERSEDED by TAX-611 (algorithm replaced by Glencore grid) | None |
| INT-306 | Notification service (Resend/MessageBird, ADR-008) | 3 | 🟩 COMPLETED | Provider accounts |
| INT-307 | Inspection approve/return endpoints | 4 | 🟩 COMPLETED | ST-104 |
| INT-308 | P1 after-commit hook (FR-4.2) — Resend email + MessageBird SMS via `notifyP1Deficiency` | 3 | 🟩 COMPLETED | INT-306 |

## 10.4 v3 Sprint 5 Tracks (Scheduling, Remediation, Picklists, Admin Controls, Edit Operations, Capture Mode, Pre-Inspection Flag, Reassign Flows, Error Stack)

### 10.4.a Scheduling & Calendar (SCH)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| SCH-401 | `inspection_schedules` table + idempotent generator job (FR-10) | 5 | 🟩 COMPLETED | ST-101 |
| SCH-402 | `<InspectionCalendarView>` + reschedule/reassign endpoint (FR-10.3) | 5 | 🟩 COMPLETED | SCH-401 |

### 10.4.b Remediation Lifecycle (REM)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| REM-403 | `remediation_status` lifecycle + verify-closure guard (FR-8) | 5 | 🟩 COMPLETED | INT-303 (photo purpose tagging) |
| REM-404 | `PATCH /photos/:id` + `POST /deficiencies/:id/verify-closure` endpoints for photo purpose toggling and deficiency verification | 5 | 🟩 COMPLETED | ST-101 |

### 10.4.c Managed Picklists (PCK)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| PCK-404 | `component_types` / `work_types` tables + seeding + backfill migration (FR-11) | 5 | 🟩 COMPLETED ⚠️ `component_types` SUPERSEDED by TAX-601 (flat table → hierarchical taxonomy) | ST-101 |
| PCK-405 | PWA `<PicklistManager>` screens under Admin/Reviewer settings (FR-11) | 5 | 🟩 COMPLETED ⚠️ Component types picklist screens SUPERSEDED by TAX-602 (taxonomy CRUD); work types screens unaffected | PCK-404 |

### 10.4.d Admin Controls (ADM)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| ADM-405 | `/inspections/:id/reopen` + `requireAdmin` middleware (FR-9) | 5 | 🟩 COMPLETED | ST-104 (audit triggers) |
| ADM-406 | `/audit-logs` Admin-and-Reviewer endpoint + UI (FR-9.3, post-amendment) | 5 | 🟩 COMPLETED | ADM-405 |
| ADM-407 | `PATCH /inspections/:id/inspection-mode` Admin override endpoint, blocked once any deficiency exists (FR-16.5) | 5 | 🟩 COMPLETED | MOD-417 |

### 10.4.e Submission & Notification Expansion (SUB / NOT)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| SUB-407 | `/inspections/:id/submit` (FR-13) | 5 | 🟩 COMPLETED | None |
| NOT-408 | Assignment / submission / return notification call sites (FR-12.1) | 5 | 🟩 COMPLETED | INT-306 |
| NOT-409 | `notifyInspectionReassigned` to previous inspector, body excludes new inspector's name, includes `reason` (FR-18.2) | 5 | 🟩 COMPLETED | INT-306 |
| NOT-410 | `notifyBulkReassignSummary` to source + target on `POST /inspections/bulk-reassign` (FR-18.3) | 5 | 🟩 COMPLETED | INT-306 |

### 10.4.f PIN Fallback (PIN) — FR-14

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| PIN-409 | `src/services/pin.ts` — Argon2id `hashPin` / `verifyPin` with pinned params (timeCost 3 / memoryCost 65536 / parallelism 4); columns already in v3 migration | 5 | 🟩 COMPLETED | ST-103 |
| PIN-410 | `POST /auth/pin-fallback` + `423 LOCKED_PIN_FALLBACK_ACTIVE` middleware + 5-attempt / 1-hour lockout (`429 PIN_LOCKED_OUT`) | 5 | 🟩 COMPLETED | PIN-409 |
| PIN-411 | PWA PIN entry UI + `pin_outbox` Dexie table + sync recovery on real-password login | 5 | 🟩 COMPLETED | PIN-410 |
| PIN-412 | `PATCH /users/:id/reset-pin` (Admin) + `must_set_pin` re-setup flow | 5 | 🟩 COMPLETED | PIN-409 |
| PIN-413 | `pin_fallback_tokens` table + recovery audit row on `consumed_by_real_password_login` | 5 | 🟩 COMPLETED | PIN-410 |

### 10.4.g Edit Operations (EDT) — FR-15

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| EDT-413 | FR-15 action-endpoint models: users, clients, projects, sites, structures, inspections, deficiencies, photos, timesheets | 5 | 🟩 COMPLETED | None |
| EDT-414 | `auditEdit` helper + critical/cosmetic audit-log rules (FR-15.5) | 5 | 🟩 COMPLETED | EDT-413 |
| EDT-415 | PWA inline edit forms (no modals except for irreversible actions) | 5 | 🟩 COMPLETED | EDT-413 |
| EDT-416 | `POST /users/:id/resend-invite` + `/revoke-invite` + `/reset-password` (Admin) | 5 | 🟩 COMPLETED | EDT-413 |
| EDT-417 | `PATCH /deficiencies/:id/component-notes` (cosmetic, FR-15.3) | 5 | 🟩 COMPLETED | EDT-413 |
| EDT-418 | `DELETE /photos/:id` soft-delete (sets `deleted_at`) | 5 | 🟩 COMPLETED | EDT-413 |
| EDT-419 | `PATCH /inspections/:id/reassign` adds `reason` field (FR-18.2) | 5 | 🟩 COMPLETED | EDT-413 |

### 10.4.h Capture Mode (MOD) — FR-16

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| MOD-417 | FR-16 inspection mode picker (PWA + Admin override) + `inspections.inspection_mode` column + `inspection_mode_enum` | 5 | 🟩 COMPLETED | EDT-413 |
| MOD-418 | FR-16 Geolocation API gating — PWA must NOT call `navigator.geolocation` in `post_inspection` mode | 5 | 🟩 COMPLETED | MOD-417 |
| MOD-419 | FR-16 server-side validation — `POST /sync/push-outbox` accepts deficiencies in either mode, no GPS requirement enforced by mode | 5 | 🟩 COMPLETED | MOD-417 |

### 10.4.i Pre-Inspection Timesheet Flag (TSM) — FR-17

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| TSM-419 | FR-17 `timesheet_entries.entry_date` + `pre_inspection` derivation (server compares to `scheduled_date` or `assigned_at`) + yellow left-border rendering | 5 | 🟩 COMPLETED | None |
| TSM-420 | `timesheet_entries` backfill migration: existing rows get `entry_date = created_at::date` | 5 | 🟩 COMPLETED | TSM-419 |

### 10.4.j Reassignment (REA) — FR-18

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| REA-420 | FR-18.2 `notifyInspectionReassigned` (to old inspector, no new name) + `reason` field on `PATCH /inspections/:id/reassign` | 5 | 🟩 COMPLETED | None |
| REA-421 | FR-18.3 `POST /inspections/bulk-reassign` (cap 100, atomic, audit per row, summary notifications) | 5 | 🟩 COMPLETED | REA-420 |
| REA-422 | FR-18.5 Bulk-reassign dialogs on Calendar (User management deferred) | 5 | 🟩 COMPLETED | REA-421 |

## 10.5 Error Stack (v3 Sprint 5 / cross-cutting) — Sentry + `system_job_errors`

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| ERR-501 | `system_job_errors` table (retry-exhausted jobs + client errors, Admin/Reviewer viewable) | 5 | 🟩 COMPLETED | None |
| ERR-502 | `POST /client-errors` endpoint (rate-limited per user 10/hr, per IP 100/hr) | 5 | 🟩 COMPLETED | ERR-501 |
| ERR-503 | `@sentry/react` setup with `beforeSend` PII scrubber (email, phone E.164, JWT, GPS) | 5 | 🟩 COMPLETED | None |
| ERR-504 | Shared `queryClient` + `QueryErrorBoundary` + global `QueryClient` error handler | 5 | 🟩 COMPLETED | ERR-503 |
| ERR-505 | Pino log shipper configuration (Datadog Agent / Fluent Bit / Loki Promtail — pin choice at deploy) | 5 | 🟩 COMPLETED | None |

## 10.6 Cross-cutting (TanStack Query rule + responsive-UI / single-URL refactor)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| XCQ-601 | TanStack Query — shared `queryClient` with project defaults (staleTime 30s, gcTime 5m, retry 2, refetchOnWindowFocus for inspection/deficiency data) | 5 | 🟩 COMPLETED | None |
| XCQ-602 | TanStack Query — `useMutation` with `queryClient.invalidateQueries` on success; `useEffect` ban for fetching enforced via code review | 5 | 🟩 COMPLETED | XCQ-601 |
| URL-603 | Single-URL / responsive-UI / one-issuer refactor: directory rename, Mermaid diagram update, JWT `iss: 'structapp-app'` / `aud: 'structapp-api'` | 5 | 🟩 COMPLETED | None |

*Status Key: ⬜ Not Started | 🟨 In Progress | 🟩 Completed | 🟥 Blocked*

## 10.7 UI Build Plan — Bundle Track

| Bundle ID | Component | Tasks | Status | Dependency |
|---|---|---|---|---|
| B1 | Project Foundation, Types, Mock Data | 7 | 🟩 COMPLETED | None |
| B2 | Routing, Layout Shells, Menus, Guards | 10 | 🟩 COMPLETED | B1 |
| B3 | Authentication and Session UX | 7 | 🟩 COMPLETED | B2 |
| B4 | Admin Setup | 8 | 🟩 COMPLETED | B3 |
| B5 | Register Management | 8 | 🟩 COMPLETED | B4 |
| B6 | Contractor Mobile Field Workflow | 12 | 🟩 COMPLETED | B5 |
| B7 | Reviewer Inspection Workflow | 8 | 🟩 COMPLETED | B6 |
| B8 | Admin Reopen and Governance Controls | 6 | 🟩 COMPLETED | B7 |
| B9 | Hardening and MVP Gate | 6 | 🟩 COMPLETED | B8 |
| B10 | Remediation | 6 | 🟩 COMPLETED | B9 |
| B11 | Timesheets | 6 | 🟩 COMPLETED | B10 |
| B12 | Reports | 6 | 🟩 COMPLETED | B11 |
| B12-merge | Reports — merge pages, mock signed URLs, Completed column, error callouts | 6 | 🟩 COMPLETED | CONN-7 |
| B13 | Design System Transformation | 16 | 🟩 COMPLETED | B12 |
| B13-picklists | Picklists — full CRUD manager pages (rename, reactivate, filter), landing page, mock service | 8 | 🟩 COMPLETED | B12-reports-merge |
| B14 | Audit Logs — viewer with mock service, filters, pagination, Admin+Reviewer access | 8 | 🟩 COMPLETED | B13-picklists |
| B15 | CSV Import Center — upload/validation/commit/discard flow with batch history | 11 | 🟩 COMPLETED | B14 |
| B16 | Calendar and Scheduling — month grid, inspector filter, day-click modal, schedules CRUD, pause toggle | 13 | 🟩 COMPLETED | B15 |

## 10.8 Backend Integration — Connect Bundle Track

| Bundle ID | Component | Tasks | Status | Dependency |
|---|---|---|---|---|
| CONN-1 | Infrastructure — `apiClient.ts`, `endpoints.ts`, role casing alignment, mount auth routes | 4 | 🟩 COMPLETED | B13 |
| CONN-2 | Auth & Users — migrate mockAuth → real API, create `routes/users.ts`, create `useAuth`/`useUser` hooks | 5 | 🟩 COMPLETED | CONN-1 |
| CONN-3 | Register — create backend routes for projects/sites/structures, TanStack Query hooks, migrate mockRegister → real API | 5 | 🟩 COMPLETED | CONN-2 |
| CONN-4 | Inspections & Deficiencies — create `useInspections` hooks, migrate modals, fix `/bulk-reassign` missing route | 6 | 🟩 COMPLETED | CONN-3 |
| CONN-5 | Remediation & Timesheets — create `useRemediation`/`useTimesheet` hooks, add missing timesheets endpoints, migrate modals | 5 | 🟩 COMPLETED | CONN-4 |
| CONN-7 | Backend column alignment — fix `assigned_to`→`inspector_id`, `return_reason`→`returned_reason`, `display_name`/`client_role`/`site_id` mismatches across inspections/clients/users/register/reports routes; add CORS middleware; add `updated_at` to structure_types | 6 | 🟩 COMPLETED | CONN-6 |
| CONN-8 | Mock data migration — replace mock services in AdminClientSwitcher, TenantContextBadge, PicklistLandingPage, ClientPickerPage, AdminDashboardPage, InspectionListPage, InspectionDetailPage (2), DeficiencyDetailPage, NewInspectionPage, ApproveInspectionModal, ReturnInspectionModal, ReopenInspectionModal, VerifyClosureModal, AuditLogViewer, StructureSearchPage, InspectionHistoryPage, TimesheetDetailPage, LoginPage, InviteUserPage, TaxonomyManagementPage, ApproveRejectModal | 8 | 🟩 COMPLETED | CONN-7 |
| CONN-10 | Deferred mobile pages — fix DeficiencyPhotosPage, RemediationUpdatePage, SyncPage, DeficiencyDetailPage to use real API instead of mock services | 4 | 🟩 COMPLETED | CONN-9 |

## 10.9 Decisions Made During Build

* **(post-v2 amendment)** ADR-007 amended: PDF generation library changed from Puppeteer to **PDFKit** — avoids shipping Chromium in the deployment image; design tokens no longer flow automatically into the PDF.
* **(post-v2 amendment)** ADR-008 amended: email provider changed from SendGrid to **Resend**; SMS provider changed from Twilio to **MessageBird**. The `NotificationProvider` interface is unchanged.
* **(v3)** ADR-011 added: recurrence is modeled as `recurrence_interval_days INT` (fixed interval), not full RRULE/iCal calendar rules. Re-evaluate in a future sprint if a real calendar-rule requirement surfaces.
* **(v3)** Client portal is out of scope. Clients receive PDF/Word/Excel deliverables via email or signed download link.
* **(v3)** Multi-inspector per inspection is out of scope. Per-asset independent assignment is sufficient.
* **(v3, post-amendment)** Reviewer role was promoted to global/cross-tenant. The audit log is now Admin-and-Reviewer allowed; Contractor tokens still receive `403`. `client_memberships` is now Contractor-only. `POST /auth/switch-client` is now Admin-and-Reviewer allowed.
* **(v3, post-amendment)** `POST /auth/switch-client` was further extended to Contractor — they can switch between clients they hold a membership for, without logging out. Server validates against `client_memberships` and returns `403 NOT_A_MEMBER` otherwise. The PWA app bar / desktop top-right surfaces only the Contractor's own memberships (defense in depth, not the primary filter).
* **(v3, post-amendment)** Photo cap raised from 5 to 20 with soft UI warning at 6. The DB trigger `enforce_max_five_photos` + `trg_enforce_max_photos` are dropped. API-layer constant `MAX_PHOTOS_PER_DEFICIENCY = 20`. Soft warning starts at 6. Amendment note in v2 §0 row 17.
* **(v3, post-amendment)** FR-3.2 "Post-Inspection Manual Entry" is replaced by FR-16. The new rule is inspector-declared `onsite` vs `post_inspection` mode at the start of every inspection; in `post_inspection` mode the PWA does not call the Geolocation API for any deficiency.
* **(v3)** FR-14 (PIN fallback) added: per-user 6-digit access PIN, set at profile setup, no expiry. After 3 failed password attempts, `/login` surfaces the PIN entry. PIN-mode token is read-only and offline-only; new data goes to `pin_outbox` and is held locally until real-password login. Argon2id hashing. Residual limitation: device must reach a network area for the PIN itself to be verified server-side.
* **(v3)** FR-17 (pre-inspection timesheet flag) added: server auto-derives `pre_inspection = true` on timesheet entries logged before the inspection date. Yellow left-border + "Logged before inspection date" tag in the UI. No other effect.
* **(v3, MOD-419)** `processSyncPush` reads `inspection_mode` (changed `SELECT 1` to `SELECT inspection_mode`) but never rejects based on GPS+mode mismatch — enforcement is purely frontend (MOD-418 hook)
* **(v3, MOD-419)** `getPendingDeficiencies()` fixed to serialize full deficiency payload (description, severity, GPS, etc.) instead of only `client_local_id`
* **(v3, MOD-419)** `structureId` added to Dexie `DeficiencyRecord` type to satisfy the sync contract requirement
* **(v3)** `jwt-decode` import fixed from default import to named import (`{ jwtDecode }`) — v4 has no default export
* **(v3)** `refreshResult.access_token` fixed to `refreshResult.data.access_token` in sync refresh flow
* **(post-amendment, post-MOD-419)** `deficiencySyncSchema` already has `gps_latitude`/`gps_longitude` as `.nullable()` — no contract change needed; `processSyncPush` already accepts null GPS in both modes
* **(v3, post-amendment)** `POST /users/:id/resend-invite` and `/revoke-invite` endpoints added (FR-15.3).
* **(v3, post-amendment)** `POST /users/:id/reset-password` admin-path endpoint added (FR-15.3). Admin sets a temporary password; user must change on next login.
* **(v3, post-amendment)** Edit-while-Approved policy: no shortcut endpoint. Reopen → edit → re-approve is the only path (FR-15.2).
* **(v3, post-amendment)** Single-URL / responsive-UI / one-issuer model: one web app at one URL, responsive layout, all roles. JWT `iss: 'structapp-app'` (was split between `structapp-field` and `structapp-desktop`). Reviewer and Admin can both call `POST /auth/switch-client`; Contractor can call it limited to their memberships.
* **(v3, post-amendment)** TanStack Query is the only data-fetching primitive for Client Components; `useEffect` for fetching is banned (04-…md §4.7a).
* **(v3, post-amendment)** Sentry captures frontend errors; pino captures backend errors; `system_job_errors` table stores retry-exhausted jobs and PWA client errors. PII policy: `user_id` UUID only (never email/phone/JWT/GPS), enforced via `beforeSend` scrubber. Backend has no third-party error reporting.

## 10.10 Notes

* Risk priority score bands (80/45/20/8) in `shared/utils/riskCalculator.ts` are a starting heuristic, not a certified engineering standard — must be validated by the structural engineering lead before production.
* Retention period for inspection records and photos is a policy decision, not an engineering one — default to "retain indefinitely, no auto-deletion" until legal/compliance signs off.
* Phone numbers and GPS coordinates are sensitive but not currently column-encrypted — apply `pgcrypto` additively if required by jurisdiction.
* The illustrative `generic_audit_log()` function in v2 §5 must be cloned per audited table with the correct PK column before Sprint 0 hardening.
* **Library additions during v3 review:** `argon2` (PIN hashing), `resend` (email — replaces SendGrid), `messagebird` (SMS — replaces Twilio), `pdfkit` (PDF — replaces Puppeteer), `docx` (Word, unchanged), `exceljs` (Excel, unchanged), `@tanstack/react-query` (client-side data fetching), `@sentry/react` (frontend error reporting). All added to `library-docs.md` "Approved Dependencies".
* **PII to scrub from Sentry:** any field matching `/^[^@\s]+@[^@\s]+$/` (email), `/^\+[1-9]\d{1,14}$/` (E.164 phone), `/^Bearer /` or `/^eyJ/` (JWT), or `/\-?\d{1,3}\.\d{4,}/` (GPS coordinate). Enforced in `beforeSend` hook in code, not just Sentry project settings.
* **Error codes (HTTP status → `error_code`):**
  - `422 PIN_FALLBACK_PHOTO_REQUIRED` / `MISSING_REMEDIATION_EVIDENCE` — verify-closure without `remediation_evidence` photo
  - `423 LOCKED_PIN_FALLBACK_ACTIVE` — write/refresh attempted on a PIN-fallback token
  - `429 PIN_LOCKED_OUT` — 5 failed PIN attempts in an hour, 1-hour lockout
  - `409 INSPECTION_APPROVED_USE_REOPEN` — reassign or bulk-reassign attempted on an Approved inspection
  - `413 BULK_REASSIGN_LIMIT_EXCEEDED` — bulk-reassign with > 100 inspections
  - `422 TARGET_INSPECTOR_INVALID` — target is not an active member of the active client
  - `422 SOURCE_EQUALS_TARGET` — self-reassign attempted
  - `409 MODE_LOCKED_DEFICIENCIES_EXIST` — Admin tried to change `inspection_mode` after the first deficiency was logged
  - `403 NOT_A_MEMBER` — Contractor tried to switch-client to a client they don't hold membership for
  - `403 FORBIDDEN_ADMIN_ONLY` — Reviewer attempted the Reopen endpoint (or any Admin-only endpoint)
  - `409 QR_CODE_ALREADY_IN_USE` — `PATCH /structures/:id qr_code_value` collision
  - `401 RESET_TOKEN_CONSUMED` — second use of a password-reset token
* **`auditEdit` helper signature (pinned):** `auditEdit(pool, { actorUserId, tableName, recordId, action, oldValues, newValues })`. Called inside the same transaction as the data write. The `source_ip` is read from `current_setting('app.request_source_ip', true)`. Cosmetic edits do not call this helper.
* **JWT one-issuer:** all tokens share `iss: 'structapp-app'`, `aud: 'structapp-api'`. The role claim is the only authorization signal in the token; the surface (phone vs laptop) is irrelevant.
* **TanStack Query defaults (pinned):** `staleTime: 30_000` (30s), `gcTime: 5 * 60_000` (5m), `retry: 2` (exponential backoff), `refetchOnWindowFocus: true` for inspection and deficiency data, `false` for picklists and reference data. Query keys are arrays, scoped to the resource and filter args.
* **Argon2id parameters (pinned):** `timeCost: 3, memoryCost: 65536, parallelism: 4`. Verification must take ≥ 250ms on target hardware. The test suite asserts this to catch a future parameter change.
* **`system_job_errors` columns (pinned):** `error_id UUID`, `job_id UUID` (nullable for client errors), `job_type VARCHAR(100)`, `error_code VARCHAR(100)`, `error_message TEXT`, `error_stack TEXT` (truncated to 8KB), `attempt_count INT`, `last_attempted_at TIMESTAMPTZ`, `input_payload JSONB` (nullable), `dismissed_at TIMESTAMPTZ NULL`, `dismissed_by UUID NULL REFERENCES users(user_id)`. Visible to Admin and Reviewer in a "Job errors" tab in the same screen that shows `system_audit_logs`.
* **Migration convention (post-v3 review):** FR-15 features (PIN columns, inspection mode enum, timesheet `entry_date` + `pre_inspection`, new tables) are additive `ALTER` migrations on top of the v2 schema — never rewritten `CREATE TABLE` statements. See v2 §5.1 amendment notes for the live examples.

## 10.11 Bug List

| Bug ID | Area | Page / Component | Description | Severity | Reported | Status |
|---|---|---|---|---|---|---|
| BUG-001 | Inspections | `InspectionListPage.tsx` | Status filter buttons on the page work correctly, but sidebar submenu navigation (`/inspections?status=Submitted`, `?status=Returned`, `?status=Approved`) passes query params that the page never reads. Page initializes `statusFilter` to `'all'` via `useState('all')` — needs `useSearchParams` to sync initial state from URL. | High | 2026-06-26 | 🟩 COMPLETED |
| BUG-002 | Remediation | `RemediationQueuePage.tsx` | Status filter buttons on the page work correctly, but sidebar submenu navigation (`/remediation?status=Open`, `?status=Remediated_Pending_Verification`, `?status=Verified_Closed`) passes query params that the page never reads. Page initializes `statusFilter` to `'all'` via `useState('all')` — needs `useSearchParams` to sync initial state from URL. | High | 2026-06-26 | 🟩 COMPLETED |
| BUG-003 | Timesheets | `TimesheetReviewPage.tsx` | No status filter exists on the timesheet review queue. Reviewer cannot filter timesheets by `Submitted`, `Approved`, `Rejected`, or `Draft` status. Either a filter component was removed during B13 design system changes or was never added. | Medium | 2026-06-26 | 🟩 COMPLETED |
| BUG-004 | Timesheets | `TimesheetListPage.tsx` | (Mobile contractor page) No status filter exists. Contractor cannot filter their own timesheets by status. | Low | 2026-06-26 | 🟩 COMPLETED |
| FEAT-001 | Global | All list/table pages | All lists and tables should have search (text/term filtering) and relevant sort options (column-based ascending/descending). Currently: InspectionListPage, RemediationQueuePage, TimesheetReviewPage, TimesheetListPage, ClientListPage, UserListPage, AdminDashboard, ReviewerDashboard, and all Register pages lack search/sort capabilities. | Medium | 2026-06-26 | 🟩 COMPLETED |
| BUG-005 | Global | Mock data architecture | `Inspection` and `Timesheet` types lack `client_id` field. Mock data records have no client scoping. Pages don't subscribe to `authStore` client changes via `subscribe()`. When admin switches client, table data doesn't refresh because: (a) no `client_id` exists on the data models, (b) mock services don't filter by client, (c) pages don't re-fetch on client change. Affects TimesheetReviewPage, InspectionListPage, RemediationQueuePage, and any data-display page. Fix requires: add `client_id` to types, add client-scoped mock data, subscribe to client changes in pages. | High | 2026-06-26 | 🟩 COMPLETED |
| | CONTRACTOR-001 | Auth | Global | Contractor auto-logout on 403 — `queryClientErrorHandler` treated 403 as logout; `TenantContextBadge` hit admin-only `/clients`; `registerRouter` and `timesheetsRouter` blocked Contractor role | High | 2026-07-07 | 🟩 COMPLETED | | | | | | | |
| FIX-010 | Taxonomy | `GET /api/v1/taxonomy` | Contractor users hit 403 because `picklistsRouter`'s `requireRole('Admin', 'Reviewer')` middleware mounted before `taxonomyRouter` at same prefix `/api/v1` — Express matched the restrictive middleware first and rejected Contractor requests before reaching the taxonomy handler | High | 2026-07-08 | 🟩 COMPLETED | | | | | | | |
| FIX-011 | Deficiencies | `createDeficiency` INSERT | `POST /api/v1/inspections/:id/deficiencies` returned 500 because INSERT references columns (`structure_id`, `created_by`, `priority_tier`, `location_desc`) that don't exist in `deficiency_records` table. Fix: migration adds the four missing columns and makes old v2 required columns (`component`, `severity`, `probability`, `consequences`) nullable (replaced by Glencore grid in TAX-611) | High | 2026-07-08 | 🟩 COMPLETED | | | | | | | |
| FIX-012 | Mobile Deficiencies | `DeficiencyDetailPage.tsx`, `deficiencies.ts` | Three bugs: (1) after saving new deficiency, page stays on create form — no way to add photos; (2) save button can be clicked multiple times creating duplicates; (3) revisiting an existing deficiency shows empty form (data not loaded). Fix: navigate to edit URL on save success, fetch existing data (Dexie + API), loading skeleton for edit mode. Additionally: server query `deficiency_id AS id` alias mismatch — all four SQL queries now alias `deficiency_id AS id` so frontend `Deficiency.id` is populated. Mobile InspectionDetailPage has defensive fallback `def.id || deficiency_id`. Sub-Component dropdown (3rd level) not persisted to DB — fixed by deriving from taxonomy tree using focusArea parent lookup. | High | 2026-07-08 | 🟩 COMPLETED |
| ~~BUG-006~~ | Admin | `UserEditDrawer` + `DeactivateDialog` | Backdrop overlay used `bg-black/20` causing ghosting effect. **FIXED**: reduced to `bg-black/5`, added sticky header/footer, shadow-2xl, border-l to UserEditDrawer. | High | 2026-06-26 | 🟩 COMPLETED |
| CONN-7 | Inspections | NewInspectionPage / InspectionDetailPage / mockInspection | Inspection creation under Register with multi-structure support; read-only detail page with Approve/Return actions; batch create in mock service | High | 2026-06-28 | 🟩 COMPLETED |
| FIX-013 | Timesheets | TimesheetDetailPage, timesheets route + service | Save for draft and submitted timesheets was missing `pre_inspection` field in the update payload. Submitted entries were rejected outright by the service (`TIMESHEET_NOT_DRAFT`). Fixed: added `pre_inspection` to client payload, route extraction, and service SQL SET clause; allowed editing Submitted entries by reverting to Draft. | High | 2026-07-10 | 🟩 COMPLETED |

## 10.12 Backlog — Itemized for Review

| ID | Category | Description | Priority | Proposed |
|---|---|---|---|---|
| BL-001 | Register | Structure types should be a picklist/dropdown rather than free-text input. Requires new `structure_types` table, a picklist page, and linking the field to it. | Medium | 2026-06-28 🟩 COMPLETED |
| BL-002 | Picklists | Component Types and Work Types picklist pages are placeholders (`<div>placeholder</div>`) — need real UI | Low | 2026-06-28 | 🟩 COMPLETED via GenericPicklistPage + API hooks |
| BL-003 | Mobile — Photo Upload Pipeline | Photos captured on the DeficiencyPhotosPage are stored locally with `sync_state: pending` but never uploaded to the server. Missing: (a) `POST /api/v1/deficiencies/:id/photos` endpoint, (b) `GET /api/v1/deficiencies/:id/photos` endpoint, (c) frontend upload mutation, (d) remapping of photos from temp localId to real server ID after deficiency save, (e) sync queue for offline-captured photos. Currently photos persist only in localStorage/Dexie via `useLocalState` and show permanent "pending" badge. | High | 2026-07-09 | 🟩 COMPLETED — Dexie v5, Cloudinary direct upload, EXIF stripping, auto-upload on deficiency save. See commit 38499a5. |
| BL-004 | Mobile — Historical Deficiency Triage | `InspectionHistoryPage` (accessed via "View History" on InspectionDetailPage) is non-functional: (a) queries current inspection's deficiencies instead of unresolved deficiencies from past inspections of the same structure, (b) triage decisions stored only in local `useState` with no save/mutation, (c) shows raw inspection UUID instead of site name. Needs: `GET /api/v1/inspections/:id/history` endpoint returning unresolved deficiencies from past inspections of the same structure, `POST` endpoint to save triage decisions, frontend save button + mutation, proper data flow. | High | 2026-07-09 | ⬜ NOT STARTED |
| BL-003 | Calendar | Calendar and Schedule pages are placeholders — need real inspection scheduling UI | Medium | 2026-06-28 | 🟩 COMPLETED |
| BL-004 | Timesheets | Timesheet detail view (read-only) missing — only approve/reject on queue, no way to view line items | Low | 2026-06-28 | 🟩 COMPLETED |
| BL-005 | Global | `useEffect`-based data fetching used across all pages — consider migrating to a more declarative pattern (TanStack Query / custom hooks) | Low | 2026-06-28 | 🟩 COMPLETED |
| BL-006 | Test | **b12-reports.test.tsx** — ReportCenterPage tests time out in CI; idle timer in mock report processing delays assertions | Low | 2026-07-03 | 🟩 IN PROGRESS (investigating CI timeout) |
| BL-007 | Test | **b16-calendar.test.tsx** — "shows day detail modal on day click" fails; modal rendering timing or event propagation issue | Low | 2026-07-03 | 🟩 IN PROGRESS (debugging modal timing) |
| BL-008 | Test | **b1-feature-flags.test.ts** — `isFeatureEnabled` returns `true` for P2 features, test expects `false` | Low | 2026-07-03 | 🟩 BLOCKED (feature flag config issue) |
| BL-009 | Test | **b1-types.test.ts** — `RemediationStatus` enum missing `'NotStarted'` value expected by test | Low | 2026-07-03 | 🟩 COMPLETED (enum updated) |
| BL-010 | Test | **b3-auth.test.tsx** — LoginPage "has link to activate page" fails; label text mismatch (`/activate invite/i`) | Low | 2026-07-03 | 🟩 COMPLETED via label fix |
| BL-011 | Test | **b2-routing.test.tsx** — "renders login page at /login" fails; heading role/name mismatch. 3 authenticated route renders fail because `AppRoutes()` is rendered outside QueryClientProvider | Low | 2026-07-03 | 🟩 COMPLETED via fix |
| BL-012 | Test | **b5-register.test.tsx** — CONN-7 NewInspectionPage tests fail; mockProject/mockSite selectors timing out | Low | 2026-07-03 |
| BL-013 | Test | **b6-mobile.test.tsx** — B6-T06: deficiency form renders but "severity" label not found (label uses "Consequence"). `calculateRiskPreview` removed in TAX-611 but test still references it | Low | 2026-07-03 |
| BL-014 | Test | **b7-reviewer.test.tsx** — B7-T01: "returned" text found multiple times (card + chart). B7-T02: multiple sites match "harbor bridge". B7-T05: PriorityOverridePanel has cancel + confirm buttons both matching `/confirm\|save\|override/` regex | Low | 2026-07-03 |
| BL-015 | Test | **b8-admin.test.tsx** — B8-T01: ReopenInspectionModal has Cancel + Confirm buttons both matching `/confirm\|reopen/` regex | Low | 2026-07-03 |
| BL-016 | Test | **b4-admin.test.tsx** — AdminClientSwitcher component renders outside MemoryRouter inside `wrap()` which wraps MemoryRouter; double-nested routing | Low | 2026-07-03 |
| BL-017 | Test | **hooks/useConnectivity.test.ts** — `vi.mock` hoisting issue with `useConnectivity` import | Low | 2026-07-03 |
| BL-018 | Test | **hooks/useServiceWorker.test.ts** — import path `../src/hooks/useServiceWorker` doesn't resolve (file doesn't exist) | Low | 2026-07-03 |
| BL-019 | Test | **db.test.ts** — import path `../apps/web-client/src/lib/db` is wrong relative to test root | Low | 2026-07-03 |
| BL-020 | Feature | **SyncPage** — mobile push/pull sync UI: connect mockSync local functions to real sync endpoints, show sync status history, add error recovery | Low | 2026-07-07 |
| BL-021 | Feature | **Offline sync backend** — POST /sync/pull-package returns full taxonomy tree, inspection assignments, reference data; POST /sync/push-outbox processes pending local changes | Medium | 2026-07-07 |
| BL-022 | Feature | **Calendar view** — implement `InspectionCalendarView.tsx` component (P2): schedule board with day/week/month views, drag-to-reschedule | Low | 2026-07-07 |
| BL-023 | Feature | **Bulk reassign UI** — implement `BulkReassignDialog.tsx` component: multi-select inspections, reassign to another inspector | Low | 2026-07-07 |
| BL-024 | Feature | **Inspection mode picker** — implement `InspectionModePicker.tsx`: onsite vs post-inspection mode toggle | Low | 2026-07-07 |
| BL-025 | Feature | **Unsynced warning dialog** — implement `UnsyncedWarningDialog.tsx`: warn before navigating away with unsaved offline changes | Low | 2026-07-07 |
| BL-026 | Feature | **Connectivity monitoring** — implement `useConnectivity.ts` hook: real-time online/offline detection, trigger sync on reconnection | Low | 2026-07-07 |
| BL-027 | Feature | **Audit log viewer** — implement `useAuditLogs.ts` hook: query audit logs with filters, pagination | Low | 2026-07-07 |
| BL-028 | Feature | **Photo EXIF extraction** — implement `lib/photo/exif.ts`: extract EXIF metadata from captured photos for evidence | Low | 2026-07-07 |
| BL-029 | Feature | **Route guard utilities** — implement `lib/guard.ts`: reusable auth/role/feature-flag guard functions | Low | 2026-07-07 |
| BL-030 | Feature | **Service worker optimization** — add proper cache versioning, precache strategy for offline support | Medium | 2026-07-07 |
| BL-031 | Feature | **HTTPS / TLS** — configure proper TLS termination, HSTS headers for production deployment | Medium | 2026-07-07 |
| BL-032 | Feature | **Rate limiting** — enforce rate limits on auth endpoints (login, refresh, invite, reset) | Medium | 2026-07-07 |
| BL-033 | Feature | **Network error handling** — unified toast/retry UI for network failures across all API calls | Low | 2026-07-07 |
| BL-034 | Feature | **Asset Library Taxonomy Template** — seed full WTP asset library (~105 taxonomy nodes) from XLSX for new clients; create `structure_taxonomy_templates` linking table; add `GET /api/v1/structure-taxonomy-templates` endpoint; update mobile DeficiencyDetailPage to pin template-relevant components at the top of each picker | High | 2026-07-11 | 🟩 COMPLETED |
| ADM-421 | Email Queue UI — fix data fetch/response shape mismatch (pagination nested in `json.data`), make sidebar link always visible (phase P1 → P0), add frontend tests | Low | 2026-07-10 | 🟩 COMPLETED |
| REFACTOR-001 | Tech debt | Replace hardcoded status string literals with canonical `InspectionStatus`, `TimesheetStatus`, `PriorityTier`, `RemediationStatus` enums across 12 form/page files | Low | 2026-07-10 |

## 10.13 Sprint 6 — Taxonomy & Cascading Deficiency Flow (TAX)

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| TAX-601 | Create `deficiency_taxonomy` migration — hierarchical table with `parent_id` self-FK, `client_id` RLS, `level` enum, category group, display order, unique constraint per client | 6 | 🟩 COMPLETED | None |
| TAX-602 | Taxonomy CRUD service + Express routes (`GET /taxonomy`, `POST /taxonomy`, `PATCH /taxonomy/:id`) with Admin/Reviewer guards + Zod validation | 6 | 🟩 COMPLETED | TAX-601 |
| TAX-603 | Add taxonomy tree to sync pull-package — `processSyncPull` returns full taxonomy tree; client caches in Dexie | 6 | 🟩 COMPLETED | TAX-601 |
| TAX-604 | Add v4 deficiency columns to `deficiency_records` — `category`, `sub_component`, `focus_area`, `deficiency_category`, `detailed_description`, `mechanisms`, `vibration_present`, `ndt_required`, `further_investigation_required`, `recommended_action`, `consequence_severity`, `likelihood`, `most_affected_consequence` | 6 | 🟩 COMPLETED | None |
| TAX-605 | Extend `deficiencySyncSchema` + `processSyncPush` with new deficiency fields; ensure Zod validation and DB insert cover all new columns | 6 | 🟩 COMPLETED | TAX-604 |
| TAX-606 | Update client `Deficiency` type, `DeficiencyRecord` Dexie schema, `PendingDeficiencyPayload`, and `getPendingDeficiencies` serialization for all new fields | 6 | 🟩 COMPLETED | TAX-605 |
| TAX-607 | Fix frontend `PriorityTier` enum — add P3, P4, P5; align with server `CHECK` constraint; add v4 priority descriptions | 6 | 🟩 COMPLETED | None |
| TAX-608 | Backend P1/P2 photo validation at submit — `submitInspection` checks each P1/P2 deficiency has ≥ 1 photo attached; returns `422 MISSING_PHOTO_CRITICAL` | 6 | 🟩 COMPLETED | None |
| TAX-609 | Frontend P1/P2 photo validation at submit — `InspectionSubmitPage` shows blocking error for critical deficiencies without photos; `DeficiencyPhotosPage` shows warning badge | 6 | 🟩 COMPLETED | TAX-608 |
| TAX-610 | Refactor mobile `DeficiencyDetailPage` into cascading wizard — progressive dropdowns driven by taxonomy tree; Category → Component → Sub-Component → Focus Area → Deficiency Category → Detailed Description; offline-capable via cached taxonomy in Dexie | 6 | 🟩 COMPLETED | TAX-603, TAX-606 |
| TAX-611 | Replace 3D risk model with Glencore 2D grid — delete `calculatePriorityTier`, delete mock `calculateRiskPreview`, replace sync contract inputs (severity/probability/consequences → consequenceSeverity/likelihood + priorityRating dropdown), update `processSyncPush`, update frontend risk inputs + live preview | 6 | 🟩 COMPLETED | TAX-604 |
| TAX-612 | Restructure Cloudinary folder paths — `structapp/clients/{slug}/inspections/{id}/{purpose}/{deficiency_id}`; pass `clientSlug` and `inspectionId` through `processPhotoUpload` call chain; purpose mirrors `photo_purpose_enum` | 6 | 🟩 COMPLETED | TAX-601 (client slug available) |
| TAX-613 | Fix `PriorityOverridePanel` — replace `TIERS = ['P0', 'P1', 'P2']` with `['P1','P2','P3','P4','P5']` matching server CHECK constraint; update badge color maps; add tests | 6 | 🟩 COMPLETED | TAX-607 |
| TAX-614 | Update reviewer `DeficiencyDetailPage` — display new taxonomy fields (category, component, sub_component, focus_area, deficiency_category, detailed_description, mechanisms, vibration, ndt, further_investigation) and Glencore risk (risk_rank, risk_rating) in read-only detail view; add tests | 6 | 🟩 COMPLETED | TAX-604, TAX-606 |
| TAX-615 | Update reviewer `InspectionReviewPage` — right detail pane shows taxonomy hierarchy + Glencore risk score alongside existing priority/severity; add tests | 6 | 🟩 COMPLETED | TAX-604, TAX-606 |
| TAX-616 | Update reviewer `InspectionDetailPage` — show category and component in deficiency list items alongside severity and priority; add tests | 6 | 🟩 COMPLETED | TAX-604, TAX-606 |
| TAX-617 | Update mobile `RemediationUpdatePage` and reviewer `RemediationQueuePage` — display new taxonomy context and risk fields in remediation views; add tests | 6 | 🟩 COMPLETED | TAX-604, TAX-606 |
| TAX-618 | Update mock data — add new taxonomy fields + Glencore risk values to all 18 mock deficiency records in `mockDeficiencies.ts`, `mockInspection.ts`, `mockRemediation.ts` | 6 | 🟩 COMPLETED | TAX-606 |
| TAX-619 | Fix affected tests — update `b6-mobile.test.tsx`, `sync.test.ts`, `b10-remediation.test.ts`, `b1-mock-services.test.ts`, `b1-guard.test.ts` to match new `Deficiency` type shape | 6 | 🟩 COMPLETED | TAX-618 |
| TAX-620 | Build taxonomy management UI — Admin/Reviewer page for managing hierarchical taxonomy (category tree CRUD with drag-and-drop or parent select); consumes TAX-602 backend; replace superseded `PicklistComponentTypesPage` | 6 | 🟩 COMPLETED | TAX-602 |

## 10.7 Mobile Offline & Client Context

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| MOB-701 | Client-scoped client picker — contractors see only clients with assigned inspections via new `GET /clients/with-assigned-inspections` endpoint; admin/reviewer continue to see all memberships | 6 | 🟩 COMPLETED | None |
| MOB-702 | Add `client_id` filter param to `GET /inspections` route — all contractor query calls pass `active_client_id` | 6 | 🟩 COMPLETED | MOB-701 |
| MOB-703 | Extend sync pull with last 20 inspections per client + associated deficiencies (no images); API `processSyncPull` returns new `inspections` and `deficiencies` arrays | 6 | 🟩 COMPLETED | None |
| MOB-704 | Dexie v3 schema — add `offlineInspections`, `offlineDeficiencies`, `offlineTaxonomy` tables; `SyncPage` pull handler persists all three to IndexedDB | 6 | 🟩 COMPLETED | MOB-703 |
| MOB-705 | Dashboard cards show client name, site name, structure ID, status instead of bare UUIDs; offline fallback reads from Dexie | 6 | 🟩 COMPLETED | MOB-704 |
| MOB-706 | Fix global 403 error toast flood — throttle 403 toasts (10s), suppress background poll errors (`sync:*` keys), add `queryKey` to Sentry tags | 6 | 🟩 COMPLETED | None |
| MOB-707 | Guard unprotected localStorage/sessionStorage access — wrap all direct Web Storage calls in try/catch to prevent crashes in Safari private browsing | 6 | 🟩 COMPLETED | None |

### 10.8 Duplicate Inspection Prevention

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| INSP-801 | Migration: cleanup existing duplicate inspections + partial unique index `idx_inspections_active_duplicate_guard` on `(structure_id, inspector_id) WHERE status IN ('Assigned', 'InProgress')` | 6 | 🟩 COMPLETED | None |
| INSP-802 | Backend: catch unique violation in `createInspection` service → throw `DUPLICATE_INSPECTION`; route handler returns 409 with `error_code: 'DUPLICATE_INSPECTION'` | 6 | 🟩 COMPLETED | INSP-801 |
| INSP-803 | Frontend: `NewInspectionPage` shows specific error message when duplicate is detected | 6 | 🟩 COMPLETED | INSP-802 |

### 10.9 Timesheet Batch Fix

| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| TSM-901 | Backend: multi-row INSERT with RETURNING * — stores `inspection_id` and `notes→description`, returns `{ entries: [...] }` instead of `{ count }` | 6 | 🟩 COMPLETED | None |
| TSM-902 | Frontend: update `createTimesheetBatch` return type to `Promise<{ entries: Timesheet[] }>` | 6 | 🟩 COMPLETED | TSM-901 |
| TSM-903 | Tests: server tests for multi-row INSERT, inspection_id null handling, description mapping | 6 | 🟩 COMPLETED | TSM-901 |
| TSM-904 | Fix: TimesheetDetailPage uses `useCreateTimesheetBatch` hook instead of raw API — ensures React Query cache invalidation so saved entries appear in list | 6 | 🟩 COMPLETED | TSM-902 |
