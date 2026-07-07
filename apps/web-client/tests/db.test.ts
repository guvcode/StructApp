import { StructAppLocalDB } from '../src/lib/db';

describe('Dexie schema', () => {
  test('authState table exists', () => {
    const db = new StructAppLocalDB();
    expect(db.authState).toBeDefined();
  });

  test('deficiencies table exists', () => {
    const db = new StructAppLocalDB();
    expect(db.deficiencies).toBeDefined();
  });

  test('pinOutbox table exists', () => {
    const db = new StructAppLocalDB();
    expect(db.pinOutbox).toBeDefined();
  });
});