import { up, down } from '../migrations/1700000004000_backfill_timesheet_entry_date';

describe('backfill_timesheet_entry_date migration', () => {
  test('up SQL updates only rows where entry_date is null', () => {
    const sqlStatements: string[] = [];
    const mockPgm = {
      sql: (sql: string) => sqlStatements.push(sql),
    } as unknown as Parameters<typeof up>[0];

    up(mockPgm);

    expect(sqlStatements).toHaveLength(1);
    expect(sqlStatements[0]).toContain('UPDATE timesheet_entries');
    expect(sqlStatements[0]).toContain('SET entry_date = created_at::date');
    expect(sqlStatements[0]).toContain('WHERE entry_date IS NULL');
  });

  test('down is a no-op', () => {
    const mockPgm = {
      sql: jest.fn(),
    } as unknown as Parameters<typeof down>[0];

    down(mockPgm);

    expect(mockPgm.sql).not.toHaveBeenCalled();
  });
});
