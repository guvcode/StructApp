import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/pendingStructures';
import type { PendingStructure } from '../services/api/pendingStructures';

export function useContractorPendingStructures() {
  return useQuery({
    queryKey: ['pending-structures', 'mine'],
    queryFn: api.getContractorPendingStructures,
  });
}

export function usePendingStructuresForReview() {
  return useQuery({
    queryKey: ['pending-structures', 'review'],
    queryFn: api.getPendingStructuresForReview,
  });
}

export function usePendingStructure(id: string | undefined) {
  return useQuery({
    queryKey: ['pending-structures', id],
    queryFn: () => api.getPendingStructureById(id!),
    enabled: !!id,
  });
}

export function usePendingDeficiencies(bundleId: string | undefined) {
  return useQuery({
    queryKey: ['pending-structures', bundleId, 'deficiencies'],
    queryFn: () => api.getPendingDeficiencies(bundleId!),
    enabled: !!bundleId,
  });
}

export function usePendingPhotos(bundleId: string | undefined) {
  return useQuery({
    queryKey: ['pending-structures', bundleId, 'photos'],
    queryFn: () => api.getPendingPhotos(bundleId!),
    enabled: !!bundleId,
  });
}

export function useSubmitPendingStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.submitPendingStructureBundle,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['pending-structures'] });
    },
  });
}

export function useApprovePendingStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approvePendingStructure(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['pending-structures'] });
    },
  });
}

export function useRejectPendingStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectPendingStructure(id, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['pending-structures'] });
    },
  });
}
