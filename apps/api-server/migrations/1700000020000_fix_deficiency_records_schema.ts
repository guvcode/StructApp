import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.addColumns('deficiency_records', {
    structure_id: { type: 'UUID', notNull: false, references: 'structures(structure_id)' },
    created_by: { type: 'UUID', notNull: false, references: 'users(user_id)' },
    priority_tier: { type: 'VARCHAR(2)', notNull: false, check: "priority_tier IN ('P1', 'P2', 'P3', 'P4', 'P5')" },
    location_desc: { type: 'TEXT', notNull: false },
  });

  pgm.alterColumn('deficiency_records', 'component', { notNull: false });
  pgm.alterColumn('deficiency_records', 'severity', { notNull: false });
  pgm.alterColumn('deficiency_records', 'probability', { notNull: false });
  pgm.alterColumn('deficiency_records', 'consequences', { notNull: false });
};

export const down = (pgm: Migrator) => {
  pgm.alterColumn('deficiency_records', 'consequences', { notNull: true });
  pgm.alterColumn('deficiency_records', 'probability', { notNull: true });
  pgm.alterColumn('deficiency_records', 'severity', { notNull: true });
  pgm.alterColumn('deficiency_records', 'component', { notNull: true });

  pgm.dropColumns('deficiency_records', [
    'location_desc',
    'priority_tier',
    'created_by',
    'structure_id',
  ]);
};