import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import * as userService from '../services/users';

const router = Router();

const userUpdateSchema = z.object({
  role: z.enum(['Admin', 'Reviewer', 'Contractor']).optional(),
  is_active: z.boolean().optional(),
  client_memberships: z.array(z.object({
    client_id: z.string().uuid(),
  })).optional(),
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const rows = await userService.listUsers(role);
    const users = rows.map(r => ({
      id: r.user_id, email: r.email, display_name: r.display_name, role: r.role, is_active: r.is_active,
      client_memberships: r.client_memberships,
    }));
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await userService.getUserById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'User not found' });
    res.json({ success: true, data: { id: row.user_id, email: row.email, display_name: row.display_name, role: row.role, is_active: row.is_active, client_memberships: row.client_memberships } });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = userUpdateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.role) fields.role = input.role;
    if (input.is_active !== undefined) fields.is_active = input.is_active;
    if (input.display_name) fields.display_name = input.display_name;
    if (Object.keys(fields).length > 0) await userService.updateUser(req.params.id, fields);
    if (input.client_memberships) await userService.replaceMemberships(req.params.id, input.client_memberships);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { next(err); }
});

router.post('/:id/deactivate', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const found = await userService.deactivateUser(req.params.id);
    if (!found) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'User not found' });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { next(err); }
});

router.post('/:id/resend-invite', requireAuth, requireRole('Admin'), async (_req: Request, res: Response, _next: NextFunction) => {
  res.json({ success: true, data: { message: 'Invite resent' } });
});

router.post('/:id/revoke-invite', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('UPDATE users SET is_active = FALSE WHERE user_id = $1', [req.params.id]);
    res.json({ success: true, data: { message: 'Invite revoked' } });
  } catch (err) { next(err); }
});

router.post('/:id/reset-password', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ temporary_password: z.string().min(8) });
    const input = schema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.temporary_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, req.params.id]);
    res.json({ success: true, data: { message: 'Password reset' } });
  } catch (err) { next(err); }
});

router.post('/:id/reset-pin', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('UPDATE users SET pin_hash = NULL, pin_setup_required = TRUE WHERE user_id = $1', [req.params.id]);
    res.json({ success: true, data: { message: 'PIN reset' } });
  } catch (err) { next(err); }
});

export const usersRouter = router;