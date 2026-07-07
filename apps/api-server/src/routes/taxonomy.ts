import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { taxonomyCreateSchema, taxonomyUpdateSchema } from '../contracts/taxonomy';
import { listTaxonomy, createTaxonomyNode, updateTaxonomyNode } from '../services/taxonomy';

const router = Router();

router.get(
  '/taxonomy',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const includeInactive = req.query.include_inactive === 'true';
      const result = await listTaxonomy(user.client_id, includeInactive);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/taxonomy',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = taxonomyCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid taxonomy node request',
          details: parsed.error.flatten(),
        });
      }
      const result = await createTaxonomyNode(user.client_id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/taxonomy/:id',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = taxonomyUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid taxonomy update request',
          details: parsed.error.flatten(),
        });
      }
      const result = await updateTaxonomyNode(user.client_id, req.params.id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export const taxonomyRouter = router;