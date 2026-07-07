import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Deficiency } from '../../types';

export async function getDeficiencies(inspectionId?: string): Promise<Deficiency[]> {
  const url = inspectionId
    ? `${ENDPOINTS.deficiencies.list}?inspection_id=${inspectionId}`
    : ENDPOINTS.deficiencies.list;
  return apiClient(url);
}

export async function getDeficiency(id: string): Promise<Deficiency | null> {
  try {
    return await apiClient(ENDPOINTS.deficiencies.byId(id));
  } catch {
    return null;
  }
}

export async function getDeficienciesByPriority(priority: string): Promise<Deficiency[]> {
  return apiClient(`${ENDPOINTS.deficiencies.list}?priority=${priority}`);
}