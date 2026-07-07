import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createImportBatch, processCsvRows } from '../services/imports';
import { logger } from '../lib/logger';
import { pool } from '../lib/db';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { csv_content } = req.body as { csv_content?: string };
      if (!csv_content) {
        return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'csv_content is required' });
      }

      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const batchId = await createImportBatch(user.client_id, user.sub, 'api-upload.csv');

      await pool.query(
        'UPDATE import_batches SET status = \'Validated\' WHERE batch_id = $1',
        [batchId],
      );

      const { valid, invalid } = await processCsvRows(batchId, csv_content);

      logger.info('Import batch created', { batchId, valid, invalid, uploadedBy: user.sub });
      res.status(201).json({ success: true, data: { batch_id: batchId, valid_count: valid, invalid_count: invalid } });
    } catch (err) {
      logger.error('Import upload failed', { error: err });
      next(err);
    }
  },
);

router.post(
  '/:id/commit',
  requireAuth,
  requireRole('Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const batchResult = await pool.query(
        'SELECT status FROM import_batches WHERE batch_id = $1',
        [id],
      );
      if (batchResult.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Batch not found' });
      }
      if (batchResult.rows[0].status !== 'Validated') {
        return res.status(422).json({ success: false, error_code: 'INVALID_STATE', message: 'Batch must be in Validated state to commit' });
      }

      const rowsResult = await pool.query(
        `SELECT raw_row FROM import_rows WHERE batch_id = $1 AND validation_status = 'Valid'`,
        [id],
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const row of rowsResult.rows) {
          const r = row.raw_row;
          let projectId = r.project_id;
          if (!projectId) {
            const projectRes = await client.query(
              `INSERT INTO projects (client_id, name, code, status)
               VALUES ((SELECT client_id FROM import_batches WHERE batch_id = $1), $2, $2, 'active')
               RETURNING project_id`,
              [id, r.project_title],
            );
            projectId = projectRes.rows[0].project_id;
          }

          let siteId = r.site_id;
          if (!siteId) {
            const siteRes = await client.query(
              `INSERT INTO sites (project_id, name, address, status)
               VALUES ($1, $2, $2, 'active')
               RETURNING site_id`,
              [projectId, r.site_name],
            );
            siteId = siteRes.rows[0].site_id;
          }

          await client.query(
            `INSERT INTO structure_assets (site_id, name, type, identifier)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (identifier) DO NOTHING`,
            [siteId, r.structure_description || r.structure_name, r.structure_type || 'unknown', r.structure_asset_tag],
          );
        }

        await client.query(
          'UPDATE import_batches SET status = \'Committed\' WHERE batch_id = $1',
          [id],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      logger.info('Import batch committed', { batchId: id, rows: rowsResult.rowCount });
      res.json({ success: true, data: { committed_rows: rowsResult.rowCount } });
    } catch (err) {
      logger.error('Import commit failed', { error: err });
      next(err);
    }
  },
);

export const importsRouter = router;