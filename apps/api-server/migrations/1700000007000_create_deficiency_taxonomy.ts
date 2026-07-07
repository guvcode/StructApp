import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createType('taxonomy_level_enum', [
    'category',
    'component',
    'sub_component',
    'focus_area',
    'deficiency_category',
    'detailed_description',
  ]);

  pgm.createTable('deficiency_taxonomy', {
    node_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    parent_id: 'UUID NULL REFERENCES deficiency_taxonomy(node_id)',
    level: 'taxonomy_level_enum NOT NULL',
    category: 'VARCHAR(100) NOT NULL',
    label: 'VARCHAR(255) NOT NULL',
    display_order: 'SMALLINT NOT NULL DEFAULT 0',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql(`ALTER TABLE deficiency_taxonomy ADD CONSTRAINT unique_label_per_client_category_level UNIQUE (client_id, category, level, label)`);

  pgm.sql('ALTER TABLE deficiency_taxonomy ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    CREATE POLICY tenant_isolation_taxonomy ON deficiency_taxonomy
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql('CREATE TRIGGER trg_update_taxonomy_timestamp BEFORE UPDATE ON deficiency_taxonomy FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');

  pgm.createIndex('deficiency_taxonomy', 'parent_id', { name: 'idx_taxonomy_parent' });
  pgm.createIndex('deficiency_taxonomy', ['client_id', 'level'], { name: 'idx_taxonomy_client_level', where: 'is_active = TRUE' });
  pgm.createIndex('deficiency_taxonomy', ['client_id', 'category'], { name: 'idx_taxonomy_client_category', where: 'is_active = TRUE' });
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('deficiency_taxonomy', { name: 'idx_taxonomy_client_category' });
  pgm.dropIndex('deficiency_taxonomy', { name: 'idx_taxonomy_client_level' });
  pgm.dropIndex('deficiency_taxonomy', { name: 'idx_taxonomy_parent' });
  pgm.sql('DROP TRIGGER IF EXISTS trg_update_taxonomy_timestamp ON deficiency_taxonomy');
  pgm.sql('DROP POLICY IF EXISTS tenant_isolation_taxonomy ON deficiency_taxonomy');
  pgm.sql('ALTER TABLE deficiency_taxonomy DISABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE deficiency_taxonomy DROP CONSTRAINT IF EXISTS unique_label_per_client_category_level');
  pgm.dropTable('deficiency_taxonomy');
  pgm.dropType('taxonomy_level_enum');
};
