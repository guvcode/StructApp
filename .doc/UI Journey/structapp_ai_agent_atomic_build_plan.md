# StructApp — AI Agent Atomic Build Plan

## Purpose

This document is the **single control file** to give to an AI coding agent. It tells the agent how to use the four supporting Markdown documents, what to build first, how to proceed one atomic task at a time, and when to stop for review.

Use this file as the **agent execution plan**.

---

# 1. Source Documents

The build is controlled by these four files:

| File | Purpose | How the agent should use it |
|---|---|---|
| `structapp_prioritized_mvp_backlog.md` | Build scope, epics, user stories, priorities, acceptance criteria, MVP gates | **Primary source of truth for what to build and in what order** |
| `structapp_screen_navigation_design.md` | Screen inventory, layouts, UI states, validations, screen behavior | Use when implementing pages, forms, tables, modals, loading/empty/error/offline states |
| `structapp_menu_navigation_ux_spec.md` | Menus, sidebar, mobile bottom nav, route map, contextual action menus, visibility rules | Use when implementing routing, navigation, sidebar, bottom nav, route guards, menu labels |
| `structapp_module_personas_user_journeys.md` | Personas, modules, workflows, permissions, end-to-end journeys | Use as product context and to resolve ambiguity; do not treat as the task list |

---

# 2. Document Authority Order

If files conflict, follow this order:

1. `structapp_prioritized_mvp_backlog.md`
2. `structapp_menu_navigation_ux_spec.md`
3. `structapp_screen_navigation_design.md`
4. `structapp_module_personas_user_journeys.md`

## Interpretation rule

The backlog decides **what is in scope**.  
The menu/navigation spec decides **where it appears**.  
The screen/navigation design decides **how it behaves visually**.  
The personas/journeys file explains **why the workflow exists**.

---

# 3. Agent Operating Rules

## 3.1 Build one atomic task at a time

The agent must not attempt to build the full product in one pass.

For each task, the agent must:

1. Read this build plan.
2. Read only the referenced supporting documents/sections needed for the task.
3. Implement the task.
4. Run available lint/type/build checks.
5. Report:
   - files created
   - files changed
   - routes added
   - components added
   - acceptance criteria satisfied
   - known gaps
6. Stop and wait for the next task instruction.

## 3.2 Do not invent

The agent must not invent:

- new roles
- new top-level menus
- new routes
- new workflows
- new statuses
- new permissions
- new entities
- new P1/P2 functionality during P0 work

When unsure, choose the safest option that preserves:

1. tenant isolation
2. auditability
3. offline data preservation
4. role-based access
5. explicit workflow transitions

## 3.3 Feature phase guardrail

| Phase | Build rule |
|---|---|
| P0 | Build immediately |
| P1 | Stub only if required by P0 navigation; do not implement unless instructed |
| P2 | Hide behind feature flag or do not render at all unless explicitly instructed |

## 3.4 JavaScript Mastery-style implementation expectation

If using a JavaScript Mastery-style agent/workflow, each task should produce:

- clean component structure
- reusable layout components
- route-based pages
- mock data or service adapters where backend is not ready
- clear loading/empty/error states
- mobile responsiveness
- accessible form labels and buttons
- predictable naming
- no massive all-in-one files

Recommended stack assumptions unless project says otherwise:

- React
- TypeScript
- Vite or Next-compatible structure if already chosen
- Tailwind-style utility classes
- component-driven UI
- mock service layer first, API integration later
- strict role and feature visibility through route guards and menu guards

---

# 4. Build Strategy Overview

Build in this sequence:

| Stage | Goal | Main reference files |
|---|---|---|
| Stage 0 | Project scaffold and conventions | Backlog, menu spec |
| Stage 1 | App shell, routing, role-aware navigation | Menu spec, screen design |
| Stage 2 | Auth screens and mock auth/session state | Backlog EP-01, screen design AUTH screens |
| Stage 3 | Admin setup screens | Backlog EP-03, menu spec Admin routes |
| Stage 4 | Register management screens | Backlog EP-04, screen design Register |
| Stage 5 | Contractor mobile PWA core | Backlog EP-05/06/07, mobile screen specs |
| Stage 6 | Reviewer inspection workflow | Backlog EP-08/09, reviewer screen specs |
| Stage 7 | Admin reopen and governance controls | Backlog EP-05/17, admin screen specs |
| Stage 8 | P1 modules | Remediation, timesheets, reports, picklists, audit |
| Stage 9 | P2 modules | Imports, calendar/scheduling |
| Stage 10 | Hardening | MVP gates, tests, accessibility, edge states |

