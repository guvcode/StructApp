# StructApp — Prioritized MVP Product Backlog

## Purpose
This backlog converts the approved module/persona/journey definition into implementation-ready work. It is organized in dependency order and includes user stories, acceptance criteria, priority, and key non-functional requirements.

## Priority Definitions

| Priority | Meaning |
|---|---|
| P0 | Required for a safe, usable MVP launch |
| P1 | Important for MVP completion; can follow the core vertical slice |
| P2 | Valuable post-MVP enhancement |

## Release Plan

| Release | Goal | Included epics |
|---|---|---|
| Foundation | Secure multi-tenant platform and usable asset register | EP-01 to EP-04 |
| Field MVP | Offline inspection capture, sync, risk and safety workflow | EP-05 to EP-08 |
| Review & Delivery MVP | Review, approval, remediation, reports, timesheets | EP-09 to EP-13 |
| Operational Expansion | Imports, schedules, picklists, audit tooling | EP-14 to EP-17 |

---

# EP-01 — Authentication, Sessions, and Tenant Context
**Priority:** P0  
**Primary personas:** Contractor, Reviewer, Administrator  
**Dependencies:** None

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| AUTH-01 | As a user, I can log in with my email and password so that I can access the platform. | P0 | 1. Login requires email and password. 2. Invalid credentials return a generic error. 3. Inactive users cannot log in. 4. Successful login returns an access token and refresh token. 5. User is routed to the correct role-based landing page. |
| AUTH-02 | As a multi-client user, I can select an authorized client context at login so that I only work with the correct tenant data. | P0 | 1. Single-membership users enter their only client automatically. 2. Multi-membership users see only authorized clients. 3. Selected client is stored in the issued access token as `active_client_id`. 4. Selecting an unauthorized client is rejected. |
| AUTH-03 | As an administrator, I can switch client context so that I can administer multiple tenants. | P0 | 1. Switch control is visible only to Admin. 2. Switching issues a new access token. 3. Application clears/refetches tenant-scoped state. 4. Previous tenant data is not visible after switch. 5. Switch is audited. |
| AUTH-04 | As a logged-in user, I stay signed in while my session is valid so that normal use is uninterrupted. | P0 | 1. Access token expiry is 15 minutes. 2. Client refreshes access token before protected requests when online. 3. Refresh token uses a 30-day sliding expiry. 4. Refresh failure sends user to login without deleting unsynced field work. |
| AUTH-05 | As a user, I can log out securely. | P0 | 1. Logout revokes the refresh token. 2. Access/session state is cleared. 3. Contractor with unsynced work receives a warning before clearing local data. 4. Next protected request is denied. |
| AUTH-06 | As an administrator, I can invite a user. | P0 | 1. Invite requires name, email, role, and valid client memberships where applicable. 2. System creates inactive/provisioned user state. 3. Invitation token is single-use and expires. 4. Invitation delivery is logged. |
| AUTH-07 | As an invited user, I can activate my account and set a password. | P0 | 1. Valid invite token opens activation form. 2. Used, expired, or invalid tokens are rejected. 3. Password is stored only as a secure hash. 4. Activation marks user active. 5. User can subsequently log in. |

## Definition of Done
- API authorization middleware is implemented.
- JWT claims include user ID, role, and active client ID.
- Authentication events are audit logged.
- Automated tests cover invalid login, inactive user, token refresh, logout, client selection, and unauthorized client selection.

---

