import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('timesheet_entries', {
    notes: { type: 'TEXT', notNull: false },
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('timesheet_entries', ['notes']);
};