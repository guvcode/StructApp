import type { Timesheet, TimesheetGroup } from '../types/index';
import { TimesheetStatus } from '../types/index';

function delay(ms = 60): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0] ?? '';
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0] ?? '';
}

function groupTimesheets(entries: Timesheet[]): TimesheetGroup[] {
  const groups = new Map<string, Timesheet[]>();
  for (const ts of entries) {
    const ws = getWeekStart(ts.entry_date);
    const key = `${ts.user_id}::${ws}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ts);
  }

  const result: TimesheetGroup[] = [];
  for (const [key, groupEntries] of groups) {
    const parts = key.split('::');
    const userId = parts[0] ?? '';
    const weekStart = parts[1] ?? '';
    const first = groupEntries[0];
    if (!first) continue;

    const statusValues = [...new Set(groupEntries.map(e => e.status))];
    const hasRejected = statusValues.includes('Rejected' as TimesheetStatus);
    const hasApproved = statusValues.includes('Approved' as TimesheetStatus);
    const groupStatus: typeof first.status = hasRejected ? 'Rejected' as any
      : hasApproved ? 'Approved' as any : first.status;

    const groupEntry: TimesheetGroup = {
      id: `grp-${key}`,
      user_id: userId,
      week_start: weekStart,
      week_end: getWeekEnd(weekStart),
      entries: groupEntries,
      total_hours: groupEntries.reduce((sum, e) => sum + e.hours, 0),
      status: groupStatus,
    };
    if (first.user_name) groupEntry.user_name = first.user_name;
    if (first.project_id) groupEntry.project_id = first.project_id;
    const rejection = groupEntries.find(e => e.rejection_reason);
    if (rejection?.rejection_reason) groupEntry.rejection_reason = rejection.rejection_reason;
    const approval = groupEntries.find(e => e.approved_by);
    if (approval?.approved_by) groupEntry.approved_by = approval.approved_by;
    if (approval?.approved_at) groupEntry.approved_at = approval.approved_at;
    result.push(groupEntry);
  }
  return result;
}

export const mockTimesheets: Timesheet[] = [
  { id: 'ts-001', user_id: 'u-eleanor', client_id: 'client-1', entry_date: '2025-06-10', hours: 8, work_type: 'Field Inspection', description: 'Harbor Bridge full inspection', status: TimesheetStatus.Draft, created_at: '2025-06-10T08:00:00Z', user_name: 'Eleanor Vance' },
  { id: 'ts-002', user_id: 'u-eleanor', client_id: 'client-1', entry_date: '2025-06-11', hours: 6, work_type: 'Report Writing', description: 'Bridge inspection report drafting', status: TimesheetStatus.Submitted, created_at: '2025-06-11T09:00:00Z', user_name: 'Eleanor Vance' },
  { id: 'ts-003', user_id: 'u-marcus', client_id: 'client-1', entry_date: '2025-06-10', hours: 7.5, work_type: 'Field Inspection', description: 'River Plant annual inspection', status: TimesheetStatus.Approved, created_at: '2025-06-10T07:30:00Z', approved_by: 'Priya Sharma', approved_at: '2025-06-11T10:00:00Z', user_name: 'Marcus Chen' },
  { id: 'ts-004', user_id: 'u-marcus', client_id: 'client-1', entry_date: '2025-06-09', hours: 4, work_type: 'Equipment Check', description: 'Calibration of inspection tools', status: TimesheetStatus.Rejected, rejection_reason: 'Hours exceed project allocation for this work type.', created_at: '2025-06-09T08:00:00Z', user_name: 'Marcus Chen' },
  { id: 'ts-005', user_id: 'u-eleanor', client_id: 'client-1', entry_date: '2025-06-12', hours: 8, work_type: 'Field Inspection', description: 'Downtown Tower follow-up', status: TimesheetStatus.Submitted, created_at: '2025-06-12T08:00:00Z', user_name: 'Eleanor Vance' },
];

export async function getTimesheets(userId?: string): Promise<Timesheet[]> {
  await delay();
  let result = [...mockTimesheets];
  if (userId) result = result.filter(t => t.user_id === userId);
  return result;
}

export async function getTimesheetById(id: string): Promise<Timesheet | null> {
  await delay(30);
  return mockTimesheets.find(t => t.id === id) ?? null;
}

export async function createTimesheet(data: Partial<Timesheet>): Promise<Timesheet> {
  await delay(40);
const ts: Timesheet = {
    id: `ts-${Date.now()}`,
    user_id: data.user_id ?? 'unknown',
    client_id: 'client-1',
    entry_date: data.entry_date ?? new Date().toISOString().split('T')[0] ?? '',
    hours: data.hours ?? 0,
    work_type: data.work_type ?? '',
    description: data.description ?? '',
    status: TimesheetStatus.Draft,
    created_at: new Date().toISOString(),
  };
  mockTimesheets.push(ts);
  return ts;
}

export async function updateTimesheet(id: string, data: Partial<Timesheet>): Promise<Timesheet> {
  await delay(40);
  const ts = mockTimesheets.find(t => t.id === id);
  if (!ts) throw new Error('Timesheet not found');
  if (ts.status !== TimesheetStatus.Draft) throw new Error('Only draft timesheets can be edited');
  Object.assign(ts, data);
  return ts;
}

export async function submitTimesheet(id: string): Promise<Timesheet> {
  await delay(40);
  const ts = mockTimesheets.find(t => t.id === id);
  if (!ts) throw new Error('Timesheet not found');
  if (ts.status !== TimesheetStatus.Draft) throw new Error('Only draft timesheets can be submitted');
  ts.status = TimesheetStatus.Submitted;
  ts.created_at = new Date().toISOString();
  return ts;
}

export async function deleteTimesheet(id: string): Promise<void> {
  await delay(30);
  const idx = mockTimesheets.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Timesheet not found');
  mockTimesheets.splice(idx, 1);
}

export async function approveTimesheet(id: string, approverName: string): Promise<Timesheet> {
  await delay(40);
  const ts = mockTimesheets.find(t => t.id === id);
  if (!ts) throw new Error('Timesheet not found');
  if (ts.status !== TimesheetStatus.Submitted) throw new Error('Only submitted timesheets can be approved');
  ts.status = TimesheetStatus.Approved;
  ts.approved_by = approverName;
  ts.approved_at = new Date().toISOString();
  return ts;
}

export async function rejectTimesheet(id: string, reason: string): Promise<Timesheet> {
  await delay(40);
  const ts = mockTimesheets.find(t => t.id === id);
  if (!ts) throw new Error('Timesheet not found');
  if (ts.status !== TimesheetStatus.Submitted) throw new Error('Only submitted timesheets can be rejected');
  ts.status = TimesheetStatus.Rejected;
  ts.rejection_reason = reason;
  return ts;
}

export async function getTimesheetsByStatus(status: TimesheetStatus): Promise<Timesheet[]> {
  await delay(40);
  return mockTimesheets.filter(t => t.status === status);
}

export async function getTimesheetGroups(userId?: string): Promise<TimesheetGroup[]> {
  await delay(60);
  let entries = [...mockTimesheets];
  if (userId) entries = entries.filter(t => t.user_id === userId);
  return groupTimesheets(entries);
}

export async function approveTimesheetGroup(groupId: string, approverName: string): Promise<TimesheetGroup[]> {
  await delay(40);
  const group = (await getTimesheetGroups()).find(g => g.id === groupId);
  if (!group) throw new Error('Timesheet group not found');
  const submitted = group.entries.filter(e => e.status === TimesheetStatus.Submitted);
  if (submitted.length === 0) throw new Error('No submitted entries in this group');
  for (const entry of submitted) {
    const ts = mockTimesheets.find(t => t.id === entry.id);
    if (ts) {
      ts.status = TimesheetStatus.Approved as unknown as typeof ts.status;
      ts.approved_by = approverName;
      ts.approved_at = new Date().toISOString();
    }
  }
  return getTimesheetGroups();
}

export async function rejectTimesheetGroup(groupId: string, reason: string): Promise<TimesheetGroup[]> {
  await delay(40);
  const group = (await getTimesheetGroups()).find(g => g.id === groupId);
  if (!group) throw new Error('Timesheet group not found');
  const submitted = group.entries.filter(e => e.status === TimesheetStatus.Submitted);
  if (submitted.length === 0) throw new Error('No submitted entries in this group');
  for (const entry of submitted) {
    const ts = mockTimesheets.find(t => t.id === entry.id);
    if (ts) {
      ts.status = TimesheetStatus.Rejected as unknown as typeof ts.status;
      ts.rejection_reason = reason;
    }
  }
  return getTimesheetGroups();
}