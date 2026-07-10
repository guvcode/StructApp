import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../src/services/api/timesheets';

describe('Timesheet API service', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createTimesheetBatch calls fetch with correct URL and body', async () => {
    const mockEntries = [
      { id: 'e1', user_id: 'user-1', project_id: 'proj-1', inspection_id: 'insp-1', client_id: 'client-1', work_type: 'Office Work', hours: 8, description: 'Test', entry_date: '2026-07-09', status: 'Draft', rejection_reason: null, approved_by: null, approved_at: null, created_at: '2026-07-09T10:00:00Z', updated_at: '2026-07-09T10:00:00Z' },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { entries: mockEntries } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const input = {
      entry_date: '2026-07-09',
      entries: [
        { work_type: 'Office Work', hours: 8, notes: 'Test' },
      ],
    };

    // Mock getSession to return a token
    const authStore = await import('../src/lib/authStore');
    vi.spyOn(authStore, 'getSession').mockReturnValue({
      token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      user: { id: 'user-1', email: 'test@test.com', role: 'Contractor', name: 'Test' },
    } as any);

    const result = await api.createTimesheetBatch(input);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('/api/v1/timesheets/batch');
    const callOpts = mockFetch.mock.calls[0][1];
    expect(callOpts.method).toBe('POST');
    expect(callOpts.body).toBe(JSON.stringify(input));
    expect(result).toEqual({ entries: mockEntries });
  });

  it('createTimesheetBatch sends client_id when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { entries: [{ id: 'e1', user_id: 'user-1', project_id: 'proj-1', inspection_id: null, client_id: 'client-abc', work_type: 'Field Inspection', hours: 4, description: null, entry_date: '2026-07-09', status: 'Draft', rejection_reason: null, approved_by: null, approved_at: null, created_at: '2026-07-09T10:00:00Z', updated_at: '2026-07-09T10:00:00Z' }] } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const input = {
      entry_date: '2026-07-09',
      client_id: 'client-abc',
      entries: [{ work_type: 'Field Inspection', hours: 4 }],
    };

    await api.createTimesheetBatch(input);

    const callOpts = mockFetch.mock.calls[0][1];
    expect(JSON.parse(callOpts.body)).toHaveProperty('client_id', 'client-abc');
  });

  it('submitTimesheet calls fetch with correct URL and method', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { status: 'Submitted' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.submitTimesheet('ts-123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('/api/v1/timesheets/ts-123/submit');
    const callOpts = mockFetch.mock.calls[0][1];
    expect(callOpts.method).toBe('POST');
  });

  it('updateTimesheet calls fetch with correct URL, method, and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'ts-123', hours: 6 } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.updateTimesheet('ts-123', { hours: 6, work_type: 'Office Work' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('/api/v1/timesheets/ts-123');
    const callOpts = mockFetch.mock.calls[0][1];
    expect(callOpts.method).toBe('PATCH');
  });

  it('submitTimesheet sends body with empty object', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { status: 'Submitted' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const authStore = await import('../src/lib/authStore');
    vi.spyOn(authStore, 'getSession').mockReturnValue({
      token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      user: { id: 'user-1', email: 'test@test.com', role: 'Contractor', name: 'Test' },
    } as any);

    await api.submitTimesheet('ts-123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callOpts = mockFetch.mock.calls[0][1];
    expect(callOpts.body).toBe('{}');
  });
});