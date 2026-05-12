# StructApp v1 — Implementation PRD

**Version:** 1.0  
**Date:** May 11, 2026  
**Status:** Ready for Implementation

---

## Problem Statement

Enterprise organizations that own and operate portfolios of buildings, sites, and facilities — such as large industrial operators and mining companies — currently have no unified system to manage their structural integrity inspection programs. Inspection planning, scheduling, field execution, assessment authoring, risk decision-making, findings tracking, and remediation oversight are fragmented across spreadsheets, email threads, and disconnected tools. This creates gaps in accountability, makes compliance reporting difficult, and leaves asset owners unable to see the health of their portfolio in one place.

Inspectors working in the field frequently have no connectivity, yet must capture evidence, complete checklists, and record defects in real time. External consultants hired to perform inspections have no controlled collaboration channel with the asset owner, so findings and approvals are exchanged through informal channels with no audit trail.

The result is that engineering risk decisions are made without a defensible, traceable record — and portfolio managers cannot answer basic questions such as which assets are overdue for inspection, which findings remain unresolved, and what the current structural risk exposure of the portfolio is.

---

## Solution

StructApp is a vendor-hosted SaaS platform that manages the complete structural integrity inspection lifecycle for enterprise asset portfolios. It provides a single system of record for:

- An asset register organised as a flexible hierarchy (portfolio → site → building → component).
- Inspection plans with rule-based scheduling and automatic next-inspection generation.
- Field execution with full offline capability, evidence capture (photos, checklists, annotations, GPS), and sync on reconnect.
- Structured assessment authoring using configurable inspection templates with a standardised 5-level condition and 4-level risk rating, plus narrative justification sections.
- A single-approver signoff workflow where final approval always rests with an internal asset-owner-side user.
- First-class finding and remediation records, each with their own lifecycle, ownership, and closure evidence.
- Role-based notifications and escalations for all key events.
- Portfolio dashboards and formal PDF inspection reports with CSV/Excel data exports.
- Tenant-level data isolation supporting multiple independent organisations on the same platform.

---

## User Stories

### Asset Management

1. As an Admin, I want to create an organisation-level portfolio, so that all assets belong to a named top-level structure.
2. As an Admin, I want to add a site or facility under a portfolio, so that assets are geographically grouped.
3. As an Admin, I want to add a building or structure under a site, so that the inspection scope is clearly defined.
4. As an Admin, I want to add inspection areas or components under a building, so that inspections can target specific structural elements.
5. As an Admin, I want to skip hierarchy levels I don't need, so that simple assets don't require unnecessary depth.
6. As an Admin, I want to record GPS coordinates when creating an asset, so that the physical location is captured in the system.
7. As an Admin, I want to assign an internal owner to each asset, so that accountability is clear.
8. As an Admin, I want to mark an asset as inactive, so that decommissioned assets are hidden from active inspection planning without being deleted.
9. As an Admin, I want to edit any asset's details after creation, so that the register stays current as assets change.
10. As an Admin, I want to view the full asset hierarchy in a tree view, so that I can navigate the portfolio structure quickly.

### Inspection Planning & Scheduling

11. As an Admin, I want to create an inspection plan for an asset and specify a recurrence interval in days, so that the system knows how often to inspect it.
12. As an Admin, I want to assign a default Inspector and Approver to an inspection plan, so that newly generated events are pre-assigned.
13. As an Admin, I want the system to automatically generate the next inspection event when the current one is closed, so that no inspection falls through the cracks.
14. As an Admin, I want to manually override the next scheduled date for an inspection event, so that I can accommodate operational constraints.
15. As an Admin, I want to pause an inspection plan, so that assets temporarily out of service stop generating events.
16. As an Admin, I want to see a calendar or list view of all upcoming and overdue inspections across the portfolio, so that I can plan resourcing.
17. As an Admin, I want to assign an external consultant as the Inspector for a specific inspection event, so that they can execute the field inspection with appropriate scoped access.

### User & Access Management

