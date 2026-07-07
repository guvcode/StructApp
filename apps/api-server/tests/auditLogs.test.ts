import { listAuditLogs } from '../src/services/auditLogs';
import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('auditLogs service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated audit logs with default params', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // set_config 1
        .mockResolvedValueOnce({}) // set_config 2
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // COUNT
        .mockResolvedValueOnce({
          rows: [
            {
              log_id: 1,
              table_name: 'inspections',
              record_id: 'uuid-1',
              action: 'APPROVE',
              old_values: { status: 'Submitted' },
              new_values: { status: 'Approved' },
              performed_by: 'user-1',
              timestamp: '2026-06-22T10:00:00Z',
            },
          ],
          rowCount: 1,
        }), // SELECT with LIMIT/OFFSET
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const result = await listAuditLogs('client-1', {}, 1, 50);
    expect(result.logs).toHaveLength(1);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  it('applies filters correctly', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // set_config 1
        .mockResolvedValueOnce({}) // set_config 2
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // COUNT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    await listAuditLogs('client-1', {
      tableName: 'inspections',
      action: 'APPROVE',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    }, 1, 50);

    const queryCalls = (mockClient.query as jest.Mock).mock.calls;
    const whereQuery = queryCalls[3][0];
    expect(whereQuery).toContain('WHERE');
    expect(whereQuery).toContain('table_name');
    expect(whereQuery).toContain('action');
    expect(whereQuery).toContain('timestamp');
  });
});