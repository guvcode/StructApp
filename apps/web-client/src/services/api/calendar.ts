import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { InspectionSchedule, Inspection } from '../../types';

export async function getSchedules(): Promise<InspectionSchedule[]> {
  return apiClient(ENDPOINTS.calendar.schedules);
}

export async function getSchedule(id: string): Promise<InspectionSchedule | undefined> {
  try {
    return await apiClient(`${ENDPOINTS.calendar.schedules}/${id}`);
  } catch {
    return undefined;
  }
}

export async function createSchedule(input: {
  structure_id: string;
  inspector_id: string;
  interval_days: number;
  next_due_date: string;
}): Promise<InspectionSchedule> {
  return apiClient(ENDPOINTS.calendar.schedules, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSchedule(id: string, input: Partial<{
  inspector_id: string;
  interval_days: number;
  next_due_date: string;
}>): Promise<InspectionSchedule> {
  return apiClient(`${ENDPOINTS.calendar.schedules}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      default_inspector_id: input.inspector_id,
      recurrence_interval_days: input.interval_days,
      next_due_date: input.next_due_date,
    }),
  });
}

export async function toggleSchedulePause(id: string): Promise<InspectionSchedule> {
  return apiClient(`${ENDPOINTS.calendar.schedules}/${id}/toggle-pause`, {
    method: 'POST',
  });
}

export async function getCalendarInspections(year: number, month: number, inspectorId?: string): Promise<Inspection[]> {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const params = new URLSearchParams({ scheduled_date_from: from, scheduled_date_to: to });
  if (inspectorId) params.set('assignee', inspectorId);
  return apiClient(`${ENDPOINTS.inspections.list}?${params.toString()}`);
}

export async function rescheduleInspection(id: string, newDate: string): Promise<void> {
  await apiClient(ENDPOINTS.inspections.reschedule(id), {
    method: 'PATCH',
    body: JSON.stringify({ scheduled_date: newDate }),
  });
}

export async function reassignInspection(id: string, newInspectorId: string): Promise<void> {
  await apiClient(ENDPOINTS.inspections.reassign(id), {
    method: 'PATCH',
    body: JSON.stringify({ inspector_id: newInspectorId, reason: 'Calendar reassignment' }),
  });
}