18. As an Admin, I want to invite a new internal user by email, so that they can join my organisation's tenant.
19. As an Admin, I want to assign a role (Admin, Inspector, Approver) to any user in my organisation, so that permissions match their responsibilities.
20. As an Admin, I want to invite an external consultant by email and scope their access to a specific inspection or site, so that they can only see what they need.
21. As an Admin, I want to revoke an external consultant's access at any time, so that their visibility ends when the engagement ends.
22. As an Admin, I want to suspend a user account without deleting it, so that past audit records are preserved.
23. As an Inspector, I want to log in with my email and password, so that I can access my assigned work.
24. As a new user, I want to set my password via an invitation link, so that I can activate my account securely.
25. As any user, I want to reset my password via email, so that I can regain access if I forget it.
26. As an external consultant Inspector, I want to see only the inspections and assets I am assigned to, so that confidential portfolio data is protected.

### Inspection Execution (Field)

27. As an Inspector, I want to see a list of all inspections assigned to me, so that I know what work is pending.
28. As an Inspector, I want to open an assigned inspection and see its template, checklist, and required evidence, so that I know exactly what to capture.
29. As an Inspector, I want to mark an inspection as in-progress when I begin field work, so that the system reflects current status.
30. As an Inspector, I want to complete checklist items and mark each as pass, fail, N/A, or observation, so that all inspection criteria are recorded.
31. As an Inspector, I want to record a condition rating (1–5) and risk rating (Low/Medium/High/Critical) for each inspection area or component, so that the structural assessment is structured.
32. As an Inspector, I want to add a narrative justification for any rating I give, so that the technical reasoning is captured alongside the score.
33. As an Inspector, I want to take and attach photos directly from my device camera, so that visual evidence is linked to the inspection.
34. As an Inspector, I want to annotate a photo with arrows or text, so that I can highlight specific defects visually.
35. As an Inspector, I want to attach files (PDFs, reports, scans) to an inspection, so that any supporting documentation is in one place.
36. As an Inspector, I want the system to automatically capture GPS coordinates and timestamp when I add evidence, so that location and time of capture are recorded without manual entry.
37. As an Inspector, I want to optionally link a sensor reading or external document URL to an inspection, so that supplemental monitoring data can be referenced.
38. As an Inspector, I want to record a finding or defect and attach it to a specific inspection area and location, so that structural issues are formally logged.
39. As an Inspector, I want to continue working on an inspection when I have no internet connection, so that field work is not interrupted by connectivity gaps.
40. As an Inspector, I want all my offline changes to sync automatically when connectivity returns, so that I don't need to manually push data.
41. As an Inspector, I want to be notified if any of my offline changes could not be applied due to a conflict, so that I can review and resolve them.
42. As an Inspector, I want to submit a completed inspection for approval, so that the Approver is notified and can review my work.
43. As an Inspector, I want to receive a notification if an Approver returns my inspection for revision, so that I know what to fix.

### Assessment & Approval

44. As an Approver, I want to receive a notification when an inspection is submitted for my review, so that I can act promptly.
45. As an Approver, I want to view the full inspection record including all ratings, checklist responses, evidence, and findings before approving, so that I make an informed decision.
46. As an Approver, I want to see the system-derived rolled-up condition and risk rating for the asset, so that I understand the overall structural picture without reviewing every component manually.
47. As an Approver, I want to approve an inspection with a final decision and optional notes, so that the assessment is formally closed.
48. As an Approver, I want to return an inspection to the Inspector for revision with specific comments, so that gaps or errors are corrected before final approval.
49. As an Approver, I want the system to record my name, role, and timestamp on any approval I issue, so that there is a defensible audit record.
50. As an Approver, I want the compliance status of an inspection to be set based on the template's compliance mapping, so that I don't have to manually derive it.

### Findings & Remediation