---

# 5. Atomic Build Tasks

## Stage 0 — Project Foundation

### TASK-000 — Read and summarize source docs

| Field | Value |
|---|---|
| Goal | Confirm the agent understands the four-document structure |
| Input docs | All four docs |
| Output | A short implementation summary; no code |
| Stop gate | Human confirms the agent understood authority order |

#### Agent instruction
```md
Read the following files:
1. structapp_prioritized_mvp_backlog.md
2. structapp_menu_navigation_ux_spec.md
3. structapp_screen_navigation_design.md
4. structapp_module_personas_user_journeys.md

Do not code yet.

Summarize:
- document authority order
- P0 build scope
- P1/P2 items to hide or defer
- top-level navigation by role
- first 10 implementation tasks you recommend
```

---

### TASK-001 — Scaffold project structure

| Field | Value |
|---|---|
| Goal | Establish clean frontend structure |
| Reference | Backlog NFRs, menu spec route map |
| Priority | P0 |
| Output | Base app folders, routing folders, shared component folders |
| Stop gate | App runs with placeholder home page |

#### Atomic checklist
- Create `/src/app` or equivalent routing root
- Create `/src/components`
- Create `/src/layouts`
- Create `/src/routes` or framework route folders
- Create `/src/services`
- Create `/src/data/mock`
- Create `/src/types`
- Create `/src/lib`
- Add placeholder app shell
- Add base error boundary if supported

#### Acceptance criteria
- App starts successfully
- TypeScript compiles
- There is a visible placeholder page
- No product workflow is implemented yet

---

### TASK-002 — Define shared domain types

| Field | Value |
|---|---|
| Goal | Create frontend TypeScript types for roles, statuses, entities, menu definitions |
| Reference | Backlog EP-01 to EP-07, personas/journeys, menu spec |
| Priority | P0 |
| Output | Shared type files |
| Stop gate | Types compile with no `any` |

#### Required types
- `UserRole`
- `Client`
- `User`
- `ClientMembership`
- `Project`
- `Site`
- `Structure`
- `Inspection`
- `InspectionStatus`
- `Deficiency`
- `PriorityTier`
- `RemediationStatus`
- `Timesheet`
- `MenuItem`
- `FeatureFlag`
- `AuthSession`
- `SyncState`

#### Acceptance criteria
- Types represent only documented roles/statuses
- No invented roles/statuses
- No `any`
- Types are reusable across screens

---

### TASK-003 — Create mock data layer

| Field | Value |
|---|---|
| Goal | Support UI development before real API integration |
| Reference | Backlog EP-01 to EP-09 |
| Priority | P0 |
| Output | Mock users, clients, inspections, structures, deficiencies |
| Stop gate | Screens can consume mock services |

#### Required mock services
- `authService`
- `clientService`
- `userService`
- `registerService`
- `inspectionService`
- `deficiencyService`
- `syncService`
- `timesheetService` as P1 stub
- `reportService` as P1 stub

#### Acceptance criteria
- Services return typed promises
- Mock data includes Contractor, Reviewer, Admin
- Mock data includes at least two clients to test tenant switching
- Mock data includes Submitted, Returned, Approved inspections
- Mock data includes P1 and non-P1 deficiencies

---

# Stage 1 — App Shell, Routing, and Navigation

### TASK-010 — Implement route map skeleton

| Field | Value |
|---|---|
| Goal | Create canonical routes without implementing full pages |
| Reference | `structapp_menu_navigation_ux_spec.md` section Route Map |
| Priority | P0 |
| Output | Routes with placeholder pages |
| Stop gate | All P0 routes render placeholders |

#### Required P0 routes
- `/login`
- `/activate`
- `/select-client`
- `/session-expired`
- `/m/dashboard`
- `/m/sync`
- `/m/inspections/:id`
- `/m/inspections/:id/submit`
- `/m/structures/search`
- `/m/deficiencies/:localId`
- `/m/deficiencies/:localId/photos`
- `/m/settings`
- `/admin/dashboard`
- `/admin/clients`
- `/admin/clients/new`
- `/admin/users`
- `/admin/users/invite`
- `/reviewer/dashboard`
- `/inspections`
- `/inspections/:id/review`
- `/deficiencies/:id`
- `/register`
- `/register/projects`
- `/register/sites`
- `/register/structures`

#### Acceptance criteria
- Routes match menu spec exactly
- P1/P2 routes are not added unless as hidden placeholders
- Unknown routes show Not Found
- Route files/pages are small and named clearly

