import { pool } from '../lib/db';

export async function updateRemediationStatus(
  deficiencyId: string,
  clientId: string,
  userId: string,
  remediationStatus: 'Remediation_Scheduled' | 'Remediated_Pending_Verification',
  remediationDueDate?: string | null
): Promise<{ deficiency_id: string; remediation_status: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT remediation_status FROM deficiency_records WHERE deficiency_id = $1 FOR UPDATE',
      [deficiencyId]
    );

    if (current.rowCount === 0) {
      throw new Error('DEFICIENCY_NOT_FOUND');
    }

    const result = await client.query(
      `UPDATE deficiency_records SET remediation_status = $1, remediation_due_date = $2 WHERE deficiency_id = $3 RETURNING deficiency_id, remediation_status`,
      [remediationStatus, remediationDueDate || null, deficiencyId]
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

export async function verifyClosure(
  deficiencyId: string,
  clientId: string,
  userId: string
): Promise<{ deficiency_id: string; remediation_status: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const evidence = await client.query(
      `SELECT 1 FROM photos WHERE deficiency_id = $1 AND purpose = 'remediation_evidence' LIMIT 1`,
      [deficiencyId]
    );

    if (evidence.rowCount === 0) {
      throw new Error('MISSING_REMEDIATION_EVIDENCE');
    }

    const result = await client.query(
      `UPDATE deficiency_records SET remediation_status = 'Verified_Closed', verified_closed_by = $1, verified_closed_at = NOW() WHERE deficiency_id = $2 RETURNING deficiency_id, remediation_status`,
      [userId, deficiencyId]
    );

    if (result.rowCount === 0) {
      throw new Error('DEFICIENCY_NOT_FOUND');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateComponentNotes(
  deficiencyId: string,
  clientId: string,
  componentNotes: string
): Promise<{ deficiency_id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT deficiency_id FROM deficiency_records WHERE deficiency_id = $1 FOR UPDATE',
      [deficiencyId]
    );
    if (current.rowCount === 0) throw new Error('DEFICIENCY_NOT_FOUND');

    const result = await client.query(
      `UPDATE deficiency_records SET component_notes = $1 WHERE deficiency_id = $2 RETURNING deficiency_id`,
      [componentNotes, deficiencyId]
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