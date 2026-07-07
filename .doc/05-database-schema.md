# 5. Relational Database Schema Blueprint

> The full v2 schema is below (v2 §5). v3 additions appear at the end as migration-style `ALTER`/`CREATE` statements consistent with ADR-009 (`node-pg-migrate`) — each block corresponds to one migration file. The v3 deltas are also in `plan.md` §5.

## 5.1 v2 Baseline Schema

```sql
-- StructApp Relational Database Schema — v2
-- Target Platform: PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE inspection_status_enum AS ENUM ('Assigned', 'In Progress', 'Submitted', 'Returned', 'Approved');
CREATE TYPE triage_state_enum AS ENUM ('New', 'Resolved', 'Still Outstanding', 'Worsened');
CREATE TYPE timesheet_status_enum AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');
CREATE TYPE user_role_enum AS ENUM ('Admin', 'Reviewer', 'Contractor');
CREATE TYPE project_type_enum AS ENUM ('One-Off', 'Recurring');
CREATE TYPE import_batch_status_enum AS ENUM ('Pending', 'Validated', 'Committed', 'Discarded');
CREATE TYPE import_row_status_enum AS ENUM ('Pending', 'Valid', 'Invalid');
CREATE TYPE report_type_enum AS ENUM ('draft_pdf', 'final_pdf', 'word', 'excel');
CREATE TYPE report_job_status_enum AS ENUM ('Queued', 'Processing', 'Ready', 'Failed');

-- ==========================================
-- 2. CORE ENTITY TABLES
-- ==========================================

CREATE TABLE clients (
    client_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    safety_contact_email VARCHAR(255) NOT NULL,   -- target for P1 notifications (FR-4.2)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-v3 amendment: per-inspector access PIN for offline password recovery (FR-14).
ALTER TABLE users
    ADD COLUMN pin_hash VARCHAR(255) NULL,                 -- Argon2id hash of the 6-digit PIN; NULL = not yet set
    ADD COLUMN pin_set_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN must_set_pin BOOLEAN NOT NULL DEFAULT FALSE, -- admin-triggered re-setup
    ADD COLUMN failed_password_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN failed_pin_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN pin_lockout_until TIMESTAMP WITH TIME ZONE NULL;

CREATE TABLE pin_fallback_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMP WITH TIME ZONE NULL,
    consumed_by_real_password_login BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_pin_fallback_tokens_user ON pin_fallback_tokens(user_id);

CREATE TABLE client_memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_client UNIQUE (user_id, client_id)
);

CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    type project_type_enum NOT NULL DEFAULT 'One-Off',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sites (
    site_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    iana_timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE structures (
    structure_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    asset_tag VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    qr_code_value VARCHAR(150) UNIQUE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_asset_tag_per_site UNIQUE (site_id, asset_tag)
);

CREATE TABLE inspections (
    inspection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES structures(structure_id) ON DELETE RESTRICT,
    client_id UUID NOT NULL,
    inspector_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    assigned_by UUID NULL REFERENCES users(user_id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    status inspection_status_enum NOT NULL DEFAULT 'Assigned',
    returned_reason TEXT NULL,
    approved_by UUID NULL REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deficiency_records (
    deficiency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    previous_deficiency_id UUID NULL REFERENCES deficiency_records(deficiency_id),
    component VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity INT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    probability INT NOT NULL CHECK (probability BETWEEN 1 AND 5),
    consequences INT NOT NULL CHECK (consequences BETWEEN 1 AND 5),
    calculated_priority VARCHAR(2) NOT NULL CHECK (calculated_priority IN ('P1', 'P2', 'P3', 'P4', 'P5')),
    original_priority VARCHAR(2) NULL CHECK (original_priority IN ('P1', 'P2', 'P3', 'P4', 'P5')),
    is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    overridden_by UUID NULL REFERENCES users(user_id),
    overridden_at TIMESTAMP WITH TIME ZONE,
    triage_state triage_state_enum NOT NULL DEFAULT 'New',
    gps_latitude NUMERIC(9,6) NULL CHECK (gps_latitude BETWEEN -90 AND 90),
    gps_longitude NUMERIC(9,6) NULL CHECK (gps_longitude BETWEEN -180 AND 180),
    reviewer_justification TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE photos (
    photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deficiency_id UUID NOT NULL REFERENCES deficiency_records(deficiency_id) ON DELETE CASCADE,
    storage_url TEXT NOT NULL,
    display_order SMALLINT NOT NULL DEFAULT 0,
    caption TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE photo_evidence_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(photo_id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    raw_exif_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE timesheet_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    inspection_id UUID NULL REFERENCES inspections(inspection_id) ON DELETE SET NULL,   -- FR-17
    client_id UUID NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    hours_logged NUMERIC(4,2) NOT NULL CHECK (hours_logged > 0.00 AND hours_logged <= 24.00),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,                                       -- FR-17.2
    pre_inspection BOOLEAN NOT NULL DEFAULT FALSE,                                       -- FR-17.3
    status timesheet_status_enum NOT NULL DEFAULT 'Draft',
    rejection_reason TEXT NULL,
    approved_by UUID NULL REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_timesheets_entry_date ON timesheet_entries(entry_date);
CREATE INDEX idx_timesheets_pre_inspection ON timesheet_entries(pre_inspection) WHERE pre_inspection = TRUE;

CREATE TABLE import_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    original_filename VARCHAR(255) NOT NULL,
    status import_batch_status_enum NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE import_rows (
    row_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
    raw_row JSONB NOT NULL,
    validation_status import_row_status_enum NOT NULL DEFAULT 'Pending',
    validation_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE report_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(user_id),
    report_type report_type_enum NOT NULL,
    status report_job_status_enum NOT NULL DEFAULT 'Queued',
    download_url TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE system_audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(255) DEFAULT 'SYSTEM',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,  -- SHA-256 of the random token sent in the email
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX idx_memberships_user ON client_memberships(user_id);
CREATE INDEX idx_memberships_client ON client_memberships(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_sites_project_id ON sites(project_id);
CREATE INDEX idx_sites_client_id ON sites(client_id);
CREATE INDEX idx_structures_site_id ON structures(site_id);
CREATE INDEX idx_structures_client_id ON structures(client_id);
CREATE INDEX idx_structures_asset_tag ON structures(asset_tag);
CREATE INDEX idx_structures_qr ON structures(qr_code_value);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_client_id ON inspections(client_id);
CREATE INDEX idx_deficiencies_inspection_id ON deficiency_records(inspection_id);
CREATE INDEX idx_deficiencies_client_id ON deficiency_records(client_id);
CREATE INDEX idx_deficiencies_priority ON deficiency_records(calculated_priority);
CREATE INDEX idx_photos_deficiency_id ON photos(deficiency_id);
CREATE INDEX idx_photo_metadata_lookup ON photo_evidence_metadata(photo_id);
CREATE INDEX idx_timesheets_client_id ON timesheet_entries(client_id);
CREATE INDEX idx_import_rows_batch ON import_rows(batch_id);

-- ==========================================
-- 4. TENANT_ID AUTO-POPULATION TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION set_site_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_site_client BEFORE INSERT ON sites FOR EACH ROW EXECUTE FUNCTION set_site_client_id();

CREATE OR REPLACE FUNCTION set_structure_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM sites WHERE site_id = NEW.site_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_structure_client BEFORE INSERT ON structures FOR EACH ROW EXECUTE FUNCTION set_structure_client_id();

CREATE OR REPLACE FUNCTION set_inspection_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_inspection_client BEFORE INSERT ON inspections FOR EACH ROW EXECUTE FUNCTION set_inspection_client_id();

CREATE OR REPLACE FUNCTION set_deficiency_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM inspections WHERE inspection_id = NEW.inspection_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_deficiency_client BEFORE INSERT ON deficiency_records FOR EACH ROW EXECUTE FUNCTION set_deficiency_client_id();

CREATE OR REPLACE FUNCTION set_timesheet_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM projects WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_timesheet_client BEFORE INSERT ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION set_timesheet_client_id();

-- ==========================================
-- 5. ROW-LEVEL SECURITY POLICIES
-- ==========================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficiency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sites ON sites
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_projects ON projects
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_structures ON structures
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_inspections ON inspections
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_deficiencies ON deficiency_records
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_timesheets ON timesheet_entries
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

-- ==========================================
-- 6. IMMUTABILITY TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION protect_approved_deficiencies()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT status FROM inspections WHERE inspection_id = OLD.inspection_id) = 'Approved' THEN
        RAISE EXCEPTION 'Hardened Data Guard: modifications to an approved engineering record are blocked.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_lock_approved_records
BEFORE UPDATE OR DELETE ON deficiency_records
FOR EACH ROW EXECUTE FUNCTION protect_approved_deficiencies();

-- Photo cap removed (v2 had `enforce_max_five_photos` + `trg_enforce_max_photos`).
-- Post-amendment: the DB-level cap is dropped. The cap is now an API-layer
-- constant (`MAX_PHOTOS_PER_DEFICIENCY = 20`, see 04-engineering-standards.md
-- §4.12) with a soft UI warning at 6. Real-world engineering evidence cases
-- (legal / safety) need more than 5 angles; the previous cap was a v2 heuristic
-- that field users kept hitting.

-- ==========================================
-- 7. GENERIC AUDIT LOGGING
-- ==========================================
CREATE OR REPLACE FUNCTION generic_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.user_id::uuid, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, OLD.user_id::uuid, TG_OP, to_jsonb(OLD), NULL);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
-- NOTE: the primary-key column name differs per table. Clone this function once
-- per audited table with the correct PK column (e.g. OLD.deficiency_id for
-- deficiency_records). Do not deploy the placeholder as-is.
CREATE TRIGGER trg_audit_deficiencies AFTER UPDATE OR DELETE ON deficiency_records
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();
CREATE TRIGGER trg_audit_inspections AFTER UPDATE OR DELETE ON inspections
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();
CREATE TRIGGER trg_audit_timesheets AFTER UPDATE OR DELETE ON timesheet_entries
FOR EACH ROW EXECUTE FUNCTION generic_audit_log();

-- ==========================================
-- 8. TIMESTAMP TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_clients_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_sites_timestamp BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_structures_timestamp BEFORE UPDATE ON structures FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_inspections_timestamp BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_deficiencies_timestamp BEFORE UPDATE ON deficiency_records FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_update_timesheets_timestamp BEFORE UPDATE ON timesheet_entries FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
```

