import type { AuthSession } from '../types/index';
import { UserRole } from '../types/index';
import { mockUsers } from '../data/mock/users';
import { setSession, clearSession, getSession } from '../lib/authStore';
import { v4 as uuidv4 } from 'uuid';

function delay(ms = 80): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

export async function login(email: string, _password: string): Promise<AuthSession> {
  await delay();
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  if (!user.is_active) {
    throw new Error('Account is inactive');
  }
  const session: AuthSession = {
    token: `mock-jwt-${user.id}-${Date.now()}`,
    user,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    hasUnsyncedWork: user.role === 'contractor',
  };
  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  await delay(50);
  clearSession();
}

export async function fetchSession(): Promise<AuthSession | null> {
  await delay(30);
  return getSession();
}

export async function inviteUser(email: string, role: string, clientId: string): Promise<{ user_id: string }> {
  await delay();
  const existing = mockUsers.find(u => u.email === email);
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }
  const newUser = {
    id: uuidv4(),
    email,
    display_name: email.split('@')[0]!,
    role: role as UserRole,
    is_active: true,
    client_memberships: [{ client_id: clientId, client_role: 'primary' as const }],
  };
  mockUsers.push(newUser);
  return { user_id: newUser.id };
}

export async function activateInvite(_token: string, _password: string): Promise<{ success: boolean }> {
  await delay();
  return { success: true };
}