---

### TASK-011 — Implement role-aware layout shells

| Field | Value |
|---|---|
| Goal | Create separate shells for auth, mobile PWA, and desktop portal |
| Reference | Screen design global shells; menu spec |
| Priority | P0 |
| Output | `AuthLayout`, `MobileShell`, `DesktopShell` |
| Stop gate | Role-specific shells render correctly |

#### Acceptance criteria
- Auth routes use Auth shell
- Contractor mobile routes use Mobile shell
- Reviewer/Admin desktop routes use Desktop shell
- Desktop shell displays active client context
- Mobile shell displays connectivity/sync summary area
- No Admin menu appears for Reviewer
- No Reviewer/Admin sidebar appears on mobile Contractor pages

---

### TASK-012 — Implement desktop sidebar menu

| Field | Value |
|---|---|
| Goal | Add exact Reviewer/Admin sidebar from menu spec |
| Reference | `structapp_menu_navigation_ux_spec.md` sections 2.2, 2.3, 3 |
| Priority | P0 |
| Output | Reusable sidebar component |
| Stop gate | Menu differs correctly by role |

#### Acceptance criteria
- Reviewer sees Dashboard, Inspections, Register in P0
- Admin sees Dashboard, Clients, Users, Register, Inspections in P0
- P1/P2 items hidden or feature-flagged
- Active route is highlighted
- Submenus expand based on current route
- No Reopen/Approve/Return as sidebar items

---

### TASK-013 — Implement mobile bottom navigation

| Field | Value |
|---|---|
| Goal | Add Contractor mobile bottom nav |
| Reference | Menu spec Contractor section |
| Priority | P0 |
| Output | Mobile bottom nav component |
| Stop gate | Bottom nav appears on `/m/*` routes |

#### Acceptance criteria
- Shows Dashboard, Sync, Settings in P0
- Timesheets hidden or feature-flagged until enabled
- Active tab highlighted
- No more than four bottom-nav items
- Inspection detail remains reachable from Dashboard, not top-level tab

---

### TASK-014 — Implement route guards and feature flags

| Field | Value |
|---|---|
| Goal | Prevent unauthorized route visibility/access in UI |
| Reference | Backlog EP-02, menu spec visibility rules |
| Priority | P0 |
| Output | Role guard and feature flag guard |
| Stop gate | Manual role-switch test passes |

#### Acceptance criteria
- Contractor cannot access `/admin/*`
- Contractor cannot access Reviewer routes
- Reviewer cannot access Admin-only routes
- Admin can access Admin and shared desktop routes
- P1/P2 features can be disabled globally
- Unauthorized route shows safe Forbidden screen

---

# Stage 2 — Authentication Screens

### TASK-020 — Build Login screen

| Field | Value |
|---|---|
| Goal | Implement login UI and mock login behavior |
| Reference | Backlog AUTH-01, screen design AUTH-01 |
| Priority | P0 |
| Output | Login page |
| Stop gate | Can log in as Contractor, Reviewer, Admin using mocks |

#### Acceptance criteria
- Email/password fields
- Inline validation
- Generic invalid credential error
- Inactive user error
- Successful login routes by role
- Multi-client user routes to client picker

---

### TASK-021 — Build Client Picker screen

| Field | Value |
|---|---|
| Goal | Allow multi-client user to select active client |
| Reference | Backlog AUTH-02, menu spec visibility |
| Priority | P0 |
| Output | Client picker page |
| Stop gate | Selected client controls visible context |

#### Acceptance criteria
- Shows only authorized clients
- Selecting client sets `activeClientId`
- Unauthorized client is rejected in service layer
- Single-client user skips picker
- Admin can later switch client from desktop shell

---

### TASK-022 — Build Invite Activation screen

| Field | Value |
|---|---|
| Goal | Implement account activation UI |
| Reference | Backlog AUTH-06/AUTH-07, screen design AUTH-03 |
| Priority | P0 |
| Output | Activation page |
| Stop gate | Mock activation success/failure states work |

#### Acceptance criteria
- Password and confirm password fields
- Expired/invalid token state
- Password mismatch validation
- Successful activation routes to login
- No password appears in logs

---

### TASK-023 — Build session expired and logout behavior

| Field | Value |
|---|---|
| Goal | Handle session expiry and logout safely |
| Reference | Backlog AUTH-04/AUTH-05, mobile settings |
| Priority | P0 |
| Output | Session expired route, logout flow |
| Stop gate | Unsynced data warning works |

