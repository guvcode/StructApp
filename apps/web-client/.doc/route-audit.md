# Route & Menu Visibility Audit (B9-T05)

## Role Definitions
- `admin` — super role, accesses all routes; sidebar filtered to P0
- `reviewer` — reviewer/admin routes + sidebar P0 items
- `contractor` — mobile `/m/*` routes only; MobileBottomNav shown
- `inspector`, `owner` — defined in UserRole but have no assigned routes or menu items

## Access Summary

### P0 Routes (visible in sidebar for P0 phase)

| Route | Component | Admin Menu | Reviewer Menu | Contractor Menu | Notes |
|---|---|---|---|---|---|
| `/reviewer/dashboard` | ReviewerDashboardPage | Yes | Yes | — | Reviewer variant; admin sees sidebar "Dashboard" entry too |
| `/admin/dashboard` | AdminDashboardPage | Yes | — | — | Admin-only Dashboard link |
| `/inspections` | InspectionListPage | Yes | Yes | — | Submenu: All, Submitted, Returned, Approved |
| `/inspections/:id/review` | InspectionReviewPage | Dynamic | Dynamic | — | No direct sidebar link |
| `/deficiencies/:id` | ReviewerDeficiencyDetailPage | Dynamic | Dynamic | — | No direct sidebar link |
| `/register` | RegisterLandingPage | Yes | Yes | — | Submenu: Projects, Sites, Structures |
| `/register/projects` | ProjectListPage | Yes (sub) | Yes (sub) | — | Under Register |
| `/register/sites` | SiteListPage | Yes (sub) | Yes (sub) | — | Under Register |
| `/register/structures` | StructureListPage | Yes (sub) | Yes (sub) | — | Under Register |
| `/admin/clients` | ClientListPage | Yes | — | — | Submenu: All Clients, New Client |
| `/admin/clients/new` | NewClientPage | Yes (sub) | — | — | Under Clients |
| `/admin/users` | UserListPage | Yes | — | — | Submenu: All Users, Invite User |
| `/admin/users/invite` | InviteUserPage | Yes (sub) | — | — | Under Users |

### P0 Mobile Routes

| Route | Component | Menu Link | Notes |
|---|---|---|---|
| `/m/dashboard` | DashboardPage | MobileBottomNav: Dashboard | |
| `/m/sync` | SyncPage | MobileBottomNav: Sync | |
| `/m/settings` | SettingsPage | MobileBottomNav: Settings | |
| `/m/inspections/:id` | InspectionDetailPage | No direct link | Navigated from dashboard list |
| `/m/inspections/:id/submit` | InspectionSubmitPage | No direct link | |
| `/m/inspections/:id/history` | InspectionHistoryPage | No direct link | |
| `/m/structures/search` | StructureSearchPage | No direct link | |
| `/m/deficiencies/:localId` | MobileDeficiencyDetailPage | No direct link | |
| `/m/deficiencies/:localId/photos` | DeficiencyPhotosPage | No direct link | |
| `/m/deficiencies/:id/remediation` | RemediationUpdatePage | No direct link | |

### P1/P2 Routes (feature-flag gated, not in P0 sidebar)

| Route | Phase | Flag | Admin Menu | Reviewer Menu |
|---|---|---|---|---|
| `/remediation` | P1 | remediation | Yes (hidden P0) | Yes (hidden P0) |
| `/timesheets/review` | P1 | timesheets | Yes (hidden P0) | Yes (hidden P0) |
| `/reports` | P1 | reports | Yes (hidden P0) | Yes (hidden P0) |
| `/reports/jobs` | P1 | reports | Sub-item | Sub-item |
| `/picklists` | P1 | picklists | Yes (hidden P0) | Yes (hidden P0) |
| `/picklists/component-types` | P1 | picklists | Sub-item | Sub-item |
| `/picklists/work-types` | P1 | picklists | Sub-item | Sub-item |
| `/admin/audit-logs` | P1 | audit_logs | Yes (hidden P0) | — |
| `/calendar` | P2 | calendar | Yes (hidden P0) | Yes (hidden P0) |
| `/calendar/schedules` | P2 | calendar | Sub-item | Sub-item |
| `/admin/imports` | P2 | imports | Yes (hidden P0) | — |
| `/admin/imports/history` | P2 | imports | Sub-item | — |

### Public / Shared Routes

| Route | Component | Notes |
|---|---|---|
| `/login` | LoginPage | Public |
| `/activate` | ActivatePage | Public |
| `/select-client` | ClientPickerPage | Public |
| `/session-expired` | SessionExpiredPage | Public |
| `/forbidden` | ForbiddenPage | All roles fallback |
| `/*` | NotFoundPage | Catch-all 404 |

## Issues Identified

1. **No menu link for contractor P0 route details**: `InspectionDetailPage`, `DeficiencyDetailPage` etc. have no top-level nav — navigated only via list items.
2. **MobileBottomNav no role filtering**: Menu shown to any user in MobileShell; RouteGuard provides enforcement.
3. **`inspector`/`owner` roles unused**: Defined but no routes or menu items assigned.
4. **P1/P2 sidebar items hidden**: Routes exist and are guarded but sidebar unconditionally filters `phase === 'P0'` — no toggle to reveal P1/P2 items yet.