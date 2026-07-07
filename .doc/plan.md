# StructApp Unified Architecture & Design Blueprint — v3

---

## 0. Revision Notes

### 0.1 v1 → v2 Changelog (for reference)
v2 closed 23 structural gaps in v1: missing auth fields, undefined tenant scoping, an undefined risk formula, missing approval/audit mechanisms, an incomplete API surface, no chosen reporting/notification libraries, vague CSV import handling, no JWT strategy for offline workers, and several schema/data-integrity gaps. Full detail lives in the v2 document; not repeated here.

### 0.2 v2 → v3 Changelog (this revision)
v3 closes the product-completeness gaps identified after the technical review, plus locks in three scope decisions:

| # | Item | Resolution in v3 |
|---|---|---|
| 1 | No remediation/close-out loop | Added `remediation_status` lifecycle on `deficiency_records`, independent of re-inspection triage |
| 2 | No way to fix an erroneously approved record | Added Admin-only `/inspections/:id/reopen` workflow |
| 3 | Free-text `component`/`work_type` fields | Replaced with per-client managed picklists (`component_types`, `work_types`) |
| 4 | Notifications only covered P1 deficiencies | Added assignment, submission, and return notifications |
| 5 | No explicit "submit inspection" action | Added `POST /inspections/:id/submit` (this was a silent gap — status enum had `Submitted` but no endpoint produced it) |
| 6 | "Recurring" project type had no logic | Added full scheduling system: `inspection_schedules`, a recurrence-generation job, and a calendar view |
| 7 | Client portal — undecided | **Decided: out of scope.** Deliverables only (email/download), no client login. |
| 8 | Audit log access — undecided | **Decided (v3):** Admin and Reviewer allowed. Contractor cannot read `system_audit_logs`. *(Original v3 decision was Admin-only; loosened post-amendment when the Reviewer role was promoted to global.)* |
| 10 | Contractor client switching | **Decided (v3):** All roles can call `POST /auth/switch-client` without logging out. Admin/Reviewer: any client. Contractor: limited to their `client_memberships` rows, server-validated with `403 NOT_A_MEMBER` otherwise. *(Original v2 said Admin-only; original v3 said Contractor cannot switch. Current rule: switch for everyone, membership check for Contractor.)* |
| 11 | Forgotten password with no network | **Decided (v3):** Per-user 6-digit access PIN, set at profile setup, no expiry. After 3 failed password attempts, `/login` offers PIN entry. PIN-mode token is read-only and offline-only (`423 LOCKED_PIN_FALLBACK_ACTIVE` on all writes/refresh); new data goes to a separate `pin_outbox` and is held locally until a real-password login completes. Argon2id hashing. See FR-14. |
| 12 | Edit operations for users, structures, sites, projects, photos, timesheets, deficiencies | **Decided (v3):** Action-endpoint model — no generic `PATCH /:id`. Each edit is a named endpoint with an explicit Zod schema, role gate, and critical/cosmetic flag. Critical edits are audit-logged (reassignments, role/membership edits, deactivations, password resets, profile field changes, structure/asset tag edits, status transitions); cosmetic edits are not (photo caption, display order, component notes, full_name, timesheet fields while Draft). Edit-while-Approved is the reopen → edit → re-approve flow (no shortcut endpoint). See FR-15. |
| 13 | GPS auto-capture in post-inspection records | **Decided (v3):** Inspector declares capture mode (`onsite` or `post_inspection`) at the start of every inspection. In `post_inspection` mode, the PWA must not call the Geolocation API for any deficiency; GPS fields default to null and can be entered by hand. Mode is locked after the first deficiency is logged. See FR-16. |
| 14 | Timesheet hours logged before the inspection date | **Decided (v3):** Timesheet entries capture an `entry_date` (not just `created_at`). The server auto-derives `pre_inspection = true` when `entry_date < inspections.scheduled_date` (or `assigned_at` for one-offs). The flag is informational only — yellow left-border + "Logged before inspection date" tag in the Splice Dashboard. Reviewer can approve or reject. See FR-17. |
| 15 | Inspector on leave / disengaged from contract — reassignment flow | **Decided (v3):** No "unavailable" state on `users`. Admin uses the existing `PATCH /inspections/:id/reassign` per inspection, or the new `POST /inspections/bulk-reassign` (cap 100, atomic, audit-logged per row). The previous inspector receives a notification on every reassign (no new inspector's name in the body, includes the `reason` field). See FR-18. |
| 9 | Multi-inspector per inspection — undecided | **Decided: not needed.** Per-asset independent assignment (already supported natively) is sufficient; true joint/team assignment is explicitly out of scope. |

---

## 1. Project Overview & Context Bounds

### 1.1 High-Level Project Summary
*(Unchanged from v2.)* StructApp is a multi-tenant enterprise solution for structural engineering asset registers, field condition evaluations, and workforce tracking — enabling offline-first field audits in remote zones and centralized administrative review/reporting.

### 1.2 Platform Core Boundaries
Single web app, one URL, responsive UI. The Field Workforce experience is the same app rendered in a mobile-first layout; the Administrative Office experience is the same app rendered in a denser desktop layout. Same code base, same routes, same offline behavior. *(Post-amendment: original v2 said "Field Workforce (mobile PWA) and Administrative Office (desktop portal)" as if they were separate surfaces; they are not. The same Contractor can log in on a phone or a laptop and gets the same functional experience adapted to the device class.)*

### 1.3 Comprehensive Application Map & Navigation Paths

#### Field Contractor Path (same app, mobile-first layout)
* **Screen 1: Authentication Gateway** — unchanged.
* **Screen 2: Inspector Dashboard & Sync Hub** — unchanged, plus: assigned inspections now show `scheduled_date` from Section 5 when generated by a recurrence schedule.
* **Screen 3: Asset Structure Register Loop** — unchanged.
* **Screen 4: Structural Evaluation Form Container** — unchanged, plus: an explicit **"Submit Inspection"** action (FR-13) replaces the previous implicit assumption that sync alone completes an inspection; and a lightweight **"Update Remediation Status"** action is available on any deficiency the contractor revisits (FR-8), distinct from the next-cycle triage flow.

#### Engineering Reviewer & Admin Path (same app, desktop layout)
* **Screen 1: Multi-Tenant Operational Control Deck** — unchanged.
* **Screen 2: Sandbox Import Center** — unchanged.
* **Screen 3: Structural Validation Workspace (The Splice Dashboard)** — unchanged, plus: an Admin-only **"Reopen"** action becomes available on `Approved` inspections (FR-9).
* **Screen 4: Document Publishing Center** — unchanged.
* **Screen 5: Scheduling & Calendar** *(new)* — Admin/Reviewer calendar view of all inspection schedules and generated assignments; supports drag-and-drop reassignment/rescheduling (FR-10).
* **Screen 6: System Audit Log** *(new, Admin and Reviewer)* — read-only, filterable view over `system_audit_logs`. Not visible to, or reachable by, the Contractor role under any navigation path (FR-9). *Post-amendment: original v3 spec said Admin only; loosened when Reviewer became global.*

### 1.4 Scope Decisions Log *(new)*
These were open questions in earlier revisions; they are now locked in and should not be revisited mid-build without an explicit change request:

1. **Client portal:** Out of scope. Clients (mine sites/facility owners) never log in. They receive PDF/Word/Excel deliverables via the existing Document Publishing Center (signed, time-limited download links and/or email).
2. **Scheduling:** In scope, full calendar (not just auto-recurrence without a UI). See FR-10 and Section 5.
3. **Inspector assignment model:** Per-asset independent assignment only. `inspections.inspector_id` already supports two inspectors holding entirely separate assignments across different structures within the same facility — this required no schema change. True joint/team assignment to a single inspection is explicitly **not** being built.
4. **Audit log visibility:** Admin and Reviewer. Contractor role has no route, button, or API permission that exposes `system_audit_logs`. *(Originally Admin-only; loosened when Reviewer became global.)*
5. **Forgotten password offline recovery:** Per-user access PIN, set at profile setup. The PIN is a "get me to the network" credential — it does not enable infinite offline work. The PWA cannot do PIN crypto offline. See FR-14 for the residual operational limitation.
6. **Edit operations model:** Action-endpoint model (FR-15) — no generic `PATCH /:id`. Each edit is a named endpoint with a Zod schema, role gate, and critical/cosmetic flag. Critical edits are audit-logged; cosmetic edits are not. Edit-while-Approved is the reopen → edit → re-approve flow only.
7. **GPS capture mode:** Inspector-declared `onsite` / `post_inspection` at the start of every inspection. In `post_inspection`, the PWA does not call the Geolocation API. Mode is locked after the first deficiency. See FR-16.
8. **Pre-inspection timesheet flag:** Server-derived `pre_inspection = true` on timesheet entries logged before the inspection date. Yellow left-border + informational tag in the UI. No other effect. See FR-17.
9. **Inspector unavailability / reassignment flow:** No "On Leave" or "Disengaged" user state. Reassignment uses the existing FR-15 `PATCH /inspections/:id/reassign` endpoint (now extended with a `reason` field and a notification to the previous inspector — FR-18.2) and a new `POST /inspections/bulk-reassign` endpoint for moving all open work from one inspector to another (FR-18.3). The previous inspector is never told who received their work. See FR-18.

---

## 2. Functional Requirements Specification

### 2.1 System Role Matrix
* **Field Contractor / Inspector:** Single web app, responsive UI; primary device is a phone in the field, but the same user can use a laptop and get the same functional experience. Assigned structures/inspections, deficiency logging, triage, time logging, submitting inspections (FR-13), and updating remediation status on deficiencies they're aware of (FR-8) — but cannot verify-close a remediation. Can call `POST /auth/switch-client` to switch between clients they hold a membership for, without logging out (post-amendment). Has a per-user 6-digit access PIN set at profile setup for offline recovery (FR-14).
* **Engineering Reviewer:** Single web app, responsive UI; primary device is a laptop, but the same routes and screens work on a phone. **Global/cross-tenant (bypasses `client_memberships`).** Reads across all projects, overrides matrix entries, approves/returns inspections, manages component/work-type picklists (FR-11), verifies remediation closure (FR-8), and reads the audit log (post-amendment). Can call `POST /auth/switch-client`. **Cannot** reopen an approved inspection.
* **System Administrator:** Global role. Everything a Reviewer can do, plus: onboarding clients, running imports, managing users/picklists, and reopening approved inspections. (The "only role with audit log access" line was dropped when Reviewer was promoted to global.)

### 2.2 Core Functional Requirements Blocks (FR)

*FR-1 through FR-7 are unchanged from v2 (global tenancy/isolation, sandbox ingestion, field capture, risk matrix, timesheets/review, assignment/carry-forward, approval). They are not repeated here — see the v2 document for full text. New requirements below extend that baseline.*

#### FR-8 (new): Remediation Tracking & Close-Out
* **FR-8.1:** Every `deficiency_records` row carries a `remediation_status` independent of `triage_state`. `triage_state` describes how a *newly logged* record relates to history found during a fresh inspection visit. `remediation_status` describes the *active, ongoing* lifecycle of getting a known defect fixed, and can change at any time — not only when someone happens to re-inspect that structure.
* **FR-8.2:** Lifecycle: `Open → Remediation_Scheduled → Remediated_Pending_Verification → Verified_Closed`. Any authenticated user scoped to that client can advance a record to `Remediation_Scheduled` or `Remediated_Pending_Verification` (optionally attaching a `remediation_evidence`-purposed photo). Only a Reviewer/Admin can set `Verified_Closed`, and doing so requires at least one attached photo tagged `remediation_evidence` — a defect cannot be marked closed on someone's word alone.
* **FR-8.3:** `Verified_Closed` deficiencies remain immutable once their parent inspection is `Approved`, same as any other field, per the existing immutability trigger.

#### FR-9 (new): Reopening Approved Records & Audit Log Access
* **FR-9.1:** Admin-only. `POST /inspections/:id/reopen` moves an `Approved` inspection to either `Submitted` (admin/reviewer fixes something directly without re-involving the field) or `Returned` (sent back to the contractor), and requires a non-empty `reason`. This is the only path that exits the `Approved` state once entered.
* **FR-9.2:** The reopen action, the reason, and the actor are stored directly on `inspections` (`reopened_by`, `reopened_at`, `reopen_reason`) — not only inside the generic audit log's JSONB — so it's directly queryable without log-mining.
* **FR-9.3 (post-amendment):** `GET /audit-logs` is Admin- and Reviewer-allowed. Contractor tokens receive `403 Forbidden` regardless of how the request is constructed; this is enforced at the route-middleware layer, not just hidden in the UI. *Original v3 rule was Admin-only; loosened when Reviewer became global.*

#### FR-10 (new): Inspection Scheduling & Calendar
* **FR-10.1:** A `Recurring` project's structures can have an `inspection_schedules` row defining a default inspector and a recurrence interval in days. A daily background job generates the next `inspections` row once its due date falls inside a configurable lead-time window (default 14 days), so it's visible/assignable before it's actually due — and advances the schedule's `next_due_date`.
* **FR-10.2:** The job is idempotent: it never generates a second inspection for the same schedule occurrence if one already exists (checked by `schedule_id` + `scheduled_date` pair).
* **FR-10.3:** Admin/Reviewer can view a calendar (`GET /inspections/calendar`) across all assigned and scheduled-but-not-yet-generated inspections, and can drag-and-drop to reschedule or reassign via `PATCH /inspections/:id/schedule`.
* **FR-10.4 (default, flagged for confirmation):** Recurrence is modeled as a simple fixed interval in days (e.g., every 90 days), not full calendar-rule recurrence (e.g., "first Monday of each quarter"). This keeps the generation job trivial and matches how engineering inspection cadences are normally specified. If true calendar-rule recurrence is required, this needs to change before Sprint 5 starts (see ADR-011).

#### FR-11 (new): Managed Picklists for Component & Work Type
* **FR-11.1:** `deficiency_records.component` and `timesheet_entries.work_type` are no longer free text. Each client gets its own `component_types` and `work_types` tables, seeded from a standard default library at client creation, and editable afterward by Admin/Reviewer.
* **FR-11.2:** Entries are never hard-deleted (to preserve referential integrity on historical records) — only deactivated (`is_active = false`), which removes them from new-entry dropdowns without breaking past data.
* **FR-11.3:** A `component_notes` free-text field remains available alongside the picklist selection, for inspector detail that doesn't belong in a standardized label.

#### FR-12 (new): Expanded Notification Coverage
* **FR-12.1:** Beyond the existing P1 alert (FR-4.2), the system now also notifies: the assigned inspector when an inspection is created (`POST /inspections`); all Reviewers/Admins scoped to that client when an inspection is submitted (`POST /inspections/:id/submit`); and the assigned inspector when their inspection is returned (`POST /inspections/:id/return`).
* **FR-12.2:** All notifications continue to route through the single `NotificationProvider` interface from v2 Section 8.5 — no new provider integrations were introduced for this.

#### FR-13 (new): Explicit Inspection Submission
* **FR-13.1:** `POST /inspections/:id/submit` (Contractor) is the action that moves an inspection from `Assigned`/`In Progress` to `Submitted`. This was previously left implicit in v1/v2 (the status existed; nothing produced it). The endpoint requires either at least one synced deficiency record, or an explicit `no_deficiencies_found: true` flag in the request — an inspector must affirmatively state "I checked, there's nothing to report," rather than an empty inspection looking identical to one nobody started.

---

## 3. System Architecture & Directory Standards

### 3.1 System Topology Diagram & Tier Overview
*(Unchanged from v2 — the scheduling job and expanded notifications run inside the existing "Background Workers" node in that diagram; no new tier was introduced.)*

### 3.2 Architectural Decision Records (ADR)
*(ADR-001 through ADR-010 unchanged from v2 — see that document for full text.)*

#### ADR-011 (new): Recurrence Model Simplicity
* **Status:** Approved as default; flagged for confirmation (see FR-10.4).
* **Context:** Calendar-rule recurrence (RRULE/iCal-style: "first Monday of each quarter," "every other Tuesday") is significantly more complex to generate, test, and reschedule correctly than fixed-interval recurrence.
* **Decision:** Model recurrence as `recurrence_interval_days INT`, computed forward from `next_due_date`. This covers the large majority of real inspection cadences (monthly, quarterly, annual) with a generation job simple enough to be trivially testable. If a genuine calendar-rule requirement surfaces later, it's an additive migration (add a `recurrence_rule` column, keep `recurrence_interval_days` for the simple case) rather than a rebuild.

### 3.3 Directory Structure Conventions
*(Unchanged from v2 — `apps/api-server/src/jobs/` already existed for background workers; the schedule generator lives there as `jobs/scheduleGenerator.ts`.)*

### 3.4 Core API Routing Maps — v3 Additions

> Everything from v2 Section 3.4 still applies. The following routes are new in v3.

**Schedules (`/schedules`)** — Admin/Reviewer
| Method & Path | Purpose |
|---|---|
| `GET /schedules?structure_id=&is_active=` | List recurrence schedules. |
| `POST /schedules` | Create a schedule (structure, default inspector, interval, first due date). |
| `PATCH /schedules/:id` | Edit interval/inspector, or pause via `is_active=false`. |

**Calendar (`/inspections`)** — Admin/Reviewer
| Method & Path | Purpose |
|---|---|
| `GET /inspections/calendar?from=&to=&inspector_id=` | Calendar-range view across assigned + upcoming scheduled inspections. |
| `PATCH /inspections/:id/schedule` | Drag-and-drop reschedule (`scheduled_date`) and/or reassign (`inspector_id`). |

**Inspection lifecycle additions**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /inspections/:id/submit` | Contractor | FR-13 — explicit submission. |
| `POST /inspections/:id/reopen` | **Admin only** | FR-9 — exits `Approved`; requires `target_status` + `reason`. |

**Remediation (`/deficiencies/:id`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `PATCH /deficiencies/:id/remediation` | Any client-scoped role | Advance to `Remediation_Scheduled` / `Remediated_Pending_Verification`. |
| `POST /deficiencies/:id/verify-closure` | Reviewer/Admin | Sets `Verified_Closed`; requires existing `remediation_evidence` photo. |

**Picklists (`/component-types`, `/work-types`)** — Admin/Reviewer
| Method & Path | Purpose |
|---|---|
| `GET /component-types` / `GET /work-types` | List (active by default, `?include_inactive=true` to see all). |
| `POST /component-types` / `POST /work-types` | Add a client-specific entry. |
| `PATCH /component-types/:id` / `PATCH /work-types/:id` | Rename or deactivate (never hard-deleted). |

**Audit Log (`/audit-logs`)** — **Admin and Reviewer** *(post-amendment; original v3 was Admin only)*
| Method & Path | Purpose |
|---|---|
| `GET /audit-logs?table_name=&record_id=&page=` | Read-only, paginated. `403` for any non-Admin role. |

---

## 4. Software Engineering & Code Standards
*(Unchanged from v2 — strict TypeScript, path aliases, async/await-only error handling, pinned toolchain versions, `node-pg-migrate` migration convention. See v2 Sections 4.1–4.5.)*

---

## 5. Relational Database Schema Blueprint — v3 Additions

> Everything in v2 Section 5 still applies as the schema baseline. The following are **new tables, new enums, and column additions to existing tables**, expressed as migration-style statements consistent with ADR-009 (`node-pg-migrate`) — each block below corresponds to one migration file.

```sql
-- ==========================================
-- NEW ENUMS
-- ==========================================
CREATE TYPE remediation_status_enum AS ENUM ('Open', 'Remediation_Scheduled', 'Remediated_Pending_Verification', 'Verified_Closed');
CREATE TYPE photo_purpose_enum AS ENUM ('deficiency_evidence', 'remediation_evidence');

-- ==========================================
-- NEW TABLES: SCHEDULING (FR-10)
-- ==========================================
CREATE TABLE inspection_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES structures(structure_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,                          -- denormalized for RLS, auto-populated by trigger
    default_inspector_id UUID NULL REFERENCES users(user_id),
    recurrence_interval_days INT NOT NULL CHECK (recurrence_interval_days > 0),
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_schedule_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_schedule_client BEFORE INSERT ON inspection_schedules
FOR EACH ROW EXECUTE FUNCTION set_schedule_client_id();

ALTER TABLE inspection_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_schedules ON inspection_schedules
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

CREATE TRIGGER trg_update_schedules_timestamp BEFORE UPDATE ON inspection_schedules
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE INDEX idx_schedules_structure ON inspection_schedules(structure_id);
CREATE INDEX idx_schedules_next_due ON inspection_schedules(next_due_date) WHERE is_active = TRUE;

-- ==========================================
-- INSPECTIONS: scheduling + reopen support
-- ==========================================
ALTER TABLE inspections
    ADD COLUMN scheduled_date DATE NULL,
    ADD COLUMN schedule_id UUID NULL REFERENCES inspection_schedules(schedule_id),
    ADD COLUMN reopened_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN reopened_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN reopen_reason TEXT NULL;

CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
-- Idempotency guard for the generation job (FR-10.2): never duplicate the same occurrence.
CREATE UNIQUE INDEX idx_inspections_schedule_occurrence
    ON inspections(schedule_id, scheduled_date) WHERE schedule_id IS NOT NULL;

-- ==========================================
-- NEW TABLES: MANAGED PICKLISTS (FR-11)
-- ==========================================
CREATE TABLE component_types (
    component_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_component_name_per_client UNIQUE (client_id, name)
);

CREATE TABLE work_types (
    work_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_work_type_name_per_client UNIQUE (client_id, name)
);

ALTER TABLE component_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_component_types ON component_types
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_work_types ON work_types
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

CREATE INDEX idx_component_types_client ON component_types(client_id) WHERE is_active = TRUE;
CREATE INDEX idx_work_types_client ON work_types(client_id) WHERE is_active = TRUE;

-- ==========================================
-- DEFICIENCY_RECORDS: picklist FK + remediation lifecycle (FR-8, FR-11)
-- ==========================================
-- NOTE: this migration assumes a one-time data backfill mapping existing free-text
-- `component` values to seeded component_types rows before the column is dropped.
-- Write that backfill explicitly in Sprint 5 — do not drop `component` until it's verified empty-safe.
ALTER TABLE deficiency_records
    ADD COLUMN component_type_id UUID NULL REFERENCES component_types(component_type_id),
    ADD COLUMN component_notes TEXT NULL,
    ADD COLUMN remediation_status remediation_status_enum NOT NULL DEFAULT 'Open',
    ADD COLUMN remediation_due_date DATE NULL,
    ADD COLUMN remediated_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN remediated_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN verified_closed_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN verified_closed_at TIMESTAMP WITH TIME ZONE NULL;

-- After backfill is verified complete:
-- ALTER TABLE deficiency_records ALTER COLUMN component_type_id SET NOT NULL;
-- ALTER TABLE deficiency_records DROP COLUMN component;

CREATE INDEX idx_deficiencies_remediation_status ON deficiency_records(remediation_status);
CREATE INDEX idx_deficiencies_component_type ON deficiency_records(component_type_id);

-- ==========================================
-- TIMESHEET_ENTRIES: picklist FK (FR-11)
-- ==========================================
ALTER TABLE timesheet_entries
    ADD COLUMN work_type_id UUID NULL REFERENCES work_types(work_type_id);
-- Same backfill-then-enforce-NOT-NULL-then-drop-old-column pattern as above applies to `work_type`.

-- ==========================================
-- PHOTOS: purpose tagging (FR-8.2)
-- ==========================================
ALTER TABLE photos
    ADD COLUMN purpose photo_purpose_enum NOT NULL DEFAULT 'deficiency_evidence';
```

> **Why these are additive `ALTER`/backfill migrations rather than rewritten `CREATE TABLE` statements:** by Sprint 5 the v1/v2 schema may already have production data in it. v3 is written as a set of forward migrations on top of that, exactly per ADR-009's "never edit a merged migration, only add new ones." If you're still pre-launch and haven't run the v1/v2 schema yet, it's equally correct to fold these directly into the original `CREATE TABLE` statements — but the migration form above is the safer default to hand to a build agent, since it works either way.

---

## 6. API Contract & Validation Blueprint — v3 Additions

### 6.1 New/Updated Zod Contracts
```typescript
import { z } from 'zod';

// Updated: component is now a picklist reference, not free text (FR-11.1)
export const deficiencySyncSchemaV3 = z.object({
  client_local_id: z.string().min(1),
  structure_id: z.string().uuid(),
  previous_deficiency_id: z.string().uuid().nullable(),
  component_type_id: z.string().uuid(),                 // was: component: z.string()
  component_notes: z.string().max(500).optional(),
  description: z.string().min(10),
  severity: z.number().int().min(1).max(5),
  probability: z.number().int().min(1).max(5),
  consequences: z.number().int().min(1).max(5),
  gps_latitude: z.number().min(-90).max(90).nullable(),
  gps_longitude: z.number().min(-180).max(180).nullable()
});

export const scheduleCreateSchema = z.object({
  structure_id: z.string().uuid(),
  default_inspector_id: z.string().uuid().nullable(),
  recurrence_interval_days: z.number().int().positive(),
  next_due_date: z.string().date()
});

export const inspectionSubmitSchema = z.object({
  no_deficiencies_found: z.boolean().default(false)
});

export const inspectionReopenSchema = z.object({
  target_status: z.enum(['Submitted', 'Returned']),
  reason: z.string().min(10)
});

export const remediationUpdateSchema = z.object({
  remediation_status: z.enum(['Remediation_Scheduled', 'Remediated_Pending_Verification']),
  remediation_due_date: z.string().date().nullable().optional()
});

export const picklistEntrySchema = z.object({
  name: z.string().min(2).max(100)
});
```

### 6.2 New Endpoint Examples

#### POST /api/v1/inspections/:id/reopen
```json
// Request
{ "target_status": "Returned", "reason": "Photo evidence for deficiency def-1 was mismatched to the wrong asset; needs re-capture." }
```
```json
// Response (200)
{
  "success": true,
  "message": "Inspection reopened and moved to 'Returned'. Deficiency records are editable again.",
  "data": { "inspection_id": "a1b2c3d4-...", "status": "Returned", "reopened_at": "2026-06-17T19:40:00Z" }
}
```
```json
// Response (403) — Reviewer attempting this action
{ "success": false, "error_code": "FORBIDDEN_ADMIN_ONLY", "message": "Reopening an approved inspection is restricted to System Administrators." }
```

#### POST /api/v1/deficiencies/:id/verify-closure
```json
// Response (422) — no remediation evidence photo attached yet
{
  "success": false,
  "error_code": "MISSING_REMEDIATION_EVIDENCE",
  "message": "At least one photo tagged 'remediation_evidence' must be attached before this deficiency can be verified closed."
}
```

#### GET /api/v1/audit-logs (Admin and Reviewer, post-amendment)
```json
// Response (403) — Contractor token
{ "success": false, "error_code": "FORBIDDEN_ADMIN_ONLY", "message": "Audit log access is restricted to System Administrators and Reviewers." }
```

---

## 7. UI Rules & Component Registry — v3 Additions

*(Design tokens, spacing, and accessibility rules from v2 Section 7 are unchanged and apply to all new components below.)*

#### `<InspectionCalendarView>` *(new)*
```typescript
export interface InspectionCalendarViewProps {
  range: { from: string; to: string };
  inspectorFilter?: string;
  onReschedule: (inspectionId: string, newDate: string, newInspectorId?: string) => void;
}
```
* Month/week toggle. Generated-but-unconfirmed scheduled occurrences render visually distinct (e.g., dashed border) from confirmed `Assigned` inspections, since FR-10.1 surfaces them ahead of actual generation-due-date for planning purposes.

#### `<PicklistManager>` *(new, generic — reused for both component types and work types)*
```typescript
export interface PicklistManagerProps {
  entityLabel: 'Component Type' | 'Work Type';
  entries: Array<{ id: string; name: string; isActive: boolean }>;
  onAdd: (name: string) => void;
  onDeactivate: (id: string) => void; // never a hard delete (FR-11.2)
}
```

#### `<RemediationStatusTracker>` *(new)*
```typescript
export interface RemediationStatusTrackerProps {
  status: 'Open' | 'Remediation_Scheduled' | 'Remediated_Pending_Verification' | 'Verified_Closed';
  canVerifyClose: boolean; // true only for Reviewer/Admin (FR-8.2)
  hasRemediationEvidence: boolean;
  onAdvance: (next: 'Remediation_Scheduled' | 'Remediated_Pending_Verification') => void;
  onVerifyClose: () => void;
}
```
* `onVerifyClose` is disabled (not just hidden) with an inline reason when `hasRemediationEvidence` is false, so the FR-8.2 evidence requirement is visible at the point of action, not just enforced as a server-side surprise.

#### `<ReopenInspectionButton>` *(new, Admin-only render)*
```typescript
export interface ReopenInspectionButtonProps {
  inspectionId: string;
  currentStatus: 'Approved';
  onReopen: (targetStatus: 'Submitted' | 'Returned', reason: string) => void;
}
```
* Rendered conditionally by the caller based on role — this component itself doesn't re-check permissions, since the API's `403` (FR-9.3) is the actual enforcement boundary; the UI check is purely to avoid showing a button that will fail.

---

## 8. Engineering Implementations — v3 Additions

### 8.1 Schedule Generation Job (FR-10)
```typescript
// apps/api-server/src/jobs/scheduleGenerator.ts
// Runs daily (e.g., via node-cron or an external scheduler hitting an internal endpoint).
const LEAD_TIME_DAYS = 14;

export async function generateUpcomingInspections(pool: Pool) {
  const dueSchedules = await pool.query(
    `SELECT * FROM inspection_schedules
     WHERE is_active = TRUE
       AND next_due_date <= CURRENT_DATE + $1::int`,
    [LEAD_TIME_DAYS]
  );

  for (const schedule of dueSchedules.rows) {
    try {
      await pool.query(
        `INSERT INTO inspections (structure_id, inspector_id, schedule_id, scheduled_date, status)
         VALUES ($1, $2, $3, $4, 'Assigned')
         ON CONFLICT (schedule_id, scheduled_date) DO NOTHING`, // FR-10.2 idempotency, backed by the unique index
        [schedule.structure_id, schedule.default_inspector_id, schedule.schedule_id, schedule.next_due_date]
      );
      await pool.query(
        `UPDATE inspection_schedules SET next_due_date = next_due_date + ($1 || ' days')::interval WHERE schedule_id = $2`,
        [schedule.recurrence_interval_days, schedule.schedule_id]
      );
      if (schedule.default_inspector_id) {
        await notifyInspectionAssigned(schedule.default_inspector_id, schedule.structure_id); // FR-12.1
      }
    } catch (error) {
      logger.error('Schedule generation failed for schedule', { scheduleId: schedule.schedule_id, error });
      // Intentionally continue to the next schedule rather than aborting the whole job run.
    }
  }
}
```

### 8.2 Notification Call Sites (FR-12)
```typescript
// Inside POST /inspections handler, after the INSERT:
await notifyInspectionAssigned(provider, inspection.inspector_id, inspection);

// Inside POST /inspections/:id/submit handler, after status -> 'Submitted':
const reviewers = await getReviewersForClient(inspection.client_id);
await Promise.all(reviewers.map(r => notifyInspectionSubmitted(provider, r, inspection)));

// Inside POST /inspections/:id/return handler, after status -> 'Returned':
await notifyInspectionReturned(provider, inspection.inspector_id, inspection, returnedReason);
```
All three reuse the `NotificationProvider` interface from v2 Section 8.5 — no new provider integration was needed for FR-12.

### 8.3 Verify-Closure Guard (FR-8.2)
```typescript
// apps/api-server/src/controllers/deficiencies.ts
export async function verifyClosure(req: Request, res: Response) {
  const evidence = await db.query(
    `SELECT 1 FROM photos WHERE deficiency_id = $1 AND purpose = 'remediation_evidence' LIMIT 1`,
    [req.params.id]
  );
  if (evidence.rowCount === 0) {
    return res.status(422).json({
      success: false,
      error_code: 'MISSING_REMEDIATION_EVIDENCE',
      message: "At least one photo tagged 'remediation_evidence' must be attached before this deficiency can be verified closed."
    });
  }
  await db.query(
    `UPDATE deficiency_records SET remediation_status = 'Verified_Closed', verified_closed_by = $1, verified_closed_at = NOW() WHERE deficiency_id = $2`,
    [req.user.user_id, req.params.id]
  );
  return res.json({ success: true });
}
```

### 8.4 Admin-Only Middleware for Reopen & Audit Routes (FR-9)
```typescript
// apps/api-server/src/middleware/requireAdmin.ts
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, error_code: 'FORBIDDEN_ADMIN_ONLY', message: 'This action is restricted to System Administrators.' });
  }
  next();
}
// Applied: router.post('/inspections/:id/reopen', requireAdmin, reopenInspectionHandler);
//          router.get('/audit-logs', requireAdmin, listAuditLogsHandler);
```

### 8.5 Client-Creation Picklist Seeding (FR-11.1)
```typescript
// apps/api-server/src/services/clientOnboarding.ts
const DEFAULT_COMPONENT_TYPES = ['Support Frame', 'Bolted Connection', 'Welded Joint', 'Corrosion Protection Coating', 'Foundation/Footing', 'Handrail/Guardrail'];
const DEFAULT_WORK_TYPES = ['On-Site Inspection', 'Travel', 'Report Writing', 'Client Meeting'];

