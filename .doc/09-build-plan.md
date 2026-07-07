# 9. Chronological Build Plan & Release Gates

## 9.0 Current Status

**Phase:** v2 build complete (Sprints 0–4); v3 build starting (Sprint 5)
**Last completed:** v2 feature set — Auth, RLS, Atomic Sync, Dexie PWA, Review Workspace, Report Publishing (PDF via PDFKit, Word via docx, Excel via exceljs)
**Next:** Sprint 5 — scheduling, remediation lifecycle, picklists, admin controls, edit operations, capture mode, pre-inspection flag, reassign flows, TanStack Query + Sentry rollout

### Sprint status counters (mirror of §10.0)

| Sprint | Rows | Not Started | In Progress | Completed | Blocked |
|---|---|---|---|---|---|
| 0 | 1 | 1 | 0 | 0 | 0 |
| 1 | 6 | 6 | 0 | 0 | 0 |
| 2 | 3 | 3 | 0 | 0 | 0 |
| 3 | 6 | 6 | 0 | 0 | 0 |
| 4 | 2 | 2 | 0 | 0 | 0 |
| 5 | 34 | 34 | 0 | 0 | 0 |
| cross | 4 | 4 | 0 | 0 | 0 |

### Sprint dependencies (one-line summary)

```
0 ─→ 1 ─┬─→ 2 ─→ 3 ─→ 4
       │         │     │
       │         │     └─→ 5 (review workspace endpoints depend on ST-104)
       │         └───────→ 5 (Cloudinary + notifications feed v3 picks)
       └────────────────→ 5 (most of Sprint 5 fans out from Sprint 1)
```

## 9.1 Milestone Timeline (v2 — Sprints 0–4)

```
Sprint 0: Environment & Tooling Bootstrap
├── Repo scaffold, CI pipeline (lint/typecheck/test/migrate), .env.example
└── node-pg-migrate wired up; first migration creates the schema in Section 5

Sprint 1: Core Storage & Auth Foundation
├── Backend:
│   ├── DDL via migrations (users, clients, client_memberships, projects, sites, structures, password_reset_tokens)
│   ├── Password-based auth: POST /auth/login, /auth/refresh, /auth/logout, /auth/switch-client, /auth/invite/{provision,activate}
│   ├── Password reset: POST /auth/forgot-password, POST /auth/reset-password (ST-106, ST-107)
│   ├── RLS context middleware (asTenant + bypass flag)
│   ├── client_memberships enforcement (Contractor-only post-amendment)
│   └── Per-table audit trigger cloning (v2 baseline; FR-15 critical/cosmetic splits come in Sprint 5)
└── Frontend:
    ├── Single web app (React + Vite) init — single URL, responsive UI
    ├── Tailwind setup, responsive layout primitives (phone / tablet / laptop)
    ├── UI shells — top navbar, bottom app bar, PWA install metadata
    └── Token refresh-on-sync flow (ADR-010)

Sprint 2: Offline Caching & Ingestion Pipelines
├── Backend:
│   ├── CSV import staging tables (import_batches, import_rows) + validation service
│   ├── Full CRUD routes for clients / projects / sites / structures
│   └── POST /sync/pull-package (offline-first reference data)
└── Frontend:
    ├── Dexie.js schema (deficiencies, authState) — phone PWA install path
    ├── Local form caching + Service Worker registration (Workbox)
    ├── <QrScanButton> component + structure search
    └── Photo cap UI: soft warning at 6 photos, hard cap at 20 (post-amendment)

Sprint 3: Handshake Sync Engine & Cloud Storage
├── Backend:
│   ├── Atomic sync endpoint (POST /sync/push-outbox, all-or-nothing transaction)
│   ├── Shared riskCalculator.ts wired both sides
│   ├── Cloudinary streaming pipeline
│   ├── Notification service — Resend (email) + MessageBird (SMS) via NotificationProvider interface
│   ├── P1 after-commit hook (INT-308) — fires notifyP1Deficiency in the after-commit window only
│   └── FR-16 server-side validation: POST /sync/push-outbox accepts deficiencies in either mode
└── Frontend:
    ├── Multipart sync outbox dispatcher
    ├── <ConnectivityBanner> hook
    ├── Token refresh-on-sync flow
    └── FR-16 Geolocation API gating — must not call navigator.geolocation in post_inspection mode

Sprint 4: Review Workspace, Approval & Report Publishing
├── Backend:
│   ├── POST /inspections/:id/approve + /return endpoints
│   ├── Per-table audit triggers (v2 baseline, cloned per PK column)
│   ├── PDFKit (PDF) + docx (Word) + exceljs (Excel) report jobs
│   └── POST /reports/generate + GET /reports/:job_id polling
└── Frontend:
    ├── Splice Dashboard — responsive (two-pane on laptop, stacked on phone)
    ├── Review panels with override provenance display
    ├── Publishing Center
    └── Workbox service worker finalization
```

