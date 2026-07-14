import { type Migrator } from 'node-pg-migrate';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface CanonicalNode {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
  deficiency_codes?: string[] | null;
  deficiency_mechanisms?: string[] | null;
}

interface CanonicalTaxonomy {
  nodes: CanonicalNode[];
}

function loadCanonicalTaxonomy(): CanonicalNode[] {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.resolve(dir, 'data/canonical-taxonomy.json');
  const raw: CanonicalTaxonomy = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  return raw.nodes;
}

export const up = (pgm: Migrator) => {
  const nodes = loadCanonicalTaxonomy();

  const parts: string[] = [];

  parts.push(`
    DO $$
    DECLARE
      c RECORD;
      old_id UUID;
      new_id UUID;
      id_map jsonb := '{}'::jsonb;
    BEGIN
      FOR c IN SELECT client_id FROM clients LOOP

        IF (SELECT COUNT(*) FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'focus_area' AND is_active = TRUE) > 50 THEN
          CONTINUE;
        END IF;

        UPDATE deficiency_taxonomy SET is_active = FALSE WHERE client_id = c.client_id;
`);

  for (const node of nodes) {
    const escapedCategory = node.category.replace(/'/g, "''");
    const escapedLabel = node.label.replace(/'/g, "''");

    const parentExpr = node.parent_id
      ? `(id_map->>'${node.parent_id}')::uuid`
      : 'NULL';

    const deficiencyCodes = node.deficiency_codes && node.deficiency_codes.length > 0
      ? `ARRAY[${node.deficiency_codes.map(c => `'${c.replace(/'/g, "''")}'`).join(', ')}]`
      : 'NULL';
    const deficiencyMechanisms = node.deficiency_mechanisms && node.deficiency_mechanisms.length > 0
      ? `ARRAY[${node.deficiency_mechanisms.map(m => `'${m.replace(/'/g, "''")}'`).join(', ')}]`
      : 'NULL';

    parts.push(`
        old_id := '${node.node_id}'::uuid;
        INSERT INTO deficiency_taxonomy (client_id, parent_id, level, category, label, display_order, is_active, deficiency_codes, deficiency_mechanisms)
        VALUES (
          c.client_id,
          ${parentExpr},
          '${node.level}',
          '${escapedCategory}',
          '${escapedLabel}',
          ${node.display_order},
          TRUE,
          ${deficiencyCodes},
          ${deficiencyMechanisms}
        )
        ON CONFLICT (client_id, category, level, label)
        DO UPDATE SET
          parent_id = ${parentExpr},
          display_order = ${node.display_order},
          is_active = TRUE,
          deficiency_codes = ${deficiencyCodes},
          deficiency_mechanisms = ${deficiencyMechanisms}
        RETURNING node_id INTO new_id;

        id_map := id_map || jsonb_build_object(old_id::text, new_id::text);
`);
  }

  parts.push(`
        DELETE FROM structure_taxonomy_templates st
        USING deficiency_taxonomy old_node
        WHERE st.taxonomy_node_id = old_node.node_id
          AND old_node.client_id = c.client_id
          AND old_node.is_active = FALSE;

        INSERT INTO structure_taxonomy_templates (client_id, structure_type_id, taxonomy_node_id)
        SELECT c.client_id, st.structure_type_id, new_et.node_id
        FROM structure_types st
        JOIN deficiency_taxonomy old_et ON old_et.client_id = c.client_id
          AND old_et.label = st.name
          AND old_et.level = 'equipment_type'
          AND old_et.is_active = FALSE
        JOIN deficiency_taxonomy new_et ON new_et.client_id = c.client_id
          AND new_et.label = st.name
          AND new_et.level = 'equipment_type'
          AND new_et.is_active = TRUE
        WHERE st.client_id = c.client_id
        ON CONFLICT (structure_type_id, taxonomy_node_id) DO NOTHING;
`);

  parts.push(`
      END LOOP;
    END $$;
  `);

  pgm.sql(parts.join('\n'));
};

export const down = (pgm: Migrator) => {
  pgm.sql(`
    DO $$
    DECLARE
      c RECORD;
    BEGIN
      FOR c IN SELECT client_id FROM clients LOOP
        DELETE FROM structure_taxonomy_templates
        WHERE taxonomy_node_id IN (
          SELECT node_id FROM deficiency_taxonomy
          WHERE client_id = c.client_id
            AND level IN ('focus_area', 'sub_component', 'component', 'equipment_type', 'category')
            AND is_active = TRUE
            AND node_id NOT IN (
              SELECT parent_id FROM deficiency_taxonomy
              WHERE client_id = c.client_id AND is_active = FALSE
            )
        );

        DELETE FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'focus_area' AND is_active = TRUE;
        DELETE FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'sub_component' AND is_active = TRUE;
        DELETE FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'component' AND is_active = TRUE;
        DELETE FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'equipment_type' AND is_active = TRUE;
        DELETE FROM deficiency_taxonomy WHERE client_id = c.client_id AND level = 'category' AND is_active = TRUE;

        UPDATE deficiency_taxonomy SET is_active = TRUE
        WHERE client_id = c.client_id AND is_active = FALSE;
      END LOOP;
    END $$;
  `);
};