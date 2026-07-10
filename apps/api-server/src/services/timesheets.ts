import { pool } from '../lib/db';

interface BatchEntryInput {
  work_type: string;
  hours: number;
  notes?: string;
  pre_inspection?: boolean;
}

export interface TimesheetEntryRow {
  id: string;
  user_id: string;
  project_id: string;
  inspection_id: string | null;
  client_id: string;
  work_type: string;
  hours: string;
  entry_date: string;
  pre_inspection: boolean;
  status: string;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  inspection_name: string | null;
}

export async function getTimesheetsForInspector(
  inspectorId: string,
  clientId: string
): Promise<TimesheetEntryRow[]> {
  const result = await pool.query(
    `SELECT 
      te.entry_id AS id,
      te.user_id,
      te.project_id,
      te.inspection_id,
      te.client_id,
      te.work_type,
      te.hours_logged AS hours,
      te.entry_date,
      te.pre_inspection,
      te.status,
      te.rejection_reason,
      te.approved_by,
      te.approved_at,
      te.created_at,
      te.updated_at,
      COALESCE(st.name, s.name) AS inspection_name
     FROM timesheet_entries te
     LEFT JOIN inspections i ON te.inspection_id = i.inspection_id
     LEFT JOIN structures s ON i.structure_id = s.structure_id
     LEFT JOIN sites st ON s.site_id = st.site_id
     WHERE te.user_id = $1 AND te.client_id = $2
     ORDER BY te.entry_date DESC, te.created_at DESC`,
    [inspectorId, clientId]
  );

  return result.rows as TimesheetEntryRow[];
}

export async function getTimesheetById(
  entryId: string,
  clientId: string
): Promise<TimesheetEntryRow | null> {
  const result = await pool.query(
    `SELECT 
      te.entry_id AS id,
      te.user_id,
      te.project_id,
      te.inspection_id,
      te.client_id,
      te.work_type,
      te.hours_logged AS hours,
      te.entry_date,
      te.pre_inspection,
      te.status,
      te.rejection_reason,
      te.approved_by,
      te.approved_at,
      te.created_at,
      te.updated_at
     FROM timesheet_entries te
     WHERE te.entry_id = $1 AND te.client_id = $2`,
    [entryId, clientId]
  );

  if (result.rowCount === 0) return null;
  return result.rows[0] as TimesheetEntryRow;
}

export async function updateTimesheet(
  entryId: string,
  clientId: string,
  userId: string,
  data: { work_type?: string; hours?: number; notes?: string; pre_inspection?: boolean }
): Promise<{ id: string; work_type: string; hours: string; notes: string | null; pre_inspection: boolean; status: string }> {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    await conn.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const current = await conn.query(
      'SELECT entry_id, status FROM timesheet_entries WHERE entry_id = $1 FOR UPDATE',
      [entryId]
    );
    if (current.rowCount === 0) throw new Error('TIMESHEET_NOT_FOUND');

    // Allow editing Submitted entries by reverting to Draft
    const currentStatus = current.rows[0].status;
    if (currentStatus !== 'Draft' && currentStatus !== 'Submitted') throw new Error('TIMESHEET_NOT_DRAFT');

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    if (data.work_type !== undefined) { sets.push(`work_type = $${idx++}`); vals.push(data.work_type); }
    if (data.hours !== undefined) { sets.push(`hours_logged = $${idx++}`); vals.push(data.hours); }
    if (data.notes !== undefined) { sets.push(`notes = $${idx++}`); vals.push(data.notes); }
    if (data.pre_inspection !== undefined) { sets.push(`pre_inspection = $${idx++}`); vals.push(data.pre_inspection); }
    // Revert to Draft if it was Submitted
    if (currentStatus === 'Submitted') { sets.push(`status = 'Draft'`); }
    if (sets.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    vals.push(entryId);
    const result = await conn.query(
      `UPDATE timesheet_entries SET ${sets.join(', ')}, updated_at = NOW() WHERE entry_id = $${idx} RETURNING entry_id AS id, work_type, hours_logged AS hours, notes, pre_inspection, status`,
      vals
    );
    await conn.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

export async function submitTimesheet(
  entryId: string,
  clientId: string,
  userId: string
): Promise<{ id: string; status: string }> {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    await conn.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const current = await conn.query(
      'SELECT entry_id, status FROM timesheet_entries WHERE entry_id = $1 FOR UPDATE',
      [entryId]
    );
    if (current.rowCount === 0) throw new Error('TIMESHEET_NOT_FOUND');
    if (current.rows[0].status !== 'Draft') throw new Error('TIMESHEET_NOT_DRAFT');

    const result = await conn.query(
      `UPDATE timesheet_entries SET status = 'Submitted', updated_at = NOW() WHERE entry_id = $1 RETURNING entry_id AS id, status`,
      [entryId]
    );
    await conn.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteTimesheet(
  entryId: string,
  clientId: string,
  userId: string
): Promise<void> {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    await conn.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const current = await conn.query(
      'SELECT entry_id, status FROM timesheet_entries WHERE entry_id = $1 FOR UPDATE',
      [entryId]
    );
    if (current.rowCount === 0) throw new Error('TIMESHEET_NOT_FOUND');
    if (current.rows[0].status !== 'Draft') throw new Error('TIMESHEET_NOT_DRAFT');

    await conn.query('DELETE FROM timesheet_entries WHERE entry_id = $1', [entryId]);
    await conn.query('COMMIT');
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

export async function createTimesheetBatch(
  userId: string,
  clientId: string,
  projectId: string,
  inspectionId: string | null,
  entryDate: string,
  entries: BatchEntryInput[]
): Promise<{
  entries: Array<{
    id: string;
    user_id: string;
    project_id: string;
    inspection_id: string | null;
    client_id: string;
    work_type: string;
    hours: string;
    notes: string | null;
    pre_inspection: boolean;
    entry_date: string;
    status: string;
    rejection_reason: null;
    approved_by: null;
    approved_at: null;
    created_at: string;
    updated_at: string;
  }>;
}> {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    await conn.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const baseParams = [userId, clientId, projectId, inspectionId, entryDate];
    const entryParams: unknown[] = [];
    const valueClauses = entries.map((entry) => {
      const offset = entryParams.length;
      entryParams.push(entry.work_type, entry.hours, entry.notes ?? null, entry.pre_inspection ?? false);
      return `($1, $2, $3, $4, $5, $${6 + offset}, $${6 + offset + 1}, $${6 + offset + 2}, $${6 + offset + 3}, 'Draft')`;
    });

    const result = await conn.query(
      `INSERT INTO timesheet_entries
         (user_id, client_id, project_id, inspection_id, entry_date, work_type, hours_logged, notes, pre_inspection, status)
       VALUES ${valueClauses.join(', ')}
       RETURNING entry_id AS id, user_id, project_id, inspection_id, client_id, work_type,
                 hours_logged AS hours, notes, pre_inspection, entry_date, status,
                 rejection_reason, approved_by, approved_at, created_at, updated_at`,
      [...baseParams, ...entryParams]
    );

    await conn.query('COMMIT');
    return { entries: result.rows as any };
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}