## 9.2 Sprint Action Breakdowns (v2)

* **Sprint 0:** Stand up GitHub Actions CI (§11.3); clone the audit-trigger pattern per table with correct PK columns (per the note at the end of §5.1 of v2).
* **Sprint 1:** Implement `client_memberships` checks in the auth middleware (Contractor-only post-amendment). Implement `/auth/switch-client` for Admin, Reviewer, and Contractor (Contractor limited to their memberships; server validates with `403 NOT_A_MEMBER`). Add the password-reset flow (`forgot-password` / `reset-password`) with `password_reset_tokens` table.
* **Sprint 2:** Pin the photo cap constant `MAX_PHOTOS_PER_DEFICIENCY = 20` and surface the soft warning at 6 in the PWA photo capture flow. The DB trigger `enforce_max_five_photos` is **not** migrated.
* **Sprint 3:** Confirm the mobile client's locally-displayed priority is explicitly labeled as a preview ("pending server confirmation") until the sync response returns the server-confirmed tier — this is a UX requirement that follows directly from FR-4.1's "server is authoritative" rule. The P1 after-commit hook design must enforce "fire only after the sync transaction commits, never before" (FR-4.2).
* **Sprint 4:** The Splice Dashboard component must be authored to render two-pane on `lg:` viewports and stacked on `<lg:` viewports. No mobile-specific variant — the same component, layout-adapted.

## 9.3 Sprint 5 Build Order (v3)

Sprint 5 is broken into 10 sub-tracks. Build them in the order listed — each block's dependencies are at the bottom of the table.

### 9.3.a Foundation for Sprint 5 (build first)

Before any Sprint 5 feature, do these in order:

1. **Install approved dependencies:** `argon2`, `resend`, `messagebird`, `pdfkit`, `docx`, `exceljs` (already in), `@tanstack/react-query`, `@sentry/react`. All already pinned in `library-docs.md` → "Approved Dependencies" — no new ADR required.
2. **Single-URL / responsive-UI / one-issuer refactor (URL-603):** Rename `apps/web-client/` directory to match the v3 spec (§3.3 of v2). Update the Mermaid topology diagram in §3.1. Change JWT `iss` from `structapp-field` to `structapp-app`. Verify all existing tests pass after the rename.
3. **TanStack Query setup (XCQ-601, XCQ-602):** Install `@tanstack/react-query`, configure shared `queryClient` with the project defaults (`staleTime: 30_000`, `gcTime: 5 * 60_000`, `retry: 2`, `refetchOnWindowFocus` per-resource). Add a CI lint rule / code-search check that no `useEffect` for data fetching exists. Add `QueryErrorBoundary` at the app root.
4. **Sentry setup (ERR-503):** Install `@sentry/react`, configure with the per-environment `SENTRY_DSN`. Implement the `beforeSend` scrubber: drop any field matching email, E.164 phone, JWT (Bearer/eyJ prefix), or GPS coordinate patterns. Wire the global `QueryClient` error handler to `Sentry.captureException`.
5. **`system_job_errors` table (ERR-501) + `POST /client-errors` endpoint (ERR-502):** Run the migration. Implement the endpoint with rate limits (per user 10/hr, per IP 100/hr). Add the "Job errors" tab in the audit log screen.
6. **`auditEdit` helper (EDT-414):** Build the helper at `apps/api-server/src/services/audit.ts` with the pinned signature. Wire it into one trivial critical-edit endpoint (`PATCH /users/:id role`) to prove the pattern before fanning it out.

