import type { FeatureFlagId, FeatureFlag } from '../types/index';

const flags: Record<FeatureFlagId, FeatureFlag> = {
  inspections: { id: 'inspections', label: 'Inspections', phase: 'P0', enabled: true },
  deficiencies: { id: 'deficiencies', label: 'Deficiencies', phase: 'P0', enabled: true },
  auth: { id: 'auth', label: 'Authentication', phase: 'P0', enabled: true },
  sync: { id: 'sync', label: 'Sync', phase: 'P0', enabled: true },
  client_management: { id: 'client_management', label: 'Client Management', phase: 'P0', enabled: true },
  remediation: { id: 'remediation', label: 'Remediation', phase: 'P1', enabled: true },
  timesheets: { id: 'timesheets', label: 'Timesheets', phase: 'P1', enabled: true },
  reports: { id: 'reports', label: 'Reports', phase: 'P1', enabled: true },
  audit_logs: { id: 'audit_logs', label: 'Audit Logs', phase: 'P2', enabled: false },
  picklists: { id: 'picklists', label: 'Categories', phase: 'P1', enabled: true },
  imports: { id: 'imports', label: 'Imports', phase: 'P2', enabled: false },
  calendar: { id: 'calendar', label: 'Calendar', phase: 'P2', enabled: false },
};

export function getFeatureFlags(): FeatureFlag[] {
  return Object.values(flags);
}

export function isFeatureEnabled(id: FeatureFlagId): boolean {
  return flags[id]?.enabled ?? false;
}

export function getP0Flags(): FeatureFlag[] {
  return Object.values(flags).filter(f => f.phase === 'P0');
}

export function getFlagsByPhase(phase: 'P0' | 'P1' | 'P2'): FeatureFlag[] {
  return Object.values(flags).filter(f => f.phase === phase);
}