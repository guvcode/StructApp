import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { SyncStateInfo } from '../../types';

export async function getSyncState(): Promise<SyncStateInfo> {
  return apiClient<SyncStateInfo>(ENDPOINTS.sync.state);
}

export async function getPendingCount(): Promise<number> {
  const data = await apiClient<{ pendingCount: number }>(ENDPOINTS.sync.state);
  return data.pendingCount;
}