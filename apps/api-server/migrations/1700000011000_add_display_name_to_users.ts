import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('users', {
    display_name: 'VARCHAR(200) NULL',
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('users', ['display_name']);
};