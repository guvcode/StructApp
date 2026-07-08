import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.alterColumn('structures', 'asset_tag', { notNull: false });
  pgm.alterColumn('structures', 'description', { notNull: false });
};

export const down = (pgm: Migrator) => {
  pgm.alterColumn('structures', 'asset_tag', { notNull: true });
  pgm.alterColumn('structures', 'description', { notNull: true });
};