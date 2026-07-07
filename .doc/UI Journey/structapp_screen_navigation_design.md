# StructApp — Screen and Navigation Design Specification

## Purpose
This document translates the StructApp module/persona journeys and MVP backlog into a role-based UI/navigation specification. It is intended for product designers, frontend engineers, and AI coding agents building the application screens.

## Scope
This covers:
- Role-based navigation
- Mobile PWA screens for Field Contractors / Inspectors
- Desktop portal screens for Reviewers and Administrators
- Page-level layout guidance
- Key controls and interactions
- Validation and empty/error/loading/offline states
- MVP vs later-phase screen priorities

## Design Principles

| Principle | Application |
|---|---|
| Role-first navigation | Users should only see actions they are allowed to perform. API still enforces permissions. |
| Offline confidence | Field users must always know whether work is local, pending sync, synced, or blocked. |
| Evidence-first review | Reviewers need field data and photo proof visible together. |
| Tenant clarity | Admins must always know which client context they are operating in. |
| No silent workflow assumptions | Submission, approval, reopening, closure, and no-deficiency inspections must be explicit. |
| Fail safely | Cross-tenant access, stale sync, invalid state transitions, and missing evidence must be blocked clearly. |
| Auditability | Governance actions must capture actor, timestamp, reason, and affected record. |

---

# 1. Global Information Architecture

## 1.1 Top-Level Experiences

| Experience | Device | Primary users | Connectivity model | Purpose |
|---|---|---|---|---|
| Field PWA | Mobile / tablet | Contractor / Inspector | Offline-first | Execute assigned inspections, capture deficiencies/photos, log time, sync work |
| Desktop Portal | Desktop / laptop | Reviewer, Admin | Online-only | Manage tenants, users, registers, assignments, review, approvals, reports, schedules, audit |

## 1.2 Role-Based Navigation Summary

| Navigation area | Contractor | Reviewer | Admin |
|---|:---:|:---:|:---:|
| Login / activation | ✓ | ✓ | ✓ |
| Client picker at login | Conditional | Conditional | Optional / admin switch later |
| Inspector dashboard | ✓ | — | — |
| Offline sync hub | ✓ | — | — |
| Assigned inspections | ✓ | ✓ | ✓ |
| Structure search / QR scan | ✓ | ✓ | ✓ |
| Deficiency capture | ✓ | — | — |
| Timesheets | ✓ own | ✓ review | ✓ review |
| Review workspace | — | ✓ | ✓ |
| Remediation verification | — | ✓ | ✓ |
| Project/site/structure admin | Read-only/cached | ✓ | ✓ |
| Import center | — | — | ✓ |
| Scheduling calendar | — | ✓ | ✓ |
| Picklist manager | — | ✓ | ✓ |
| Report publishing | — | ✓ | ✓ |
| User management | — | — | ✓ |
| Client management | — | — | ✓ |
| Audit logs | — | — | ✓ |

---

# 2. Global Shells and Shared Layouts

## 2.1 Authentication Shell

| Area | Contents |
|---|---|
| Header | StructApp logo/name, environment label if non-production |
| Main panel | Login, activation, or client picker form |
| Footer | Version/build number, privacy/security notice |
| Error area | Inline auth errors and account status messages |

### Required states
| State | Behavior |
|---|---|
| Loading session | Show blocking loading indicator while existing token is validated/refreshed |
| Invalid credentials | Show generic error; do not disclose whether email exists |
| Inactive account | Show account disabled message and support/admin contact instruction |
| Multi-client membership | Show client picker before entering app |
| Expired invite | Show activation failure and instruction to request new invite |

---

## 2.2 Mobile PWA Shell

| Region | Contents |
|---|---|
| Top bar | App name, active client name, connectivity indicator, sync status icon |
| Main body | Current task screen |
| Bottom navigation | Dashboard, Sync, Timesheets, Settings |
| Persistent offline banner | Visible when offline or degraded connectivity |
| Toast area | Save/sync/validation notifications |

### Mobile shell rules
| Rule | Description |
|---|---|
| Offline banner is never hidden while offline | User must always know they are working locally |
| Pending sync count is globally visible | Dashboard and Sync Hub must show unsynced item count |
| Destructive logout warning | If local unsynced data exists, logout requires explicit confirmation |
| Large touch targets | Primary controls must be usable with gloves/field conditions |
| Camera fallback | QR/photo workflows must provide manual fallback paths |

---

## 2.3 Desktop Portal Shell

| Region | Reviewer | Admin |
|---|---|---|
| Top bar | Active client, search, profile menu | Active client switcher, global search, profile menu |
| Left sidebar | Dashboard, Inspections, Remediation, Timesheets, Register, Calendar, Reports, Picklists | Dashboard, Clients, Users, Imports, Register, Inspections, Remediation, Timesheets, Calendar, Reports, Picklists, Audit Logs |
| Main content | Role-specific page | Role-specific page |
| Breadcrumbs | Required for nested project/site/structure/inspection pages | Required |
| Notification area | Review/return/report alerts | Governance, import, report, audit alerts |

