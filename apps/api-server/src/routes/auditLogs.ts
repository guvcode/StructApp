import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminOrReviewer } from '../middleware/requireAdmin';
import { listAuditLogs } from '../services/auditLogs';

const router = Router();

router.get(
  '/',
  requireAdminOrReviewer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.page_size as string) || 50, 100);

      const result = await listAuditLogs(user.client_id, {
        tableName: req.query.table_name as string | undefined,
        recordId: req.query.record_id as string | undefined,
        action: req.query.action as string | undefined,
        performedBy: req.query.performed_by as string | undefined,
        startDate: req.query.start_date as string | undefined,
        endDate: req.query.end_date as string | undefined,
      }, page, pageSize);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          page_size: result.pageSize,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const auditLogsRouter = router;