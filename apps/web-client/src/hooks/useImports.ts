import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/imports';

export function useBatches() {
  return useQuery({
    queryKey: ['imports', 'batches'],
    queryFn: () => api.getBatches(),
  });
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['imports', 'batches', id],
    queryFn: () => api.getBatch(id!),
    enabled: !!id,
  });
}

export function useSimulateUpload() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.simulateUpload(),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['imports'] }); },
  });
}

export function useCommitBatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.commitBatch(id),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['imports'] }); },
  });
}

export function useDiscardBatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.discardBatch(id),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['imports'] }); },
  });
}