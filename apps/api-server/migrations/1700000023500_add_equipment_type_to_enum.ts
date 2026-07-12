import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`ALTER TYPE taxonomy_level_enum ADD VALUE IF NOT EXISTS 'equipment_type'`);
};

export const down = (pgm: Migrator) => {
  // Cannot remove enum values in PostgreSQL
};