### Desktop shell rules
| Rule | Description |
|---|---|
| Admin client context is explicit | Display active client prominently after switch |
| Reviewer cannot see Admin-only links | UI hides them, but API must still enforce |
| Long-running jobs are visible | Reports/imports show status without blocking navigation |
| Tables are paginated | All data grids use pagination/filtering |

---

# 3. Screen Inventory

## 3.1 Shared Authentication Screens

| Screen ID | Screen | Users | MVP priority |
|---|---|---|---|
| AUTH-01 | Login | All | P0 |
| AUTH-02 | Client Picker | Multi-client Contractor/Reviewer; Admin optional | P0 |
| AUTH-03 | Invite Activation | All invited users | P0 |
| AUTH-04 | Forgot/Reset Password | All | P1 |
| AUTH-05 | Session Expired / Re-login | All | P0 |

## 3.2 Contractor Mobile PWA Screens

| Screen ID | Screen | Purpose | MVP priority |
|---|---|---|---|
| MOB-01 | Inspector Dashboard | Show assigned inspections, offline status, pending sync | P0 |
| MOB-02 | Sync Hub | Pull package, push outbox, show sync errors | P0 |
| MOB-03 | Inspection Detail | Show assigned structure, status, due date, task summary | P0 |
| MOB-04 | Structure Search / QR Scan | Find asset manually or by camera scan | P0/P1 |
| MOB-05 | Historical Deficiency Triage | Review unresolved prior issues and link/triage | P0 |
| MOB-06 | Deficiency Form | Capture component, notes, ratings, GPS, photos | P0 |
| MOB-07 | Photo Capture / Evidence Manager | Capture, caption, order, and tag photos | P0 |
| MOB-08 | Inspection Submit Review | Confirm findings or no-deficiency result before submit | P0 |
| MOB-09 | Remediation Update | Advance remediation status and attach evidence | P1 |
| MOB-10 | Timesheet Draft/Edit | Draft and submit work hours | P1 |
| MOB-11 | Settings / Local Data | Session, client, storage, app version, logout | P0 |

## 3.3 Reviewer Desktop Screens

| Screen ID | Screen | Purpose | MVP priority |
|---|---|---|---|
| REV-01 | Reviewer Dashboard | Work queues and key alerts | P0 |
| REV-02 | Submitted Inspection Queue | Filterable list of inspections awaiting review | P0 |
| REV-03 | Inspection Review Workspace | Review form data and photo evidence side-by-side | P0 |
| REV-04 | Deficiency Detail / Override Panel | Inspect risk, override priority with justification | P0 |
| REV-05 | Return Inspection Modal | Return with mandatory reason | P0 |
| REV-06 | Approve Inspection Confirmation | Approve and lock record | P0 |
| REV-07 | Remediation Queue | Track open/pending verification deficiencies | P1 |
| REV-08 | Verify Closure Screen/Modal | Confirm remediation evidence and close finding | P1 |
| REV-09 | Timesheet Review Queue | Approve/reject submitted timesheets | P1 |
| REV-10 | Register Management | Manage projects, sites, structures | P0 |
| REV-11 | Calendar / Scheduling | View, assign, reschedule inspections | P2 |
| REV-12 | Report Publishing Center | Generate and download reports | P1 |
| REV-13 | Picklist Manager | Manage component and work-type lists | P1 |

## 3.4 Admin Desktop Screens

| Screen ID | Screen | Purpose | MVP priority |
|---|---|---|---|
| ADM-01 | Admin Dashboard | Global governance overview by active client | P0 |
| ADM-02 | Client Management | Create/update clients and safety contacts | P0 |
| ADM-03 | User Management | Invite, activate status, deactivate, role/membership changes | P0 |
| ADM-04 | Client Switcher | Switch active tenant context | P0 |
| ADM-05 | Import Center | Upload, validate, commit/discard CSV imports | P2 |
| ADM-06 | Audit Log Viewer | Admin-only filterable audit history | P1 |
| ADM-07 | Reopen Approved Inspection Modal | Controlled exception for approved records | P0 |
| ADM-08 | Admin Reports View | Same as reviewer, plus tenant governance access | P1 |
| ADM-09 | Admin Picklist Manager | Same as reviewer, with broader governance | P1 |

---

# 4. Detailed Screen Specifications — Shared

## AUTH-01 — Login

| Item | Specification |
|---|---|
| Users | Contractor, Reviewer, Admin |
| Route | `/login` |
| Primary goal | Authenticate user and start role-specific session |
| Required fields | Email, password |
| Primary action | Sign in |
| Secondary actions | Activate invite, forgot password |
| API | `POST /api/v1/auth/login` |
| Success behavior | Route to client picker or role dashboard |
| Error behavior | Inline error for invalid credentials, disabled account, expired session |
| Security notes | Do not reveal whether email exists; rate-limit repeated failures |

