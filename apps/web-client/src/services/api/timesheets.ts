import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Timesheet, TimesheetGridData, TimesheetGridCell, TimesheetStatus } from '../../types';

function groupIntoGrid(entries: Timesheet[]): TimesheetGridData {
  const contractorMap = new Map<string, { user_id: string; user_name: string }>();
  const inspectionMap = new Map<string, { inspection_id: string; inspection_name: string }>();
  const cellMap = new Map<string, TimesheetGridCell>();

  for (const entry of entries) {
    const contractorKey = entry.user_id;
    if (!contractorMap.has(contractorKey)) {
      contractorMap.set(contractorKey, {
        user_id: entry.user_id,
        user_name: entry.user_name ?? entry.user_id,
      });
    }

    const inspectionKey = entry.inspection_id || '__none__';
    if (!inspectionMap.has(inspectionKey)) {
      inspectionMap.set(inspectionKey, {
        inspection_id: inspectionKey,
        inspection_name: entry.inspection_name || (entry.inspection_id ? 'Unknown Inspection' : 'Other'),
      });
    }

    const cellKey = `${entry.user_id}|${inspectionKey}`;
    if (!cellMap.has(cellKey)) {
      cellMap.set(cellKey, {
        user_id: entry.user_id,
        inspection_id: inspectionKey,
        entries: [],
        total_hours: 0,
        status: 'Draft',
      });
    }
    const cell = cellMap.get(cellKey)!;
    cell.entries.push(entry);
    cell.total_hours += Number(entry.hours);
  }

  const inspectors = Array.from(contractorMap.values()).sort((a, b) =>
    a.user_name.localeCompare(b.user_name)
  );
  const inspections = Array.from(inspectionMap.values()).sort((a, b) => {
    if (a.inspection_id === '__none__') return 1;
    if (b.inspection_id === '__none__') return -1;
    return a.inspection_name.localeCompare(b.inspection_name);
  });

  const cells: TimesheetGridCell[] = [];
  for (const cell of cellMap.values()) {
    const statuses = new Set(cell.entries.map(e => e.status));
    let cellStatus: TimesheetStatus | 'Mixed' = statuses.size === 1 ? cell.entries[0]!.status : 'Mixed';
    if (statuses.has('Rejected')) cellStatus = 'Rejected';
    cell.entries.sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    cells.push({ ...cell, status: cellStatus });
  }

  return { inspections, contractors: inspectors, cells };
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

export async function getTimesheetGroups(userId?: string): Promise<TimesheetGridData> {
  const url = userId ? `${ENDPOINTS.timesheets.groups}?user_id=${userId}` : ENDPOINTS.timesheets.groups;
  const entries = await apiClient<Timesheet[]>(url);
  return groupIntoGrid(entries);
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