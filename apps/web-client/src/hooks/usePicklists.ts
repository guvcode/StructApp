import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { getSession } from '../lib/authStore';
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
      const session = getSession();
      const response = await fetch(`/api/v1/${type}`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch picklists');
      }
      const data = await response.json();
      return data.data.map((item: { component_type_id?: string; work_type_id?: string; structure_type_id?: string; name: string; is_active?: boolean }) => ({
        id: item.component_type_id || item.work_type_id || item.structure_type_id,
        name: item.name,
        isActive: item.is_active ?? true,
        type: TYPE_MAP[type],
      }));
    },
  });
}

export function useAddPicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const session = getSession();
      const response = await fetch(`/api/v1/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item');
      }
      return response.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['picklists', type] });
    },
  });
}

export function useDeactivatePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const session = getSession();
      const response = await fetch(`/api/v1/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ is_active: false }),
      });
      if (!response.ok) {
        throw new Error('Failed to deactivate item');
      }
      return response.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['picklists', type] });
    },
  });
}

export function useReactivatePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const session = getSession();
      const response = await fetch(`/api/v1/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ is_active: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to reactivate item');
      }
      return response.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['picklists', type] });
    },
  });
}

export function useRenamePicklistItem(type: 'component-types' | 'work-types' | 'structure-types') {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const session = getSession();
      const response = await fetch(`/api/v1/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error('Failed to rename item');
      }
      return response.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['picklists', type] });
    },
  });
}