51. As an Inspector, I want to create a finding record with title, description, severity, GPS location, and photos, so that a defect is formally documented.
52. As an Approver, I want to create additional findings after reviewing a submitted inspection, so that issues I identify during review are captured.
53. As an Approver, I want to assign a finding to an internal owner with a due date, so that accountability for resolution is set.
54. As a finding owner, I want to update the status of my assigned findings, so that the system reflects current remediation progress.
55. As a finding owner, I want to upload verification evidence when I believe a finding is resolved, so that closure can be confirmed.
56. As an Approver, I want to confirm closure of a finding by reviewing the verification evidence and marking it closed, so that the finding lifecycle is formally completed.
57. As an Approver, I want to create a remediation action from a finding and assign it to an owner with a due date, so that specific repair or intervention tasks are tracked.
58. As a remediation action owner, I want to update the status of my assigned actions, so that progress is visible.
59. As an Approver, I want to close a remediation action after reviewing verification evidence, so that the action lifecycle is formally completed.
60. As an Admin, I want to see all open findings and remediation actions across the portfolio in one view, so that nothing falls through the cracks.

### Notifications & Escalations

61. As an Inspector, I want to receive an email notification when an inspection is assigned to me, so that I know work is waiting.
62. As an Inspector, I want to receive a reminder when an inspection I am assigned to is approaching its due date, so that I can plan accordingly.
63. As an Admin, I want to receive a notification when an inspection becomes overdue, so that I can escalate or reassign it.
64. As an Approver, I want to receive a notification when an inspection is submitted for my approval, so that I can act without checking the system constantly.
65. As an Inspector, I want to receive a notification when my submitted inspection is returned for revision, so that I address it promptly.
66. As an Admin and Approver, I want to receive a notification when a High or Critical severity finding is raised, so that serious structural issues get immediate attention.
67. As a remediation action owner, I want to receive a reminder when my action is approaching its due date, so that I can complete or escalate it in time.
68. As an Admin and Approver, I want to receive a notification when a remediation action becomes overdue, so that accountability is enforced.
69. As an Admin, I want to configure the number of days before due date at which reminder notifications are sent, so that the cadence matches my organisation's operating practices.

### Reporting & Dashboards

70. As an Admin or Approver, I want to see a portfolio dashboard showing overall asset health by condition and risk rating, so that I can assess structural exposure at a glance.
71. As an Admin, I want to see a count of inspections that are on-track, due soon, and overdue across my portfolio, so that I can manage the program proactively.
72. As an Admin or Approver, I want to see all open findings grouped by severity and status, so that I can prioritise resolution effort.
73. As an Admin or Approver, I want to see all open remediation actions grouped by owner and due date, so that I can track accountability.
74. As any user, I want to view the full detail of any approved inspection I have access to, so that I can refer back to the historical record.
75. As an Approver, I want to generate a formal PDF inspection report for any approved inspection, so that I have a shareable, printable, tamper-evident document.
76. As an Approver, I want the PDF report to include asset details, all component ratings, checklist responses, evidence photos, findings, compliance status, and my approval signature with timestamp, so that the report is self-contained and defensible.
77. As an Admin, I want to export the full asset register to CSV, so that I can review or cross-reference the portfolio data offline.
78. As an Admin, I want to export the inspection history for any asset or the full portfolio to CSV, so that I can perform trend analysis.
79. As an Admin, I want to export all findings and remediation actions to CSV/Excel, so that I can produce management reports outside the system.

### Compliance

80. As a Platform Admin, I want to map inspection template items to compliance framework references, so that assessments automatically generate compliance status without user effort.
81. As an Approver, I want to see the compliance status (compliant, non-compliant, conditional) on a completed inspection, so that regulatory obligations are reflected in the record.
82. As an Admin, I want to filter the portfolio dashboard by compliance status, so that I can quickly identify assets with compliance issues.

### Audit & Security

83. As any user, I want every change I make to be recorded with my identity and a timestamp, so that there is a defensible audit trail.
84. As an Admin, I want to view the audit history for any asset, inspection, finding, or remediation action, so that I can trace how decisions were reached.
85. As a Platform Admin, I want audit log records to be immutable and append-only, so that historical records cannot be tampered with.
86. As a user, I want my session to expire after inactivity, so that my account is not left exposed on a shared device.
87. As an Admin, I want to be the only person who can grant and revoke access for users in my tenant, so that access control stays under the asset owner's authority.

