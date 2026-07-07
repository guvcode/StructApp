import type { Client, Project } from '../types/index';
import { mockClients, getClientById } from '../data/mock/clients';
import { getProjectsByClientId } from '../data/mock/projects';

function delay(ms = 60): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 60));
}

export async function getClients(): Promise<Client[]> {
  await delay();
  return mockClients;
}

export async function getClient(id: string): Promise<Client | null> {
  await delay(40);
  return getClientById(id) ?? null;
}

export async function getClientProjects(clientId: string): Promise<Project[]> {
  await delay(50);
  return getProjectsByClientId(clientId);
}

export async function createClient(input: { name: string; safety_email?: string }): Promise<Client> {
  await delay();
  const client: Client = {
    id: `c-${Date.now()}`,
    name: input.name,
    slug: input.name.toLowerCase().replace(/\s+/g, '-'),
    is_active: true,
    created_at: new Date().toISOString(),
  };
  if (input.safety_email) client.safety_email = input.safety_email;
  mockClients.push(client);
  return client;
}

export async function updateClient(id: string, input: Partial<{ name: string; safety_email: string }>): Promise<Client> {
  await delay();
  const idx = mockClients.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Client not found');
  const existing = mockClients[idx]!;
  const updated: Client = {
    ...existing,
    ...input,
    id: existing.id,
  };
  mockClients[idx] = updated;
  return updated;
}