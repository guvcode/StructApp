# 1. Project Overview & Context Bounds

## 1.1 High-Level Project Summary

StructApp is a single, multi-tenant enterprise web app built for structural engineering asset registers, field condition evaluations, and workforce tracking. It enables structural engineers and field contractors to conduct structural deficiency audits inside remote, low-connectivity zones (mine sites, tunnels, processing plants) and push data back to a centralized web platform for administrative processing and reporting. The same app serves the field workforce (Contractor role, primary device is a phone) and the administrative office (Reviewer/Admin roles, primary device is a laptop) — one URL, one code base, responsive UI.

**Tenancy model.** A `client` represents one paying customer organization. `Admin` and `Reviewer` users are global/cross-tenant by role — they bypass `client_memberships` entirely and can read/write any tenant-scoped data the RLS policy permits. `Contractor` users are scoped to one or more clients via an explicit membership table (`client_memberships`) — this supports the realistic case of a contracting firm whose inspectors serve multiple client sites.

## 1.2 Platform Core Boundaries

StructApp is a single web application deployed at one URL (e.g. `https://app.structapp.example`). It is **responsive** — a single code base, a single set of routes, layout density adapted to the device class:

* **On a phone (Field Contractor or any role)** — mobile-first single-column layout, bottom-sheet navigation, touch targets ≥ 44×44px, offline-first via the Service Worker / IndexedDB stack. A Contractor on a phone sees the Inspector Dashboard, the Splice Dashboard's two-pane equivalent stacks vertically, photos and forms are full-width.
* **On a laptop or desktop (any role)** — wider layout, multi-column where it helps (deficiency list + detail side-by-side, two-pane Splice Dashboard, photo gallery as a grid). All the same data, the same routes, the same offline behavior — the PWA install is the same PWA install. There is no separate "desktop portal" codebase.

**Two product surfaces, one URL:**
* **Field workforce experience** — designed for low-connectivity field use, offline-first, mobile-first. Default for Contractor role.
* **Office workforce experience** — designed for QA review, override, scheduling, and report generation. Default for Reviewer and Admin roles.

A Contractor's experience on a laptop is the same mobile-first UI rendered at a larger viewport — denser forms, multi-column where it helps, but functionally identical to the phone experience. They are not redirected to a separate "portal" — they see the same app, just with the responsive layout filling the larger screen.

## 1.3 Comprehensive Application Map & Navigation Paths

### 1.3.1 Pages

All routes below are served from a single URL. The same route works on phone and laptop; the layout adapts. Role gates are server-enforced (middleware + RLS); a Contractor navigating to `/users` gets a `403` from the server regardless of device.

| Route | Screen | Roles |
|---|---|---|
| `/login` | Login | Public. Email + password. |
| `/forgot-password` | Forgot Password | Public. Request a reset email. |
| `/reset-password` | Reset Password | Public. Token-gated form. |
| `/` | Landing (role-default) | All authenticated. Contractor → Inspector Dashboard; Reviewer/Admin → Operational Control Deck. |
| `/inspections` | Inspections list | All (RLS-scoped) |
| `/inspections/:id` | Inspection Detail / Splice Dashboard | All (RLS-scoped) |
| `/inspections/:id/evaluate` | Structural Evaluation Form | All (RLS-scoped; Contractor is the primary user) |
| `/inspections/:id/timesheet` | Timesheet Entry | All (own data for Contractor) |
| `/inspections/calendar` | Scheduling & Calendar (v3) | Admin, Reviewer |
| `/sync` | Sync Hub bottom sheet (phone) / side panel (laptop) | Contractor |
| `/clients` | Clients list | Admin only |
| `/clients/:id` | Client detail + picklist manager | Admin only |
| `/projects` | Projects list | Admin, Reviewer |
| `/projects/:id` | Project detail | Admin, Reviewer |
| `/imports` | Sandbox Import Center | Admin only |
| `/imports/batches/:id` | Import batch review | Admin only |
| `/schedules` | Recurrence schedules | Admin, Reviewer |
| `/deficiencies/:id` | Deficiency detail | All (RLS-scoped) |
| `/reports` | Document Publishing Center | Admin, Reviewer |
| `/reports/jobs/:id` | Report job status | Admin, Reviewer |
| `/picklists` | Component Type / Work Type picklist manager (v3) | Admin, Reviewer |
| `/audit-logs` | System Audit Log (v3) | Admin, Reviewer |
| `/users` | User management | Admin only |
| `/profile` | Current user profile | All |
| `/settings` | App settings (sync prefs, PIN, logout) | All |

