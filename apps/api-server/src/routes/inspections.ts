import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { approveInspection, returnInspection, reopenInspection, submitInspection } from '../services/inspections-workflow';
import { createInspection, rescheduleInspection, reassignInspection, updateInspectionMode } from '../services/inspections-admin';
import { inspectionReturnSchema, inspectionRescheduleSchema, inspectionReassignSchema, inspectionReopenSchema, inspectionSubmitSchema, inspectionCreateSchema, inspectionModeUpdateSchema } from '../contracts/inspections';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';

const router = Router();

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { site_id, assignee, status, scheduled_date_from, scheduled_date_to, client_id } = req.query as Record<string, string | undefined>;
      let query = `
        SELECT i.inspection_id, i.structure_id, i.client_id, i.inspector_id,
               i.assigned_by, i.status, i.scheduled_date, i.submitted_at, i.created_at,
               i.updated_at, i.returned_reason, i.approved_by, i.approved_at,
               i.reopened_by, i.reopened_at, i.reopen_reason, i.schedule_id,
               u.email as assignee_name
        FROM inspections i
        LEFT JOIN users u ON i.inspector_id = u.user_id
        WHERE 1=1`;
      const params: unknown[] = [];
      let idx = 1;
      if (site_id) { query += ` AND i.site_id = $${idx++}`; params.push(site_id); }
      if (assignee) { query += ` AND i.inspector_id = $${idx++}`; params.push(assignee); }
      if (status) { query += ` AND i.status = $${idx++}`; params.push(status); }
      if (scheduled_date_from) { query += ` AND i.scheduled_date >= $${idx++}`; params.push(scheduled_date_from); }
      if (scheduled_date_to) { query += ` AND i.scheduled_date <= $${idx++}`; params.push(scheduled_date_to); }
      if (client_id) { query += ` AND i.client_id = $${idx++}`; params.push(client_id); }
      query += ' ORDER BY i.created_at DESC';

      const result = await pool.query(query, params);
      const inspections = result.rows.map(mapInspectionRow);
      res.json({ success: true, data: inspections });
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
      const result = await pool.query(
        `SELECT i.inspection_id, i.structure_id, i.client_id, i.inspector_id,
                i.assigned_by, i.status, i.scheduled_date, i.submitted_at, i.created_at,
                i.updated_at, i.returned_reason, i.approved_by, i.approved_at,
                i.reopened_by, i.reopened_at, i.reopen_reason, i.schedule_id,
                u.email as assignee_name
         FROM inspections i
         LEFT JOIN users u ON i.inspector_id = u.user_id
         WHERE i.inspection_id = $1`,
        [req.params.id],
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Inspection not found' });
      }
      res.json({ success: true, data: mapInspectionRow(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  }
);

const bulkReassignSchema = z.object({
  sourceInspectorId: z.string().uuid(),
  targetInspectorId: z.string().uuid(),
  inspectionIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(10).optional(),
});

router.post(
  '/bulk-reassign',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string } }).user;
      const parsed = bulkReassignSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid bulk reassign request',
          details: parsed.error.flatten(),
        });
      }

      const { targetInspectorId, inspectionIds, reason } = parsed.data;
      let reassignedCount = 0;
      const offendingIds: string[] = [];

      for (const inspectionId of inspectionIds) {
        try {
          await reassignInspection(inspectionId, targetInspectorId, reason || 'Bulk reassignment', user.sub, '');
          reassignedCount++;
        } catch {
          offendingIds.push(inspectionId);
        }
      }

      logger.info('Bulk reassign completed', { reassignedCount, total: inspectionIds.length, byUser: user.sub });
      res.json({
        success: true,
        data: {
          reassignedCount,
          totalRequested: inspectionIds.length,
          ...(offendingIds.length > 0 ? { offending_ids: offendingIds } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const parsed = inspectionCreateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid inspection creation request',
          details: parsed.error.flatten(),
        });
      }

      const result = await createInspection(
        parsed.data.structure_id,
        parsed.data.inspector_id,
        user.sub,
        user.client_id,
        parsed.data.inspection_mode
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const result = await approveInspection(inspectionId, user.sub, user.client_id);
      res.json({
        success: true,
        data: {
          inspection_id: result.inspection_id,
          status: result.status,
          approved_at: result.approved_at,
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'ALREADY_APPROVED') {
          return res.status(409).json({
            success: false,
            error_code: 'ALREADY_APPROVED',
            message: 'Inspection is already approved',
          });
        }
        if (err.message === 'MISSING_REMEDIATION_EVIDENCE') {
          return res.status(422).json({
            success: false,
            error_code: 'MISSING_REMEDIATION_EVIDENCE',
            message: 'P1 deficiencies require remediation photo evidence before approval',
          });
        }
      }
      next(err);
    }
  }
);

router.post(
  '/:id/return',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionReturnSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid return request',
          details: parsed.error.flatten(),
        });
      }

      const result = await returnInspection(
        inspectionId,
        parsed.data.returned_reason,
        user.sub,
        user.client_id
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'INSPECTION_APPROVED_USE_REOPEN') {
          return res.status(409).json({
            success: false,
            error_code: 'INSPECTION_APPROVED_USE_REOPEN',
            message: 'Cannot return an approved inspection. Use reopen endpoint.',
          });
        }
        if (err.message === 'ALREADY_RETURNED') {
          return res.status(409).json({
            success: false,
            error_code: 'ALREADY_RETURNED',
            message: 'Inspection is already returned',
          });
        }
      }
      next(err);
    }
  }
);