# EP-02 — Roles, Permissions, and Tenant Isolation
**Priority:** P0  
**Primary personas:** All authenticated users  
**Dependencies:** EP-01

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| SEC-01 | As the platform, I isolate each client’s data so that users cannot access another client’s records. | P0 | 1. Tenant-owned tables include `client_id`. 2. Every protected request establishes active client context. 3. PostgreSQL RLS filters/denies unauthorized rows. 4. API-level filtering is not the sole security control. |
| SEC-02 | As a Contractor, I can access only my assigned/authorized work. | P0 | 1. Contractor cannot create or edit client master data. 2. Contractor can see only permitted tenant data and own timesheets. 3. Contractor cannot approve, return, reopen, override priority, verify closure, or read audit logs. |
| SEC-03 | As a Reviewer, I can perform engineering review tasks but cannot use administrator-only controls. | P0 | 1. Reviewer can manage assigned tenant operational data. 2. Reviewer can approve/return inspections and verify closure. 3. Reviewer receives `403` for reopen, user administration, client administration, imports, and audit logs. |
| SEC-04 | As an Administrator, I can perform controlled governance tasks. | P0 | 1. Admin can manage clients, users, memberships, imports, audit logs, and reopening. 2. Admin actions are audit logged. 3. Admin client switching is explicit. |
| SEC-05 | As the platform, I provide consistent authorization errors. | P0 | 1. Unauthenticated requests return `401`. 2. Authenticated but unauthorized requests return `403`. 3. Cross-tenant record lookup does not disclose record existence. |

---

# EP-03 — Client, User, and Membership Administration
**Priority:** P0  
**Primary persona:** Administrator  
**Dependencies:** EP-01, EP-02

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| ADM-01 | As an Admin, I can create a client organization. | P0 | 1. Client name is required and unique. 2. Safety-contact email is required. 3. Created client is immediately available for membership assignment. |
| ADM-02 | As an Admin, I can update a client’s operational details. | P0 | 1. Admin can update name and safety contact. 2. Changes are tenant/governance audited. 3. Invalid email format is rejected. |
| ADM-03 | As an Admin, I can assign a user to one or more clients. | P0 | 1. Membership has user, client, and role context. 2. Duplicate active membership is prevented. 3. Removed membership prevents future access. |
| ADM-04 | As an Admin, I can deactivate a user. | P0 | 1. Deactivated user cannot authenticate or refresh. 2. Historical records retain original creator identity. 3. Deactivation is audited. |
| ADM-05 | As an Admin, I can change a user role. | P0 | 1. Role change is validated. 2. New permissions apply on next issued token. 3. Role change is audited. |

---

# EP-04 — Project, Site, and Structure Register
**Priority:** P0  
**Primary personas:** Admin, Reviewer, Contractor (read-only)  
**Dependencies:** EP-02

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| REG-01 | As a Reviewer/Admin, I can create and edit projects. | P0 | 1. Project belongs to active client. 2. Required title validation is enforced. 3. Contractor cannot edit projects. |
| REG-02 | As a Reviewer/Admin, I can create and edit sites within a project. | P0 | 1. Site belongs to one project. 2. Site is tenant-consistent with its project. 3. List supports pagination. |
| REG-03 | As a Reviewer/Admin, I can create and edit structures within a site. | P0 | 1. Structure has asset tag and description. 2. Asset tag is unique within site. 3. Optional QR code value is unique where populated. |
| REG-04 | As a Contractor, I can search assigned/cached structures. | P0 | 1. Search supports asset tag, description, and QR value. 2. Results are tenant-scoped. 3. Mobile search works from downloaded package when offline. |
| REG-05 | As a Contractor, I can scan a QR code to open a structure. | P1 | 1. Camera permission is requested clearly. 2. Matching QR opens structure. 3. No match and camera denial both offer manual search fallback. |

---

# EP-05 — Inspection Assignment and Lifecycle
**Priority:** P0  
**Primary personas:** Admin, Reviewer, Contractor  
**Dependencies:** EP-03, EP-04

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| INS-01 | As a Reviewer/Admin, I can create an inspection assignment. | P0 | 1. Assignment includes structure, assigned inspector, and due date. 2. Inspector must be active and authorized for client. 3. Assignment is visible to inspector after sync. |
| INS-02 | As a Contractor, I can view my assigned inspections. | P0 | 1. Dashboard lists only the contractor’s permitted inspections. 2. Shows status, structure, site, project, due date, and sync status. 3. Cached assignments remain visible offline. |
| INS-03 | As a Contractor, I can submit an inspection. | P0 | 1. Submission requires at least one synced deficiency OR explicit `no_deficiencies_found=true`. 2. Submitted inspection cannot be edited by contractor unless returned/reopened. 3. Submission time and actor are recorded. |
| INS-04 | As a Reviewer/Admin, I can return an inspection for correction. | P0 | 1. Return only allowed from Submitted. 2. Return reason is required. 3. Status becomes Returned. 4. Assigned inspector is notified. |
| INS-05 | As a Reviewer/Admin, I can approve a submitted inspection. | P0 | 1. Approval only allowed from Submitted. 2. Approver and timestamp are recorded. 3. Parent inspection and related deficiency records become immutable. |
| INS-06 | As an Admin, I can reopen an approved inspection through a controlled exception. | P0 | 1. Reviewer cannot access this action. 2. Admin must select Submitted or Returned as target state. 3. Reason is required. 4. Actor, timestamp, reason, and target state are audited. |
| INS-07 | As the system, I prevent invalid inspection state transitions. | P0 | 1. API rejects unsupported transitions. 2. UI hides invalid actions. 3. Tests cover all allowed and denied transitions. |