**Landing behavior on `/`:** the server response to `POST /auth/login` includes the user's `role` and a `default_landing_route` (e.g. `/` for everyone, but the SPA's `DefaultRoute` component renders the role-appropriate home: Inspector Dashboard for Contractor, Operational Control Deck for Reviewer/Admin). The user can navigate freely from there.

**Device-class adaptation (no separate code):**
- **Phone (≤ 768px)** — single column, bottom app bar, bottom-sheet navigation, full-width forms
- **Tablet (769–1023px)** — two-column where it helps (e.g. deficiency list + detail side-by-side)
- **Laptop/desktop (≥ 1024px)** — full multi-column layout: top navbar instead of bottom app bar, multi-pane Splice Dashboard, two-column photo galleries, side-by-side forms

### 1.3.2 Navigation

The app has one navigation system with two physical layouts based on device class.

#### Laptop / Desktop (≥ 1024px) — Top Navbar

Five items, left to right, in this order:

1. **Dashboard** (`/`)
2. **Inspections** (`/inspections`) — opens a submenu: All Inspections, Calendar (Admin/Reviewer only — hidden for Contractor)
3. **Deliverables** (`/reports`) — hidden for Contractor (route is server-gated anyway)
4. **Picklists** (`/picklists`) — Admin/Reviewer only
5. **Profile** (`/profile`)

Top-right utility cluster:

- **Client switcher** (when more than one client exists) — calls `POST /auth/switch-client`. For Contractor, the dropdown lists only clients they hold a membership for; Admin/Reviewer see all clients.
- **Audit Log** link (`/audit-logs`) — Admin and Reviewer
- **User menu** (avatar) — Settings, Logout, PIN management (Contractor)

Active nav item: `text-accent`, font-weight 500, 14px. Inactive: `text-text-dark`. No underline. Navbar always white, full viewport width, 64px tall, padding 0 24px.

#### Phone (≤ 768px) — App Bar + Bottom Nav

- **Top app bar (56px)**: title left, sync indicator right
- **Bottom nav (4 tabs, 56px)**: Home (`/`), Inspections (`/inspections`), Profile (`/profile`), More (overflow menu with the role-appropriate items: Calendar for Admin/Reviewer, Picklists, Reports, Audit Log, etc.)
- Tapping the sync indicator opens the Sync Hub bottom sheet (`/sync` route)
- Bottom safe-area padding on all screens (`env(safe-area-inset-bottom)`)
- No sidebar, no drawer

#### Tablet (769–1023px)

Top navbar (same as desktop) — there is enough horizontal real estate to make the bottom-nav pattern less useful.

### 1.3.3 Core User Flow — Field Contractor (any device)

#### Login & Onboarding

- User opens the PWA → lands on `/login`
- User authenticates via email + password
- Server returns `{ access_token, refresh_token, active_client_id }` (single membership) **or** `{ requires_client_selection: true, available_clients: [...] }` (multiple memberships)
- If multiple, the PWA shows a client picker before issuing the token
- On success → land on `/` (Inspector Dashboard)
- If profile is incomplete → show a banner with a "Complete profile" CTA
- As part of profile setup, the user is required to set a 6-digit **access PIN** (see `02-functional-requirements.md` FR-14). The PIN is needed for the offline fallback flow.

#### Forgot Password (Online)

- From `/login`, user taps "Forgot password?" → navigates to `/forgot-password`
- User enters their email → server calls `POST /auth/forgot-password` and emails a one-time reset link (single-use, 1-hour TTL) via Resend
- User taps the link in the email → opens `/reset-password?token=...` in the same web app (any device)
- User enters a new password (≥ 8 chars) → server calls `POST /auth/reset-password` with the token, updates `users.password_hash`, marks the token consumed
- On success → user is redirected to `/login` to sign in with the new password
- The reset link is single-use — second use returns `401 RESET_TOKEN_CONSUMED`

#### Forgotten Password While Offline (FR-14 PIN Fallback)

If the inspector is at a remote site with no connectivity and has forgotten their password (or has a wiped device):

