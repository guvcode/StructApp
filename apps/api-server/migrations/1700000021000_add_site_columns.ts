import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('sites', {
    address: { type: 'TEXT', notNull: false },
    status: { type: 'VARCHAR(20)', notNull: false, default: 'active' },
    safety_email: { type: 'VARCHAR(255)', notNull: false },
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('sites', ['safety_email', 'status', 'address']);
};