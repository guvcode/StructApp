import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createType('pending_structure_status_enum', ['pending', 'approved', 'rejected']);

  pgm.createTable('pending_structures', {
    pending_structure_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    local_id: 'VARCHAR(50) NOT NULL',
    site_id: 'UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL',
    contractor_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE',
    asset_tag: 'VARCHAR(100) NOT NULL',
    description: 'TEXT NOT NULL',
    qr_code_value: 'VARCHAR(150) NULL',
    status: 'pending_structure_status_enum NOT NULL DEFAULT \'pending\'',
    rejection_reason: 'TEXT NULL',
    reviewed_by: 'UUID NULL REFERENCES users(user_id)',
    reviewed_at: 'TIMESTAMPTZ NULL',
    created_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  });

  pgm.createIndex('pending_structures', 'client_id', { name: 'idx_pending_structures_client' });
  pgm.createIndex('pending_structures', 'contractor_id', { name: 'idx_pending_structures_contractor' });
  pgm.createIndex('pending_structures', 'status', { name: 'idx_pending_structures_status' });
  pgm.createIndex('pending_structures', 'local_id', { name: 'idx_pending_structures_local_id' });
  pgm.addConstraint('pending_structures', 'unique_local_id', 'UNIQUE (local_id)');

  pgm.createTable('pending_structure_deficiencies', {
    pending_deficiency_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    pending_structure_id: 'UUID NOT NULL REFERENCES pending_structures(pending_structure_id) ON DELETE CASCADE',
    local_id: 'VARCHAR(50) NOT NULL',
    category: 'VARCHAR(100) NULL',
    equipment_type: 'VARCHAR(255) NULL',
    component: 'VARCHAR(255) NULL',
    sub_component: 'VARCHAR(255) NULL',
    focus_area: 'VARCHAR(255) NULL',
    deficiency_category: 'VARCHAR(255) NULL',
    detailed_description: 'TEXT NULL',
    consequence_severity: 'INT NULL CHECK (consequence_severity BETWEEN 1 AND 5)',
    likelihood: 'VARCHAR(1) NULL CHECK (likelihood IN (\'A\',\'B\',\'C\',\'D\',\'E\'))',
    recommended_action: 'TEXT NULL',
    most_affected_consequence: 'VARCHAR(100) NULL',
    gps_latitude: 'NUMERIC(9,6) NULL CHECK (gps_latitude BETWEEN -90 AND 90)',
    gps_longitude: 'NUMERIC(9,6) NULL CHECK (gps_longitude BETWEEN -180 AND 180)',
    created_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  });

  pgm.createIndex('pending_structure_deficiencies', 'pending_structure_id', { name: 'idx_pending_deficiencies_bundle' });
  pgm.createIndex('pending_structure_deficiencies', 'local_id', { name: 'idx_pending_deficiencies_local_id' });

  pgm.createTable('pending_structure_photos', {
    pending_photo_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    pending_structure_id: 'UUID NOT NULL REFERENCES pending_structures(pending_structure_id) ON DELETE CASCADE',
    pending_deficiency_id: 'UUID NULL REFERENCES pending_structure_deficiencies(pending_deficiency_id) ON DELETE CASCADE',
    filename: 'VARCHAR(255) NOT NULL',
    storage_url: 'TEXT NULL',
    caption: 'TEXT NOT NULL DEFAULT \'\'',
    display_order: 'SMALLINT NOT NULL DEFAULT 0',
    created_at: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  });

  pgm.createIndex('pending_structure_photos', 'pending_structure_id', { name: 'idx_pending_photos_bundle' });

  pgm.sql('ALTER TABLE pending_structures ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE pending_structure_deficiencies ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE pending_structure_photos ENABLE ROW LEVEL SECURITY');

  pgm.sql(`
    CREATE POLICY tenant_isolation_pending_structures ON pending_structures
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_pending_structure_deficiencies ON pending_structure_deficiencies
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR EXISTS (
        SELECT 1 FROM pending_structures ps
        WHERE ps.pending_structure_id = pending_structure_id
          AND ps.client_id = current_setting('app.current_client_id', true)::uuid
      )
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_pending_structure_photos ON pending_structure_photos
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR EXISTS (
        SELECT 1 FROM pending_structures ps
        WHERE ps.pending_structure_id = pending_structure_id
          AND ps.client_id = current_setting('app.current_client_id', true)::uuid
      )
    );
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_pending_structure_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql('CREATE TRIGGER trg_update_pending_structures_timestamp BEFORE UPDATE ON pending_structures FOR EACH ROW EXECUTE FUNCTION update_pending_structure_timestamp()');
  pgm.sql('CREATE TRIGGER trg_update_pending_deficiencies_timestamp BEFORE UPDATE ON pending_structure_deficiencies FOR EACH ROW EXECUTE FUNCTION update_pending_structure_timestamp()');
};

export const down = (pgm: Migrator) => {
  pgm.dropTable('pending_structure_photos');
  pgm.dropTable('pending_structure_deficiencies');
  pgm.dropTable('pending_structures');
  pgm.dropType('pending_structure_status_enum');
};