---

# EP-06 — Offline Package, Local Storage, and Sync
**Priority:** P0  
**Primary persona:** Contractor  
**Dependencies:** EP-01, EP-04, EP-05

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| SYNC-01 | As a Contractor, I can download my field work package. | P0 | 1. Pull package includes authorized assignments, structures, active component types, active work types, and relevant history. 2. Package is tenant-scoped. 3. Pull does not expose other inspectors’ work unless authorized. |
| SYNC-02 | As a Contractor, I can create and edit drafts offline. | P0 | 1. Inspections, deficiencies, photos, and timesheets persist in IndexedDB. 2. UI shows local save success. 3. No network is required for draft editing. |
| SYNC-03 | As a Contractor, I can see sync state. | P0 | 1. Records show Draft, Pending Sync, Synced, or Error. 2. Dashboard shows pending count. 3. Errors include actionable explanation. |
| SYNC-04 | As a Contractor, I can sync an atomic outbox batch. | P0 | 1. Sync uploads queued records and media. 2. Server validates entire batch. 3. If one record fails, batch rolls back. 4. Local records remain available for correction/retry. |
| SYNC-05 | As the system, I protect server-authoritative data during conflicts. | P0 | 1. Server does not silently overwrite changed/approved/reassigned records. 2. Conflict response identifies affected records. 3. Client prompts user to pull fresh data. |
| SYNC-06 | As a Contractor, I do not lose work when session refresh fails. | P0 | 1. `AUTH_EXPIRED` pauses sync. 2. Local drafts/photos/outbox are retained. 3. User must authenticate online before retrying sync. |
| SYNC-07 | As the system, I make sync retries safe. | P0 | 1. Device-authored payloads use stable client IDs/idempotency keys. 2. Retried successful records do not duplicate. 3. Server response maps local IDs to server IDs. |

---

# EP-07 — Deficiency Capture, Risk, History, and Photos
**Priority:** P0  
**Primary personas:** Contractor, Reviewer, Admin  
**Dependencies:** EP-05, EP-06

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| DEF-01 | As a Contractor, I can create a deficiency against a structure. | P0 | 1. Deficiency belongs to inspection and structure. 2. Component type, description, and risk ratings are required. 3. Data can be saved offline. |
| DEF-02 | As a Contractor, I can enter risk ratings and see a provisional priority. | P0 | 1. Severity, probability, and consequence values are limited to 1–5. 2. Client displays calculated preview. 3. Preview is labelled provisional. |
| DEF-03 | As the server, I calculate and persist authoritative priority. | P0 | 1. Server recalculates score on sync/write. 2. Critical safety override is applied where configured. 3. Persisted tier is P1–P5. 4. Client cannot submit a trusted final tier without server confirmation. |
| DEF-04 | As a Contractor, I can capture evidence photos. | P0 | 1. Maximum five photos per deficiency. 2. Caption is required. 3. Image and EXIF/evidence metadata are stored. 4. Photo can be queued offline. |
| DEF-05 | As a Contractor, I can record GPS where available. | P1 | 1. Valid coordinate ranges enforced. 2. Manual/no-GPS path is permitted. 3. Location source is distinguishable. |
| DEF-06 | As a Contractor, I can triage historical deficiencies during reinspection. | P0 | 1. Unresolved history is displayed. 2. User can mark New, Resolved, Still Outstanding, Worsened, or create unrelated finding. 3. Linked findings store `previous_deficiency_id`. |
| DEF-07 | As a Reviewer/Admin, I can override a calculated priority with engineering justification. | P0 | 1. Only Reviewer/Admin may override. 2. Override priority and non-empty rationale required. 3. Original calculated priority, actor, and timestamp remain preserved. |
| DEF-08 | As the system, I trigger urgent workflow for P1. | P0 | 1. P1 determination occurs server-side. 2. Notifications run only after successful transaction commit. 3. Safety contact receives email. 4. Assigned reviewer receives SMS if phone is available. 5. Notification result is logged. |