### Layout
| Region | Content |
|---|---|
| Header | Logo and product name |
| Form body | Email, password, remember/session note |
| Error block | Authentication failure message |
| Footer | Version and support link |

---

## AUTH-02 — Client Picker

| Item | Specification |
|---|---|
| Users | Multi-client Contractor/Reviewer; Admin where applicable |
| Route | `/select-client` |
| Primary goal | Choose active client context |
| Controls | Searchable client list/cards |
| API | Follow-up login/client-selection token issuance or `/auth/switch-client` for Admin |
| Success behavior | Token issued with `active_client_id`; app state initialized |
| Error behavior | Unauthorized client selection rejected |

### Acceptance states
| State | UI behavior |
|---|---|
| One client | Skip picker unless Admin explicitly switches |
| Multiple clients | Require selection |
| No active memberships | Block access and show support/admin contact |
| Admin switch | Force full state refresh after switch |

---

## AUTH-03 — Invite Activation

| Item | Specification |
|---|---|
| Users | Invited users |
| Route | `/activate?token=...` |
| Primary goal | Set password and activate account |
| Required fields | Password, confirm password |
| API | `POST /api/v1/auth/invite/activate` |
| Success behavior | Account activated, redirect to login |
| Error behavior | Expired/invalid token, password mismatch, weak password |

---

# 5. Detailed Screen Specifications — Mobile PWA

## MOB-01 — Inspector Dashboard

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/dashboard` |
| Primary goal | Select assigned work and understand sync/connectivity status |
| Data sources | Local Dexie cache; optional online refresh |
| Primary actions | Open inspection, Pull updates, Sync pending work |
| Secondary actions | Timesheet, Settings |

### Content sections
| Section | Fields / controls |
|---|---|
| Connectivity banner | Online/offline/degraded state |
| Pending sync card | Count of unsynced deficiencies, photos, timesheets |
| Assigned inspections | Status, project, site, structure asset tag, due/scheduled date, priority indicator if known |
| Returned work | Returned inspections with reason badge |
| Quick actions | Sync Now, Scan QR, Timesheet |

### States
| State | Behavior |
|---|---|
| Offline with cached work | Show cached assignments and allow work |
| Offline with no package | Show “No downloaded work package available” |
| Online with stale package | Offer Pull Updates |
| Sync errors exist | Show error count and link to Sync Hub |
| No assignments | Empty state with last sync timestamp |

---

## MOB-02 — Sync Hub

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/sync` |
| Primary goal | Manage offline package and outbox |
| APIs | `POST /sync/pull-package`, `POST /sync/push-outbox`, token refresh |
| Primary actions | Pull package, Push outbox, Retry failed sync |
| Secondary actions | View local records, clear resolved errors |

### Required panels
| Panel | Content |
|---|---|
| Connection status | Online/offline, last successful sync |
| Pull package | Assigned inspections, structures, picklists, history |
| Outbox | Pending deficiencies, photos, timesheets, submit events |
| Error list | Validation/conflict/auth errors with affected local record |
| Sync log | Recent sync attempts and outcomes |

### Error handling
| Error | UI response |
|---|---|
| `AUTH_EXPIRED` | Preserve data; prompt online login |
| Validation failure | Show affected field/record; keep local copy editable |
| Conflict | Prompt Pull Fresh Data and show record affected |
| Media upload failure | Keep photo pending; allow retry |
| Partial failure | Treat as batch failure if API is atomic |

---

## MOB-03 — Inspection Detail

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/inspections/:id` |
| Primary goal | Execute assigned inspection |
| Primary actions | Start/continue inspection, Add deficiency, Review history, Submit |
| Data | Inspection, structure, site, project, status, due date, returned reason |

### Layout
| Region | Content |
|---|---|
| Header | Structure asset tag, inspection status |
| Summary card | Project, site, due date, scheduled date, assigned by |
| Returned reason | Visible when status is Returned |
| Deficiency list | Local and synced findings with sync state |
| History card | Link to unresolved historical deficiencies |
| Actions | Add Deficiency, Mark No Deficiencies, Submit Inspection |

### State rules
| Inspection status | UI behavior |
|---|---|
| Assigned | Allow start and capture |
| In Progress | Allow capture/edit local drafts |
| Returned | Allow correction and resubmission |
| Submitted | Read-only for Contractor |
| Approved | Read-only for Contractor |
| Conflict detected | Block submit until fresh pull/resolution |

---

## MOB-04 — Structure Search / QR Scan

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/structures/search` |
| Primary goal | Locate correct structure |
| Controls | Search text, QR scan button, recent structures |
| API | `GET /structures?search=...`, `GET /structures?qr=...` online; cached lookup offline |

### States
| State | Behavior |
|---|---|
| Camera permission denied | Show manual search fallback |
| QR no match | Show not-found message and manual search |
| Offline search | Search only downloaded structures |
| Multiple matches | Show disambiguating project/site/asset details |
| Structure outside assignment | Show read-only or blocked message according to authorization |

---

