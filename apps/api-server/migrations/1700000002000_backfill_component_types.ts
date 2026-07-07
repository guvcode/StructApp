import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    INSERT INTO component_types (client_id, name, is_active)
    SELECT DISTINCT client_id, component as name, TRUE
    FROM deficiency_records
    WHERE component IS NOT NULL
    ON CONFLICT (client_id, name) DO NOTHING
  `);

  pgm.sql(`
    UPDATE deficiency_records dr
    SET component_type_id = ct.component_type_id
    FROM component_types ct
    WHERE dr.component = ct.name
    AND dr.client_id = ct.client_id
    AND dr.component_type_id IS NULL
  `);

  pgm.createIndex('deficiency_records', 'component_type_id', { name: 'idx_deficiencies_component_type' });
};

export const down = (pgm: Migrator) => {
  pgm.sql('UPDATE deficiency_records SET component_type_id = NULL');
  pgm.dropIndex('deficiency_records', { name: 'idx_deficiencies_component_type' });
};