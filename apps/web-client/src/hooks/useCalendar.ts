import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/calendar';
import type { InspectionSchedule } from '../types';

export function useSchedules() {
  return useQuery({
    queryKey: ['calendar', 'schedules'],
    queryFn: () => api.getSchedules(),
  });
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: ['calendar', 'schedules', id],
    queryFn: () => api.getSchedule(id!),
    enabled: !!id,
  });
}

export function useCalendarInspections(year: number, month: number, inspectorId?: string) {
  return useQuery({
    queryKey: ['calendar', 'inspections', year, month, inspectorId],
    queryFn: () => api.getCalendarInspections(year, month, inspectorId),
  });
}

export function useCreateSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { structure_id: string; inspector_id: string; interval_days: number; next_due_date: string }) =>
      api.createSchedule(input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['calendar'] }); },
  });
}

export function useUpdateSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ inspector_id: string; interval_days: number; next_due_date: string }> }) =>
      api.updateSchedule(id, input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['calendar'] }); },
  });
}

export function useToggleSchedulePause() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleSchedulePause(id),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['calendar'] }); },
  });
}

export function useRescheduleInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: string }) =>
      api.rescheduleInspection(id, newDate),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['calendar'] });
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useReassignInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newInspectorId }: { id: string; newInspectorId: string }) =>
      api.reassignInspection(id, newInspectorId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['calendar'] });
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}