import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.sql(`
    DELETE FROM inspections a
    USING inspections b
    WHERE a.inspection_id < b.inspection_id
      AND a.structure_id = b.structure_id
      AND a.inspector_id = b.inspector_id
      AND a.status IN ('Assigned', 'In Progress')
      AND b.status IN ('Assigned', 'In Progress')
  `);

  pgm.createIndex('inspections', ['structure_id', 'inspector_id'], {
    unique: true,
    where: "status IN ('Assigned', 'In Progress')",
    name: 'idx_inspections_active_duplicate_guard',
  });
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('inspections', ['structure_id', 'inspector_id'], {
    name: 'idx_inspections_active_duplicate_guard',
  });
};