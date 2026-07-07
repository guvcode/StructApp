import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { picklistEntrySchema, picklistUpdateSchema } from '../contracts/inspections';
import {
  listComponentTypes,
  listWorkTypes,
  listStructureTypes,
  createComponentType,
  createWorkType,
  createStructureType,
  updateComponentType,
  updateWorkType,
  updateStructureType,
} from '../services/picklists';

const router = Router();

router.get(
  '/component-types',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const includeInactive = req.query.include_inactive === 'true';
      const result = await listComponentTypes(user.client_id, includeInactive);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/component-types',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid component type request',
          details: parsed.error.flatten(),
        });
      }
      const result = await createComponentType(user.client_id, parsed.data.name);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/work-types',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const includeInactive = req.query.include_inactive === 'true';
      const result = await listWorkTypes(user.client_id, includeInactive);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/work-types',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid work type request',
          details: parsed.error.flatten(),
        });
      }
      const result = await createWorkType(user.client_id, parsed.data.name);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/component-types/:id',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false, error_code: 'VALIDATION_ERROR',
          message: 'Invalid component type update',
          details: parsed.error.flatten(),
        });
      }
      const result = await updateComponentType(user.client_id, req.params.id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Component type not found' });
      }
      next(err);
    }
  }
);

router.patch(
  '/work-types/:id',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false, error_code: 'VALIDATION_ERROR',
          message: 'Invalid work type update',
          details: parsed.error.flatten(),
        });
      }
      const result = await updateWorkType(user.client_id, req.params.id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Work type not found' });
      }
      next(err);
    }
  }
);

router.get(
  '/structure-types',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const includeInactive = req.query.include_inactive === 'true';
      const result = await listStructureTypes(user.client_id, includeInactive);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/structure-types',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid structure type request',
          details: parsed.error.flatten(),
        });
      }
      const result = await createStructureType(user.client_id, parsed.data.name);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/structure-types/:id',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string; role: string } }).user;
      const parsed = picklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid structure type update',
          details: parsed.error.flatten(),
        });
      }
      const result = await updateStructureType(user.client_id, req.params.id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Structure type not found' });
      }
      next(err);
    }
  }
);

export const picklistsRouter = router;