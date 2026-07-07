# StructApp — JavaScript Mastery Skills-Aligned Build Plan

## Purpose

This build plan replaces the generic atomic build plan with a workflow that fits the current **JavaScript Mastery Skills** approach.

It is designed for agents that support the `SKILL.md` format and slash-command workflow, including tools such as Claude Code, Cursor, Windsurf, Codex, and Cline.

The JavaScript Mastery Skills workflow is based on:

- `/architect` before building
- Build only after the plan is approved
- `/review` after building a feature
- `/imprint` after building UI components
- `/remember save` at the end of a session
- `/remember restore` at the start of a session
- `/recover` when something goes wrong

This document adapts the StructApp build into that loop.

---

# 1. Required Input Documents

Give the agent this file plus the four supporting StructApp files.

| File | Role in the build |
|---|---|
| `structapp_jsm_skills_build_plan.md` | Main execution plan. Start here. |
| `structapp_prioritized_mvp_backlog.md` | Primary source of truth for epics, priorities, user stories, and acceptance criteria. |
| `structapp_screen_navigation_design.md` | Source of truth for screen layouts, forms, UI states, and screen-level behavior. |
| `structapp_menu_navigation_ux_spec.md` | Source of truth for routes, sidebars, bottom navigation, menus, feature visibility, and contextual actions. |
| `structapp_module_personas_user_journeys.md` | Product context for personas, modules, workflows, and edge cases. |

---

# 2. Document Authority Order

If documents conflict, follow this order:

1. `structapp_prioritized_mvp_backlog.md`
2. `structapp_menu_navigation_ux_spec.md`
3. `structapp_screen_navigation_design.md`
4. `structapp_module_personas_user_journeys.md`

## Interpretation rule

| Question | Use this file |
|---|---|
| What should be built? | `structapp_prioritized_mvp_backlog.md` |
| What should the menu/route be? | `structapp_menu_navigation_ux_spec.md` |
| What should the screen look like and how should it behave? | `structapp_screen_navigation_design.md` |
| Why does this workflow exist? | `structapp_module_personas_user_journeys.md` |

---

# 3. JavaScript Mastery Skills Session Protocol

## 3.1 Start of every session

The agent must begin every new session with:

```md
/remember restore
```

Then the agent must:

1. Confirm what it restored from `memory.md`.
2. Read this build plan.
3. Identify the current bundle/task.
4. Run `/architect` for the current bundle or task.
5. Stop for approval before coding.

## 3.2 Before coding any bundle or task

Use:

```md
/architect
```

The architect output must include:

| Section | Required content |
|---|---|
| Goal | What this bundle/task will accomplish |
| Source docs used | Which StructApp docs were read |
| In scope | Exact screens, routes, components, services, and states |
| Out of scope | Explicitly excluded future/P1/P2 work |
| Component plan | Components and file locations |
| Route plan | Routes and layouts affected |
| Data plan | Mock services, state, types, and API adapters |
| Validation plan | Form rules and workflow guards |
| UI state plan | Loading, empty, error, offline, forbidden states |
| Risks/ambiguities | Any unclear decisions |
| Implementation order | Step-by-step coding order |
| Stop point | What will be reviewed before proceeding |

The agent must not code until the architect plan is approved.

## 3.3 After building a feature or bundle

Use:

```md
/review
```

The review must verify three layers:

| Review layer | Meaning for StructApp |
|---|---|
| Plan alignment | Did the agent build only what was approved in `/architect`? |
| System integrity | Did the implementation preserve roles, routes, menus, tenant context, state transitions, and offline rules? |
| Production readiness | Are validation, accessibility, empty/loading/error states, and maintainability acceptable? |

## 3.4 After building UI components

Use:

```md
/imprint
```

Use `/imprint` after each meaningful UI component or screen cluster so future UI matches the emerging design system.

Use:

```md
/imprint audit
```

after a major bundle to detect inconsistent visual patterns.

The output should update or create:

```md
ui-registry.md
```

## 3.5 End of every session

Use:

```md
/remember save
```

The memory entry should capture:

- current bundle/task
- what was completed
- files created
- files changed
- routes added
- components added
- tests/checks run
- open issues
- next recommended task
- any decisions made

## 3.6 When something goes wrong

Use:

```md
/recover
```

Use `/recover` when:

- the agent has patched the same bug repeatedly
- route/menu structure becomes inconsistent
- role guards are broken
- generated code drifts from the plan
- tests/build are failing and the fix is unclear
- the task needs a hard reset or rethink

