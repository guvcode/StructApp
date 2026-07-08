import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/timesheets';
import type { Timesheet, TimesheetStatus } from '../types';

export function useTimesheets(userId?: string) {
  return useQuery({
    queryKey: ['timesheets', userId],
    queryFn: () => api.getTimesheets(userId),
  });
}

export function useTimesheetById(id: string | undefined) {
  return useQuery({
    queryKey: ['timesheets', id],
    queryFn: () => api.getTimesheetById(id!),
    enabled: !!id,
  });
}

export function useTimesheetsByStatus(status: TimesheetStatus) {
  return useQuery({
    queryKey: ['timesheets', 'status', status],
    queryFn: () => api.getTimesheetsByStatus(status),
  });
}

export function useCreateTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Timesheet>) => api.createTimesheet(data),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useCreateTimesheetBatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { entry_date: string; client_id?: string; entries: Array<{ work_type: string; hours: number; notes?: string }> }) =>
      api.createTimesheetBatch(input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useUpdateTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Timesheet> }) =>
      api.updateTimesheet(id, data),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useSubmitTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.submitTimesheet(id),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useDeleteTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimesheet(id),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useApproveTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverName }: { id: string; approverName: string }) =>
      api.approveTimesheet(id, approverName),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useRejectTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectTimesheet(id, reason),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useTimesheetGroups(userId?: string) {
  return useQuery({
    queryKey: ['timesheets', 'groups', userId],
    queryFn: () => api.getTimesheetGroups(userId),
  });
}

export function useApproveTimesheetGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, approverName }: { groupId: string; approverName: string }) =>
      api.approveTimesheetGroup(groupId, approverName),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}

export function useRejectTimesheetGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, reason }: { groupId: string; reason: string }) =>
      api.rejectTimesheetGroup(groupId, reason),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['timesheets'] }); },
  });
}