### Platform Administration (Vendor)

88. As a Platform Admin, I want to create and provision new tenant organisations, so that new customers can be onboarded.
89. As a Platform Admin, I want to create and publish inspection templates with checklists, evidence requirements, and compliance mappings, so that tenants have standardised templates to use.
90. As a Platform Admin, I want to version inspection templates, so that in-flight inspections are not broken when a template is updated.
91. As a Platform Admin, I want to deprecate old template versions, so that new inspection plans use the current version.
92. As a Platform Admin, I want to suspend a tenant organisation, so that access is blocked if needed without destroying data.

---

## Implementation Decisions

### Modules

Nine **deep modules** will be built as independently testable, pure or near-pure units with stable interfaces. Six **application modules** orchestrate persistence, HTTP, and external services. The split is:

**Deep Modules**

- **D1 — Inspection State Machine**: Encapsulates all valid lifecycle transitions for an `InspectionEvent`. Receives the current state, the attempted action, and the actor's role; returns `{ ok, nextState, sideEffects[] }`. Side effects are declared (e.g., `NOTIFY_APPROVER`, `GENERATE_NEXT_INSPECTION`) but not executed — that responsibility belongs to the application layer. No database or I/O dependency.

- **D2 — Finding State Machine**: Same pattern as D1 for the finding lifecycle and the remediation action lifecycle. Enforces that only an internal Approver may close a finding.

- **D3 — Rating Rollup Engine**: Accepts an array of `{ conditionRating: 1-5, riskRating: enum }` objects; returns the worst-case rolled-up values. Stateless pure function.

- **D4 — Offline Sync Engine**: Accepts a tenant context, an actor, and an ordered array of offline mutations (each mutation is a timestamped intent record). Validates authorization per mutation, detects conflicts by comparing server-side entity versions against the mutation's base version, applies non-conflicting mutations transactionally, returns `{ applied[], conflicts[] }`. All conflict detection logic is internal; callers only see the result.

- **D5 — Inspection Schedule Engine**: Given an `InspectionPlan` recurrence rule and a last-completed timestamp, returns the next due date. Handles null (never completed) by returning `plan.start_date`. Pure function, easily unit-tested across edge cases.

- **D6 — Notification Rule Engine**: Given a domain event type and a context object (inspection, tenant config, user roles), resolves the full recipient list, selects the correct email template ID, and returns a render-ready dispatch payload. No direct email sending; the application layer hands the payload to the email gateway.

- **D7 — PDF Report Builder**: Accepts a fully hydrated, approved inspection record and returns a `Buffer` containing the PDF. Uses a server-side rendering approach. No database access; all data must be provided by the caller.

- **D8 — Tenant Isolation Guard**: Express middleware that reads `organisation_id` from the verified JWT, injects it into the request context, and applies it as a mandatory filter on all database query builders. Any query that reaches the DB without an `organisation_id` filter is rejected at this layer. Transparent to route handlers.

- **D9 — Audit Writer**: Accepts entity type, entity ID, actor, action name, before-state object, and after-state object. Serialises snapshots and inserts an append-only audit log row. The insert path has no update or delete counterpart exposed.

**Application Modules (orchestration and persistence)**

- **A1 — Auth Module**: Handles registration, login, JWT issue/refresh, invitation token generation and consumption, password reset flow.
- **A2 — Asset Module**: Asset CRUD, hierarchy traversal, GPS metadata management.
- **A3 — Inspection Module**: Orchestrates plans, events, areas, checklist responses. Delegates state transitions to D1, scheduling to D5, rollup to D3.
- **A4 — Evidence Module**: Generates pre-signed upload URLs, persists evidence metadata, links evidence to inspections or findings.
- **A5 — Findings & Remediation Module**: Finding and action CRUD. Delegates state transitions to D2.
- **A6 — Reporting & Dashboard Module**: Portfolio aggregation queries, dashboard data endpoints, triggers D7 for PDF generation, produces CSV/Excel exports.
- **A7 — Notification Module**: Listens to domain events from other modules, delegates to D6 to resolve recipients and payloads, dispatches via email gateway.
- **A8 — Template Module**: Platform-Admin-only CRUD for inspection templates, versioning, deprecation, compliance mappings.
- **A9 — User & Access Module**: Per-tenant user management, role assignment, external consultant scoping.

