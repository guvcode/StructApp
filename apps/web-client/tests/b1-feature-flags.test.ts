import { describe, it, expect } from 'vitest';

describe('Bundle 1 — Feature Flags', () => {

  it('exports getFeatureFlags function', async () => {
    const mod = await import('../src/lib/featureFlags');
    const flags = mod.getFeatureFlags();
    expect(Array.isArray(flags)).toBe(true);
  });

  it('includes all expected feature flag IDs', async () => {
    const mod = await import('../src/lib/featureFlags');
    const flags = mod.getFeatureFlags();
    const ids = flags.map(f => f.id);
    expect(ids).toContain('inspections');
    expect(ids).toContain('deficiencies');
    expect(ids).toContain('auth');
    expect(ids).toContain('sync');
    expect(ids).toContain('client_management');
    expect(ids).toContain('remediation');
    expect(ids).toContain('timesheets');
    expect(ids).toContain('reports');
    expect(ids).toContain('audit_logs');
    expect(ids).toContain('picklists');
  });

  it('isFeatureEnabled returns true for P0 features', async () => {
    const mod = await import('../src/lib/featureFlags');
    expect(mod.isFeatureEnabled('inspections')).toBe(true);
    expect(mod.isFeatureEnabled('deficiencies')).toBe(true);
    expect(mod.isFeatureEnabled('auth')).toBe(true);
    expect(mod.isFeatureEnabled('sync')).toBe(true);
    expect(mod.isFeatureEnabled('client_management')).toBe(true);
  });

  it('isFeatureEnabled returns false for P2 features', async () => {
    const mod = await import('../src/lib/featureFlags');
    expect(mod.isFeatureEnabled('audit_logs')).toBe(false);
    expect(mod.isFeatureEnabled('picklists')).toBe(false);
  });

  it('getP0Flags returns only P0 features', async () => {
    const mod = await import('../src/lib/featureFlags');
    const p0 = mod.getP0Flags();
    expect(p0.every(f => f.phase === 'P0')).toBe(true);
    expect(p0.length).toBeGreaterThanOrEqual(5);
  });

  it('getFlagsByPhase filters correctly', async () => {
    const mod = await import('../src/lib/featureFlags');
    const p2 = mod.getFlagsByPhase('P2');
    expect(p2.every(f => f.phase === 'P2')).toBe(true);
    expect(p2.length).toBeGreaterThanOrEqual(2);
  });

  it('each feature flag has required fields', async () => {
    const mod = await import('../src/lib/featureFlags');
    const flags = mod.getFeatureFlags();
    for (const flag of flags) {
      expect(flag).toHaveProperty('id');
      expect(flag).toHaveProperty('label');
      expect(flag).toHaveProperty('phase');
      expect(flag).toHaveProperty('enabled');
      expect(['P0', 'P1', 'P2']).toContain(flag.phase);
      expect(typeof flag.enabled).toBe('boolean');
    }
  });
});