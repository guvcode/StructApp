import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    DELETE FROM structure_taxonomy_templates
    WHERE taxonomy_node_id IN (
      SELECT node_id FROM deficiency_taxonomy WHERE level = 'component'
      AND label IN (SELECT name FROM structure_types)
    )
  `);

  pgm.sql(`
    INSERT INTO structure_taxonomy_templates (client_id, structure_type_id, taxonomy_node_id)
    SELECT st.client_id, st.structure_type_id, tn.node_id
    FROM structure_types st
    INNER JOIN deficiency_taxonomy tn
      ON tn.client_id = st.client_id
      AND tn.level = 'equipment_type'
      AND tn.label = st.name
    ON CONFLICT (structure_type_id, taxonomy_node_id) DO NOTHING
  `);
};

export const down = (pgm: Migrator) => {
  pgm.sql(`
    DELETE FROM structure_taxonomy_templates
    WHERE taxonomy_node_id IN (
      SELECT node_id FROM deficiency_taxonomy
      WHERE level = 'equipment_type' AND label IN (SELECT name FROM structure_types)
    )
  `);
};