The recovery output must classify the issue as:

| Recovery type | Meaning |
|---|---|
| Targeted fix | Isolated problem with a clear root cause |
| Hard reset | Session or file edits became polluted |
| Rethink | The implementation approach is wrong |

---

# 4. Core Agent Guardrails

## 4.1 Do not invent

The agent must not invent:

- roles
- menus
- routes
- workflows
- statuses
- entities
- permissions
- P1/P2 functionality during P0 work
- client portal
- public/external login
- multi-inspector single-inspection workflow

## 4.2 Build order

The agent must build in this order:

1. P0 foundations
2. P0 auth and shells
3. P0 admin setup
4. P0 register
5. P0 contractor mobile field flow
6. P0 reviewer approval flow
7. P0 admin reopen/governance
8. P1 modules
9. P2 modules

## 4.3 Feature flags

| Phase | Behavior |
|---|---|
| P0 | Build fully |
| P1 | Hide or stub unless explicitly assigned |
| P2 | Do not render unless explicitly assigned |

## 4.4 Security and safety rules

- Hidden menu items are not security.
- Route guards are required.
- Backend/API authorization must still enforce roles.
- Cross-tenant record access must fail safely.
- Contractor offline data must never be destroyed by auth/session failure.
- Approved records must be read-only unless Admin reopens them.
- Reopen requires Admin role, target status, reason, actor, and timestamp.
- Override requires Reviewer/Admin role and justification.

---

# 5. Bundle-Based Build Model

Instead of asking the agent to do every micro-task one by one, use **bundles**. Each bundle is small enough to review but large enough for `/architect` to reason about coherently.

Each bundle has:

1. `/remember restore`
2. `/architect Bundle X`
3. Human approval
4. Build tasks inside the bundle
5. `/imprint` after UI component clusters
6. `/review Bundle X`
7. `/remember save`
8. Stop

---

# 6. Bundle 0 — Orientation and Source Alignment

## Goal

Ensure the agent understands the documentation pack before writing any code.

## Source documents

- All five files:
  - this build plan
  - backlog
  - screen/navigation design
  - menu/navigation UX spec
  - personas/journeys

## Tasks

| Task ID | Task | Output |
|---|---|---|
| B0-T01 | Restore memory | Existing project context summary |
| B0-T02 | Read all source docs | Source summary |
| B0-T03 | Confirm authority order | Conflict-resolution rule |
| B0-T04 | Identify P0/P1/P2 boundaries | Scope-control summary |
| B0-T05 | Produce first implementation roadmap | Ordered bundle list |

## Architect prompt

```md
/remember restore

Read:
- structapp_jsm_skills_build_plan.md
- structapp_prioritized_mvp_backlog.md
- structapp_menu_navigation_ux_spec.md
- structapp_screen_navigation_design.md
- structapp_module_personas_user_journeys.md

Do not code.

Summarize:
1. document authority order
2. P0 scope
3. P1/P2 items to hide or defer
4. role-based navigation
5. first 10 implementation risks
6. recommended first coding bundle

Stop for confirmation.
```

## Review gate

No code should exist after this bundle.

---

# 7. Bundle 1 — Project Foundation, Types, Mock Data

## Goal

Create the frontend foundation that later screens can use safely.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - EP-01
  - EP-02
  - EP-03
  - EP-04
  - NFR section
- `structapp_menu_navigation_ux_spec.md`
  - route map
  - role visibility
- `structapp_module_personas_user_journeys.md`
  - personas and permission matrix

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B1-T01 | Scaffold project folders | `/src/components`, `/src/layouts`, `/src/services`, `/src/types`, `/src/data/mock`, `/src/lib` |
| B1-T02 | Define domain types | Roles, statuses, entities, menu types, feature flags |
| B1-T03 | Add feature flag config | P0/P1/P2 feature visibility |
| B1-T04 | Add mock data | Users, clients, projects, sites, structures, inspections, deficiencies |
| B1-T05 | Add mock services | Auth, client, user, register, inspection, deficiency, sync |
| B1-T06 | Add basic utility functions | Role checks, status checks, priority helpers |
| B1-T07 | Add placeholder app entry | App runs with placeholder page |

## Required types

- `UserRole`
- `Client`
- `User`
- `ClientMembership`
- `Project`
- `Site`
- `StructureAsset`
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

