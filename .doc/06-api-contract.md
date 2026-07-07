# 6. API Contract & Validation Blueprint

> Full v2 §6 below. v3 additions at the end.

## 6.1 Type Guard Validation Rules (Zod Contracts) — v2

```typescript
import { z } from 'zod';

export const inviteProvisionSchema = z.object({
  email: z.string().email(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/),
  role: z.enum(['Admin', 'Reviewer', 'Contractor']),
  client_ids: z.array(z.string().uuid()).optional() // required for Reviewer/Contractor, ignored for Admin
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8)
});

export const pinFallbackSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{6}$/)
});

export const setPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/)
});

// FR-16: inspection capture mode. Picker at the start of an inspection.
export const inspectionModeEnum = z.enum(['onsite', 'post_inspection']);

export const inspectionCreateSchema = z.object({
  structure_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  scheduled_date: z.string().date().optional(),
  inspection_mode: inspectionModeEnum.default('onsite')   // FR-16.2
});

// FR-16.5: Admin can fix a misclicked mode before any deficiency is logged.
export const inspectionModeUpdateSchema = z.object({
  inspection_mode: inspectionModeEnum
});

// FR-17: timesheet entry date is captured; pre_inspection is derived.
export const timesheetCreateSchema = z.object({
  project_id: z.string().uuid(),
  inspection_id: z.string().uuid().optional(),    // optional link to a specific inspection
  work_type_id: z.string().uuid(),
  hours_logged: z.number().min(0.01).max(24.00),
  entry_date: z.string().date().optional()       // default: today
});

export const deficiencySyncSchema = z.object({
  client_local_id: z.string().min(1),
  structure_id: z.string().uuid(),
  previous_deficiency_id: z.string().uuid().nullable(),
  component: z.string().min(2).max(100),
  description: z.string().min(10),
  severity: z.number().int().min(1).max(5),
  probability: z.number().int().min(1).max(5),
  consequences: z.number().int().min(1).max(5),
  gps_latitude: z.number().min(-90).max(90).nullable(),
  gps_longitude: z.number().min(-180).max(180).nullable()
  // calculated_priority is intentionally NOT accepted from the client —
  // the server always recomputes it via shared/utils/riskCalculator.ts
});

export const inspectionApproveSchema = z.object({
  inspection_id: z.string().uuid()
});

export const switchClientSchema = z.object({
  client_id: z.string().uuid()
});

export const deficiencyOverrideSchema = z.object({
  adjusted_priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']),
  reviewer_justification: z.string().min(10)
});
```

## 6.2 Request / Response Endpoint Blueprints — v2

#### POST /api/v1/auth/login

```json
// Request
{ "email": "inspector.smith@contractor.com", "password": "••••••••" }
```
```json
// Response (200) — single client membership
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rft_8f9e0d...",
    "active_client_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
  }
}
```
```json
// Response (200) — multiple memberships, client choice required
{
  "success": true,
  "requires_client_selection": true,
  "data": { "available_clients": [{ "client_id": "...", "name": "Acme Mining" }] }
}
```

#### POST /api/v1/inspections/:id/approve

```json
// Response (200)
{
  "success": true,
  "message": "Inspection approved. All associated deficiency records are now immutable.",
  "data": { "inspection_id": "a1b2c3d4-...", "status": "Approved", "approved_at": "2026-06-17T18:02:00Z" }
}
```

#### POST /api/v1/sync/push-outbox (Multipart/Form-Data)

```json
// Response (422 Unprocessable Entity — Atomic Abort)
{
  "success": false,
  "error_code": "ATOMIC_SYNC_VALIDATION_FAILURE",
  "message": "Sync aborted. Record 'def_loc_001' failed validation: description below minimum length. No database changes were committed."
}
```

#### POST /api/v1/imports/batches/:id/commit

```json
// Response (422 — partial validity, nothing committed)
{
  "success": false,
  "error_code": "IMPORT_BATCH_HAS_INVALID_ROWS",
  "message": "3 of 120 rows failed validation. Resolve or remove them before committing.",
  "data": { "invalid_row_ids": ["row-uuid-1", "row-uuid-2", "row-uuid-3"] }
}
```

#### POST /api/v1/auth/pin-fallback

