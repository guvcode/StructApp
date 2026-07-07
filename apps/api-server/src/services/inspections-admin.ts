import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { notifyInspectionAssigned, notifyInspectionReassigned, resendAdapter } from './notifications';

export async function createInspection(
  structureId: string,
  inspectorId: string,
  assignedBy: string,
  clientId: string,
  inspectionMode: string = 'onsite'
): Promise<{ inspection_id: string; status: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      `INSERT INTO inspections (structure_id, inspector_id, assigned_by, assigned_at, status, client_id, inspection_mode)
       VALUES ($1, $2, $3, NOW(), 'Assigned', $4, $5) RETURNING inspection_id, status`,
      [structureId, inspectorId, assignedBy, clientId, inspectionMode]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'CREATE', NULL, to_jsonb($2::json), $3)`,
      [result.rows[0].inspection_id, { status: 'Assigned', inspector_id: inspectorId }, assignedBy]
    );

    await client.query('COMMIT');

    const inspector = await client.query('SELECT email FROM users WHERE user_id = $1', [inspectorId]);
    if (inspector.rows.length > 0) {
      await notifyInspectionAssigned(resendAdapter, { email: inspector.rows[0].email }, { asset_tag: structureId });
    }

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rescheduleInspection(
  inspectionId: string,
  scheduledDate: string,
  reschedulerUserId: string,
  clientId: string
): Promise<{ inspection_id: string; scheduled_date: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT status, scheduled_date FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');
    const inspection = current.rows[0];
    if (inspection.status === 'Approved') throw new Error('INSPECTION_APPROVED_USE_REOPEN');

    const result = await client.query(
      `UPDATE inspections SET scheduled_date = $1 WHERE inspection_id = $2 RETURNING inspection_id, scheduled_date`,
      [scheduledDate, inspectionId]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'RESCHEDULE', to_jsonb($2::json), to_jsonb($3::json), $4)`,
      [inspectionId, { scheduled_date: inspection.scheduled_date }, { scheduled_date: scheduledDate }, reschedulerUserId]
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

export async function reassignInspection(
  inspectionId: string,
  inspectorId: string,
  reason: string,
  reassignerUserId: string,
  clientId: string
): Promise<{ inspection_id: string; inspector_id: string }> {
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

    const userCheck = await client.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active = TRUE', [inspectorId]);
    if (userCheck.rowCount === 0) throw new Error('TARGET_INSPECTOR_INVALID');
    if (inspection.inspector_id === inspectorId) throw new Error('SOURCE_EQUALS_TARGET');

    const result = await client.query(
      `UPDATE inspections SET inspector_id = $1 WHERE inspection_id = $2 RETURNING inspection_id, inspector_id`,
      [inspectorId, inspectionId]
    );

    await client.query(
      `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ('inspections', $1::uuid, 'REASSIGN', to_jsonb($2::json), to_jsonb($3::json), $4)`,
      [inspectionId, { inspector_id: inspection.inspector_id }, { inspector_id: inspectorId, reason }, reassignerUserId]
    );

    await client.query('COMMIT');

    const inspectionDetails = await client.query(
      `SELECT s.structure_id, i.scheduled_date FROM inspections i
       JOIN structures s ON i.structure_id = s.structure_id WHERE i.inspection_id = $1`,
      [inspectionId]
    );

    if (inspectionDetails.rows.length > 0) {
      await notifyInspectionReassigned(resendAdapter, inspection.inspector_id, {
        structureId: inspectionDetails.rows[0].structure_id,
        scheduledDate: inspectionDetails.rows[0].scheduled_date,
        reason,
      });
    }

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateInspectionMode(
  inspectionId: string,
  newMode: 'onsite' | 'post_inspection',
  clientId: string
): Promise<{ inspection_id: string; inspection_mode: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT inspection_id FROM inspections WHERE inspection_id = $1 FOR UPDATE',
      [inspectionId]
    );

    if (current.rowCount === 0) throw new Error('INSPECTION_NOT_FOUND');

    const deficiencyCount = await client.query(
      'SELECT COUNT(*) AS count FROM deficiency_records WHERE inspection_id = $1',
      [inspectionId]
    );

    if (Number(deficiencyCount.rows[0].count) > 0) throw new Error('MODE_LOCKED_DEFICIENCIES_EXIST');

    const result = await client.query(
      `UPDATE inspections SET inspection_mode = $1 WHERE inspection_id = $2 RETURNING inspection_id, inspection_mode`,
      [newMode, inspectionId]
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