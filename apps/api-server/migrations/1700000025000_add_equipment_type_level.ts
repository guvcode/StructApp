import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`ALTER TYPE taxonomy_level_enum ADD VALUE 'equipment_type'`);

  pgm.addColumns('deficiency_records', {
    equipment_type: 'VARCHAR(255) NULL',
  });
};

export const down = (pgm: Migrator) => {
  pgm.removeColumns('deficiency_records', ['equipment_type']);
};