export async function seedDefaultPicklists(client: Pool, clientId: string) {
  for (const name of DEFAULT_COMPONENT_TYPES) {
    await client.query(`INSERT INTO component_types (client_id, name) VALUES ($1, $2)`, [clientId, name]);
  }
  for (const name of DEFAULT_WORK_TYPES) {
    await client.query(`INSERT INTO work_types (client_id, name) VALUES ($1, $2)`, [clientId, name]);
  }
}
// Called inside the same transaction as POST /clients, so a client never exists without its starter picklists.
```

---

## 9. Chronological Build Plan & Release Gates — v3 Addition

### 9.1 Sprint 5 (new): Scheduling, Remediation, Picklists & Admin Controls
```
Sprint 5: Scheduling, Remediation Tracking, Picklists & Admin Controls
├── Backend:
│   ├── inspection_schedules table + scheduleGenerator job (FR-10)
│   ├── remediation_status lifecycle + verify-closure guard (FR-8)
│   ├── component_types / work_types tables + seeding + backfill migration (FR-11)
│   ├── /inspections/:id/reopen + requireAdmin middleware (FR-9)
│   ├── /audit-logs read endpoint, Admin-only (FR-9)
│   ├── /inspections/:id/submit (FR-13)
│   └── Assignment/submission/return notification call sites (FR-12)
└── Frontend:
    ├── <InspectionCalendarView> with drag-and-drop reschedule/reassign
    ├── <RemediationStatusTracker> on the deficiency detail view
    ├── <PicklistManager> screens under Admin/Reviewer settings
    ├── <ReopenInspectionButton> on the Splice Dashboard (Admin-rendered only)
    └── Read-only Audit Log screen (Admin nav only — no route exposed to Reviewer build)