## MOB-05 — Historical Deficiency Triage

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | Embedded in inspection/deficiency flow |
| Primary goal | Link new finding to unresolved prior issue where applicable |
| Data | Prior unresolved deficiencies for structure |
| Required decision | New unrelated, Resolved, Still Outstanding, Worsened |

### Triage table
| Column | Description |
|---|---|
| Prior deficiency | Component/type and short description |
| Last priority | P1–P5 |
| Last observed | Date and inspection reference |
| Evidence thumbnail | Photo preview if available |
| Decision | Required dropdown/radio |
| Link created | Whether new deficiency uses `previous_deficiency_id` |

### Rules
| Rule | Behavior |
|---|---|
| Unresolved history exists | Prompt user before completing inspection |
| No history | Skip triage but show empty state |
| Worsened/Still Outstanding | Require new deficiency linkage |
| Resolved | Allow status/triage update with optional evidence |
| New unrelated | Do not set previous deficiency ID |

---

## MOB-06 — Deficiency Form

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/inspections/:id/deficiencies/new` and edit local draft |
| Primary goal | Capture a valid finding |
| Data | Component type, notes, description, risk ratings, GPS, photos, triage linkage |
| Save model | Local-first draft/autosave |

### Fields
| Field | Required | Validation |
|---|---:|---|
| Component type | Yes | Must be active cached picklist entry |
| Component notes | No | Max length according to contract |
| Description | Yes | Minimum meaningful length |
| Severity | Yes | Integer 1–5 |
| Probability | Yes | Integer 1–5 |
| Consequences | Yes | Integer 1–5 |
| GPS latitude | Conditional/optional | −90 to 90 |
| GPS longitude | Conditional/optional | −180 to 180 |
| Photos | Usually required by workflow | Max five; captions required |
| Triage linkage | Conditional | Required where unresolved prior item is selected |

### UX rules
| Rule | Behavior |
|---|---|
| Risk preview | Show provisional P1–P5 immediately |
| Server authority | After sync, replace preview with confirmed tier |
| Offline save | Show local saved timestamp |
| Validation errors | Inline near field and summary at top |
| P1 preview | Warn that urgent alert will be confirmed after sync |

---

## MOB-07 — Photo Capture / Evidence Manager

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | Embedded or `/m/deficiencies/:localId/photos` |
| Primary goal | Capture defensible evidence |
| Controls | Add photo, caption, delete local unsynced photo, reorder, purpose tag |
| Data | Local photo file/blob, EXIF metadata, caption, purpose |

### Rules
| Rule | Behavior |
|---|---|
| Max five photos | Disable add button at five; server also enforces |
| Caption required | Block sync/submit until caption exists |
| Unsynced delete | Contractor may remove local unsynced photo |
| Synced evidence | Deletion restricted according to workflow/approval state |
| Remediation photo | Purpose can be `remediation_evidence` in remediation flow |

---

## MOB-08 — Inspection Submit Review

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/inspections/:id/submit` |
| Primary goal | Prevent accidental incomplete submissions |
| Primary actions | Sync first, Submit inspection |
| Required confirmations | Findings summary or explicit no-deficiencies confirmation |

### Pre-submit checklist
| Check | Required outcome |
|---|---|
| Pending local deficiencies | Must be synced or submission blocked |
| Missing required fields | Must be corrected |
| Photo captions | Must be complete |
| Triage decisions | Must be complete where applicable |
| Empty inspection | User must check “No deficiencies found” |
| Offline state | Cannot submit to server while offline; allow local intent only if design supports it |

---

## MOB-09 — Remediation Update

| Item | Specification |
|---|---|
| Users | Contractor, Reviewer/Admin if using mobile in future |
| Route | `/m/deficiencies/:id/remediation` |
| Primary goal | Update progress on known deficiency |
| Actions | Mark Scheduled, Mark Remediated Pending Verification, Add remediation evidence |

### Rules
| Rule | Behavior |
|---|---|
| Contractor cannot verify close | Closure action disabled/hidden |
| Evidence optional for Scheduled | Due date optional |
| Evidence expected for Pending Verification | Photo tagged remediation evidence |
| Verified Closed | Read-only for Contractor |

---

## MOB-10 — Timesheet Draft/Edit

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/timesheets` |
| Primary goal | Record and submit daily labor |
| Fields | Date, project, work type, hours, notes |
| APIs | Local save, sync to timesheet endpoints |

### Rules
| Rule | Behavior |
|---|---|
| Hours limit | Must be >0 and ≤24 |
| Work type | Must be active picklist |
| Draft | Editable by owner |
| Submitted | Locked from contractor edits |
| Rejected | Rejection reason visible |

---

## MOB-11 — Settings / Local Data

| Item | Specification |
|---|---|
| Users | Contractor |
| Route | `/m/settings` |
| Primary goal | Show account, client, app, storage, and logout controls |
| Fields | User, role, active client, app version, last sync, local storage usage |
| Actions | Logout, retry sync, view diagnostics |

### Rules
| Rule | Behavior |
|---|---|
| Unsynced data exists | Warn before logout or local clear |
| Diagnostics | Do not expose secrets/tokens |
| Client switch | Contractor cannot switch unless login flow grants membership selection |

---

# 6. Detailed Screen Specifications — Reviewer Desktop

## REV-01 — Reviewer Dashboard

| Item | Specification |
|---|---|
| Users | Reviewer |
| Route | `/reviewer/dashboard` |
| Primary goal | Overview of work requiring attention |
| Cards | Submitted inspections, returned aging, P1 items, remediation pending verification, report jobs, timesheets pending |

### Interactions
| Control | Behavior |
|---|---|
| Queue card click | Opens filtered list |
| P1 item click | Opens inspection/deficiency detail |
| Report status click | Opens report job |
| Calendar preview | Opens scheduling view if enabled |

---

## REV-02 — Submitted Inspection Queue

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/inspections` |
| Primary goal | Find and prioritize inspections for review |
| API | `GET /inspections?status=&inspector_id=&page=` |