router.patch(
  '/:id/reschedule',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionRescheduleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid reschedule request',
          details: parsed.error.flatten(),
        });
      }

      const result = await rescheduleInspection(
        inspectionId,
        parsed.data.scheduled_date,
        user.sub,
        user.client_id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'INSPECTION_APPROVED_USE_REOPEN') {
          return res.status(409).json({
            success: false,
            error_code: 'INSPECTION_APPROVED_USE_REOPEN',
            message: 'Cannot reschedule an approved inspection. Use reopen endpoint.',
          });
        }
      }
      next(err);
    }
  }
);

router.patch(
  '/:id/reassign',
  requireAuth,
  requireRole('Admin', 'Reviewer'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionReassignSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid reassign request',
          details: parsed.error.flatten(),
        });
      }

      const result = await reassignInspection(
        inspectionId,
        parsed.data.inspector_id,
        parsed.data.reason,
        user.sub,
        user.client_id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'INSPECTION_APPROVED_USE_REOPEN') {
          return res.status(409).json({
            success: false,
            error_code: 'INSPECTION_APPROVED_USE_REOPEN',
            message: 'Cannot reassign an approved inspection. Use reopen endpoint.',
          });
        }
        if (err.message === 'TARGET_INSPECTOR_INVALID') {
          return res.status(422).json({
            success: false,
            error_code: 'TARGET_INSPECTOR_INVALID',
            message: 'Target inspector is not a valid active user',
          });
        }
        if (err.message === 'SOURCE_EQUALS_TARGET') {
          return res.status(422).json({
            success: false,
            error_code: 'SOURCE_EQUALS_TARGET',
            message: 'Inspection already assigned to this inspector',
          });
        }
      }
      next(err);
    }
  }
);

router.patch(
  '/:id/inspection-mode',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionModeUpdateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid inspection mode',
          details: parsed.error.flatten(),
        });
      }

      const result = await updateInspectionMode(
        inspectionId,
        parsed.data.inspection_mode,
        user.client_id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'MODE_LOCKED_DEFICIENCIES_EXIST') {
          return res.status(409).json({
            success: false,
            error_code: 'MODE_LOCKED_DEFICIENCIES_EXIST',
            message: 'Cannot change inspection mode once deficiencies have been logged',
          });
        }
      }
      next(err);
    }
  }
);

router.post(
  '/:id/reopen',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionReopenSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid reopen request',
          details: parsed.error.flatten(),
        });
      }

      const result = await reopenInspection(
        inspectionId,
        parsed.data.target_status,
        parsed.data.reason,
        user.sub,
        user.client_id
      );
      res.json({
        success: true,
        message: `Inspection reopened and moved to '${parsed.data.target_status}'. Deficiency records are editable again.`,
        data: result,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'NOT_APPROVED') {
          return res.status(422).json({
            success: false,
            error_code: 'NOT_APPROVED',
            message: 'Only Approved inspections can be reopened',
          });
        }
      }
      next(err);
    }
  }
);

router.post(
  '/:id/submit',
  requireAuth,
  requireRole('Contractor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user: { sub: string; client_id: string } }).user;
      const inspectionId = req.params.id;
      const parsed = inspectionSubmitSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid submit request',
          details: parsed.error.flatten(),
        });
      }

      const result = await submitInspection(
        inspectionId,
        user.sub,
        user.client_id,
        parsed.data.no_deficiencies_found || false
      );
      res.json({
        success: true,
        message: 'Inspection submitted successfully',
        data: result,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSPECTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error_code: 'INSPECTION_NOT_FOUND',
            message: 'Inspection not found',
          });
        }
        if (err.message === 'NOT_ASSIGNED') {
          return res.status(403).json({
            success: false,
            error_code: 'NOT_ASSIGNED',
            message: 'Only the assigned inspector can submit this inspection',
          });
        }
        if (err.message === 'NO_DEFICIENCIES_OR_FLAG') {
          return res.status(422).json({
            success: false,
            error_code: 'NO_DEFICIENCIES_OR_FLAG',
            message: 'Inspection must have at least one deficiency record or no_deficiencies_found must be true',
          });
        }
        if (err.message === 'INVALID_STATUS') {
          return res.status(422).json({
            success: false,
            error_code: 'INVALID_STATUS',
            message: 'Only Assigned or In Progress inspections can be submitted',
          });
        }
      }
      next(err);
    }
  }
);

export const inspectionsRouter = router;

function mapInspectionRow(row: Record<string, unknown>) {
  return {
    id: row.inspection_id,
    structure_id: row.structure_id || undefined,
    client_id: row.client_id,
    assigned_to: row.inspector_id,
    assigned_by: row.assigned_by,
    status: row.status,
    scheduled_date: row.scheduled_date || undefined,
    submitted_at: row.submitted_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_name: row.assignee_name || undefined,
    return_reason: row.returned_reason || undefined,
    approved_by: row.approved_by || undefined,
    approved_at: row.approved_at || undefined,
    reopened_by: row.reopened_by || undefined,
    reopened_at: row.reopened_at || undefined,
    reopen_reason: row.reopen_reason || undefined,
    schedule_id: row.schedule_id || undefined,
  };
}