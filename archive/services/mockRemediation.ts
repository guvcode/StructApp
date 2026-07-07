import type { Deficiency, PhotoRecord } from '../types/index';
import { RemediationStatus } from '../types/index';
import { mockDeficiencies } from '../data/mock/deficiencies';
import { mockPhotos } from '../data/mock/photos';

function delay(ms = 60): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

export async function getRemediationDeficiencies(): Promise<Deficiency[]> {
  await delay();
  return mockDeficiencies.filter(d => d.remediation_status != null);
}

export async function getRemediationDeficiencyById(id: string): Promise<Deficiency | null> {
  await delay(40);
  const def = mockDeficiencies.find(d => d.id === id && d.remediation_status != null);
  return def ?? null;
}

export async function updateRemediationStatus(
  id: string,
  status: RemediationStatus,
  dueDate?: string
): Promise<Deficiency> {
  await delay(50);
  const def = mockDeficiencies.find(d => d.id === id);
  if (!def) throw new Error('Deficiency not found');
  if (def.remediation_status === RemediationStatus.VerifiedClosed) {
    throw new Error('Cannot change status of a verified closed deficiency');
  }
  def.remediation_status = status;
  if (dueDate) def.remediation_due_date = dueDate;
  def.updated_at = new Date().toISOString();
  return def;
}

export async function verifyClosure(
  id: string,
  verifierName: string
): Promise<Deficiency> {
  await delay(50);
  const def = mockDeficiencies.find(d => d.id === id);
  if (!def) throw new Error('Deficiency not found');
  if (def.remediation_status !== RemediationStatus.PendingVerification) {
    throw new Error('Deficiency must be in Remediated Pending Verification state');
  }
  def.remediation_status = RemediationStatus.VerifiedClosed;
  def.verified_by = verifierName;
  def.verified_at = new Date().toISOString();
  def.updated_at = new Date().toISOString();
  return def;
}

export const mockRemediationPhotos: PhotoRecord[] = mockPhotos.filter(p => p.purpose === 'remediation_evidence');

export async function getRemediationPhotos(deficiencyId: string): Promise<PhotoRecord[]> {
  await delay(30);
  return mockRemediationPhotos.filter(p => p.deficiency_local_id === deficiencyId);
}

export async function addRemediationPhoto(
  deficiencyId: string,
  caption: string,
  dataUrl: string
): Promise<PhotoRecord> {
  await delay(40);
  const photo: PhotoRecord = {
    id: `p-rm-${Date.now()}`,
    deficiency_local_id: deficiencyId,
    dataUrl,
    caption,
    purpose: 'remediation_evidence',
    created_at: new Date().toISOString(),
    sync_state: 'pending',
  };
  mockRemediationPhotos.push(photo);
  return photo;
}

export async function hasRemediationEvidence(deficiencyId: string): Promise<boolean> {
  await delay(20);
  return mockRemediationPhotos.some(p => p.deficiency_local_id === deficiencyId && p.purpose === 'remediation_evidence');
}