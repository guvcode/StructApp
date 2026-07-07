import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import * as calendarService from '../services/calendar';

const router = Router();

const createSchema = z.object({
  structure_id: z.string().uuid(),
  inspector_id: z.string().uuid().optional(),
  interval_days: z.number().int().positive(),
  next_due_date: z.string().date(),
});

const updateSchema = z.object({
  default_inspector_id: z.string().uuid().optional(),
  recurrence_interval_days: z.number().int().positive().optional(),
  next_due_date: z.string().date().optional(),
});

function mapSchedule(r: Record<string, unknown>) {
  return {
    id: r.schedule_id, structure_id: r.structure_id, structure_name: r.structure_name || undefined,
    inspector_id: r.default_inspector_id || undefined, inspector_name: r.inspector_name || undefined,
    interval_days: r.recurrence_interval_days, next_due_date: r.next_due_date,
    is_active: r.is_active, created_at: r.created_at,
  };
}

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await calendarService.listSchedules();
    res.json({ success: true, data: rows.map(mapSchedule) });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await calendarService.getScheduleById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Schedule not found' });
    res.json({ success: true, data: mapSchedule(row) });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createSchema.parse(req.body);
    const row = await calendarService.createSchedule({
      structure_id: input.structure_id,
      inspector_id: input.inspector_id,
      interval_days: input.interval_days,
      next_due_date: input.next_due_date,
    });
    res.status(201).json({ success: true, data: mapSchedule(row) });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.default_inspector_id !== undefined) fields.default_inspector_id = input.default_inspector_id;
    if (input.recurrence_interval_days !== undefined) fields.recurrence_interval_days = input.recurrence_interval_days;
    if (input.next_due_date !== undefined) fields.next_due_date = input.next_due_date;
    if (Object.keys(fields).length === 0) return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields to update' });
    const row = await calendarService.updateSchedule(req.params.id, fields);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Schedule not found' });
    res.json({ success: true, data: mapSchedule(row) });
  } catch (err) { next(err); }
});

router.post('/:id/toggle-pause', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await calendarService.toggleSchedulePause(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Schedule not found' });
    res.json({ success: true, data: mapSchedule(row) });
  } catch (err) { next(err); }
});

export const schedulesRouter = router;