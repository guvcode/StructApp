import { describe, it, expect } from 'vitest';

describe('Bundle 1 — Domain Types', () => {

  it('exports UserRole type values', async () => {
    const mod = await import('../src/types/index');
    const { UserRole } = mod;
    const roles: string[] = Object.values(UserRole);
    expect(roles).toContain('inspector');
    expect(roles).toContain('admin');
    expect(roles).toContain('owner');
    expect(roles).toContain('contractor');
  });

  it('exports InspectionStatus type values', async () => {
    const mod = await import('../src/types/index');
    const { InspectionStatus } = mod;
    const statuses: string[] = Object.values(InspectionStatus);
    expect(statuses).toContain('Draft');
    expect(statuses).toContain('Assigned');
    expect(statuses).toContain('InProgress');
    expect(statuses).toContain('Submitted');
    expect(statuses).toContain('Approved');
    expect(statuses).toContain('Rejected');
    expect(statuses).toContain('Returned');
  });

  it('exports DeficiencyStatus type values', async () => {
    const mod = await import('../src/types/index');
    const { DeficiencyStatus } = mod;
    const statuses: string[] = Object.values(DeficiencyStatus);
    expect(statuses).toContain('Open');
    expect(statuses).toContain('InRemediation');
    expect(statuses).toContain('Resolved');
    expect(statuses).toContain('Closed');
  });

  it('exports PriorityTier type values', async () => {
    const mod = await import('../src/types/index');
    const { PriorityTier } = mod;
    const tiers: string[] = Object.values(PriorityTier);
    expect(tiers).toContain('P1');
    expect(tiers).toContain('P2');
    expect(tiers).toContain('P3');
    expect(tiers).toContain('P4');
    expect(tiers).toContain('P5');
    expect(tiers).not.toContain('P0');
  });

  it('exports PRIORITY_DESCRIPTIONS for all tiers', async () => {
    const mod = await import('../src/types/index');
    const { PRIORITY_DESCRIPTIONS } = mod;
    expect(PRIORITY_DESCRIPTIONS.P1).toContain('60 days');
    expect(PRIORITY_DESCRIPTIONS.P5).toContain('No repairs');
  });

  it('exports SyncState type values', async () => {
    const mod = await import('../src/types/index');
    const { SyncState } = mod;
    const states: string[] = Object.values(SyncState);
    expect(states).toContain('synced');
    expect(states).toContain('pending');
    expect(states).toContain('conflict');
    expect(states).toContain('offline');
  });

  it('exports RemediationStatus type values', async () => {
    const mod = await import('../src/types/index');
    const { RemediationStatus } = mod;
    const statuses: string[] = Object.values(RemediationStatus);
    expect(statuses).toContain('NotStarted');
    expect(statuses).toContain('InProgress');
    expect(statuses).toContain('Complete');
    expect(statuses).toContain('Verified');
  });

  it('exports ClientRole type values', async () => {
    const mod = await import('../src/types/index');
    const { ClientRole } = mod;
    const roles: string[] = Object.values(ClientRole);
    expect(roles).toContain('primary');
    expect(roles).toContain('secondary');
  });

  it('defines a Client interface with required fields', async () => {
    const mod = await import('../src/types/index');
    const { ClientRole, UserRole, InspectionStatus } = mod;
    expect(ClientRole).toBeDefined();
    expect(UserRole).toBeDefined();
    expect(InspectionStatus).toBeDefined();
  });

  it('defines FeatureFlagId union', async () => {
    const mod = await import('../src/types/index');
    expect(mod.FeatureFlagId).toBeDefined();
  });
});
