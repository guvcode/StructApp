import { deficiencySyncSchema, type SyncPushInput, type DeficiencySyncInput } from '../contracts/sync';
import { pool } from '../lib/db';
import { calculateGlencoreRisk } from '../utils/riskCalculator';
import { uploadToCloudinary } from './cloudinary';
import { enqueueNotification } from './notificationQueue';

export type SyncPushResult = {
  synced_deficiencies: Array<{ local_id: string; server_id: string }>;
  errors: Array<{ local_id: string; message: string }>;
};

export async function notifyP1AfterCommit(
  clientId: string,
  p1Deficiencies: Array<{ deficiency_id: string; component: string }>
): Promise<void> {
  for (const def of p1Deficiencies) {
    try {
      await enqueueNotification('p1_deficiency', { client_id: clientId, component: def.component });
    } catch {
      // Fire-and-forget: queue failure should not affect sync response
    }
  }
}

export async function processSyncPush(
  clientId: string,
  input: SyncPushInput
): Promise<SyncPushResult> {
  const client = await pool.connect();
  const p1Deficiencies: Array<{ deficiency_id: string; component: string }> = [];

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const results: SyncPushResult = {
      synced_deficiencies: [],
      errors: [],
    };

    for (const deficiency of input.deficiencies) {
      try {
        const parsed = deficiencySyncSchema.safeParse(deficiency);
        if (!parsed.success) {
          results.errors.push({
            local_id: deficiency.client_local_id,
            message: parsed.error.message,
          });
          continue;
        }

        const data = parsed.data as DeficiencySyncInput;
        let tier: string;
        let riskRank: number | null = null;
        let riskRating: string | null = null;

        if (data.consequence_severity && data.likelihood) {
          const result = calculateGlencoreRisk(
            data.consequence_severity as 1 | 2 | 3 | 4 | 5,
            data.likelihood as 'A' | 'B' | 'C' | 'D' | 'E'
          );
          riskRank = result.riskRank;
          riskRating = result.riskRating;
          tier = data.priority_rating ?? 'P3';
        } else if (data.severity && data.probability && data.consequences) {
          tier = 'P3';
        } else {
          tier = 'P3';
        }

        const insCheck = await client.query(
          'SELECT inspection_mode FROM inspections WHERE inspection_id = $1 AND client_id = $2',
          [data.inspection_id, clientId]
        );
        if (insCheck.rowCount === 0) {
          results.errors.push({
            local_id: data.client_local_id,
            message: 'Inspection not found or not accessible',
          });
          continue;
        }

        const inspectionMode = insCheck.rows[0].inspection_mode;

        const result = await client.query(
          `INSERT INTO deficiency_records
             (inspection_id, client_id, previous_deficiency_id, component_type_id, component_notes,
              description, severity, probability, consequences, gps_latitude, gps_longitude, calculated_priority,
              category, equipment_type, component, sub_component, focus_area, deficiency_category, detailed_description, mechanisms,
              vibration_present, ndt_required, further_investigation_required, recommended_action,
              consequence_severity, likelihood, most_affected_consequence, risk_rank, risk_rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                   $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
           RETURNING deficiency_id, calculated_priority`,
          [
            data.inspection_id,
            clientId,
            data.previous_deficiency_id,
            data.component_type_id,
            data.component_notes,
            data.description,
            data.severity ?? null,
            data.probability ?? null,
            data.consequences ?? null,
            data.gps_latitude,
            data.gps_longitude,
            tier,
            data.category ?? null,
            data.equipment_type ?? null,
            data.component ?? null,
            data.sub_component ?? null,
            data.focus_area ?? null,
            data.deficiency_category ?? null,
            data.detailed_description ?? null,
            data.mechanisms ?? null,
            data.vibration_present ?? null,
            data.ndt_required ?? null,
            data.further_investigation_required ?? null,
            data.recommended_action ?? null,
            data.consequence_severity ?? null,
            data.likelihood ?? null,
            data.most_affected_consequence ?? null,
            riskRank,
            riskRating,
          ]
        );

        const deficiencyId = result.rows[0].deficiency_id;
        const calculatedPriority = result.rows[0].calculated_priority;

        if (calculatedPriority === 'P1') {
          p1Deficiencies.push({
            deficiency_id: deficiencyId,
            component: data.component_notes || 'Unknown',
          });
        }

        results.synced_deficiencies.push({
          local_id: data.client_local_id,
          server_id: deficiencyId,
        });
      } catch (err) {
        results.errors.push({
          local_id: deficiency.client_local_id,
          message: (err as Error).message,
        });
      }
    }

    if (results.errors.length > 0) {
      await client.query('ROLLBACK');
      results.synced_deficiencies = [];
      return results;
    }

    await client.query('COMMIT');

    // P1 notification - fire-and-forget after-commit hook
    setImmediate(() => notifyP1AfterCommit(clientId, p1Deficiencies));

    return results;
  } finally {
    client.release();
  }
}

