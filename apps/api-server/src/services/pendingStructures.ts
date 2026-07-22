import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { uploadToCloudinary } from './cloudinary';
import { enqueueNotification } from './notificationQueue';
import {
  type SubmitPendingStructureInput,
  type PendingDeficiencyInput,
  type PendingPhotoInput,
  type PendingStructureApproveInput,
  submitPendingStructureSchema,
  pendingStructureApproveSchema,
  pendingDeficiencySchema,
  pendingPhotoSchema,
} from '../contracts/pendingStructures';

export type PendingStructureRow = {
  pending_structure_id: string;
  local_id: string;
  site_id: string;
  client_id: string;
  contractor_id: string;
  asset_tag: string;
  description: string;
  qr_code_value: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingDeficiencyRow = {
  pending_deficiency_id: string;
  pending_structure_id: string;
  local_id: string;
  category: string | null;
  equipment_type: string | null;
  component: string | null;
  sub_component: string | null;
  focus_area: string | null;
  deficiency_category: string | null;
  detailed_description: string | null;
  consequence_severity: number | null;
  likelihood: string | null;
  recommended_action: string | null;
  most_affected_consequence: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
};

export type PendingPhotoRow = {
  pending_photo_id: string;
  pending_structure_id: string;
  pending_deficiency_id: string | null;
  filename: string;
  storage_url: string | null;
  caption: string;
  display_order: number;
};

export type SubmitPendingStructureResult = {
  pending_structure_id: string;
  local_id: string;
  status: string;
  deficiencies_count: number;
  photos_count: number;
};

export async function submitPendingStructureBundle(
  contractorId: string,
  input: SubmitPendingStructureInput,
): Promise<SubmitPendingStructureResult> {
  const parsed = submitPendingStructureSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`VALIDATION_ERROR: ${parsed.error.message}`);
  }

  const data = parsed.data;

  const membershipResult = await pool.query(
    'SELECT 1 FROM client_memberships WHERE user_id = $1 AND client_id = $2',
    [contractorId, data.client_id],
  );
  if (membershipResult.rowCount === 0) {
    throw new Error('NOT_A_MEMBER');
  }

  const siteResult = await pool.query(
    'SELECT site_id FROM sites WHERE site_id = $1 AND client_id = $2',
    [data.site_id, data.client_id],
  );
  if (siteResult.rowCount === 0) {
    throw new Error('SITE_NOT_FOUND');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bundleResult = await client.query(
      `INSERT INTO pending_structures (local_id, site_id, client_id, contractor_id, asset_tag, description, qr_code_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING pending_structure_id, local_id, status`,
      [data.local_id, data.site_id, data.client_id, contractorId, data.asset_tag, data.description, data.qr_code_value || null],
    );
    const pendingStructureId = bundleResult.rows[0].pending_structure_id;

    let deficienciesInserted = 0;
    for (const def of data.deficiencies ?? []) {
      const parsedDef = pendingDeficiencySchema.safeParse(def);
      if (!parsedDef.success) continue;

      const d = parsedDef.data;
      await client.query(
        `INSERT INTO pending_structure_deficiencies
          (pending_structure_id, local_id, category, equipment_type, component, sub_component, focus_area,
           deficiency_category, detailed_description, consequence_severity, likelihood,
           recommended_action, most_affected_consequence, gps_latitude, gps_longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          pendingStructureId,
          d.local_id,
          d.category || null,
          d.equipment_type || null,
          d.component || null,
          d.sub_component || null,
          d.focus_area || null,
          d.deficiency_category || null,
          d.detailed_description || null,
          d.consequence_severity ?? null,
          d.likelihood || null,
          d.recommended_action || null,
          d.most_affected_consequence || null,
          d.gps_latitude ?? null,
          d.gps_longitude ?? null,
        ],
      );
      deficienciesInserted++;
    }

    let photosInserted = 0;
    for (const photo of data.photos ?? []) {
      const parsedPhoto = pendingPhotoSchema.safeParse(photo);
      if (!parsedPhoto.success) continue;

      const p = parsedPhoto.data;
      await client.query(
        `INSERT INTO pending_structure_photos (pending_structure_id, filename, data, caption, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [pendingStructureId, p.filename, p.data, p.caption || '', p.display_order ?? 0],
      );
      photosInserted++;
    }

    await client.query('COMMIT');

    logger.info({ msg: 'pending_structure_submitted', pendingStructureId, contractorId, clientId: data.client_id, assetTag: data.asset_tag, deficiencies: deficienciesInserted, photos: photosInserted });

    const reviewerRows = await pool.query(
      `SELECT u.email FROM users u
       JOIN client_memberships cm ON u.user_id = cm.user_id
       WHERE cm.client_id = $1 AND u.role IN ('Admin', 'Reviewer')`,
      [data.client_id],
    );
    const reviewerEmails = reviewerRows.rows.map((r: { email: string }) => r.email);
    if (reviewerEmails.length > 0) {
      try {
        await enqueueNotification('pending_structure_submitted', {
          reviewer_emails: reviewerEmails,
          asset_tag: data.asset_tag,
          pending_structure_id: pendingStructureId,
        });
      } catch (err) {
        logger.warn({ err }, 'Failed to enqueue pending_structure_submitted notification');
      }
    }

    return {
      pending_structure_id: pendingStructureId,
      local_id: bundleResult.rows[0].local_id,
      status: bundleResult.rows[0].status,
      deficiencies_count: deficienciesInserted,
      photos_count: photosInserted,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getPendingStructuresForReview(
  clientId?: string,
): Promise<PendingStructureRow[]> {
  let query = `SELECT pending_structure_id, local_id, site_id, client_id, contractor_id,
                      asset_tag, description, qr_code_value, status, rejection_reason,
                      reviewed_by, reviewed_at, created_at, updated_at
               FROM pending_structures
               WHERE status = 'pending'`;
  const params: unknown[] = [];
  if (clientId) {
    query += ' AND client_id = $1';
    params.push(clientId);
  }
  query += ' ORDER BY created_at ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getPendingStructureById(pendingStructureId: string): Promise<PendingStructureRow | null> {
  const result = await pool.query(
    `SELECT pending_structure_id, local_id, site_id, client_id, contractor_id,
            asset_tag, description, qr_code_value, status, rejection_reason,
            reviewed_by, reviewed_at, created_at, updated_at
     FROM pending_structures
     WHERE pending_structure_id = $1`,
    [pendingStructureId],
  );
  return result.rows[0] || null;
}

export async function getPendingDeficienciesForBundle(
  pendingStructureId: string,
): Promise<PendingDeficiencyRow[]> {
  const result = await pool.query(
    `SELECT pending_deficiency_id, pending_structure_id, local_id, category, equipment_type,
            component, sub_component, focus_area, deficiency_category, detailed_description,
            consequence_severity, likelihood, recommended_action, most_affected_consequence,
            gps_latitude, gps_longitude, created_at, updated_at
     FROM pending_structure_deficiencies
     WHERE pending_structure_id = $1
     ORDER BY created_at ASC`,
    [pendingStructureId],
  );
  return result.rows;
}

export async function getPendingPhotosForBundle(
  pendingStructureId: string,
): Promise<PendingPhotoRow[]> {
  const result = await pool.query(
    `SELECT pending_photo_id, pending_structure_id, pending_deficiency_id, filename, storage_url, caption, display_order
     FROM pending_structure_photos
     WHERE pending_structure_id = $1
     ORDER BY display_order ASC, created_at ASC`,
    [pendingStructureId],
  );
  return result.rows;
}

export async function approvePendingStructureBundle(
  pendingStructureId: string,
  reviewerId: string,
  overrides?: PendingStructureApproveInput,
): Promise<{ structure_id: string; inspection_id: string }> {
  const parsed = pendingStructureApproveSchema.safeParse(overrides ?? {});
  if (!parsed.success) {
    throw new Error(`VALIDATION_ERROR: ${parsed.error.message}`);
  }
  const fields = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const bundleResult = await client.query(
      'SELECT * FROM pending_structures WHERE pending_structure_id = $1 AND status = $2 FOR UPDATE',
      [pendingStructureId, 'pending'],
    );
    if (bundleResult.rowCount === 0) {
      throw new Error('PENDING_STRUCTURE_NOT_FOUND');
    }
    const bundle = bundleResult.rows[0];

    const assetTag = fields.identifier || bundle.asset_tag;
    const name = fields.name || bundle.asset_tag;
    const type = fields.type || 'Unknown';
    const identifier = fields.identifier || bundle.asset_tag;

    const structureResult = await client.query(
      `INSERT INTO structures (site_id, client_id, asset_tag, description, name, type, identifier, qr_code_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING structure_id`,
      [bundle.site_id, bundle.client_id, assetTag, bundle.description, name, type, identifier, bundle.qr_code_value],
    );
    const structureId = structureResult.rows[0].structure_id;

    const inspectionResult = await client.query(
      `INSERT INTO inspections (structure_id, client_id, inspector_id, assigned_by, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING inspection_id`,
      [structureId, bundle.client_id, bundle.contractor_id, reviewerId, 'Assigned'],
    );
    const inspectionId = inspectionResult.rows[0].inspection_id;

    const deficiencies = await client.query(
      'SELECT * FROM pending_structure_deficiencies WHERE pending_structure_id = $1 ORDER BY created_at ASC',
      [pendingStructureId],
    );

    for (const def of deficiencies.rows) {
      await client.query(
        `INSERT INTO deficiency_records
          (inspection_id, client_id, component, description, severity, probability, consequences,
           calculated_priority, category, equipment_type, component, sub_component, focus_area,
           deficiency_category, detailed_description, mechanisms, ndt_required,
           further_investigation_required, recommended_action, consequence_severity, likelihood,
           most_affected_consequence, risk_rank, risk_rating, triage_state, gps_latitude, gps_longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         RETURNING deficiency_id`,
        [
          inspectionId,
          bundle.client_id,
          def.component || 'General',
          def.detailed_description || bundle.description,
          def.consequence_severity ?? 3,
          3,
          3,
          'P3',
          def.category || null,
          def.equipment_type || null,
          def.component || null,
          def.sub_component || null,
          def.focus_area || null,
          def.deficiency_category || null,
          def.detailed_description || null,
          null,
          null,
          null,
          def.recommended_action || null,
          def.consequence_severity ?? null,
          def.likelihood || null,
          def.most_affected_consequence || null,
          null,
          null,
          'New',
          def.gps_latitude,
          def.gps_longitude,
        ],
      );
    }

    const photos = await client.query(
      'SELECT * FROM pending_structure_photos WHERE pending_structure_id = $1',
      [pendingStructureId],
    );

    for (const photo of photos.rows) {
      if (photo.storage_url) {
        const existingDef = deficiencies.rows[0];
        if (existingDef) {
          const insertedDefs = await client.query(
            'SELECT deficiency_id FROM deficiency_records WHERE inspection_id = $1 ORDER BY created_at ASC LIMIT 1',
            [inspectionId],
          );
          if (insertedDefs.rowCount! > 0) {
            const deficiencyId = insertedDefs.rows[0].deficiency_id;
            await client.query(
              'INSERT INTO photos (deficiency_id, storage_url, caption) VALUES ($1, $2, $3) RETURNING photo_id',
              [deficiencyId, photo.storage_url, photo.caption],
            );
          }
        }
      }
    }

    await client.query(
      `UPDATE pending_structures
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE pending_structure_id = $2`,
      [reviewerId, pendingStructureId],
    );

    await client.query(
      `UPDATE pending_structure_deficiencies
       SET updated_at = NOW()
       WHERE pending_structure_id = $1`,
      [pendingStructureId],
    );

    await client.query('COMMIT');

    logger.info({ msg: 'pending_structure_approved', pendingStructureId, structureId, inspectionId, reviewerId });

    const contractorEmailResult = await pool.query('SELECT email FROM users WHERE user_id = $1', [bundle.contractor_id]);
    const contractorEmail = contractorEmailResult.rows[0]?.email;
    if (contractorEmail) {
      try {
        await enqueueNotification('pending_structure_approved', {
          contractor_email: contractorEmail,
          asset_tag: bundle.asset_tag,
          structure_id: structureId,
        });
      } catch (err) {
        logger.warn({ err }, 'Failed to enqueue pending_structure_approved notification');
      }
    }

    return { structure_id: structureId, inspection_id: inspectionId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectPendingStructureBundle(
  pendingStructureId: string,
  reviewerId: string,
  rejectionReason: string,
): Promise<void> {
  const result = await pool.query(
    `UPDATE pending_structures
     SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE pending_structure_id = $3 AND status = 'pending'
     RETURNING pending_structure_id`,
    [rejectionReason, reviewerId, pendingStructureId],
  );

  if (result.rowCount === 0) {
    throw new Error('PENDING_STRUCTURE_NOT_FOUND');
  }

  const bundle = result.rows[0];

  const contractorEmailResult = await pool.query('SELECT email FROM users WHERE user_id = $1', [bundle.contractor_id]);
  const contractorEmail = contractorEmailResult.rows[0]?.email;
  if (contractorEmail) {
    try {
      await enqueueNotification('pending_structure_rejected', {
        contractor_email: contractorEmail,
        asset_tag: bundle.asset_tag,
        rejection_reason: rejectionReason,
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to enqueue pending_structure_rejected notification');
    }
  }

  logger.info({ msg: 'pending_structure_rejected', pendingStructureId, reviewerId });
}

export async function getContractorPendingStructures(
  contractorId: string,
  clientId: string,
): Promise<PendingStructureRow[]> {
  const result = await pool.query(
    `SELECT pending_structure_id, local_id, site_id, client_id, contractor_id,
            asset_tag, description, qr_code_value, status, rejection_reason,
            reviewed_by, reviewed_at, created_at, updated_at
     FROM pending_structures
     WHERE contractor_id = $1 AND client_id = $2
     ORDER BY created_at DESC`,
    [contractorId, clientId],
  );
  return result.rows;
}
