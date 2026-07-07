import { type Migrator } from 'node-pg-migrate';

export const up = (pgm: Migrator) => {
  pgm.createType('remediation_status_enum', [
    'Open',
    'Remediation_Scheduled',
    'Remediated_Pending_Verification',
    'Verified_Closed',
  ]);

  pgm.createType('photo_purpose_enum', ['deficiency_evidence', 'remediation_evidence']);

  pgm.createType('inspection_mode_enum', ['onsite', 'post_inspection']);

  pgm.createTable('inspection_schedules', {
    schedule_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    structure_id: 'UUID NOT NULL REFERENCES structures(structure_id) ON DELETE CASCADE',
    client_id: 'UUID NOT NULL',
    default_inspector_id: 'UUID NULL REFERENCES users(user_id)',
    recurrence_interval_days: 'INT NOT NULL CHECK (recurrence_interval_days > 0)',
    next_due_date: 'DATE NOT NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_schedule_client_id()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_schedule_client BEFORE INSERT ON inspection_schedules
    FOR EACH ROW EXECUTE FUNCTION set_schedule_client_id();
  `);

  pgm.sql('ALTER TABLE inspection_schedules ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    CREATE POLICY tenant_isolation_schedules ON inspection_schedules
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.sql('CREATE TRIGGER trg_update_schedules_timestamp BEFORE UPDATE ON inspection_schedules FOR EACH ROW EXECUTE FUNCTION update_timestamp_column()');

  pgm.createIndex('inspection_schedules', 'structure_id', { name: 'idx_schedules_structure' });
  pgm.createIndex('inspection_schedules', 'next_due_date', { name: 'idx_schedules_next_due', where: 'is_active = TRUE' });

  pgm.addColumns('inspections', {
    scheduled_date: 'DATE NULL',
    schedule_id: 'UUID NULL REFERENCES inspection_schedules(schedule_id)',
    reopened_by: 'UUID NULL REFERENCES users(user_id)',
    reopened_at: 'TIMESTAMP WITH TIME ZONE NULL',
    reopen_reason: 'TEXT NULL',
    inspection_mode: 'inspection_mode_enum NOT NULL DEFAULT \'onsite\'',
  });

  pgm.createIndex('inspections', 'scheduled_date', { name: 'idx_inspections_scheduled_date' });
  pgm.createIndex('inspections', ['schedule_id', 'scheduled_date'], { name: 'idx_inspections_schedule_occurrence', where: 'schedule_id IS NOT NULL' });

  pgm.createTable('component_types', {
    component_type_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    name: 'VARCHAR(100) NOT NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.createTable('work_types', {
    work_type_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    client_id: 'UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE',
    name: 'VARCHAR(100) NOT NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  });

  pgm.sql('ALTER TABLE component_types ENABLE ROW LEVEL SECURITY');
  pgm.sql('ALTER TABLE work_types ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    CREATE POLICY tenant_isolation_component_types ON component_types
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);
  pgm.sql(`
    CREATE POLICY tenant_isolation_work_types ON work_types
    USING (
      current_setting('app.bypass_tenant_check', true) = 'true'
      OR client_id = current_setting('app.current_client_id', true)::uuid
    );
  `);

  pgm.createIndex('component_types', 'client_id', { name: 'idx_component_types_client', unique: true });
  pgm.createIndex('work_types', 'client_id', { name: 'idx_work_types_client', where: 'is_active = TRUE' });
  pgm.sql(`
    ALTER TABLE component_types ADD CONSTRAINT unique_component_name_per_client UNIQUE (client_id, name);
  `);
  pgm.sql(`
    ALTER TABLE work_types ADD CONSTRAINT unique_work_type_name_per_client UNIQUE (client_id, name);
  `);

  pgm.addColumns('users', {
    pin_hash: 'VARCHAR(255) NULL',
    pin_set_at: 'TIMESTAMP WITH TIME ZONE NULL',
    must_set_pin: 'BOOLEAN NOT NULL DEFAULT FALSE',
    failed_password_attempts: 'INT NOT NULL DEFAULT 0',
    failed_pin_attempts: 'INT NOT NULL DEFAULT 0',
    pin_lockout_until: 'TIMESTAMP WITH TIME ZONE NULL',
  });

  pgm.createTable('pin_fallback_tokens', {
    token_id: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
    user_id: 'UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE',
    token_hash: 'VARCHAR(255) NOT NULL UNIQUE',
    issued_at: 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
    consumed_at: 'TIMESTAMP WITH TIME ZONE NULL',
    consumed_by_real_password_login: 'BOOLEAN NOT NULL DEFAULT FALSE',
  });
  pgm.createIndex('pin_fallback_tokens', 'user_id', { name: 'idx_pin_fallback_tokens_user' });

  pgm.addColumns('deficiency_records', {
    component_type_id: 'UUID NULL REFERENCES component_types(component_type_id)',
    component_notes: 'TEXT NULL',
    remediation_status: 'remediation_status_enum NOT NULL DEFAULT \'Open\'',
    remediation_due_date: 'DATE NULL',
    remediated_at: 'TIMESTAMP WITH TIME ZONE NULL',
    remediated_by: 'UUID NULL REFERENCES users(user_id)',
    verified_closed_by: 'UUID NULL REFERENCES users(user_id)',
    verified_closed_at: 'TIMESTAMP WITH TIME ZONE NULL',
  });

  pgm.addColumn('timesheet_entries', { work_type_id: 'UUID NULL REFERENCES work_types(work_type_id)' });

  pgm.addColumn('photos', { purpose: 'photo_purpose_enum NOT NULL DEFAULT \'deficiency_evidence\'' });
};

export const down = (pgm: Migrator) => {
  pgm.dropIndex('deficiency_records', { name: 'idx_deficiencies_remediation_status' });
  pgm.dropIndex('deficiency_records', { name: 'idx_deficiencies_component_type' });
  pgm.removeColumn('photos', 'purpose');
  pgm.removeColumn('timesheet_entries', 'work_type_id');
  pgm.removeColumns('deficiency_records', [
    'component_type_id',
    'component_notes',
    'remediation_status',
    'remediation_due_date',
    'remediated_at',
    'remediated_by',
    'verified_closed_by',
    'verified_closed_at',
  ]);
  pgm.dropIndex('pin_fallback_tokens', { name: 'idx_pin_fallback_tokens_user' });
  pgm.dropTable('pin_fallback_tokens');
  pgm.removeColumns('users', [
    'pin_hash',
    'pin_set_at',
    'must_set_pin',
    'failed_password_attempts',
    'failed_pin_attempts',
    'pin_lockout_until',
  ]);
  pgm.sql('ALTER TABLE component_types DROP CONSTRAINT IF EXISTS unique_component_name_per_client');
  pgm.sql('ALTER TABLE work_types DROP CONSTRAINT IF EXISTS unique_work_type_name_per_client');
  pgm.dropTable('work_types');
  pgm.dropTable('component_types');
  pgm.dropIndex('inspections', { name: 'idx_inspections_scheduled_date' });
  pgm.dropIndex('inspections', { name: 'idx_inspections_schedule_occurrence' });
  pgm.removeColumns('inspections', [
    'scheduled_date',
    'schedule_id',
    'reopened_by',
    'reopened_at',
    'reopen_reason',
    'inspection_mode',
  ]);
  pgm.dropIndex('inspection_schedules', { name: 'idx_schedules_structure' });
  pgm.dropIndex('inspection_schedules', { name: 'idx_schedules_next_due' });
  pgm.dropTable('inspection_schedules');
  pgm.dropType('inspection_mode_enum');
  pgm.dropType('photo_purpose_enum');
  pgm.dropType('remediation_status_enum');
};