- After 3 consecutive failed `POST /auth/login` attempts, the `/login` screen surfaces a "Use access PIN" link
- Tapping it transitions to a PIN entry view; inspector enters the 6-digit PIN set at profile setup
- PWA calls `POST /auth/pin-fallback` (online-required at this step — if the device is also offline, see note below)
- On success, the PWA receives an `access_token` carrying `mode: "pin_fallback"` and a `pin_fallback_token` persisted in Dexie's `authState`
- The PWA surfaces a persistent banner in the app bar: "Offline access only — new entries will sync after password reset"
- The inspector can read last-cached reference data (structures, sites, prior deficiencies, assigned inspections) and capture new deficiencies / timesheets / photos locally into a separate `pin_outbox` Dexie table
- **All write and refresh calls return `423 LOCKED_PIN_FALLBACK_ACTIVE`.** The inspector works fully offline against the cached data; new data sits in `pin_outbox` until recovery
- **To recover:** when the inspector next reaches a network area, they must complete a real `POST /auth/login`. On success, the server marks the previous `pin_fallback_token` consumed. The next `/sync/push-outbox` call uploads the `pin_outbox` records (each audit-tagged as `pin_mode: true` and visibly flagged in the Splice Dashboard for reviewer verification)
- **If both password and PIN are forgotten** (or the user has never set a PIN): an Admin can `PATCH /users/:id/reset-pin` (clears `pin_hash`, sets `must_set_pin = true`). The inspector completes a real-password login (online, via admin's verbal reset if needed), then the PWA forces PIN re-setup before granting normal access
- **Note on fully-offline lockout with no prior session:** if the device has never been signed in and has no signal, the PWA cannot authenticate the inspector at all. The fallback assumes the inspector can reach a network area at some point to call `POST /auth/pin-fallback`. The PIN itself is verified server-side; the device does no PIN crypto offline. Documented as a residual operational limitation — see `02-functional-requirements.md` FR-14.1

#### Inspection Capture — Offline-First

1. User lands on Inspector Dashboard (`/`). Sees assigned inspections, each with a status pill (`Assigned`, `In Progress`, `Submitted`, `Returned`, `Approved`) and — for schedule-generated ones — a `scheduled_date`.
2. User taps an inspection → `/inspections/:id` (Asset Structure Register Loop)
3. User searches a structure (text) **or** taps the camera icon → `<QrScanButton>` opens, scans, calls `GET /structures?qr=<value>`
4. User opens a structure → enters the Evaluation Form (`/inspections/:id/evaluate`)
4. **Inspection mode picker (FR-16)** — at the top of the form, before any deficiency is logged. Two options:
   - **On-site** — PWA reads the Geolocation API and auto-populates GPS on every deficiency.
   - **Post-inspection** — PWA does not call the Geolocation API; GPS fields default to null but the inspector can still enter them by hand.
   Mode is recorded on the inspection row. Changing the mode after the first deficiency is logged is blocked.
5. Form fields: component type (picklist), description, severity 1–5, probability 1–5, consequences 1–5, GPS (auto in on-site mode, manual-only in post-inspection), photos (soft UI warning at 6, API cap at 20)
6. Live risk-matrix badge updates as severity/probability/consequences change — uses the shared `riskCalculator.ts` (advisory only; server recomputes on sync)
7. User saves → row is written to Dexie `deficiencies` table with `syncState: 'Pending_Sync'` and pushed to the outbox
8. User taps "Submit Inspection" (FR-13) — confirms → server recomputes risk, transitions status to `Submitted`, fires `notifyInspectionSubmitted` to all Reviewers (global fan-out)
9. If the user is mid-form and goes offline → app bar shows amber "Offline Mode" banner; all writes go to Dexie only
10. When connectivity returns, user taps the sync indicator → Sync Hub bottom sheet shows outbox count → "Sync now" drains the outbox

#### Carry-Forward Triage

- When the user opens a structure with prior history, the form surfaces unresolved historical records (`triage_state IN ('New','Still Outstanding','Worsened')`)
- User picks one of: "Resolved" (no new record), "Still Outstanding" (links new to old via `previous_deficiency_id`), "Worsened" (same — new record with link), "Create new, unrelated" (no link)

#### Remediation Update (v3)

- On revisit, user can update a known deficiency's `remediation_status` to `Remediation_Scheduled` or `Remediated_Pending_Verification` (optionally attaching a `remediation_evidence` photo)
- The verify-close step is Reviewer/Admin only — PWA cannot complete it

#### Timesheet

- User opens `/inspections/:id/timesheet` → daily log entry: work type (picklist), hours (0.01–24.00), entry date (defaults to today, can be any past or future date)
- If the entry's `entry_date` is earlier than the inspection's `scheduled_date` (or `assigned_at` for one-off inspections), the entry is saved with `pre_inspection = true` and rendered with a yellow left-border + "Logged before inspection date" tag in the Splice Dashboard (FR-17)
- Save as `Draft` → Submit → status `Submitted`, server-side locked
- Reviewer/Admin approves or rejects (with `rejection_reason`)

### 1.3.4 Core User Flow — Reviewer & Admin (any device)

#### Operational Deck

- User logs in → land on `/` (Operational Control Deck)
- If Admin or Reviewer: client switcher in top-right; switching calls `POST /auth/switch-client` and refreshes state
- If Contractor: client switcher in the app bar (PWA) or top-right (desktop, when applicable); lists only clients in `client_memberships`. Switching does not log out — see FR-1.3

#### Sandbox Import

1. Admin opens `/imports` → "Upload CSV" button
2. Uploads file → server creates `import_batches` + per-row `import_rows` records
3. Admin reviews `/imports/batches/:id` — each row shows `Valid` or `Invalid` with reason
4. Admin clicks "Commit" → atomic transaction inserts all `Valid` rows as `projects`/`sites`/`structures`
5. Invalid rows are flagged in the response; nothing partial-commits

#### Splice Dashboard (Inspection Review)

1. Reviewer opens `/inspections` → list, filter by status / inspector
2. Taps an inspection → `/inspections/:id` (Splice Dashboard)
3. Two-pane layout: form fields left, photo proof right
4. Reviewer actions:
   - **Approve** (`POST /inspections/:id/approve`) — sets status `Approved`, activates immutability trigger, locks all deficiencies
   - **Return** (`POST /inspections/:id/return`) — sets status `Returned`, requires `returned_reason`, fires `notifyInspectionReturned`
   - **Override priority** — Reviewer-only; on a single deficiency, sets `is_overridden=true`, requires `reviewer_justification` ≥ 10 chars
   - **Reopen (Admin only, v3)** — on an `Approved` inspection; `POST /inspections/:id/reopen` with `target_status` + `reason` (≥ 10 chars); transitions to `Submitted` or `Returned`
5. Verify-closure (v3, FR-8.2) — Reviewer/Admin clicks "Verify closed" on a `Remediated_Pending_Verification` deficiency; server checks for at least one `remediation_evidence` photo, returns `422 MISSING_REMEDIATION_EVIDENCE` if absent

#### Calendar (Admin/Reviewer, v3)

1. Open `/inspections/calendar` — month or week view
2. Confirmed `Assigned` inspections render with solid border; schedule-generated-but-unconfirmed occurrences render dashed (FR-10.1 surfaces them ahead of due date)
3. Drag a tile → optimistic update + `PATCH /inspections/:id/schedule` with new `scheduled_date` and/or `inspector_id`; rollback on error
4. Inspector filter in top-right
5. "Today" button in top-left
6. **Bulk reassign (FR-18):** each inspector row header has a "Move all open work…" button. Opens a dialog with: source inspector (pre-filled), target inspector picker, reason (optional, max 500 chars), and a preview of the affected inspections. On confirm, `POST /inspections/bulk-reassign` runs. If the response is `409 INSPECTION_APPROVED_USE_REOPEN`, the dialog shows the offending inspection IDs and instructs: "Reopen the inspection first, then retry."

#### Document Publishing Center (Admin/Reviewer)

1. Open `/reports` → click "Generate Report" on a project
2. Pick format (`draft_pdf` / `final_pdf` / `word` / `excel`)
3. Server enqueues a `report_jobs` row, returns `{ job_id }`
4. Polling `/reports/jobs/:id` returns status; when `Ready`, returns a signed download URL
5. Resend notification fires when ready (FR-12.1 extension)

#### Picklist Manager (Admin/Reviewer, v3)

1. Open `/picklists` — tabs for Component Type, Work Type
2. List of entries with `is_active` toggle
3. Add new entry → inline form; never a hard delete — only `is_active=false` (FR-11.2)
4. Inactive entries don't appear in the PWA dropdown but are still selectable on historical records read-only

#### User Management (Admin only)

1. Open `/users` — list of all users, filterable by client membership
2. Each row shows: name, email, role, active/inactive status, last login
3. Inline edit (FR-15): `full_name`, `email`, `phone_number`, `role`, `is_active`, `add_client_ids` / `remove_client_ids`. Critical changes are audit-logged; cosmetic changes are not.
4. **Bulk reassign (FR-18):** each row has a "Reassign open work to…" action. Opens the same dialog as the calendar (source pre-filled, target picker, reason field, preview of affected inspections). On confirm, `POST /inspections/bulk-reassign` runs.
5. **Resend / revoke invite:** if the user is in "invited" state (`password_hash` is a sentinel), the row shows "Resend invite" and "Revoke invite" buttons. Both are critical edits, both audit-logged.
6. **Reset password:** "Reset password" action sets a temporary password and (optionally) emails it via `NotificationProvider`. Critical. The user must change it on next login.

#### Audit Log (Admin & Reviewer, v3, post-amendment)

1. Open `/audit-logs` — paginated, filterable
2. Columns: timestamp, actor (`user_id` + role), `table_name.record_id`, action, JSON diff (collapsed by default)
3. Filter bar: table name, record id, date range
4. Read-only; no record-level URLs (IDs only)
5. Contractor builds do not import this route, do not render the link, and have no API permission

### 1.3.5 v3 Additions (summary)

* **PWA Screen — Inspector Dashboard** — assigned inspections now show `scheduled_date` from the schedule when generated by a recurrence schedule.
* **PWA Screen — Structural Evaluation Form** — adds an explicit **"Submit Inspection"** action (FR-13) replacing the previous implicit assumption that sync alone completes an inspection; and a lightweight **"Update Remediation Status"** action on any deficiency the contractor revisits (FR-8).
* **Desktop Screen — Splice Dashboard** — adds an Admin-only **"Reopen"** action on `Approved` inspections (FR-9).
* **Desktop Screen 5 — Scheduling & Calendar (new)** — Admin/Reviewer calendar view of all inspection schedules and generated assignments; supports drag-and-drop reassignment/rescheduling (FR-10).
* **Desktop Screen 6 — System Audit Log (new, Admin and Reviewer)** — read-only, filterable view over `system_audit_logs`. Not visible to, or reachable by, the Contractor role under any navigation path (FR-9). *(Post-amendment: original v3 spec said Admin only; loosened when Reviewer became global.)*

## 1.4 Scope Decisions Log (v3)

Locked in v3, not to be revisited mid-build without an explicit change request:

1. **Client portal:** Out of scope. Clients (mine sites/facility owners) never log in. They receive PDF/Word/Excel deliverables via the Document Publishing Center (signed, time-limited download links and/or email).
2. **Scheduling:** In scope, full calendar (not just auto-recurrence without a UI). See FR-10 and Section 5.
3. **Inspector assignment model:** Per-asset independent assignment only. `inspections.inspector_id` already supports two inspectors holding entirely separate assignments across different structures within the same facility. True joint/team assignment to a single inspection is **not** being built.
4. **Audit log visibility:** Admin and Reviewer. Contractor has no route, button, or API permission that exposes `system_audit_logs`. (Originally Admin-only in v3; loosened when the Reviewer role was promoted to global.)

## 1.5 Target User

Structural engineering consultancies and their contracted field inspectors who:

* Serve multiple client mine sites / processing plants under long-term recurring inspection contracts
* Need an offline-capable mobile tool for field data capture in low-connectivity zones
* Need a desktop / laptop view (the same responsive app, in its desktop layout) for QA review, override of automated risk classifications, and client-facing deliverables
* Operate under multi-tenant SaaS boundaries where cross-client data leakage is a contractual breach

## 1.6 Success Criteria

* Field contractor can capture a full inspection (deficiencies + photos + timesheet) fully offline, then sync without loss after a multi-day offline period
* Approved inspections and their deficiencies are immutable at the database layer (trigger-backed), not just at the API layer
* Cross-tenant queries are blocked by Postgres RLS, not by application-layer `WHERE` clauses alone
* Risk priority (P1–P5) is computed by a single shared function imported identically on client and server; the server's number is always the authoritative one
* Reviewer override of any priority is captured with mandatory justification and is auditable via `system_audit_logs`
* P1 deficiencies trigger email + SMS notifications within the same transaction's after-commit hook — never before commit
* All deliverables (PDF draft/final, Word, Excel) are generated as background jobs with a job id the client polls
* Audit log is Admin- and Reviewer-allowed; Contractor builds have no route, no link, and no API access to it
