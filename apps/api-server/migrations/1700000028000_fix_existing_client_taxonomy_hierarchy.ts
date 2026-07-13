import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    UPDATE deficiency_taxonomy comp
    SET parent_id = eq.node_id
    FROM deficiency_taxonomy eq
    WHERE comp.level = 'component'
      AND comp.parent_id IN (SELECT node_id FROM deficiency_taxonomy WHERE level = 'category')
      AND eq.level = 'equipment_type'
      AND comp.client_id = eq.client_id
      AND comp.category = eq.category
      AND comp.label = eq.label
  `);
};

export const down = () => {
  // No rollback — this is a data fix
};