### Architecture

- **Monolithic back-end with module-level boundaries** — application server is a single deployable but domain logic is separated into the modules above. Each module exposes a typed service interface; no module reaches into another module's internals.
- **React + TypeScript SPA / PWA** — single codebase for both desktop-class web UI and mobile field experience. Screen layout and feature availability adapt to viewport and role.
- **REST over HTTPS** — all API calls use JSON. No GraphQL in v1.
- **JWT authentication** — short-lived access tokens (15 min) with rotating refresh tokens. Stored in HTTP-only cookies on the web client; in secure storage on the PWA.
- **PostgreSQL** — primary data store. Every tenant-scoped table has `organisation_id` as a non-nullable indexed column. Application-level enforcement via D8.
- **Object storage** — evidence files and generated PDFs stored externally; only metadata in the DB. Files accessed via pre-signed URLs with a short TTL.
- **Background job queue** — async workers handle PDF generation, notification dispatch, scheduled inspection auto-generation, and offline sync resolution.

### Offline Sync

- Client uses a **Service Worker + IndexedDB** for offline persistence.
- Each mutation written offline carries the local ISO timestamp and the entity's last-known server version (optimistic concurrency token).
- On reconnect the PWA sends all pending mutations to a dedicated sync endpoint.
- D4 processes mutations sequentially; conflicts are flagged when the server entity version no longer matches the token supplied.
- Conflicted mutations are not applied; they are returned to the client and surfaced as a review item for the Inspector (and logged in the audit trail).

### Rating Rollup

- Rollup is computed server-side by D3 at the point of inspection submission.
- The rolled-up values are stored on the `InspectionEvent` record and displayed on the dashboard from there; no real-time re-computation on every page load.
- The algorithm: `overall_condition_rating = max(area.conditionRating)`, `overall_risk_rating = highest enum value across area.riskRating`.

### Schema Key Points

- All primary keys are UUIDs to support distributed ID generation from the PWA without server coordination.
- `AuditLog` has no `updated_at`; it is insert-only enforced at the application layer.
- `InspectionTemplate` carries a `version` integer. `InspectionEvent` stores a `template_id` and `template_version` so the template can evolve without invalidating historical records.
- `Finding.latitude/longitude` are nullable to support findings raised post-inspection without GPS data.

### API Contracts (key endpoints)

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/invite
POST   /api/auth/accept-invite

GET    /api/assets                    (paginated, filterable by level/status)
POST   /api/assets
PATCH  /api/assets/:id
GET    /api/assets/:id/hierarchy

GET    /api/inspection-plans
POST   /api/inspection-plans
PATCH  /api/inspection-plans/:id

GET    /api/inspections               (filterable by status, assignee, asset)
GET    /api/inspections/:id
PATCH  /api/inspections/:id/transition  { action, notes }
POST   /api/inspections/:id/areas
POST   /api/inspections/:id/checklist-responses
POST   /api/inspections/:id/evidence/upload-url
POST   /api/inspections/:id/submit
POST   /api/inspections/:id/approve
POST   /api/inspections/:id/return    { comments }

GET    /api/findings
POST   /api/findings
PATCH  /api/findings/:id
PATCH  /api/findings/:id/transition   { action, notes }

GET    /api/remediation-actions
POST   /api/remediation-actions
PATCH  /api/remediation-actions/:id
PATCH  /api/remediation-actions/:id/transition

POST   /api/sync                      { mutations: [...] }  (offline sync)

