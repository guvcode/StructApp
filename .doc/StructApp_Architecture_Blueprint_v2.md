# StructApp Unified Architecture & Design Blueprint — v2 (Gap-Closure Revision)

---

## 0. Revision Notes — What Changed From v1 and Why

This revision exists because v1 left several **load-bearing decisions undefined**. Undefined decisions are the #1 cause of drift when multiple AI build sessions implement the same spec independently — each session invents a slightly different answer. Every item below was either a contradiction, a missing mechanism, or an unspecified default in v1.

| # | Gap in v1 | Resolution in v2 |
|---|---|---|
| 1 | No password field on `users` | Added `password_hash`, `is_active`, `last_login_at` |
| 2 | No way to scope a Contractor/Reviewer to a tenant | Added `client_memberships` join table |

> **Post-v2 amendment (v3):** gap fix #2 was originally about scoping *both* Contractor and Reviewer via `client_memberships`. When the Reviewer role was promoted to global (see `01-project-overview.md` §1.4 and `02-functional-requirements.md` FR-1.3), `client_memberships` became Contractor-only. The table itself is unchanged; only the application-layer enforcement of "which roles check it" changed.
| 3 | "Row-Level Cryptographic Isolation" was not a real mechanism | Replaced with concrete Postgres RLS policy design (ADR-006) |
| 4 | Risk priority formula never defined | Defined explicit scoring formula + tier bands, moved into `shared/` to prevent client/server drift |
| 5 | No `/approve` endpoint despite an `Approved` status and a trigger depending on it | Added full approval workflow |
| 6 | `system_audit_logs` table had nothing writing to it | Added generic audit trigger function |
| 7 | ~90% of needed API routes were undocumented | Added full route map (Section 3.4) |
| 8 | No inspection assignment mechanism | Added `assigned_by`/`assigned_at` + `POST /inspections` |
| 9 | Report generation had no chosen library or template approach | Added ADR-007 (Puppeteer + docx + exceljs) |
| 10 | CSV import "sandbox" was vague (in-memory? Redis? unclear) | Replaced with DB-backed staging tables (`import_batches`/`import_rows`) |
| 11 | No code shown for the "atomic sync" transaction itself | Added reference transaction implementation |
| 12 | No carry-forward linkage between old and new deficiency records | Added `previous_deficiency_id` |
| 13 | No notification provider chosen for P1 alerts | Added ADR-008 (SendGrid + Twilio) |
| 14 | No QR/barcode field despite a scanning feature | Added `qr_code_value` to `structures` |
| 15 | No tenant-context propagation mechanism for "switch client" | Added `active_client_id` claim + `/auth/switch-client` |
| 16 | `gps_coordinates` was an unvalidated free-text field | Split into `gps_latitude`/`gps_longitude NUMERIC` |
| 17 | No DB-level backstop for "max 5 photos" rule | Added enforcement trigger |

> **Post-v2 amendment (v3):** gap fix #17 added the DB trigger. The trigger was later dropped (see `05-database-schema.md` block 6 amendment note) because field users kept hitting the 5-photo cap on real engineering evidence cases. The cap is now API-layer (`MAX_PHOTOS_PER_DEFICIENCY = 20`) with a soft UI warning at 6. The DB is no longer the enforcement boundary for photo count.
| 18 | No override provenance tracking | Added `original_priority`, `is_overridden`, `overridden_by`, `overridden_at` |
| 19 | No migration tooling specified | Added ADR-009 (`node-pg-migrate`) |
| 20 | No JWT/session strategy for a workforce offline for days at a time | Added ADR-010 |
| 21 | No sync conflict-resolution policy | Added "append-only authorship" model |
| 22 | No pagination, env config, or CI/CD convention | Added Section 11 |
| 23 | Broken ASCII architecture diagram | Replaced with Mermaid diagram |

> **Post-v2 amendment (v3):** the gap-closure revisions in v2 are the source for FR-1.1 through FR-1.3. Three later amendments to FR-1.2/FR-1.3 are summarized at the FR text itself (see §2 above). They are not re-listed as v2 gap fixes because the v2 baseline correctly scoped "Contractor = membership only"; the cross-tenant promotion of Reviewer and the membership-scoped switch for Contractor were both v3 decisions.

> **Post-v2 amendment (v3):** FR-14 added for offline PIN fallback. The scenario: an inspector arrives at a remote site with no network connectivity, having forgotten their password, with no prior session in the PWA. The PWA cannot authenticate them by any purely-cryptographic means. The fix is a per-user 6-digit access PIN set at profile setup; see `02-functional-requirements.md` for FR-14 and the schema additions in §5 below.

Everything below is the **full, integrated spec** — not a patch list. Build from this document alone.

---

## 1. Project Overview & Context Bounds

### 1.1 High-Level Project Summary
StructApp is a multi-tenant enterprise solution built for structural engineering asset registers, field condition evaluations, and workforce tracking. It enables structural engineers and field contractors to conduct structural deficiency audits inside remote, low-connectivity zones (mine sites, tunnels, processing plants) and push data back to a centralized web platform for administrative processing and reporting.

**Tenancy model clarification (v2):** A `client` represents one paying customer organization. `Admin` users are global/cross-tenant by role. `Reviewer` and `Contractor` users are scoped to one or more clients via an explicit membership table (Section 5.2) — this supports the realistic case of a contracting firm whose inspectors serve multiple client sites.

> **Post-v2 amendment (v3):** Reviewer is now global/cross-tenant (like Admin), not membership-scoped. `client_memberships` is Contractor-only.

### 1.2 Platform Core Boundaries
* **The Field Workforce (Mobile App Shell):** Offline-first PWA. Intercepts data captures and local forms, persisting them to local storage until cell service is restored.
* **The Administrative Office (Desktop Portal):** Online-only desktop web app for corporate project leads, reviewers, and admins to manage clients, run sandboxed bulk imports, verify inspection matrices, override priority codes, and compile PDF/Word/Excel deliverables.

> **Post-v3 amendment:** the original v2 framing described "Field Workforce" and "Administrative Office" as if they were separate surfaces. They are not. The product is one web app at one URL; the field workforce experience is the same app in a mobile-first layout, the office experience is the same app in a denser desktop layout. Same code base, same routes. See `01-project-overview.md` §1.2 for the current spec.

### 1.3 Comprehensive Application Map & Navigation Paths

#### Field Contractor Path (same app, mobile-first layout)
* **Screen 1: Authentication Gateway** — Secure multi-tenant entry point. Issues JWT access + refresh token pair; pulls local dropdown metadata.
* **Screen 2: Inspector Dashboard & Sync Hub** — Connectivity banner, assigned open inspections, pending offline outbox count.
* **Screen 3: Asset Structure Register Loop** — Search via text or camera barcode/QR scan against `structures.qr_code_value`.
* **Screen 4: Structural Evaluation Form Container** — Component type entry, multiple photos per deficiency (soft UI warning at 6, API-layer cap at `MAX_PHOTOS_PER_DEFICIENCY = 20`, post-amendment), live risk-matrix priority preview (using the shared calculator, Section 8.3), carry-forward triage actions, daily timesheet logging.

#### Engineering Reviewer & Admin Path (same app, desktop layout)
* **Screen 1: Multi-Tenant Operational Control Deck** — Admins and Reviewers switch active client context via `/auth/switch-client`. Contractors also switch (post-amendment), but only to a client they hold a membership for; the UI's switcher lists only their memberships.
* **Screen 2: Sandbox Import Center** — Upload CSV → staged in `import_batches`/`import_rows` → admin reviews validation results → commits or discards.
* **Screen 3: Structural Validation Workspace (The Splice Dashboard)** — Two-pane review: form fields left, photo proof right. Approve, override (with mandatory justification), or return to field.
* **Screen 4: Document Publishing Center** — Generates watermarked draft PDFs, unwatermarked final PDFs, Word packages, and Excel exports.

---

## 2. Functional Requirements Specification

