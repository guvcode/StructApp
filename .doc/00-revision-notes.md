# 0. Revision Notes

### 0.1 v1 → v2 Changelog (for reference)
v2 closed 23 structural gaps in v1: missing auth fields, undefined tenant scoping, an undefined risk formula, missing approval/audit mechanisms, an incomplete API surface, no chosen reporting/notification libraries, vague CSV import handling, no JWT strategy for offline workers, and several schema/data-integrity gaps. Full detail lives in the v2 document; not repeated here.

### 0.2 v2 → v3 Changelog (this revision)
v3 closes the product-completeness gaps identified after the technical review, plus locks in three scope decisions:

| # | Item | Resolution in v3 |
|---|---|---|
| 1 | No remediation/close-out loop | Added `remediation_status` lifecycle on `deficiency_records`, independent of re-inspection triage |
| 2 | No way to fix an erroneously approved record | Added Admin-only `/inspections/:id/reopen` workflow |
| 3 | Free-text `component`/`work_type` fields | Replaced with per-client managed picklists (`component_types`, `work_types`) |
| 4 | Notifications only covered P1 deficiencies | Added assignment, submission, and return notifications |
| 5 | No explicit "submit inspection" action | Added `POST /inspections/:id/submit` (this was a silent gap — status enum had `Submitted` but no endpoint produced it) |
| 6 | "Recurring" project type had no logic | Added full scheduling system: `inspection_schedules`, a recurrence-generation job, and a calendar view |
| 7 | Client portal — undecided | **Decided: out of scope.** Deliverables only (email/download), no client login. |
| 8 | Audit log access — undecided | **Decided: Admin only.** Reviewers cannot read `system_audit_logs`. |
| 9 | Multi-inspector per inspection — undecided | **Decided: not needed.** Per-asset independent assignment (already supported natively) is sufficient; true joint/team assignment is explicitly out of scope. |