### 9.3.b Scheduling & Calendar (SCH)

```
SCH-401: inspection_schedules table + idempotent generator job (FR-10)
SCH-402: <InspectionCalendarView> + reschedule/reassign endpoint (FR-10.3)
```

* SCH-401 first: migration, then `scheduleGenerator.ts` background job with `LEAD_TIME_DAYS = 14`. Verify idempotency via the unique index on `(schedule_id, scheduled_date)`.
* SCH-402 second: build the calendar component as responsive (month view on laptop, week view on phone). Drag-and-drop calls `PATCH /inspections/:id/schedule`. Add the bulk-reassign dialog (REA-422) at this time — same component, just an additional button.

### 9.3.c Remediation Lifecycle (REM)

```
REM-404: PATCH /photos/:id endpoint + POST /deficiencies/:id/verify-closure endpoint (FR-8.2)
REM-403: remediation_status lifecycle + verify-closure guard (FR-8)
```

* REM-404 first: add `photoUpdateSchema` to contracts; create `PATCH /photos/:id` endpoint for toggling `purpose`, `caption`, `display_order`; create `POST /deficiencies/:id/verify-closure` endpoint with `MISSING_REMEDIATION_EVIDENCE` guard.
* REM-403 second: build the `remediation_status` migration (adds 6 columns to `deficiency_records` per §5.2 of v3 plan). Build the `PATCH /deficiencies/:id/remediation` endpoint. Build the `<RemediationStatusTracker>` UI component.

### 9.3.d Managed Picklists (PCK)

```
PCK-404: component_types / work_types tables + seeding + backfill migration (FR-11)
PCK-405: PWA <PicklistManager> screens under Admin/Reviewer settings (FR-11)
```

* PCK-404 first: the migration creates the tables. Seed the standard library (6 component types, 4 work types) per `08-…md` §8.11. Backfill existing `deficiency_records.component` text values to seeded `component_type_id` rows before enforcing NOT NULL.
* PCK-405 second: the `<PicklistManager>` component, route `/picklists`, and inline "Add new…" form. Inactive entries don't appear in the PWA dropdown but remain selectable on historical records read-only.

### 9.3.e Admin Controls (ADM)

```
ADM-405: /inspections/:id/reopen + requireAdmin middleware (FR-9)
ADM-406: /audit-logs Admin-and-Reviewer endpoint + UI (FR-9.3, post-amendment)
ADM-407: PATCH /inspections/:id/inspection-mode Admin override endpoint (FR-16.5)
```

* ADM-405 first: the only Admin-only endpoint. The middleware `requireAdmin` is the strict check — Reviewer and Contractor get `403 FORBIDDEN_ADMIN_ONLY`.
* ADM-406 second: the route uses `requireAdminOrReviewer` (Contractor blocked). The UI tab is in the same screen that shows `system_audit_logs`; the new "Job errors" tab is the ERR-501 surface.
* ADM-407 last: small endpoint, blocked once any deficiency exists for the inspection (`409 MODE_LOCKED_DEFICIENCIES_EXIST`).

### 9.3.f Submission & Notification Expansion (SUB / NOT)

```
SUB-407: /inspections/:id/submit (FR-13)
NOT-408: assignment / submission / return notification call sites (FR-12.1)
NOT-409: notifyInspectionReassigned to previous inspector, body excludes new inspector's name, includes reason (FR-18.2)
NOT-410: notifyBulkReassignSummary to source + target on POST /inspections/bulk-reassign (FR-18.3)
```

* SUB-407 first: the endpoint that FR-13 introduced. Validates either ≥1 synced deficiency OR `no_deficiencies_found: true` in the request body. Fires `notifyInspectionSubmitted` (NOT-408) on success.
* NOT-408 next: wire the three call sites (POST /inspections, POST /inspections/:id/submit, POST /inspections/:id/return). Reuse the existing `NotificationProvider` Resend adapter; no new SDK.
* NOT-409 last: one new helper in `services/notifications/`. Called from `PATCH /inspections/:id/reassign` and inside the bulk-reassign loop.
* NOT-410 last: another new helper, called once per `POST /inspections/bulk-reassign` call (not per inspection).