```json
// Request
{ "email": "inspector.smith@contractor.com", "pin": "483921" }
```
```json
// Response (200) — PIN accepted, fallback token issued
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rft_pin_4a5b6c...",
    "active_client_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c",
    "mode": "pin_fallback"
  }
}
```
```json
// Response (423) — PIN-mode token attempting a write or refresh
{
  "success": false,
  "error_code": "LOCKED_PIN_FALLBACK_ACTIVE",
  "message": "PIN-fallback tokens are read-only and offline-only. Complete a real password login to unlock writes and sync."
}
```
```json
// Response (429) — too many failed PIN attempts
{
  "success": false,
  "error_code": "PIN_LOCKED_OUT",
  "message": "Too many failed PIN attempts. Try again in 1 hour."
}
```

The PIN is set during contractor profile setup and stored hashed (Argon2id) on the server. Failed attempts counter is per-user; lockout is 1 hour after 5 failed attempts in an hour. Every attempt is audit-logged.

#### PATCH /api/v1/users/:id/reset-pin (Admin only)

Forces the inspector to re-setup their PIN on next login. Body: empty (or `{ send_email: true }` to trigger a Resend notification).

```json
// Response (200)
{ "success": true, "message": "PIN reset triggered. The user will be required to set a new PIN on next login." }
```

#### POST /api/v1/auth/switch-client

```json
// Request
{ "client_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c" }
```
```json
// Response (200) — Admin/Reviewer (no membership check) or Contractor (membership validated)
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rft_8f9e0d...",
    "active_client_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
  }
}
```
```json
// Response (403) — Contractor attempting to switch to a client they are not a member of
{
  "success": false,
  "error_code": "NOT_A_MEMBER",
  "message": "You are not a member of the requested client. Contact your administrator to request access."
}
```

The switch is **non-disruptive** — the user does not need to log out first. The new access token replaces the old one in memory (PWA: Dexie `authState` table; desktop: in-memory only). The PWA's pending outbox is **not** drained as part of the switch — outbox records belong to whichever inspection they were logged against, not to the active client. The user's offline-cached reference data for the new client is pulled on the next `/sync/pull-package` call.

#### POST /api/v1/reports/generate

```json
// Request
{ "type": "final_pdf", "project_id": "9f8e7d6c-..." }
```
```json
// Response (202 Accepted)
{ "success": true, "data": { "job_id": "rpt_4a5b6c...", "status": "Queued" } }
```

## 6.3 Zod Contracts — v3 Additions

