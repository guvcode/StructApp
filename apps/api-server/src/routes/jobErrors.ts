import { Router, Request, Response, NextFunction } from 'express';
import { requireAdminOrReviewer } from '../middleware/requireAdmin';
import { listJobErrors } from '../services/jobErrors';

const router = Router();

router.get(
  '/',
  requireAdminOrReviewer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.page_size as string) || 50, 100);

      const result = await listJobErrors(user.client_id, {
        jobType: req.query.job_type as string | undefined,
        errorCode: req.query.error_code as string | undefined,
        dismissed: req.query.dismissed === 'true' ? true : req.query.dismissed === 'false' ? false : undefined,
        startDate: req.query.start_date as string | undefined,
        endDate: req.query.end_date as string | undefined,
      }, page, pageSize);

      res.json({
        success: true,
        data: result.errors,
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

export const jobErrorsRouter = router;