// Lightweight sync state query (GET /sync/state)

export async function getSyncState(
  clientId: string,
  userId: string
): Promise<{ lastSync: string | null; pendingCount: number; status: string }> {
  const [lastSyncResult, pendingResult] = await Promise.all([
    pool.query(
      `SELECT created_at FROM sync_log
       WHERE client_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [clientId, userId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM deficiency_records
       WHERE client_id = $1 AND triage_state = 'New'`,
      [clientId],
    ),
  ]);

  const count = pendingResult.rows[0]?.count ?? 0;

  return {
    lastSync: lastSyncResult.rows[0]?.created_at
      ? new Date(lastSyncResult.rows[0].created_at).toISOString()
      : null,
    pendingCount: count,
    status: count > 0 ? 'pending' : 'synced',
  };
}

export async function logSyncAction(
  clientId: string,
  userId: string,
  action: 'push' | 'pull',
  itemCount: number = 0,
): Promise<void> {
  await pool.query(
    `INSERT INTO sync_log (client_id, user_id, action, item_count, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [clientId, userId, action, itemCount],
  );
}

// Photo / Cloudinary streaming pipeline (INT-303)

export async function processSyncPull(
  clientId: string,
  _input: { last_sync_at?: string }
): Promise<{
  structures: Array<{ structure_id: string; asset_tag: string; description: string; qr_code_value: string | null }>;
  sites: Array<{ site_id: string; name: string; project_id: string }>;
  projects: Array<{ project_id: string; title: string; type: string }>;
  component_types: Array<{ component_type_id: string; name: string }>;
  work_types: Array<{ work_type_id: string; name: string }>;
  taxonomy: Array<{
    node_id: string; parent_id: string | null; level: string;
    category: string; label: string; display_order: number; is_active: boolean;
  }>;
  inspections: Array<{
    inspection_id: string; structure_id: string | null; site_id: string;
    client_id: string; inspector_id: string; assigned_by: string;
    status: string; scheduled_date: string | null; created_at: string;
    submitted_at: string | null; updated_at: string; returned_reason: string | null;
    approved_by: string | null; approved_at: string | null;
  }>;
  deficiencies: Array<{
    deficiency_id: string; inspection_id: string; client_id: string;
    description: string; calculated_priority: string; category: string | null;
    equipment_type: string | null; component: string | null;
    sub_component: string | null; focus_area: string | null;
    deficiency_category: string | null; detailed_description: string | null;
    mechanisms: string | null; recommended_action: string | null;
    consequence_severity: number | null; likelihood: string | null;
    risk_rank: number | null; risk_rating: string | null;
    created_at: string; updated_at: string;
  }>;
}> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const [structuresResult, sitesResult, projectsResult, componentTypesResult, workTypesResult, taxonomyResult, inspectionsResult, deficienciesResult] = await Promise.all([
      client.query('SELECT structure_id, asset_tag, description, qr_code_value FROM structures WHERE client_id = $1', [clientId]),
      client.query('SELECT site_id, name, project_id FROM sites WHERE client_id = $1', [clientId]),
      client.query('SELECT project_id, title, type FROM projects WHERE client_id = $1', [clientId]),
      client.query('SELECT component_type_id, name FROM component_types WHERE client_id = $1 AND is_active = TRUE', [clientId]),
      client.query('SELECT work_type_id, name FROM work_types WHERE client_id = $1 AND is_active = TRUE', [clientId]),
      client.query('SELECT node_id, parent_id, level, category, label, display_order, is_active FROM deficiency_taxonomy WHERE client_id = $1 AND is_active = TRUE ORDER BY display_order, label', [clientId]),
      client.query(
        `SELECT inspection_id, structure_id, site_id, client_id, inspector_id,
                assigned_by, status, scheduled_date, created_at, submitted_at,
                updated_at, returned_reason, approved_by, approved_at
         FROM inspections
         WHERE client_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [clientId]
      ),
      client.query(
        `SELECT d.deficiency_id, d.inspection_id, d.client_id, d.description,
                d.calculated_priority, d.category, d.equipment_type, d.component, d.sub_component, d.focus_area,
                d.deficiency_category, d.detailed_description, d.mechanisms,
                d.recommended_action, d.consequence_severity, d.likelihood,
                d.risk_rank, d.risk_rating, d.created_at, d.updated_at
         FROM deficiency_records d
         JOIN (
           SELECT inspection_id FROM inspections
           WHERE client_id = $1
           ORDER BY created_at DESC
           LIMIT 20
         ) i ON d.inspection_id = i.inspection_id
         WHERE d.client_id = $1`,
        [clientId]
      ),
    ]);

    await client.query('COMMIT');
    return {
      structures: structuresResult.rows,
      sites: sitesResult.rows,
      projects: projectsResult.rows,
      component_types: componentTypesResult.rows,
      work_types: workTypesResult.rows,
      taxonomy: taxonomyResult.rows,
      inspections: inspectionsResult.rows,
      deficiencies: deficienciesResult.rows,
    };
  } finally {
    client.release();
  }
}

