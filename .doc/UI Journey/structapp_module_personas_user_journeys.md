# StructApp — Module Decomposition, Personas, and End-to-End User Journeys

> Based on v3 as the current functional baseline, with v2 used for inherited architecture, API, security, and offline-sync behavior.

## 1. Product Boundary and Actors

| Item | Definition |
|---|---|
| Product | Multi-tenant structural-asset, inspection, deficiency, remediation, workforce-time, and reporting platform |
| Field experience | Offline-first mobile PWA for contractors/inspectors |
| Office experience | Online desktop portal for reviewers and administrators |
| Tenant | A paying client organization; data is isolated by `client_id` and PostgreSQL RLS |
| External recipient | Client/facility owner receives deliverables only; there is no client portal or client login |
| Assignment model | One inspector per inspection; multiple inspectors may have separate inspections for different assets, but joint inspections are out of scope |
| Core record lifecycle | Asset → inspection → deficiency → remediation → verification/closure → reporting |
| Key safety rule | A P1 deficiency causes post-commit safety notifications; the server—not the device—confirms the persisted risk tier |

## 2. Module Catalogue

| # | Module | Primary users | Main responsibilities | Core records | Main REST endpoints | Important rules / edge cases |
|---:|---|---|---|---|---|---|
| 1 | Identity, authentication & sessions | All authenticated users | Login, refresh, logout, invitation activation, client-context selection | `users`, `client_memberships`, refresh-token store | `POST /auth/login`, `/refresh`, `/logout`, `/invite/provision`, `/invite/activate`, `/switch-client` | Access token lasts 15 minutes; refresh token has a 30-day sliding expiry. Offline work remains local; authentication is checked when syncing. |
| 2 | Tenant context & authorization | All; especially Admin | Enforce active client, memberships, role permissions, database RLS | JWT claims, `client_memberships`, tenant-scoped records | Applied middleware to all non-auth endpoints | Admin can switch active client; Reviewer/Contractor can only work within memberships. Database RLS is the backstop. |
| 3 | Client administration | Admin | Create and update client organizations; set safety contact | `clients` | `GET/POST /clients`, `GET/PATCH /clients/:id` | Global admin function; safety contact is used for P1 email alerts. |
| 4 | User & membership administration | Admin | Invite, activate, deactivate, change roles, assign client memberships | `users`, `client_memberships` | `POST /auth/invite/provision`, `POST /auth/invite/activate`, `GET/PATCH /users` | Reviewer/Contractor require membership; inactive users cannot authenticate. |
| 5 | Project, site & structure register | Admin, Reviewer; Contractor read-only | Manage hierarchy and searchable asset register | `projects`, `sites`, `structures` | `GET/POST/PATCH /projects`; `GET/POST /sites`; `GET/POST /structures` | Structures have unique asset tags per site and optional QR value. Mobile users do not edit master data. |
| 6 | CSV import sandbox | Admin | Upload, validate, inspect, atomically commit/discard bulk register data | `import_batches`, `import_rows` | `POST /imports/batches`, `GET /imports/batches/:id`, `POST .../commit`, `POST .../discard` | Required fields include project, site, asset tag, and description. Commit is all-or-nothing. |
| 7 | Offline data package & sync | Contractor | Pull assignments/reference data; locally save field work; upload atomic outbox | Dexie IndexedDB, inspections, deficiencies, photos, timesheets | `POST /sync/pull-package`, `POST /sync/push-outbox` | Reference data is read-only on mobile. Device-authored records are append-only. Conflicting server state rejects affected records rather than overwriting them. |
| 8 | Inspection assignment & lifecycle | Admin, Reviewer, Contractor | Assign, perform, submit, return, approve, reopen inspections | `inspections` | `GET/POST /inspections`, `GET /inspections/:id`, `POST /submit`, `/return`, `/approve`, `/reopen` | Only Admin can reopen Approved inspections. Submission requires a synced deficiency or an explicit no-deficiencies confirmation. |
| 9 | QR/search asset access | Contractor | Locate asset via manual search or camera scan | `structures.qr_code_value` | `GET /structures?site_id=&search=&qr=` | Camera failure/no match must offer manual search fallback. |
| 10 | Deficiency capture & risk assessment | Contractor creates; Reviewer/Admin governs | Capture component, narrative, ratings, GPS, photo evidence, historic linkage | `deficiency_records`, `photos`, `photo_evidence_metadata` | Sync payload; `GET /deficiencies/:id`; `PATCH /deficiencies/:id` | Risk = severity × probability × consequences, with a critical safety override; client preview is advisory and server calculation persists. |
| 11 | Carry-forward / reinspection triage | Contractor, Reviewer | Link current findings to unresolved historical deficiencies | `previous_deficiency_id`, `triage_state` | `GET /structures/:id/history`; deficiency sync | Unresolved history must be triaged; linked records preserve an auditable chain. |
| 12 | Photo evidence & media | Contractor, Reviewer, Admin | Capture/upload up to five photos per deficiency, preserve metadata, tag evidence purpose | `photos`, `photo_evidence_metadata` | Included in sync and remediation flows | Cloud media stores rendered images; EXIF metadata is retained as the evidence record. |
| 13 | Priority override & engineering review | Reviewer, Admin | Override calculated priority with justification and provenance | deficiency override fields, audit logs | `PATCH /deficiencies/:id` | Mandatory justification; preserves original priority, actor, and timestamp. |
| 14 | Remediation & close-out | All scoped users; closure by Reviewer/Admin | Move defects through remediation lifecycle and verify closure | remediation fields, evidence photos | `PATCH /deficiencies/:id/remediation`, `POST /deficiencies/:id/verify-closure` | Lifecycle: Open → Scheduled → Pending Verification → Verified Closed. Closure requires remediation-evidence photo and Reviewer/Admin authority. |
| 15 | Timesheets | Contractor, Reviewer, Admin | Draft, submit, approve/reject daily labour logs | `timesheet_entries`, `work_types` | `GET /timesheets`, `POST /timesheets/:id/submit`, `/approve`, `/reject` | Contractor can only work on own records; submission locks contractor editing; rejection requires reason. |
| 16 | Managed picklists | Admin, Reviewer | Maintain client-specific component and work-type lists | `component_types`, `work_types` | `GET/POST/PATCH /component-types`, equivalent `/work-types` | Entries are deactivated, never hard-deleted, preserving historical references. |
| 17 | Recurring inspection scheduling | Admin, Reviewer | Define intervals, create upcoming work, calendar-plan/reassign | `inspection_schedules`, scheduled inspection fields | `GET/POST/PATCH /schedules`, `GET /inspections/calendar`, `PATCH /inspections/:id/schedule` | Daily idempotent job generates occurrences in a lead window; default is fixed-day interval recurrence. |
| 18 | Notifications | Contractor, Reviewer, Admin, safety contact | Send invite, assignment, submission, return, P1, and report-ready notifications | notification jobs/logging | Triggered by workflow endpoints | Email via SendGrid; SMS is reserved for P1 alerts. Notifications fire after successful transaction commit. |
| 19 | Reporting & publishing | Reviewer, Admin | Generate draft/final PDF, Word, and Excel packages | `report_jobs` | `POST /reports/generate`, `GET /reports/:job_id` | Asynchronous job; status polling returns a signed download URL when ready. |
| 20 | Audit & compliance | Admin | Read immutable operational history | `system_audit_logs` | `GET /audit-logs` | Admin-only route; Reviewer must receive `403`. |
| 21 | Data integrity & governance | System | RLS, audit triggers, immutability, validations, pagination, CI/migrations | PostgreSQL, migrations, audit tables | Cross-cutting | Approved inspection records are locked; reopening is the controlled exception. Lists use page/page_size with max 100. |