### 9.3.g PIN Fallback (PIN) — FR-14

```
PIN-409: users.pin_hash columns + Argon2id hashing
PIN-410: POST /auth/pin-fallback + 423 LOCKED_PIN_FALLBACK_ACTIVE middleware
PIN-411: PWA PIN entry UI + pin_outbox Dexie table + sync recovery
PIN-412: PATCH /users/:id/reset-pin (Admin) + must_set_pin re-setup flow
PIN-413: pin_fallback_tokens table + recovery audit row on consumed_by_real_password_login
```

* PIN-409 first: install `argon2`. Add the 6 columns to `users` (per v3 §5.2). The default Argon2id parameters are `timeCost: 3, memoryCost: 65536, parallelism: 4` — verification must take ≥ 250ms on target hardware.
* PIN-410 second: the endpoint, the 5-attempt / 1-hour lockout (`429 PIN_LOCKED_OUT`), and the middleware that returns `423 LOCKED_PIN_FALLBACK_ACTIVE` on all write/refresh calls when the token carries `mode: "pin_fallback"`.
* PIN-411 third: the PWA UI. Add a new Dexie store `pin_outbox` (separate from the regular outbox). The 6-digit input, the lockout countdown, the persistent amber "Offline access only" banner.
* PIN-412 fourth: Admin-only `PATCH /users/:id/reset-pin`. Sets `pin_hash = NULL` and `must_set_pin = true`.
* PIN-413 last: the `pin_fallback_tokens` table, the recovery audit row on first successful real-password login, the `pin_outbox` upload on next sync.

### 9.3.h Edit Operations (EDT) — FR-15

```
EDT-413: FR-15 action-endpoint models (users, clients, projects, sites, structures, inspections, deficiencies, photos, timesheets)
EDT-414: auditEdit helper + critical/cosmetic audit-log rules
EDT-415: PWA inline edit forms (no modals except for irreversible actions)
EDT-416: POST /users/:id/resend-invite + /revoke-invite + /reset-password (Admin)
EDT-417: PATCH /deficiencies/:id/component-notes (cosmetic)
EDT-418: DELETE /photos/:id soft-delete (sets deleted_at)
EDT-419: PATCH /inspections/:id/reassign adds reason field (FR-18.2)
```

* EDT-413 first: the action-endpoint Zod schemas and route handlers for every resource. Each handler calls `auditEdit` (EDT-414) inside the same transaction for critical edits.
* EDT-414 second: the helper, in the foundation block (9.3.a step 6).
* EDT-415 third: the inline edit forms. Zod schemas re-imported from `contracts/`. Submit button disabled until form is valid and dirty. Cancel reverts.
* EDT-416 fourth: the three invite lifecycle endpoints. All critical, all audit-logged.
* EDT-417 / EDT-418: cosmetic edits, smaller scope.
* EDT-419 last: the `reason` field added to the existing reassign endpoint. Pairs with NOT-409 (the notification to the previous inspector).

### 9.3.i Capture Mode (MOD) — FR-16

```
MOD-417: inspection mode picker (PWA + Admin override) + inspections.inspection_mode column + inspection_mode_enum
MOD-418: Geolocation API gating — PWA must NOT call navigator.geolocation in post_inspection mode
MOD-419: server-side validation — POST /sync/push-outbox accepts deficiencies in either mode
```

* MOD-417 first: the migration creates the enum and adds the column. The PWA mode picker at the top of the Evaluation Form. The Admin override endpoint (ADM-407) is in the ADM block.
* MOD-418 second: a PWA-side change. The Geolocation API call site is gated on `inspection.inspection_mode === 'onsite'`. A test in CI asserts no `navigator.geolocation` call exists in the `post_inspection` code path.
* MOD-419 third: server-side defense. The atomic sync handler accepts deficiencies in either mode, no GPS requirement is enforced by the mode. The mode only governs what the PWA sends, not what the server accepts.