## Architect prompt

```md
/architect

Architect Bundle 1: Project Foundation, Types, Mock Data.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Do not build screens yet.

Produce:
- file/folder plan
- type model plan
- mock data plan
- mock service plan
- feature flag plan
- validation/guard helper plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 1 exactly as approved in the architect plan.

Do not build product screens.
Do not build auth forms yet.
Use mock services only.
Keep files small and typed.
```

## Review prompt

```md
/review

Review Bundle 1 for:
- plan alignment
- no invented roles/statuses
- type safety
- clean mock service boundaries
- feature flag readiness
- readiness for routing/shell work
```

## Imprint requirement

No `/imprint` required unless visible UI components were created.

## Remember prompt

```md
/remember save

Save:
- foundation files created
- domain types created
- mock services created
- known gaps
- next bundle: Bundle 2 routing and shells
```

---

# 8. Bundle 2 — Routing, Layout Shells, Menus, Guards

## Goal

Implement the application shell and canonical navigation structure before product screens are built.

## Primary references

- `structapp_menu_navigation_ux_spec.md`
- `structapp_screen_navigation_design.md`
- `structapp_prioritized_mvp_backlog.md` EP-02

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B2-T01 | Add route skeleton | All P0 routes render placeholders |
| B2-T02 | Build AuthLayout | Used by login/activation/client picker |
| B2-T03 | Build MobileShell | Used by `/m/*` routes |
| B2-T04 | Build DesktopShell | Used by Reviewer/Admin routes |
| B2-T05 | Build DesktopSidebar | Role-aware Reviewer/Admin menus |
| B2-T06 | Build MobileBottomNav | Contractor mobile navigation |
| B2-T07 | Build TenantContextBadge | Active client display |
| B2-T08 | Build RouteGuard | Role and auth protection |
| B2-T09 | Build FeatureFlagGuard | Hide P1/P2 features |
| B2-T10 | Add Forbidden and Not Found screens | Safe denied/missing states |

## Required P0 route skeletons

### Shared
- `/login`
- `/activate`
- `/select-client`
- `/session-expired`

### Contractor mobile
- `/m/dashboard`
- `/m/sync`
- `/m/inspections/:id`
- `/m/inspections/:id/submit`
- `/m/structures/search`
- `/m/deficiencies/:localId`
- `/m/deficiencies/:localId/photos`
- `/m/settings`

### Reviewer/Admin shared
- `/reviewer/dashboard`
- `/inspections`
- `/inspections/:id/review`
- `/deficiencies/:id`
- `/register`
- `/register/projects`
- `/register/sites`
- `/register/structures`

### Admin
- `/admin/dashboard`
- `/admin/clients`
- `/admin/clients/new`
- `/admin/users`
- `/admin/users/invite`

## Architect prompt

```md
/architect

Architect Bundle 2: Routing, Layout Shells, Menus, Guards.

Use:
- structapp_menu_navigation_ux_spec.md
- structapp_screen_navigation_design.md
- structapp_prioritized_mvp_backlog.md

Produce:
- route implementation plan
- layout component plan
- sidebar/bottom-nav plan
- role guard plan
- feature flag plan
- forbidden/not-found behavior
- files to create/modify
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 2 exactly as approved.

Do not implement real page content yet.
All P0 routes should render placeholders inside the correct shell.
Do not expose P1/P2 menu items unless feature flags are enabled.
```

## Review prompt

```md
/review

Review Bundle 2 for:
- exact route map alignment
- correct menu labels
- role-based menu visibility
- feature flag behavior
- forbidden/not-found behavior
- no contextual actions added to sidebar
```

## Imprint prompt

```md
/imprint audit
```

Run after sidebar, mobile nav, and shell components are built.

## Remember prompt

```md
/remember save

Save:
- route structure
- layout components
- menu implementation
- guard behavior
- feature flag state
- next bundle: Bundle 3 authentication screens
```

---

# 9. Bundle 3 — Authentication and Session UX

## Goal

Build the login, client picker, invite activation, session-expired, and logout flows.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - AUTH-01 through AUTH-07
- `structapp_screen_navigation_design.md`
  - AUTH-01, AUTH-02, AUTH-03
