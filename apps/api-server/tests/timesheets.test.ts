import { getTimesheetsForInspector } from '../src/services/timesheets';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('timesheets service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseRow = {
    entry_id: 'entry-1',
    user_id: 'user-123',
    project_id: 'proj-1',
    inspection_id: 'insp-1',
    client_id: 'client-1',
    work_type: 'Inspection',
    hours_logged: '2.00',
    entry_date: '2026-06-20',
    status: 'Draft',
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: '2026-06-20T10:00:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  };

  test('derives pre_inspection=true when entry_date is before scheduled_date', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          inspection_id: 'insp-1',
          inspection_scheduled_date: '2026-06-25',
          inspection_assigned_at: null,
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.pre_inspection).toBe(true);
    expect(entry.inspection_scheduled_date).toBe('2026-06-25');
  });

  test('derives pre_inspection=false when entry_date is on or after scheduled_date', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          entry_date: '2026-06-26',
          inspection_id: 'insp-1',
          inspection_scheduled_date: '2026-06-25',
          inspection_assigned_at: null,
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.pre_inspection).toBe(false);
  });

  test('falls back to assigned_at when scheduled_date is null', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          inspection_id: 'insp-1',
          inspection_scheduled_date: null,
          inspection_assigned_at: '2026-06-22',
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.pre_inspection).toBe(true);
  });

  test('returns false when inspection_id is null', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          inspection_id: null,
          inspection_scheduled_date: null,
          inspection_assigned_at: null,
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    const entry = result[0]!;
    expect(entry.pre_inspection).toBe(false);
  });
});
