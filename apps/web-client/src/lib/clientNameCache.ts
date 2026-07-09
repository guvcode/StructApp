import { db } from './db';

export async function cacheClientNames(clients: Array<{ client_id: string; name: string }>): Promise<void> {
  try {
    await db.offlineClients.bulkPut(clients.map(c => ({ client_id: c.client_id, name: c.name })));
  } catch {
    // Dexie may be unavailable
  }
}

export async function getCachedClientName(clientId: string): Promise<string | undefined> {
  try {
    const client = await db.offlineClients.get(clientId);
    return client?.name;
  } catch {
    return undefined;
  }
}

export async function getCachedClientNames(): Promise<Record<string, string>> {
  try {
    const all = await db.offlineClients.toArray();
    const map: Record<string, string> = {};
    all.forEach(c => { map[c.client_id] = c.name; });
    return map;
  } catch {
    return {};
  }
}