## 5.2 v3 Additions (forward migrations)

```sql
-- ==========================================
-- NEW ENUMS
-- ==========================================
CREATE TYPE remediation_status_enum AS ENUM ('Open', 'Remediation_Scheduled', 'Remediated_Pending_Verification', 'Verified_Closed');
CREATE TYPE photo_purpose_enum AS ENUM ('deficiency_evidence', 'remediation_evidence');
CREATE TYPE inspection_mode_enum AS ENUM ('onsite', 'post_inspection');   -- FR-16

-- ==========================================
-- NEW TABLES: SCHEDULING (FR-10)
-- ==========================================
CREATE TABLE inspection_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES structures(structure_id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    default_inspector_id UUID NULL REFERENCES users(user_id),
    recurrence_interval_days INT NOT NULL CHECK (recurrence_interval_days > 0),
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_schedule_client_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT client_id INTO NEW.client_id FROM structures WHERE structure_id = NEW.structure_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_set_schedule_client BEFORE INSERT ON inspection_schedules
FOR EACH ROW EXECUTE FUNCTION set_schedule_client_id();

ALTER TABLE inspection_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_schedules ON inspection_schedules
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

CREATE TRIGGER trg_update_schedules_timestamp BEFORE UPDATE ON inspection_schedules
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE INDEX idx_schedules_structure ON inspection_schedules(structure_id);
CREATE INDEX idx_schedules_next_due ON inspection_schedules(next_due_date) WHERE is_active = TRUE;

-- ==========================================
-- INSPECTIONS: scheduling + reopen support
-- ==========================================
ALTER TABLE inspections
    ADD COLUMN scheduled_date DATE NULL,
    ADD COLUMN schedule_id UUID NULL REFERENCES inspection_schedules(schedule_id),
    ADD COLUMN reopened_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN reopened_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN reopen_reason TEXT NULL;

-- Post-v3 amendment: FR-16 inspection capture mode. Recorded on each
-- inspection; governs whether the PWA's Geolocation API is invoked for
-- deficiency records on this inspection.
ALTER TABLE inspections
    ADD COLUMN inspection_mode inspection_mode_enum NOT NULL DEFAULT 'onsite';

CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE UNIQUE INDEX idx_inspections_schedule_occurrence
    ON inspections(schedule_id, scheduled_date) WHERE schedule_id IS NOT NULL;

-- ==========================================
-- NEW TABLES: MANAGED PICKLISTS (FR-11)
-- ==========================================
CREATE TABLE component_types (
    component_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_component_name_per_client UNIQUE (client_id, name)
);

CREATE TABLE work_types (
    work_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_work_type_name_per_client UNIQUE (client_id, name)
);

ALTER TABLE component_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_component_types ON component_types
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );
CREATE POLICY tenant_isolation_work_types ON work_types
    USING (
        current_setting('app.bypass_tenant_check', true) = 'true'
        OR client_id = current_setting('app.current_client_id', true)::uuid
    );

CREATE INDEX idx_component_types_client ON component_types(client_id) WHERE is_active = TRUE;
CREATE INDEX idx_work_types_client ON work_types(client_id) WHERE is_active = TRUE;

-- ==========================================
-- DEFICIENCY_RECORDS: picklist FK + remediation lifecycle (FR-8, FR-11)
-- ==========================================
-- Backfill free-text `component` to seeded component_types before enforcing NOT NULL.
ALTER TABLE deficiency_records
    ADD COLUMN component_type_id UUID NULL REFERENCES component_types(component_type_id),
    ADD COLUMN component_notes TEXT NULL,
    ADD COLUMN remediation_status remediation_status_enum NOT NULL DEFAULT 'Open',
    ADD COLUMN remediation_due_date DATE NULL,
    ADD COLUMN remediated_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN remediated_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN verified_closed_by UUID NULL REFERENCES users(user_id),
    ADD COLUMN verified_closed_at TIMESTAMP WITH TIME ZONE NULL;

-- After backfill is verified complete:
-- ALTER TABLE deficiency_records ALTER COLUMN component_type_id SET NOT NULL;
-- ALTER TABLE deficiency_records DROP COLUMN component;

CREATE INDEX idx_deficiencies_remediation_status ON deficiency_records(remediation_status);
CREATE INDEX idx_deficiencies_component_type ON deficiency_records(component_type_id);

-- ==========================================
-- TIMESHEET_ENTRIES: picklist FK (FR-11)
-- ==========================================
ALTER TABLE timesheet_entries
    ADD COLUMN work_type_id UUID NULL REFERENCES work_types(work_type_id);

-- ==========================================
-- PHOTOS: purpose tagging (FR-8.2)
-- ==========================================
ALTER TABLE photos
    ADD COLUMN purpose photo_purpose_enum NOT NULL DEFAULT 'deficiency_evidence';
```

> **Why additive `ALTER`/backfill migrations rather than rewritten `CREATE TABLE` statements:** by Sprint 5 the v1/v2 schema may already have production data in it. v3 is written as forward migrations on top of that, per ADR-009. If you're still pre-launch and haven't run the v1/v2 schema yet, it's equally correct to fold these directly into the original `CREATE TABLE` statements — but the migration form is the safer default.

## 5.3 Tenancy Model Summary

A `client` represents one paying customer organization. `Admin` and `Reviewer` users are global/cross-tenant by role — they bypass `client_memberships` and can read/write any tenant-scoped data the RLS policy permits. `Contractor` users are the only role scoped to one or more clients via `client_memberships`. Every tenant-scoped table carries a denormalized `client_id` populated by `BEFORE INSERT` triggers (Section 5.1 block 4), and Postgres RLS enforces isolation at the database layer (block 5). Encryption of sensitive columns at rest is a separate concern (see v2 §11.5).

> **Post-amendment:** the original v2 model scoped both Reviewer and Contractor via `client_memberships`. When the Reviewer role was promoted to global, `client_memberships` became Contractor-only. The table itself is unchanged — the application-layer enforcement of "which roles check it" changed.
