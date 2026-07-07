import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { loginSchema, refreshSchema, inviteSchema, switchClientSchema, forgotPasswordSchema, resetPasswordSchema } from '../contracts/auth';
import { login, verifyRefreshToken, refreshAccessToken, switchClient, forgotPassword, resetPassword } from '../services/auth';
import { logger } from '../lib/logger';
import { pool } from '../lib/db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error_code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error_code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const tokens = await login(input.email, input.password);
    res.json({ success: true, data: tokens });
  } catch (err) {
    logger.error('Login failed', { email: req.body.email, error: err });
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ success: false, error_code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = refreshSchema.parse(req.body);
    const userId = verifyRefreshToken(input.refresh_token);
    const userResult = await pool.query(
      'SELECT user_id, role FROM users WHERE user_id = $1 AND is_active = TRUE',
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, error_code: 'INVALID_TOKEN', message: 'User not found' });
    }
    const membershipResult = await pool.query(
      'SELECT client_id FROM client_memberships WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    const clientId = membershipResult.rows[0]?.client_id || null;
    const accessToken = await refreshAccessToken(userId, clientId, user.role);
    res.json({ success: true, data: { access_token: accessToken } });
  } catch (err) {
    logger.error('Refresh failed', { error: err });
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error_code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error_code: 'INVALID_TOKEN', message: 'Invalid token' });
      }
    }
    next(err);
  }
});

router.post('/invite', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = inviteSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, is_active, display_name)
       VALUES ($1, $2, $3, TRUE, $4)
       RETURNING user_id`,
      [input.email, passwordHash, input.role, input.display_name || null],
    );
    await pool.query(
      `INSERT INTO client_memberships (user_id, client_id)
       VALUES ($1, $2)`,
      [result.rows[0].user_id, input.client_id],
    );
    logger.info('User invited', { userId: result.rows[0].user_id, email: input.email, role: input.role, clientId: input.client_id });
    res.status(201).json({ success: true, data: { user_id: result.rows[0].user_id } });
  } catch (err: unknown) {
    const pgErr = err as { code?: string } | undefined;
    if (pgErr?.code === '23505') {
      return res.status(409).json({ success: false, error_code: 'EMAIL_EXISTS', message: 'A user with this email already exists' });
    }
    logger.error('Invite failed', { email: req.body.email, error: err });
    next(err);
  }
});

router.post('/switch-client', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = switchClientSchema.parse(req.body);
    const { access_token } = await switchClient(
      req.user!.sub,
      req.user!.role,
      input.client_id,
    );
    res.json({ success: true, data: { access_token } });
  } catch (err) {
    logger.error('Switch client failed', { error: err });
    if (err instanceof Error && err.message === 'NOT_A_MEMBER') {
      return res.status(403).json({ success: false, error_code: 'NOT_A_MEMBER', message: 'Not authorized for this client' });
    }
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    await forgotPassword(input.email);
    res.json({ success: true });
  } catch (err) {
    logger.error('Forgot password failed', { error: err });
    next(err);
  }
});

router.post('/reset-password', resetPasswordLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await resetPassword(input.token, input.password);
    res.json({ success: true });
  } catch (err) {
    logger.error('Reset password failed', { error: err });
    if (err instanceof Error) {
      if (err.message === 'RESET_TOKEN_CONSUMED') {
        return res.status(401).json({ success: false, error_code: 'RESET_TOKEN_CONSUMED', message: 'Token already used' });
      }
      if (err.message === 'INVALID_RESET_TOKEN') {
        return res.status(401).json({ success: false, error_code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired token' });
      }
    }
    next(err);
  }
});

export const authRouter = router;