#### Acceptance criteria
- Expired session page exists
- Logout clears auth state
- Contractor with unsynced mock items receives warning
- Protected routes redirect after logout

---

# Stage 3 — Admin Setup Screens

### TASK-030 — Build Admin Dashboard

| Field | Value |
|---|---|
| Goal | Create admin landing page |
| Reference | Screen design ADM-01, menu spec Admin |
| Priority | P0 |
| Output | Admin dashboard |
| Stop gate | Shows active client and governance cards |

#### Acceptance criteria
- Cards for Clients, Users, Inspections, P1 alerts
- Quick actions for New Client and Invite User
- Active client is visible
- P1/P2 cards hidden if feature disabled

---

### TASK-031 — Build Client Management list

| Field | Value |
|---|---|
| Goal | Create client list and basic management UI |
| Reference | Backlog ADM-01/ADM-02, screen design ADM-02 |
| Priority | P0 |
| Output | `/admin/clients` |
| Stop gate | Admin can create and edit mock clients |

#### Acceptance criteria
- Table shows client name, safety contact, created/updated metadata
- Create client form
- Edit client form/drawer
- Unique name validation
- Safety email validation
- Non-admin route is forbidden

---

### TASK-032 — Build User Management list

| Field | Value |
|---|---|
| Goal | Create user and membership management UI |
| Reference | Backlog ADM-03 to ADM-05, screen design ADM-03 |
| Priority | P0 |
| Output | `/admin/users` |
| Stop gate | Admin can invite and edit mock users |

#### Acceptance criteria
- Table shows email, role, clients, active status, last login
- Invite user route/form exists
- Role selector uses documented roles only
- Reviewer/Contractor require at least one client
- Deactivate action requires confirmation
- Role/membership changes are shown as audited mock events or placeholders

---

### TASK-033 — Build Admin Client Switcher

| Field | Value |
|---|---|
| Goal | Enable Admin to switch active client context |
| Reference | Backlog AUTH-03, menu spec ADM-04 |
| Priority | P0 |
| Output | Top-bar client switcher |
| Stop gate | Switching changes displayed tenant data |

#### Acceptance criteria
- Visible only to Admin
- Shows current active client
- Switch refreshes app state/mock context
- Warns if unsaved form state exists where feasible
- Switch event logged in mock audit/history

---

# Stage 4 — Register Management

### TASK-040 — Build Register landing and hierarchy

| Field | Value |
|---|---|
| Goal | Create Register area for Projects, Sites, Structures |
| Reference | Backlog EP-04, screen design REV-10, menu spec Register |
| Priority | P0 |
| Output | `/register` and subroutes |
| Stop gate | Register hierarchy is navigable |

#### Acceptance criteria
- Register is available to Reviewer/Admin only
- Contractor does not get desktop Register access
- Subroutes exist for Projects, Sites, Structures
- Breadcrumbs show hierarchy
- Lists use pagination patterns

---

### TASK-041 — Build Project list/create/edit

| Field | Value |
|---|---|
| Goal | Manage tenant projects |
| Reference | Backlog REG-01 |
| Priority | P0 |
| Output | Project table and form |
| Stop gate | Mock create/edit works |

#### Acceptance criteria
- Project list is tenant-scoped
- Create/edit form validates title
- Type supports documented values if exposed
- Contractor cannot edit
- Empty/loading/error states exist

---

### TASK-042 — Build Site list/create/edit

| Field | Value |
|---|---|
| Goal | Manage sites within projects |
| Reference | Backlog REG-02 |
| Priority | P0 |
| Output | Site table and form |
| Stop gate | Mock create/edit works |

#### Acceptance criteria
- Site belongs to selected project
- Project selector/filter exists
- Tenant consistency maintained
- Pagination and empty states exist

---

### TASK-043 — Build Structure list/create/edit/search

| Field | Value |
|---|---|
| Goal | Manage structures and QR values |
| Reference | Backlog REG-03/REG-04/REG-05 |
| Priority | P0 |
| Output | Structure grid and form |
| Stop gate | Structure search and create/edit work |

#### Acceptance criteria
- Fields include asset tag, description, optional QR value
- Asset tag uniqueness per site is validated in mock service
- QR uniqueness is validated if provided
- Search filters by asset tag/description/QR
- Empty/loading/error states exist

---

# Stage 5 — Contractor Mobile PWA Core

### TASK-050 — Build Contractor Dashboard

