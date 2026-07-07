import { Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumn('photos', {
    deleted_at: 'TIMESTAMP WITH TIME ZONE NULL',
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumn('photos', 'deleted_at');
};