import { listClients, getClientById, createClient, updateClient, getClientProjects } from '../src/services/clients';

jest.mock('../src/lib/db', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const mockPool = require('../src/lib/db').pool;

describe('clients service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('listClients returns all clients', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ client_id: 'c1', name: 'Client A', slug: 'client-a', safety_email: null, logo_url: null, is_active: true, created_at: '2026-01-01' }],
    });

    const clients = await listClients();
    expect(clients).toHaveLength(1);
    expect(clients[0]?.name).toBe('Client A');
  });

  test('getClientById returns null when not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getClientById('nonexistent');
    expect(result).toBeNull();
  });

  test('getClientById returns client when found', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ client_id: 'c1', name: 'Client A', slug: 'client-a', safety_email: null, logo_url: null, is_active: true, created_at: '2026-01-01' }],
    });

    const result = await getClientById('c1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Client A');
  });

  test('createClient inserts and returns client', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ client_id: 'c-new', name: 'New Client', slug: 'new-client', safety_email: null, logo_url: null, is_active: true, created_at: '2026-07-05' }],
    });

    const result = await createClient('New Client');
    expect(result.name).toBe('New Client');
    expect(result.slug).toBe('new-client');
    expect(mockPool.query.mock.calls[0][0]).toContain('INSERT INTO clients');
  });

  test('createClient with safety_email', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ client_id: 'c2', name: 'Test', slug: 'test', safety_email: 'safety@test.com', logo_url: null, is_active: true, created_at: '2026-07-05' }],
    });

    const result = await createClient('Test', 'safety@test.com');
    expect(result.safety_email).toBe('safety@test.com');
  });

  test('updateClient returns null when no fields', async () => {
    const result = await updateClient('c1', {});
    expect(result).toBeNull();
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  test('updateClient returns null when client not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await updateClient('nonexistent', { name: 'New' });
    expect(result).toBeNull();
  });

  test('updateClient updates and returns client', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ client_id: 'c1', name: 'Updated', slug: 'client-a', safety_email: null, logo_url: null, is_active: true, created_at: '2026-01-01' }],
    });

    const result = await updateClient('c1', { name: 'Updated' });
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated');
  });

  test('getClientProjects returns projects for a client', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ project_id: 'p1', client_id: 'c1', name: 'Project 1', code: 'P1', status: 'active', region: null, start_date: null, end_date: null, created_at: '2026-01-01' }],
    });

    const projects = await getClientProjects('c1');
    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe('Project 1');
  });
});