- `structapp_menu_navigation_ux_spec.md`
  - shared auth routes

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B3-T01 | Build Login screen | Email/password auth UI |
| B3-T02 | Add mock login behavior | Contractor/Reviewer/Admin login |
| B3-T03 | Build Client Picker | Multi-client selection |
| B3-T04 | Build Invite Activation | Password setup flow |
| B3-T05 | Build Session Expired screen | Re-login flow |
| B3-T06 | Add logout behavior | Clear session with unsynced warning |
| B3-T07 | Add auth error states | Invalid credentials, inactive user, expired invite |

## Architect prompt

```md
/architect

Architect Bundle 3: Authentication and Session UX.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md

Produce:
- auth state plan
- form component plan
- mock auth service interactions
- client picker behavior
- logout and unsynced-warning behavior
- validation and error states
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 3 exactly as approved.

Use mock auth services.
Do not integrate real backend auth.
Do not build unrelated dashboard content.
```

## Review prompt

```md
/review

Review Bundle 3 for:
- AUTH acceptance criteria
- role routing after login
- multi-client picker behavior
- inactive/invalid error handling
- logout and unsynced work warning
- no leaked sensitive information
```

## Imprint prompt

```md
/imprint
```

Run after the auth form pattern is established.

## Remember prompt

```md
/remember save

Save:
- auth screens completed
- auth state behavior
- mock credentials or test users
- unresolved backend integration gaps
- next bundle: Bundle 4 Admin setup
```

---

# 10. Bundle 4 — Admin Setup: Clients, Users, Client Switcher

## Goal

Build the screens needed to establish tenants and users before operational workflows.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - EP-03
- `structapp_screen_navigation_design.md`
  - ADM-01, ADM-02, ADM-03, ADM-04
- `structapp_menu_navigation_ux_spec.md`
  - Admin menu tree

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B4-T01 | Build Admin Dashboard | Governance cards and quick actions |
| B4-T02 | Build Client Management list | Client table |
| B4-T03 | Build New/Edit Client form | Client create/update UI |
| B4-T04 | Build User Management list | User table |
| B4-T05 | Build Invite User form | User invite flow |
| B4-T06 | Build Role/Membership editor | Assign clients and roles |
| B4-T07 | Build Deactivate User flow | Confirmation and mock state change |
| B4-T08 | Build Admin Client Switcher | Active tenant switch in top bar |

## Architect prompt

```md
/architect

Architect Bundle 4: Admin Setup.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md

Produce:
- admin screen plan
- client/user form plan
- membership editor plan
- client switcher plan
- validation plan
- mock service update plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 4 exactly as approved.

Keep Admin-only access enforced through route/menu guards.
Use mock services.
Do not build imports, audit logs, calendar, or P1/P2 modules.
```

## Review prompt

```md
/review

Review Bundle 4 for:
- Admin-only route enforcement
- client create/edit validation
- user invite validation
- role/membership correctness
- deactivation behavior
- active client switch behavior
```

## Imprint prompt

```md
/imprint
```

Run after table, form, and drawer/modal patterns are established.

## Remember prompt

```md
/remember save

Save:
- Admin setup screens completed
- table/form UI patterns
- client switcher behavior
- next bundle: Bundle 5 Register management
```

---

# 11. Bundle 5 — Register Management

## Goal

Build project, site, and structure management under the canonical Register menu.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - EP-04
- `structapp_screen_navigation_design.md`
  - REV-10
- `structapp_menu_navigation_ux_spec.md`
  - Register menu and routes

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B5-T01 | Build Register landing | Hierarchy overview |
| B5-T02 | Build Project list | Table/filter/empty states |
| B5-T03 | Build Project create/edit | Form validation |
| B5-T04 | Build Site list | Table/filter/project context |
| B5-T05 | Build Site create/edit | Form validation |
| B5-T06 | Build Structure list/search | Table/search/pagination |
| B5-T07 | Build Structure create/edit | Asset tag, description, QR |
| B5-T08 | Add Breadcrumbs | Register hierarchy context |

## Architect prompt

```md
/architect

Architect Bundle 5: Register Management.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md

Produce:
- Register route/page plan
- table and form component plan
- project/site/structure hierarchy plan
- validation plan
- mock service update plan
- loading/empty/error state plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 5 exactly as approved.

Use the single Register area.
Do not split Projects, Sites, and Structures into unrelated top-level menus.
Do not give Contractor write access.
```

## Review prompt

```md
/review

Review Bundle 5 for:
- Register hierarchy consistency
- tenant-scoped mock data
- Reviewer/Admin access only
- validation rules
- pagination and search
- no route/menu drift
```