### Table columns
| Column | Description |
|---|---|
| Status | Assigned/In Progress/Submitted/Returned/Approved |
| Priority | Highest deficiency priority |
| Project | Project title |
| Site | Site name |
| Structure | Asset tag/description |
| Inspector | Assigned user |
| Submitted at | Timestamp |
| Due/scheduled date | Date |
| Actions | Open, Return, Approve where valid |

### Filters
| Filter | Options |
|---|---|
| Status | All statuses |
| Priority | P1–P5 |
| Project/site | Search/select |
| Inspector | Active inspectors |
| Date range | Due/submitted date |
| Returned only | Toggle |

---

## REV-03 — Inspection Review Workspace

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/inspections/:id/review` |
| Primary goal | Review field evidence efficiently |
| Layout | Split view: data left, photos/evidence right |

### Layout
| Region | Content |
|---|---|
| Header | Inspection status, structure, project, site, inspector, dates |
| Left pane | Deficiency list and selected deficiency fields |
| Right pane | Photo gallery, metadata, GPS/map link if available |
| Bottom/action bar | Return, Approve, Generate draft report, Admin reopen if applicable |
| Side panel | History/carry-forward chain |

### Required behaviors
| Behavior | Requirement |
|---|---|
| Select deficiency | Updates field detail and photo gallery |
| Override priority | Opens override panel requiring justification |
| Return | Requires reason |
| Approve | Confirmation explains record will lock |
| Approved record | Read-only except Admin reopen |

---

## REV-04 — Deficiency Detail / Override Panel

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | Embedded panel or `/deficiencies/:id` |
| Primary goal | Review and adjust engineering priority where justified |
| API | `GET /deficiencies/:id`, `PATCH /deficiencies/:id` |

### Fields shown
| Field | Behavior |
|---|---|
| Component type/notes | Read-only after submission except allowed workflow states |
| Description | Read-only unless returned/reopened flow |
| Severity/probability/consequence | Show original ratings |
| Calculated priority | Read-only server value |
| Original priority | Visible if overridden |
| Adjusted priority | Editable only via override |
| Justification | Required for override |
| Override actor/time | Visible after override |

---

## REV-05 — Return Inspection Modal

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Trigger | Return button from submitted inspection |
| Required input | Return reason |
| API | `POST /inspections/:id/return` |

### Rules
| Rule | Behavior |
|---|---|
| Empty reason | Block submit |
| Approved inspection | Cannot return unless Admin reopens first |
| Successful return | Status Returned; inspector notified |
| Modal close | No state change |

---

## REV-06 — Approve Inspection Confirmation

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Trigger | Approve button |
| API | `POST /inspections/:id/approve` |

### Confirmation copy must communicate
| Item | Required message |
|---|---|
| Locking | Approved inspection records become immutable |
| Exception path | Admin reopen is required for future correction |
| Actor | Approval is recorded with reviewer/admin identity |
| Time | Approval timestamp is recorded |

---

## REV-07 — Remediation Queue

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/remediation` |
| Primary goal | Track and verify open remediation work |

### Table columns
| Column | Description |
|---|---|
| Status | Open/Scheduled/Pending Verification/Verified Closed |
| Priority | Current priority |
| Structure | Asset |
| Deficiency | Short description |
| Due date | Remediation due date |
| Evidence | Has/does not have remediation evidence |
| Owner/inspector | Related user |
| Actions | Open, Verify Closure where valid |

---

## REV-08 — Verify Closure Modal

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Trigger | Verify closure from remediation detail |
| API | `POST /deficiencies/:id/verify-closure` |

### Rules
| Rule | Behavior |
|---|---|
| No remediation evidence | Disable action and explain requirement |
| Contractor role | No access |
| Successful closure | Status Verified Closed; verifier/time recorded |
| Approved immutable parent | Direct edits blocked after approval |

---

