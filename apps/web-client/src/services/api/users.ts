import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { User } from '../../types';
import { mapBackendRole } from '../../types';

function mapUser(row: {
  id: string; email?: string; display_name?: string | null; role?: string;
  is_active?: boolean; last_login_at?: string | null; invite_accepted_at?: string | null;
  client_memberships?: Array<{ client_id: string }>;
}): User {
  return {
    id: row.id,
    email: row.email || '',
    display_name: row.display_name || row.email || row.id,
    role: row.role ? mapBackendRole(row.role) : 'contractor',
    is_active: row.is_active ?? true,
    last_login_at: row.last_login_at || null,
    invite_accepted_at: row.invite_accepted_at || null,
    client_memberships: (row.client_memberships || []).map(m => ({
      client_id: m.client_id,
      client_role: 'primary' as const,
    })),
  };
}

export async function getUsers(): Promise<User[]> {
  const data = await apiClient<Array<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; last_login_at?: string | null; invite_accepted_at?: string | null;
    client_memberships: Array<{ client_id: string }>;
  }>>(ENDPOINTS.users.list);
  return data.map(mapUser);
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const data = await apiClient<{
      id: string; email: string; display_name: string | null; role: string;
      is_active: boolean; last_login_at?: string | null; invite_accepted_at?: string | null;
      client_memberships: Array<{ client_id: string }>;
    }>(ENDPOINTS.users.byId(id));
    return mapUser(data);
  } catch {
    return null;
  }
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const data = await apiClient<Array<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; last_login_at?: string | null; invite_accepted_at?: string | null;
    client_memberships: Array<{ client_id: string }>;
  }>>(ENDPOINTS.users.byRole(role));
  return data.map(mapUser);
}

export async function updateUser(id: string, input: Partial<{ role: string; client_memberships: Array<{ client_id: string }> }>): Promise<User> {
  const data = await apiClient<{
    id: string; email?: string; display_name?: string | null; role?: string;
    is_active?: boolean; last_login_at?: string | null; invite_accepted_at?: string | null;
    client_memberships?: Array<{ client_id: string }>;
  }>(ENDPOINTS.users.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return mapUser(data as Parameters<typeof mapUser>[0]);
}

export async function resendInvite(userId: string): Promise<{ invite_link: string; invite_sent_at: string }> {
  return apiClient(ENDPOINTS.users.resendInvite(userId), { method: 'POST' });
}

export async function getInviteLink(userId: string): Promise<{
  is_activated: boolean; invite_link: string | null; invite_sent_at: string | null; invite_accepted_at: string | null;
}> {
  return apiClient(ENDPOINTS.users.inviteLink(userId));
}

export async function deactivateUser(id: string): Promise<User> {
  const data = await apiClient<{ id: string }>(ENDPOINTS.users.deactivate(id), {
    method: 'POST',
  });
  return { id: data.id } as User;
}