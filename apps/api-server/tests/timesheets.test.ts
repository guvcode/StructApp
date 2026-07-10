import { getTimesheetsForInspector, getTimesheetById, createTimesheetBatch, updateTimesheet, submitTimesheet, deleteTimesheet } from '../src/services/timesheets';

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
    pre_inspection: false,
    status: 'Draft',
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: '2026-06-20T10:00:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  };

  test('returns pre_inspection=true when DB column is true', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          pre_inspection: true,
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.pre_inspection).toBe(true);
  });

  test('returns pre_inspection=false when DB column is false', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ...baseRow,
          pre_inspection: false,
        },
      ],
      rowCount: 1,
    });

    const result = await getTimesheetsForInspector('user-123', 'client-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.pre_inspection).toBe(false);
  });

  describe('getTimesheetById', () => {
    test('returns a timesheet entry by id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'entry-1', user_id: 'user-1', status: 'Draft' }], rowCount: 1 });
      const result = await getTimesheetById('entry-1', 'client-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('entry-1');
    });

    test('returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const result = await getTimesheetById('non-existent', 'client-1');
      expect(result).toBeNull();
    });
  });

  describe('updateTimesheet', () => {
    test('updates work_type, hours_logged, notes on a Draft entry', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Draft', user_id: 'user-1' }], rowCount: 1 }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', work_type: 'Field Inspection', hours_logged: '4.00', notes: 'test note', pre_inspection: true, status: 'Draft' }], rowCount: 1 }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updateTimesheet('e1', 'client-1', 'user-1', { work_type: 'Field Inspection', hours: 4, notes: 'test note', pre_inspection: true });
      expect(result.work_type).toBe('Field Inspection');
      expect(result.pre_inspection).toBe(true);
      expect(result.notes).toBe('test note');
    });

    test('updates a Submitted entry and reverts to Draft', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Submitted', user_id: 'user-1' }], rowCount: 1 }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', work_type: 'Field Inspection', hours_logged: '4.00', notes: null, pre_inspection: false, status: 'Draft' }], rowCount: 1 }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updateTimesheet('e1', 'client-1', 'user-1', { work_type: 'Field Inspection', hours: 4 });
      expect(result.work_type).toBe('Field Inspection');
      expect(result.status).toBe('Draft');
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

    test('throws NOT_DRAFT when entry is Approved or Rejected', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', status: 'Approved', user_id: 'user-1' }], rowCount: 1 }); // SELECT FOR UPDATE
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

  describe('createTimesheetBatch', () => {
    test('inserts multiple entries with inspection_id and notes via multi-row INSERT RETURNING *', async () => {
      const mockClient = makeMockClient();
      const returnedRows = [
        { entry_id: 'e1', user_id: 'user-1', project_id: 'proj-1', inspection_id: 'insp-1', client_id: 'client-1', work_type: 'Field Inspection', hours_logged: '8.00', notes: 'Check main beam', pre_inspection: true, entry_date: '2026-07-10', status: 'Draft', rejection_reason: null, approved_by: null, approved_at: null, created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' },
        { entry_id: 'e2', user_id: 'user-1', project_id: 'proj-1', inspection_id: 'insp-1', client_id: 'client-1', work_type: 'Report Writing', hours_logged: '4.00', notes: null, pre_inspection: false, entry_date: '2026-07-10', status: 'Draft', rejection_reason: null, approved_by: null, approved_at: null, created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' },
      ];
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: returnedRows, rowCount: 2 }) // INSERT RETURNING *
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await createTimesheetBatch(
        'user-1', 'client-1', 'proj-1', 'insp-1', '2026-07-10',
        [
          { work_type: 'Field Inspection', hours: 8, notes: 'Check main beam' },
          { work_type: 'Report Writing', hours: 4 },
        ]
      );

      expect(result).toHaveProperty('entries');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.work_type).toBe('Field Inspection');
      expect(result.entries[0]!.notes).toBe('Check main beam');
      expect(result.entries[0]!.inspection_id).toBe('insp-1');
      expect(result.entries[1]!.work_type).toBe('Report Writing');
      expect(result.entries[1]!.notes).toBeNull();
      expect(result.entries[1]!.inspection_id).toBe('insp-1');

      // Verify multi-row INSERT
      const insertCall = mockClient.query.mock.calls[2];
      expect(insertCall[0]).toContain('INSERT INTO timesheet_entries');
      expect(insertCall[0]).toContain('RETURNING');
      expect(insertCall[1]).toContain('user-1');
    });

    test('returns entries with inspection_id null when not provided', async () => {
      const mockClient = makeMockClient();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config
        .mockResolvedValueOnce({ rows: [{ entry_id: 'e1', user_id: 'user-1', project_id: 'proj-1', inspection_id: null, client_id: 'client-1', work_type: 'Office Work', hours_logged: '6.00', notes: null, pre_inspection: false, entry_date: '2026-07-10', status: 'Draft', rejection_reason: null, approved_by: null, approved_at: null, created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' }], rowCount: 1 }) // INSERT RETURNING *
        .mockResolvedValueOnce({}); // COMMIT
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await createTimesheetBatch(
        'user-1', 'client-1', 'proj-1', null, '2026-07-10',
        [{ work_type: 'Office Work', hours: 6 }]
      );

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.inspection_id).toBeNull();
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