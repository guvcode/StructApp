# MVP Acceptance Checklist (B9-T06)

## Overview
This document defines the acceptance criteria for the P0 MVP build of structApp3. Each item must be verifiable by a tester or automated test. Acceptance requires all items marked **CRITICAL** to pass and ≥90% of **HIGH** items to pass.

---

## 1. Authentication & Authorization

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| AUTH-01 | CRITICAL | Login page renders at `/login` without crashing | Manual: navigate to `/login` |
| AUTH-02 | CRITICAL | Valid credentials log in and redirect to role-appropriate dashboard | Manual: login as admin → `/admin/dashboard`; as reviewer → `/reviewer/dashboard`; as contractor → `/m/dashboard` |
| AUTH-03 | CRITICAL | Invalid credentials show error message, no redirect | Manual: incorrect password shows red error text |
| AUTH-04 | CRITICAL | Unauthenticated user redirected to `/login` for protected routes | Manual: visit `/inspections` while logged out → `/login` |
| AUTH-05 | CRITICAL | Forbidden route displays `/forbidden` (not 404) | Manual: contractor visits `/admin/dashboard` → `/forbidden` |
| AUTH-06 | HIGH | Session expiry redirects to `/session-expired` | Manual: wait for expiry or clear session, navigate → `/session-expired` |
| AUTH-07 | HIGH | "Select client" page renders at `/select-client` for multi-client users | Manual: login as admin with multiple clients → `/select-client` |

## 2. Admin Dashboard & Management

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| ADM-01 | CRITICAL | Admin dashboard at `/admin/dashboard` shows client stats and recent activity | Manual: verify stats cards render |
| ADM-02 | CRITICAL | Admin dashboard shows empty/zero state when no data exists | Manual: verify counts show 0 with appropriate messaging |
| ADM-03 | CRITICAL | Admin dashboard loads with loading indicator | Manual: verify "Loading dashboard..." appears briefly |
| ADM-04 | HIGH | Client list at `/admin/clients` shows all clients for admin | Manual: verify table renders |
| ADM-05 | HIGH | New client form at `/admin/clients/new` creates client | Manual: fill form, submit, verify redirect |
| ADM-06 | HIGH | User list at `/admin/users` shows users | Manual: verify table renders |
| ADM-07 | HIGH | Invite user form at `/admin/users/invite` creates invitation | Manual: fill form, submit, verify redirect |

## 3. Reviewer Workflow

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| REV-01 | CRITICAL | Reviewer dashboard at `/reviewer/dashboard` shows stats | Manual: verify stats and bar chart render |
| REV-02 | CRITICAL | Inspection list at `/inspections` shows inspections grouped by site | Manual: verify table with filter chips |
| REV-03 | CRITICAL | Inspection list filter chips change shown inspections | Manual: click "Submitted" → only submitted shown |
| REV-04 | CRITICAL | Inspection list shows loading state | Manual: verify "Loading inspections..." |
| REV-05 | CRITICAL | Inspection review at `/inspections/:id/review` shows inspection details | Manual: click an inspection → details page |
| REV-06 | CRITICAL | Review page shows deficiency list; deficiency details when selected | Manual: click deficiency → show detail panel |
| REV-07 | CRITICAL | Return button opens ReturnInspectionModal | Manual: click "Return Inspection" → modal opens |
| REV-08 | CRITICAL | ReturnInspectionModal requires reason and shows error on empty | Manual: click Confirm without reason → red error |
| REV-09 | CRITICAL | ReturnInspectionModal Esc closes the modal | Manual: open modal, press Escape → modal closes |
| REV-10 | CRITICAL | ReturnInspectionModal has aria-label on dialog and buttons | Automated: check `aria-label="Return inspection"`, `aria-label="Cancel return"`, `aria-label="Confirm return inspection"` |
| REV-11 | CRITICAL | Approve button opens ApproveInspectionModal | Manual: click "Approve Inspection" → modal opens with checkbox |
| REV-12 | CRITICAL | ApproveInspectionModal requires confirmation checkbox | Manual: Confirm disabled until checkbox checked |
| REV-13 | CRITICAL | ApproveInspectionModal Esc closes the modal | Manual: open modal, press Escape → modal closes |
| REV-14 | HIGH | ApproveInspectionModal has aria-label on dialog and buttons | Automated: check dialog aria-label, button aria-labels |
| REV-15 | CRITICAL | Approved inspection shows lock message and Reopen button for admin | Manual: approve inspection → see "approved — locked" message + "Reopen Inspection" button (admin only) |
| REV-16 | CRITICAL | ReopenInspectionModal opens with target status dropdown | Manual: click "Reopen Inspection" → modal with dropdown |
| REV-17 | CRITICAL | ReopenInspectionModal defaults to "Submitted" target | Manual: verify dropdown shows "Submitted" as default |
| REV-18 | CRITICAL | ReopenInspectionModal requires reason and confirmation | Manual: Confirm disabled until reason filled + checkbox checked |
| REV-19 | CRITICAL | Reopen transitions inspection to target status | Automated: `reopenInspection()` test |
| REV-20 | HIGH | GovernanceMetadataPanel shows approve/return/reopen provenance | Manual: approved inspection shows `approved_by`/`approved_at` |
| REV-21 | HIGH | GovernanceMetadataPanel empty state when no governance data | Manual: inspection with no returns/overrides shows "No governance actions" |

