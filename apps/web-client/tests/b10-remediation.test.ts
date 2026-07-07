import { getRemediationDeficiencies, getRemediationDeficiencyById, updateRemediationStatus, verifyClosure, getRemediationPhotos, hasRemediationEvidence } from '../src/services/mockRemediation';
import { RemediationStatus } from '../src/types/index';

describe('mockRemediation service', () => {
  test('getRemediationDeficiencies returns deficiencies with remediation status', async () => {
    const list = await getRemediationDeficiencies();
    expect(list.length).toBeGreaterThan(0);
    list.forEach(d => {
      expect(d.remediation_status).toBeDefined();
    });
  });

  test('getRemediationDeficiencyById returns single deficiency', async () => {
    const def = await getRemediationDeficiencyById('d-001');
    expect(def).not.toBeNull();
    expect(def && def.remediation_status).toBe(RemediationStatus.Open);
  });

  test('getRemediationDeficiencyById returns null for non-remediation deficiency', async () => {
    const def = await getRemediationDeficiencyById('d-010');
    expect(def).toBeNull();
  });

  test('updateRemediationStatus advances status', async () => {
    const updated = await updateRemediationStatus('d-001', RemediationStatus.RemediationScheduled, '2025-08-01');
    expect(updated.remediation_status).toBe(RemediationStatus.RemediationScheduled);
    expect(updated.remediation_due_date).toBe('2025-08-01');
  });

  test('updateRemediationStatus throws on verified closed deficiency', async () => {
    await expect(updateRemediationStatus('d-006', RemediationStatus.Open)).rejects.toThrow('Cannot change status');
  });

  test('verifyClosure requires PendingVerification status', async () => {
    await expect(verifyClosure('d-001', 'Test Verifier')).rejects.toThrow('must be in Remediated Pending Verification');
  });

  test('verifyClosure sets VerifiedClosed with verifier info', async () => {
    const updated = await verifyClosure('d-003', 'Priya Sharma');
    expect(updated.remediation_status).toBe(RemediationStatus.VerifiedClosed);
    expect(updated.verified_by).toBe('Priya Sharma');
    expect(updated.verified_at).toBeDefined();
  });

  test('getRemediationPhotos returns photos for a deficiency', async () => {
    const photos = await getRemediationPhotos('d-003');
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0].purpose).toBe('remediation_evidence');
  });

  test('getRemediationPhotos returns empty for deficiency with no photos', async () => {
    const photos = await getRemediationPhotos('d-001');
    expect(photos.length).toBe(0);
  });

  test('hasRemediationEvidence returns true for deficiencies with evidence', async () => {
    const has = await hasRemediationEvidence('d-003');
    expect(has).toBe(true);
  });

  test('hasRemediationEvidence returns false for deficiencies without evidence', async () => {
    const has = await hasRemediationEvidence('d-001');
    expect(has).toBe(false);
  });
});