## REV-09 — Timesheet Review Queue

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/timesheets/review` |
| Primary goal | Approve/reject submitted timesheets |

### Table columns
| Column | Description |
|---|---|
| Worker | Contractor |
| Date | Work date |
| Project | Project |
| Work type | Picklist value |
| Hours | Numeric |
| Status | Submitted/Approved/Rejected |
| Actions | Approve, Reject |

### Rules
| Rule | Behavior |
|---|---|
| Reject | Requires reason |
| Approve | Records approver/time |
| Contractor visibility | Contractor sees own outcome only |

---

## REV-10 — Register Management

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/register` |
| Primary goal | Manage project/site/structure hierarchy |

### Layout
| Area | Content |
|---|---|
| Project table/tree | Projects with filters and create/edit |
| Site panel | Sites under selected project |
| Structure grid | Structures under selected site |
| Detail drawer | Create/edit form for selected entity |

### Rules
| Rule | Behavior |
|---|---|
| Contractor | No write access |
| Unique asset tag | Enforced per site |
| QR value | Optional but unique if provided |
| Pagination | Required for grids |

---

## REV-11 — Calendar / Scheduling

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/calendar` |
| Primary goal | Plan recurring and assigned inspections |
| APIs | `GET /inspections/calendar`, `GET/POST/PATCH /schedules`, `PATCH /inspections/:id/schedule` |

### Views
| View | Description |
|---|---|
| Month | High-level workload view |
| Week | Operational planning |
| Inspector filter | View by individual inspector |
| Schedule list | Recurring schedules and next due dates |

### Rules
| Rule | Behavior |
|---|---|
| Generated occurrence | Visually distinct if generated by recurrence |
| Drag/drop | Requires confirmation when changing inspector/date |
| Duplicate prevention | Same schedule/date cannot duplicate |
| Pause schedule | Future generation stops; historical assignments remain |

---

## REV-12 — Report Publishing Center

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/reports` |
| Primary goal | Generate and retrieve deliverables |
| APIs | `POST /reports/generate`, `GET /reports/:job_id` |

### Controls
| Control | Options |
|---|---|
| Project selector | Tenant-scoped projects |
| Report type | Draft PDF, Final PDF, Word, Excel |
| Generate button | Creates job |
| Job list | Status, requested by, created at, completed at |
| Download | Available only when Ready |

### States
| State | Behavior |
|---|---|
| Queued | Show pending |
| Processing | Show progress/processing state |
| Ready | Show signed download link |
| Failed | Show safe error and retry option |
| Draft PDF | Watermark expectation |

---

## REV-13 — Picklist Manager

| Item | Specification |
|---|---|
| Users | Reviewer, Admin |
| Route | `/settings/picklists` or `/picklists` |
| Primary goal | Manage component types and work types |
| APIs | `/component-types`, `/work-types` |

### Rules
| Rule | Behavior |
|---|---|
| Add value | Validate uniqueness within client |
| Rename value | Historical records display updated label if referencing same ID |
| Deactivate value | Hide from new forms, keep historical reference |
| Hard delete | Not available |

---

# 7. Detailed Screen Specifications — Admin Desktop

## ADM-01 — Admin Dashboard

| Item | Specification |
|---|---|
| Users | Admin |
| Route | `/admin/dashboard` |
| Primary goal | Governance overview for active client or global context |
| Cards | Clients, users, imports, P1 alerts, submitted inspections, report jobs, audit events |

### Rules
| Rule | Behavior |
|---|---|
| Active client visible | Always show current context |
| Cross-client data | Only in explicit global/admin views |
| Quick actions | Create client, invite user, switch client, import CSV |

---

## ADM-02 — Client Management

| Item | Specification |
|---|---|
| Users | Admin |
| Route | `/admin/clients` |
| Primary goal | Create and maintain clients |
| API | `GET/POST /clients`, `GET/PATCH /clients/:id` |

### Fields
| Field | Required | Notes |
|---|---:|---|
| Client name | Yes | Unique |
| Safety contact email | Yes | Used for P1 alerts |
| Status | Optional/future | Active/inactive if implemented |
| Created/updated metadata | Read-only | Audit support |

---

## ADM-03 — User Management

| Item | Specification |
|---|---|
| Users | Admin |
| Route | `/admin/users` |
| Primary goal | Invite and maintain users/roles/memberships |
| APIs | `/users`, `/auth/invite/provision` |

### Table columns
| Column | Description |
|---|---|
| Name/email | User identity |
| Role | Admin/Reviewer/Contractor |
| Clients | Membership summary |
| Active | Active/inactive |
| Last login | Timestamp |
| Actions | Invite, edit role, edit memberships, deactivate |

### Rules
| Rule | Behavior |
|---|---|
| Contractor/Reviewer membership | At least one client required |
| Admin membership | Not required |
| Deactivate | Historical records remain attributed |
| Role change | Requires confirmation and audit |

---

## ADM-04 — Client Switcher

| Item | Specification |
|---|---|
| Users | Admin |
| Location | Desktop top bar |
| Primary goal | Switch operational tenant context |
| API | `POST /auth/switch-client` |

### Rules
| Rule | Behavior |
|---|---|
| Switch | Reissues token and refreshes app state |
| Unsaved form data | Warn before switching |
| Breadcrumbs/tables | Reset after switch |
| Audit | Switch recorded |

