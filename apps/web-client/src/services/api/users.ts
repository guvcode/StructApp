import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { User } from '../../types';
import { mapBackendRole } from '../../types';

function mapUser(row: {
  id: string; email: string; display_name: string | null; role: string;
  is_active: boolean; client_memberships: Array<{ client_id: string }>;
}): User {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name || row.email,
    role: mapBackendRole(row.role),
    is_active: row.is_active,
    client_memberships: row.client_memberships.map(m => ({
      client_id: m.client_id,
      client_role: 'primary' as const,
    })),
  };
}

export async function getUsers(): Promise<User[]> {
  const data = await apiClient<Array<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; client_memberships: Array<{ client_id: string }>;
  }>>(ENDPOINTS.users.list);
  return data.map(mapUser);
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const data = await apiClient<{
      id: string; email: string; display_name: string | null; role: string;
      is_active: boolean; client_memberships: Array<{ client_id: string }>;
    }>(ENDPOINTS.users.byId(id));
    return mapUser(data);
  } catch {
    return null;
  }
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const data = await apiClient<Array<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; client_memberships: Array<{ client_id: string }>;
  }>>(ENDPOINTS.users.byRole(role));
  return data.map(mapUser);
}

export async function updateUser(id: string, input: Partial<{ role: string; client_memberships: Array<{ client_id: string }> }>): Promise<User> {
  const data = await apiClient<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; client_memberships: Array<{ client_id: string }>;
  }>(ENDPOINTS.users.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return mapUser(data);
}

export async function deactivateUser(id: string): Promise<User> {
  const data = await apiClient<{ id: string }>(ENDPOINTS.users.deactivate(id), {
    method: 'POST',
  });
  return { id: data.id } as User;
}