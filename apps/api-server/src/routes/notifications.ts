import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;

      const countResult = await pool.query('SELECT COUNT(*) as total FROM notification_queue');
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(
        `SELECT id, notification_type, payload, status, retry_count, last_error, created_at, sent_at
         FROM notification_queue
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json({
        success: true,
        data: { rows: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/resend',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `UPDATE notification_queue SET status = 'pending', retry_count = 0, last_error = NULL
         WHERE id = $1 RETURNING id`,
        [req.params.id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Notification not found' });
      }
      res.json({ success: true, data: { id: result.rows[0].id } });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query('DELETE FROM notification_queue WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Notification not found' });
      }
      res.json({ success: true, data: { id: result.rows[0].id } });
    } catch (err) {
      next(err);
    }
  }
);

export const notificationRouter = router;