---

## ADM-05 — Import Center

| Item | Specification |
|---|---|
| Users | Admin |
| Route | `/admin/imports` |
| Primary goal | Stage, validate, commit, or discard CSV register imports |
| APIs | `/imports/batches` |

### Flow screens
| Screen/section | Purpose |
|---|---|
| Upload CSV | Select file, show required columns |
| Validation results | Row table with status and errors |
| Commit confirmation | Summarize rows to insert/match |
| Batch history | Past Pending/Validated/Committed/Discarded batches |

### Rules
| Rule | Behavior |
|---|---|
| Missing required columns | Mark row invalid |
| Commit | Atomic all-or-nothing |
| Discard | Explicit confirmation |
| Non-admin | No route and API `403` |

---

## ADM-06 — Audit Log Viewer

| Item | Specification |
|---|---|
| Users | Admin only |
| Route | `/admin/audit-logs` |
| Primary goal | Review governance and data changes |
| API | `GET /audit-logs?table_name=&record_id=&page=` |

### Filters
| Filter | Description |
|---|---|
| Table name | Entity/table |
| Record ID | Specific UUID |
| Actor | User/system |
| Date range | Timestamp range |
| Action | Create/update/delete/approve/reopen/override etc. |

### Rules
| Rule | Behavior |
|---|---|
| Reviewer direct access | API returns `403` |
| Read-only | No edit/delete controls |
| Sensitive data | Mask secrets/tokens; avoid exposing passwords |
| Pagination | Required |

---

## ADM-07 — Reopen Approved Inspection Modal

| Item | Specification |
|---|---|
| Users | Admin only |
| Trigger | Approved inspection detail |
| API | `POST /inspections/:id/reopen` |

### Fields
| Field | Required | Validation |
|---|---:|---|
| Target status | Yes | Submitted or Returned |
| Reason | Yes | Minimum meaningful length |
| Confirmation checkbox | Yes | Confirms reopening unlocks controlled correction path |

### Success behavior
| Target | Outcome |
|---|---|
| Submitted | Inspection returns to reviewer/admin correction path |
| Returned | Inspection returns to contractor correction path |
| Both | Reopened by/at/reason stored and audited |

---

# 8. Global Components

## Component Inventory

| Component | Used by | Purpose |
|---|---|---|
| ConnectivityBanner | Mobile | Persistent online/offline/degraded status |
| SyncStatusBadge | Mobile | Draft/Pending/Synced/Error status |
| RoleGuard | All | Conditionally render allowed controls |
| TenantContextBadge | Desktop | Shows active client |
| ClientSwitcher | Admin | Changes active client |
| DataTable | Desktop | Paginated/filterable tables |
| EntityDrawer | Desktop | Create/edit forms for register/admin data |
| RiskMatrixInput | Mobile/Desktop | Capture/display severity/probability/consequence |
| PriorityBadge | All | P1–P5 visual indicator |
| PhotoEvidenceGallery | Mobile/Desktop | Capture/view photos and metadata |
| QrScanButton | Mobile | Scan structure QR/barcode |
| InspectionStatusBadge | All | Assigned/In Progress/Submitted/Returned/Approved |
| RemediationStatusTracker | Mobile/Desktop | Open/Scheduled/Pending/Verified Closed |
| AuditMetadataPanel | Desktop | Actor/timestamp/provenance display |
| ReportJobStatusCard | Desktop | Queued/Processing/Ready/Failed report jobs |
| ConfirmationModal | All | Confirm irreversible/governed actions |
| ErrorSummary | All forms | Field and workflow validation summary |

---

# 9. Empty, Loading, Error, and Offline States

## 9.1 Empty states

| Screen | Empty state |
|---|---|
| Inspector Dashboard | “No assigned inspections in your downloaded work package.” |
| Sync Hub | “No pending work to sync.” |
| Review Queue | “No submitted inspections match these filters.” |
| Remediation Queue | “No deficiencies pending remediation verification.” |
| Reports | “No report jobs yet. Generate a report to begin.” |
| Imports | “No import batches yet. Upload a CSV to start.” |
| Audit Logs | “No audit events match your filters.” |

## 9.2 Loading states

| Situation | UI behavior |
|---|---|
| Initial auth/session check | Full-page loader |
| Table loading | Skeleton rows |
| Pull package | Progress panel with current phase |
| Push outbox | Progress panel and warning not to close if needed |
| Report generation | Async job status, not blocking page |
| Import validation | Batch status panel |

## 9.3 Error states

| Error type | UI behavior |
|---|---|
| Validation error | Inline field error plus top summary |
| Authorization error | Explain access is not permitted; avoid leaking record details |
| Cross-tenant not found | Generic not found/access denied |
| Sync conflict | Show affected record and “Pull Fresh Data” action |
| Media upload error | Keep local photo pending and retryable |
| Report job failure | Safe error and retry option |
| Import failure | Row-level errors and rollback notice |