## 3. Personas and Permissions

| Persona | Goals | Device/context | Main capabilities | Explicit restrictions |
|---|---|---|---|---|
| Field Contractor / Inspector | Complete assigned inspections safely in low-connectivity areas; capture defensible evidence; log time | Mobile PWA, often offline | Pull package, view own assignments, search/scan assets, create deficiencies/photos, triage history, submit inspections, update remediation progress, draft/submit timesheets | Cannot manage clients/users/master data; cannot approve/return/reopen; cannot override risk; cannot verify-close remediation; cannot access audit logs |
| Engineering Reviewer | Validate field evidence, apply engineering judgment, manage ongoing work and deliverables | Online desktop portal | Create assignments, manage projects/sites/structures, review submissions, return/approve, override priority with justification, manage schedules/picklists, verify remediation closure, generate reports, approve/reject timesheets | Cannot reopen Approved inspections; cannot access audit logs |
| System Administrator | Govern all tenants, users, data quality, exceptional corrections, and compliance | Online desktop portal | All reviewer functions plus client onboarding, user/membership administration, imports, cross-client switching, reopen approved records, audit-log access | Must use controlled reopen rather than bypassing record controls |
| Client safety contact | Receive urgent safety notice | Email recipient | Receives P1 alert | No application account |
| Report recipient / facility owner | Consume issued deliverables | Email/signed link | Download report package | No login, editing, workflow, or portal access |
| Background system worker | Generate schedules, reports, notifications | Server-side | Create scheduled occurrences, render files, dispatch notifications | Must be idempotent and transaction-aware |

