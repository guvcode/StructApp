import type { SyncStateInfo, SyncQueueItem } from '../types/index';
import { db } from '../lib/db';

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

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const [deficiencies, pendingStructureDeficiencies, submissions] = await Promise.all([
    db.deficiencies.where('syncState').equals('Pending_Sync').toArray(),
    db.offlinePendingStructureDeficiencies.where('syncState').equals('Pending_Sync').toArray(),
    db.offlineSubmissions.where('syncState').equals('Pending_Sync').toArray(),
  ]);

  const items: SyncQueueItem[] = [];

  for (const d of deficiencies) {
    items.push({
      id: String(d.localId),
      type: 'deficiency',
      payload: d,
      status: 'pending',
      created_at: d.createdAt.toISOString(),
    });
  }

  for (const d of pendingStructureDeficiencies) {
    items.push({
      id: String(d.localId),
      type: 'deficiency',
      payload: d,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  for (const s of submissions) {
    items.push({
      id: s.inspectionId,
      type: 'inspection_submit',
      payload: s,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  return items;
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  const [deficiencies, pendingStructureDeficiencies, submissions, pinOutbox] = await Promise.all([
    db.deficiencies.toArray(),
    db.offlinePendingStructureDeficiencies.toArray(),
    db.offlineSubmissions.toArray(),
    db.pinOutbox.toArray(),
  ]);

  const items: SyncQueueItem[] = [];

  for (const d of deficiencies) {
    items.push({
      id: String(d.localId),
      type: 'deficiency',
      payload: d,
      status: d.syncState === 'Pending_Sync' ? 'pending' : 'synced',
      created_at: d.createdAt.toISOString(),
    });
  }

  for (const d of pendingStructureDeficiencies) {
    items.push({
      id: String(d.localId),
      type: 'deficiency',
      payload: d,
      status: d.syncState === 'Pending_Sync' ? 'pending' : 'synced',
      created_at: new Date().toISOString(),
    });
  }

  for (const s of submissions) {
    items.push({
      id: s.inspectionId,
      type: 'inspection_submit',
      payload: s,
      status: s.syncState === 'Pending_Sync' ? 'pending' : 'synced',
      created_at: new Date().toISOString(),
    });
  }

  for (const p of pinOutbox) {
    items.push({
      id: String(p.localId),
      type: 'photo',
      payload: p,
      status: 'pending',
      created_at: p.createdAt.toISOString(),
    });
  }

  return items;
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