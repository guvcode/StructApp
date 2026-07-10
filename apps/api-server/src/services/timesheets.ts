import { pool } from '../lib/db';

interface BatchEntryInput {
  work_type: string;
  hours: number;
  notes?: string;
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
  inspection_scheduled_date: string | null;
  inspection_assigned_at: string | null;
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
      te.status,
      te.rejection_reason,
      te.approved_by,
      te.approved_at,
      te.created_at,
      te.updated_at,
      i.scheduled_date AS inspection_scheduled_date,
      i.assigned_at AS inspection_assigned_at
     FROM timesheet_entries te
     LEFT JOIN inspections i ON te.inspection_id = i.inspection_id
     WHERE te.user_id = $1 AND te.client_id = $2
     ORDER BY te.entry_date DESC, te.created_at DESC`,
    [inspectorId, clientId]
  );

  const rows = result.rows as Omit<TimesheetEntryRow, 'pre_inspection'>[];

  return rows.map((row) => ({
    ...row,
    pre_inspection: derivePreInspection(row),
  }));
}

function derivePreInspection(row: Omit<TimesheetEntryRow, 'pre_inspection'>): boolean {
  if (!row.inspection_id || !row.entry_date) {
    return false;
  }

  const entryDate = new Date(row.entry_date + 'T00:00:00Z');

  if (row.inspection_scheduled_date) {
    const scheduledDate = new Date(row.inspection_scheduled_date + 'T00:00:00Z');
    return entryDate < scheduledDate;
  }

  if (row.inspection_assigned_at) {
    const assignedDate = new Date(row.inspection_assigned_at + 'T00:00:00Z');
    return entryDate < assignedDate;
  }

  return false;
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
      te.status,
      te.rejection_reason,
      te.approved_by,
      te.approved_at,
      te.created_at,
      te.updated_at,
      i.scheduled_date AS inspection_scheduled_date,
      i.assigned_at AS inspection_assigned_at
     FROM timesheet_entries te
     LEFT JOIN inspections i ON te.inspection_id = i.inspection_id
     WHERE te.entry_id = $1 AND te.client_id = $2`,
    [entryId, clientId]
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0] as Omit<TimesheetEntryRow, 'pre_inspection'>;
  return { ...row, pre_inspection: derivePreInspection(row) };
}

export async function updateTimesheet(
  entryId: string,
  clientId: string,
  userId: string,
  data: { work_type?: string; hours?: number; description?: string }
): Promise<{ id: string; work_type: string; hours: string }> {
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

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    if (data.work_type !== undefined) { sets.push(`work_type = $${idx++}`); vals.push(data.work_type); }
    if (data.hours !== undefined) { sets.push(`hours_logged = $${idx++}`); vals.push(data.hours); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(data.description); }
    if (sets.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    vals.push(entryId);
    const result = await conn.query(
      `UPDATE timesheet_entries SET ${sets.join(', ')}, updated_at = NOW() WHERE entry_id = $${idx} RETURNING entry_id AS id, work_type, hours_logged AS hours`,
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
    description: string | null;
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
      entryParams.push(entry.work_type, entry.hours, entry.notes ?? null);
      return `($1, $2, $3, $4, $5, $${6 + offset}, $${6 + offset + 1}, $${6 + offset + 2}, 'Draft')`;
    });

    const result = await conn.query(
      `INSERT INTO timesheet_entries
         (user_id, client_id, project_id, inspection_id, entry_date, work_type, hours_logged, description, status)
       VALUES ${valueClauses.join(', ')}
       RETURNING entry_id AS id, user_id, project_id, inspection_id, client_id, work_type,
                 hours_logged AS hours, description, entry_date, status,
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