```

### 9.2 Quality Control Release Gates — v3 Addition
5. **Role-Boundary Verification (new):** Automated test asserts a Reviewer-role token receives `403` from `POST /inspections/:id/reopen` and a `200` from `GET /audit-logs`; that a Contractor-role token receives `403` from `GET /audit-logs`; and that no Contractor-reachable UI path renders a link to either. *(Updated post-amendment when Reviewer became global and audit log access was loosened.)*
6. **Schedule Idempotency (new):** Running the schedule generation job twice in immediate succession produces zero duplicate inspections (verifies the unique index in Section 5 is actually load-bearing, not just decorative).

---

## 10. High-Fidelity Engineering Progress Tracker — v3 Addition

### 10.4 Scheduling, Remediation & Admin Controls Track *(new)*
| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| SCH-401 | `inspection_schedules` + idempotent generator job | 5 | ⬜ NOT STARTED | ST-101 |
| SCH-402 | `<InspectionCalendarView>` + reschedule/reassign endpoint | 5 | ⬜ NOT STARTED | SCH-401 |
| REM-403 | `remediation_status` lifecycle + verify-closure guard | 5 | ⬜ NOT STARTED | INT-303 (photo purpose tagging) |
| PCK-404 | `component_types`/`work_types` + seeding + backfill | 5 | ⬜ NOT STARTED | ST-101 |
| ADM-405 | `/inspections/:id/reopen` + `requireAdmin` middleware | 5 | ⬜ NOT STARTED | ST-104 (audit triggers) |
| ADM-406 | `/audit-logs` Admin-only endpoint + UI | 5 | ⬜ NOT STARTED | ADM-405 |
| SUB-407 | `/inspections/:id/submit` | 5 | ⬜ NOT STARTED | None |
| NOT-408 | Assignment/submission/return notification call sites | 5 | ⬜ NOT STARTED | INT-306 |

*Status Key: ⬜ Not Started | 🟨 In Progress | 🟩 Completed | 🟥 Blocked*

---

## 11. Operational & Non-Functional Requirements
*(Unchanged from v2 — environment config, pagination, CI/CD, sync conflict resolution, and data retention guidance all still apply as written. No v3 changes to this section.)*

---

*End of Blueprint v3. This document assumes the full v2 baseline (Sections not reproduced above — overview boundaries, FR-1–FR-7, ADR-001–010, the core v2 schema, the v2 API surface, v2 components, v2 service code, and v2 Section 11) remains in force. Build from v2 + this v3 addendum together as one combined source of truth; do not build from v1 or v2 alone.*