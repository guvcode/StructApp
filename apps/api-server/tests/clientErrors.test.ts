import { recordClientError } from '../src/services/jobErrors';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('../src/lib/rateLimiter', () => ({
  checkRateLimit: jest.fn(),
}));

const mockPool = require('../src/lib/db').pool;
const { checkRateLimit } = require('../src/lib/rateLimiter');

describe('client errors service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockReturnValue(true);
    const mockRelease = jest.fn();
    mockPool.connect.mockResolvedValue({
      query: jest.fn().mockResolvedValue({}),
      release: mockRelease,
    } as unknown as ReturnType<typeof mockPool.connect>);
  });

  test('records client error with user sub and IP', async () => {
    const mockClient = await mockPool.connect();
    await recordClientError(
      { error_message: 'Test error', error_stack: 'Stack trace' },
      'user-123',
      '127.0.0.1'
    );

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO system_job_errors'),
      expect.any(Array)
    );
    const params = mockClient.query.mock.calls[0][1] as string[];
    const payload = JSON.parse(params[3]!);
    expect(payload.userSub).toBe('user-123');
    expect(payload.ip).toBe('127.0.0.1');
  });

  test('throws RATE_LIMITED when user limit exceeded', async () => {
    checkRateLimit.mockReturnValueOnce(false);
    await expect(
      recordClientError(
        { error_message: 'Test error', error_stack: 'Stack trace' },
        'user-123',
        '127.0.0.1'
      )
    ).rejects.toThrow('RATE_LIMITED');
  });

  test('throws RATE_LIMITED when IP limit exceeded', async () => {
    checkRateLimit.mockReturnValueOnce(true).mockReturnValueOnce(false);
    await expect(
      recordClientError(
        { error_message: 'Test error', error_stack: 'Stack trace' },
        'user-123',
        '127.0.0.1'
      )
    ).rejects.toThrow('RATE_LIMITED');
  });

  test('strips email from error_stack', async () => {
    const mockClient = await mockPool.connect();
    await recordClientError(
      { error_message: 'Test', error_stack: 'Error at user@example.com' },
      'user-123',
      '127.0.0.1'
    );

    const insertQuery = mockClient.query.mock.calls[0][0] as string;
    const insertParams = mockClient.query.mock.calls[0][1] as string[];
    const stackValue = insertParams.find((p) => typeof p === 'string' && p.includes('Error at'));
    expect(stackValue).not.toContain('user@example.com');
    expect(stackValue).toContain('[REDACTED_EMAIL]');
  });
});
