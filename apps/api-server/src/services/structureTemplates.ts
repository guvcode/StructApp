import { pool } from '../lib/db';

export type StructureTaxonomyTemplate = {
  template_id: string;
  structure_type_id: string;
  taxonomy_node_id: string;
  created_at: string;
};

export async function getTemplatesForStructureType(
  clientId: string,
  structureTypeId: string
): Promise<StructureTaxonomyTemplate[]> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      `SELECT template_id, structure_type_id, taxonomy_node_id, created_at
       FROM structure_taxonomy_templates
       WHERE client_id = $1 AND structure_type_id = $2
       ORDER BY created_at`,
      [clientId, structureTypeId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

export async function getTemplateAncestors(
  clientId: string,
  nodeId: string
): Promise<{ node_id: string; parent_id: string | null; level: string; label: string; category: string }[]> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const result = await client.query(
      `WITH RECURSIVE ancestors AS (
         SELECT node_id, parent_id, level, label, category, 0 AS depth
         FROM deficiency_taxonomy WHERE node_id = $1 AND client_id = $2
         UNION ALL
         SELECT t.node_id, t.parent_id, t.level, t.label, t.category, a.depth + 1
         FROM deficiency_taxonomy t
         JOIN ancestors a ON t.node_id = a.parent_id
       )
       SELECT node_id, parent_id, level, label, category
       FROM ancestors
       ORDER BY depth DESC`,
      [nodeId, clientId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}