| Field | Value |
|---|---|
| Goal | Create mobile task hub |
| Reference | Backlog INS-02, screen design MOB-01, menu spec mobile dashboard |
| Priority | P0 |
| Output | `/m/dashboard` |
| Stop gate | Contractor can see assigned and returned inspections |

#### Acceptance criteria
- Shows assigned inspections
- Shows returned inspections with reason
- Shows pending sync count
- Shows connectivity banner
- Shows quick actions: Sync, Scan QR
- Offline with cached data state exists
- Empty assignment state exists

---

### TASK-051 — Build Sync Hub UI

| Field | Value |
|---|---|
| Goal | Manage pull package and push outbox |
| Reference | Backlog EP-06, screen design MOB-02 |
| Priority | P0 |
| Output | `/m/sync` |
| Stop gate | Mock sync states display correctly |

#### Acceptance criteria
- Shows online/offline status
- Shows last pull and push timestamps
- Shows outbox items by type
- Pull package mock action works
- Push outbox mock action works
- Auth expired, validation error, conflict, and media error states exist

---

### TASK-052 — Build mobile Inspection Detail

| Field | Value |
|---|---|
| Goal | Open and manage assigned inspection |
| Reference | Backlog INS-02/INS-03, screen design MOB-03 |
| Priority | P0 |
| Output | `/m/inspections/:id` |
| Stop gate | Contractor can open assignment and navigate to deficiency form |

#### Acceptance criteria
- Shows structure, project, site, status, due date
- Shows returned reason if Returned
- Shows deficiency list with sync state
- Actions reflect status
- Submitted/Approved are read-only
- Add Deficiency and Submit navigation works

---

### TASK-053 — Build Structure Search / QR page

| Field | Value |
|---|---|
| Goal | Search or scan structures |
| Reference | Backlog REG-04/REG-05, screen design MOB-04, menu spec route map |
| Priority | P0/P1 |
| Output | `/m/structures/search` |
| Stop gate | Manual search works; QR can be stubbed if camera not implemented |

#### Acceptance criteria
- Manual search works against mock downloaded structures
- QR scan button component exists
- Camera denied/no match fallback states exist
- Offline search against cached data works
- Structure outside assignment is safely handled

---

### TASK-054 — Build Historical Deficiency Triage panel

| Field | Value |
|---|---|
| Goal | Let contractor triage unresolved historical deficiencies |
| Reference | Backlog DEF-06, screen design MOB-05 |
| Priority | P0 |
| Output | Triage component embedded in inspection/deficiency flow |
| Stop gate | User can select triage decision |

#### Acceptance criteria
- Shows unresolved history
- Supports New unrelated, Resolved, Still Outstanding, Worsened
- Linked decisions set previous deficiency ID in local state
- Required triage decisions block submit if missing
- Empty history state exists

---

### TASK-055 — Build Deficiency Form

| Field | Value |
|---|---|
| Goal | Capture deficiency details locally |
| Reference | Backlog DEF-01/02/03/05, screen design MOB-06 |
| Priority | P0 |
| Output | `/m/deficiencies/:localId` and new deficiency flow |
| Stop gate | Contractor can create local deficiency draft |

#### Acceptance criteria
- Component type picklist
- Description field
- Severity/probability/consequence inputs
- Provisional priority badge
- GPS fields with validation
- Local save state
- Inline validation
- No final trusted priority until sync confirmation

---

### TASK-056 — Build Photo Evidence Manager

| Field | Value |
|---|---|
| Goal | Add photo evidence management UI |
| Reference | Backlog DEF-04, screen design MOB-07 |
| Priority | P0 |
| Output | `/m/deficiencies/:localId/photos` |
| Stop gate | Mock photo records can be added/captioned/removed locally |

#### Acceptance criteria
- Add photo control or mock uploader
- Caption required
- Maximum five photos
- Purpose defaults to deficiency evidence
- Local unsynced delete allowed
- Empty and max-limit states exist

---

### TASK-057 — Build Inspection Submit Review

| Field | Value |
|---|---|
| Goal | Require explicit completion before submission |
| Reference | Backlog INS-03, SUB-01, screen design MOB-08 |
| Priority | P0 |
| Output | `/m/inspections/:id/submit` |
| Stop gate | Valid and invalid submit paths work in mock state |

#### Acceptance criteria
- Shows deficiency summary
- Blocks if unsynced required data exists
- Blocks if validation errors exist
- Requires no-deficiencies confirmation for empty inspection
- Submit updates status to Submitted in mock service
- Offline submit blocked or saved as clearly-labelled deferred intent