### 9.3.j Pre-Inspection Timesheet Flag (TSM) — FR-17

```
TSM-419: timesheet_entries.entry_date + pre_inspection derivation + yellow left-border rendering
TSM-420: timesheet_entries backfill migration: existing rows get entry_date = created_at::date
```

* TSM-420 first: the backfill migration. Safe to run before TSM-419 because the new column is added with `DEFAULT CURRENT_DATE` and backfilled in the same statement.
* TSM-419 second: the server-side derivation logic. The yellow left-border CSS rule in `ui-tokens.md`. The Splice Dashboard panel.

### 9.3.k Reassignment (REA) — FR-18

```
REA-420: notifyInspectionReassigned (to old inspector, no new name) + reason field on PATCH /inspections/:id/reassign
REA-421: POST /inspections/bulk-reassign (cap 100, atomic, audit per row, summary notifications)
REA-422: Bulk-reassign dialogs on Calendar and User management screens
```

* REA-420 first: the `reason` field on the existing endpoint + the `notifyInspectionReassigned` helper (NOT-409).
* REA-421 second: the bulk endpoint. Cap 100 (`413 BULK_REASSIGN_LIMIT_EXCEEDED`). The 4 error paths (target invalid, source equals target, target not active in client, batch contains an Approved inspection). One transaction, per-row audit, summary notifications (NOT-410).
* REA-422 last: the dialogs. Two places (Calendar row header, User management row). Both call the same `BulkReassignDialog` component.

## 9.4 Error Stack Cross-Cutting (built alongside the foundation block)

```
ERR-501: system_job_errors table
ERR-502: POST /client-errors endpoint (rate-limited)
ERR-503: @sentry/react setup with beforeSend PII scrubber
ERR-504: Shared queryClient + QueryErrorBoundary + global error handler
ERR-505: Pino log shipper configuration
```

* ERR-501 / ERR-502: in the foundation block (9.3.a step 5).
* ERR-503 / ERR-504: in the foundation block (9.3.a step 4).
* ERR-505: deployment-time configuration. Pin the log shipper choice (Datadog / Fluent Bit / Loki Promtail / self-hosted) per environment. The pino output is plain JSON and is ingestible by any of them.

## 9.5 Quality Control Release Gates

### v2 baseline (carried forward)

1. **Zero High Severity Flaws** — automated checks clean.
2. **Deterministic Transaction Rollbacks** — partial sync/import payloads verified to roll back fully.
3. **RLS Verified** — automated test attempts cross-tenant reads using a second client's JWT and asserts zero rows returned.
4. **Signed Engineering Approvals** — structural engineering director and systems lead log explicit approval.

### v3 additions (gate numbers continue from 4)

