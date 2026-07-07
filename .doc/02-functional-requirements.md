# 2. Functional Requirements Specification

## 2.1 System Role Matrix

* **Field Contractor / Inspector** — Single web app, responsive UI; the role's primary device is a phone in the field, but the same user can use a laptop and get the same functional experience (responsive layout adapts to the larger viewport). Scoped to clients in `client_memberships`. Views assigned structures, logs deficiencies, triages carry-forward defects, logs time. Can call `POST /auth/switch-client` to switch between clients they hold a membership for, without logging out (post-amendment — see FR-1.3). Has a per-user 6-digit access PIN set at profile setup for offline recovery (FR-14).
* **Engineering Reviewer** — Single web app, responsive UI; the role's primary device is a laptop, but the same routes and screens work on a phone. Global/cross-tenant (bypasses `client_memberships` like Admin). Reads across all projects, edits/overrides matrix entries (with mandatory justification), approves/returns inspections, verifies remediation closure (FR-8), manages picklists (FR-11), compiles reports, and reads the audit log. Can call `POST /auth/switch-client` to set the active client context in the UI. Cannot reopen an approved inspection.
* **System Administrator** — Global role, bypasses `client_memberships` entirely. Onboards clients, runs imports, manages users, can act as any client via "switch client." Has all Reviewer capabilities plus admin-only routes (Users, Audit Log, Reopen, Reset PIN).

> **Post-amendment (switch-client for all roles):** Admin, Reviewer, and Contractor can all call `POST /auth/switch-client` without logging out. Admin/Reviewer: any client. Contractor: limited to clients in their `client_memberships` rows. See FR-1.3.

v3 extensions:

* Contractor (v3) — additionally submits inspections explicitly (FR-13) and updates remediation status on deficiencies they're aware of (FR-8), but cannot verify-close a remediation.
* Reviewer (v3) — additionally manages component/work-type picklists (FR-11) and verifies remediation closure (FR-8). Can read the audit log (FR-9.3, post-amendment). **Cannot** reopen an approved inspection.
* Admin (v3) — additionally reopens approved inspections and is the only role with audit log access.

## 2.2 Core Functional Requirements Blocks (FR)

### FR-1: Global Client Context & Isolation

* **FR-1.1:** Every tenant-scoped table carries a denormalized `client_id`. All endpoints enforce isolation via Postgres Row-Level Security using a per-request session variable (ADR-006) — isolation is enforced at the database layer, not just in application code, so a missed `WHERE` clause cannot leak cross-tenant data.
* **FR-1.2:** Switching clients in the desktop header (Admin/Reviewer) or in the PWA app bar (Contractor) calls `POST /auth/switch-client`, which reissues an access token carrying the new `active_client_id` claim and forces a full state refresh on the client. *Post-amendment:* originally "Admin only"; now also available to Reviewer (when promoted to global) and to Contractor (limited to their membership list — see FR-1.3).
* **FR-1.3 (post-amendment):** All authenticated roles can call `POST /auth/switch-client` to set a new `active_client_id` and reissue the access token, without logging out.
  - **Admin** — can switch to any client (no membership check; bypasses `client_memberships`).
  - **Reviewer** — can switch to any client (global/cross-tenant, no membership check).
  - **Contractor** — can switch only to a client they hold an active `client_memberships` row for. If the requested `client_id` is not in their membership list, the server returns `403 NOT_A_MEMBER`, the access token is unchanged, and the attempt is audit-logged. The UI's client switcher in the PWA app bar only lists clients the Contractor is a member of — the server-side check is defense in depth, not the primary filter.
  - If a user holds membership in multiple clients, login still presents a client picker before token issuance (the picker is the initial switch, not a re-prompt on every login).

### FR-2: Sandbox Data Ingestion

* **FR-2.1:** Admin uploads a CSV. The server creates one `import_batches` row and one `import_rows` row per CSV line (raw JSON), each independently validated against the schema in Section 8.4 of v2.
* **FR-2.2:** Required CSV columns: `site_name, structure_asset_tag, structure_description, project_title`. Rows missing required fields, or referencing a site/project that doesn't resolve, are flagged `Invalid` with a machine-readable reason in `validation_errors` and are **not** committed.
* **FR-2.3:** Committing a batch (`POST /imports/batches/:id/commit`) is itself an atomic transaction: either all `Valid` rows are inserted as permanent `structures`/`sites`/`projects` rows, or none are, mirroring the sync atomicity rule (ADR-005).

