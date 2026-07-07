import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { ImportBatch } from '../../types';

export async function getBatches(): Promise<ImportBatch[]> {
  return apiClient(ENDPOINTS.imports.batches);
}

export async function getBatch(id: string): Promise<ImportBatch | undefined> {
  try {
    return await apiClient(ENDPOINTS.imports.batchById(id));
  } catch {
    return undefined;
  }
}

export async function simulateUpload(): Promise<ImportBatch> {
  return apiClient(ENDPOINTS.imports.upload, { method: 'POST' });
}

export async function commitBatch(id: string): Promise<ImportBatch> {
  return apiClient(ENDPOINTS.imports.commit(id), { method: 'POST' });
}

export async function discardBatch(id: string): Promise<ImportBatch> {
  return apiClient(ENDPOINTS.imports.discard(id), { method: 'POST' });
}