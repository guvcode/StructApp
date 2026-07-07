import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/remediation';
import type { RemediationStatus } from '../types';

export function useRemediationDeficiencies() {
  return useQuery({
    queryKey: ['remediation', 'deficiencies'],
    queryFn: () => api.getRemediationDeficiencies(),
  });
}

export function useRemediationDeficiencyById(id: string | undefined) {
  return useQuery({
    queryKey: ['remediation', 'deficiencies', id],
    queryFn: () => api.getRemediationDeficiencyById(id!),
    enabled: !!id,
  });
}

export function useUpdateRemediationStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, dueDate }: { id: string; status: RemediationStatus; dueDate?: string }) =>
      api.updateRemediationStatus(id, status, dueDate),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['remediation'] }); },
  });
}

export function useVerifyClosure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifierName }: { id: string; verifierName: string }) =>
      api.verifyClosure(id, verifierName),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['remediation'] }); },
  });
}

export function useRemediationPhotos(deficiencyId: string | undefined) {
  return useQuery({
    queryKey: ['remediation', 'photos', deficiencyId],
    queryFn: () => api.getRemediationPhotos(deficiencyId!),
    enabled: !!deficiencyId,
  });
}

export function useAddRemediationPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ deficiencyId, caption, dataUrl }: { deficiencyId: string; caption: string; dataUrl: string }) =>
      api.addRemediationPhoto(deficiencyId, caption, dataUrl),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ['remediation', 'photos', variables.deficiencyId] });
    },
  });
}

export function useHasRemediationEvidence(deficiencyId: string | undefined) {
  return useQuery({
    queryKey: ['remediation', 'evidence', deficiencyId],
    queryFn: () => api.hasRemediationEvidence(deficiencyId!),
    enabled: !!deficiencyId,
  });
}