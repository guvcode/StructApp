import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/inspections';
import type { Inspection, Deficiency } from '../types';

export function useInspections(filters?: Partial<{ site_id: string; status: string }>) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: () => api.getInspections(filters),
  });
}

export function useInspectionsBySite(siteId: string) {
  return useQuery({
    queryKey: ['inspections', 'site', siteId],
    queryFn: () => api.getInspectionsBySite(siteId),
    enabled: !!siteId,
  });
}

export function useInspection(id: string | undefined) {
  return useQuery({
    queryKey: ['inspections', id],
    queryFn: () => api.getInspection(id!),
    enabled: !!id,
  });
}

export function useInspectionsByAssignee(userId: string | undefined, clientId?: string) {
  return useQuery({
    queryKey: ['inspections', 'assignee', userId, clientId],
    queryFn: () => api.getInspectionsByAssignee(userId!, clientId),
    enabled: !!userId,
  });
}

export function useDeficienciesForInspection(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ['deficiencies', 'inspection', inspectionId],
    queryFn: () => api.getDeficienciesForInspection(inspectionId!),
    enabled: !!inspectionId,
  });
}

export function useDeficiencyById(id: string | undefined) {
  return useQuery({
    queryKey: ['deficiencies', id],
    queryFn: () => api.getDeficiencyById(id!),
    enabled: !!id,
  });
}

export function useCreateInspections() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { structure_ids: string[]; site_id: string; inspector_id: string }) =>
      api.createInspections(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useCreateDeficiency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ inspectionId, data }: { inspectionId: string; data: Partial<Deficiency> }) =>
      api.createDeficiency(inspectionId, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });
}

export function useUpdateDeficiency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deficiency> }) =>
      api.updateDeficiency(id, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });
}

export function useSubmitInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.submitInspection(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useReturnInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.returnInspection(id, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useApproveInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveInspection(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useReopenInspection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetStatus, reason }: { id: string; targetStatus: 'Submitted' | 'Returned'; reason: string }) =>
      api.reopenInspection(id, targetStatus, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useOverridePriority() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ defId, priorityTier, justification }: { defId: string; priorityTier: string; justification: string }) =>
      api.overridePriority(defId, priorityTier, justification),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });
}

export function useInspectionHistory(id: string | undefined) {
  return useQuery({
    queryKey: ['inspections', id, 'history'],
    queryFn: () => api.getInspectionHistory(id!),
    enabled: !!id,
  });
}

export function useTriageMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ inspectionId, decisions }: {
      inspectionId: string;
      decisions: Array<{ deficiency_id: string; decision: 'resolved' | 'still_outstanding' | 'worsened'; note?: string }>;
    }) => api.postTriage(inspectionId, decisions),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['deficiencies'] });
      client.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}