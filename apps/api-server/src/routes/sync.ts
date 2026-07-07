import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { processSyncPush, processSyncPull, processPhotoUpload, getSyncState } from '../services/sync';
import { syncPushSchema, syncPullSchema } from '../contracts/sync';
import { requireAuth } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });

export const syncRouter = Router();

syncRouter.get(
  '/state',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; sub: string } }).user;
      const state = await getSyncState(user.client_id, user.sub);
      res.json({ success: true, data: state });
    } catch (err) {
      next(err);
    }
  }
);

syncRouter.post(
  '/pull-package',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const parsed = syncPullSchema.safeParse(req.body);
      const result = await processSyncPull(user.client_id, parsed.success ? parsed.data : {});
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

syncRouter.post(
  '/push-outbox',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const parsed = syncPushSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid sync payload',
          details: parsed.error.flatten(),
        });
      }

      const result = await processSyncPush(user.client_id, parsed.data);

      if (result.errors.length > 0) {
        return res.status(422).json({
          success: false,
          error_code: 'ATOMIC_SYNC_VALIDATION_FAILURE',
          message: 'Sync aborted. No database changes were committed.',
          data: { errors: result.errors },
        });
      }

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

syncRouter.post(
  '/photos/:deficiencyId',
  requireAuth,
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const deficiencyId = req.params.deficiencyId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error_code: 'MISSING_PHOTO',
          message: 'No photo file provided',
        });
      }

      const result = await processPhotoUpload(
        user.client_id,
        deficiencyId,
        file.buffer,
        file.originalname
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);