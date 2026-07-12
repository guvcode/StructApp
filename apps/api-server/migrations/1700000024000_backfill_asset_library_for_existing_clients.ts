import { type Migrator } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SeedFocusArea { name: string; focus_areas: string[] }
interface SeedComponent { name: string; sub_components: SeedFocusArea[] }
interface SeedCategory { category: string; components: SeedComponent[] }

function loadAssetLibrary(): SeedCategory[] {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.resolve(dir, 'data/asset-library-seed.json');
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
}

export const up = (pgm: Migrator) => {
  const categories = loadAssetLibrary();

  const equipmentTypeNames = new Set<string>();
  for (const cat of categories) {
    for (const comp of cat.components) {
      equipmentTypeNames.add(comp.name);
    }
  }
  const sortedNames = Array.from(equipmentTypeNames).sort();

  const sql = `
    DO $$
    DECLARE
      c RECORD;
      cat_id UUID;
      comp_id UUID;
      sub_id UUID;
      focus_id UUID;
      st_id UUID;
    BEGIN
      FOR c IN SELECT client_id FROM clients LOOP

        -- Skip if this client already has asset-library taxonomy (more than 10 categories)
        IF (SELECT COUNT(*) FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'category') > 10 THEN
          CONTINUE;
        END IF;
`;

  const parts: string[] = [];

  let displayOrder = 0;
  for (const cat of categories) {
    displayOrder++;
    const catLabel = cat.category.replace(/'/g, "''");

    parts.push(`
        -- Category: ${catLabel}
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, NULL, 'category', '${catLabel}', '${catLabel}', ${displayOrder})
          ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order
          RETURNING node_id INTO cat_id;
`);

    let compOrder = 0;
    for (const comp of cat.components) {
      compOrder++;
      const compLabel = comp.name.replace(/'/g, "''");

      parts.push(`
        -- Component: ${compLabel}
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, cat_id, 'component', '${catLabel}', '${compLabel}', ${compOrder})
          ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order
          RETURNING node_id INTO comp_id;
`);

      let subOrder = 0;
      for (const sub of comp.sub_components) {
        subOrder++;
        const subLabel = sub.name.replace(/'/g, "''");

        parts.push(`
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, comp_id, 'sub_component', '${catLabel}', '${subLabel}', ${subOrder})
          ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order
          RETURNING node_id INTO sub_id;
`);

        let focusOrder = 0;
        for (const focus of sub.focus_areas) {
          focusOrder++;
          const focusLabel = focus.replace(/'/g, "''");

          parts.push(`
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order)
          VALUES (c.client_id, sub_id, 'focus_area', '${catLabel}', '${focusLabel}', ${focusOrder})
          ON CONFLICT (client_id, category, level, label) DO UPDATE SET display_order = EXCLUDED.display_order;
`);
        }
      }
    }
  }

  parts.push(`
        -- =====================================================================
        -- Ensure structure_types exist for all equipment type names
        -- =====================================================================
`);
  for (const name of sortedNames) {
    const escapedName = name.replace(/'/g, "''");
    parts.push(`
        INSERT INTO structure_types (client_id, name)
          VALUES (c.client_id, '${escapedName}')
          ON CONFLICT (client_id, name) DO UPDATE SET name = EXCLUDED.name
          RETURNING structure_type_id INTO st_id;
`);
  }

  parts.push(`
        -- =====================================================================
        -- Create structure_taxonomy_templates linking each structure_type
        -- to its matching component-level taxonomy node
        -- =====================================================================
`);
  for (const cat of categories) {
    const catLabel = cat.category.replace(/'/g, "''");
    for (const comp of cat.components) {
      const compLabel = comp.name.replace(/'/g, "''");
      parts.push(`
        SELECT structure_type_id INTO st_id FROM structure_types WHERE client_id = c.client_id AND name = '${compLabel}';
        SELECT node_id INTO comp_id FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'component' AND category = '${catLabel}' AND label = '${compLabel}';
        IF st_id IS NOT NULL AND comp_id IS NOT NULL THEN
          INSERT INTO structure_taxonomy_templates (client_id, structure_type_id, taxonomy_node_id)
            VALUES (c.client_id, st_id, comp_id)
            ON CONFLICT (structure_type_id, taxonomy_node_id) DO NOTHING;
        END IF;
`);
    }
  }

  const footer = `
      END LOOP;
    END $$;
  `;

  pgm.sql(sql + parts.join('') + footer);
};

export const down = (pgm: Migrator) => {
  pgm.sql(`
    DELETE FROM structure_taxonomy_templates
    WHERE taxonomy_node_id IN (
      SELECT node_id FROM deficiency_taxonomy
      WHERE level IN ('focus_area', 'sub_component', 'component')
      AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope')
      AND node_id NOT IN (SELECT parent_id FROM deficiency_taxonomy WHERE parent_id IS NOT NULL)
    );
    DELETE FROM deficiency_taxonomy
    WHERE level = 'focus_area'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
    DELETE FROM deficiency_taxonomy
    WHERE level = 'sub_component'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
    DELETE FROM deficiency_taxonomy
    WHERE level = 'component'
    AND category IN ('Process Equipment (Mechanical)', 'Structural Support', 'Foundations & Geotechnical', 'Building Envelope');
  `);
};