import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { updateRemediationStatus } from '../services/deficiencies';
import { remediationUpdateSchema } from '../contracts/inspections';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, inspection_id } = req.query as Record<string, string | undefined>;
    let query = `
      SELECT d.deficiency_id, d.inspection_id, d.client_id, d.component, d.description,
             d.severity, d.probability, d.consequences, d.calculated_priority,
             d.original_priority, d.is_overridden, d.triage_state,
             d.remediation_status, d.remediation_due_date, d.remediated_at,
             d.verified_closed_by, d.verified_closed_at, d.component_notes,
             d.created_at, d.updated_at
      FROM deficiency_records d
      WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (status) { query += ` AND d.remediation_status = $${idx++}`; params.push(status); }
    if (inspection_id) { query += ` AND d.inspection_id = $${idx++}`; params.push(inspection_id); }
    query += ' ORDER BY d.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT d.deficiency_id, d.inspection_id, d.client_id, d.component, d.description,
              d.severity, d.probability, d.consequences, d.calculated_priority,
              d.original_priority, d.is_overridden, d.triage_state,
              d.remediation_status, d.remediation_due_date, d.remediated_at,
              d.verified_closed_by, d.verified_closed_at, d.component_notes,
              d.created_at, d.updated_at
       FROM deficiency_records d
       WHERE d.deficiency_id = $1`,
      [req.params.id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Deficiency not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
    const parsed = remediationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid request' });
    }
    const result = await updateRemediationStatus(
      req.params.id, user.client_id, user.sub,
      parsed.data.remediation_status, parsed.data.remediation_due_date || null,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === 'DEFICIENCY_NOT_FOUND') {
      return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Deficiency not found' });
    }
    next(err);
  }
});

router.get('/:id/photos', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT photo_id, deficiency_id, storage_url, display_order, caption, created_at
       FROM photos WHERE deficiency_id = $1 ORDER BY display_order ASC`,
      [req.params.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/photos', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ caption: z.string(), dataUrl: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid request' });
    }
    const result = await pool.query(
      `INSERT INTO photos (deficiency_id, storage_url, display_order, caption)
       VALUES ($1, $2, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM photos WHERE deficiency_id = $1), $3)
       RETURNING photo_id`,
      [req.params.id, parsed.data.dataUrl, parsed.data.caption],
    );
    res.status(201).json({ success: true, data: { id: result.rows[0].photo_id } });
  } catch (err) { next(err); }
});

router.get('/:id/has-evidence', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM photos WHERE deficiency_id = $1 AND purpose = 'remediation_evidence'`,
      [req.params.id],
    );
    res.json({ success: true, data: { hasEvidence: parseInt(result.rows[0].count, 10) > 0 } });
  } catch (err) { next(err); }
});

export const remediationRouter = router;