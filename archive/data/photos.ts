import type { PhotoRecord } from '../../types/index';
import { SyncState } from '../../types/index';

const placeholder = (label: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="${bg}"/><text x="200" y="150" font-size="14" text-anchor="middle" fill="#666">${label}</text></svg>`
  )}`;

export const mockPhotos: PhotoRecord[] = [
  // Evidence photos for d-001 (Cable corrosion)
  { id: 'p-ev-001', deficiency_local_id: 'd-001', dataUrl: placeholder('Cable corrosion — south anchor', '#fee'), caption: 'Cable corrosion at south anchor point', purpose: 'evidence', created_at: '2025-06-05T08:30:00Z', sync_state: SyncState.synced },
  { id: 'p-ev-002', deficiency_local_id: 'd-001', dataUrl: placeholder('Corrosion close-up', '#fee'), caption: 'Close-up of corrosion on main cable', purpose: 'evidence', created_at: '2025-06-05T08:35:00Z', sync_state: SyncState.synced },
  // Evidence photos for d-003 (Expansion joint)
  { id: 'p-ev-003', deficiency_local_id: 'd-003', dataUrl: placeholder('Joint gap measurement', '#ffe'), caption: 'Expansion joint gap measurement at deck joint 4', purpose: 'evidence', created_at: '2025-06-05T09:00:00Z', sync_state: SyncState.synced },
  // Remediation photo for d-003
  { id: 'p-rm-001', deficiency_local_id: 'd-003', dataUrl: placeholder('Joint repair completed', '#efe'), caption: 'Joint gap repair completed', purpose: 'remediation_evidence', created_at: '2025-06-20T00:00:00Z', sync_state: SyncState.synced },
  // Evidence photos for d-004 (Steel beam crack)
  { id: 'p-ev-004', deficiency_local_id: 'd-004', dataUrl: placeholder('Beam crack overview', '#fee'), caption: 'Steel beam crack — Floor 12 overview', purpose: 'evidence', created_at: '2025-06-08T10:00:00Z', sync_state: SyncState.synced },
  { id: 'p-ev-005', deficiency_local_id: 'd-004', dataUrl: placeholder('Crack close-up', '#fee'), caption: 'Hairline crack close-up at weld toe', purpose: 'evidence', created_at: '2025-06-08T10:05:00Z', sync_state: SyncState.synced },
  { id: 'p-ev-006', deficiency_local_id: 'd-004', dataUrl: placeholder('Temporary shoring', '#ffe'), caption: 'Temporary shoring installed', purpose: 'evidence', created_at: '2025-06-08T11:00:00Z', sync_state: SyncState.synced },
  // Evidence photo for d-005 (Fireproofing)
  { id: 'p-ev-007', deficiency_local_id: 'd-005', dataUrl: placeholder('Fireproofing missing', '#ffe'), caption: 'Missing fireproofing at Floor 8 stairwell', purpose: 'evidence', created_at: '2025-06-08T10:30:00Z', sync_state: SyncState.synced },
  // Remediation photo for d-008
  { id: 'p-rm-002', deficiency_local_id: 'd-008', dataUrl: placeholder('Pipe support repair', '#efe'), caption: 'Pipe support reinforcement completed', purpose: 'remediation_evidence', created_at: '2025-06-22T00:00:00Z', sync_state: SyncState.synced },
];

export function getPhotosByDeficiencyId(deficiencyId: string): PhotoRecord[] {
  return mockPhotos.filter(p => p.deficiency_local_id === deficiencyId);
}

export function getPhotosByInspectionId(inspectionId: string, deficiencyGetter: (id: string) => string[]): PhotoRecord[] {
  const defIds = deficiencyGetter(inspectionId);
  return mockPhotos.filter(p => defIds.includes(p.deficiency_local_id));
}