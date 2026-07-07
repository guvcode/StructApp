import { describe, it, expect } from 'vitest';

describe('Bundle 11 — Mock Timesheet Service', () => {

  it('getTimesheets returns all timesheets', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const list = await mod.getTimesheets();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('status');
  });

  it('getTimesheets filters by userId', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const list = await mod.getTimesheets('u-eleanor');
    expect(list.every(t => t.user_id === 'u-eleanor')).toBe(true);
  });

  it('getTimesheetById returns single timesheet', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.getTimesheetById('ts-001');
    expect(ts).not.toBeNull();
    expect(ts && ts.id).toBe('ts-001');
  });

  it('getTimesheetById returns null for unknown', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.getTimesheetById('ts-unknown');
    expect(ts).toBeNull();
  });

  it('createTimesheet creates a draft', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.createTimesheet({ user_id: 'u-eleanor', entry_date: '2025-06-15', hours: 8, work_type: 'Office Work' });
    expect(ts.status).toBe('Draft');
    expect(ts.hours).toBe(8);
  });

  it('updateTimesheet modifies a draft', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const updated = await mod.updateTimesheet('ts-001', { hours: 7 });
    expect(updated.hours).toBe(7);
  });

  it('updateTimesheet throws on non-draft', async () => {
    const mod = await import('../src/services/mockTimesheet');
    await expect(mod.updateTimesheet('ts-002', { hours: 5 })).rejects.toThrow('Only draft');
  });

  it('submitTimesheet transitions Draft to Submitted', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.createTimesheet({ user_id: 'u-eleanor', entry_date: '2025-06-15', hours: 6 });
    const submitted = await mod.submitTimesheet(ts.id);
    expect(submitted.status).toBe('Submitted');
  });

  it('submitTimesheet throws on non-draft', async () => {
    const mod = await import('../src/services/mockTimesheet');
    await expect(mod.submitTimesheet('ts-002')).rejects.toThrow('Only draft');
  });

  it('approveTimesheet transitions Submitted to Approved', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.createTimesheet({ user_id: 'u-eleanor', entry_date: '2025-06-15', hours: 6 });
    await mod.submitTimesheet(ts.id);
    const approved = await mod.approveTimesheet(ts.id, 'Priya Sharma');
    expect(approved.status).toBe('Approved');
    expect(approved.approved_by).toBe('Priya Sharma');
  });

  it('approveTimesheet throws on non-submitted', async () => {
    const mod = await import('../src/services/mockTimesheet');
    await expect(mod.approveTimesheet('ts-001', 'Admin')).rejects.toThrow('Only submitted');
  });

  it('rejectTimesheet requires reason', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.createTimesheet({ user_id: 'u-eleanor', hours: 4 });
    await mod.submitTimesheet(ts.id);
    const rejected = await mod.rejectTimesheet(ts.id, 'Incomplete information');
    expect(rejected.status).toBe('Rejected');
    expect(rejected.rejection_reason).toBe('Incomplete information');
  });

  it('rejectTimesheet throws on non-submitted', async () => {
    const mod = await import('../src/services/mockTimesheet');
    await expect(mod.rejectTimesheet('ts-001', 'Bad')).rejects.toThrow('Only submitted');
  });

  it('deleteTimesheet removes entry', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const ts = await mod.createTimesheet({ user_id: 'u-eleanor', hours: 4 });
    await mod.deleteTimesheet(ts.id);
    const found = await mod.getTimesheetById(ts.id);
    expect(found).toBeNull();
  });

  it('getTimesheetsByStatus filters by status', async () => {
    const mod = await import('../src/services/mockTimesheet');
    const drafts = await mod.getTimesheetsByStatus('Draft' as any);
    expect(drafts.every(t => t.status === 'Draft')).toBe(true);
  });
});