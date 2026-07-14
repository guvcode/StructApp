import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../lib/db';

const TOKEN_EXPIRY_SECONDS = 60 * 60;
const REFRESH_EXPIRY_DAYS = 30;

function generateResetToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

export async function forgotPassword(email: string): Promise<void> {
  const result = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 AND is_active = TRUE',
    [email],
  );

  if (result.rowCount === 0) {
    return; // Always return 200 - no user enumeration
  }

  const user = result.rows[0];
  const token = generateResetToken();
  const tokenHash = await bcrypt.hash(token, 10);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
    [user.user_id, tokenHash],
  );

  // Would send via NotificationProvider Resend adapter
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const result = await pool.query(
    'SELECT token_id, user_id, token_hash, consumed_at FROM password_reset_tokens WHERE expires_at > NOW()',
  );

  for (const row of result.rows) {
    const valid = await bcrypt.compare(token, row.token_hash);
    if (valid) {
      if (row.consumed_at) {
        throw new Error('RESET_TOKEN_CONSUMED');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE user_id = $2',
          [passwordHash, row.user_id],
        );
        await client.query(
          'UPDATE password_reset_tokens SET consumed_at = NOW() WHERE token_id = $1',
          [row.token_id],
        );
        await client.query('COMMIT');
      } finally {
        client.release();
      }
      return;
    }
  }

  throw new Error('INVALID_RESET_TOKEN');
}

type TokenClaims = {
  sub: string;
  client_id: string;
  role: 'Admin' | 'Reviewer' | 'Contractor';
  inspector_id?: string;
  iat: number;
  exp: number;
  iss: 'structapp-app';
  aud: 'structapp-api';
};

type TokenPair = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  client_id: string;
  role: string;
};

export async function login(email: string, password: string): Promise<TokenPair> {
  const userResult = await pool.query(
    'SELECT user_id, password_hash, role FROM users WHERE email = $1 AND is_active = TRUE',
    [email],
  );

  const user = userResult.rows[0];
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Get first client membership for the user
  const membershipResult = await pool.query(
    'SELECT client_id FROM client_memberships WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
    [user.user_id],
  );

  const clientId = membershipResult.rows[0]?.client_id || null;

  const accessToken = jwt.sign(
    {
      sub: user.user_id,
      client_id: clientId,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: TOKEN_EXPIRY_SECONDS, issuer: 'structapp-app', audience: 'structapp-api' },
  );

  const refreshToken = jwt.sign(
    { sub: user.user_id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: `${REFRESH_EXPIRY_DAYS}d`, issuer: 'structapp-app', audience: 'structapp-api' },
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: user.user_id,
    client_id: clientId,
    role: user.role,
  };
}

export function verifyRefreshToken(refreshToken: string): string {
  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, {
    issuer: 'structapp-app',
    audience: 'structapp-api',
  }) as { sub: string; exp: number };

  if (payload.exp * 1000 < Date.now() - TOKEN_EXPIRY_SECONDS * 1000) {
    throw new Error('REFRESH_TOKEN_EXPIRED');
  }

  return payload.sub;
}

export async function refreshAccessToken(userId: string, clientId: string, role: string): Promise<string> {
  return jwt.sign(
    { sub: userId, client_id: clientId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: TOKEN_EXPIRY_SECONDS, issuer: 'structapp-app', audience: 'structapp-api' },
  );
}

export async function switchClient(
  actorUserId: string,
  actorRole: 'Admin' | 'Reviewer' | 'Contractor',
  targetClientId: string,
): Promise<{ access_token: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (actorRole === 'Contractor') {
      const membershipCheck = await client.query(
        'SELECT 1 FROM client_memberships WHERE user_id = $1 AND client_id = $2',
        [actorUserId, targetClientId],
      );
      if (membershipCheck.rowCount === 0) {
        await client.query(
          `INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
           VALUES ('users', $1, 'SWITCH_CLIENT_ATTEMPT', NULL, '{"target_client_id": $2}')`,
          [actorUserId, targetClientId],
        );
        await client.query('ROLLBACK');
        throw new Error('NOT_A_MEMBER');
      }
      const hasInspections = await client.query(
        'SELECT 1 FROM inspections WHERE inspector_id = $1 AND client_id = $2 LIMIT 1',
        [actorUserId, targetClientId],
      );
      if (hasInspections.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new Error('NO_INSPECTION_ASSIGNMENTS');
      }
    }

    const newToken = jwt.sign(
      { sub: actorUserId, client_id: targetClientId, role: actorRole },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: TOKEN_EXPIRY_SECONDS, issuer: 'structapp-app', audience: 'structapp-api' },
    );

    await client.query('COMMIT');
    return { access_token: newToken };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}