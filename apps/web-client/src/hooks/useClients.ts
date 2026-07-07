import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/clients';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.getClient(id!),
    enabled: !!id,
  });
}

export function useClientProjects(clientId: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'client', clientId],
    queryFn: () => api.getClientProjects(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; safety_email?: string }) => api.createClient(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ name: string; safety_email: string }> }) =>
      api.updateClient(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}