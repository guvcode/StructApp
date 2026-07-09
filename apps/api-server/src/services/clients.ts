import { pool } from '../lib/db';

export type ClientRow = {
  client_id: string;
  name: string;
  safety_contact_email?: string;
  created_at: string;
};

export async function listClients(): Promise<ClientRow[]> {
  const result = await pool.query(
    'SELECT client_id, name, safety_contact_email, created_at FROM clients ORDER BY name ASC',
  );
  return result.rows;
}

export async function getClientById(clientId: string): Promise<ClientRow | null> {
  const result = await pool.query(
    'SELECT client_id, name, safety_contact_email, created_at FROM clients WHERE client_id = $1',
    [clientId],
  );
  return result.rows[0] || null;
}

export async function createClient(name: string, _safetyEmail?: string): Promise<ClientRow> {
  const result = await pool.query(
    `INSERT INTO clients (name, safety_contact_email)
     VALUES ($1, $2)
     RETURNING client_id, name, safety_contact_email, created_at`,
    [name, _safetyEmail || null],
  );
  return result.rows[0];
}

export async function updateClient(clientId: string, fields: Record<string, unknown>): Promise<ClientRow | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length === 0) return null;
  params.push(clientId);
  const result = await pool.query(
    `UPDATE clients SET ${setClauses.join(', ')} WHERE client_id = $${idx}
     RETURNING client_id, name, safety_contact_email, created_at`,
    params,
  );
  return result.rows[0] || null;
}

export type ProjectRow = {
  project_id: string;
  client_id: string;
  title: string;
  type: string;
  due_date: string;
  created_at: string;
};

export async function getClientProjects(clientId: string): Promise<ProjectRow[]> {
  const result = await pool.query(
    'SELECT project_id, client_id, title, type, due_date, created_at FROM projects WHERE client_id = $1 ORDER BY title ASC',
    [clientId],
  );
  return result.rows;
}