## 9.4 Offline states

| Situation | UI behavior |
|---|---|
| Offline with cached package | Continue work normally with offline banner |
| Offline without package | Block new field work and explain package is required |
| Attempt submit offline | Save intent locally or block server submit with clear message |
| Token expired offline | Continue local work; sync requires online re-login/refresh |
| Sync pending | Keep pending count visible |

---

# 10. MVP Screen Delivery Plan

## P0 screens — build first

| Order | Screen/component | Reason |
|---:|---|---|
| 1 | Login, activation, client picker | Required for all access |
| 2 | Desktop and mobile shells | Required app frame |
| 3 | Admin client/user management | Required tenant/user setup |
| 4 | Register management | Required before assignments |
| 5 | Inspection assignment and dashboard | Required for field work |
| 6 | Mobile sync hub and local storage states | Required for offline workflow |
| 7 | Deficiency form and photo manager | Core field capture |
| 8 | Submit inspection review | Required workflow transition |
| 9 | Reviewer queue and review workspace | Required office workflow |
| 10 | Return/approve modals | Required lifecycle completion |
| 11 | Admin reopen modal | Required safe correction of approved records |
| 12 | Core authorization/forbidden screens | Required safe access behavior |

## P1 screens — build after core vertical slice

| Screen/component | Reason |
|---|---|
| Remediation queue and verification | Required for close-out completeness |
| Timesheets | Workforce tracking |
| Reports | Deliverable generation |
| Picklist manager | Standardized classification management |
| Notifications UI/status views | Operational confidence |
| Audit log viewer | Governance visibility |

## P2 screens — build after MVP stabilization

| Screen/component | Reason |
|---|---|
| CSV Import Center | Operational scale improvement |
| Scheduling calendar | Recurring inspection planning |
| Advanced analytics/dashboarding | Management visibility |
| Advanced global search | Convenience |

---

# 11. End-to-End UI Acceptance Scenarios

## Scenario 1 — Contractor completes inspection offline and syncs later
| Step | Expected UI result |
|---|---|
| Contractor logs in online and pulls package | Dashboard shows assigned inspection and last sync time |
| Contractor goes offline | Offline banner appears |
| Contractor opens inspection | Cached details load |
| Contractor adds deficiency and photos | Local save success and Pending Sync badge visible |
| Contractor returns online | Sync Hub enables push |
| Contractor syncs | Batch succeeds; records show Synced |
| Contractor submits inspection | Status becomes Submitted |

## Scenario 2 — Reviewer returns inspection
| Step | Expected UI result |
|---|---|
| Reviewer opens Submitted queue | Inspection is visible |
| Reviewer opens review workspace | Form data and photos load |
| Reviewer clicks Return | Modal requires reason |
| Reviewer submits return | Status becomes Returned |
| Contractor dashboard updates after pull | Returned item and reason visible |

## Scenario 3 — Reviewer approves inspection
| Step | Expected UI result |
|---|---|
| Reviewer opens submitted inspection | Approve button available |
| Reviewer confirms approval | Locking warning is shown |
| Approval succeeds | Status becomes Approved |
| Contractor opens same inspection | Read-only |
| Reviewer attempts edit | Blocked unless valid override path before approval or Admin reopen after approval |

## Scenario 4 — P1 deficiency notification
| Step | Expected UI result |
|---|---|
| Contractor enters high-risk values | Provisional P1 warning shown |
| Contractor syncs | Server confirms P1 |
| System sends alerts | Notification log/status records event |
| Reviewer dashboard | P1 item appears prominently |

## Scenario 5 — Admin reopens approved inspection
| Step | Expected UI result |
|---|---|
| Admin opens Approved inspection | Reopen button visible |
| Reviewer opens same inspection | Reopen button not visible |
| Admin reopens to Returned with reason | Status changes to Returned; reason stored |
| Contractor pulls updates | Returned inspection appears with reason |
| Audit log | Reopen event visible |

## Scenario 6 — Remediation verification blocked without evidence
| Step | Expected UI result |
|---|---|
| Deficiency is Pending Verification | Reviewer opens remediation item |
| No remediation evidence photo exists | Verify Closure disabled with explanation |
| Evidence photo added | Verify Closure enabled |
| Reviewer verifies | Status becomes Verified Closed |

---

# 12. AI Agent Implementation Instructions

When using this document with an AI coding agent:

1. Build screens in P0 delivery order first.
2. Use the backlog as the source of implementation tasks.
3. Use this screen spec as the source of UI structure, navigation, and states.
4. Do not expose hidden Admin/Reviewer functionality in the UI, but still enforce authorization at the API.
5. Do not implement P2 screens until P0 and P1 workflows are complete unless explicitly instructed.
6. Treat offline/sync states as first-class UI requirements, not a later enhancement.
7. Every destructive or governance action must use a confirmation modal and produce an audit event where applicable.
8. Every table/list must support pagination and empty/loading/error states.
9. Any ambiguity should be resolved in favor of safety, auditability, and tenant isolation.