### Permission Matrix

| Capability | Contractor | Reviewer | Admin | External recipient |
|---|:---:|:---:|:---:|:---:|
| Authenticate | ✓ | ✓ | ✓ | — |
| Switch active client in header | — | — | ✓ | — |
| Manage clients/users/memberships | — | — | ✓ | — |
| Import CSV | — | — | ✓ | — |
| Create/edit projects, sites, structures | Read-only | ✓ | ✓ | — |
| Pull offline package | ✓ | — | — | — |
| Create deficiency/photos | ✓ | — | — | — |
| View deficiency history | ✓ | ✓ | ✓ | — |
| Override priority | — | ✓ | ✓ | — |
| Update remediation progress | ✓ | ✓ | ✓ | — |
| Verify remediation closure | — | ✓ | ✓ | — |
| Assign/reschedule inspections | — | ✓ | ✓ | — |
| Submit inspection | ✓ | — | — | — |
| Return/approve inspection | — | ✓ | ✓ | — |
| Reopen approved inspection | — | — | ✓ | — |
| Submit timesheet | ✓ | — | — | — |
| Approve/reject timesheet | — | ✓ | ✓ | — |
| Generate/download reports | — | ✓ | ✓ | Download only |
| View audit logs | — | — | ✓ | — |

## 4. Shared Authentication and Authorization Journey

| Step | User action | UI/system behavior | API / data behavior | Success outcome | Exception / recovery |
|---:|---|---|---|---|---|
| 1 | User opens PWA or desktop portal | Shows login screen | None | Credentials can be entered | If offline before prior login, show locally available offline state only; no new login possible |
| 2 | User enters email/password | Client validates required format | `POST /api/v1/auth/login` | Credentials verified | Invalid credentials/inactive user returns error; no token issued |
| 3 | System evaluates role and memberships | Determines tenant context | Reads `users`, `client_memberships` | Single-client user receives tokens immediately | Multi-client user receives client-picker response |
| 4 | User chooses client | Client confirms selected membership | Client selection issues token with `active_client_id` | Session is scoped to selected client | Unauthorized client selection is rejected |
| 5 | Token issued | Client stores auth state | Access JWT includes user, role, active client; refresh token stored in Dexie for PWA | User lands on role-specific home | Access-token expiry is tracked |
| 6 | Protected request | API authenticates request | Middleware applies `SET LOCAL app.current_client_id` | RLS filters tenant records | Missing/invalid/expired token returns auth error |
| 7 | Access token expires online | Client refreshes silently | `POST /api/v1/auth/refresh` | New access token issued | Expired/revoked refresh token requires online re-login |
| 8 | Contractor works offline | PWA allows local work and queues it | No server token check during local-only editing | Work is preserved in Dexie | UI shows offline/pending-sync state |
| 9 | Contractor reconnects | PWA refreshes token if necessary then syncs | `POST /auth/refresh`, then `POST /sync/push-outbox` | Atomic sync commits | `AUTH_EXPIRED`: preserve local data and require online login |
| 10 | User logs out | Client clears active session | `POST /api/v1/auth/logout`; refresh token revoked | User returns to login | Warn about unsynced local work before clearing state |

