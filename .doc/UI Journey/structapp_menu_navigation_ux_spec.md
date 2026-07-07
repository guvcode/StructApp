# StructApp — Menu & Navigation UX Specification

## Purpose
This document extends the screen/navigation design with **menu architecture**, **sidebar/bottom-nav structure**, **submenu trees**, **contextual action menus**, **feature visibility rules**, and a **route map**. It is intended to stop AI agents or frontend engineers from inventing their own information architecture.

## Relationship to other docs
- `structapp_prioritized_mvp_backlog.md` = source of build scope and acceptance criteria
- `structapp_screen_navigation_design.md` = screen inventory, layouts, states, and UI behavior
- **This file** = exact menu/navigation structure and visibility rules

## Scope
This spec defines:
1. Desktop sidebar menu trees for Reviewer and Admin
2. Mobile PWA bottom navigation and nested flows for Contractor
3. Page-level command bars and row-action menus
4. Visibility rules by role, workflow state, and MVP phase
5. Canonical route map
6. Naming conventions for menus and commands

---

# 1. Navigation Design Principles

| Principle | Meaning for StructApp |
|---|---|
| Role-first menus | Each role only sees the sections they need. Hidden items are still enforced server-side. |
| Stable global navigation | Top-level menu items should not move around between sessions or tenants. |
| Workflow over entity sprawl | Menus should group work by task (Inspections, Remediation, Reports) rather than exposing too many raw tables. |
| Register as a managed hierarchy | Projects, Sites, and Structures are managed together under one “Register” area rather than as separate top-level apps. |
| Actions near records | Approval, return, reopen, verify closure, and override should be available contextually from record detail or row menus—not as standalone menu items. |
| Mobile must be shallow | Contractor navigation should be minimal and task-oriented, with no more than 4 primary bottom-nav items in MVP. |
| Feature flags must not leak unfinished areas | P2 items such as Calendar or Imports should not appear unless enabled. |
| Active tenant must always be visible | Admin and Reviewer desktop shells should clearly display current client context. |

---

# 2. Canonical Navigation Model by Role

## 2.1 Contractor (Mobile PWA)

### Primary bottom navigation
| Position | Menu label | Route | Purpose | MVP phase |
|---:|---|---|---|---|
| 1 | Dashboard | `/m/dashboard` | Assigned work, returned work, quick actions, summary | P0 |
| 2 | Sync | `/m/sync` | Pull package, push outbox, resolve sync issues | P0 |
| 3 | Timesheets | `/m/timesheets` | Draft and submit daily labor | P1 |
| 4 | Settings | `/m/settings` | Session, app version, storage, diagnostics, logout | P0 |

### Contractor navigation rules
| Rule | Behavior |
|---|---|
| Dashboard is the home route | After login, Contractor lands on `/m/dashboard` |
| Sync is always visible | Because offline workflow is core to the product |
| Timesheets may be feature-flagged in early P0 builds | If hidden, Dashboard can still show a quick link placeholder or no entry at all |
| No direct top-level “Inspections” tab | Assigned inspections are accessed from Dashboard cards/lists |
| No direct top-level “Remediation” tab in MVP | Remediation is accessed from deficiency or assigned-work context if enabled later |

---

## 2.2 Reviewer (Desktop)

### Sidebar menu tree
| Order | Menu label | Route | Type | MVP phase |
|---:|---|---|---|---|
| 1 | Dashboard | `/reviewer/dashboard` | Top-level | P0 |
| 2 | Inspections | `/inspections` | Top-level section | P0 |
| 3 | Remediation | `/remediation` | Top-level section | P1 |
| 4 | Timesheets | `/timesheets/review` | Top-level section | P1 |
| 5 | Register | `/register` | Top-level section | P0 |
| 6 | Reports | `/reports` | Top-level section | P1 |
| 7 | Picklists | `/picklists` | Top-level section | P1 |
| 8 | Calendar | `/calendar` | Top-level section | P2 |

### Reviewer submenu tree
#### Inspections
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| All Inspections | `/inspections` | Full inspection list with filters | P0 |
| Submitted | `/inspections?status=Submitted` | Review queue | P0 |
| Returned | `/inspections?status=Returned` | Returned work tracking | P0 |
| Approved | `/inspections?status=Approved` | Finalized records | P0 |

