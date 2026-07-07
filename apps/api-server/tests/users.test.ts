import { listUsers, getUserById, updateUser, replaceMemberships, deactivateUser } from '../src/services/users';

jest.mock('../src/lib/db', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const mockPool = require('../src/lib/db').pool;

describe('users service', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
    mockPool.query.mockResolvedValue(undefined);
  });

  test('mock sanity check', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1', email: 'a@b.com', display_name: 'Alice', role: 'Admin', is_active: true }], rowCount: 1 });
    const result = await mockPool.query('test');
    expect(result.rows[0].user_id).toBe('u1');
  });

  test('listUsers returns mapped users with memberships', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', email: 'a@b.com', display_name: 'Alice', role: 'Admin', is_active: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ client_id: 'c1', client_role: 'primary' }] });

    const users = await listUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.user_id).toBe('u1');
  });

  test('listUsers with role filter', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await listUsers('Contractor');
    expect(mockPool.query.mock.calls[0][0]).toContain('AND role = $1');
    expect(mockPool.query.mock.calls[0][1]).toEqual(['Contractor']);
  });

  test('getUserById returns null when not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const result = await getUserById('nonexistent');
    expect(result).toBeNull();
  });

  test('getUserById returns user with memberships', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', email: 'a@b.com', display_name: 'Alice', role: 'Admin', is_active: true }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ client_id: 'c1', client_role: 'primary' }] });

    const result = await getUserById('u1');
    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(result).not.toBeNull();
    expect(result!.email).toBe('a@b.com');
  });

  test('updateUser skips client_memberships and id fields', async () => {
    mockPool.query.mockResolvedValueOnce({});
    await updateUser('u1', { display_name: 'Bob', client_memberships: [], id: 'x' });
    const [sql] = mockPool.query.mock.calls[0];
    expect(sql).toContain('display_name');
    expect(sql).not.toContain('SET id');
  });

  test('updateUser does nothing with empty fields', async () => {
    await updateUser('u1', {});
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  test('replaceMemberships', async () => {
    mockPool.query.mockResolvedValue({});
    await replaceMemberships('u1', [{ client_id: 'c1', client_role: 'primary' }]);
    expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM client_memberships WHERE user_id = $1', ['u1']);
  });

  test('deactivateUser returns true when user exists', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 1 });
    expect(await deactivateUser('u1')).toBe(true);
  });

  test('deactivateUser returns false when user not found', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    expect(await deactivateUser('nonexistent')).toBe(false);
  });
});