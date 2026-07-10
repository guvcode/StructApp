import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getTimesheetsForInspector, getTimesheetById, createTimesheetBatch, updateTimesheet, submitTimesheet, deleteTimesheet } from '../services/timesheets';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';

const router = Router();

const batchEntrySchema = z.object({
  work_type: z.string().min(1),
  hours: z.number().positive().max(24),
  notes: z.string().optional(),
  pre_inspection: z.boolean().optional(),
});

const batchCreateSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(batchEntrySchema).min(1).max(20),
  project_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
}).refine(
  data => data.project_id || data.inspection_id,
  { message: 'Either project_id or inspection_id is required' }
);

const groupApproveSchema = z.object({ entry_ids: z.array(z.string().uuid()).min(1), approver_name: z.string().min(1) });
const groupRejectSchema = z.object({ entry_ids: z.array(z.string().uuid()).min(1), reason: z.string().min(1) });

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectorId = req.user!.sub;
    const clientId = (req.query.client_id as string) || req.user!.client_id;
    const entries = await getTimesheetsForInspector(inspectorId, clientId);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

router.post('/batch', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = batchCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid batch data', details: parsed.error.flatten() });
    }

    // Resolve project_id and client_id: direct or derived from inspection_id
    let projectId = parsed.data.project_id;
    let clientId: string | null = null;

    if (parsed.data.inspection_id) {
      const inspResult = await pool.query(
        `SELECT s.project_id, s.client_id FROM inspections i
         JOIN structures st ON i.structure_id = st.structure_id
         JOIN sites s ON st.site_id = s.site_id
         WHERE i.inspection_id = $1`,
        [parsed.data.inspection_id]
      );
      if (inspResult.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Inspection not found' });
      }
      projectId = projectId || inspResult.rows[0].project_id;
      clientId = inspResult.rows[0].client_id;
    } else if (parsed.data.project_id) {
      const projResult = await pool.query(
        'SELECT client_id FROM projects WHERE project_id = $1',
        [parsed.data.project_id]
      );
      if (projResult.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Project not found' });
      }
      clientId = projResult.rows[0].client_id;
    }

    // Fallback to JWT client_id if no inspection or project provided
    const resolvedClientId = clientId || user.client_id;

    const result = await createTimesheetBatch(user.sub, resolvedClientId, projectId!, parsed.data.inspection_id ?? null, parsed.data.entry_date, parsed.data.entries);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/groups', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const clientId = user.client_id;
    const isAdminOrReviewer = user.role === 'Admin' || user.role === 'Reviewer';
    const requestedUserId = req.query.user_id as string | undefined;

    let query = `SELECT te.entry_id AS id, te.user_id, u.display_name AS user_name, te.project_id, te.inspection_id, te.client_id, te.work_type, te.hours_logged AS hours, te.entry_date, te.pre_inspection, te.status, te.rejection_reason, te.approved_by, te.approved_at, te.created_at, te.updated_at, COALESCE(st.name, s.name) AS inspection_name, p.name AS project_name, s.name AS structure_name FROM timesheet_entries te LEFT JOIN users u ON te.user_id = u.user_id LEFT JOIN inspections i ON te.inspection_id = i.inspection_id LEFT JOIN structures s ON i.structure_id = s.structure_id LEFT JOIN sites st ON s.site_id = st.site_id LEFT JOIN projects p ON st.project_id = p.project_id WHERE te.client_id = $1`;
    const params: unknown[] = [clientId];
    let paramIdx = 2;

    if (isAdminOrReviewer && requestedUserId) {
      query += ` AND user_id = $${paramIdx++}`;
      params.push(requestedUserId);
    } else if (!isAdminOrReviewer) {
      query += ` AND user_id = $${paramIdx++}`;
      params.push(user.sub);
    }

    query += ` ORDER BY entry_date DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = (req.query.client_id as string) || req.user!.client_id;
    const entry = await getTimesheetById(req.params.id, clientId);
    if (!entry) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Timesheet entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const data: { work_type?: string; hours?: number; notes?: string; pre_inspection?: boolean } = {};
    if (req.body.work_type !== undefined) data.work_type = req.body.work_type;
    if (req.body.hours !== undefined) data.hours = req.body.hours;
    if (req.body.notes !== undefined) data.notes = req.body.notes;
    if (req.body.pre_inspection !== undefined) data.pre_inspection = Boolean(req.body.pre_inspection);
    const result = await updateTimesheet(req.params.id, user.client_id, user.sub, data);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === 'TIMESHEET_NOT_FOUND') {
      return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Timesheet entry not found' });
    }
    if (err instanceof Error && err.message === 'TIMESHEET_NOT_DRAFT') {
      return res.status(400).json({ success: false, error_code: 'NOT_DRAFT', message: 'Only Draft entries can be edited' });
    }
    if (err instanceof Error && err.message === 'NO_FIELDS_TO_UPDATE') {
      return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields provided to update' });
    }
    next(err);
  }
});

router.post('/:id/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const result = await submitTimesheet(req.params.id, user.client_id, user.sub);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    await deleteTimesheet(req.params.id, user.client_id, user.sub);
    res.json({ success: true, message: 'Timesheet entry deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/approve', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = groupApproveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'entry_ids and approver_name required' });
    }
    const result = await pool.query(
      `UPDATE timesheet_entries SET status = 'Approved', approved_by = $1, approved_at = NOW()
       WHERE entry_id = ANY($2::uuid[]) AND status = 'Submitted' RETURNING entry_id`,
      [parsed.data.approver_name, parsed.data.entry_ids],
    );
    logger.info('Timesheet entries approved', { count: result.rowCount, by: parsed.data.approver_name });
    res.json({ success: true, data: { approved: result.rowCount } });
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/reject', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = groupRejectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'entry_ids and reason required' });
    }
    const result = await pool.query(
      `UPDATE timesheet_entries SET status = 'Rejected', rejection_reason = $1
       WHERE entry_id = ANY($2::uuid[]) AND status = 'Submitted' RETURNING entry_id`,
      [parsed.data.reason, parsed.data.entry_ids],
    );
    logger.info('Timesheet entries rejected', { count: result.rowCount, reason: parsed.data.reason });
    res.json({ success: true, data: { rejected: result.rowCount } });
  } catch (err) {
    next(err);
  }
});

export const timesheetsRouter = router;