---

# Stage 6 — Reviewer Inspection Workflow

### TASK-060 — Build Reviewer Dashboard

| Field | Value |
|---|---|
| Goal | Create reviewer landing page |
| Reference | Screen design REV-01 |
| Priority | P0 |
| Output | `/reviewer/dashboard` |
| Stop gate | Reviewer sees work queue summary |

#### Acceptance criteria
- Submitted inspections card
- Returned work card
- P1 items card
- Remediation/report/timesheet cards hidden if P1 disabled
- Cards link to filtered routes

---

### TASK-061 — Build Inspection Queue

| Field | Value |
|---|---|
| Goal | Build filterable inspection table |
| Reference | Backlog REV-01, screen design REV-02, menu spec inspection submenus |
| Priority | P0 |
| Output | `/inspections` |
| Stop gate | Reviewer/Admin can filter submitted/returned/approved |

#### Acceptance criteria
- Table columns match screen spec
- Filters for status, priority, project/site, inspector, date range
- Pagination exists
- Row actions vary by role and status
- Empty/loading/error states exist

---

### TASK-062 — Build Inspection Review Workspace

| Field | Value |
|---|---|
| Goal | Review form data and photo evidence |
| Reference | Backlog REV-02, screen design REV-03 |
| Priority | P0 |
| Output | `/inspections/:id/review` |
| Stop gate | Reviewer can inspect deficiencies and evidence |

#### Acceptance criteria
- Header shows inspection metadata
- Left pane shows deficiencies/details
- Right pane shows photo gallery/evidence
- History/carry-forward chain visible
- Action bar shows correct actions by role/status
- Approved view is read-only

---

### TASK-063 — Build Priority Override Panel

| Field | Value |
|---|---|
| Goal | Allow Reviewer/Admin to override priority with justification |
| Reference | Backlog DEF-07, screen design REV-04 |
| Priority | P0 |
| Output | Deficiency override drawer/panel |
| Stop gate | Override mock action works and validates reason |

#### Acceptance criteria
- Visible only to Reviewer/Admin
- Requires adjusted priority
- Requires justification
- Shows original calculated priority
- Shows override actor/time after save
- Contractor cannot access action

---

### TASK-064 — Build Return Inspection Modal

| Field | Value |
|---|---|
| Goal | Return submitted inspection with reason |
| Reference | Backlog INS-04, REV-03, screen design REV-05 |
| Priority | P0 |
| Output | Return modal |
| Stop gate | Return state update works |

#### Acceptance criteria
- Only visible for Submitted inspection and Reviewer/Admin
- Reason required
- Status changes to Returned
- Mock notification/log entry created
- Contractor dashboard can show returned reason after mock refresh

---

### TASK-065 — Build Approve Inspection Confirmation

| Field | Value |
|---|---|
| Goal | Approve and lock inspection |
| Reference | Backlog INS-05, REV-04/REV-05, screen design REV-06 |
| Priority | P0 |
| Output | Approve confirmation modal |
| Stop gate | Approved inspection becomes read-only |

#### Acceptance criteria
- Only visible for Submitted inspection and Reviewer/Admin
- Confirmation explains locking
- Status changes to Approved
- Approver/time recorded
- Subsequent edit actions are hidden/disabled

---

# Stage 7 — Admin Reopen and Governance Controls

### TASK-070 — Build Admin Reopen Modal

| Field | Value |
|---|---|
| Goal | Controlled exception for approved records |
| Reference | Backlog INS-06, screen design ADM-07, menu spec action rules |
| Priority | P0 |
| Output | Reopen modal |
| Stop gate | Admin can reopen mock Approved inspection |

#### Acceptance criteria
- Visible only to Admin
- Visible only on Approved inspections
- Target status limited to Submitted or Returned
- Reason required
- Reopened by/at/reason stored in mock data
- Reviewer direct access impossible in UI

---

### TASK-071 — Build Forbidden and safe Not Found screens

| Field | Value |
|---|---|
| Goal | Provide safe denied access UX |
| Reference | Backlog SEC-05 |
| Priority | P0 |
| Output | Forbidden and Not Found screens |
| Stop gate | Unauthorized navigation does not leak data |

#### Acceptance criteria
- `401` redirects/logs out as appropriate
- `403` shows access denied
- Cross-tenant not found does not disclose existence
- Forbidden page has route back to allowed dashboard

---

### TASK-072 — Add audit metadata placeholders to governed actions

