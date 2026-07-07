import { pool } from '../lib/db';

type ScheduleRow = {
  schedule_id: string;
  structure_id: string;
  client_id: string;
  default_inspector_id: string | null;
  recurrence_interval_days: number;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  structure_name: string | null;
  inspector_name: string | null;
};

export async function listSchedules(): Promise<ScheduleRow[]> {
  const result = await pool.query(
    `SELECT s.schedule_id, s.structure_id, s.client_id, s.default_inspector_id,
            s.recurrence_interval_days, s.next_due_date, s.is_active, s.created_at, s.updated_at,
            st.name as structure_name, u.display_name as inspector_name
     FROM inspection_schedules s
     LEFT JOIN structures st ON s.structure_id = st.structure_id
     LEFT JOIN users u ON s.default_inspector_id = u.user_id
     ORDER BY s.next_due_date ASC`,
  );
  return result.rows;
}

export async function getScheduleById(scheduleId: string): Promise<ScheduleRow | null> {
  const result = await pool.query(
    `SELECT s.schedule_id, s.structure_id, s.client_id, s.default_inspector_id,
            s.recurrence_interval_days, s.next_due_date, s.is_active, s.created_at, s.updated_at,
            st.name as structure_name, u.display_name as inspector_name
     FROM inspection_schedules s
     LEFT JOIN structures st ON s.structure_id = st.structure_id
     LEFT JOIN users u ON s.default_inspector_id = u.user_id
     WHERE s.schedule_id = $1`,
    [scheduleId],
  );
  return result.rows[0] || null;
}

export async function createSchedule(input: {
  structure_id: string;
  inspector_id?: string;
  interval_days: number;
  next_due_date: string;
}): Promise<ScheduleRow> {
  const result = await pool.query(
    `INSERT INTO inspection_schedules (structure_id, default_inspector_id, recurrence_interval_days, next_due_date, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING schedule_id, structure_id, client_id, default_inspector_id, recurrence_interval_days, next_due_date, is_active, created_at, updated_at`,
    [input.structure_id, input.inspector_id || null, input.interval_days, input.next_due_date],
  );
  return result.rows[0];
}

export async function updateSchedule(scheduleId: string, fields: Record<string, unknown>): Promise<ScheduleRow | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length === 0) return null;
  params.push(scheduleId);
  const result = await pool.query(
    `UPDATE inspection_schedules SET ${setClauses.join(', ')} WHERE schedule_id = $${idx}
     RETURNING schedule_id, structure_id, client_id, default_inspector_id, recurrence_interval_days, next_due_date, is_active, created_at, updated_at`,
    params,
  );
  return result.rows[0] || null;
}

export async function toggleSchedulePause(scheduleId: string): Promise<ScheduleRow | null> {
  const result = await pool.query(
    `UPDATE inspection_schedules SET is_active = NOT is_active WHERE schedule_id = $1
     RETURNING schedule_id, structure_id, client_id, default_inspector_id, recurrence_interval_days, next_due_date, is_active, created_at, updated_at`,
    [scheduleId],
  );
  return result.rows[0] || null;
}