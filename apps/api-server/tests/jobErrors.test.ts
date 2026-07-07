import { listJobErrors } from '../src/services/jobErrors';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('jobErrors service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists job errors with pagination and filters', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // total count
        .mockResolvedValueOnce({
          rows: [
            {
              error_id: 'error-1',
              job_id: 'job-1',
              job_type: 'report_generation',
              error_code: 'PDF_FAILED',
              error_message: 'Failed to generate PDF',
              error_stack: 'Error: ...',
              attempt_count: 3,
              last_attempted_at: '2024-01-01T00:00:00Z',
              input_payload: { reportId: 'r1' },
              dismissed_at: null,
              dismissed_by: null,
            },
            {
              error_id: 'error-2',
              job_id: null,
              job_type: 'pwa_client',
              error_code: 'SYNC_FAILED',
              error_message: 'Sync failed',
              error_stack: null,
              attempt_count: 1,
              last_attempted_at: '2024-01-02T00:00:00Z',
              input_payload: null,
              dismissed_at: null,
              dismissed_by: null,
            },
          ],
        }),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const result = await listJobErrors('client-1', {
      jobType: 'report_generation',
      dismissed: false,
    }, 1, 10);

    expect(result.errors).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });

  test('filters by dismissed status', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              error_id: 'error-1',
              job_id: 'job-1',
              job_type: 'sync_push',
              error_code: 'NETWORK_ERROR',
              error_message: 'Network timeout',
              error_stack: null,
              attempt_count: 2,
              last_attempted_at: '2024-01-01T00:00:00Z',
              input_payload: null,
              dismissed_at: '2024-01-02T00:00:00Z',
              dismissed_by: 'admin-1',
            },
          ],
        }),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const result = await listJobErrors('client-1', {
      dismissed: true,
    }, 1, 50);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.dismissed_at).not.toBeNull();
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });
});
