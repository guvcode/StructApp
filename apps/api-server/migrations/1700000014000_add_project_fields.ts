import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('projects', {
    name: { type: 'VARCHAR(255)' },
    code: { type: 'VARCHAR(100)' },
    status: { type: 'VARCHAR(50)', notNull: true, default: 'active' },
    region: { type: 'VARCHAR(255)' },
    start_date: { type: 'TIMESTAMP WITH TIME ZONE' },
    end_date: { type: 'TIMESTAMP WITH TIME ZONE' },
  });

  pgm.sql(`
    UPDATE projects SET name = title, code = project_id, status = 'active'
    WHERE name IS NULL
  `);

  pgm.alterColumn('projects', 'name', { notNull: true });
  pgm.alterColumn('projects', 'code', { notNull: true });
};

export const down = (pgm: Migrator) => {
  pgm.dropColumns('projects', ['name', 'code', 'status', 'region', 'start_date', 'end_date']);
};