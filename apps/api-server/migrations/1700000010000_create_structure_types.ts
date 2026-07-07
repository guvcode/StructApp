import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createTable('structure_types', {
    structure_type_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    name: 'VARCHAR(100) NOT NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql('ALTER TABLE structure_types ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    CREATE POLICY tenant_isolation_structure_types ON structure_types
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);
  pgm.sql(`
    CREATE TRIGGER trg_update_structure_types_timestamp BEFORE UPDATE ON structure_types
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()
  `);

  pgm.createIndex('structure_types', 'client_id', { name: 'idx_structure_types_client' });
  pgm.sql('ALTER TABLE structure_types ADD CONSTRAINT uq_structure_types_client_name UNIQUE (client_id, name)');
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('structure_types', { name: 'idx_structure_types_client' });
  pgm.dropTable('structure_types');
};