GET    /api/reports/dashboard
GET    /api/reports/inspections/:id/pdf
GET    /api/reports/export/assets
GET    /api/reports/export/inspections
GET    /api/reports/export/findings
```

---

## Testing Decisions

### What makes a good test

Tests should verify **observable external behaviour**, not implementation details. A good test:

- Calls the public interface of the module under test with a given input.
- Asserts on the returned output or declared side effects.
- Does not assert on internal variable names, private functions, or call order within a module.
- Remains valid after an internal refactor that preserves the contract.
- Is self-contained: no shared global state, no dependency on test-execution order.

For deep modules in particular: if the test would need to change because of an internal refactoring but the module's contract did not change, the test is too coupled to implementation.

### Modules to test

All six primary deep modules will have comprehensive unit test suites:

**D1 — Inspection State Machine**
Test every valid transition for each role, every invalid transition (should return `ok: false`), all side-effect declarations, and boundary cases such as transitioning from a terminal state.

**D2 — Finding State Machine**
Test valid and invalid transitions for findings and remediation actions, with particular focus on the rule that only an internal Approver may close a finding.

**D3 — Rating Rollup Engine**
Test single-component inputs, multi-component inputs with all identical ratings, mixed ratings (worst-case selection), empty arrays, and null values.

**D4 — Offline Sync Engine**
Test: clean batch with no conflicts applies all mutations in order; batch with a mid-sequence conflict applies before-conflict mutations and skips conflicted and post-conflicted mutations; unauthorised mutation in batch is rejected without affecting surrounding mutations; empty batch returns cleanly.

**D5 — Inspection Schedule Engine**
Test: standard recurrence with a known last-completed date; first-ever inspection (null last-completed, returns plan start date); manual override does not change recurrence computation; recurrence on 31st of month when next month has fewer days.

**D6 — Notification Rule Engine**
Test: each domain event type resolves the correct recipient roles; tenant notification config (threshold days) is respected; missing optional fields in context do not cause a crash; events with no applicable recipients return an empty dispatch list.

**D7 — PDF Report Builder**
Integration test (not unit test): given a fixture of a complete approved inspection record, assert the returned Buffer is a valid PDF, contains the asset name, approver name, and at least one finding title. Does not assert pixel layout.

**D9 — Audit Writer**
Integration test against a test database: given a write call, assert the row is present; assert a second write on the same entity produces a second row (not an update); assert the module exposes no update or delete path.

**Application modules (A1–A9)**
API-level integration tests using a test database and in-process HTTP server. Each test issues an HTTP request and asserts on the response status, response body shape, and — where relevant — a follow-up read confirms the persisted state. Test both happy paths and key authorisation failures (wrong role, cross-tenant access attempt).

**No prior art** exists in the codebase today (project is greenfield), so the test file structure and helpers will be established as part of the first module implementation.

---

## Out of Scope

- Continuous IoT sensor monitoring as a primary operating mode.
- External system integrations: EAM, ERP, GIS, CMMS, maintenance management systems.
- Enterprise SSO or federated identity.
- Floor plan, building model, or map-based visualisation of assets and findings.
- Full maintenance execution workflows: work orders, labour tracking, parts, contractor management.
- Multi-step or multi-approver approval chains.
- Tenant-level self-service configuration of inspection templates, rating schemes, or compliance frameworks.
- Editable (Word) report exports.
- Native iOS or Android applications.
- Public API or webhook integrations for third-party consumers.

---

## Further Notes

- The product must remain deployment-agnostic. Environment-specific configuration is injected via environment variables only; no secrets may be committed to source control.
- Template versioning (stored on `InspectionEvent` at creation time) is a forward compatibility contract — any change to template structure must increment the version, never mutate an existing version that has live inspection events referencing it.
- The Offline Sync Engine (D4) is the highest-risk module in the system from a data integrity standpoint. It should be the first deep module built, tested, and reviewed before field execution work begins.
- PDF reports are signed by the approval record, not by a cryptographic signature in v1. The audit log is the chain of custody. Digital signing can be added in a future release.
- All user-facing text in notifications and report templates should be kept in a separate resource layer from day one, even if internationalisation is not in scope for v1, to avoid costly refactoring later.
