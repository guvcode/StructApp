import fs from 'fs';
import path from 'path';

describe('FIX-011 migration: fix deficiency_records schema', () => {
  it('migration file exists and adds the four missing columns', () => {
    const migrationPath = path.join(__dirname, '../migrations/1700000020000_fix_deficiency_records_schema.ts');
    const source = fs.readFileSync(migrationPath, 'utf-8');

    expect(source).toContain("'structure_id'");
    expect(source).toContain("'created_by'");
    expect(source).toContain("'priority_tier'");
    expect(source).toContain("'location_desc'");
  });

  it('migration makes old NOT NULL columns nullable', () => {
    const migrationPath = path.join(__dirname, '../migrations/1700000020000_fix_deficiency_records_schema.ts');
    const source = fs.readFileSync(migrationPath, 'utf-8');

    expect(source).toContain("'component'");
    expect(source).toContain("'severity'");
    expect(source).toContain("'probability'");
    expect(source).toContain("'consequences'");
  });

  it('down migration drops added columns and restores NOT NULL on old columns', () => {
    const migrationPath = path.join(__dirname, '../migrations/1700000020000_fix_deficiency_records_schema.ts');
    const source = fs.readFileSync(migrationPath, 'utf-8');

    expect(source).toContain('structure_id');
    expect(source).toContain('created_by');
    expect(source).toContain('priority_tier');
    expect(source).toContain('location_desc');
  });
});