---

# EP-08 — Field Submission and Reviewer Notification
**Priority:** P0  
**Primary personas:** Contractor, Reviewer, Admin  
**Dependencies:** EP-05, EP-06, EP-07

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| SUB-01 | As a Contractor, I can explicitly submit a completed inspection. | P0 | 1. UI summarizes deficiencies and pending sync items. 2. Submission is blocked if required data is not synced/valid. 3. Explicit no-findings confirmation is supported. |
| SUB-02 | As a Reviewer, I am notified when an inspection is submitted. | P0 | 1. Submission notification is sent after successful status change. 2. Notification identifies inspection and assigned reviewer. 3. Failed notification does not roll back valid inspection submission; failure is logged/retried. |
| SUB-03 | As a Contractor, I am notified when work is returned. | P0 | 1. Return notification includes return reason. 2. Contractor can locate returned inspection from dashboard. 3. Returned inspection is editable again within permitted scope. |

---

# EP-09 — Engineering Review and Approval
**Priority:** P0  
**Primary personas:** Reviewer, Admin  
**Dependencies:** EP-07, EP-08

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| REV-01 | As a Reviewer, I can view a submitted-inspection queue. | P0 | 1. Queue filters by status, project, site, inspector, and priority. 2. Results are paginated. 3. Tenant isolation applies. |
| REV-02 | As a Reviewer, I can review complete inspection evidence. | P0 | 1. Detail view shows structure, findings, photos, risk, history, GPS, and triage. 2. Evidence remains readable after approval. |
| REV-03 | As a Reviewer, I can return incomplete work. | P0 | 1. Return reason required. 2. Returned status restores permitted contractor correction path. 3. Return is audited. |
| REV-04 | As a Reviewer, I can approve valid work. | P0 | 1. Approval checks Submitted state. 2. Approval records reviewer/time. 3. Related inspection data becomes locked. 4. Approval is audited. |
| REV-05 | As the system, I enforce approved-record immutability. | P0 | 1. Direct modification of approved inspection/deficiency data is rejected. 2. Only Admin reopen creates a controlled edit path. 3. Database constraint/trigger provides backstop. |

---

# EP-10 — Remediation and Verification Closure
**Priority:** P1  
**Primary personas:** Contractor, Reviewer, Admin  
**Dependencies:** EP-07, EP-09

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| REM-01 | As a scoped user, I can mark remediation as scheduled. | P1 | 1. Open deficiency can move to Remediation Scheduled. 2. Optional due date/notes can be recorded. 3. Change is audited. |
| REM-02 | As a scoped user, I can submit remediation evidence. | P1 | 1. Evidence photo is tagged `remediation_evidence`. 2. Photo limits and metadata rules apply. 3. State can move to Remediated Pending Verification. |
| REM-03 | As a Reviewer/Admin, I can verify closure. | P1 | 1. Only Reviewer/Admin can verify. 2. At least one remediation-evidence photo is required. 3. State becomes Verified Closed. 4. Verifier/time recorded. |
| REM-04 | As a Contractor, I cannot self-verify closure. | P1 | 1. Closure action is absent/disabled for Contractor. 2. Direct API attempt returns `403`. |

---

