import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_COMPONENT_TYPES = [
  'Support Frame',
  'Bolted Connection',
  'Welded Joint',
  'Corrosion Protection Coating',
  'Foundation/Footing',
  'Handrail/Guardrail',
];

const DEFAULT_WORK_TYPES = [
  'On-Site Inspection',
  'Travel',
  'Report Writing',
  'Client Meeting',
];

type SeedFocusArea = string;
type SeedSubComponent = { name: string; focus_areas: SeedFocusArea[] };
type SeedComponent = { name: string; sub_components: SeedSubComponent[] };
type SeedCategory = { category: string; components: SeedComponent[] };

function loadAssetLibrary(): SeedCategory[] {
  const seedPath = path.resolve(__dirname, '../../migrations/data/asset-library-seed.json');
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
}

function getUniqueEquipmentTypes(categories: SeedCategory[]): string[] {
  const names = new Set<string>();
  for (const cat of categories) {
    for (const comp of cat.components) {
      names.add(comp.name);
    }
  }
  return Array.from(names).sort();
}

export async function seedDefaultPicklists(pool: Pool, clientId: string): Promise<void> {
  const client = await pool.connect();
  try {
    for (const name of DEFAULT_COMPONENT_TYPES) {
      await client.query(
        'INSERT INTO component_types (client_id, name) VALUES ($1, $2) ON CONFLICT (client_id, name) DO NOTHING',
        [clientId, name]
      );
    }
    for (const name of DEFAULT_WORK_TYPES) {
      await client.query(
        'INSERT INTO work_types (client_id, name) VALUES ($1, $2) ON CONFLICT (client_id, name) DO NOTHING',
        [clientId, name]
      );
    }
  } finally {
    client.release();
  }
}

export async function seedAssetLibrary(pool: Pool, clientId: string): Promise<void> {
  const categories = loadAssetLibrary();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const equipmentTypeNames = getUniqueEquipmentTypes(categories);

    const structureTypeIds = new Map<string, string>();
    for (const name of equipmentTypeNames) {
      const result = await client.query(
        `INSERT INTO structure_types (client_id, name) VALUES ($1, $2)
         ON CONFLICT (client_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING structure_type_id`,
        [clientId, name]
      );
      structureTypeIds.set(name, result.rows[0].structure_type_id);
    }

    let displayOrder = 0;
    for (const cat of categories) {
      displayOrder++;

      const catResult = await client.query(
        `INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
         VALUES ($1, NULL, 'category', $2, $2, $3)
         ON CONFLICT (client_id, category, level, label) DO NOTHING
         RETURNING node_id`,
        [clientId, cat.category, displayOrder]
      );

      let catId: string;
      if (catResult.rows.length > 0) {
        catId = catResult.rows[0].node_id;
      } else {
        const existing = await client.query(
          `SELECT node_id FROM deficiency_taxonomy
           WHERE client_id = $1 AND level = 'category' AND label = $2`,
          [clientId, cat.category]
        );
        catId = existing.rows[0].node_id;
      }

      let compOrder = 0;
      for (const comp of cat.components) {
        compOrder++;

        const compResult = await client.query(
          `INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
           VALUES ($1, $2, 'equipment_type', $3, $4, $5)
           ON CONFLICT (client_id, category, level, label) DO NOTHING
           RETURNING node_id`,
          [clientId, catId, cat.category, comp.name, compOrder]
        );

        let compId: string;
        if (compResult.rows.length > 0) {
          compId = compResult.rows[0].node_id;
        } else {
          const existing = await client.query(
            `SELECT node_id FROM deficiency_taxonomy
             WHERE client_id = $1 AND level = 'equipment_type' AND category = $2 AND label = $3`,
            [clientId, cat.category, comp.name]
          );
          compId = existing.rows[0].node_id;
        }

        const structureTypeId = structureTypeIds.get(comp.name);
        if (structureTypeId) {
          await client.query(
            `INSERT INTO structure_taxonomy_templates (client_id, structure_type_id, taxonomy_node_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (structure_type_id, taxonomy_node_id) DO NOTHING`,
            [clientId, structureTypeId, compId]
          );
        }

        let subOrder = 0;
        for (const sub of comp.sub_components) {
          subOrder++;

          const subResult = await client.query(
            `INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
VALUES ($1, $2, 'component', $3, $4, $5)
           ON CONFLICT (client_id, category, level, label) DO NOTHING
           RETURNING node_id`,
          [clientId, compId, cat.category, sub.name, subOrder]
        );

        let subId: string;
        if (subResult.rows.length > 0) {
          subId = subResult.rows[0].node_id;
        } else {
          const existing = await client.query(
            `SELECT node_id FROM deficiency_taxonomy
             WHERE client_id = $1 AND level = 'component' AND category = $2 AND label = $3`,
              [clientId, cat.category, sub.name]
            );
            subId = existing.rows[0].node_id;
          }

          let focusOrder = 0;
          for (const focusArea of sub.focus_areas) {
            focusOrder++;

            await client.query(
              `INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
               VALUES ($1, $2, 'sub_component', $3, $4, $5)
               ON CONFLICT (client_id, category, level, label) DO NOTHING`,
              [clientId, subId, cat.category, focusArea, focusOrder]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}