### 2.1 System Role Matrix
* **Field Contractor / Inspector:** Mobile PWA only. Scoped to clients in `client_memberships`. Views assigned structures, logs deficiencies, triages carry-forward defects, logs time. Can call `POST /auth/switch-client` to switch between clients they hold a membership for, without logging out (post-amendment — see FR-1.3). *Post-v3 amendment:* "Mobile PWA only" is the *primary* device, not a *hard* restriction. The same Contractor user can log in on a laptop and get the same functional experience (responsive UI). See `01-project-overview.md` §1.2.
* **Engineering Reviewer:** Desktop only. *Post-v3 amendment:* global/cross-tenant (bypasses `client_memberships`). Reads across all projects, edits/overrides matrix entries (with mandatory justification), approves/returns inspections, verifies remediation closure, manages picklists, compiles reports, and reads the audit log. *Post-v3 amendment:* "Desktop only" is the *primary* device, not a *hard* restriction. The same Reviewer user can log in on a phone and get the same functional experience (responsive UI). See `01-project-overview.md` §1.2.
* **System Administrator:** Global role, bypasses `client_memberships` entirely. Onboards clients, runs imports, manages users, can act as any client via "switch client."

### 2.2 Core Functional Requirements Blocks (FR)

#### FR-1: Global Client Context & Isolation
* **FR-1.1:** Every tenant-scoped table carries a denormalized `client_id` (Section 5.1). All endpoints enforce isolation via Postgres Row-Level Security using a per-request session variable (ADR-006) — isolation is enforced at the database layer, not just in application code, so a missed `WHERE` clause cannot leak cross-tenant data.
* **FR-1.2:** Switching clients in the desktop header (Admin/Reviewer) or in the PWA app bar (Contractor) calls `POST /auth/switch-client`, which reissues an access token carrying the new `active_client_id` claim and forces a full state refresh on the client. *Post-v3 amendment:* originally Admin-only; now available to Reviewer (when promoted to global) and to Contractor (limited to their membership list — see FR-1.3).
* **FR-1.3 (new, post-amendment):** All authenticated roles can call `POST /auth/switch-client` to set a new `active_client_id` and reissue the access token, without logging out.
  - **Admin** — can switch to any client (no membership check; bypasses `client_memberships`).
  - **Reviewer** — can switch to any client (global/cross-tenant, no membership check).
  - **Contractor** — can switch only to a client they hold an active `client_memberships` row for. If the requested `client_id` is not in their membership list, the server returns `403 NOT_A_MEMBER`, the access token is unchanged, and the attempt is audit-logged. The UI's client switcher in the PWA app bar only lists clients the Contractor is a member of — the server-side check is defense in depth, not the primary filter.
  - If a user holds membership in multiple clients, login still presents a client picker before token issuance (the picker is the initial switch, not a re-prompt on every login).

> **Amendment history:** original v3 said "Contractor cannot switch"; original v2 said "Admin-only switch". The current rule is "all roles can switch, with a membership check for Contractor".

#### FR-2: Sandbox Data Ingestion
* **FR-2.1:** Admin uploads a CSV. The server creates one `import_batches` row and one `import_rows` row per CSV line (raw JSON), each independently validated against the schema in Section 8.4.
* **FR-2.2:** Required CSV columns: `site_name, structure_asset_tag, structure_description, project_title`. Rows missing required fields, or referencing a site/project that doesn't resolve, are flagged `Invalid` with a machine-readable reason in `validation_errors` and are **not** committed.
* **FR-2.3 (new):** Committing a batch (`POST /imports/batches/:id/commit`) is itself an atomic transaction: either all `Valid` rows are inserted as permanent `structures`/`sites`/`projects` rows, or none are, mirroring the sync atomicity rule (ADR-005).

#### FR-3: Field Form Capture & Coordinate Controls
* **FR-3.1:** Field forms enforce standard validation (Section 6.1 Zod contracts) on-device before queuing to the outbox, and again server-side on sync — never trust client-only validation.
* **FR-3.2 (replaced by FR-16 in v3):** Replaced by FR-16 — Inspection Capture Mode. Inspector declares the mode (`onsite` or `post_inspection`) at the start of an inspection; in `post_inspection` mode the PWA does not call the Geolocation API for any deficiency on that inspection. GPS fields default to null in `post_inspection` mode; the inspector can still enter them by hand. See `02-functional-requirements.md` FR-16 for the full rule.

#### FR-4: Risk Assessment Matrix Operations
* **FR-4.1 (now fully defined):** Priority is calculated from `severity (1–5) × probability (1–5) × consequences (1–5)`. See Section 8.3 for the exact formula and tier bands. This calculation lives in `shared/utils/riskCalculator.ts` and is imported identically by the mobile client (for live UI feedback) and the API server (as the authoritative recheck on sync) — the client's number is always advisory; the server's number is the one persisted.
* **FR-4.2:** Any deficiency whose calculated tier is `P1` triggers `notifyP1Deficiency()` (Section 8.5), which dispatches an email (via the `NotificationProvider` Resend adapter) to the client's registered safety contact and an SMS (via the `NotificationProvider` MessageBird adapter) to the assigned Reviewer, within the same database transaction's after-commit hook (fire only after the sync transaction commits, never before).

#### FR-5: Timesheet & Review Workflows
* **FR-5.1:** Contractors manage daily labor logs in `Draft` status. Submitting (`POST /timesheets/:id/submit`) locks the row from further device edits; only a Reviewer/Admin can move it to `Approved` or `Rejected` (with `rejection_reason`).
* **FR-5.2:** Reviewers overriding a calculated priority must supply `reviewer_justification`. The system additionally preserves `original_priority` and stamps `overridden_by`/`overridden_at` so overrides are auditable without depending on free-text alone.

#### FR-6 (new): Inspection Assignment & Carry-Forward
* **FR-6.1:** Only Admin/Reviewer can create an inspection assignment (`POST /inspections`), which sets `inspector_id`, `assigned_by`, `assigned_at`, and status `Assigned`.
* **FR-6.2:** When an inspector opens a structure with prior deficiency history, the app surfaces unresolved historical records (`triage_state IN ('New','Still Outstanding','Worsened')`) and requires a triage decision per record. Choosing anything other than "create new, unrelated" sets `previous_deficiency_id` on the new record, forming an auditable chain.

#### FR-7 (new): Inspection Approval
* **FR-7.1:** A Reviewer/Admin approves a `Submitted` inspection via `POST /inspections/:id/approve`, which sets status `Approved`, `approved_by`, `approved_at`. This is the action that activates the immutability trigger in Section 5.4 — approval is the only path into the `Approved` state.

---

## 3. System Architecture & Directory Standards

### 3.1 System Topology Diagram & Tier Overview

```mermaid
flowchart TB
    subgraph CLIENT["CLIENT TIER — Single web app, responsive UI"]
        WEBAPP["Web App\n(React + Vite, responsive: phone/tablet/laptop)\nService Worker + Dexie.js for offline (phone)"]
    end

    subgraph APP["APPLICATION TIER — Node.js (TypeScript) / Express"]
        AUTH["Auth & RLS Context\nMiddleware"]
        SYNCMW["Sync Middleware\n(atomic transactions)"]
        VALID["Validation Core\n(Zod + shared risk calc)"]
        WORKERS["Background Workers\n(reports, notifications)"]
    end

    subgraph DATA["DATA TIER"]
        PG[("PostgreSQL 15+\nclient_id denormalized + RLS policies")]
    end

    subgraph EXT["EXTERNAL SERVICES"]
        CLOUD["Cloudinary\n(media CDN)"]
        RESEND["Resend\n(email)"]
        MSGBIRD["MessageBird\n(SMS)"]
    end

    WEBAPP -- "HTTPS JSON / multipart (phone sync)" --> AUTH
    AUTH --> SYNCMW --> VALID --> PG
    WORKERS --> PG
    SYNCMW --> CLOUD
    WORKERS --> RESEND
    WORKERS --> MSGBIRD
```

> **Post-v3 amendment:** the original v2 diagram had two client nodes (Desktop Portal + Field Inspector PWA). The current product is one web app at one URL; both roles use the same client. The Service Worker + Dexie.js offline stack applies to the PWA install path (when the user adds the app to their home screen); on a laptop the same web app runs without a Service Worker but with the same routes. Resend and MessageBird replace SendGrid and Twilio per the ADR-008 amendment.

### 3.2 Architectural Decision Records (ADR)

#### ADR-001: Selection of Core Framework Stack
* **Status:** Approved. **Decision:** React (TypeScript) via Vite for a single web app, deployed at one URL, with responsive UI for both phone and laptop; Node.js (TypeScript) / Express REST API for backend. Single language across tiers. *Post-v3 amendment:* the original v2 decision said "Vite for frontend" without specifying a single-app or two-app model; the v3 product is one app, one URL, responsive layout — not two separate code bases for "mobile PWA" and "desktop portal".

