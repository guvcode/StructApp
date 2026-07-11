import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createTable('structure_taxonomy_templates', {
    template_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    structure_type_id: 'UUID NOT NULL REFERENCES structure_types(structure_type_id) ON DELETE CASCADE',
    taxonomy_node_id: 'UUID NOT NULL REFERENCES deficiency_taxonomy(node_id) ON DELETE CASCADE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql('ALTER TABLE structure_taxonomy_templates ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    CREATE POLICY tenant_isolation_taxonomy_templates ON structure_taxonomy_templates
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    ALTER TABLE structure_taxonomy_templates
    ADD CONSTRAINT unique_structure_type_taxonomy_node UNIQUE (structure_type_id, taxonomy_node_id)
  `);

  pgm.createIndex('structure_taxonomy_templates', 'client_id', { name: 'idx_templates_client' });
  pgm.createIndex('structure_taxonomy_templates', 'structure_type_id', { name: 'idx_templates_structure_type' });
  pgm.createIndex('structure_taxonomy_templates', 'taxonomy_node_id', { name: 'idx_templates_taxonomy_node' });
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('structure_taxonomy_templates', { name: 'idx_templates_client' });
  pgm.dropIndex('structure_taxonomy_templates', { name: 'idx_templates_structure_type' });
  pgm.dropIndex('structure_taxonomy_templates', { name: 'idx_templates_taxonomy_node' });
  pgm.sql('ALTER TABLE structure_taxonomy_templates DROP CONSTRAINT IF EXISTS unique_structure_type_taxonomy_node');
  pgm.dropTable('structure_taxonomy_templates');
};