#### Remediation
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Open | `/remediation?status=Open` | Unresolved deficiencies | P1 |
| Pending Verification | `/remediation?status=Remediated_Pending_Verification` | Closure review queue | P1 |
| Verified Closed | `/remediation?status=Verified_Closed` | Closed remediation history | P1 |

#### Timesheets
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Pending Review | `/timesheets/review?status=Submitted` | Review queue | P1 |
| History | `/timesheets/review` | All visible timesheets | P1 |

#### Register
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Projects | `/register/projects` | Project list | P0 |
| Sites | `/register/sites` | Site list/filtering | P0 |
| Structures | `/register/structures` | Structure list/search | P0 |

#### Reports
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Generate | `/reports` | Start new report job | P1 |
| Jobs | `/reports/jobs` | Monitor queued/processing/ready/failed jobs | P1 |

#### Picklists
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Component Types | `/picklists/component-types` | Manage inspection component list | P1 |
| Work Types | `/picklists/work-types` | Manage timesheet work types | P1 |

#### Calendar
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Schedule Board | `/calendar` | Work calendar | P2 |
| Recurring Schedules | `/calendar/schedules` | Schedule rules | P2 |

---

## 2.3 Admin (Desktop)

### Sidebar menu tree
| Order | Menu label | Route | Type | MVP phase |
|---:|---|---|---|---|
| 1 | Dashboard | `/admin/dashboard` | Top-level | P0 |
| 2 | Clients | `/admin/clients` | Top-level | P0 |
| 3 | Users | `/admin/users` | Top-level | P0 |
| 4 | Imports | `/admin/imports` | Top-level | P2 |
| 5 | Register | `/register` | Top-level | P0 |
| 6 | Inspections | `/inspections` | Top-level | P0 |
| 7 | Remediation | `/remediation` | Top-level | P1 |
| 8 | Timesheets | `/timesheets/review` | Top-level | P1 |
| 9 | Reports | `/reports` | Top-level | P1 |
| 10 | Picklists | `/picklists` | Top-level | P1 |
| 11 | Audit Logs | `/admin/audit-logs` | Top-level | P1 |
| 12 | Calendar | `/calendar` | Top-level | P2 |

### Admin submenu tree
#### Clients
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| All Clients | `/admin/clients` | Client list | P0 |
| New Client | `/admin/clients/new` | Create client | P0 |

#### Users
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| All Users | `/admin/users` | User list | P0 |
| Invite User | `/admin/users/invite` | Invitation flow | P0 |

#### Imports
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Upload Batch | `/admin/imports` | Upload and validate CSV | P2 |
| Batch History | `/admin/imports/history` | Review committed/discarded batches | P2 |

#### Register
Use same submenu tree as Reviewer.

#### Inspections
Use same submenu tree as Reviewer.

#### Remediation
Use same submenu tree as Reviewer.

#### Timesheets
Use same submenu tree as Reviewer.

#### Reports
Use same submenu tree as Reviewer.

#### Picklists
Use same submenu tree as Reviewer.

#### Audit Logs
| Submenu | Route | Purpose | Phase |
|---|---|---|---|
| Audit History | `/admin/audit-logs` | Filterable governance history | P1 |

#### Calendar
Use same submenu tree as Reviewer.

---

# 3. Menu Visibility Rules

## 3.1 Visibility by role

| Menu item | Contractor | Reviewer | Admin |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| Sync | ✓ | — | — |
| Inspections | Dashboard-linked only | ✓ | ✓ |
| Remediation | Contextual only / later | ✓ | ✓ |
| Timesheets | ✓ own | ✓ review | ✓ review |
| Register | — | ✓ | ✓ |
| Reports | — | ✓ | ✓ |
| Picklists | — | ✓ | ✓ |
| Clients | — | — | ✓ |
| Users | — | — | ✓ |
| Imports | — | — | ✓ |
| Audit Logs | — | — | ✓ |
| Calendar | — | ✓ | ✓ |

## 3.2 Visibility by MVP phase

