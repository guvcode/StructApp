import { reportGenerateSchema } from '../src/contracts/reports';

describe('reports contract', () => {
  test('validates report type and project_id', () => {
    const valid = reportGenerateSchema.parse({
      type: 'final_pdf',
      project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(valid.type).toBe('final_pdf');
    expect(valid.project_id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  test('rejects invalid report type', () => {
    const parsed = reportGenerateSchema.safeParse({
      type: 'invalid_type',
      project_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(parsed.success).toBe(false);
  });
});