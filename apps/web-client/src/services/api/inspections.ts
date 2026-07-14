import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Inspection, Deficiency } from '../../types';

export async function getInspections(filters?: Partial<{ site_id: string; status: string; assignee: string }>): Promise<Inspection[]> {
  const params = new URLSearchParams();
  if (filters?.site_id) params.set('site_id', filters.site_id);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignee) params.set('assignee', filters.assignee);
  const qs = params.toString();
  return apiClient(`${ENDPOINTS.inspections.list}${qs ? `?${qs}` : ''}`);
}

export async function getInspection(id: string): Promise<Inspection | null> {
  try {
    return await apiClient(ENDPOINTS.inspections.byId(id));
  } catch {
    return null;
  }
}

export async function getInspectionsBySite(siteId: string): Promise<Inspection[]> {
  return apiClient(ENDPOINTS.inspections.bySite(siteId));
}

export async function getInspectionsByAssignee(userId: string, clientId?: string): Promise<Inspection[]> {
  const params = new URLSearchParams({ assignee: userId });
  if (clientId) params.set('client_id', clientId);
  return apiClient(`${ENDPOINTS.inspections.list}?${params.toString()}`);
}

export async function createInspections(input: { structure_ids: string[]; site_id: string; inspector_id: string }): Promise<Inspection[]> {
  const results = await Promise.all(
    input.structure_ids.map(structure_id =>
      apiClient<Inspection>(ENDPOINTS.inspections.create, {
        method: 'POST',
        body: JSON.stringify({ structure_id, inspector_id: input.inspector_id }),
      })
    ),
  );
  return results;
}

export async function createDeficiency(inspectionId: string, data: Partial<Deficiency>): Promise<Deficiency> {
  return apiClient(ENDPOINTS.deficiencies.create(inspectionId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDeficiency(id: string, data: Partial<Deficiency>): Promise<Deficiency> {
  return apiClient(ENDPOINTS.deficiencies.update(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getDeficienciesForInspection(inspectionId: string): Promise<Deficiency[]> {
  return apiClient(ENDPOINTS.deficiencies.byInspection(inspectionId));
}

export async function getDeficiencyById(id: string): Promise<Deficiency | null> {
  try {
    return await apiClient(ENDPOINTS.deficiencies.byId(id));
  } catch {
    return null;
  }
}

export async function submitInspection(id: string): Promise<{ inspection_id: string; status: string; submitted_at: string }> {
  return apiClient(ENDPOINTS.inspections.submit(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function returnInspection(id: string, reason: string): Promise<{ inspection_id: string; status: string }> {
  return apiClient(ENDPOINTS.inspections.return_(id), {
    method: 'POST',
    body: JSON.stringify({ returned_reason: reason }),
  });
}

export async function approveInspection(id: string): Promise<{ inspection_id: string; status: string; approved_at: string }> {
  return apiClient(ENDPOINTS.inspections.approve(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function reopenInspection(id: string, targetStatus: 'Submitted' | 'Returned', reason: string): Promise<{ inspection_id: string; status: string }> {
  return apiClient(ENDPOINTS.inspections.reopen(id), {
    method: 'POST',
    body: JSON.stringify({ target_status: targetStatus, reason }),
  });
}

export async function overridePriority(defId: string, priorityTier: string, justification: string): Promise<void> {
  await apiClient(ENDPOINTS.deficiencies.overridePriority(defId), {
    method: 'POST',
    body: JSON.stringify({ priority_tier: priorityTier, justification }),
  });
}

export async function getInspectionHistory(id: string): Promise<Deficiency[]> {
  return apiClient(ENDPOINTS.inspections.history(id));
}

export async function postTriage(
  id: string,
  decisions: Array<{ deficiency_id: string; decision: 'resolved' | 'still_outstanding' | 'worsened'; note?: string }>
): Promise<{ updated_ids: string[]; created_deficiencies: Deficiency[] }> {
  return apiClient(ENDPOINTS.inspections.triage(id), {
    method: 'POST',
    body: JSON.stringify({ decisions }),
  });
}