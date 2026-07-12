import { type Migrator } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface FocusArea { name: string; focus_areas: string[] }
interface Comp { name: string; sub_components: FocusArea[] }
interface Cat { category: string; components: Comp[] }

function loadAssetLibrary(): Cat[] {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.resolve(dir, 'data/asset-library-seed.json');
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
}

export const up = (pgm: Migrator) => {
  const categories = loadAssetLibrary();
  const dataJson = JSON.stringify(categories);

  const parts: string[] = [];
  parts.push(`DO $$`);
  parts.push(`DECLARE`);
  parts.push(`  c RECORD;`);
  parts.push(`  cat_record RECORD;`);
  parts.push(`  eq_type_record RECORD;`);
  parts.push(`  sub_comp_record RECORD;`);
  parts.push(`  focus_record RECORD;`);
  parts.push(`  data_json jsonb := '${dataJson.replace(/'/g, "''")}'::jsonb;`);
  parts.push(`  cat_id UUID;`);
  parts.push(`  eq_type_id UUID;`);
  parts.push(`  new_comp_id UUID;`);
  parts.push(`  comp_idx INT;`);
  parts.push(`  sub_idx INT;`);
  parts.push(`BEGIN`);
  parts.push(`  FOR c IN SELECT client_id FROM clients LOOP`);

  for (const cat of categories) {
    const catLabel = cat.category.replace(/'/g, "''");

    parts.push(`
    -- ===== ${catLabel} =====
    cat_id := NULL;
    SELECT node_id INTO cat_id FROM deficiency_taxonomy
      WHERE client_id = c.client_id AND level = 'category' AND label = '${catLabel}'
      LIMIT 1;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Remove old taxonomy nodes (component → sub_component → focus_area → deficiency_category → detailed_description)
    -- whose component-level parent was the category node directly (old seed hierarchy).
    -- These conflict with the new hierarchy where component is parented to equipment_type.
    WITH RECURSIVE old_nodes AS (
      SELECT node_id FROM deficiency_taxonomy
        WHERE client_id = c.client_id AND category = '${catLabel}'
        AND level = 'component' AND parent_id = cat_id
      UNION ALL
      SELECT dt.node_id FROM deficiency_taxonomy dt
        INNER JOIN old_nodes ON dt.parent_id = old_nodes.node_id
    )
    DELETE FROM deficiency_taxonomy WHERE node_id IN (SELECT node_id FROM old_nodes);

    -- Insert the correct hierarchy: equipment_type → component → sub_component
    FOR eq_type_record IN SELECT * FROM jsonb_to_recordset(cat_record.components) AS x(name text, sub_components jsonb) LOOP
      SELECT node_id INTO eq_type_id FROM deficiency_taxonomy
        WHERE client_id = c.client_id AND level = 'equipment_type' AND category = '${catLabel}' AND label = eq_type_record.name
        LIMIT 1;
      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      comp_idx := 0;
      FOR sub_comp_record IN SELECT * FROM jsonb_to_recordset(eq_type_record.sub_components) AS x(name text, focus_areas jsonb) LOOP
        comp_idx := comp_idx + 1;

        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, eq_type_id, 'component', '${catLabel}', sub_comp_record.name, comp_idx)
          ON CONFLICT (client_id, category, level, label) DO NOTHING
          RETURNING node_id INTO new_comp_id;

        IF new_comp_id IS NULL THEN
          SELECT node_id INTO new_comp_id FROM deficiency_taxonomy
            WHERE client_id = c.client_id AND level = 'component' AND category = '${catLabel}' AND label = sub_comp_record.name;
        END IF;

        sub_idx := 0;
        FOR focus_record IN SELECT * FROM jsonb_array_elements_text(sub_comp_record.focus_areas) AS val LOOP
          sub_idx := sub_idx + 1;
          INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
            VALUES (c.client_id, new_comp_id, 'sub_component', '${catLabel}', focus_record.val, sub_idx)
            ON CONFLICT (client_id, category, level, label) DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;`);
  }

  parts.push(`  END LOOP;`);
  parts.push(`END $$;`);

  pgm.sql(parts.join('\n'));
};

export const down = (pgm: Migrator) => {
  // No rollback — this is a data fix
};