## 4. Priority Override

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| PRI-01 | CRITICAL | Override Priority button visible on non-approved inspection | Manual: select deficiency → "Override Priority" button |
| PRI-02 | CRITICAL | PriorityOverridePanel opens with tier dropdown | Manual: click "Override Priority" → panel with dropdown |
| PRI-03 | CRITICAL | Override Save requires justification text | Manual: Confirm disabled until text entered |
| PRI-04 | CRITICAL | Override saves audit trail (overridden_by, overridden_at, override_reason, previous_tier) | Automated: `overridePriority()` test |
| PRI-05 | HIGH | Override panel has aria-label and Esc close | Automated: check dialog aria-label, Esc handler |

## 5. Deficiency Review

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| DEF-01 | CRITICAL | DeficiencyDetailPage at `/deficiencies/:id` loads deficiency | Manual: navigate from review page → detail page |
| DEF-02 | CRITICAL | DeficiencyDetailPage shows loading and error states | Manual: error on failed fetch with red text |
| DEF-03 | HIGH | DeficiencyDetailPage integrates GovernanceMetadataPanel | Manual: override provenance shown in panel |
| DEF-04 | HIGH | Mobile DeficiencyDetailPage saves title, severity, location | Manual: edit fields, "Save Deficiency" → saved |

## 6. Contractor Mobile

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| MOB-01 | CRITICAL | Mobile dashboard at `/m/dashboard` shows returned and assigned inspections | Manual: verify lists render |
| MOB-02 | CRITICAL | Mobile dashboard shows loading and error states | Manual: verify "Loading dashboard..." + error on failure |
| MOB-03 | CRITICAL | Mobile dashboard shows empty state for no inspections | Manual: verify "No assigned inspections." |
| MOB-04 | CRITICAL | Sync page at `/m/sync` shows pending items | Manual: verify list of pending items |
| MOB-05 | CRITICAL | Sync page Pull and Push buttons have loading states | Manual: click Pull → button shows disabled + loading state |
| MOB-06 | CRITICAL | Sync page error states for failed pull/push | Manual: trigger network error → red error text |
| MOB-07 | CRITICAL | Mobile inspection detail page shows inspection data | Manual: click inspection from dashboard → detail page |
| MOB-08 | CRITICAL | Mobile inspection submit transitions inspection to Submitted | Manual: click "Submit" → status changes |
| MOB-09 | HIGH | Mobile deficiency photos page adds photos up to 5 | Manual: add photos → grid renders; 5th photo disables Add |
| MOB-10 | HIGH | Mobile deficiency photos page empty state | Manual: no photos → "No photos yet" dashed box |

## 7. Register (Structures Management)

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| REG-01 | CRITICAL | Register landing at `/register` shows counts | Manual: verify counts for projects/sites/structures |
| REG-02 | HIGH | Register landing shows empty state when counts are zero | Manual: all zeros → "No projects registered" or equivalent |
| REG-03 | HIGH | Project list at `/register/projects` loads and shows data | Manual: verify table |
| REG-04 | HIGH | Site list at `/register/sites` loads and shows data | Manual: verify table |
| REG-05 | HIGH | Structure list at `/register/structures` loads and shows data | Manual: verify table |

## 8. Error & Edge Case Handling

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| ERR-01 | CRITICAL | All P0 pages show loading state while data fetches | Automated: check each page's loading div or spinner |
| ERR-02 | CRITICAL | All P0 pages show error state on fetch failure | Manual: simulate network failure → red error text |
| ERR-03 | CRITICAL | ClientPickerPage handles client load failure gracefully | Manual: simulate failure → error display |
| ERR-04 | HIGH | 404 page at `/*` shows "Page not found" with navigation link | Manual: visit `/nonexistent` → NotFoundPage with link to dashboard |
| ERR-05 | HIGH | ForbiddenPage shows "Forbidden" with navigation link | Manual: contractor visits `/admin/dashboard` → ForbiddenPage with role context |

## 9. Accessibility

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| A11Y-01 | HIGH | All action buttons have aria-labels | Automated: check 17+ buttons across reviewer + mobile pages |
| A11Y-02 | HIGH | All modals have role="dialog" and aria-modal="true" | Automated: check 4 modals |
| A11Y-03 | HIGH | All modals close on Escape key press | Manual: open each modal, press Escape → closes |
| A11Y-04 | MEDIUM | Tables have aria-label | Automated: check table elements |
| A11Y-05 | MEDIUM | Keyboard-navigable deficiency list items | Manual: Tab through buttons should be reachable |

## 10. Route & Menu correctness

| ID | Priority | Criterion | Verification |
|---|---|---|---|
| RTE-01 | CRITICAL | Admin sees admin dashboard + reviewer routes + mobile routes | Manual: login as admin → verify sidebar + mobile nav |
| RTE-02 | CRITICAL | Reviewer sees reviewer routes only (not admin routes) | Manual: login as reviewer → no admin sidebar items |
| RTE-03 | CRITICAL | Contractor sees mobile routes only | Manual: login as contractor → redirected to `/m/dashboard` |
| RTE-04 | HIGH | RouteGuard correctly blocks unauthorized access | Automated: `RouteGuard` test for contractor→admin route |
| RTE-05 | HIGH | P1/P2 routes return NotFoundPage when feature flag disabled | Manual: visit `/remediation` without flag → 404 |

---

## Acceptance Gate

| Gate | Requirement |
|---|---|
| **CRITICAL** | 100% of CRITICAL items pass |
| **HIGH** | ≥90% of HIGH items pass (allow up to 2 failures with documented reason) |
| **MEDIUM** | ≥75% of MEDIUM items pass |
| **All** | No unhandled exceptions in console |