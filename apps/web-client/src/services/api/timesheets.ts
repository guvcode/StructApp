import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Timesheet, TimesheetGroup, TimesheetStatus } from '../../types';

export async function createTimesheetBatch(input: { entry_date: string; client_id?: string; project_id?: string; inspection_id?: string; entries: Array<{ work_type: string; hours: number; notes?: string }> }): Promise<{ entries: Timesheet[] }> {
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
  return apiClient(url);
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