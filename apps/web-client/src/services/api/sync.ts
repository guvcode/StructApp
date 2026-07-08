import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { SyncStateInfo } from '../../types';

export async function getSyncState(): Promise<SyncStateInfo> {
  return apiClient<SyncStateInfo>(ENDPOINTS.sync.state);
}