export async function processPhotoUpload(
  clientId: string,
  deficiencyId: string,
  fileData: Buffer,
  originalFilename: string,
  purpose: string = 'deficiency_evidence',
  exif?: {
    original_filename: string;
    captured_at: string;
    camera_make?: string;
    camera_model?: string;
    raw_exif_payload: string;
  }
): Promise<{ photo_id: string; storage_url: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const infoResult = await client.query(
      `SELECT i.inspection_id, c.name AS client_name
       FROM deficiency_records d
       JOIN inspections i ON d.inspection_id = i.inspection_id
       JOIN clients c ON i.client_id = c.client_id
       WHERE d.deficiency_id = $1 AND i.client_id = $2`,
      [deficiencyId, clientId]
    );
    if (infoResult.rowCount === 0) {
      throw new Error('DEFICIENCY_NOT_FOUND');
    }

    const { inspection_id, client_name } = infoResult.rows[0];
    const clientSlug = client_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const storageUrl = await uploadToCloudinary(fileData, clientSlug, inspection_id, deficiencyId, purpose);
    const photoResult = await client.query(
      'INSERT INTO photos (deficiency_id, storage_url, caption) VALUES ($1, $2, \'\') RETURNING photo_id',
      [deficiencyId, storageUrl]
    );

    if (exif) {
      await client.query(
        `INSERT INTO photo_evidence_metadata (photo_id, original_filename, captured_at, camera_make, camera_model, raw_exif_payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          photoResult.rows[0].photo_id,
          exif.original_filename,
          exif.captured_at,
          exif.camera_make || null,
          exif.camera_model || null,
          exif.raw_exif_payload,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO photo_evidence_metadata (photo_id, original_filename, captured_at, raw_exif_payload) VALUES ($1, $2, NOW(), '{}')`,
        [photoResult.rows[0].photo_id, originalFilename]
      );
    }

    await client.query('COMMIT');
    return {
      photo_id: photoResult.rows[0].photo_id,
      storage_url: storageUrl,
    };
  } finally {
    client.release();
  }
}