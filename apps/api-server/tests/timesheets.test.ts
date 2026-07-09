import { getTimesheetsForInspector, getTimesheetById, updateTimesheet, submitTimesheet, deleteTimesheet } from '../src/services/timesheets';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

function makeMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

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

  describe('getTimesheetById', () => {
    test('returns a timesheet entry by id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ entry_id: 'entry-1', user_id: 'user-1', status: 'Draft' }], rowCount: 1 });
      const result = await getTimesheetById('entry-1', 'client-1');
      expect(result).not.toBeNull();
      expect(result!.entry_id).toBe('entry-1');
    });

    test('returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const result = await getTimesheetById('non-existent', 'client-1');
      expect(result).toBeNull();
    });
  });

  describe('updateTimesheet', () => {
    test('updates work_type, hours_logged, description on a Draft entry', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Draft' }], rowCount: 1 }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', work_type: 'Field Inspection', hours_logged: '4.00' }], rowCount: 1 }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updateTimesheet('e1', 'client-1', 'user-1', { work_type: 'Field Inspection', hours: 4 });
      expect(result.work_type).toBe('Field Inspection');
    });

    test('throws NOT_FOUND when entry does not exist', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // SELECT FOR UPDATE
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updateTimesheet('bad-id', 'client-1', 'user-1', { work_type: 'X' })).rejects.toThrow('TIMESHEET_NOT_FOUND');
    });

    test('throws NOT_DRAFT when entry is not Draft status', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Submitted' }], rowCount: 1 }); // SELECT FOR UPDATE
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updateTimesheet('e1', 'client-1', 'user-1', { work_type: 'X' })).rejects.toThrow('TIMESHEET_NOT_DRAFT');
    });
  });

  describe('submitTimesheet', () => {
    test('sets status to Submitted on a Draft entry', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Draft' }], rowCount: 1 }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Submitted' }], rowCount: 1 }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await submitTimesheet('e1', 'client-1', 'user-1');
      expect(result.status).toBe('Submitted');
    });

    test('throws NOT_DRAFT when entry is already Submitted', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Submitted' }], rowCount: 1 }); // SELECT FOR UPDATE
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(submitTimesheet('e1', 'client-1', 'user-1')).rejects.toThrow('TIMESHEET_NOT_DRAFT');
    });
  });

  describe('deleteTimesheet', () => {
    test('deletes a Draft entry', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Draft' }], rowCount: 1 }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      await deleteTimesheet('e1', 'client-1', 'user-1');
      const deleteCall = mockClient.query.mock.calls[3];
      expect(deleteCall[0]).toContain('DELETE');
    });

    test('throws NOT_DRAFT when entry is not Draft', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Approved' }], rowCount: 1 }); // SELECT FOR UPDATE
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(deleteTimesheet('e1', 'client-1', 'user-1')).rejects.toThrow('TIMESHEET_NOT_DRAFT');
    });
  });
});