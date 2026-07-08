import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  listDeficienciesByInspection,
  getDeficiencyById,
  createDeficiency,
  updateDeficiency,
  updateRemediationStatus,
  verifyClosure,
  updateComponentNotes,
} from '../services/deficiencies';
import { remediationUpdateSchema } from '../contracts/inspections';

const router = Router();

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.query.inspection_id as string | undefined;
      if (!inspectionId) {
        return res.status(400).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'inspection_id query parameter is required' });
      }
      const deficiencies = await listDeficienciesByInspection(inspectionId, user.client_id);
      res.json({ success: true, data: deficiencies });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { client_id: string } }).user;
      const deficiency = await getDeficiencyById(req.params.id, user.client_id);
      if (!deficiency) {
        return res.status(404).json({ success: false, error_code: 'DEFICIENCY_NOT_FOUND', message: 'Deficiency not found' });
      }
      res.json({ success: true, data: deficiency });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const deficiency = await updateDeficiency(req.params.id, user.client_id, user.sub, req.body);
      res.json({ success: true, data: deficiency });
    } catch (err) {
      if (err instanceof Error && err.message === 'DEFICIENCY_NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'DEFICIENCY_NOT_FOUND', message: 'Deficiency not found' });
      }
      if (err instanceof Error && err.message === 'NO_FIELDS_TO_UPDATE') {
        return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'No valid fields provided for update' });
      }
      next(err);
    }
  }
);

router.patch(
  '/:id/remediation',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const deficiencyId = req.params.id;
      const parsed = remediationUpdateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid remediation update request',
          details: parsed.error.flatten(),
        });
      }

      const result = await updateRemediationStatus(
        deficiencyId,
        user.client_id,
        user.sub,
        parsed.data.remediation_status,
        parsed.data.remediation_due_date || null
      );
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'DEFICIENCY_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'DEFICIENCY_NOT_FOUND',
            message: 'Deficiency not found',
          });
        }
      }
      next(err);
    }
  }
);

router.post(
  '/:id/verify-closure',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const deficiencyId = req.params.id;
      const result = await verifyClosure(deficiencyId, user.client_id, user.sub);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'DEFICIENCY_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'DEFICIENCY_NOT_FOUND',
            message: 'Deficiency not found',
          });
        }
        if (err.message === 'MISSING_REMEDIATION_EVIDENCE') {
          return res.status(422).json({
            success: false,
            error_code: 'MISSING_REMEDIATION_EVIDENCE',
            message: "At least one photo tagged 'remediation_evidence' must be attached before this deficiency can be verified closed.",
          });
        }
      }
      next(err);
    }
  }
);

const priorityOverrideSchema = z.object({
  priority: z.enum(['P1', 'P2', 'P3', 'P4', 'P5']),
  justification: z.string().min(1).max(500),
});

router.post(
  '/:id/override-priority',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const parsed = priorityOverrideSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid priority override' });
      }
      const { pool } = require('../lib/db');
      const current = await pool.query(
        'SELECT calculated_priority, is_overridden, original_priority FROM deficiency_records WHERE deficiency_id = $1',
        [req.params.id],
      );
      if (current.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'DEFICIENCY_NOT_FOUND', message: 'Deficiency not found' });
      }
      const row = current.rows[0];
      await pool.query(
        `UPDATE deficiency_records
         SET calculated_priority = $1,
             original_priority = COALESCE($2, $3),
             is_overridden = TRUE,
             overridden_by = $4,
             overridden_at = NOW(),
             reviewer_justification = $5
         WHERE deficiency_id = $6`,
        [
          parsed.data.priority,
          row.original_priority,
          row.is_overridden ? row.original_priority : row.calculated_priority,
          user.sub,
          parsed.data.justification,
          req.params.id,
        ],
      );
      res.json({ success: true, data: { deficiency_id: req.params.id } });
    } catch (err) {
      next(err);
    }
  }
);

export const deficienciesRouter = router;

router.patch(
  '/:id/component-notes',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string; role: string } }).user;
      const parsed = z.object({ component_notes: z.string().max(500) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid component notes' });
      }
      const result = await updateComponentNotes(req.params.id, user.client_id, parsed.data.component_notes);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error && err.message === 'DEFICIENCY_NOT_FOUND') {
        return res.status(404).json({ success: false, error_code: 'DEFICIENCY_NOT_FOUND', message: 'Deficiency not found' });
      }
      next(err);
    }
  }
);