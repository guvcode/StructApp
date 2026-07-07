import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import * as userService from '../services/users';

const router = Router();

const ACTIVATE_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-activate-secret';

function generateInviteToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, purpose: 'invite' },
    ACTIVATE_TOKEN_SECRET,
    { expiresIn: '7d', issuer: 'structapp-app', audience: 'structapp-api' },
  );
}

function getInviteUrl(token: string): string {
  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
  return `${baseUrl}/activate?token=${token}`;
}

const userUpdateSchema = z.object({
  role: z.enum(['Admin', 'Reviewer', 'Contractor']).optional(),
  is_active: z.boolean().optional(),
  client_memberships: z.array(z.object({
    client_id: z.string().uuid(),
  })).optional(),
});

function requireAdminMw(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'Admin') {
    return _res.status(403).json({ success: false, error_code: 'FORBIDDEN', message: 'Admin access required' });
  }
  next();
}

router.post('/:id/resend-invite', requireAdminMw, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await pool.query(
      'SELECT user_id, email, invite_accepted_at FROM users WHERE user_id = $1',
      [req.params.id],
    );
    if (user.rowCount === 0) {
      return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'User not found' });
    }
    if (user.rows[0].invite_accepted_at) {
      return res.status(400).json({ success: false, error_code: 'ALREADY_ACTIVATED', message: 'User has already accepted the invite' });
    }
    const token = generateInviteToken(user.rows[0].user_id, user.rows[0].email);
    const inviteLink = getInviteUrl(token);
    await pool.query(
      'UPDATE users SET invite_token = $1, invite_sent_at = NOW() WHERE user_id = $2',
      [token, user.rows[0].user_id],
    );
    logger.info('Invite resent', { userId: user.rows[0].user_id, email: user.rows[0].email });
    res.json({ success: true, data: { invite_link: inviteLink, invite_sent_at: new Date().toISOString() } });
  } catch (err) { next(err); }
});

router.get('/:id/invite-link', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await pool.query(
      'SELECT user_id, email, invite_token, invite_accepted_at, invite_sent_at FROM users WHERE user_id = $1',
      [req.params.id],
    );
    if (user.rowCount === 0) {
      return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'User not found' });
    }
    const row = user.rows[0];
    const isActivated = !!row.invite_accepted_at;
    const inviteLink = row.invite_token ? getInviteUrl(row.invite_token) : null;
    res.json({
      success: true,
      data: {
        is_activated: isActivated,
        invite_link: inviteLink,
        invite_sent_at: row.invite_sent_at || null,
        invite_accepted_at: row.invite_accepted_at || null,
      },
    });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const rows = await userService.listUsers(role);
    const users = rows.map(r => ({
      id: r.user_id, email: r.email, display_name: r.display_name, role: r.role, is_active: r.is_active,
      last_login_at: r.last_login_at || null, invite_accepted_at: r.invite_accepted_at || null,
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