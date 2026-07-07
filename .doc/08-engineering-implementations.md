# 8. Engineering Implementations & Core Custom Service Integrations

> Full v2 §8 first (Dexie schema, atomic sync, risk calculator, CSV import, notification service, Cloudinary). v3 additions at the end.

## 8.1 Local Caching Database Core (Dexie.js) — v2

```typescript
import Dexie, { type Table } from 'dexie';

export interface LocalDeficiency {
  localId?: string;
  structureId: string;
  previousDeficiencyId?: string | null;
  component: string;
  description: string;
  severity: number;
  probability: number;
  consequences: number;
  calculatedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // advisory only — see Section 8.3
  syncState: 'Draft' | 'Pending_Sync' | 'Synced';
}

export interface AuthState {
  id: 'current';
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  activeClientId: string;
}

class StructAppLocalDB extends Dexie {
  deficiencies!: Table<LocalDeficiency>;
  authState!: Table<AuthState>;

  constructor() {
    super('StructAppLocalDB');
    this.version(1).stores({
      deficiencies: '++localId, structureId, calculatedPriority, syncState',
      authState: 'id'
    });
  }
}

export const localDB = new StructAppLocalDB();
```

## 8.2 Atomic Sync Transaction — v2

```typescript
import { Pool } from 'pg';
import { deficiencySyncSchema } from '@shared/types/validation';
import { calculatePriorityTier } from '@shared/utils/riskCalculator';

export async function processOutboxSync(pool: Pool, tenantClientId: string, payload: SyncPushPayload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_client_id = '${tenantClientId}'`); // RLS context, ADR-006

    for (const raw of payload.deficiencies) {
      const parsed = deficiencySyncSchema.parse(raw); // throws on invalid -> caught below, triggers rollback
      const tier = calculatePriorityTier(parsed.severity, parsed.probability, parsed.consequences);

      await client.query(
        `INSERT INTO deficiency_records
           (inspection_id, component, description, severity, probability, consequences,
            calculated_priority, gps_latitude, gps_longitude, previous_deficiency_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [payload.inspection_id, parsed.component, parsed.description, parsed.severity,
         parsed.probability, parsed.consequences, tier, parsed.gps_latitude,
         parsed.gps_longitude, parsed.previous_deficiency_id]
      );
      // photo rows + Cloudinary stream calls happen here, inside the same transaction scope
    }

    for (const ts of payload.timesheets) {
      await client.query(
        `INSERT INTO timesheet_entries (user_id, project_id, work_type, hours_logged) VALUES ($1,$2,$3,$4)`,
        [payload.user_id, ts.project_id, ts.work_type, ts.hours_logged]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK'); // ADR-005: all-or-nothing
    return { success: false, error };
  } finally {
    client.release();
  }
}
```

## 8.3 Shared Risk Priority Calculator — v2 (single source of truth)

```typescript
// shared/utils/riskCalculator.ts
// Imported identically by the mobile client (advisory live preview) and the
// API server (authoritative value persisted to the DB). Never duplicate this logic.

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export function calculatePriorityTier(
  severity: 1 | 2 | 3 | 4 | 5,
  probability: 1 | 2 | 3 | 4 | 5,
  consequences: 1 | 2 | 3 | 4 | 5
): PriorityTier {
  // Hard safety override: maximum severity + maximum consequence is always Critical,
  // regardless of how unlikely (probability) it's judged to be.
  if (severity === 5 && consequences === 5) return 'P1';

  const rawScore = severity * probability * consequences; // range: 1–125

  if (rawScore >= 80) return 'P1'; // Critical
  if (rawScore >= 45) return 'P2'; // High
  if (rawScore >= 20) return 'P3'; // Moderate
  if (rawScore >= 8) return 'P4';  // Low
  return 'P5';                     // Negligible
}
```

> **Default disclosed, not derived:** these score bands (80/45/20/8) are a reasonable starting heuristic, not a certified engineering standard. Before production use, have your structural engineering lead validate or adjust the bands.

## 8.4 CSV Import Validation Service — v2

```typescript
// apps/api-server/src/services/importValidation.ts
export const REQUIRED_CSV_COLUMNS = [
  'project_title',
  'site_name',
  'structure_asset_tag',
  'structure_description'
] as const;

export async function validateImportRow(row: Record<string, string>, clientId: string) {
  const missing = REQUIRED_CSV_COLUMNS.filter(col => !row[col]?.trim());
  if (missing.length > 0) {
    return { status: 'Invalid' as const, errors: [`Missing required column(s): ${missing.join(', ')}`] };
  }
  // Project/site resolution: matched by (client_id, title/name) — created on commit if not found.
  return { status: 'Valid' as const, errors: [] };
}
```

## 8.5 Notification Service — v2 (Resend + MessageBird, post-amendment)

```typescript
// apps/api-server/src/services/notifications.ts
interface NotificationProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}

// Concrete adapters (Resend/MessageBird) implement NotificationProvider — call sites never
// import Resend/MessageBird directly, so swapping providers later touches one file.

export async function notifyP1Deficiency(provider: NotificationProvider, deficiency: DeficiencyRecord, client: Client, reviewer: User) {
  await provider.sendEmail(
    client.safety_contact_email,
    `Critical (P1) Structural Deficiency Logged`,
    `A P1 deficiency was logged on asset ${deficiency.component}. Review required immediately.`
  );
  if (reviewer.phone_number) {
    await provider.sendSms(reviewer.phone_number, `P1 deficiency logged — review required.`);
  }
}
```

> **Post-v2 amendment:** the original v2 code referenced SendGrid/Twilio. Resend and MessageBird replace them per ADR-008 amendment. The `NotificationProvider` interface is unchanged. See `library-docs.md` for the current adapter implementations.

## 8.6 Server-Side Cloud Media Management (Cloudinary) — v2

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

export async function pipeBinaryStreamToCloudinary(fileBuffer: Buffer, assetFolder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `structapp/${assetFolder}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result!.secure_url))
    );
    stream.end(fileBuffer);
  });
}
```

## 8.7 Schedule Generation Job — v3 (FR-10)

```typescript
// apps/api-server/src/jobs/scheduleGenerator.ts
// Runs daily (e.g., via node-cron or an external scheduler hitting an internal endpoint).
const LEAD_TIME_DAYS = 14;

export async function generateUpcomingInspections(pool: Pool) {
  const dueSchedules = await pool.query(
    `SELECT * FROM inspection_schedules
     WHERE is_active = TRUE
       AND next_due_date <= CURRENT_DATE + $1::int`,
    [LEAD_TIME_DAYS]
  );

  for (const schedule of dueSchedules.rows) {
    try {
      await pool.query(
        `INSERT INTO inspections (structure_id, inspector_id, schedule_id, scheduled_date, status)
         VALUES ($1, $2, $3, $4, 'Assigned')
         ON CONFLICT (schedule_id, scheduled_date) DO NOTHING`, // FR-10.2 idempotency, backed by the unique index
        [schedule.structure_id, schedule.default_inspector_id, schedule.schedule_id, schedule.next_due_date]
      );
      await pool.query(
        `UPDATE inspection_schedules SET next_due_date = next_due_date + ($1 || ' days')::interval WHERE schedule_id = $2`,
        [schedule.recurrence_interval_days, schedule.schedule_id]
      );
      if (schedule.default_inspector_id) {
        await notifyInspectionAssigned(schedule.default_inspector_id, schedule.structure_id); // FR-12.1
      }
    } catch (error) {
      logger.error('Schedule generation failed for schedule', { scheduleId: schedule.schedule_id, error });
      // Intentionally continue to the next schedule rather than aborting the whole job run.
    }
  }
}
```

## 8.8 Notification Call Sites — v3 (FR-12)

```typescript
// Inside POST /inspections handler, after the INSERT:
await notifyInspectionAssigned(provider, inspection.inspector_id, inspection);

// Inside POST /inspections/:id/submit handler, after status -> 'Submitted':
const reviewers = await getReviewersForClient(inspection.client_id);
await Promise.all(reviewers.map(r => notifyInspectionSubmitted(provider, r, inspection)));

// Inside POST /inspections/:id/return handler, after status -> 'Returned':
await notifyInspectionReturned(provider, inspection.inspector_id, inspection, returnedReason);
```

All three reuse the `NotificationProvider` interface — no new provider integration was needed for FR-12.

## 8.9 Verify-Closure Guard — v3 (FR-8.2)

```typescript
// apps/api-server/src/controllers/deficiencies.ts
export async function verifyClosure(req: Request, res: Response) {
  const evidence = await db.query(
    `SELECT 1 FROM photos WHERE deficiency_id = $1 AND purpose = 'remediation_evidence' LIMIT 1`,
    [req.params.id]
  );
  if (evidence.rowCount === 0) {
    return res.status(422).json({
      success: false,
      error_code: 'MISSING_REMEDIATION_EVIDENCE',
      message: "At least one photo tagged 'remediation_evidence' must be attached before this deficiency can be verified closed."
    });
  }
  await db.query(
    `UPDATE deficiency_records SET remediation_status = 'Verified_Closed', verified_closed_by = $1, verified_closed_at = NOW() WHERE deficiency_id = $2`,
    [req.user.user_id, req.params.id]
  );
  return res.json({ success: true });
}
```

## 8.10 Admin-Only Middleware for Reopen & Audit Routes — v3 (FR-9)

```typescript
// apps/api-server/src/middleware/requireAdmin.ts
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, error_code: 'FORBIDDEN_ADMIN_ONLY', message: 'This action is restricted to System Administrators.' });
  }
  next();
}
// Applied: router.post('/inspections/:id/reopen', requireAdmin, reopenInspectionHandler);
//          router.get('/audit-logs', requireAdmin, listAuditLogsHandler);
```

## 8.11 Client-Creation Picklist Seeding — v3 (FR-11.1)

```typescript
// apps/api-server/src/services/clientOnboarding.ts
const DEFAULT_COMPONENT_TYPES = ['Support Frame', 'Bolted Connection', 'Welded Joint', 'Corrosion Protection Coating', 'Foundation/Footing', 'Handrail/Guardrail'];
const DEFAULT_WORK_TYPES = ['On-Site Inspection', 'Travel', 'Report Writing', 'Client Meeting'];

export async function seedDefaultPicklists(client: Pool, clientId: string) {
  for (const name of DEFAULT_COMPONENT_TYPES) {
    await client.query(`INSERT INTO component_types (client_id, name) VALUES ($1, $2)`, [clientId, name]);
  }
  for (const name of DEFAULT_WORK_TYPES) {
    await client.query(`INSERT INTO work_types (client_id, name) VALUES ($1, $2)`, [clientId, name]);
  }
}
// Called inside the same transaction as POST /clients, so a client never exists without its starter picklists.
```

## 8.12 Background Jobs

- All jobs live in `apps/api-server/src/jobs/`, each a function that takes a `Pool`
- Scheduled via `node-cron` (in-process) when running single-instance, or via an external scheduler hitting an internal endpoint when multi-instance
- Every job is **idempotent** — re-running produces the same observable state
- Job failures are logged, not thrown — one schedule's failure does not abort the run
- `LEAD_TIME_DAYS` and similar tunables live in `apps/api-server/src/config/jobs.ts` — never hardcoded inside a job
