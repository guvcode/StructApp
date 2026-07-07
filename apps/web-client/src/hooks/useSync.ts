import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/sync';

export function useSyncState() {
  return useQuery({
    queryKey: ['sync', 'state'],
    queryFn: () => api.getSyncState(),
    refetchInterval: 10_000,
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: ['sync', 'pendingCount'],
    queryFn: () => api.getPendingCount(),
    refetchInterval: 5_000,
  });
}