| Field | Value |
|---|---|
| Goal | Show auditability in UI before backend integration |
| Reference | Backlog AUD-03, journeys |
| Priority | P0/P1 |
| Output | Audit metadata display on approval/reopen/override |
| Stop gate | Mock governed actions show actor/time/reason |

#### Acceptance criteria
- Approval shows approver/time
- Reopen shows actor/time/reason
- Override shows actor/time/justification
- UI has clear provenance labels

---

# Stage 8 — P1 Modules

## Only start Stage 8 after all P0 tasks are accepted.

### TASK-080 — Build Remediation Queue

| Field | Value |
|---|---|
| Goal | Track remediation lifecycle |
| Reference | Backlog EP-10, screen design REV-07 |
| Priority | P1 |
| Output | `/remediation` |
| Stop gate | Queue filters by remediation status |

---

### TASK-081 — Build Verify Closure Modal

| Field | Value |
|---|---|
| Goal | Verify closure with evidence |
| Reference | Backlog REM-03/REM-04, screen design REV-08 |
| Priority | P1 |
| Output | Verify closure modal |
| Stop gate | Closure blocked without evidence |

---

### TASK-082 — Build Contractor Timesheets

| Field | Value |
|---|---|
| Goal | Draft and submit timesheets |
| Reference | Backlog EP-11, screen design MOB-10 |
| Priority | P1 |
| Output | `/m/timesheets`, `/m/timesheets/:id` |
| Stop gate | Contractor can draft and submit mock timesheet |

---

### TASK-083 — Build Timesheet Review Queue

| Field | Value |
|---|---|
| Goal | Reviewer/Admin approves or rejects timesheets |
| Reference | Backlog TIME-03, screen design REV-09 |
| Priority | P1 |
| Output | `/timesheets/review` |
| Stop gate | Approve/reject works in mock state |

---

### TASK-084 — Build Report Publishing Center

| Field | Value |
|---|---|
| Goal | Generate and monitor report jobs |
| Reference | Backlog EP-12, screen design REV-12 |
| Priority | P1 |
| Output | `/reports`, `/reports/jobs` |
| Stop gate | Mock report jobs move through statuses |

---

### TASK-085 — Build Picklist Manager

| Field | Value |
|---|---|
| Goal | Manage component and work-type lists |
| Reference | Backlog EP-14, screen design REV-13 |
| Priority | P1 |
| Output | `/picklists/component-types`, `/picklists/work-types` |
| Stop gate | Add/rename/deactivate mock entries |

---

### TASK-086 — Build Audit Log Viewer

| Field | Value |
|---|---|
| Goal | Admin-only audit log view |
| Reference | Backlog EP-17, screen design ADM-06 |
| Priority | P1 |
| Output | `/admin/audit-logs` |
| Stop gate | Admin can filter mock audit logs; Reviewer gets Forbidden |

---

# Stage 9 — P2 Modules

## Only start Stage 9 after P0 and P1 tasks are accepted.

### TASK-090 — Build CSV Import Center

| Field | Value |
|---|---|
| Goal | Upload, validate, commit/discard CSV imports |
| Reference | Backlog EP-16, screen design ADM-05 |
| Priority | P2 |
| Output | `/admin/imports`, `/admin/imports/history` |
| Stop gate | Mock CSV validation and commit/discard flow works |

---

### TASK-091 — Build Calendar and Scheduling

| Field | Value |
|---|---|
| Goal | Manage recurring inspection schedules |
| Reference | Backlog EP-15, screen design REV-11 |
| Priority | P2 |
| Output | `/calendar`, `/calendar/schedules` |
| Stop gate | Mock schedule create/reschedule/pause works |

---

# Stage 10 — Hardening and MVP Acceptance

### TASK-100 — Add loading, empty, error, and offline states everywhere

| Field | Value |
|---|---|
| Goal | Complete UI resilience |
| Reference | Screen navigation design section 9 |
| Priority | P0/P1 |
| Output | Consistent state components |
| Stop gate | Every P0 screen demonstrates all relevant states |

#### Acceptance criteria
- Every list has empty/loading/error states
- Every form has inline validation
- Every protected route has forbidden behavior
- Every mobile offline state is visible
- Sync errors are actionable

---

### TASK-101 — Add accessibility pass

| Field | Value |
|---|---|
| Goal | Improve keyboard and screen-reader usability |
| Reference | Backlog NFR-08 |
| Priority | P1 |
| Output | Accessibility fixes |
| Stop gate | Core flows are keyboard usable |

