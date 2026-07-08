import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { enqueueNotification } from './notificationQueue';

export async function approveInspection(
  inspectionId: string,
  approverUserId: string,
  clientId: string
): Promise<{ inspection_id: string; status: string; approved_at: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');

    const inspection = current.rows[0];
    if (inspection.status === 'Approved') throw new Error('ALREADY_APPROVED');

    const p1Deficiencies = await client.query(
      `SELECT d.deficiency_id, p.photo_id
       FROM deficiency_records d
       LEFT JOIN photos p ON p.deficiency_id = d.deficiency_id AND p.purpose = 'remediation_evidence'
       WHERE d.inspection_id = $1 AND d.calculated_priority = 'P1'`,
      [inspectionId]
    );

    for (const def of p1Deficiencies.rows) {
      if (!def.photo_id) throw new Error('MISSING_REMEDIATION_EVIDENCE');
    }

    const result = await client.query(
      `UPDATE inspections SET status = 'Approved', approved_by = $1, approved_at = NOW()
       WHERE inspection_id = $2 RETURNING inspection_id, status, approved_at`,
      [approverUserId, inspectionId]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'APPROVE', to_jsonb($2::json), to_jsonb($3::json), $4)`,
      [inspectionId, { status: inspection.status }, { status: 'Approved', approved_by: approverUserId, approved_at: new Date().toISOString() }, approverUserId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function returnInspection(
  inspectionId: string,
  returnedReason: string,
  returnerUserId: string,
  clientId: string
): Promise<{ inspection_id: string; status: string; returned_at: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');

    const inspection = current.rows[0];
    if (inspection.status === 'Approved') throw new Error('INSPECTION_APPROVED_USE_REOPEN');
    if (inspection.status === 'Returned') throw new Error('ALREADY_RETURNED');

    const result = await client.query(
      `UPDATE inspections SET status = 'Returned', returned_reason = $1, approved_by = NULL, approved_at = NULL
       WHERE inspection_id = $2 RETURNING inspection_id, status`,
      [returnedReason, inspectionId]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'RETURN', to_jsonb($2::json), to_jsonb($3::json), $4)`,
      [inspectionId, { status: inspection.status }, { status: 'Returned', returned_reason: returnedReason }, returnerUserId]
    );

    await client.query('COMMIT');

    try {
      await enqueueNotification('inspection_returned', {
        inspection_id: inspectionId,
        inspector_id: inspection.inspector_id,
        returned_reason: returnedReason,
      });
    } catch (enqueueErr) {
      logger.warn({ err: enqueueErr }, 'Failed to enqueue inspection_returned notification');
    }

    return { inspection_id: inspectionId, status: 'Returned', returned_at: new Date().toISOString() };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function reopenInspection(
  inspectionId: string,
  targetStatus: 'Submitted' | 'Returned',
  reason: string,
  reopenerUserId: string,
  clientId: string
): Promise<{ inspection_id: string; status: string; reopened_at: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');

    const inspection = current.rows[0];
    if (inspection.status !== 'Approved') throw new Error('NOT_APPROVED');

    const result = await client.query(
      `UPDATE inspections SET status = $1, reopened_at = NOW(), reopen_reason = $2, reopened_by = $3, approved_by = NULL, approved_at = NULL
       WHERE inspection_id = $4 RETURNING inspection_id, status, reopened_at`,
      [targetStatus, reason, reopenerUserId, inspectionId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function submitInspection(
  inspectionId: string,
  inspectorId: string,
  clientId: string,
  noDeficienciesFound: boolean
): Promise<{ inspection_id: string; status: string; submitted_at: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');

    const inspection = current.rows[0];
    if (inspection.inspector_id !== inspectorId) throw new Error('NOT_ASSIGNED');
    if (inspection.status !== 'Assigned' && inspection.status !== 'In Progress') throw new Error('INVALID_STATUS');

    if (!noDeficienciesFound) {
      const deficiencyCheck = await client.query('SELECT 1 FROM deficiency_records WHERE inspection_id = $1 LIMIT 1', [inspectionId]);
      if (deficiencyCheck.rowCount === 0) throw new Error('NO_DEFICIENCIES_OR_FLAG');

      const criticalWithoutPhotos = await client.query(
        `SELECT d.deficiency_id FROM deficiency_records d
         LEFT JOIN photos p ON p.deficiency_id = d.deficiency_id
         WHERE d.inspection_id = $1 AND d.calculated_priority IN ('P1', 'P2')
         AND p.photo_id IS NULL LIMIT 1`,
        [inspectionId]
      );
      if (criticalWithoutPhotos.rowCount && criticalWithoutPhotos.rowCount > 0) throw new Error('MISSING_PHOTO_CRITICAL');
    }

    const result = await client.query(
      `UPDATE inspections SET status = 'Submitted', submitted_at = NOW() WHERE inspection_id = $1 RETURNING inspection_id, status, submitted_at`,
      [inspectionId]
    );

    const reviewers = await client.query(
      `SELECT u.email FROM users u JOIN client_memberships cm ON u.user_id = cm.user_id
       WHERE cm.client_id = $1 AND u.role IN ('Admin', 'Reviewer') AND u.is_active = TRUE`,
      [clientId]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'SUBMIT', to_jsonb($2::json), to_jsonb($3::json), $4)`,
      [inspectionId, { status: inspection.status }, { status: 'Submitted' }, inspectorId]
    );

    await client.query('COMMIT');

    try {
      const reviewerIds = reviewers.rows.map(r => r.email);
      await enqueueNotification('inspection_submitted', { reviewer_emails: reviewerIds });
    } catch (enqueueErr) {
      logger.warn({ err: enqueueErr }, 'Failed to enqueue inspection_submitted notification');
    }

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}