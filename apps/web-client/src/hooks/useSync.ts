import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/sync';

export function useSyncState() {
  return useQuery({
    queryKey: ['sync', 'state'],
    queryFn: () => api.getSyncState(),
    refetchInterval: 60_000,
  });
}