| Menu item | P0 | P1 | P2 |
|---|:---:|:---:|:---:|
| Contractor Dashboard | ✓ | ✓ | ✓ |
| Contractor Sync | ✓ | ✓ | ✓ |
| Contractor Timesheets | Optional / feature flag | ✓ | ✓ |
| Reviewer/Admin Inspections | ✓ | ✓ | ✓ |
| Register | ✓ | ✓ | ✓ |
| Remediation | — or hidden until enabled | ✓ | ✓ |
| Reports | — or hidden until enabled | ✓ | ✓ |
| Picklists | — or hidden until enabled | ✓ | ✓ |
| Audit Logs | — or hidden until enabled | ✓ | ✓ |
| Imports | — | — | ✓ |
| Calendar | — | — | ✓ |

## 3.3 Visibility by record/workflow state

| Location | Visible action | Condition |
|---|---|---|
| Inspection row / detail | Return | Status = Submitted AND role in {Reviewer, Admin} |
| Inspection row / detail | Approve | Status = Submitted AND role in {Reviewer, Admin} |
| Inspection row / detail | Reopen | Status = Approved AND role = Admin |
| Inspection row / detail | Submit | Status in {Assigned, In Progress, Returned} AND role = Contractor |
| Inspection row / detail | Edit deficiency | Parent inspection not Approved and user has allowed workflow access |
| Deficiency detail | Override priority | Role in {Reviewer, Admin} AND inspection in reviewable state |
| Deficiency detail | Verify closure | Remediation status = Remediated_Pending_Verification AND role in {Reviewer, Admin} AND remediation evidence exists |
| Timesheet row | Submit | Owner Contractor and status = Draft |
| Timesheet row | Approve/Reject | Role in {Reviewer, Admin} and status = Submitted |
| Import batch row | Commit | Role = Admin and batch status = Validated |
| Import batch row | Discard | Role = Admin and batch status in {Pending, Validated} |

## 3.4 Visibility by connectivity state (mobile)

| Control | Online | Offline with cached data | Offline without cached data |
|---|---|---|---|
| Open assigned inspection | ✓ | ✓ | — |
| Pull package | ✓ | — | — |
| Push outbox | ✓ | Queue visible only | — |
| Submit to server | ✓ | — unless explicitly stored as deferred intent | — |
| Search downloaded structures | ✓ | ✓ | — |
| QR scan | ✓ | Optional if local search package supports match | — if camera/search flow depends on absent data |

---

# 4. Desktop Sidebar Behavior

## 4.1 Expanded vs collapsed
| State | Behavior |
|---|---|
| Expanded | Show icon + label + submenu chevrons |
| Collapsed | Show icons only; hover/flyout reveals label and submenu |
| Mobile/responsive desktop | Sidebar collapses to overlay drawer on narrow widths |

## 4.2 Submenu expansion rules
| Rule | Behavior |
|---|---|
| Only one top-level section expanded by default | Prevents excessive vertical sprawl |
| Current route auto-expands its parent section | User sees current context |
| User may manually expand another section | Expansion persists for session if feasible |
| Hidden phase-flagged sections do not leave empty gaps | Menu reflows cleanly |

## 4.3 Highlighting rules
| Situation | Highlight behavior |
|---|---|
| Exact top-level route | Highlight menu item |
| Nested route | Highlight parent and active submenu |
| Modal-only actions (return, approve, reopen) | Do not appear as nav items; triggered contextually |

---

# 5. Contractor Mobile Navigation UX

## 5.1 Dashboard internal navigation sections
The Contractor does not get a top-level “Inspections” tab. Dashboard acts as the task hub.

### Dashboard sections
| Section | Content | Action |
|---|---|---|
| Assigned Inspections | Assigned/In Progress/Returned items | Open inspection |
| Returned to You | Returned items with reason badge | Open inspection |
| Pending Sync | Count and status summary | Open Sync Hub |
| Quick Actions | Scan QR, Start Timesheet, Sync Now | Deep-link to target flow |
| Last Sync | Timestamp and result | Open Sync Hub |

## 5.2 Inspection flow navigation
| Step | Route pattern | Entry point |
|---|---|---|
| Open assigned inspection | `/m/inspections/:id` | Dashboard card/list |
| Add deficiency | `/m/inspections/:id/deficiencies/new` | Inspection detail |
| Edit deficiency draft | `/m/deficiencies/:localId` | Inspection deficiency list |
| Manage photos | `/m/deficiencies/:localId/photos` | Deficiency form |
| Submit review | `/m/inspections/:id/submit` | Inspection detail |