## Imprint prompt

```md
/imprint
```

Run after Register table/form patterns.

## Remember prompt

```md
/remember save

Save:
- Register screens completed
- hierarchy behavior
- mock data changes
- next bundle: Bundle 6 Contractor mobile field workflow
```

---

# 12. Bundle 6 — Contractor Mobile Field Workflow

## Goal

Build the core offline-first Contractor field flow.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - EP-05
  - EP-06
  - EP-07
  - EP-08
- `structapp_screen_navigation_design.md`
  - MOB-01 through MOB-08
- `structapp_menu_navigation_ux_spec.md`
  - Contractor mobile nav and routes
- `structapp_module_personas_user_journeys.md`
  - Contractor journeys

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B6-T01 | Build Contractor Dashboard | Assignments, returned items, pending sync |
| B6-T02 | Build Connectivity Banner | Online/offline/degraded UI |
| B6-T03 | Build Sync Hub | Pull/push/errors/outbox |
| B6-T04 | Build Inspection Detail | Assignment detail and actions |
| B6-T05 | Build Structure Search / QR fallback | Search and QR stub/fallback |
| B6-T06 | Build Historical Deficiency Triage | Triage decisions |
| B6-T07 | Build Deficiency Form | Component, description, risk, GPS |
| B6-T08 | Build Risk Preview | Provisional P1-P5 |
| B6-T09 | Build Photo Evidence Manager | Max five, captions, purpose |
| B6-T10 | Build Submit Review | Findings/no-findings confirmation |
| B6-T11 | Build local sync-state badges | Draft/Pending/Synced/Error |
| B6-T12 | Add conflict/auth-expired sync states | Safe recovery UI |

## Architect prompt

```md
/architect

Architect Bundle 6: Contractor Mobile Field Workflow.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Produce:
- mobile route flow
- component tree
- local state and mock sync model
- offline behavior plan
- validation plan
- risk preview plan
- photo manager plan
- submit workflow plan
- error/conflict recovery plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 6 exactly as approved.

Keep Contractor mobile navigation shallow.
Do not build Reviewer/Admin review screens.
Do not implement real IndexedDB unless explicitly approved; mock/local state is acceptable for UI build.
Do not destroy unsynced data on auth/session failure.
```

## Review prompt

```md
/review

Review Bundle 6 for:
- Contractor route/menu correctness
- offline states
- local save/sync-state visibility
- deficiency validation
- triage behavior
- photo limit and captions
- submit/no-deficiencies rules
- safe auth-expired and conflict handling
```

## Imprint prompt

```md
/imprint audit
```

Run after mobile dashboard, forms, badges, and photo manager are built.

## Remember prompt

```md
/remember save

Save:
- Contractor mobile screens completed
- offline/sync behavior
- local state assumptions
- known backend/Dexie integration gaps
- next bundle: Bundle 7 Reviewer inspection workflow
```

---

# 13. Bundle 7 — Reviewer Inspection Workflow

## Goal

Build the desktop review workflow for submitted inspections.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - EP-08
  - EP-09
- `structapp_screen_navigation_design.md`
  - REV-01 through REV-06
- `structapp_menu_navigation_ux_spec.md`
  - Inspection menu and contextual actions

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B7-T01 | Build Reviewer Dashboard | Work queue cards |
| B7-T02 | Build Inspection Queue | Filters, table, row actions |
| B7-T03 | Build Inspection Review Workspace | Split evidence/data view |
| B7-T04 | Build Deficiency Detail panel | Risk, photos, metadata |
| B7-T05 | Build Priority Override panel | Justification required |
| B7-T06 | Build Return Inspection modal | Reason required |
| B7-T07 | Build Approve Inspection modal | Locking warning |
| B7-T08 | Enforce approved read-only state | Hide/disable edits |

## Architect prompt

```md
/architect

Architect Bundle 7: Reviewer Inspection Workflow.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md
- structapp_module_personas_user_journeys.md

Produce:
- reviewer route/page plan
- inspection queue plan
- review workspace layout
- row action/state rules
- override/return/approve modal plan
- approved-read-only plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 7 exactly as approved.

Do not implement Admin reopen yet unless it is only hidden placeholder logic.
Do not build Remediation, Reports, Timesheets, Calendar, or Imports.
```

## Review prompt

