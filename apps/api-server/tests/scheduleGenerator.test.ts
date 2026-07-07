import { generateUpcomingInspections } from '../src/jobs/scheduleGenerator';

jest.mock('../src/lib/db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('scheduleGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUpcomingInspections', () => {
    test('creates inspections for due schedules and advances next_due_date', async () => {
      const dueSchedules = [
        {
          schedule_id: 'schedule-1',
          structure_id: 'structure-1',
          client_id: 'client-1',
          default_inspector_id: 'inspector-1',
          next_due_date: '2026-07-01',
          recurrence_interval_days: 30,
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: dueSchedules, rowCount: 1 });
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await generateUpcomingInspections(mockPool);

      expect(result.created).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    test('does not create duplicate inspections when one already exists', async () => {
      const dueSchedules = [
        {
          schedule_id: 'schedule-1',
          structure_id: 'structure-1',
          client_id: 'client-1',
          default_inspector_id: 'inspector-1',
          next_due_date: '2026-07-01',
          recurrence_interval_days: 30,
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: dueSchedules, rowCount: 1 });
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await generateUpcomingInspections(mockPool);

      expect(result.created).toBe(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });
});