#### Acceptance criteria
- Form controls have labels
- Buttons have meaningful text
- Modal focus is trapped
- Keyboard navigation works through menus
- Error messages are associated with fields

---

### TASK-102 — Add tests for role/navigation behavior

| Field | Value |
|---|---|
| Goal | Protect role-based menu and route behavior |
| Reference | Backlog EP-02, menu spec visibility |
| Priority | P0 |
| Output | Unit/integration tests |
| Stop gate | Tests pass |

#### Required test cases
- Contractor cannot access Admin routes
- Reviewer cannot access Admin routes
- Admin can see Admin menu
- P1/P2 items hidden when flags disabled
- Reopen visible only to Admin on Approved inspection
- Approve/Return visible only on Submitted inspection
- Mobile bottom nav has max four items

---

### TASK-103 — Run MVP acceptance gate

| Field | Value |
|---|---|
| Goal | Confirm P0 pilot readiness |
| Reference | Backlog MVP Acceptance Gate |
| Priority | P0 |
| Output | Acceptance checklist report |
| Stop gate | Human signs off P0 build |

#### MVP acceptance checklist
- P0 stories complete
- Contractor can complete inspection offline and sync later
- P1 mock/real notification path exists for P1 deficiency
- Reviewer can return and approve inspection
- Approved record becomes read-only
- Admin can reopen approved inspection
- Role-based navigation and route guards work
- Tenant/client context is visible
- Sync conflict/error states preserve local work
- Empty/loading/error/offline states exist

---

# 6. Recommended Agent Prompt Template

Use this prompt for each task.

```md
You are implementing StructApp using the AI Agent Atomic Build Plan.

Current task:
[TASK ID AND NAME]

Use these reference files:
1. structapp_prioritized_mvp_backlog.md
2. structapp_menu_navigation_ux_spec.md
3. structapp_screen_navigation_design.md
4. structapp_module_personas_user_journeys.md

Rules:
- Build only the current task.
- Do not implement future tasks.
- Do not invent new routes, roles, statuses, menus, or workflows.
- Follow the document authority order:
  1. backlog
  2. menu/navigation UX spec
  3. screen/navigation design
  4. personas/journeys
- Use mock services if backend is not ready.
- Include loading, empty, and error states where relevant.
- Preserve role-based and feature-flag visibility.
- After implementation, report:
  - files created
  - files changed
  - routes added
  - components added
  - acceptance criteria satisfied
  - what remains incomplete
Stop after the task and wait for review.
```

---

# 7. First Five Agent Runs

Use these as your first sequence.

## Run 1
```md
Execute TASK-000 only. Read and summarize the four documents. Do not code.
```

## Run 2
```md
Execute TASK-001, TASK-002, and TASK-003 only. Scaffold the frontend, define shared domain types, and create mock services/data. Do not implement product screens yet.
```

## Run 3
```md
Execute TASK-010, TASK-011, TASK-012, TASK-013, and TASK-014 only. Build route skeletons, layouts, sidebar, mobile nav, route guards, and feature flags.
```

## Run 4
```md
Execute TASK-020, TASK-021, TASK-022, and TASK-023 only. Build login, client picker, invite activation, session-expired, and logout behavior.
```

## Run 5
```md
Execute TASK-030, TASK-031, TASK-032, and TASK-033 only. Build Admin dashboard, client management, user management, and Admin client switcher.
```

After these five runs, continue one stage at a time.

---

# 8. Stop Conditions

The agent must stop and ask for review when:

1. A task is completed.
2. A file conflict appears between source documents.
3. A required route/menu/status is missing from the spec.
4. A P1/P2 feature is needed to complete a P0 feature.
5. A security/tenant/role behavior is ambiguous.
6. A large refactor would be required.
7. Tests or build checks fail and the issue is not obvious.

---

# 9. Do-Not-Build List Until Explicitly Approved

Do not build these during P0 unless explicitly instructed:

- Full CSV Import Center
- Calendar and recurring scheduling
- Advanced analytics dashboards
- Real report rendering
- Real notification provider integration
- Real media upload provider integration
- Real backend database integration
- Client portal
- Multi-inspector single-inspection collaboration
- Any role beyond Contractor, Reviewer, Admin
- Any public/external user login

---

# 10. Final Note to Agent

Your goal is not to finish StructApp in one response.  
Your goal is to complete one small, reviewable, working increment at a time.

When in doubt:
- preserve security
- preserve auditability
- preserve offline user work
- keep menus exactly as specified
- stop and report rather than inventing