5. **Role-Boundary Verification (post-amendment)** — Automated test asserts a Reviewer-role token receives `403` from `POST /inspections/:id/reopen` and a `200` from `GET /audit-logs`; that a Contractor-role token receives `403` from `GET /audit-logs`; and that no Contractor-reachable UI path renders a link to either. *(Original v3 spec said no Reviewer-reachable path; loosened when Reviewer became global.)*
6. **Schedule Idempotency** — Running the schedule generation job twice in immediate succession produces zero duplicate inspections (verifies the unique index in §5 is actually load-bearing, not just decorative).
7. **PIN Fallback Behavior (FR-14)** — Automated tests assert: 3 consecutive failed `POST /auth/login` attempts surface the PIN entry UI; the correct PIN returns a token with `mode: "pin_fallback"`; a wrong PIN increments the counter and audit-logs; 5 wrong PINs in an hour locks the account for 1 hour (`429 PIN_LOCKED_OUT`); a `pin_fallback` token receives `423 LOCKED_PIN_FALLBACK_ACTIVE` on `POST /sync/push-outbox`, `POST /auth/refresh`, and any other write; a subsequent real-password login marks the `pin_fallback` token consumed and unblocks writes; the `pin_outbox` records upload on the next sync with the `pin_mode: true` audit tag and the Splice Dashboard flag.
8. **Argon2id Verification Timing (FR-14.2)** — The test suite asserts the Argon2id verification takes ≥ 250ms on target hardware, to catch a future parameter change that would weaken the hash.
9. **Edit Operation Audit Behavior (FR-15.1)** — Automated tests assert: a critical field change writes an `auditEdit` row with old and new values; a cosmetic field change does not; `PATCH /users/:id` validates role/email changes server-side (no privilege escalation); `add_client_ids` / `remove_client_ids` produce the expected `client_memberships` row set.
10. **Reassign-on-Approved is rejected (FR-15.2)** — `PATCH /inspections/:id/reassign` returns `409 INSPECTION_APPROVED_USE_REOPEN` for an Approved inspection, forcing the reopen flow.
11. **QR Code Uniqueness (FR-15.3)** — `PATCH /structures/:id qr_code_value` collisions return `409 QR_CODE_ALREADY_IN_USE`.
12. **Inspection Mode Gating (FR-16)** — A test asserts: a new inspection carries the inspector's chosen `inspection_mode`; the default is `onsite`; `inspections.inspection_mode` is NOT NULL; `POST /sync/push-outbox` accepts deficiencies in either mode without requiring GPS; the PWA does not call `navigator.geolocation` in `post_inspection` mode (lint / code-search check); `PATCH /inspections/:id/inspection-mode` returns `409 MODE_LOCKED_DEFICIENCIES_EXIST` when at least one deficiency exists.
13. **Pre-Inspection Timesheet Flag (FR-17.3)** — Automated tests assert: `entry_date` defaults to today when not supplied; the server sets `pre_inspection = true` when `entry_date < inspections.scheduled_date` (or `< inspections.assigned_at` for one-off inspections); the `pre_inspection = true` row is rendered with the yellow left-border in the API response and the timesheet list endpoint surfaces the flag.
14. **Bulk Reassign (FR-18.3)** — Automated tests assert: an empty `inspection_ids` list reassigns all open inspections under the source for the Admin's active client; the cap of 100 is enforced (`413 BULK_REASSIGN_LIMIT_EXCEEDED`); the target must be a current `is_active = true` member of the same client (`422 TARGET_INSPECTOR_INVALID`); source ≠ target (`422 SOURCE_EQUALS_TARGET`); if any inspection in the batch is `Approved`, the entire transaction rolls back (`409 INSPECTION_APPROVED_USE_REOPEN` with the offending IDs); one `system_audit_logs` row per inspection; the source's summary notification does not include the target's name.
15. **TanStack-Query-Only Rule (§4.7a of v3 engineering standards)** — A CI code-search rule asserts no `useEffect` for data fetching exists. The check is: a regex that flags `useEffect\(\s*\(\s*\)\s*=>\s*\{[^}]*fetch\(` or equivalent. The check is run in CI on every PR.
16. **Sentry PII Scrubber (§11.9.3)** — A test asserts the `beforeSend` hook scrubs any field matching the email / phone E.164 / JWT / GPS regex patterns. The test posts synthetic events with each pattern and asserts the field is dropped before the SDK sends.
17. **`auditEdit` Consistency (FR-15.5)** — A coverage check asserts every critical edit (per the §10.7 / §10.8 catalogue) calls `auditEdit` inside the same transaction. A code-search rule flags any handler in the FR-15 endpoint table that does not invoke `auditEdit`.
18. **Single-URL / One-Issuer (§3 of v3 architecture)** — A test asserts: a Contractor logged in on a phone and a Contractor logged in on a laptop see the same functional experience (same routes, same response shapes); JWT tokens carry `iss: 'structapp-app'` regardless of the device class; the role claim is the only authorization signal in the token.

## 9.6 Decisions Made During Build

*(Mirror of §10.7 of the progress tracker. See that section for the full amendment history; key items summarized here for the build plan context.)*