```md
/review

Review Bundle 7 for:
- Reviewer menu/route correctness
- Submitted queue behavior
- row action visibility by status
- override justification required
- return reason required
- approval locking behavior
- Approved inspection read-only behavior
```

## Imprint prompt

```md
/imprint audit
```

Run after review workspace and modals.

## Remember prompt

```md
/remember save

Save:
- Reviewer workflow completed
- action state rules
- approved locking behavior
- next bundle: Bundle 8 Admin reopen/governance
```

---

# 14. Bundle 8 — Admin Reopen and Governance Controls

## Goal

Add Admin-only controlled exception behavior and safe forbidden/not-found/governance handling.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - INS-06
  - SEC-05
  - AUD-03
- `structapp_screen_navigation_design.md`
  - ADM-07
- `structapp_menu_navigation_ux_spec.md`
  - Admin route/action visibility rules

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B8-T01 | Build Admin Reopen modal | Target status and reason |
| B8-T02 | Add Admin-only action visibility | Reopen only for Admin on Approved |
| B8-T03 | Add mock reopen state transition | Approved → Submitted/Returned |
| B8-T04 | Add audit metadata display | Actor/time/reason |
| B8-T05 | Strengthen Forbidden/Not Found states | Safe route failures |
| B8-T06 | Add governed action metadata panels | Approval/override/reopen provenance |

## Architect prompt

```md
/architect

Architect Bundle 8: Admin Reopen and Governance Controls.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md

Produce:
- Admin reopen plan
- role visibility plan
- mock state transition plan
- audit metadata plan
- forbidden/not-found hardening plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 8 exactly as approved.

Do not expose reopen to Reviewer.
Do not make Approved records generally editable.
Only Admin reopen can create the controlled correction path.
```

## Review prompt

```md
/review

Review Bundle 8 for:
- Admin-only reopen
- Approved-only condition
- required reason
- allowed target status only
- audit metadata
- Reviewer forbidden behavior
- no broad edit loophole
```

## Imprint prompt

```md
/imprint
```

Run after governance modal/panel patterns.

## Remember prompt

```md
/remember save

Save:
- Admin reopen behavior
- governance UI patterns
- remaining MVP gates
- next bundle: Bundle 9 P0 hardening
```

---

# 15. Bundle 9 — P0 Hardening and MVP Gate

## Goal

Complete the P0 UI quality pass before starting P1 modules.

## Primary references

- `structapp_prioritized_mvp_backlog.md`
  - MVP Acceptance Gate
  - NFR section
- `structapp_screen_navigation_design.md`
  - empty/loading/error/offline states
- `structapp_menu_navigation_ux_spec.md`
  - route/menu guardrails

## Tasks

| Task ID | Task | Atomic output |
|---|---|---|
| B9-T01 | Add missing loading states | All P0 lists/forms |
| B9-T02 | Add missing empty states | All P0 lists |
| B9-T03 | Add missing error states | Forms, sync, route guards |
| B9-T04 | Accessibility pass | Labels, focus, modal behavior |
| B9-T05 | Route/menu visibility test pass | Manual or automated |
| B9-T06 | P0 acceptance checklist | Pilot-readiness report |
| B9-T07 | Imprint audit | UI pattern consistency |
| B9-T08 | Memory save checkpoint | P0 completion state |

## Architect prompt

```md
/architect

Architect Bundle 9: P0 Hardening and MVP Gate.

Use:
- structapp_prioritized_mvp_backlog.md
- structapp_screen_navigation_design.md
- structapp_menu_navigation_ux_spec.md

Produce:
- P0 gap audit
- state coverage plan
- accessibility plan
- route/menu guard test plan
- MVP acceptance checklist plan
- implementation order

Stop for approval.
```

## Build prompt

```md
Build Bundle 9 exactly as approved.

Do not add new features.
Only harden P0 screens and workflows.
```

## Review prompt

```md
/review

Review Bundle 9 against the MVP Acceptance Gate:
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
```

## Imprint prompt

```md
/imprint audit
```

## Remember prompt

```md
/remember save

Save:
- P0 completion state
- remaining P1/P2 modules
- known technical debt
- next bundle: Bundle 10 Remediation
```

---

# 16. P1 Bundles

Start P1 only after Bundle 9 is accepted.

## Bundle 10 — Remediation

| Task ID | Task |
|---|---|
| B10-T01 | Build Remediation Queue |
| B10-T02 | Build Remediation Detail |
| B10-T03 | Build Contractor Remediation Update |
| B10-T04 | Build Verify Closure Modal |
| B10-T05 | Enforce evidence-required closure |
| B10-T06 | Review and imprint remediation components |