## 5. Contractor / Inspector Journeys

### 5.1 First-Time Account Activation

| Step | Actor action | Screen / state | REST/API | Validation & system rules | Completion |
|---:|---|---|---|---|---|
| 1 | Admin provisions invite | Admin user-management workflow | `POST /auth/invite/provision` | Email, phone, role, and client IDs validated | Invitation notification sent |
| 2 | Contractor opens invite | Activation screen | Invite token validated | Expired/used/invalid token blocked | Password setup enabled |
| 3 | Contractor sets password | Activation form | `POST /auth/invite/activate` | Password persisted as `password_hash`; profile activated | Account becomes active |
| 4 | Contractor logs in | Login screen | `POST /auth/login` | Membership determines accessible clients | Session and offline auth state created |
| 5 | Contractor downloads work package | Dashboard / Sync Hub | `POST /sync/pull-package` | Only assigned inspections and permitted reference data returned | Ready for offline work |

### 5.2 Daily Field Inspection, Including Offline Capture

| Step | Actor action | UI state | API/data operation | Controls and validations | Result |
|---:|---|---|---|---|---|
| 1 | Opens Inspector Dashboard | Assigned inspections, dates, connectivity, pending outbox count | Local cache initially; sync when online | Clearly distinguishes online/offline | Inspector chooses an assignment |
| 2 | Opens assigned inspection | Inspection detail | Local inspection record | Must belong to inspector/client | Inspection enters progress |
| 3 | Finds asset | Search or QR scanner | `GET /structures?qr=...` online; cached lookup offline | QR no-match/camera-denied fallback is manual search | Correct structure selected |
| 4 | Loads historic issues | Carry-forward panel | `GET /structures/:id/history` or cached summary | Unresolved history shown | Inspector triages relevant prior record |
| 5 | Selects component type | Deficiency form | Cached active `component_types` | Picklist required | Standardized classification |
| 6 | Describes finding | Deficiency form | Local Dexie draft | Description validation | Draft saved locally |
| 7 | Enters risk ratings | Risk matrix | Shared calculator runs locally | Ratings must be 1–5; preview is pending server confirmation | Advisory P1–P5 tier shown |
| 8 | Captures GPS or enters manually | Location fields | Local draft | Latitude −90..90; longitude −180..180 | Valid location saved if available |
| 9 | Captures photos | Camera/photo panel | Local photo queue plus EXIF extraction | Maximum five photos; caption required | Evidence queued |
| 10 | Makes historical triage decision | Carry-forward panel | Saves `previous_deficiency_id` if linked | “Create new unrelated” leaves linkage blank | Relationship recorded |
| 11 | Saves locally | Form action/autosave | Dexie Draft or Pending_Sync | Works without connectivity | No data lost |
| 12 | Repeats for all findings | Inspection form | Local storage | Each deficiency independently validated | Inspection evidence complete |
| 13 | If none found, explicitly confirms it | Submit preparation | Local submit intent | Must set `no_deficiencies_found=true` | Valid no-finding path |
| 14 | Submits inspection | Submit action | `POST /inspections/:id/submit` after sync | Requires synced deficiency or explicit no-findings confirmation | Status becomes Submitted |
| 15 | Syncs outbox | Sync Hub | `POST /sync/push-outbox` | Server validates, recomputes priority, uploads media, commits all-or-nothing | Server confirmation |
| 16 | Resolves conflict if needed | Sync errors panel | Server returns validation/conflict details | Server state is never overwritten silently | Local data retained for recovery |

### 5.3 P1 Deficiency Path

