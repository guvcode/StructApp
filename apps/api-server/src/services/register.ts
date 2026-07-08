import { pool } from '../lib/db';

export async function listProjects(clientId?: string): Promise<Array<Record<string, unknown>>> {
  let query = 'SELECT project_id, client_id, name, code, status, region, start_date, end_date, created_at, updated_at FROM projects';
  const params: unknown[] = [];
  if (clientId) { query += ' WHERE client_id = $1'; params.push(clientId); }
  query += ' ORDER BY name ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getProjectById(projectId: string): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    'SELECT project_id, client_id, name, code, status, region, start_date, end_date, created_at, updated_at FROM projects WHERE project_id = $1',
    [projectId],
  );
  return result.rows[0] || null;
}

export async function createProject(input: {
  client_id: string; name: string; code: string; status?: string; region?: string; start_date?: string; end_date?: string;
}): Promise<Record<string, unknown>> {
  const result = await pool.query(
    'INSERT INTO projects (client_id, name, code, title, type, status, region, start_date, end_date, due_date) VALUES ($1, $2, $3, $2, \'One-Off\', $4, $5, $6, $7, NOW()) RETURNING project_id, client_id, name, code, status, region, start_date, end_date, created_at, updated_at',
    [input.client_id, input.name, input.code, input.status || 'active', input.region || null, input.start_date || null, input.end_date || null],
  );
  return result.rows[0];
}

export async function updateProject(projectId: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length === 0) return null;
  params.push(projectId);
  const result = await pool.query(
    `UPDATE projects SET ${setClauses.join(', ')} WHERE project_id = $${idx}
     RETURNING project_id, client_id, name, code, status, region, start_date, end_date, created_at, updated_at`,
    params,
  );
  return result.rows[0] || null;
}

export async function listSites(projectId?: string, clientId?: string): Promise<Array<Record<string, unknown>>> {
  let query = 'SELECT site_id, project_id, client_id, name, iana_timezone, created_at, updated_at FROM sites';
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (projectId) { conditions.push(`project_id = $${params.length + 1}`); params.push(projectId); }
  if (clientId) { conditions.push(`client_id = $${params.length + 1}`); params.push(clientId); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY name ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getSiteById(siteId: string): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    'SELECT site_id, project_id, client_id, name, iana_timezone, created_at, updated_at FROM sites WHERE site_id = $1',
    [siteId],
  );
  return result.rows[0] || null;
}

export async function createSite(input: {
  project_id: string; name: string; iana_timezone?: string;
}): Promise<Record<string, unknown>> {
  const result = await pool.query(
    'INSERT INTO sites (project_id, name, iana_timezone) VALUES ($1, $2, $3) RETURNING site_id, project_id, client_id, name, iana_timezone, created_at, updated_at',
    [input.project_id, input.name, input.iana_timezone || 'UTC'],
  );
  return result.rows[0];
}

export async function updateSite(siteId: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length === 0) return null;
  params.push(siteId);
  const result = await pool.query(
    `UPDATE sites SET ${setClauses.join(', ')} WHERE site_id = $${idx}
     RETURNING site_id, project_id, client_id, name, iana_timezone, created_at, updated_at`,
    params,
  );
  return result.rows[0] || null;
}

export async function listStructures(siteId?: string, clientId?: string): Promise<Array<Record<string, unknown>>> {
  let query = 'SELECT structure_id, site_id, client_id, asset_tag, description, qr_code_value, created_at, updated_at FROM structures';
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (siteId) { conditions.push(`site_id = $${params.length + 1}`); params.push(siteId); }
  if (clientId) { conditions.push(`client_id = $${params.length + 1}`); params.push(clientId); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY asset_tag ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function searchStructures(queryStr: string, clientId?: string): Promise<Array<Record<string, unknown>>> {
  const params: unknown[] = [`%${queryStr}%`];
  let sql = "SELECT structure_id, site_id, client_id, asset_tag, description, qr_code_value, created_at, updated_at FROM structures WHERE (asset_tag ILIKE $1 OR description ILIKE $1)";
  if (clientId) { sql += ` AND client_id = $2`; params.push(clientId); }
  sql += ' ORDER BY asset_tag ASC LIMIT 50';
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function getStructureById(structureId: string): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    'SELECT structure_id, site_id, client_id, asset_tag, description, qr_code_value, created_at, updated_at FROM structures WHERE structure_id = $1',
    [structureId],
  );
  return result.rows[0] || null;
}

export async function createStructure(input: {
  site_id: string; asset_tag: string; description: string; qr_code_value?: string;
}): Promise<Record<string, unknown>> {
  const result = await pool.query(
    'INSERT INTO structures (site_id, asset_tag, description, qr_code_value) VALUES ($1, $2, $3, $4) RETURNING structure_id, site_id, client_id, asset_tag, description, qr_code_value, created_at, updated_at',
    [input.site_id, input.asset_tag, input.description, input.qr_code_value || null],
  );
  return result.rows[0];
}

export async function updateStructure(structureId: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx++}`);
    params.push(value);
  }
  if (setClauses.length === 0) return null;
  params.push(structureId);
  const result = await pool.query(
    `UPDATE structures SET ${setClauses.join(', ')} WHERE structure_id = $${idx}
     RETURNING structure_id, site_id, client_id, asset_tag, description, qr_code_value, created_at, updated_at`,
    params,
  );
  return result.rows[0] || null;
}