# EP-11 — Timesheets
**Priority:** P1  
**Primary personas:** Contractor, Reviewer, Admin  
**Dependencies:** EP-01, EP-03, EP-04

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| TIME-01 | As a Contractor, I can draft a daily timesheet. | P1 | 1. Entry includes date, project, work type, and hours. 2. Hours must be >0 and ≤24. 3. Draft supports offline save. |
| TIME-02 | As a Contractor, I can submit my timesheet. | P1 | 1. Only owner can submit own Draft. 2. Submitted entry locks contractor edits. 3. Submission metadata is recorded. |
| TIME-03 | As a Reviewer/Admin, I can approve or reject timesheets. | P1 | 1. Decision allowed only for Submitted entries. 2. Rejection requires reason. 3. Decision actor/time stored. |
| TIME-04 | As a Contractor, I can see decision outcomes. | P1 | 1. Contractor sees own status and rejection reason. 2. Contractor cannot edit Approved record. |

---

# EP-12 — Reporting and Publishing
**Priority:** P1  
**Primary personas:** Reviewer, Admin, external recipient  
**Dependencies:** EP-09

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| RPT-01 | As a Reviewer/Admin, I can request a report package. | P1 | 1. User selects project and output type: draft PDF, final PDF, Word, or Excel. 2. Request creates asynchronous job. 3. Job ID is returned immediately. |
| RPT-02 | As a Reviewer/Admin, I can monitor report generation. | P1 | 1. Job exposes Queued, Processing, Ready, Failed states. 2. Failed job exposes safe error message. 3. User can retry where authorized. |
| RPT-03 | As a Reviewer/Admin, I can download a completed report securely. | P1 | 1. Ready job returns time-limited signed URL. 2. Draft PDF is visibly watermarked. 3. Final report is not watermarked. |
| RPT-04 | As an external recipient, I can receive a deliverable without portal access. | P1 | 1. Delivery uses email/signed link. 2. Recipient has no application account or editing capability. |

---

# EP-13 — Notifications
**Priority:** P1  
**Primary personas:** Contractor, Reviewer, Admin, safety contact  
**Dependencies:** EP-01, EP-05, EP-07, EP-08, EP-12

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| NOT-01 | As the system, I send invitation notifications. | P1 | 1. Triggered after invite provision. 2. Delivery status logged. 3. Token is not exposed in unsafe logs. |
| NOT-02 | As the system, I notify relevant users about assignment, submission, and return. | P1 | 1. Notifications are event-driven. 2. Sent after committed transaction. 3. Failures are logged and retryable. |
| NOT-03 | As the system, I send P1 alerts. | P0 | 1. Email safety contact. 2. SMS reviewer if configured. 3. No alert on rollback. |
| NOT-04 | As the system, I notify report requester when report is ready or failed. | P1 | 1. Notification includes safe route/link to job or deliverable. 2. Failure contains no sensitive stack trace. |

---

# EP-14 — Managed Picklists
**Priority:** P1  
**Primary personas:** Reviewer, Admin  
**Dependencies:** EP-02, EP-03

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| PICK-01 | As a Reviewer/Admin, I can manage component types. | P1 | 1. Create, edit, activate, deactivate within tenant. 2. Contractor receives active values in sync package. |
| PICK-02 | As a Reviewer/Admin, I can manage work types. | P1 | 1. Create, edit, activate, deactivate within tenant. 2. Timesheet uses active values only. |
| PICK-03 | As the system, I preserve historical references. | P1 | 1. Picklist values are never hard-deleted when referenced. 2. Deactivated values remain readable on historical records. |

---

# EP-15 — Recurring Scheduling and Calendar
**Priority:** P2  
**Primary personas:** Reviewer, Admin  
**Dependencies:** EP-04, EP-05

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| SCH-01 | As a Reviewer/Admin, I can create a recurring inspection schedule. | P2 | 1. Requires structure, inspector, positive interval, and first due date. 2. Schedule belongs to active client. |
| SCH-02 | As the system, I generate upcoming inspection occurrences. | P2 | 1. Daily job generates within configured lead window. 2. Duplicate schedule/date occurrence is prevented. 3. Job is idempotent. |
| SCH-03 | As a Reviewer/Admin, I can view calendar work. | P2 | 1. Calendar filters by date range and inspector. 2. Shows assigned and generated inspections. |
| SCH-04 | As a Reviewer/Admin, I can reschedule or reassign work. | P2 | 1. Valid date and eligible inspector required. 2. Change is audited and optionally notifies inspector. |
| SCH-05 | As a Reviewer/Admin, I can pause a schedule. | P2 | 1. Pause stops future generation. 2. Historical occurrences remain intact. |