* **(post-v2 amendment)** ADR-007 amended: Puppeteer → **PDFKit** for PDF generation.
* **(post-v2 amendment)** ADR-008 amended: SendGrid → **Resend**, Twilio → **MessageBird**.
* **(v3)** ADR-011 added: fixed-interval recurrence, not RRULE/iCal.
* **(v3)** Client portal is out of scope.
* **(v3)** Multi-inspector per inspection is out of scope; per-asset independent assignment.
* **(v3, post-amendment)** Reviewer role is global/cross-tenant. Audit log is Admin-and-Reviewer allowed. `client_memberships` is Contractor-only. `POST /auth/switch-client` is Admin-and-Reviewer allowed, plus Contractor limited to their memberships.
* **(v3, post-amendment)** Photo cap raised from 5 to 20 with soft UI warning at 6. DB trigger `enforce_max_five_photos` dropped.
* **(v3, post-amendment)** FR-3.2 replaced by FR-16. Inspector declares `onsite` / `post_inspection` at the start of every inspection.
* **(v3)** FR-14 (PIN fallback) added: per-user 6-digit access PIN, Argon2id hashed, no expiry. After 3 failed password attempts, `/login` offers PIN entry. PIN-mode token is read-only and offline-only; new data goes to `pin_outbox` and is held until real-password login.
* **(v3)** FR-17 (pre-inspection timesheet flag) added.
* **(v3, post-amendment)** Password-reset flow (`forgot-password` / `reset-password`) added.
* **(v3, post-amendment)** User management: `resend-invite`, `revoke-invite`, `reset-password` (admin) endpoints.
* **(v3, post-amendment)** Edit-while-Approved: no shortcut. Reopen → edit → re-approve.
* **(v3, post-amendment)** Single-URL / responsive-UI / one-issuer model. JWT `iss: 'structapp-app'`.
* **(v3, post-amendment)** TanStack Query is the only data-fetching primitive for Client Components; `useEffect` for fetching is banned.
* **(v3, post-amendment)** Sentry captures frontend errors; pino captures backend errors; `system_job_errors` table stores retry-exhausted jobs and PWA client errors.

## 9.7 Notes

*(Mirror of §10.8 of the progress tracker.)*

* Risk priority score bands (80/45/20/8) in `shared/utils/riskCalculator.ts` are a starting heuristic — must be validated by the structural engineering lead before production.
* Retention period for inspection records and photos is a policy decision — default to "retain indefinitely, no auto-deletion" until legal/compliance signs off.
* Phone numbers and GPS coordinates are sensitive but not currently column-encrypted; apply `pgcrypto` additively if required.
* The illustrative `generic_audit_log()` function in v2 §5 must be cloned per audited table with the correct PK column before Sprint 0 hardening.
* **Library additions during v3 review:** `argon2`, `resend`, `messagebird`, `pdfkit`, `docx`, `exceljs` (already in), `@tanstack/react-query`, `@sentry/react`. All in `library-docs.md` → "Approved Dependencies".
* **PII to scrub from Sentry:** any field matching `/^[^@\s]+@[^@\s]+$/` (email), `/^\+[1-9]\d{1,14}$/` (E.164 phone), `/^Bearer /` or `/^eyJ/` (JWT), or `/\-?\d{1,3}\.\d{4,}/` (GPS coordinate). Enforced in `beforeSend` hook in code, not just Sentry project settings.
* **Error codes (HTTP status → `error_code`):**
  - `422 MISSING_REMEDIATION_EVIDENCE` — verify-closure without `remediation_evidence` photo
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

## 9.8 Cross-references

* Progress tracker (rows and statuses per feature): see §10 of `.doc/10-progress-tracker.md`
* Functional requirements (FR-1 through FR-18): see `.doc/02-functional-requirements.md`
* Database schema (v2 baseline + v3 deltas): see `.doc/05-database-schema.md`
* API contracts (Zod schemas + endpoint examples): see `.doc/06-api-contract.md`
* Engineering standards (TanStack rule, auditEdit signature, test cases): see `.doc/04-engineering-standards.md`
* Library docs (every approved dependency, including new ones): see `.doc/library-docs.md`
* Operational requirements (Error Logging and Review, §11.9): see `.doc/11-operational-requirements.md`

(End of file - total sections: 9; mirrored against the progress tracker's structure)
