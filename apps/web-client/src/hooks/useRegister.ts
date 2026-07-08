import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/register';

export function useProjects(clientId?: string) {
  return useQuery({
    queryKey: ['projects', clientId],
    queryFn: () => api.getProjects(clientId),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createProject>[0]) => api.createProject(input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useUpdateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateProject>[1] }) =>
      api.updateProject(id, input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useSites(projectId?: string, clientId?: string) {
  return useQuery({
    queryKey: ['sites', projectId, clientId],
    queryFn: () => api.getSites(projectId, clientId),
  });
}

export function useSite(id: string | undefined) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => api.getSite(id!),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createSite>[0]) => api.createSite(input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['sites'] }); },
  });
}

export function useUpdateSite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateSite>[1] }) =>
      api.updateSite(id, input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['sites'] }); },
  });
}

export function useStructures(siteId?: string, clientId?: string) {
  return useQuery({
    queryKey: ['structures', siteId, clientId],
    queryFn: () => api.getStructures(siteId, clientId),
  });
}

export function useStructure(id: string | undefined) {
  return useQuery({
    queryKey: ['structures', id],
    queryFn: () => api.getStructure(id!),
    enabled: !!id,
  });
}

export function useSearchStructures(query: string, clientId?: string) {
  return useQuery({
    queryKey: ['structures', 'search', query, clientId],
    queryFn: () => api.searchStructures(query, clientId),
    enabled: query.length > 0,
  });
}

export function useCreateStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createStructure>[0]) => api.createStructure(input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['structures'] }); },
  });
}

export function useUpdateStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateStructure>[1] }) =>
      api.updateStructure(id, input),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['structures'] }); },
  });
}