### FR-3: Field Form Capture & Coordinate Controls

* **FR-3.1:** Field forms enforce standard validation (Section 6 Zod contracts) on-device before queuing to the outbox, and again server-side on sync — never trust client-only validation.
* **FR-3.2 (replaced by FR-16 in v3):** Replaced by FR-16 — Inspection Capture Mode. Inspector declares the mode (`onsite` or `post_inspection`) at the start of an inspection; in `post_inspection` mode the PWA does not call the Geolocation API for any deficiency on that inspection. GPS fields default to null in `post_inspection` mode; the inspector can still enter them by hand. See FR-16 for the full rule.

### FR-4: Risk Assessment Matrix Operations

* **FR-4.1:** Priority is calculated from `severity (1–5) × probability (1–5) × consequences (1–5)`. See Section 8.3 of v2 for the exact formula and tier bands. This calculation lives in `shared/utils/riskCalculator.ts` and is imported identically by the mobile client (for live UI feedback) and the API server (as the authoritative recheck on sync) — the client's number is always advisory; the server's number is the one persisted.
* **FR-4.2:** Any deficiency whose calculated tier is `P1` triggers `notifyP1Deficiency()` (Section 8.5 of v2), which dispatches an email (via the `NotificationProvider` Resend adapter) to the client's registered safety contact and an SMS (via the `NotificationProvider` MessageBird adapter) to the assigned Reviewer, within the same database transaction's after-commit hook (fire only after the sync transaction commits, never before).

### FR-5: Timesheet & Review Workflows

* **FR-5.1:** Contractors manage daily labor logs in `Draft` status. Submitting (`POST /timesheets/:id/submit`) locks the row from further device edits; only a Reviewer/Admin can move it to `Approved` or `Rejected` (with `rejection_reason`).
* **FR-5.2:** Reviewers overriding a calculated priority must supply `reviewer_justification`. The system additionally preserves `original_priority` and stamps `overridden_by`/`overridden_at` so overrides are auditable without depending on free-text alone.

### FR-6 (v2): Inspection Assignment & Carry-Forward

* **FR-6.1:** Only Admin/Reviewer can create an inspection assignment (`POST /inspections`), which sets `inspector_id`, `assigned_by`, `assigned_at`, and status `Assigned`.
* **FR-6.2:** When an inspector opens a structure with prior deficiency history, the app surfaces unresolved historical records (`triage_state IN ('New','Still Outstanding','Worsened')`) and requires a triage decision per record. Choosing anything other than "create new, unrelated" sets `previous_deficiency_id` on the new record, forming an auditable chain.

### FR-7 (v2): Inspection Approval

* **FR-7.1:** A Reviewer/Admin approves a `Submitted` inspection via `POST /inspections/:id/approve`, which sets status `Approved`, `approved_by`, `approved_at`. This is the action that activates the immutability trigger in Section 5 of v2 — approval is the only path into the `Approved` state.

### FR-8 (v3): Remediation Tracking & Close-Out

* **FR-8.1:** Every `deficiency_records` row carries a `remediation_status` independent of `triage_state`. `triage_state` describes how a *newly logged* record relates to history found during a fresh inspection visit. `remediation_status` describes the *active, ongoing* lifecycle of getting a known defect fixed, and can change at any time — not only when someone happens to re-inspect that structure.
* **FR-8.2:** Lifecycle: `Open → Remediation_Scheduled → Remediated_Pending_Verification → Verified_Closed`. Any authenticated user scoped to that client can advance a record to `Remediation_Scheduled` or `Remediated_Pending_Verification` (optionally attaching a `remediation_evidence`-purposed photo). Only a Reviewer/Admin can set `Verified_Closed`, and doing so requires at least one attached photo tagged `remediation_evidence` — a defect cannot be marked closed on someone's word alone.
* **FR-8.3:** `Verified_Closed` deficiencies remain immutable once their parent inspection is `Approved`, same as any other field, per the existing immutability trigger.

### FR-9 (v3): Reopening Approved Records & Audit Log Access

