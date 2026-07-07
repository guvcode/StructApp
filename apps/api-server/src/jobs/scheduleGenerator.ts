import { Pool } from 'pg';
import cron from 'node-cron';
import { logger } from '../lib/logger';
import { LEAD_TIME_DAYS } from '../config/jobs';

type ScheduleRow = {
  schedule_id: string;
  structure_id: string;
  client_id: string;
  default_inspector_id: string | null;
  next_due_date: string;
  recurrence_interval_days: number;
};

export async function generateUpcomingInspections(pool: Pool): Promise<{ created: number }> {
  const dueSchedules = await pool.query<ScheduleRow>(
    `SELECT * FROM inspection_schedules
     WHERE is_active = TRUE
       AND next_due_date <= CURRENT_DATE + $1::int`,
    [LEAD_TIME_DAYS]
  );

  let created = 0;

  for (const schedule of dueSchedules.rows) {
    try {
      const result = await pool.query(
        `INSERT INTO inspections (structure_id, client_id, inspector_id, schedule_id, scheduled_date, status)
         SELECT s.structure_id, s.client_id, s.default_inspector_id, s.schedule_id, s.next_due_date, 'Assigned'
         FROM inspection_schedules s
         WHERE s.schedule_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM inspections i
             WHERE i.schedule_id = s.schedule_id
               AND i.scheduled_date = s.next_due_date
           )`,
        [schedule.schedule_id]
      );
      const rowsInserted = result.rowCount ?? 0;
      created += rowsInserted;

      if (rowsInserted > 0) {
        await pool.query(
          `UPDATE inspection_schedules
           SET next_due_date = next_due_date + ($1::text || ' days')::interval
           WHERE schedule_id = $2`,
          [schedule.recurrence_interval_days, schedule.schedule_id]
        );
      }
    } catch (error) {
      logger.error({ msg: 'schedule_generation_failed', scheduleId: schedule.schedule_id, error });
    }
  }

  return { created };
}

export function startScheduleGenerator(pool: Pool, cronSchedule: string = '0 2 * * *'): void {
  cron.schedule(cronSchedule, async () => {
    try {
      const { created } = await generateUpcomingInspections(pool);
      logger.info({ msg: 'schedule_generator_run', created });
    } catch (error) {
      logger.error({ msg: 'schedule_generator_error', error });
    }
  });
}