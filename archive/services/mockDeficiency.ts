import type { Deficiency } from '../types/index';
import type { PriorityTier } from '../types/index';
import { getDeficiencyById, getDeficienciesByInspectionId, getDeficienciesByPriority as getMockDeficienciesByPriority, mockDeficiencies } from '../data/mock/deficiencies';

function delay(ms = 60): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

export async function getDeficiencies(inspectionId?: string): Promise<Deficiency[]> {
  await delay();
  if (inspectionId) {
    return getDeficienciesByInspectionId(inspectionId);
  }
  return mockDeficiencies;
}

export async function getDeficiency(id: string): Promise<Deficiency | null> {
  await delay(40);
  return getDeficiencyById(id) ?? null;
}

export async function getDeficienciesByPriority(tier: PriorityTier): Promise<Deficiency[]> {
  await delay(50);
  return getMockDeficienciesByPriority(tier);
}