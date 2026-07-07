import { pool } from '../lib/db';

export async function listComponentTypes(
  clientId: string,
  includeInactive: boolean = false
): Promise<Array<{ component_type_id: string; name: string; is_active: boolean }>> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    if (includeInactive) {
      const result = await client.query(
        'SELECT component_type_id, name, is_active FROM component_types WHERE client_id = $1 ORDER BY name',
        [clientId]
      );
      return result.rows;
    }

    const result = await client.query(
      'SELECT component_type_id, name, is_active FROM component_types WHERE client_id = $1 AND is_active = TRUE ORDER BY name',
      [clientId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function listWorkTypes(
  clientId: string,
  includeInactive: boolean = false
): Promise<Array<{ work_type_id: string; name: string; is_active: boolean }>> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    if (includeInactive) {
      const result = await client.query(
        'SELECT work_type_id, name, is_active FROM work_types WHERE client_id = $1 ORDER BY name',
        [clientId]
      );
      return result.rows;
    }

    const result = await client.query(
      'SELECT work_type_id, name, is_active FROM work_types WHERE client_id = $1 AND is_active = TRUE ORDER BY name',
      [clientId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function createComponentType(
  clientId: string,
  name: string
): Promise<{ component_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const result = await client.query(
      'INSERT INTO component_types (client_id, name) VALUES ($1, $2) RETURNING component_type_id, name',
      [clientId, name]
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

export async function createWorkType(
  clientId: string,
  name: string
): Promise<{ work_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const result = await client.query(
      'INSERT INTO work_types (client_id, name) VALUES ($1, $2) RETURNING work_type_id, name',
      [clientId, name]
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

export async function updateComponentType(
  clientId: string,
  componentTypeId: string,
  updates: { name?: string; is_active?: boolean }
): Promise<{ component_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const fields: string[] = [];
    const values: (string | boolean)[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(componentTypeId);
    const result = await client.query(
      `UPDATE component_types SET ${fields.join(', ')} WHERE component_type_id = $${idx} RETURNING component_type_id, name`,
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

export async function listStructureTypes(
  clientId: string,
  includeInactive: boolean = false
): Promise<Array<{ structure_type_id: string; name: string; is_active: boolean }>> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    if (includeInactive) {
      const result = await client.query(
        'SELECT structure_type_id, name, is_active FROM structure_types WHERE client_id = $1 ORDER BY name',
        [clientId]
      );
      return result.rows;
    }

    const result = await client.query(
      'SELECT structure_type_id, name, is_active FROM structure_types WHERE client_id = $1 AND is_active = TRUE ORDER BY name',
      [clientId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function createStructureType(
  clientId: string,
  name: string
): Promise<{ structure_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);

    const result = await client.query(
      'INSERT INTO structure_types (client_id, name) VALUES ($1, $2) RETURNING structure_type_id, name',
      [clientId, name]
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

export async function updateStructureType(
  clientId: string,
  structureTypeId: string,
  updates: { name?: string; is_active?: boolean }
): Promise<{ structure_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const fields: string[] = [];
    const values: (string | boolean)[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(structureTypeId);
    const result = await client.query(
      `UPDATE structure_types SET ${fields.join(', ')} WHERE structure_type_id = $${idx} RETURNING structure_type_id, name`,
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

export async function updateWorkType(
  clientId: string,
  workTypeId: string,
  updates: { name?: string; is_active?: boolean }
): Promise<{ work_type_id: string; name: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const fields: string[] = [];
    const values: (string | boolean)[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(workTypeId);
    const result = await client.query(
      `UPDATE work_types SET ${fields.join(', ')} WHERE work_type_id = $${idx} RETURNING work_type_id, name`,
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