import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql("ALTER TYPE report_type_enum ADD VALUE IF NOT EXISTS 'csv'");
};

export const down = (pgm: Migrator) => {
  // PostgreSQL does not support removing values from an enum.
  // The down migration is a no-op — production revert would require
  // creating a new type without 'csv' and migrating.
};