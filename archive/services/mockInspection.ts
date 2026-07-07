import type { Inspection, Deficiency } from '../types/index';
import { getInspectionById, getInspectionsBySiteId, mockInspections } from '../data/mock/inspections';
import { getDeficienciesByInspectionId, mockDeficiencies } from '../data/mock/deficiencies';
import { DeficiencyStatus, InspectionStatus, PriorityTier } from '../types/index';
import { getUserById } from '../data/mock/users';

function delay(ms = 60): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

let localDefCounter = 100;

export async function getInspections(filters?: Partial<{ site_id: string; status: string }>): Promise<Inspection[]> {
  await delay();
  let result = [...mockInspections];
  if (filters?.site_id) {
    result = result.filter(i => i.site_id === filters.site_id);
  }
  if (filters?.status) {
    result = result.filter(i => i.status === filters.status);
  }
  return result;
}

export async function getInspection(id: string): Promise<Inspection | null> {
  await delay(40);
  return getInspectionById(id) ?? null;
}

export async function getInspectionsBySite(siteId: string): Promise<Inspection[]> {
  await delay(50);
  return getInspectionsBySiteId(siteId);
}

let localInspCounter = 200;

export async function createInspections(input: {
  structure_ids: string[];
  site_id: string;
  inspector_id: string;
}): Promise<Inspection[]> {
  await delay(60);
  const inspector = getUserById(input.inspector_id);
  const now = new Date().toISOString();
  const created: Inspection[] = [];
  for (const sid of input.structure_ids) {
    localInspCounter++;
    const inspection: Inspection = {
      id: `i-local-${localInspCounter}`,
      site_id: input.site_id,
      structure_id: sid,
      client_id: 'client-1',
      assigned_to: input.inspector_id,
      assigned_by: 'u-priya',
      status: InspectionStatus.Assigned,
      scheduled_date: now.split('T')[0]!,
      created_at: now,
      updated_at: now,
      assignee_name: inspector?.display_name ?? input.inspector_id,
    };
    mockInspections.unshift(inspection);
    created.push(inspection);
  }
  return created;
}

export async function createDeficiency(inspectionId: string, data: Partial<Deficiency>): Promise<Deficiency> {
  await delay(30);
  localDefCounter++;
  const def: Deficiency = {
    id: `d-local-${localDefCounter}`,
    inspection_id: inspectionId,
    title: data.title ?? 'Untitled',
    description: data.description ?? '',
    severity: data.severity ?? 'medium',
    status: DeficiencyStatus.Open,
    priority_tier: (data.priority_tier ?? 'P2') as PriorityTier,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(data.category ? { category: data.category } : {}),
    ...(data.sub_component ? { sub_component: data.sub_component } : {}),
    ...(data.focus_area ? { focus_area: data.focus_area } : {}),
    ...(data.deficiency_category ? { deficiency_category: data.deficiency_category } : {}),
    ...(data.detailed_description ? { detailed_description: data.detailed_description } : {}),
    ...(data.mechanisms ? { mechanisms: data.mechanisms } : {}),
    ...(data.vibration_present !== undefined ? { vibration_present: data.vibration_present } : {}),
    ...(data.ndt_required !== undefined ? { ndt_required: data.ndt_required } : {}),
    ...(data.further_investigation_required !== undefined ? { further_investigation_required: data.further_investigation_required } : {}),
    ...(data.recommended_action ? { recommended_action: data.recommended_action } : {}),
    ...(data.consequence_severity ? { consequence_severity: data.consequence_severity } : {}),
    ...(data.likelihood ? { likelihood: data.likelihood } : {}),
    ...(data.most_affected_consequence ? { most_affected_consequence: data.most_affected_consequence } : {}),
    ...(data.risk_rank ? { risk_rank: data.risk_rank } : {}),
    ...(data.risk_rating ? { risk_rating: data.risk_rating } : {}),
    ...(data.component_note ? { component_note: data.component_note } : {}),
    ...(data.location_desc ? { location_desc: data.location_desc } : {}),
  };
  mockDeficiencies.push(def);
  return def;
}

export async function updateDeficiency(id: string, data: Partial<Deficiency>): Promise<Deficiency | null> {
  await delay(30);
  const idx = mockDeficiencies.findIndex(d => d.id === id);
  if (idx === -1) return null;
  mockDeficiencies[idx] = {
    ...mockDeficiencies[idx],
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.severity !== undefined ? { severity: data.severity } : {}),
    ...(data.component_note !== undefined ? { component_note: data.component_note } : {}),
    ...(data.location_desc !== undefined ? { location_desc: data.location_desc } : {}),
    updated_at: new Date().toISOString(),
  } as Deficiency;
  return mockDeficiencies[idx];
}

export async function getDeficienciesForInspection(inspectionId: string): Promise<Deficiency[]> {
  await delay(30);
  return getDeficienciesByInspectionId(inspectionId);
}

export async function submitInspection(id: string): Promise<Inspection> {
  await delay(50);
  const insp = mockInspections.find(i => i.id === id);
  if (!insp) throw new Error('Inspection not found');
  insp.status = InspectionStatus.Submitted;
  insp.submitted_at = new Date().toISOString();
  insp.updated_at = new Date().toISOString();
  return insp;
}

export async function getInspectionsByAssignee(userId: string): Promise<Inspection[]> {
  await delay(30);
  const { getInspectionsByAssignee: getByAssignee } = await import('../data/mock/inspections');
  return getByAssignee(userId);
}

export async function returnInspection(id: string, reason: string): Promise<Inspection> {
  await delay(40);
  const insp = mockInspections.find(i => i.id === id);
  if (!insp) throw new Error('Inspection not found');
  insp.status = InspectionStatus.Returned;
  insp.return_reason = reason;
  insp.updated_at = new Date().toISOString();
  return insp;
}

export async function approveInspection(id: string): Promise<Inspection> {
  await delay(40);
  const insp = mockInspections.find(i => i.id === id);
  if (!insp) throw new Error('Inspection not found');
  insp.status = InspectionStatus.Approved;
  insp.approved_by = 'Reviewer';
  insp.approved_at = new Date().toISOString();
  insp.updated_at = new Date().toISOString();
  return insp;
}

export async function reopenInspection(id: string, targetStatus: 'Submitted' | 'Returned', reason: string): Promise<Inspection> {
  await delay(40);
  const insp = mockInspections.find(i => i.id === id);
  if (!insp) throw new Error('Inspection not found');
  if (insp.status !== InspectionStatus.Approved) throw new Error('Only Approved inspections can be reopened');
  insp.status = targetStatus;
  insp.reopened_by = 'Admin';
  insp.reopened_at = new Date().toISOString();
  insp.reopen_reason = reason;
  insp.updated_at = new Date().toISOString();
  return insp;
}

export async function overridePriority(defId: string, priorityTier: string, justification: string): Promise<Deficiency> {
  await delay(30);
  const idx = mockDeficiencies.findIndex(d => d.id === defId);
  if (idx === -1) throw new Error('Deficiency not found');
  const def = mockDeficiencies[idx]!;
  def.priority_tier = priorityTier as PriorityTier;
  def.override_priority_tier = priorityTier;
  def.override_justification = justification;
  def.override_by = 'Reviewer';
  def.override_at = new Date().toISOString();
  def.updated_at = new Date().toISOString();
  return def;
}

export async function getDeficiencyById(id: string): Promise<Deficiency | null> {
  await delay(20);
  const { getDeficiencyById: getById } = await import('../data/mock/deficiencies');
  return getById(id) ?? null;
}