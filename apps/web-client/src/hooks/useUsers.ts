import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  });
}

export function useUsersByRole(role: string) {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: () => api.getUsersByRole(role),
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ role: string; client_memberships: Array<{ client_id: string; client_role: string }> }> }) =>
      api.updateUser(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeactivateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateUser(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['users'] });
    },
  });
}