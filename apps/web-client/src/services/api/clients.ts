import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Client, Project } from '../../types';

export async function getClients(): Promise<Client[]> {
  return apiClient(ENDPOINTS.clients.list);
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    return await apiClient(ENDPOINTS.clients.byId(id));
  } catch {
    return null;
  }
}

export async function getClientProjects(clientId: string): Promise<Project[]> {
  return apiClient(ENDPOINTS.clients.projects(clientId));
}

export async function createClient(input: { name: string; safety_email?: string }): Promise<Client> {
  return apiClient(ENDPOINTS.clients.create, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateClient(id: string, input: Partial<{ name: string; safety_email: string }>): Promise<Client> {
  return apiClient(ENDPOINTS.clients.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}