| Step | Trigger | System action | Recipient | Safeguard |
|---:|---|---|---|---|
| 1 | Server computes P1 during sync | Persists authoritative priority | Database | Client preview cannot override server calculation |
| 2 | Transaction commits | After-commit notification handler runs | System | No alert for rolled-back batch |
| 3 | P1 notification dispatches | Email to client safety contact | Safety contact | Email provider route |
| 4 | Reviewer alert dispatches | SMS to assigned reviewer if phone exists | Reviewer | SMS limited to P1 |
| 5 | Inspection appears for review | Reviewer dashboard updates | Reviewer/Admin | Evidence and priority available immediately |

### 5.4 Contractor Remediation Update

| Step | Action | API | Rule | Outcome |
|---:|---|---|---|---|
| 1 | Contractor revisits known deficiency | `GET /deficiencies/:id` or cached work | Must be tenant-scoped | Current remediation state visible |
| 2 | Marks remediation scheduled | `PATCH /deficiencies/:id/remediation` | Scoped role may advance to `Remediation_Scheduled` | Due date may be recorded |
| 3 | Marks work completed pending verification | Same endpoint | May attach `remediation_evidence` photo | State becomes Pending Verification |
| 4 | Attempts closure | UI explains limitation | Contractor lacks closure permission | Cannot self-verify close |
| 5 | Reviewer verifies later | Reviewer action | Requires remediation evidence | Record can become Verified Closed |

### 5.5 Contractor Timesheet Journey

| Step | Action | API/data | Rule | Result |
|---:|---|---|---|---|
| 1 | Opens daily timesheet | Local/mobile form | Uses client work-type picklist | Active entries only |
| 2 | Adds project, work type, hours | Local draft | Hours >0 and ≤24 | Draft saved |
| 3 | Edits draft | Local record | Contractor owns draft | Editable |
| 4 | Submits timesheet | `POST /timesheets/:id/submit` | Submission locks contractor edits | Status Submitted |
| 5 | Reviewer decision | Approve/reject endpoint | Rejection needs reason | Approved or Rejected |
| 6 | Contractor views result | Dashboard | Own records only | Rejection reason visible |

## 6. Reviewer Journeys

### 6.1 Review, Return, Override, and Approve Inspection

| Step | Reviewer action | UI / API | Required checks | State transition |
|---:|---|---|---|---|
| 1 | Opens review queue | `GET /inspections?status=Submitted` | RLS limits memberships | Submitted inspections listed |
| 2 | Opens inspection | `GET /inspections/:id` | Loads deficiencies, photos, history, risk data | Review workspace |
| 3 | Reviews evidence | Photo and field-data panels | Confirms asset, component, photos, GPS, historic linkage | Ready for decision |
| 4 | Accepts calculated priority | No override request | Server-calculated tier retained | No change |
| 5 | Overrides priority | `PATCH /deficiencies/:id` | Adjusted tier + justification required | Override provenance recorded |
| 6 | Finds missing evidence | Return modal | Mandatory `returned_reason` | `POST /inspections/:id/return` |
| 7 | System returns inspection | Notification worker | Assigned inspector notified | Status Returned |
| 8 | Approves satisfactory record | Approve action | Inspection must be Submitted | `POST /inspections/:id/approve` |
| 9 | System approves | Writes approver/time | Immutability protection applies | Deficiencies lock |
| 10 | Generates deliverables | Publishing Center | Project and report type selected | Background job created |

### 6.2 Reviewer Remediation Verification

| Step | Action | API | Validation | Result |
|---:|---|---|---|---|
| 1 | Opens remediation queue | Deficiency list | Shows Open/Scheduled/Pending Verification | Candidate records visible |
| 2 | Opens evidence | Deficiency detail/photos | Must inspect remediation-purpose evidence | Evidence status clear |
| 3 | Evidence missing | Closure disabled | Server rejects missing evidence | Reviewer requests update |
| 4 | Evidence adequate | `POST /deficiencies/:id/verify-closure` | Reviewer/Admin only; at least one evidence photo | Verified Closed |
| 5 | Parent inspection approved | System applies immutability rule | No direct edits after approval | Admin reopen required for correction |

### 6.3 Reviewer Scheduling and Calendar Journey