### Prompt
```md
/architect

Architect Bundle 10: Remediation.

Use the backlog EP-10, screen design remediation screens, and menu navigation remediation routes.

Do not build Timesheets, Reports, Picklists, Imports, or Calendar.
```

---

## Bundle 11 — Timesheets

| Task ID | Task |
|---|---|
| B11-T01 | Build Contractor Timesheet list |
| B11-T02 | Build Timesheet draft/edit form |
| B11-T03 | Build Timesheet submit flow |
| B11-T04 | Build Reviewer/Admin Timesheet Review Queue |
| B11-T05 | Build Approve/Reject actions |
| B11-T06 | Review and imprint timesheet components |

### Prompt
```md
/architect

Architect Bundle 11: Timesheets.

Use backlog EP-11, mobile timesheet screen, reviewer timesheet queue, and menu spec.
```

---

## Bundle 12 — Reports

| Task ID | Task |
|---|---|
| B12-T01 | Build Report Publishing Center |
| B12-T02 | Build Report Job list |
| B12-T03 | Build job status states |
| B12-T04 | Build mock signed download behavior |
| B12-T05 | Build failed/retry state |
| B12-T06 | Review and imprint report components |

### Prompt
```md
/architect

Architect Bundle 12: Reports.

Use backlog EP-12, screen design REV-12, and menu spec Reports routes.
```

---

## Bundle 13 — Picklists

| Task ID | Task |
|---|---|
| B13-T01 | Build Picklist landing |
| B13-T02 | Build Component Types manager |
| B13-T03 | Build Work Types manager |
| B13-T04 | Add add/rename/deactivate behavior |
| B13-T05 | Preserve historical/deactivated display behavior |
| B13-T06 | Review and imprint picklist components |

### Prompt
```md
/architect

Architect Bundle 13: Picklists.

Use backlog EP-14, screen design REV-13, and menu spec Picklists routes.
```

---

## Bundle 14 — Audit Logs

| Task ID | Task |
|---|---|
| B14-T01 | Build Admin Audit Log Viewer |
| B14-T02 | Add filters |
| B14-T03 | Add pagination |
| B14-T04 | Verify Reviewer receives Forbidden |
| B14-T05 | Review audit UI |

### Prompt
```md
/architect

Architect Bundle 14: Audit Logs.

Use backlog EP-17, screen design ADM-06, and menu spec Admin-only routes.
```

---

# 17. P2 Bundles

Start P2 only after P0 and P1 are accepted.

## Bundle 15 — CSV Import Center

| Task ID | Task |
|---|---|
| B15-T01 | Build Import Center upload screen |
| B15-T02 | Build validation result table |
| B15-T03 | Build commit/discard flow |
| B15-T04 | Build batch history |
| B15-T05 | Review import workflow |

### Prompt
```md
/architect

Architect Bundle 15: CSV Import Center.

Use backlog EP-16, screen design ADM-05, and menu spec Imports routes.
```

---

## Bundle 16 — Calendar and Scheduling

| Task ID | Task |
|---|---|
| B16-T01 | Build Calendar board |
| B16-T02 | Build Recurring Schedules list |
| B16-T03 | Build Create/Edit Schedule |
| B16-T04 | Build Reschedule/Reassign action |
| B16-T05 | Build Pause Schedule action |
| B16-T06 | Review calendar workflow |

### Prompt
```md
/architect

Architect Bundle 16: Calendar and Scheduling.

Use backlog EP-15, screen design REV-11, and menu spec Calendar routes.
```

---

# 18. Prompt Templates

## 18.1 Standard Architect Prompt

```md
/remember restore

/architect

Current bundle:
[Bundle number and name]

Use these files:
1. structapp_jsm_skills_build_plan.md
2. structapp_prioritized_mvp_backlog.md
3. structapp_menu_navigation_ux_spec.md
4. structapp_screen_navigation_design.md
5. structapp_module_personas_user_journeys.md

Rules:
- Do not code yet.
- Build only this bundle.
- Do not invent roles, routes, statuses, menus, workflows, or entities.
- Do not build P1/P2 items unless this bundle is explicitly P1/P2.
- Follow document authority order.

Architect output must include:
- goal
- source docs used
- in scope
- out of scope
- component plan
- route plan
- data/mock service plan
- validation plan
- loading/empty/error/offline state plan
- risks/ambiguities
- implementation order
- stop point

Stop for approval.
```

