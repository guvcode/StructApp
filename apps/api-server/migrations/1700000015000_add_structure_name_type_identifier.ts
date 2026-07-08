import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('structures', {
    name: { type: 'VARCHAR(255)' },
    type: { type: 'VARCHAR(100)' },
    identifier: { type: 'VARCHAR(100)' },
  });

  pgm.sql(`
    UPDATE structures SET name = description, type = qr_code_value, identifier = asset_tag
    WHERE name IS NULL
  `);

  pgm.alterColumn('structures', 'name', { notNull: true });
  pgm.alterColumn('structures', 'type', { notNull: true });
  pgm.alterColumn('structures', 'identifier', { notNull: true });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('structures', ['name', 'type', 'identifier']);
};