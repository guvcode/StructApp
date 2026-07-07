import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { reportGenerateSchema } from '../contracts/reports';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { generateInspectionReport } from '../deliverables/pdf/inspectionReport';

export const reportsRouter = Router();

reportsRouter.get(
  '/jobs',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const result = await pool.query(
        'SELECT job_id, client_id, project_id, requested_by, report_type, status, download_url, error_message, created_at, completed_at FROM report_jobs WHERE client_id = $1 ORDER BY created_at DESC',
        [user.client_id],
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      next(err);
    }
  }
);

reportsRouter.post(
  '/generate',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const parsed = reportGenerateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid report request',
          details: parsed.error.flatten(),
        });
      }

      const jobId = randomUUID();
      await pool.query(
        'INSERT INTO report_jobs (job_id, client_id, project_id, requested_by, report_type, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [jobId, user.client_id, parsed.data.project_id, user.client_id, parsed.data.type, 'Queued']
      );

      // Fire-and-forget async job
      setImmediate(async () => {
        try {
          await generateInspectionReport(jobId, parsed.data.project_id, parsed.data.type as 'draft_pdf' | 'final_pdf');
        } catch (err) {
          logger.error({ err }, 'Report generation failed');
        }
      });

      res.json({ success: true, data: { job_id: jobId, status: 'Queued' } });
    } catch (err) {
      next(err);
    }
  }
);