## 5.3 Mobile header behavior
| Screen | Header title | Left action | Right action |
|---|---|---|---|
| Dashboard | Dashboard | none | optional sync icon |
| Sync | Sync Hub | back or none if tab root | retry icon if errors |
| Inspection Detail | Asset tag / inspection | back | overflow actions if any |
| Deficiency Form | New Deficiency / Edit Deficiency | back | save status indicator |
| Timesheets | Timesheets | none if tab root | add/new draft if appropriate |
| Settings | Settings | none if tab root | none |

---

# 6. Contextual Action Menus and Command Bars

## 6.1 Inspection list row actions (desktop)

| Role | Status | Row actions |
|---|---|---|
| Reviewer/Admin | Submitted | Open, Return, Approve |
| Reviewer/Admin | Returned | Open |
| Reviewer/Admin | Approved | Open |
| Admin | Approved | Open, Reopen |
| Contractor (mobile list) | Assigned/In Progress/Returned | Open |
| Contractor | Submitted/Approved | View only |

## 6.2 Inspection detail command bar

| Role | Status | Primary actions | Secondary actions |
|---|---|---|---|
| Contractor | Assigned/In Progress | Add Deficiency, Submit Inspection | View History |
| Contractor | Returned | Add/Edit Deficiency, Resubmit | View Return Reason |
| Reviewer | Submitted | Approve, Return | Open deficiency override panel |
| Admin | Submitted | Approve, Return | same as Reviewer |
| Admin | Approved | Reopen | View audit metadata |
| Reviewer | Approved | none destructive | Read-only |

## 6.3 Deficiency row / detail actions

| Role | Condition | Actions |
|---|---|---|
| Contractor | Draft/local | Edit, Manage Photos, Delete unsynced draft |
| Contractor | Synced/open | View, Update Remediation if allowed |
| Reviewer/Admin | Review state | View, Override Priority |
| Reviewer/Admin | Pending verification + evidence exists | Verify Closure |
| Reviewer/Admin | No evidence | View only; verify disabled with explanation |

## 6.4 Timesheet row actions

| Role | Status | Actions |
|---|---|---|
| Contractor owner | Draft | Edit, Submit, Delete draft |
| Contractor owner | Submitted | View only |
| Reviewer/Admin | Submitted | Approve, Reject |
| Reviewer/Admin | Approved/Rejected | View only |

## 6.5 Import batch row actions

| Role | Status | Actions |
|---|---|---|
| Admin | Pending/Validated | Open, Commit if valid, Discard |
| Admin | Committed/Discarded | View only |

---

# 7. Route Map

## 7.1 Shared auth routes
| Route | Screen | Roles |
|---|---|---|
| `/login` | Login | All |
| `/activate` | Invite activation | Invited users |
| `/select-client` | Client picker | Multi-client user |
| `/session-expired` | Session recovery / re-login | All |

## 7.2 Contractor routes
| Route | Screen | Phase |
|---|---|---|
| `/m/dashboard` | Inspector Dashboard | P0 |
| `/m/sync` | Sync Hub | P0 |
| `/m/inspections/:id` | Inspection Detail | P0 |
| `/m/inspections/:id/submit` | Submit Review | P0 |
| `/m/inspections/:id/history` | History / triage helper screen if separated | P0 |
| `/m/structures/search` | Structure Search / QR | P0/P1 |
| `/m/deficiencies/:localId` | Deficiency edit/detail | P0 |
| `/m/deficiencies/:localId/photos` | Photo manager | P0 |
| `/m/deficiencies/:id/remediation` | Remediation update | P1 |
| `/m/timesheets` | Timesheet list/draft | P1 |
| `/m/timesheets/:id` | Timesheet detail/edit | P1 |
| `/m/settings` | Settings | P0 |