## 18.2 Standard Build Prompt

```md
Build the approved architect plan for:
[Bundle number and name]

Rules:
- Implement only the approved scope.
- Do not add new top-level menus.
- Do not add undocumented routes.
- Do not expose disabled P1/P2 features.
- Preserve role-based visibility.
- Use mock services where backend is not ready.
- Include loading, empty, and error states where relevant.
- Report files created and changed.

Stop when the bundle is complete.
```

## 18.3 Standard Review Prompt

```md
/review

Review the completed bundle:
[Bundle number and name]

Check:
1. plan alignment
2. document alignment
3. role and route correctness
4. feature flag behavior
5. validation behavior
6. loading/empty/error/offline states
7. accessibility basics
8. maintainability
9. production-readiness concerns
10. gaps before next bundle

Return:
- pass/fail summary
- issues by severity
- required fixes
- optional improvements
- whether to proceed to the next bundle
```

## 18.4 Standard Imprint Prompt

```md
/imprint

Capture the visual patterns from the components just built.

Update ui-registry.md with:
- layout patterns
- form patterns
- table patterns
- modal patterns
- badge/status patterns
- spacing and typography conventions
- interaction conventions
- any inconsistencies found
```

## 18.5 Standard Remember Prompt

```md
/remember save

Save a session checkpoint with:
- current bundle
- tasks completed
- files created
- files changed
- routes added
- components added
- services/mock data added
- tests/checks run
- decisions made
- unresolved issues
- next recommended bundle/task
```

## 18.6 Standard Recover Prompt

```md
/recover

Something went wrong in:
[Bundle/task]

Symptoms:
[Describe the issue]

Classify as:
- Targeted fix
- Hard reset
- Rethink

Then recommend the safest recovery path without inventing new scope.
```

---

# 19. First Five Agent Runs

## Run 1 — Orientation only

```md
Execute Bundle 0 only.

Use /remember restore and /architect.
Do not code.
Summarize the source docs, authority order, P0 scope, and first implementation roadmap.
Stop for confirmation.
```

## Run 2 — Foundation

```md
Execute Bundle 1 only.

Use /architect first.
After approval, build foundation, types, feature flags, mock data, and mock services.
Run /review.
Run /remember save.
```

## Run 3 — Routing and shells

```md
Execute Bundle 2 only.

Use /architect first.
After approval, build route skeletons, layouts, desktop sidebar, mobile bottom nav, route guards, feature flags, Forbidden, and Not Found.
Run /imprint audit.
Run /review.
Run /remember save.
```

## Run 4 — Auth

```md
Execute Bundle 3 only.

Use /architect first.
After approval, build Login, Client Picker, Invite Activation, Session Expired, and Logout behavior.
Run /imprint.
Run /review.
Run /remember save.
```

## Run 5 — Admin setup

```md
Execute Bundle 4 only.

Use /architect first.
After approval, build Admin Dashboard, Client Management, User Management, Invite User, Membership Editor, Deactivate User, and Client Switcher.
Run /imprint.
Run /review.
Run /remember save.
```

---

# 20. Stop Conditions

The agent must stop when:

1. `/architect` has produced a plan and needs approval.
2. A bundle is completed.
3. `/review` finds a high-severity issue.
4. A route/menu/status conflict appears between documents.
5. A P1/P2 feature is needed to finish P0.
6. Authorization or tenant behavior is ambiguous.
7. A build/test failure cannot be fixed with a targeted fix.
8. `/recover` recommends hard reset or rethink.
9. The agent would need to invent product behavior.

---

# 21. Do-Not-Build List Until Explicitly Approved

Do not build these during P0 unless explicitly instructed:

- full CSV Import Center
- Calendar and recurring scheduling
- advanced analytics dashboards
- real report rendering
- real notification provider integration
- real media upload provider integration
- real backend database integration
- client portal
- multi-inspector single-inspection collaboration
- any role beyond Contractor, Reviewer, Admin
- any public/external user login

---

# 22. Final Instruction to the Agent

Your job is not to finish StructApp in one pass.

Your job is to:

1. restore context
2. architect the next bundle
3. wait for approval
4. build only that bundle
5. imprint UI patterns where relevant
6. review the result
7. save memory
8. stop

When in doubt, stop and report rather than inventing.
