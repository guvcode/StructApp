import type { User } from '../types/index';
import { mockUsers, getUserById } from '../data/mock/users';

function delay(ms = 50): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 50));
}

export async function getUsers(): Promise<User[]> {
  await delay();
  return mockUsers;
}

export async function getUser(id: string): Promise<User | null> {
  await delay(30);
  return getUserById(id) ?? null;
}

export async function getUsersByRole(role: string): Promise<User[]> {
  await delay(40);
  return mockUsers.filter(u => u.role === role);
}

export async function updateUser(id: string, input: Partial<{ role: string; client_memberships: Array<{ client_id: string; client_role: string }> }>): Promise<User> {
  await delay();
  const idx = mockUsers.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  const existing = mockUsers[idx]!;
  const updated: User = {
    ...existing,
    ...input,
    role: (input.role ?? existing.role) as User['role'],
    client_memberships: input.client_memberships?.map(m => ({
      client_id: m.client_id,
      client_role: m.client_role as User['client_memberships'][number]['client_role'],
    })) ?? existing.client_memberships,
    id: existing.id,
  };
  mockUsers[idx] = updated;
  return updated;
}

export async function deactivateUser(id: string): Promise<User> {
  await delay();
  const idx = mockUsers.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  const existing = mockUsers[idx]!;
  const updated: User = { ...existing, is_active: false, id: existing.id };
  mockUsers[idx] = updated;
  return updated;
}