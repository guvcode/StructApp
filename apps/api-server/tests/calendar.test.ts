import {
  listSchedules, getScheduleById, createSchedule, updateSchedule, toggleSchedulePause,
} from '../src/services/calendar';

jest.mock('../src/lib/db', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const mockPool = require('../src/lib/db').pool;

describe('calendar service', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
    mockPool.query.mockResolvedValue(undefined);
  });

  test('listSchedules returns all schedules with joins', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        schedule_id: 's1', structure_id: 'str1', client_id: 'c1',
        default_inspector_id: 'u1', recurrence_interval_days: 90,
        next_due_date: '2026-08-01', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01',
        structure_name: 'Harbor Bridge', inspector_name: 'Alice',
      }],
    });
    const rows = await listSchedules();
    expect(rows).toHaveLength(1);
    expect((rows[0] as Record<string, unknown>).structure_name).toBe('Harbor Bridge');
    expect(mockPool.query.mock.calls[0][0]).toContain('LEFT JOIN');
  });

  test('getScheduleById returns null when not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await getScheduleById('nonexistent');
    expect(result).toBeNull();
  });

  test('getScheduleById returns schedule', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        schedule_id: 's1', structure_id: 'str1', client_id: 'c1',
        default_inspector_id: 'u1', recurrence_interval_days: 90,
        next_due_date: '2026-08-01', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01',
        structure_name: null, inspector_name: null,
      }],
    });
    const result = await getScheduleById('s1');
    expect(result).not.toBeNull();
    expect(result!.schedule_id).toBe('s1');
  });

  test('createSchedule inserts and returns', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        schedule_id: 's-new', structure_id: 'str1', client_id: 'c1',
        default_inspector_id: 'u1', recurrence_interval_days: 90,
        next_due_date: '2026-08-01', is_active: true, created_at: '2026-07-05', updated_at: '2026-07-05',
      }],
    });
    const result = await createSchedule({ structure_id: 'str1', inspector_id: 'u1', interval_days: 90, next_due_date: '2026-08-01' });
    expect(result.schedule_id).toBe('s-new');
    expect(mockPool.query.mock.calls[0][0]).toContain('INSERT INTO inspection_schedules');
  });

  test('updateSchedule returns null when not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await updateSchedule('x', { recurrence_interval_days: 30 });
    expect(result).toBeNull();
  });

  test('toggleSchedulePause toggles is_active', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        schedule_id: 's1', structure_id: 'str1', client_id: 'c1',
        default_inspector_id: null, recurrence_interval_days: 90,
        next_due_date: '2026-08-01', is_active: false, created_at: '2026-01-01', updated_at: '2026-01-01',
      }],
    });
    const result = await toggleSchedulePause('s1');
    expect(result).not.toBeNull();
    expect(result!.is_active).toBe(false);
    expect(mockPool.query.mock.calls[0][0]).toContain('NOT is_active');
  });
});