#### ADR-002: Offline Client Database Engine
* **Status:** Approved. **Decision:** Dexie.js wraps IndexedDB for the mobile PWA's offline outbox and locally cached reference data.

#### ADR-003: Long-Term Production Storage Engine
* **Status:** Approved. **Decision:** PostgreSQL 15+, with strict foreign keys and (per ADR-006) Row-Level Security for tenant isolation.

#### ADR-004: Media Asset Pipeline via Cloudinary
* **Status:** Approved. **Decision:** Cloudinary handles media normalization (`q_auto`, `f_auto`, `c_limit` transforms). Raw EXIF is extracted client-side and stored in Postgres (`photo_evidence_metadata`) as the legal record; Cloudinary only ever holds the rendered image.

#### ADR-005: Synchronization Payload Processing Strategy
* **Status:** Approved. **Decision:** Strict Atomic Transaction (All-or-Nothing) sync. A reference implementation is given in Section 8.2.

#### ADR-006 (new): Tenant Isolation via Row-Level Security
* **Status:** Approved.
* **Context:** v1's "row-level cryptographic isolation" conflated access control with encryption and specified neither. Tenant isolation needs to be enforced where a missed application-layer filter can't bypass it.
* **Decision:** Every tenant-scoped table carries a denormalized `client_id` column (populated automatically via `BEFORE INSERT` triggers that look it up from the parent record, so application code can never omit it). Postgres RLS is enabled on those tables with a policy comparing `client_id` to the session variable `app.current_client_id`, which the auth middleware sets via `SET LOCAL` at the start of every request transaction, derived from the verified JWT's `active_client_id` claim. Admin requests set `app.bypass_tenant_check = 'true'` instead, and policies `OR` against that flag. Encryption of sensitive columns at rest (phone numbers, GPS) is a separate, additive concern — see Section 11.5 — not a substitute for RLS.
* **Trade-off accepted:** Denormalizing `client_id` onto child tables duplicates data that's technically derivable through joins, in exchange for simpler, faster, and harder-to-bypass policies. This is the standard pattern for multi-tenant Postgres SaaS apps.

#### ADR-007 (new): Report Generation Engine
* **Status:** Approved. **Amended (post-v2):** PDF library changed from Puppeteer to **PDFKit**. See amendment note at the end of this ADR.
* **Context:** v1 required PDF, Word, and Excel deliverables but specified no library for any of them.
* **Decision:**
  - **PDF (draft watermarked + final):** **PDFKit** — programmatic PDF generation, no browser/Chromium dependency. Draft watermarks applied as a layered text/image on a separate PDF page; final PDFs render without the watermark layer. The HTML/CSS template approach from the original v2 decision was abandoned because shipping Chromium in the deployment image is heavier than the team wants to carry.
  - **Word:** The **`docx`** npm package, generating `.docx` directly from structured data (no template-conversion step needed).
  - **Excel:** **`exceljs`**, generating `.xlsx` with one worksheet per project and a summary sheet.
  - All three run as background jobs (Section 3.4 `/reports` routes return a job id immediately; the client polls or is notified when the file is ready) since report generation for large projects can exceed a typical HTTP request timeout.

*Amendment note:* the original v2 ADR pinned Puppeteer for PDF so the report template could reuse the web design tokens from Section 7.2. The team has since decided that carrying a Chromium runtime in the deployment image is not worth the template-fidelity win. PDFKit replaces Puppeteer. The design tokens no longer flow automatically into the PDF — the PDF template styling is now maintained as a separate PDFKit document definition that must be kept visually aligned with the web tokens by hand.

#### ADR-008 (new): Notification Providers
* **Status:** Approved. **Amended (post-v2):** Email provider changed from SendGrid to **Resend**; SMS provider changed from Twilio to **MessageBird**. See amendment note at the end of this ADR.
* **Decision:** **Resend** for transactional email (invite emails, P1 alert emails, report-ready notifications). **MessageBird** for SMS (P1 alerts only, given cost). Both are wrapped behind a `NotificationProvider` interface (Section 8.5) so a future provider swap doesn't ripple through call sites.

*Amendment note:* the original v2 ADR pinned SendGrid (email) and Twilio (SMS). Resend replaces SendGrid for a more modern API and React Email template support. MessageBird replaces Twilio for lower per-message cost in the regions where StructApp's clients operate. The `NotificationProvider` interface is unchanged; only the implementation in `services/notifications/` was swapped.

#### ADR-009 (new): Database Migration Tooling
* **Status:** Approved.
* **Decision:** **`node-pg-migrate`**. Migrations live in `apps/api-server/migrations/`, named `<timestamp>_<description>.ts`. Once merged, a migration file is never edited — only new migrations are added. CI runs all migrations against an ephemeral test database before running the test suite (Section 11.3).