* **FR-9.1:** Admin-only. `POST /inspections/:id/reopen` moves an `Approved` inspection to either `Submitted` (admin/reviewer fixes something directly without re-involving the field) or `Returned` (sent back to the contractor), and requires a non-empty `reason`. This is the only path that exits the `Approved` state once entered.
* **FR-9.2:** The reopen action, the reason, and the actor are stored directly on `inspections` (`reopened_by`, `reopened_at`, `reopen_reason`) — not only inside the generic audit log's JSONB — so it's directly queryable without log-mining.
* **FR-9.3 (post-amendment):** `GET /audit-logs` is Admin- and Reviewer-allowed. Contractor tokens receive `403 Forbidden` regardless of how the request is constructed; this is enforced at the route-middleware layer, not just hidden in the UI. (Original v3 rule was Admin-only, loosened when the Reviewer role was promoted to global; see `01-project-overview.md` §1.4 #4.)

### FR-10 (v3): Inspection Scheduling & Calendar

* **FR-10.1:** A `Recurring` project's structures can have an `inspection_schedules` row defining a default inspector and a recurrence interval in days. A daily background job generates the next `inspections` row once its due date falls inside a configurable lead-time window (default 14 days), so it's visible/assignable before it's actually due — and advances the schedule's `next_due_date`.
* **FR-10.2:** The job is idempotent: it never generates a second inspection for the same schedule occurrence if one already exists (checked by `schedule_id` + `scheduled_date` pair).
* **FR-10.3:** Admin/Reviewer can view a calendar (`GET /inspections/calendar`) across all assigned and scheduled-but-not-yet-generated inspections, and can drag-and-drop to reschedule or reassign via `PATCH /inspections/:id/schedule`.
* **FR-10.4 (default, flagged for confirmation):** Recurrence is modeled as a simple fixed interval in days (e.g., every 90 days), not full calendar-rule recurrence. If true calendar-rule recurrence is required, this needs to change before Sprint 5 starts (see ADR-011 in Section 3).

### FR-11 (v3): Managed Picklists for Component & Work Type

* **FR-11.1:** `deficiency_records.component` and `timesheet_entries.work_type` are no longer free text. Each client gets its own `component_types` and `work_types` tables, seeded from a standard default library at client creation, and editable afterward by Admin/Reviewer.
* **FR-11.2:** Entries are never hard-deleted (to preserve referential integrity on historical records) — only deactivated (`is_active = false`), which removes them from new-entry dropdowns without breaking past data.
* **FR-11.3:** A `component_notes` free-text field remains available alongside the picklist selection, for inspector detail that doesn't belong in a standardized label.

### FR-12 (v3): Expanded Notification Coverage

* **FR-12.1 (post-amendment):** Beyond the existing P1 alert (FR-4.2), the system now also notifies: the assigned inspector when an inspection is created (`POST /inspections`); all Reviewers (and Admins, when applicable) when an inspection is submitted (`POST /inspections/:id/submit`) — since Reviewer is global, this is a global fan-out, not a per-client fan-out; and the assigned inspector when their inspection is returned (`POST /inspections/:id/return`).
* **FR-12.2:** All notifications continue to route through the single `NotificationProvider` interface from v2 Section 8.5 — no new provider integrations were introduced for this.

### FR-13 (v3): Explicit Inspection Submission

* **FR-13.1:** `POST /inspections/:id/submit` (Contractor) is the action that moves an inspection from `Assigned`/`In Progress` to `Submitted`. This was previously left implicit in v1/v2 (the status existed; nothing produced it). The endpoint requires either at least one synced deficiency record, or an explicit `no_deficiencies_found: true` flag in the request — an inspector must affirmatively state "I checked, there's nothing to report," rather than an empty inspection looking identical to one nobody started.

### FR-14 (v3): Offline PIN Fallback for Forgotten Passwords

* **FR-14.1 (motivation):** Inspectors may arrive at a remote site with no network connectivity and a forgotten password. With no prior session in Dexie's `authState` table, the PWA cannot authenticate them by any purely-cryptographic means (no shared secret on either side). To prevent operational lockout, the inspector sets a per-user **access PIN** at profile setup. After 3 consecutive failed password attempts on `/login`, the PWA offers the PIN as a fallback. The PIN grants strictly limited offline access — never a full session, never a sync of new data.

* **FR-14.2 (PIN shape):** 6-digit numeric PIN, set during the contractor's profile setup, changeable later from `/profile`. Stored on the server as `pin_hash` (Argon2id) and `pin_set_at` on the `users` row. No expiry (post-amendment). Admin can revoke via `PATCH /users/:id` (sets `pin_hash = NULL`).

* **FR-14.3 (fallback trigger):** After exactly 3 consecutive failed `POST /auth/login` attempts within a 15-minute sliding window, the `/login` screen surfaces a "Use access PIN" link. Tapping it transitions to a PIN entry view. Failed password attempts counter is reset on a successful password login or a successful PIN entry.

* **FR-14.4 (PIN entry):** `POST /auth/pin-fallback` (body: `{ email, pin }`) returns a `pin_fallback_token` — a long opaque random string (256 bits) — plus the same `{ access_token, refresh_token, active_client_id }` triple as a normal login, but with a `mode: "pin_fallback"` claim on the access token. Server-side rate limit: 5 attempts per email per hour, then 1-hour lockout (no PIN or password attempts for that email). Failed attempts are audit-logged with the source IP.

* **FR-14.5 (PIN-mode restrictions, enforced client-side AND server-side):**
  - The PWA's last-cached reference data (structures, sites, prior deficiencies, assigned inspections) is fully readable offline — no server round-trip needed.
  - The PWA may write new deficiency / timesheet / photo records to a separate **`pin_outbox`** Dexie table (not the regular outbox). These records are tagged `pin_mode: true`.
  - **The PWA does not call `/sync/push-outbox` for `pin_outbox` records.** All sync APIs return `423 LOCKED_PIN_FALLBACK_ACTIVE` for tokens carrying `mode: "pin_fallback"`. The PWA surfaces this clearly in the app bar: "Offline access only — new entries will sync after password reset."
  - `/auth/refresh` is also blocked for `pin_fallback` tokens (`423 LOCKED_PIN_FALLBACK_ACTIVE`).
  - The access token is otherwise valid for read-only access to last-cached data; no write to server, no refresh, no token rotation.

* **FR-14.6 (recovery to normal mode):** The inspector must complete a successful `POST /auth/login` (real password) to exit PIN mode. The server's response on the first successful real-password login after a `pin_fallback` token was issued:
  1. Marks the previous `pin_fallback` token as consumed in the audit log
  2. Returns the normal token pair
  3. On the **next** `/sync/push-outbox` call (which will now succeed), the PWA uploads the `pin_outbox` records. Each record is audit-logged as `pin_mode: true` and visibly flagged in the Splice Dashboard as "captured in PIN-fallback mode — please verify"
  4. The PWA clears the `pin_outbox` table on successful sync

* **FR-14.7 (admin recovery path):** If the inspector forgets both password and PIN, an Admin can `PATCH /users/:id/reset-pin` (sets `pin_hash = NULL`, `must_set_pin = true`). On the inspector's next successful real-password login, the PWA forces a PIN re-setup before granting normal access.

* **FR-14.8 (audit):** Every `POST /auth/pin-fallback` attempt (success or failure) writes a `system_audit_logs` row with `table_name: 'users'`, `record_id: <user_id>`, `action: 'PIN_FALLBACK_ATTEMPT'`, `new_values: { success, source_ip }`. Admin and Reviewer can read these in the audit log.

### FR-15 (v3): Edit Operations

The v2 spec defined `POST` (create) and `GET` (read) for most resources but left edit capabilities as a gap. v3 closes the gap with an **action-endpoint model** — there is no generic `PATCH /:id`; each kind of edit is a named endpoint with an explicit request body, role gate, and audit-log policy. This keeps the API surface predictable and makes role and audit behavior obvious from the route alone.

#### FR-15.1: Critical vs cosmetic edits

Edits fall into two categories, distinguished by whether they change the record's *authoritativeness* (who can act on it, what it claims about the world) or only its *metadata* (descriptions, captions, display order).

- **Critical edits** — write a `system_audit_logs` row capturing `{ actor_user_id, table_name, record_id, action, old_values, new_values, source_ip, at }`. Visible to Admin and Reviewer via the audit log screen.
- **Cosmetic edits** — no audit log row. Tracked only via `updated_at` and (where applicable) the existing per-table timestamp trigger.

The full critical/cosmetic mapping:

| Edit | Category |
|---|---|
| Reassign inspection to a different inspector | Critical |
| Change `inspections.status` (Submit / Return / Approve / Reopen) | Critical |
| Edit `users.role` | Critical |
| Edit `client_memberships` (add or remove a user) | Critical |
| Deactivate a user (`is_active = false`) | Critical |
| Reset a user's password (admin path) | Critical |
| Reset a user's PIN | Critical |
| Edit user profile fields (name, phone) | Critical |
| Edit `structures.asset_tag`, `description`, `qr_code_value` | Critical |
| Edit `sites.name`, `iana_timezone` | Critical |
| Edit `projects.title`, `due_date`, `type` | Critical |
| Edit `clients.name`, `safety_contact_email` | Critical |
| Edit a deficiency's `description`, `severity`, `probability`, `consequences` (while not Approved) | Critical |
| Resend an invite | Critical |
| Revoke an invite | Critical |
| Edit photo `caption`, `display_order`, `purpose` | Cosmetic |
| Edit `deficiency_records.component_notes` | Cosmetic |
| Edit `users.full_name` (display name, not the role/email) | Cosmetic |
| Edit timesheet `work_type_id` or `hours_logged` (while Draft) | Cosmetic |

#### FR-15.2: Edit-while-Approved policy

Approved inspections and their deficiencies are immutable at the database layer (existing trigger `trg_lock_approved_records`). To fix any post-approval issue, the Admin must:

1. `POST /inspections/:id/reopen` (FR-9) — moves the inspection to `Submitted` or `Returned`, requires a non-empty `reason`
2. Edit the affected fields
3. `POST /inspections/:id/approve` (FR-7) — re-approves

There is **no `PATCH /inspections/:id/correct-approved` shortcut**. The reopen → edit → re-approve flow is the only path, and every step is audit-logged (reopen reason, each edit, re-approval). This is the trade-off for the immutability guarantee on approved records.

#### FR-15.3: New action endpoints

All endpoints use the existing patterns: Zod schema for the request body, role-gate middleware, audit log row on critical edits. Existing endpoints are extended (e.g. `PATCH /users/:id` gains new actions) rather than replaced.

| Method & Path | Role | Critical? | Purpose |
|---|---|---|---|
| `PATCH /users/:id` (extended) | Admin | mixed | Existing endpoint now accepts: `email`, `phone_number`, `full_name`, `role`, `is_active`, `client_memberships` (add/remove). `role`/`is_active`/`client_memberships` changes are critical; `full_name` is cosmetic. |
| `POST /users/:id/resend-invite` | Admin | Critical | Resends the invite email via the `NotificationProvider` Resend adapter. Only valid when the user has not yet activated (`password_hash` is set to a sentinel "INVITED" value, or a separate `invited_at` column is non-null). |
| `POST /users/:id/revoke-invite` | Admin | Critical | Marks the invite as revoked. The user can no longer complete `POST /auth/invite/activate` for that token. Does not delete the user row. |
| `POST /users/:id/reset-password` (admin path) | Admin | Critical | Admin sets a temporary password (returned in the response once, and emailed to the user via the `NotificationProvider`). The user must change it on next login. Audit-logged with the actor and reason. |
| `PATCH /users/:id/reset-pin` (already exists) | Admin | Critical | From FR-14.7. Listed here for completeness. |
| `PATCH /clients/:id` (extended) | Admin | Critical | Existing endpoint now accepts: `name`, `safety_contact_email`. |
| `PATCH /sites/:id` | Admin, Reviewer | Critical | Edit `name`, `iana_timezone`. |
| `PATCH /projects/:id` (extended) | Admin, Reviewer | Critical | Existing endpoint now accepts: `title`, `due_date`, `type`. |
| `PATCH /structures/:id` | Admin, Reviewer | Critical | Edit `asset_tag`, `description`, `qr_code_value`. `qr_code_value` unique-constraint violations return `409 QR_CODE_ALREADY_IN_USE`. |
| `PATCH /inspections/:id/reassign` | Admin, Reviewer | Critical | Reassigns `inspector_id`. Optionally updates `scheduled_date` (separate from `PATCH /:id/schedule` which is the calendar drag-and-drop). Audit-logged with old and new inspector. |
| `PATCH /deficiencies/:id` (extended) | Reviewer, Admin (or its author if `triage_state` is still `New` and the parent inspection is not Approved) | Critical | Edit `description`, `severity`, `probability`, `consequences`. The server re-runs `calculatePriorityTier` and updates `calculated_priority`. Original priority and override fields are not touched. `component_type_id`, `component_notes`, `remediation_status`, `triage_state` are edited via dedicated endpoints (FR-15.4). |
| `PATCH /deficiencies/:id/component-notes` | any client-scoped role | Cosmetic | Edit `component_notes` only. |
| `PATCH /photos/:id` | its author or Reviewer/Admin | Cosmetic | Edit `caption`, `display_order`, `purpose` (toggling between `deficiency_evidence` and `remediation_evidence`). |
| `PATCH /timesheets/:id` | its author (only while status is `Draft`) | Cosmetic | Edit `work_type_id`, `hours_logged`. Once `Submitted`, only a Reviewer/Admin can edit, and the change is critical. |

#### FR-15.4: Status transitions and existing endpoints

The lifecycle status transitions on `inspections` (`Assigned` → `In Progress` → `Submitted` → `Returned`/`Approved`) and on `deficiencies.remediation_status` are already covered by the existing FR-7, FR-8, FR-9, FR-13 endpoints. FR-15 does not duplicate them — it adds only the missing edit operations listed above.

The picklist rename/deactivate (`PATCH /component-types/:id`, `PATCH /work-types/:id`) and the schedule editor (`PATCH /schedules/:id`) are already in the spec and treated as critical (rename = critical, deactivate = cosmetic).

#### FR-15.5: Audit helper

A single helper is added to standardize the audit write:

```typescript
// apps/api-server/src/services/audit.ts
export async function auditEdit(
  pool: Pool,
  args: {
    actorUserId: string;
    tableName: string;
    recordId: string;
    action: string;       // e.g. 'INSPECTION_REASSIGN', 'USER_ROLE_CHANGE'
    oldValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
  }
): Promise<void> {
  await pool.query(
    `INSERT INTO system_audit_logs
       (table_name, record_id, action, old_values, new_values, performed_by, source_ip)
     VALUES ($1, $2, $3, $4, $5, $6, current_setting('app.request_source_ip', true))`,
    [
      args.tableName,
      args.recordId,
      args.action,
      JSON.stringify(args.oldValues),
      JSON.stringify(args.newValues),
      args.actorUserId,
    ]
  );
}
```

Every action-endpoint that performs a critical edit calls `auditEdit` inside the same transaction as the data write. Cosmetic edits do not call it.

#### FR-15.6: Frontend surfacing

- Each editable resource gets an "Edit" button on its detail view. Clicking it opens an inline edit form (no modal — the v3 spec keeps modals out except for irreversible actions).
- Inline forms validate via the same Zod schema as the server (re-imported from `contracts/`). The submit button is disabled until the form is valid and dirty.
- Cancel reverts to the original values. Save shows a toast on success and rolls back on error.
- For the `PATCH /inspections/:id/reassign` action, the UI shows a small role-picker (Admin and Reviewer can both see the contractor list scoped to the client) and a confirmation dialog because reassignment is critical.

### FR-16 (v3): Inspection Capture Mode (On-site vs Post-Inspection)

* **FR-16.1 (motivation):** GPS coordinates on a deficiency record are useful evidence ("this was the broken gusset plate at coordinates X") only when the inspector was actually on-site when they logged the record. Auto-capturing GPS on a post-inspection record (logged from the office the next day) silently misrepresents the location. To prevent this, the inspector declares the capture mode at the start of every inspection, and that declaration governs how GPS is captured for every deficiency on that inspection.

* **FR-16.2 (two modes):**
  - **`onsite`** — The inspector is physically at the structure when the inspection is in progress. The PWA reads the device's Geolocation API and auto-populates `gps_latitude` / `gps_longitude` on every deficiency record created under the inspection. The inspector can manually override the auto-populated values, or clear them (set null), per deficiency.
  - **`post_inspection`** — The inspector is logging the inspection after the fact, from any location. The PWA **does not call the Geolocation API at all** for any deficiency on this inspection. The GPS fields are null by default. The inspector can still manually enter coordinates on a per-deficiency basis (e.g. they remember the structure was at roughly X), but the auto-capture is suppressed.

* **FR-16.3 (declaration timing):** The mode is declared at the start of an inspection, before any deficiency is logged. The PWA's `Structural Evaluation Form` opens with a mode picker (defaulting to whatever the inspector used for their last inspection). The mode is recorded on the `inspections` row as `inspection_mode inspection_mode_enum NOT NULL DEFAULT 'onsite'` (new enum). Changing the mode after the first deficiency is logged is blocked at the API and UI levels (would invalidate the GPS semantics on already-logged records).

* **FR-16.4 (UI behavior):**
  - In `onsite` mode, the GPS fields on each deficiency card show a "📍 Capturing…" indicator and the auto-populated values, which the inspector can edit.
  - In `post_inspection` mode, the GPS fields on each deficiency card show a "GPS not auto-captured (post-inspection mode)" muted hint, and the Geolocation API is not invoked. The inspector can still tap the field and enter coordinates by hand.
  - The mode picker is shown at the top of the Structural Evaluation Form, before the first deficiency. A change after a deficiency is logged surfaces a confirmation dialog and is blocked.

* **FR-16.5 (mode edit policy):** Changing the `inspection_mode` is forbidden after the first deficiency is logged (FR-16.3). Before any deficiency exists, an Admin can `PATCH /inspections/:id/inspection-mode` (cosmetic, no audit row) to fix a misclick.

* **FR-16.6 (no other effect on capture):** The mode only affects GPS. Photo EXIF capture, photo upload, and the PWA's other behavior is unchanged in either mode. The risk-matrix live preview still uses the shared `riskCalculator.ts` in both modes. The only difference is whether the Geolocation API is called.

### FR-17 (v3): Timesheet Entry Date Capture and Pre-Inspection Flag

* **FR-17.1 (motivation):** Inspectors sometimes log timesheet hours before the inspection date — e.g. an inspector flying to a remote site the day before, or doing prep work the evening before the field visit. These pre-inspection hours are legitimate, but they need to be visibly flagged so the reviewer can confirm they were genuinely prep/travel time and not a misdated record.

* **FR-17.2 (entry date):** Every `timesheet_entries` row carries an `entry_date` DATE (not just `created_at`). The default is today's date, but the inspector can pick any past or future date when logging a new entry. The PWA's timesheet form has a date picker; the desktop portal's form has the same.

* **FR-17.3 (pre-inspection flag, automatic):** On save, the server compares the new entry's `entry_date` to its parent `inspections.scheduled_date` (for inspections with a schedule) or to the inspection's `assigned_at` (for one-off inspections). If `entry_date` is earlier than the parent inspection date, the server sets `pre_inspection BOOLEAN NOT NULL DEFAULT FALSE` to `TRUE` and writes the timesheet row with that flag.

* **FR-17.4 (UI surfacing of the flag):** In the timesheet list and the Splice Dashboard's timesheet panel, any entry with `pre_inspection = TRUE` is rendered with a yellow left-border and an inline "Logged before inspection date" tag. The flag is not blocking; the inspector can submit and the reviewer can approve. The reviewer sees the flag and can either approve normally or use the existing `POST /timesheets/:id/reject` to bounce it back with a `rejection_reason`.

* **FR-17.5 (no other effect):** The pre-inspection flag is informational only. It does not block submission, does not require additional fields, and does not change the risk priority or any other calculation. Its sole purpose is to surface a question the reviewer would otherwise have to ask ("why was this entry dated before the inspection?").

* **FR-17.6 (audit):** Setting or clearing the `pre_inspection` flag is automatic and not audit-logged separately. (The timesheet entry itself is audit-logged when it is created via `POST /timesheets`, per FR-5; the flag is a derived field, not a state transition.)

### FR-18 (v3): Reassignment Notifications and Bulk Reassign

* **FR-18.1 (motivation):** When an inspector is on leave, disengaged, or has left the firm, the Admin needs to move their open inspections to another inspector. The existing `PATCH /inspections/:id/reassign` (FR-15) handles one inspection at a time and notifies only the *new* inspector (FR-12.1). It does not notify the *old* inspector, and there is no way to reassign many inspections at once. v3 closes both gaps.

* **FR-18.2 (notify the old inspector, but not the new one's identity):** Every successful `PATCH /inspections/:id/reassign` (and every row of a `POST /inspections/bulk-reassign`) sends a notification to the previous inspector's user account. The notification:
  - Includes the inspection's structure, project, and scheduled date — enough for the inspector to identify what they were working on
  - Includes the `reason` field from the request body (if provided)
  - **Does not include the name, email, or user_id of the new inspector** — the inspector is told the inspection has been reassigned, not to whom
  - Subject line: "Your inspection has been reassigned"
  - Body template: "Your inspection for [structure_name] on [scheduled_date or today] has been reassigned. Reason: [reason or 'no reason provided']. Contact your admin for details."
  - Routes through the same `NotificationProvider` Resend adapter used for invites and P1 alerts (no new provider integration)

* **FR-18.3 (bulk reassign endpoint):**

  ```
  POST /api/v1/inspections/bulk-reassign
  Body: {
    source_inspector_id: UUID,                  // the inspector being moved off
    target_inspector_id: UUID,                  // the inspector receiving the work
    inspection_ids?: UUID[],                    // if omitted, all open inspections under the source inspector for the Admin's active client
    reason?: string                             // ≤ 500 chars; included in the old-inspector notification
  }
  ```

  - **Role:** Admin or Reviewer (Reviewer is global/cross-tenant, so they can bulk-reassign across clients; Admin is per-client, so the inspection list is implicitly scoped to the Admin's active client via `asTenant`).
  - **Behavior:**
    1. If `inspection_ids` is omitted: select all inspections where `inspector_id = source_inspector_id` AND `status IN ('Assigned', 'In Progress', 'Submitted')` AND `client_id` matches the Admin/Reviewer's active client. Capped at 100 inspections per call (anything larger is rejected with `413 BULK_REASSIGN_LIMIT_EXCEEDED` and a hint to use multiple calls or scope to specific IDs).
    2. The target inspector must be a current `is_active = true` member of the same client. If the target is invalid, return `422 TARGET_INSPECTOR_INVALID`.
    3. The target inspector must have a different `user_id` than the source. Self-reassign is rejected with `422 SOURCE_EQUALS_TARGET`.
    4. The reassignment is performed in **one transaction**: every inspection is updated and every audit row is written atomically. If any single update fails (e.g. one inspection is `Approved` and would need a reopen), the entire batch rolls back. The endpoint returns `409 INSPECTION_APPROVED_USE_REOPEN` with the list of offending inspection IDs in the response.
  - **Audit:** one `system_audit_logs` row per inspection in the batch, action `INSPECTION_BULK_REASSIGN`, capturing `actor_user_id`, the old and new `inspector_id`, and the `reason`.
  - **Notifications:** one notification to the *old* inspector summarizing the batch ("N inspections you were assigned have been reassigned. Reason: [reason]."), and one notification to the *new* inspector ("You have been assigned N new inspections."). Per FR-18.2, the old inspector's notification does not include the new inspector's name.

* **FR-18.4 (no "unavailable" state on `users`):** A user is either active (`is_active = true`, set via `PATCH /users/:id`) or deactivated. There is no "On Leave" or "Disengaged" intermediate state. An inspector who is briefly unavailable can be reassigned away from; if they are leaving the firm, Admin deactivates them. The bulk-reassign flow does not require or set any per-user "unavailable" flag.

* **FR-18.5 (front-end behavior):**
  - On the **Calendar** screen (Admin/Reviewer), an inspector row header has a small "Move all open work…" button. Clicking it opens a dialog with: source inspector pre-filled (the row's inspector), target inspector picker (Contractor list scoped to the active client), reason field (optional, max 500 chars), and a preview of the affected inspections. Admin/Reviewer confirm → endpoint runs.
  - On the **User management** screen (Admin), each row has a "Reassign open work to…" action. Clicking it opens the same dialog, with the user pre-selected as source.
  - Both dialogs show a success summary: "N inspections reassigned from [source] to [target]. N notifications sent." (numbers only, no inspector names shown to anyone reading the success message)
  - If the endpoint returns `409 INSPECTION_APPROVED_USE_REOPEN`, the dialog shows the list of inspection IDs and instructs: "Reopen the inspection first, then retry."

## 2.3 Features In Scope

* Multi-tenant client/membership model with RLS-enforced isolation
* Offline-first mobile PWA (Dexie/IndexedDB) for field inspectors
* Sandbox CSV import (staging tables) for bulk site/structure setup
* Asset register with QR/barcode scan lookup
* Inspection assignment, execution, submission, return, approval
* Deficiency capture with severity × probability × consequences risk matrix
* Carry-forward triage with auditable chain (`previous_deficiency_id`)
* Timesheet submission, review, and approval/rejection
* Override of calculated priority with mandatory justification (v2)
* Remediation lifecycle with photo-evidence gate (v3)
* Inspection scheduling and calendar with drag-and-drop reassignment (v3)
* Managed picklists for component type and work type (v3)
* Admin-only reopen of approved inspections (v3)
* Admin-only audit log with immutable trail
* PDF (draft watermarked + final) / Word / Excel report generation as background jobs
* P1 deficiency email (Resend) + SMS (MessageBird) within after-commit hook
* Photo capture with EXIF metadata extraction, stored in Postgres as legal record (Cloudinary is rendering layer only)

## 2.4 Features Out of Scope

* Client portal — clients (mine sites/facility owners) never log in. Deliverables only (email/download).
* True joint / team assignment of multiple inspectors to a single inspection — per-asset independent assignment is sufficient.
* Calendar-rule recurrence (RRULE/iCal) — fixed-interval days only, by default. Re-evaluate in a future sprint if required.
* Live agent feed, real-time log streaming
* Mobile app (native) — PWA only
* Payment or subscription system
* Multi-language localization