| Step | Action | API | Rule | Result |
|---:|---|---|---|---|
| 1 | Opens calendar | `GET /inspections/calendar?from=&to=&inspector_id=` | Tenant-scoped assignments/schedules only | Calendar shows work |
| 2 | Creates recurring schedule | `POST /schedules` | Structure, default inspector, positive interval, first due date required | Active schedule created |
| 3 | Daily job runs | Internal worker | Generates within lead window | Upcoming inspection created |
| 4 | Job prevents duplicates | Database uniqueness check | Same schedule/date cannot duplicate | Idempotent operation |
| 5 | Reviewer drags inspection | `PATCH /inspections/:id/schedule` | Valid date and eligible inspector | Assignment updated |
| 6 | Pauses recurrence | `PATCH /schedules/:id` inactive | No hard delete | Future generation stops |

### 6.4 Reviewer Report Journey

| Step | Action | API | System processing | Outcome |
|---:|---|---|---|---|
| 1 | Selects project and output | Publishing Center | `POST /reports/generate` | Queued job created |
| 2 | Chooses report type | Draft PDF / final PDF / Word / Excel | Request includes project and type | Configuration stored |
| 3 | Job runs | Background worker | Renders files | Queued → Processing |
| 4 | Reviewer polls status | `GET /reports/:job_id` | Ready or Failed | Status visible |
| 5 | File ready | Signed download URL returned | Draft has watermark; final does not | Deliverable downloaded/distributed |
| 6 | Job fails | Error status/message | No partial file presented as final | Retry or escalate |

## 7. Administrator Journeys

### 7.1 Client Onboarding and Tenant Switching

| Step | Admin action | API | Controls | Outcome |
|---:|---|---|---|---|
| 1 | Creates client | `POST /clients` | Unique name; safety email required | Tenant created |
| 2 | Provisions users | `POST /auth/invite/provision` | Roles and memberships validated | Invitations sent |
| 3 | Switches operating context | `POST /auth/switch-client` | Admin selects target client | New token contains target `active_client_id` |
| 4 | App refreshes state | Full state refresh | Prevents stale cross-client UI data | Admin works in selected context |
| 5 | RLS applies | Middleware/database | Admin bypass is explicit | Controlled administration |

### 7.2 CSV Import Journey

| Step | Admin action | API/data | Validation | Outcome |
|---:|---|---|---|---|
| 1 | Opens Import Center | Client context shown | Admin only | Ready to upload |
| 2 | Uploads CSV | `POST /imports/batches` | Batch created; raw rows staged | Pending/Validated |
| 3 | System validates rows | `import_rows` | Required project, site, asset tag, description | Each row Valid or Invalid |
| 4 | Reviews errors | `GET /imports/batches/:id` | Per-row errors visible | Correct/re-upload decision |
| 5 | Commits valid batch | `POST /imports/batches/:id/commit` | Atomic transaction | Register records created/matched |
| 6 | Commit failure | Transaction rollback | No partial update | Batch remains resolvable |
| 7 | Abandons batch | `POST /imports/batches/:id/discard` | Explicit discard | Batch marked Discarded |

### 7.3 Reopening an Approved Inspection

| Step | Admin action | API | Guardrail | Result |
|---:|---|---|---|---|
| 1 | Opens Approved inspection | Inspection workspace | Reviewer does not see reopen action | Admin-only control |
| 2 | Selects target status | Reopen modal | Only Submitted or Returned allowed | Correction route chosen |
| 3 | Supplies reason | `POST /inspections/:id/reopen` | Meaningful reason required | Reopen metadata saved |
| 4 | System records provenance | Inspection fields + audit log | Actor, timestamp, reason retained | Queryable exception record |
| 5 | Reopens to Returned | Inspector workflow resumes | Field correction required | Inspector revises/resubmits |
| 6 | Reopens to Submitted | Reviewer/Admin corrects | Field rework not necessarily required | Review cycle resumes |
| 7 | Reapproval | Normal approval workflow | Final immutability restored | Record locks again |

### 7.4 Audit-Log Journey

