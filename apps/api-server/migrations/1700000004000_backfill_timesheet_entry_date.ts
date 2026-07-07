// @ts-ignore
import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    UPDATE timesheet_entries
    SET entry_date = created_at::date
    WHERE entry_date IS NULL
  `);
};

export const down = (_pgm: Migrator) => {
};
