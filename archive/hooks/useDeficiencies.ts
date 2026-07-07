import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/deficiencies';
import type { PriorityTier } from '../types';

export function useDeficiencies(inspectionId?: string) {
  return useQuery({
    queryKey: ['deficiencies', inspectionId],
    queryFn: () => api.getDeficiencies(inspectionId),
  });
}

export function useDeficiency(id: string | undefined) {
  return useQuery({
    queryKey: ['deficiencies', id],
    queryFn: () => api.getDeficiency(id!),
    enabled: !!id,
  });
}

export function useDeficienciesByPriority(tier: PriorityTier) {
  return useQuery({
    queryKey: ['deficiencies', 'priority', tier],
    queryFn: () => api.getDeficienciesByPriority(tier),
  });
}