---

# EP-16 — CSV Import Sandbox
**Priority:** P2  
**Primary persona:** Administrator  
**Dependencies:** EP-03, EP-04

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| IMP-01 | As an Admin, I can upload a register CSV into a staging batch. | P2 | 1. Upload creates import batch and staged rows. 2. Raw file metadata is retained. 3. Non-admin request returns `403`. |
| IMP-02 | As an Admin, I can review row-level validation. | P2 | 1. Required fields: project title, site name, asset tag, structure description. 2. Each row shows Valid/Invalid and error details. |
| IMP-03 | As an Admin, I can atomically commit a valid batch. | P2 | 1. Commit inserts/matches all records in one transaction. 2. Any failure rolls back all inserts. 3. Result summarizes created/matched records. |
| IMP-04 | As an Admin, I can discard a staged batch. | P2 | 1. Discard is explicit. 2. Batch remains auditable as Discarded. |

---

# EP-17 — Audit Logs and Operational Governance
**Priority:** P1  
**Primary persona:** Administrator  
**Dependencies:** EP-02 and all record-changing epics

| ID | User story | Priority | Acceptance criteria |
|---|---|---:|---|
| AUD-01 | As the system, I record material changes. | P1 | 1. Audit entries capture actor, timestamp, table/record, action, and old/new values where applicable. 2. Audit records are immutable. |
| AUD-02 | As an Admin, I can search audit history. | P1 | 1. Admin-only endpoint supports table/record filters and pagination. 2. Reviewer receives `403`. 3. Search is tenant-aware. |
| AUD-03 | As the system, I audit exceptional governance actions. | P1 | 1. Client switch, role change, membership change, import commit, approval, reopen, priority override, and closure verification are recorded. |

---

# Cross-Cutting Non-Functional Backlog

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| NFR-01 | API pagination | P0 | All list endpoints accept `page` and `page_size`; maximum page size is 100. |
| NFR-02 | Validation | P0 | Server validates all required fields and state transitions; client validation improves usability but is not authoritative. |
| NFR-03 | Error format | P0 | API returns consistent machine-readable error code, human-readable message, and field errors where relevant. |
| NFR-04 | Observability | P1 | API errors, sync failures, report job failures, and notification failures are logged with correlation IDs. |
| NFR-05 | File security | P0 | Media/report storage uses private objects and signed URLs; direct public object access is disabled. |
| NFR-06 | Data retention | P1 | Historical records, deactivated picklists, and audit records remain traceable. |
| NFR-07 | Automated tests | P0 | Unit, integration, and end-to-end coverage includes auth, RLS, state transitions, sync rollback, P1 alerts, approved-record locking, and role denials. |
| NFR-08 | Accessibility | P1 | Core workflows support keyboard navigation, labels, visible error states, and mobile-readable layouts. |
| NFR-09 | Performance | P1 | Common lists and inspection details load with pagination; report generation is asynchronous. |
| NFR-10 | Backup/recovery | P1 | Database and object storage backup/recovery procedures are documented and tested. |

# MVP Acceptance Gate

The MVP is ready for pilot only when all conditions below are met:

1. P0 stories are complete and demonstrated.
2. Contractor can complete an inspection entirely offline and sync it successfully later.
3. A P1 finding sends post-commit safety notifications.
4. Reviewer can return and approve inspections.
5. Approved records cannot be edited except through Admin reopen.
6. Tenant-isolation tests prove that users cannot access another client’s records.
7. Sync conflict and expired-session recovery preserve local contractor work.
8. Deficiency photo limits and remediation-evidence closure rule are enforced server-side.
9. Core audit events are visible to Admin and denied to Reviewer.
10. Pilot users complete scripted end-to-end acceptance tests successfully.
