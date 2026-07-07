import type { User, InspectionStatus, DeficiencyStatus, PriorityTier } from '../types/index';
import { UserRole, InspectionStatus as IS, DeficiencyStatus as DS, PriorityTier as PT } from '../types/index';

export function hasRole(user: User, role: string): boolean {
  return user.role === role;
}

export function hasAnyRole(user: User, roles: string[]): boolean {
  return roles.includes(user.role);
}

export function isInspector(user: User): boolean {
  return user.role === UserRole.inspector;
}

export function isAdmin(user: User): boolean {
  return user.role === UserRole.admin;
}

export function canEditInspection(
  user: User,
  inspection: { status: InspectionStatus }
): boolean {
  if (isAdmin(user)) return true;
  if (!isInspector(user)) return false;
  return inspection.status === IS.Draft
    || inspection.status === IS.Assigned
    || inspection.status === IS.InProgress;
}

export function canApproveInspection(user: User): boolean {
  return user.role === UserRole.admin || user.role === UserRole.owner;
}

const statusColorMap: Record<string, string> = {
  [IS.Draft]: 'gray',
  [IS.Assigned]: 'blue',
  [IS.InProgress]: 'yellow',
  [IS.Submitted]: 'purple',
  [IS.Approved]: 'green',
  [IS.Rejected]: 'red',
  [IS.Returned]: 'orange',
  [DS.Open]: 'red',
  [DS.InRemediation]: 'yellow',
  [DS.Resolved]: 'green',
  [DS.Closed]: 'gray',
};

const priorityColorMap: Record<PriorityTier, string> = {
  [PT.P1]: 'red',
  [PT.P2]: 'orange',
  [PT.P3]: 'yellow',
  [PT.P4]: 'blue',
  [PT.P5]: 'green',
};

const labelMap: Record<string, string> = {
  [IS.InProgress]: 'In Progress',
  [DS.InRemediation]: 'In Remediation',
  NotStarted: 'Not Started',
};

export const inspectionStatuses: InspectionStatus[] = Object.values(IS);
export const deficiencyStatuses: DeficiencyStatus[] = Object.values(DS);
export const priorityTiers: PriorityTier[] = Object.values(PT);

export function getStatusColor(status: string): string {
  return statusColorMap[status] ?? 'gray';
}

export function getPriorityColor(tier: PriorityTier): string {
  return priorityColorMap[tier] ?? 'gray';
}

export function getStatusLabel(status: string): string {
  return labelMap[status] ?? status;
}

export function isDeficiencyActionable(status: DeficiencyStatus): boolean {
  return status === DS.Open || status === DS.InRemediation;
}