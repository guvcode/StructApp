import fs from 'fs';
import path from 'path';

describe('taxonomy route ordering', () => {
  it('taxonomyRouter is mounted before picklistsRouter requireRole guard in index.ts', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    );

    const taxonomyIdx = source.indexOf("app.use('/api/v1', requireAuth, taxonomyRouter)");
    const picklistsIdx = source.indexOf("app.use('/api/v1', requireAuth, requireRole('Admin', 'Reviewer'), picklistsRouter)");

    expect(taxonomyIdx).toBeGreaterThan(-1);
    expect(picklistsIdx).toBeGreaterThan(-1);
    expect(taxonomyIdx).toBeLessThan(picklistsIdx);
  });
});