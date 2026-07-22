import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';

export type PendingStructure = {
  pending_structure_id: string;
  local_id: string;
  site_id: string;
  client_id: string;
  contractor_id: string;
  asset_tag: string;
  description: string;
  qr_code_value: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingDeficiency = {
  pending_deficiency_id: string;
  pending_structure_id: string;
  local_id: string;
  category: string | null;
  equipment_type: string | null;
  component: string | null;
  sub_component: string | null;
  focus_area: string | null;
  deficiency_category: string | null;
  detailed_description: string | null;
  consequence_severity: number | null;
  likelihood: string | null;
  recommended_action: string | null;
  most_affected_consequence: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type PendingPhoto = {
  pending_photo_id: string;
  pending_structure_id: string;
  pending_deficiency_id: string | null;
  filename: string;
  storage_url: string | null;
  caption: string;
  display_order: number;
  created_at: string;
};

export async function getContractorPendingStructures(): Promise<PendingStructure[]> {
  return apiClient(ENDPOINTS.pendingStructures.mine);
}

export async function getPendingStructuresForReview(): Promise<PendingStructure[]> {
  return apiClient(ENDPOINTS.pendingStructures.listForReview);
}

export async function getPendingStructureById(id: string): Promise<PendingStructure | null> {
  try {
    return await apiClient(ENDPOINTS.pendingStructures.byId(id));
  } catch {
    return null;
  }
}

export async function getPendingDeficiencies(bundleId: string): Promise<PendingDeficiency[]> {
  return apiClient(ENDPOINTS.pendingStructures.deficiencies(bundleId));
}

export async function getPendingPhotos(bundleId: string): Promise<PendingPhoto[]> {
  return apiClient(ENDPOINTS.pendingStructures.photos(bundleId));
}

export async function submitPendingStructureBundle(input: {
  site_id: string;
  asset_tag: string;
  description: string;
  qr_code_value?: string | null;
  local_id?: string;
}): Promise<{ pending_structure_id: string; local_id: string; status: string }> {
  return apiClient(ENDPOINTS.pendingStructures.submit, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addDeficiency(pendingStructureId: string, input: {
  local_id?: string;
  category?: string | null;
  equipment_type?: string | null;
  component?: string | null;
  sub_component?: string | null;
  focus_area?: string | null;
  deficiency_category?: string | null;
  detailed_description?: string | null;
  consequence_severity?: number | null;
  likelihood?: string | null;
  recommended_action?: string | null;
  most_affected_consequence?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
}): Promise<PendingDeficiency> {
  return apiClient(ENDPOINTS.pendingStructures.addDeficiency(pendingStructureId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addDeficiencyPhoto(pendingStructureId: string, deficiencyId: string, input: {
  filename: string;
  data: string;
  caption?: string;
  display_order?: number;
}): Promise<PendingPhoto> {
  return apiClient(ENDPOINTS.pendingStructures.addDeficiencyPhoto(pendingStructureId, deficiencyId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function approvePendingStructure(id: string): Promise<{ structure_id: string; inspection_id: string }> {
  return apiClient(ENDPOINTS.pendingStructures.approve(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function rejectPendingStructure(id: string, reason: string): Promise<void> {
  await apiClient(ENDPOINTS.pendingStructures.reject(id), {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
  });
}
