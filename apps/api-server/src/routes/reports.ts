import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { reportGenerateSchema } from '../contracts/reports';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { generateInspectionReport } from '../deliverables/pdf/inspectionReport';
import { generateWordReport, generateExcelReport, generateCsvReport } from '../deliverables/reports';
import { generateDashboardPdf, generateDashboardExcel } from '../deliverables/reports/dashboard';
import { streamReport } from '../deliverables/reports/download';

export const reportsRouter = Router();

const REPORT_EXT: Record<string, string> = {
  draft_pdf: 'pdf',
  final_pdf: 'pdf',
  word: 'docx',
  excel: 'xlsx',
  csv: 'csv',
};

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

reportsRouter.get(
  '/jobs/:id',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const result = await pool.query(
        'SELECT job_id, client_id, project_id, requested_by, report_type, status, download_url, error_message, created_at, completed_at FROM report_jobs WHERE job_id = $1 AND client_id = $2',
        [req.params.id, user.client_id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Report job not found' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

reportsRouter.get(
  '/jobs/:id/download',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const jobResult = await pool.query(
        'SELECT job_id, report_type, status, client_id FROM report_jobs WHERE job_id = $1 AND client_id = $2',
        [req.params.id, user.client_id]
      );
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Report job not found' });
      }
      const job = jobResult.rows[0];
      if (job.status !== 'Ready') {
        return res.status(400).json({ success: false, error_code: 'NOT_READY', message: 'Report is not ready for download' });
      }
      const ext = REPORT_EXT[job.report_type] ?? 'pdf';
      streamReport(req, res, job.job_id, ext);
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

      const { type, project_id } = parsed.data;
      const jobId = randomUUID();
      await pool.query(
        'INSERT INTO report_jobs (job_id, client_id, project_id, requested_by, report_type, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [jobId, user.client_id, project_id, user.sub, type, 'Processing']
      );

      setImmediate(async () => {
        try {
          switch (type) {
            case 'draft_pdf':
            case 'final_pdf':
              await generateInspectionReport(jobId, project_id, type, user.client_id);
              break;
            case 'word':
              await generateWordReport(jobId, project_id, user.client_id);
              break;
            case 'excel':
              await generateExcelReport(jobId, project_id, user.client_id);
              break;
            case 'csv':
              await generateCsvReport(jobId, project_id, user.client_id);
              break;
          }
          const ext = REPORT_EXT[type] ?? 'pdf';
          await pool.query(
            'UPDATE report_jobs SET status = $1, download_url = $2, completed_at = NOW() WHERE job_id = $3',
            ['Ready', `/api/v1/reports/jobs/${jobId}/download`, jobId]
          );
        } catch (err) {
          logger.error({ err, jobId, type }, 'Report generation failed');
          await pool.query(
            'UPDATE report_jobs SET status = $1, error_message = $2 WHERE job_id = $3',
            ['Failed', (err as Error).message, jobId]
          );
        }
      });

      res.json({ success: true, data: { job_id: jobId, status: 'Processing' } });
    } catch (err) {
      next(err);
    }
  }
);

reportsRouter.post(
  '/jobs/:id/retry',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const jobResult = await pool.query(
        'SELECT job_id, project_id, report_type FROM report_jobs WHERE job_id = $1 AND client_id = $2',
        [req.params.id, user.client_id]
      );
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Report job not found' });
      }
      const job = jobResult.rows[0];
      await pool.query(
        'UPDATE report_jobs SET status = $1, error_message = NULL WHERE job_id = $2',
        ['Processing', job.job_id]
      );

      setImmediate(async () => {
        try {
          switch (job.report_type) {
            case 'draft_pdf':
            case 'final_pdf':
              await generateInspectionReport(job.job_id, job.project_id, job.report_type, user.client_id);
              break;
            case 'word':
              await generateWordReport(job.job_id, job.project_id, user.client_id);
              break;
            case 'excel':
              await generateExcelReport(job.job_id, job.project_id, user.client_id);
              break;
            case 'csv':
              await generateCsvReport(job.job_id, job.project_id, user.client_id);
              break;
          }
          const ext = REPORT_EXT[job.report_type] ?? 'pdf';
          await pool.query(
            'UPDATE report_jobs SET status = $1, download_url = $2, completed_at = NOW() WHERE job_id = $3',
            ['Ready', `/api/v1/reports/jobs/${job.job_id}/download`, job.job_id]
          );
        } catch (err) {
          logger.error({ err, jobId: job.job_id }, 'Report retry failed');
          await pool.query(
            'UPDATE report_jobs SET status = $1, error_message = $2 WHERE job_id = $3',
            ['Failed', (err as Error).message, job.job_id]
          );
        }
      });

      res.json({ success: true, data: { job_id: job.job_id, status: 'Processing' } });
    } catch (err) {
      next(err);
    }
  }
);

const dashboardSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(['pdf', 'excel']),
});

reportsRouter.post(
  '/dashboard-summary',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const parsed = dashboardSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid dashboard request',
          details: parsed.error.flatten(),
        });
      }

      const { start_date, end_date, format } = parsed.data;
      const jobId = randomUUID();

      if (format === 'pdf') {
        await generateDashboardPdf(jobId, user.client_id, start_date, end_date);
      } else {
        await generateDashboardExcel(jobId, user.client_id, start_date, end_date);
      }

      streamReport(req, res, jobId, format);
    } catch (err) {
      next(err);
    }
  }
);