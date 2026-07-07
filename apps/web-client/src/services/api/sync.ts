import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { SyncStateInfo } from '../../types';

export async function getSyncState(): Promise<SyncStateInfo> {
  return apiClient(ENDPOINTS.sync.pull);
}

export async function getPendingCount(): Promise<number> {
  const data = await apiClient<{ pendingCount: number }>(`${ENDPOINTS.sync.push}?count=true`);
  return data.pendingCount;
}