| Step | Action | API | Security behavior | Outcome |
|---:|---|---|---|---|
| 1 | Opens System Audit Log | `GET /audit-logs?table_name=&record_id=&page=` | Admin middleware required | Read-only history |
| 2 | Filters by table/record | Same endpoint | Paginated results | Relevant changes isolated |
| 3 | Reviewer attempts direct call | Endpoint request | `403 Forbidden` | No audit exposure |
| 4 | Admin investigates exception | Reads old/new values and actor | Audit is not editable | Compliance evidence retained |

## 8. State Models

### 8.1 Inspection State Model

| Current state | Allowed actor/action | Next state | Notes |
|---|---|---|---|
| Assigned | Contractor starts work | In Progress | Can be implicit UI state or persisted |
| Assigned / In Progress | Contractor submits | Submitted | Requires findings or explicit no-findings flag |
| Submitted | Reviewer/Admin returns | Returned | Return reason required |
| Returned | Contractor corrects and resubmits | Submitted | Field loop repeats |
| Submitted | Reviewer/Admin approves | Approved | Stores approver/time; locks deficiencies |
| Approved | Admin reopens to Submitted | Submitted | Admin-only; reason required |
| Approved | Admin reopens to Returned | Returned | Admin-only; reason required |
| Approved | Reviewer action | No transition | Reviewer cannot reopen |

### 8.2 Deficiency and Remediation State Model

| Dimension | States | Who changes it | Key rule |
|---|---|---|---|
| Inspection relationship / triage | New, Resolved, Still Outstanding, Worsened | Contractor during reinspection; reviewed later | Describes relationship to prior finding |
| Remediation lifecycle | Open, Remediation Scheduled, Remediated Pending Verification, Verified Closed | Scoped role advances first stages; Reviewer/Admin verifies closure | Closure requires remediation-evidence photo |
| Priority | P1–P5 | Server calculates; Reviewer/Admin may override | Override requires justification and provenance |
| Editability | Editable / locked | Controlled by parent inspection | Approved parent locks deficiency; Admin reopen restores controlled edit path |

### 8.3 Timesheet State Model

| Current state | Actor/action | Next state | Constraint |
|---|---|---|---|
| Draft | Contractor edits | Draft | Contractor-owned editable record |
| Draft | Contractor submits | Submitted | Locks contractor edits |
| Submitted | Reviewer/Admin approves | Approved | Approval metadata stored |
| Submitted | Reviewer/Admin rejects | Rejected | Rejection reason required |
| Rejected | Contractor correction process | New/revised draft | Original decision remains auditable |

## 9. Cross-Cutting Failure, Recovery, and Completeness Checklist

| Scenario | Required system behavior |
|---|---|
| No network during field work | Save drafts/photos/outbox records locally; show offline banner and pending count |
| Access token expires before sync | Attempt refresh automatically |
| Refresh token expired | Return `AUTH_EXPIRED`; preserve local work; require online login before sync |
| One invalid record in an outbox batch | Reject/roll back entire atomic sync batch; return actionable validation details |
| Server-side inspection changed while device was offline | Reject conflicting writes; do not overwrite server state; prompt fresh pull |
| CSV contains invalid rows | Keep staged rows with per-row errors; do not commit invalid data |
| CSV commit fails | Roll back all permanent inserts |
| QR camera unavailable/denied | Explain issue and provide manual search |
| QR has no matching asset | Show not-found and manual search path |
| More than five deficiency photos | Block at UI and database levels |
| Priority override lacks rationale | Reject request |
| Contractor attempts approval | Reject by role authorization |
| Reviewer attempts reopen | Return Admin-only `403` |
| Non-admin attempts audit access | Return `403` |
| Closure lacks remediation photo | Disable UI and reject server request |
| P1 batch rolls back | Do not send P1 alert |
| Report takes too long | Run asynchronously; return job ID |
| Report job fails | Expose failed status/error; do not provide misleading download |
| Deactivated picklist item is historical | Preserve reference; hide from new-entry dropdowns |
| Deactivated user tries to log in | Deny authentication |
| Tenant context mismatch | RLS denies/filters access; API must not leak data |
| Approved record needs correction | Admin-only reopen with reason and audit trail |
| Client requests portal access | Provide signed deliverable link/email only; no portal workflow exists |
