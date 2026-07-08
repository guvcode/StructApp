import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { getSession, setSession, clearSession } from '../../lib/authStore';
import type { AuthSession, User } from '../../types';
import { mapBackendRole, mapToBackendRole } from '../../types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await apiClient<{
    access_token: string;
    refresh_token: string;
    user_id: string;
    client_id: string;
    role: string;
  } | null>(ENDPOINTS.auth.login, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!data) {
    throw new Error('Login failed: unexpected response');
  }

  // Set session with token immediately so subsequent requests include Authorization
  setSession({
    token: data.access_token,
    refresh_token: data.refresh_token,
    user: {
      id: data.user_id,
      email,
      display_name: '',
      role: mapBackendRole(data.role),
      is_active: true,
      client_memberships: [],
    },
    expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
    active_client_id: data.client_id,
  });

  const userResponse = await apiClient<{
    id: string; email: string; display_name: string | null; role: string;
    is_active: boolean; client_memberships: Array<{ client_id: string }>;
  }>(ENDPOINTS.users.byId(data.user_id));

  const user: User = {
    id: userResponse.id,
    email: userResponse.email,
    display_name: userResponse.display_name || userResponse.email,
    role: mapBackendRole(userResponse.role),
    is_active: userResponse.is_active,
    client_memberships: userResponse.client_memberships.map(m => ({
      client_id: m.client_id,
      client_role: 'primary' as const,
    })),
  };

  const session: AuthSession = {
    token: data.access_token,
    refresh_token: data.refresh_token,
    user,
    expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
    active_client_id: data.client_id,
  };

  setSession(session);

  return session;
}

export async function logout(): Promise<void> {
  clearSession();
}

export async function fetchSession(): Promise<AuthSession | null> {
  return getSession();
}

export async function inviteUser(email: string, role: string, clientId: string, display_name?: string): Promise<{ user_id: string; invite_link: string; invite_sent_at: string }> {
  return apiClient<{ success: boolean; data: { user_id: string; invite_link: string; invite_sent_at: string } }>(ENDPOINTS.auth.invite, {
    method: 'POST',
    body: JSON.stringify({ email, role: mapToBackendRole(role), client_id: clientId, display_name }),
  }).then(r => r.data);
}

export async function activateInvite(token: string, password: string): Promise<{ success: boolean }> {
  return apiClient(ENDPOINTS.auth.activate, {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function syncPinToServer(pinHash: string): Promise<void> {
  await apiClient(ENDPOINTS.auth.pin, {
    method: 'POST',
    body: JSON.stringify({ pin_hash: pinHash }),
  });
}

export async function checkServerPin(): Promise<boolean> {
  const result = await apiClient<{ has_pin: boolean }>(ENDPOINTS.auth.pin);
  return result?.has_pin ?? false;
}

export async function clearServerPin(): Promise<void> {
  await apiClient(ENDPOINTS.auth.pin, { method: 'DELETE' });
}