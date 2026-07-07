import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import type { PicklistEntry } from '../types';

const TYPE_MAP: Record<string, PicklistEntry['type']> = {
  'component-types': 'component_type',
  'work-types': 'work_type',
  'structure-types': 'structure_type',
};

export function usePicklists(type: 'component-types' | 'work-types' | 'structure-types') {
  return useQuery<PicklistEntry[]>({
    queryKey: ['picklists', type],
    queryFn: async () => {
      const items = await apiClient<Array<Record<string, unknown>>>(ENDPOINTS.picklists.byType(type));
      return items.map(item => ({
        id: (item as Record<string, string>).component_type_id || (item as Record<string, string>).work_type_id || (item as Record<string, string>).structure_type_id,
        name: item.name as string,
        isActive: (item.is_active ?? true) as boolean,
        type: TYPE_MAP[type],
      }));
    },
  });
}

export function useAddPicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient(ENDPOINTS.picklists.byType(type), { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['picklists', type] }),
  });
}

export function useDeactivatePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(ENDPOINTS.picklists.item(type, id), { method: 'PATCH', body: JSON.stringify({ is_active: false }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['picklists', type] }),
  });
}

export function useReactivatePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(ENDPOINTS.picklists.item(type, id), { method: 'PATCH', body: JSON.stringify({ is_active: true }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['picklists', type] }),
  });
}

export function useRenamePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient(ENDPOINTS.picklists.item(type, id), { method: 'PATCH', body: JSON.stringify({ name }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['picklists', type] }),
  });
}