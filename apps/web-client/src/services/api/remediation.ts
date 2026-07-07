import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Deficiency, RemediationStatus } from '../../types';

export async function getRemediationDeficiencies(): Promise<Deficiency[]> {
  return apiClient(ENDPOINTS.remediation.list);
}

export async function getRemediationDeficiencyById(id: string): Promise<Deficiency | null> {
  try {
    return await apiClient(ENDPOINTS.remediation.byId(id));
  } catch {
    return null;
  }
}

export async function updateRemediationStatus(id: string, status: RemediationStatus, dueDate?: string): Promise<void> {
  await apiClient(ENDPOINTS.remediation.updateStatus(id), {
    method: 'PATCH',
    body: JSON.stringify({ remediation_status: status, remediation_due_date: dueDate || null }),
  });
}

export async function verifyClosure(id: string, verifierName: string): Promise<void> {
  await apiClient(ENDPOINTS.deficiencies.verifyClosure(id), {
    method: 'POST',
    body: JSON.stringify({ verifier_name: verifierName }),
  });
}

export async function getRemediationPhotos(deficiencyId: string): Promise<Array<{ id: string; dataUrl: string; caption: string; created_at: string }>> {
  return apiClient(ENDPOINTS.remediation.photos(deficiencyId));
}

export async function addRemediationPhoto(deficiencyId: string, caption: string, dataUrl: string): Promise<{ id: string }> {
  return apiClient(ENDPOINTS.remediation.addPhoto(deficiencyId), {
    method: 'POST',
    body: JSON.stringify({ caption, dataUrl }),
  });
}

export async function hasRemediationEvidence(deficiencyId: string): Promise<{ hasEvidence: boolean }> {
  return apiClient(ENDPOINTS.remediation.hasEvidence(deficiencyId));
}