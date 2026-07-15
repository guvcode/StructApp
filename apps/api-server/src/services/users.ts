import { pool } from '../lib/db';

type UserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  invite_accepted_at: string | null;
};

export async function listUsers(role?: string): Promise<UserRow[]> {
  let query = 'SELECT user_id, email, display_name, role, is_active, last_login_at, invite_accepted_at FROM users WHERE is_active = TRUE';
  const params: unknown[] = [];
  if (role) { query += ' AND role = $1'; params.push(role); }
  query += ' ORDER BY email ASC';
  const result = await pool.query(query, params);
  return Promise.all(result.rows.map(async (row: UserRow) => {
    const memberships = await pool.query(
      'SELECT client_id FROM client_memberships WHERE user_id = $1',
      [row.user_id],
    );
    return { ...row, client_memberships: memberships.rows };
  }));
}

export async function getUserById(userId: string): Promise<(UserRow & { client_memberships: Array<{ client_id: string }> }) | null> {
  const result = await pool.query(
    'SELECT user_id, email, display_name, role, is_active, last_login_at, invite_accepted_at FROM users WHERE user_id = $1',
    [userId],
  );
  if (result.rowCount === 0 || !result.rows[0]) return null;
  const row = result.rows[0];
  const memberships = await pool.query(
    'SELECT client_id FROM client_memberships WHERE user_id = $1 ORDER BY created_at ASC',
    [row.user_id],
  );
  return { ...row, client_memberships: memberships.rows };
}

export async function updateUser(userId: string, fields: Record<string, unknown>): Promise<void> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'client_memberships' || key === 'id') continue;
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length > 0) {
    params.push(userId);
    await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE user_id = $${idx}`, params);
  }
}

export async function replaceMemberships(userId: string, memberships: Array<{ client_id: string }>): Promise<void> {
  await pool.query('DELETE FROM client_memberships WHERE user_id = $1', [userId]);
  for (const m of memberships) {
    await pool.query(
      'INSERT INTO client_memberships (user_id, client_id) VALUES ($1, $2)',
      [userId, m.client_id],
    );
  }
}

export async function deactivateUser(userId: string): Promise<boolean> {
  const result = await pool.query('UPDATE users SET is_active = FALSE WHERE user_id = $1 RETURNING user_id', [userId]);
  return result.rowCount !== null && result.rowCount > 0;
}