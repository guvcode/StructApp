import { Pool } from 'pg';
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/structapp_test';

describe('Migrations', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: DATABASE_URL,
    });

    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');

    execSync('npx node-pg-migrate up', {
      cwd: 'apps/api-server',
      env: { ...process.env, DATABASE_URL },
      stdio: 'inherit',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  test('tables are created', async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = result.rows.map((r) => r.table_name);
    expect(tables).toContain('clients');
    expect(tables).toContain('users');
    expect(tables).toContain('inspections');
    expect(tables).toContain('deficiency_records');
    expect(tables).toContain('timesheet_entries');
    expect(tables).toContain('inspection_schedules');
    expect(tables).toContain('component_types');
    expect(tables).toContain('work_types');
    expect(tables).toContain('password_reset_tokens');
    expect(tables).toContain('pin_fallback_tokens');
    expect(tables).toContain('deficiency_taxonomy');
  });

  test('taxonomy types are created', async () => {
    const result = await pool.query(`
      SELECT typname FROM pg_type
      WHERE typname = 'taxonomy_level_enum'
    `);
    expect(result.rowCount).toBe(1);
  });

  test('deficiency_taxonomy has correct structure', async () => {
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'deficiency_taxonomy'
      ORDER BY ordinal_position
    `);
    const colNames = columns.rows.map(r => r.column_name);
    expect(colNames).toContain('node_id');
    expect(colNames).toContain('client_id');
    expect(colNames).toContain('parent_id');
    expect(colNames).toContain('level');
    expect(colNames).toContain('category');
    expect(colNames).toContain('label');
    expect(colNames).toContain('display_order');
    expect(colNames).toContain('is_active');
  });

  test('deficiency_taxonomy has RLS enabled', async () => {
    const result = await pool.query(`
      SELECT relrowsecurity FROM pg_class
      WHERE relname = 'deficiency_taxonomy'
    `);
    expect(result.rows[0].relrowsecurity).toBe(true);
  });

  test('deficiency_records has v4 taxonomy and risk columns', async () => {
    const result = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'deficiency_records'
    `);
    const cols = Object.fromEntries(result.rows.map(r => [r.column_name, r.is_nullable]));
    expect(cols.category).toBe('YES');
    expect(cols.sub_component).toBe('YES');
    expect(cols.focus_area).toBe('YES');
    expect(cols.deficiency_category).toBe('YES');
    expect(cols.detailed_description).toBe('YES');
    expect(cols.mechanisms).toBe('YES');
    expect(cols.vibration_present).toBe('YES');
    expect(cols.ndt_required).toBe('YES');
    expect(cols.further_investigation_required).toBe('YES');
    expect(cols.recommended_action).toBe('YES');
    expect(cols.consequence_severity).toBe('YES');
    expect(cols.likelihood).toBe('YES');
    expect(cols.most_affected_consequence).toBe('YES');
    expect(cols.risk_rank).toBe('YES');
    expect(cols.risk_rating).toBe('YES');
  });

  test('triggers are installed for client_id population', async () => {
    const trigResult = await pool.query(
      `SELECT tgname FROM pg_trigger WHERE tgrelid = 'sites'::regclass::oid`,
    );
    const triggers = trigResult.rows.map((r) => r.tgname);
    expect(triggers).toContain('trg_set_site_client');

    const result2 = await pool.query(
      `SELECT tgname FROM pg_trigger WHERE tgrelid = 'structures'::regclass::oid`,
    );
    const triggers2 = result2.rows.map((r) => r.tgname);
    expect(triggers2).toContain('trg_set_structure_client');

    const result3 = await pool.query(
      `SELECT tgname FROM pg_trigger WHERE tgrelid = 'inspections'::regclass::oid`,
    );
    const triggers3 = result3.rows.map((r) => r.tgname);
    expect(triggers3).toContain('trg_set_inspection_client');
  });

  test('audit triggers record updates to deficiency_records', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO clients (client_id, name, safety_contact_email) VALUES ($1, $2, $3)`,
        ['11111111-1111-1111-1111-111111111111', 'Test Client', 'contact@test.com'],
      );
      await client.query(
        `INSERT INTO users (user_id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        ['22222222-2222-2222-2222-222222222222', 'test@test.com', 'hash', 'Admin'],
      );
      await client.query(
        `INSERT INTO projects (project_id, client_id, title, due_date) VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
        ['33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'],
      );
      await client.query(
        `INSERT INTO sites (site_id, project_id, client_id, name) VALUES ($1, $2, $3, $4)`,
        ['44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Test Site'],
      );
      await client.query(
        `INSERT INTO structures (structure_id, site_id, client_id, asset_tag, description) VALUES ($1, $2, $3, $4, $5)`,
        ['55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'TAG-001', 'Test Structure'],
      );
      await client.query(
        `INSERT INTO inspections (inspection_id, structure_id, client_id, inspector_id) VALUES ($1, $2, $3, $4)`,
        ['66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
      );

      const deficiencyId = '77777777-7777-7777-7777-777777777777';
      await client.query(
        `INSERT INTO deficiency_records (deficiency_id, inspection_id, client_id, component, description, severity, probability, consequences, calculated_priority) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [deficiencyId, '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Test Component', 'Test Description for deficiency', 3, 3, 3, 'P3'],
      );

      await client.query(`UPDATE deficiency_records SET description = $1 WHERE deficiency_id = $2`, ['Updated Description', deficiencyId]);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const auditResult = await pool.query(
      `SELECT * FROM system_audit_logs WHERE record_id = $1 AND table_name = 'deficiency_records'`,
      ['77777777-7777-7777-7777-777777777777'],
    );
    expect(auditResult.rowCount).toBeGreaterThan(0);
    expect(auditResult.rows[0].action).toBe('UPDATE');
  });

  test('audit triggers record deletes to inspections', async () => {
    const inspectionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO clients (client_id, name, safety_contact_email) VALUES ($1, $2, $3)`,
        ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Client B', 'contact@b.com'],
      );
      await client.query(
        `INSERT INTO users (user_id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        ['cccccccc-cccc-cccc-cccc-cccccccccccc', 'testb@test.com', 'hash', 'Admin'],
      );
      await client.query(
        `INSERT INTO structures (structure_id, site_id, client_id, asset_tag, description) VALUES ($1, $2, $3, $4, $5)`,
        ['dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TAG-B1', 'Struct B'],
      );
      await client.query(
        `INSERT INTO inspections (inspection_id, structure_id, client_id, inspector_id) VALUES ($1, $2, $3, $4)`,
        [inspectionId, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
      );

      await client.query(`DELETE FROM inspections WHERE inspection_id = $1`, [inspectionId]);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const auditResult = await pool.query(
      `SELECT * FROM system_audit_logs WHERE record_id = $1 AND table_name = 'inspections'`,
      [inspectionId],
    );
    expect(auditResult.rowCount).toBeGreaterThan(0);
    expect(auditResult.rows[0].action).toBe('DELETE');
  });
});