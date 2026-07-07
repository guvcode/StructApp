import { processCsvRows } from '../src/services/imports';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('imports service', () => {
  test('processCsvRows validates required fields', async () => {
    const validCsv = `site_name,structure_asset_tag,structure_description,project_title
Site A,Tag-001,Description A,Project A`;
    const result = await processCsvRows('batch-123', validCsv);
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(0);
  });

  test('processCsvRows marks missing fields as invalid', async () => {
    const invalidCsv = `site_name,structure_asset_tag
Site A,Tag-001`;
    const result = await processCsvRows('batch-456', invalidCsv);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
  });
});