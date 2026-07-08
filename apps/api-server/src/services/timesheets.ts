import { pool } from '../lib/db';

interface BatchEntryInput {
  work_type: string;
  hours: number;
  notes?: string;
}

export interface TimesheetEntryRow {
  entry_id: string;
  user_id: string;
  project_id: string;
  inspection_id: string | null;
  client_id: string;
  work_type: string;
  hours_logged: string;
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
      te.entry_id,
      te.user_id,
      te.project_id,
      te.inspection_id,
      te.client_id,
      te.work_type,
      te.hours_logged,
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

export async function createTimesheetBatch(
  userId: string,
  clientId: string,
  entryDate: string,
  entries: BatchEntryInput[]
): Promise<{ count: number }> {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    let count = 0;
    for (const entry of entries) {
      await conn.query(
        `INSERT INTO timesheet_entries (user_id, client_id, entry_date, work_type, hours_logged, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Draft')`,
        [userId, clientId, entryDate, entry.work_type, entry.hours, entry.notes ?? null]
      );
      count++;
    }
    await conn.query('COMMIT');
    return { count };
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}
