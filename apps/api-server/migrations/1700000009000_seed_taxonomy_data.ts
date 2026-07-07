import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    INSERT INTO deficiency_taxonomy (client_id, level, category, label, display_order)
    SELECT c.client_id, 'category', 'Building Envelope', 'Building Envelope', 1
    FROM clients c
    WHERE NOT EXISTS (SELECT 1 FROM deficiency_taxonomy t WHERE t.client_id = c.client_id AND t.level = 'category');
  `);
  pgm.sql(`
    INSERT INTO deficiency_taxonomy (client_id, level, category, label, display_order)
    SELECT c.client_id, 'category', 'Structural Support', 'Structural Support', 2
    FROM clients c
    WHERE NOT EXISTS (SELECT 1 FROM deficiency_taxonomy t WHERE t.client_id = c.client_id AND t.level = 'category');
  `);
  pgm.sql(`
    INSERT INTO deficiency_taxonomy (client_id, level, category, label, display_order)
    SELECT c.client_id, 'category', 'Foundations & Geotechnical', 'Foundations & Geotechnical', 3
    FROM clients c
    WHERE NOT EXISTS (SELECT 1 FROM deficiency_taxonomy t WHERE t.client_id = c.client_id AND t.level = 'category');
  `);
  pgm.sql(`
    INSERT INTO deficiency_taxonomy (client_id, level, category, label, display_order)
    SELECT c.client_id, 'category', 'Process Equipment', 'Process Equipment', 4
    FROM clients c
    WHERE NOT EXISTS (SELECT 1 FROM deficiency_taxonomy t WHERE t.client_id = c.client_id AND t.level = 'category');
  `);
};

export const down = (pgm: Migrator) => {
  pgm.sql("DELETE FROM deficiency_taxonomy WHERE level = 'category'");
};