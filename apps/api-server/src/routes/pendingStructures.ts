import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as pendingService from '../services/pendingStructures';
import { submitPendingStructureSchema, pendingStructureApproveSchema, pendingDeficiencySchema, pendingPhotoSchema } from '../contracts/pendingStructures';

const router = Router();

router.post(
  '/',
  requireAuth,
  async (req: Request & { user: { sub: string; client_id: string; role: string } },
    res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'Contractor') {
        return res.status(403).json({ success: false, error_code: 'FORBIDDEN', message: 'Only Contractors can submit pending structures' });
      }
      const input = submitPendingStructureSchema.parse(req.body);
      const result = await pendingService.submitPendingStructureBundle(req.user.sub, input);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'NOT_A_MEMBER') {
          return res.status(403).json({ success: false, error_code: 'NOT_A_MEMBER', message: 'Not authorized for this client' });
        }
        if (err.message === 'SITE_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'SITE_NOT_FOUND', message: 'Site not found in client' });
        }
        if (err.message.startsWith('VALIDATION_ERROR')) {
          return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: err.message });
        }
      }
      next(err);
    }
  },
);

router.get(
  '/',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id?: string } }).user;
      const results = await pendingService.getPendingStructuresForReview(user.client_id);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/mine',
  requireAuth,
  async (req: Request & { user: { sub: string; client_id: string } },
    res: Response, next: NextFunction) => {
    try {
      const results = await pendingService.getContractorPendingStructures(req.user.sub, req.user.client_id);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await pendingService.getPendingStructureById(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending structure not found' });
      }
      res.json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id/deficiencies',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deficiencies = await pendingService.getPendingDeficienciesForBundle(req.params.id);
      res.json({ success: true, data: deficiencies });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id/photos',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const photos = await pendingService.getPendingPhotosForBundle(req.params.id);
      res.json({ success: true, data: photos });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/deficiencies',
  requireAuth,
  async (req: Request & { user: { sub: string } },
    res: Response, next: NextFunction) => {
    try {
      const input = pendingDeficiencySchema.parse(req.body);
      const result = await pendingService.addDeficiencyToPendingStructure(req.params.id, req.user.sub, input);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
          return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: err.message });
        }
        if (err.message === 'PENDING_STRUCTURE_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending structure not found' });
        }
      }
      next(err);
    }
  },
);

router.post(
  '/:id/deficiencies/:deficiencyId/photos',
  requireAuth,
  async (req: Request & { user: { sub: string } },
    res: Response, next: NextFunction) => {
    try {
      const input = pendingPhotoSchema.parse(req.body);
      const result = await pendingService.addPhotoToPendingDeficiency(req.params.id, req.params.deficiencyId, req.user.sub, input);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
          return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: err.message });
        }
        if (err.message === 'PENDING_STRUCTURE_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending structure not found' });
        }
        if (err.message === 'PENDING_DEFICIENCY_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending deficiency not found' });
        }
      }
      next(err);
    }
  },
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request & { user: { sub: string } },
    res: Response, next: NextFunction) => {
    try {
      const overrides = req.body ? pendingStructureApproveSchema.parse(req.body) : undefined;
      const result = await pendingService.approvePendingStructureBundle(req.params.id, req.user.sub, overrides);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'PENDING_STRUCTURE_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending structure not found or already reviewed' });
        }
        if (err.message.startsWith('VALIDATION_ERROR')) {
          return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: err.message });
        }
      }
      next(err);
    }
  },
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request & { user: { sub: string } },
    res: Response, next: NextFunction) => {
    try {
      const { rejection_reason } = req.body as { rejection_reason?: string };
      if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
        return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'rejection_reason is required' });
      }
      await pendingService.rejectPendingStructureBundle(req.params.id, req.user.sub, rejection_reason.trim());
      res.json({ success: true, data: { message: 'Pending structure rejected' } });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'PENDING_STRUCTURE_NOT_FOUND') {
          return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Pending structure not found' });
        }
      }
      next(err);
    }
  },
);

export const pendingStructuresRouter = router;
