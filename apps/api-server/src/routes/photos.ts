import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { updatePhoto, softDeletePhoto } from '../services/photos';
import { photoUpdateSchema } from '../contracts/inspections';

const router = Router();

router.patch(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const photoId = req.params.id;
      const parsed = photoUpdateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid photo update request',
          details: parsed.error.flatten(),
        });
      }

      const result = await updatePhoto(photoId, user.client_id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'PHOTO_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'PHOTO_NOT_FOUND',
            message: 'Photo not found',
          });
        }
        if (err.message === 'NO_UPDATES_PROVIDED') {
          return res.status(422).json({
            success: false,
            error_code: 'VALIDATION_ERROR',
            message: 'At least one field to update is required',
          });
        }
      }
      next(err);
    }
  }
);

export const photosRouter = router;

router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const result = await softDeletePhoto(req.params.id, user.client_id);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.message === 'PHOTO_NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'PHOTO_NOT_FOUND', message: 'Photo not found' });
      }
      next(err);
    }
  }
);