import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createType('inspection_status_enum', [
    'Assigned',
    'In Progress',
    'Submitted',
    'Returned',
    'Approved',
  ]);
  pgm.createType('triage_state_enum', ['New', 'Resolved', 'Still Outstanding', 'Worsened']);
  pgm.createType('timesheet_status_enum', ['Draft', 'Submitted', 'Approved', 'Rejected']);
  pgm.createType('user_role_enum', ['Admin', 'Reviewer', 'Contractor']);
  pgm.createType('project_type_enum', ['One-Off', 'Recurring']);
  pgm.createType('import_batch_status_enum', ['Pending', 'Validated', 'Committed', 'Discarded']);
  pgm.createType('import_row_status_enum', ['Pending', 'Valid', 'Invalid']);
  pgm.createType('report_type_enum', ['draft_pdf', 'final_pdf', 'word', 'excel']);
  pgm.createType('report_job_status_enum', ['Queued', 'Processing', 'Ready', 'Failed']);

  pgm.createTable('clients', {
    client_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    name: 'VARCHAR(255) NOT NULL UNIQUE',
    safety_contact_email: 'VARCHAR(255) NOT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('users', {
    user_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    email: 'VARCHAR(255) NOT NULL UNIQUE',
    phone_number: 'VARCHAR(50)',
    password_hash: 'VARCHAR(255) NOT NULL',
    role: 'user_role_enum NOT NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    last_login_at: 'TIMESTAMP WITH TIME ZONE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('client_memberships', {
    membership_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    user_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('client_memberships', 'user_id', { name: 'idx_memberships_user' });
  pgm.createIndex('client_memberships', 'client_id', { name: 'idx_memberships_client' });
  pgm.addConstraint('client_memberships', 'unique_user_client', 'UNIQUE (user_id, client_id)');

  pgm.createTable('projects', {
    project_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT',
    title: 'VARCHAR(255) NOT NULL',
    type: 'project_type_enum NOT NULL DEFAULT \'One-Off\'',
    due_date: 'TIMESTAMP WITH TIME ZONE NOT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('sites', {
    site_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    project_id: 'UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL',
    name: 'VARCHAR(255) NOT NULL',
    iana_timezone: 'VARCHAR(100) NOT NULL DEFAULT \'UTC\'',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('structures', {
    structure_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    site_id: 'UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL',
    asset_tag: 'VARCHAR(100) NOT NULL',
    description: 'TEXT NOT NULL',
    qr_code_value: 'VARCHAR(150) UNIQUE NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('structures', 'asset_tag', { name: 'idx_structures_asset_tag' });
  pgm.createIndex('structures', 'qr_code_value', { name: 'idx_structures_qr' });

  pgm.createTable('inspections', {
    inspection_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    structure_id: 'UUID NOT NULL REFERENCES structures(structure_id) ON DELETE RESTRICT',
    client_id: 'UUID NOT NULL',
    inspector_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT',
    assigned_by: 'UUID NULL REFERENCES users(user_id)',
    assigned_at: 'TIMESTAMP WITH TIME ZONE',
    status: 'inspection_status_enum NOT NULL DEFAULT \'Assigned\'',
    returned_reason: 'TEXT NULL',
    approved_by: 'UUID NULL REFERENCES users(user_id)',
    approved_at: 'TIMESTAMP WITH TIME ZONE',
    submitted_at: 'TIMESTAMP WITH TIME ZONE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('inspections', 'status', { name: 'idx_inspections_status' });

  pgm.createTable('deficiency_records', {
    deficiency_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    inspection_id: 'UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL',
    previous_deficiency_id: 'UUID NULL REFERENCES deficiency_records(deficiency_id)',
    component: 'VARCHAR(100) NOT NULL',
    description: 'TEXT NOT NULL',
    severity: 'INT NOT NULL CHECK (severity BETWEEN 1 AND 5)',
    probability: 'INT NOT NULL CHECK (probability BETWEEN 1 AND 5)',
    consequences: 'INT NOT NULL CHECK (consequences BETWEEN 1 AND 5)',
    calculated_priority: 'VARCHAR(2) NOT NULL CHECK (calculated_priority IN (\'P1\', \'P2\', \'P3\', \'P4\', \'P5\'))',
    original_priority: 'VARCHAR(2) NULL CHECK (original_priority IN (\'P1\', \'P2\', \'P3\', \'P4\', \'P5\'))',
    is_overridden: 'BOOLEAN NOT NULL DEFAULT FALSE',
    overridden_by: 'UUID NULL REFERENCES users(user_id)',
    overridden_at: 'TIMESTAMP WITH TIME ZONE',
    triage_state: 'triage_state_enum NOT NULL DEFAULT \'New\'',
    gps_latitude: 'NUMERIC(9,6) NULL CHECK (gps_latitude BETWEEN -90 AND 90)',
    gps_longitude: 'NUMERIC(9,6) NULL CHECK (gps_longitude BETWEEN -180 AND 180)',
    reviewer_justification: 'TEXT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('deficiency_records', 'inspection_id', { name: 'idx_deficiencies_inspection_id' });
  pgm.createIndex('deficiency_records', 'calculated_priority', { name: 'idx_deficiencies_priority' });

  pgm.createTable('photos', {
    photo_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    deficiency_id: 'UUID NOT NULL REFERENCES deficiency_records(deficiency_id) ON DELETE CASCADE',
    storage_url: 'TEXT NOT NULL',
    display_order: 'SMALLINT NOT NULL DEFAULT 0',
    caption: 'TEXT NOT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('photo_evidence_metadata', {
    metadata_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    photo_id: 'UUID NOT NULL REFERENCES photos(photo_id) ON DELETE CASCADE',
    original_filename: 'VARCHAR(255) NOT NULL',
    captured_at: 'TIMESTAMP WITH TIME ZONE NOT NULL',
    camera_make: 'VARCHAR(100)',
    camera_model: 'VARCHAR(100)',
    raw_exif_payload: 'JSONB NOT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('timesheet_entries', {
    entry_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    user_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT',
    project_id: 'UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE',
    inspection_id: 'UUID NULL REFERENCES inspections(inspection_id) ON DELETE SET NULL',
    client_id: 'UUID NOT NULL',
    work_type: 'VARCHAR(100) NOT NULL',
    hours_logged: 'NUMERIC(4,2) NOT NULL CHECK (hours_logged > 0.00 AND hours_logged <= 24.00)',
    entry_date: 'DATE NOT NULL DEFAULT CURRENT_DATE',
    pre_inspection: 'BOOLEAN NOT NULL DEFAULT FALSE',
    status: 'timesheet_status_enum NOT NULL DEFAULT \'Draft\'',
    rejection_reason: 'TEXT NULL',
    approved_by: 'UUID NULL REFERENCES users(user_id)',
    approved_at: 'TIMESTAMP WITH TIME ZONE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('timesheet_entries', 'entry_date', { name: 'idx_timesheets_entry_date' });
  pgm.createIndex('timesheet_entries', 'pre_inspection', { name: 'idx_timesheets_pre_inspection', where: 'pre_inspection = TRUE' });

  pgm.createTable('import_batches', {
    batch_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    uploaded_by: 'UUID NOT NULL REFERENCES users(user_id)',
    original_filename: 'VARCHAR(255) NOT NULL',
    status: 'import_batch_status_enum NOT NULL DEFAULT \'Pending\'',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('import_rows', {
    row_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    batch_id: 'UUID NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE',
    raw_row: 'JSONB NOT NULL',
    validation_status: 'import_row_status_enum NOT NULL DEFAULT \'Pending\'',
    validation_errors: 'JSONB',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('import_rows', 'batch_id', { name: 'idx_import_rows_batch' });

  pgm.createTable('report_jobs', {
    job_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    project_id: 'UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE',
    requested_by: 'UUID NOT NULL REFERENCES users(user_id)',
    report_type: 'report_type_enum NOT NULL',
    status: 'report_job_status_enum NOT NULL DEFAULT \'Queued\'',
    download_url: 'TEXT NULL',
    error_message: 'TEXT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    completed_at: 'TIMESTAMP WITH TIME ZONE',
  });

  pgm.createTable('password_reset_tokens', {
    token_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    user_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE',
    token_hash: 'VARCHAR(255) NOT NULL UNIQUE',
    expires_at: 'TIMESTAMP WITH TIME ZONE NOT NULL',
    consumed_at: 'TIMESTAMP WITH TIME ZONE NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });
  pgm.createIndex('password_reset_tokens', 'user_id', { name: 'idx_password_reset_tokens_user' });
  pgm.createIndex('password_reset_tokens', 'token_hash', { name: 'idx_password_reset_tokens_hash' });

  pgm.createTable('system_audit_logs', {
    log_id: 'BIGSERIAL PRIMARY KEY',
    table_name: 'VARCHAR(100) NOT NULL',
    record_id: 'UUID NOT NULL',
    action: 'VARCHAR(50) NOT NULL',
    old_values: 'JSONB',
    new_values: 'JSONB',
    performed_by: 'VARCHAR(255) DEFAULT \'SYSTEM\'',
    timestamp: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_site_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_site_client BEFORE INSERT ON sites FOR EACH ROW EXECUTE FUNCTION set_site_client_id();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_structure_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM sites WHERE site_id = NEW.site_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_structure_client BEFORE INSERT ON structures FOR EACH ROW EXECUTE FUNCTION set_structure_client_id();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_inspection_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_inspection_client BEFORE INSERT ON inspections FOR EACH ROW EXECUTE FUNCTION set_inspection_client_id();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_deficiency_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM inspections WHERE inspection_id = NEW.inspection_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_deficiency_client BEFORE INSERT ON deficiency_records FOR EACH ROW EXECUTE FUNCTION set_deficiency_client_id();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_timesheet_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_timesheet_client BEFORE INSERT ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION set_timesheet_client_id();
  `);

  pgm.sql('ALTER TABLE sites ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE structures ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE inspections ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE deficiency_records ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE projects ENABLE ROW LEVEL SECURITY');

  pgm.sql(`
    CREATE POLICY tenant_isolation_sites ON sites
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_projects ON projects
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_structures ON structures
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_inspections ON inspections
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_deficiencies ON deficiency_records
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE POLICY tenant_isolation_timesheets ON timesheet_entries
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION protect_approved_deficiencies()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (SELECT status FROM inspections WHERE inspection_id = OLD.inspection_id) = 'Approved' THEN
        RAISE EXCEPTION 'Hardened Data Guard: modifications to an approved engineering record are blocked.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_lock_approved_records
    BEFORE UPDATE OR DELETE ON deficiency_records
    FOR EACH ROW EXECUTE FUNCTION protect_approved_deficiencies();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_timestamp_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql('CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_clients_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_sites_timestamp BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_structures_timestamp BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_inspections_timestamp BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_deficiencies_timestamp BEFORE UPDATE ON deficiency_records FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');
  pgm.sql('CREATE TRIGGER trg_update_timesheets_timestamp BEFORE UPDATE ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');

  pgm.sql(`
    CREATE OR REPLACE FUNCTION audit_deficiencies()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('deficiency_records', NEW.deficiency_id::uuid, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
      ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('deficiency_records', OLD.deficiency_id::uuid, TG_OP, to_jsonb(OLD), NULL);
      END IF;
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION audit_inspections()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('inspections', NEW.inspection_id::uuid, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
      ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('inspections', OLD.inspection_id::uuid, TG_OP, to_jsonb(OLD), NULL);
      END IF;
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION audit_timesheets()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('timesheet_entries', NEW.entry_id::uuid, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
      ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES ('timesheet_entries', OLD.entry_id::uuid, TG_OP, to_jsonb(OLD), NULL);
      END IF;
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql('CREATE TRIGGER trg_audit_deficiencies AFTER UPDATE OR DELETE ON deficiency_records FOR EACH ROW EXECUTE FUNCTION audit_deficiencies()');
  pgm.sql('CREATE TRIGGER trg_audit_inspections AFTER UPDATE OR DELETE ON inspections FOR EACH ROW EXECUTE FUNCTION audit_inspections()');
  pgm.sql('CREATE TRIGGER trg_audit_timesheets AFTER UPDATE OR DELETE ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION audit_timesheets()');
};

export const down = (pgm: Migrator) => {
  pgm.dropTable('password_reset_tokens');
  pgm.dropTable('timesheet_entries');
  pgm.dropTable('system_audit_logs');
  pgm.dropTable('report_jobs');
  pgm.dropTable('import_rows');
  pgm.dropTable('import_batches');
  pgm.dropTable('photo_evidence_metadata');
  pgm.dropTable('photos');
  pgm.dropTable('deficiency_records');
  pgm.dropTable('inspections');
  pgm.dropTable('structures');
  pgm.dropTable('sites');
  pgm.dropTable('projects');
  pgm.dropTable('client_memberships');
  pgm.dropTable('users');
  pgm.dropTable('clients');

  pgm.dropType('report_job_status_enum');
  pgm.dropType('report_type_enum');
  pgm.dropType('import_row_status_enum');
  pgm.dropType('import_batch_status_enum');
  pgm.dropType('project_type_enum');
  pgm.dropType('user_role_enum');
  pgm.dropType('timesheet_status_enum');
  pgm.dropType('triage_state_enum');
  pgm.dropType('inspection_status_enum');
  pgm.dropExtension('uuid-ossp', { ifExists: true });
};