import { pool } from '../lib/db';

export type TaxonomyNode = {
  node_id: string;
  client_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
  deficiency_codes: string[] | null;
  deficiency_mechanisms: string[] | null;
};

export async function listTaxonomy(
  clientId: string,
  includeInactive: boolean = false
): Promise<TaxonomyNode[]> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    if (includeInactive) {
      const result = await client.query(
        'SELECT node_id, client_id, parent_id, level, category, label, display_order, is_active, deficiency_codes, deficiency_mechanisms FROM deficiency_taxonomy WHERE client_id = $1 ORDER BY display_order, label',
        [clientId]
      );
      return result.rows;
    }

    const result = await client.query(
      'SELECT node_id, client_id, parent_id, level, category, label, display_order, is_active, deficiency_codes, deficiency_mechanisms FROM deficiency_taxonomy WHERE client_id = $1 AND is_active = TRUE ORDER BY display_order, label',
      [clientId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function createTaxonomyNode(
  clientId: string,
  input: {
    parent_id: string | null;
    level: string;
    category: string;
    label: string;
    display_order?: number;
  }
): Promise<{ node_id: string; label: string; level: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const result = await client.query(
      `INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING node_id, label, level`,
      [clientId, input.parent_id, input.level, input.category, input.label, input.display_order ?? 0]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateTaxonomyNode(
  clientId: string,
  nodeId: string,
  updates: {
    parent_id?: string | null;
    label?: string;
    category?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<{ node_id: string; label: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let idx = 1;

    if (updates.parent_id !== undefined) {
      fields.push(`parent_id = $${idx++}`);
      values.push(updates.parent_id);
    }
    if (updates.label !== undefined) {
      fields.push(`label = $${idx++}`);
      values.push(updates.label);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(updates.category);
    }
    if (updates.display_order !== undefined) {
      fields.push(`display_order = $${idx++}`);
      values.push(updates.display_order);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(nodeId);
    const result = await client.query(
      `UPDATE deficiency_taxonomy SET ${fields.join(', ')} WHERE node_id = $${idx} RETURNING node_id, label`,
      values
    );

    if (result.rowCount === 0) {
      throw new Error('NOT_FOUND');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}