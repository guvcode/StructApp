import { login, refreshAccessToken, switchClient } from '../src/services/auth';
import jwt from 'jsonwebtoken';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

const mockPool = require('../src/lib/db').pool;

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login returns token pair on valid credentials', async () => {
    const mockUser = {
      user_id: 'user-123',
      password_hash: '$2b$10$test',
      role: 'Admin',
      client_id: 'client-456',
      inspector_id: null,
    };
    mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

    const result = await login('test@test.com', 'password');

    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.user_id).toBe('user-123');
  });

  test('login throws INVALID_CREDENTIALS for missing user', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await expect(login('missing@test.com', 'password')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  test('refreshAccessToken creates valid access token', async () => {
    const token = await refreshAccessToken('user-123', 'client-456', 'Admin');

    expect(token).toBeDefined();
  });

  describe('switchClient', () => {
    test('Admin can switch to any client', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await switchClient('user-123', 'Admin', 'target-client-456');

      expect(result.access_token).toBeDefined();
    });

    test('Reviewer can switch to any client', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await switchClient('user-123', 'Reviewer', 'target-client-456');

      expect(result.access_token).toBeDefined();
    });

    test('Contractor throws NOT_A_MEMBER without membership', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(switchClient('user-123', 'Contractor', 'target-client-456')).rejects.toThrow('NOT_A_MEMBER');
    });

    test('Contractor can switch with valid membership', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await switchClient('user-123', 'Contractor', 'member-client-456');

      expect(result.access_token).toBeDefined();
    });
  });
});