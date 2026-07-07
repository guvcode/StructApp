import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/sync';
import type { SyncStateInfo } from '../types';

const MIN_INTERVAL = 30_000;
const BASE_INTERVAL = 60_000;
const MAX_INTERVAL = 600_000;

export function useSyncState() {
  const backoffRef = useRef(BASE_INTERVAL);

  return useQuery({
    queryKey: ['sync', 'state'],
    queryFn: () => api.getSyncState(),
    refetchInterval: (query) => {
      const data = query.state.data as SyncStateInfo | undefined;

      if (data?.status === 'pending') {
        backoffRef.current = BASE_INTERVAL;
        return MIN_INTERVAL;
      }

      const next = backoffRef.current;
      backoffRef.current = Math.min(next * 2, MAX_INTERVAL);
      return next;
    },
  });
}