import { describe, it, expect } from 'vitest';

describe('Bundle 1 — Guard Helpers', () => {

  async function importGuard() {
    return import('../src/lib/guard');
  }

  async function importTypes() {
    return import('../src/types/index');
  }

  function makeUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 'u1',
      email: 'test@test.com',
      display_name: 'Test User',
      role: 'inspector' as const,
      is_active: true,
      client_memberships: [],
      ...overrides,
    };
  }

  it('hasRole returns true for matching role', async () => {
    const { hasRole } = await importGuard();
    const user = makeUser({ role: 'admin' });
    expect(hasRole(user, 'admin')).toBe(true);
    expect(hasRole(user, 'inspector')).toBe(false);
  });

  it('hasAnyRole returns true when user has one of the roles', async () => {
    const { hasAnyRole } = await importGuard();
    const user = makeUser({ role: 'admin' });
    expect(hasAnyRole(user, ['admin', 'owner'])).toBe(true);
    expect(hasAnyRole(user, ['inspector', 'contractor'])).toBe(false);
  });

  it('isInspector returns true for inspectors', async () => {
    const { isInspector } = await importGuard();
    expect(isInspector(makeUser({ role: 'inspector' }))).toBe(true);
    expect(isInspector(makeUser({ role: 'admin' }))).toBe(false);
  });

  it('isAdmin returns true for admins', async () => {
    const { isAdmin } = await importGuard();
    expect(isAdmin(makeUser({ role: 'admin' }))).toBe(true);
    expect(isAdmin(makeUser({ role: 'inspector' }))).toBe(false);
  });

  it('canEditInspection allows admin always', async () => {
    const { canEditInspection, isAdmin } = await importGuard();
    const admin = makeUser({ role: 'admin' });
    expect(isAdmin(admin)).toBe(true);
    const insp = { status: 'Approved' as const };
    expect(canEditInspection(admin, insp)).toBe(true);
  });

  it('canEditInspection allows inspector on Draft/Assigned/InProgress', async () => {
    const { canEditInspection } = await importGuard();
    const inspector = makeUser({ role: 'inspector' });
    expect(canEditInspection(inspector, { status: 'Draft' })).toBe(true);
    expect(canEditInspection(inspector, { status: 'Assigned' })).toBe(true);
    expect(canEditInspection(inspector, { status: 'InProgress' })).toBe(true);
  });

  it('canEditInspection denies inspector on Submitted/Approved', async () => {
    const { canEditInspection } = await importGuard();
    const inspector = makeUser({ role: 'inspector' });
    expect(canEditInspection(inspector, { status: 'Submitted' })).toBe(false);
    expect(canEditInspection(inspector, { status: 'Approved' })).toBe(false);
  });

  it('canApproveInspection allows admin and owner', async () => {
    const { canApproveInspection } = await importGuard();
    expect(canApproveInspection(makeUser({ role: 'admin' }))).toBe(true);
    expect(canApproveInspection(makeUser({ role: 'owner' }))).toBe(true);
    expect(canApproveInspection(makeUser({ role: 'inspector' }))).toBe(false);
    expect(canApproveInspection(makeUser({ role: 'contractor' }))).toBe(false);
  });

  it('getStatusColor returns a string for each status', async () => {
    const { getStatusColor, inspectionStatuses } = await importGuard();
    for (const status of inspectionStatuses) {
      const color = getStatusColor(status);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it('getPriorityColor returns expected colors', async () => {
    const { getPriorityColor } = await importGuard();
    expect(getPriorityColor('P1')).toMatch(/red|danger/);
    expect(getPriorityColor('P2')).toMatch(/orange/);
    expect(getPriorityColor('P3')).toMatch(/yellow|warning/);
    expect(getPriorityColor('P4')).toMatch(/blue/);
    expect(getPriorityColor('P5')).toMatch(/green|success/);
  });

  it('getStatusLabel returns human-readable labels', async () => {
    const { getStatusLabel } = await importGuard();
    expect(getStatusLabel('Draft')).toBe('Draft');
    expect(getStatusLabel('InProgress')).toBe('In Progress');
    expect(getStatusLabel('InRemediation')).toBe('In Remediation');
    expect(getStatusLabel('NotStarted')).toBe('Not Started');
  });

  it('isDeficiencyActionable returns true for Open and InRemediation', async () => {
    const { isDeficiencyActionable } = await importGuard();
    expect(isDeficiencyActionable('Open')).toBe(true);
    expect(isDeficiencyActionable('InRemediation')).toBe(true);
    expect(isDeficiencyActionable('Resolved')).toBe(false);
    expect(isDeficiencyActionable('Closed')).toBe(false);
  });
});