#### ADR-010 (new): JWT & Session Strategy for an Offline-First Workforce
* **Status:** Approved.
* **Context:** Field inspectors may be offline for days. A short-lived access token alone would force re-authentication mid-shift in a low-connectivity zone, which is unacceptable.
* **Decision:**
  - Access token: 15-minute expiry. Carries `user_id`, `role`, `active_client_id`.
  - Refresh token: 30-day sliding expiry, stored in a dedicated Dexie table (`authState`), not a cookie (the PWA needs to read it while fully offline, so `httpOnly` cookies aren't viable here — this is a deliberate, documented trade-off, mitigated by the short access-token lifetime and device-level OS sandboxing).
  - While offline, the device performs **no** token validation — all writes are local-only and unauthenticated by definition (there's no network call to authenticate against). Token expiry is only ever checked at the moment of `POST /sync/push-outbox`.
  - If the access token is expired at sync time, the client transparently calls `POST /auth/refresh` first. If the refresh token itself has expired (inspector hasn't been online in 30+ days), sync fails with `AUTH_EXPIRED` and the contractor must complete an online re-login before that batch can sync — local data is never lost, only sync is paused.

### 3.3 Directory Structure Conventions
```text
structapp-monorepo/
├── apps/
│   ├── web-client/                    # Single web app, responsive UI (post-v3 amendment)
│   │   ├── public/
│   │   └── src/
│   │       ├── components/           # Shared components, layout adapts to viewport
│   │       ├── context/
│   │       ├── db/                   # Dexie.js table models (incl. authState, pin_outbox)
│   │       ├── hooks/
│   │       ├── routes/               # One router tree — role gates are server-enforced
│   │       └── views/
│   │           ├── dashboard/        # Operational Deck (Reviewer/Admin home) / Inspector Dashboard (Contractor home)
│   │           ├── inspections/      # Splice Dashboard, evaluation form, calendar
│   │           ├── auth/             # Login, forgot-password, PIN fallback
│   │           └── settings/
│   └── api-server/
│       ├── migrations/               # node-pg-migrate files (ADR-009)
│       └── src/
│           ├── controllers/
│           ├── middleware/           # incl. tenant-context.ts (sets app.current_client_id)
│           ├── models/
│           ├── services/             # report compilers, notification dispatch, import engine
│           └── jobs/                 # background workers for reports/notifications
└── shared/
    └── types/
        └── utils/
            └── riskCalculator.ts     # single source of truth for FR-4.1 (no client/server drift)
```

> **Post-v3 amendment:** the original v2 layout had `views/admin/` and `views/inspector/` as if they were separate apps. They are not — both roles use the same app at the same URL. The `views/` directories are still useful for organization (admin-focused views like `/clients`, `/users` vs contractor-focused views like `/inspections/:id/evaluate`), but a single route tree and a single set of shared components serve both. Role gates are server-enforced middleware, not separate code paths.

### 3.4 Core API Routing Maps (Full)

> All routes are prefixed `/api/v1`. All non-auth routes require a valid access token. All list (`GET .../`) routes support pagination per Section 11.2.

**Auth (`/auth`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /auth/login` | Any | Validates credentials, returns access + refresh token. If user has >1 client membership, returns a client list instead and requires a follow-up `client_id` to issue the token. |
| `POST /auth/refresh` | Any (valid refresh token) | Issues a new access token. |
| `POST /auth/logout` | Any | Revokes the refresh token server-side. |
| `POST /auth/invite/provision` | Admin | Dispatches invite token via Resend (post-v2 amendment). |
| `POST /auth/invite/activate` | Any (valid invite token) | Sets `password_hash`, activates profile. |
| `POST /auth/forgot-password` | Any | Issues a single-use, 1-hour-TTL password-reset link emailed via Resend. Always returns 200 (no user enumeration). |
| `POST /auth/reset-password` | Any (valid reset token) | Sets a new `password_hash`, marks the token consumed. Second use returns `401 RESET_TOKEN_CONSUMED`. |
| `POST /auth/switch-client` | Admin, Reviewer, or Contractor (post-amendment) | Reissues access token with new `active_client_id`. Contractor is membership-validated: `403 NOT_A_MEMBER` if the target client is not in their `client_memberships` rows. Audit-logged. |

**Clients (`/clients`)** — Admin only
| Method & Path | Purpose |
|---|---|
| `GET /clients` | List clients. |
| `POST /clients` | Create client. |
| `GET /clients/:id` | Client detail. |
| `PATCH /clients/:id` | FR-15 — Edit `name`, `safety_contact_email`. Critical. |
| `POST /sites` | Admin/Reviewer | Create site. |
| `GET /structures?site_id=&search=&qr=` | All roles | Search/list structures; `qr=` looks up `qr_code_value` exactly for scan flows. |
| `POST /structures` | Admin/Reviewer | Create structure. |
| `PATCH /structures/:id` | Admin/Reviewer | FR-15 — Edit `asset_tag`, `description`, `qr_code_value`. Critical. `409 QR_CODE_ALREADY_IN_USE` on `qr_code_value` collisions. |
| `GET /structures/:id/history` | All roles | Past deficiencies for carry-forward triage (FR-6.2). |
| `GET /sites?project_id=` | Admin/Reviewer | List sites. |
| `POST /sites` | Admin/Reviewer | Create site. |
| `PATCH /sites/:id` | Admin/Reviewer | FR-15 — Edit `name`, `iana_timezone`. Critical. |

**Projects (`/projects`)** — Admin/Reviewer
| Method & Path | Purpose |
|---|---|
| `GET /projects?client_id=` | List projects. |
| `POST /projects` | Create project. |
| `PATCH /projects/:id` | FR-15 — Edit `title`, `type`, `due_date`. Critical. |
| `GET /projects/:id` | Project detail. |

**Inspections (`/inspections`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `GET /inspections?status=&inspector_id=` | All roles (RLS-scoped) | List inspections. |
| `POST /inspections` | Admin/Reviewer | Assign a new inspection (FR-6.1). |
| `GET /inspections/:id` | All roles | Detail incl. deficiencies + photos. |
| `POST /inspections/:id/submit` | Contractor | FR-13 — explicit submission. |
| `POST /inspections/:id/return` | Reviewer/Admin | Bounce to field with mandatory `returned_reason`. |
| `POST /inspections/:id/approve` | Reviewer/Admin | Approve; locks deficiencies (FR-7.1). |
| `POST /inspections/:id/reopen` | **Admin only** | FR-9 — exits `Approved`; requires `target_status` + `reason`. |
| `PATCH /inspections/:id/reassign` | Admin/Reviewer | FR-15 — Reassign `inspector_id` (and optional `scheduled_date`). Critical. FR-18.2 — also sends a notification to the previous inspector (no new inspector's name in the body; includes the `reason` field if supplied). |
| `POST /inspections/bulk-reassign` | Admin/Reviewer | FR-18 — Reassign all open inspections from one inspector to another in one transaction. Body: `{ source_inspector_id, target_inspector_id, inspection_ids?, reason? }`. Capped at 100 inspections. Returns `409 INSPECTION_APPROVED_USE_REOPEN` if any in the batch are Approved. Audit-logged per row. |
| `PATCH /inspections/:id/inspection-mode` | Admin | FR-16 — Edit `inspection_mode` (`onsite`/`post_inspection`). Only valid before any deficiency is logged. Cosmetic. |

**Deficiencies (`/deficiencies`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `GET /deficiencies/:id` | All roles | Detail. |
| `PATCH /deficiencies/:id` | Reviewer/Admin (or its author if `triage_state='New'`) | FR-15 — Edit `description`, `severity`, `probability`, `consequences`. Critical. Server re-runs `calculatePriorityTier`. **Note:** this is distinct from the v2 override behavior; this PATCH edits the input fields, not the priority. |
| `PATCH /deficiencies/:id/component-notes` | Any client-scoped role | FR-15 — Edit `component_notes` only. Cosmetic. |

**Photos (`/photos`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `GET /photos/:id` | All roles | Detail with EXIF metadata. |
| `PATCH /photos/:id` | Author or Reviewer/Admin | FR-15 — Edit `caption`, `display_order`, `purpose`. Cosmetic. |
| `DELETE /photos/:id` | Author (while parent not Approved) or Reviewer/Admin | Soft-delete by setting `deleted_at`. |

**Timesheets (`/timesheets`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `GET /timesheets?user_id=&status=` | All roles (own data for Contractor) | List. |
| `POST /timesheets/:id/submit` | Contractor | Lock draft for review (FR-5.1). |
| `POST /timesheets/:id/approve` | Reviewer/Admin | Approve. |
| `POST /timesheets/:id/reject` | Reviewer/Admin | Reject with `rejection_reason`. |
| `PATCH /timesheets/:id` | Author (Draft only) or Reviewer/Admin | FR-15 — Edit `work_type_id`, `hours_logged`. Cosmetic if Draft, critical otherwise. |

**Sync (`/sync`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /sync/pull-package` | Contractor | Downloads assigned inspections, structure metadata, historical deficiency summaries. |
| `POST /sync/push-outbox` | Contractor | Atomic ingestion of offline batch (Section 8.2). |

**Timesheets (`/timesheets`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `GET /timesheets?user_id=&status=` | All roles (own data for Contractor) | List. |
| `POST /timesheets/:id/submit` | Contractor | Lock draft for review (FR-5.1). |
| `POST /timesheets/:id/approve` | Reviewer/Admin | Approve. |
| `POST /timesheets/:id/reject` | Reviewer/Admin | Reject with `rejection_reason`. |

**Imports (`/imports`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /imports/batches` | Admin | Upload CSV; creates `import_batches` + validates into `import_rows` (FR-2). |
| `GET /imports/batches/:id` | Admin | View validation results per row. |
| `POST /imports/batches/:id/commit` | Admin | Atomically commit all `Valid` rows (FR-2.3). |
| `POST /imports/batches/:id/discard` | Admin | Discard the batch. |

**Reports (`/reports`)**
| Method & Path | Role | Purpose |
|---|---|---|
| `POST /reports/generate` | Reviewer/Admin | Body: `{ type: "draft_pdf" \| "final_pdf" \| "word" \| "excel", project_id }`. Returns `{ job_id }`. |
| `GET /reports/:job_id` | Reviewer/Admin | Poll status; returns a signed download URL when `status: "ready"`. |

**Users (`/users`)** — Admin only
| Method & Path | Purpose |
|---|---|
| `GET /users` | List, filterable by client membership. |
| `PATCH /users/:id` | FR-15 — Edit `email`, `phone_number`, `full_name`, `role`, `is_active`, `add_client_ids`, `remove_client_ids`. Critical for `role`/`is_active`/membership; cosmetic for `full_name`. |
| `POST /users/:id/resend-invite` | Admin | FR-15 — Resend the invite email via `NotificationProvider`. Critical. |
| `POST /users/:id/revoke-invite` | Admin | FR-15 — Revoke the invite. Critical. |
| `POST /users/:id/reset-password` | Admin | FR-15 — Set a temporary password and (optionally) email it. Critical. |

---

## 4. Software Engineering & Code Standards

### 4.1 Type Safety Parameters
* `tsconfig.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.
* `any` is banned; use `unknown` + type guards.

### 4.2 Folder Layout & Imports
* No relative paths deeper than one folder step. Use path aliases:
```typescript
import { useSyncOutbox } from '@/hooks/useSyncOutbox';
import { RiskMatrixBadge } from '@/components/ui';
import { calculatePriorityTier } from '@shared/utils/riskCalculator';
```

### 4.3 Error Handling Patterns
* `async/await` with try/catch only. No chained promises, no RxJS.
```typescript
export async function dispatchDeviceOutbox(payload: MultipartSyncPayload): Promise<SyncResponse> {
  try {
    const response = await apiConnectionPool.post('/sync/push-outbox', payload);
    return { success: true, serverRef: response.data.sync_summary };
  } catch (error) {
    logger.error('Failed to process synchronization outbox payload', { error });
    return { success: false, validationErrors: error.response?.data?.invalid_records || [] };
  }
}
```

### 4.4 Pinned Toolchain Versions (new)
To prevent independent build sessions from resolving different major versions:

| Package | Pinned Version |
|---|---|
| Node.js | 20 LTS |
| TypeScript | 5.4.x |
| React | 18.3.x |
| Vite | 5.2.x |
| Express | 4.19.x |
| Zod | 3.23.x |
| Dexie | 4.0.x |
| PostgreSQL | 15.x |
| node-pg-migrate | 6.2.x |
| puppeteer | 22.x |
| docx | 8.5.x |
| exceljs | 4.4.x |

### 4.5 Migration Convention (new)
* One change per migration file. Never edit a merged migration — add a new one.
* Naming: `apps/api-server/migrations/<unix_timestamp>_<snake_case_description>.ts`.
* CI runs `node-pg-migrate up` against a throwaway test database before tests execute (Section 11.3).

---

## 5. Relational Database Schema Blueprint (Full)

```sql
-- StructApp Relational Database Schema — v2
-- Target Platform: PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE inspection_status_enum AS ENUM ('Assigned', 'In Progress', 'Submitted', 'Returned', 'Approved');
-- Post-v3 amendment (FR-16): new enum
CREATE TYPE inspection_mode_enum AS ENUM ('onsite', 'post_inspection');
CREATE TYPE triage_state_enum AS ENUM ('New', 'Resolved', 'Still Outstanding', 'Worsened');
CREATE TYPE timesheet_status_enum AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');
CREATE TYPE user_role_enum AS ENUM ('Admin', 'Reviewer', 'Contractor');
CREATE TYPE project_type_enum AS ENUM ('One-Off', 'Recurring');
CREATE TYPE import_batch_status_enum AS ENUM ('Pending', 'Validated', 'Committed', 'Discarded');
CREATE TYPE import_row_status_enum AS ENUM ('Pending', 'Valid', 'Invalid');
CREATE TYPE report_type_enum AS ENUM ('draft_pdf', 'final_pdf', 'word', 'excel');
CREATE TYPE report_job_status_enum AS ENUM ('Queued', 'Processing', 'Ready', 'Failed');

-- ==========================================
-- 2. CORE ENTITY TABLES
-- ==========================================

CREATE TABLE clients (
    client_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    safety_contact_email VARCHAR(255) NOT NULL,   -- target for P1 notifications (FR-4.2)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,           -- gap fix #1
    role user_role_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,       -- gap fix #1
    last_login_at TIMESTAMP WITH TIME ZONE,        -- gap fix #1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-v3 amendment: per-user access PIN columns for FR-14 (offline fallback).
ALTER TABLE users
    ADD COLUMN pin_hash VARCHAR(255) NULL,
    ADD COLUMN pin_set_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN must_set_pin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN failed_password_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN failed_pin_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN pin_lockout_until TIMESTAMP WITH TIME ZONE NULL;

CREATE TABLE pin_fallback_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMP WITH TIME ZONE NULL,
    consumed_by_real_password_login BOOLEAN NOT NULL DEFAULT FALSE
);

-- gap fix #2: many-to-many tenant scoping for Reviewer/Contractor.
-- Post-v3 amendment: Reviewer no longer scoped via this table. Contractor only.
-- Admin role bypasses this table entirely (checked via role enum, not membership).
CREATE TABLE client_memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_client UNIQUE (user_id, client_id)
);

CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    type project_type_enum NOT NULL DEFAULT 'One-Off',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sites (
    site_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,                       -- denormalized for RLS (ADR-006), auto-populated by trigger
    name VARCHAR(255) NOT NULL,
    iana_timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE structures (
    structure_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,                       -- denormalized for RLS, auto-populated
    asset_tag VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    qr_code_value VARCHAR(150) UNIQUE NULL,         -- gap fix #14: barcode/QR scan target
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_asset_tag_per_site UNIQUE (site_id, asset_tag)
);

CREATE TABLE inspections (
    inspection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES structures(structure_id) ON DELETE RESTRICT,
    client_id UUID NOT NULL,                        -- denormalized for RLS, auto-populated
    inspector_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    assigned_by UUID NULL REFERENCES users(user_id),               -- gap fix #8
    assigned_at TIMESTAMP WITH TIME ZONE,                          -- gap fix #8
    status inspection_status_enum NOT NULL DEFAULT 'Assigned',
    returned_reason TEXT NULL,                                     -- gap fix #5
    approved_by UUID NULL REFERENCES users(user_id),               -- gap fix #5
    approved_at TIMESTAMP WITH TIME ZONE,                          -- gap fix #5
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deficiency_records (
    deficiency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,                         -- denormalized for RLS, auto-populated
    previous_deficiency_id UUID NULL REFERENCES deficiency_records(deficiency_id), -- gap fix #12
    component VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity INT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    probability INT NOT NULL CHECK (probability BETWEEN 1 AND 5),
    consequences INT NOT NULL CHECK (consequences BETWEEN 1 AND 5),
    calculated_priority VARCHAR(2) NOT NULL CHECK (calculated_priority IN ('P1', 'P2', 'P3', 'P4', 'P5')),
    original_priority VARCHAR(2) NULL CHECK (original_priority IN ('P1', 'P2', 'P3', 'P4', 'P5')), -- gap fix #18
    is_overridden BOOLEAN NOT NULL DEFAULT FALSE,        -- gap fix #18
    overridden_by UUID NULL REFERENCES users(user_id),   -- gap fix #18
    overridden_at TIMESTAMP WITH TIME ZONE,              -- gap fix #18
    triage_state triage_state_enum NOT NULL DEFAULT 'New',
    gps_latitude NUMERIC(9,6) NULL CHECK (gps_latitude BETWEEN -90 AND 90),    -- gap fix #16
    gps_longitude NUMERIC(9,6) NULL CHECK (gps_longitude BETWEEN -180 AND 180), -- gap fix #16
    reviewer_justification TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE photos (
    photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deficiency_id UUID NOT NULL REFERENCES deficiency_records(deficiency_id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL,
    display_order SMALLINT NOT NULL DEFAULT 0,
    caption TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE photo_evidence_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(photo_id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    raw_exif_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE timesheet_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,                       -- denormalized for RLS, auto-populated
    work_type VARCHAR(100) NOT NULL,
    hours_logged NUMERIC(4,2) NOT NULL CHECK (hours_logged > 0.00 AND hours_logged <= 24.00),
    status timesheet_status_enum NOT NULL DEFAULT 'Draft',
    rejection_reason TEXT NULL,                     -- gap fix
    approved_by UUID NULL REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-v3 amendment (FR-17.2): timesheet entry_date + pre_inspection flag + inspection_id FK.
ALTER TABLE timesheet_entries
    ADD COLUMN inspection_id UUID NULL REFERENCES inspections(inspection_id) ON DELETE SET NULL,
    ADD COLUMN entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN pre_inspection BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_timesheets_entry_date ON timesheet_entries(entry_date);
CREATE INDEX idx_timesheets_pre_inspection ON timesheet_entries(pre_inspection) WHERE pre_inspection = TRUE;

-- Post-v3 amendment (FR-16): inspection capture mode.
ALTER TABLE inspections ADD COLUMN inspection_mode inspection_mode_enum NOT NULL DEFAULT 'onsite';

-- gap fix #10: DB-backed import staging, replaces vague "memory sandbox"
CREATE TABLE import_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    original_filename VARCHAR(255) NOT NULL,
    status import_batch_status_enum NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE import_rows (
    row_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
    raw_row JSONB NOT NULL,
    validation_status import_row_status_enum NOT NULL DEFAULT 'Pending',
    validation_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- gap fix #9: tracked async report jobs
CREATE TABLE report_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(user_id),
    report_type report_type_enum NOT NULL,
    status report_job_status_enum NOT NULL DEFAULT 'Queued',
    download_url TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE system_audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(255) DEFAULT 'SYSTEM',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-v2 amendment: added for POST /auth/forgot-password + /reset-password.
CREATE TABLE password_reset_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX idx_memberships_user ON client_memberships(user_id);
CREATE INDEX idx_memberships_client ON client_memberships(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_sites_project_id ON sites(project_id);
CREATE INDEX idx_sites_client_id ON sites(client_id);
CREATE INDEX idx_structures_site_id ON structures(site_id);
CREATE INDEX idx_structures_client_id ON structures(client_id);
CREATE INDEX idx_structures_asset_tag ON structures(asset_tag);
CREATE INDEX idx_structures_qr ON structures(qr_code_value);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_client_id ON inspections(client_id);
CREATE INDEX idx_deficiencies_inspection_id ON deficiency_records(inspection_id);
CREATE INDEX idx_deficiencies_client_id ON deficiency_records(client_id);
CREATE INDEX idx_deficiencies_priority ON deficiency_records(calculated_priority);
CREATE INDEX idx_photos_deficiency_id ON photos(deficiency_id);
CREATE INDEX idx_photo_metadata_lookup ON photo_evidence_metadata(photo_id);
CREATE INDEX idx_timesheets_client_id ON timesheet_entries(client_id);
CREATE INDEX idx_import_rows_batch ON import_rows(batch_id);

-- ==========================================
-- 4. TENANT_ID AUTO-POPULATION TRIGGERS (gap fix #2/#3 support)
-- ==========================================
CREATE OR REPLACE FUNCTION set_site_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_site_client BEFORE INSERT ON sites FOR EACH ROW EXECUTE FUNCTION set_site_client_id();

CREATE OR REPLACE FUNCTION set_structure_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM sites WHERE site_id = NEW.site_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_structure_client BEFORE INSERT ON structures FOR EACH ROW EXECUTE FUNCTION set_structure_client_id();

CREATE OR REPLACE FUNCTION set_inspection_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_inspection_client BEFORE INSERT ON inspections FOR EACH ROW EXECUTE FUNCTION set_inspection_client_id();

CREATE OR REPLACE FUNCTION set_deficiency_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM inspections WHERE inspection_id = NEW.inspection_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_deficiency_client BEFORE INSERT ON deficiency_records FOR EACH ROW EXECUTE FUNCTION set_deficiency_client_id();

CREATE OR REPLACE FUNCTION set_timesheet_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_timesheet_client BEFORE INSERT ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION set_timesheet_client_id();

-- ==========================================
-- 5. ROW-LEVEL SECURITY POLICIES (ADR-006)
-- ==========================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficiency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Pattern repeated per table; shown once for sites, identical shape elsewhere.
CREATE POLICY tenant_isolation_sites ON sites
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_projects ON projects
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_structures ON structures
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_inspections ON inspections
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_deficiencies ON deficiency_records
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_timesheets ON timesheet_entries
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

-- ==========================================
-- 6. IMMUTABILITY & MAX-PHOTOS TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION protect_approved_deficiencies()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT status FROM inspections WHERE inspection_id = OLD.inspection_id) = 'Approved' THEN
        RAISE EXCEPTION 'Hardened Data Guard: modifications to an approved engineering record are blocked.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_lock_approved_records
BEFORE UPDATE OR DELETE ON deficiency_records
FOR EACH ROW EXECUTE FUNCTION protect_approved_deficiencies();

-- gap fix #17: DB-level backstop for "max 5 photos per deficiency"
-- Post-v2 amendment: trigger removed. See 05-database-schema.md block 6
-- for the current (API-layer, cap = 20) implementation.

-- ==========================================
-- 7. GENERIC AUDIT LOGGING (gap fix #6)
-- ==========================================
CREATE OR REPLACE FUNCTION generic_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.user_id::uuid, TG_OP, to_jsonb(OLD), to_jsonb(NEW)); -- placeholder PK ref; see note below
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, OLD.user_id::uuid, TG_OP, to_jsonb(OLD), NULL);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
-- NOTE: the primary-key column name differs per table (e.g. deficiency_id vs entry_id).
-- In practice, generate one trigger function per table (e.g. audit_deficiency_records())
-- referencing that table's actual PK column instead of a hardcoded `user_id`. The function
-- above illustrates the INSERT pattern only — copy it per table with the correct PK reference.
CREATE TRIGGER trg_audit_deficiencies AFTER UPDATE OR DELETE ON deficiency_records
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();
CREATE TRIGGER trg_audit_inspections AFTER UPDATE OR DELETE ON inspections
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();
CREATE TRIGGER trg_audit_timesheets AFTER UPDATE OR DELETE ON timesheet_entries
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();

-- ==========================================
-- 8. TIMESTAMP TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_clients_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_sites_timestamp BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_structures_timestamp BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_inspections_timestamp BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_deficiencies_timestamp BEFORE UPDATE ON deficiency_records FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_timesheets_timestamp BEFORE UPDATE ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
```

> **Important note on the audit trigger pattern (Section 5, block 7):** Postgres triggers can't generically reference "whatever the primary key column is named." The illustrative function above must be cloned once per audited table with the correct PK column substituted (e.g., `OLD.deficiency_id` for `deficiency_records`, `OLD.entry_id` for `timesheet_entries`). Don't deploy the placeholder as-is — generate the per-table versions during Sprint 0 hardening (Section 9.3).

---

## 6. API Contract & Validation Blueprint

### 6.1 Type Guard Validation Rules (Zod Contracts)

```typescript
import { z } from 'zod';

export const inviteProvisionSchema = z.object({
  email: z.string().email(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/),
  role: z.enum(['Admin', 'Reviewer', 'Contractor']),
  client_ids: z.array(z.string().uuid()).optional() // required for Reviewer/Contractor, ignored for Admin
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Post-v2 amendment: added for the password-reset flow.
export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8)
});

export const deficiencySyncSchema = z.object({
  client_local_id: z.string().min(1),
  structure_id: z.string().uuid(),
  previous_deficiency_id: z.string().uuid().nullable(),
  component: z.string().min(2).max(100),
  description: z.string().min(10),
  severity: z.number().int().min(1).max(5),
  probability: z.number().int().min(1).max(5),
  consequences: z.number().int().min(1).max(5),
  gps_latitude: z.number().min(-90).max(90).nullable(),
  gps_longitude: z.number().min(-180).max(180).nullable()
  // calculated_priority is intentionally NOT accepted from the client —
  // the server always recomputes it via shared/utils/riskCalculator.ts
});

export const inspectionApproveSchema = z.object({
  inspection_id: z.string().uuid()
});

export const deficiencyOverrideSchema = z.object({
  adjusted_priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']),
  reviewer_justification: z.string().min(10)
});
```

### 6.2 Request / Response Endpoint Blueprints

#### POST /api/v1/auth/login
```json
// Request
{ "email": "inspector.smith@contractor.com", "password": "••••••••" }
```
```json
// Response (200) — single client membership
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rft_8f9e0d...",
    "active_client_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
  }
}
```
```json
// Response (200) — multiple memberships, client choice required
{
  "success": true,
  "requires_client_selection": true,
  "data": { "available_clients": [{ "client_id": "...", "name": "Acme Mining" }] }
}
```

#### POST /api/v1/inspections/:id/approve
```json
// Response (200)
{
  "success": true,
  "message": "Inspection approved. All associated deficiency records are now immutable.",
  "data": { "inspection_id": "a1b2c3d4-...", "status": "Approved", "approved_at": "2026-06-17T18:02:00Z" }
}
```

#### POST /api/v1/sync/push-outbox (Multipart/Form-Data)
```json
// Response (422 Unprocessable Entity — Atomic Abort)
{
  "success": false,
  "error_code": "ATOMIC_SYNC_VALIDATION_FAILURE",
  "message": "Sync aborted. Record 'def_loc_001' failed validation: description below minimum length. No database changes were committed."
}
```

#### POST /api/v1/imports/batches/:id/commit
```json
// Response (422 — partial validity, nothing committed)
{
  "success": false,
  "error_code": "IMPORT_BATCH_HAS_INVALID_ROWS",
  "message": "3 of 120 rows failed validation. Resolve or remove them before committing.",
  "data": { "invalid_row_ids": ["row-uuid-1", "row-uuid-2", "row-uuid-3"] }
}
```

#### POST /api/v1/reports/generate
```json
// Request
{ "type": "final_pdf", "project_id": "9f8e7d6c-..." }
```
```json
// Response (202 Accepted)
{ "success": true, "data": { "job_id": "rpt_4a5b6c...", "status": "Queued" } }
```

---

## 7. UI Rules, Token Architectures & Component Registry

### 7.1 Contextual Padding & Responsive Spacing Scales
```css
.density-field-form {
  @apply p-5 gap-4 mb-4; /* Mobile: touch-safe one-handed layout */
}
@media (min-width: 768px) {
  .density-field-form {
    @apply p-1.5 gap-2 mb-1; /* Desktop: dense spreadsheet padding */
  }
}
```

### 7.2 Shared Global Design Tokens
```css
@theme {
  --font-sans: "Inter", sans-serif;
  --color-primary-slate: #0f172a;
  --color-accent-blue: #2563eb;
  --color-success-green: #16a34a;
  --color-warning-amber: #d97706;
  --color-alert-red: #dc2626;
  --color-surface-light: #f8fafc;
  --color-surface-dark: #0f172a;
  --color-border-light: #e2e8f0;
  --color-border-dark: #1e293b;
}
```
These tokens are reused verbatim inside the Puppeteer PDF report template (ADR-007), so reports inherit the same brand system as the app rather than needing a parallel design pass.

### 7.3 Global Styling & Accessibility Guardrails
* Touch targets ≥ 48×48px on mobile viewports.
* Loading skeletons (`animate-pulse bg-slate-200 dark:bg-slate-800`) for async tabular feeds.

### 7.4 Component Registry & Interface Definitions

#### `<RiskMatrixBadge>`
```typescript
export interface RiskMatrixBadgeProps {
  severity: 1 | 2 | 3 | 4 | 5;
  probability: 1 | 2 | 3 | 4 | 5;
  consequences: 1 | 2 | 3 | 4 | 5;
  isOverridden?: boolean;          // new — renders an "Overridden" pill (gap fix #18)
  onOverride?: (justification: string, adjustedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5') => void;
  isEditable: boolean;
}
```

#### `<StructureAccordionRow>`
```typescript
export interface StructureAccordionRowProps {
  structureId: string;
  assetTag: string;
  description: string;
  historicalDeficienciesCount: number;
  isOpen: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}
```

#### `<QrScanButton>` (new — gap fix #14)
```typescript
export interface QrScanButtonProps {
  onScanResult: (qrValue: string) => void;
  onScanError?: (reason: 'permission_denied' | 'no_match' | 'camera_unavailable') => void;
}
```
* **Purpose:** Opens the device camera, decodes a QR/barcode value client-side, and calls `GET /structures?qr=<value>`. On no match, surfaces a clear "not found — search manually" fallback rather than a silent dead end.

#### `<ConnectivityBanner>`
```typescript
export interface ConnectivityBannerProps {
  forcedStateOverride?: 'online' | 'offline';
}
```
* Online: `bg-emerald-600`. Offline: `bg-amber-600`, label "Offline Mode — Changes Safely Saving to Local Device Cache."

---

## 8. Engineering Implementations & Core Custom Service Integrations

### 8.1 Local Caching Database Core (Dexie.js)
```typescript
import Dexie, { type Table } from 'dexie';

export interface LocalDeficiency {
  localId?: string;
  structureId: string;
  previousDeficiencyId?: string | null;
  component: string;
  description: string;
  severity: number;
  probability: number;
  consequences: number;
  calculatedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // advisory only — see Section 8.3
  syncState: 'Draft' | 'Pending_Sync' | 'Synced';
}

export interface AuthState { // gap fix #20
  id: 'current';
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  activeClientId: string;
}

class StructAppLocalDB extends Dexie {
  deficiencies!: Table<LocalDeficiency>;
  authState!: Table<AuthState>;

  constructor() {
    super('StructAppLocalDB');
    this.version(1).stores({
      deficiencies: '++localId, structureId, calculatedPriority, syncState',
      authState: 'id'
    });
  }
}

export const localDB = new StructAppLocalDB();
```

### 8.2 Atomic Sync Transaction (gap fix #11 — reference implementation)
```typescript
import { Pool } from 'pg';
import { deficiencySyncSchema } from '@shared/types/validation';
import { calculatePriorityTier } from '@shared/utils/riskCalculator';

export async function processOutboxSync(pool: Pool, tenantClientId: string, payload: SyncPushPayload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_client_id = '${tenantClientId}'`); // RLS context, ADR-006

    for (const raw of payload.deficiencies) {
      const parsed = deficiencySyncSchema.parse(raw); // throws on invalid -> caught below, triggers rollback
      const tier = calculatePriorityTier(parsed.severity, parsed.probability, parsed.consequences);

      await client.query(
        `INSERT INTO deficiency_records
           (inspection_id, component, description, severity, probability, consequences,
            calculated_priority, gps_latitude, gps_longitude, previous_deficiency_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [payload.inspection_id, parsed.component, parsed.description, parsed.severity,
         parsed.probability, parsed.consequences, tier, parsed.gps_latitude,
         parsed.gps_longitude, parsed.previous_deficiency_id]
      );
      // photo rows + Cloudinary stream calls happen here, inside the same transaction scope
    }

    for (const ts of payload.timesheets) {
      await client.query(
        `INSERT INTO timesheet_entries (user_id, project_id, work_type, hours_logged) VALUES ($1,$2,$3,$4)`,
        [payload.user_id, ts.project_id, ts.work_type, ts.hours_logged]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK'); // ADR-005: all-or-nothing
    return { success: false, error };
  } finally {
    client.release();
  }
}
```

### 8.3 Shared Risk Priority Calculator (gap fix #4 — single source of truth)
```typescript
// shared/utils/riskCalculator.ts
// Imported identically by the mobile client (advisory live preview) and the
// API server (authoritative value persisted to the DB). Never duplicate this logic.

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export function calculatePriorityTier(
  severity: 1 | 2 | 3 | 4 | 5,
  probability: 1 | 2 | 3 | 4 | 5,
  consequences: 1 | 2 | 3 | 4 | 5
): PriorityTier {
  // Hard safety override: maximum severity + maximum consequence is always Critical,
  // regardless of how unlikely (probability) it's judged to be.
  if (severity === 5 && consequences === 5) return 'P1';

  const rawScore = severity * probability * consequences; // range: 1–125

  if (rawScore >= 80) return 'P1'; // Critical
  if (rawScore >= 45) return 'P2'; // High
  if (rawScore >= 20) return 'P3'; // Moderate
  if (rawScore >= 8) return 'P4';  // Low
  return 'P5';                     // Negligible
}
```
> **Default disclosed, not derived:** these score bands (80/45/20/8) are a reasonable starting heuristic, not a certified engineering standard. Before production use, have your structural engineering lead validate or adjust the bands — this function is intentionally isolated in one file specifically so that change is a single edit, not a multi-codebase hunt.

### 8.4 CSV Import Validation Service (gap fix #10)
```typescript
// apps/api-server/src/services/importValidation.ts
export const REQUIRED_CSV_COLUMNS = [
  'project_title',
  'site_name',
  'structure_asset_tag',
  'structure_description'
] as const;

export async function validateImportRow(row: Record<string, string>, clientId: string) {
  const missing = REQUIRED_CSV_COLUMNS.filter(col => !row[col]?.trim());
  if (missing.length > 0) {
    return { status: 'Invalid' as const, errors: [`Missing required column(s): ${missing.join(', ')}`] };
  }
  // Project/site resolution: matched by (client_id, title/name) — created on commit if not found,
  // rather than rejected, since bulk imports commonly introduce new sites in the same file.
  return { status: 'Valid' as const, errors: [] };
}
```

### 8.5 Notification Service (gap fix #13)
```typescript
// apps/api-server/src/services/notifications.ts
interface NotificationProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}

// Concrete adapters (Resend/MessageBird) implement NotificationProvider — call sites never
// import Resend/MessageBird directly, so swapping providers later touches one file.

export async function notifyP1Deficiency(provider: NotificationProvider, deficiency: DeficiencyRecord, client: Client, reviewer: User) {
  await provider.sendEmail(
    client.safety_contact_email,
    `Critical (P1) Structural Deficiency Logged`,
    `A P1 deficiency was logged on asset ${deficiency.component}. Review required immediately.`
  );
  if (reviewer.phone_number) {
    await provider.sendSms(reviewer.phone_number, `P1 deficiency logged — review required.`);
  }
}
```

> **Note (post-v2 amendment):** Resend replaces SendGrid for email; MessageBird replaces Twilio for SMS. The `NotificationProvider` interface is unchanged. See `library-docs.md` for the current adapter implementations.

### 8.6 Server-Side Cloud Media Management (Cloudinary)
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

export async function pipeBinaryStreamToCloudinary(fileBuffer: Buffer, assetFolder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `structapp/${assetFolder}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result!.secure_url))
    );
    stream.end(fileBuffer);
  });
}
```

---

## 9. Chronological Build Plan & Release Gates

### 9.1 Milestone Timeline (Expanded — adds Sprint 0)

```
Sprint 0: Environment & Tooling Bootstrap (new)
├── Repo scaffold, CI pipeline (lint/typecheck/test/migrate), .env.example
└── node-pg-migrate wired up; first migration creates the schema in Section 5

Sprint 1: Core Storage & Auth Foundation
├── Backend: DDL via migrations, password-based auth, RLS context middleware, client_memberships
└── Frontend: React/Vite init, Tailwind/Shadcn setup, UI layout shells

Sprint 2: Offline Caching & Ingestion Pipelines
├── Backend: CSV import staging tables + validation service, full CRUD routes for clients/projects/sites/structures
└── Frontend: Dexie.js schema (incl. authState), local form caching, QR scan component

Sprint 3: Handshake Sync Engine & Cloud Storage
├── Backend: Atomic sync endpoint (Section 8.2), shared risk calculator wired both sides, Cloudinary pipeline, notification service
└── Frontend: Multipart sync outbox dispatcher, ConnectivityBanner, token-refresh-on-sync flow (ADR-010)

Sprint 4: Review Workspace, Approval & Report Publishing
├── Backend: /approve and /return endpoints, audit triggers, PDFKit/docx/exceljs report jobs
└── Frontend: Desktop review panels with override provenance display, Publishing Center, Service Worker via Workbox
```

### 9.2 Quality Control Release Gates
1. **Zero High Severity Flaws** — automated checks clean.
2. **Deterministic Transaction Rollbacks** — partial sync/import payloads verified to roll back fully.
3. **RLS Verified** — automated test attempts cross-tenant reads using a second client's JWT and asserts zero rows returned (new gate, supports ADR-006).
4. **Signed Engineering Approvals** — structural engineering director and systems lead log explicit approval.

### 9.3 Sprint Action Breakdowns (key additions only — see Section 9.1 for full scope)

* **Sprint 0:** Stand up GitHub Actions CI (Section 11.3); clone the audit-trigger pattern per table with correct PK columns (per the note at the end of Section 5).
* **Sprint 1:** Implement `client_memberships` checks in the auth middleware; implement `/auth/switch-client`.
* **Sprint 3:** Confirm the mobile client's locally-displayed priority is explicitly labeled as a preview ("pending server confirmation") until the sync response returns the server-confirmed tier — this is a UX requirement that follows directly from FR-4.1's "server is authoritative" rule.

---

## 10. High-Fidelity Engineering Progress Tracker

### 10.1 Core Data and Security Track
| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| ST-101 | Run migrations, verify triggers | 0 | ⬜ NOT STARTED | None |
| ST-102 | RLS session-context middleware | 1 | ⬜ NOT STARTED | ST-101 |
| ST-103 | JWT auth + refresh + invite router | 1 | ⬜ NOT STARTED | None |
| ST-104 | Per-table audit trigger cloning | 1 | ⬜ NOT STARTED | ST-101 |
| ST-105 *(new)* | `client_memberships` enforcement + switch-client | 1 | ⬜ NOT STARTED | ST-102 |

### 10.2 Offline and Frontend PWA Track
| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| PWA-201 | Tailwind spacing tokens | 1 | ⬜ NOT STARTED | None |
| PWA-202 | Dexie schema incl. `authState` | 2 | ⬜ NOT STARTED | None |
| PWA-203 | EXIF capture & buffer extraction | 3 | ⬜ NOT STARTED | PWA-202 |
| PWA-204 | `ConnectivityBanner` hook | 3 | ⬜ NOT STARTED | None |
| PWA-205 | Workbox service worker | 4 | ⬜ NOT STARTED | UI freeze |
| PWA-206 *(new)* | Token refresh-on-sync flow (ADR-010) | 3 | ⬜ NOT STARTED | ST-103 |
| PWA-207 *(new)* | `<QrScanButton>` component | 2 | ⬜ NOT STARTED | None |

### 10.3 Integration & Business Logic Track
| Feature ID | Component | Sprint | Status | Dependency |
|---|---|---|---|---|
| INT-301 | CSV staging + validation service | 2 | ⬜ NOT STARTED | ST-101 |
| INT-302 | Atomic sync handler | 3 | ⬜ NOT STARTED | PWA-202, ST-102 |
| INT-303 | Cloudinary streaming pipeline | 3 | ⬜ NOT STARTED | Cloudinary account |
| INT-304 | PDF/Word/Excel report jobs (ADR-007) | 4 | ⬜ NOT STARTED | INT-302 |
| INT-305 *(new)* | Shared `riskCalculator.ts` wired client + server | 3 | ⬜ NOT STARTED | None |
| INT-306 *(new)* | Notification service (Resend/MessageBird) | 3 | ⬜ NOT STARTED | Provider accounts |
| INT-307 *(new)* | Inspection approve/return endpoints | 4 | ⬜ NOT STARTED | ST-104 |

*Status Key: ⬜ Not Started | 🟨 In Progress | 🟩 Completed | 🟥 Blocked*

---

## 11. Operational & Non-Functional Requirements (New Section)

### 11.1 Environment Configuration
```bash
# apps/api-server/.env.example
DATABASE_URL=postgres://user:pass@localhost:5432/structapp
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=
MESSAGEBIRD_ACCESS_KEY=
MESSAGEBIRD_ORIGINATOR=
```

> **Note (post-v2 amendment):** `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` were replaced by `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `MESSAGEBIRD_ACCESS_KEY`, and `MESSAGEBIRD_ORIGINATOR` per the ADR-008 amendment.

### 11.2 Pagination Convention
All list endpoints accept `page` (default 1) and `page_size` (default 25, max 100). Response envelope:
```json
{ "data": [ /* ... */ ], "pagination": { "page": 1, "page_size": 25, "total_count": 142, "total_pages": 6 } }
```

### 11.3 CI/CD Pipeline (GitHub Actions, default)
```yaml
name: ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run migrate:up   # node-pg-migrate against the service-container DB
      - run: npm test
      - run: npm run build
```

### 11.4 Sync Conflict Resolution Policy
StructApp avoids most conflict scenarios by design rather than by reconciliation logic:
* Master/reference data (structures, sites, assignments) is **read-only on the mobile client** — it's pulled via `/sync/pull-package`, never edited there.
* Inspector-authored records (deficiencies, photos, timesheets) are **append-only** from the device's perspective — an inspector creates new rows, never edits another user's existing rows, so two devices can't collide on the same record.
* The one residual case — an inspection is `Returned` or reassigned server-side while the contractor is mid-edit offline — is handled by making the server authoritative: if a sync payload targets an inspection whose current server status no longer permits new writes (e.g., already `Approved`), the sync fails that record with a clear conflict code, and the contractor is prompted to pull fresh state. No data is silently overwritten in either direction.

### 11.5 Data Protection & Retention (flagged for legal/compliance sign-off)
* Phone numbers and GPS coordinates are sensitive but not currently column-encrypted; if required by your jurisdiction, apply `pgcrypto` to `users.phone_number` as an additive control (RLS in Section 5 already restricts row visibility — this would add ciphertext-at-rest on top of that).
* Cloudinary URLs should be issued as signed, time-limited URLs rather than permanently public links, given the photos may constitute legal/safety evidence.
* **Retention period for inspection records and photos is a policy decision, not an engineering one** — this document does not assert a specific number of years. Confirm the required retention period with legal/compliance before building any auto-deletion logic, and default to "retain indefinitely, no auto-deletion" until that's settled.

---

*End of Blueprint v2. Build from this document; Section 0 exists only as a changelog and should not itself be treated as a build instruction.*
