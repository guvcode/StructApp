import { pool } from '../lib/db';

export async function updatePhoto(
  photoId: string,
  clientId: string,
  updates: { caption?: string; display_order?: number; purpose?: 'deficiency_evidence' | 'remediation_evidence' }
): Promise<{ photo_id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const fields: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (updates.caption !== undefined) {
      fields.push(`caption = $${idx++}`);
      values.push(updates.caption);
    }
    if (updates.display_order !== undefined) {
      fields.push(`display_order = $${idx++}`);
      values.push(updates.display_order);
    }
    if (updates.purpose !== undefined) {
      fields.push(`purpose = $${idx++}`);
      values.push(updates.purpose);
    }

    if (fields.length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    values.push(photoId);
    const result = await client.query(
      `UPDATE photos SET ${fields.join(', ')} WHERE photo_id = $${idx} RETURNING photo_id`,
      values
    );

    if (result.rowCount === 0) {
      throw new Error('PHOTO_NOT_FOUND');
    }

    await client.query('COMMIT');
    return { photo_id: result.rows[0].photo_id };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function softDeletePhoto(
  photoId: string,
  clientId: string
): Promise<{ photo_id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const current = await client.query(
      'SELECT photo_id FROM photos WHERE photo_id = $1 FOR UPDATE',
      [photoId]
    );
    if (current.rowCount === 0) throw new Error('PHOTO_NOT_FOUND');

    const result = await client.query(
      `UPDATE photos SET deleted_at = NOW() WHERE photo_id = $1 RETURNING photo_id`,
      [photoId]
    );

    await client.query('COMMIT');
    return { photo_id: result.rows[0].photo_id };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}