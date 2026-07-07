import type { SyncStateInfo, SyncQueueItem } from '../types/index';

function delay(ms = 70): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 60));
}

const localQueue = new Map<string, SyncQueueItem>();

export function addToQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'status'>): SyncQueueItem {
  const queueItem: SyncQueueItem = {
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  localQueue.set(queueItem.id, queueItem);
  return queueItem;
}

export function getPendingCountSync(): number {
  let count = 0;
  for (const item of localQueue.values()) {
    if (item.status === 'pending') count++;
  }
  return count;
}

export async function getPendingCount(): Promise<number> {
  await delay(20);
  return getPendingCountSync();
}

export function getPendingItems(): SyncQueueItem[] {
  return Array.from(localQueue.values()).filter(i => i.status === 'pending');
}

export function getAllQueueItems(): SyncQueueItem[] {
  return Array.from(localQueue.values());
}

export function removeFromQueue(id: string): void {
  localQueue.delete(id);
}

export function clearQueue(): void {
  localQueue.clear();
}

export async function getSyncState(): Promise<SyncStateInfo> {
  await delay(50);
  return {
    lastSync: new Date().toISOString(),
    pendingCount: getPendingCountSync(),
    status: getPendingCountSync() > 0 ? 'pending' : 'synced',
  };
}

export async function pushChanges(_items: unknown[]): Promise<{ success: boolean; synced: number }> {
  await delay(80);
  if (_items && _items.length > 0) {
    return { success: true, synced: _items.length };
  }
  for (const item of localQueue.values()) {
    item.status = 'synced';
  }
  const count = localQueue.size;
  localQueue.clear();
  return { success: true, synced: count };
}

export async function pullChanges(_since: string): Promise<{ items: unknown[] }> {
  await delay(100);
  return { items: [] };
}