```typescript
// FR-18: Reassignment schemas. The single-inspection reassign already exists
// (inspectionReassignSchema); this adds the reason field and the bulk endpoint schema.

export const inspectionReassignSchemaV18 = z.object({
  inspector_id: z.string().uuid(),
  scheduled_date: z.string().date().optional(),
  reason: z.string().max(500).optional()             // FR-18.2: included in the old-inspector notification
}).strict();

export const bulkReassignSchema = z.object({
  source_inspector_id: z.string().uuid(),
  target_inspector_id: z.string().uuid(),
  inspection_ids: z.array(z.string().uuid()).max(100).optional(),   // omit = all open
  reason: z.string().max(500).optional()
}).strict();

// FR-15: Edit operation schemas. Each edit has a Zod schema, a role gate,
// and a critical/cosmetic flag that controls audit logging.

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/).nullable().optional(),
  full_name: z.string().min(2).max(255).optional(),     // cosmetic
  role: z.enum(['Admin', 'Reviewer', 'Contractor']).optional(),     // critical
  is_active: z.boolean().optional(),                    // critical
  add_client_ids: z.array(z.string().uuid()).optional(), // critical
  remove_client_ids: z.array(z.string().uuid()).optional() // critical
}).strict();

export const resendInviteSchema = z.object({
  // no body — server reads user_id from path
});

export const revokeInviteSchema = z.object({
  reason: z.string().min(10)                            // critical
});

export const adminResetPasswordSchema = z.object({
  temporary_password: z.string().min(8),
  send_email: z.boolean().default(true)                 // critical
});

export const siteUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),          // critical
  iana_timezone: z.string().max(100).optional()         // critical
}).strict();

export const projectUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),         // critical
  type: z.enum(['One-Off', 'Recurring']).optional(),    // critical
  due_date: z.string().datetime().optional()            // critical
}).strict();

export const structureUpdateSchema = z.object({
  asset_tag: z.string().min(1).max(100).optional(),     // critical
  description: z.string().min(1).optional(),            // critical
  qr_code_value: z.string().max(150).nullable().optional()  // critical
}).strict();

export const inspectionReassignSchema = z.object({
  inspector_id: z.string().uuid(),                      // critical
  scheduled_date: z.string().date().optional()          // critical
}).strict();

export const deficiencyUpdateSchema = z.object({
  description: z.string().min(10).optional(),           // critical
  severity: z.number().int().min(1).max(5).optional(),   // critical
  probability: z.number().int().min(1).max(5).optional(), // critical
  consequences: z.number().int().min(1).max(5).optional()  // critical
}).strict();

export const componentNotesUpdateSchema = z.object({
  component_notes: z.string().max(500)                 // cosmetic
});

export const photoUpdateSchema = z.object({
  caption: z.string().max(500).optional(),              // cosmetic
  display_order: z.number().int().min(0).optional(),   // cosmetic
  purpose: z.enum(['deficiency_evidence', 'remediation_evidence']).optional()  // cosmetic
}).strict();

export const timesheetUpdateSchema = z.object({
  work_type_id: z.string().uuid().optional(),           // cosmetic if Draft, critical if not
  hours_logged: z.number().min(0.01).max(24.00).optional()  // cosmetic if Draft, critical if not
}).strict();

// Updated: component is now a picklist reference, not free text (FR-11.1)
export const deficiencySyncSchemaV3 = z.object({
  client_local_id: z.string().min(1),
  structure_id: z.string().uuid(),
  previous_deficiency_id: z.string().uuid().nullable(),
  component_type_id: z.string().uuid(),                 // was: component: z.string()
  component_notes: z.string().max(500).optional(),
  description: z.string().min(10),
  severity: z.number().int().min(1).max(5),
  probability: z.number().int().min(1).max(5),
  consequences: z.number().int().min(1).max(5),
  gps_latitude: z.number().min(-90).max(90).nullable(),
  gps_longitude: z.number().min(-180).max(180).nullable()
});

export const scheduleCreateSchema = z.object({
  structure_id: z.string().uuid(),
  default_inspector_id: z.string().uuid().nullable(),
  recurrence_interval_days: z.number().int().positive(),
  next_due_date: z.string().date()
});

export const inspectionSubmitSchema = z.object({
  no_deficiencies_found: z.boolean().default(false)
});

export const inspectionReopenSchema = z.object({
  target_status: z.enum(['Submitted', 'Returned']),
  reason: z.string().min(10)
});

export const remediationUpdateSchema = z.object({
  remediation_status: z.enum(['Remediation_Scheduled', 'Remediated_Pending_Verification']),
  remediation_due_date: z.string().date().nullable().optional()
});

export const picklistEntrySchema = z.object({
  name: z.string().min(2).max(100)
});
```

## 6.4 Endpoint Examples — v3 Additions

#### POST /api/v1/inspections/:id/reopen

```json
// Request
{ "target_status": "Returned", "reason": "Photo evidence for deficiency def-1 was mismatched to the wrong asset; needs re-capture." }
```
```json
// Response (200)
{
  "success": true,
  "message": "Inspection reopened and moved to 'Returned'. Deficiency records are editable again.",
  "data": { "inspection_id": "a1b2c3d4-...", "status": "Returned", "reopened_at": "2026-06-17T19:40:00Z" }
}
```
```json
// Response (403) — Reviewer attempting this action
{ "success": false, "error_code": "FORBIDDEN_ADMIN_ONLY", "message": "Reopening an approved inspection is restricted to System Administrators." }
```

#### POST /api/v1/deficiencies/:id/verify-closure

```json
// Response (422) — no remediation evidence photo attached yet
{
  "success": false,
  "error_code": "MISSING_REMEDIATION_EVIDENCE",
  "message": "At least one photo tagged 'remediation_evidence' must be attached before this deficiency can be verified closed."
}
```

#### GET /api/v1/audit-logs (Admin only)

```json
// Response (403) — Reviewer token
{ "success": false, "error_code": "FORBIDDEN_ADMIN_ONLY", "message": "Audit log access is restricted to System Administrators." }
```

## 6.5 Validation Conventions

- One schema per route body, named `<route><Method>Schema` (e.g. `inspectionReopenSchema`)
- All schemas live in `apps/api-server/src/contracts/` — never co-locate with the route handler
- Export both the schema and the inferred type: `export type InspectionReopenInput = z.infer<typeof inspectionReopenSchema>`
- `safeParse` + explicit error response — never `.parse()` at the request boundary
- Validation errors return HTTP 422 with `error_code: 'VALIDATION_ERROR'`
- The inferred type is the *only* type used downstream — never widen it
- Date/time strings in the wire format stay as `string`; convert to `Date` only at the persistence boundary
