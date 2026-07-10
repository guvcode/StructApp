import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Timesheet, TimesheetGroup, TimesheetStatus } from '../../types';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSunday(d: Date): Date {
  const mon = getMonday(d);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return sun;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function groupIntoWeeks(entries: Timesheet[]): TimesheetGroup[] {
  const groupMap = new Map<string, {
    user_id: string;
    user_name: string;
    week_start: string;
    week_end: string;
    entries: Timesheet[]; }>();

  for (const entry of entries) {
    const entryDate = new Date(entry.entry_date + 'T00:00:00');
    const weekStart = getMonday(entryDate);
    const weekEnd = getSunday(entryDate);
    const weekKey = `${entry.user_id}_${toISODate(weekStart)}`;
    if (!groupMap.has(weekKey)) {
      groupMap.set(weekKey, {
        user_id: entry.user_id,
        user_name: (entry as any).user_name ?? entry.user_id,
        week_start: toISODate(weekStart),
        week_end: toISODate(weekEnd),
        entries: [],
      });
    }
    groupMap.get(weekKey)!.entries.push(entry);
  }

  return Array.from(groupMap.entries()).map(([key, group]) => {
    const totalHours = group.entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const statuses = new Set(group.entries.map(e => e.status));
    let groupStatus = statuses.size === 1 ? group.entries[0]!.status : 'Mixed';
    if (statuses.has('Rejected')) groupStatus = 'Rejected';
    const sorted = [...group.entries].sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    return {
      id: key,
      user_id: group.user_id,
      user_name: group.user_name,
      week_start: group.week_start,
      week_end: group.week_end,
      entries: sorted,
      total_hours: totalHours,
      status: groupStatus as TimesheetStatus | 'Mixed',
    };
  });
}

export async function getTimesheets(clientId?: string): Promise<Timesheet[]> {
  const url = clientId ? `${ENDPOINTS.timesheets.list}?client_id=${clientId}` : ENDPOINTS.timesheets.list;
  return apiClient(url);
}

export async function getTimesheetById(id: string, clientId?: string): Promise<Timesheet | null> {
  try {
    const url = clientId ? `${ENDPOINTS.timesheets.byId(id)}?client_id=${clientId}` : ENDPOINTS.timesheets.byId(id);
    return await apiClient(url);
  } catch {
    return null;
  }
}

export async function getTimesheetsByStatus(status: TimesheetStatus): Promise<Timesheet[]> {
  return apiClient(`${ENDPOINTS.timesheets.list}?status=${status}`);
}

export async function createTimesheet(data: Partial<Timesheet>): Promise<Timesheet> {
  return apiClient(ENDPOINTS.timesheets.create, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createTimesheetBatch(input: { entry_date: string; client_id?: string; project_id?: string; inspection_id?: string; entries: Array<{ work_type: string; hours: number; notes?: string; pre_inspection?: boolean }> }): Promise<{ entries: Timesheet[] }> {
  return apiClient(ENDPOINTS.timesheets.batch, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTimesheet(id: string, data: Partial<Timesheet>): Promise<Timesheet> {
  return apiClient(ENDPOINTS.timesheets.update(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function submitTimesheet(id: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.submit(id), { method: 'POST', body: '{}' });
}

export async function deleteTimesheet(id: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.delete(id), { method: 'DELETE' });
}

export async function approveTimesheet(id: string, approverName: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.approve(id), {
    method: 'POST',
    body: JSON.stringify({ approver_name: approverName }),
  });
}

export async function rejectTimesheet(id: string, reason: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.reject(id), {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  });
}

export async function getTimesheetGroups(userId?: string): Promise<TimesheetGroup[]> {
  const url = userId ? `${ENDPOINTS.timesheets.groups}?user_id=${userId}` : ENDPOINTS.timesheets.groups;
  const entries = await apiClient<Timesheet[]>(url);
  return groupIntoWeeks(entries);
}

export async function approveTimesheetGroup(groupId: string, approverName: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.approveGroup(groupId), {
    method: 'POST',
    body: JSON.stringify({ approver_name: approverName }),
  });
}

export async function rejectTimesheetGroup(groupId: string, reason: string): Promise<void> {
  await apiClient(ENDPOINTS.timesheets.rejectGroup(groupId), {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  });
}