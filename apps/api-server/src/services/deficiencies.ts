import { pool } from '../lib/db';

export interface DeficiencyRow {
  deficiency_id: string;
  inspection_id: string;
  client_id: string;
  structure_id: string;
  description: string;
  calculated_priority: string;
  category: string | null;
  equipment_type: string | null;
  component: string | null;
  sub_component: string | null;
  focus_area: string | null;
  deficiency_category: string | null;
  detailed_description: string | null;
  mechanisms: string | null;
  vibration_present: boolean | null;
  ndt_required: boolean | null;
  further_investigation_required: boolean | null;
  recommended_action: string | null;
  consequence_severity: number | null;
  likelihood: string | null;
  most_affected_consequence: string | null;
  priority_tier: string | null;
  risk_rank: number | null;
  risk_rating: string | null;
  remediation_status: string | null;
  component_notes: string | null;
  location_desc: string | null;
  created_at: string;
  updated_at: string;
}

export async function listDeficienciesByInspection(
  inspectionId: string,
  clientId: string
): Promise<DeficiencyRow[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      `SELECT *, deficiency_id AS id FROM deficiency_records WHERE inspection_id = $1 ORDER BY created_at ASC`,
      [inspectionId]
    );
    await client.query('COMMIT');
    return result.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getDeficiencyById(
  deficiencyId: string,
  clientId: string
): Promise<DeficiencyRow | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      'SELECT *, deficiency_id AS id FROM deficiency_records WHERE deficiency_id = $1',
      [deficiencyId]
    );
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createDeficiency(
  inspectionId: string,
  clientId: string,
  userId: string,
  data: Record<string, unknown>
): Promise<DeficiencyRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      `INSERT INTO deficiency_records (
        inspection_id, client_id, structure_id, created_by, description,
        category, equipment_type, component, sub_component, focus_area, deficiency_category,
        detailed_description, mechanisms, vibration_present, ndt_required,
        further_investigation_required, recommended_action,
        consequence_severity, likelihood, most_affected_consequence,
        priority_tier, risk_rank, risk_rating, calculated_priority,
        component_notes, location_desc
      ) VALUES (
        $1, $2,
        (SELECT structure_id FROM inspections WHERE inspection_id = $1),
        $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16,
        $17, $18, $19,
        $20, $21, $22,
        COALESCE($20::VARCHAR, $23),
        $24, $25
      ) RETURNING *, deficiency_id AS id`,
      [
        inspectionId,
        clientId,
        userId,
        data.description || '',
        data.category || null,
        data.equipment_type || null,
        data.component || null,
        data.sub_component || null,
        data.focus_area || null,
        data.deficiency_category || null,
        data.detailed_description || null,
        data.mechanisms || null,
        data.vibration_present ?? null,
        data.ndt_required ?? null,
        data.further_investigation_required ?? null,
        data.recommended_action || null,
        data.consequence_severity ?? null,
        data.likelihood || null,
        data.most_affected_consequence || null,
        data.priority_tier || null,
        data.risk_rank ?? null,
        data.risk_rating || null,
        data.calculated_priority || 'P3',
        data.component_notes || null,
        data.location_desc || null,
      ]
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

export async function updateDeficiency(
  deficiencyId: string,
  clientId: string,
  userId: string,
  data: Record<string, unknown>
): Promise<DeficiencyRow> {
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

    const allowedFields = [
      'description', 'category', 'equipment_type', 'component', 'sub_component', 'focus_area',
      'deficiency_category', 'detailed_description', 'mechanisms',
      'vibration_present', 'ndt_required', 'further_investigation_required',
      'recommended_action', 'consequence_severity', 'likelihood',
      'most_affected_consequence', 'priority_tier', 'risk_rank', 'risk_rating',
      'calculated_priority', 'component_notes', 'location_desc',
    ];
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = $${idx++}`);
        vals.push(data[field]);
      }
    }
    if (sets.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    vals.push(deficiencyId);
    const result = await client.query(
      `UPDATE deficiency_records SET ${sets.join(', ')}, updated_at = NOW() WHERE deficiency_id = $${idx} RETURNING *, deficiency_id AS id`,
      vals
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