## 7.3 Reviewer/Admin shared operational routes
| Route | Screen | Roles | Phase |
|---|---|---|---|
| `/inspections` | Inspection list/queue | Reviewer/Admin | P0 |
| `/inspections/:id/review` | Inspection review workspace | Reviewer/Admin | P0 |
| `/deficiencies/:id` | Deficiency detail | Reviewer/Admin | P0 |
| `/remediation` | Remediation queue | Reviewer/Admin | P1 |
| `/timesheets/review` | Timesheet review queue | Reviewer/Admin | P1 |
| `/register` | Register landing | Reviewer/Admin | P0 |
| `/register/projects` | Project list | Reviewer/Admin | P0 |
| `/register/sites` | Site list | Reviewer/Admin | P0 |
| `/register/structures` | Structure list | Reviewer/Admin | P0 |
| `/reports` | Report center / generate | Reviewer/Admin | P1 |
| `/reports/jobs` | Report job list | Reviewer/Admin | P1 |
| `/picklists` | Picklist landing | Reviewer/Admin | P1 |
| `/picklists/component-types` | Component type manager | Reviewer/Admin | P1 |
| `/picklists/work-types` | Work type manager | Reviewer/Admin | P1 |
| `/calendar` | Calendar board | Reviewer/Admin | P2 |
| `/calendar/schedules` | Recurring schedules | Reviewer/Admin | P2 |

## 7.4 Admin-only routes
| Route | Screen | Phase |
|---|---|---|
| `/admin/dashboard` | Admin dashboard | P0 |
| `/admin/clients` | Client list | P0 |
| `/admin/clients/new` | New client | P0 |
| `/admin/users` | User list | P0 |
| `/admin/users/invite` | Invite user | P0 |
| `/admin/imports` | Import center | P2 |
| `/admin/imports/history` | Import batch history | P2 |
| `/admin/audit-logs` | Audit log viewer | P1 |

---

# 8. Naming Conventions

## 8.1 Canonical menu labels
Use these labels consistently in UI and documentation.

| Concept | Preferred label | Avoid |
|---|---|---|
| Asset hierarchy management | Register | Asset Admin, Asset Tables |
| Field work review queue | Inspections | Review Queue as top-level menu |
| Remediation work | Remediation | Corrective Actions unless business chooses that term globally |
| Offline data/sync screen | Sync | Offline Work Center, Sync Manager |
| Work-hour logging | Timesheets | Labor Log unless business renames globally |
| Controlled engineering lists | Picklists | Reference Data if only these two lists are managed |
| Client organization management | Clients | Tenants in user-facing UI unless business explicitly prefers “Tenant” |

## 8.2 Action label standards
| Action | Use | Avoid |
|---|---|---|
| Submit Inspection | Contractor sends work for review | Complete Inspection if it does not actually submit |
| Return Inspection | Reviewer/Admin sends back for correction | Reject Inspection unless semantics truly mean rejection |
| Approve Inspection | Finalize review | Sign Off if legal meaning differs |
| Reopen Inspection | Admin unlocks approved record | Edit Approved Inspection |
| Verify Closure | Reviewer/Admin confirms remediation | Close Deficiency if evidence verification is required |
| Pull Package | Download assignments/reference data | Refresh if it is more than a lightweight sync |
| Push Sync | Upload local work | Save if it actually transmits to server |

---

# 9. Feature-Flag and Release Guardrails

| Feature/section | If disabled, UI behavior |
|---|---|
| Timesheets | Hide tab/menu item entirely rather than showing dead-end screen |
| Remediation | Hide top-level menu; deficiency detail may show read-only status if data exists |
| Reports | Hide menu and buttons that generate reports |
| Picklists | Hide menu; hardcoded or seeded lists still usable if feature not exposed |
| Imports | Hide Admin menu and routes |
| Calendar | Hide menu and scheduling actions |
| Audit Logs | Hide Admin menu if governance feature not yet shipped, but backend audit may still run |

---

# 10. AI Agent Guardrails for Navigation Implementation

1. **Use this file as the canonical menu tree.** Do not invent additional top-level menu items.
2. **Do not create separate top-level pages for contextual actions** like Approve, Return, Reopen, Verify Closure, or Override Priority. These belong in row actions, command bars, drawers, or modals.
3. **Keep Contractor mobile navigation at four tabs or fewer** in MVP.
4. **Hide P1/P2 sections unless explicitly enabled.** Do not show placeholder dead links.
5. **Preserve route stability.** Do not rename routes or menu labels without updating the design docs.
6. **Use Register as the single hierarchy-management area** rather than splitting Projects, Sites, and Structures into unrelated top-level apps.
7. **Always display active client context** in Reviewer/Admin desktop shells and Contractor settings/dashboard header.
8. **Never rely on hidden menu items for security.** Role and tenant checks must still be enforced in the backend and route guards.
